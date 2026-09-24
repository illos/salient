// SPDX-License-Identifier: GPL-3.0-only
// V115 integration through registered operations: Field Arsenal signature bonuses, melee-or-ranged
// mode (use and correction), and a known slowed immunity. Thorn's Agility and immunity are set on
// the fixture baseline only to exercise the evaluated Nonstop fact (feature/trait/orc/nonstop.md).
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DerivedBaseline, EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import type { AbilityRollResult } from '../../shared/contracts/rollResolution';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, table, admitHero, type Backend } from './fixtures/table';
import tacticianLedger from '../fixtures/v94-tactician-expected.json' with { type: 'json' };
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';

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

async function setup(prefix: string) {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `${prefix}-${++sequence}`,
      text,
    });
  const read = async (event: Id<'events'>) =>
    (
      await f.director.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [event],
      })
    )[0]!;
  const payload = async (event: Id<'events'>) =>
    (await t.run(ctx => ctx.db.get(event)))!.payload as { data: { result: AbilityRollResult } };
  const fight = async () => {
    await command('/combat start');
    await command('/combat commit');
    await command('/combat roll', true);
    await command('/combat first side=heroes');
  };
  return { t, f, command, read, payload, fight };
}

const tactician = async (
  context: Awaited<ReturnType<typeof setup>>,
  name: string,
  changes: Record<string, unknown>,
  witness = 0,
) =>
  admitHero(
    context.t,
    context.f.player,
    context.f.director,
    context.f.campaignId,
    name,
    draftSelectionsFrom(
      {
        ...(tacticianLedger.witnesses[witness]!.selections as EvaluationInput['selections']),
        ...changes,
        'details.name': name,
      } as EvaluationInput['selections'],
      definitions,
    ),
  );

// feature/tactician/level-1/field-arsenal.md: Battle Grace (kit/martial-artist.md, 5/8/11 + M or
// A including Martial Artist's melee +2/+2/+2) with Mountain's +0/+0/+4 chosen is 3/6/13 + M or A.
// kit/rapid-fire.md Two Shot (4/6/8 including ranged +2/+2/+2) with Sniper's +0/+0/+4 (kit/sniper.md)
// chosen is 2/4/10. Dice 7 + 7 + 2 = 16 is tier 2 for both (Power Roll + Might or Agility).
test('V115: Field Arsenal replaces a kit signature’s printed bonus in live damage', async () => {
  const context = await setup('arsenal');
  const { f, command, read } = context;
  // Ledger witness 3 is Martial Artist + Mountain with Mountain's melee damage chosen.
  const grace = await tactician(context, 'Grace', {}, 2);
  // Rapid-Fire and Sniper share ranged damage and ranged distance (differing) plus equal speed and
  // disengage bonuses, so the two differing benefits each need an arsenal choice.
  const archer = await tactician(context, 'Archer', {
    'kit.choice': 'Rapid-Fire',
    'class.tactician.second-kit': 'Sniper',
    'class.tactician.arsenal.rangedDamage': 'Sniper',
    'class.tactician.arsenal.rangedDistance': 'Sniper',
  });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `arsenal-${++sequence}`,
  });
  await context.fight();
  for (const [hero, ability, constant, kitBonus] of [
    [grace, 'Battle Grace', 8, -2],
    [archer, 'Two Shot', 6, -2],
  ] as const) {
    await position(context.t, f.campaignId, [7, 7]);
    const used = await command(
      `@{character:${hero}} /ability use ability="${ability}" targets=[@{foe:${goblin}}]`,
      true,
    );
    const damage = (await read(used.eventId)).targets[0]!.outcome.damage!;
    expect(damage).toMatchObject({ tierConstant: constant, kitBonus });
    expect(damage.rolledDamage).toBe(constant + damage.damageCharacteristicValue + kitBonus);
  }
});

