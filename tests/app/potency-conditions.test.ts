// SPDX-License-Identifier: GPL-3.0-only
// V88 integration: real registered operations with disclosed characteristic and dice fixtures.
// The evaluated fixture's Might is lowered to 0 only to exercise the BP tier boundary;
// the separate headless runner uses legally evaluated builds and unpositioned campaign dice.
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

test('BP6–10: applied use, score privacy, correction flip, exact restoration and post-save refusal', async () => {
  const t = backend();
  const f = await table(t);
  await t.mutation(internal.content.reseed, {});
  await t.run(async ctx => {
    const hero = (await ctx.db.get(f.thornId))!;
    const baseline = hero.derivedBaseline as DerivedBaseline;
    await ctx.db.patch(f.thornId, {
      derivedBaseline: {
        ...baseline,
        characteristics: {
          ...baseline.characteristics,
          M: { ...baseline.characteristics.M, value: 0 },
        },
      },
    });
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `potency-${++sequence}`,
      text,
    });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `potency-${++sequence}`,
  });
  await command('@Thorn /adjust stamina value=30');
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command('/adjust malice value=2');
  await command(`@{foe:${goblin}} /turn take`);
  await position(t, f.campaignId, [7, 7]);
  const used = await command(
    `@{foe:${goblin}} /ability use ability="Bury the Point" targets=[@Thorn]`,
  );
  const live = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  const read = async (client: typeof f.director.client) => {
    const result = (
      await client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [used.eventId],
      })
    )[0]!;
    const effect = (result.compiled as PublicCompiledResult).effects.find(
      o => o.effect.kind === 'condition',
    )!;
    if (effect.effect.kind !== 'condition') throw new Error('Missing condition');
    return effect;
  };
  const first = await read(f.director.client);
  expect(first.effect).toMatchObject({
    status: 'applied',
    threshold: 1,
    targetScore: 0,
    condition: 'bleeding',
  });
  expect((await read(f.player.client)).effect).toHaveProperty('targetScore', 0);
  expect((await read(f.observer.client)).effect).not.toHaveProperty('targetScore');
  const applied = await live();
  expect(applied.stamina).toBe(24);
  expect(applied.conditions.bleeding).toBe(true);
  expect(applied.conditionInstances).toHaveLength(1);
  expect(applied.conditionInstances![0]).toMatchObject({
    id: first.id,
    sourceUseEventId: used.eventId,
    status: 'active',
    abilityName: 'Bury the Point',
  });
  expect(applied.conditionInstances![0]!.registrationId).toBeTruthy();
  const resolve = () =>
    f.director.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: `potency-${++sequence}`,
      operation: 'ability.resolved',
      arguments: {
        event: used.eventId,
        occurrence: first.id,
        target: { refKind: 'character', id: f.thornId },
      },
    });
  await expect(resolve()).rejects.toThrow(/applied|resisted/);
  expect(await live()).toEqual(applied);
  const correct = () =>
    command(`/ability correct event="${used.eventId}" target=@Thorn edges=0 banes=2`);
  await correct();
  const corrected = await live();
  expect(corrected.stamina).toBe(25);
  expect(corrected.conditions.bleeding).toBe(false);
  expect(corrected.conditionInstances![0]!.status).toBe('ended');
  const after = await read(f.director.client);
  expect(after.id).not.toBe(first.id);
  expect(after.effect).toMatchObject({ status: 'resisted', threshold: 0, targetScore: 0 });
  await command('/history rewind');
  expect(await live()).toEqual(applied);
  expect(await read(f.director.client)).toEqual(first);
  await command('/history redo');
  expect(await live()).toEqual(corrected);
  await command(`/ability correct event="${used.eventId}" target=@Thorn edges=0 banes=0`);
  const reapplied = await live();
  expect(reapplied.conditions.bleeding).toBe(true);
  expect(
    reapplied.conditionInstances!.filter(instance => instance.status === 'active'),
  ).toHaveLength(1);
  expect(reapplied.conditionInstances!.at(-1)!.id).not.toBe(first.id);
  expect((await read(f.director.client)).effect).toMatchObject({ status: 'applied', threshold: 1 });
  await command('/history rewind');
  expect(await live()).toEqual(corrected);
  await command('/history rewind');
  await command(`@{foe:${goblin}} /turn end`);
  await command('@Thorn /turn take', true);
  await position(t, f.campaignId, [6]);
  await command('@Thorn /turn end', true);
  const saved = await live();
  expect(saved.conditions.bleeding).toBe(false);
  expect(saved.conditionInstances![0]).toMatchObject({
    status: 'ended',
    lastSave: { roll: 6, success: true },
  });
  await expect(correct()).rejects.toThrow(/saving throw has already been rolled/);
  expect(await live()).toEqual(saved);
  const rolls = await t.run(ctx => ctx.db.query('rolls').take(100));
  await command('/history rewind');
  expect((await live()).conditions.bleeding).toBe(true);
  await command('/history redo');
  expect(await live()).toEqual(saved);
  expect(await t.run(ctx => ctx.db.query('rolls').take(100))).toEqual(rolls);
});
