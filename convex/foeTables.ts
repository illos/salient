// SPDX-License-Identifier: GPL-3.0-only
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const foeTables = {
  foes: defineTable({
    campaignId: v.id('campaigns'),
    name: v.string(),
    visible: v.boolean(),
    // Immutable copy of the source and baseline, separate from instance play state.
    sourceSnapshot: v.string(),
    maxStamina: v.number(),
    live: v.object({ stamina: v.number(), temporaryStamina: v.number() }),
  })
    .index('by_campaign', ['campaignId'])
    .index('by_campaign_visible', ['campaignId', 'visible']),
  foeSettings: defineTable({ campaignId: v.id('campaigns'), addVisible: v.boolean() }).index(
    'by_campaign',
    ['campaignId'],
  ),
};
