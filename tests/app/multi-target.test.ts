// SPDX-License-Identifier: GPL-3.0-only
// V110 integration: a compiled three-target foe ability through the registered operations.
// Thorn's Agility is lowered to 0 only to exercise both tier thresholds on one roll.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DerivedBaseline } from '../../shared/contracts/characterEvaluation';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
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

// monster/goblin/statblock/goblin-assassin.md, Shadow Chains (3 Malice): Ranged 10, three
// creatures, Power Roll + 2; 2/4/5 corruption damage; A < 0/1/2 restrained (save ends).
// monster/goblin/statblock/goblin-cursespitter.md: Agility +1. Dice 7 + 7 + 2 = 16 is tier 2;
// one edge makes 18, tier 3 (rule/dice/edge.md). Thorn (A 0) < 1 and the cursespitter (A 1) < 2
// apply; the goblin warrior (A 2) resists tier 2.
test('V110: per-target conditions, per-target correction identity and the printed maximum', async () => {
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
          A: { ...baseline.characteristics.A, value: 0 },
        },
      },
    });
  });
  const add = (slug: string) =>
    f.director.client.mutation(api.foes.add, {
      campaignId: f.campaignId,
      definitionId: `mcdm.monsters.v1/monster.${slug}`,
      commandId: `multitarget-${++sequence}`,
    });
  const assassin = await add('goblin.statblock/goblin-assassin');
  const spitter = await add('goblin.statblock/goblin-cursespitter');
  const warrior = await add('goblin.statblock/goblin-warrior');
  const spare = await add('goblin.statblock/goblin-warrior');
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `multitarget-${++sequence}`,
      text,
    });
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command('/adjust malice value=6');
  await command(`@{foe:${assassin}} /turn take`);
  const targets = (ids: string[]) => `targets=[@Thorn,${ids.map(id => `@{foe:${id}}`).join(',')}]`;
  await expect(
    command(
      `@{foe:${assassin}} /ability use ability="Shadow Chains" ${targets([spitter, warrior, spare])}`,
    ),
  ).rejects.toThrow(/targets up to 3; give at most 3 targets/);

  await position(t, f.campaignId, [7, 7]);
  const used = await command(
    `@{foe:${assassin}} /ability use ability="Shadow Chains" ${targets([spitter, warrior])} edges=[0,1,0]`,
  );
  const read = async () =>
    (
      await f.director.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [used.eventId],
      })
    )[0]!.compiled as PublicCompiledResult;
  const conditions = (compiled: PublicCompiledResult) =>
    compiled.effects.filter(o => o.effect.kind === 'condition');
  const heroLive = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  const foeLive = async (id: Id<'foes'>) => (await t.run(ctx => ctx.db.get(id)))!.live;
  const active = (instances: { status: string }[] | undefined) =>
    (instances ?? []).filter(instance => instance.status === 'active');

  const first = await read();
  expect(first.definition.name).toBe('Shadow Chains');
  expect(conditions(first).map(o => [o.effect.targetId, o.effect.status])).toEqual([
    [f.thornId, 'applied'],
    [spitter, 'applied'],
    [warrior, 'resisted'],
  ]);
  const [thornFirst, spitterFirst, warriorFirst] = conditions(first);
  expect(active((await heroLive()).conditionInstances)).toMatchObject([
    { id: thornFirst!.id, condition: 'restrained' },
  ]);
  expect(active((await foeLive(spitter)).conditionInstances)).toMatchObject([
    { id: spitterFirst!.id, condition: 'restrained' },
  ]);
  expect(active((await foeLive(warrior)).conditionInstances)).toEqual([]);

  // Double bane lowers Thorn to tier 1 (A < 0): only Thorn's occurrence and instance change.
  await command(`/ability correct event="${used.eventId}" target=@Thorn edges=0 banes=2`);
  const second = await read();
  const [thornSecond, spitterSecond, warriorSecond] = conditions(second);
  expect(thornSecond!.effect).toMatchObject({ targetId: f.thornId, status: 'resisted' });
  expect(thornSecond!.id).not.toBe(thornFirst!.id);
  expect(spitterSecond).toEqual(spitterFirst);
  expect(warriorSecond).toEqual(warriorFirst);
  expect(active((await heroLive()).conditionInstances)).toEqual([]);
  expect((await heroLive()).conditions.restrained).toBe(false);
  expect(active((await foeLive(spitter)).conditionInstances)).toMatchObject([
    { id: spitterFirst!.id },
  ]);

  // A later spitter correction ends the preserved instance by its original identity.
  await command(
    `/ability correct event="${used.eventId}" target=@{foe:${spitter}} edges=2 banes=0`,
  );
  const third = await read();
  const spitterThird = conditions(third).find(o => o.effect.targetId === spitter)!;
  expect(spitterThird.effect.status).toBe('applied');
  expect(spitterThird.id).not.toBe(spitterFirst!.id);
  const spitterInstances = (await foeLive(spitter)).conditionInstances!;
  expect(active(spitterInstances)).toMatchObject([{ id: spitterThird.id }]);
  expect(spitterInstances.find(i => i.id === spitterFirst!.id)).toMatchObject({ status: 'ended' });
  expect(conditions(third).find(o => o.effect.targetId === f.thornId)).toEqual(thornSecond);
});
