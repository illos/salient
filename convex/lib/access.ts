import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { authComponent } from '../auth';

export type ReadCtx = QueryCtx | MutationCtx;
export async function requireUser(ctx: ReadCtx): Promise<Doc<'users'>> {
  const auth = await authComponent.safeGetAuthUser(ctx);
  if (!auth) throw new ConvexError('Sign in to continue.');
  const user = await ctx.db
    .query('users')
    .withIndex('by_authId', q => q.eq('authId', auth._id))
    .unique();
  if (!user) throw new ConvexError('Finish account setup first.');
  return user;
}
export async function requireMember(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
  userId: Id<'users'>,
) {
  const campaign = await ctx.db.get(campaignId);
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId).eq('userId', userId))
    .unique();
  if (!campaign || !membership) throw new ConvexError('Campaign unavailable.');
  return campaign;
}
export async function requireOwner(ctx: ReadCtx, campaignId: Id<'campaigns'>, userId: Id<'users'>) {
  const campaign = await requireMember(ctx, campaignId, userId);
  if (campaign.ownerId !== userId) throw new ConvexError('Only the campaign owner can do this.');
  return campaign;
}
// The creator is Director in v0.01. Keep this separate for the future delegation contract.
export async function requireDirector(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
  userId: Id<'users'>,
) {
  return requireOwner(ctx, campaignId, userId);
}
export async function checkMembershipCapacity(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
  userId: Id<'users'>,
) {
  const members = await ctx.db
    .query('memberships')
    .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId))
    .take(100);
  const campaigns = await ctx.db
    .query('memberships')
    .withIndex('by_user', q => q.eq('userId', userId))
    .take(50);
  if (members.length >= 100 || campaigns.length >= 50)
    throw new ConvexError('Prototype membership limit reached (100 members / 50 campaigns).');
}
