// SPDX-License-Identifier: GPL-3.0-only
/**
 * A06 history: seams, windows, undo/rewind/redo and the correction-window check, over the S02
 * journal. Nothing here runs a rule or a die: restoration writes the recorded before/after values
 * back through the journal so the restoring event carries its own change record.
 *
 * Owning specifications:
 * - docs/table-spec.md#undo-permissions-and-proposed-campaign-control — the sequential seam model:
 *   a player undoes their own character's uninterrupted latest actions in reverse order to the
 *   nearest seam (another character's committed action, a committed Director correction or
 *   adjustment) with turn start or the FreePlay stretch start as outer limits; the Director rewinds
 *   sequentially across seams within the current encounter; redo restores the recorded path exactly;
 *   new gameplay after undo clears redo but keeps the abandoned history; Enable user undo (default on)
 *   removes player undo only.
 * - docs/table-spec.md#director-edits-to-inline-results and
 *   docs/table-command-spec.md#inline-corrections-and-history — corrections append; modifying an
 *   older event requires sequentially undoing the intervening chain first (confirmed 2026-09-13),
 *   for the Director as for everyone; the acting player's correction window is their undo window.
 * - docs/table-spec.md#formal-encounter-closeout and docs/v1-spec-checkpoint.md#loot-and-history —
 *   an archived encounter is a boundary nothing crosses; closed sessions are read-only.
 * - docs/data-architecture-spec.md#5-encounter-actions-and-undo — the undo unit is one user command
 *   and its automatic consequences under the same scoped command key; undo reverses its journal from
 *   last to first, redo replays it first to last, restoring recorded values without calling modifiers.
 * - docs/engine-architecture.md#history-and-state-restoration — navigation never calls modifiers,
 *   recomputes rule effects or regenerates dice; rollback restores the whole affected state.
 *
 * Interpretations recorded in docs/build/A06-history-undo-corrections.md (work log), not rules.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id, TableNames } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { BoundActor } from '../../shared/commands/envelope';
import type { JournalValue } from '../../shared/contracts/history';
import type { ReadCtx } from './access';
import { projectEvent, settingsOf } from './audience';
import { currentEncounter } from './encounters';
import { journalDelete, journalInsert, journalPatch, type JournalScope } from './journal';
import type { OperationDefinition, TableContext } from './registry';

// ---------------------------------------------------------------------------------------------
// Which events are gameplay units.

/**
 * User-originated event kinds that are not gameplay: they neither form undo units nor create
 * seams, and rewinding never touches them ("reads, chat and sheet navigation do not create
 * gameplay undo seams"; settings and notes are table administration, not play).
 */
export {
  NON_GAMEPLAY_KINDS,
  ENCOUNTER_LIFECYCLE_KINDS,
  isGameplayHead,
  historyTarget,
} from './historyModel';
import { isGameplayHead, isHistoryKind, historyTarget } from './historyModel';

// ---------------------------------------------------------------------------------------------
// The walk: effective branch and redo path from the session's ordered events.

/** The subset of a stored event the walk needs; `Doc<'events'>` satisfies it. */
export interface EventLike {
  _id: string;
  sequence: number;
  origin: string;
  kind: string;
  description: string;
  actorId?: string;
  actorName?: string;
  commandKey?: string;
  causeEventId?: string | null;
  encounterId?: string | null;
  disposition?: string;
  payload?: unknown;
}

/** One undo unit as seen by the walk: its head (the user event) and what the head recorded. */
export interface Unit<E extends EventLike = EventLike> {
  head: E;
  /** The acting character or foe the command was bound to; null for table actions. */
  actor: BoundActor | null;
  issuerId: string | null;
  commandKey: string;
}

export interface Walk<E extends EventLike = EventLike> {
  /** Units in effect on the current branch, in order; the last one is the undo/rewind target. */
  branch: Unit<E>[];
  /** Undone units available to redo; the last one is the next to redo. */
  redo: Unit<E>[];
  /** The gameplay unit that most recently cleared a non-empty redo path, for the message. */
  redoClearedBy: Unit<E> | null;
  /** Every gameplay unit by head id, on or off the branch. */
  units: Map<string, Unit<E>>;
  /** Unit head id by any event id of the unit (consequences included). */
  unitOfEvent: Map<string, string>;
}

