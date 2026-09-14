// SPDX-License-Identifier: GPL-3.0-only
/**
 * The application's entry to the R02 evaluator: the pinned R01 definitions and the conversion of a
 * saved revision's selections into the evaluator's input. Owning documents:
 * docs/character-derived-values.md (section 3, evaluator contract) and
 * docs/fury-level-one-decisions.md. No rule is resolved here; `shared/evaluate/character.ts` is
 * the only place values are derived.
 */
import definitionsJson from '../../shared/content/fury-level-one-decisions.json';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions';
import type { DerivedBaseline, EvaluationResult } from '../../shared/contracts/characterEvaluation';
import { evaluateCharacter, selectionsFrom } from '../../shared/evaluate/character';
import type { DraftSelection } from '../../shared/characterDraft';

export const definitions = definitionsJson as unknown as DecisionDefinitions;

/** Evaluates saved selections against the pinned definitions (deterministic, no side effects). */
export function evaluateSelections(selections: DraftSelection[]): EvaluationResult {
  return evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections: selectionsFrom(selections),
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
import { requireCharacterEditable } from './encounters';
import type { ConditionToggles } from '../../shared/contracts/liveState';

export type HeroLive = NonNullable<Doc<'characters'>['liveState']>;
export type Unreconciled = NonNullable<Doc<'characters'>['unreconciled']>[number];

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
 * initializes the live record; a later activation leaves `liveState` byte-for-byte as it was and
 * records each changed maximum or resource as an UnreconciledMaximumChange (Q-CHAR-2), applying no
 * arithmetic (docs/live-state-initialization.md section 3).
 */
export async function activateRevision(
  ctx: MutationCtx,
  character: Doc<'characters'>,
  revision: Doc<'characterRevisions'>,
  campaignId: Id<'campaigns'>,
  now: number,
): Promise<{ firstAdmission: boolean; unreconciled: Unreconciled[] }> {
  const baseline = baselineOf(revision.derivedBaseline);
  const evaluation = revision.evaluation as EvaluationResult | undefined;
  if (revision.status !== 'complete' || !baseline || !evaluation)
    throw new ConvexError(
      `Revision ${revision.revision} is ${revision.status}; only a complete build can be activated.`,
    );
  const previous = baselineOf(character.derivedBaseline);
  const added: Unreconciled[] = [];
  const patch: Partial<Doc<'characters'>> = {
    effectiveRevisionId: revision._id,
    derivedBaseline: baseline,
    campaignId,
  };
  const firstAdmission = character.liveState === null;
  if (firstAdmission) {
    patch.liveState = initialHeroLive(baseline, revision._id, evaluation.evaluatedAgainst, now);
  } else if (previous && character.liveState) {
    const live = character.liveState;
    const compare = (
      field: Unreconciled['field'],
      before: number | string,
      after: number | string,
      currentValue: number,
    ) => {
      if (before !== after)
        added.push({
          field,
          before,
          after,
          currentValue,
          question: 'Q-CHAR-2',
          revisionId: revision._id,
        });
    };
    compare(
      'staminaMaximum',
      previous.staminaMaximum.value,
      baseline.staminaMaximum.value,
      live.stamina,
    );
    compare(
      'recoveriesMaximum',
      previous.recoveriesMaximum.value,
      baseline.recoveriesMaximum.value,
      live.recoveries,
    );
    compare(
      'heroicResource',
      previous.heroicResource.name.value,
      baseline.heroicResource.name.value,
      live.heroicResource.current,
    );
  }
  if (added.length) patch.unreconciled = [...(character.unreconciled ?? []), ...added];
  await ctx.db.patch(character._id, patch);
  return { firstAdmission, unreconciled: added };
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
    .take(100);
  return reviews.find(review => review.status === 'pending') ?? null;
}

/** The most recent review row for a character, for display. */
export async function latestReview(ctx: ReadCtx, characterId: Id<'characters'>) {
  const reviews = await ctx.db
    .query('characterReviews')
    .withIndex('by_character', q => q.eq('characterId', characterId))
    .take(100);
  return reviews.sort((a, b) => b.submittedAt - a.submittedAt)[0] ?? null;
}
