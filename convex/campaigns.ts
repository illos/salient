import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUser, requireMember, requireOwner, checkMembershipCapacity } from "./lib/access";
import { command } from "./lib/commands";
import { appendEvent } from "./lib/events";

const summary = v.object({ id: v.id("campaigns"), name: v.string(), ownerId: v.id("users"), activeSessionId: v.union(v.id("sessions"), v.null()) });
const member = v.object({ userId: v.id("users"), displayName: v.string() });
const pending = v.object({ id: v.id("joinRequests"), userId: v.id("users"), displayName: v.string() });
// Convex supplies seeded randomness in mutations; the token is generated only on the server.
function shareCode() { return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join(""); }

export const list = query({ args: {}, returns: v.array(summary), handler: async ctx => {
  const user = await requireUser(ctx);
  const memberships = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", user._id)).take(50);
  const campaigns = await Promise.all(memberships.map(m => ctx.db.get(m.campaignId)));
  return campaigns.flatMap(c => c ? [{ id: c._id, name: c.name, ownerId: c.ownerId, activeSessionId: c.activeSessionId }] : []);
} });
export const create = mutation({ args: { name: v.string(), commandId: v.string() }, returns: v.id("campaigns"), handler: async (ctx, args) => {
  const user = await requireUser(ctx);
  const receipt = await command(ctx, user._id, args.commandId, "campaign.create", args);
  if (receipt.previous) return receipt.previous.result as Id<"campaigns">;
  const name = args.name.trim();
  if (!name || name.length > 100) throw new ConvexError("Campaign name must contain 1–100 characters.");
  const current = await ctx.db.query("memberships").withIndex("by_user", q => q.eq("userId", user._id)).take(50);
  if (current.length >= 50) throw new ConvexError("Prototype limit: 50 campaigns per account.");
  const id = await ctx.db.insert("campaigns", { name, ownerId: user._id, shareCode: shareCode(), activeSessionId: null, eventSequence: 0 });
  await ctx.db.insert("memberships", { campaignId: id, userId: user._id });
  await appendEvent(ctx, id, user, "campaign.created", `Created ${name}.`);
  await receipt.save(id);
  return id;
} });
export const get = query({ args: { campaignId: v.id("campaigns") }, returns: v.object({ ...summary.fields, shareCode: v.union(v.string(), v.null()), members: v.array(member), pendingRequests: v.array(pending) }), handler: async (ctx, { campaignId }) => {
  const user = await requireUser(ctx);
  const campaign = await requireMember(ctx, campaignId, user._id);
  const memberships = await ctx.db.query("memberships").withIndex("by_campaign_user", q => q.eq("campaignId", campaignId)).take(100);
  const members = await Promise.all(memberships.map(async m => ({ userId: m.userId, displayName: (await ctx.db.get(m.userId))?.displayName ?? "Former player" })));
  const requests = campaign.ownerId === user._id ? await ctx.db.query("joinRequests").withIndex("by_campaign_status", q => q.eq("campaignId", campaignId).eq("status", "pending")).take(100) : [];
  const pendingRequests = await Promise.all(requests.map(async r => ({ id: r._id, userId: r.userId, displayName: (await ctx.db.get(r.userId))?.displayName ?? "Former player" })));
  return { id: campaignId, name: campaign.name, ownerId: campaign.ownerId, activeSessionId: campaign.activeSessionId, shareCode: campaign.ownerId === user._id ? campaign.shareCode : null, members, pendingRequests };
} });
export const preview = query({ args: { shareCode: v.string() }, returns: v.union(v.object({ id: v.id("campaigns"), name: v.string(), ownerName: v.string() }), v.null()), handler: async (ctx, args) => {
  if (args.shareCode.length > 100) return null;
  const campaign = await ctx.db.query("campaigns").withIndex("by_shareCode", q => q.eq("shareCode", args.shareCode.trim())).unique();
  if (!campaign) return null;
  return { id: campaign._id, name: campaign.name, ownerName: (await ctx.db.get(campaign.ownerId))?.displayName ?? "Director" };
} });
export const requestJoin = mutation({ args: { shareCode: v.string(), commandId: v.string() }, returns: v.null(), handler: async (ctx, args) => {
  const user = await requireUser(ctx);
  const receipt = await command(ctx, user._id, args.commandId, "campaign.request", args);
  if (receipt.previous) return null;
  const campaign = await ctx.db.query("campaigns").withIndex("by_shareCode", q => q.eq("shareCode", args.shareCode.trim())).unique();
  if (!campaign) throw new ConvexError("Invitation unavailable.");
  const joined = await ctx.db.query("memberships").withIndex("by_campaign_user", q => q.eq("campaignId", campaign._id).eq("userId", user._id)).unique();
  const existing = await ctx.db.query("joinRequests").withIndex("by_campaign_user", q => q.eq("campaignId", campaign._id).eq("userId", user._id)).order("desc").first();
  if (!joined && (!existing || existing.status !== "pending")) {
    const requests = await ctx.db.query("joinRequests").withIndex("by_campaign_status", q => q.eq("campaignId", campaign._id).eq("status", "pending")).take(100);
    if (requests.length >= 100) throw new ConvexError("This campaign has reached the prototype limit of 100 pending requests.");
    await ctx.db.insert("joinRequests", { campaignId: campaign._id, userId: user._id, status: "pending" });
  }
  await receipt.save(null);
  return null;
} });
export const approveRequest = mutation({ args: { requestId: v.id("joinRequests"), commandId: v.string() }, returns: v.null(), handler: async (ctx, args) => {
  const user = await requireUser(ctx);
  const request = await ctx.db.get(args.requestId);
  if (!request) throw new ConvexError("Request unavailable.");
  await requireOwner(ctx, request.campaignId, user._id);
  const receipt = await command(ctx, user._id, args.commandId, "campaign.approve", args);
  if (receipt.previous) return null;
  if (request.status === "declined" || request.status === "withdrawn") throw new ConvexError("This request is no longer pending.");
  const existing = await ctx.db.query("memberships").withIndex("by_campaign_user", q => q.eq("campaignId", request.campaignId).eq("userId", request.userId)).unique();
  if (!existing) {
    if (request.status !== "pending") throw new ConvexError("This request is no longer pending.");
    await checkMembershipCapacity(ctx, request.campaignId, request.userId);
    await ctx.db.insert("memberships", { campaignId: request.campaignId, userId: request.userId });
    await appendEvent(ctx, request.campaignId, user, "membership.approved", `Admitted ${(await ctx.db.get(request.userId))?.displayName ?? "player"}.`);
  }
  await ctx.db.patch(args.requestId, { status: "approved" });
  await receipt.save(null);
  return null;
} });
export const regenerateShareCode = mutation({ args: { campaignId: v.id("campaigns"), commandId: v.string() }, returns: v.string(), handler: async (ctx, args) => {
  const user = await requireUser(ctx);
  await requireOwner(ctx, args.campaignId, user._id);
  const receipt = await command(ctx, user._id, args.commandId, "campaign.rotate", args);
  if (receipt.previous) return receipt.previous.result!;
  const code = shareCode();
  await ctx.db.patch(args.campaignId, { shareCode: code });
  await receipt.save(code);
  return code;
} });
export const myRequests = query({ args: {}, returns: v.array(v.object({ id: v.id("joinRequests"), campaignId: v.id("campaigns"), campaignName: v.string(), status: v.union(v.literal("pending"), v.literal("approved"), v.literal("declined"), v.literal("withdrawn")) })), handler: async ctx => {
  const user = await requireUser(ctx);
  const requests = await ctx.db.query("joinRequests").withIndex("by_user", q => q.eq("userId", user._id)).order("desc").take(50);
  return Promise.all(requests.map(async r => ({ id: r._id, campaignId: r.campaignId, campaignName: (await ctx.db.get(r.campaignId))?.name ?? "Unavailable campaign", status: r.status })));
} });
export const declineRequest = mutation({ args: { requestId: v.id("joinRequests"), commandId: v.string() }, returns: v.null(), handler: async (ctx, args) => {
  const user = await requireUser(ctx);
  const request = await ctx.db.get(args.requestId);
  if (!request) throw new ConvexError("Request unavailable.");
  await requireOwner(ctx, request.campaignId, user._id);
  const receipt = await command(ctx, user._id, args.commandId, "campaign.decline", args);
  if (receipt.previous) return null;
  if (request.status !== "pending") throw new ConvexError("This request is no longer pending.");
  await ctx.db.patch(request._id, { status: "declined" });
  await receipt.save(null);
  return null;
} });
export const withdrawRequest = mutation({ args: { requestId: v.id("joinRequests"), commandId: v.string() }, returns: v.null(), handler: async (ctx, args) => {
  const user = await requireUser(ctx);
  const request = await ctx.db.get(args.requestId);
  if (!request || request.userId !== user._id) throw new ConvexError("Request unavailable.");
  const receipt = await command(ctx, user._id, args.commandId, "campaign.withdraw", args);
  if (receipt.previous) return null;
  if (request.status !== "pending") throw new ConvexError("This request is no longer pending.");
  await ctx.db.patch(request._id, { status: "withdrawn" });
  await receipt.save(null);
  return null;
} });