// rule/combat/distance.md, Melee or Ranged. Tactician witness 1: Shining Armor + Sniper (melee
// +2/+2/+2 from Shining Armor, ranged +0/+0/+4 from Sniper). Concussive Strike
// (feature/ability/tactician/level-1/concussive-strike.md) is a Melee-or-ranged weapon strike.
// Natural 19 is tier 3: ranged adds 4, melee would add 2. A double bane correction to tier 2 keeps
// the ranged mode, so its kit bonus becomes 0.
test('V115: a Melee-and-Ranged use needs a mode, persists it and corrections keep it', async () => {
  const context = await setup('modecheck');
  const { f, command, read, payload } = context;
  const hero = await tactician(context, 'Mode', {
    'class.tactician.ability-3': 'Concussive Strike',
  });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `modecheck-${++sequence}`,
  });
  await context.fight();
  const ref = `@{character:${hero}}`;
  await command(`${ref} /adjust heroic-resource value=9`);
  await expect(
    command(`${ref} /ability use ability="Concussive Strike" targets=[@{foe:${goblin}}]`, true),
  ).rejects.toThrow(/give mode=melee or mode=ranged/);
  await expect(
    command(`${ref} /ability use ability="Two Shot" targets=[@{foe:${goblin}}] mode=melee`, true),
  ).rejects.toThrow(/no mode|has no ability/);
  await position(context.t, f.campaignId, [10, 9]);
  const used = await command(
    `${ref} /ability use ability="Concussive Strike" targets=[@{foe:${goblin}}] mode=ranged`,
    true,
  );
  expect((await payload(used.eventId)).data.result.selectedMode).toBe('ranged');
  expect((await read(used.eventId)).targets[0]!.outcome.damage!.kitBonus).toBe(4);
  await command(`/ability correct event="${used.eventId}" target=@{foe:${goblin}} edges=0 banes=2`);
  const corrected = (await read(used.eventId)).targets[0]!.outcome;
  expect(corrected.tier).toBe(3); // natural 19 stays tier 3 (rule/dice/power-roll.md)
  expect(corrected.damage!.kitBonus).toBe(4);
});

// feature/trait/orc/nonstop.md: "You can't be made slowed." monster/dwarf/statblock/
// servitor-war-walker.md Stunning Blast (3 Malice, Power Roll + 2, each enemy in the area): tier 3
// "7 lightning damage; A < 2 slowed (save ends)". Goblin Cursespitter A 1 is the susceptible control.
test('V115: a known slowed immunity blocks the condition, not the damage, through correction', async () => {
  const context = await setup('immune');
  const { t, f, command, read } = context;
  await t.run(async ctx => {
    const hero = (await ctx.db.get(f.thornId))!;
    const baseline = hero.derivedBaseline as DerivedBaseline;
    await ctx.db.patch(f.thornId, {
      derivedBaseline: {
        ...baseline,
        characteristics: {
          ...baseline.characteristics,
          A: { ...baseline.characteristics.A, value: -1 },
        },
        conditionImmunities: [
          { condition: 'slowed', provenance: baseline.characteristics.A.provenance[0]! },
        ],
      },
    });
  });
  const add = (slug: string) =>
    f.director.client.mutation(api.foes.add, {
      campaignId: f.campaignId,
      definitionId: `mcdm.monsters.v1/monster.${slug}`,
      commandId: `immune-${++sequence}`,
    });
  const walker = await add('dwarf.statblock/servitor-war-walker');
  const spitter = await add('goblin.statblock/goblin-cursespitter');
  await context.fight();
  await command('/adjust malice value=6');
  const thornLive = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  const before = (await thornLive()).stamina;
  await position(t, f.campaignId, [10, 9]);
  const used = await command(
    `@{foe:${walker}} /ability use ability="Stunning Blast" targets=[@Thorn,@{foe:${spitter}}]`,
  );
  const conditions = () =>
    read(used.eventId).then(r =>
      (r.compiled as PublicCompiledResult).effects
        .filter(o => o.effect.kind === 'condition')
        .map(o => [o.effect.targetId, o.effect.kind === 'condition' && o.effect.status]),
    );
  expect(await conditions()).toEqual([
    [f.thornId, 'immune'],
    [spitter, 'applied'],
  ]);
  const thorn = await thornLive();
  expect(thorn.stamina).toBe(before - 7);
  expect(thorn.conditions.slowed).toBe(false);
  expect(thorn.conditionInstances ?? []).toEqual([]);
  expect((await t.run(ctx => ctx.db.get(spitter)))!.live.conditions!.slowed).toBe(true);
  await command(`/ability correct event="${used.eventId}" target=@Thorn edges=1 banes=0`);
  expect((await conditions())[0]).toEqual([f.thornId, 'immune']);
  expect((await thornLive()).conditions.slowed).toBe(false);
});
