// SPDX-License-Identifier: GPL-3.0-only
/**
 * V171 watchers (docs/build/V171-watchers.md, docs/lasting-effects-design.md#3-watchers). A watcher
 * is an effect instance whose payload names an event, the creature whose event it is, a printed
 * limit and responses. The engine observes events where it already writes them:
 * - damage taken and dealt, made winded and dying: the damage writer (resolve.ts writeDamage);
 * - turn starts and ends: clock boundaries (clock.ts, `watcher` work registered with the instance);
 * - abilities used and strikes made: the ability use's commit.
 * A firing is written in the triggering operation's journal scope, so undo of that operation
 * reverts the firing, its limit record and every response with it. Its log entry is linked to the
 * operation. Corrections that would change a firing are refused (design section 7): the table
 * rewinds to the use instead.
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { DieResult } from '../../shared/contracts/history';
import type {
  EffectInstance,
  OwnedEffect,
  WatcherEvent,
  WatcherFiring,
} from '../../shared/contracts/liveState';
import { applyDamage } from '../../shared/resolve/index';
import {
  damageEvents,
  describeWatcher,
  watcherDue,
  watches,
  type WatchedOccurrence,
} from '../../shared/resolve/watchers';
import { applyConditionInstance } from './conditionInstances';
import { committedEncounter } from './encounters';
import { rollDice } from './dice';
import { appendEvent } from './events';
import { resolveHistoricalId } from './history';
import { journalPatch, type JournalScope } from './journal';
import {
  endEffectInstance,
  logEnded,
  ownerStateEnding,
  patchEffectInstance,
  readHolder,
  type EffectHolder,
} from './effectInstances';
import { damageTargetFacts, writePlannedDamage, type TargetRecord } from './resolve';
import { assertNoTriggerOnCorrection, offerForDamage } from './triggeredActions';
import { observeMarks } from './marks';

/**
 * Watchers set off by a watcher's own responses fire too, to this depth; deeper chains are left
 * to the table. Engine guard, not a rule: it keeps two watchers that answer each other's damage
 * from looping inside one operation.
 */
const MAX_DEPTH = 3;

export interface ObserveOptions {
  /** A correction's damage write: any watcher that would fire refuses the correction instead. */
  correction?: boolean;
  /**
   * V202: the damage the corrected hit dealt this creature before and after the correction (Stamina
   * and temporary Stamina lost), so a response that answers only whether damage was taken is judged
   * on that (convex/lib/triggeredActions.ts assertNoTriggerOnCorrection).
   */
  correctionTaken?: { before: number; after: number };
  /** How many watcher firings led to this observation. */
  depth?: number;
}

/** A creature's stored effects, when the caller already read them. */
export type Preloaded = { effectInstances: EffectInstance[]; ownedEffects: OwnedEffect[] };

type Found = { holder: EffectHolder; instance: EffectInstance; occurrence: WatchedOccurrence };

/**
 * The active watchers that watch these occurrences of one creature: those it holds, and those it
 * owns elsewhere whose owner pointer names the event (effectInstances.ts). `preloaded` is the
 * creature's record when the caller already read it.
 */
async function watchersOn(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  creature: EffectHolder,
  occurrences: readonly WatchedOccurrence[],
  preloaded?: Preloaded,
): Promise<Found[]> {
  const record = preloaded ?? (await readHolder(ctx, creature));
  if (!record) return [];
  const found: Found[] = [];
  for (const instance of record.effectInstances)
    for (const occurrence of occurrences)
      if (watches(instance, creature.id, occurrence))
        found.push({ holder: creature, instance, occurrence });
  for (const pointer of record.ownedEffects) {
    if (!pointer.watches || !occurrences.some(o => o.event === pointer.watches)) continue;
    const holder: EffectHolder = {
      kind: pointer.holder.kind,
      id: await resolveHistoricalId(ctx, campaignId, pointer.holder.id),
    };
    const held = await readHolder(ctx, holder);
    const instance = held?.effectInstances.find(
      item => item.id === pointer.id && item.status === 'active',
    );
    if (!instance || held!.campaignId !== campaignId) continue;
    for (const occurrence of occurrences)
      if (watches(instance, holder.id, occurrence)) found.push({ holder, instance, occurrence });
  }
  return found;
}

