// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { backend, storedEvents, table } from './fixtures/table';
import { GOBLIN_WARRIOR_ID } from '../../convex/lib/foeSource';
import { readPinnedSource } from '../helpers/pinned-source';

test('foe buttons/API/commands share retries, source snapshots and journaled creation/removal', async () => {
  const t = backend();
  const { director, campaignId } = await table(t);
  await t.action(internal.content.reseed, {});
  const commandId = 'foe-shared-add-0001';
  const foeId = await director.client.mutation(api.foes.add, {
    campaignId,
    definitionId: GOBLIN_WARRIOR_ID,
    commandId,
  });
  const result = await director.client.mutation(api.commands.submit, {
    campaignId,
    text: `/foe add definition="${GOBLIN_WARRIOR_ID}"`,
    commandId,
  });
  const rows = await t.run(ctx =>
    ctx.db
      .query('foes')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .collect(),
  );
  expect(rows).toHaveLength(1);
  const snapshot = JSON.parse(rows[0]!.sourceSnapshot);
  const twinPath =
    'vendor/steel-compendium/en/unified/json/monster/goblin/statblock/goblin-warrior.json';
  const twin = JSON.parse(readPinnedSource(process.cwd(), twinPath));
  expect(snapshot.jsonPath).toBe(twinPath);
  expect(snapshot.features).toEqual(twin.features);
  expect(snapshot.features).toHaveLength(3);
  const insertion = await t.run(ctx =>
    ctx.db
      .query('changes')
      .withIndex('by_event', q => q.eq('eventId', result.eventId))
      .collect(),
  );
  expect(insertion).toHaveLength(1);
  expect(insertion[0]).toMatchObject({
    entityTable: 'foes',
    entityId: foeId,
    path: '',
    before: { present: false },
    after: { present: true },
  });
  const removeId = 'foe-shared-remove-0001';
  const removed = await director.client.mutation(api.commands.submit, {
    campaignId,
    text: `@{foe:${foeId}} /foe remove`,
    commandId: removeId,
  });
  await director.client.mutation(api.foes.remove, { campaignId, foeId, commandId: removeId });
  expect(await t.run(ctx => ctx.db.get(foeId))).toBeNull();
  const deletion = await t.run(ctx =>
    ctx.db
      .query('changes')
      .withIndex('by_event', q => q.eq('eventId', removed.eventId))
      .collect(),
  );
  expect(deletion).toHaveLength(1);
  expect(deletion[0]).toMatchObject({
    entityId: foeId,
    path: '',
    before: { present: true },
    after: { present: false },
  });
  const events = await storedEvents(t, campaignId);
  expect(events.filter(e => e.commandId === commandId)).toHaveLength(1);
  expect(events.filter(e => e.commandId === removeId)).toHaveLength(1);
  expect(
    await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: GOBLIN_WARRIOR_ID,
      commandId,
    }),
  ).toBe(foeId);
  expect(await t.run(ctx => ctx.db.get(foeId))).toBeNull();
});

test('registered foe operations enforce Director authority, campaign scope and pause lock', async () => {
  const t = backend();
  const { director, player, observer, campaignId, sessionId } = await table(t);
  await t.action(internal.content.reseed, {});
  const operations = await director.client.query(api.commands.list, { campaignId });
  expect(operations.map(op => op.id)).toEqual(expect.arrayContaining(['foe.add', 'foe.remove']));
  for (const [index, caller] of [player, observer].entries()) {
    await expect(
      caller.client.mutation(api.commands.submit, {
        campaignId,
        text: `/foe add definition="${GOBLIN_WARRIOR_ID}"`,
        commandId: `forbidden-foe-${index}`,
      }),
    ).rejects.toThrow('Director');
  }
  const foeId = await director.client.mutation(api.foes.add, {
    campaignId,
    definitionId: GOBLIN_WARRIOR_ID,
    commandId: 'foe-for-pause',
  });
  await director.client.mutation(api.sessions.transition, {
    sessionId: sessionId!,
    expectedRevision: 0,
    action: 'pause',
    commandId: 'pause-foes-test',
  });
  for (const [index, text] of [
    `/foe add definition="${GOBLIN_WARRIOR_ID}"`,
    `@{foe:${foeId}} /foe remove`,
  ].entries()) {
    await expect(
      director.client.mutation(api.commands.submit, {
        campaignId,
        text,
        commandId: `paused-foe-${index}`,
      }),
    ).rejects.toThrow('paused');
  }
  const elsewhere = await director.client.mutation(api.campaigns.create, {
    name: 'Other',
    commandId: 'other-foe-campaign',
  });
  await expect(
    director.client.mutation(api.commands.submit, {
      campaignId: elsewhere,
      text: `@{foe:${foeId}} /foe remove`,
      commandId: 'cross-campaign-foe',
    }),
  ).rejects.toThrow();
  expect(await t.run(ctx => ctx.db.get(foeId))).not.toBeNull();
});
