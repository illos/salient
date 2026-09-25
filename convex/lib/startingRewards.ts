// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { ReadCtx } from './access';
import type { DerivedBaseline, EvaluationResult } from '../../shared/contracts/characterEvaluation';
import { makeStartingRewards, type StartingRewards } from '../../shared/contracts/startingRewards';

/**
 * The owner or the character's currently attached campaign Director; never ordinary peers, and
 * never the Director of a campaign the character is only pending admission to
 * (docs/inventory-spec.md, docs/accounts-and-access-spec.md). Does not throw.
 */
export async function canReadStartingRewards(
  ctx: ReadCtx,
  character: Doc<'characters'>,
  userId: Id<'users'>,
): Promise<boolean> {
  if (character.ownerId === userId) return true;
  if (!character.campaignId) return false;
  const campaign = await ctx.db.get(character.campaignId);
  if (!campaign || campaign.ownerId !== userId) return false;
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_campaign_user', q => q.eq('campaignId', campaign._id).eq('userId', userId))
    .unique();
  return membership !== null;
}

/** canReadStartingRewards, throwing for everyone else. */
export async function requireStartingRewardsAccess(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
  userId: Id<'users'>,
): Promise<Doc<'characters'>> {
  const character = await ctx.db.get(characterId);
  if (!character) throw new ConvexError('Character unavailable.');
  if (await canReadStartingRewards(ctx, character, userId)) return character;
  throw new ConvexError(
    'Only the character owner or its campaign Director can access starting rewards.',
  );
}

type StartingRewardsResult =
  | { rewards: StartingRewards<Id<'characterRevisions'>>; initializationBlocked: null }
  | { rewards: null; initializationBlocked: string };

/**
 * Read-only preparation for an explicit legacy initialization. The origin revision, not a
 * reevaluated draft/current career, is authoritative. A missing source blocks this one character.
 */
export async function startingRewardsFromOrigin(
  ctx: ReadCtx,
  character: Doc<'characters'>,
  initializedAt: number,
): Promise<StartingRewardsResult> {
  if (character.startingRewards)
    return { rewards: character.startingRewards, initializationBlocked: null };
  if (!character.liveState)
    return {
      rewards: null,
      initializationBlocked: 'Starting rewards are granted at first campaign admission.',
    };
  const originId = character.liveState.origin.buildRevisionId;
  const revision = await ctx.db.get(originId);
  if (!revision || revision.characterId !== character._id)
    return {
      rewards: null,
      initializationBlocked:
        'The original admission revision is unavailable. Starting rewards cannot be reconstructed from the current build.',
    };
  const evaluation = revision.evaluation as EvaluationResult | undefined;
  const baseline = (revision.derivedBaseline ?? evaluation?.baseline) as DerivedBaseline | null;
  if (
    revision.status !== 'complete' ||
    !baseline ||
    !Number.isFinite(baseline.wealth?.value) ||
    !Number.isFinite(baseline.renown?.value) ||
    (baseline.projectPoints !== undefined && !Number.isFinite(baseline.projectPoints.value))
  )
    return {
      rewards: null,
      initializationBlocked:
        'The original admission revision has no complete saved reward evaluation.',
    };
  return {
    rewards: makeStartingRewards(baseline, originId, initializedAt),
    initializationBlocked: null,
  };
}