/** Where the current encounter's limit windows are: its round and active turn. */
async function windowOf(ctx: MutationCtx, campaignId: Id<'campaigns'>) {
  const campaign = await ctx.db.get(campaignId);
  const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
  if (!encounter || encounter.phase === 'closeout' || (encounter.round ?? 0) < 1) return {};
  return {
    encounterId: encounter._id as string,
    round: encounter.round ?? 0,
    ...(encounter.activeTurnId ? { turnId: encounter.activeTurnId as string } : {}),
  };
}

/** The record the damage writer needs for a hero or foe, or the reason there is none. */
async function recordOf(
  ctx: MutationCtx,
  party: EffectHolder & { name: string },
): Promise<TargetRecord | string> {
  if (party.kind === 'character') {
    const character = await ctx.db.get(party.id as Id<'characters'>);
    if (!character) return `${party.name} is no longer at the table`;
    return {
      actor: { kind: 'character', id: character._id, name: character.authored.name },
      character,
    };
  }
  const foe = await ctx.db.get(party.id as Id<'foes'>);
  if (!foe) return `${party.name} is no longer at the table`;
  // V158: a squad member's health is its squad's pool, which the watcher doesn't track.
  if (foe.squadId) return `${foe.name} is in a squad, whose pool the table adjusts`;
  return { actor: { kind: 'foe', id: foe._id, name: foe.name }, foe };
}

/** V175: a hero or foe named by id (the dealer of a `marked-damaged` occurrence). */
async function partyOf(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  id: string,
): Promise<(EffectHolder & { name: string }) | undefined> {
  const current = await resolveHistoricalId(ctx, campaignId, id);
  const heroId = ctx.db.normalizeId('characters', current);
  if (heroId) {
    const hero = await ctx.db.get(heroId);
    return hero ? { kind: 'character', id: hero._id, name: hero.authored.name } : undefined;
  }
  const foeId = ctx.db.normalizeId('foes', current);
  const foe = foeId ? await ctx.db.get(foeId) : null;
  return foe ? { kind: 'foe', id: foe._id, name: foe.name } : undefined;
}

/** A die key the dice service accepts (8–128 letters, digits, underscores, hyphens). */
function diceKey(scope: JournalScope, instanceId: string, index: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < instanceId.length; i++) {
    hash ^= instanceId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `watch_${scope.eventId}_${hash.toString(16)}_${index}`.slice(0, 128);
}

export interface Firing {
  description: string;
  dice: DieResult[];
  data: Record<string, unknown>;
}

/**
 * Fires one due watcher in the operation's journal scope: records the firing (its limit record),
 * then applies its responses in printed order. Damage goes through the damage writer; the damage
 * observations it produces are returned, so the caller logs this firing before any watcher they
 * set off.
 */
