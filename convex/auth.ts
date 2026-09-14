import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { v, ConvexError } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import authConfig from "./auth.config";

export const authComponent = createClient<DataModel>(components.betterAuth);
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL!;
  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [siteUrl, ...(process.env.ADDITIONAL_TRUSTED_ORIGINS ?? '').split(',').map(origin => origin.trim()).filter(Boolean)],
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    plugins: [crossDomain({ siteUrl }), convex({ authConfig })],
  });
};

const profile = v.object({ userId: v.id("users"), displayName: v.string() });
export const viewer = query({
  args: {}, returns: v.union(profile, v.null()),
  handler: async (ctx) => {
    const auth = await authComponent.safeGetAuthUser(ctx);
    if (!auth) return null;
    const user = await ctx.db.query("users").withIndex("by_authId", q => q.eq("authId", auth._id)).unique();
    return user ? { userId: user._id, displayName: user.displayName } : null;
  },
});
export const ensureProfile = mutation({
  args: {}, returns: profile,
  handler: async (ctx) => {
    const auth = await authComponent.safeGetAuthUser(ctx);
    if (!auth) throw new ConvexError("Sign in to continue.");
    const existing = await ctx.db.query("users").withIndex("by_authId", q => q.eq("authId", auth._id)).unique();
    if (existing) return { userId: existing._id, displayName: existing.displayName };
    const displayName = auth.name.trim().slice(0, 80) || "Player";
    const userId = await ctx.db.insert("users", { authId: auth._id, displayName });
    return { userId, displayName };
  },
});
