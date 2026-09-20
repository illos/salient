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
import type { DerivedBaseline } from '../shared/contracts/characterEvaluation';
import type { Doc } from './_generated/dataModel';
import { requireUser } from './lib/access';
import { tableContext } from './lib/registry';
import { conditionsValidator, heroLiveValidator } from './characterTables';
import { noConditions } from './lib/tableOperations';
import { foeHealthValidator, projectFoeHealth, settingsOf } from './lib/audience';
import { captainOf, isLiving, squadMembers } from './lib/squads';

export { tableOperations } from './lib/tableOperations';

function projectFoe(foe: Doc<'foes'>, director: boolean, mode: 'bar' | 'numerical' | 'winded') {
  const health = projectFoeHealth(foe, director, mode);
  return {
    id: foe._id,
    name: foe.name,
    /** Ordinary foe at 0 or lower (R03 label; R04 6.4); a dropped minion also reads 0. */
    slain: foe.live.stamina <= 0,
    conditions: foe.live.conditions ?? noConditions(),
    health,
    summary: director ? foeSummary(foe.sourceSnapshot) : null,
    ...(foe.squadId ? { squadId: foe.squadId } : {}),
  };
}

/**
 * V02 squad projection. Players see the pool through the campaign's health display; Winded mode
 * shows only the living count because minions cannot be winded (Shared Low Stamina). The Director
 * sees pool, step, carried damage, captain benefit, participation and any owed casualty choice.
 */
async function projectSquad(
  ctx: Parameters<typeof squadMembers>[0],
  squad: Doc<'squads'>,
  director: boolean,
  mode: 'bar' | 'numerical' | 'winded',
) {
  const members = await squadMembers(ctx, squad);
  const living = members.filter(isLiving).length;
  const captain = await captainOf(ctx, squad);
  const health = director
    ? {
        mode: 'director' as const,
        pool: squad.pool,
        poolMax: squad.poolMax,
        step: squad.step,
        carried: squad.carried,
      }
    : mode === 'numerical'
      ? { mode: 'numerical' as const, pool: squad.pool }
      : mode === 'bar'
        ? {
            mode: 'bar' as const,
            fraction: squad.poolMax ? Math.max(0, Math.min(1, squad.pool / squad.poolMax)) : 0,
          }
        : { mode: 'winded' as const };
  return {
    id: squad._id,
    name: squad.name,
    definitionId: squad.definitionId,
    memberIds: members.map(m => m._id),
    living,
    total: members.length,
    captain: captain
      ? { id: captain._id, name: captain.name, slain: captain.live.stamina <= 0 }
      : null,
    health,
    pending: squad.pending
      ? {
          count: squad.pending.count,
          candidates: squad.pending.candidates,
          reason: squad.pending.reason,
        }
      : null,
    ...(director
      ? {
          director: {
            memberStamina: squad.memberStamina,
            captainBenefit: squad.captainBenefit,
            ev: squad.ev,
            participation: squad.participation,
            summary: foeSummary(squad.sourceSnapshot),
          },
        }
      : {}),
  };
}

function foeSummary(snapshot: string) {
  try {
    const source = JSON.parse(snapshot) as { structured?: { level?: unknown; role?: unknown } };
    const value = source.structured;
    return {
      level:
        typeof value?.level === 'number' || typeof value?.level === 'string' ? value.level : null,
      role: typeof value?.role === 'string' ? value.role : null,
    };
  } catch {
    return null; // Older plain-text snapshots have no structured card facts.
  }
}

function heroFacts(character: Doc<'characters'>, full: boolean) {
  const baseline = character.derivedBaseline as DerivedBaseline | null;
  return {
    subtitle:
      full && baseline?.class?.value
        ? `${baseline.class.value} · Level ${baseline.level?.value ?? '—'}`
        : null,
    staminaMax: baseline?.staminaMaximum?.value ?? null,
    recoveriesMax: baseline?.recoveriesMaximum?.value ?? null,
    windedValue: full ? (baseline?.windedValue?.value ?? null) : null,
  };
}