async function execute(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  instance: EffectInstance,
  window: Omit<WatcherFiring, 'causeEventId'>,
  deferred: DamageObservation[],
  /** V175: the observed occurrence, whose `otherId` is the dealer of `marked-damaged`. */
  occurrence?: WatchedOccurrence,
): Promise<Firing> {
  if (instance.payload.kind !== 'watcher') throw new ConvexError('Not a watcher.');
  const watcher = instance.payload.watcher;
  await patchEffectInstance(ctx, scope, holder, instance.id, current => ({
    ...current,
    firings: [...(current.firings ?? []), { causeEventId: scope.eventId, ...window }].slice(-200),
  }));
  const texts: string[] = [];
  const dice: DieResult[] = [];
  const applied: unknown[] = [];
  const subjectHolds = instance.subject.kind === 'character' || instance.subject.kind === 'foe';
  for (const [index, response] of watcher.responses.entries()) {
    if (response.kind === 'instruction') {
      texts.push(`for the table: "${response.text}"`);
      applied.push({ kind: 'instruction', status: 'manual' });
      continue;
    }
    const party =
      response.recipient === 'dealer'
        ? occurrence?.event === 'marked-damaged' && occurrence.otherId
          ? await partyOf(ctx, scope.campaignId, occurrence.otherId)
          : undefined
        : response.recipient === 'owner'
          ? instance.owner.kind === 'character' || instance.owner.kind === 'foe'
            ? {
                kind: instance.owner.kind,
                id: await resolveHistoricalId(ctx, scope.campaignId, instance.owner.id),
                name: instance.owner.name,
              }
            : undefined
          : subjectHolds
            ? { ...holder, name: instance.subject.name }
            : undefined;
    const record = party
      ? await recordOf(ctx, party)
      : `${instance.subject.name} has no live record`;
    const who = party?.name ?? instance.subject.name;
    if (typeof record === 'string') {
      texts.push(`${who}: resolve at the table (${record})`);
      applied.push({ kind: response.kind, status: 'manual', reason: record });
      continue;
    }
    if (response.kind === 'gain') {
      // rule/resource/surge.md (surges add); rule/health/temporary-stamina.md (the greater amount).
      if (!record.character?.liveState) {
        texts.push(
          `${who} gains ${response.surges ?? 0} surges: resolve at the table (only heroes track surges)`,
        );
        applied.push({ kind: 'gain', status: 'manual' });
        continue;
      }
      const live = record.character.liveState;
      const surges = live.surges + (response.surges ?? 0);
      const temporaryStamina =
        response.temporaryStamina === undefined
          ? live.temporaryStamina
          : Math.max(live.temporaryStamina, response.temporaryStamina);
      await journalPatch(ctx, scope, 'characters', record.character._id, {
        liveState: { ...live, surges, temporaryStamina },
      });
      texts.push(
        `${who} gains ${[
          response.surges
            ? `${response.surges} surge${response.surges === 1 ? '' : 's'} (${live.surges} → ${surges})`
            : '',
          response.temporaryStamina !== undefined
            ? `${response.temporaryStamina} temporary Stamina (${live.temporaryStamina} → ${temporaryStamina}, the greater amount is kept)`
            : '',
        ]
          .filter(Boolean)
          .join(' and ')}`,
      );
      applied.push({
        kind: 'gain',
        status: 'applied',
        recipient: record.actor,
        surges,
        temporaryStamina,
      });
      continue;
    }
    if (response.kind === 'condition') {
      const condition = await applyConditionInstance(
        ctx,
        scope,
        { kind: record.actor.kind as 'character' | 'foe', id: record.actor.id },
        {
          id: `${instance.id}:${scope.eventId}:${index}`,
          condition: response.condition,
          duration: response.duration,
          sourceActorId: instance.sourceActorId,
          sourceUseEventId: instance.sourceUseEventId,
          abilityName: instance.abilityName,
          actorLabel: instance.actorLabel,
          sourcePath: instance.sourcePath,
        },
        window.encounterId ? (window.encounterId as Id<'encounters'>) : undefined,
      );
      texts.push(
        `${who} is ${response.condition} (${response.duration === 'eot' ? 'EoT' : 'save ends'})${condition.registrationId ? '' : '; unscheduled outside combat'}`,
      );
      applied.push({ kind: 'condition', status: 'applied', conditionInstanceId: condition.id });
      continue;
    }
    // Damage: a fixed amount or a roll, applied with the target's immunities and weaknesses
    // (rule/damage/damage-immunity.md, damage-weakness.md) through the damage writer.
    let amount: number;
    let rolled = '';
    if (typeof response.amount === 'number') amount = response.amount;
    else {
      const { count, sides } = response.amount.dice;
      const accepted = await rollDice(
        ctx,
        scope.campaignId,
        diceKey(scope, instance.id, `${instance.firings?.length ?? 0}_${index}`),
        Array.from({ length: count }, (_, i) => ({ id: `watch${i}`, sides })),
        null,
      );
      dice.push(...accepted.dice);
      amount = accepted.dice.reduce((sum, die) => sum + die.value, 0);
      rolled = `${count}d${sides} (${accepted.dice.map(d => d.value).join(' + ')}) = `;
    }
    const facts = damageTargetFacts(record);
    const type = response.damageType ? ` ${response.damageType}` : '';
    if ('missing' in facts) {
      texts.push(
        `${who} takes ${rolled}${amount}${type} damage: apply it at the table (${facts.missing})`,
      );
      applied.push({ kind: 'damage', status: 'manual', amount, reason: facts.missing });
      continue;
    }
    const planned = applyDamage(facts.facts, {
      targetId: facts.facts.targetId,
      amount,
      ...(response.damageType ? { damageType: response.damageType } : {}),
      causeLabel: `${instance.actorLabel}'s ${instance.abilityName}`,
    });
    // The planned amount stands; the pools are the creature's as the damage is written.
    // V200 (Q-AREA-2 point 6): an area's rider damage is dealt by the area's user, for
    // damage-dealt watchers and marked-damaged observation only; it is never rolled damage
    // (rule/damage/rolled-damage.md) and offers no dealer-keyed triggered action. Other watchers'
    // damage has no dealer (Q-WATCH-1 point 1).
    const dealer =
      instance.area && (instance.owner.kind === 'character' || instance.owner.kind === 'foe')
        ? {
            kind: instance.owner.kind,
            id: await resolveHistoricalId(ctx, scope.campaignId, instance.owner.id),
            name: instance.owner.name,
          }
        : undefined;
    const application = await writePlannedDamage(ctx, scope, record, planned, {
      defer: deferred,
      ...(dealer ? { dealer, dealerForWatchersOnly: true as const } : {}),
    });
    texts.push(
      `${who} takes ${rolled}${amount}${type} damage${application.afterImmunity !== amount ? ` (${application.afterImmunity} after immunity and weakness)` : ''}; Stamina ${application.staminaBefore} → ${application.staminaAfter}${application.absorbedByTemporaryStamina ? ` (${application.absorbedByTemporaryStamina} absorbed by temporary Stamina)` : ''}`,
    );
    applied.push({ kind: 'damage', status: 'applied', recipient: record.actor, application });
  }
  return {
    description: `${instance.actorLabel}'s ${instance.abilityName} (${instance.subject.name}) fires: ${texts.join('; ')}.`,
    dice,
    data: {
      effectInstanceId: instance.id,
      holder,
      sourceUseEventId: instance.sourceUseEventId,
      event: watcher.event,
      window,
      responses: applied,
      sourcePath: instance.sourcePath,
    },
  };
}

