// SPDX-License-Identifier: GPL-3.0-only
/**
 * Initiative groups of actor-linked turn entries, actual turns and the round sequence. Every write
 * is journaled under the calling operation's event; every boundary goes through the clock.
 *
 * Owning specifications:
 * - docs/table-spec.md#initiative-groups-confirmed-app-model — an entry is not a turn until started;
 *   spent state belongs to the entry; moving an entry moves only that entry.
 * - docs/table-spec.md#taking-a-turn — Take turn starts one hero's turn and activates its group;
 *   members take successive complete turns; the group completes when all members finish; the first
 *   valid claim wins and there are never two active turns.
 * - docs/table-spec.md#mid-combat-additions-and-regrouping — new foe: new bottom group with a turn
 *   this round; finished groups do not reopen; an unspent arrival may act in a still-active group;
 *   an active group with no remaining turns completes after the current turn; removing the acting
 *   monster finishes its turn; round advance even with an unacted arrival in a finished group.
 * - docs/conditions-and-clock.md#22-boundaries-the-app-dispatches — round ends when no unspent entry
 *   remains among current participants (Slain or removed creatures do not hold it open; Q-R-52
 *   confirmed: an added creature has a turn in the current round); the sequence at a round
 *   change is turn-end work, then round-end, then round-start; the first turn-start waits for Take turn.
 * - vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md — "When that turn is over, the
 *   other side chooses a creature to act"; the exhausted-side rule; "The side whose members acted
 *   first during the initial combat round goes first in all subsequent rounds."
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { Side, TurnRef } from '../../shared/contracts/clock';
import { dispatchBoundary } from './clock';
import { committedEncounter } from './encounters';
import { journalDelete, journalInsert, journalPatch, type JournalScope } from './journal';
import { squadInBattle, squadParticipantIds } from './squads';

export type Actor = Doc<'turnEntries'>['actor'];
export type Group = Doc<'initiativeGroups'>;
export type Entry = Doc<'turnEntries'>;

/** Heroes act on their side; foes and squads (V02) on the Director's. */
export const sideOf = (actor: { kind: 'character' | 'foe' | 'squad' }): Side =>
  actor.kind === 'character' ? 'heroes' : 'director';
export const otherSide = (side: Side): Side => (side === 'heroes' ? 'director' : 'heroes');
export const actorKey = (actor: { kind: string; id: string }) => `${actor.kind}:${actor.id}`;

export interface Initiative {
  groups: Group[];
  entries: Entry[];
  /** Foe actor ids at 0 Stamina or lower: no longer "in the battle" for the round boundary. */
  slain: Set<string>;
}

export async function loadInitiative(
  ctx: MutationCtx,
  encounterId: Id<'encounters'>,
): Promise<Initiative> {
  const groups = await ctx.db
    .query('initiativeGroups')
    .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
    .take(500);
  const entries = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
    .take(1000);
  entries.sort((a, b) => a.order - b.order);
  const slain = new Set<string>();
  for (const entry of entries) {
    if (entry.actor.kind === 'squad') {
      // V02: a squad entry stays in the battle while a member lives or its captain stands.
      if (!(await squadInBattle(ctx, entry.actor.id as Id<'squads'>))) slain.add(entry.actor.id);
      continue;
    }
    if (entry.actor.kind !== 'foe') continue;
    const foe = await ctx.db.get(entry.actor.id as Id<'foes'>);
    // Ordinary foe at 0 or lower is Slain (R03 label); a removed foe has no row and is not pending.
    if (!foe || foe.live.stamina <= 0) slain.add(entry.actor.id);
  }
  return { groups, entries, slain };
}

/** Unspent this round and still in the battle. */
export function pending(entry: Entry, round: number, slain: Set<string>): boolean {
  return entry.spentRound !== round && !slain.has(entry.actor.id);
}

/** Completed this round, or nothing left in it that could act. */
export function groupFinished(group: Group, init: Initiative, round: number): boolean {
  if (group.completedRound === round) return true;
  return !init.entries.some(e => e.groupId === group._id && pending(e, round, init.slain));
}

