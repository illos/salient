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
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import {
  claimWindow,
  generationProfile,
  triggerAmount,
  triggersFor,
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
  each: 'for this occurrence',
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
  if (character.liveState?.generationSuspended === encounter._id)
    return `${character.authored.name} was still dead when this encounter began, so gains no ${profile.resource} in it.`;
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
  const taken =
    trigger.limit !== 'each' &&
    (character.liveState?.resourceClaims ?? []).some(
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
      description: `${current.authored.name}: ${trigger.label} — no ${current.liveState!.heroicResource.name} while forgoing (Self-Taught); it still counts toward the trigger's limit (${LIMIT_TEXT[trigger.limit]}).`,
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
  if (!character?.liveState || !baseline || character.campaignId !== scope.campaignId) return;
  const winded = baseline.windedValue.value;
  const profile = generationProfile(baseline);
  if (profile)
    await observePersistentBreak(ctx, scope, characterId, profile, baseline, before, after);
  const own = profile
    ? triggersFor(profile, baseline).filter(trigger =>
        damageSatisfies(trigger.observe, winded, before, after),
      )
    : [];
  // V149: events about any hero, observed by other heroes' profiles (the Troubadour). Winded is
  // Stamina at or below the winded value (rule/health/winded.md); death is Stamina at or below the
  // negative of the winded value (rule/health/dying.md).
  const madeWinded = before.stamina > winded && after.stamina <= winded;
  const died = before.stamina > -winded && after.stamina <= -winded;
  if (!own.length && !madeWinded && !died) return;
  const campaign = await ctx.db.get(scope.campaignId);
  const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
  for (const trigger of own)
    await applyObserved(ctx, scope, characterId, profile!, trigger, encounter, useEventId);
  if (!encounter || (!madeWinded && !died)) return;
  for (const observerId of encounter.heroParticipantIds ?? []) {
    const observer = await ctx.db.get(observerId);
    const observerBaseline = baselineOf(observer?.derivedBaseline);
    const observerProfile = generationProfile(observerBaseline);
    if (!observer?.liveState || !observerProfile) continue;
    for (const trigger of triggersFor(observerProfile, observerBaseline)) {
      if (
        (trigger.observe === 'any-hero-winded' && madeWinded) ||
        (trigger.observe === 'any-hero-dies' && died)
      )
        await applyObserved(
          ctx,
          scope,
          observerId,
          observerProfile,
          trigger,
          encounter,
          `${useEventId}:${characterId}`,
        );
    }
  }
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

/**
 * V144: after a creature ability's own Malice cost is paid, applies every participating hero's
 * `malice-ability` triggers (the Null's "the Director uses an ability that costs Malice").
 */
export async function observeMaliceAbility(ctx: MutationCtx, scope: JournalScope): Promise<void> {
  const campaign = await ctx.db.get(scope.campaignId);
  const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
  if (!encounter) return;
  for (const characterId of encounter.heroParticipantIds ?? []) {
    const character = await ctx.db.get(characterId);
    const profile = generationProfile(baselineOf(character?.derivedBaseline));
    if (!character?.liveState || !profile) continue;
    for (const trigger of triggersFor(profile, baselineOf(character.derivedBaseline)).filter(
      t => t.observe === 'malice-ability',
    ))
      await applyObserved(ctx, scope, characterId, profile, trigger, encounter, scope.eventId);
  }
}

/**
 * V148 (feature/elementalist/level-1/persistent-magic.md): "If you take damage equal to or greater
 * than 5 times your Reason score in one turn, you stop maintaining any persistent abilities."
 * Labelled interpretation (Q-RES-10): "one turn" is the turn during which the damage is recorded
 * (the encounter's active turn, whoever's it is); damage recorded between turns counts alone.
 */
async function observePersistentBreak(
  ctx: MutationCtx,
  scope: JournalScope,
  characterId: Id<'characters'>,
  profile: GenerationProfile,
  baseline: NonNullable<ReturnType<typeof baselineOf>>,
  before: Pools,
  after: Pools,
): Promise<void> {
  if (!profile.persistent) return;
  const taken = before.stamina + before.temporaryStamina - (after.stamina + after.temporaryStamina);
  if (taken <= 0) return;
  const campaign = await ctx.db.get(scope.campaignId);
  const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
  if (!encounter) return;
  const hero = (await ctx.db.get(characterId))!;
  const live = hero.liveState!;
  const maintained = (live.maintained ?? []).filter(entry => entry.encounterId === encounter._id);
  // The tally runs whether or not anything is maintained yet, so damage earlier in the same turn
  // counts toward a break once maintenance starts (V148 review R4).
  const turnId = encounter.activeTurnId ?? `between-${scope.eventId}`;
  const sofar = live.turnDamage?.turnId === turnId ? live.turnDamage.amount : 0;
  const total = sofar + taken;
  const threshold = profile.persistent.breakMultiplierOfReason * baseline.characteristics.R.value;
  const broken = maintained.length > 0 && total >= threshold;
  if (broken) {
    const cause = (await ctx.db.get(scope.eventId))!;
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: encounter._id,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: 'resource.maintenance-ended',
      description: `${hero.authored.name} took ${total} damage this turn (at least ${profile.persistent.breakMultiplierOfReason} × Reason = ${threshold}): stops maintaining ${maintained.map(entry => entry.ability).join(', ')}.`,
      payload: {
        data: {
          characterId,
          damageThisTurn: total,
          threshold,
          ended: maintained.map(entry => entry.ability),
          sourcePath: profile.persistent.sourcePath,
        },
      },
    });
  }
  await journalPatch(ctx, scope, 'characters', characterId, {
    liveState: {
      ...live,
      turnDamage: { turnId, amount: total },
      ...(broken ? { maintained: [] } : {}),
    },
  });
}

/**
 * QC1 train-4 R1/R2: corrections that the resource automation can't reconcile exactly are refused
 * before anything changes, so the table rewinds instead:
 * - another hero's gain (the Troubadour's winded or death drama) was observed from this hit on
 *   this target: a correction could leave or duplicate it;
 * - the target maintains persistent abilities (the Elementalist): the turn's damage tally and any
 *   break it caused can't be recomputed from a corrected hit.
 */
export async function assertCorrectionReconcilable(
  ctx: MutationCtx,
  useEvent: Doc<'events'>,
  characterId: Id<'characters'>,
): Promise<void> {
  const character = await ctx.db.get(characterId);
  const profile = generationProfile(baselineOf(character?.derivedBaseline));
  const rewind =
    'Rewind to the ability use and record it again instead, so the heroic-resource automation stays exact.';
  if (profile?.persistent && useEvent.encounterId)
    throw new ConvexError(
      `${character!.authored.name}'s Persistent Magic tallies this damage for the turn; a correction can't recompute it. ${rewind}`,
    );
  if (!useEvent.encounterId) return;
  const linked = `${useEvent._id}:${characterId}`;
  const events = ctx.db
    .query('events')
    .withIndex('by_encounter_sequence', q => q.eq('encounterId', useEvent.encounterId))
    .order('desc');
  for await (const event of events) {
    if (event.sequence < useEvent.sequence) break;
    if (event.disposition === 'undone') continue;
    if (event.kind !== 'resource.triggered' && event.kind !== 'resource.forgone') continue;
    const data = (event.payload as { data?: { useEventId?: string } } | undefined)?.data;
    if (data?.useEventId === linked)
      throw new ConvexError(
        `This hit on ${character?.authored.name ?? 'the target'} gave another hero heroic resource (${event.description}). ${rewind}`,
      );
  }
}
