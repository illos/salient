// SPDX-License-Identifier: GPL-3.0-only
/**
 * V02 minion squad helpers shared by the squad, foe, ability and table operations: loading a squad
 * with its members, the pool state the pure ladder consumes (shared/resolve/squad.ts), journaled
 * pool writes and casualties, captain Stamina benefit changes, and the damage routing that turns
 * per-target applications on squad members into one pool instance per squad.
 *
 * Owning specification: docs/table-spec.md#minion-squads-and-captain-state (including the
 * 2026-09-20 user decisions). Pinned source: chapter/monster-basics.md (Using Minions),
 * rule/monster/squad.md, rule/monster/captain.md, rule/organization/minion.md.
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor, CommandEnvelope } from '../../shared/commands/envelope';
import {
  applyCaptainStamina,
  applySquadDamage,
  type CaptainStaminaChange,
  type SquadDamageResult,
  type SquadPoolState,
} from '../../shared/resolve/squad';
import type { ReadCtx } from './access';
import { committedEncounter } from './encounters';
import { appendEvent } from './events';
import { journalPatch, type JournalScope } from './journal';
import type { RequiredInput } from './registry';
import type { TargetRecord } from './resolve';

export const SQUAD_SOURCE = 'vendor/steel-compendium/en/unified/md/rule/monster/squad.md';
export const CAPTAIN_SOURCE = 'vendor/steel-compendium/en/unified/md/rule/monster/captain.md';
export const MINION_SOURCE = 'vendor/steel-compendium/en/unified/md/chapter/monster-basics.md';
export const SQUAD_RULE_ID = 'mcdm.monsters.v1/rule.monster/squad';
export const CAPTAIN_RULE_ID = 'mcdm.monsters.v1/rule.monster/captain';
export const MINION_RULE_ID = 'mcdm.monsters.v1/rule.organization/minion';

export async function loadSquad(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
  squadId: Id<'squads'>,
): Promise<Doc<'squads'>> {
  const squad = await ctx.db.get(squadId);
  if (!squad || squad.campaignId !== campaignId) throw new ConvexError('Squad unavailable.');
  return squad;
}

/** Member rows in roster order; rows removed by cleanup are simply absent. */
export async function squadMembers(ctx: ReadCtx, squad: Doc<'squads'>): Promise<Doc<'foes'>[]> {
  const rows: Doc<'foes'>[] = [];
  for (const id of squad.memberIds) {
    const foe = await ctx.db.get(id);
    if (foe && foe.squadId === squad._id) rows.push(foe);
  }
  return rows;
}

/** A minion lives while its row holds its printed Stamina; the ladder writes 0 when it drops. */
export const isLiving = (foe: Doc<'foes'>) => foe.live.stamina > 0;

export function poolState(squad: Doc<'squads'>, members: Doc<'foes'>[]): SquadPoolState {
  return {
    pool: squad.pool,
    step: squad.step,
    carried: squad.carried,
    living: members.filter(isLiving).map(m => m._id),
  };
}

export async function squadOfCaptain(
  ctx: ReadCtx,
  foeId: Id<'foes'>,
): Promise<Doc<'squads'> | null> {
  return ctx.db
    .query('squads')
    .withIndex('by_captain', q => q.eq('captainId', foeId))
    .unique();
}

export async function captainOf(ctx: ReadCtx, squad: Doc<'squads'>): Promise<Doc<'foes'> | null> {
  return squad.captainId ? ctx.db.get(squad.captainId) : null;
}

/** Still "in the battle": a living member remains, or the attached captain still stands. */
export async function squadInBattle(ctx: ReadCtx, squadId: Id<'squads'>): Promise<boolean> {
  const squad = await ctx.db.get(squadId);
  if (!squad) return false;
  const members = await squadMembers(ctx, squad);
  if (members.some(isLiving)) return true;
  const captain = await captainOf(ctx, squad);
  return !!captain && captain.live.stamina > 0;
}

