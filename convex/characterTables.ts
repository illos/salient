// SPDX-License-Identifier: GPL-3.0-only
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const authoredValidator = v.object({
  name: v.string(),
  appearance: v.string(),
  biography: v.string(),
  notes: v.string(),
});
export const selectionValidator = v.object({
  decisionId: v.string(),
  ownerBranchId: v.string(),
  sources: v.array(v.object({ id: v.string(), path: v.string(), revision: v.string() })),
  // Validated as bounded, finite JSON at the application boundary.
  value: v.any(),
});
/** The nine core condition toggles (shared/contracts/liveState.ts ConditionToggles, R05 order). */
export const conditionsValidator = v.object({
  bleeding: v.boolean(),
  dazed: v.boolean(),
  frightened: v.boolean(),
  grabbed: v.boolean(),
  prone: v.boolean(),
  restrained: v.boolean(),
  slowed: v.boolean(),
  taunted: v.boolean(),
  weakened: v.boolean(),
});
/**
 * A hero's live play values (shared/contracts/liveState.ts HeroLiveState plus LiveStateOrigin).
 * Written once by first admission from the effective build's baseline (R03 section 2.1) and then
 * only by registered table operations; maxima live in `characters.derivedBaseline`, never here.
 */
export const heroLiveValidator = v.object({
  stamina: v.number(),
  temporaryStamina: v.number(),
  recoveries: v.number(),
  heroicResource: v.object({ name: v.string(), current: v.number() }),
  surges: v.number(),
  victories: v.number(),
  xp: v.number(),
  conditions: conditionsValidator,
  origin: v.object({
    kind: v.literal('first-admission'),
    buildRevisionId: v.id('characterRevisions'),
    evaluatedAgainst: v.object({
      definitionsSchemaVersion: v.literal('r01.1'),
      compendiumRevision: v.string(),
    }),
    initializedAt: v.number(),
  }),
});
/** Legacy stored markers; retained for existing rows, hidden from current reads and cleared on activation. */
export const unreconciledValidator = v.object({
  field: v.union(
    v.literal('staminaMaximum'),
    v.literal('recoveriesMaximum'),
    v.literal('heroicResource'),
  ),
  before: v.union(v.number(), v.string()),
  after: v.union(v.number(), v.string()),
  currentValue: v.number(),
  question: v.literal('Q-CHAR-2'),
  revisionId: v.id('characterRevisions'),
});
export const reconciliationValidator = v.object({
  changes: v.array(
    v.object({
      field: v.union(v.literal('stamina'), v.literal('recoveries')),
      maximumBefore: v.union(v.number(), v.null()),
      maximumAfter: v.number(),
      currentBefore: v.number(),
      currentAfter: v.number(),
    }),
  ),
  incompatibleResource: v.union(v.null(), v.object({ before: v.string(), after: v.string() })),
});
export const reviewKindValidator = v.union(v.literal('admission'), v.literal('full-edit'));
/**
 * Lifecycle of one submitted revision (docs/character-wizard-spec.md#7-revision-and-review-lifecycle):
 * `pending` awaits the Director; `logged` is the owning active Director's own submission, applied
 * without approval; `stale` is a pending submission whose owner saved a newer revision, so a later
 * approval cannot activate unseen edits.
 */
export const reviewStatusValidator = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('declined'),
  v.literal('withdrawn'),
  v.literal('logged'),
  v.literal('stale'),
);
/** R02 evaluation statuses (shared/contracts/characterEvaluation.ts EvaluationStatus). */
export const evaluationStatusValidator = v.union(
  v.literal('complete'),
  v.literal('incomplete'),
  v.literal('invalid'),
  v.literal('unsupported'),
);
/**
 * Status of a saved revision: the R02 evaluation status once `characters.evaluate` has run on it.
 * `awaiting-rules-evaluation` is the pre-A02 value kept for rows saved before the evaluator existed;
 * development data is disposable, so such rows are reset rather than migrated.
 */
export const revisionStatusValidator = v.union(
  v.literal('awaiting-rules-evaluation'),
  evaluationStatusValidator,
);
export const characterTables = {
  characters: defineTable({
    ownerId: v.id('users'),
    authored: authoredValidator,
    revision: v.number(),
    draftRevisionId: v.union(v.id('characterRevisions'), v.null()),
    effectiveRevisionId: v.union(v.id('characterRevisions'), v.null()),
    /** The R02 DerivedBaseline of the effective revision; null until first admission. */
    derivedBaseline: v.union(v.null(), v.any()),
    /** Null until first admission; later activation retains current amounts with confirmed downward caps. */
    liveState: v.union(v.null(), heroLiveValidator),
    /** The campaign the character is attached to: set by admission, one at a time. */
    campaignId: v.union(v.id('campaigns'), v.null()),
    combatLocked: v.boolean(),
    /** Legacy provisional records; current activation uses the confirmed caps and clears these. */
    unreconciled: v.optional(v.array(unreconciledValidator)),
  })
    .index('by_owner', ['ownerId'])
    .index('by_campaign', ['campaignId']),
  characterRevisions: defineTable({
    characterId: v.id('characters'),
    revision: v.number(),
    parentRevisionId: v.union(v.id('characterRevisions'), v.null()),
    selections: v.array(selectionValidator),
    status: revisionStatusValidator,
    /**
     * The R02 `EvaluationResult` for these selections (shared/contracts/characterEvaluation.ts):
     * status, diagnostics keyed by decision id, the baseline or the partial "hero so far", and the
     * definitions/revision evaluated against. Written by the shared evaluator only.
     */
    evaluation: v.optional(v.any()),
    /** `evaluation.baseline`: the R02 `DerivedBaseline` when the status is complete, else null. */
    derivedBaseline: v.optional(v.union(v.any(), v.null())),
  }).index('by_character_and_revision', ['characterId', 'revision']),
  characterReviews: defineTable({
    characterId: v.id('characters'),
    campaignId: v.id('campaigns'),
    ownerId: v.id('users'),
    /** The exact immutable revision submitted; approval activates this one and no other. */
    revisionId: v.id('characterRevisions'),
    revision: v.number(),
    kind: reviewKindValidator,
    status: reviewStatusValidator,
    submittedAt: v.number(),
    decidedAt: v.union(v.number(), v.null()),
    decidedById: v.union(v.id('users'), v.null()),
  })
    .index('by_character', ['characterId'])
    .index('by_campaign_owner', ['campaignId', 'ownerId'])
    .index('by_campaign_status', ['campaignId', 'status']),
};
