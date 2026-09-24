// SPDX-License-Identifier: GPL-3.0-only
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { startingRewardsValidator } from './startingRewardValidators';

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
export const conditionInstanceValidator = v.object({
  id: v.string(),
  condition: v.union(
    ...(
      [
        'bleeding',
        'dazed',
        'frightened',
        'grabbed',
        'prone',
        'restrained',
        'slowed',
        'taunted',
        'weakened',
      ] as const
    ).map(value => v.literal(value)),
  ),
  duration: v.union(v.literal('save-ends'), v.literal('eot'), v.literal('none')),
  sourceActorId: v.optional(v.string()),
  sourceUseEventId: v.string(),
  abilityName: v.string(),
  actorLabel: v.string(),
  sourcePath: v.string(),
  status: v.union(v.literal('active'), v.literal('ended')),
  registrationId: v.optional(v.string()),
  lastSave: v.optional(
    v.object({
      roll: v.number(),
      success: v.boolean(),
      boundaryEventId: v.string(),
      threshold: v.number(),
      thresholdSource: v.union(
        v.object({ kind: v.literal('hero-baseline'), provenance: v.array(v.any()) }),
        v.object({ kind: v.literal('printed'), sourcePath: v.string() }),
      ),
    }),
  ),
  endedReason: v.optional(v.string()),
  replacedBy: v.optional(v.string()),
  saveGroup: v.optional(v.string()),
  restriction: v.optional(v.literal('cant-stand')),
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
  manualConditions: v.optional(conditionsValidator),
  conditionInstances: v.optional(v.array(conditionInstanceValidator)),
  /** V150: Self-Taught — forgo gains at the next turn start (`forgoNext`), or forgoing now. */
  forgoNext: v.optional(v.boolean()),
  forgoing: v.optional(v.boolean()),
  /** V150: this turn's automatic turn-start gain, so a forgo at that turn start can reverse it. */
  lastTurnGain: v.optional(
    v.object({
      encounterId: v.string(),
      turnId: v.string(),
      delta: v.number(),
      after: v.number(),
      eventId: v.string(),
    }),
  ),
  /** V147: the hero prays before their next turn-start resource roll (Conduit). */
  prayNext: v.optional(v.boolean()),
  /** V149: generation suspended for this encounter (a Troubadour still dead from an earlier one). */
  generationSuspended: v.optional(v.string()),
  /** V148: persistent abilities maintained this encounter (Elementalist). */
  maintained: v.optional(
    v.array(v.object({ ability: v.string(), value: v.number(), encounterId: v.string() })),
  ),
  /** V148: damage taken during the current turn, for Persistent Magic's break. */
  turnDamage: v.optional(v.object({ turnId: v.string(), amount: v.number() })),
  /** V120: table-confirmed class resource triggers claimed in the current encounter. */
  resourceClaims: v.optional(
    v.array(
      v.object({
        triggerId: v.string(),
        encounterId: v.string(),
        round: v.optional(v.number()),
        turnId: v.optional(v.string()),
        eventId: v.string(),
      }),
    ),
  ),
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
  /** Director-private source selection; never embedded in public character revisions or events. */
  characterSecrets: defineTable({
    characterId: v.id('characters'),
    campaignId: v.id('campaigns'),
    itemName: v.string(),
    itemSourcePath: v.string(),
    version: v.number(),
    basedOnRevisionId: v.id('characterRevisions'),
    updatedById: v.id('users'),
    updatedAt: v.number(),
  }).index('by_character_campaign', ['characterId', 'campaignId']),
  characters: defineTable({
    ownerId: v.id('users'),
    authored: authoredValidator,
    revision: v.number(),
    draftRevisionId: v.union(v.id('characterRevisions'), v.null()),
    effectiveRevisionId: v.union(v.id('characterRevisions'), v.null()),
    /** The R02 DerivedBaseline of the effective revision; null until first admission. */
    derivedBaseline: v.union(v.null(), v.any()),
    /** Null until first admission; later activation keeps damage taken and Recoveries spent (Q-CHAR-2). */
    liveState: v.union(v.null(), heroLiveValidator),
    /** The campaign the character is attached to: set by admission, one at a time. */
    campaignId: v.union(v.id('campaigns'), v.null()),
    combatLocked: v.boolean(),
    startingRewards: v.optional(startingRewardsValidator),
    /** Runic Carving is play state, independent of build choices and live resources. */
    activeRune: v.optional(
      v.object({
        kind: v.union(v.literal('Detection'), v.literal('Light'), v.literal('Voice'), v.null()),
        version: v.number(),
        updatedAt: v.number(),
        updatedById: v.id('users'),
        sourcePath: v.string(),
      }),
    ),
    /** Campaign-entry XP threshold, distinct from awarded campaign XP. Legacy level-one rows use 0. */
    entryLevelXpOffset: v.optional(v.number()),
    /** Invalidates a preserved legacy full-edit draft without rewriting its historical snapshot. */
    staleFullEditRevisionId: v.optional(v.union(v.id('characterRevisions'), v.null())),
    /**
     * The wizard's own working draft (V96): created as soon as the hero is worked on and saved
     * continuously, but kept out of the owner's character list, and allowed to have no name yet,
     * until they save it. Absent on every character created before this field existed and on
     * every character that has been saved, both of which are listed.
     */
    wizardDraft: v.optional(v.boolean()),
    /**
     * Level-ups granted but not yet taken (V163; docs/character-wizard-spec.md#level-up): a respite
     * completion or the Director's manual grant adds one per level; each level-up flow spends one.
     */
    pendingLevelUps: v.optional(v.number()),
    /** Scoped advancement is independent of the ordinary full-edit draft. */
    advancementDraft: v.optional(
      v.union(
        v.null(),
        v.object({
          baseRevisionId: v.id('characterRevisions'),
          targetLevel: v.number(),
          version: v.number(),
          selections: v.array(selectionValidator),
        }),
      ),
    ),
    /** Legacy provisional records; current activation uses the confirmed caps and clears these. */
    unreconciled: v.optional(v.array(unreconciledValidator)),
  })
    .index('by_owner', ['ownerId'])
    .index('by_campaign', ['campaignId']),
  characterRevisions: defineTable({
    characterId: v.id('characters'),
    revision: v.number(),
    parentRevisionId: v.union(v.id('characterRevisions'), v.null()),
    /** Optional so pre-progression snapshots retain their original storage shape. */
    level: v.optional(v.number()),
    kind: v.optional(
      v.union(
        v.literal('creation'),
        v.literal('full-edit'),
        v.literal('level-up'),
        v.literal('restore'),
      ),
    ),
    baseEffectiveRevisionId: v.optional(v.union(v.id('characterRevisions'), v.null())),
    restoredFromRevisionId: v.optional(v.id('characterRevisions')),
    selections: v.array(selectionValidator),
    /** Server-owned level when a choice was first made, preserved through immutable revisions. */
    choiceOrigins: v.optional(
      v.record(v.string(), v.object({ value: v.string(), level: v.number() })),
    ),
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
