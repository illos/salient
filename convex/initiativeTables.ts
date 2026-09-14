// SPDX-License-Identifier: GPL-3.0-only
/**
 * A04 storage for initiative and the game clock: groups of actor-linked turn entries, actual turns,
 * and scheduled-work registrations. Shapes follow shared/contracts/clock.ts (TurnRef, TimingClause,
 * ScheduledWorkKind, WorkSource) and the confirmed app model.
 *
 * Owning specifications: docs/table-spec.md#initiative-groups-confirmed-app-model (an initiative
 * group contains turn entries linked to actors; each actual turn has its own identity and
 * boundaries; spent state belongs to the entry), #mid-combat-additions-and-regrouping (group
 * completion is separate from member spent state), #game-clock-and-scheduled-rules-work (the clock
 * owns registrations; enqueue order is dispatch order), docs/conditions-and-clock.md#2-clock-contract.
 * Rows are written only through the journal (convex/lib/journal.ts) so A06 can restore them.
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const side = v.union(v.literal('heroes'), v.literal('director'));
export const actorRef = v.object({
  kind: v.union(v.literal('character'), v.literal('foe')),
  id: v.string(),
  name: v.string(),
});

export const initiativeTables = {
  /** One initiative group. Groups on the heroes' side hold hero entries; Director groups hold foes. */
  initiativeGroups: defineTable({
    campaignId: v.id('campaigns'),
    encounterId: v.id('encounters'),
    side,
    /** Display order within the encounter; new groups append at the bottom (confirmed placement). */
    order: v.number(),
    /**
     * The round in which this group finished its activation, or null. Finished for the current round
     * iff `completedRound === encounter.round`; a new round needs no reset write.
     */
    completedRound: v.union(v.number(), v.null()),
  }).index('by_encounter', ['encounterId', 'order']),
  /**
   * A turn entry linked to an actor. `spentRound` is the round in which the entry's turn started;
   * the entry is spent for the current round iff it equals `encounter.round`. Moving an entry keeps
   * this value (regrouping preserves spent state).
   */
  turnEntries: defineTable({
    campaignId: v.id('campaigns'),
    encounterId: v.id('encounters'),
    groupId: v.id('initiativeGroups'),
    order: v.number(),
    actor: actorRef,
    /** `ordinary` for the one entry each participant starts with; `granted` entries are future work. */
    source: v.union(v.literal('ordinary'), v.literal('granted')),
    spentRound: v.union(v.number(), v.null()),
    /** Set on the setup card; cleared by the clock at the end of round 1 (rule/combat/surprised.md). */
    surprised: v.boolean(),
  })
    .index('by_encounter', ['encounterId'])
    .index('by_group', ['groupId', 'order']),
  /** One actual turn (TurnRef.turnId). Created by Take turn, ended by End turn or actor removal. */
  turns: defineTable({
    campaignId: v.id('campaigns'),
    encounterId: v.id('encounters'),
    turnEntryId: v.id('turnEntries'),
    groupId: v.id('initiativeGroups'),
    side,
    round: v.number(),
    actor: actorRef,
    status: v.union(v.literal('active'), v.literal('ended')),
    startedEventId: v.id('events'),
    endedEventId: v.union(v.id('events'), v.null()),
  }).index('by_encounter', ['encounterId']),
  /** ScheduledWorkRegistration rows. `timing` and `work` carry the contract's discriminated unions. */
  clockRegistrations: defineTable({
    campaignId: v.id('campaigns'),
    encounterId: v.id('encounters'),
    enqueueSeq: v.number(),
    timing: v.any(),
    work: v.any(),
    source: v.object({
      logEntryId: v.string(),
      originId: v.optional(v.string()),
      sourcePath: v.optional(v.string()),
      label: v.string(),
    }),
    affectedIds: v.optional(v.array(v.string())),
    status: v.union(v.literal('active'), v.literal('retired')),
  }).index('by_encounter', ['encounterId', 'enqueueSeq']),
};
