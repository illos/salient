// SPDX-License-Identifier: GPL-3.0-only
import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { conditionsValidator } from './characterTables';

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
    }),
  })
    .index('by_campaign', ['campaignId'])
    .index('by_campaign_visible', ['campaignId', 'visible']),
  foeSettings: defineTable({ campaignId: v.id('campaigns'), addVisible: v.boolean() }).index(
    'by_campaign',
    ['campaignId'],
  ),
};
