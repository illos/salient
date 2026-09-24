// SPDX-License-Identifier: GPL-3.0-only
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
  conditionsValidator,
  conditionInstanceValidator,
  effectInstanceValidator,
  ownedEffectValidator,
} from './characterTables';

export const foeTables = {
  foes: defineTable({
    campaignId: v.id('campaigns'),
    name: v.string(),
    visible: v.boolean(),
    // Immutable copy of the source and baseline, separate from instance play state.
    sourceSnapshot: v.string(),
    maxStamina: v.number(),
    /** Conditions absent means every toggle off (loaded state, R03 InitialFoeLiveState). */
    live: v.object({
      stamina: v.number(),
      temporaryStamina: v.number(),
      conditions: v.optional(conditionsValidator),
      manualConditions: v.optional(conditionsValidator),
      conditionInstances: v.optional(v.array(conditionInstanceValidator)),
      /** V158: lasting effects this foe holds, and pointers to the ones it owns elsewhere. */
      effectInstances: v.optional(v.array(effectInstanceValidator)),
      ownedEffects: v.optional(v.array(ownedEffectValidator)),
    }),
    /**
     * V02: set on a minion that belongs to a squad. Its `live.stamina` is the printed per-member
     * value while it lives and 0 once the squad ladder drops it; damage goes to the squad pool.
     */
    squadId: v.optional(v.id('squads')),
  })
    .index('by_campaign', ['campaignId'])
    .index('by_campaign_visible', ['campaignId', 'visible'])
    .index('by_squad', ['squadId']),
  /**
   * V02 minion squad (docs/table-spec.md#minion-squads-and-captain-state): one shared Stamina pool,
   * step value and carried damage, the member identities in roster order, the attached captain and
   * its printed benefit, proportional EV, shared-turn participation and any owed casualty choice.
   * Written only through the journal so undo/redo and Void restore it with its members.
   */
  squads: defineTable({
    campaignId: v.id('campaigns'),
    name: v.string(),
    definitionId: v.string(),
    /** Immutable copy of the member stat block (same shape as foes.sourceSnapshot). */
    sourceSnapshot: v.string(),
    /** Printed per-member Stamina. */
    memberStamina: v.number(),
    /** Current step: printed Stamina plus the attached captain's Stamina benefit. */
    step: v.number(),
    pool: v.number(),
    /** Living members × current step; the bar's maximum. */
    poolMax: v.number(),
    /** Damage since the last ladder casualty (2026-09-20: survives captain changes). */
    carried: v.number(),
    memberIds: v.array(v.id('foes')),
    captainId: v.union(v.id('foes'), v.null()),
    /** Round in which the captain was last lost, for the replacement-timing warning. */
    captainLostRound: v.union(v.number(), v.null()),
    /** Printed With Captain text parsed into the automated forms; `manual` keeps other text readable. */
    captainBenefit: v.union(
      v.null(),
      v.object({
        text: v.string(),
        stamina: v.number(),
        strikeDamage: v.number(),
        strikeEdges: v.number(),
        manual: v.boolean(),
      }),
    ),
    ev: v.object({
      printed: v.union(v.string(), v.null()),
      amount: v.union(v.number(), v.null()),
      quantity: v.union(v.number(), v.null()),
      /** count × amount ÷ quantity, fractions preserved; null when the printed EV is not read. */
      derived: v.union(v.number(), v.null()),
    }),
    /** Shared-turn participation for the current or last squad turn. */
    participation: v.object({
      turnId: v.union(v.id('turns'), v.null()),
      optedOut: v.array(v.id('foes')),
      /** Members that used an individual maneuver this turn (excluded from the squad action). */
      individual: v.array(v.id('foes')),
    }),
    /** Casualties owed by the last damage instance until the table names them. */
    pending: v.union(
      v.null(),
      v.object({
        count: v.number(),
        candidates: v.array(v.id('foes')),
        reason: v.union(v.literal('directly-damaged'), v.literal('nearest')),
        eventId: v.id('events'),
      }),
    ),
  })
    .index('by_campaign', ['campaignId'])
    .index('by_captain', ['captainId']),
  foeSettings: defineTable({ campaignId: v.id('campaigns'), addVisible: v.boolean() }).index(
    'by_campaign',
    ['campaignId'],
  ),
};