function boundActorOf(payload: unknown): BoundActor | null {
  const envelope = (payload as { envelope?: { boundActor?: BoundActor | null } } | undefined)
    ?.envelope;
  return envelope?.boundActor ?? null;
}

/**
 * Replays the session's history operations over its gameplay units. Undo pops the branch onto the
 * redo path, redo pops it back, and any new gameplay unit clears the redo path (confirmed
 * 2026-09-12). Pure over the event list so it can be tested on synthetic journals.
 */
export function walkHistory<E extends EventLike>(events: E[]): Walk<E> {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  const walk: Walk<E> = {
    branch: [],
    redo: [],
    redoClearedBy: null,
    units: new Map(),
    unitOfEvent: new Map(),
  };
  const byKey = new Map<string, string>();
  for (const event of ordered) {
    if (event.commandKey && byKey.has(event.commandKey) && event.origin !== 'user')
      walk.unitOfEvent.set(event._id, byKey.get(event.commandKey)!);
    if (event.origin !== 'user') continue;
    if (isHistoryKind(event.kind)) {
      const target = historyTarget(event.payload);
      const unit = target ? walk.units.get(target) : undefined;
      if (!unit) throw new ConvexError(`History entry #${event.sequence} names no known unit.`);
      if (event.kind === 'history.redo') {
        const top = walk.redo.pop();
        if (!top || top.head._id !== unit.head._id)
          throw new ConvexError(`History entry #${event.sequence} redoes out of order.`);
        walk.branch.push(top);
      } else {
        const last = walk.branch.pop();
        if (!last || last.head._id !== unit.head._id)
          throw new ConvexError(`History entry #${event.sequence} undoes out of order.`);
        walk.redo.push(last);
      }
      continue;
    }
    if (!isGameplayHead(event)) continue;
    const key = event.commandKey ?? JSON.stringify([event.actorId ?? null, event._id]);
    const unit: Unit<E> = {
      head: event,
      actor:
        boundActorOf(event.payload) ??
        (event.kind.startsWith('correction.')
          ? ((event.payload as { data?: { actor?: BoundActor } } | undefined)?.data?.actor ?? null)
          : null),
      issuerId: event.actorId ?? null,
      commandKey: key,
    };
    walk.units.set(event._id, unit);
    walk.unitOfEvent.set(event._id, event._id);
    byKey.set(key, event._id);
    walk.branch.push(unit);
    if (walk.redo.length) walk.redoClearedBy = unit;
    walk.redo = [];
  }
  return walk;
}

// ---------------------------------------------------------------------------------------------
// Scope: the current session, its encounter or FreePlay stretch, and the floor nothing crosses.

export interface HistoryScope {
  session: Doc<'sessions'>;
  /** The committed current encounter, or null in FreePlay (a draft counts as FreePlay). */
  encounter: Doc<'encounters'> | null;
  /** Units whose head sequence is at or below this cannot be undone, rewound or redone. */
  floorSequence: number;
  floorLabel: string;
  walk: Walk<Doc<'events'>>;
  events: Doc<'events'>[];
}

async function sessionEvents(ctx: ReadCtx, sessionId: Id<'sessions'>) {
  return ctx.db
    .query('events')
    .withIndex('by_session_sequence', q => q.eq('sessionId', sessionId))
    .collect();
}

/** Loads the history scope of the campaign's active session. Reads only. */
export async function loadHistory(ctx: ReadCtx, context: TableContext): Promise<HistoryScope> {
  const session = context.session;
  if (!session) throw new ConvexError('History needs an active session.');
  const events = (await sessionEvents(ctx, session._id)).map(event => ({
    ...event,
    // Window targets and refusal messages obey the same audience as the game log. Keep stored
    // payloads for operation/history identity; restoration reads the original journal separately.
    description: projectEvent(event, context.campaign, context.role === 'director').description,
  }));
  const walk = walkHistory(events);
  const current = await currentEncounter(ctx, session);
  const encounter = current?.status === 'committed' ? current : null;
  let floorSequence = 0;
  let floorLabel = 'the start of this session';
  if (encounter) {
    // The encounter start is the OK event, which the precombat snapshot records.
    const snapshot = encounter.precombatSnapshotId
      ? await ctx.db.get(encounter.precombatSnapshotId)
      : null;
    const start = snapshot?.eventId ? await ctx.db.get(snapshot.eventId) : null;
    // Without the recorded OK event nothing can be placed relative to the start: cross nothing.
    floorSequence = start?.sequence ?? Number.MAX_SAFE_INTEGER;
    floorLabel = 'the encounter start';
  } else {
    // FreePlay: the stretch begins after the last archived encounter of this session, if any.
    const encounters = await ctx.db
      .query('encounters')
      .withIndex('by_session', q => q.eq('sessionId', session._id))
      .collect();
    const archived = new Set(encounters.filter(e => e.archivedAt !== null).map(e => e._id));
    for (const event of events)
      if (event.encounterId && archived.has(event.encounterId) && event.sequence > floorSequence) {
        floorSequence = event.sequence;
        floorLabel = 'the archived encounter';
      }
  }
  return { session, encounter, floorSequence, floorLabel, walk, events };
}

