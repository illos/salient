// SPDX-License-Identifier: GPL-3.0-only
/** Indexed passive history windows; ability continuations read only their linked suffix. */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { ReadCtx } from './access';
import type { TableContext } from './registry';
import { currentEncounter } from './encounters';
import { projectEvent, settingsOf } from './audience';
import { historyCursor, historyUnit } from './historyIndex';
import {
  correctionWindow,
  directorWindow,
  playerWindow,
  walkHistory,
  type CorrectionWindow,
  type HistoryScope,
} from './history';

function projectUnit(event: Doc<'events'>, context: TableContext) {
  const projected = {
    ...event,
    description: projectEvent(event, context.campaign, context.role === 'director').description,
  };
  const unit = walkHistory([projected]).units.get(event._id);
  if (!unit) throw new ConvexError('History read index is inconsistent.');
  return unit;
}

export async function readHistory(
  ctx: ReadCtx,
  context: TableContext,
): Promise<HistoryScope | null> {
  const session = context.session;
  if (!session) return null;
  const [cursor, latest] = await Promise.all([
    historyCursor(ctx, session._id),
    ctx.db
      .query('events')
      .withIndex('by_session_sequence', q => q.eq('sessionId', session._id))
      .order('desc')
      .first(),
  ]);
  // Never pretend an incomplete checkpoint represents the whole session.
  if (!cursor || cursor.sequence !== (latest?.sequence ?? 0)) return null;
  const ids = [cursor.branchTop, cursor.redoTop, cursor.redoClearedBy];
  const events = await Promise.all(ids.map(id => (id ? ctx.db.get(id) : null)));
  const units = events.map(event => (event ? projectUnit(event, context) : null));
  const current = await currentEncounter(ctx, session);
  const encounter = current?.status === 'committed' ? current : null;
  let floorSequence = cursor.archivedFloor;
  let floorLabel = floorSequence ? 'the archived encounter' : 'the start of this session';
  if (encounter) {
    const snapshot = encounter.precombatSnapshotId
      ? await ctx.db.get(encounter.precombatSnapshotId)
      : null;
    const start = snapshot?.eventId ? await ctx.db.get(snapshot.eventId) : null;
    floorSequence = start?.sequence ?? Number.MAX_SAFE_INTEGER;
    floorLabel = 'the encounter start';
  }
  return {
    session,
    encounter,
    floorSequence,
    floorLabel,
    events: events.filter((event): event is Doc<'events'> => !!event),
    walk: {
      branch: units[0] ? [units[0]] : [],
      redo: units[1] ? [units[1]] : [],
      redoClearedBy: units[2],
      units: new Map(units.filter(unit => !!unit).map(unit => [unit.head._id, unit])),
      unitOfEvent: new Map(
        units.filter(unit => !!unit).map(unit => [unit.head._id, unit.head._id]),
      ),
    },
  };
}

