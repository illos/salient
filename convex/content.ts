// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from 'convex/values';
import { internalAction, internalMutation, query } from './_generated/server';
import { internal } from './_generated/api';
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

// Bound each transaction by rows and serialized payload. Existing rows are replaced in place so
// a interrupted seed retains references and can be safely rerun. The manifest is absent until done.
const BATCH_ROWS = 32;
const BATCH_BYTES = 512 * 1024;
const currentIds = new Set(entries.map(entry => entry.id));
function requireSnapshot(contentHash: string) {
  if (contentHash !== manifest.contentHash)
    throw new ConvexError('Content changed during seeding; rerun content:seed.');
}

export const seedBatch = internalMutation({
  args: { offset: v.number(), contentHash: v.string() },
  returns: v.number(),
  handler: async (ctx, { offset, contentHash }) => {
    requireSnapshot(contentHash);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > entries.length)
      throw new ConvexError('Invalid content batch offset.');
    if (offset === 0) {
      for (const row of await ctx.db.query('contentManifest').take(10))
        await ctx.db.delete(row._id);
    }
    let next = offset;
    let bytes = 0;
    while (next < entries.length && next - offset < BATCH_ROWS) {
      const entry = entries[next];
      const row = {
        contentId: entry.id,
        kind: entry.kind,
        name: entry.name,
        sourcePath: entry.sourcePath,
        selection: entry.selection,
        revision: manifest.compendium.revision,
        text: entry.text,
        structured: entry.structured,
        ...(entry.jsonPath === undefined ? {} : { jsonPath: entry.jsonPath }),
        ...(entry.features === undefined ? {} : { features: entry.features }),
      };
      const size = new TextEncoder().encode(JSON.stringify(row)).length;
      if (size > BATCH_BYTES)
        throw new ConvexError(`Content entry exceeds seed batch limit: ${entry.id}`);
      if (bytes + size > BATCH_BYTES) break;
      const existing = await findContent(ctx, entry.id);
      if (existing) await ctx.db.replace(existing._id, row);
      else await ctx.db.insert('content', row);
      bytes += size;
      next++;
    }
    return next;
  },
});

export const pruneBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()), contentHash: v.string() },
  returns: v.object({ cursor: v.string(), done: v.boolean(), retained: v.number() }),
  handler: async (ctx, { cursor, contentHash }) => {
    requireSnapshot(contentHash);
    const page = await ctx.db.query('content').order('asc').paginate({
      cursor,
      numItems: BATCH_ROWS,
      maximumBytesRead: BATCH_BYTES,
    });
    let retained = 0;
    for (const row of page.page) {
      if (!currentIds.has(row.contentId)) await ctx.db.delete(row._id);
      else retained++;
    }
    return { cursor: page.continueCursor, done: page.isDone, retained };
  },
});

export const finishSeed = internalMutation({
  args: { contentHash: v.string(), entryCount: v.number() },
  returns: v.null(),
  handler: async (ctx, { contentHash, entryCount }) => {
    requireSnapshot(contentHash);
    if (entryCount !== entries.length)
      throw new ConvexError('Content count mismatch; rerun content:seed.');
    for (const row of await ctx.db.query('contentManifest').take(10)) await ctx.db.delete(row._id);
    await ctx.db.insert('contentManifest', {
      revision: manifest.compendium.revision,
      tag: manifest.compendium.tag,
      committedAt: manifest.compendium.committedAt,
      generatorVersion: manifest.generator.version,
      generatedAt: manifest.generatedAt,
      contentHash,
      entryCount,
      seededAt: Date.now(),
    });
    return null;
  },
});

/** Internal administrator entry point; batches reference rows only, never application play data. */
export const reseed = internalAction({
  args: {},
  returns: v.object({ revision: v.string(), entryCount: v.number() }),
  handler: async (ctx): Promise<{ revision: string; entryCount: number }> => {
    const contentHash = manifest.contentHash;
    let offset = 0;
    do {
      offset = await ctx.runMutation(internal.content.seedBatch, { offset, contentHash });
    } while (offset < entries.length);
    let cursor: string | null = null;
    let entryCount = 0;
    for (;;) {
      const page: { cursor: string; done: boolean; retained: number } = await ctx.runMutation(
        internal.content.pruneBatch,
        { cursor, contentHash },
      );
      entryCount += page.retained;
      if (page.done) break;
      cursor = page.cursor;
    }
    await ctx.runMutation(internal.content.finishSeed, { contentHash, entryCount });
    return { revision: manifest.compendium.revision, entryCount };
  },
});
