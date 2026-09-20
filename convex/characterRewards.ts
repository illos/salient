// SPDX-License-Identifier: GPL-3.0-only
/** V86: authenticated read and explicit one-time initialization of a legacy starting award. */
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './lib/access';
import { requireEditable } from './lib/characterBuild';
import { command } from './lib/commands';
import {
  requireStartingRewardsAccess,
  startingRewardsFromOrigin,
  startingRewardsValidator,
} from './lib/startingRewards';
import type { StartingRewards } from '../shared/contracts/startingRewards';
import type { Id } from './_generated/dataModel';

export const get = query({
  args: { characterId: v.id('characters') },
  returns: v.object({
    characterRevision: v.number(),
    originRevisionId: v.union(v.id('characterRevisions'), v.null()),
    rewards: v.union(startingRewardsValidator, v.null()),
    canInitialize: v.boolean(),
    initializationBlocked: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await requireStartingRewardsAccess(ctx, args.characterId, user._id);
    const prepared = await startingRewardsFromOrigin(ctx, character, 0);
    return {
      characterRevision: character.revision,
      originRevisionId: character.liveState?.origin.buildRevisionId ?? null,
      rewards: character.startingRewards ?? null,
      canInitialize: !character.startingRewards && prepared.initializationBlocked === null,
      initializationBlocked: prepared.initializationBlocked,
    };
  },
});

export const initialize = mutation({
  args: {
    characterId: v.id('characters'),
    commandId: v.string(),
    expectedCharacterRevision: v.number(),
    expectedOriginRevisionId: v.id('characterRevisions'),
  },
  returns: startingRewardsValidator,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await requireStartingRewardsAccess(ctx, args.characterId, user._id);
    // Authorization precedes receipt lookup: former Directors cannot replay an old response.
    const receipt = await command(
      ctx,
      user._id,
      args.commandId,
      'characterRewards.initialize',
      args,
    );
    if (receipt.previous)
      return JSON.parse(receipt.previous.result!) as StartingRewards<Id<'characterRevisions'>>;
    await requireEditable(ctx, character);
    if (
      character.revision !== args.expectedCharacterRevision ||
      character.liveState?.origin.buildRevisionId !== args.expectedOriginRevisionId
    )
      throw new ConvexError(
        'The character changed. Reload before initializing its starting rewards.',
      );
    const prepared = await startingRewardsFromOrigin(ctx, character, Date.now());
    if (prepared.initializationBlocked !== null)
      throw new ConvexError(prepared.initializationBlocked);
    if (!character.startingRewards)
      await ctx.db.patch(character._id, {
        startingRewards: prepared.rewards,
        revision: character.revision + 1,
      });
    await receipt.save(JSON.stringify(prepared.rewards));
    return prepared.rewards;
  },
});
