// SPDX-License-Identifier: GPL-3.0-only
/**
 * V95 account screen (docs/accounts-and-access-spec.md#accounts-and-administration): the profile
 * other players see (display name, portrait), account-bound upload lifecycle, and the scheduled
 * continuation of an account purge. Device reads and bulk revocation use Better Auth's component
 * store with explicit pagination; credentials and single-session revocation use its own routes.
 * The deletion trigger that purges app data lives in convex/auth.ts and accountDeletion.ts.
 */
import { v, ConvexError } from 'convex/values';
import { components, internal } from './_generated/api';
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { authComponent } from './auth';
import { requireUser } from './lib/access';
import { purgeUser } from './lib/accountDeletion';

export const MAX_DISPLAY_NAME = 80;
export const MAX_PORTRAIT_BYTES = 2 * 1024 * 1024;
export const PORTRAIT_UPLOAD_TTL_MS = 15 * 60 * 1000;
const STORAGE_CLEANUP_PAGE = 100;
const DEVICE_PAGE = 100;

export const updateProfile = mutation({
  args: { displayName: v.string() },
  returns: v.null(),
  handler: async (ctx, { displayName }) => {
    const user = await requireUser(ctx);
    const name = displayName.trim();
    if (name.length === 0) throw new ConvexError('Enter a display name.');
    if (name.length > MAX_DISPLAY_NAME)
      throw new ConvexError(`Display names are limited to ${MAX_DISPLAY_NAME} characters.`);
    if (name !== user.displayName) await ctx.db.patch(user._id, { displayName: name });
    return null;
  },
});

/**
 * A one-shot URL and account-bound ticket. The ticket's creation time proves the chosen storage
 * object came from this upload window; an ID already used by another profile is never touched.
 */
export const portraitUploadUrl = mutation({
  args: {},
  returns: v.object({ url: v.string(), ticketId: v.id('portraitUploads') }),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const expiresAt = now + PORTRAIT_UPLOAD_TTL_MS;
    const ticketId = await ctx.db.insert('portraitUploads', { userId: user._id, expiresAt });
    // The second TTL is a grace period: by then no still-valid portrait ticket can own an
    // unreferenced file created before this ticket expired.
    await ctx.scheduler.runAfter(
      PORTRAIT_UPLOAD_TTL_MS * 2,
      internal.account.cleanupPortraitUploads,
      {
        before: expiresAt,
        cursor: null,
      },
    );
    return { url: await ctx.storage.generateUploadUrl(), ticketId };
  },
});

const portraitResult = v.union(
  v.object({ ok: v.literal(true) }),
  v.object({ ok: v.literal(false), error: v.string() }),
);

