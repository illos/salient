// SPDX-License-Identifier: GPL-3.0-only
/**
 * V02 squad operations, registered in convex/lib/registry.ts and reachable from the Director pane,
 * the palette, slash text and headless calls alike: add a squad (one entry, count 1–8, optional
 * captain), remove it as a unit, attach/detach a captain, shared-turn participation, the owed
 * casualty choice, the coordinated squad action (signature attack with up to three contributors per
 * target, or a squad maneuver with one roll and one instance per target) and Free Strike Together.
 *
 * Owning specifications: docs/table-spec.md#minion-squads-and-captain-state (2026-09-13 contract and
 * 2026-09-20 user decisions), docs/table-command-spec.md#minion-squad-additions-and-state,
 * docs/table-spec.md#initiative-groups-confirmed-app-model. Pinned source: chapter/monster-basics.md
 * (Using Minions, Acting Together), rule/monster/squad.md, rule/monster/captain.md.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor, Reference } from '../../shared/commands/envelope';
import type {
  DamageApplication,
  LabeledBonus,
  TargetRollInputs,
} from '../../shared/contracts/rollResolution';
import { resolveAbilityRoll, resolveCreatureFreeStrike } from '../../shared/resolve/index';
import { parseCaptainBenefit, parsePrintedEv, proportionalEv } from '../../shared/resolve/squad';
import {
  allowanceFor,
  bindTarget,
  describeRoll,
  describeTarget,
  loadActorRecords,
  planTracking,
  recordUse,
} from './abilityOperations';
import { bindActor } from './actors';
import { rollDice } from './dice';
import { committedEncounter } from './encounters';
import {
  organizationOf,
  printedStamina,
  requireNotPaused,
  requireStatBlock,
  settings,
  snapshotOf,
} from './foeSource';
import { onCaptainAttached, onCaptainDetached, onSquadAdded, onSquadRemoved } from './initiative';
import { journalDelete, journalInsert, journalPatch, type JournalScope } from './journal';
import type { OperationDefinition, Outcome, TableContext } from './registry';
import {
  abilitiesFor,
  actorRollFacts,
  CREATURE_FREE_STRIKE_RULE_ID,
  damageTargetFacts,
  findAbility,
  foeSnapshot,
  supportingSource,
  writeDamage,
  type AbilityDefinition,
  type TargetRecord,
} from './resolve';
import {
  applyCaptainGain,
  applyCaptainLoss,
  captainOf,
  commitSquadPlans,
  describeSquadPlans,
  dropMembers,
  isLiving,
  loadSquad,
  MINION_RULE_ID,
  planSquadDamage,
  poolState,
  SQUAD_RULE_ID,
  squadActor,
  squadCasualtyInteraction,
  squadMembers,
  squadOfCaptain,
  squadPlanData,
  writePool,
} from './squads';

const referenceValidator = v.union(
  v.object({ name: v.string() }),
  v.object({ refKind: v.string(), id: v.string() }),
  v.object({ selector: v.literal('self') }),
);
const sameActor = (a: { kind: string; id: string }, b: { kind: string; id: string }) =>
  a.kind === b.kind && a.id === b.id;

function integer(value: unknown, name: string, min?: number, max?: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value))
    throw new ConvexError(`"${name}" must be a whole number.`);
  if (min !== undefined && value < min) throw new ConvexError(`"${name}" cannot be below ${min}.`);
  if (max !== undefined && value > max) throw new ConvexError(`"${name}" cannot exceed ${max}.`);
  return value;
}

async function squadOf(ctx: MutationCtx, context: TableContext, actor: BoundActor | null) {
  if (actor?.kind !== 'squad') throw new ConvexError('Name the squad as the @actor (@{squad:id}).');
  return loadSquad(ctx, context.campaign._id, actor.id as Id<'squads'>);
}

function structuredOf(entry: Pick<Doc<'content'>, 'structured'>) {
  return (entry.structured ?? {}) as Record<string, unknown>;
}

/** A captain is any non-Mount, non-minion creature at the table (rule/monster/captain.md). */
async function eligibleCaptain(
  ctx: MutationCtx,
  context: TableContext,
  reference: Reference,
  squadId: Id<'squads'> | null,
): Promise<{ foe: Doc<'foes'>; warnings: string[] }> {
  const bound = await bindActor(ctx, context, reference);
  if (bound.kind !== 'foe') throw new ConvexError('A captain must be a foe at the table.');
  const foe = await ctx.db.get(bound.id as Id<'foes'>);
  if (!foe || foe.campaignId !== context.campaign._id) throw new ConvexError('Foe unavailable.');
  if (foe.squadId) throw new ConvexError(`${foe.name} is a minion; minions cannot be captains.`);
  const snapshot = foeSnapshot(foe);
  const organization = snapshot.structured?.organization;
  const role = snapshot.structured?.role;
  if (organization === 'Minion')
    throw new ConvexError(`${foe.name} is a Minion stat block; minions cannot be captains.`);
  if (role === 'Mount') throw new ConvexError(`${foe.name} is a Mount; mounts cannot be captains.`);
  if (foe.live.stamina <= 0) throw new ConvexError(`${foe.name} is at 0 Stamina.`);
  const already = await squadOfCaptain(ctx, foe._id);
  if (already && already._id !== squadId)
    throw new ConvexError(
      `${foe.name} already captains ${already.name}; a creature captains at most one squad.`,
    );
  return {
    foe,
    warnings: [
      `Rule note: the source requires a captain who speaks a language the squad understands; the app cannot check languages (rule/monster/captain.md).`,
    ],
  };
}

