// SPDX-License-Identifier: GPL-3.0-only
/**
 * A05 storage: per-user targeting drafts, Director-supplied hero roll facts (the Q-A-200 route while
 * no evaluated baseline exists), action uses and critical-hit opportunities for the advisory
 * allowance tracker, and the effective per-target record of each resolved ability use that later
 * corrections and Resolved at table dispositions update.
 *
 * Owning specifications: docs/table-spec.md#roster-targeting-controls (a draft belongs to the
 * authenticated user), #v001-edge-and-bane-inputs (counts per target, one-attack lifetime),
 * #v001-critical-hits-and-additional-main-actions (recorded opportunity, never auto-executed),
 * #director-edits-to-inline-results (corrections append; the effective result is what later
 * interpretation uses), #inline-interaction-cards-in-the-game-log (Resolved at table records a
 * disposition without applying the effect). Gameplay rows are written only through the journal
 * (convex/lib/journal.ts) so A06 can restore them; drafts are user UI state and are not journaled.
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { actorRef } from './initiativeTables';

/** V159 automatic contribution of an effect to one roll (shared/resolve/modifiers.ts). */
export const rollContributionValidator = v.object({
  instanceId: v.string(),
  sources: v.array(v.string()),
  consumes: v.array(v.string()),
  abilityId: v.string(),
  abilityName: v.string(),
  actorLabel: v.string(),
  sourcePath: v.string(),
  text: v.string(),
  side: v.union(v.literal('actor'), v.literal('target')),
  subjectId: v.string(),
  edges: v.number(),
  banes: v.number(),
  bonus: v.number(),
  excluded: v.optional(v.literal(true)),
  usedUp: v.optional(v.literal(true)),
});

const characteristic = v.union(
  v.literal('M'),
  v.literal('A'),
  v.literal('R'),
  v.literal('I'),
  v.literal('P'),
);
const characteristics = v.object({
  M: v.number(),
  A: v.number(),
  R: v.number(),
  I: v.number(),
  P: v.number(),
});
const bonusByTier = v.array(v.number());