export const portraitMetadata = internalQuery({
  args: { authId: v.string(), ticketId: v.id('portraitUploads'), storageId: v.id('_storage') },
  returns: v.union(
    v.object({ size: v.number(), contentType: v.union(v.string(), v.null()), url: v.string() }),
    v.null(),
  ),
  handler: async (ctx, { authId, ticketId, storageId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_authId', q => q.eq('authId', authId))
      .unique();
    const ticket = await ctx.db.get(ticketId);
    const file = await ctx.db.system.get(storageId);
    const url = await ctx.storage.getUrl(storageId);
    return user &&
      ticket?.userId === user._id &&
      file &&
      file._creationTime >= ticket._creationTime &&
      file._creationTime <= ticket.expiresAt &&
      url
      ? { size: file.size, contentType: file.contentType ?? null, url }
      : null;
  },
});

const commitResult = v.union(v.literal('accepted'), v.literal('rejected'), v.literal('invalid'));

export const commitPortrait = internalMutation({
  args: {
    authId: v.string(),
    ticketId: v.id('portraitUploads'),
    storageId: v.id('_storage'),
    image: v.boolean(),
  },
  returns: commitResult,
  handler: async (ctx, { authId, ticketId, storageId, image }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_authId', q => q.eq('authId', authId))
      .unique();
    const ticket = await ctx.db.get(ticketId);
    const file = await ctx.db.system.get(storageId);
    if (
      !user ||
      ticket?.userId !== user._id ||
      ticket.expiresAt < Date.now() ||
      !file ||
      file._creationTime < ticket._creationTime ||
      file._creationTime > ticket.expiresAt
    )
      return 'invalid';

    const existingOwner = await ctx.db
      .query('users')
      .withIndex('by_portrait', q => q.eq('portraitId', storageId))
      .first();
    if (existingOwner && existingOwner._id !== user._id) {
      await ctx.db.delete(ticketId);
      return 'invalid';
    }
    await ctx.db.delete(ticketId);
    if (!image || file.size > MAX_PORTRAIT_BYTES) {
      await ctx.storage.delete(storageId);
      return 'rejected';
    }
    if (user.portraitId && user.portraitId !== storageId) await ctx.storage.delete(user.portraitId);
    await ctx.db.patch(user._id, { portraitId: storageId });
    return 'accepted';
  },
});

/** Validates the stored object before claiming it; rejected uploads are deleted in a mutation. */
export const setPortrait = action({
  args: { ticketId: v.id('portraitUploads'), storageId: v.id('_storage') },
  returns: portraitResult,
  handler: async (ctx, { ticketId, storageId }) => {
    const auth = await authComponent.safeGetAuthUser(ctx);
    if (!auth) throw new ConvexError('Sign in to continue.');
    const file = await ctx.runQuery(internal.account.portraitMetadata, {
      authId: auth._id,
      ticketId,
      storageId,
    });
    if (!file) return { ok: false as const, error: 'That upload expired; choose the file again.' };
    // Real Convex upload metadata includes contentType. convex-test and legacy uploads can omit it,
    // so ask the immutable storage URL rather than trusting a caller-supplied MIME type.
    let contentType = file.contentType;
    if (!contentType) {
      try {
        const response = await fetch(file.url, { method: 'HEAD' });
        contentType = response.headers.get('content-type');
      } catch {
        contentType = null;
      }
    }
    const result = await ctx.runMutation(internal.account.commitPortrait, {
      authId: auth._id,
      ticketId,
      storageId,
      image: Boolean(contentType?.startsWith('image/')),
    });
    if (result === 'invalid')
      return { ok: false as const, error: 'That upload expired; choose the file again.' };
    if (result === 'rejected') return { ok: false as const, error: 'Choose an image under 2 MB.' };
    return { ok: true as const };
  },
});

/**
 * Deletes expired upload tickets and unreferenced storage objects old enough that no live ticket
 * can own them. Portraits are the app's only file-storage purpose; future purposes must add their
 * reference check here before they begin issuing upload URLs.
 */
export const cleanupPortraitUploads = internalMutation({
  args: { before: v.number(), cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { before, cursor }) => {
    const expired = await ctx.db
      .query('portraitUploads')
      .withIndex('by_expiry', q => q.lte('expiresAt', before))
      .take(STORAGE_CLEANUP_PAGE);
    for (const ticket of expired) await ctx.db.delete(ticket._id);

    const files = await ctx.db.system
      .query('_storage')
      .order('asc')
      .paginate({ cursor, numItems: STORAGE_CLEANUP_PAGE });
    for (const file of files.page) {
      if (file._creationTime > before) continue;
      const owner = await ctx.db
        .query('users')
        .withIndex('by_portrait', q => q.eq('portraitId', file._id))
        .first();
      if (!owner) await ctx.storage.delete(file._id);
    }
    if (!files.isDone)
      await ctx.scheduler.runAfter(0, internal.account.cleanupPortraitUploads, {
        before,
        cursor: files.continueCursor,
      });
    return null;
  },
});

export const clearPortrait = mutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    const user = await requireUser(ctx);
    if (!user.portraitId) return null;
    await ctx.storage.delete(user.portraitId);
    await ctx.db.patch(user._id, { portraitId: undefined });
    return null;
  },
});

const device = v.object({
  id: v.string(),
  token: v.string(),
  current: v.boolean(),
  userAgent: v.union(v.string(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
  expiresAt: v.number(),
});

type SessionRow = {
  _id: string;
  token: string;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
  userAgent?: string | null;
};

async function currentSessionId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = (await ctx.auth.getUserIdentity()) as { sessionId?: unknown } | null;
  return typeof identity?.sessionId === 'string' ? identity.sessionId : null;
}

/** One explicit page of sessions; the client follows the cursor and filters expiry on its clock. */
export const devicesPage = query({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({
    page: v.array(device),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, { cursor }) => {
    const user = await requireUser(ctx);
    const current = await currentSessionId(ctx);
    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'session',
      where: [{ field: 'userId', value: user.authId }],
      paginationOpts: { cursor, numItems: DEVICE_PAGE },
    });
    return {
      page: (result.page as unknown as SessionRow[]).map(session => ({
        id: session._id,
        token: session.token,
        current: session._id === current,
        userAgent: session.userAgent ?? null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
      })),
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

/**
 * Removes one bounded page of other sessions. The caller repeats until `done`, so the operation
 * neither inherits Better Auth's default 100-row findMany limit nor risks one oversized mutation.
 */
export const revokeOtherDevices = mutation({
  args: {},
  returns: v.object({ removed: v.number(), done: v.boolean() }),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const current = await currentSessionId(ctx);
    const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: 'session',
      where: [{ field: 'userId', value: user.authId }],
      paginationOpts: { cursor: null, numItems: DEVICE_PAGE },
    });
    const others = (result.page as unknown as SessionRow[]).filter(
      session => session._id !== current,
    );
    for (const session of others)
      await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        input: { model: 'session', where: [{ field: '_id', value: session._id }] },
      });
    return { removed: others.length, done: result.isDone };
  },
});

/** Scheduled by the purge when one transaction's budget was not enough; re-runs the same passes. */
export const continuePurge = internalMutation({
  args: { userId: v.id('users') },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (user) await purgeUser(ctx, user);
    return null;
  },
});
