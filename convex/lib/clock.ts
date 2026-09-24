// SPDX-License-Identifier: GPL-3.0-only
/**
 * The game clock: registration of scheduled rules work and its dispatch at the six boundary kinds
 * of shared/contracts/clock.ts. No wall time; a boundary occurs only when a registered operation
 * (OK, Take turn, End turn, actor removal) dispatches it inside its own mutation.
 *
 * Owning specifications: docs/table-spec.md#game-clock-and-scheduled-rules-work (the clock owns
 * turn/round scheduling; distinct boundaries; enqueue order with save-ends rolls last; one firing per
 * actual turn; each firing is its own ordered log entry linked to the causing user operation),
 * docs/table-command-spec.md#clock-driven-operations, docs/conditions-and-clock.md#2-clock-contract
 * (sections 2.2 boundaries, 2.3 order of due work, 2.4 producers) and #3-malice-common-lifecycle.
 *
 * V88 supplies the V1 producer for source-linked save-ends instances. Unknown producers remain
 * unsupported; manual toggles alone never schedule a save.
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type {
  BoundaryEvent,
  DispatchPlan,
  DispatchRecord,
  DispatchResult,
  MaliceChange,
  ScheduledWorkKind,
  TimingClause,
  WorkSource,
} from '../../shared/contracts/clock';
import { appendEvent } from './events';
import { rollDice } from './dice';
import { baselineOf } from './characterBuild';
import type { SavingThrowSource } from '../../shared/contracts/liveState';
import {
  endConditionInstance,
  findConditionInstance,
  recordConditionSave,
  unscheduleConditionInstance,
} from './conditionInstances';
import type { DieResult } from '../../shared/contracts/history';
import { journalInsert, journalPatch, type JournalScope } from './journal';
import {
  SELF_TAUGHT,
  generationProfile,
  prayerFor,
} from '../../shared/resolve/heroicResourceGeneration';
import { applyDamage } from '../../shared/resolve/index';
import { damageTargetFacts, writeDamage } from './resolve';

export type Registration = Doc<'clockRegistrations'>;

export interface RegistrationInput {
  timing: TimingClause;
  work: ScheduledWorkKind;
  source: WorkSource;
  affectedIds?: string[];
}

/** Places work into the encounter's queue at the next enqueue position (dispatch order). */
export async function registerWork(
  ctx: MutationCtx,
  scope: JournalScope,
  encounterId: Id<'encounters'>,
  input: RegistrationInput,
): Promise<Id<'clockRegistrations'>> {
  const encounter = await ctx.db.get(encounterId);
  if (!encounter || encounter.status !== 'committed' || encounter.archivedAt !== null)
    throw new ConvexError('Clock work requires a current committed encounter.');
  const enqueueSeq = (encounter.registrationSeq ?? 0) + 1;
  await journalPatch(ctx, scope, 'encounters', encounterId, { registrationSeq: enqueueSeq });
  return journalInsert(ctx, scope, 'clockRegistrations', {
    campaignId: encounter.campaignId,
    encounterId,
    enqueueSeq,
    timing: input.timing,
    work: input.work,
    source: input.source,
    ...(input.affectedIds ? { affectedIds: input.affectedIds } : {}),
    status: 'active',
  });
}

/** Retires a registration whose effect ended (its work is no longer due at any boundary). */
export async function retireWork(
  ctx: MutationCtx,
  scope: JournalScope,
  registrationId: Id<'clockRegistrations'>,
): Promise<void> {
  await journalPatch(ctx, scope, 'clockRegistrations', registrationId, { status: 'retired' });
}

/**
 * Whether a timing clause matches a boundary event. Relative clauses were bound at registration
 * (creature ids), so nothing here reinterprets "your" from the invoking user.
 */
