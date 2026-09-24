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
  claimWindow,
  generationProfile,
  triggerAmount,
  type GenerationProfile,
  type ResourceTrigger,
} from '../../shared/resolve/heroicResourceGeneration';
import type { ResourceClaim } from '../../shared/contracts/liveState';
import { baselineOf, requireHeroLive } from './characterBuild';
import { heroicResourceFloor } from '../../shared/resolve/resourceFloor';
import { committedEncounter } from './encounters';
import { journalPatch } from './journal';
import type { OperationDefinition, Outcome } from './registry';

export interface TriggerAvailability {
  id: string;
  label: string;
  amount: number;
  resource: string;
  limit: ResourceTrigger['limit'];
  sourcePath: string;
  quote: string;
  confirmation: string;
  /** Null when it can be claimed now; otherwise why not. */
  unavailable: string | null;
}

const LIMIT_TEXT: Record<ResourceTrigger['limit'], string> = {
  round: 'this round',
  turn: 'this turn',
  encounter: 'this encounter',
};

/** Why this hero can't claim anything now, or null. */
function blocked(
  character: Doc<'characters'>,
  profile: GenerationProfile,
  encounter: Doc<'encounters'> | null,
): string | null {
  if (!encounter) return 'Only during combat: there is no gain outside of combat.';
  if (encounter.phase === 'closeout') return 'Combat has ended.';
  if (!(encounter.heroParticipantIds ?? []).includes(character._id))
    return `${character.authored.name} is not in this combat.`;
  if ((encounter.round ?? 0) < 1) return 'Combat rounds have not started yet.';
  if (character.liveState?.heroicResource.name.toLowerCase() !== profile.resource)
    return `${character.authored.name}'s pool is not ${profile.resource}; adjust it manually.`;
  if (character.liveState?.forgoing)
    return `${character.authored.name} is forgoing their Heroic Resource until the start of their next turn (Self-Taught).`;
  return null;
}

/**
 * Whether one trigger can be claimed now: the reason it can't, or the claim window that enforces
 * its limit and the sourced amount at the hero's level.
 */
function claimState(
  character: Doc<'characters'>,
  profile: GenerationProfile,
  trigger: ResourceTrigger,
  encounter: Doc<'encounters'> | null,
) {
  const clause = triggerAmount(trigger, baselineOf(character.derivedBaseline)!.level.value);
  const reason = blocked(character, profile, encounter);
  if (reason) return { reason, clause } as const;
  const window = claimWindow(trigger.limit, {
    round: encounter!.round ?? 0,
    turnId: encounter!.activeTurnId ?? undefined,
  });
  if (!window) return { reason: 'No turn is active.', clause } as const;
  const taken = (character.liveState?.resourceClaims ?? []).some(
    claim =>
      claim.triggerId === trigger.id &&
      claim.encounterId === encounter!._id &&
      claim.round === window.round &&
      claim.turnId === window.turnId,
  );
  return taken
    ? ({ reason: `Already claimed ${LIMIT_TEXT[trigger.limit]}.`, clause } as const)
    : ({ reason: null, clause, window } as const);
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
  return profile.triggers.map(trigger => {
    const state = claimState(character, profile, trigger, encounter);
    return {
      id: trigger.id,
      label: trigger.label,
      amount: state.clause.amount,
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
  execute: async (ctx, { context, actor, args }): Promise<Outcome> => {
    if (actor!.kind !== 'character')
      throw new ConvexError(`${actor!.name} is not a hero; only heroes have heroic resources.`);
    const character = await ctx.db.get(actor!.id as Id<'characters'>);
    if (!character || character.campaignId !== context.campaign._id)
      throw new ConvexError('That hero is not at this table.');
    const live = requireHeroLive(character);
    const profile = generationProfile(baselineOf(character.derivedBaseline));
    const trigger = profile?.triggers.find(t => t.id === String(args.trigger));
    if (!profile || !trigger)
      throw new ConvexError(
        `${character.authored.name} has no heroic-resource trigger "${String(args.trigger)}"${
          profile?.triggers.length
            ? `; available: ${profile.triggers.map(t => t.id).join(', ')}`
            : ''
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
    const pool = live.heroicResource;
    const before = pool.current;
    const amount = state.clause.amount;
    const after = before + amount;
    return {
      kind: 'resource.claimed',
      description: `${character.authored.name}: ${trigger.label} — +${amount} ${pool.name} (${before} → ${after}).`,
      data: {
        characterId: character._id,
        triggerId: trigger.id,
        resource: pool.name,
        before,
        delta: amount,
        after,
        round: encounter!.round ?? 0,
        sourcePath: state.clause.sourcePath,
        quote: state.clause.quote,
      },
      commit: async (mctx, scope) => {
        const claim: ResourceClaim = {
          triggerId: trigger.id,
          encounterId: encounter!._id,
          ...state.window,
          eventId: scope.eventId,
        };
        await journalPatch(mctx, scope, 'characters', character._id, {
          liveState: {
            ...live,
            heroicResource: { ...pool, current: after },
            resourceClaims: [...(live.resourceClaims ?? []), claim],
          },
        });
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
  const rows = await ctx.db
    .query('changes')
    .withIndex('by_entity', q => q.eq('entityTable', 'characters').eq('entityId', characterId))
    .order('desc')
    .take(500);
  for (const row of rows) {
    if (row.eventId === gainEventId) return false;
    if (row.path !== 'liveState.heroicResource.current') continue;
    const event = await ctx.db.get(row.eventId);
    // Undo/redo/rewind write restoring rows under history events; the original event's
    // disposition says whether its change stands.
    if (event && event.disposition !== 'undone' && !event.kind.startsWith('history.')) return true;
  }
  return false;
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

export const resourceOperations: OperationDefinition[] = [resourceClaim, resourceForgo];
