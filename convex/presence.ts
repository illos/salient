// SPDX-License-Identifier: GPL-3.0-only
/**
 * V68 connected-member presence (docs/table-spec.md#2-participation-and-presence). Clients on
 * campaign surfaces send `heartbeat` on mount and every HEARTBEAT_MS, and `leave` on unmount; a
 * member is online while their last heartbeat is fresher than ONLINE_WINDOW_MS. Presence grants
 * nothing: it selects no participant, changes no session state and creates no game-log entry.
 * The freshness threshold is an implementation choice recorded here; the spec leaves it open.
 */
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser, requireMember } from './lib/access';

export const HEARTBEAT_MS = 30_000;
export const ONLINE_WINDOW_MS = 90_000;

export const heartbeat = mutation({
  args: { campaignId: v.id('campaigns') },
  returns: v.null(),
  handler: async (ctx, { campaignId }) => {
    const user = await requireUser(ctx);
    await requireMember(ctx, campaignId, user._id);
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId).eq('userId', user._id))
      .unique();
    const lastSeenAt = Date.now();
    if (existing) await ctx.db.patch(existing._id, { lastSeenAt });
    else await ctx.db.insert('presence', { campaignId, userId: user._id, lastSeenAt });
    return null;
  },
});

export const leave = mutation({
  args: { campaignId: v.id('campaigns') },
  returns: v.null(),
  handler: async (ctx, { campaignId }) => {
    const user = await requireUser(ctx);
    await requireMember(ctx, campaignId, user._id);
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId).eq('userId', user._id))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

/** Member ids seen within the online window, for the campaign home cards and the chat header. */
export const list = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.array(v.id('users')),
  handler: async (ctx, { campaignId }) => {
    const user = await requireUser(ctx);
    await requireMember(ctx, campaignId, user._id);
    const cutoff = Date.now() - ONLINE_WINDOW_MS;
    const rows = await ctx.db
      .query('presence')
      .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId))
      .take(200);
    return rows.filter(row => row.lastSeenAt >= cutoff).map(row => row.userId);
  },
});