export function isDue(timing: TimingClause, event: BoundaryEvent): boolean {
  switch (timing.scope) {
    case 'every-turn':
      return event.kind === timing.boundary && event.turn !== undefined;
    case 'creature-turn':
      return (
        event.kind === timing.boundary &&
        (event.turn?.creatureId === timing.creatureId ||
          event.turn?.participantIds.includes(timing.creatureId) === true)
      );
    case 'end-of-next-turn':
      // rule/combat/end-of-turn.md: the end of the affected creature's current turn if imposed during
      // it, else the end of its next turn. Either way the first `turn-end` of that creature after
      // registration is the one; the clause is retired once fired.
      // A captain or squad member shares the squad's turn (rule/monster/captain.md), so match any
      // participant like `creature-turn` does.
      return (
        event.kind === 'turn-end' &&
        (event.turn?.creatureId === timing.creatureId ||
          event.turn?.participantIds.includes(timing.creatureId) === true)
      );
    case 'round':
      return (
        event.kind === timing.boundary &&
        (timing.round === undefined || timing.round === event.round)
      );
    case 'combat':
      return event.kind === timing.boundary;
  }
}

/** One-shot clauses retire after firing; recurring ones stay until their effect ends. */
export function isOneShot(timing: TimingClause): boolean {
  switch (timing.scope) {
    case 'every-turn':
      return false;
    case 'creature-turn':
      return timing.occurrence === 'next';
    case 'end-of-next-turn':
      return true;
    case 'round':
      return timing.round !== undefined;
    case 'combat':
      return true;
  }
}

// ---------------------------------------------------------------------------------------------
// Handlers. The source supplies behavior; the clock owns when it is due.

export interface FiringContext {
  scope: JournalScope;
  encounter: Doc<'encounters'>;
  event: BoundaryEvent;
  registration: Registration;
  /** The boundary's own log entry; each firing links to it as its cause. */
  boundaryEventId: Id<'events'>;
  commandId: string;
}

export type WorkHandler = (
  ctx: MutationCtx,
  firing: FiringContext,
) => Promise<{ kind: string; description: string; payload?: unknown }>;

/** Handlers for `{ kind: 'operation', operationId }` work, keyed by operation id. A05 adds its own. */
export const operationHandlers = new Map<string, WorkHandler>();

/** Malice growth rule, quoted from vendor/steel-compendium/en/unified/md/rule/monster/malice.md. */
const MALICE_SOURCE = 'vendor/steel-compendium/en/unified/md/rule/monster/malice.md';

/** Q-R-50: distinct currently participating heroes; dying heroes still count. */
async function heroParticipants(ctx: MutationCtx, encounter: Doc<'encounters'>) {
  const entries = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(1000);
  const ids = new Set(
    entries
      .filter(entry => entry.actor.kind === 'character')
      .map(entry => entry.actor.id as Id<'characters'>),
  );
  const heroes: Doc<'characters'>[] = [];
  for (const id of ids) {
    const hero = await ctx.db.get(id);
    if (hero) heroes.push(hero);
  }
  return heroes;
}

async function fireMalice(
  ctx: MutationCtx,
  firing: FiringContext,
  step: MaliceChange['step'],
): Promise<{ kind: string; description: string; payload: unknown }> {
  const campaign = await ctx.db.get(firing.encounter.campaignId);
  if (!campaign) throw new ConvexError('Campaign unavailable.');
  const before = campaign.malice ?? 0;
  const heroes = await heroParticipants(ctx, firing.encounter);
  const heroCount = heroes.length;
  let change: MaliceChange;
  let description: string;
  const notes: string[] = [];
  if (step === 'combat-start-grant') {
    // "At the start of combat, you gain Malice equal to the average number of Victories per hero."
    // Victories are read, never changed; a hero with no live record has the R03 initial 0.
    const victoriesTotal = heroes.reduce((sum, hero) => sum + (hero.liveState?.victories ?? 0), 0);
    const averageVictories = heroCount ? victoriesTotal / heroCount : 0;
    // Q-R-51 confirmed: round a fractional average down; log the unrounded value.
    const delta = heroCount ? Math.floor(averageVictories) : 0;
    const rounding: MaliceChange['inputs']['rounding'] =
      delta === averageVictories ? 'none' : 'down';
    if (!heroCount)
      notes.push(
        'No hero participants: the average Victories per hero is undefined; 0 applied and recorded.',
      );
    if (rounding === 'down') notes.push('Fractional average rounded down (confirmed Q-R-51).');
    change = {
      step,
      inputs: { heroCount, victoriesTotal, averageVictories, rounding },
      before,
      delta,
      after: before + delta,
    };
    description = `Malice: combat-start grant — average Victories ${averageVictories}${rounding === 'down' ? ` (rounded down to ${delta})` : ''} across ${heroCount} hero${heroCount === 1 ? '' : 'es'}; pool ${before} → ${change.after}.`;
  } else if (step === 'round-start-gain') {
    // "at the start of each combat round, you gain Malice equal to the number of heroes in the
    // battle, plus the combat round number."
    const delta = heroCount + firing.event.round;
    change = {
      step,
      round: firing.event.round,
      inputs: { heroCount },
      before,
      delta,
      after: before + delta,
    };
    notes.push(
      'Hero count is distinct current combat participants, including dying heroes (confirmed Q-R-50).',
    );
    description = `Malice: round ${firing.event.round} gain — ${heroCount} hero${heroCount === 1 ? '' : 'es'} + round ${firing.event.round} = ${delta}; pool ${before} → ${change.after}.`;
  } else {
    // "At the end of an encounter, any unused Malice is lost."
    change = { step, inputs: {}, before, delta: -before, after: 0 };
    description = `Malice: encounter-end loss — pool ${before} → 0.`;
  }
  await journalPatch(ctx, firing.scope, 'campaigns', campaign._id, { malice: change.after });
  return {
    kind: 'clock.malice',
    description,
    payload: { change, notes, sourcePath: MALICE_SOURCE },
  };
}

