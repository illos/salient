import { v, ConvexError } from 'convex/values';
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser, requireMember, requireOwner, checkMembershipCapacity } from './lib/access';
import { command } from './lib/commands';
import { appendEvent } from './lib/events';
import { revisionLevel } from './lib/characterProgression';

const summary = v.object({
  id: v.id('campaigns'),
  name: v.string(),
  ownerId: v.id('users'),
  activeSessionId: v.union(v.id('sessions'), v.null()),
});
/** V68 campaign home card: the member's admitted heroes in this campaign, with the effective level. */
const hero = v.object({ id: v.id('characters'), name: v.string(), level: v.number() });
const member = v.object({
  userId: v.id('users'),
  displayName: v.string(),
  portraitUrl: v.union(v.string(), v.null()),
  heroes: v.array(hero),
});
const pending = v.object({
  id: v.id('joinRequests'),
  userId: v.id('users'),
  displayName: v.string(),
});
const shareAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Convex supplies seeded randomness. The indexed read and write share a transaction, so concurrent
// allocations retry on a collision too. Exclude easily confused I/1 and O/0 from spoken codes.
async function shareCode(ctx: MutationCtx) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = Array.from(
      { length: 8 },
      () => shareAlphabet[Math.floor(Math.random() * shareAlphabet.length)],
    ).join('');
    const existing = await ctx.db
      .query('campaigns')
      .withIndex('by_shareCode', q => q.eq('shareCode', code))
      .first();
    if (!existing) return code;
  }
  throw new ConvexError('Could not allocate a share code. Please try again.');
}

function normalizeShareCode(code: string) {
  const trimmed = code.trim();
  return /^[a-z0-9]{1,8}$/i.test(trimmed) ? trimmed.toUpperCase() : null;
}

