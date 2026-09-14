// SPDX-License-Identifier: GPL-3.0-only
/**
 * The targeting read side for A05: the viewer's own draft (pending ability, selected targets,
 * per-target edge and bane counts, characteristic override) and every other user's selected
 * targets as indicators. A draft belongs to the authenticated user, not the creature
 * (docs/table-spec.md#roster-targeting-controls, docs/table-command-spec.md#roster-target-selection).
 * The operations live in convex/lib/abilityOperations.ts.
 */
import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireUser } from './lib/access';
import { tableContext } from './lib/registry';
import { actorRef } from './initiativeTables';

export const drafts = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.object({
    mine: v.union(
      v.null(),
      v.object({
        actor: v.union(actorRef, v.null()),
        abilityId: v.union(v.string(), v.null()),
        targets: v.array(actorRef),
        modifiers: v.record(v.string(), v.object({ edges: v.number(), banes: v.number() })),
        characteristic: v.union(v.string(), v.null()),
      }),
    ),
    others: v.array(
      v.object({
        userName: v.string(),
        actor: v.union(actorRef, v.null()),
        targets: v.array(actorRef),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await tableContext(ctx, user, args.campaignId);
    const rows = await ctx.db
      .query('targetingDrafts')
      .withIndex('by_campaign_user', q => q.eq('campaignId', args.campaignId))
      .take(100);
    const mine = rows.find(row => row.userId === user._id) ?? null;
    const others = await Promise.all(
      rows
        .filter(row => row.userId !== user._id && row.targets.length)
        .map(async row => ({
          userName: (await ctx.db.get(row.userId))?.displayName ?? 'Unknown',
          actor: row.actor,
          targets: row.targets,
        })),
    );
    return {
      mine: mine
        ? {
            actor: mine.actor,
            abilityId: mine.abilityId,
            targets: mine.targets,
            modifiers: mine.modifiers,
            characteristic: mine.characteristic,
          }
        : null,
      others,
    };
  },
});
