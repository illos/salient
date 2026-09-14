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
import { command } from './lib/commands';
import {
  closeInteraction,
  mayAnswer,
  respondToInteraction,
  scopedInteraction,
} from './lib/interactions';
import { run, tableContext, type TableContext } from './lib/registry';

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
    const context = await tableContext(ctx, user, interaction.campaignId);
    await scopedInteraction(ctx, context, args.interactionId);
    const receipt = await command(ctx, user._id, args.commandId, 'interactions.respond', {
      interactionId: args.interactionId,
      answer: args.answer,
    });
    if (receipt.previous) return JSON.parse(receipt.previous.result!);
    const outcome = await respondToInteraction(ctx, {
      context,
      interactionId: args.interactionId,
      answer: args.answer,
      commandId: args.commandId,
      actor: null,
      expectedRevision: args.expectedRevision,
      run,
    });
    await receipt.save(JSON.stringify(outcome));
    return outcome;
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
    const context = await tableContext(ctx, user, interaction.campaignId);
    const receipt = await command(ctx, user._id, args.commandId, 'interactions.close', {
      interactionId: args.interactionId,
    });
    if (receipt.previous) return null;
    await closeInteraction(ctx, context, args.interactionId, args.expectedRevision);
    await receipt.save(null);
    return null;
  },
});
