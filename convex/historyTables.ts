// SPDX-License-Identifier: GPL-3.0-only
/**
 * A06 storage: document-id aliases for history restoration. Convex assigns every inserted document a
 * fresh id, so a document that undo removed (reversing a journaled insert) comes back under a new id
 * when redo re-creates it. The journal keeps naming the original id; this table maps each former id
 * to the document that currently stands for it, so later restores and recorded references
 * (`encounters.activeTurnId`, `turns.turnEntryId`, …) resolve to the live row.
 *
 * Owning specification: docs/data-architecture-spec.md#5-encounter-actions-and-undo (undo unit;
 * restoration from before/after values without calling modifiers) and
 * docs/engine-architecture.md#history-and-state-restoration (rollback preserves consistency across
 * all state affected by the reverted action).
 */
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

const eventPointer = v.union(v.id('events'), v.null());
export const historyTables = {
  /** Derived linked stacks; source events and journals remain authoritative. */
  historyCursors: defineTable({
    sessionId: v.id('sessions'),
    sequence: v.number(),
    branchTop: eventPointer,
    redoTop: eventPointer,
    redoClearedBy: eventPointer,
    archivedFloor: v.number(),
    scheduled: v.boolean(),
  }).index('by_session', ['sessionId']),
  historyUnits: defineTable({
    sessionId: v.id('sessions'),
    eventId: v.id('events'),
    commandKey: v.string(),
    active: v.boolean(),
    previousBranch: eventPointer,
    previousRedo: eventPointer,
    continuationOf: eventPointer,
  })
    .index('by_event', ['eventId'])
    .index('by_session_command', ['sessionId', 'commandKey']),
  historyAliases: defineTable({
    campaignId: v.id('campaigns'),
    /** An id the journal recorded that no longer names a live document. */
    formerId: v.string(),
    /** The id that currently stands for it; may itself be a former id (chains resolve in order). */
    currentId: v.string(),
  }).index('by_campaign_former', ['campaignId', 'formerId']),
};
