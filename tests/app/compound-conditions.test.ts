// SPDX-License-Identifier: GPL-3.0-only
// V153 integration: a compound "(save ends)" effect is two condition instances removed by one save.
// Thorn's Might is lowered to 0 only so the tier-2 potency applies on fixture dice.
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

// monster/basilisk/statblock/basilisk.md, Poison Fumes (5 Malice): Power Roll + 2; tier 2 "6 poison
// damage; M < 1 weakened and slowed (save ends)". Dice 5 + 5 + 2 = 12 is tier 2.
// rule/general/saving-throw.md: a "(save ends)" effect takes one saving throw at the end of each of
// the creature's turns "to remove the effect". The fixture hero saves on 5+ (Impressive Horns).
test('V153: one saving throw removes both conditions of a compound effect', async () => {
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
          M: { ...baseline.characteristics.M, value: 0 },
        },
      },
    });
  });
  const basilisk = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.basilisk.statblock/basilisk',
    commandId: `compound-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `compound-${++sequence}`,
      text,
    });
  const live = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  const events = (kind: string) =>
    t.run(ctx =>
      ctx.db
        .query('events')
        .filter(q => q.eq(q.field('campaignId'), f.campaignId))
        .collect()
        .then(rows => rows.filter(row => row.kind === kind)),
    );
  await command('/adjust malice value=5');
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command(`@{foe:${basilisk}} /turn take`);

  await position(t, f.campaignId, [5, 5]);
  const used = await command(
    `@{foe:${basilisk}} /ability use ability="Poison Fumes" targets=[@Thorn]`,
  );
  const compiled = (
    await f.director.client.query(api.abilities.results, {
      campaignId: f.campaignId,
      eventIds: [used.eventId],
    })
  )[0]!.compiled as PublicCompiledResult;
  const conditions = compiled.effects.filter(o => o.effect.kind === 'condition');
  expect(conditions.map(o => o.effect)).toMatchObject([
    { condition: 'weakened', duration: 'save-ends', status: 'applied' },
    { condition: 'slowed', duration: 'save-ends', status: 'applied' },
  ]);
  const [weakened, slowed] = conditions.map(o => o.id);
  const instances = () =>
    live().then(state =>
      state.conditionInstances!.filter(i => i.id === weakened || i.id === slowed),
    );
  expect(await instances()).toMatchObject([
    { condition: 'weakened', status: 'active', saveGroup: weakened },
    { condition: 'slowed', status: 'active', saveGroup: weakened },
  ]);
  expect((await live()).conditions).toMatchObject({ weakened: true, slowed: true });
  await command(`@{foe:${basilisk}} /turn end`);

  // A failed save at Thorn's turn end: one roll, shared by both conditions, both remain.
  await command('@Thorn /turn take', true);
  await position(t, f.campaignId, [3], 'save');
  await command('@Thorn /turn end', true);
  const failed = await instances();
  expect(failed.map(i => i.status)).toEqual(['active', 'active']);
  expect(failed[0]!.lastSave).toMatchObject({ roll: 3, success: false });
  expect(failed[1]!.lastSave).toEqual(failed[0]!.lastSave);
  const saves = await events('clock.saving-throw');
  expect(saves).toHaveLength(2);
  expect(saves.filter(e => e.dice?.length)).toHaveLength(1);
  expect(saves.filter(e => e.payload.data.shared === true)).toHaveLength(1);

  // A successful save at the next turn end removes the whole effect.
  await command(`@{foe:${basilisk}} /turn take`);
  await command(`@{foe:${basilisk}} /turn end`);
  await command('@Thorn /turn take', true);
  await position(t, f.campaignId, [8], 'save');
  await command('@Thorn /turn end', true);
  expect(await instances()).toMatchObject([
    { status: 'ended', endedReason: 'successful saving throw', lastSave: { roll: 8 } },
    { status: 'ended', endedReason: 'successful saving throw', lastSave: { roll: 8 } },
  ]);
  expect((await live()).conditions).toMatchObject({ weakened: false, slowed: false });
  expect((await events('clock.saving-throw')).filter(e => e.dice?.length)).toHaveLength(2);
  const regs = await t.run(ctx =>
    ctx.db
      .query('clockRegistrations')
      .collect()
      .then(rows =>
        rows.filter(
          r =>
            (r.work as { effectInstanceId?: string }).effectInstanceId === weakened ||
            (r.work as { effectInstanceId?: string }).effectInstanceId === slowed,
        ),
      ),
  );
  expect(regs.map(r => r.status)).toEqual(['retired', 'retired']);
});

// Members keep their own registrations: ending one condition early leaves the other's save intact.
test('V153: ending one member leaves the other condition and its save', async () => {
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
          M: { ...baseline.characteristics.M, value: 0 },
        },
      },
    });
  });
  const basilisk = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.basilisk.statblock/basilisk',
    commandId: `compound-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `compound-${++sequence}`,
      text,
    });
  const live = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  await command('/adjust malice value=5');
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command(`@{foe:${basilisk}} /turn take`);
  await position(t, f.campaignId, [5, 5]);
  await command(`@{foe:${basilisk}} /ability use ability="Poison Fumes" targets=[@Thorn]`);
  await command(`@{foe:${basilisk}} /turn end`);
  await command('@Thorn /condition off name=weakened', true);
  expect((await live()).conditions).toMatchObject({ weakened: false, slowed: true });
  await command('@Thorn /turn take', true);
  await position(t, f.campaignId, [9], 'save');
  await command('@Thorn /turn end', true);
  const slowed = (await live()).conditionInstances!.find(i => i.condition === 'slowed')!;
  expect(slowed).toMatchObject({
    status: 'ended',
    endedReason: 'successful saving throw',
    lastSave: { roll: 9, success: true },
  });
  expect((await live()).conditions).toMatchObject({ weakened: false, slowed: false });
});
