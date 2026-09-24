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
  claimWindow,
  generationProfile,
  type GenerationProfile,
  type ResourceTrigger,
} from '../../shared/resolve/heroicResourceGeneration';
import type { ResourceClaim } from '../../shared/contracts/liveState';
import { baselineOf, requireHeroLive } from './characterBuild';
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

function claimed(
  claims: ResourceClaim[] | undefined,
  trigger: ResourceTrigger,
  encounter: Doc<'encounters'>,
): boolean {
  const window = claimWindow(trigger.limit, {
    round: encounter.round ?? 0,
    turnId: encounter.activeTurnId ?? undefined,
  });
  return (claims ?? []).some(
    claim =>
      claim.triggerId === trigger.id &&
      claim.encounterId === encounter._id &&
      claim.round === window.round &&
      claim.turnId === window.turnId,
  );
}

/** Why no trigger of this hero can be claimed now, or null. */
function blocked(character: Doc<'characters'>, encounter: Doc<'encounters'> | null): string | null {
  if (!encounter) return 'Only during combat: there is no gain outside of combat.';
  if (encounter.phase === 'closeout') return 'Combat has ended.';
  if (!(encounter.heroParticipantIds ?? []).includes(character._id))
    return `${character.authored.name} is not in this combat.`;
  if ((encounter.round ?? 0) < 1) return 'Combat rounds have not started yet.';
  return null;
}

/** The hero's enabled class triggers and whether each can be claimed now (for `abilities:sheet`). */
export async function resourceTriggers(
  ctx: ReadCtx,
  campaign: Doc<'campaigns'>,
  character: Doc<'characters'>,
): Promise<TriggerAvailability[]> {
  const profile = generationProfile(baselineOf(character.derivedBaseline)?.class.value);
  const live = character.liveState;
  if (!profile || !live) return [];
  const encounter = await committedEncounter(ctx, campaign);
  const reason = blocked(character, encounter);
  return profile.triggers.map(trigger => ({
    id: trigger.id,
    label: trigger.label,
    amount: trigger.amount,
    resource: live.heroicResource.name,
    limit: trigger.limit,
    sourcePath: trigger.sourcePath,
    quote: trigger.quote,
    confirmation: trigger.confirmation,
    unavailable:
      reason ??
      (claimed(live.resourceClaims, trigger, encounter!)
        ? `Already claimed ${LIMIT_TEXT[trigger.limit]}.`
        : null),
  }));
}

function findTrigger(profile: GenerationProfile | undefined, id: string) {
  return profile?.triggers.find(trigger => trigger.id === id);
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
    const profile = generationProfile(baselineOf(character.derivedBaseline)?.class.value);
    const trigger = findTrigger(profile, String(args.trigger));
    if (!profile || !trigger)
      throw new ConvexError(
        `${character.authored.name} has no heroic-resource trigger "${String(args.trigger)}"${
          profile?.triggers.length
            ? `; available: ${profile.triggers.map(t => t.id).join(', ')}`
            : ''
        }.`,
      );
    const encounter = await committedEncounter(ctx, context.campaign);
    const reason = blocked(character, encounter);
    if (reason) throw new ConvexError(reason);
    if (claimed(live.resourceClaims, trigger, encounter!))
      throw new ConvexError(
        `${character.authored.name} already claimed "${trigger.label}" ${LIMIT_TEXT[trigger.limit]}.`,
      );
    const pool = live.heroicResource;
    const before = pool.current;
    const after = before + trigger.amount;
    const window = claimWindow(trigger.limit, {
      round: encounter!.round ?? 0,
      turnId: encounter!.activeTurnId ?? undefined,
    });
    return {
      kind: 'resource.claimed',
      description: `${character.authored.name}: ${trigger.label} — +${trigger.amount} ${pool.name} (${before} → ${after}).`,
      data: {
        characterId: character._id,
        triggerId: trigger.id,
        resource: pool.name,
        before,
        delta: trigger.amount,
        after,
        round: encounter!.round ?? 0,
        sourcePath: trigger.sourcePath,
        quote: trigger.quote,
      },
      commit: async (mctx, scope) => {
        const claim: ResourceClaim = {
          triggerId: trigger.id,
          encounterId: encounter!._id,
          ...window,
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

export const resourceOperations: OperationDefinition[] = [resourceClaim];
