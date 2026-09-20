// SPDX-License-Identifier: GPL-3.0-only
// Schema dependencies must stay free of runtime authentication and component imports.
import { v } from 'convex/values';

export const startingRewardsValidator = v.object({
  originRevisionId: v.id('characterRevisions'),
  initializedAt: v.number(),
  wealth: v.number(),
  renown: v.number(),
  projectPoints: v.number(),
  sources: v.object({
    wealth: v.array(v.string()),
    renown: v.array(v.string()),
    projectPoints: v.array(v.string()),
  }),
  items: v.array(
    v.object({
      id: v.string(),
      decisionId: v.string(),
      name: v.string(),
      sourcePath: v.string(),
      state: v.union(
        v.literal('possessed'),
        v.literal('broken'),
        v.literal('absent'),
        v.literal('pending-Director'),
      ),
      condition: v.optional(v.string()),
      projectSource: v.optional(v.string()),
    }),
  ),
});