/** Everyone whose turn the squad entry is: living members plus the attached captain. */
export async function squadParticipantIds(ctx: ReadCtx, squadId: Id<'squads'>): Promise<string[]> {
  const squad = await ctx.db.get(squadId);
  if (!squad) return [];
  const members = await squadMembers(ctx, squad);
  const ids: string[] = members.filter(isLiving).map(m => m._id);
  const captain = await captainOf(ctx, squad);
  if (captain && captain.live.stamina > 0) ids.push(captain._id);
  return ids;
}

export async function writePool(
  ctx: MutationCtx,
  scope: JournalScope,
  squad: Doc<'squads'>,
  state: SquadPoolState,
  patch: Partial<Doc<'squads'>> = {},
): Promise<void> {
  await journalPatch(ctx, scope, 'squads', squad._id, {
    pool: state.pool,
    step: state.step,
    carried: state.carried,
    poolMax: state.living.length * state.step,
    ...patch,
  });
}

/** A dropped minion counts as reduced to 0 Stamina (Dropping One Minion). */
export async function dropMembers(
  ctx: MutationCtx,
  scope: JournalScope,
  ids: readonly string[],
): Promise<void> {
  for (const id of ids) {
    const foe = await ctx.db.get(id as Id<'foes'>);
    if (foe && foe.live.stamina > 0)
      await journalPatch(ctx, scope, 'foes', foe._id, { live: { ...foe.live, stamina: 0 } });
  }
}

export async function commitSquadDamage(
  ctx: MutationCtx,
  scope: JournalScope,
  squadId: Id<'squads'>,
  result: SquadDamageResult,
): Promise<void> {
  const squad = (await ctx.db.get(squadId))!;
  await writePool(ctx, scope, squad, result.state, {
    pending: result.pending
      ? {
          count: result.pending.count,
          candidates: result.pending.candidates as Id<'foes'>[],
          reason: result.pending.reason,
          eventId: scope.eventId,
        }
      : null,
  });
  await dropMembers(ctx, scope, result.casualties);
}

// ---------------------------------------------------------------------------------------------
// Captain benefit changes.

/**
 * The captain is gone (killed, removed or detached): revert its Stamina benefit from the pool and
 * step without casualties, unless the reversion reaches zero, which kills the squad (2026-09-20).
 */
export async function applyCaptainLoss(
  ctx: MutationCtx,
  scope: JournalScope,
  squad: Doc<'squads'>,
  round: number | null,
): Promise<{ change: CaptainStaminaChange | null; casualties: string[] }> {
  const members = await squadMembers(ctx, squad);
  const state = poolState(squad, members);
  const bonus = squad.captainBenefit?.stamina ?? 0;
  const change = bonus ? applyCaptainStamina(state, -bonus) : null;
  await writePool(ctx, scope, squad, change?.state ?? state, {
    captainId: null,
    captainLostRound: round,
  });
  if (change?.exhausted) await dropMembers(ctx, scope, change.casualties);
  return { change, casualties: change?.casualties ?? [] };
}

/** A captain attaches: the benefit applies to surviving members only (2026-09-13). */
export async function applyCaptainGain(
  ctx: MutationCtx,
  scope: JournalScope,
  squad: Doc<'squads'>,
  captainId: Id<'foes'>,
): Promise<CaptainStaminaChange | null> {
  const members = await squadMembers(ctx, squad);
  const state = poolState(squad, members);
  const bonus = squad.captainBenefit?.stamina ?? 0;
  const change = bonus ? applyCaptainStamina(state, bonus) : null;
  await writePool(ctx, scope, squad, change?.state ?? state, {
    captainId,
    captainLostRound: null,
  });
  return change;
}

// ---------------------------------------------------------------------------------------------
// Damage routing: per-target applications on squad members become one pool instance per squad.

export interface SquadHitInput {
  target: TargetRecord;
  /** Damage that reached the creature after modifiers (DamageApplication.staminaDelta). */
  amount: number;
}

