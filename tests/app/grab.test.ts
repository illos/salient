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
// A natural 19 is tier 3 whatever the edges or banes (rule/dice/natural-roll.md).
test('V119: Grab, the size rule, Escape Grab with its bane, and Stand Up', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const addGoblin = () =>
    f.director.client.mutation(api.foes.add, {
      campaignId: f.campaignId,
      definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
      commandId: `grabtest-${++sequence}`,
    });
  const goblin = await addGoblin();
  const other = await addGoblin();
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
  const grabUse = await command(
    `@Thorn /ability use ability="Grab" targets=[@{foe:${goblin}}]`,
    true,
  );
  const grabbed = await goblinLive();
  expect(grabbed.conditions?.grabbed).toBe(true);
  expect(grabbed.conditionInstances).toMatchObject([
    { condition: 'grabbed', duration: 'none', status: 'active', sourceActorId: f.thornId },
  ]);
  expect(grabbed.conditionInstances![0]!.registrationId).toBeUndefined();
  // A Grab use is rewound, not corrected: its tier-3 grab write can't be re-decided safely.
  await expect(
    command(`/ability correct event="${grabUse.eventId}" target=@{foe:${goblin}} edges=0 banes=2`),
  ).rejects.toThrow(/rewind the use/);
  // chapter/classes.md, Stacking Unique Effects: a second grabber's tier 3 is left to the table.
  await position(t, f.campaignId, [10, 9]);
  const second = await command(
    `@{foe:${other}} /ability use ability="Grab" targets=[@{foe:${goblin}}]`,
  );
  expect(await describe(second.eventId)).toMatch(/already grabbed by another creature/);
  expect((await goblinLive()).conditionInstances).toHaveLength(1);
  // condition/grabbed.md: a grabbed creature can't use Knockback.
  await expect(
    command(`@{foe:${goblin}} /ability use ability="Knockback" targets=[@Thorn]`),
  ).rejects.toThrow(/grabbed and can't use Knockback/);

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
  // condition/restrained.md: a restrained creature can't use Stand Up.
  await command('@Thorn /condition on name=restrained', true);
  await expect(command('@Thorn /ability use ability="Stand Up"', true)).rejects.toThrow(
    /restrained and can't use Stand Up/,
  );
  await command('@Thorn /condition off name=restrained', true);
  await command('@Thorn /ability use ability="Stand Up"', true);
  expect((await thornLive()).conditions.prone).toBe(false);
  await expect(command('@Thorn /ability use ability="Stand Up"', true)).rejects.toThrow(
    /not prone/,
  );
});
