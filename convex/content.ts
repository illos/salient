// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireUser, type ReadCtx } from './lib/access';
import { entries, manifest } from '../shared/content/compendium/index';

// Shared content from the pinned Steel Compendium (shared/content/README.md). Every entry is one
// source file: verbatim Markdown plus its frontmatter fields. Nothing here interprets rules.

const entryValidator = v.object({
  id: v.string(),
  kind: v.string(),
  name: v.string(),
  sourcePath: v.string(),
  jsonPath: v.optional(v.string()),
  selection: v.string(),
  revision: v.string(),
  text: v.string(),
  structured: v.any(),
  features: v.optional(v.array(v.any())),
});
const summaryValidator = v.object({
  id: v.string(),
  kind: v.string(),
  name: v.string(),
  sourcePath: v.string(),
  selection: v.string(),
});

function project(row: Doc<'content'>) {
  return {
    id: row.contentId,
    kind: row.kind,
    name: row.name,
    sourcePath: row.sourcePath,
    selection: row.selection,
    revision: row.revision,
    text: row.text,
    structured: row.structured,
    ...(row.jsonPath !== undefined ? { jsonPath: row.jsonPath } : {}),
    ...(row.features !== undefined ? { features: row.features } : {}),
  };
}

/** Reads one entry by its source-qualified id; null when the snapshot has no such entry. */
export async function findContent(ctx: ReadCtx, contentId: string) {
  return ctx.db
    .query('content')
    .withIndex('by_contentId', q => q.eq('contentId', contentId))
    .unique();
}

/** Like findContent, but a missing entry is an error that names the reseed command. */
export async function requireContent(ctx: ReadCtx, contentId: string) {
  const row = await findContent(ctx, contentId);
  if (!row)
    throw new ConvexError(
      `Content entry ${contentId} is not loaded. Run pnpm content:seed against the local deployment.`,
    );
  return row;
}

export const get = query({
  args: { id: v.string() },
  returns: v.union(entryValidator, v.null()),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const row = await findContent(ctx, args.id);
    return row ? project(row) : null;
  },
});

export const list = query({
  args: { kind: v.string() },
  returns: v.array(summaryValidator),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const rows = await ctx.db
      .query('content')
      .withIndex('by_kind', q => q.eq('kind', args.kind))
      .take(1000);
    return rows.map(row => ({
      id: row.contentId,
      kind: row.kind,
      name: row.name,
      sourcePath: row.sourcePath,
      selection: row.selection,
    }));
  },
});

export const status = query({
  args: {},
  returns: v.union(
    v.object({
      revision: v.string(),
      tag: v.union(v.string(), v.null()),
      committedAt: v.string(),
      generatorVersion: v.string(),
      generatedAt: v.string(),
      contentHash: v.string(),
      entryCount: v.number(),
      seededAt: v.number(),
    }),
    v.null(),
  ),
  handler: async ctx => {
    await requireUser(ctx);
    const row = await ctx.db.query('contentManifest').first();
    if (!row) return null;
    const { _id, _creationTime, ...status } = row;
    void _id;
    void _creationTime;
    return status;
  },
});

/**
 * Replaces every content row with the bundled snapshot. Development data is disposable (pre-alpha
 * policy), so this deletes and reinserts rather than migrating. Run through `pnpm content:seed`.
 */
export const reseed = internalMutation({
  args: {},
  returns: v.object({ revision: v.string(), entryCount: v.number() }),
  handler: async ctx => {
    for (const row of await ctx.db.query('content').take(5000)) await ctx.db.delete(row._id);
    for (const row of await ctx.db.query('contentManifest').take(10)) await ctx.db.delete(row._id);
    const revision = manifest.compendium.revision;
    for (const entry of entries)
      await ctx.db.insert('content', {
        contentId: entry.id,
        kind: entry.kind,
        name: entry.name,
        sourcePath: entry.sourcePath,
        selection: entry.selection,
        revision,
        text: entry.text,
        structured: entry.structured,
        jsonPath: entry.jsonPath,
        ...(entry.features !== undefined ? { features: entry.features } : {}),
      });
    await ctx.db.insert('contentManifest', {
      revision,
      tag: manifest.compendium.tag,
      committedAt: manifest.compendium.committedAt,
      generatorVersion: manifest.generator.version,
      generatedAt: manifest.generatedAt,
      contentHash: manifest.contentHash,
      entryCount: entries.length,
      seededAt: Date.now(),
    });
    return { revision, entryCount: entries.length };
  },
});