/** One damage write's observation, kept until the causing firing is logged. */
export interface DamageObservation {
  target: EffectHolder;
  kind: 'hero' | 'foe';
  winded: number;
  before: { stamina: number; temporaryStamina: number };
  after: { stamina: number; temporaryStamina: number };
  dealer?: EffectHolder;
  dealerEffects?: Preloaded;
  preloaded?: Preloaded;
  /** V173: names for a triggered-action card, and whether a melee strike dealt the damage. */
  targetName?: string;
  dealerName?: string;
  meleeStrike?: boolean;
  /**
   * V200: the dealer is an area's user, attributed for damage-dealt watchers and marked-damaged
   * observation only: triggered-action offers see no dealer (Q-AREA-2 point 6).
   */
  dealerForWatchersOnly?: true;
  /**
   * V175 marks (convex/lib/marks.ts): the damage is rolled damage (rule/damage/rolled-damage.md:
   * determined by an ability roll), dealt by a melee ability, or part of a hit already observed
   * (the Mark's extra damage), which changes Stamina without being a second damage event.
   */
  rolled?: boolean;
  meleeAbility?: boolean;
  partOfHit?: boolean;
}

/** Logs a firing, or a watcher left to the table, as a consequence of the causing operation. */
async function log(
  ctx: MutationCtx,
  scope: JournalScope,
  kind: string,
  description: string,
  data: Record<string, unknown>,
  dice?: DieResult[],
) {
  const cause = (await ctx.db.get(scope.eventId))!;
  await appendEvent(ctx, {
    campaignId: scope.campaignId,
    sessionId: cause.sessionId,
    encounterId: cause.encounterId,
    origin: 'engine',
    commandId: cause.commandId,
    causeEventId: scope.eventId,
    kind,
    description,
    ...(dice?.length ? { dice } : {}),
    payload: { data },
  });
}