async function nextOrder(ctx: MutationCtx, encounterId: Id<'encounters'>) {
  const last = await ctx.db
    .query('initiativeGroups')
    .withIndex('by_encounter', q => q.eq('encounterId', encounterId))
    .order('desc')
    .first();
  return last ? last.order + 1 : 1;
}

/** A new group at the bottom of the initiative roster (confirmed placement for additions). */
export async function createGroup(
  ctx: MutationCtx,
  scope: JournalScope,
  encounter: Doc<'encounters'>,
  side: Side,
): Promise<Id<'initiativeGroups'>> {
  return journalInsert(ctx, scope, 'initiativeGroups', {
    campaignId: encounter.campaignId,
    encounterId: encounter._id,
    side,
    order: await nextOrder(ctx, encounter._id),
    completedRound: null,
  });
}

export async function createEntry(
  ctx: MutationCtx,
  scope: JournalScope,
  encounter: Doc<'encounters'>,
  groupId: Id<'initiativeGroups'>,
  actor: Actor,
  options: { surprised?: boolean; source?: Entry['source'] } = {},
): Promise<Id<'turnEntries'>> {
  const last = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(1000);
  return journalInsert(ctx, scope, 'turnEntries', {
    campaignId: encounter.campaignId,
    encounterId: encounter._id,
    groupId,
    order: last.reduce((max, entry) => Math.max(max, entry.order), 0) + 1,
    actor,
    source: options.source ?? 'ordinary',
    spentRound: null,
    surprised: options.surprised ?? false,
  });
}

/** V02: a squad's shared turn lists its living members and captain as participants; global work fires once. */
async function turnRef(ctx: MutationCtx, turn: Doc<'turns'>): Promise<TurnRef> {
  return {
    turnId: turn._id,
    turnEntryId: turn.turnEntryId,
    groupId: turn.groupId,
    side: turn.side,
    creatureId: turn.actor.id,
    participantIds:
      turn.actor.kind === 'squad'
        ? await squadParticipantIds(ctx, turn.actor.id as Id<'squads'>)
        : [turn.actor.id],
  };
}

export interface StartResult {
  turnId: Id<'turns'>;
  warnings: string[];
}

/**
 * Coherence checks require one active turn. Rule departures warn without erasing spent state,
 * reopening completed groups, or abandoning the active group (settled Q-A-400).
 */
export async function validateTurnStart(
  ctx: MutationCtx,
  encounterId: Id<'encounters'>,
  entryId: Id<'turnEntries'>,
): Promise<{ encounter: Doc<'encounters'>; entry: Entry; group: Group; warnings: string[] }> {
  const encounter = await ctx.db.get(encounterId);
  if (!encounter || encounter.status !== 'committed' || encounter.phase !== 'turns')
    throw new ConvexError('Turns begin once the starting side is announced.');
  const round = encounter.round ?? 0;
  const entry = await ctx.db.get(entryId);
  if (!entry || entry.encounterId !== encounterId) throw new ConvexError('Turn entry unavailable.');
  if (encounter.activeTurnId) {
    const active = await ctx.db.get(encounter.activeTurnId);
    throw new ConvexError(
      `${active?.actor.name ?? 'Another creature'}'s turn is in progress; end it before another begins.`,
    );
  }
  const warnings: string[] = [];
  if (entry.spentRound === round)
    warnings.push(
      `Rule warning: ${entry.actor.name} has already acted this round (that entry's turn stays spent).`,
    );
  const group = await ctx.db.get(entry.groupId);
  if (!group) throw new ConvexError('Initiative group unavailable.');
  if (group.completedRound === round)
    warnings.push(
      `Rule warning: ${entry.actor.name}'s initiative group already finished this round; its completion remains recorded.`,
    );
  if (encounter.activeGroupId && encounter.activeGroupId !== group._id)
    warnings.push(
      'Rule warning: another initiative group is active; its remaining members resume after this turn.',
    );
  const side = sideOf(entry.actor);
  if (!encounter.activeGroupId && encounter.activeSide && encounter.activeSide !== side)
    warnings.push(
      `Rule warning: the ${encounter.activeSide === 'heroes' ? "heroes'" : "Director's"} side is expected to act next (Combat Round: sides alternate; an exhausted side lets the other finish).`,
    );
  const init = await loadInitiative(ctx, encounterId);
  if (init.slain.has(entry.actor.id))
    warnings.push(`Rule warning: ${entry.actor.name} is at 0 Stamina or lower (Slain).`);
  return { encounter, entry, group, warnings };
}