type HeroicResourceStep = Extract<ScheduledWorkKind, { kind: 'heroic-resource' }>['step'];

/**
 * V120: one step of a hero's class resource lifecycle, from its generation profile. The profile
 * clause supplies the amount and the quoted source; the clock supplies when it is due. Writes go
 * through the causing operation's journal scope, so undoing that operation restores the pool.
 */
async function fireHeroicResource(
  ctx: MutationCtx,
  firing: FiringContext,
  step: HeroicResourceStep,
  characterId: string,
): Promise<{
  kind: string;
  description: string;
  payload?: unknown;
  unsupported?: string;
  dice?: DieResult[];
}> {
  const hero = await ctx.db.get(characterId as Id<'characters'>);
  const live = hero?.liveState;
  const profile = generationProfile(baselineOf(hero?.derivedBaseline));
  const label = firing.registration.source.label;
  if (!hero || !live || !profile || hero.campaignId !== firing.encounter.campaignId)
    return {
      kind: 'clock.unsupported',
      description: `${label}: the hero or its generation profile is unavailable; resolve manually.`,
      unsupported: 'hero or generation profile unavailable',
    };
  const pool = live.heroicResource;
  if (pool.name.toLowerCase() !== profile.resource)
    return {
      kind: 'clock.unsupported',
      description: `${label}: ${hero.authored.name}'s pool is ${pool.name}, not ${profile.resource}; resolve manually.`,
      unsupported: 'pool does not match the generation profile',
    };
  if (step === 'turn-end-strain') {
    // V146: "you take 1 damage for each negative point of clarity" — ordinary damage through the
    // shared damage rules (temporary Stamina first), written in the causing operation's scope.
    const clause = profile.turnEndStrain!;
    const amount = Math.max(0, -pool.current);
    const common = {
      step,
      characterId,
      className: profile.className,
      resource: pool.name,
      current: pool.current,
      sourcePath: clause.sourcePath,
      quote: clause.quote,
    };
    if (amount === 0)
      return {
        kind: 'clock.heroic-resource',
        description: `${hero.authored.name}'s ${pool.name} is ${pool.current}: not strained, no strain damage.`,
        payload: { ...common, damage: 0 },
      };
    // V146 review R1: a ward whose immunity the table tracks can reduce strain; hold it for them.
    const baseline = baselineOf(hero.derivedBaseline)!;
    const has = (name: string) =>
      [...baseline.features.map(f => f.name), ...baseline.abilities.map(a => a.name)].some(
        owned => owned === name || owned.startsWith(`${name}:`),
      );
    const holder = clause.heldBy?.find(entry => has(entry.name));
    if (holder)
      return {
        kind: 'clock.heroic-resource',
        description: `${hero.authored.name}'s ${pool.name} is ${pool.current}: ${amount} strain damage is due. ${holder.name}'s damage immunity may reduce it, so it is not applied automatically: apply the remainder with /adjust stamina.`,
        payload: {
          ...common,
          damage: amount,
          held: holder.name,
          heldSourcePath: holder.sourcePath,
        },
      };
    const noted = clause.notedBy?.filter(entry => has(entry.name)).map(entry => entry.name) ?? [];
    const record = {
      actor: { kind: 'character' as const, id: hero._id, name: hero.authored.name },
      character: hero,
    };
    const facts = damageTargetFacts(record);
    if ('missing' in facts)
      return {
        kind: 'clock.unsupported',
        description: `${label}: ${facts.missing}`,
        unsupported: 'damage facts unavailable',
      };
    const application = applyDamage(facts.facts, {
      targetId: hero._id,
      amount,
      causeLabel: 'negative clarity (strain)',
    });
    await writeDamage(ctx, firing.scope, record, application);
    return {
      kind: 'clock.heroic-resource',
      description: `${hero.authored.name}'s ${pool.name} is ${pool.current}: ${amount} strain damage; Stamina ${application.staminaBefore} → ${application.staminaAfter}${
        application.absorbedByTemporaryStamina
          ? ` (temporary ${application.temporaryStaminaBefore} → ${application.temporaryStaminaAfter})`
          : ''
      }${application.deadThresholdReached ? '; reaches the death threshold' : application.dying ? '; dying' : ''}.${
        noted.length ? ` This damage can set off ${noted.join(', ')}: resolve it manually.` : ''
      }`,
      payload: { ...common, damage: amount, application, ...(noted.length ? { noted } : {}) },
    };
  }
  // V150 (complication/self-taught.md): a forgo declared for this turn start suppresses the gain
  // "until the start of your next turn"; an earlier forgo window ends here.
  let windowEnded = false;
  if (step === 'turn-start-gain') {
    if (live.forgoNext) {
      await journalPatch(ctx, firing.scope, 'characters', hero._id, {
        liveState: { ...live, forgoNext: false, forgoing: true },
      });
      return {
        kind: 'clock.heroic-resource',
        description: `${hero.authored.name} forgoes ${pool.name} until the start of their next turn (Self-Taught); ${pool.current} unchanged.`,
        payload: {
          step,
          characterId,
          className: profile.className,
          resource: pool.name,
          before: pool.current,
          delta: 0,
          after: pool.current,
          forgo: true,
          sourcePath: SELF_TAUGHT.sourcePath,
          quote: SELF_TAUGHT.quote,
        },
      };
    }
    windowEnded = live.forgoing === true;
  }
  const before = pool.current;
  let after: number;
  let clause: { sourcePath: string; quote: string };
  let detail: string;
  let dice: DieResult[] | undefined;
  /** V147: an unreducible psychic damage roll from an angered prayer, applied after the gain. */
  let prayerDamage: { amount: number; die: DieResult } | undefined;
  const prayer =
    step === 'turn-start-gain' && live.prayNext === true
      ? prayerFor(profile, baselineOf(hero.derivedBaseline))
      : undefined;
  const praying = prayer !== undefined;
  /** V149: Malice the Director gains from the Troubadour's appeal, applied after the gain. */
  let appealMalice: { amount: number; die?: DieResult } | undefined;
  if (step === 'combat-start-grant') {
    clause = profile.combatStart;
    after = before + live.victories;
    detail = `combat-start grant equal to Victories (${live.victories})`;
  } else if (step === 'turn-start-gain') {
    clause = profile.turnStart;
    if (profile.turnStart.kind === 'fixed') {
      // V148 (feature/elementalist/level-1/persistent-magic.md): each maintained persistent ability
      // reduces the turn-start gain by its persistent value; maintenance never makes it negative.
      const maintained = (live.maintained ?? []).filter(
        entry => entry.encounterId === firing.encounter._id,
      );
      const upkeep = maintained.reduce((sum, entry) => sum + entry.value, 0);
      const gain = Math.max(0, profile.turnStart.amount - upkeep);
      after = before + gain;
      detail = upkeep
        ? `turn-start gain of ${profile.turnStart.amount} minus ${upkeep} to maintain ${maintained.map(entry => entry.ability).join(', ')} = ${gain}`
        : `turn-start gain of ${profile.turnStart.amount}`;
    } else {
      const accepted = await rollDice(
        ctx,
        firing.encounter.campaignId,
        `hr_${firing.boundaryEventId}_${firing.registration._id}`,
        [{ id: 'gain', sides: profile.turnStart.sides }],
        null,
      );
      dice = accepted.dice;
      const rolled = accepted.dice[0]!.value;
      after = before + rolled;
      detail = `turn-start gain 1d${profile.turnStart.sides} = ${rolled}`;
      if (prayer?.kind === 'appeal') {
        // feature/troubadour/level-2/appeal-to-the-muses.md: "If the roll is a 1, you gain 1
        // additional drama. The Director gains 1d3 Malice … If the roll is a 2, you gain 1 Heroic
        // Resource, which you can keep or give to an ally within the distance of your active
        // performance. The Director gains 1 Malice. If the roll is a 3, you gain 2 of a Heroic
        // Resource, which you can distribute among yourself and any allies …"
        if (rolled === 1) {
          after += 1;
          const maliceRoll = await rollDice(
            ctx,
            firing.encounter.campaignId,
            `hra_${firing.boundaryEventId}_${firing.registration._id}`,
            [{ id: 'malice', sides: 3 }],
            null,
          );
          appealMalice = { amount: maliceRoll.dice[0]!.value, die: maliceRoll.dice[0]! };
          dice = [...dice, maliceRoll.dice[0]!];
          detail += `; appealed: +1, and the Director gains 1d3 (${appealMalice.amount}) Malice`;
        } else if (rolled === 2) {
          appealMalice = { amount: 1 };
          detail +=
            '; appealed: 1 Heroic Resource to keep or give to an ally within your active performance (resolve it with /adjust heroic-resource), and the Director gains 1 Malice';
        } else {
          detail +=
            '; appealed: 2 Heroic Resource to distribute among yourself and allies within your active performance (resolve it with /adjust heroic-resource)';
        }
      } else if (praying) {
        // feature/conduit/level-1/piety.md: "If the roll is a 1, you gain 1 additional piety but
        // anger the gods! You take psychic damage equal to 1d6 + your level, which can't be reduced
        // in any way. If the roll is a 2, you gain 1 additional piety. If the roll is a 3, you gain
        // 2 additional piety and can activate a domain effect of your choice".
        const extra = rolled === 3 ? 2 : 1;
        after += extra;
        detail += `; prayed: +${extra}`;
        if (rolled === 1) {
          const damageRoll = await rollDice(
            ctx,
            firing.encounter.campaignId,
            `hrp_${firing.boundaryEventId}_${firing.registration._id}`,
            [{ id: 'anger', sides: 6 }],
            null,
          );
          const level = baselineOf(hero.derivedBaseline)!.level.value;
          prayerDamage = { amount: damageRoll.dice[0]!.value + level, die: damageRoll.dice[0]! };
          dice = [...dice, damageRoll.dice[0]!];
          detail += `, the gods are angered: psychic damage 1d6 (${damageRoll.dice[0]!.value}) + level ${level} = ${prayerDamage.amount}, which can't be reduced`;
        }
        if (rolled === 3)
          detail +=
            ', and a domain prayer effect of your choice can be activated (resolve it manually)';
      }
    }
  } else {
    clause = profile.encounterEnd;
    after = 0;
    detail =
      profile.encounterEnd.kind === 'lose' ? 'encounter-end loss' : 'encounter-end reset to 0';
  }
  // A combat-start grant of 0 (no Victories) changes nothing: skip the write and its extra read.
  if (!(step === 'combat-start-grant' && after === before))
    await journalPatch(ctx, firing.scope, 'characters', hero._id, {
      liveState: {
        ...live,
        heroicResource: { ...pool, current: after },
        ...(step === 'encounter-end-loss'
          ? {
              resourceClaims: [],
              forgoNext: false,
              forgoing: false,
              lastTurnGain: undefined,
              prayNext: false,
              maintained: [],
              turnDamage: undefined,
            }
          : {}),
        ...(windowEnded ? { forgoing: false } : {}),
        ...(step === 'turn-start-gain' && firing.event.turn
          ? {
              lastTurnGain: {
                encounterId: firing.encounter._id,
                turnId: firing.event.turn.turnId,
                delta: after - before,
                after,
                eventId: firing.scope.eventId,
              },
            }
          : {}),
        ...(praying ? { prayNext: false } : {}),
      },
    });
  if (appealMalice) {
    const campaign = (await ctx.db.get(firing.encounter.campaignId))!;
    const maliceBefore = campaign.malice ?? 0;
    await journalPatch(ctx, firing.scope, 'campaigns', campaign._id, {
      malice: maliceBefore + appealMalice.amount,
    });
    detail += ` (Malice ${maliceBefore} → ${maliceBefore + appealMalice.amount})`;
  }
  if (prayerDamage) {
    // Q-RES-6 (labelled interpretation): "can't be reduced in any way" removes immunity; temporary
    // Stamina still absorbs it first, because it takes damage rather than reducing it
    // (rule/health/temporary-stamina.md).
    const record = {
      actor: { kind: 'character' as const, id: hero._id, name: hero.authored.name },
      character: (await ctx.db.get(hero._id))!,
    };
    const facts = damageTargetFacts(record);
    if (!('missing' in facts)) {
      const application = applyDamage(
        { ...facts.facts, immunities: [] },
        {
          targetId: hero._id,
          amount: prayerDamage.amount,
          damageType: 'psychic',
          causeLabel: 'angered gods',
        },
      );
      await writeDamage(ctx, firing.scope, record, application);
      detail += ` (Stamina ${application.staminaBefore} → ${application.staminaAfter})`;
    }
  }
  return {
    kind: 'clock.heroic-resource',
    description: `${hero.authored.name}'s ${pool.name}: ${detail}; ${before} → ${after}.`,
    payload: {
      step,
      characterId,
      className: profile.className,
      resource: pool.name,
      before,
      delta: after - before,
      after,
      sourcePath: clause.sourcePath,
      quote: clause.quote,
      ...(praying
        ? { prayer: { kind: prayer!.kind, sourcePath: prayer!.sourcePath, quote: prayer!.quote } }
        : {}),
      ...(prayerDamage ? { prayerDamage: prayerDamage.amount } : {}),
    },
    ...(dice ? { dice } : {}),
  };
}

