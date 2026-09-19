// SPDX-License-Identifier: GPL-3.0-only
/** Constant-size passive history windows over the derived index. Mutation validation stays authoritative. */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { ReadCtx } from './access';
import type { TableContext } from './registry';
import { currentEncounter } from './encounters';
import { projectEvent, settingsOf } from './audience';
import { historyCursor, historyUnit } from './historyIndex';
import {
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
