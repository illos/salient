// SPDX-License-Identifier: GPL-3.0-only
// V149: Troubadour drama generation. Expected values come from pinned
// feature/troubadour/level-1/drama.md:
// - "The first time any hero is made winded during the encounter, you gain 2 drama.";
// - "When you or another hero dies, you gain 10 drama.";
// - "Whenever a creature within your line of effect rolls a natural 19 or 20, you gain 3 drama."
//   and "The first time three or more heroes use an ability on the same turn, you gain 2 drama."
//   (claimed);
// and level-2/appeal-to-the-muses.md: on a 1, "you gain 1 additional drama. The Director gains 1d3
// Malice". rule/health/winded.md and dying.md: winded at or below the winded value, dead at the
// negative of it. monster/goblin/statblock/goblin-warrior.md: a creature free strike of 1, no roll.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import troubadourLedger from '../fixtures/v102-troubadour-expected.json' with { type: 'json' };
import { admitHero, backend, table, type Backend } from './fixtures/table';

async function position(
  t: Backend,
  campaignId: Id<'campaigns'>,
  rolls: { sides: number; face: number }[],
) {
  await t.run(async ctx => {
    const state = (await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique())!;
    const seed = fromHex(state.seed);
    for (let counter = state.counter; counter < state.counter + 200000; counter++) {
      let next = counter;
      const hit = rolls.every(roll => {
        const generated = generate(seed, next, [{ id: 'die', sides: roll.sides }]);
        next = generated.counter;
        return generated.dice[0]!.value === roll.face;
      });
      if (hit) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('Fixture dice position not found');
  });
}

let sequence = 0;
test('V149: a Troubadour gains drama from the appeal, heroes winded or dying, and claims', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const hero = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Bard',
    draftSelectionsFrom(
      {
        ...(troubadourLedger.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Bard',
      },
      definitions,
    ),
  );
  // Appeal to the Muses is a level-2 feature; the engine reads only the evaluated level.
  await t.run(async ctx => {
    const doc = (await ctx.db.get(hero))!;
    const baseline = doc.derivedBaseline as { level: { value: number } };
    await ctx.db.patch(hero, {
      derivedBaseline: { ...baseline, level: { ...baseline.level, value: 2 } },
    });
  });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `troubadour-resource-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `troubadour-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${hero}}`;
  const drama = async () => (await t.run(ctx => ctx.db.get(hero)))!.liveState!.heroicResource;
  const malice = async () => (await t.run(ctx => ctx.db.get(f.campaignId)))!.malice ?? 0;
  const thorn = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!;
  const winded = ((await thorn()).derivedBaseline as { windedValue: { value: number } }).windedValue
    .value;
  const strikeThorn = () =>
    command(`@{foe:${goblin}} /ability use ability="Free Strike" targets=[@Thorn]`);

  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');

  // Appeal and roll a 1: 1 + 1 drama; the Director gains 1d3 (here 2) Malice.
  await command(`${ref} /resource pray`, true);
  const maliceBefore = await malice();
  await position(t, f.campaignId, [
    { sides: 3, face: 1 },
    { sides: 3, face: 2 },
  ]);
  await command(`${ref} /turn take`, true);
  expect(await drama()).toEqual({ name: 'drama', current: 2 });
  expect(await malice()).toBe(maliceBefore + 2);

  // Thorn made winded by recorded damage: + 2, once per encounter.
  await command(`@Thorn /adjust temporary-stamina value=0`);
  await command(`@Thorn /adjust stamina value=${winded + 1}`);
  await strikeThorn();
  expect((await drama()).current).toBe(4);
  await command(`@Thorn /adjust stamina value=${winded + 1}`);
  await strikeThorn();
  expect((await drama()).current).toBe(4);

  // Thorn dies from recorded damage: + 10 (each death).
  await command(`@Thorn /adjust stamina value=${-winded + 1}`);
  await strikeThorn();
  expect((await drama()).current).toBe(14);

  // Claims: natural 19/20 each time; three heroes once per encounter.
  await command(`${ref} /resource claim trigger=troubadour-natural-roll`, true);
  await command(`${ref} /resource claim trigger=troubadour-natural-roll`, true);
  expect((await drama()).current).toBe(20);
  await command(`${ref} /resource claim trigger=troubadour-three-heroes`, true);
  await expect(
    command(`${ref} /resource claim trigger=troubadour-three-heroes`, true),
  ).rejects.toThrow(/already claimed/);
  expect((await drama()).current).toBe(22);

  // "If you are still dead after the encounter in which you died, you can't gain drama during future
  // encounters." The Troubadour dies, the encounter ends, and in the next one nothing is generated.
  const bardWinded = (
    (await t.run(ctx => ctx.db.get(hero)))!.derivedBaseline as { windedValue: { value: number } }
  ).windedValue.value;
  await command(`${ref} /adjust stamina value=${-bardWinded}`);
  await command('/combat end');
  await command('/combat victories amount=1 recipients=[]');
  await command('/combat finish');
  await command(`${ref} /adjust victories value=2`);
  await command('/combat start');
  await command('/combat commit');
  expect((await drama()).current).toBe(0);
  const registered = (await t.run(ctx => ctx.db.query('clockRegistrations').take(200))).filter(
    r =>
      (r.work as { kind: string; characterId?: string }).kind === 'heroic-resource' &&
      (r.work as { characterId?: string }).characterId === hero &&
      r.status === 'active',
  );
  expect(registered).toEqual([]);
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await expect(
    command(`${ref} /resource claim trigger=troubadour-natural-roll`, true),
  ).rejects.toThrow(/still dead/);
  await command(`@Thorn /adjust stamina value=${-winded + 1}`);
  await strikeThorn();
  expect((await drama()).current).toBe(0);
});
