// SPDX-License-Identifier: GPL-3.0-only
/**
 * V109: source riders share V72 occurrence, authority and history behavior without rider writes.
 * V159: Raider's Awe's bane is now a modifier the engine applies (tests/app/modifiers.test.ts), so
 * the kit witness is Shining Armor's Protective Attack (kit/shining-armor.md), whose taunt rider
 * stays table work.
 */
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { backend, table, admitHero, heroFixtureSelections } from './fixtures/table';

test('kit rider persists, remains table work, and follows correction/disposition/history identities', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const actorId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Guard',
    heroFixtureSelections({ 'kit.choice': 'Shining Armor' }),
  );
  const targetId = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: 'rider-foe',
  });
  let seq = 0;
  const command = (text: string, client = f.director.client, commandId = `rider-use-${++seq}`) =>
    client.mutation(api.commands.submit, { campaignId: f.campaignId, commandId, text });
  const target = `@{foe:${targetId}}`;
  const live = () =>
    t.run(async ctx => ({
      actor: (await ctx.db.get(actorId))!.liveState,
      target: (await ctx.db.get(targetId))!.live,
    }));
  const before = await live();
  const used = await command(
    `@Guard /ability use ability="Protective Attack" targets=[${target}]`,
    f.player.client,
  );
  const read = async (client = f.director.client) =>
    (
      await client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [used.eventId],
      })
    )[0]!;
  const initial = await read();
  const compiled = initial.compiled as PublicCompiledResult;
  const rider = compiled.effects.find(o => o.effect.kind === 'rider')!;
  expect(rider.effect).toMatchObject({
    kind: 'rider',
    shape: 'taunt',
    status: 'manual',
    dependency: 'independent',
  });
  expect(rider.effect.clause).toMatch(/taunted.*until the end of their next/);
  expect(compiled.definition.source.path).toMatch(/kit\/shining-armor.md$/);
  const after = await live();
  expect(after.actor).toEqual(before.actor);
  const tier = initial.targets[0]!.outcome.tier;
  expect(after.target.stamina).toBe(before.target.stamina - [7, 10, 13][tier - 1]!); // kit printed 5/8/11 + M2; no second kit bonus.
  expect({ ...after.target, stamina: before.target.stamina }).toEqual(before.target);
  expect((await read(f.observer.client)).compiled).not.toHaveProperty('inputs');
  const publicRider = (
    (await read(f.observer.client)).compiled as PublicCompiledResult
  ).effects.find(o => o.id === rider.id);
  expect(publicRider).toEqual(rider);
  const originalRolls = await t.run(ctx => ctx.db.query('rolls').take(100));
  await command(
    `/ability correct event="${used.eventId}" target=${target} edges=0 banes=2`,
    f.player.client,
  );
  const corrected = await read();
  const current = (corrected.compiled as PublicCompiledResult).effects.find(
    o => o.effect.kind === 'rider',
  )!;
  expect(current.id).not.toBe(rider.id);
  expect(corrected.dice).toEqual(initial.dice);
  expect(current.effect).toEqual(rider.effect);
  await expect(
    command(`/ability resolved event="${used.eventId}" occurrence=${JSON.stringify(rider.id)}`),
  ).rejects.toThrow(/stale|current/);
  const resolve = `/ability resolved event="${used.eventId}" occurrence=${JSON.stringify(current.id)} note="Taunt tracked at table"`;
  await expect(command(resolve, f.player.client)).rejects.toThrow(/director/i);
  const state = await live();
  const disposed = await command(resolve, f.director.client, 'rider-disposition');
  expect(await command(resolve, f.director.client, 'rider-disposition')).toEqual(disposed);
  const withDisposition = (await read()).compiled as PublicCompiledResult;
  expect(withDisposition.effects.find(o => o.id === current.id)!.disposition).toMatchObject({
    eventId: disposed.eventId,
    note: 'Taunt tracked at table',
  });
  expect(await live()).toEqual(state);
  await expect(command(resolve)).rejects.toThrow(/already/);
  await command('/history rewind');
  expect((await read()).compiled).toEqual(corrected.compiled);
  await command('/history redo');
  expect((await read()).compiled).toEqual(withDisposition);
  expect(await live()).toEqual(state);
  expect(await t.run(ctx => ctx.db.query('rolls').take(100))).toEqual(originalRolls);
});
