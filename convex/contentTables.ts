// SPDX-License-Identifier: GPL-3.0-only
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Mirror of shared/content/compendium/** (see shared/content/README.md). Rows are replaced wholesale
// by content.reseed under the disposable-data policy; nothing edits them in place.
export const contentTables = {
  content: defineTable({
    // Source-qualified SCC id, e.g. mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior.
    contentId: v.string(),
    kind: v.string(),
    name: v.string(),
    sourcePath: v.string(),
    jsonPath: v.optional(v.string()),
    selection: v.string(),
    revision: v.string(),
    // The complete source file, byte-exact.
    text: v.string(),
    // Frontmatter fields copied verbatim from the source; keys and values are the source's own.
    structured: v.any(),
    features: v.optional(v.array(v.any())),
  })
    .index('by_contentId', ['contentId'])
    .index('by_kind', ['kind']),
  contentManifest: defineTable({
    revision: v.string(),
    tag: v.union(v.string(), v.null()),
    committedAt: v.string(),
    generatorVersion: v.string(),
    generatedAt: v.string(),
    contentHash: v.string(),
    entryCount: v.number(),
    seededAt: v.number(),
  }),
};
