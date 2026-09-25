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
      bonus: v.optional(v.number()),
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
const lastSaveValidator = v.object({
  roll: v.number(),
  bonus: v.optional(v.number()),
  success: v.boolean(),
  boundaryEventId: v.string(),
  threshold: v.number(),
  thresholdSource: v.union(
    v.object({ kind: v.literal('hero-baseline'), provenance: v.array(v.any()) }),
    v.object({ kind: v.literal('printed'), sourcePath: v.string() }),
  ),
});
const partyValidator = v.object({
  kind: v.union(v.literal('character'), v.literal('foe'), v.literal('squad'), v.literal('object')),
  id: v.string(),
  name: v.string(),
});
/** V158 printed duration (shared/contracts/liveState.ts EffectDuration). */
export const effectDurationValidator = v.union(
  v.object({ kind: v.literal('start-of-next-turn'), anchor: v.literal('owner') }),
  v.object({
    kind: v.literal('end-of-next-turn'),
    anchor: v.union(v.literal('owner'), v.literal('subject')),
  }),
  v.object({ kind: v.literal('encounter') }),
  v.object({ kind: v.literal('save-ends') }),
  v.object({ kind: v.literal('eot') }),
  v.object({ kind: v.literal('maintained') }),
  v.object({ kind: v.literal('none') }),
);
const boundDurationValidator = v.union(
  v.object({ kind: v.literal('start-of-next-turn'), creatureId: v.string() }),
  v.object({ kind: v.literal('end-of-next-turn'), creatureId: v.string() }),
  v.object({ kind: v.literal('encounter') }),
  v.object({ kind: v.literal('save-ends'), creatureId: v.string() }),
  v.object({ kind: v.literal('eot'), creatureId: v.string() }),
  v.object({ kind: v.literal('maintained'), creatureId: v.string() }),
  v.object({ kind: v.literal('none') }),
);
export const effectEndTriggerValidator = v.union(
  v.literal('owner-dying'),
  v.literal('reused'),
  v.literal('willingly-ended'),
  v.literal('performance'),
);
/** V159 modifier payload (shared/contracts/liveState.ts ModifierPayload). */
export const modifierPayloadValidator = v.union(
  v.object({
    kind: v.literal('roll'),
    target: v.union(v.literal('rolls-by'), v.literal('rolls-against')),
    scope: v.union(v.literal('power-roll'), v.literal('ability-roll'), v.literal('strike')),
    edges: v.optional(v.number()),
    banes: v.optional(v.number()),
    bonus: v.optional(v.number()),
  }),
  v.object({
    kind: v.literal('stat'),
    stat: v.union(v.literal('speed'), v.literal('stability'), v.literal('saving-throw')),
    amount: v.number(),
  }),
  // V179: a granted damage immunity or weakness (shared/contracts/liveState.ts DamageModifier).
  v.object({
    kind: v.literal('damage-modifier'),
    defense: v.union(v.literal('immunity'), v.literal('weakness')),
    damageType: v.string(),
    value: v.number(),
  }),
);
const watcherPartyValidator = v.union(v.literal('subject'), v.literal('owner'));
export const watcherEventValidator = v.union(
  ...(
    [
      'damage-taken',
      'damage-dealt',
      'made-winded',
      'dying',
      'turn-start',
      'turn-end',
      'ability-used',
      'strike-made',
      'marked-damaged',
      'area-entered',
    ] as const
  ).map(value => v.literal(value)),
);
/** V171 watcher (shared/contracts/liveState.ts Watcher). */
export const watcherValidator = v.object({
  event: watcherEventValidator,
  whose: watcherPartyValidator,
  otherCreature: v.optional(v.literal(true)),
  limit: v.union(v.literal('turn'), v.literal('round'), v.literal('each')),
  responses: v.array(
    v.union(
      v.object({
        kind: v.literal('gain'),
        // V175: `dealer`, the creature who dealt the watched damage (`marked-damaged`).
        recipient: v.union(watcherPartyValidator, v.literal('dealer')),
        surges: v.optional(v.number()),
        temporaryStamina: v.optional(v.number()),
      }),
      v.object({
        kind: v.literal('damage'),
        recipient: watcherPartyValidator,
        amount: v.union(
          v.number(),
          v.object({ dice: v.object({ count: v.number(), sides: v.number() }) }),
        ),
        damageType: v.optional(v.string()),
      }),
      v.object({
        kind: v.literal('condition'),
        recipient: watcherPartyValidator,
        condition: conditionInstanceValidator.fields.condition,
        duration: v.union(v.literal('save-ends'), v.literal('eot')),
      }),
      v.object({ kind: v.literal('instruction'), text: v.string() }),
    ),
  ),
});
const effectPayloadValidator = v.union(
  v.object({ kind: v.literal('instruction'), text: v.string() }),
  v.object({ kind: v.literal('modifier'), text: v.string(), modifier: modifierPayloadValidator }),
  v.object({ kind: v.literal('watcher'), text: v.string(), watcher: watcherValidator }),
  // V175: a mark (feature/ability/tactician/level-1/mark.md).
  v.object({
    kind: v.literal('mark'),
    text: v.string(),
    mark: v.object({ retargetDistance: v.string() }),
  }),
  // V200: an area or aura and its riders (shared/contracts/liveState.ts AreaPayload).
  v.object({
    kind: v.literal('area'),
    text: v.string(),
    area: v.object({
      riders: v.array(
        v.object({
          who: v.object({
            self: v.boolean(),
            others: v.union(v.literal('ally'), v.literal('enemy'), v.literal('none')),
          }),
          watcher: watcherValidator,
        }),
      ),
    }),
  }),
);
/** V175: the four printed Mark benefits (shared/contracts/liveState.ts MarkBenefitKind). */
export const markBenefitValidator = v.union(
  v.literal('extra-damage'),
  v.literal('recovery'),
  v.literal('shift'),
  v.literal('taunt'),
);
/** V158 effect instance (shared/contracts/liveState.ts EffectInstance). */
export const effectInstanceValidator = v.object({
  id: v.string(),
  kind: v.union(
    v.literal('instruction'),
    v.literal('modifier'),
    v.literal('aura'),
    v.literal('area'),
    v.literal('mark'),
    v.literal('watcher'),
    v.literal('maintained'),
  ),
  sourceUseEventId: v.string(),
  sourceActorId: v.string(),
  abilityId: v.string(),
  abilityName: v.string(),
  actorLabel: v.string(),
  sourcePath: v.string(),
  clause: v.string(),
  owner: partyValidator,
  subject: partyValidator,
  payload: effectPayloadValidator,
  printedDuration: effectDurationValidator,
  duration: boundDurationValidator,
  endsWhen: v.array(effectEndTriggerValidator),
  status: v.union(v.literal('active'), v.literal('ended'), v.literal('consumed')),
  endedReason: v.optional(v.string()),
  endedEventId: v.optional(v.string()),
  registrationIds: v.array(v.string()),
  manualStacking: v.optional(v.literal(true)),
  group: v.optional(v.string()),
  consumeOn: v.optional(
    v.object({ event: v.union(v.literal('power-roll'), v.literal('ability-roll')) }),
  ),
  appliedSequence: v.number(),
  lastSave: v.optional(lastSaveValidator),
  firings: v.optional(
    v.array(
      v.object({
        causeEventId: v.string(),
        encounterId: v.optional(v.string()),
        round: v.optional(v.number()),
        turnId: v.optional(v.string()),
      }),
    ),
  ),
  markBenefits: v.optional(
    v.array(
      v.object({
        triggeringEventId: v.string(),
        benefit: markBenefitValidator,
        eventId: v.string(),
      }),
    ),
  ),
  /** V200: an area's members (shared/contracts/liveState.ts AreaMember). */
  members: v.optional(
    v.array(
      v.object({
        party: partyValidator,
        effects: v.array(v.string()),
        manual: v.optional(v.string()),
        addedEventId: v.string(),
      }),
    ),
  ),
  /** V200: a rider of an area stored on one member. */
  area: v.optional(
    v.object({
      id: v.string(),
      holder: v.object({
        kind: v.union(v.literal('character'), v.literal('foe')),
        id: v.string(),
      }),
      rider: v.number(),
    }),
  ),
});
/** V158: an owner's pointer to an active instance another creature holds. */
export const ownedEffectValidator = v.object({
  id: v.string(),
  holder: v.object({
    kind: v.union(v.literal('character'), v.literal('foe')),
    id: v.string(),
  }),
  abilityId: v.string(),
  watches: v.optional(watcherEventValidator),
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
  /** V191: the XP bank (shared/contracts/liveState.ts). */
  xp: v.number(),
  /** V191: display-only lifetime XP; optional so rows written before V191 still validate. */
  xpLifetime: v.optional(v.number()),
  conditions: conditionsValidator,
  manualConditions: v.optional(conditionsValidator),
  conditionInstances: v.optional(v.array(conditionInstanceValidator)),
  /** V158: lasting effects this hero holds, and pointers to the ones it owns elsewhere. */
  effectInstances: v.optional(v.array(effectInstanceValidator)),
  ownedEffects: v.optional(v.array(ownedEffectValidator)),
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
/** One Forge Steel import note (shared/interchange/forge-steel/import.ts ForgeImportDiagnostic). */
export const forgeImportDiagnosticValidator = v.object({
  path: v.string(),
  forgeId: v.optional(v.string()),
  name: v.optional(v.string()),
  reason: v.string(),
});
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
        /** V166 kit change as a respite activity (chapter/kits.md, Changing Your Kit). */
        v.literal('respite-kit'),
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
  /**
   * V09 Forge Steel import record: the verbatim file, kept outside rules evaluation, with what the
   * adapter could not translate (docs/character-wizard-spec.md#required-import). Owner-only; its
   * ids, folders and flags grant nothing.
   */
  characterImports: defineTable({
    characterId: v.id('characters'),
    ownerId: v.id('users'),
    format: v.literal('forge-steel-hero'),
    /** Kept in the row, bounded to 512 KB; account deletion budgets these bytes separately. */
    payload: v.string(),
    payloadBytes: v.number(),
    payloadSha256: v.string(),
    forgeVendorRevision: v.string(),
    level: v.number(),
    diagnostics: v.array(forgeImportDiagnosticValidator),
    unmapped: v.array(v.string()),
    importedAt: v.number(),
  })
    .index('by_character', ['characterId'])
    .index('by_owner', ['ownerId']),
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
