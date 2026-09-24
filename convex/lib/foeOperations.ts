import { unscheduleTargetConditions } from './conditionInstances';
import { unscheduleHolderEffects } from './effectInstances';
// SPDX-License-Identifier: GPL-3.0-only
// Table buttons, API wrappers and slash commands use the same authorized roster operations.
// Spec: docs/table-spec.md#confirmed-action-and-log-contract and #foes-roster.
import { ConvexError, v } from 'convex/values';
import { foeDisplayName } from './foeNames';
import type { OperationDefinition } from './registry';
import { journalDelete, journalInsert } from './journal';
import { onFoeAdded, onFoeRemoved } from './initiative';
import { recordCaptainLoss, squadOfCaptain } from './squads';
import {
  organizationOf,
  printedStamina,
  requireNotPaused,
  requireStatBlock,
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
    'Load an ordinary foe from any seeded stat block (Minion stat blocks are added as squads with /squad add). Every loaded foe is visible; only the Director sees its full stat block.',
  args: { definition: v.string() },
  argDescriptions: {
    definition:
      'The stat block content id, e.g. mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior.',
  },
  roles: ['director'],
  session: 'unpaused',
  actor: 'none',
  execute: async (ctx, { context, args }) => {
    await requireNotPaused(ctx, context.campaign);
    // V02: any seeded stat block loads as an ordinary foe; Minion stat blocks form squads instead
    // (docs/table-spec.md#minion-squads-and-captain-state: one squad entry per addition).
    const entry = await requireStatBlock(ctx, String(args.definition));
    if (organizationOf(entry) === 'Minion')
      throw new ConvexError(
        `${entry.name} is a Minion stat block: add it as a squad with /squad add definition="${entry.contentId}" count=4.`,
      );
    const name = foeDisplayName(entry);
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
      description: `${name} added to the foes roster.`,
      data: { definitionId: entry.contentId },
      commit: async (writer, scope) => {
        const foeId = await journalInsert(writer, scope, 'foes', {
          campaignId: context.campaign._id,
          name,
          visible,
          sourceSnapshot: snapshotOf(entry),
          maxStamina,
          live: { stamina: maxStamina, temporaryStamina: 0 },
        });
        // A04: during committed combat the newcomer joins in a new bottom group with a turn this round
        // (docs/table-spec.md#mid-combat-additions-and-regrouping).
        await onFoeAdded(writer, scope, context.campaign, { id: foeId, name });
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
    if (foe.squadId) {
      const squad = await ctx.db.get(foe.squadId);
      throw new ConvexError(
        `${foe.name} is a minion of ${squad?.name ?? 'a squad'}: remove the whole squad with @{squad:${foe.squadId}} /squad remove, or let damage take it (2026-09-20).`,
      );
    }
    const captained = await squadOfCaptain(ctx, foe._id);
    return {
      kind: 'foe-removed',
      description: `${foe.name} removed from the foes roster${captained ? `; ${captained.name} loses its captain` : ''}.`,
      data: { foeId: foe._id, captainOf: captained?._id ?? null },
      commit: async (writer, scope) => {
        // V02: a removed captain is lost to its squad (benefit reverts; the minions keep acting).
        if (captained) await recordCaptainLoss(writer, scope, captained, 'removed');
        // A04: an acting monster's turn finishes first; its entries leave initiative
        // (docs/table-spec.md#mid-combat-additions-and-regrouping, confirmed current-monster removal).
        await onFoeRemoved(writer, scope, context.campaign, foe._id);
        await unscheduleTargetConditions(writer, scope, { kind: 'foe', id: foe._id });
        await unscheduleHolderEffects(writer, scope, { kind: 'foe', id: foe._id });
        await journalDelete(writer, scope, 'foes', foe._id);
      },
    };
  },
};

export const foeOperations: OperationDefinition[] = [add, remove];
