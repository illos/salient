import { tacticianAbilities, tacticianAbilitySource } from '../shared/evaluate/tacticianAbilities';
import {
  startingItemAbilities,
  startingItemAbilitySource,
} from '../shared/evaluate/startingItemAbilities';
import {
  complicationAbilities,
  complicationAbilitySource,
  complicationAbilityMetadata,
} from '../shared/evaluate/complicationAbilities';
import { perkAbilities, perkAbilitySource } from '../shared/evaluate/perkAbilities';
import { extractEmbeddedAbility } from '../shared/resolve/embeddedAbility';
import { ancestryAbilities, ancestryAbilitySource } from '../shared/evaluate/ancestryAbilities';
// SPDX-License-Identifier: GPL-3.0-only
/**
 * Owned characters: drafts, the shared evaluation read, the audience-projected sheet read, review
 * reads, and the admission mutations that delegate to the registered `character.*` operations
 * (convex/lib/characterOperations.ts). Owning specifications:
 * docs/character-wizard-spec.md#7-revision-and-review-lifecycle and
 * #9-shared-operations-and-reliability (drafts, submit/withdraw/approve/decline, one evaluator),
 * docs/character-sheet-spec.md#views-permissions-and-persistence (one payload per audience,
 * owner-private notes excluded server-side), docs/accounts-and-access-spec.md#characters,
 * docs/table-spec.md#party-sheets-and-resource-visibility (peers: Stamina and Recoveries).
 * Draft saves never write live values; shared activation applies the confirmed current-value caps.
 */
import { ConvexError, v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { appendEvent } from './lib/events';
import {
  advancementDecisionIds,
  advancementSelections,
  historyEntry,
  progressionBase,
  progressionEligibility,
  requireHistoryReader,
  requireProgressionBase,
  revisionLevel,
} from './lib/characterProgression';
import { pendingDirectorSetup } from './lib/characterDirectorSetup';
import { canonicalChoiceOrigins } from './lib/characterChoiceOrigins';
import { COMPLICATION_ABILITIES } from '../shared/content/supporting-complication-abilities';
import {
  CURRENT_ADVANCEMENT,
  isSupportedDefinitionLevel,
} from '../shared/content/character-support';
import { getDefinitions } from '../shared/content/character-decisions';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser, type ReadCtx } from './lib/access';
import { command } from './lib/commands';
import { invoke } from './lib/registry';
import { findContent } from './content';
// The manifest alone (ids and paths): importing the snapshot barrel would load every entry's text
// into this module and its cold start counts against the mutation time limit.
import manifest from '../shared/content/compendium/manifest.json';
import {
  authoredValidator,
  heroLiveValidator,
  reviewKindValidator,
  reviewStatusValidator,
  revisionStatusValidator,
  selectionValidator,
  reconciliationValidator,
} from './characterTables';
import { assignCharacteristic } from '../shared/evaluate/assignment';
import {
  matchesAbilityModifier,
  abilityModifierCondition,
} from '../shared/evaluate/abilityModifiers';
import { draftSelectionsFrom } from '../shared/evaluate/draft';
import { previewBuildReconciliation } from '../shared/evaluate/liveReconciliation';
import { selectionsFrom } from '../shared/evaluate/character';
import { isJsonValue, type CharacterAuthored, type DraftSelection } from '../shared/characterDraft';
import {
  activateRevision,
  activateUnattachedRevision,
  baselineOf,
  evaluateSelections,
  latestReview,
  pendingReview,
  requireEditable,
} from './lib/characterBuild';
import type {
  DerivedBaseline,
  AbilityModifier,
  EvaluationResult,
  GrantedAbility,
  GrantedFeature,
  Provenance,
} from '../shared/contracts/characterEvaluation';
import type {
  ActionGroup,
  CharacterSheet,
  CommonAction,
  HeroSheet,
  SheetAbility,
  SheetAbilityMetadata,
  SheetContent,
  SheetFeature,
} from '../shared/contracts/characterSheet';

async function owned(ctx: ReadCtx, id: Id<'characters'>, userId: Id<'users'>) {
  const character = await ctx.db.get(id);
  if (!character || character.ownerId !== userId) throw new ConvexError('Character unavailable.');
  return character;
}
/**
 * `nameOptional` is the wizard's working draft (V96): it is saved continuously from the first
 * choice, before the hero is named, and stays out of the owner's list until they save it. Every
 * other path, including saving that draft into the list, still requires the name.
 */
function authored(input: CharacterAuthored, nameOptional = false): CharacterAuthored {
  const name = input.name.trim();
  if (nameOptional ? name.length > 100 : !name || name.length > 100)
    throw new ConvexError('Enter a character name of 1–100 characters.');
  for (const value of [input.appearance, input.biography, input.notes]) {
    if (value.length > 10000)
      throw new ConvexError('Each description or notes field supports up to 10,000 characters.');
  }
  return { ...input, name };
}
const reviewValidator = v.object({
  id: v.id('characterReviews'),
  kind: reviewKindValidator,
  status: reviewStatusValidator,
  revision: v.number(),
  campaignId: v.id('campaigns'),
  campaignName: v.string(),
  submittedAt: v.number(),
});
async function reviewView(ctx: ReadCtx, review: Doc<'characterReviews'>) {
  return {
    id: review._id,
    kind: review.kind,
    status: review.status,
    revision: review.revision,
    campaignId: review.campaignId,
    campaignName: (await ctx.db.get(review.campaignId))?.name ?? 'Unavailable campaign',
    submittedAt: review.submittedAt,
  };
}
const summary = v.object({
  id: v.id('characters'),
  name: v.string(),
  revision: v.number(),
  status: revisionStatusValidator,
  campaignId: v.union(v.id('campaigns'), v.null()),
  campaignName: v.union(v.string(), v.null()),
  attached: v.boolean(),
  review: v.union(reviewValidator, v.null()),
});
const detail = v.object({
  id: v.id('characters'),
  authored: authoredValidator,
  revision: v.number(),
  /** The wizard's working draft, kept out of the owner's list until they save it (V96). */
  wizardDraft: v.boolean(),
  selections: v.array(selectionValidator),
  status: revisionStatusValidator,
  /** The R02 EvaluationResult of the draft revision (shared/contracts/characterEvaluation.ts). */
  evaluation: v.union(v.any(), v.null()),
  level: v.number(),
  pendingDirectorSetup: v.optional(v.string()),
  choiceOrigins: v.record(v.string(), v.object({ value: v.string(), level: v.number() })),
  fullEditIsStale: v.boolean(),
  combatLocked: v.boolean(),
  campaignId: v.union(v.id('campaigns'), v.null()),
  campaignName: v.union(v.string(), v.null()),
  effectiveRevisionId: v.union(v.id('characterRevisions'), v.null()),
  effectiveRevision: v.union(v.number(), v.null()),
  /** True when the draft revision is the effective one (nothing pending to submit). */
  draftIsEffective: v.boolean(),
  derivedBaseline: v.union(v.any(), v.null()),
  liveState: v.union(v.null(), heroLiveValidator),
  activationPreview: v.union(v.null(), reconciliationValidator),
  review: v.union(reviewValidator, v.null()),
});