// ---------------------------------------------------------------------------------------------
// Seams and windows.

const label = (unit: Unit) => `#${unit.head.sequence} ${unit.head.description}`;

/** Whether the unit is a Director correction or adjustment (a seam for players). */
export function isDirectorCorrection(unit: Unit): boolean {
  const byRole = (unit.head.payload as { data?: { byRole?: string } } | undefined)?.data?.byRole;
  return (
    unit.head.kind === 'manual.adjustment' ||
    (unit.head.kind.startsWith('correction.') && byRole !== 'player')
  );
}

/** Names the seam a unit that is not the player's own character's action creates. */
export function seamOf(unit: Unit): string {
  if (unit.head.kind === 'turn.take')
    return `${unit.actor?.name ?? 'another creature'}'s turn started (${label(unit)})`;
  if (isDirectorCorrection(unit)) return `a committed Director adjustment (${label(unit)})`;
  if (unit.actor) return `${unit.actor.name}'s committed action (${label(unit)})`;
  return `a committed Director table action (${label(unit)})`;
}

export type Window =
  { allowed: true; unit: Unit<Doc<'events'>> } | { allowed: false; reason: string };

/** Does the user control the unit's acting character? Foes and actorless units are never owned. */
export async function ownsUnit(ctx: ReadCtx, unit: Unit, user: Doc<'users'>): Promise<boolean> {
  // A Director adjustment or correction on the player's own hero is still the Director's entry.
  if (isDirectorCorrection(unit)) return false;
  if (!unit.actor || unit.actor.kind !== 'character') return false;
  const id = ctx.db.normalizeId('characters', unit.actor.id);
  const character = id ? await ctx.db.get(id) : null;
  const campaignId = (unit.head as Partial<Doc<'events'>>).campaignId;
  return (
    !!character &&
    character.ownerId === user._id &&
    (!campaignId || character.campaignId === campaignId)
  );
}

function belowFloor(scope: HistoryScope, unit: Unit): string | null {
  if (unit.head.sequence > scope.floorSequence) return null;
  return `${label(unit)} is at or before ${scope.floorLabel}, which history does not cross.`;
}

/**
 * The player window for undoing (or correcting) the latest unit: it must be the player's own
 * character's, nothing may have intervened, turn start is the outer limit and the encounter or
 * FreePlay floor is never crossed. `requested` names a specific unit (a stale inline control); it
 * is refused unless it is the latest unit.
 */
export async function playerWindow(
  ctx: ReadCtx,
  scope: HistoryScope,
  user: Doc<'users'>,
  requested: Unit<Doc<'events'>> | null = null,
): Promise<Window> {
  const latest = scope.walk.branch.at(-1);
  if (!latest) return { allowed: false, reason: `Nothing to undo since ${scope.floorLabel}.` };
  const floor = belowFloor(scope, latest);
  if (floor) return { allowed: false, reason: `Nothing to undo: ${floor}` };
  const own = await ownsUnit(ctx, latest, user);
  if (!own) return { allowed: false, reason: `Your undo window is closed by ${seamOf(latest)}.` };
  if (requested && requested.head._id !== latest.head._id)
    return {
      allowed: false,
      reason: `Undo your later action first: ${label(latest)} comes after ${label(requested)}.`,
    };
  if (latest.head.kind === 'turn.take')
    return {
      allowed: false,
      reason: `Turn start is the outer limit of your undo window: ${label(latest)} stays.`,
    };
  return { allowed: true, unit: latest };
}

