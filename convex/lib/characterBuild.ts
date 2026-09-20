// SPDX-License-Identifier: GPL-3.0-only
/**
 * The application's entry to the R02 evaluator: the pinned R01 definitions and the conversion of a
 * saved revision's selections into the evaluator's input. Owning documents:
 * docs/character-derived-values.md (section 3, evaluator contract) and
 * docs/fury-level-one-decisions.md. No rule is resolved here; `shared/evaluate/character.ts` is
 * the only place values are derived.
 */
import { definitions } from '../../shared/content/level-one-decisions';
import { getDefinitions } from '../../shared/content/character-decisions';
import type {
  CharacterChoiceOrigins,
  DerivedBaseline,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation';
import { evaluateCharacter, selectionsFrom } from '../../shared/evaluate/character';
import type { DraftSelection } from '../../shared/characterDraft';
import { pendingDirectorSetup, requireDirectorSetup } from './characterDirectorSetup';

export { definitions };

/** Evaluates saved selections against the pinned definitions (deterministic, no side effects). */
export function evaluateSelections(
  selections: DraftSelection[],
  level = 1,
  choiceOrigins?: CharacterChoiceOrigins,
): EvaluationResult {
  const definitions = getDefinitions(level, choiceOrigins);
  return evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level,
      selections: selectionsFrom(selections),
      choiceOrigins,
    },
    definitions,
  );
}

/** The stored `derivedBaseline` field, typed; null until a complete revision is activated. */
export function baselineOf(value: unknown): DerivedBaseline | null {
  return value && typeof value === 'object' ? (value as DerivedBaseline) : null;
}

// ---------------------------------------------------------------------------------------------
// Admission and activation (docs/character-wizard-spec.md#7-revision-and-review-lifecycle;
// docs/live-state-initialization.md sections 2 and 3).

import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { ReadCtx } from './access';
import { combatActive, requireCharacterEditable } from './encounters';
import type { BuildReconciliation, ConditionToggles } from '../../shared/contracts/liveState';
import { previewBuildReconciliation } from '../../shared/evaluate/liveReconciliation';

export type HeroLive = NonNullable<Doc<'characters'>['liveState']>;

/** The nine toggles in R05 order (shared/content/core-conditions.json, liveState.ts ConditionId). */
export const CONDITION_IDS = [
  'bleeding',
  'dazed',
  'frightened',
  'grabbed',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
] as const;

export function noConditions(): ConditionToggles {
  return Object.fromEntries(CONDITION_IDS.map(id => [id, false])) as ConditionToggles;
}

/**
 * The combat edit lock (docs/table-spec.md#character-sheet-lock-during-encounters): A04's
 * per-participant check (`combatLocked` at OK, or a turn entry in the committed encounter).
 * Every draft save, submission and activation calls this before writing.
 */
export async function requireEditable(ctx: ReadCtx, character: Doc<'characters'>) {
  await requireCharacterEditable(ctx, character);
}

/**
 * R03 section 2.1: the first-admission live values, every one taken from the baseline or the
 * source-backed constant the document states. Called once per character; later activations never
 * call it.
 */
export function initialHeroLive(
  baseline: DerivedBaseline,
  revisionId: Id<'characterRevisions'>,
  evaluatedAgainst: EvaluationResult['evaluatedAgainst'],
  now: number,
): HeroLive {
  return {
    stamina: baseline.staminaMaximum.value,
    temporaryStamina: 0,
    recoveries: baseline.recoveriesMaximum.value,
    heroicResource: {
      name: baseline.heroicResource.name.value,
      current: baseline.heroicResource.startingValue.value,
    },
    surges: 0,
    victories: 0,
    xp: 0,
    conditions: noConditions(),
    origin: {
      kind: 'first-admission',
      buildRevisionId: revisionId,
      evaluatedAgainst,
      initializedAt: now,
    },
  };
}

/**
 * Activates one complete revision as the effective build for `campaignId`. First admission
 * initializes the live record; later activation applies the confirmed Q-CHAR-2 downward caps atomically with the build.
 * Compatible current amounts and other live state survive; incompatible resource types are refused.
 */
