// SPDX-License-Identifier: GPL-3.0-only
// Change journal: every write that gameplay may undo goes through here so the journal holds the
// before and after value of each changed field. Owning specification:
// docs/data-architecture-spec.md#5-encounter-actions-and-undo ("retain the prior and resulting
// values of every affected field ... including field absence, created/deleted entities").
import { ConvexError } from 'convex/values';
import type { DataModel, Doc, Id, TableNames } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { commandKey } from './commands';
import type { JournalValue } from '../../shared/contracts/history';

/** Which event a set of changes belongs to. The event carries the command id (the undo unit). */
export interface JournalScope {
  campaignId: Id<'campaigns'>;
  eventId: Id<'events'>;
}

const absent: JournalValue = { present: false };
const present = (value: unknown): JournalValue => ({ present: true, value });

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((item, index) => equal(item, b[index]));
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every(key => equal(a[key], b[key]));
  }
  return false;
}

/** Flattens a patch against the current document into (path, before, after) triples, leaf by leaf. */
export function diffFields(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
  prefix = '',
): { path: string; before: JournalValue; after: JournalValue }[] {
  const out: { path: string; before: JournalValue; after: JournalValue }[] = [];
  for (const key of Object.keys(patch)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const before = current[key];
    const after = patch[key];
    if (isPlainObject(before) && isPlainObject(after)) {
      // Convex patches replace a nested object in full: omitted nested keys are deletions.
      const replacement = Object.fromEntries(
        [...new Set([...Object.keys(before), ...Object.keys(after)])].map(key => [key, after[key]]),
      );
      out.push(...diffFields(before, replacement, path));
      continue;
    }
    if (equal(before, after)) continue;
    out.push({
      path,
      before: key in current && before !== undefined ? present(before) : absent,
      after: after === undefined ? absent : present(after),
    });
  }
  return out;
}

async function nextOrdinal(ctx: MutationCtx, eventId: Id<'events'>) {
  const last = await ctx.db
    .query('changes')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .order('desc')
    .first();
  return last ? last.ordinal + 1 : 0;
}

async function scopedEvent(ctx: MutationCtx, scope: JournalScope) {
  const event = await ctx.db.get(scope.eventId);
  if (!event || event.campaignId !== scope.campaignId) throw new ConvexError('Event unavailable.');
  return event;
}

/**
 * Applies a patch and journals each changed leaf field. Nested plain objects are compared leaf by
 * leaf (path "live.stamina"); arrays are treated as one value. Unchanged fields produce no row.
 */
export async function journalPatch<T extends TableNames>(
  ctx: MutationCtx,
  scope: JournalScope,
  table: T,
  id: Id<T>,
  patch: Partial<DataModel[T]['document']>,
): Promise<number> {
  const event = await scopedEvent(ctx, scope);
  const current = await ctx.db.get(id);
  if (!current) throw new ConvexError(`Cannot patch a missing ${table} document.`);
  const changes = diffFields(current as Record<string, unknown>, patch as Record<string, unknown>);
  let ordinal = await nextOrdinal(ctx, scope.eventId);
  for (const change of changes) {
    await ctx.db.insert('changes', {
      campaignId: scope.campaignId,
      eventId: scope.eventId,
      commandId: event.commandId,
      commandKey: event.commandKey,
      ordinal: ordinal++,
      entityTable: table,
      entityId: id,
      ...change,
    });
  }
  if (changes.length) await ctx.db.patch(id, patch);
  return changes.length;
}

/** Inserts a document and journals its creation as one whole-document row (path ""). */
export async function journalInsert<T extends TableNames>(
  ctx: MutationCtx,
  scope: JournalScope,
  table: T,
  value: Omit<Doc<T>, '_id' | '_creationTime'>,
): Promise<Id<T>> {
  const event = await scopedEvent(ctx, scope);
  const id = await ctx.db.insert(table, value as never);
  await ctx.db.insert('changes', {
    campaignId: scope.campaignId,
    eventId: scope.eventId,
    commandId: event.commandId,
    commandKey: event.commandKey,
    ordinal: await nextOrdinal(ctx, scope.eventId),
    entityTable: table,
    entityId: id,
    path: '',
    before: absent,
    after: present(value),
  });
  return id;
}

/** Deletes a document and journals its full prior value as one whole-document row (path ""). */
export async function journalDelete<T extends TableNames>(
  ctx: MutationCtx,
  scope: JournalScope,
  table: T,
  id: Id<T>,
): Promise<void> {
  const event = await scopedEvent(ctx, scope);
  const current = await ctx.db.get(id);
  if (!current) throw new ConvexError(`Cannot delete a missing ${table} document.`);
  const { _id, _creationTime, ...value } = current as Record<string, unknown> & {
    _id: Id<T>;
    _creationTime: number;
  };
  void _id;
  void _creationTime;
  await ctx.db.insert('changes', {
    campaignId: scope.campaignId,
    eventId: scope.eventId,
    commandId: event.commandId,
    commandKey: event.commandKey,
    ordinal: await nextOrdinal(ctx, scope.eventId),
    entityTable: table,
    entityId: id,
    path: '',
    before: present(value),
    after: absent,
  });
  await ctx.db.delete(id);
}

/** The journal of one authenticated issuer’s undo unit in application order: (event sequence, ordinal). */
export async function commandJournal(
  ctx: { db: MutationCtx['db'] },
  campaignId: Id<'campaigns'>,
  commandId: string,
  issuerId: Id<'users'> | null,
) {
  const events = await ctx.db
    .query('events')
    .withIndex('by_campaign_command_key', q =>
      q.eq('campaignId', campaignId).eq('commandKey', commandKey(issuerId, commandId)),
    )
    .take(1000);
  events.sort((a, b) => a.sequence - b.sequence);
  const changes: Doc<'changes'>[] = [];
  for (const event of events) {
    changes.push(
      ...(await ctx.db
        .query('changes')
        .withIndex('by_event', q => q.eq('eventId', event._id))
        .take(1000)),
    );
  }
  return { events, changes };
}
