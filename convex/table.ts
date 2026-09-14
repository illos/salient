// SPDX-License-Identifier: GPL-3.0-only
/**
 * The table's read side for A03: one roster payload per viewer with the audience rules applied on
 * the server, so a player or observer payload never carries what their role may not see.
 *
 * Owning specifications: docs/table-spec.md#malice-visibility (Director always sees the pool;
 * others only with Show Malice on; enforced in shared reads), #monster-visibility-and-health-display
 * (player/observer payloads carry only the mode's projection: fraction, number or winded flag; the
 * stat block is Director-only; every loaded foe appears, hiding deferred), #foes-roster,
 * #party-sheets-and-resource-visibility (heroes pane), #4-session-status-and-play-mode.
 * Labels (winded, slain) follow shared/contracts/liveState.ts HealthLabels and R04 6.3/6.4.
 * The operations themselves live in convex/lib/tableOperations.ts.
 */
import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireUser } from './lib/access';
import { tableContext } from './lib/registry';
import { conditionsValidator, heroLiveValidator } from './characterTables';
import { noConditions } from './lib/tableOperations';
import { foeHealthValidator, projectFoeHealth, settingsOf } from './lib/audience';

export { tableOperations } from './lib/tableOperations';

function projectFoe(foe: Doc<'foes'>, director: boolean, mode: 'bar' | 'numerical' | 'winded') {
  const health = projectFoeHealth(foe, director, mode);
  return {
    id: foe._id,
    name: foe.name,
    /** Ordinary foe at 0 or lower (R03 label; R04 6.4). */
    slain: foe.live.stamina <= 0,
    conditions: foe.live.conditions ?? noConditions(),
    health,
  };
}

export const roster = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.object({
    role: v.union(v.literal('director'), v.literal('player'), v.literal('observer')),
    viewerId: v.id('users'),
    session: v.union(
      v.null(),
      v.object({
        id: v.id('sessions'),
        status: v.union(v.literal('running'), v.literal('paused'), v.literal('closed')),
        revision: v.number(),
      }),
    ),
    malice: v.union(v.number(), v.null()),
    settings: v.union(
      v.null(),
      v.object({
        showMalice: v.boolean(),
        showTestDifficulty: v.boolean(),
        healthDisplay: v.union(v.literal('bar'), v.literal('numerical'), v.literal('winded')),
      }),
    ),
    healthDisplay: v.union(v.literal('bar'), v.literal('numerical'), v.literal('winded')),
    foes: v.array(
      v.object({
        id: v.id('foes'),
        name: v.string(),
        slain: v.boolean(),
        conditions: conditionsValidator,
        health: foeHealthValidator,
      }),
    ),
    heroes: v.array(
      v.object({
        id: v.id('characters'),
        name: v.string(),
        ownerId: v.id('users'),
        ownerName: v.string(),
        controlled: v.boolean(),
        live: v.union(
          v.null(),
          heroLiveValidator,
          v.object({
            stamina: v.union(v.number(), v.null()),
            recoveries: v.union(v.number(), v.null()),
          }),
        ),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    const director = context.role === 'director';
    const settings = settingsOf(context.campaign);
    const foes = await ctx.db
      .query('foes')
      .withIndex('by_campaign', q => q.eq('campaignId', args.campaignId))
      .take(100);
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_campaign', q => q.eq('campaignId', args.campaignId))
      .take(100);
    const heroes = await Promise.all(
      characters.map(async character => ({
        id: character._id,
        name: character.authored.name,
        ownerId: character.ownerId,
        ownerName: (await ctx.db.get(character.ownerId))?.displayName ?? 'Unknown',
        controlled: director || (context.role === 'player' && character.ownerId === user._id),
        live: !character.liveState
          ? null
          : director || character.ownerId === user._id
            ? character.liveState
            : { stamina: character.liveState.stamina, recoveries: character.liveState.recoveries },
      })),
    );
    return {
      role: context.role,
      viewerId: user._id,
      session: context.session
        ? {
            id: context.session._id,
            status: context.session.status,
            revision: context.session.revision,
          }
        : null,
      // Audience enforcement: the pool is absent from the payload unless the viewer may see it.
      malice: director || settings.showMalice ? (context.campaign.malice ?? 0) : null,
      settings: director ? settings : null,
      healthDisplay: settings.healthDisplay,
      foes: foes.map(foe => projectFoe(foe, director, settings.healthDisplay)),
      heroes,
    };
  },
});
