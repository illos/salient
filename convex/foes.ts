// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireDirector, requireMember, requireUser } from './lib/access';
import { command } from './lib/commands';
import { appendEvent } from './lib/events';
import { requireContent } from './content';
import { projectFoeHealth, foeHealthValidator, settingsOf } from './lib/audience';

import { GOBLIN_WARRIOR_ID, settings, scopedFoe, snapshotOf } from './lib/foeSource';
import { invoke } from './lib/registry';

export { GOBLIN_WARRIOR_ID } from './lib/foeSource';

const peerRow = v.object({ id: v.id('foes'), name: v.string(), health: foeHealthValidator });
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
          health: projectFoeHealth(foe, director, settingsOf(campaign).healthDisplay),
        };
        return director
          ? {
              id: foe._id,
              name: foe.name,
              healthFraction: Math.max(0, Math.min(1, foe.live.stamina / foe.maxStamina)),
              visible: foe.visible,
              stamina: foe.live.stamina,
              maxStamina: foe.maxStamina,
            }
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
    void campaign;
    const result = await invoke(ctx, user, {
      schemaVersion: 1,
      commandId: args.commandId,
      campaignId: args.campaignId,
      operation: 'foe.add',
      actor: null,
      arguments: { definition: args.definitionId },
    });
    // The registry journals the insert; reading its immutable row also works on retries after removal.
    const creation = await ctx.db
      .query('changes')
      .withIndex('by_event', q => q.eq('eventId', result.eventId))
      .first();
    const foeId =
      creation?.entityTable === 'foes' ? ctx.db.normalizeId('foes', creation.entityId) : null;
    if (!foeId) throw new ConvexError('Foe creation did not record its instance.');
    return foeId;
  },
});
export const remove = mutation({
  args: { campaignId: v.id('campaigns'), foeId: v.id('foes'), commandId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const campaign = await requireDirector(ctx, args.campaignId, user._id);
    void campaign;
    await invoke(ctx, user, {
      schemaVersion: 1,
      commandId: args.commandId,
      campaignId: args.campaignId,
      operation: 'foe.remove',
      actor: { refKind: 'foe', id: args.foeId },
      arguments: {},
    });
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
