import { v, ConvexError } from 'convex/values';
import { query } from './_generated/server';
import { requireUser, requireMember } from './lib/access';
import { projectEvent } from './lib/audience';
import { dieResult, eventDisposition, eventOrigin } from './encounterTables';

export const list = query({
  args: {
    campaignId: v.id('campaigns'),
    sessionId: v.optional(v.id('sessions')),
    before: v.optional(v.number()),
  },
  returns: v.object({
    events: v.array(
      v.object({
        id: v.id('events'),
        sequence: v.number(),
        sessionId: v.union(v.id('sessions'), v.null()),
        encounterId: v.union(v.id('encounters'), v.null()),
        origin: eventOrigin,
        actorName: v.union(v.string(), v.null()),
        commandId: v.string(),
        causeEventId: v.union(v.id('events'), v.null()),
        disposition: eventDisposition,
        kind: v.string(),
        description: v.string(),
        dice: v.optional(v.array(dieResult)),
        payload: v.optional(v.any()),
        createdAt: v.number(),
      }),
    ),
    nextBefore: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await requireMember(ctx, args.campaignId, user._id);
    if (args.before !== undefined && (!Number.isSafeInteger(args.before) || args.before < 1))
      throw new ConvexError('Invalid history cursor.');
    if (args.sessionId) {
      const session = await ctx.db.get(args.sessionId);
      if (!session || session.campaignId !== args.campaignId)
        throw new ConvexError('Session unavailable.');
    }
    const before = args.before ?? Number.MAX_SAFE_INTEGER;
    const rows = args.sessionId
      ? await ctx.db
          .query('events')
          .withIndex('by_session_sequence', q =>
            q.eq('sessionId', args.sessionId!).lt('sequence', before),
          )
          .order('desc')
          .take(51)
      : await ctx.db
          .query('events')
          .withIndex('by_campaign_sequence', q =>
            q.eq('campaignId', args.campaignId).lt('sequence', before),
          )
          .order('desc')
          .take(51);
    const page = rows.slice(0, 50);
    return {
      events: page.map(e => {
        const projected = projectEvent(e, campaign, campaign.ownerId === user._id);
        return {
          id: e._id,
          sequence: e.sequence,
          sessionId: e.sessionId,
          encounterId: e.encounterId,
          origin: e.origin,
          actorName: e.actorName ?? null,
          commandId: e.commandId,
          causeEventId: e.causeEventId,
          disposition: e.disposition,
          kind: e.kind,
          description: projected.description,
          ...(e.dice ? { dice: e.dice } : {}),
          ...(projected.payload === undefined ? {} : { payload: projected.payload }),
          createdAt: e.createdAt,
        };
      }),
      nextBefore: rows.length > 50 ? page[49]!.sequence : null,
    };
  },
});
