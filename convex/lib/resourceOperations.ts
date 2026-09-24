// SPDX-License-Identifier: GPL-3.0-only
/**
 * V120: `resource.claim`, the table-confirmed half of class heroic-resource generation. A class
 * trigger the app cannot observe (for example the Shadow's "damage incorporating 1 or more surges")
 * is claimed by the table; the operation applies the sourced amount and enforces the trigger's
 * limit ("the first time each combat round") with a journaled claim record on the hero, so undo and
 * redo restore both. The clock clears the records with the encounter-end loss.
 *
 * Profiles and quotes: shared/resolve/heroicResourceGeneration.ts. Decision:
 * docs/decisions/2026-09-24-heroic-resource-automation.md.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { ReadCtx } from './access';
import {
  SELF_TAUGHT,
  canForgo,
  generationProfile,
  prayerFor,
  triggersFor,
  type ResourceTrigger,
} from '../../shared/resolve/heroicResourceGeneration';
import { baselineOf, requireHeroLive } from './characterBuild';
import { heroicResourceFloor } from '../../shared/resolve/resourceFloor';
import { committedEncounter } from './encounters';
import { journalPatch } from './journal';
import type { OperationDefinition, Outcome } from './registry';
import { LIMIT_TEXT, claimState, gainText, rollGain, writeTriggerGain } from './resourceTriggers';

export interface TriggerAvailability {
  id: string;
  label: string;
  amount: number;
  /** Sides of a dice gain (1dN), when the trigger rolls instead of a fixed amount. */
  dice: number | null;
  /** Whether the app applies it automatically when it records the event. */
  observed: boolean;
  resource: string;
  limit: ResourceTrigger['limit'];
  sourcePath: string;
  quote: string;
  confirmation: string;
  /** Null when it can be claimed now; otherwise why not. */
  unavailable: string | null;
}

/** The hero's enabled class triggers and whether each can be claimed now (for `abilities:sheet`). */
export async function resourceTriggers(
  ctx: ReadCtx,
  campaign: Doc<'campaigns'>,
  character: Doc<'characters'>,
): Promise<TriggerAvailability[]> {
  const profile = generationProfile(baselineOf(character.derivedBaseline));
  const live = character.liveState;
  if (!profile || !live) return [];
  const encounter = await committedEncounter(ctx, campaign);
  return triggersFor(profile, baselineOf(character.derivedBaseline)).map(trigger => {
    const state = claimState(character, profile, trigger, encounter);
    return {
      id: trigger.id,
      label: trigger.label,
      amount: state.clause.amount,
      dice: trigger.dice?.sides ?? null,
      observed: trigger.observe !== undefined,
      resource: live.heroicResource.name,
      limit: trigger.limit,
      sourcePath: state.clause.sourcePath,
      quote: state.clause.quote,
      confirmation: trigger.confirmation,
      unavailable: state.reason,
    };
  });
}

const resourceClaim: OperationDefinition = {
  id: 'resource.claim',
  family: 'resource',
  verb: 'claim',
  title: 'Claim a heroic-resource trigger',
  description:
    "Record a class heroic-resource trigger the table confirms (for example the Shadow's first damage with surges each round). Applies the sourced amount once within the trigger's limit.",
  args: { trigger: v.string() },
  argDescriptions: { trigger: 'The trigger id, as listed on the hero’s ability panel.' },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args, envelope }): Promise<Outcome> => {
    if (actor!.kind !== 'character')
      throw new ConvexError(`${actor!.name} is not a hero; only heroes have heroic resources.`);
    const character = await ctx.db.get(actor!.id as Id<'characters'>);
    if (!character || character.campaignId !== context.campaign._id)
      throw new ConvexError('That hero is not at this table.');
    const live = requireHeroLive(character);
    const profile = generationProfile(baselineOf(character.derivedBaseline));
    const available = profile ? triggersFor(profile, baselineOf(character.derivedBaseline)) : [];
    const trigger = available.find(t => t.id === String(args.trigger));
    if (!profile || !trigger)
      throw new ConvexError(
        `${character.authored.name} has no heroic-resource trigger "${String(args.trigger)}"${
          available.length ? `; available: ${available.map(t => t.id).join(', ')}` : ''
        }.`,
      );
    const encounter = await committedEncounter(ctx, context.campaign);
    const state = claimState(character, profile, trigger, encounter);
    if (state.reason !== null)
      throw new ConvexError(
        state.reason.startsWith('Already claimed')
          ? `${character.authored.name} already claimed "${trigger.label}" ${LIMIT_TEXT[trigger.limit]}.`
          : state.reason,
      );
    const gain = await rollGain(
      ctx,
      context.campaign._id,
      envelope.commandId,
      trigger,
      state.clause.amount,
      context.user._id,
    );
    const pool = live.heroicResource;
    const before = pool.current;
    const after = before + gain.amount;
    return {
      kind: 'resource.claimed',
      description: `${character.authored.name}: ${trigger.label} — ${gainText(trigger, gain.amount)}${
        gain.dice ? ` = ${gain.amount}` : ''
      } ${pool.name} (${before} → ${after}).`,
      ...(gain.dice ? { dice: gain.dice } : {}),
      data: {
        characterId: character._id,
        triggerId: trigger.id,
        resource: pool.name,
        before,
        delta: gain.amount,
        after,
        round: encounter!.round ?? 0,
        sourcePath: state.clause.sourcePath,
        quote: state.clause.quote,
      },
      commit: async (mctx, scope) => {
        await writeTriggerGain(
          mctx,
          scope,
          character._id,
          {
            triggerId: trigger.id,
            encounterId: encounter!._id,
            ...state.window,
            eventId: scope.eventId,
          },
          gain.amount,
        );
      },
    };
  },
};