export const roster = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.object({
    role: v.union(v.literal('director'), v.literal('player'), v.literal('observer')),
    viewerId: v.id('users'),
    viewerName: v.string(),
    campaignName: v.string(),
    session: v.union(
      v.null(),
      v.object({
        id: v.id('sessions'),
        status: v.union(v.literal('running'), v.literal('paused'), v.literal('closed')),
        revision: v.number(),
        startedAt: v.number(),
        number: v.number(),
      }),
    ),
    malice: v.union(v.number(), v.null()),
    settings: v.union(
      v.null(),
      v.object({
        showMalice: v.boolean(),
        showTestDifficulty: v.boolean(),
        healthDisplay: v.union(v.literal('bar'), v.literal('numerical'), v.literal('winded')),
        enableUserUndo: v.boolean(),
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
        summary: v.union(
          v.null(),
          v.object({
            level: v.union(v.number(), v.string(), v.null()),
            role: v.union(v.string(), v.null()),
          }),
        ),
        squadId: v.optional(v.id('squads')),
      }),
    ),
    squads: v.array(
      v.object({
        id: v.id('squads'),
        name: v.string(),
        definitionId: v.string(),
        memberIds: v.array(v.id('foes')),
        living: v.number(),
        total: v.number(),
        captain: v.union(
          v.null(),
          v.object({ id: v.id('foes'), name: v.string(), slain: v.boolean() }),
        ),
        health: v.union(
          v.object({
            mode: v.literal('director'),
            pool: v.number(),
            poolMax: v.number(),
            step: v.number(),
            carried: v.number(),
          }),
          v.object({ mode: v.literal('numerical'), pool: v.number() }),
          v.object({ mode: v.literal('bar'), fraction: v.number() }),
          v.object({ mode: v.literal('winded') }),
        ),
        /** Casualties still owed after damage; the attacking user or the Director names them. */
        pending: v.union(
          v.null(),
          v.object({
            count: v.number(),
            candidates: v.array(v.id('foes')),
            reason: v.union(v.literal('directly-damaged'), v.literal('nearest')),
          }),
        ),
        director: v.optional(
          v.object({
            memberStamina: v.number(),
            captainBenefit: v.union(
              v.null(),
              v.object({
                text: v.string(),
                stamina: v.number(),
                strikeDamage: v.number(),
                strikeEdges: v.number(),
                manual: v.boolean(),
              }),
            ),
            ev: v.object({
              printed: v.union(v.string(), v.null()),
              amount: v.union(v.number(), v.null()),
              quantity: v.union(v.number(), v.null()),
              derived: v.union(v.number(), v.null()),
            }),
            participation: v.object({
              turnId: v.union(v.id('turns'), v.null()),
              optedOut: v.array(v.id('foes')),
              individual: v.array(v.id('foes')),
            }),
            summary: v.union(
              v.null(),
              v.object({
                level: v.union(v.number(), v.string(), v.null()),
                role: v.union(v.string(), v.null()),
              }),
            ),
          }),
        ),
      }),
    ),
    heroes: v.array(
      v.object({
        id: v.id('characters'),
        name: v.string(),
        ownerId: v.id('users'),
        ownerName: v.string(),
        controlled: v.boolean(),
        facts: v.object({
          subtitle: v.union(v.string(), v.null()),
          staminaMax: v.union(v.number(), v.null()),
          recoveriesMax: v.union(v.number(), v.null()),
          windedValue: v.union(v.number(), v.null()),
        }),
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
    const squadRows = await ctx.db
      .query('squads')
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
        facts: heroFacts(character, director || character.ownerId === user._id),
        controlled: director || (context.role === 'player' && character.ownerId === user._id),
        live: !character.liveState
          ? null
          : director || character.ownerId === user._id
            ? character.liveState
            : { stamina: character.liveState.stamina, recoveries: character.liveState.recoveries },
      })),
    );
    const sessions = context.session
      ? await ctx.db
          .query('sessions')
          .withIndex('by_campaign', q => q.eq('campaignId', args.campaignId))
          .order('desc')
          .take(50)
      : [];
    return {
      role: context.role,
      viewerName: user.displayName,
      campaignName: context.campaign.name,
      viewerId: user._id,
      session: context.session
        ? {
            id: context.session._id,
            status: context.session.status,
            revision: context.session.revision,
            startedAt: context.session.startedAt,
            number: sessions.length - sessions.findIndex(s => s._id === context.session!._id),
          }
        : null,
      // Audience enforcement: the pool is absent from the payload unless the viewer may see it.
      malice: director || settings.showMalice ? (context.campaign.malice ?? 0) : null,
      settings: director ? settings : null,
      healthDisplay: settings.healthDisplay,
      foes: foes.map(foe => projectFoe(foe, director, settings.healthDisplay)),
      squads: await Promise.all(
        squadRows.map(squad => projectSquad(ctx, squad, director, settings.healthDisplay)),
      ),
      heroes,
    };
  },
});