/** The Director window: the latest unit on the branch, never past the encounter start or an archive. */
export function directorWindow(
  scope: HistoryScope,
  requested: Unit<Doc<'events'>> | null = null,
): Window {
  const latest = scope.walk.branch.at(-1);
  if (!latest) return { allowed: false, reason: `Nothing to rewind since ${scope.floorLabel}.` };
  const floor = belowFloor(scope, latest);
  if (floor) return { allowed: false, reason: `Nothing to rewind: ${floor}` };
  if (requested && requested.head._id !== latest.head._id)
    return {
      allowed: false,
      reason: `Later gameplay has committed: rewind ${label(latest)} first (sequential rewind reaches ${label(requested)} in order).`,
    };
  return { allowed: true, unit: latest };
}

/** The redo window: the top of the redo path, under the caller's authority over that unit. */
export async function redoWindow(
  ctx: ReadCtx,
  scope: HistoryScope,
  context: TableContext,
  requested: Unit<Doc<'events'>> | null = null,
): Promise<Window> {
  const top = scope.walk.redo.at(-1);
  if (!top)
    return {
      allowed: false,
      reason: scope.walk.redoClearedBy
        ? `Nothing to redo: new gameplay (${label(scope.walk.redoClearedBy)}) cleared the redo path; the undone entries stay readable.`
        : 'Nothing to redo.',
    };
  if (requested && requested.head._id !== top.head._id)
    return { allowed: false, reason: `Redo restores in order: ${label(top)} comes first.` };
  const floor = belowFloor(scope, top);
  if (floor) return { allowed: false, reason: `Nothing to redo: ${floor}` };
  if (context.role !== 'director' && top.head.kind === 'turn.take')
    return {
      allowed: false,
      reason: 'Turn start is outside the player history window; the Director can redo it.',
    };
  if (context.role !== 'director' && !(await ownsUnit(ctx, top, context.user)))
    return {
      allowed: false,
      reason: `Redo of ${label(top)} is not yours: it is ${seamOf(top)}.`,
    };
  return { allowed: true, unit: top };
}

// ---------------------------------------------------------------------------------------------
// The correction window (A05 calls this when a post-roll edge/bane correction commits).

export interface CorrectionWindow {
  allowed: boolean;
  /** Why not, in the words the card shows; empty when allowed. */
  reason: string;
  /** The unit the event belongs to, when it exists. */
  unit: Unit<Doc<'events'>> | null;
}

/**
 * Whether `user` may append a correction to `eventId` now. The event's unit must be the latest on
 * the branch, apart from directly linked ability-correction continuations. Older events need the
 * intervening gameplay rewound first, Director included. The unit must be inside
 * the current encounter or FreePlay stretch of the running session. The acting player's window is
 * their undo window: own character, no seam, next actor's turn start as the outer cutoff. The
 * Enable user undo setting also gates player corrections (confirmed Q-A-601).
 */
