import { createClient, type AuthFunctions, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { v, ConvexError } from 'convex/values';
import { components, internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import authConfig from './auth.config';
import { purgeAccount } from './lib/accountDeletion';
import { passwordRecoveryEnabled, RESET_TOKEN_SECONDS } from './lib/accountEmail';

type AuthComponent = ReturnType<typeof createClient<DataModel>>;

export const authComponent: AuthComponent = createClient<DataModel>(components.betterAuth, {
  triggers: {
    user: {
      // The component invokes this inside the mutation that deletes its user row. App data is
      // therefore removed (or a bounded continuation scheduled) as part of the same transition.
      onDelete: async (ctx, user) => {
        await purgeAccount(ctx, user._id);
      },
    },
  },
  // The cast breaks the generated API's auth-module type cycle; runtime references remain exact.
  authFunctions: internal.auth as AuthFunctions,
});
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL!;
  return betterAuth({
    baseURL: process.env.SALIENT_AUTH_BASE_URL ?? process.env.CONVEX_SITE_URL,
    trustedOrigins: [
      siteUrl,
      ...(process.env.ADDITIONAL_TRUSTED_ORIGINS ?? '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean),
    ],
    database: authComponent.adapter(ctx),
    advanced: { disableOriginCheck: false },
    user: {
      changeEmail: { enabled: true, updateEmailWithoutVerification: true },
      deleteUser: { enabled: true },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: RESET_TOKEN_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: passwordRecoveryEnabled()
        ? async ({ user, token }) => {
            if (!('scheduler' in ctx)) throw new Error('Recovery requires an action context.');
            // Queue mail durably instead of waiting for delivery in the public auth response.
            await ctx.scheduler.runAfter(0, internal.accountEmail.sendPasswordReset, {
              email: user.email,
              token,
            });
          }
        : undefined,
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      customRules: {
        // Convex fetches these public verification keys while authenticating API calls.
        // Throttling key discovery rejects valid sessions before app authorization runs.
        '/convex/jwks': false,
        '/request-password-reset': { window: 60, max: 3 },
        '/reset-password': { window: 60, max: 5 },
      },
    },
    plugins: [crossDomain({ siteUrl }), convex({ authConfig })],
  });
};

const profile = v.object({
  userId: v.id('users'),
  displayName: v.string(),
  portraitUrl: v.union(v.string(), v.null()),
});
export const viewer = query({
  args: {},
  returns: v.union(profile, v.null()),
  handler: async ctx => {
    const auth = await authComponent.safeGetAuthUser(ctx);
    if (!auth) return null;
    const user = await ctx.db
      .query('users')
      .withIndex('by_authId', q => q.eq('authId', auth._id))
      .unique();
    return user
      ? {
          userId: user._id,
          displayName: user.displayName,
          portraitUrl: user.portraitId ? await ctx.storage.getUrl(user.portraitId) : null,
        }
      : null;
  },
});
export const ensureProfile = mutation({
  args: {},
  returns: profile,
  handler: async ctx => {
    const auth = await authComponent.safeGetAuthUser(ctx);
    if (!auth) throw new ConvexError('Sign in to continue.');
    const existing = await ctx.db
      .query('users')
      .withIndex('by_authId', q => q.eq('authId', auth._id))
      .unique();
    if (existing)
      return {
        userId: existing._id,
        displayName: existing.displayName,
        portraitUrl: existing.portraitId ? await ctx.storage.getUrl(existing.portraitId) : null,
      };
    const displayName = auth.name.trim().slice(0, 80) || 'Player';
    const userId = await ctx.db.insert('users', { authId: auth._id, displayName });
    return { userId, displayName, portraitUrl: null };
  },
});

/** Capability only: never exposes provider credentials or account existence. */
export const recoveryAvailable = query({
  args: {},
  returns: v.boolean(),
  handler: async () => passwordRecoveryEnabled(),
});
