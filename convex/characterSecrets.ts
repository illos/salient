// SPDX-License-Identifier: GPL-3.0-only
/** Strange Inheritance's source-selected identity stays separate from every public build snapshot. */
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser, type ReadCtx } from './lib/access';
import { pendingReview } from './lib/characterBuild';
import { command } from './lib/commands';
import {
  COMPLICATION_ITEM_SOURCES,
  SECOND_ECHELON_TRINKETS,
} from '../shared/content/supporting-complications';

type BuildView = 'effective' | 'proposed' | 'draft';
const viewValidator = v.union(v.literal('effective'), v.literal('proposed'), v.literal('draft'));

async function directorContext(
  ctx: ReadCtx,
  characterId: Id<'characters'>,
  userId: Id<'users'>,
  requestedView?: BuildView,
  requestedCampaignId?: Id<'campaigns'>,
) {
  const character = await ctx.db.get(characterId);
  if (!character) return null;
  const pending = await pendingReview(ctx, characterId);
  if (
    requestedView === 'draft' &&
    (!requestedCampaignId ||
      character.ownerId !== userId ||
      (character.campaignId && character.campaignId !== requestedCampaignId) ||
      (pending && pending.campaignId !== requestedCampaignId))
  )
    return null;
  const campaignId =
    requestedView === 'draft' ? requestedCampaignId : (character.campaignId ?? pending?.campaignId);
  if (!campaignId) return null;
  if (requestedCampaignId && campaignId !== requestedCampaignId) return null;
  const campaign = await ctx.db.get(campaignId);
  if (!campaign || campaign.ownerId !== userId) return null;
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_campaign_user', q => q.eq('campaignId', campaignId).eq('userId', userId))
    .unique();
  if (!membership) return null;
  // Match the public sheet's default; an effective sheet never silently targets a proposal.
  const view = requestedView ?? (character.effectiveRevisionId ? 'effective' : 'proposed');
  const id =
    view === 'draft'
      ? character.draftRevisionId
      : view === 'effective'
        ? character.effectiveRevisionId
        : pending?.campaignId === campaignId && pending.revisionId === character.draftRevisionId
          ? pending.revisionId
          : null;
  if (!id) return null;
  const revision = await ctx.db.get(id);
  if (
    revision?.characterId === characterId &&
    revision.selections.some(
      selection =>
        selection.decisionId === 'complication.choice' && selection.value === 'Strange Inheritance',
    )
  )
    return { character, campaignId, revision, view };
  return null;
}

const itemValidator = v.object({ name: v.string(), sourcePath: v.string(), updatedAt: v.number() });
export const inheritance = query({
  args: {
    characterId: v.id('characters'),
    view: v.optional(viewValidator),
    displayedRevision: v.optional(v.number()),
    campaignId: v.optional(v.id('campaigns')),
  },
  returns: v.union(
    v.null(),
    v.object({
      campaignId: v.id('campaigns'),
      characterRevision: v.number(),
      buildRevisionId: v.id('characterRevisions'),
      buildRevision: v.number(),
      view: viewValidator,
      version: v.number(),
      combatLocked: v.boolean(),
      item: v.union(itemValidator, v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await directorContext(
      ctx,
      args.characterId,
      user._id,
      args.view,
      args.campaignId,
    );
    if (!context) return null;
    if (
      args.displayedRevision !== undefined &&
      context.revision.revision !== args.displayedRevision
    )
      return null;
    const saved = await ctx.db
      .query('characterSecrets')
      .withIndex('by_character_campaign', q =>
        q.eq('characterId', args.characterId).eq('campaignId', context.campaignId),
      )
      .unique();
    return {
      campaignId: context.campaignId,
      characterRevision: context.character.revision,
      buildRevisionId: context.revision._id,
      buildRevision: context.revision.revision,
      view: context.view,
      version: saved?.version ?? 0,
      combatLocked: context.character.combatLocked,
      item: saved
        ? { name: saved.itemName, sourcePath: saved.itemSourcePath, updatedAt: saved.updatedAt }
        : null,
    };
  },
});

export const saveInheritance = mutation({
  args: {
    characterId: v.id('characters'),
    commandId: v.string(),
    itemName: v.string(),
    expectedCampaignId: v.id('campaigns'),
    expectedCharacterRevision: v.number(),
    expectedBuildRevisionId: v.id('characterRevisions'),
    expectedVersion: v.number(),
    expectedView: v.optional(viewValidator),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const context = await directorContext(
      ctx,
      args.characterId,
      user._id,
      args.expectedView,
      args.expectedView === 'draft' ? args.expectedCampaignId : undefined,
    );
    if (!context)
      throw new ConvexError(
        'Only this character’s campaign Director can record the private inheritance.',
      );
    if (context.campaignId !== args.expectedCampaignId)
      throw new ConvexError(
        'The character’s campaign changed. Reload before choosing its inheritance.',
      );
    const receipt = await command(
      ctx,
      user._id,
      args.commandId,
      'characterSecrets.saveInheritance',
      args,
    );
    if (receipt.previous) return Number(receipt.previous.result);
    if (context.character.combatLocked)
      throw new ConvexError('Character choices are locked during combat.');
    if (
      context.character.revision !== args.expectedCharacterRevision ||
      context.revision._id !== args.expectedBuildRevisionId
    )
      throw new ConvexError(
        'The character build changed. Reload before recording its inheritance.',
      );
    const sourcePath = COMPLICATION_ITEM_SOURCES[args.itemName];
    if (!SECOND_ECHELON_TRINKETS.includes(args.itemName) || !sourcePath)
      throw new ConvexError('Choose one source-listed second-echelon trinket.');
    const saved = await ctx.db
      .query('characterSecrets')
      .withIndex('by_character_campaign', q =>
        q.eq('characterId', args.characterId).eq('campaignId', context.campaignId),
      )
      .unique();
    if ((saved?.version ?? 0) !== args.expectedVersion)
      throw new ConvexError('The private selection changed. Reload before saving.');
    const version = (saved?.version ?? 0) + 1;
    const fields = {
      characterId: args.characterId,
      campaignId: context.campaignId,
      itemName: args.itemName,
      itemSourcePath: sourcePath,
      version,
      basedOnRevisionId: context.revision._id,
      updatedById: user._id,
      updatedAt: Date.now(),
    };
    if (saved) await ctx.db.patch(saved._id, fields);
    else await ctx.db.insert('characterSecrets', fields);
    // Receipts are issuer-private; no item identity is appended to the public game log.
    await receipt.save(String(version));
    return version;
  },
});
