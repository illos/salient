// SPDX-License-Identifier: GPL-3.0-only
/** Campaign activation requires the source's Director choice, independently of owner inputs. */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { ReadCtx } from './access';
import {
  COMPLICATION_ITEM_SOURCES,
  SECOND_ECHELON_TRINKETS,
} from '../../shared/content/supporting-complications';

export function needsPrivateInheritance(
  revision: Pick<Doc<'characterRevisions'>, 'selections'>,
): boolean {
  return revision.selections.some(
    selection =>
      selection.decisionId === 'complication.choice' && selection.value === 'Strange Inheritance',
  );
}

/** Public readiness text contains no secret identity. A saved choice survives later revisions. */
export async function pendingDirectorSetup(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
  revision: Pick<Doc<'characterRevisions'>, 'selections'>,
  campaignId: Id<'campaigns'> | null,
): Promise<string | null> {
  if (!needsPrivateInheritance(revision)) return null;
  if (!campaignId)
    return 'Strange Inheritance awaits private setup by the destination campaign Director before activation. Completed owner choices can be submitted for that setup.';
  const saved = await ctx.db
    .query('characterSecrets')
    .withIndex('by_character_campaign', q =>
      q.eq('characterId', characterId).eq('campaignId', campaignId),
    )
    .unique();
  if (
    saved &&
    SECOND_ECHELON_TRINKETS.includes(saved.itemName) &&
    COMPLICATION_ITEM_SOURCES[saved.itemName] === saved.itemSourcePath
  ) {
    const origin = await ctx.db.get(saved.basedOnRevisionId);
    if (origin?.characterId === characterId && needsPrivateInheritance(origin)) return null;
  }
  return 'The campaign Director must privately choose the Strange Inheritance trinket before this build can be activated.';
}

export async function requireDirectorSetup(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
  revision: Pick<Doc<'characterRevisions'>, 'selections'>,
  campaignId: Id<'campaigns'>,
): Promise<void> {
  const pending = await pendingDirectorSetup(ctx, characterId, revision, campaignId);
  if (pending) throw new ConvexError(pending);
}
