// SPDX-License-Identifier: GPL-3.0-only
/**
 * A02 admission and review operations, registered in convex/lib/registry.ts and reachable from
 * the character page, the palette, slash text and headless callers alike:
 *
 * - `/character submit`: the owner submits the current complete draft revision to this campaign
 *   for Director review (first admission or full edit). The owning active Director's submission is
 *   applied and logged without approval.
 * - `/character withdraw`: the owner withdraws an undecided submission.
 * - `/character approve` and `/character decline`: the Director decides the exact submitted
 *   revision; approval activates it only if it is still the owner's latest saved revision and the
 *   character is not combat-locked.
 *
 * Owning specifications: docs/character-wizard-spec.md#4-wizard-flows (Director-owned path),
 * #6-ownership-attachment-and-permissions, #7-revision-and-review-lifecycle,
 * docs/accounts-and-access-spec.md#characters, docs/live-state-initialization.md (first admission
 * initializes live state), docs/table-spec.md#character-sheet-lock-during-encounters.
 * Every accepted operation appends an ordered attributed event; nothing here resolves a rule.
 */
import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { OperationDefinition, TableContext } from './registry';
import { activateRevision, pendingReview, requireEditable } from './characterBuild';
import { journalPatch } from './journal';

const characterArg = v.object({ refKind: v.literal('character'), id: v.string() });
const characterArgDescription = 'The character, as @{character:id}.';

async function loadCharacter(ctx: MutationCtx, reference: unknown): Promise<Doc<'characters'>> {
  const id = ctx.db.normalizeId('characters', (reference as { id: string }).id);
  const character = id ? await ctx.db.get(id) : null;
  if (!character) throw new ConvexError('Character unavailable.');
  return character;
}

function requireOwner(character: Doc<'characters'>, context: TableContext) {
  if (character.ownerId !== context.user._id)
    throw new ConvexError('Only the character owner can do this.');
}

async function requirePending(
  ctx: MutationCtx,
  character: Doc<'characters'>,
  campaignId: Id<'campaigns'>,
) {
  const review = await pendingReview(ctx, character._id);
  if (!review || review.campaignId !== campaignId)
    throw new ConvexError(`${character.authored.name} has no submission awaiting review here.`);
  return review;
}

function activationKind(firstAdmission: boolean) {
  return firstAdmission ? 'character.admitted' : 'character.build-activated';
}

const submit: OperationDefinition = {
  id: 'character.submit',
  family: 'character',
  verb: 'submit',
  title: 'Submit a character for review',
  description:
    'Submit your character’s current complete build to this campaign: first admission, or a full edit of an attached character. The Director approves the exact revision; an owning active Director’s submission is applied and logged without approval.',
  args: { character: characterArg },
  argDescriptions: { character: characterArgDescription },
  roles: ['director', 'player', 'observer'],
  session: 'none',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const character = await loadCharacter(ctx, args.character);
    requireOwner(character, context);
    if (character.campaignId && character.campaignId !== context.campaign._id)
      throw new ConvexError(
        `${character.authored.name} is attached to another campaign; a character attaches to one campaign at a time.`,
      );
    await requireEditable(ctx, character);
    const draft = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
    if (!draft) throw new ConvexError('This character has no saved build to submit.');
    if (draft.status !== 'complete')
      throw new ConvexError(
        `The saved build is ${draft.status}; resolve its diagnostics in the wizard before submitting.`,
      );
    if (character.campaignId && character.effectiveRevisionId === draft._id)
      throw new ConvexError(
        `Revision ${draft.revision} is already the effective build; save a change before submitting.`,
      );
    if (character.staleFullEditRevisionId === draft._id)
      throw new ConvexError(
        'This full-edit draft predates the effective build. Reconcile and save it against the current build before submitting.',
      );
    if (
      draft._id !== character.effectiveRevisionId &&
      draft.baseEffectiveRevisionId !== undefined &&
      draft.baseEffectiveRevisionId !== character.effectiveRevisionId
    )
      throw new ConvexError(
        'This full-edit draft predates the effective build. Reconcile and save it against the current build before submitting.',
      );
    if (await pendingReview(ctx, character._id))
      throw new ConvexError(
        `${character.authored.name} already has a submission awaiting review; withdraw it first.`,
      );
    const kind = character.campaignId ? 'full-edit' : 'admission';
    const now = Date.now();
    const base = {
      characterId: character._id,
      campaignId: context.campaign._id,
      ownerId: character.ownerId,
      revisionId: draft._id,
      revision: draft.revision,
      kind,
      submittedAt: now,
    } as const;
    if (context.role === 'director') {
      // The owning active Director's own admission or full edit: logged, not reviewed.
      const before = character.effectiveRevisionId;
      const result = await activateRevision(ctx, character, draft, context.campaign._id, now);
      const reviewId = await ctx.db.insert('characterReviews', {
        ...base,
        status: 'logged',
        decidedAt: now,
        decidedById: context.user._id,
      });
      return {
        kind: activationKind(result.firstAdmission),
        description: `${character.authored.name} ${result.firstAdmission ? 'admitted' : 'build updated'} (revision ${draft.revision}) by its owning Director; logged without approval.`,
        data: {
          characterId: character._id,
          reviewId,
          kind,
          review: 'logged',
          revisionBefore: before,
          revisionAfter: draft._id,
          revision: draft.revision,
          firstAdmission: result.firstAdmission,
          reconciliation: result.reconciliation,
        },
      };
    }
    const reviewId = await ctx.db.insert('characterReviews', {
      ...base,
      status: 'pending',
      decidedAt: null,
      decidedById: null,
    });
    return {
      kind: 'character.submitted',
      description: `${character.authored.name} (revision ${draft.revision}) submitted for ${kind === 'admission' ? 'admission' : 'full-edit review'}; the effective build is unchanged until the Director approves.`,
      data: {
        characterId: character._id,
        reviewId,
        kind,
        revisionId: draft._id,
        revision: draft.revision,
      },
    };
  },
};

