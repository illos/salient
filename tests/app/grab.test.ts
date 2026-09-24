// SPDX-License-Identifier: GPL-3.0-only
// V119 integration through registered operations: Grab, Escape Grab and Stand Up for every
// creature. Sources (pinned en/unified/md): feature/ability/common/grab.md, escape-grab.md,
// feature/common/maneuvers/stand-up.md, condition/grabbed.md, condition/prone.md.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, table, type Backend } from './fixtures/table';

let sequence = 0;
async function position(t: Backend, campaignId: Id<'campaigns'>, faces: number[]) {
  await t.run(async ctx => {
    const state = (await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique())!;
    for (let counter = state.counter; counter < state.counter + 100000; counter++) {
      const roll = generate(
        fromHex(state.seed),
        counter,
        faces.map((_, i) => ({ id: `die${i}`, sides: 10 })),
      );
      if (roll.dice.every((die, i) => die.value === faces[i])) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('Fixture dice position not found');
  });
}

// Thorn is size 1M. monster/goblin/statblock/goblin-warrior.md: size 1S, Might −2.
// A natural 19 is tier 3 whatever the edges or banes (rule/dice/power-roll.md).
test('V119: Grab, the size rule, Escape Grab with its bane, and Stand Up', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `grabtest-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `grabtest-${++sequence}`,
      text,
    });
  const goblinLive = async () => (await t.run(ctx => ctx.db.get(goblin)))!.live;
  const thornLive = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  const describe = async (eventId: Id<'events'>) =>
    (await t.run(ctx => ctx.db.get(eventId)))!.description;
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');

  // The goblin (1S, Might −2) cannot grab Thorn (1M): "only creatures of their size or smaller".
  await expect(
    command(`@{foe:${goblin}} /ability use ability="Grab" targets=[@Thorn]`),
  ).rejects.toThrow(/can't grab Thorn/);

  // Grab tier 3: "The target is grabbed by you."
  await position(t, f.campaignId, [10, 9]);
  await command(`@Thorn /ability use ability="Grab" targets=[@{foe:${goblin}}]`, true);
  const grabbed = await goblinLive();
  expect(grabbed.conditions?.grabbed).toBe(true);
  expect(grabbed.conditionInstances).toMatchObject([
    { condition: 'grabbed', duration: 'none', status: 'active', sourceActorId: f.thornId },
  ]);
  expect(grabbed.conditionInstances![0]!.registrationId).toBeUndefined();

  // Escape Grab takes a bane (the 1S goblin is smaller than 1M Thorn); tier 3 ends the grab.
  await position(t, f.campaignId, [10, 9]);
  const escape = await command(`@{foe:${goblin}} /ability use ability="Escape Grab"`);
  expect(await describe(escape.eventId)).toMatch(/Escape Grab takes a bane/);
  expect(await describe(escape.eventId)).toMatch(/no longer grabbed/);
  expect((await goblinLive()).conditions?.grabbed).toBe(false);
  await expect(command(`@{foe:${goblin}} /ability use ability="Escape Grab"`)).rejects.toThrow(
    /not grabbed/,
  );

  // Stand Up ends prone and refuses when there is nothing to end.
  await command('@Thorn /condition on name=prone', true);
  expect((await thornLive()).conditions.prone).toBe(true);
  await command('@Thorn /ability use ability="Stand Up"', true);
  expect((await thornLive()).conditions.prone).toBe(false);
  await expect(command('@Thorn /ability use ability="Stand Up"', true)).rejects.toThrow(
    /not prone/,
  );
});
