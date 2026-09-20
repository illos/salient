// SPDX-License-Identifier: GPL-3.0-only
/**
 * V68 light campaign chat within the V12 contract (docs/table-spec.md#game-log-and-chat-scope,
 * docs/build/V12-campaign-chat.md): campaign-scoped, persistent, every current member reads and
 * writes, no editing or deletion, no notifications. Messages are separate from the game log: `send`
 * appends no event and opens no undo seam. The author's display name is snapshotted so attribution
 * survives account deletion. `send` takes a commandId so a retried send is not duplicated.
 */
import { v, ConvexError } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser, requireMember } from './lib/access';
import { command } from './lib/commands';

export const MAX_TEXT = 2000;
const PAGE = 50;

const message = v.object({
  id: v.id('chatMessages'),
  authorId: v.id('users'),
  authorName: v.string(),
  text: v.string(),
  createdAt: v.number(),
});

export const send = mutation({
  args: { campaignId: v.id('campaigns'), text: v.string(), commandId: v.string() },
  returns: v.id('chatMessages'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireMember(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'chat.send', args);
    if (receipt.previous) return receipt.previous.result as Id<'chatMessages'>;
    const text = args.text.trim();
    if (text.length === 0) throw new ConvexError('Write a message first.');
    if (text.length > MAX_TEXT)
      throw new ConvexError(`Messages are limited to ${MAX_TEXT} characters.`);
    const id = await ctx.db.insert('chatMessages', {
      campaignId: args.campaignId,
      authorId: user._id,
      authorName: user.displayName,
      text,
      createdAt: Date.now(),
    });
    await receipt.save(id);
    return id;
  },
});

/** Newest PAGE messages, oldest first within the page; `before` pages back by createdAt. */
export const list = query({
  args: { campaignId: v.id('campaigns'), before: v.optional(v.number()) },
  returns: v.object({ messages: v.array(message), nextBefore: v.union(v.number(), v.null()) }),
  handler: async (ctx, { campaignId, before }) => {
    const user = await requireUser(ctx);
    await requireMember(ctx, campaignId, user._id);
    const rows = await ctx.db
      .query('chatMessages')
      .withIndex('by_campaign_created', q =>
        before === undefined
          ? q.eq('campaignId', campaignId)
          : q.eq('campaignId', campaignId).lt('createdAt', before),
      )
      .order('desc')
      .take(PAGE + 1);
    const page = rows.slice(0, PAGE);
    return {
      messages: page.reverse().map(row => ({
        id: row._id,
        authorId: row.authorId,
        authorName: row.authorName,
        text: row.text,
        createdAt: row.createdAt,
      })),
      nextBefore: rows.length > PAGE ? page[0]!.createdAt : null,
    };
  },
});
