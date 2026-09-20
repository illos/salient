// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { ReadCtx } from './access';
import { requireMember } from './access';
import type { DerivedBaseline, EvaluationResult } from '../../shared/contracts/characterEvaluation';
import { makeStartingRewards, type StartingRewards } from '../../shared/contracts/startingRewards';

export const startingRewardsValidator = v.object({
  originRevisionId: v.id('characterRevisions'),
  initializedAt: v.number(),
  wealth: v.number(),
  renown: v.number(),
  projectPoints: v.number(),
  sources: v.object({
    wealth: v.array(v.string()),
    renown: v.array(v.string()),
    projectPoints: v.array(v.string()),
  }),
  items: v.array(
    v.object({
      id: v.string(),
      decisionId: v.string(),
      name: v.string(),
      sourcePath: v.string(),
      state: v.union(
        v.literal('possessed'),
        v.literal('broken'),
        v.literal('absent'),
        v.literal('pending-Director'),
      ),
      condition: v.optional(v.string()),
      projectSource: v.optional(v.string()),
    }),
  ),
});

/** The owner or the character's currently attached campaign Director; never ordinary peers. */
export async function requireStartingRewardsAccess(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
  userId: Id<'users'>,
): Promise<Doc<'characters'>> {
  const character = await ctx.db.get(characterId);
  if (!character) throw new ConvexError('Character unavailable.');
  if (character.ownerId === userId) return character;
  if (character.campaignId) {
    const campaign = await requireMember(ctx, character.campaignId, userId);
    if (campaign.ownerId === userId) return character;
  }
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
