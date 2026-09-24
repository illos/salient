import { v, ConvexError } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser, requireMember, requireDirector, type ReadCtx } from './lib/access';
import { command } from './lib/commands';
import { appendEvent } from './lib/events';
import { combatActive, currentEncounter } from './lib/encounters';
import { encounterStatus } from './encounterTables';
import { voidEncounter } from './lib/closeoutOperations';

const sessionValue = v.object({
  id: v.id('sessions'),
  campaignId: v.id('campaigns'),
  status: v.union(v.literal('running'), v.literal('paused'), v.literal('closed')),
  revision: v.number(),
  selectedPlayerIds: v.array(v.id('users')),
  /** The current encounter run, if any. Combat locks apply while its status is `committed`. */
  encounter: v.union(v.object({ id: v.id('encounters'), status: encounterStatus }), v.null()),
  startedAt: v.number(),
  closedAt: v.union(v.number(), v.null()),
  /** V68: the Director's optional title (docs/table-spec.md#reading-session-history); null when untitled. */
  title: v.union(v.string(), v.null()),
  /** Position from the campaign's oldest session, so the header and history read `Session n`. */
  number: v.number(),
});
const MAX_TITLE = 100;
/** Oldest first, bounded like `list`; the position of `s` among them is its number. */
async function sessionNumber(ctx: ReadCtx, s: Doc<'sessions'>, ordered?: Doc<'sessions'>[]) {
  const sessions =
    ordered ??
    (await ctx.db
      .query('sessions')
      .withIndex('by_campaign', q => q.eq('campaignId', s.campaignId))
      .order('desc')
      .take(50));
  const index = sessions.findIndex(row => row._id === s._id);
  return index < 0 ? sessions.length + 1 : sessions.length - index;
}
async function project(ctx: ReadCtx, s: Doc<'sessions'>, ordered?: Doc<'sessions'>[]) {
  const encounter = await currentEncounter(ctx, s);
  return {
    id: s._id,
    campaignId: s.campaignId,
    status: s.status,
    revision: s.revision,
    selectedPlayerIds: s.selectedPlayerIds,
    encounter: encounter ? { id: encounter._id, status: encounter.status } : null,
    startedAt: s.startedAt,
    closedAt: s.closedAt,
    title: s.title ?? null,
    number: await sessionNumber(ctx, s, ordered),
  };
}
function normalizeTitle(title: string | undefined): string | undefined {
  const trimmed = title?.trim() ?? '';
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > MAX_TITLE)
    throw new ConvexError(`Session titles are limited to ${MAX_TITLE} characters.`);
  return trimmed;
}
async function validatePlayers(ctx: MutationCtx, campaignId: Id<'campaigns'>, ids: Id<'users'>[]) {
  if (ids.length > 24 || new Set(ids).size !== ids.length)
    throw new ConvexError('Select up to 24 distinct campaign members.');
  for (const id of ids) await requireMember(ctx, campaignId, id);
}
function checkRevision(session: Doc<'sessions'>, expected: number) {
  if (session.status === 'closed')
    throw new ConvexError('Closed sessions are permanently read-only.');
  if (session.revision !== expected)
    throw new ConvexError('Session changed. Refresh and try again.');
}
export const list = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.array(sessionValue),
  handler: async (ctx, { campaignId }) => {
    const user = await requireUser(ctx);
    await requireMember(ctx, campaignId, user._id);
    const ordered = await ctx.db
      .query('sessions')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .order('desc')
      .take(50);
    return Promise.all(ordered.map(s => project(ctx, s, ordered)));
  },
});
export const get = query({
  args: { sessionId: v.id('sessions') },
  returns: sessionValue,
  handler: async (ctx, { sessionId }) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(sessionId);
    if (!session) throw new ConvexError('Session unavailable.');
    await requireMember(ctx, session.campaignId, user._id);
    return project(ctx, session);
  },
});
export const start = mutation({
  args: {
    campaignId: v.id('campaigns'),
    selectedPlayerIds: v.array(v.id('users')),
    /** V68 optional title; blank is untitled. */
    title: v.optional(v.string()),
    commandId: v.string(),
  },
  returns: v.id('sessions'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'session.start', args);
    if (receipt.previous) return receipt.previous.result as Id<'sessions'>;
    if (campaign.activeSessionId)
      throw new ConvexError('This campaign already has an active session, including pauses.');
    await validatePlayers(ctx, args.campaignId, args.selectedPlayerIds);
    const title = normalizeTitle(args.title);
    const id = await ctx.db.insert('sessions', {
      campaignId: args.campaignId,
      status: 'running',
      revision: 0,
      selectedPlayerIds: args.selectedPlayerIds,
      encounterId: null,
      startedAt: Date.now(),
      closedAt: null,
      ...(title === undefined ? {} : { title }),
    });
    await ctx.db.patch(campaign._id, { activeSessionId: id });
    await appendEvent(ctx, {
      campaignId: campaign._id,
      sessionId: id,
      origin: 'user',
      actor: user,
      commandId: args.commandId,
      kind: 'session.started',
      description: 'Started a session.',
    });
    await receipt.save(id);
    return id;
  },
});
export const transition = mutation({
  args: {
    sessionId: v.id('sessions'),
    expectedRevision: v.number(),
    action: v.union(v.literal('pause'), v.literal('resume'), v.literal('close')),
    voidMode: v.optional(v.union(v.literal('keep'), v.literal('reset'))),
    expectedEncounterId: v.optional(v.id('encounters')),
    commandId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new ConvexError('Session unavailable.');
    const campaign = await requireDirector(ctx, session.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'session.transition', args);
    if (receipt.previous) return null;
    checkRevision(session, args.expectedRevision);
    if (campaign.activeSessionId !== session._id)
      throw new ConvexError('Session is no longer active.');
    if (args.action === 'pause' && session.status !== 'running')
      throw new ConvexError('Only a running session can pause.');
    if (args.action === 'resume' && session.status !== 'paused')
      throw new ConvexError('Only a paused session can resume.');
    // V165 (docs/table-spec.md#respite-mode): a session cannot close while a respite is open.
    if (args.action === 'close' && session.respite)
      throw new ConvexError(
        'A respite is open. Complete, interrupt or cancel it before closing the session.',
      );
    if (args.voidMode && args.action !== 'close')
      throw new ConvexError('A Void choice applies only when closing the session.');
    const encounter = await currentEncounter(ctx, session);
    if (args.expectedEncounterId && encounter?._id !== args.expectedEncounterId)
      throw new ConvexError('The encounter changed. Review the current session before closing it.');
    if (args.action === 'close' && encounter?.status === 'committed') {
      if (!args.voidMode)
        throw new ConvexError('Closing active combat requires a Void choice: keep or reset.');
      const eventId = await appendEvent(ctx, {
        campaignId: campaign._id,
        sessionId: session._id,
        encounterId: encounter._id,
        origin: 'user',
        actor: user,
        commandId: args.commandId,
        kind: 'combat.voided',
        description: `Voided combat before closing the session; ${args.voidMode === 'keep' ? 'kept current state' : 'restored starting state'}.`,
        payload: { mode: args.voidMode },
      });
      await voidEncounter(ctx, { campaignId: campaign._id, eventId }, encounter, args.voidMode);
    }
    const status =
      args.action === 'pause' ? 'paused' : args.action === 'resume' ? 'running' : 'closed';
    // Append closure before setting closed: the event helper never permits later history writes.
    await appendEvent(ctx, {
      campaignId: campaign._id,
      sessionId: session._id,
      origin: 'user',
      actor: user,
      commandId: args.commandId,
      kind: `session.${status}`,
      description: `${args.action === 'pause' ? 'Paused' : args.action === 'resume' ? 'Resumed' : 'Closed'} the session.`,
    });
    await ctx.db.patch(session._id, {
      status,
      revision: session.revision + 1,
      closedAt: status === 'closed' ? Date.now() : null,
    });
    if (status === 'closed') await ctx.db.patch(campaign._id, { activeSessionId: null });
    await receipt.save(null);
    return null;
  },
});
export const setPlayers = mutation({
  args: {
    sessionId: v.id('sessions'),
    expectedRevision: v.number(),
    selectedPlayerIds: v.array(v.id('users')),
    commandId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new ConvexError('Session unavailable.');
    const campaign = await requireDirector(ctx, session.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'session.players', args);
    if (receipt.previous) return null;
    checkRevision(session, args.expectedRevision);
    if (campaign.activeSessionId !== session._id)
      throw new ConvexError('Session is no longer active.');
    if (session.status === 'paused')
      throw new ConvexError('The session is paused; resume before changing the party roster.');
    if (await combatActive(ctx, session))
      throw new ConvexError('Combat locks the party roster. End or void combat first.');
    await validatePlayers(ctx, campaign._id, args.selectedPlayerIds);
    await ctx.db.patch(session._id, {
      selectedPlayerIds: args.selectedPlayerIds,
      revision: session.revision + 1,
    });
    const names = await Promise.all(
      args.selectedPlayerIds.map(async id => (await ctx.db.get(id))?.displayName ?? 'Player'),
    );
    await appendEvent(ctx, {
      campaignId: campaign._id,
      sessionId: session._id,
      origin: 'user',
      actor: user,
      commandId: args.commandId,
      kind: 'session.players',
      description: `Selected players: ${names.join(', ') || 'none'}.`,
    });
    await receipt.save(null);
    return null;
  },
});
/**
 * V68: the Director titles a session (docs/table-spec.md#reading-session-history). The title is
 * campaign metadata, not session history, so it may be set on a closed session too; it bumps no
 * revision and appends no event. Blank clears the title.
 */
export const setTitle = mutation({
  args: { sessionId: v.id('sessions'), title: v.string(), commandId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new ConvexError('Session unavailable.');
    await requireDirector(ctx, session.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'session.title', args);
    if (receipt.previous) return null;
    const title = normalizeTitle(args.title);
    await ctx.db.patch(session._id, { title });
    await receipt.save(null);
    return null;
  },
});