const withdraw: OperationDefinition = {
  id: 'character.withdraw',
  family: 'character',
  verb: 'withdraw',
  title: 'Withdraw a submission',
  description: 'Withdraw your character’s undecided submission. The effective build is unchanged.',
  args: { character: characterArg },
  argDescriptions: { character: characterArgDescription },
  roles: ['director', 'player', 'observer'],
  session: 'none',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const character = await loadCharacter(ctx, args.character);
    requireOwner(character, context);
    const review = await requirePending(ctx, character, context.campaign._id);
    await ctx.db.patch(review._id, {
      status: 'withdrawn',
      decidedAt: Date.now(),
      decidedById: context.user._id,
    });
    return {
      kind: 'character.withdrawn',
      description: `${character.authored.name}'s ${review.kind === 'admission' ? 'admission' : 'full-edit'} submission (revision ${review.revision}) withdrawn by its owner.`,
      data: {
        characterId: character._id,
        reviewId: review._id,
        kind: review.kind,
        revision: review.revision,
      },
    };
  },
};

const approve: OperationDefinition = {
  id: 'character.approve',
  family: 'character',
  verb: 'approve',
  title: 'Approve a submitted build',
  description:
    'Approve the exact submitted revision. First admission attaches the character and initializes its live values from the build; a later approval replaces the effective build, retains compatible current amounts and caps them at new maxima.',
  args: { character: characterArg },
  argDescriptions: { character: characterArgDescription },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const character = await loadCharacter(ctx, args.character);
    const review = await requirePending(ctx, character, context.campaign._id);
    if (character.draftRevisionId !== review.revisionId) {
      await ctx.db.patch(review._id, { status: 'stale' });
      throw new ConvexError(
        `The submitted revision ${review.revision} was edited after submission; the owner must resubmit the current build.`,
      );
    }
    if (character.campaignId && character.campaignId !== context.campaign._id)
      throw new ConvexError(`${character.authored.name} is attached to another campaign.`);
    await requireEditable(ctx, character);
    const revision = await ctx.db.get(review.revisionId);
    if (!revision) throw new ConvexError('Submitted revision unavailable.');
    if (
      revision._id !== character.effectiveRevisionId &&
      revision.baseEffectiveRevisionId !== undefined &&
      revision.baseEffectiveRevisionId !== character.effectiveRevisionId
    )
      throw new ConvexError(
        'The effective build changed after this proposal was prepared. The owner must reconcile and resubmit.',
      );
    const before = character.effectiveRevisionId;
    const now = Date.now();
    const result = await activateRevision(ctx, character, revision, context.campaign._id, now);
    await ctx.db.patch(review._id, {
      status: 'approved',
      decidedAt: now,
      decidedById: context.user._id,
    });
    return {
      kind: activationKind(result.firstAdmission),
      description: `${character.authored.name} ${result.firstAdmission ? 'admitted' : 'build updated'}: the Director approved revision ${review.revision}.${result.reconciliation.changes.some(change => change.currentAfter !== change.currentBefore) ? ' Current values keep the damage taken and Recoveries spent.' : ''}`,
      data: {
        characterId: character._id,
        reviewId: review._id,
        kind: review.kind,
        review: 'approved',
        revisionBefore: before,
        revisionAfter: revision._id,
        revision: review.revision,
        firstAdmission: result.firstAdmission,
        reconciliation: result.reconciliation,
      },
    };
  },
};

const decline: OperationDefinition = {
  id: 'character.decline',
  family: 'character',
  verb: 'decline',
  title: 'Decline a submitted build',
  description: 'Decline the submitted revision. The effective build, if any, is unchanged.',
  args: { character: characterArg },
  argDescriptions: { character: characterArgDescription },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const character = await loadCharacter(ctx, args.character);
    const review = await requirePending(ctx, character, context.campaign._id);
    await ctx.db.patch(review._id, {
      status: 'declined',
      decidedAt: Date.now(),
      decidedById: context.user._id,
    });
    return {
      kind: 'character.declined',
      description: `${character.authored.name}'s ${review.kind === 'admission' ? 'admission' : 'full-edit'} submission (revision ${review.revision}) declined by the Director.`,
      data: {
        characterId: character._id,
        reviewId: review._id,
        kind: review.kind,
        revision: review.revision,
      },
    };
  },
};

