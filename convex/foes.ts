// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireDirector, requireMember, requireUser, type ReadCtx } from "./lib/access";
import { command } from "./lib/commands";
import { appendEvent } from "./lib/events";
import warrior from "../shared/goblin-warrior.json";

const sourceSnapshot = JSON.stringify(warrior);
async function settings(ctx: ReadCtx, campaignId: Id<"campaigns">) {
  return ctx.db.query("foeSettings").withIndex("by_campaign", q => q.eq("campaignId", campaignId)).unique();
}
async function scopedFoe(ctx: ReadCtx, campaignId: Id<"campaigns">, foeId: Id<"foes">) {
  const foe = await ctx.db.get(foeId);
  if (!foe || foe.campaignId !== campaignId) throw new ConvexError("Foe unavailable.");
  return foe;
}
const peerRow = v.object({ id: v.id("foes"), name: v.string(), healthFraction: v.number() });
const directorRow = v.object({ id: v.id("foes"), name: v.string(), healthFraction: v.number(), visible: v.boolean(), stamina: v.number(), maxStamina: v.number() });
export const list = query({
  args: { campaignId: v.id("campaigns") },
  returns: v.object({ director: v.boolean(), addVisible: v.union(v.boolean(), v.null()), rows: v.array(v.union(directorRow, peerRow)) }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await requireMember(ctx, args.campaignId, user._id);
    const director = campaign.ownerId === user._id;
    const rows = director
      ? await ctx.db.query("foes").withIndex("by_campaign", q => q.eq("campaignId", args.campaignId)).take(100)
      : await ctx.db.query("foes").withIndex("by_campaign_visible", q => q.eq("campaignId", args.campaignId).eq("visible", true)).take(100);
    return { director, addVisible: director ? (await settings(ctx, args.campaignId))?.addVisible ?? false : null,
      rows: rows.map(foe => {
        const base = { id: foe._id, name: foe.name, healthFraction: Math.max(0, Math.min(1, foe.live.stamina / foe.maxStamina)) };
        return director ? { ...base, visible: foe.visible, stamina: foe.live.stamina, maxStamina: foe.maxStamina } : base;
      }) };
  },
});
export const catalog = query({
  args: { campaignId: v.id("campaigns") }, returns: v.object({ definitionId: v.string(), name: v.string(), sourceSnapshot: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    return { definitionId: warrior.source.id, name: warrior.name, sourceSnapshot };
  },
});
export const detail = query({
  args: { campaignId: v.id("campaigns"), foeId: v.id("foes") }, returns: v.object({ name: v.string(), sourceSnapshot: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const foe = await scopedFoe(ctx, args.campaignId, args.foeId);
    return { name: foe.name, sourceSnapshot: foe.sourceSnapshot };
  },
});
export const add = mutation({
  args: { campaignId: v.id("campaigns"), definitionId: v.string(), commandId: v.string() }, returns: v.id("foes"),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, "foes.add", args);
    if (receipt.previous) return receipt.previous.result as Id<"foes">;
    if (args.definitionId !== warrior.source.id) throw new ConvexError("This foe definition is not available in the prototype.");
    const existing = await ctx.db.query("foes").withIndex("by_campaign", q => q.eq("campaignId", args.campaignId)).take(100);
    if (existing.length >= 100) throw new ConvexError("Prototype roster limit of 100 foes reached.");
    const visible = (await settings(ctx, args.campaignId))?.addVisible ?? false;
    const foeId = await ctx.db.insert("foes", { campaignId: args.campaignId, name: warrior.name, visible,
      sourceSnapshot, maxStamina: warrior.baseline.maxStamina,
      live: { stamina: warrior.initialLive.stamina, temporaryStamina: warrior.initialLive.temporaryStamina } });
    await appendEvent(ctx, args.campaignId, user, "foe-added", `${warrior.name} added to the foes roster.`);
    await receipt.save(foeId);
    return foeId;
  },
});
export const remove = mutation({
  args: { campaignId: v.id("campaigns"), foeId: v.id("foes"), commandId: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, "foes.remove", args);
    if (receipt.previous) return null;
    const foe = await scopedFoe(ctx, args.campaignId, args.foeId);
    await ctx.db.delete(foe._id);
    await appendEvent(ctx, args.campaignId, user, "foe-removed", `${foe.name} removed from the foes roster.`);
    await receipt.save(null);
    return null;
  },
});
export const setVisible = mutation({
  args: { campaignId: v.id("campaigns"), foeId: v.id("foes"), visible: v.boolean(), commandId: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, "foes.setVisible", args);
    if (receipt.previous) return null;
    const foe = await scopedFoe(ctx, args.campaignId, args.foeId);
    await ctx.db.patch(foe._id, { visible: args.visible });
    await appendEvent(ctx, args.campaignId, user, "foe-visibility", `${foe.name} ${args.visible ? "shown on" : "hidden from"} the player roster.`);
    await receipt.save(null);
    return null;
  },
});
export const setDefaultVisible = mutation({
  args: { campaignId: v.id("campaigns"), visible: v.boolean(), commandId: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, "foes.setDefaultVisible", args);
    if (receipt.previous) return null;
    const current = await settings(ctx, args.campaignId);
    if (current) await ctx.db.patch(current._id, { addVisible: args.visible });
    else await ctx.db.insert("foeSettings", { campaignId: args.campaignId, addVisible: args.visible });
    await receipt.save(null);
    return null;
  },
});