/** Page-sized result projection. No session replay, and no hidden stale controls during catch-up. */
export async function loadReadCorrectionWindows(ctx: ReadCtx, context: TableContext) {
  const scope = context.session?.status === 'running' ? await readHistory(ctx, context) : null;
  const latest = scope?.walk.branch.at(-1);
  const latestIndex = latest ? await historyUnit(ctx, latest.head._id) : null;
  const continuations = new Map<string, Promise<HistoryScope | null>>();
  // The index already retains previousBranch through undo/redo. Follow only this ability's
  // uninterrupted continuation suffix, stopping at the first unrelated unit (never replay a session).
  async function continuationScope(event: Doc<'events'>): Promise<HistoryScope | null> {
    if (!scope || !latest || event.kind !== 'ability.use' || latest.head._id === event._id)
      return null;
    const reversed = [];
    let next = latest;
    let indexed = latestIndex;
    while (next.head._id !== event._id) {
      const correction =
        next.head.kind === 'correction.ability' &&
        next.head.causeEventId === event._id &&
        next.head.payload?.data?.originalEventId === event._id;
      const disposition =
        next.head.kind === 'ability.resolved-at-table' &&
        next.head.payload?.data?.originalEventId === event._id;
      if ((!correction && !disposition) || !indexed?.active || !indexed.previousBranch) return null;
      reversed.push(next);
      const previous = await ctx.db.get(indexed.previousBranch);
      if (
        !previous ||
        previous.sessionId !== scope.session._id ||
        previous.sequence >= next.head.sequence
      )
        return null;
      next = projectUnit(previous, context);
      indexed = await historyUnit(ctx, previous._id);
    }
    if (!indexed?.active || indexed.sessionId !== scope.session._id) return null;
    const branch = [next, ...reversed.reverse()];
    return {
      ...scope,
      events: branch.map(item => item.head),
      walk: {
        ...scope.walk,
        branch,
        units: new Map(branch.map(item => [item.head._id, item])),
        unitOfEvent: new Map(branch.map(item => [item.head._id, item.head._id])),
      },
    };
  }
  async function window(
    eventId: Id<'events'>,
    mode: 'correction' | 'manual' = 'correction',
  ): Promise<CorrectionWindow> {
    const denied = (reason: string): CorrectionWindow => ({ allowed: false, reason, unit: null });
    const event = await ctx.db.get(eventId);
    if (!event || event.campaignId !== context.campaign._id)
      return denied('That event is unavailable.');
    if (!context.session || event.sessionId !== context.session._id)
      return denied('That event belongs to another session; closed sessions are read-only.');
    if (context.session.status !== 'running')
      return denied('The session is paused; corrections wait.');
    if (context.role === 'observer') return denied('Observers cannot correct results.');
    if (context.role !== 'director' && !settingsOf(context.campaign).enableUserUndo)
      return denied('Enable user undo is off; player corrections are disabled.');
    if (!scope) return denied('Preparing history controls…');
    const indexed =
      event.origin === 'user'
        ? await historyUnit(ctx, event._id)
        : event.commandKey
          ? await ctx.db
              .query('historyUnits')
              .withIndex('by_session_command', q =>
                q.eq('sessionId', context.session!._id).eq('commandKey', event.commandKey!),
              )
              .order('desc')
              .first()
          : null;
    if (!indexed || indexed.sessionId !== context.session._id)
      return denied('That event is not a gameplay unit.');
    const head = await ctx.db.get(indexed.eventId);
    if (!head) return denied('That event is unavailable.');
    const unit = projectUnit(head, context);
    if (!indexed.active)
      return {
        allowed: false,
        reason: `#${head.sequence} ${unit.head.description} is undone; redo it before correcting it.`,
        unit,
      };
    if (event.kind === 'ability.use' && latest?.head._id !== event._id) {
      let pending = continuations.get(event._id);
      if (!pending) {
        pending = continuationScope(event);
        continuations.set(event._id, pending);
      }
      const linked = await pending;
      // Share mutation policy for same-roll identity, player/Director seams, floor and manual
      // disposition rules. The prepared scope prevents the authoritative helper loading a session.
      if (linked)
        return correctionWindow(ctx, eventId, context.user, mode, { context, scope: linked });
    }
    if (mode === 'manual' && context.role === 'director' && head.sequence > scope.floorSequence) {
      const linkedOnly = latest?.head._id === head._id || latestIndex?.continuationOf === event._id;
      const cleanup =
        scope.encounter?.phase === 'closeout' && event.encounterId === scope.encounter._id;
      if (linkedOnly || cleanup) return { allowed: true, reason: '', unit };
    }
    const result =
      context.role === 'director'
        ? directorWindow(scope, unit)
        : await playerWindow(ctx, scope, context.user, unit);
    return { allowed: result.allowed, reason: result.allowed ? '' : result.reason, unit };
  }
  return window;
}
