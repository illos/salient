import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { v, ConvexError } from 'convex/values';
import { components, internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import authConfig from './auth.config';
import { passwordRecoveryEnabled, RESET_TOKEN_SECONDS } from './lib/accountEmail';

export const authComponent = createClient<DataModel>(components.betterAuth);
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

const profile = v.object({ userId: v.id('users'), displayName: v.string() });
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
    return user ? { userId: user._id, displayName: user.displayName } : null;
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
    if (existing) return { userId: existing._id, displayName: existing.displayName };
    const displayName = auth.name.trim().slice(0, 80) || 'Player';
    const userId = await ctx.db.insert('users', { authId: auth._id, displayName });
    return { userId, displayName };
  },
});

/** Capability only: never exposes provider credentials or account existence. */
export const recoveryAvailable = query({
  args: {},
  returns: v.boolean(),
  handler: async () => passwordRecoveryEnabled(),
});
