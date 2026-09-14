// SPDX-License-Identifier: GPL-3.0-only
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser, type ReadCtx } from './lib/access';
import { command } from './lib/commands';
import {
  authoredValidator,
  heroLiveValidator,
  revisionStatusValidator,
  selectionValidator,
} from './characterTables';
import { isJsonValue, type CharacterAuthored } from '../shared/characterDraft';
import { requireCharacterEditable } from './lib/encounters';
import { evaluateSelections } from './lib/characterBuild';

async function owned(ctx: ReadCtx, id: Id<'characters'>, userId: Id<'users'>) {
  const character = await ctx.db.get(id);
  if (!character || character.ownerId !== userId) throw new ConvexError('Character unavailable.');
  return character;
}
async function requireEditable(ctx: ReadCtx, character: Doc<'characters'>) {
  // A04: the lock is per participating character (docs/table-spec.md#character-sheet-lock-during-encounters).
  await requireCharacterEditable(ctx, character);
}
function authored(input: CharacterAuthored): CharacterAuthored {
  const name = input.name.trim();
  if (!name || name.length > 100)
    throw new ConvexError('Enter a character name of 1–100 characters.');
  for (const value of [input.appearance, input.biography, input.notes]) {
    if (value.length > 10000)
      throw new ConvexError('Each description or notes field supports up to 10,000 characters.');
  }
  return { ...input, name };
}
const summary = v.object({
  id: v.id('characters'),
  name: v.string(),
  revision: v.number(),
  status: revisionStatusValidator,
});
const detail = v.object({
  id: v.id('characters'),
  authored: authoredValidator,
  revision: v.number(),
  selections: v.array(selectionValidator),
  status: revisionStatusValidator,
  /** The R02 EvaluationResult of the draft revision (shared/contracts/characterEvaluation.ts). */
  evaluation: v.union(v.any(), v.null()),
  combatLocked: v.boolean(),
  effectiveRevisionId: v.union(v.id('characterRevisions'), v.null()),
  derivedBaseline: v.null(),
  liveState: v.union(v.null(), heroLiveValidator),
});

/**
 * The shared evaluation operation (docs/character-wizard-spec.md#9-shared-operations-and-reliability):
 * the wizard's live "hero so far", headless callers and `save` all use it. Pure: nothing is written.
 */
export const evaluate = query({
  args: { selections: v.array(selectionValidator) },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return evaluateSelections(args.selections);
  },
});
export const listMine = query({
  args: {},
  returns: v.array(summary),
  handler: async ctx => {
    const user = await requireUser(ctx);
    const characters = await ctx.db
      .query('characters')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .order('desc')
      .take(100);
    return Promise.all(
      characters.map(async character => {
        const draft = character.draftRevisionId
          ? await ctx.db.get(character.draftRevisionId)
          : null;
        return {
          id: character._id,
          name: character.authored.name,
          revision: character.revision,
          status: draft?.status ?? ('awaiting-rules-evaluation' as const),
        };
      }),
    );
  },
});
export const get = query({
  args: { characterId: v.id('characters') },
  returns: detail,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const draft = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
    return {
      id: character._id,
      authored: character.authored,
      revision: character.revision,
      selections: draft?.selections ?? [],
      status: draft?.status ?? ('awaiting-rules-evaluation' as const),
      evaluation: draft?.evaluation ?? null,
      combatLocked: character.combatLocked,
      effectiveRevisionId: character.effectiveRevisionId,
      derivedBaseline: character.derivedBaseline,
      liveState: character.liveState,
    };
  },
});
export const create = mutation({
  args: { commandId: v.string(), authored: authoredValidator },
  returns: v.id('characters'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const receipt = await command(ctx, user._id, args.commandId, 'characters.create', args);
    if (receipt.previous) return receipt.previous.result as Id<'characters'>;
    const fields = authored(args.authored);
    const existing = await ctx.db
      .query('characters')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .take(100);
    if (existing.length >= 100) throw new ConvexError('Prototype limit of 100 characters reached.');
    const id = await ctx.db.insert('characters', {
      ownerId: user._id,
      authored: fields,
      revision: 1,
      draftRevisionId: null,
      effectiveRevisionId: null,
      derivedBaseline: null,
      liveState: null,
      campaignId: null,
      combatLocked: false,
    });
    const evaluation = evaluateSelections([]);
    const revisionId = await ctx.db.insert('characterRevisions', {
      characterId: id,
      revision: 1,
      parentRevisionId: null,
      selections: [],
      status: evaluation.status,
      evaluation,
      derivedBaseline: evaluation.baseline,
    });
    await ctx.db.patch(id, { draftRevisionId: revisionId });
    await receipt.save(id);
    return id;
  },
});
export const save = mutation({
  args: {
    commandId: v.string(),
    characterId: v.id('characters'),
    expectedRevision: v.number(),
    authored: authoredValidator,
    selections: v.optional(v.array(selectionValidator)),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const character = await owned(ctx, args.characterId, user._id);
    const receipt = await command(ctx, user._id, args.commandId, 'characters.save', args);
    if (receipt.previous) return Number(receipt.previous.result);
    await requireEditable(ctx, character);
    if (args.expectedRevision !== character.revision)
      throw new ConvexError(
        'This character changed since you opened it. Reload the saved version before saving.',
      );
    const fields = authored(args.authored);
    const old = character.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
    const selections = args.selections ?? old?.selections ?? [];
    if (
      selections.length > 100 ||
      JSON.stringify(selections).length > 64000 ||
      selections.some(
        selection =>
          !selection.decisionId.trim() ||
          !selection.ownerBranchId.trim() ||
          selection.sources.length === 0 ||
          selection.sources.some(
            source => !source.id.trim() || !source.path.trim() || !source.revision.trim(),
          ) ||
          !isJsonValue(selection.value),
      )
    )
      throw new ConvexError(
        'Selections must contain bounded JSON values and complete decision, branch and source references.',
      );
    if (
      new Set(
        selections.map(selection =>
          JSON.stringify([selection.ownerBranchId, selection.decisionId]),
        ),
      ).size !== selections.length
    )
      throw new ConvexError('A decision can only be saved once within its owning branch.');
    const revision = character.revision + 1;
    // Draft saves evaluate the build and never touch live values (R03 section 3).
    const evaluation = evaluateSelections(selections);
    const revisionId = await ctx.db.insert('characterRevisions', {
      characterId: character._id,
      revision,
      parentRevisionId: character.draftRevisionId,
      selections,
      status: evaluation.status,
      evaluation,
      derivedBaseline: evaluation.baseline,
    });
    await ctx.db.patch(character._id, { authored: fields, revision, draftRevisionId: revisionId });
    await receipt.save(String(revision));
    return revision;
  },
});