export interface SquadPlan {
  squadId: Id<'squads'>;
  name: string;
  result: SquadDamageResult;
  /** Display names of member ids the plan mentions. */
  names: Record<string, string>;
}

/** Groups member hits by squad and runs the ladder once per squad. Pure apart from reads. */
export async function planSquadDamage(
  ctx: ReadCtx,
  hits: SquadHitInput[],
  area: boolean,
): Promise<SquadPlan[]> {
  const bySquad = new Map<string, { squad: Doc<'squads'>; hits: SquadHitInput[] }>();
  for (const hit of hits) {
    const squad = hit.target.squad;
    if (!squad || !hit.target.foe) continue;
    const group = bySquad.get(squad._id) ?? { squad, hits: [] };
    group.hits.push(hit);
    bySquad.set(squad._id, group);
  }
  const plans: SquadPlan[] = [];
  for (const { squad, hits: squadHits } of bySquad.values()) {
    const members = await squadMembers(ctx, squad);
    const names = Object.fromEntries(members.map(m => [m._id, m.name]));
    const result = applySquadDamage(
      poolState(squad, members),
      squadHits.map(h => ({ memberId: h.target.foe!._id, damage: h.amount })),
      area,
    );
    plans.push({ squadId: squad._id, name: squad.name, result, names });
  }
  return plans;
}

export async function commitSquadPlans(
  ctx: MutationCtx,
  scope: JournalScope,
  plans: SquadPlan[],
): Promise<void> {
  for (const plan of plans) await commitSquadDamage(ctx, scope, plan.squadId, plan.result);
}

export function describeSquadPlan(plan: SquadPlan): string {
  const { result, names } = plan;
  const name = (id: string) => names[id] ?? id;
  const parts = [`${plan.name} pool ${result.poolBefore} → ${result.poolAfter}`];
  const capped = result.contributions.filter(c => c.capped);
  if (capped.length)
    parts.push(
      `area cap: ${capped.map(c => `${name(c.memberId)} ${c.incoming} → ${c.applied}`).join(', ')}`,
    );
  if (result.exhausted)
    parts.push(`pool exhausted: ${result.casualties.map(name).join(', ')} defeated`);
  else if (result.casualties.length)
    parts.push(`${result.casualties.map(name).join(', ')} defeated`);
  if (result.pending)
    parts.push(
      `${result.pending.count} more ${result.pending.count === 1 ? 'casualty' : 'casualties'} to name among ${result.pending.candidates.map(name).join(', ')} (${result.pending.reason === 'nearest' ? 'nearest members' : 'the directly damaged minions'})`,
    );
  return parts.join('; ') + '.';
}

export function describeSquadPlans(plans: SquadPlan[]): string {
  return plans.map(describeSquadPlan).join(' ');
}

/** Public payload for the log and later readback; ids stay so the UI can name current rows. */
export function squadPlanData(plans: SquadPlan[]) {
  return plans.map(plan => ({
    squadId: plan.squadId,
    name: plan.name,
    poolBefore: plan.result.poolBefore,
    poolAfter: plan.result.poolAfter,
    applied: plan.result.applied,
    contributions: plan.result.contributions,
    casualties: plan.result.casualties.map(id => ({ id, name: plan.names[id] ?? id })),
    pending: plan.result.pending
      ? {
          count: plan.result.pending.count,
          reason: plan.result.pending.reason,
          candidates: plan.result.pending.candidates.map(id => ({
            id,
            name: plan.names[id] ?? id,
          })),
        }
      : null,
    exhausted: plan.result.exhausted,
    carried: plan.result.state.carried,
  }));
}

/**
 * The inline casualty card for the first plan that still owes a choice (confirmed 2026-09-13: the
 * existing spatial-input pattern asks only for the missing identities; the damage is already
 * applied and is never deducted again). Further owed choices are answered with /squad casualties.
 */
