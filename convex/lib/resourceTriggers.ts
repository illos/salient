// SPDX-License-Identifier: GPL-3.0-only
/**
 * Class heroic-resource triggers: their limits, their availability, and applying a gain. Shared by
 * the `resource.claim` operation (V120, table-confirmed) and by the damage observer (V142, applied
 * when the app records the event). Both write through the causing operation's journal scope, so
 * undo and redo restore the pool and the claim record together, and both honour the same limit.
 *
 * Profiles and quotes: shared/resolve/heroicResourceGeneration.ts. Decision:
 * docs/decisions/2026-09-24-heroic-resource-automation.md.
 */
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import {
  claimWindow,
  generationProfile,
  triggerAmount,
  type GenerationProfile,
  type ResourceTrigger,
} from '../../shared/resolve/heroicResourceGeneration';
import type { ResourceClaim } from '../../shared/contracts/liveState';
import type { DieResult } from '../../shared/contracts/history';
import { baselineOf } from './characterBuild';
import { heroicResourceFloor } from '../../shared/resolve/resourceFloor';
import { committedEncounter } from './encounters';
import { appendEvent } from './events';
import { rollDice } from './dice';
import { journalPatch, type JournalScope } from './journal';

export const LIMIT_TEXT: Record<ResourceTrigger['limit'], string> = {
  round: 'this round',
  turn: 'this turn',
  encounter: 'this encounter',
};

/** Why this hero can't gain from a trigger now, or null. */
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
  return null;
}

/** V150: the refusal while forgoing (complication/self-taught.md). */
function forgoingReason(character: Doc<'characters'>): string {
  return `${character.authored.name} is forgoing their Heroic Resource until the start of their next turn (Self-Taught).`;
}

/**
 * Whether one trigger can apply now: the reason it can't, or the claim window that enforces its
 * limit, plus the sourced amount at the hero's level either way.
 */
export function claimState(
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
  if (taken) return { reason: `Already claimed ${LIMIT_TEXT[trigger.limit]}.`, clause } as const;
  // V150: no gain while forgoing. The occurrence still happened, so observers record it (QC1 V142
  // R1): a forgone "first time" is still the first time.
  if (character.liveState?.forgoing)
    return { reason: forgoingReason(character), clause, window, forgone: true } as const;
  return { reason: null, clause, window } as const;
}

/** "+1", "+1d3": the gain as printed. */
export function gainText(trigger: ResourceTrigger, amount: number): string {
  return trigger.dice ? `+1d${trigger.dice.sides}` : `+${amount}`;
}

/** Rolls a dice trigger's gain (idempotent per key) or returns its fixed amount. */
export async function rollGain(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  key: string,
  trigger: ResourceTrigger,
  amount: number,
  issuer: Id<'users'> | null,
): Promise<{ amount: number; dice?: DieResult[] }> {
  if (!trigger.dice) return { amount };
  const accepted = await rollDice(
    ctx,
    campaignId,
    key,
    [{ id: 'gain', sides: trigger.dice.sides }],
    issuer,
  );
  return { amount: accepted.dice[0]!.value, dice: accepted.dice };
}

/** Writes a gain and its claim record to the hero's live state, journaled under `scope`. */
export async function writeTriggerGain(
  ctx: MutationCtx,
  scope: JournalScope,
  characterId: Id<'characters'>,
  claim: Omit<ResourceClaim, 'eventId'> & { eventId: string },
  amount: number,
): Promise<{ before: number; after: number }> {
  const hero = (await ctx.db.get(characterId))!;
  const live = hero.liveState!;
  const before = live.heroicResource.current;
  const after = before + amount;
  await journalPatch(ctx, scope, 'characters', characterId, {
    liveState: {
      ...live,
      heroicResource: { ...live.heroicResource, current: after },
      resourceClaims: [...(live.resourceClaims ?? []), claim],
    },
  });
  return { before, after };
}

