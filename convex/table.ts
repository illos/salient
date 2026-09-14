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
import { DEFAULT_SETTINGS, noConditions } from './lib/tableOperations';

export { tableOperations } from './lib/tableOperations';

/** floor(max / 2); winded at or below it (R04 6.3, liveState.ts HealthLabels). */
function windedValue(maxStamina: number): number {
  return Math.floor(maxStamina / 2);
}

export type FoeHealth =
  | {
      mode: 'director';
      stamina: number;
      maxStamina: number;
      temporaryStamina: number;
      winded: boolean;
    }
  | { mode: 'numerical'; stamina: number }
  | { mode: 'bar'; fraction: number }
  | { mode: 'winded'; winded: boolean };

function projectFoe(foe: Doc<'foes'>, director: boolean, mode: 'bar' | 'numerical' | 'winded') {
  const winded = foe.live.stamina <= windedValue(foe.maxStamina);
  const health: FoeHealth = director
    ? {
        mode: 'director',
        stamina: foe.live.stamina,
        maxStamina: foe.maxStamina,
        temporaryStamina: foe.live.temporaryStamina,
        winded,
      }
    : mode === 'numerical'
      ? { mode, stamina: foe.live.stamina }
      : mode === 'bar'
        ? { mode, fraction: Math.max(0, Math.min(1, foe.live.stamina / foe.maxStamina)) }
        : { mode, winded };
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
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, args.campaignId);
    const director = context.role === 'director';
    const settings = context.campaign.settings ?? DEFAULT_SETTINGS;
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
        controlled: director || character.ownerId === user._id,
        live: character.liveState,
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