export async function correctionWindow(
  ctx: ReadCtx,
  eventId: Id<'events'>,
  user: Doc<'users'>,
  mode: 'correction' | 'manual' = 'correction',
  prepared?: { context: TableContext; scope: HistoryScope | null },
): Promise<CorrectionWindow> {
  const event =
    prepared?.scope?.events.find(row => row._id === eventId) ?? (await ctx.db.get(eventId));
  if (!event) return { allowed: false, reason: 'That event is unavailable.', unit: null };
  const campaign = prepared?.context.campaign ?? (await ctx.db.get(event.campaignId));
  if (!campaign) return { allowed: false, reason: 'Campaign unavailable.', unit: null };
  const session = prepared
    ? prepared.context.session
    : campaign.activeSessionId
      ? await ctx.db.get(campaign.activeSessionId)
      : null;
  if (!session || session._id !== event.sessionId)
    return {
      allowed: false,
      reason: 'That event belongs to another session; closed sessions are read-only.',
      unit: null,
    };
  if (session.status !== 'running')
    return { allowed: false, reason: 'The session is paused; corrections wait.', unit: null };
  const role = campaign.ownerId === user._id ? 'director' : 'player';
  const context: TableContext = {
    user,
    campaign,
    session,
    role:
      role === 'director'
        ? 'director'
        : session.selectedPlayerIds.includes(user._id)
          ? 'player'
          : 'observer',
  };
  if (context.role === 'observer')
    return { allowed: false, reason: 'Observers cannot correct results.', unit: null };
  if (context.role !== 'director') {
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_campaign_user', q => q.eq('campaignId', campaign._id).eq('userId', user._id))
      .unique();
    if (!membership) return { allowed: false, reason: 'Campaign unavailable.', unit: null };
    if (!settingsOf(campaign).enableUserUndo)
      return {
        allowed: false,
        reason: 'Enable user undo is off; player corrections are disabled.',
        unit: null,
      };
  }
  const scope = prepared?.scope ?? (await loadHistory(ctx, context));
  const headId = scope.walk.unitOfEvent.get(event._id);
  const unit = headId ? scope.walk.units.get(headId) : undefined;
  if (!unit) return { allowed: false, reason: 'That event is not a gameplay unit.', unit: null };
  if (!scope.walk.branch.includes(unit))
    return {
      allowed: false,
      reason: `${label(unit)} is undone; redo it before correcting it.`,
      unit,
    };
  const later = scope.walk.branch.slice(scope.walk.branch.indexOf(unit) + 1);
  const correctsThisRoll = (next: Unit<Doc<'events'>>) =>
    event.kind === 'ability.use' &&
    next.head.kind === 'correction.ability' &&
    next.head.causeEventId === event._id &&
    next.head.payload?.data?.originalEventId === event._id;
  if (mode === 'manual' && context.role === 'director' && !belowFloor(scope, unit)) {
    // Dispositions continue the current effective card, including its linked corrections.
    // Formal closeout also offers outstanding clauses from this encounter.
    const linkedOnly = later.every(
      next =>
        correctsThisRoll(next) ||
        (next.head.kind === 'ability.resolved-at-table' &&
          next.head.payload?.data?.originalEventId === event._id),
    );
    const cleanup =
      scope.encounter?.phase === 'closeout' && event.encounterId === scope.encounter._id;
    if (linkedOnly || cleanup) return { allowed: true, reason: '', unit };
  }
  // A directly linked correction continues the same effective roll; it is not permission to
  // skip other gameplay. Keep every correction as a separate undo unit in the real history.
  // Validate the original unit's floor/ownership as well as each continuation's player seam.
  let correctionScope = scope;
  if (mode === 'correction' && later.length && later.every(correctsThisRoll)) {
    if (context.role !== 'director') {
      for (const next of later)
        if (!(await ownsUnit(ctx, next, user)))
          return {
            allowed: false,
            reason: `Your correction window is closed by ${seamOf(next)}.`,
            unit,
          };
    }
    correctionScope = {
      ...scope,
      walk: {
        ...scope.walk,
        branch: scope.walk.branch.slice(0, scope.walk.branch.indexOf(unit) + 1),
      },
    };
  }
  const window =
    context.role === 'director'
      ? directorWindow(correctionScope, unit)
      : await playerWindow(ctx, correctionScope, user, unit);
  if (!window.allowed) return { allowed: false, reason: window.reason, unit };
  return { allowed: true, reason: '', unit };
}

/** Throws the correction window's reason when the correction is not allowed. */
export async function assertCorrectionAllowed(
  ctx: ReadCtx,
  eventId: Id<'events'>,
  user: Doc<'users'>,
): Promise<Unit<Doc<'events'>>> {
  const window = await correctionWindow(ctx, eventId, user);
  if (!window.allowed || !window.unit) throw new ConvexError(window.reason);
  return window.unit;
}

/** Build one history walk per result-list query, shared by all correction/disposition controls. */
export async function loadCorrectionWindows(ctx: ReadCtx, context: TableContext) {
  const scope = context.session?.status === 'running' ? await loadHistory(ctx, context) : null;
  const prepared = { context, scope };
  return (eventId: Id<'events'>, mode: 'correction' | 'manual' = 'correction') =>
    correctionWindow(ctx, eventId, context.user, mode, prepared);
}

/** Shared read/write window for source-card manual continuations, including formal closeout. */
export const manualResolutionWindow = (ctx: ReadCtx, eventId: Id<'events'>, user: Doc<'users'>) =>
  correctionWindow(ctx, eventId, user, 'manual');

export async function assertManualResolutionAllowed(
  ctx: ReadCtx,
  eventId: Id<'events'>,
  user: Doc<'users'>,
) {
  const window = await manualResolutionWindow(ctx, eventId, user);
  if (!window.allowed || !window.unit) throw new ConvexError(window.reason);
  return window.unit;
}