/**
 * QC1 train 13 R2: ends a watcher whose owner-state end condition holds when it would fire
 * (effectInstances.ts ownerStateEnding), logged as a linked `effect.ended` entry unless the caller
 * logs it. Returns the ended instance, or undefined when it may fire.
 */
async function endIfOwnerEnded(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  instance: EffectInstance,
  logged = true,
): Promise<EffectInstance | undefined> {
  const ending = await ownerStateEnding(ctx, instance, id =>
    resolveHistoricalId(ctx, scope.campaignId, id),
  );
  if (!ending) return undefined;
  const ended = await endEffectInstance(ctx, scope, holder, instance.id, ending);
  if (ended && logged) await logEnded(ctx, scope, [ended]);
  return ended ?? { ...instance, endedReason: ending };
}

/**
 * Fires every watcher due for these occurrences of one creature, each within its limit, as
 * linked consequences of the causing operation. Watchers set off by a firing's own damage fire
 * after it is logged, up to MAX_DEPTH.
 */
export async function observeWatchers(
  ctx: MutationCtx,
  scope: JournalScope,
  creature: EffectHolder,
  occurrences: readonly WatchedOccurrence[],
  options: ObserveOptions = {},
  preloaded?: Preloaded,
): Promise<void> {
  if (!occurrences.length) return;
  const found = await watchersOn(ctx, scope.campaignId, creature, occurrences, preloaded);
  if (!found.length) return;
  const at = await windowOf(ctx, scope.campaignId);
  const depth = options.depth ?? 0;
  for (const { holder, instance: seen, occurrence } of found) {
    // An earlier firing in this loop may have ended or used it.
    const instance = (await readHolder(ctx, holder))?.effectInstances.find(
      item => item.id === seen.id && item.status === 'active',
    );
    if (!instance || instance.payload.kind !== 'watcher') continue;
    const label = `${instance.actorLabel}'s ${instance.abilityName} (${instance.subject.name}; ${describeWatcher(instance.payload.watcher)})`;
    // Design section 7: a correction never re-derives a firing. Whether this watcher's limit was
    // free depends on the turn and round of the use, not the current ones, and on firings made
    // since; so any watcher that watches the changed damage refuses the correction, whatever its
    // limit state. Only an unresolved manual stacking group, which the engine never fires, doesn't.
    if (options.correction) {
      if (instance.manualStacking) continue;
      throw new ConvexError(
        `${label} watches this damage, and a correction can't recompute a watcher's firing. Rewind to the use and record it again instead.`,
      );
    }
    // QC1 train 13 R2 (defensive): an owner-state end condition that holds ends it unfired.
    if (await endIfOwnerEnded(ctx, scope, holder, instance)) continue;
    const due = watcherDue(instance, at);
    if (due.status === 'limited') continue;
    const data = { effectInstanceId: instance.id, sourceUseEventId: instance.sourceUseEventId };
    if (due.status === 'manual' || depth >= MAX_DEPTH) {
      await log(
        ctx,
        scope,
        'effect.watcher-manual',
        `${label}: resolve at the table — ${due.status === 'manual' ? due.reason : 'it answers another watcher’s response, and the engine stops the chain here'}.`,
        { ...data, sourcePath: instance.sourcePath },
      );
      continue;
    }
    const deferred: DamageObservation[] = [];
    const fired = await execute(ctx, scope, holder, instance, due.window, deferred, occurrence);
    await log(ctx, scope, 'effect.watcher-fired', fired.description, fired.data, fired.dice);
    for (const observation of deferred)
      await observeDamage(ctx, scope, observation, { depth: depth + 1 });
  }
}