export function squadCasualtyInteraction(
  plans: SquadPlan[],
  envelope: Pick<CommandEnvelope, 'campaignId'>,
):
  | {
      kind: string;
      requiredInputs: RequiredInput[];
      continuation: Omit<CommandEnvelope, 'commandId'>;
    }
  | undefined {
  const plan = plans.find(p => p.result.pending);
  if (!plan?.result.pending) return undefined;
  const pending = plan.result.pending;
  const name = (id: string) => plan.names[id] ?? id;
  return {
    kind: 'squad-casualties',
    requiredInputs: [
      {
        name: 'casualties',
        type: 'list of @{foe:id}',
        required: true,
        description: `Name ${pending.count} of ${pending.candidates.map(name).join(', ')} (${pending.reason === 'nearest' ? 'the minions nearest those taken out' : 'the minions that took the damage'}) to drop; the pool loss is already applied.`,
      },
    ],
    continuation: {
      schemaVersion: 1,
      campaignId: envelope.campaignId,
      operation: 'squad.casualties',
      actor: null,
      arguments: { squad: plan.squadId, count: pending.count },
    },
  };
}

/** Minions cannot be winded (Shared Low Stamina): a member's application never claims it. */
export function minionApplication<T extends { windedBefore: boolean; windedAfter: boolean }>(
  record: Pick<TargetRecord, 'squad'>,
  application: T | null,
): T | null {
  return application && record.squad
    ? { ...application, windedBefore: false, windedAfter: false }
    : application;
}

export function squadActor(squad: Pick<Doc<'squads'>, '_id' | 'name'>): BoundActor {
  return { kind: 'squad', id: squad._id, name: squad.name };
}

// ---------------------------------------------------------------------------------------------
// Captain loss as an engine consequence of damage or removal.

/**
 * Records the captain's loss as its own linked log entry and applies the benefit reversion under
 * that entry's scope, so the unit's undo restores it with the damage that caused it.
 */
export async function recordCaptainLoss(
  ctx: MutationCtx,
  scope: JournalScope,
  squad: Doc<'squads'>,
  reason: 'slain' | 'removed',
): Promise<void> {
  const cause = await ctx.db.get(scope.eventId);
  if (!cause) throw new ConvexError('Cause event unavailable.');
  const campaign = await ctx.db.get(scope.campaignId);
  const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
  const captain = await captainOf(ctx, squad);
  const bonus = squad.captainBenefit?.stamina ?? 0;
  const members = await squadMembers(ctx, squad);
  const living = members.filter(isLiving).length;
  const poolAfter = Math.max(0, squad.pool - bonus * living);
  const exhausted = poolAfter === 0 && living > 0;
  const eventId = await appendEvent(ctx, {
    campaignId: scope.campaignId,
    sessionId: cause.sessionId,
    encounterId: cause.encounterId,
    origin: 'engine',
    commandId: cause.commandId,
    causeEventId: scope.eventId,
    kind: 'squad.captain-lost',
    description:
      `${squad.name} loses its captain ${captain?.name ?? ''} (${reason === 'slain' ? 'at 0 Stamina' : 'removed'}): With Captain benefit ends${bonus ? `; pool ${squad.pool} → ${poolAfter}, step ${squad.step} → ${squad.step - bonus}` : ''}${exhausted ? '; the pool at zero defeats every remaining minion' : ''}.`.replace(
        '  ',
        ' ',
      ),
    payload: {
      data: {
        squadId: squad._id,
        captainId: squad.captainId,
        reason,
        benefit: squad.captainBenefit,
        poolBefore: squad.pool,
        poolAfter,
        sourcePath: CAPTAIN_SOURCE,
      },
    },
  });
  await applyCaptainLoss(
    ctx,
    { campaignId: scope.campaignId, eventId },
    squad,
    encounter?.phase === 'turns' ? (encounter.round ?? null) : null,
  );
}