/** Resolve a historical creature reference without rewriting the original event/result. */
export async function resolveHistoricalId(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
  id: string,
): Promise<string> {
  const seen = new Set<string>();
  let current = id;
  while (!seen.has(current)) {
    seen.add(current);
    const alias = await ctx.db
      .query('historyAliases')
      .withIndex('by_campaign_former', q => q.eq('campaignId', campaignId).eq('formerId', current))
      .unique();
    if (!alias) return current;
    current = alias.currentId;
  }
  throw new ConvexError('History contains a cyclic creature reference.');
}

// ---------------------------------------------------------------------------------------------
// Restoration: recorded values back through the journal; no modifier, no dice.

class Aliases {
  private readonly map = new Map<string, string>();
  constructor(rows: Doc<'historyAliases'>[]) {
    for (const row of rows) this.map.set(row.formerId, row.currentId);
  }
  /** The live id a recorded id stands for, following alias chains. */
  resolve(id: string): string {
    let current = id;
    const seen = new Set<string>();
    while (this.map.has(current) && !seen.has(current)) {
      seen.add(current);
      current = this.map.get(current)!;
    }
    return current;
  }
  async record(ctx: MutationCtx, campaignId: Id<'campaigns'>, former: string, current: string) {
    const existing = await ctx.db
      .query('historyAliases')
      .withIndex('by_campaign_former', q => q.eq('campaignId', campaignId).eq('formerId', former))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { currentId: current });
    else
      await ctx.db.insert('historyAliases', { campaignId, formerId: former, currentId: current });
    this.map.set(former, current);
  }
  /** A recorded value with every aliased id string replaced by the id that now stands for it. */
  mapValue(value: unknown): unknown {
    if (typeof value === 'string') return this.map.size ? this.resolve(value) : value;
    if (Array.isArray(value)) return value.map(item => this.mapValue(item));
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, item]) => [
          k,
          this.mapValue(item),
        ]),
      );
    return value;
  }
}

async function loadAliases(ctx: MutationCtx, campaignId: Id<'campaigns'>) {
  return new Aliases(
    await ctx.db
      .query('historyAliases')
      .withIndex('by_campaign_former', q => q.eq('campaignId', campaignId))
      .collect(),
  );
}

/** Every change of the unit in application order (event sequence, ordinal). */
export async function unitJournal(ctx: ReadCtx, unit: Unit<Doc<'events'>>) {
  const events = await ctx.db
    .query('events')
    .withIndex('by_campaign_command_key', q =>
      q.eq('campaignId', unit.head.campaignId).eq('commandKey', unit.commandKey),
    )
    .collect();
  events.sort((a, b) => a.sequence - b.sequence);
  const changes: Doc<'changes'>[] = [];
  for (const event of events) {
    const rows = await ctx.db
      .query('changes')
      .withIndex('by_event', q => q.eq('eventId', event._id))
      .collect();
    rows.sort((a, b) => a.ordinal - b.ordinal);
    changes.push(...rows);
  }
  return { events, changes };
}

/** Writes one recorded value (a `before` for undo, an `after` for redo) back to its document. */
async function restoreChange(
  ctx: MutationCtx,
  scope: JournalScope,
  aliases: Aliases,
  change: Doc<'changes'>,
  target: JournalValue,
): Promise<void> {
  const table = change.entityTable as TableNames;
  const recordedId = aliases.resolve(change.entityId);
  const id = ctx.db.normalizeId(table, recordedId);
  if (change.path === '') {
    if (target.present) {
      const existing = id ? await ctx.db.get(id) : null;
      if (existing) return; // already present under this id: nothing to recreate.
      const value = aliases.mapValue(target.value) as Record<string, unknown>;
      const created = await journalInsert(ctx, scope, table, value as never);
      if (created !== recordedId) await aliases.record(ctx, scope.campaignId, recordedId, created);
      return;
    }
    if (id && (await ctx.db.get(id))) await journalDelete(ctx, scope, table, id);
    return;
  }
  const doc = id ? await ctx.db.get(id) : null;
  if (!doc)
    throw new ConvexError(
      `Cannot restore ${table} ${change.path}: the recorded document no longer exists.`,
    );
  const [top, ...rest] = change.path.split('.');
  let topValue: unknown;
  if (!rest.length) topValue = target.present ? aliases.mapValue(target.value) : undefined;
  else {
    const current = (doc as Record<string, unknown>)[top!];
    const root: Record<string, unknown> =
      current && typeof current === 'object' && !Array.isArray(current)
        ? (structuredClone(current) as Record<string, unknown>)
        : {};
    let cursor = root;
    for (const key of rest.slice(0, -1)) {
      const next = cursor[key];
      if (!next || typeof next !== 'object' || Array.isArray(next)) cursor[key] = {};
      cursor = cursor[key] as Record<string, unknown>;
    }
    const leaf = rest.at(-1)!;
    if (target.present) cursor[leaf] = aliases.mapValue(target.value);
    else delete cursor[leaf];
    topValue = root;
  }
  await journalPatch(ctx, scope, table, id!, { [top!]: topValue } as never);
}