/**
 * Starts the entry's turn: the first valid claim against current state wins; a competing claim
 * sees the active turn and is refused. Acting out of side order is a warned departure, not a block.
 */
export async function startTurn(
  ctx: MutationCtx,
  scope: JournalScope,
  encounterId: Id<'encounters'>,
  entryId: Id<'turnEntries'>,
): Promise<StartResult> {
  const { encounter, entry, group, warnings } = await validateTurnStart(ctx, encounterId, entryId);
  const round = encounter.round ?? 0;
  const side = sideOf(entry.actor);
  const turnId = await journalInsert(ctx, scope, 'turns', {
    campaignId: encounter.campaignId,
    encounterId,
    turnEntryId: entry._id,
    groupId: group._id,
    side,
    round,
    actor: entry.actor,
    status: 'active',
    startedEventId: scope.eventId,
    endedEventId: null,
  });
  await journalPatch(ctx, scope, 'turnEntries', entry._id, { spentRound: round });
  await journalPatch(ctx, scope, 'encounters', encounterId, {
    activeTurnId: turnId,
    // A deliberate departure does not abandon an unfinished group's remaining members.
    activeGroupId: encounter.activeGroupId ?? group._id,
    activeSide: encounter.activeGroupId ? encounter.activeSide : side,
  });
  const turn = (await ctx.db.get(turnId))!;
  // V02: a fresh shared turn starts with every living member participating.
  if (entry.actor.kind === 'squad')
    await journalPatch(ctx, scope, 'squads', entry.actor.id as Id<'squads'>, {
      participation: { turnId, optedOut: [], individual: [] },
    });
  await dispatchBoundary(
    ctx,
    scope,
    encounterId,
    { kind: 'turn-start', round, turn: await turnRef(ctx, turn) },
    entry.actor.name,
  );
  return { turnId, warnings };
}

/** Ends the active turn (its `turn-end` boundary, then the group/round handoff). */
export async function endTurn(
  ctx: MutationCtx,
  scope: JournalScope,
  turnId: Id<'turns'>,
): Promise<void> {
  const turn = await ctx.db.get(turnId);
  if (!turn || turn.status !== 'active') throw new ConvexError('That turn is not in progress.');
  await dispatchBoundary(
    ctx,
    scope,
    turn.encounterId,
    { kind: 'turn-end', round: turn.round, turn: await turnRef(ctx, turn) },
    turn.actor.name,
  );
  await journalPatch(ctx, scope, 'turns', turnId, { status: 'ended', endedEventId: scope.eventId });
  await journalPatch(ctx, scope, 'encounters', turn.encounterId, { activeTurnId: null });
  // A warned turn from another group may finish that group without reopening or replacing
  // the group whose activation was preserved. Moving the acting entry keeps this distinction.
  const init = await loadInitiative(ctx, turn.encounterId);
  const encounter = (await ctx.db.get(turn.encounterId))!;
  const group = init.groups.find(row => row._id === turn.groupId);
  if (
    group &&
    group._id !== encounter.activeGroupId &&
    groupFinished(group, init, turn.round) &&
    group.completedRound !== turn.round
  )
    await journalPatch(ctx, scope, 'initiativeGroups', group._id, { completedRound: turn.round });
  await settle(ctx, scope, turn.encounterId);
}

