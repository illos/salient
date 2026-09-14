// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { ReadCtx } from './access';

export const GOBLIN_WARRIOR_ID = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

/** Keep the complete pinned source independent from the instance's changing play values. */
export function snapshotOf(entry: Doc<'content'>): string {
  return JSON.stringify({
    id: entry.contentId,
    name: entry.name,
    sourcePath: entry.sourcePath,
    revision: entry.revision,
    text: entry.text,
    structured: entry.structured,
    ...(entry.jsonPath === undefined ? {} : { jsonPath: entry.jsonPath }),
    ...(entry.features === undefined ? {} : { features: entry.features }),
  });
}

export function printedStamina(entry: Doc<'content'>): number {
  const printed: unknown = (entry.structured as Record<string, unknown> | null)?.stamina;
  if (typeof printed !== 'string' || !/^\d+$/.test(printed))
    throw new ConvexError(
      `${entry.name}: printed Stamina "${String(printed)}" is not a whole number.`,
    );
  return Number(printed);
}

export async function settings(ctx: ReadCtx, campaignId: Id<'campaigns'>) {
  return ctx.db
    .query('foeSettings')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .unique();
}

export async function requireNotPaused(ctx: ReadCtx, campaign: Doc<'campaigns'>) {
  const session = campaign.activeSessionId ? await ctx.db.get(campaign.activeSessionId) : null;
  if (session?.status === 'paused')
    throw new ConvexError(
      'The session is paused; the foes roster waits until the Director resumes it.',
    );
}

export async function scopedFoe(ctx: ReadCtx, campaignId: Id<'campaigns'>, foeId: Id<'foes'>) {
  const foe = await ctx.db.get(foeId);
  if (!foe || foe.campaignId !== campaignId) throw new ConvexError('Foe unavailable.');
  return foe;
}