/**
 * V150: declare (or withdraw) forgoing the next turn-start gain under the Self-Taught complication:
 * "At the start of each of your turns during combat, you can forgo gaining your Heroic Resource until
 * the start of your next turn." (complication/self-taught.md). The clock applies it at that turn
 * start; the strike damage bonus stays manual.
 */
const resourceForgo: OperationDefinition = {
  id: 'resource.forgo',
  family: 'resource',
  verb: 'forgo',
  title: 'Forgo the next turn-start Heroic Resource (Self-Taught)',
  description:
    'For a Self-Taught hero: at the next turn start, gain no Heroic Resource until the start of the following turn (the strike damage bonus is resolved manually). `value=off` withdraws it before that turn starts.',
  args: { value: v.optional(v.string()) },
  argDescriptions: {
    value:
      '`on` (default) to forgo at the next turn start, `off` to withdraw, `now` during your own turn to forgo this turn (its turn-start gain is removed).',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }): Promise<Outcome> => {
    if (actor!.kind !== 'character')
      throw new ConvexError(`${actor!.name} is not a hero; only heroes have heroic resources.`);
    const character = await ctx.db.get(actor!.id as Id<'characters'>);
    if (!character || character.campaignId !== context.campaign._id)
      throw new ConvexError('That hero is not at this table.');
    const live = requireHeroLive(character);
    const baseline = baselineOf(character.derivedBaseline);
    if (!canForgo(baseline))
      throw new ConvexError(
        `${character.authored.name} does not have the Self-Taught complication.`,
      );
    if (!generationProfile(baseline))
      throw new ConvexError(
        `${character.authored.name}'s Heroic Resource is not generated automatically; forgo it by not adding it.`,
      );
    const value = String(args.value ?? 'on').toLowerCase();
    if (value !== 'on' && value !== 'off' && value !== 'now')
      throw new ConvexError('"value" must be on, off or now.');
    if (value === 'now') {
      // "At the start of each of your turns during combat, you can forgo …": decided at this turn's
      // start, after the app already added the gain, so that gain is reversed.
      const encounter = await committedEncounter(ctx, context.campaign);
      const last = live.lastTurnGain;
      if (
        !encounter ||
        !encounter.activeTurnId ||
        !last ||
        last.encounterId !== encounter._id ||
        last.turnId !== encounter.activeTurnId
      )
        throw new ConvexError(
          `${character.authored.name} can forgo now only during their own turn, after its turn-start gain; otherwise use value=on before the next turn.`,
        );
      if (live.forgoing)
        throw new ConvexError(`${character.authored.name} is already forgoing this turn.`);
      // The choice belongs to the turn start: once the pool moved (a claim or a spend), the gain
      // can no longer be cleanly forgone.
      if (
        live.heroicResource.current !== last.after ||
        (await poolChangedSince(ctx, character._id, last.eventId))
      )
        throw new ConvexError(
          `${character.authored.name}'s ${live.heroicResource.name} changed after the turn-start gain (a claim or a spend); forgo at the turn start, before using it.`,
        );
      const floor = heroicResourceFloor(baseline, live.heroicResource.name);
      const before = live.heroicResource.current;
      const after = Math.max(floor, before - last.delta);
      return {
        kind: 'resource.forgo',
        description: `${character.authored.name} forgoes ${live.heroicResource.name} until the start of their next turn (Self-Taught): this turn's gain is removed, ${before} → ${after}.`,
        data: {
          characterId: character._id,
          forgoing: true,
          before,
          after,
          sourcePath: SELF_TAUGHT.sourcePath,
          quote: SELF_TAUGHT.quote,
        },
        commit: async (mctx, scope) => {
          const current = (await mctx.db.get(character._id))!;
          await journalPatch(mctx, scope, 'characters', character._id, {
            liveState: {
              ...current.liveState!,
              heroicResource: { ...current.liveState!.heroicResource, current: after },
              forgoing: true,
              forgoNext: false,
            },
          });
        },
      };
    }
    const on = value === 'on';
    if ((live.forgoNext ?? false) === on)
      throw new ConvexError(
        `${character.authored.name} ${on ? 'already forgoes' : 'is not forgoing'} the next turn-start gain.`,
      );
    return {
      kind: 'resource.forgo',
      description: on
        ? `${character.authored.name} will forgo their Heroic Resource at the next turn start (Self-Taught).`
        : `${character.authored.name} will not forgo their Heroic Resource at the next turn start.`,
      data: {
        characterId: character._id,
        forgoNext: on,
        sourcePath: SELF_TAUGHT.sourcePath,
        quote: SELF_TAUGHT.quote,
      },
      commit: async (mctx, scope) => {
        const current = (await mctx.db.get(character._id))!;
        await journalPatch(mctx, scope, 'characters', character._id, {
          liveState: { ...current.liveState!, forgoNext: on },
        });
      },
    };
  },
};