/**
 * Restores a unit: `undo` writes every `before` value from the last change to the first and marks
 * the unit's events `undone`; `redo` writes every `after` value first to last and marks them
 * `redone`. Returns how many changes were written. Rolls are untouched: recorded dice stay on the
 * events and no die is generated.
 */
export async function restoreUnit(
  ctx: MutationCtx,
  scope: JournalScope,
  unit: Unit<Doc<'events'>>,
  direction: 'undo' | 'redo',
): Promise<{ changes: number; events: number }> {
  const { events, changes } = await unitJournal(ctx, unit);
  const aliases = await loadAliases(ctx, scope.campaignId);
  const ordered = direction === 'undo' ? [...changes].reverse() : changes;
  for (const change of ordered)
    await restoreChange(
      ctx,
      scope,
      aliases,
      change,
      direction === 'undo' ? change.before : change.after,
    );
  // A deletion unit can recreate a group before its entries (or an entry before its actor).
  // Reconcile references after every recreated id is known, including repeated alias hops.
  const touched = new Map<string, TableNames>();
  for (const change of ordered) touched.set(change.entityId, change.entityTable as TableNames);
  for (const [recordedId, table] of touched) {
    const id = ctx.db.normalizeId(table, aliases.resolve(recordedId));
    const document = id ? await ctx.db.get(id) : null;
    if (!document) continue;
    const { _id, _creationTime, ...value } = document;
    void _creationTime;
    await journalPatch(ctx, scope, table, _id, aliases.mapValue(value) as never);
  }
  for (const event of events)
    await ctx.db.patch(event._id, { disposition: direction === 'undo' ? 'undone' : 'redone' });
  return { changes: ordered.length, events: events.length };
}

async function clearPendingTargets(ctx: MutationCtx, context: TableContext) {
  const draft = await ctx.db
    .query('targetingDrafts')
    .withIndex('by_campaign_user', q =>
      q.eq('campaignId', context.campaign._id).eq('userId', context.user._id),
    )
    .unique();
  if (draft) await ctx.db.delete(draft._id);
}

// ---------------------------------------------------------------------------------------------
// Registered operations.

function requestedUnit(scope: HistoryScope, arg: unknown): Unit<Doc<'events'>> | null {
  if (arg === undefined) return null;
  const headId = scope.walk.unitOfEvent.get(String(arg));
  const unit = headId ? scope.walk.units.get(headId) : undefined;
  if (!unit) throw new ConvexError('That event is not a gameplay entry of this session.');
  return unit;
}

function targetData(unit: Unit<Doc<'events'>>) {
  return {
    eventId: unit.head._id,
    sequence: unit.head.sequence,
    kind: unit.head.kind,
    description: unit.head.description,
    commandKey: unit.commandKey,
    actor: unit.actor,
  };
}

const eventArg = {
  event: v.optional(v.string()),
};
const eventArgDescription = {
  event:
    'The log entry to act on (event id), for inline controls. It must be the next entry in order; a stale control is refused.',
};