/**
 * V163 `/character grant-level-up`: the Director's manual grant (docs/character-wizard-spec.md#level-up,
 * "Manual Director grant"; the rules' Director Says So advancement in chapter/making-a-hero.md,
 * Alternative Advancement). Each chosen hero, the whole attached party by default, gains one pending
 * level-up that its owner takes later through the level-up flow. Nothing waits for it. V191 (user
 * ruling 2026-09-25, XP bank): a manual grant does not touch the XP bank; later Respite Completes
 * still turn banked XP into level-ups.
 */
const grantLevelUp: OperationDefinition = {
  id: 'character.grant-level-up',
  family: 'character',
  verb: 'grant-level-up',
  title: 'Grant a level-up',
  description:
    'Director: grant one pending level-up to chosen heroes (default: every hero attached to this campaign). Each owner takes it later from the character sheet, one level at a time. The XP bank is not changed.',
  args: { characters: v.optional(v.array(characterArg)) },
  argDescriptions: {
    characters: 'Heroes to grant a level-up, as @{character:id}; omit for every attached hero.',
  },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const chosen = args.characters as unknown[] | undefined;
    const heroes = chosen?.length
      ? await Promise.all(chosen.map(reference => loadCharacter(ctx, reference)))
      : await ctx.db
          .query('characters')
          .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
          .collect();
    if (new Set(heroes.map(hero => hero._id)).size !== heroes.length)
      throw new ConvexError('Name each hero once.');
    for (const hero of heroes)
      if (hero.campaignId !== context.campaign._id || !hero.liveState)
        throw new ConvexError(`${hero.authored.name} is not an admitted hero in this campaign.`);
    if (!heroes.length) throw new ConvexError('No hero is attached to this campaign.');
    const names = heroes.map(hero => hero.authored.name).join(', ');
    return {
      kind: 'character.level-up-granted',
      description: `The Director granted a level-up to ${names}.`,
      data: {
        characters: heroes.map(hero => ({
          characterId: hero._id,
          pendingLevelUpsBefore: hero.pendingLevelUps ?? 0,
          pendingLevelUpsAfter: (hero.pendingLevelUps ?? 0) + 1,
        })),
      },
      commit: async (mctx, scope) => {
        for (const hero of heroes)
          await journalPatch(
            mctx,
            scope,
            'characters',
            hero._id,
            { pendingLevelUps: (hero.pendingLevelUps ?? 0) + 1 },
            hero,
          );
      },
    };
  },
};

/**
 * V163 `/character withdraw-level-up`: the Director's correction for a mistaken grant. Removes one
 * pending (not yet taken) level-up from each chosen hero; a level already taken is not affected.
 * V191 (user ruling 2026-09-25, XP bank): a withdrawal is final. The XP that bought the level is not
 * refunded to the bank, and no later Respite Complete grants it again.
 */
const withdrawLevelUp: OperationDefinition = {
  id: 'character.withdraw-level-up',
  family: 'character',
  verb: 'withdraw-level-up',
  title: 'Withdraw a pending level-up',
  description:
    'Director: remove one granted level-up that has not been taken yet from each chosen hero, to correct a mistaken grant. Levels already taken and the XP bank are unchanged. The withdrawal is final: the XP is not refunded and the level is not granted again.',
  args: { characters: v.array(characterArg) },
  argDescriptions: {
    characters: 'Heroes to withdraw a pending level-up from, as @{character:id}.',
  },
  roles: ['director'],
  session: 'none',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    const heroes = await Promise.all(
      (args.characters as unknown[]).map(reference => loadCharacter(ctx, reference)),
    );
    if (!heroes.length) throw new ConvexError('Name at least one hero.');
    if (new Set(heroes.map(hero => hero._id)).size !== heroes.length)
      throw new ConvexError('Name each hero once.');
    for (const hero of heroes) {
      if (hero.campaignId !== context.campaign._id || !hero.liveState)
        throw new ConvexError(`${hero.authored.name} is not an admitted hero in this campaign.`);
      if ((hero.pendingLevelUps ?? 0) < 1)
        throw new ConvexError(`${hero.authored.name} has no pending level-up to withdraw.`);
    }
    return {
      kind: 'character.level-up-withdrawn',
      description: `The Director withdrew a pending level-up from ${heroes.map(hero => hero.authored.name).join(', ')}.`,
      data: {
        characters: heroes.map(hero => ({
          characterId: hero._id,
          pendingLevelUpsBefore: hero.pendingLevelUps ?? 0,
          pendingLevelUpsAfter: (hero.pendingLevelUps ?? 0) - 1,
        })),
      },
      commit: async (mctx, scope) => {
        for (const hero of heroes)
          await journalPatch(
            mctx,
            scope,
            'characters',
            hero._id,
            { pendingLevelUps: (hero.pendingLevelUps ?? 0) - 1 },
            hero,
          );
      },
    };
  },
};

export const characterOperations: OperationDefinition[] = [
  submit,
  withdraw,
  approve,
  decline,
  grantLevelUp,
  withdrawLevelUp,
];