/**
 * The shared evaluation operation (docs/character-wizard-spec.md#9-shared-operations-and-reliability):
 * the wizard's live "hero so far", headless callers and `save` all use it. Pure: nothing is written.
 */
export const evaluate = query({
  args: {
    selections: v.array(selectionValidator),
    targetLevel: v.optional(v.number()),
    characterId: v.optional(v.id('characters')),
    context: v.optional(v.literal('progression')),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const level = args.targetLevel ?? 1;
    let previous: Doc<'characterRevisions'> | null = null;
    if (args.characterId) {
      const character = await owned(ctx, args.characterId, user._id);
      previous =
        args.context === 'progression'
          ? await progressionBase(ctx, character)
          : character.draftRevisionId
            ? await ctx.db.get(character.draftRevisionId)
            : null;
    }
    return evaluateSelections(
      args.selections,
      level,
      canonicalChoiceOrigins(args.selections, level, previous ?? undefined),
    );
  },
});
/**
 * The owner's working wizard draft, if they have one (V96). Opening the wizard for a new hero
 * resumes it instead of leaving another unlisted row behind; it is never more than one.
 */
export const wizardDraft = query({
  args: {},
  returns: v.union(v.id('characters'), v.null()),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .order('desc')
      .take(100);
    return characters.find(character => character.wizardDraft === true)?._id ?? null;
  },
});