async function fire(
  ctx: MutationCtx,
  firing: FiringContext,
): Promise<{
  kind: string;
  description: string;
  payload?: unknown;
  unsupported?: string;
  dice?: DieResult[];
  save?: { roll: number; success: boolean };
}> {
  const work = firing.registration.work as ScheduledWorkKind;
  switch (work.kind) {
    case 'malice':
      return fireMalice(ctx, firing, work.step);
    case 'heroic-resource':
      return fireHeroicResource(ctx, firing, work.step, work.characterId);
    case 'operation': {
      const handler = operationHandlers.get(work.operationId);
      if (!handler)
        return {
          kind: 'clock.unsupported',
          description: `${firing.registration.source.label}: due, but no handler is registered for ${work.operationId}; resolve manually.`,
          unsupported: `no handler for ${work.operationId}`,
        };
      return handler(ctx, firing);
    }
    case 'expire-effect': {
      // V113 (rule/combat/end-of-turn.md): an EoT condition instance ends at this turn end.
      const creatureId = firing.registration.affectedIds?.[0];
      const found = creatureId
        ? await findConditionInstance(ctx, creatureId, work.effectInstanceId)
        : null;
      if (
        !found ||
        found.campaignId !== firing.encounter.campaignId ||
        found.instance.status !== 'active' ||
        found.instance.registrationId !== firing.registration._id
      )
        return {
          kind: 'clock.unsupported',
          description: `${firing.registration.source.label}: no active supported effect instance; resolve manually.`,
          unsupported: 'no active supported effect instance',
        };
      await endConditionInstance(
        ctx,
        firing.scope,
        found.target,
        found.instance.id,
        'end of turn (EoT)',
      );
      return {
        kind: 'clock.effect-expired',
        description: `${firing.registration.source.label}: ends at the end of the turn (EoT).`,
        payload: { effectInstanceId: found.instance.id, creatureId },
      };
    }
    case 'saving-throw': {
      const found = await findConditionInstance(ctx, work.creatureId, work.effectInstanceId);
      if (
        !found ||
        found.campaignId !== firing.encounter.campaignId ||
        found.instance.status !== 'active' ||
        found.instance.registrationId !== firing.registration._id
      )
        return {
          kind: 'clock.unsupported',
          description: `${firing.registration.source.label}: no active supported condition instance; resolve manually.`,
          unsupported: 'no active supported condition instance',
        };
      const accepted = await rollDice(
        ctx,
        firing.encounter.campaignId,
        `save_${firing.boundaryEventId}_${firing.registration._id}`,
        [{ id: 'save', sides: 10 }],
        null,
      );
      const roll = accepted.dice[0]!.value;
      const hero =
        found.target.kind === 'character'
          ? await ctx.db.get(found.target.id as Id<'characters'>)
          : null;
      const evaluated = baselineOf(hero?.derivedBaseline)?.savingThrowThreshold;
      const threshold = evaluated && Number.isFinite(evaluated.value) ? evaluated.value : 6;
      const thresholdSource: SavingThrowSource =
        evaluated && Number.isFinite(evaluated.value)
          ? { kind: 'hero-baseline', provenance: evaluated.provenance }
          : {
              kind: 'printed',
              sourcePath: 'vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md',
            };
      const success = roll >= threshold;
      await recordConditionSave(ctx, firing.scope, found.target, found.instance.id, {
        roll,
        success,
        boundaryEventId: firing.boundaryEventId,
        threshold,
        thresholdSource,
      });
      return {
        kind: 'clock.saving-throw',
        description: `${firing.registration.source.label}: saving throw ${roll} (needs ${threshold}+) — ${success ? 'success; effect ends.' : 'failure; effect remains. Hero-token follow-up remains manual.'}`,
        payload: {
          effectInstanceId: found.instance.id,
          creatureId: work.creatureId,
          roll,
          success,
          threshold,
          thresholdSource,
        },
        dice: accepted.dice,
        save: { roll, success },
      };
    }
    default:
      return {
        kind: 'clock.unsupported',
        description: `${firing.registration.source.label}: due, but ${work.kind} work has no v0.01 handler; resolve manually.`,
        unsupported: `${work.kind} work has no v0.01 handler`,
      };
  }
}