/**
 * V150 (QC1 R1): whether anything other than the turn-start gain changed the hero's pool after it,
 * from the journal. Changes whose event was undone don't count. A claim followed by a spend that
 * restores the value is still a change.
 */
async function poolChangedSince(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
  gainEventId: string,
): Promise<boolean> {
  // Walk the hero's journal newest first, without a cap, until the gain's own rows. If the gain is
  // never reached, the history can't confirm the pool is untouched, so treat it as changed.
  const rows = ctx.db
    .query('changes')
    .withIndex('by_entity', q => q.eq('entityTable', 'characters').eq('entityId', characterId))
    .order('desc');
  for await (const row of rows) {
    if (row.eventId === gainEventId) return false;
    if (row.path !== 'liveState.heroicResource.current') continue;
    const event = await ctx.db.get(row.eventId);
    // Undo/redo/rewind write restoring rows under history events; the original event's
    // disposition says whether its change stands.
    if (event && event.disposition !== 'undone' && !event.kind.startsWith('history.')) return true;
  }
  return true;
}

/** V150: the hero's Self-Taught forgo state for `abilities:sheet`, or null without it. */
export function resourceForgoState(character: Doc<'characters'>) {
  const baseline = baselineOf(character.derivedBaseline);
  if (!canForgo(baseline) || !generationProfile(baseline) || !character.liveState) return null;
  return {
    forgoNext: character.liveState.forgoNext ?? false,
    forgoing: character.liveState.forgoing ?? false,
    sourcePath: SELF_TAUGHT.sourcePath,
    quote: SELF_TAUGHT.quote,
  };
}

/** V147: the hero's turn-start prayer state for `abilities:sheet`, or null without one. */
export function resourcePrayer(character: Doc<'characters'>) {
  const profile = generationProfile(baselineOf(character.derivedBaseline));
  const prayer = profile ? prayerFor(profile, baselineOf(character.derivedBaseline)) : undefined;
  if (!prayer || !character.liveState) return null;
  return {
    label: prayer.label,
    prayNext: character.liveState.prayNext ?? false,
    sourcePath: prayer.sourcePath,
    quote: prayer.quote,
  };
}

/**
 * V147: declare (or withdraw) a prayer for the hero's next turn-start roll. "Before you roll to gain
 * piety at the start of your turn, you can pray (no action required)."
 * (feature/conduit/level-1/piety.md). The clock resolves it at that turn start and clears it.
 */
