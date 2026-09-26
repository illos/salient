// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { backend, table } from './fixtures/table';
import { entries, manifest } from '../../shared/content/compendium/index';
import {
  foeFeatureText,
  manualFoeFeatures,
  namedFoeFeatures,
} from '../../shared/resolve/foeFeatures';

const dragonId = 'mcdm.monsters.v1/monster.dragon.statblock/thorn-dragon';
test('trait and supporting sections exclude siblings and frontmatter', () => {
  const dragon = entries.find(e => e.id === dragonId)!;
  const features = manualFoeFeatures({
    ...dragon,
    contentId: dragon.id,
    revision: manifest.compendium.revision,
  });
  expect(features.map(f => f.name)).toEqual([
    'Solo Monster',
    'End Effect',
    'Withering Wyrmscale Aura',
    'Provoking Nettles',
  ]);
  const nettles = features.find(f => f.name === 'Provoking Nettles')!;
  expect(nettles.text).toContain('Once per turn');
  expect(nettles.text).not.toContain('Withering Wyrmscale Aura');
  expect(nettles.text).not.toContain('Briar');
  expect(dragon.text).toContain(nettles.text);
  expect(features.find(f => f.name === 'End Effect')!.text).toContain('10 damage');
  const group = entries.find(e => e.id === 'mcdm.monsters.v1/monster.group/dragon')!;
  expect(
    namedFoeFeatures({ ...group, contentId: group.id, revision: manifest.compendium.revision })[0]!
      .text,
  ).not.toContain('Gloom Dragon');
  expect(foeFeatureText(dragon.text, 'not a feature')).toBe('');
});

test('manual foe feature persists once with private-source boundary and attributed completion', async () => {
  const t = backend();
  const { director, player, campaignId } = await table(t);
  await t.action(internal.content.reseed, {});
  const foeId = await director.client.mutation(api.foes.add, {
    campaignId,
    definitionId: dragonId,
    commandId: 'v212-add',
  });
  const actor = { kind: 'foe' as const, id: foeId, name: 'Thorn Dragon' };
  const sheet = await director.client.query(api.abilities.sheet, { campaignId, actor });
  const ability = sheet.abilities.find(a => a.name === 'Provoking Nettles')!;
  expect(ability.manualFeature).toBe(true);
  expect(ability.actionType).toBeNull();
  expect(sheet.abilities.some(a => a.name === 'Cage of Thorns' && a.manualFeature)).toBe(true);
  expect(sheet.abilities.some(a => a.name === "Thorn Dragon's Domain")).toBe(true);
  expect((await player.client.query(api.abilities.sheet, { campaignId, actor })).abilities).toEqual(
    [],
  );
  const use = {
    campaignId,
    commandId: 'v212-manual-use',
    text: `@{foe:${foeId}} /ability use ability="${ability.id}"`,
  };
  await expect(player.client.mutation(api.commands.submit, use)).rejects.toThrow();
  const before = await t.run(ctx => ctx.db.get(foeId));
  const accepted = await director.client.mutation(api.commands.submit, use);
  expect((await director.client.mutation(api.commands.submit, use)).eventId).toBe(accepted.eventId);
  const after = await t.run(ctx => ctx.db.get(foeId));
  expect(after!.live).toEqual(before!.live);
  const event = await t.run(ctx => ctx.db.get(accepted.eventId));
  expect(JSON.stringify(event)).toContain('Provoking Nettles');
  expect(JSON.stringify(event)).not.toContain('Withering Wyrmscale Aura');
  const result = await director.client.query(api.abilities.results, {
    campaignId,
    eventIds: [accepted.eventId],
  });
  expect(result[0]?.effectOnly).toBe(true);
  expect(result[0]?.dice).toBeUndefined();
  const source = entries.find(e => e.id === dragonId)!;
  const clause = manualFoeFeatures({
    ...source,
    contentId: source.id,
    revision: manifest.compendium.revision,
  }).find(f => f.name === 'Provoking Nettles')!.clauses[0]!.text;
  await director.client.mutation(api.commands.submit, {
    campaignId,
    commandId: 'v212-manual-complete',
    text: `/ability resolved event="${accepted.eventId}" clause=${JSON.stringify(clause)} note="handled at table"`,
  });
  const completed = await director.client.query(api.abilities.results, {
    campaignId,
    eventIds: [accepted.eventId],
  });
  expect(completed[0]?.manualDispositions).toHaveLength(1);
  expect((await t.run(ctx => ctx.db.get(foeId)))!.live).toEqual(before!.live);
  const history = (operation: string) =>
    director.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: crypto.randomUUID(),
      operation,
      arguments: {},
    });
  await history('history.undo');
  expect(
    (
      await director.client.query(api.abilities.results, {
        campaignId,
        eventIds: [accepted.eventId],
      })
    )[0]!.manualDispositions,
  ).toEqual([]);
  await history('history.redo');
  expect(
    (
      await director.client.query(api.abilities.results, {
        campaignId,
        eventIds: [accepted.eventId],
      })
    )[0]!.manualDispositions,
  ).toHaveLength(1);
});