// ---------------------------------------------------------------------------------------------
// Dispatch.

function describeBoundary(event: BoundaryEvent, actorName?: string): string {
  switch (event.kind) {
    case 'combat-start':
      return 'Combat starts.';
    case 'combat-end':
      return 'Combat ends.';
    case 'round-start':
      return `Round ${event.round} begins.`;
    case 'round-end':
      return `Round ${event.round} ends.`;
    case 'turn-start':
      return `${actorName ?? 'The actor'}'s turn begins (round ${event.round}).`;
    case 'turn-end':
      return `${actorName ?? 'The actor'}'s turn ends (round ${event.round}).`;
  }
}

async function activeRegistrations(ctx: MutationCtx, encounterId: Id<'encounters'>) {
  const rows = await ctx.db
    .query('clockRegistrations')
    .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
    .take(1001);
  if (rows.length > 1000) throw new ConvexError('Too many clock registrations to dispatch safely.');
  return rows.filter(row => row.status === 'active');
}

/**
 * Dispatches one boundary: logs the boundary with its plan, fires the ordinary phase in enqueue
 * order, then determines the save phase from the state after that work (standing save-phase
 * policy) and fires it in enqueue order, retiring one-shot registrations. Called inside the
 * mutation of the user operation that caused the boundary; its once-only receipt makes a retry
 * return the recorded result rather than refiring.
 */