const resourcePray: OperationDefinition = {
  id: 'resource.pray',
  family: 'resource',
  verb: 'pray',
  title: 'Pray before the next turn-start roll',
  description:
    "Declare that the hero prays before their next turn-start heroic-resource roll (the Conduit's piety prayer), or withdraw it. The clock applies the prayer's outcome at that turn start.",
  args: { value: v.optional(v.string()) },
  argDescriptions: { value: '`on` (default) to pray at the next turn start, `off` to withdraw.' },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }): Promise<Outcome> => {
    if (actor!.kind !== 'character')
      throw new ConvexError(`${actor!.name} is not a hero; only heroes have heroic resources.`);
    const character = await ctx.db.get(actor!.id as Id<'characters'>);
    if (!character || character.campaignId !== context.campaign._id)
      throw new ConvexError('That hero is not at this table.');
    const live = requireHeroLive(character);
    const profile = generationProfile(baselineOf(character.derivedBaseline));
    const prayer = profile ? prayerFor(profile, baselineOf(character.derivedBaseline)) : undefined;
    if (!prayer) throw new ConvexError(`${character.authored.name} has no turn-start prayer.`);
    const value = String(args.value ?? 'on').toLowerCase();
    if (value !== 'on' && value !== 'off') throw new ConvexError('"value" must be on or off.');
    const on = value === 'on';
    if ((live.prayNext ?? false) === on)
      throw new ConvexError(
        `${character.authored.name} ${on ? 'already prays' : 'is not praying'} at the next turn start.`,
      );
    return {
      kind: 'resource.prayer',
      description: on
        ? `${character.authored.name} will pray before the next turn-start ${live.heroicResource.name} roll.`
        : `${character.authored.name} will not pray at the next turn start.`,
      data: {
        characterId: character._id,
        prayNext: on,
        sourcePath: prayer.sourcePath,
        quote: prayer.quote,
      },
      commit: async (mctx, scope) => {
        const current = (await mctx.db.get(character._id))!;
        await journalPatch(mctx, scope, 'characters', character._id, {
          liveState: { ...current.liveState!, prayNext: on },
        });
      },
    };
  },
};

/**
 * V148 (QC1 train-4 R3): whether the hero's latest gameplay is an unmaintained use of this ability,
 * i.e. the choice to maintain is still "immediately after you first use the ability"
 * (feature/elementalist/level-1/persistent-magic.md). Walking this encounter's standing user
 * commands newest first, each earlier maintain of the ability pairs off with the use before it;
 * the first unpaired command must be a use of this ability by this hero. Anything else in between
 * (another command, a turn change) closes the choice. Engine and clock consequences are ignored.
 */
async function maintenanceWindowOpen(
  ctx: ReadCtx,
  encounterId: Id<'encounters'>,
  characterId: Id<'characters'>,
  ability: string,
): Promise<boolean> {
  let pending = 0;
  const events = ctx.db
    .query('events')
    .withIndex('by_encounter_sequence', q => q.eq('encounterId', encounterId))
    .order('desc');
  for await (const event of events) {
    if (event.origin !== 'user' || event.disposition === 'undone') continue;
    if (event.kind.startsWith('history.')) continue;
    const payload = event.payload as
      | {
          envelope?: { boundActor?: { id?: string } | null };
          data?: { ability?: { name?: string } | string; value?: unknown };
        }
      | undefined;
    const mine = payload?.envelope?.boundActor?.id === characterId;
    if (
      mine &&
      event.kind === 'resource.maintain' &&
      payload?.data?.ability === ability &&
      payload.data.value !== 'off'
    ) {
      pending++;
      continue;
    }
    const isUse =
      mine &&
      (event.kind === 'ability.use' || event.kind === 'ability.recorded') &&
      typeof payload?.data?.ability === 'object' &&
      payload.data.ability.name === ability;
    if (isUse && pending > 0) {
      pending--;
      continue;
    }
    return isUse;
  }
  return false;
}

/** V148: the hero's maintainable persistent abilities for `abilities:sheet`, or null. */
export async function resourceMaintenance(
  ctx: ReadCtx,
  campaign: Doc<'campaigns'>,
  character: Doc<'characters'>,
) {
  const baseline = baselineOf(character.derivedBaseline);
  const profile = generationProfile(baseline);
  if (!profile?.persistent || !character.liveState || !baseline) return null;
  const owned = new Set(baseline.abilities.map(ability => ability.name));
  const encounter = await committedEncounter(ctx, campaign);
  const maintained = (character.liveState.maintained ?? []).filter(
    entry => entry.encounterId === encounter?._id,
  );
  return {
    sourcePath: profile.persistent.sourcePath,
    quote: profile.persistent.quote,
    inCombat: encounter !== null,
    abilities: profile.persistent.abilities
      .filter(ability => owned.has(ability.name))
      .map(ability => ({
        name: ability.name,
        value: ability.value,
        sourcePath: ability.sourcePath,
        maintained: maintained.filter(entry => entry.ability === ability.name).length,
      })),
  };
}

/**
 * V148: start or stop maintaining a persistent ability in combat (feature/elementalist/level-1/
 * persistent-magic.md): "You can't maintain any abilities that would make you earn a negative
 * amount of essence at the start of your turn. You can stop maintaining an ability at any time (no
 * action required)." The effect itself is resolved at the table.
 */
