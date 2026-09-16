// SPDX-License-Identifier: GPL-3.0-only
/** V32 progression boundaries: immutable saved builds, scoped choices and private history reads. */
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { ReadCtx } from './access';
import { baselineOf, pendingReview } from './characterBuild';
import { getDefinitions } from '../../shared/content/character-decisions';
import { isJsonValue, type DraftSelection } from '../../shared/characterDraft';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { selectionsFrom } from '../../shared/evaluate/character';

export function revisionLevel(revision: Doc<'characterRevisions'>): number {
  return revision.level ?? baselineOf(revision.derivedBaseline)?.level.value ?? 1;
}
export function advancementDecisionIds(): string[] {
  const oldIds = new Set(getDefinitions(1).steps.flatMap(step => step.decisions.map(d => d.id)));
  return getDefinitions(2).steps.flatMap(step =>
    step.decisions.filter(d => !oldIds.has(d.id)).map(d => d.id),
  );
}
export function advancementSelections(input: DraftSelection[]): DraftSelection[] {
  const allowed = new Set(advancementDecisionIds());
  if (
    input.length > 20 ||
    JSON.stringify(input).length > 16000 ||
    input.some(s => !allowed.has(s.decisionId) || !isJsonValue(s.value))
  )
    throw new ConvexError(
      'Level-up accepts only the new level-two decisions; earlier choices must remain unchanged.',
    );
  if (new Set(input.map(s => s.decisionId)).size !== input.length)
    throw new ConvexError('A level-up decision may appear only once.');
  return draftSelectionsFrom(selectionsFrom(input), getDefinitions(2));
}
export async function progressionBase(ctx: ReadCtx, character: Doc<'characters'>) {
  const id = character.effectiveRevisionId ?? character.draftRevisionId;
  return id ? await ctx.db.get(id) : null;
}
export function progressionEligibility(
  character: Doc<'characters'>,
  base: Doc<'characterRevisions'> | null,
) {
  const xp = character.liveState?.xp ?? 0;
  const offset = character.entryLevelXpOffset ?? 0;
  const baseline = base ? baselineOf(base.derivedBaseline) : null;
  const reason =
    !character.campaignId || !character.liveState
      ? 'Scoped advancement currently requires a campaign-attached character with recorded campaign XP.'
      : !base ||
          base.status !== 'complete' ||
          revisionLevel(base) !== 1 ||
          baseline?.class.value !== 'Fury'
        ? 'This slice supports a complete level-one Fury advancing to level two.'
        : character.combatLocked
          ? 'Character progression is locked during combat.'
          : xp + offset < 16
            ? 'Level two requires 16 cumulative XP.'
            : null;
  return { xp, entryLevelXpOffset: offset, requiredXp: 16, eligible: reason === null, reason };
}
export function requireProgressionBase(
  character: Doc<'characters'>,
  base: Doc<'characterRevisions'> | null,
  expectedRevision: number,
  expectedBaseRevisionId: Id<'characterRevisions'>,
) {
  if (character.revision !== expectedRevision || !base || base._id !== expectedBaseRevisionId)
    throw new ConvexError(
      'This character or effective build changed. Reload before continuing progression.',
    );
  return base;
}
/** Directors have full build-history access while attached or reviewing admission; peers do not. */
export async function requireHistoryReader(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
  userId: Id<'users'>,
) {
  const character = await ctx.db.get(characterId);
  if (!character) throw new ConvexError('Character unavailable.');
  if (character.ownerId === userId) return character;
  const pending = await pendingReview(ctx, characterId);
  const campaignId = character.campaignId ?? pending?.campaignId;
  const campaign = campaignId ? await ctx.db.get(campaignId) : null;
  if (!campaign || campaign.ownerId !== userId)
    throw new ConvexError('Character history unavailable.');
  return character;
}
export function historyEntry(character: Doc<'characters'>, revision: Doc<'characterRevisions'>) {
  return {
    id: revision._id,
    revision: revision.revision,
    level: revisionLevel(revision),
    kind: revision.kind ?? (revision.parentRevisionId ? 'full-edit' : 'creation'),
    status: revision.status,
    createdAt: revision._creationTime,
    parentRevisionId: revision.parentRevisionId,
    restoredFromRevisionId: revision.restoredFromRevisionId ?? null,
    isEffective: character.effectiveRevisionId === revision._id,
    isDraft: character.draftRevisionId === revision._id,
  };
}
