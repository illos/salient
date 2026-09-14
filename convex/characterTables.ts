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
 * A hero's live play values (shared/contracts/liveState.ts HeroLiveState) as stored before A02.
 * No evaluated baseline exists in this checkout, so the values R03 takes from the baseline
 * (Stamina, Recoveries, the heroic resource, the maxima) are `null` until the Director supplies
 * them; nothing here is defaulted to a number the source does not give. Implementation note in
 * docs/build/A03-table-shell-freeplay.md.
 */
export const heroLiveValidator = v.object({
  stamina: v.union(v.number(), v.null()),
  temporaryStamina: v.number(),
  recoveries: v.union(v.number(), v.null()),
  heroicResource: v.object({
    name: v.union(v.string(), v.null()),
    current: v.union(v.number(), v.null()),
  }),
  surges: v.number(),
  victories: v.number(),
  xp: v.number(),
  conditions: conditionsValidator,
  /** Provisional until A02 supplies DerivedBaseline.staminaMaximum / recoveriesMaximum. */
  staminaMaximum: v.union(v.number(), v.null()),
  recoveriesMaximum: v.union(v.number(), v.null()),
  origin: v.object({
    kind: v.literal('first-table-use-without-baseline'),
    initializedAt: v.number(),
  }),
});
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
    // No evaluator exists yet: drafts cannot supply an effective baseline or initialize play.
    derivedBaseline: v.null(),
    /** Null until first table use (A03); see heroLiveValidator for the pre-A02 shape. */
    liveState: v.union(v.null(), heroLiveValidator),
    campaignId: v.union(v.id('campaigns'), v.null()),
    combatLocked: v.boolean(),
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
};
