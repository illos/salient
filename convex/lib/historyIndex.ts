// SPDX-License-Identifier: GPL-3.0-only
/** Transactional, rebuildable read index. Never journal this derived state or truncate source events. */
import { ConvexError } from 'convex/values';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { ReadCtx } from './access';
import { historyTarget, isGameplayHead, isHistoryKind } from './historyModel';

export const HISTORY_BATCH = 64;
export const historyCursor = (ctx: ReadCtx, sessionId: Id<'sessions'>) =>
  ctx.db
    .query('historyCursors')
    .withIndex('by_session', q => q.eq('sessionId', sessionId))
    .unique();
export const historyUnit = (ctx: ReadCtx, eventId: Id<'events'>) =>
  ctx.db
    .query('historyUnits')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .unique();

async function ensureCursor(ctx: MutationCtx, sessionId: Id<'sessions'>) {
  const existing = await historyCursor(ctx, sessionId);
  if (existing) return existing;
  const id = await ctx.db.insert('historyCursors', {
    sessionId,
    sequence: 0,
    branchTop: null,
    redoTop: null,
    redoClearedBy: null,
    archivedFloor: 0,
    scheduled: false,
  });
  return (await ctx.db.get(id))!;
}

/** Mutates only the local cursor copy and bounded per-unit records. Persist the cursor once per batch. */
async function apply(ctx: MutationCtx, cursor: Doc<'historyCursors'>, event: Doc<'events'>) {
  if (event.origin === 'user' && isHistoryKind(event.kind)) {
    const id = ctx.db.normalizeId('events', historyTarget(event.payload) ?? '');
    const unit = id ? await historyUnit(ctx, id) : null;
    const redo = event.kind === 'history.redo';
    if (
      !unit ||
      unit.sessionId !== cursor.sessionId ||
      id !== (redo ? cursor.redoTop : cursor.branchTop)
    )
      throw new ConvexError(`History entry #${event.sequence} is out of order.`);
    if (redo) {
      await ctx.db.patch(unit._id, { active: true });
      cursor.branchTop = unit.eventId;
      cursor.redoTop = unit.previousRedo;
    } else {
      await ctx.db.patch(unit._id, { active: false, previousRedo: cursor.redoTop });
      cursor.branchTop = unit.previousBranch;
      cursor.redoTop = unit.eventId;
    }
  } else if (isGameplayHead(event)) {
    const original =
      event.kind === 'ability.resolved-at-table'
        ? ctx.db.normalizeId('events', String(event.payload?.data?.originalEventId ?? ''))
        : null;
    const previous = original && cursor.branchTop ? await historyUnit(ctx, cursor.branchTop) : null;
    await ctx.db.insert('historyUnits', {
      sessionId: cursor.sessionId,
      eventId: event._id,
      commandKey: event.commandKey ?? JSON.stringify([event.actorId ?? null, event._id]),
      active: true,
      previousBranch: cursor.branchTop,
      previousRedo: null,
      continuationOf:
        original && (cursor.branchTop === original || previous?.continuationOf === original)
          ? original
          : null,
    });
    if (cursor.redoTop) cursor.redoClearedBy = event._id;
    cursor.branchTop = event._id;
    cursor.redoTop = null;
  }
  // Backfill sees the final archived state. Live archive writes advance this after all consequences.
  if (event.encounterId) {
    const encounter = await ctx.db.get(event.encounterId);
    if (encounter?.archivedAt != null)
      cursor.archivedFloor = Math.max(cursor.archivedFloor, event.sequence);
  }
  cursor.sequence = event.sequence;
}

async function save(ctx: MutationCtx, cursor: Doc<'historyCursors'>) {
  const { _id, _creationTime, ...value } = cursor;
  void _creationTime;
  await ctx.db.patch(_id, value);
}

async function schedule(ctx: MutationCtx, cursor: Doc<'historyCursors'>) {
  if (cursor.scheduled) return;
  cursor.scheduled = true;
  await ctx.scheduler.runAfter(0, internal.history.backfill, { sessionId: cursor.sessionId });
}

/** Called in the same transaction as the source event insert. New sessions never need replay. */
export async function indexHistoryEvent(ctx: MutationCtx, event: Doc<'events'>) {
  if (!event.sessionId) return;
  const cursor = await ensureCursor(ctx, event.sessionId);
  const previous = await ctx.db
    .query('events')
    .withIndex('by_session_sequence', q =>
      q.eq('sessionId', event.sessionId!).lt('sequence', event.sequence),
    )
    .order('desc')
    .first();
  if (cursor.sequence === (previous?.sequence ?? 0)) await apply(ctx, cursor, event);
  else await schedule(ctx, cursor);
  await save(ctx, cursor);
}

export async function prepareHistoryIndex(ctx: MutationCtx, sessionId: Id<'sessions'>) {
  const cursor = await ensureCursor(ctx, sessionId);
  const latest = await ctx.db
    .query('events')
    .withIndex('by_session_sequence', q => q.eq('sessionId', sessionId))
    .order('desc')
    .first();
  if (cursor.sequence !== (latest?.sequence ?? 0)) await schedule(ctx, cursor);
  await save(ctx, cursor);
}

export async function catchUpHistoryIndex(ctx: MutationCtx, sessionId: Id<'sessions'>) {
  if (!(await ctx.db.get(sessionId))) return;
  const cursor = await ensureCursor(ctx, sessionId);
  const events = await ctx.db
    .query('events')
    .withIndex('by_session_sequence', q =>
      q.eq('sessionId', sessionId).gt('sequence', cursor.sequence),
    )
    .take(HISTORY_BATCH);
  cursor.scheduled = false;
  for (const event of events) await apply(ctx, cursor, event);
  if (events.length === HISTORY_BATCH) await schedule(ctx, cursor);
  await save(ctx, cursor);
}

export async function indexArchivedEncounter(ctx: MutationCtx, encounter: Doc<'encounters'>) {
  const cursor = await historyCursor(ctx, encounter.sessionId);
  if (!cursor) return; // Existing sessions will discover the floor during bounded catch-up.
  const event = await ctx.db
    .query('events')
    .withIndex('by_encounter_sequence', q => q.eq('encounterId', encounter._id))
    .order('desc')
    .first();
  if (event)
    await ctx.db.patch(cursor._id, {
      archivedFloor: Math.max(cursor.archivedFloor, event.sequence),
    });
}