export async function activateRevision(
  ctx: MutationCtx,
  character: Doc<'characters'>,
  revision: Doc<'characterRevisions'>,
  campaignId: Id<'campaigns'>,
  now: number,
): Promise<{ firstAdmission: boolean; reconciliation: BuildReconciliation }> {
  // First attachment changes the campaign's party roster, including a hero not yet combat-locked.
  if (character.campaignId !== campaignId) {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new ConvexError('Campaign unavailable.');
    const session = campaign.activeSessionId ? await ctx.db.get(campaign.activeSessionId) : null;
    if (session?.status === 'paused')
      throw new ConvexError('The party roster is locked while paused.');
    if (session && (await combatActive(ctx, session)))
      throw new ConvexError('The party roster is locked during combat.');
  }
  const baseline = baselineOf(revision.derivedBaseline);
  const evaluation = revision.evaluation as EvaluationResult | undefined;
  if (revision.status !== 'complete' || !baseline || !evaluation)
    throw new ConvexError(
      `Revision ${revision.revision} is ${revision.status}; only a complete build can be activated.`,
    );
  await requireDirectorSetup(ctx, character._id, revision, campaignId);
  const previous = baselineOf(character.derivedBaseline);
  let reconciliation: BuildReconciliation = { changes: [], incompatibleResource: null };
  const patch: Partial<Doc<'characters'>> = {
    effectiveRevisionId: revision._id,
    derivedBaseline: baseline,
    ...(character.activeRune?.kind && !baseline.traits.some(trait => trait.name === 'Runic Carving')
      ? {
          activeRune: {
            ...character.activeRune,
            kind: null,
            version: character.activeRune.version + 1,
            updatedAt: Date.now(),
          },
        }
      : {}),
    campaignId,
  };
  if (character.campaignId !== campaignId)
    patch.entryLevelXpOffset = ((revision.level ?? baseline.level.value) - 1) * 16;
  const firstAdmission = character.liveState === null;
  if (firstAdmission) {
    patch.liveState = initialHeroLive(baseline, revision._id, evaluation.evaluatedAgainst, now);
    patch.entryLevelXpOffset = ((revision.level ?? baseline.level.value) - 1) * 16;
  } else if (character.liveState) {
    const live = character.liveState;
    reconciliation = previewBuildReconciliation(live, previous, baseline);
    if (reconciliation.incompatibleResource)
      throw new ConvexError(
        `Changing ${reconciliation.incompatibleResource.before} to ${reconciliation.incompatibleResource.after} requires explicit resource reconciliation before activation.`,
      );
    patch.liveState = {
      ...live,
      ...Object.fromEntries(
        reconciliation.changes.map(change => [change.field, change.currentAfter]),
      ),
    };
  }
  // Legacy provisional markers are no longer an unresolved maximum policy.
  if (character.unreconciled) patch.unreconciled = [];
  await ctx.db.patch(character._id, patch);
  return { firstAdmission, reconciliation };
}

/** The hero's live record; only first admission creates it (R03 2.1). */
export function requireHeroLive(character: Doc<'characters'>): HeroLive {
  if (!character.liveState)
    throw new ConvexError(
      `${character.authored.name} has no live record: a hero gets one when its build is admitted to the campaign.`,
    );
  return character.liveState;
}
/** The effective build's baseline (R02); maxima and characteristics are read from it, never stored live. */
export function requireBaseline(character: Doc<'characters'>): DerivedBaseline {
  const baseline = baselineOf(character.derivedBaseline);
  if (!baseline)
    throw new ConvexError(
      `${character.authored.name} has no evaluated effective build; admission supplies it.`,
    );
  return baseline;
}

/** The character's pending submission, if any (at most one at a time). */
export async function pendingReview(ctx: ReadCtx, characterId: Id<'characters'>) {
  const reviews = await ctx.db
    .query('characterReviews')
    .withIndex('by_character', q => q.eq('characterId', characterId))
    .order('desc')
    .take(100);
  return reviews.find(review => review.status === 'pending') ?? null;
}

/** The most recent review row for a character, for display. */
export async function latestReview(ctx: ReadCtx, characterId: Id<'characters'>) {
  const reviews = await ctx.db
    .query('characterReviews')
    .withIndex('by_character', q => q.eq('characterId', characterId))
    .order('desc')
    .take(100);
  return reviews.sort((a, b) => b.submittedAt - a.submittedAt)[0] ?? null;
}

/** Activate an unattached recorded build without first-admission initialization or game-effect replay. */
export async function activateUnattachedRevision(
  ctx: MutationCtx,
  character: Doc<'characters'>,
  revision: Doc<'characterRevisions'>,
) {
  const baseline = baselineOf(revision.derivedBaseline);
  if (character.campaignId || revision.status !== 'complete' || !baseline)
    throw new ConvexError('A complete unattached build is required.');
  // Preserve the saved/restored draft, but do not borrow another campaign's private setup or
  // make an unresolved build effective. Destination admission supplies the Director context.
  const pending = await pendingDirectorSetup(ctx, character._id, revision, null);
  if (pending) return { activated: false, pendingDirectorSetup: pending };
  const reconciliation = character.liveState
    ? previewBuildReconciliation(
        character.liveState,
        baselineOf(character.derivedBaseline),
        baseline,
      )
    : null;
  if (reconciliation?.incompatibleResource)
    throw new ConvexError('Changing this resource type requires explicit reconciliation.');
  await ctx.db.patch(character._id, {
    effectiveRevisionId: revision._id,
    derivedBaseline: baseline,
    ...(character.activeRune?.kind && !baseline.traits.some(trait => trait.name === 'Runic Carving')
      ? {
          activeRune: {
            ...character.activeRune,
            kind: null,
            version: character.activeRune.version + 1,
            updatedAt: Date.now(),
          },
        }
      : {}),
    ...(character.liveState && reconciliation
      ? {
          liveState: {
            ...character.liveState,
            ...Object.fromEntries(
              reconciliation.changes.map(change => [change.field, change.currentAfter]),
            ),
          },
        }
      : {}),
  });
  return { activated: true, pendingDirectorSetup: null };
}
