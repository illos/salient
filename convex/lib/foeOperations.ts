// SPDX-License-Identifier: GPL-3.0-only
// Table buttons, API wrappers and slash commands use the same authorized roster operations.
// Spec: docs/table-spec.md#confirmed-action-and-log-contract and #foes-roster.
import { ConvexError, v } from 'convex/values';
import type { OperationDefinition } from './registry';
import { requireContent } from '../content';
import { journalDelete, journalInsert } from './journal';
import {
  GOBLIN_WARRIOR_ID,
  printedStamina,
  requireNotPaused,
  scopedFoe,
  settings,
  snapshotOf,
} from './foeSource';

const add: OperationDefinition = {
  id: 'foe.add',
  family: 'foe',
  verb: 'add',
  title: 'Add foe',
  description:
    'Load a foe from the catalog. Every loaded foe is visible; only the Director sees its full stat block.',
  args: { definition: v.string() },
  argDescriptions: { definition: 'The catalog definition id.' },
  roles: ['director'],
  session: 'unpaused',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    await requireNotPaused(ctx, context.campaign);
    if (args.definition !== GOBLIN_WARRIOR_ID)
      throw new ConvexError('This foe definition is not available in the prototype.');
    const entry = await requireContent(ctx, GOBLIN_WARRIOR_ID);
    const maxStamina = printedStamina(entry);
    const existing = await ctx.db
      .query('foes')
      .withIndex('by_campaign', q => q.eq('campaignId', context.campaign._id))
      .take(100);
    if (existing.length >= 100)
      throw new ConvexError('Prototype roster limit of 100 foes reached.');
    const visible = (await settings(ctx, context.campaign._id))?.addVisible ?? false;
    return {
      kind: 'foe-added',
      description: `${entry.name} added to the foes roster.`,
      data: { definitionId: entry.contentId },
      commit: async (writer, scope) => {
        await journalInsert(writer, scope, 'foes', {
          campaignId: context.campaign._id,
          name: entry.name,
          visible,
          sourceSnapshot: snapshotOf(entry),
          maxStamina,
          live: { stamina: maxStamina, temporaryStamina: 0 },
        });
      },
    };
  },
};

const remove: OperationDefinition = {
  id: 'foe.remove',
  family: 'foe',
  verb: 'remove',
  title: 'Remove foe',
  description: 'Remove the selected foe from the campaign roster.',
  args: {},
  argDescriptions: {},
  roles: ['director'],
  session: 'unpaused',
  actor: 'required',
  execute: async (ctx, { context, actor }) => {
    await requireNotPaused(ctx, context.campaign);
    if (actor?.kind !== 'foe') throw new ConvexError('Select a foe to remove.');
    const id = ctx.db.normalizeId('foes', actor.id);
    if (!id) throw new ConvexError('Foe unavailable.');
    const foe = await scopedFoe(ctx, context.campaign._id, id);
    return {
      kind: 'foe-removed',
      description: `${foe.name} removed from the foes roster.`,
      data: { foeId: foe._id },
      commit: (writer, scope) => journalDelete(writer, scope, 'foes', foe._id),
    };
  },
};

export const foeOperations: OperationDefinition[] = [add, remove];
