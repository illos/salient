// SPDX-License-Identifier: GPL-3.0-only
// Reads of the session's encounter record. Owning specification:
// docs/data-architecture-spec.md#5-encounter-actions-and-undo ("Director OK commits encounter setup,
// takes the precombat restoration snapshot and applies combat locks").
import type { Doc } from '../_generated/dataModel';
import type { ReadCtx } from './access';

/** The session's current encounter run, or null. Archived encounters are never current. */
export async function currentEncounter(ctx: ReadCtx, session: Doc<'sessions'>) {
  if (!session.encounterId) return null;
  const encounter = await ctx.db.get(session.encounterId);
  return encounter && encounter.archivedAt === null ? encounter : null;
}

/** Combat locks (party roster, character edits, closure) apply once setup is committed, not for a draft. */
export async function combatActive(ctx: ReadCtx, session: Doc<'sessions'>): Promise<boolean> {
  return (await currentEncounter(ctx, session))?.status === 'committed';
}
