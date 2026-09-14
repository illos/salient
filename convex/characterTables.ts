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
export const characterTables = {
  characters: defineTable({
    ownerId: v.id('users'),
    authored: authoredValidator,
    revision: v.number(),
    draftRevisionId: v.union(v.id('characterRevisions'), v.null()),
    effectiveRevisionId: v.union(v.id('characterRevisions'), v.null()),
    // No evaluator exists yet: drafts cannot supply an effective baseline or initialize play.
    derivedBaseline: v.null(),
    liveState: v.null(),
    campaignId: v.union(v.id('campaigns'), v.null()),
    combatLocked: v.boolean(),
  }).index('by_owner', ['ownerId']),
  characterRevisions: defineTable({
    characterId: v.id('characters'),
    revision: v.number(),
    parentRevisionId: v.union(v.id('characterRevisions'), v.null()),
    selections: v.array(selectionValidator),
    status: v.literal('awaiting-rules-evaluation'),
  }).index('by_character_and_revision', ['characterId', 'revision']),
};