const historyUndo: OperationDefinition = {
  id: 'history.undo',
  family: 'history',
  verb: 'undo',
  title: 'Undo',
  description:
    'Undo your character’s latest action: every recorded change of that command returns to its before value, without rerunning rules or dice. Stops at the nearest seam (another character’s action, a Director adjustment), with turn start or the FreePlay stretch start as the outer limit. The Director’s undo is a rewind.',
  args: eventArg,
  argDescriptions: eventArgDescription,
  roles: ['director', 'player'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const scope = await loadHistory(ctx, context);
    const requested = requestedUnit(scope, args.event);
    let window: Window;
    if (context.role === 'director') window = directorWindow(scope, requested);
    else {
      if (!settingsOf(context.campaign).enableUserUndo)
        throw new ConvexError(
          'Enable user undo is off for this campaign; ask the Director to rewind.',
        );
      window = await playerWindow(ctx, scope, context.user, requested);
    }
    if (!window.allowed) throw new ConvexError(window.reason);
    const unit = window.unit;
    return {
      kind: context.role === 'director' ? 'history.rewind' : 'history.undo',
      description: `Undone: ${label(unit)}.`,
      causeEventId: unit.head._id,
      data: { target: targetData(unit), mode: context.role === 'director' ? 'rewind' : 'player' },
      commit: async (mctx, journal) => {
        await restoreUnit(mctx, journal, unit, 'undo');
        await clearPendingTargets(mctx, context);
      },
    };
  },
};

const historyRewind: OperationDefinition = {
  id: 'history.rewind',
  family: 'history',
  verb: 'rewind',
  title: 'Rewind (Director)',
  description:
    'Director rewind: undo the latest committed unit of gameplay whoever acted, one unit per call, sequentially across character and turn seams within the current encounter (or FreePlay stretch). Never crosses the encounter start or an archived encounter; restores recorded values without rerunning rules or dice.',
  args: eventArg,
  argDescriptions: eventArgDescription,
  roles: ['director'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const scope = await loadHistory(ctx, context);
    const window = directorWindow(scope, requestedUnit(scope, args.event));
    if (!window.allowed) throw new ConvexError(window.reason);
    const unit = window.unit;
    return {
      kind: 'history.rewind',
      description: `Rewound: ${label(unit)}.`,
      causeEventId: unit.head._id,
      data: { target: targetData(unit), mode: 'rewind' },
      commit: async (mctx, journal) => {
        await restoreUnit(mctx, journal, unit, 'undo');
        await clearPendingTargets(mctx, context);
      },
    };
  },
};

const historyRedo: OperationDefinition = {
  id: 'history.redo',
  family: 'history',
  verb: 'redo',
  title: 'Redo',
  description:
    'Restore the most recently undone unit exactly as recorded, including its dice and consequences, in forward order along the redo path. Unavailable once new gameplay has committed after the undo. Players redo their own character’s units; the Director any.',
  args: eventArg,
  argDescriptions: eventArgDescription,
  roles: ['director', 'player'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    if (context.role !== 'director' && !settingsOf(context.campaign).enableUserUndo)
      throw new ConvexError('Enable user undo is off for this campaign; ask the Director to redo.');
    const scope = await loadHistory(ctx, context);
    const window = await redoWindow(ctx, scope, context, requestedUnit(scope, args.event));
    if (!window.allowed) throw new ConvexError(window.reason);
    const unit = window.unit;
    return {
      kind: 'history.redo',
      description: `Redone: ${label(unit)}.`,
      causeEventId: unit.head._id,
      data: { target: targetData(unit) },
      commit: async (mctx, journal) => {
        await restoreUnit(mctx, journal, unit, 'redo');
      },
    };
  },
};

const userUndoSetting: OperationDefinition = {
  id: 'campaign.user-undo',
  family: 'campaign',
  verb: 'user-undo',
  title: 'Enable user undo',
  description:
    'Turn the Enable user undo campaign setting on or off. On by default. Off removes player undo and redo; Director rewind and redo are unaffected.',
  args: { state: v.string() },
  argDescriptions: { state: 'on or off.' },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (_ctx, { context, args }) => {
    const state = String(args.state).toLowerCase();
    if (state !== 'on' && state !== 'off') throw new ConvexError('"state" must be on or off.');
    const before = settingsOf(context.campaign);
    const settings = { ...before, enableUserUndo: state === 'on' };
    return {
      kind: 'campaign.setting',
      description: `Enable user undo turned ${state}.`,
      data: {
        setting: 'enableUserUndo',
        before: before.enableUserUndo,
        after: settings.enableUserUndo,
      },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'campaigns', context.campaign._id, { settings });
      },
    };
  },
};

export const historyOperations: OperationDefinition[] = [
  historyUndo,
  historyRewind,
  historyRedo,
  userUndoSetting,
];
