// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireDirector, requireMember, requireUser, type ReadCtx } from './lib/access';
import { command } from './lib/commands';
import { appendEvent } from './lib/events';
import { requireContent } from './content';

// The only foe definition available in v0.01: the Goblin Warrior entry of the content snapshot.
export const GOBLIN_WARRIOR_ID = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

/** Immutable copy of the source entry stored with each instance, separate from its play state. */
function snapshotOf(entry: Doc<'content'>): string {
  return JSON.stringify({
    id: entry.contentId,
    name: entry.name,
    sourcePath: entry.sourcePath,
    revision: entry.revision,
    text: entry.text,
    structured: entry.structured,
  });
}
/**
 * The printed Stamina of a stat block (frontmatter `stamina`, a string such as "15"). Only a plain
 * whole number is accepted; anything else stays unresolved rather than becoming a default.
 */
function printedStamina(entry: Doc<'content'>): number {
  const printed: unknown = (entry.structured as Record<string, unknown> | null)?.stamina;
  if (typeof printed !== 'string' || !/^\d+$/.test(printed))
    throw new ConvexError(
      `${entry.name}: printed Stamina "${String(printed)}" is not a whole number.`,
    );
  return Number(printed);
}
async function settings(ctx: ReadCtx, campaignId: Id<'campaigns'>) {
  return ctx.db
    .query('foeSettings')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .unique();
}
/** Roster lock while paused (docs/table-spec.md#4-session-status-and-play-mode): no add or remove. */
async function requireNotPaused(ctx: ReadCtx, campaign: Doc<'campaigns'>) {
  const session = campaign.activeSessionId ? await ctx.db.get(campaign.activeSessionId) : null;
  if (session?.status === 'paused')
    throw new ConvexError(
      'The session is paused; the foes roster waits until the Director resumes it.',
    );
}
async function scopedFoe(ctx: ReadCtx, campaignId: Id<'campaigns'>, foeId: Id<'foes'>) {
  const foe = await ctx.db.get(foeId);
  if (!foe || foe.campaignId !== campaignId) throw new ConvexError('Foe unavailable.');
  return foe;
}
const peerRow = v.object({ id: v.id('foes'), name: v.string(), healthFraction: v.number() });
const directorRow = v.object({
  id: v.id('foes'),
  name: v.string(),
  healthFraction: v.number(),
  visible: v.boolean(),
  stamina: v.number(),
  maxStamina: v.number(),
});
export const list = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.object({
    director: v.boolean(),
    addVisible: v.union(v.boolean(), v.null()),
    rows: v.array(v.union(directorRow, peerRow)),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await requireMember(ctx, args.campaignId, user._id);
    const director = campaign.ownerId === user._id;
    // Foe hiding is deferred (docs/table-spec.md#monster-visibility-and-health-display, Q-REC-1):
    // every loaded foe is listed for every role regardless of the stored flag. `setVisible` and
    // `setDefaultVisible` below stay in code, dormant: no UI control and not in the registry.
    const rows = await ctx.db
      .query('foes')
      .withIndex('by_campaign', q => q.eq('campaignId', args.campaignId))
      .take(100);
    return {
      director,
      addVisible: director ? ((await settings(ctx, args.campaignId))?.addVisible ?? false) : null,
      rows: rows.map(foe => {
        const base = {
          id: foe._id,
          name: foe.name,
          healthFraction: Math.max(0, Math.min(1, foe.live.stamina / foe.maxStamina)),
        };
        return director
          ? { ...base, visible: foe.visible, stamina: foe.live.stamina, maxStamina: foe.maxStamina }
          : base;
      }),
    };
  },
});
export const catalog = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.object({ definitionId: v.string(), name: v.string(), sourceSnapshot: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const entry = await requireContent(ctx, GOBLIN_WARRIOR_ID);
    return { definitionId: entry.contentId, name: entry.name, sourceSnapshot: snapshotOf(entry) };
  },
});
export const detail = query({
  args: { campaignId: v.id('campaigns'), foeId: v.id('foes') },
  returns: v.object({ name: v.string(), sourceSnapshot: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const foe = await scopedFoe(ctx, args.campaignId, args.foeId);
    return { name: foe.name, sourceSnapshot: foe.sourceSnapshot };
  },
});
export const add = mutation({
  args: { campaignId: v.id('campaigns'), definitionId: v.string(), commandId: v.string() },
  returns: v.id('foes'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'foes.add', args);
    if (receipt.previous) return receipt.previous.result as Id<'foes'>;
    await requireNotPaused(ctx, campaign);
    if (args.definitionId !== GOBLIN_WARRIOR_ID)
      throw new ConvexError('This foe definition is not available in the prototype.');
    const entry = await requireContent(ctx, GOBLIN_WARRIOR_ID);
    const maxStamina = printedStamina(entry);
    const existing = await ctx.db
      .query('foes')
      .withIndex('by_campaign', q => q.eq('campaignId', args.campaignId))
      .take(100);
    if (existing.length >= 100)
      throw new ConvexError('Prototype roster limit of 100 foes reached.');
    const visible = (await settings(ctx, args.campaignId))?.addVisible ?? false;
    const foeId = await ctx.db.insert('foes', {
      campaignId: args.campaignId,
      name: entry.name,
      visible,
      sourceSnapshot: snapshotOf(entry),
      maxStamina,
      live: { stamina: maxStamina, temporaryStamina: 0 },
    });
    await appendEvent(ctx, {
      campaignId: args.campaignId,
      origin: 'user',
      actor: user,
      commandId: args.commandId,
      kind: 'foe-added',
      description: `${entry.name} added to the foes roster.`,
    });
    await receipt.save(foeId);
    return foeId;
  },
});
export const remove = mutation({
  args: { campaignId: v.id('campaigns'), foeId: v.id('foes'), commandId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'foes.remove', args);
    if (receipt.previous) return null;
    await requireNotPaused(ctx, campaign);
    const foe = await scopedFoe(ctx, args.campaignId, args.foeId);
    await ctx.db.delete(foe._id);
    await appendEvent(ctx, {
      campaignId: args.campaignId,
      origin: 'user',
      actor: user,
      commandId: args.commandId,
      kind: 'foe-removed',
      description: `${foe.name} removed from the foes roster.`,
    });
    await receipt.save(null);
    return null;
  },
});
export const setVisible = mutation({
  args: {
    campaignId: v.id('campaigns'),
    foeId: v.id('foes'),
    visible: v.boolean(),
    commandId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'foes.setVisible', args);
    if (receipt.previous) return null;
    const foe = await scopedFoe(ctx, args.campaignId, args.foeId);
    await ctx.db.patch(foe._id, { visible: args.visible });
    await appendEvent(ctx, {
      campaignId: args.campaignId,
      origin: 'user',
      actor: user,
      commandId: args.commandId,
      kind: 'foe-visibility',
      description: `${foe.name} ${args.visible ? 'shown on' : 'hidden from'} the player roster.`,
    });
    await receipt.save(null);
    return null;
  },
});
export const setDefaultVisible = mutation({
  args: { campaignId: v.id('campaigns'), visible: v.boolean(), commandId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireDirector(ctx, args.campaignId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'foes.setDefaultVisible', args);
    if (receipt.previous) return null;
    const current = await settings(ctx, args.campaignId);
    if (current) await ctx.db.patch(current._id, { addVisible: args.visible });
    else
      await ctx.db.insert('foeSettings', { campaignId: args.campaignId, addVisible: args.visible });
    await receipt.save(null);
    return null;
  },
});