/**
 * The watchers one damage write sets off: the damaged creature's `damage-taken`, `made-winded` and
 * `dying`, and the dealer's `damage-dealt` (shared/resolve/watchers.ts damageEvents).
 */
export async function observeDamage(
  ctx: MutationCtx,
  scope: JournalScope,
  observation: DamageObservation,
  options: ObserveOptions = {},
): Promise<void> {
  const events = damageEvents(
    observation.kind,
    observation.winded,
    observation.before,
    observation.after,
  ).filter(event => !observation.partOfHit || event !== 'damage-taken');
  // A correction changes damage in either direction: less damage can undo what a watcher
  // watched (taken, winded, dying) just as more damage can newly satisfy it.
  if (options.correction)
    for (const event of damageEvents(
      observation.kind,
      observation.winded,
      observation.after,
      observation.before,
    ))
      if (!events.includes(event)) events.push(event);
  await observeWatchers(
    ctx,
    scope,
    observation.target,
    events.map(event => ({
      event,
      creatureId: observation.target.id,
      ...(observation.dealer ? { otherId: observation.dealer.id } : {}),
    })),
    options,
    observation.preloaded,
  );
  if (observation.dealer && events.includes('damage-taken') && !observation.partOfHit)
    await observeWatchers(
      ctx,
      scope,
      observation.dealer,
      [
        {
          event: 'damage-dealt',
          creatureId: observation.dealer.id,
          otherId: observation.target.id,
        },
      ],
      options,
      observation.dealerEffects,
    );
  // V173: the same damage offers triggered actions (convex/lib/triggeredActions.ts). A
  // watcher's own damage (depth > 0) has no dealer and offers only damage-taken triggers.
  const lost =
    observation.before.stamina +
    observation.before.temporaryStamina -
    observation.after.stamina -
    observation.after.temporaryStamina;
  const damage = {
    damaged: {
      kind: observation.target.kind,
      id: observation.target.id,
      name: observation.targetName ?? 'the damaged creature',
    },
    ...(observation.dealer && !observation.dealerForWatchersOnly
      ? {
          dealer: {
            kind: observation.dealer.kind,
            id: observation.dealer.id,
            name: observation.dealerName ?? 'the dealer',
          },
        }
      : {}),
    amount: lost,
    ...(observation.meleeStrike !== undefined ? { meleeStrike: observation.meleeStrike } : {}),
  };
  if (!observation.partOfHit) {
    if (options.correction)
      await assertNoTriggerOnCorrection(ctx, scope, damage, options.correctionTaken);
    else await offerForDamage(ctx, scope, damage);
  }
  // V175: the damaged creature's marks: `marked-damaged` watchers of their owners, and the Mark's
  // benefit and retarget cards.
  await observeMarks(ctx, scope, observation, lost, options, (owner, dealerId) =>
    observeWatchers(
      ctx,
      scope,
      owner,
      [{ event: 'marked-damaged', creatureId: owner.id, otherId: dealerId }],
      options,
    ),
  );
}

/**
 * The clock's `watcher` work (a turn start or end of the watched creature): fires the instance
 * within its limit in the boundary operation's scope. The damage it deals sets off other watchers
 * in the same scope.
 */