async function currentRound(ctx: MutationCtx, context: TableContext) {
  const encounter = await committedEncounter(ctx, context.campaign);
  return encounter?.phase === 'turns' ? { encounter, round: encounter.round ?? 0 } : null;
}

// ---------------------------------------------------------------------------------------------
// /squad add

const squadAdd: OperationDefinition = {
  id: 'squad.add',
  family: 'squad',
  verb: 'add',
  title: 'Add a minion squad',
  description:
    'Load one squad of a Minion stat block: default four minions, any count from 1 to 8, with an optional captain. Each addition is an independent squad with its own shared Stamina pool and turn; add another squad for another entry.',
  args: {
    definition: v.string(),
    count: v.optional(v.number()),
    captain: v.optional(referenceValidator),
  },
  argDescriptions: {
    definition: 'The Minion stat block content id.',
    count: 'Minions in the squad, 1–8 (default 4).',
    captain:
      'An already loaded non-minion, non-Mount foe to attach as captain (@Name or @{foe:id}).',
  },
  roles: ['director'],
  session: 'unpaused',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    await requireNotPaused(ctx, context.campaign);
    const entry = await requireStatBlock(ctx, String(args.definition));
    const organization = organizationOf(entry);
    if (organization !== 'Minion')
      throw new ConvexError(
        `${entry.name} is ${organization ?? 'not a Minion'}: load ordinary foes with /foe add.`,
      );
    const count = args.count === undefined ? 4 : integer(args.count, 'count', 1, 8);
    const memberStamina = printedStamina(entry);
    const structured = structuredOf(entry);
    const captainBenefit = parseCaptainBenefit(
      typeof structured.with_captain === 'string' ? structured.with_captain : null,
    );
    const printedEv =
      typeof structured.ev === 'string'
        ? structured.ev
        : typeof structured.ev === 'number'
          ? String(structured.ev)
          : null;
    const parsedEv = parsePrintedEv(printedEv);
    const derivedEv = proportionalEv(count, parsedEv);
    const warnings: string[] = [];
    const captain = args.captain
      ? await eligibleCaptain(ctx, context, args.captain as Reference, null)
      : null;
    if (captain) warnings.push(...captain.warnings);
    if (captainBenefit?.manual && captain)
      warnings.push(
        `With Captain "${captainBenefit.text}" is shown for manual play; the app applies only Stamina, strike damage and strike edge benefits.`,
      );
    const squads = await ctx.db
      .query('squads')
      .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
      .take(200);
    const sameKind = squads.filter(s => s.definitionId === entry.contentId).length;
    const squadName = `${entry.name} squad${sameKind ? ` ${sameKind + 1}` : ''}`;
    const foes = await ctx.db
      .query('foes')
      .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
      .take(200);
    if (foes.length + count > 200) throw new ConvexError('Roster limit of 200 foes reached.');
    const pattern = new RegExp(`^${entry.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (\\d+)$`);
    const start =
      foes.reduce((max, foe) => {
        const match = pattern.exec(foe.name);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0) + 1;
    const visible = (await settings(ctx, context.campaign._id))?.addVisible ?? false;
    const pool = count * memberStamina;
    const bonusPool = captain ? (captainBenefit?.stamina ?? 0) * count : 0;
    const ev =
      derivedEv === null
        ? `EV ${printedEv ?? 'not read'}: proportional value not derived`
        : `EV ${derivedEv} (${count} × ${parsedEv.amount} ÷ ${parsedEv.quantity}${captain ? '; captain EV separate' : ''})`;
    return {
      kind: 'squad.added',
      description: `${squadName} added: ${count} × ${entry.name}, pool ${pool}${bonusPool ? ` + ${bonusPool} With Captain = ${pool + bonusPool}` : ''} (${memberStamina}${captain && captainBenefit?.stamina ? ` + ${captainBenefit.stamina}` : ''} per minion)${captain ? `, captained by ${captain.foe.name}` : ''}. ${ev}.${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
      data: {
        definitionId: entry.contentId,
        name: squadName,
        count,
        memberStamina,
        pool,
        captainBenefit,
        captainId: captain?.foe._id ?? null,
        ev: { printed: printedEv, ...parsedEv, derived: derivedEv },
        warnings,
        sourcePaths: [
          entry.sourcePath,
          'vendor/steel-compendium/en/unified/md/rule/monster/squad.md',
        ],
      },
      commit: async (mctx, scope) => {
        const squadId = await journalInsert(mctx, scope, 'squads', {
          campaignId: context.campaign._id,
          name: squadName,
          definitionId: entry.contentId,
          sourceSnapshot: snapshotOf(entry),
          memberStamina,
          step: memberStamina,
          pool,
          poolMax: pool,
          carried: 0,
          memberIds: [],
          captainId: null,
          captainLostRound: null,
          captainBenefit,
          ev: { printed: printedEv, ...parsedEv, derived: derivedEv },
          participation: { turnId: null, optedOut: [], individual: [] },
          pending: null,
        });
        const memberIds: Id<'foes'>[] = [];
        for (let i = 0; i < count; i++)
          memberIds.push(
            await journalInsert(mctx, scope, 'foes', {
              campaignId: context.campaign._id,
              name: `${entry.name} ${start + i}`,
              visible,
              sourceSnapshot: snapshotOf(entry),
              maxStamina: memberStamina,
              live: { stamina: memberStamina, temporaryStamina: 0 },
              squadId,
            }),
          );
        await journalPatch(mctx, scope, 'squads', squadId, { memberIds });
        await onSquadAdded(mctx, scope, context.campaign, { id: squadId, name: squadName });
        if (captain) {
          const squad = (await mctx.db.get(squadId))!;
          await applyCaptainGain(mctx, scope, squad, captain.foe._id);
          await onCaptainAttached(mctx, scope, context.campaign, captain.foe._id, squadId);
        }
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /squad remove

const squadRemove: OperationDefinition = {
  id: 'squad.remove',
  family: 'squad',
  verb: 'remove',
  title: 'Remove a squad',
  description:
    'Remove the whole squad from the roster: its shared turn finishes first, its minions leave, and an attached captain stays as an ordinary foe with its own turn entry. Single minions are not removed administratively (2026-09-20).',
  args: {},
  argDescriptions: {},
  roles: ['director'],
  session: 'unpaused',
  actor: 'required',
  execute: async (ctx, { context, actor }) => {
    await requireNotPaused(ctx, context.campaign);
    const squad = await squadOf(ctx, context, actor);
    const captain = await captainOf(ctx, squad);
    return {
      kind: 'squad.removed',
      description: `${squad.name} removed from the foes roster${captain ? `; ${captain.name} remains as an ordinary foe` : ''}.`,
      data: { squadId: squad._id, captainId: captain?._id ?? null },
      commit: async (mctx, scope) => {
        await onSquadRemoved(mctx, scope, context.campaign, squad._id);
        if (captain) {
          await journalPatch(mctx, scope, 'squads', squad._id, { captainId: null });
          await onCaptainDetached(
            mctx,
            scope,
            context.campaign,
            { id: captain._id, name: captain.name },
            squad._id,
          );
        }
        for (const member of await squadMembers(mctx, squad))
          await journalDelete(mctx, scope, 'foes', member._id);
        await journalDelete(mctx, scope, 'squads', squad._id);
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /squad captain

const squadCaptain: OperationDefinition = {
  id: 'squad.captain',
  family: 'squad',
  verb: 'captain',
  title: 'Attach or detach a captain',
  description:
    'Attach a loaded non-minion, non-Mount foe as the squad’s captain (its printed With Captain benefit applies to surviving minions and it shares the squad’s turn), or detach with captain=none. Loss reverts the pool and step without casualties unless the pool reaches zero.',
  args: { captain: v.union(referenceValidator, v.string()) },
  argDescriptions: { captain: 'The foe to attach (@Name or @{foe:id}), or none to detach.' },
  roles: ['director'],
  session: 'unpaused',
  actor: 'required',
  execute: async (ctx, { context, actor, args }) => {
    await requireNotPaused(ctx, context.campaign);
    const squad = await squadOf(ctx, context, actor);
    const turns = await currentRound(ctx, context);
    const previous = await captainOf(ctx, squad);
    if (typeof args.captain === 'string') {
      if (String(args.captain).toLowerCase() !== 'none')
        throw new ConvexError('"captain" is a foe reference or the word none.');
      if (!previous) throw new ConvexError(`${squad.name} has no captain.`);
      const members = await squadMembers(ctx, squad);
      const living = members.filter(isLiving).length;
      const bonus = squad.captainBenefit?.stamina ?? 0;
      const poolAfter = Math.max(0, squad.pool - bonus * living);
      return {
        kind: 'squad.captain',
        description: `${previous.name} detached from ${squad.name}: With Captain benefit ends${bonus ? `; pool ${squad.pool} → ${poolAfter}, step ${squad.step} → ${squad.step - bonus}` : ''}${poolAfter === 0 && living ? '; the pool at zero defeats every remaining minion' : ''}.`,
        data: { squadId: squad._id, captainId: null, previousCaptainId: previous._id },
        commit: async (mctx, scope) => {
          await applyCaptainLoss(mctx, scope, squad, turns?.round ?? null);
          await onCaptainDetached(
            mctx,
            scope,
            context.campaign,
            { id: previous._id, name: previous.name },
            squad._id,
          );
        },
      };
    }
    const { foe, warnings } = await eligibleCaptain(
      ctx,
      context,
      args.captain as Reference,
      squad._id,
    );
    if (previous?._id === foe._id)
      throw new ConvexError(`${foe.name} already captains ${squad.name}.`);
    if (turns && squad.captainLostRound === turns.round)
      warnings.push(
        `Rule warning: a squad that lost its captain gains a new one at the start of the next round (rule/monster/captain.md, I Am the Captain Now); it is still round ${turns.round}.`,
      );
    if (squad.captainBenefit?.manual)
      warnings.push(
        `With Captain "${squad.captainBenefit.text}" is shown for manual play; the app applies only Stamina, strike damage and strike edge benefits.`,
      );
    if (turns) {
      const entries = await ctx.db
        .query('turnEntries')
        .withIndex('by_encounter', q => q.eq('encounterId', turns.encounter._id))
        .take(1000);
      const mine = entries.find(e => e.actor.kind === 'foe' && e.actor.id === foe._id);
      const squadEntry = entries.find(e => e.actor.kind === 'squad' && e.actor.id === squad._id);
      if (
        mine &&
        squadEntry &&
        (mine.spentRound === turns.round) !== (squadEntry.spentRound === turns.round)
      )
        warnings.push(
          `Rule warning: ${foe.name} ${mine.spentRound === turns.round ? 'has already acted' : 'has not acted'} this round while the squad ${squadEntry.spentRound === turns.round ? 'has' : 'has not'}; the captain now shares the squad's turn.`,
        );
    }
    const members = await squadMembers(ctx, squad);
    const living = members.filter(isLiving).length;
    const bonus = squad.captainBenefit?.stamina ?? 0;
    return {
      kind: 'squad.captain',
      description: `${foe.name} attached as captain of ${squad.name}${previous ? ` (replacing ${previous.name})` : ''}: ${squad.captainBenefit ? `With Captain ${squad.captainBenefit.text}` : 'no printed With Captain benefit'}${bonus ? `; pool ${squad.pool} → ${squad.pool + bonus * living} for ${living} surviving minions, step ${squad.step} → ${squad.step + bonus}` : ''}.${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
      data: {
        squadId: squad._id,
        captainId: foe._id,
        previousCaptainId: previous?._id ?? null,
        benefit: squad.captainBenefit,
        warnings,
      },
      commit: async (mctx, scope) => {
        if (previous) {
          await applyCaptainLoss(mctx, scope, squad, null);
          await onCaptainDetached(
            mctx,
            scope,
            context.campaign,
            { id: previous._id, name: previous.name },
            squad._id,
          );
        }
        const current = (await mctx.db.get(squad._id))!;
        await applyCaptainGain(mctx, scope, current, foe._id);
        await onCaptainAttached(mctx, scope, context.campaign, foe._id, squad._id);
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /squad participation

const squadParticipation: OperationDefinition = {
  id: 'squad.participation',
  family: 'squad',
  verb: 'participation',
  title: 'Set a minion’s participation',
  description:
    'Mark one minion as sitting out (or rejoining) the squad’s shared main action this turn. A minion that uses an individual maneuver is excluded automatically (Minion Maneuvers).',
  args: { member: referenceValidator, participating: v.boolean() },
  argDescriptions: {
    member: 'The minion (@Name or @{foe:id}).',
    participating: 'false to opt the minion out of the squad action, true to opt it back in.',
  },
  roles: ['director'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, actor, args }) => {
    const squad = await squadOf(ctx, context, actor);
    const member = await bindTarget(ctx, context, args.member as Reference, null);
    if (!member.foe || member.foe.squadId !== squad._id)
      throw new ConvexError(`${member.actor.name} is not a member of ${squad.name}.`);
    if (!isLiving(member.foe)) throw new ConvexError(`${member.actor.name} is already defeated.`);
    const participating = Boolean(args.participating);
    const optedOut = squad.participation.optedOut.filter(id => id !== member.foe!._id);
    if (!participating) optedOut.push(member.foe._id);
    return {
      kind: 'squad.participation',
      description: `${member.actor.name} ${participating ? 'rejoins' : 'sits out'} ${squad.name}'s shared action this turn.`,
      data: { squadId: squad._id, memberId: member.foe._id, participating },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'squads', squad._id, {
          participation: { ...squad.participation, optedOut },
        });
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /squad casualties (the inline casualty card's continuation, also callable directly)

const squadCasualties: OperationDefinition = {
  id: 'squad.casualties',
  family: 'squad',
  verb: 'casualties',
  title: 'Name the minions taken out',
  description:
    'Answer an owed casualty choice: name which of the eligible minions drop after damage crossed the squad’s Stamina steps. The pool loss is already applied; this records identities only (Dropping Multiple Minions).',
  args: {
    squad: v.string(),
    count: v.optional(v.number()),
    casualties: v.array(referenceValidator),
  },
  argDescriptions: {
    squad: 'The squad id.',
    count: 'How many casualties are owed (from the card).',
    casualties: 'The minions to drop, as [@Name, @{foe:id}].',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'optional',
  execute: async (ctx, { context, args }) => {
    const squadId = ctx.db.normalizeId('squads', String(args.squad));
    if (!squadId) throw new ConvexError('That squad id is not valid.');
    const squad = await loadSquad(ctx, context.campaign._id, squadId);
    const pending = squad.pending;
    if (!pending) throw new ConvexError(`${squad.name} owes no casualty choice.`);
    if (context.role !== 'director') {
      const cause = await ctx.db.get(pending.eventId);
      if (cause?.actorId !== context.user._id)
        throw new ConvexError(
          'Only the user whose attack caused these casualties, or the Director, names them.',
        );
    }
    const members = await squadMembers(ctx, squad);
    const chosen: Doc<'foes'>[] = [];
    for (const reference of args.casualties as Reference[]) {
      const record = await bindTarget(ctx, context, reference, null);
      const foe = record.foe;
      if (!foe || !pending.candidates.includes(foe._id))
        throw new ConvexError(
          `${record.actor.name} is not among the eligible minions: ${pending.candidates
            .map(id => members.find(m => m._id === id)?.name ?? id)
            .join(', ')}.`,
        );
      if (!isLiving(foe)) throw new ConvexError(`${foe.name} is already defeated.`);
      if (!chosen.some(c => c._id === foe._id)) chosen.push(foe);
    }
    const owed = Math.min(pending.count, pending.candidates.length);
    if (chosen.length !== owed)
      throw new ConvexError(
        `Name exactly ${owed} minion${owed === 1 ? '' : 's'}; ${chosen.length} given.`,
      );
    return {
      kind: 'squad.casualties',
      description: `${squad.name}: ${chosen.map(c => c.name).join(', ')} ${chosen.length === 1 ? 'is' : 'are'} taken out (${pending.reason === 'nearest' ? 'nearest to those already dropped' : 'chosen among the minions that took the damage'}).`,
      causeEventId: pending.eventId,
      data: {
        squadId: squad._id,
        casualties: chosen.map(c => ({ id: c._id, name: c.name })),
        reason: pending.reason,
        damageEventId: pending.eventId,
      },
      commit: async (mctx, scope) => {
        await dropMembers(
          mctx,
          scope,
          chosen.map(c => c._id),
        );
        const current = (await mctx.db.get(squad._id))!;
        await writePool(
          mctx,
          scope,
          current,
          poolState(current, await squadMembers(mctx, current)),
          {
            pending: null,
          },
        );
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /squad act — the coordinated signature attack or a squad maneuver.

const assignmentValidator = v.union(
  v.object({
    record: v.object({
      target: referenceValidator,
      minions: v.array(referenceValidator),
      edges: v.optional(v.number()),
      banes: v.optional(v.number()),
    }),
  }),
  v.object({
    target: referenceValidator,
    minions: v.array(referenceValidator),
    edges: v.optional(v.number()),
    banes: v.optional(v.number()),
  }),
);

interface Assignment {
  target: TargetRecord;
  minions: Doc<'foes'>[];
  edges: number;
  banes: number;
}

function isSignature(snapshot: ReturnType<typeof foeSnapshot>, ability: AbilityDefinition) {
  return (snapshot.features ?? []).some(raw => {
    const feature = raw as Record<string, unknown>;
    return feature.name === ability.name && feature.ability_type === 'Signature Ability';
  });
}

async function squadContext(ctx: MutationCtx, context: TableContext, actor: BoundActor | null) {
  const squad = await squadOf(ctx, context, actor);
  const members = await squadMembers(ctx, squad);
  const living = members.filter(isLiving);
  if (!living.length) throw new ConvexError(`${squad.name} has no living minions.`);
  const representative: BoundActor = { kind: 'foe', id: living[0]!._id, name: living[0]!.name };
  const records = await loadActorRecords(ctx, context, representative);
  const abilities = await abilitiesFor(ctx, representative, records);
  const captain = await captainOf(ctx, squad);
  return {
    squad,
    members,
    living,
    representative,
    records,
    abilities,
    captain: captain && captain.live.stamina > 0 ? captain : null,
  };
}

async function bindAssignments(
  ctx: MutationCtx,
  context: TableContext,
  squad: Doc<'squads'>,
  living: Doc<'foes'>[],
  raw: unknown[],
  limitPerTarget: number | null,
  warnings: string[],
): Promise<Assignment[]> {
  const assignments: Assignment[] = [];
  const used = new Set<string>();
  const turnParticipation = squad.participation;
  for (const item of raw) {
    const fields = (
      item && typeof item === 'object' && 'record' in (item as object)
        ? (item as { record: Record<string, unknown> }).record
        : item
    ) as { target: Reference; minions: Reference[]; edges?: number; banes?: number };
    const target = await bindTarget(ctx, context, fields.target, null);
    if (assignments.some(a => sameActor(a.target.actor, target.actor)))
      throw new ConvexError(`${target.actor.name} is listed twice; each target is affected once.`);
    const minions: Doc<'foes'>[] = [];
    for (const reference of fields.minions ?? []) {
      const record = await bindTarget(ctx, context, reference, null);
      const foe = record.foe;
      if (!foe || foe.squadId !== squad._id)
        throw new ConvexError(`${record.actor.name} is not a member of ${squad.name}.`);
      if (!living.some(m => m._id === foe._id))
        throw new ConvexError(`${foe.name} is already defeated.`);
      if (used.has(foe._id))
        throw new ConvexError(`${foe.name} is assigned to two targets; a minion attacks once.`);
      if (turnParticipation.optedOut.includes(foe._id))
        throw new ConvexError(`${foe.name} is sitting out this turn (/squad participation).`);
      if (turnParticipation.individual.includes(foe._id))
        warnings.push(
          `Rule warning: ${foe.name} used an individual maneuver this turn and cannot also join the squad's main action or maneuver (Minion Maneuvers).`,
        );
      used.add(foe._id);
      minions.push(foe);
    }
    if (!minions.length) throw new ConvexError(`${target.actor.name} has no minions assigned.`);
    if (limitPerTarget !== null && minions.length > limitPerTarget)
      throw new ConvexError(
        `${minions.length} minions on ${target.actor.name}: at most ${limitPerTarget} minions can attack the same target with the squad's signature ability (Squad Action).`,
      );
    assignments.push({
      target,
      minions,
      edges: fields.edges === undefined ? 0 : integer(fields.edges, 'edges', 0),
      banes: fields.banes === undefined ? 0 : integer(fields.banes, 'banes', 0),
    });
  }
  if (!assignments.length) throw new ConvexError('Assign at least one target with its minions.');
  return assignments;
}

function abilityRecord(ability: AbilityDefinition) {
  return {
    id: ability.abilityId,
    name: ability.name,
    kind: ability.kind,
    contentId: ability.contentId,
    actionType: ability.actionType,
    usage: ability.usage,
    keywords: ability.keywords,
    ...(ability.cost ? { cost: ability.cost } : {}),
    distance: ability.distance,
    target: ability.target,
    ...(ability.roll ? { roll: ability.roll } : {}),
    ...(ability.tiers ? { tiers: ability.tiers } : {}),
    ...(ability.effects ? { effects: ability.effects } : {}),
  };
}

function sourceFor(ability: AbilityDefinition) {
  return {
    id: ability.contentId,
    name: ability.name,
    text: ability.text,
    sourcePath: ability.source.path,
    revision: ability.source.revision,
  };
}

const squadAct: OperationDefinition = {
  id: 'squad.act',
  family: 'squad',
  verb: 'act',
  title: 'Squad action',
  description:
    'The squad acts together: one power roll for the whole squad. For the signature ability, assign up to three minions per target; each additional minion on a target adds its free strike value as damage, and a critical hit offers the extra main action to the participants only. Grab, Knockback, Hide and Search for Hidden Creatures are taken together with one instance per target.',
  args: {
    ability: v.optional(v.string()),
    assignments: v.array(assignmentValidator),
  },
  argDescriptions: {
    ability:
      'The signature ability or a squad maneuver by name; omitted means the signature ability.',
    assignments:
      'Per target: {"target": @Name, "minions": [@Minion 1, @Minion 2], "edges": 0, "banes": 0}.',
  },
  roles: ['director'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, envelope, actor, args }) => {
    const { squad, living, representative, records, abilities, captain } = await squadContext(
      ctx,
      context,
      actor,
    );
    const snapshot = foeSnapshot(records.foe!);
    const signatureName = (snapshot.features ?? [])
      .map(raw => raw as Record<string, unknown>)
      .find(f => f.ability_type === 'Signature Ability' && typeof f.name === 'string')?.name as
      string | undefined;
    const key = args.ability === undefined ? signatureName : String(args.ability);
    if (!key) throw new ConvexError(`${squad.name}'s stat block prints no signature ability.`);
    const ability = findAbility(abilities, key);
    if (!ability)
      throw new ConvexError(
        `${squad.name} has no ability "${key}". Squad actions: ${[signatureName, 'Grab', 'Knockback', 'Hide', 'Search for Hidden Creatures'].filter(Boolean).join(', ')}.`,
      );
    const signature = isSignature(snapshot, ability);
    const maneuver =
      ability.actionType === 'maneuver' &&
      ['Grab', 'Knockback', 'Hide', 'Search for Hidden Creatures'].includes(ability.name);
    if (!signature && !maneuver)
      throw new ConvexError(
        `${ability.name} is not a squad action; a minion uses it individually with /ability use.`,
      );
    const warnings: string[] = [];
    const assignments = await bindAssignments(
      ctx,
      context,
      squad,
      living,
      args.assignments as unknown[],
      signature ? 3 : null,
      warnings,
    );
    const participants = assignments.flatMap(a => a.minions);
    const actionType = ability.actionType ?? 'main action';
    const allowances = await Promise.all(
      participants.map(async p => {
        const actorRef: BoundActor = { kind: 'foe', id: p._id, name: p.name };
        const allowance = await allowanceFor(ctx, context, actorRef);
        return {
          actor: actorRef,
          allowance,
          tracking: planTracking(allowance, actorRef, actionType),
        };
      }),
    );
    for (const a of allowances) warnings.push(...a.tracking.warnings);
    const inCombat = allowances[0]?.allowance.inCombat ?? false;
    const encounterId = allowances[0]?.allowance.encounterId ?? null;
    const abilityData = abilityRecord(ability);
    const source = sourceFor(ability);
    const supporting = [await supportingSource(ctx, SQUAD_RULE_ID)];
    const isStrike = ability.keywords.some(k => /strike/i.test(k));
    const benefit = captain ? squad.captainBenefit : null;
    const targetNames = assignments
      .map(a => `${a.target.actor.name} (${a.minions.map(m => m.name).join(', ')})`)
      .join('; ');
    const participantData = participants.map(p => ({ id: p._id, name: p.name }));
    const commitUses = async (mctx: MutationCtx, scope: JournalScope, critical: boolean) => {
      for (const a of allowances) {
        await recordUse(mctx, scope, a.allowance, a.actor, actionType, ability.name, a.tracking);
        if (critical && a.allowance.inCombat && a.allowance.encounterId)
          await journalInsert(mctx, scope, 'actionOpportunities', {
            campaignId: scope.campaignId,
            encounterId: a.allowance.encounterId,
            actor: a.actor,
            kind: 'additional-main-action',
            sourceEventId: scope.eventId,
            status: 'offered',
            usedEventId: null,
          });
      }
    };
    // ---- Hide and Search: recorded together with their text; no roll in the pinned entries.
    if (ability.kind !== 'rolled' || !ability.metadata) {
      const reason = `${ability.name} is recorded for manual resolution with its full text (${participants.length} minion${participants.length === 1 ? '' : 's'} acting together).`;
      return {
        kind: 'ability.recorded',
        description: `${squad.name} uses ${ability.name} together (${participants.map(p => p.name).join(', ')}). ${reason}${warnings.length ? ` ${warnings.join(' ')}` : ''}`,
        data: {
          ability: abilityData,
          manual: true,
          reason,
          targets: assignments.map(a => a.target.actor),
          squad: { id: squad._id, name: squad.name, participants: participantData },
          warnings,
          source: { ...source, supporting },
          allowance: {
            inCombat,
            onTurn: allowances[0]?.allowance.onTurn ?? false,
            turnId: allowances[0]?.allowance.turnId ?? null,
          },
        },
        commit: async (mctx, scope) => {
          await commitUses(mctx, scope, false);
        },
      };
    }
    // ---- One roll for the whole squad (Squad Action; Minion Maneuvers for Grab/Knockback).
    const metadata = ability.metadata;
    const actorFacts = actorRollFacts(representative, records);
    const accepted = await rollDice(
      ctx,
      context.campaign._id,
      envelope.commandId,
      [
        { id: 'd10a', sides: 10 },
        { id: 'd10b', sides: 10 },
      ],
      context.user._id,
    );
    const a = accepted.dice.find(d => d.id === 'd10a')!;
    const b = accepted.dice.find(d => d.id === 'd10b')!;
    const freeStrike = Number(snapshot.structured?.free_strike);
    const targetInputs: TargetRollInputs[] = assignments.map(assignment => {
      const extra: LabeledBonus[] = [];
      if (signature && assignment.minions.length > 1) {
        if (!Number.isFinite(freeStrike))
          warnings.push(
            `Rule warning: ${assignment.target.actor.name} has ${assignment.minions.length} attackers but the stat block's free strike value is not read; the extra damage is manual.`,
          );
        else
          extra.push({
            label: `${assignment.minions.length - 1} additional minion${assignment.minions.length > 2 ? 's' : ''} × free strike ${freeStrike}`,
            amount: (assignment.minions.length - 1) * freeStrike,
          });
      }
      if (benefit && isStrike && benefit.strikeDamage)
        extra.push({ label: `With Captain: ${benefit.text}`, amount: benefit.strikeDamage });
      return {
        targetId: assignment.target.actor.id,
        edges: assignment.edges + (benefit && isStrike ? benefit.strikeEdges : 0),
        banes: assignment.banes,
        ...(extra.length ? { extraDamage: extra } : {}),
      };
    });
    if (benefit && isStrike && benefit.strikeEdges)
      warnings.push(`With Captain: ${benefit.text} (+${benefit.strikeEdges} edge on each target).`);
    const targetFacts = assignments.map(a => ({
      record: a.target,
      facts: damageTargetFacts(a.target),
    }));
    for (const t of targetFacts) if ('missing' in t.facts) warnings.push(t.facts.missing);
    const response = resolveAbilityRoll({
      ability: metadata,
      actor: actorFacts,
      targets: targetInputs,
      targetFacts: targetFacts.flatMap(t => ('facts' in t.facts ? [t.facts.facts] : [])),
      dice: { d10a: a.value as never, d10b: b.value as never },
      inCombat,
      ...(ability.effects ? { effectClauses: ability.effects } : {}),
    });
    if (response.kind !== 'resolved') throw new ConvexError(`Blocked: ${response.reason}`);
    const result = response;
    warnings.push(...result.warnings);
    const perTarget = assignments.map((assignment, i) => {
      const outcome = result.targets[i]!;
      const applied =
        result.damageApplications.find(d => d.targetId === assignment.target.actor.id) ?? null;
      return { assignment, outcome, applied };
    });
    const squadPlans = await planSquadDamage(
      ctx,
      perTarget
        .filter(p => p.applied)
        .map(p => ({ target: p.assignment.target, amount: p.applied!.staminaDelta })),
      ability.targetShape.kind === 'area',
    );
    const critText = result.criticalHit
      ? ` Critical hit (natural 19+): an additional main action is offered to the ${participants.length} participating minion${participants.length === 1 ? '' : 's'} only; it is not taken automatically.`
      : '';
    const description = `${squad.name} uses ${ability.name} together on ${targetNames}: ${describeRoll(result)}. ${perTarget
      .map(
        p =>
          describeTarget(p.outcome, p.assignment.target.actor.name, p.applied ?? undefined) +
          (p.outcome.damage?.extraDamage?.length
            ? ` [+${p.outcome.damage.extraDamage.map(e => `${e.amount} ${e.label}`).join(', +')}]`
            : ''),
      )
      .join(
        ' ',
      )}${squadPlans.length ? ` ${describeSquadPlans(squadPlans)}` : ''}${critText}${result.manualResolutions?.length ? ` Recorded for manual resolution: ${result.manualResolutions.map(m => `"${m.sourceClause}"`).join(', ')}.` : ''}${warnings.length ? ` ${warnings.join(' ')}` : ''}`;
    const interaction = squadCasualtyInteraction(squadPlans, envelope);
    return {
      kind: 'ability.use',
      description,
      dice: accepted.dice,
      data: {
        ability: abilityData,
        result,
        publicDescription: description,
        rollId: accepted.rollId,
        targets: perTarget.map(p => ({
          target: p.assignment.target.actor,
          edges: p.assignment.edges,
          banes: p.assignment.banes,
          participants: p.assignment.minions.map(m => ({ id: m._id, name: m.name })),
        })),
        damage: perTarget.map(p => ({
          target: p.assignment.target.actor,
          application: p.applied,
          applied: !!p.applied,
        })),
        squad: {
          id: squad._id,
          name: squad.name,
          participants: participantData,
          signature,
          captain: captain ? { id: captain._id, name: captain.name } : null,
          benefit,
        },
        squads: squadPlanData(squadPlans),
        allowance: {
          inCombat,
          onTurn: allowances[0]?.allowance.onTurn ?? false,
          turnId: allowances[0]?.allowance.turnId ?? null,
        },
        warnings,
        source: { ...source, supporting },
      },
      ...(interaction ? { interaction } : {}),
      commit: async (mctx, scope) => {
        for (const p of perTarget)
          if (p.applied) await writeDamage(mctx, scope, p.assignment.target, p.applied);
        await commitSquadPlans(mctx, scope, squadPlans);
        await journalInsert(mctx, scope, 'abilityResults', {
          campaignId: scope.campaignId,
          eventId: scope.eventId,
          encounterId,
          actor: squadActor(squad),
          abilityId: ability.abilityId,
          resolutionInputs: {
            ability: metadata,
            actor: actorFacts,
            targetFacts: targetFacts.flatMap(t => ('facts' in t.facts ? [t.facts.facts] : [])),
          },
          abilityName: ability.name,
          dice: { d10a: result.dice.d10a, d10b: result.dice.d10b },
          characteristicValue: result.characteristicValue,
          selectedCharacteristic: result.selectedCharacteristic ?? null,
          targets: perTarget.map(p => ({
            target: p.assignment.target.actor,
            edges: p.assignment.edges,
            banes: p.assignment.banes,
            outcome: p.outcome,
            applied: p.applied,
            dispositions: [],
          })),
          manualDispositions: [],
          correctionEventIds: [],
        });
        await commitUses(mctx, scope, result.criticalHit);
      },
    };
  },
};

// ---------------------------------------------------------------------------------------------
// /squad free-strike — Free Strike Together.

const squadFreeStrike: OperationDefinition = {
  id: 'squad.free-strike',
  family: 'squad',
  verb: 'free-strike',
  title: 'Free Strike Together',
  description:
    'Several minions of one squad free strike the same target at the same time: their free strike values add together and apply as one strike (Free Strike Together). No roll; off-turn use is the ordinary opportunity attack.',
  args: { target: referenceValidator, minions: v.array(referenceValidator) },
  argDescriptions: {
    target: 'The creature struck (@Name or @{foe:id}).',
    minions: 'The minions striking together, as [@Minion 1, @Minion 2].',
  },
  roles: ['director'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, envelope, actor, args }) => {
    const { squad, living, records, captain } = await squadContext(ctx, context, actor);
    const snapshot = foeSnapshot(records.foe!);
    const value = Number(snapshot.structured?.free_strike);
    if (!Number.isFinite(value))
      throw new ConvexError(`${squad.name}'s stat block free strike value is not read.`);
    const target = await bindTarget(ctx, context, args.target as Reference, null);
    const minions: Doc<'foes'>[] = [];
    for (const reference of args.minions as Reference[]) {
      const record = await bindTarget(ctx, context, reference, null);
      const foe = record.foe;
      if (!foe || foe.squadId !== squad._id)
        throw new ConvexError(`${record.actor.name} is not a member of ${squad.name}.`);
      if (!living.some(m => m._id === foe._id))
        throw new ConvexError(`${foe.name} is already defeated.`);
      if (!minions.some(m => m._id === foe._id)) minions.push(foe);
    }
    if (!minions.length) throw new ConvexError('Name at least one minion.');
    const benefit = captain ? squad.captainBenefit : null;
    const bonus = benefit?.strikeDamage ?? 0;
    const total = minions.length * (value + bonus);
    const facts = damageTargetFacts(target);
    const warnings: string[] = [];
    if ('missing' in facts) warnings.push(facts.missing);
    const application: DamageApplication | null =
      'facts' in facts
        ? resolveCreatureFreeStrike(
            { actorId: squad._id, freeStrikeValue: total, targetId: target.actor.id },
            facts.facts,
          )
        : null;
    const squadPlans = application
      ? await planSquadDamage(ctx, [{ target, amount: application.staminaDelta }], false)
      : [];
    const supporting = [
      await supportingSource(ctx, CREATURE_FREE_STRIKE_RULE_ID),
      await supportingSource(ctx, MINION_RULE_ID),
    ];
    const damageText = application
      ? `${application.afterImmunity} damage to ${target.actor.name}${application.absorbedByTemporaryStamina ? ` (${application.absorbedByTemporaryStamina} absorbed by temporary Stamina)` : ''}${application.slain ? '; Slain' : application.windedAfter ? '; winded' : ''}`
      : `${total} damage to ${target.actor.name} not applied`;
    const description = `${squad.name}: ${minions.map(m => m.name).join(', ')} free strike ${target.actor.name} together (no roll; ${minions.length} × free strike ${value}${bonus ? ` + ${bonus} With Captain` : ''} = ${total}, one strike): ${damageText}.${squadPlans.length ? ` ${describeSquadPlans(squadPlans)}` : ''}${warnings.length ? ` ${warnings.join(' ')}` : ''}`;
    const interaction = squadCasualtyInteraction(squadPlans, envelope);
    const rule = await supportingSource(ctx, CREATURE_FREE_STRIKE_RULE_ID);
    return {
      kind: 'ability.use',
      description,
      data: {
        ability: {
          id: `${squad.definitionId}/free-strike-together`,
          name: 'Free Strike Together',
          kind: 'creature-free-strike',
          contentId: rule.id,
          actionType: 'free triggered action',
          usage: 'Free triggered action',
          keywords: [],
          distance: '',
          target: 'One creature or object',
        },
        freeStrike: { value: total, perMinion: value, captainBonus: bonus, target: target.actor },
        squad: {
          id: squad._id,
          name: squad.name,
          participants: minions.map(m => ({ id: m._id, name: m.name })),
          captain: captain ? { id: captain._id, name: captain.name } : null,
        },
        damage: [
          {
            target: target.actor,
            application,
            applied: !!application,
            ...(application ? {} : { missing: facts }),
          },
        ],
        squads: squadPlanData(squadPlans),
        warnings,
        source: { ...rule, supporting },
      },
      ...(interaction ? { interaction } : {}),
      commit: async (mctx, scope) => {
        if (application) await writeDamage(mctx, scope, target, application);
        await commitSquadPlans(mctx, scope, squadPlans);
      },
    };
  },
};

export const squadOperations: OperationDefinition[] = [
  squadAdd,
  squadRemove,
  squadCaptain,
  squadParticipation,
  squadCasualties,
  squadAct,
  squadFreeStrike,
];

export type { Outcome };
