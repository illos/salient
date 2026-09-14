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

export const historyTables = {
  historyAliases: defineTable({
    campaignId: v.id('campaigns'),
    /** An id the journal recorded that no longer names a live document. */
    formerId: v.string(),
    /** The id that currently stands for it; may itself be a former id (chains resolve in order). */
    currentId: v.string(),
  }).index('by_campaign_former', ['campaignId', 'formerId']),
};