/** Which side acts after a group on `completed` finishes: the other side if it has turns left. */
function nextSide(init: Initiative, round: number, completed: Side): Side | null {
  const unfinished = (side: Side) =>
    init.groups.some(group => group.side === side && !groupFinished(group, init, round));
  if (unfinished(otherSide(completed))) return otherSide(completed);
  if (unfinished(completed)) return completed;
  return null;
}

/**
 * With no turn in progress: complete the active group when nothing in it can still act, then, when
 * every group on both sides has finished, end the round and start the next one. At most one round
 * advances per call, and only when someone will be able to act in the new round.
 */
export async function settle(
  ctx: MutationCtx,
  scope: JournalScope,
  encounterId: Id<'encounters'>,
): Promise<{ groupCompleted: boolean; roundAdvanced: boolean }> {
  const result = { groupCompleted: false, roundAdvanced: false };
  let encounter = await ctx.db.get(encounterId);
  if (!encounter || encounter.status !== 'committed' || !encounter.phase) return result;
  let init = await loadInitiative(ctx, encounterId);
  // A group with no entries left (after a move or a removal) has no meaning; the active group
  // stays until its turn ends and it completes (empty-group presentation is otherwise open).
  for (const group of init.groups)
    if (
      group._id !== encounter.activeGroupId &&
      !init.entries.some(entry => entry.groupId === group._id)
    )
      await journalDelete(ctx, scope, 'initiativeGroups', group._id);
  if (encounter.phase !== 'turns' || encounter.activeTurnId) return result;
  const round = encounter.round ?? 0;
  init = await loadInitiative(ctx, encounterId);
  if (encounter.activeGroupId) {
    const group = init.groups.find(g => g._id === encounter!.activeGroupId);
    if (group && groupFinished(group, init, round)) {
      if (group.completedRound !== round)
        await journalPatch(ctx, scope, 'initiativeGroups', group._id, { completedRound: round });
      init = await loadInitiative(ctx, encounterId);
      await journalPatch(ctx, scope, 'encounters', encounterId, {
        activeGroupId: null,
        activeSide: nextSide(init, round, group.side),
      });
      result.groupCompleted = true;
      encounter = (await ctx.db.get(encounterId))!;
      if (!init.entries.some(entry => entry.groupId === group._id)) {
        await journalDelete(ctx, scope, 'initiativeGroups', group._id);
        init = await loadInitiative(ctx, encounterId);
      }
    }
  }
  if (encounter.activeGroupId) return result;
  const allFinished = init.groups.every(group => groupFinished(group, init, round));
  const anyoneNextRound = init.entries.some(entry => !init.slain.has(entry.actor.id));
  if (!allFinished || !anyoneNextRound || round < 1) return result;
  await dispatchBoundary(ctx, scope, encounterId, { kind: 'round-end', round });
  await journalPatch(ctx, scope, 'encounters', encounterId, {
    round: round + 1,
    activeGroupId: null,
    activeSide: encounter.startingSide
      ? nextSide(init, round + 1, otherSide(encounter.startingSide))
      : null,
  });
  await dispatchBoundary(ctx, scope, encounterId, { kind: 'round-start', round: round + 1 });
  result.roundAdvanced = true;
  return result;
}

// ---------------------------------------------------------------------------------------------
// Mid-combat roster hooks (called by foe.add / foe.remove inside their commit).

/** A foe added during committed combat joins in a new bottom group with a turn this round (Q-R-52 A). */
export async function onFoeAdded(
  ctx: MutationCtx,
  scope: JournalScope,
  campaign: Doc<'campaigns'>,
  foe: { id: Id<'foes'>; name: string },
): Promise<void> {
  const encounter = await committedEncounter(ctx, campaign);
  if (!encounter || !encounter.phase) return;
  const groupId = await createGroup(ctx, scope, encounter, 'director');
  await createEntry(ctx, scope, encounter, groupId, { kind: 'foe', id: foe.id, name: foe.name });
}