export async function dispatchBoundary(
  ctx: MutationCtx,
  scope: JournalScope,
  encounterId: Id<'encounters'>,
  input: { kind: BoundaryEvent['kind']; round: number; turn?: BoundaryEvent['turn'] },
  actorName?: string,
): Promise<DispatchResult> {
  const encounter = await ctx.db.get(encounterId);
  if (!encounter || encounter.status !== 'committed' || encounter.archivedAt !== null)
    throw new ConvexError('Clock work requires a current committed encounter.');
  const cause = await ctx.db.get(scope.eventId);
  if (!cause) throw new ConvexError('Cause event unavailable.');
  const event: BoundaryEvent = {
    encounterId,
    kind: input.kind,
    round: input.round,
    ...(input.turn ? { turn: input.turn } : {}),
    causeLogEntryId: scope.eventId,
  };
  const due = (await activeRegistrations(ctx, encounterId)).filter(row =>
    isDue(row.timing as TimingClause, event),
  );
  const plan: DispatchPlan = {
    event,
    ordinary: due
      .filter(row => (row.work as ScheduledWorkKind).kind !== 'saving-throw')
      .map(row => row._id),
    saves: due
      .filter(row => (row.work as ScheduledWorkKind).kind === 'saving-throw')
      .map(row => row._id),
  };
  const boundaryEventId = await appendEvent(ctx, {
    campaignId: encounter.campaignId,
    sessionId: encounter.sessionId,
    encounterId,
    origin: 'clock',
    commandId: cause.commandId,
    causeEventId: scope.eventId,
    kind: 'clock.boundary',
    description: describeBoundary(event, actorName),
    payload: { event, plan: { ordinary: plan.ordinary, saves: plan.saves } },
  });
  const records: DispatchRecord[] = [];
  const fireOne = async (planned: Registration, phase: DispatchRecord['phase']) => {
    // Earlier queued work may have ended the effect. Never fire a retired/deleted stale row.
    const registration = await ctx.db.get(planned._id);
    if (
      !registration ||
      registration.status !== 'active' ||
      !isDue(registration.timing as TimingClause, event)
    )
      return;
    const current = await ctx.db.get(encounterId);
    const result = await fire(ctx, {
      scope,
      encounter: current!,
      event,
      registration,
      boundaryEventId,
      commandId: cause.commandId,
    });
    const logEntryId = await appendEvent(ctx, {
      campaignId: encounter.campaignId,
      sessionId: encounter.sessionId,
      encounterId,
      origin: 'clock',
      commandId: cause.commandId,
      causeEventId: boundaryEventId,
      kind: result.kind,
      description: result.description,
      ...(result.dice ? { dice: result.dice } : {}),
      payload: {
        registrationId: registration._id,
        enqueueSeq: registration.enqueueSeq,
        phase,
        source: registration.source,
        work: registration.work,
        ...(result.payload === undefined ? {} : { data: result.payload }),
      },
    });
    records.push({
      registrationId: registration._id,
      phase,
      logEntryId,
      outcome: result.unsupported
        ? { status: 'unsupported', reason: result.unsupported }
        : result.save
          ? { status: 'save', ...result.save }
          : { status: 'applied' },
    });
    if (isOneShot(registration.timing as TimingClause))
      await retireWork(ctx, scope, registration._id);
  };
  for (const registration of due.filter(row => plan.ordinary.includes(row._id)))
    await fireOne(registration, 'ordinary');
  // Save eligibility comes from the state after the ordinary phase (standing policy, 2026-09-12):
  // re-read the queue so a save registered by earlier queued work at this boundary is included.
  const saves = (await activeRegistrations(ctx, encounterId))
    .filter(row => (row.work as ScheduledWorkKind).kind === 'saving-throw')
    .filter(row => isDue(row.timing as TimingClause, event));
  for (const registration of saves) await fireOne(registration, 'saves');
  if (event.kind === 'combat-end') {
    for (const registration of await activeRegistrations(ctx, encounterId)) {
      const work = registration.work as ScheduledWorkKind;
      if (work.kind !== 'saving-throw' && work.kind !== 'expire-effect') continue;
      const creatureId =
        work.kind === 'saving-throw' ? work.creatureId : registration.affectedIds?.[0];
      if (!creatureId) continue;
      const found = await findConditionInstance(ctx, creatureId, work.effectInstanceId);
      if (
        found &&
        found.campaignId === scope.campaignId &&
        found.instance.registrationId === registration._id
      ) {
        await unscheduleConditionInstance(ctx, scope, found.target, found.instance.id);
        await appendEvent(ctx, {
          campaignId: scope.campaignId,
          sessionId: cause.sessionId,
          encounterId,
          origin: 'clock',
          commandId: cause.commandId,
          causeEventId: boundaryEventId,
          kind: 'condition.unscheduled',
          description: `${found.instance.actorLabel}'s ${found.instance.abilityName}: ${found.instance.condition} remains active after combat ends. Its ${work.kind === 'saving-throw' ? 'saving throw' : 'end-of-turn expiry'} is no longer scheduled; resolve it manually.`,
          payload: {
            effectInstanceId: found.instance.id,
            sourceUseEventId: found.instance.sourceUseEventId,
            creatureId,
            sourcePath: found.instance.sourcePath,
          },
        });
      }
    }
  }
  return { event, records };
}