export const list = query({
  args: {},
  returns: v.array(summary),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .take(50);
    const campaigns = await Promise.all(memberships.map(m => ctx.db.get(m.campaignId)));
    return campaigns.flatMap(c =>
      c
        ? [{ id: c._id, name: c.name, ownerId: c.ownerId, activeSessionId: c.activeSessionId }]
        : [],
    );
  },
});
export const create = mutation({
  args: { name: v.string(), commandId: v.string() },
  returns: v.id('campaigns'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const receipt = await command(ctx, user._id, args.commandId, 'campaign.create', args);
    if (receipt.previous) return receipt.previous.result as Id<'campaigns'>;
    const name = args.name.trim();
    if (!name || name.length > 100)
      throw new ConvexError('Campaign name must contain 1–100 characters.');
    const current = await ctx.db
      .query('memberships')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .take(50);
    if (current.length >= 50) throw new ConvexError('Prototype limit: 50 campaigns per account.');
    const id = await ctx.db.insert('campaigns', {
      name,
      ownerId: user._id,
      shareCode: await shareCode(ctx),
      activeSessionId: null,
      eventSequence: 0,
    });
    await ctx.db.insert('memberships', { campaignId: id, userId: user._id });
    await appendEvent(ctx, {
      campaignId: id,
      origin: 'user',
      actor: user,
      commandId: args.commandId,
      kind: 'campaign.created',
      description: `Created ${name}.`,
    });
    await receipt.save(id);
    return id;
  },
});
export const get = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.object({
    ...summary.fields,
    shareCode: v.union(v.string(), v.null()),
    members: v.array(member),
    pendingRequests: v.array(pending),
    /** V68 header meta: how many sessions exist and when the latest closed one ended. */
    sessionCount: v.number(),
    lastPlayedAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, { campaignId }) => {
    const user = await requireUser(ctx);
    const campaign = await requireMember(ctx, campaignId, user._id);
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId))
      .take(100);
    // Attached characters are admitted ones: admission activates a revision and sets campaignId;
    // a declined submission never gains one. The level is the effective revision's; a character
    // without an effective revision is not admitted and is not listed (no default level).
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .take(100);
    const heroes = (
      await Promise.all(
        characters.map(async character => {
          const effective = character.effectiveRevisionId
            ? await ctx.db.get(character.effectiveRevisionId)
            : null;
          if (!effective) return null;
          return {
            id: character._id,
            ownerId: character.ownerId,
            name: character.authored.name,
            level: revisionLevel(effective),
          };
        }),
      )
    ).filter(hero => hero !== null);
    const members = await Promise.all(
      memberships.map(async m => {
        const profile = await ctx.db.get(m.userId);
        return {
          userId: m.userId,
          displayName: profile?.displayName ?? 'Former player',
          portraitUrl: profile?.portraitId ? await ctx.storage.getUrl(profile.portraitId) : null,
          heroes: heroes
            .filter(h => h.ownerId === m.userId)
            .map(({ id, name, level }) => ({ id, name, level })),
        };
      }),
    );
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .order('desc')
      .take(50);
    const lastPlayedAt =
      sessions.find(s => s.status === 'closed' && s.closedAt !== null)?.closedAt ?? null;
    const requests =
      campaign.ownerId === user._id
        ? await ctx.db
            .query('joinRequests')
            .withIndex('by_campaign_status', q =>
              q.eq('campaignId', campaignId).eq('status', 'pending'),
            )
            .take(100)
        : [];
    const pendingRequests = await Promise.all(
      requests.map(async r => ({
        id: r._id,
        userId: r.userId,
        displayName: (await ctx.db.get(r.userId))?.displayName ?? 'Former player',
      })),
    );
    return {
      id: campaignId,
      name: campaign.name,
      ownerId: campaign.ownerId,
      activeSessionId: campaign.activeSessionId,
      shareCode: campaign.ownerId === user._id ? campaign.shareCode : null,
      members,
      pendingRequests,
      sessionCount: sessions.length,
      lastPlayedAt,
    };
  },
});
export const preview = query({
  args: { shareCode: v.string() },
  returns: v.union(
    v.object({ id: v.id('campaigns'), name: v.string(), ownerName: v.string() }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const code = normalizeShareCode(args.shareCode);
    if (!code) return null;
    const campaign = await ctx.db
      .query('campaigns')
      .withIndex('by_shareCode', q => q.eq('shareCode', code))
      .unique();
    if (!campaign) return null;
    return {
      id: campaign._id,
      name: campaign.name,
      ownerName: (await ctx.db.get(campaign.ownerId))?.displayName ?? 'Director',
    };
  },
});
export const requestJoin = mutation({
  args: { shareCode: v.string(), commandId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const receipt = await command(ctx, user._id, args.commandId, 'campaign.request', args);
    if (receipt.previous) return null;
    const code = normalizeShareCode(args.shareCode);
    if (!code) throw new ConvexError('Invitation unavailable.');
    const campaign = await ctx.db
      .query('campaigns')
      .withIndex('by_shareCode', q => q.eq('shareCode', code))
      .unique();
    if (!campaign) throw new ConvexError('Invitation unavailable.');
    const joined = await ctx.db
      .query('memberships')
      .withIndex('by_campaign_user', q => q.eq('campaignId', campaign._id).eq('userId', user._id))
      .unique();
    const existing = await ctx.db
      .query('joinRequests')
      .withIndex('by_campaign_user', q => q.eq('campaignId', campaign._id).eq('userId', user._id))
      .order('desc')
      .first();
    if (!joined && (!existing || existing.status !== 'pending')) {
      const requests = await ctx.db
        .query('joinRequests')
        .withIndex('by_campaign_status', q =>
          q.eq('campaignId', campaign._id).eq('status', 'pending'),
        )
        .take(100);
      if (requests.length >= 100)
        throw new ConvexError(
          'This campaign has reached the prototype limit of 100 pending requests.',
        );
      await ctx.db.insert('joinRequests', {
        campaignId: campaign._id,
        userId: user._id,
        status: 'pending',
      });
    }
    await receipt.save(null);
    return null;
  },
});
export const approveRequest = mutation({
  args: { requestId: v.id('joinRequests'), commandId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new ConvexError('Request unavailable.');
    await requireOwner(ctx, request.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'campaign.approve', args);
    if (receipt.previous) return null;
    if (request.status === 'declined' || request.status === 'withdrawn')
      throw new ConvexError('This request is no longer pending.');
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_campaign_user', q =>
        q.eq('campaignId', request.campaignId).eq('userId', request.userId),
      )
      .unique();
    if (!existing) {
      if (request.status !== 'pending') throw new ConvexError('This request is no longer pending.');
      await checkMembershipCapacity(ctx, request.campaignId, request.userId);
      await ctx.db.insert('memberships', {
        campaignId: request.campaignId,
        userId: request.userId,
      });
      await appendEvent(ctx, {
        campaignId: request.campaignId,
        origin: 'user',
        actor: user,
        commandId: args.commandId,
        kind: 'membership.approved',
        description: `Admitted ${(await ctx.db.get(request.userId))?.displayName ?? 'player'}.`,
      });
    }
    await ctx.db.patch(args.requestId, { status: 'approved' });
    await receipt.save(null);
    return null;
  },
});
export const regenerateShareCode = mutation({
  args: { campaignId: v.id('campaigns'), commandId: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOwner(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'campaign.rotate', args);
    if (receipt.previous) return receipt.previous.result!;
    const code = await shareCode(ctx);
    await ctx.db.patch(args.campaignId, { shareCode: code });
    await receipt.save(code);
    return code;
  },
});
/** One-time development upgrade. Repeat with the returned cursor until done; reruns are safe. */
export const upgradeShareCodes = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({ cursor: v.string(), done: v.boolean(), updated: v.number() }),
  handler: async (ctx, { cursor }) => {
    const batch = await ctx.db
      .query('campaigns')
      .withIndex('by_creation_time')
      .paginate({ cursor, numItems: 100 });
    let updated = 0;
    for (const campaign of batch.page) {
      if (/^[A-Z0-9]{1,8}$/.test(campaign.shareCode)) continue;
      await ctx.db.patch(campaign._id, { shareCode: await shareCode(ctx) });
      updated++;
    }
    return { cursor: batch.continueCursor, done: batch.isDone, updated };
  },
});
export const myRequests = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id('joinRequests'),
      campaignId: v.id('campaigns'),
      campaignName: v.string(),
      status: v.union(
        v.literal('pending'),
        v.literal('approved'),
        v.literal('declined'),
        v.literal('withdrawn'),
      ),
    }),
  ),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const requests = await ctx.db
      .query('joinRequests')
      .withIndex('by_user', q => q.eq('userId', user._id))
      .order('desc')
      .take(50);
    return Promise.all(
      requests.map(async r => ({
        id: r._id,
        campaignId: r.campaignId,
        campaignName: (await ctx.db.get(r.campaignId))?.name ?? 'Unavailable campaign',
        status: r.status,
      })),
    );
  },
});
export const declineRequest = mutation({
  args: { requestId: v.id('joinRequests'), commandId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new ConvexError('Request unavailable.');
    await requireOwner(ctx, request.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'campaign.decline', args);
    if (receipt.previous) return null;
    if (request.status !== 'pending') throw new ConvexError('This request is no longer pending.');
    await ctx.db.patch(request._id, { status: 'declined' });
    await receipt.save(null);
    return null;
  },
});
export const withdrawRequest = mutation({
  args: { requestId: v.id('joinRequests'), commandId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.userId !== user._id) throw new ConvexError('Request unavailable.');
    const receipt = await command(ctx, user._id, args.commandId, 'campaign.withdraw', args);
    if (receipt.previous) return null;
    if (request.status !== 'pending') throw new ConvexError('This request is no longer pending.');
    await ctx.db.patch(request._id, { status: 'withdrawn' });
    await receipt.save(null);
    return null;
  },
});
