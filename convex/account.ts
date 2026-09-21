// SPDX-License-Identifier: GPL-3.0-only
/**
 * V95 account screen (docs/accounts-and-access-spec.md#accounts-and-administration): the profile
 * other players see (display name, portrait), the signed-in devices, and the scheduled
 * continuation of an account purge. Credentials go through Better Auth's own routes from
 * web/account (change-email, change-password, delete-user); the deletion trigger that purges
 * app data lives in convex/auth.ts and convex/lib/accountDeletion.ts.
 */
import { v, ConvexError } from 'convex/values';
import { components, internal } from './_generated/api';
import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { authComponent } from './auth';
import { requireUser } from './lib/access';
import { purgeUser } from './lib/accountDeletion';

export const MAX_DISPLAY_NAME = 80;
export const MAX_PORTRAIT_BYTES = 2 * 1024 * 1024;

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

/** A one-shot URL the browser posts the image file to; `setPortrait` then claims the upload. */
export const portraitUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async ctx => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

const portraitResult = v.union(
  v.object({ ok: v.literal(true) }),
  v.object({ ok: v.literal(false), error: v.string() }),
);

export const portraitMetadata = internalQuery({
  args: { storageId: v.id('_storage') },
  returns: v.union(
    v.object({ size: v.number(), contentType: v.union(v.string(), v.null()), url: v.string() }),
    v.null(),
  ),
  handler: async (ctx, { storageId }) => {
    const file = await ctx.db.system.get(storageId);
    const url = await ctx.storage.getUrl(storageId);
    return file && url ? { size: file.size, contentType: file.contentType ?? null, url } : null;
  },
});

export const commitPortrait = internalMutation({
  args: { authId: v.string(), storageId: v.id('_storage'), accepted: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { authId, storageId, accepted }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_authId', q => q.eq('authId', authId))
      .unique();
    if (!user) {
      await ctx.storage.delete(storageId);
      return null;
    }
    if (!accepted) {
      await ctx.storage.delete(storageId);
      return null;
    }
    if (user.portraitId && user.portraitId !== storageId) await ctx.storage.delete(user.portraitId);
    await ctx.db.patch(user._id, { portraitId: storageId });
    return null;
  },
});

/** Validates the stored object before claiming it; rejected uploads are deleted in a mutation. */
export const setPortrait = action({
  args: { storageId: v.id('_storage') },
  returns: portraitResult,
  handler: async (ctx, { storageId }) => {
    const auth = await authComponent.safeGetAuthUser(ctx);
    if (!auth) throw new ConvexError('Sign in to continue.');
    const file = await ctx.runQuery(internal.account.portraitMetadata, { storageId });
    if (!file) return { ok: false as const, error: 'The upload did not finish; try again.' };
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
    const accepted = file.size <= MAX_PORTRAIT_BYTES && Boolean(contentType?.startsWith('image/'));
    await ctx.runMutation(internal.account.commitPortrait, {
      authId: auth._id,
      storageId,
      accepted,
    });
    if (!accepted) return { ok: false as const, error: 'Choose an image under 2 MB.' };
    return { ok: true as const };
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
  current: v.boolean(),
  userAgent: v.union(v.string(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
  expiresAt: v.number(),
});

type SessionRow = {
  _id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
  userAgent?: string | null;
};

/** The Better Auth sessions of one auth user, read through the component adapter. */
async function sessionsOf(ctx: QueryCtx | MutationCtx, authId: string): Promise<SessionRow[]> {
  const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: 'session',
    where: [{ field: 'userId', value: authId }],
    paginationOpts: { cursor: null, numItems: 200 },
  });
  return result.page as unknown as SessionRow[];
}

/** The session claim Better Auth's Convex plugin places in the identity; untyped by Convex. */
async function currentSessionId(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = (await ctx.auth.getUserIdentity()) as { sessionId?: unknown } | null;
  return typeof identity?.sessionId === 'string' ? identity.sessionId : null;
}

/** Signed-in devices (live sessions) of the viewer, the current one first. */
export const devices = query({
  args: {},
  returns: v.array(device),
  handler: async ctx => {
    const auth = await authComponent.safeGetAuthUser(ctx);
    if (!auth) return [];
    const current = await currentSessionId(ctx);
    const now = Date.now();
    return (await sessionsOf(ctx, auth._id))
      .filter(s => s.expiresAt > now)
      .map(s => ({
        id: s._id,
        current: s._id === current,
        userAgent: s.userAgent ?? null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        expiresAt: s.expiresAt,
      }))
      .sort((a, b) => (a.current === b.current ? b.updatedAt - a.updatedAt : a.current ? -1 : 1));
  },
});

async function deleteSession(ctx: MutationCtx, sessionId: string) {
  await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
    input: { model: 'session', where: [{ field: '_id', value: sessionId }] },
  });
}

/** Signs one other device out; the current device signs out through Better Auth's sign-out. */
export const revokeDevice = mutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const user = await requireUser(ctx);
    if ((await currentSessionId(ctx)) === sessionId)
      throw new ConvexError('Use Sign out to leave this device.');
    const session = (await sessionsOf(ctx, user.authId)).find(s => s._id === sessionId);
    if (!session) throw new ConvexError('That device is no longer signed in.');
    await deleteSession(ctx, sessionId);
    return null;
  },
});

export const revokeOtherDevices = mutation({
  args: {},
  returns: v.number(),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const current = await currentSessionId(ctx);
    const others = (await sessionsOf(ctx, user.authId)).filter(s => s._id !== current);
    for (const session of others) await deleteSession(ctx, session._id);
    return others.length;
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
