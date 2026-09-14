// SPDX-License-Identifier: GPL-3.0-only
// Reads of the session's encounter record and the combat locks. Owning specification:
// docs/data-architecture-spec.md#5-encounter-actions-and-undo ("Director OK commits encounter setup,
// takes the precombat restoration snapshot and applies combat locks") and
// docs/table-spec.md#character-sheet-lock-during-encounters (a character in an encounter is locked
// against editing until the encounter ends or is voided; pausing retains it; owner and Director alike).
import { ConvexError } from 'convex/values';
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

/** The campaign's committed encounter through its active session, or null. */
export async function committedEncounter(ctx: ReadCtx, campaign: Doc<'campaigns'>) {
  const session = campaign.activeSessionId ? await ctx.db.get(campaign.activeSessionId) : null;
  if (!session) return null;
  const encounter = await currentEncounter(ctx, session);
  return encounter?.status === 'committed' ? encounter : null;
}

/**
 * Whether the character is combat-locked: bound to the encounter at OK (`combatLocked`), or a
 * participant (turn entry) of the campaign's committed encounter. Characters not in the encounter
 * keep their normal workflows. A02's edit, draft, level-up, restoration and activation operations
 * call this before writing.
 */
export async function characterCombatLocked(
  ctx: ReadCtx,
  character: Doc<'characters'>,
): Promise<boolean> {
  if (character.combatLocked) return true;
  if (!character.campaignId) return false;
  const campaign = await ctx.db.get(character.campaignId);
  const encounter = campaign ? await committedEncounter(ctx, campaign) : null;
  if (!encounter) return false;
  const entries = await ctx.db
    .query('turnEntries')
    .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
    .take(500);
  return entries.some(
    entry => entry.actor.kind === 'character' && entry.actor.id === character._id,
  );
}

/** Throws the specified lock message when the character is in a committed encounter. */
export async function requireCharacterEditable(
  ctx: ReadCtx,
  character: Doc<'characters'>,
): Promise<void> {
  if (await characterCombatLocked(ctx, character))
    throw new ConvexError('Character editing is locked during combat.');
}