/**
 * Applies one observed trigger to one hero if it is available now: rolls any dice, logs a
 * `resource.triggered` consequence linked to the causing event, and writes the gain and its claim
 * record in the causing operation's journal scope. `useEventId` is the ability use the gain came
 * from, so a later correction of that use can reconcile it.
 */
async function applyObserved(
  ctx: MutationCtx,
  scope: JournalScope,
  characterId: Id<'characters'>,
  profile: GenerationProfile,
  trigger: ResourceTrigger,
  encounter: Doc<'encounters'> | null,
  useEventId: string,
): Promise<void> {
  const current = (await ctx.db.get(characterId))!;
  const state = claimState(current, profile, trigger, encounter);
  if ('forgone' in state && state.forgone) {
    // Record the occurrence with no gain, so the trigger's limit is used (QC1 V142 R1).
    const cause = (await ctx.db.get(scope.eventId))!;
    const eventId = await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: encounter!._id,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: 'resource.forgone',
      description: `${current.authored.name}: ${trigger.label} — no ${current.liveState!.heroicResource.name} while forgoing (Self-Taught); this counts as the ${LIMIT_TEXT[trigger.limit].replace('this ', '')}'s occurrence.`,
      payload: {
        data: {
          characterId,
          triggerId: trigger.id,
          useEventId,
          delta: 0,
          sourcePath: state.clause.sourcePath,
          quote: state.clause.quote,
        },
      },
    });
    await writeTriggerGain(
      ctx,
      scope,
      characterId,
      { triggerId: trigger.id, encounterId: encounter!._id, ...state.window, eventId },
      0,
    );
    return;
  }
  if (state.reason !== null) return;
  const cause = (await ctx.db.get(scope.eventId))!;
  const gain = await rollGain(
    ctx,
    scope.campaignId,
    `hrt_${scope.eventId}_${characterId}_${trigger.id}`,
    trigger,
    state.clause.amount,
    null,
  );
  const pool = current.liveState!.heroicResource.name;
  const poolBefore = current.liveState!.heroicResource.current;
  const poolAfter = poolBefore + gain.amount;
  const eventId = await appendEvent(ctx, {
    campaignId: scope.campaignId,
    sessionId: cause.sessionId,
    encounterId: encounter!._id,
    origin: 'engine',
    commandId: cause.commandId,
    causeEventId: scope.eventId,
    kind: 'resource.triggered',
    description: `${current.authored.name}: ${trigger.label} — ${gainText(trigger, gain.amount)}${
      gain.dice ? ` = ${gain.amount}` : ''
    } ${pool} (${poolBefore} → ${poolAfter}).`,
    ...(gain.dice ? { dice: gain.dice } : {}),
    payload: {
      data: {
        characterId,
        triggerId: trigger.id,
        useEventId,
        resource: pool,
        before: poolBefore,
        delta: gain.amount,
        after: poolAfter,
        round: encounter!.round ?? 0,
        sourcePath: state.clause.sourcePath,
        quote: state.clause.quote,
      },
    },
  });
  await writeTriggerGain(
    ctx,
    scope,
    characterId,
    { triggerId: trigger.id, encounterId: encounter!._id, ...state.window, eventId },
    gain.amount,
  );
}

type Pools = { stamina: number; temporaryStamina: number };

/**
 * Whether a change of pools satisfies a damage trigger.
 * - `damage-taken`: Stamina or temporary Stamina went down (Q-RES-4: 0 damage is not taken).
 * - `winded-or-dying` (Q-RES-2): Stamina went from above the winded value to at or below it, or
 *   from above 0 to 0 or lower ("become winded or are dying"); one grant per encounter.
 */
function damageSatisfies(
  observe: ResourceTrigger['observe'],
  winded: number,
  before: Pools,
  after: Pools,
): boolean {
  if (observe === 'damage-taken')
    return after.stamina + after.temporaryStamina < before.stamina + before.temporaryStamina;
  if (observe === 'winded-or-dying')
    return (
      (before.stamina > winded && after.stamina <= winded) ||
      (before.stamina > 0 && after.stamina <= 0)
    );
  return false;
}