const resourceMaintain: OperationDefinition = {
  id: 'resource.maintain',
  family: 'resource',
  verb: 'maintain',
  title: 'Maintain a persistent ability',
  description:
    'Start (value=on, default) or stop (value=off) maintaining one of the hero’s persistent abilities in combat. Each maintained ability reduces the turn-start Heroic Resource gain by its persistent value.',
  args: { ability: v.string(), value: v.optional(v.string()) },
  argDescriptions: {
    ability: 'The persistent ability’s name.',
    value: '`on` (default) to maintain, `off` to stop.',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }): Promise<Outcome> => {
    if (actor!.kind !== 'character')
      throw new ConvexError(`${actor!.name} is not a hero; only heroes maintain abilities.`);
    const character = await ctx.db.get(actor!.id as Id<'characters'>);
    if (!character || character.campaignId !== context.campaign._id)
      throw new ConvexError('That hero is not at this table.');
    const live = requireHeroLive(character);
    const baseline = baselineOf(character.derivedBaseline);
    const profile = generationProfile(baseline);
    if (!profile?.persistent || !baseline)
      throw new ConvexError(`${character.authored.name} has no persistent abilities to maintain.`);
    const name = String(args.ability);
    const ability = profile.persistent.abilities.find(entry => entry.name === name);
    if (!ability || !baseline.abilities.some(owned => owned.name === name))
      throw new ConvexError(`${character.authored.name} has no persistent ability "${name}".`);
    const encounter = await committedEncounter(ctx, context.campaign);
    if (!encounter || !(encounter.heroParticipantIds ?? []).includes(character._id))
      throw new ConvexError(
        'Maintaining is tracked in combat; outside combat you maintain it for rounds equal to your Victories, resolved manually.',
      );
    const value = String(args.value ?? 'on').toLowerCase();
    if (value !== 'on' && value !== 'off') throw new ConvexError('"value" must be on or off.');
    const current = (live.maintained ?? []).filter(entry => entry.encounterId === encounter._id);
    const already = current.some(entry => entry.ability === name);
    if (value === 'off' && !already)
      throw new ConvexError(`${character.authored.name} is not maintaining ${name}.`);
    if (value === 'on') {
      // "Whenever you use a persistent ability, you decide whether you want to maintain it, and start
      // doing so immediately after you first use the ability": each maintained instance needs its
      // own recorded use of the ability in the current turn (QC1 train-4 R3: the choice closes when
      // play moves on). Instances on different targets may run at once ("A creature can't be
      // affected by multiple instances").
      if (!(await maintenanceWindowOpen(ctx, encounter._id, character._id, name)))
        throw new ConvexError(
          `${character.authored.name} can maintain ${name} only right after using it: use the ability, then maintain it before anything else happens.`,
        );
      const upkeep = current.reduce((sum, entry) => sum + entry.value, 0) + ability.value;
      const gain = profile.turnStart.kind === 'fixed' ? profile.turnStart.amount : 0;
      if (upkeep > gain)
        throw new ConvexError(
          `Maintaining ${name} (persistent ${ability.value}) would make ${character.authored.name} earn a negative amount of ${live.heroicResource.name} at the start of their turn (${gain} − ${upkeep}).`,
        );
    }
    const removeAt = current.findIndex(entry => entry.ability === name);
    const next =
      value === 'on'
        ? [...current, { ability: name, value: ability.value, encounterId: encounter._id }]
        : current.filter((_, index) => index !== removeAt);
    return {
      kind: 'resource.maintain',
      description:
        value === 'on'
          ? `${character.authored.name} maintains ${name} (persistent ${ability.value}): the turn-start ${live.heroicResource.name} gain is reduced by ${next.reduce((s, e) => s + e.value, 0)}.`
          : `${character.authored.name} stops maintaining one instance of ${name}.`,
      data: {
        characterId: character._id,
        ability: name,
        value,
        persistentValue: ability.value,
        turnId: encounter.activeTurnId ?? null,
        maintained: next.map(entry => entry.ability),
        instances: next.filter(entry => entry.ability === name).length,
        sourcePath: profile.persistent.sourcePath,
        abilitySourcePath: ability.sourcePath,
      },
      commit: async (mctx, scope) => {
        const latest = (await mctx.db.get(character._id))!;
        await journalPatch(mctx, scope, 'characters', character._id, {
          liveState: { ...latest.liveState!, maintained: next },
        });
      },
    };
  },
};

export const resourceOperations: OperationDefinition[] = [
  resourceClaim,
  resourceForgo,
  resourcePray,
  resourceMaintain,
];
