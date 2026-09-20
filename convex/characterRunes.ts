// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './lib/access';
import { command } from './lib/commands';
import { invoke } from './lib/registry';
import { runeContext, runePatch } from './lib/runeOperations';

const rune = v.union(v.literal('Detection'), v.literal('Light'), v.literal('Voice'), v.null());

export const current = query({
  args: { characterId: v.id('characters') },
  returns: v.union(
    v.null(),
    v.object({
      rune,
      version: v.number(),
      buildRevisionId: v.id('characterRevisions'),
      canEdit: v.boolean(),
      reason: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const state = await runeContext(ctx, args.characterId, user);
    if (state && state.character.ownerId !== user._id && state.campaign?.ownerId !== user._id)
      return null;
    return state
      ? {
          rune: state.character.activeRune?.kind ?? null,
          version: state.character.activeRune?.version ?? 0,
          buildRevisionId: state.build._id,
          canEdit: state.reason === null,
          reason: state.reason,
        }
      : null;
  },
});

export const setActiveRune = mutation({
  args: {
    characterId: v.id('characters'),
    commandId: v.string(),
    rune,
    expectedVersion: v.number(),
    expectedBuildRevisionId: v.id('characterRevisions'),
    completedTenMinutes: v.boolean(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const state = await runeContext(ctx, args.characterId, user);
    if (!state) throw new ConvexError('This character does not have Runic Carving.');
    if (state.reason) throw new ConvexError(state.reason);
    if (state.campaign) {
      const result = await invoke(ctx, user, {
        schemaVersion: 1,
        commandId: args.commandId,
        campaignId: state.campaign._id,
        operation: 'rune.change',
        actor: { refKind: 'character', id: args.characterId },
        arguments: {
          rune: args.rune ?? 'None',
          expectedVersion: args.expectedVersion,
          expectedBuildRevisionId: args.expectedBuildRevisionId,
          completedTenMinutes: args.completedTenMinutes,
        },
      });
      const event = await ctx.db.get(result.eventId);
      return Number(event!.payload.data.version);
    }
    const receipt = await command(
      ctx,
      user._id,
      args.commandId,
      'characterRunes.setActiveRune',
      args,
    );
    if (receipt.previous) return Number(receipt.previous.result);
    const patch = runePatch(state, user, args);
    const version = patch.activeRune.version;
    await ctx.db.patch(args.characterId, patch);
    await receipt.save(String(version));
    return version;
  },
});