/**
 * V142: after a recorded damage write to a hero, applies the hero's observed triggers that the write
 * satisfies, each within its limit, as linked consequences of the causing operation.
 */
export async function observeHeroDamage(
  ctx: MutationCtx,
  scope: JournalScope,
  characterId: Id<'characters'>,
  before: Pools,
  after: Pools,
  useEventId: string = scope.eventId,
): Promise<void> {
  const character = await ctx.db.get(characterId);
  const baseline = baselineOf(character?.derivedBaseline);
  const profile = generationProfile(baseline);
  if (!character?.liveState || !baseline || !profile || character.campaignId !== scope.campaignId)
    return;
  const due = profile.triggers.filter(trigger =>
    damageSatisfies(trigger.observe, baseline.windedValue.value, before, after),
  );
  if (!due.length) return;
  const campaign = await ctx.db.get(scope.campaignId);
  const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
  for (const trigger of due)
    await applyObserved(ctx, scope, characterId, profile, trigger, encounter, useEventId);
}

/**
 * V142: a correction recomputes an ability use's damage from the same starting pools. Gains that
 * use observed on this hero and that the corrected damage no longer satisfies are reversed: the
 * amount is removed (not below the pool's floor) and the claim is released, logged as a
 * `resource.reversed` consequence of the correction. Gains the corrected damage newly satisfies are
 * applied by the correction's own damage write.
 */
export async function reconcileObservedGains(
  ctx: MutationCtx,
  scope: JournalScope,
  characterId: Id<'characters'>,
  useEventId: string,
  start: Pools,
  corrected: Pools,
): Promise<void> {
  const character = await ctx.db.get(characterId);
  const baseline = baselineOf(character?.derivedBaseline);
  const live = character?.liveState;
  if (!character || !live || !baseline) return;
  const profile = generationProfile(baseline);
  const cause = (await ctx.db.get(scope.eventId))!;
  let claims = live.resourceClaims ?? [];
  let current = live.heroicResource.current;
  for (const claim of [...claims]) {
    const event = await ctx.db.get(claim.eventId as Id<'events'>);
    const data = (event?.payload as { data?: { useEventId?: string; delta?: number } } | undefined)
      ?.data;
    if (
      !event ||
      (event.kind !== 'resource.triggered' && event.kind !== 'resource.forgone') ||
      data?.useEventId !== useEventId
    )
      continue;
    const trigger = profile?.triggers.find(t => t.id === claim.triggerId);
    // Only damage triggers depend on the corrected damage; others linked to the use stand.
    if (trigger?.observe !== 'damage-taken' && trigger?.observe !== 'winded-or-dying') continue;
    if (damageSatisfies(trigger.observe, baseline.windedValue.value, start, corrected)) continue;
    const floor = heroicResourceFloor(baseline, live.heroicResource.name);
    const after = Math.max(floor, current - (data.delta ?? 0));
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      ...(event.encounterId ? { encounterId: event.encounterId } : {}),
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: 'resource.reversed',
      description: `${character.authored.name}: ${trigger?.label ?? claim.triggerId} no longer applies after the correction — ${live.heroicResource.name} ${current} → ${after}${
        after !== current - (data.delta ?? 0) ? ' (not below its floor)' : ''
      }.`,
      payload: {
        data: {
          characterId,
          triggerId: claim.triggerId,
          reversedEventId: claim.eventId,
          before: current,
          after,
        },
      },
    });
    claims = claims.filter(c => c.eventId !== claim.eventId);
    current = after;
  }
  if (claims.length !== (live.resourceClaims ?? []).length)
    await journalPatch(ctx, scope, 'characters', characterId, {
      liveState: {
        ...live,
        heroicResource: { ...live.heroicResource, current },
        resourceClaims: claims,
      },
    });
}