export const abilityTables = {
  /** One draft per user and campaign: pending ability, selected targets and per-target counts. */
  targetingDrafts: defineTable({
    campaignId: v.id('campaigns'),
    userId: v.id('users'),
    /** The acting creature the draft is for; a different actor clears the draft (confirmed). */
    actor: v.union(actorRef, v.null()),
    abilityId: v.union(v.string(), v.null()),
    targets: v.array(actorRef),
    /** Edge and bane counts keyed by `kind:id`; entered before firing, cleared by the accepted attack. */
    modifiers: v.record(v.string(), v.object({ edges: v.number(), banes: v.number() })),
    /** Explicit pre-fire roll characteristic override, when chosen. */
    characteristic: v.union(characteristic, v.null()),
    damageCharacteristic: v.optional(v.union(characteristic, v.null())),
    /** V115: melee or ranged use of a Melee-and-Ranged ability (rule/combat/distance.md). */
    mode: v.optional(v.union(v.literal('melee'), v.literal('ranged'), v.null())),
    updatedAt: v.number(),
  }).index('by_campaign_user', ['campaignId', 'userId']),
  /**
   * Director-supplied roll facts for a hero while no evaluated baseline exists (A02 pending):
   * characteristic scores, kit damage bonuses and the granted abilities the hero may use. Recorded
   * as an attributed `hero.facts` event; nothing here is defaulted to a number the source does not
   * give for that hero.
   */
  heroRollFacts: defineTable({
    campaignId: v.id('campaigns'),
    characterId: v.id('characters'),
    characteristics,
    kitName: v.union(v.string(), v.null()),
    kitMeleeDamageBonus: bonusByTier,
    kitRangedDamageBonus: bonusByTier,
    /** Content ids of granted abilities (beyond the common actions every creature has). */
    abilities: v.array(v.string()),
    /** The kit's own signature ability content name, whose damage already includes the kit bonus. */
    kitSignatureAbility: v.union(v.string(), v.null()),
  }).index('by_character', ['characterId']),
  /** One recorded action use for the advisory allowance tracker (docs/table-spec.md#player-sheet-actions-and-explicit-end-turn). */
  actionUses: defineTable({
    campaignId: v.id('campaigns'),
    encounterId: v.id('encounters'),
    /** The actual turn during which the action was used; null when used off-turn. */
    turnId: v.union(v.id('turns'), v.null()),
    round: v.number(),
    actor: actorRef,
    actionType: v.string(),
    label: v.string(),
    eventId: v.id('events'),
    /** Set when this use consumed a recorded critical-hit opportunity instead of the ordinary allowance. */
    opportunityId: v.union(v.id('actionOpportunities'), v.null()),
  })
    .index('by_turn', ['turnId'])
    .index('by_encounter_actor', ['encounterId', 'actor.id']),
  /**
   * V173 (docs/lasting-effects-design.md#4-triggered-actions-and-reactions): a participating hero's
   * compiled triggered ability, written when combat is committed from the documents it already
   * read, so an observed damage write finds who may respond with one indexed read instead of
   * reading every hero. Journaled with the commit; undo of the commit removes them.
   */
  triggerHolders: defineTable({
    campaignId: v.id('campaigns'),
    encounterId: v.id('encounters'),
    owner: actorRef,
    abilityId: v.string(),
    abilityName: v.string(),
    actionType: v.union(v.literal('triggered action'), v.literal('free triggered action')),
    /** shared/resolve/triggers.ts TriggerSpec, as compiled. */
    trigger: v.any(),
    /** The printed Target and Distance entries. */
    target: v.string(),
    distance: v.string(),
    sourcePath: v.string(),
    /**
     * V174: a response that revises the triggering damage (convex/lib/damageRevisions.ts): its
     * adjacency confirmation and optional Spend section, for the card (TriggerOffer.revision).
     */
    revision: v.optional(v.any()),
  }).index('by_encounter', ['encounterId']),
  /** A critical hit's additional main action: offered to the acting user, never executed by the app. */
  actionOpportunities: defineTable({
    campaignId: v.id('campaigns'),
    encounterId: v.id('encounters'),
    actor: actorRef,
    kind: v.literal('additional-main-action'),
    sourceEventId: v.id('events'),
    status: v.union(v.literal('offered'), v.literal('used'), v.literal('closed')),
    usedEventId: v.union(v.id('events'), v.null()),
  }).index('by_encounter_actor', ['encounterId', 'actor.id']),
  /**
   * The effective record of one resolved ability use. `targets[i]` carries the inputs and outcome
   * currently in force for that target (updated by linked corrections) and the manual dispositions
   * of its unresolved clauses; the original event payload is never rewritten.
   */
  abilityResults: defineTable({
    campaignId: v.id('campaigns'),
    eventId: v.id('events'),
    encounterId: v.union(v.id('encounters'), v.null()),
    actor: actorRef,
    abilityId: v.string(),
    abilityName: v.string(),
    /** Original pure-resolution facts; corrections never recompute from subsequently edited builds. */
    resolutionInputs: v.optional(v.any()),
    /** V72 versioned selected definition, original inputs and effective occurrences. */
    compiled: v.optional(v.any()),
    execution: v.optional(v.any()),
    /** V157: a use of an ability without a power roll; it has no dice or characteristic. */
    effectOnly: v.optional(v.literal(true)),
    /** Absent only for an effect-only use (V157). */
    dice: v.optional(v.object({ d10a: v.number(), d10b: v.number() })),
    characteristicValue: v.optional(v.number()),
    selectedCharacteristic: v.union(characteristic, v.null()),
    targets: v.array(
      v.object({
        target: actorRef,
        /** Circumstance edges and banes the table entered (V159: automatic ones are separate). */
        edges: v.number(),
        banes: v.number(),
        /**
         * V159 automatic contributions of active modifiers (shared/resolve/modifiers.ts
         * RollContribution), with the table's exclusions; absent when there were none.
         */
        contributions: v.optional(v.array(rollContributionValidator)),
        /** TargetRollOutcome (shared/contracts/rollResolution.ts) currently in force. */
        outcome: v.any(),
        /** DamageApplication currently applied, or null when no damage was applied. */
        applied: v.any(),
        /** Resolved at table dispositions: one per unresolved clause, recorded once. */
        dispositions: v.array(
          v.object({ clause: v.string(), eventId: v.id('events'), note: v.string() }),
        ),
      }),
    ),
    /** Ability-level manual resolutions (Effect clauses) and their dispositions. */
    manualDispositions: v.array(
      v.object({ clause: v.string(), eventId: v.id('events'), note: v.string() }),
    ),
    correctionEventIds: v.array(v.id('events')),
  })
    .index('by_event', ['eventId'])
    .index('by_campaign', ['campaignId']),
};
