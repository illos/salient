// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { backend, storedEvents, table } from './fixtures/table';

test.each(['roll', 'choice'])(
  'committed combat checks Ferocity affordability during %s',
  async phase => {
    const t = backend();
    const { director, player, campaignId, thornId } = await table(t);
    await t.action(internal.content.reseed, {});
    const goblin = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
      commandId: 'review-preinit-foe',
    });
    for (const [text, commandId] of [
      ['/combat start', 'review-preinit-start'],
      ['/combat commit', 'review-preinit-commit'],
    ])
      await director.client.mutation(api.commands.submit, {
        campaignId,
        text: text!,
        commandId: commandId!,
      });
    if (phase === 'choice')
      await player.client.mutation(api.commands.submit, {
        campaignId,
        text: '/combat roll',
        commandId: 'review-preinit-roll',
      });
    const rollsBefore = await t.run(ctx => ctx.db.query('rolls').take(10));
    const before = await t.run(ctx => ctx.db.get(thornId));
    expect(before!.liveState!.heroicResource.current).toBe(0);
    const used = await player.client.mutation(api.commands.submit, {
      campaignId,
      text: `@Thorn /ability use ability="Thunder Roar" targets=[@{foe:${goblin}}]`,
      commandId: 'review-preinit-use',
    });
    const event = (await storedEvents(t, campaignId)).find(e => e._id === used.eventId)!;
    expect(event.kind).toBe('ability.blocked');
    expect(await t.run(ctx => ctx.db.get(thornId))).toEqual(before);
    expect(await t.run(ctx => ctx.db.query('rolls').take(10))).toEqual(rollsBefore);
  },
);

test('real Malice costs and affordability refusals hide pools from both peer audiences', async () => {
  const t = backend();
  const { director, player, observer, campaignId } = await table(t);
  await t.action(internal.content.reseed, {});
  const goblin = await director.client.mutation(api.foes.add, {
    campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: 'review-malice-foe',
  });
  const submit = (text: string, commandId: string) =>
    director.client.mutation(api.commands.submit, { campaignId, text, commandId });
  await submit('/adjust malice value=47', 'review-malice-pool');
  const used = await submit(
    `@{foe:${goblin}} /ability use ability="Bury the Point" targets=[@Thorn]`,
    'review-malice-use',
  );
  await submit('/adjust malice value=1', 'review-malice-empty');
  const blocked = await submit(
    `@{foe:${goblin}} /ability use ability="Bury the Point" targets=[@Thorn]`,
    'review-malice-blocked',
  );
  for (const client of [player.client, observer.client]) {
    const events = (await client.query(api.events.list, { campaignId })).events;
    const visibleUse = events.find(e => e.id === used.eventId)!;
    const visibleBlock = events.find(e => e.id === blocked.eventId)!;
    expect(visibleUse.description).not.toContain('47 → 45');
    expect(visibleUse.payload.data.result.cost).toEqual({
      resource: 'malice',
      amount: 2,
      waived: false,
    });
    expect(visibleBlock.payload.data.blocked).not.toHaveProperty('poolBefore');
    expect(visibleBlock.payload.data.blocked.reason).toBe('Insufficient Malice for the fixed cost');
    expect(visibleBlock.description).not.toContain('malice 1');
  }
  await submit('/campaign malice-visible state=on', 'review-malice-show');
  const shown = (await observer.client.query(api.events.list, { campaignId })).events;
  expect(shown.find(e => e.id === used.eventId)!.payload.data.result.cost).toMatchObject({
    before: 47,
    after: 45,
  });
  expect(shown.find(e => e.id === blocked.eventId)!.payload.data.blocked.poolBefore).toBe(1);
});
