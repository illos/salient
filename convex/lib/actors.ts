// SPDX-License-Identifier: GPL-3.0-only
/**
 * Actor binding, in its own leaf module so operation modules can bind actors without importing the
 * registry (which imports them): the registry ↔ combatOperations cycle left `operations` undefined
 * at load time in the deployed bundle. Owning specification:
 * docs/table-command-spec.md#identity-actor-and-targets (issuer versus acting character; the
 * Director may act for any character; names bind exactly and must be unique).
 */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { BoundActor, Reference } from '../../shared/commands/envelope';
import type { ReadCtx } from './access';

/** Who is calling, at which table, in which session, as whom (the registry's TableContext). */
export interface ActorContext {
  user: Doc<'users'>;
  campaign: Doc<'campaigns'>;
  role: 'director' | 'player' | 'observer';
}

/**
 * Resolves `@Character` to one live actor the caller may act for: the Director may act for any
 * character or foe at the table; a player only for characters they own. Names bind exactly and must
 * be unique; ambiguity is returned as an error naming the stable form, never resolved by first match.
 */
export async function bindActor(
  ctx: ReadCtx,
  context: ActorContext,
  reference: Reference,
): Promise<BoundActor> {
  if ('selector' in reference)
    throw new ConvexError('@self cannot be the actor: self resolves to the acting character.');
  const candidates: { actor: BoundActor; ownerId: Id<'users'> | null }[] = [];
  if ('refKind' in reference) {
    if (reference.refKind === 'character') {
      const id = ctx.db.normalizeId('characters', reference.id);
      const character = id ? await ctx.db.get(id) : null;
      if (character && character.campaignId === context.campaign._id)
        candidates.push({
          actor: { kind: 'character', id: character._id, name: character.authored.name },
          ownerId: character.ownerId,
        });
    } else if (reference.refKind === 'foe') {
      const id = ctx.db.normalizeId('foes', reference.id);
      const foe = id ? await ctx.db.get(id) : null;
      if (foe && foe.campaignId === context.campaign._id)
        candidates.push({ actor: { kind: 'foe', id: foe._id, name: foe.name }, ownerId: null });
    } else
      throw new ConvexError(
        `Unknown actor reference kind "${reference.refKind}"; use @{character:id} or @{foe:id}.`,
      );
    if (!candidates.length) throw new ConvexError('That actor is not at this table.');
  } else {
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
      .take(200);
    for (const character of characters)
      if (character.authored.name === reference.name)
        candidates.push({
          actor: { kind: 'character', id: character._id, name: character.authored.name },
          ownerId: character.ownerId,
        });
    const foes = await ctx.db
      .query('foes')
      .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
      .take(200);
    for (const foe of foes)
      if (foe.name === reference.name)
        candidates.push({ actor: { kind: 'foe', id: foe._id, name: foe.name }, ownerId: null });
    if (!candidates.length)
      throw new ConvexError(`No character or foe named "${reference.name}" is at this table.`);
    if (candidates.length > 1)
      throw new ConvexError(
        `Several actors are named "${reference.name}"; choose one with @{character:id} or @{foe:id}.`,
      );
  }
  const [candidate] = candidates;
  if (context.role !== 'director' && candidate!.ownerId !== context.user._id)
    throw new ConvexError(`You do not control ${candidate!.actor.name}.`);
  return candidate!.actor;
}
