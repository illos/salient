// SPDX-License-Identifier: GPL-3.0-only
// V155 integration: "can't stand" holds a prone creature down until its save; the creature then
// stays prone until it uses Stand Up (docs/decisions/2026-09-24-automation-rulings.md, section 5).
// Thorn's Intuition is lowered to 0 only so the tier-3 potency applies.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DerivedBaseline } from '../../shared/contracts/characterEvaluation';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, table, type Backend } from './fixtures/table';

let sequence = 0;
async function position(t: Backend, campaignId: Id<'campaigns'>, faces: number[], id = 'die') {
  await t.run(async ctx => {
    const state = (await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique())!;
    for (let counter = state.counter; counter < state.counter + 100000; counter++) {
      const roll = generate(
        fromHex(state.seed),
        counter,
        faces.map((_, i) => ({ id: faces.length === 1 ? id : `${id}${i}`, sides: 10 })),
      );
      if (roll.dice.every((die, i) => die.value === faces[i])) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('Fixture dice position not found');
  });
}

// monster/goblin/statblock/goblin-cursespitter.md, Dizzying Hex (1 Malice): Power Roll + 2; tier 3
// "Prone; I < 2 can't stand (save ends)". Dice 10 + 10 is tier 3. The fixture hero saves on 5+.
test("V155: can't stand refuses Stand Up until its save, then the creature stays prone", async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  await t.run(async ctx => {
    const hero = (await ctx.db.get(f.thornId))!;
    const baseline = hero.derivedBaseline as DerivedBaseline;
    await ctx.db.patch(f.thornId, {
      derivedBaseline: {
        ...baseline,
        characteristics: {
          ...baseline.characteristics,
          I: { ...baseline.characteristics.I, value: 0 },
        },
      },
    });
  });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-cursespitter',
    commandId: `cant-stand-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `cant-stand-${++sequence}`,
      text,
    });
  const live = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  await command('/adjust malice value=3');
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command(`@{foe:${goblin}} /turn take`);
  await position(t, f.campaignId, [10, 10]);
  const used = await command(
    `@{foe:${goblin}} /ability use ability="Dizzying Hex" targets=[@Thorn]`,
  );
  const compiled = (
    await f.director.client.query(api.abilities.results, {
      campaignId: f.campaignId,
      eventIds: [used.eventId],
    })
  )[0]!.compiled as PublicCompiledResult;
  expect(compiled.effects.map(o => o.effect)).toMatchObject([
    { kind: 'condition', condition: 'prone', duration: 'none', status: 'applied' },
    {
      kind: 'condition',
      condition: 'prone',
      restriction: 'cant-stand',
      duration: 'save-ends',
      status: 'applied',
    },
  ]);
  const [prone, restriction] = compiled.effects.map(o => o.id);
  const instance = async (id: string) => (await live()).conditionInstances!.find(i => i.id === id)!;
  expect(await instance(prone!)).toMatchObject({ status: 'active', duration: 'none' });
  expect(await instance(restriction!)).toMatchObject({
    status: 'active',
    restriction: 'cant-stand',
  });
  expect((await instance(restriction!)).registrationId).toBeTruthy();
  await expect(command('@Thorn /ability use ability="Stand Up"', true)).rejects.toThrow(
    /can't stand/,
  );
  await command(`@{foe:${goblin}} /turn end`);

  // A failed save keeps the restriction.
  await command('@Thorn /turn take', true);
  await position(t, f.campaignId, [2], 'save');
  await command('@Thorn /turn end', true);
  expect(await instance(restriction!)).toMatchObject({ status: 'active' });

  // A successful save ends only the restriction: Thorn is still prone.
  await command(`@{foe:${goblin}} /turn take`);
  await command(`@{foe:${goblin}} /turn end`);
  await command('@Thorn /turn take', true);
  await position(t, f.campaignId, [9], 'save');
  await command('@Thorn /turn end', true);
  expect(await instance(restriction!)).toMatchObject({
    status: 'ended',
    endedReason: 'successful saving throw',
  });
  expect(await instance(prone!)).toMatchObject({ status: 'active' });
  expect((await live()).conditions.prone).toBe(true);
  await command('@Thorn /ability use ability="Stand Up"', true);
  expect((await live()).conditions.prone).toBe(false);
  expect(await instance(prone!)).toMatchObject({ status: 'ended' });
});