/**
 * A foe removed during committed combat: if it is acting, its turn finishes first (end-turn work
 * resolves through the clock); its entries leave the roster; an emptied group that is not active is
 * removed; then the ordinary group/side/round handoff continues. Retry safety comes from the
 * removal command's once-only receipt.
 */
export async function onFoeRemoved(
  ctx: MutationCtx,
  scope: JournalScope,
  campaign: Doc<'campaigns'>,
  foeId: Id<'foes'>,
): Promise<void> {
  const encounter = await committedEncounter(ctx, campaign);
  if (!encounter || !encounter.phase) return;
  if (encounter.activeTurnId) {
    const turn = await ctx.db.get(encounter.activeTurnId);
    if (turn && turn.actor.kind === 'foe' && turn.actor.id === foeId) {
      await dispatchBoundary(
        ctx,
        scope,
        encounter._id,
        { kind: 'turn-end', round: turn.round, turn: await turnRef(ctx, turn) },
        turn.actor.name,
      );
      await journalPatch(ctx, scope, 'turns', turn._id, {
        status: 'ended',
        endedEventId: scope.eventId,
      });
      await journalPatch(ctx, scope, 'encounters', encounter._id, { activeTurnId: null });
    }
  }
  const init = await loadInitiative(ctx, encounter._id);
  for (const entry of init.entries.filter(e => e.actor.kind === 'foe' && e.actor.id === foeId))
    await journalDelete(ctx, scope, 'turnEntries', entry._id);
  await settle(ctx, scope, encounter._id);
}

/**
 * Moves one entry to another group on its side, or to a new bottom group. Spent state travels with
 * the entry; the destination's completion is untouched (a finished group does not reopen); the
 * source group is removed only when it is empty and not active.
 */
export async function moveEntry(
  ctx: MutationCtx,
  scope: JournalScope,
  encounter: Doc<'encounters'>,
  entryId: Id<'turnEntries'>,
  target: Id<'initiativeGroups'> | 'new',
): Promise<{ groupId: Id<'initiativeGroups'>; created: boolean }> {
  const entry = await ctx.db.get(entryId);
  if (!entry || entry.encounterId !== encounter._id)
    throw new ConvexError('Turn entry unavailable.');
  const side = sideOf(entry.actor);
  let groupId: Id<'initiativeGroups'>;
  let created = false;
  if (target === 'new') {
    groupId = await createGroup(ctx, scope, encounter, side);
    created = true;
  } else {
    const group = await ctx.db.get(target);
    if (!group || group.encounterId !== encounter._id)
      throw new ConvexError('Initiative group unavailable.');
    if (group.side !== side)
      throw new ConvexError('An entry can only move between groups on its own side.');
    if (group._id === entry.groupId) throw new ConvexError('The entry is already in that group.');
    groupId = group._id;
  }
  const siblings = await ctx.db
    .query('turnEntries')
    .withIndex('by_group', q => q.eq('groupId', groupId))
    .take(500);
  await journalPatch(ctx, scope, 'turnEntries', entryId, {
    groupId,
    order: siblings.reduce((max, e) => Math.max(max, e.order), 0) + 1,
  });
  await settle(ctx, scope, encounter._id);
  return { groupId, created };
}

// ---------------------------------------------------------------------------------------------
// V02 squad hooks (docs/table-spec.md#minion-squads-and-captain-state: one squad entry per
// addition with a shared turn; the captain takes its turn at the same time as the squad).

/** A squad added during committed combat joins in a new bottom group with a turn this round. */
export async function onSquadAdded(
  ctx: MutationCtx,
  scope: JournalScope,
  campaign: Doc<'campaigns'>,
  squad: { id: Id<'squads'>; name: string },
): Promise<void> {
  const encounter = await committedEncounter(ctx, campaign);
  if (!encounter || !encounter.phase) return;
  const groupId = await createGroup(ctx, scope, encounter, 'director');
  await createEntry(ctx, scope, encounter, groupId, {
    kind: 'squad',
    id: squad.id,
    name: squad.name,
  });
}

