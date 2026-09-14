// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pending interactions for cards and headless callers: list and inspect them, answer or close them.
 * `respond` is the same code path the `/card respond` slash command uses (convex/lib/interactions.ts).
 * Owning specification: docs/table-command-spec.md#results-and-pending-interactions.
 */
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireUser } from './lib/access';
import { mayAnswer } from './lib/interactions';
import { invoke, tableContext, type TableContext } from './lib/registry';
import type { CommandEnvelope } from '../shared/commands/envelope';

const status = v.union(v.literal('awaiting-input'), v.literal('resolved'), v.literal('closed'));
const projection = v.object({
  id: v.id('interactions'),
  sessionId: v.union(v.id('sessions'), v.null()),
  status,
  kind: v.string(),
  operation: v.string(),
  actorLabel: v.union(v.string(), v.null()),
  requesterName: v.string(),
  requiredInputs: v.array(
    v.object({
      name: v.string(),
      type: v.string(),
      required: v.boolean(),
      description: v.string(),
    }),
  ),
  revision: v.number(),
  openedEventId: v.id('events'),
  resolvedEventId: v.union(v.id('events'), v.null()),
  answer: v.any(),
  /** Whether the viewer may answer or close this card; visibility alone grants nothing. */
  mayAnswer: v.boolean(),
  createdAt: v.number(),
  resolvedAt: v.union(v.number(), v.null()),
});
const result = v.object({
  eventId: v.id('events'),
  sequence: v.number(),
  description: v.string(),
  interactionId: v.union(v.id('interactions'), v.null()),
});

async function project(
  ctx: { db: { get: (id: Doc<'interactions'>['requesterId']) => Promise<Doc<'users'> | null> } },
  interaction: Doc<'interactions'>,
  context: TableContext,
) {
  return {
    id: interaction._id,
    sessionId: interaction.sessionId,
    status: interaction.status,
    kind: interaction.kind,
    operation: interaction.operation,
    actorLabel: interaction.actorLabel,
    requesterName: (await ctx.db.get(interaction.requesterId))?.displayName ?? 'Former member',
    requiredInputs: interaction.requiredInputs,
    revision: interaction.revision,
    openedEventId: interaction.openedEventId,
    resolvedEventId: interaction.resolvedEventId,
    answer: interaction.answer,
    mayAnswer: mayAnswer(interaction, context),
    createdAt: interaction.createdAt,
    resolvedAt: interaction.resolvedAt,
  };
}

/** Pending cards of a campaign (default), or every card when `status` names another state. */
export const list = query({
  args: { campaignId: v.id('campaigns'), status: v.optional(status) },
  returns: v.array(projection),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    const rows = await ctx.db
      .query('interactions')
      .withIndex('by_campaign_status', q =>
        q.eq('campaignId', args.campaignId).eq('status', args.status ?? 'awaiting-input'),
      )
      .order('desc')
      .take(100);
    return Promise.all(rows.map(row => project(ctx, row, context)));
  },
});

export const get = query({
  args: { interactionId: v.id('interactions') },
  returns: projection,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) throw new ConvexError('Interaction unavailable.');
    const context = await tableContext(ctx, user, interaction.campaignId);
    return project(ctx, interaction, context);
  },
});

/** Headless answer. The continuation runs under this command id; a retry returns the same result. */
export const respond = mutation({
  args: {
    interactionId: v.id('interactions'),
    answer: v.any(),
    commandId: v.string(),
    expectedRevision: v.optional(v.number()),
  },
  returns: result,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) throw new ConvexError('Interaction unavailable.');
    if (typeof args.answer !== 'object' || args.answer === null || Array.isArray(args.answer))
      throw new ConvexError('The answer must be an object of the card’s inputs.');
    return invoke(ctx, user, {
      schemaVersion: 1,
      campaignId: interaction.campaignId,
      commandId: args.commandId,
      operation: 'card.respond',
      actor: null,
      arguments: {
        card: { refKind: 'interaction', id: args.interactionId },
        answer: { record: args.answer } as CommandEnvelope['arguments'][string],
        ...(args.expectedRevision === undefined ? {} : { revision: args.expectedRevision }),
      },
    });
  },
});

export const close = mutation({
  args: {
    interactionId: v.id('interactions'),
    commandId: v.string(),
    expectedRevision: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) throw new ConvexError('Interaction unavailable.');
    await invoke(ctx, user, {
      schemaVersion: 1,
      campaignId: interaction.campaignId,
      commandId: args.commandId,
      operation: 'card.close',
      actor: null,
      arguments: {
        card: { refKind: 'interaction', id: args.interactionId },
        ...(args.expectedRevision === undefined ? {} : { revision: args.expectedRevision }),
      },
    });
    return null;
  },
});
