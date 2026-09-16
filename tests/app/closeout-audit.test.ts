// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import { backend, table, storedEvents } from './fixtures/table';

test('normal cleanup clears a retained foe temporary pool once, with a private persisted journal', async () => {
  const t = backend();
  const f = await table(t);
  const foeId = await t.run(ctx =>
    ctx.db.insert('foes', {
      campaignId: f.campaignId,
      name: 'Retained goblin',
      visible: true,
      sourceSnapshot: 'fixture',
      maxStamina: 15,
      live: { stamina: 11, temporaryStamina: 37 },
    }),
  );
  const submit = (text: string, commandId: string) =>
    f.director.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      text,
      commandId,
    });
  await submit('/combat start', 'foe-cleanup-start');
  await submit('/combat commit', 'foe-cleanup-commit');
  await submit('/combat end', 'foe-cleanup-end');
  await f.director.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'foe-cleanup-victory',
    operation: 'combat.victories',
    arguments: { amount: 0, recipients: [] },
  });
  const finish = await submit('/combat finish', 'foe-cleanup-finish');
  expect(await submit('/combat finish', 'foe-cleanup-finish')).toEqual(finish);
  expect((await t.run(ctx => ctx.db.get(foeId)))!.live).toEqual({
    stamina: 11,
    temporaryStamina: 0,
  });
  const events = (await storedEvents(t, f.campaignId)).filter(
    e => e.kind === 'combat.resource-cleared' && e.payload?.data?.foeId === foeId,
  );
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    causeEventId: finish.eventId,
    payload: { data: { field: 'temporaryStamina', before: 37, after: 0 } },
  });
  expect(
    await t.run(ctx =>
      ctx.db
        .query('changes')
        .withIndex('by_event', q => q.eq('eventId', events[0]!._id))
        .collect(),
    ),
  ).toEqual([
    expect.objectContaining({
      entityId: foeId,
      path: 'live.temporaryStamina',
      before: { present: true, value: 37 },
      after: { present: true, value: 0 },
    }),
  ]);
  const publicEvent = (
    await f.observer.client.query(api.events.list, { campaignId: f.campaignId })
  ).events.find(e => e.id === events[0]!._id);
  // Inspect the public payload, not timestamps/IDs that can coincidentally contain the digits 37.
  expect(publicEvent).toBeDefined();
  expect(publicEvent!.description).toBe(
    'Retained goblin: temporary Stamina cleared (combat cleanup).',
  );
  expect(publicEvent!.payload).toEqual({
    data: {
      field: 'temporaryStamina',
      foeId,
      publicDescription: 'Retained goblin: temporary Stamina cleared (combat cleanup).',
      sourcePath: expect.any(String),
    },
  });
});