export async function fireClockWatcher(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  instance: EffectInstance,
  at: { encounterId: string; round: number; turnId?: string },
  label: string,
): Promise<{
  kind: string;
  description: string;
  payload: unknown;
  dice?: DieResult[];
  unsupported?: string;
}> {
  // QC1 train 13 R2 (defensive): the owner's state already ended it (Blessing of Insight's
  // "until you are dying" when the owner reached 0 Stamina without the damage writer, such as a
  // manual Stamina edit): it ends here and doesn't fire.
  const ended = await endIfOwnerEnded(ctx, scope, holder, instance, false);
  if (ended)
    return {
      kind: 'effect.ended',
      description: `${label}: ends unfired — ${ended.endedReason}.`,
      payload: {
        effectInstanceId: ended.id,
        sourceUseEventId: ended.sourceUseEventId,
        reason: ended.endedReason,
        sourcePath: ended.sourcePath,
      },
    };
  const due = watcherDue(instance, at);
  if (due.status === 'limited')
    return {
      kind: 'effect.watcher-limited',
      description: `${label}: already fired within its limit.`,
      payload: { effectInstanceId: instance.id },
    };
  if (due.status === 'manual')
    return {
      kind: 'effect.watcher-manual',
      description: `${label}: resolve at the table — ${due.reason}.`,
      payload: { effectInstanceId: instance.id, sourcePath: instance.sourcePath },
      unsupported: due.reason,
    };
  const deferred: DamageObservation[] = [];
  const fired = await execute(ctx, scope, holder, instance, due.window, deferred);
  for (const observation of deferred) await observeDamage(ctx, scope, observation, { depth: 1 });
  return {
    kind: 'effect.watcher-fired',
    description: fired.description,
    payload: fired.data,
    ...(fired.dice.length ? { dice: fired.dice } : {}),
  };
}

/**
 * Design section 7: a correction never silently re-derives a watcher's firing. Every firing the use
 * set off, on whichever creature holds the watcher (the dealer, the target, or a creature a
 * watcher's own damage reached), is logged as an `effect.watcher-fired` entry caused by the use
 * under its command. Each one still recorded on its instance (not undone) refuses the correction,
 * so the table rewinds to the use instead.
 */
export async function assertWatchersReconcilable(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  useEvent: Doc<'events'>,
): Promise<void> {
  const logged = await ctx.db
    .query('events')
    .withIndex('by_campaign_command', q =>
      q.eq('campaignId', campaignId).eq('commandId', useEvent.commandId),
    )
    .take(1000);
  const changed: string[] = [];
  for (const entry of logged) {
    if (entry.kind !== 'effect.watcher-fired' || entry.causeEventId !== useEvent._id) continue;
    const data = (entry.payload as { data?: { effectInstanceId?: string; holder?: EffectHolder } })
      ?.data;
    if (!data?.effectInstanceId || !data.holder) continue;
    const holder: EffectHolder = {
      kind: data.holder.kind,
      id: await resolveHistoricalId(ctx, campaignId, data.holder.id),
    };
    const instance = (await readHolder(ctx, holder))?.effectInstances.find(
      item => item.id === data.effectInstanceId,
    );
    if (instance?.firings?.some(firing => firing.causeEventId === useEvent._id))
      changed.push(`${instance.actorLabel}'s ${instance.abilityName} (${instance.subject.name})`);
  }
  if (changed.length)
    throw new ConvexError(
      `This use set off ${[...new Set(changed)].join(', ')}, and a correction can't recompute a watcher's firing. Rewind to the use and record it again instead.`,
    );
}

/**
 * V171 review: uses the engine records without resolving (`ability.recorded`) and manual Stamina
 * adjustments never reach the observers. When a creature they name holds a watcher of such an
 * event, a linked note tells the table to resolve it; nothing fires.
 */
export async function noteManualWatchers(
  ctx: MutationCtx,
  scope: JournalScope,
  notes: readonly { creature: EffectHolder; events: readonly WatcherEvent[] }[],
  why: string,
): Promise<void> {
  const seen = new Set<string>();
  for (const { creature, events } of notes) {
    if (!events.length) continue;
    const found = await watchersOn(
      ctx,
      scope.campaignId,
      creature,
      events.map(event => ({ event, creatureId: creature.id })),
    );
    for (const { instance } of found) {
      if (seen.has(instance.id) || instance.payload.kind !== 'watcher') continue;
      seen.add(instance.id);
      await log(
        ctx,
        scope,
        'effect.watcher-manual',
        `${instance.actorLabel}'s ${instance.abilityName} (${instance.subject.name}; ${describeWatcher(instance.payload.watcher)}) may be set off: ${why}, so the engine doesn't fire it. Resolve it at the table.`,
        {
          effectInstanceId: instance.id,
          sourceUseEventId: instance.sourceUseEventId,
          sourcePath: instance.sourcePath,
        },
      );
    }
  }
}