/** Removing a whole squad: its shared turn finishes first, then its entries leave initiative. */
export async function onSquadRemoved(
  ctx: MutationCtx,
  scope: JournalScope,
  campaign: Doc<'campaigns'>,
  squadId: Id<'squads'>,
): Promise<void> {
  const encounter = await committedEncounter(ctx, campaign);
  if (!encounter || !encounter.phase) return;
  if (encounter.activeTurnId) {
    const turn = await ctx.db.get(encounter.activeTurnId);
    if (turn && turn.actor.kind === 'squad' && turn.actor.id === squadId) {
      await dispatchBoundary(
        ctx,
        scope,
        encounter._id,
        { kind: 'turn-end', round: turn.round, turn: await turnRef(ctx, turn) },
        turn.actor.name,
      );
      await journalPatch(ctx, scope, 'turns', turn._id, {
        status: 'ended',
        endedEventId: scope.eventId,
      });
      await journalPatch(ctx, scope, 'encounters', encounter._id, { activeTurnId: null });
    }
  }
  const entries = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(1000);
  for (const entry of entries)
    if (entry.actor.kind === 'squad' && entry.actor.id === squadId)
      await journalDelete(ctx, scope, 'turnEntries', entry._id);
  await settle(ctx, scope, encounter._id);
}

/**
 * A captain attached during committed combat folds its own turn into the squad's shared turn:
 * its separate entries leave initiative. Returns a warning when the two had different spent state.
 */
export async function onCaptainAttached(
  ctx: MutationCtx,
  scope: JournalScope,
  campaign: Doc<'campaigns'>,
  captainId: Id<'foes'>,
  squadId: Id<'squads'>,
): Promise<string[]> {
  const encounter = await committedEncounter(ctx, campaign);
  if (!encounter || !encounter.phase) return [];
  const round = encounter.round ?? 0;
  const entries = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(1000);
  const warnings: string[] = [];
  const squadEntry = entries.find(e => e.actor.kind === 'squad' && e.actor.id === squadId);
  for (const entry of entries)
    if (entry.actor.kind === 'foe' && entry.actor.id === captainId) {
      if (squadEntry && (entry.spentRound === round) !== (squadEntry.spentRound === round))
        warnings.push(
          `Rule warning: ${entry.actor.name} ${entry.spentRound === round ? 'has already acted' : 'has not acted'} this round while the squad ${squadEntry.spentRound === round ? 'has' : 'has not'}; the captain now shares the squad's turn (rule/monster/captain.md).`,
        );
      await journalDelete(ctx, scope, 'turnEntries', entry._id);
    }
  await settle(ctx, scope, encounter._id);
  return warnings;
}

/**
 * A living captain detached during committed combat gets its own turn entry back in a new bottom
 * group, spent this round if the squad's entry already was.
 */
export async function onCaptainDetached(
  ctx: MutationCtx,
  scope: JournalScope,
  campaign: Doc<'campaigns'>,
  captain: { id: Id<'foes'>; name: string },
  squadId: Id<'squads'>,
): Promise<void> {
  const encounter = await committedEncounter(ctx, campaign);
  if (!encounter || !encounter.phase) return;
  const entries = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(1000);
  if (entries.some(e => e.actor.kind === 'foe' && e.actor.id === captain.id)) return;
  const squadEntry = entries.find(e => e.actor.kind === 'squad' && e.actor.id === squadId);
  const groupId = await createGroup(ctx, scope, encounter, 'director');
  const entryId = await createEntry(ctx, scope, encounter, groupId, {
    kind: 'foe',
    id: captain.id,
    name: captain.name,
  });
  if (squadEntry?.spentRound !== null && squadEntry?.spentRound !== undefined)
    await journalPatch(ctx, scope, 'turnEntries', entryId, { spentRound: squadEntry.spentRound });
}