export const listMine = query({
  args: {},
  returns: v.array(summary),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const characters = (
      await ctx.db
        .query('characters')
        .withIndex('by_owner', q => q.eq('ownerId', user._id))
        .order('desc')
        .take(100)
    )
      // The wizard's working draft is shown only inside the wizard, until it is saved (V96).
      .filter(character => character.wizardDraft !== true);
    return Promise.all(
      characters.map(async character => {
        const draft = character.draftRevisionId
          ? await ctx.db.get(character.draftRevisionId)
          : null;
        const review = await latestReview(ctx, character._id);
        return {
          id: character._id,
          name: character.authored.name,
          revision: character.revision,
          status: draft?.status ?? ('awaiting-rules-evaluation' as const),
          campaignId: character.campaignId,
          campaignName: character.campaignId
            ? ((await ctx.db.get(character.campaignId))?.name ?? null)
            : null,
          attached: character.campaignId !== null,
          review: review ? await reviewView(ctx, review) : null,
        };
      }),
    );
  },
});
export const get = query({
  args: { characterId: v.id('characters') },
  returns: detail,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const draft = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
    const effective = character.effectiveRevisionId
      ? await ctx.db.get(character.effectiveRevisionId)
      : null;
    const review = await latestReview(ctx, character._id);
    const directorSetup = draft
      ? await pendingDirectorSetup(
          ctx,
          character._id,
          draft,
          character.campaignId ?? (review?.status === 'pending' ? review.campaignId : null),
        )
      : null;
    return {
      ...(directorSetup ? { pendingDirectorSetup: directorSetup } : {}),
      id: character._id,
      authored: character.authored,
      revision: character.revision,
      /** The wizard's working draft, kept out of the owner's list until they save it (V96). */
      wizardDraft: character.wizardDraft === true,
      selections: draft?.selections ?? [],
      status: draft?.status ?? ('awaiting-rules-evaluation' as const),
      evaluation: draft?.evaluation ?? null,
      level: draft ? revisionLevel(draft) : 1,
      choiceOrigins: draft?.choiceOrigins ?? {},
      fullEditIsStale:
        !!draft &&
        (character.staleFullEditRevisionId === draft._id ||
          (draft.baseEffectiveRevisionId !== undefined &&
            draft._id !== character.effectiveRevisionId &&
            draft.baseEffectiveRevisionId !== character.effectiveRevisionId)),
      combatLocked: character.combatLocked,
      campaignId: character.campaignId,
      campaignName: character.campaignId
        ? ((await ctx.db.get(character.campaignId))?.name ?? null)
        : null,
      effectiveRevisionId: character.effectiveRevisionId,
      effectiveRevision: effective?.revision ?? null,
      draftIsEffective:
        character.effectiveRevisionId !== null &&
        character.effectiveRevisionId === character.draftRevisionId,
      derivedBaseline: character.derivedBaseline,
      liveState: character.liveState,
      activationPreview:
        character.liveState && draft?.derivedBaseline
          ? previewBuildReconciliation(
              character.liveState,
              baselineOf(character.derivedBaseline),
              baselineOf(draft.derivedBaseline)!,
            )
          : null,
      review: review ? await reviewView(ctx, review) : null,
    };
  },
});
/** Creation and later saves share the same bounds and pinned provenance. */
function validatedSelections(selections: DraftSelection[], level: number): DraftSelection[] {
  const definitions = getDefinitions(level);
  if (
    selections.length > 100 ||
    JSON.stringify(selections).length > 64000 ||
    selections.some(
      selection =>
        !selection.decisionId.trim() ||
        !selection.ownerBranchId.trim() ||
        selection.sources.length === 0 ||
        selection.sources.some(
          source => !source.id.trim() || !source.path.trim() || !source.revision.trim(),
        ) ||
        !isJsonValue(selection.value),
    )
  )
    throw new ConvexError(
      'Selections must contain bounded JSON values and complete decision, branch and source references.',
    );
  if (new Set(selections.map(selection => selection.decisionId)).size !== selections.length)
    throw new ConvexError(
      'A decision can only be saved once within its owning branch or across branches.',
    );
  // Known decisions always persist canonical pinned provenance; client labels cannot forge it.
  const canonical = new Map(
    draftSelectionsFrom(selectionsFrom(selections), definitions).map(s => [s.decisionId, s]),
  );
  const known = new Set(definitions.steps.flatMap(step => step.decisions.map(d => d.id)));
  selections = selections.map(selection =>
    known.has(selection.decisionId) ? canonical.get(selection.decisionId)! : selection,
  );
  return selections;
}
export const create = mutation({
  args: {
    commandId: v.string(),
    authored: authoredValidator,
    selections: v.optional(v.array(selectionValidator)),
    /** Start the wizard's working draft: unlisted, and nameable later. */
    wizardDraft: v.optional(v.boolean()),
  },
  returns: v.id('characters'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const receipt = await command(ctx, user._id, args.commandId, 'characters.create', args);
    if (receipt.previous) return receipt.previous.result as Id<'characters'>;
    const fields = authored(args.authored, args.wizardDraft === true);
    const existing = await ctx.db
      .query('characters')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .take(100);
    // One working draft per owner (V96). Two tabs, or a retried create under a fresh command id,
    // would otherwise leave hidden rows nobody can reach that still count against the limit.
    // A mutation is a transaction, so this read-then-insert cannot interleave with another.
    if (args.wizardDraft === true) {
      const open = existing.find(character => character.wizardDraft === true);
      if (open) return open._id;
    }
    if (existing.length >= 100) throw new ConvexError('Prototype limit of 100 characters reached.');
    const selections = validatedSelections(args.selections ?? [], 1);
    const choiceOrigins = canonicalChoiceOrigins(selections, 1);
    const evaluation = evaluateSelections(selections, 1, choiceOrigins);
    const id = await ctx.db.insert('characters', {
      ownerId: user._id,
      authored: fields,
      revision: 1,
      draftRevisionId: null,
      effectiveRevisionId: null,
      derivedBaseline: null,
      liveState: null,
      campaignId: null,
      combatLocked: false,
      ...(args.wizardDraft === true ? { wizardDraft: true } : {}),
    });
    const revisionId = await ctx.db.insert('characterRevisions', {
      characterId: id,
      revision: 1,
      parentRevisionId: null,
      selections,
      level: 1,
      kind: 'full-edit',
      choiceOrigins,
      baseEffectiveRevisionId: null,
      status: evaluation.status,
      evaluation,
      derivedBaseline: evaluation.baseline,
    });
    await ctx.db.patch(id, { draftRevisionId: revisionId });
    await receipt.save(id);
    return id;
  },
});
export const save = mutation({
  args: {
    commandId: v.string(),
    characterId: v.id('characters'),
    expectedRevision: v.number(),
    authored: authoredValidator,
    selections: v.optional(v.array(selectionValidator)),
    targetLevel: v.optional(v.number()),
    expectedEffectiveRevisionId: v.optional(v.union(v.id('characterRevisions'), v.null())),
    /** Put the wizard's working draft into the owner's character list (V96). Requires a name. */
    list: v.optional(v.boolean()),
    /** Named equivalent of wizard drag/drop; saved through this same revision operation. */
    assignment: v.optional(
      v.object({
        target: v.string(),
        value: v.union(v.number(), v.null()),
        fromTarget: v.optional(v.string()),
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'characters.save', args);
    if (receipt.previous) return Number(receipt.previous.result);
    await requireEditable(ctx, character);
    if (
      args.expectedRevision !== character.revision ||
      (args.expectedEffectiveRevisionId !== undefined &&
        args.expectedEffectiveRevisionId !== character.effectiveRevisionId)
    )
      throw new ConvexError(
        'This character changed since you opened it. Reload the saved version before saving.',
      );
    const fields = authored(args.authored, character.wizardDraft === true && !args.list);
    const old = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
    const level = args.targetLevel ?? old?.level ?? 1;
    if (!isSupportedDefinitionLevel(level))
      throw new ConvexError('Only levels 1 and 2 are supported.');
    const definitions = getDefinitions(level);
    let selections = args.selections ?? old?.selections ?? [];
    selections = validatedSelections(selections, level);
    if (args.assignment) {
      try {
        selections = draftSelectionsFrom(
          assignCharacteristic(
            selectionsFrom(selections),
            args.assignment.target,
            args.assignment.value,
            args.assignment.fromTarget,
            definitions,
          ),
          definitions,
        );
      } catch (error) {
        throw new ConvexError(error instanceof Error ? error.message : 'Invalid assignment.');
      }
    }
    const revision = character.revision + 1;
    // Draft saves evaluate the build and never touch live values (R03 section 3).
    const choiceOrigins = canonicalChoiceOrigins(selections, level, old ?? undefined);
    const evaluation = evaluateSelections(selections, level, choiceOrigins);
    const revisionId = await ctx.db.insert('characterRevisions', {
      characterId: character._id,
      revision,
      parentRevisionId: character.draftRevisionId,
      level,
      kind: 'full-edit',
      choiceOrigins,
      baseEffectiveRevisionId: character.effectiveRevisionId,
      selections,
      status: evaluation.status,
      evaluation,
      derivedBaseline: evaluation.baseline,
    });
    await ctx.db.patch(character._id, {
      authored: fields,
      revision,
      draftRevisionId: revisionId,
      // The save the owner asks for is the one that puts the wizard's draft in their list.
      ...(args.list && character.wizardDraft ? { wizardDraft: false } : {}),
      ...(!character.campaignId &&
      character.activeRune?.kind &&
      !(evaluation.baseline ?? evaluation.partial)?.traits?.some(
        trait => trait.name === 'Runic Carving',
      )
        ? {
            activeRune: {
              ...character.activeRune,
              kind: null,
              version: character.activeRune.version + 1,
              updatedAt: Date.now(),
            },
          }
        : {}),
      staleFullEditRevisionId: null,
    });
    if (!character.campaignId && character.effectiveRevisionId && evaluation.status === 'complete')
      await activateUnattachedRevision(ctx, character, (await ctx.db.get(revisionId))!);
    // A pending submission no longer matches the owner's latest saved revision: approval of the
    // older submission must never activate unseen edits (wizard spec section 7, rule 4).
    const pending = await pendingReview(ctx, character._id);
    if (pending) await ctx.db.patch(pending._id, { status: 'stale' });
    await receipt.save(String(revision));
    return revision;
  },
});

// ---------------------------------------------------------------------------------------------
// Admission mutations: thin wrappers over the registered operations, so the character page, the
// palette, slash text and headless callers share one path and one receipt.

const operationResult = v.object({
  eventId: v.id('events'),
  sequence: v.number(),
  description: v.string(),
  interactionId: v.union(v.id('interactions'), v.null()),
});
function admissionMutation(operation: string, resolveCampaign: 'argument' | 'review') {
  return mutation({
    args: {
      commandId: v.string(),
      characterId: v.id('characters'),
      campaignId: v.optional(v.id('campaigns')),
    },
    returns: operationResult,
    handler: async (ctx, args) => {
      const user = await requireUser(ctx);
      let campaignId = args.campaignId;
      if (resolveCampaign === 'review' || !campaignId) {
        const character = await ctx.db.get(args.characterId);
        const review = character ? await latestReview(ctx, character._id) : null;
        campaignId = character?.campaignId ?? review?.campaignId ?? campaignId;
      }
      if (!campaignId) throw new ConvexError('Name the campaign to submit this character to.');
      return invoke(ctx, user, {
        schemaVersion: 1,
        commandId: args.commandId,
        campaignId,
        operation,
        actor: null,
        arguments: { character: { refKind: 'character', id: args.characterId } },
      });
    },
  });
}
export const submit = admissionMutation('character.submit', 'argument');
export const withdraw = admissionMutation('character.withdraw', 'review');
export const approve = admissionMutation('character.approve', 'review');
export const decline = admissionMutation('character.decline', 'review');

/** Submissions a member may see in a campaign: the Director sees every pending one, an owner theirs. */
export const reviews = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.array(
    v.object({
      id: v.id('characterReviews'),
      characterId: v.id('characters'),
      characterName: v.string(),
      ownerId: v.id('users'),
      ownerName: v.string(),
      kind: reviewKindValidator,
      status: reviewStatusValidator,
      revision: v.number(),
      submittedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await ctx.db.get(args.campaignId);
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_campaign_user', q =>
        q.eq('campaignId', args.campaignId).eq('userId', user._id),
      )
      .unique();
    if (!campaign || !membership) throw new ConvexError('Campaign unavailable.');
    const director = campaign.ownerId === user._id;
    const query = ctx.db.query('characterReviews');
    const scoped = director
      ? query.withIndex('by_campaign_status', q =>
          q.eq('campaignId', args.campaignId).eq('status', 'pending'),
        )
      : query.withIndex('by_campaign_owner', q =>
          q.eq('campaignId', args.campaignId).eq('ownerId', user._id),
        );
    // Scope before bounding; other owners and status sorting must not hide a recent submission.
    const rows = await scoped.order('desc').take(200);
    return Promise.all(
      rows.map(async review => ({
        id: review._id,
        characterId: review.characterId,
        characterName: (await ctx.db.get(review.characterId))?.authored.name ?? 'Unavailable',
        ownerId: review.ownerId,
        ownerName: (await ctx.db.get(review.ownerId))?.displayName ?? 'Former player',
        kind: review.kind,
        status: review.status,
        revision: review.revision,
        submittedAt: review.submittedAt,
      })),
    );
  },
});

// ---------------------------------------------------------------------------------------------
// The sheet read.

/** Source path (relative to the Compendium) to content id, from the S01 manifest. */
const CONTENT_ID_BY_PATH = new Map(
  manifest.entries.map(entry => [
    entry.sourcePath.replace(/^vendor\/steel-compendium\//, ''),
    entry.id,
  ]),
);
const CLEAN_HEROES_PATH = 'en/books/heroes/clean/Draw Steel Heroes.md';

function plainText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}
function groupOf(actionType: string | undefined): ActionGroup {
  if (!actionType) return 'other';
  if (/main action/i.test(actionType)) return 'main';
  if (/maneuver/i.test(actionType)) return 'maneuver';
  if (/move action/i.test(actionType)) return 'move';
  if (/triggered/i.test(actionType)) return 'triggered';
  return 'other';
}
function contentView(row: Doc<'content'>): SheetContent {
  return {
    id: row.contentId,
    name: row.name,
    text: row.text,
    sourcePath: row.sourcePath,
    revision: row.revision,
  };
}
/** Printed frontmatter facts only; a field the source does not print is absent. */
function metadataOf(row: Doc<'content'> | null): SheetAbilityMetadata {
  const s = (row?.structured ?? {}) as Record<string, unknown>;
  const effects = Array.isArray(s.effects) ? (s.effects as Record<string, unknown>[]) : [];
  const roll = effects.find(e => typeof e.roll === 'string')?.roll;
  const tiers =
    typeof s.tier1 === 'string' && typeof s.tier2 === 'string' && typeof s.tier3 === 'string'
      ? ([s.tier1, s.tier2, s.tier3] as [string, string, string])
      : undefined;
  const clauses = effects
    .filter(e => typeof e.effect === 'string')
    .map(e => ({
      label: String(e.cost ?? e.name ?? 'Effect'),
      text: e.effect as string,
    }));
  const actionType = plainText(s.action_type);
  return {
    ...(actionType ? { actionType } : {}),
    keywords: Array.isArray(s.keywords) ? s.keywords.map(k => plainText(k) ?? String(k)) : [],
    ...(typeof s.distance === 'string' ? { distance: s.distance } : {}),
    ...(typeof s.target === 'string' ? { target: s.target } : {}),
    ...(typeof s.cost === 'string' ? { cost: s.cost } : {}),
    ...(typeof roll === 'string' ? { roll } : {}),
    ...(tiers ? { tiers } : {}),
    ...(typeof s.trigger === 'string' ? { trigger: s.trigger } : {}),
    ...(clauses.length ? { effects: clauses } : {}),
  };
}
function grantedBy(provenance: Provenance) {
  return {
    decisionId: provenance.decisionId,
    ...(provenance.selection ? { selection: provenance.selection } : {}),
    quote: provenance.source.quote,
    path: provenance.source.path,
  };
}
async function contentFor(ctx: ReadCtx, sourcePath: string) {
  const id = CONTENT_ID_BY_PATH.get(sourcePath);
  return id ? await findContent(ctx, id) : null;
}
async function abilityView(
  ctx: ReadCtx,
  ability: GrantedAbility,
  modifiers: AbilityModifier[] = [],
): Promise<SheetAbility> {
  const row = await contentFor(ctx, ability.sourcePath);
  const perkSource = perkAbilitySource(ability);
  const itemSource = startingItemAbilitySource(ability);
  const complicationSource = complicationAbilitySource(ability);
  const tacticianSource = tacticianAbilitySource(ability);
  const traitAbility =
    ancestryAbilitySource(ability) ?? itemSource ?? (perkSource?.embedded ? undefined : perkSource);
  const embedded =
    row && (ability.kind === 'kit-signature' || perkSource?.embedded)
      ? extractEmbeddedAbility(row.text, ability.name)
      : null;
  const metadata = tacticianSource
    ? {
        keywords: [],
        actionType: tacticianSource.actionType,
        ...(tacticianSource.trigger ? { trigger: tacticianSource.trigger } : {}),
        ...(tacticianSource.cost ? { cost: tacticianSource.cost } : {}),
        effects: [{ label: 'Effect', text: tacticianSource.text }],
      }
    : complicationSource
      ? complicationAbilityMetadata(complicationSource, ability)
      : traitAbility
        ? {
            keywords: [],
            actionType: traitAbility.actionType,
            ...(traitAbility.trigger ? { trigger: traitAbility.trigger } : {}),
            effects: [{ label: 'Effect', text: traitAbility.quote }],
            ...(perkSource?.cost ? { cost: perkSource.cost } : {}),
          }
        : embedded?.ok
          ? embedded.metadata
          : row && row.kind === 'ability'
            ? metadataOf(row)
            : { keywords: [] };
  const { provenance, ...rest } = ability;
  const facts = { name: ability.name, keywords: metadata.keywords };
  const buildModifiers = metadata.roll
    ? modifiers.flatMap(modifier => {
        const condition = abilityModifierCondition(modifier, facts);
        if (!condition && !matchesAbilityModifier(modifier, facts)) return [];
        return [
          {
            label: modifier.label ?? modifier.provenance.selection ?? modifier.id,
            amount: modifier.amount,
            sourcePath: modifier.provenance.source.path,
            ...(condition ? { condition } : {}),
          },
        ];
      })
    : [];
  return {
    ...rest,
    content: itemSource
      ? {
          id: `starting-item/${ability.name}`,
          name: ability.name,
          text: itemSource.quote,
          sourcePath: itemSource.sourcePath,
          revision: ability.provenance.source.revision,
        }
      : row
        ? contentView(row)
        : (() => {
            const source = COMPLICATION_ABILITIES.find(
              source => source.name === ability.name && source.sourcePath === ability.sourcePath,
            );
            return source
              ? {
                  id: `supporting/${ability.name}`,
                  name: ability.name,
                  text: source.text,
                  sourcePath: source.sourcePath,
                  revision: ability.provenance.source.revision,
                }
              : null;
          })(),
    group: groupOf(metadata.actionType),
    metadata,
    ...(buildModifiers.length ? { buildModifiers } : {}),
    grantedBy: grantedBy(provenance),
  };
}
async function featureView(ctx: ReadCtx, feature: GrantedFeature): Promise<SheetFeature> {
  // The original Fury provenance cites the full book. Its readable counterpart is the
  // imported background chapter, while the original grant citation remains intact.
  const row = await contentFor(
    ctx,
    feature.sourcePath === CLEAN_HEROES_PATH && feature.kind === 'culture-benefit'
      ? 'en/unified/md/chapter/background.md'
      : feature.sourcePath,
  );
  const { provenance, ...rest } = feature;
  return { ...rest, content: row ? contentView(row) : null, grantedBy: grantedBy(provenance) };
}
async function commonActions(ctx: ReadCtx): Promise<CommonAction[]> {
  // Exact source IDs keep common actions complete as other class features expand the corpus.
  const rows = await Promise.all(
    manifest.entries
      .filter(entry => entry.id.startsWith('mcdm.heroes.v1/feature.common.'))
      .map(entry => findContent(ctx, entry.id)),
  );
  return rows
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .map(row => {
      const category = row.contentId.split('/')[1]?.split('.').at(-1) ?? '';
      const group: ActionGroup =
        category === 'main-actions'
          ? 'main'
          : category === 'maneuvers'
            ? 'maneuver'
            : category === 'move-actions'
              ? 'move'
              : 'other';
      return { id: row.contentId, name: row.name, group, content: contentView(row) };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
function selectionText(selections: DraftSelection[], decisionId: string): string | null {
  const value = selections.find(s => s.decisionId === decisionId)?.value;
  return typeof value === 'string' && value.trim() ? value : null;
}
/** R03 section 2.3: labels derived at read time from live values and the baseline maxima. */
function labelsOf(
  live: NonNullable<Doc<'characters'>['liveState']>,
  baseline: DerivedBaseline | null,
) {
  const windedValue =
    baseline?.windedValue.value ?? Math.floor((baseline?.staminaMaximum.value ?? 0) / 2);
  return {
    windedValue,
    winded: live.stamina <= windedValue,
    dying: live.stamina <= 0,
    deadThresholdReached: live.stamina <= -windedValue,
  };
}

export const sheet = query({
  args: {
    characterId: v.id('characters'),
    /** Owner: `draft` previews the saved draft. Director: `proposed` shows a pending submission. */
    view: v.optional(v.union(v.literal('effective'), v.literal('draft'), v.literal('proposed'))),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<CharacterSheet> => {
    const user = await requireUser(ctx);
    const character = await ctx.db.get(args.characterId);
    if (!character) throw new ConvexError('Character unavailable.');
    const owner = character.ownerId === user._id;
    const pending = await pendingReview(ctx, character._id);
    const campaignId = character.campaignId ?? pending?.campaignId ?? null;
    const campaign = campaignId ? await ctx.db.get(campaignId) : null;
    const membership =
      campaign &&
      (await ctx.db
        .query('memberships')
        .withIndex('by_campaign_user', q => q.eq('campaignId', campaign._id).eq('userId', user._id))
        .unique());
    const director = !!campaign && campaign.ownerId === user._id;
    if (!owner && !director && !(campaign && membership && character.campaignId))
      throw new ConvexError('Character unavailable.');
    const ownerName = (await ctx.db.get(character.ownerId))?.displayName ?? 'Former player';
    const baseline = baselineOf(character.derivedBaseline);
    if (!owner && !director) {
      // Peer: Stamina and Recoveries only (docs/table-spec.md#party-sheets-and-resource-visibility).
      return {
        audience: 'peer',
        id: character._id,
        name: character.authored.name,
        ownerName,
        live: character.liveState
          ? { stamina: character.liveState.stamina, recoveries: character.liveState.recoveries }
          : null,
        maxima: baseline
          ? {
              staminaMaximum: baseline.staminaMaximum.value,
              recoveriesMaximum: baseline.recoveriesMaximum.value,
            }
          : null,
      };
    }
    // Which build to show: the effective one by default; the owner's draft or the Director's
    // proposed submission on request, both labeled and never able to act at the table.
    let revision: Doc<'characterRevisions'> | null = null;
    let label: 'effective' | 'draft' | 'proposed' = 'effective';
    const effective = character.effectiveRevisionId
      ? await ctx.db.get(character.effectiveRevisionId)
      : null;
    if (args.view === 'draft' && owner) {
      revision = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
      label = 'draft';
    } else if (args.view === 'proposed' && pending) {
      revision = await ctx.db.get(pending.revisionId);
      label = 'proposed';
    } else if (effective) {
      revision = effective;
    } else if (owner || pending) {
      // No effective build yet: the owner sees their draft; the Director sees the submission.
      revision = pending
        ? await ctx.db.get(pending.revisionId)
        : character.draftRevisionId
          ? await ctx.db.get(character.draftRevisionId)
          : null;
      label = pending ? 'proposed' : 'draft';
    }
    const evaluation = (revision?.evaluation ?? null) as EvaluationResult | null;
    const shown = label === 'effective' ? baseline : (evaluation?.baseline ?? null);
    const partial = evaluation?.partial ?? null;
    const granted = shown ?? partial;
    const session = campaign?.activeSessionId ? await ctx.db.get(campaign.activeSessionId) : null;
    const role = !campaign
      ? null
      : director
        ? ('director' as const)
        : session?.selectedPlayerIds.includes(user._id)
          ? ('player' as const)
          : ('observer' as const);
    const selections = revision?.selections ?? [];
    const live = character.liveState;
    const payload: HeroSheet = {
      audience: owner ? 'owner' : 'director',
      id: character._id,
      name: character.authored.name,
      ownerId: character.ownerId,
      ownerName,
      campaign: campaign && character.campaignId ? { id: campaign._id, name: campaign.name } : null,
      viewer: {
        role,
        controls: director || (role === 'player' && owner),
        sessionRunning: session?.status === 'running',
      },
      combatLocked: character.combatLocked,
      build: revision
        ? {
            label,
            revision: revision.revision,
            status: revision.status,
            baseline: shown,
            partial,
            diagnostics: evaluation?.diagnostics ?? {},
          }
        : null,
      abilities: await Promise.all(
        [
          ...startingItemAbilities(character.startingRewards, manifest.compendium.revision),
          ...complicationAbilities(
            granted?.features ?? [],
            perkAbilities(
              granted?.perks ?? [],
              ancestryAbilities(
                granted?.traits ?? [],
                tacticianAbilities(granted?.features ?? [], granted?.abilities ?? []),
                character.activeRune?.kind ?? null,
              ),
            ),
          ),
        ].map(a => abilityView(ctx, a, granted?.abilityModifiers)),
      ),
      features: await Promise.all(
        [...(granted?.traits ?? []), ...(granted?.features ?? []), ...(granted?.perks ?? [])].map(
          f => featureView(ctx, f),
        ),
      ),
      commonActions: await commonActions(ctx),
      live: live ? { ...live, labels: labelsOf(live, baseline) } : null,
      activationPreview:
        label !== 'effective' && live && shown
          ? previewBuildReconciliation(live, baseline, shown)
          : null,
      details: {
        cultureName: selectionText(selections, 'culture.name'),
        cultureLanguage: selectionText(selections, 'culture.language'),
        environment: selectionText(selections, 'culture.environment'),
        organization: selectionText(selections, 'culture.organization'),
        upbringing: selectionText(selections, 'culture.upbringing'),
        incitingIncident:
          selections
            .filter(selection => selection.decisionId.endsWith('.inciting-incident'))
            .map(selection => selectionText(selections, selection.decisionId))
            .find(value => value !== null) ?? null,
        whatWasTaken: selectionText(selections, 'career.what-was-taken'),
        connections: selectionText(selections, 'connections.notes'),
      },
      // Owner-private notes never leave the owner audience (accounts spec section 7).
      authored: owner
        ? {
            appearance: character.authored.appearance,
            biography: character.authored.biography,
            notes: character.authored.notes,
          }
        : { appearance: character.authored.appearance, biography: character.authored.biography },
      review: pending ? await reviewView(ctx, pending) : null,
    };
    return payload;
  },
});

// ---------------------------------------------------------------------------------------------
// V32 progression/history. The ordinary full-edit draft remains independent of scoped advancement.
export const progression = query({
  args: { characterId: v.id('characters') },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const base = await progressionBase(ctx, character);
    const draft = character.advancementDraft ?? null;
    const draftIsStale = !!draft && draft.baseRevisionId !== base?._id;
    return {
      revision: character.revision,
      baseRevisionId: base?._id ?? null,
      baseLevel: base ? revisionLevel(base) : 1,
      targetLevel: CURRENT_ADVANCEMENT.targetLevel,
      ...progressionEligibility(character, base),
      draft,
      draftIsStale,
      baseSelections: base?.selections ?? [],
      choiceOrigins: base?.choiceOrigins ?? {},
      newDecisionIds: advancementDecisionIds(),
      evaluation: base
        ? evaluateSelections(
            [...base.selections, ...(draft && !draftIsStale ? draft.selections : [])],
            CURRENT_ADVANCEMENT.targetLevel,
            canonicalChoiceOrigins(base.selections, CURRENT_ADVANCEMENT.targetLevel, base),
          )
        : null,
    };
  },
});

const advancementArgs = {
  commandId: v.string(),
  characterId: v.id('characters'),
  expectedRevision: v.number(),
  expectedBaseRevisionId: v.id('characterRevisions'),
  expectedDraftVersion: v.number(),
};
export const saveAdvancement = mutation({
  args: { ...advancementArgs, selections: v.array(selectionValidator) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const receipt = await command(
      ctx,
      user._id,
      args.commandId,
      'characters.saveAdvancement',
      args,
    );
    if (receipt.previous) return Number(receipt.previous.result);
    await requireEditable(ctx, character);
    const base = requireProgressionBase(
      character,
      await progressionBase(ctx, character),
      args.expectedRevision,
      args.expectedBaseRevisionId,
    );
    const eligibility = progressionEligibility(character, base);
    if (!eligibility.eligible) throw new ConvexError(eligibility.reason!);
    const old = character.advancementDraft;
    if (args.expectedDraftVersion !== (old?.version ?? 0))
      throw new ConvexError('The advancement draft changed. Reload before saving.');
    const version = (old?.version ?? 0) + 1;
    await ctx.db.patch(character._id, {
      advancementDraft: {
        baseRevisionId: base._id,
        targetLevel: CURRENT_ADVANCEMENT.targetLevel,
        version,
        selections: advancementSelections(args.selections),
      },
    });
    await receipt.save(String(version));
    return version;
  },
});
export const finalizeAdvancement = mutation({
  args: { ...advancementArgs, duringRespite: v.boolean() },
  returns: v.id('characterRevisions'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const receipt = await command(
      ctx,
      user._id,
      args.commandId,
      'characters.finalizeAdvancement',
      args,
    );
    if (receipt.previous) return receipt.previous.result as Id<'characterRevisions'>;
    await requireEditable(ctx, character);
    const base = requireProgressionBase(
      character,
      await progressionBase(ctx, character),
      args.expectedRevision,
      args.expectedBaseRevisionId,
    );
    const eligibility = progressionEligibility(character, base);
    if (!eligibility.eligible) throw new ConvexError(eligibility.reason!);
    if (!args.duringRespite)
      throw new ConvexError(
        'Level advancement occurs during a respite. Confirm the normal source timing; this does not restore resources.',
      );
    const draft = character.advancementDraft;
    if (!draft || draft.version !== args.expectedDraftVersion || draft.baseRevisionId !== base._id)
      throw new ConvexError(
        'The advancement draft changed or has a different effective base. Reload before finalizing.',
      );
    const selections = [...base.selections, ...advancementSelections(draft.selections)];
    const choiceOrigins = canonicalChoiceOrigins(selections, CURRENT_ADVANCEMENT.targetLevel, base);
    const evaluation = evaluateSelections(
      selections,
      CURRENT_ADVANCEMENT.targetLevel,
      choiceOrigins,
    );
    if (evaluation.status !== 'complete')
      throw new ConvexError(
        `The level-up is ${evaluation.status}; resolve its choices before finalizing.`,
      );
    const revision = character.revision + 1;
    const id = await ctx.db.insert('characterRevisions', {
      characterId: character._id,
      revision,
      parentRevisionId: base._id,
      level: CURRENT_ADVANCEMENT.targetLevel,
      kind: 'level-up',
      choiceOrigins,
      baseEffectiveRevisionId: base._id,
      selections,
      evaluation,
      status: evaluation.status,
      derivedBaseline: evaluation.baseline,
    });
    const saved = (await ctx.db.get(id))!;
    const { reconciliation } = await activateRevision(
      ctx,
      character,
      saved,
      character.campaignId!,
      Date.now(),
    );
    // A prepared full edit survives privately, but its old effective base cannot be submitted.
    await ctx.db.patch(character._id, {
      revision,
      advancementDraft: null,
      staleFullEditRevisionId:
        character.draftRevisionId !== base._id ? character.draftRevisionId : null,
      ...(character.draftRevisionId === base._id ? { draftRevisionId: id } : {}),
    });
    const pending = await pendingReview(ctx, character._id);
    if (pending) await ctx.db.patch(pending._id, { status: 'stale' });
    await appendEvent(ctx, {
      campaignId: character.campaignId!,
      origin: 'user',
      actor: user,
      commandId: args.commandId,
      kind: 'character.level-up',
      description: `${character.authored.name} advanced from level 1 to level 2 during a respite (revision ${revision}); current resources retained.`,
      payload: {
        characterId: character._id,
        revisionBefore: base._id,
        revisionAfter: id,
        reconciliation,
        timing: 'owner-declared-respite',
        xp: eligibility.xp,
        entryLevelXpOffset: eligibility.entryLevelXpOffset,
      },
    });
    await receipt.save(id);
    return id;
  },
});

export const history = query({
  args: { characterId: v.id('characters'), paginationOpts: paginationOptsValidator },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await requireHistoryReader(ctx, args.characterId, user._id);
    const result = await ctx.db
      .query('characterRevisions')
      .withIndex('by_character_and_revision', q => q.eq('characterId', character._id))
      .order('desc')
      .paginate({ ...args.paginationOpts, numItems: Math.min(50, args.paginationOpts.numItems) });
    return { ...result, page: result.page.map(row => historyEntry(character, row)) };
  },
});
export const historySnapshot = query({
  args: { characterId: v.id('characters'), revisionId: v.id('characterRevisions') },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await requireHistoryReader(ctx, args.characterId, user._id);
    const revision = await ctx.db.get(args.revisionId);
    if (!revision || revision.characterId !== character._id)
      throw new ConvexError('Historical build unavailable.');
    const baseline = baselineOf(revision.derivedBaseline);
    return {
      entry: historyEntry(character, revision),
      selections: revision.selections,
      evaluation: revision.evaluation ?? null,
      derivedBaseline: baseline,
      activationPreview:
        character.liveState && baseline
          ? previewBuildReconciliation(
              character.liveState,
              baselineOf(character.derivedBaseline),
              baseline,
            )
          : null,
    };
  },
});
export const restore = mutation({
  args: {
    commandId: v.string(),
    characterId: v.id('characters'),
    expectedRevision: v.number(),
    sourceRevisionId: v.id('characterRevisions'),
    expectedEffectiveRevisionId: v.union(v.id('characterRevisions'), v.null()),
  },
  returns: v.id('characterRevisions'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'characters.restore', args);
    if (receipt.previous) return receipt.previous.result as Id<'characterRevisions'>;
    await requireEditable(ctx, character);
    if (
      args.expectedRevision !== character.revision ||
      args.expectedEffectiveRevisionId !== character.effectiveRevisionId
    )
      throw new ConvexError(
        'This character or effective build changed. Reload before restoring a build.',
      );
    const source = await ctx.db.get(args.sourceRevisionId);
    if (!source || source.characterId !== character._id)
      throw new ConvexError('Historical build unavailable.');
    const complete =
      source.status === 'complete' && !!source.evaluation && !!source.derivedBaseline;
    const revision = character.revision + 1;
    // Deliberately copy the recorded evaluation; never reinterpret an old build with today's rules.
    const id = await ctx.db.insert('characterRevisions', {
      characterId: character._id,
      revision,
      parentRevisionId: character.draftRevisionId,
      level: revisionLevel(source),
      kind: 'restore',
      baseEffectiveRevisionId: character.effectiveRevisionId,
      restoredFromRevisionId: source._id,
      selections: source.selections,
      ...(source.choiceOrigins ? { choiceOrigins: source.choiceOrigins } : {}),
      status: source.status,
      ...(source.evaluation !== undefined ? { evaluation: source.evaluation } : {}),
      ...(source.derivedBaseline !== undefined ? { derivedBaseline: source.derivedBaseline } : {}),
    });
    const pending = await pendingReview(ctx, character._id);
    if (pending) await ctx.db.patch(pending._id, { status: 'stale' });
    await ctx.db.patch(character._id, {
      revision,
      draftRevisionId: id,
      staleFullEditRevisionId: null,
    });
    if (complete && character.campaignId) {
      const campaign = await ctx.db.get(character.campaignId);
      const directorSetup =
        campaign?.ownerId === user._id
          ? await pendingDirectorSetup(ctx, character._id, source, character.campaignId)
          : null;
      // An owning Director needs this restored draft to exist before configuring its private
      // choice. Keep it saved until ordinary submit can log activation; other owners still submit.
      if (!directorSetup)
        await invoke(ctx, user, {
          schemaVersion: 1,
          commandId: `restore-review-${id}`,
          campaignId: character.campaignId,
          operation: 'character.submit',
          actor: null,
          arguments: { character: { refKind: 'character', id: character._id } },
        });
    } else if (complete) {
      await activateUnattachedRevision(ctx, character, (await ctx.db.get(id))!);
    }
    await receipt.save(id);
    return id;
  },
});
