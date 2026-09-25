// SPDX-License-Identifier: GPL-3.0-only
/**
 * V178 damage immunity and weakness through the registered operations, with persisted readback and
 * Convex's transaction limits enforced. Expected values come from the pinned Compendium
 * (en/unified/md) and the reviewed ledgers, never from a run of the code under test:
 * - monster/undead/2nd-echelon/statblock/mummy.md: Stamina 50, "Corruption 4, poison 4" Immunity,
 *   "Fire 5" Weakness.
 * - monster/undead/1st-echelon/statblock/decrepit-skeleton.md: a Minion, Stamina 3, "Corruption 1,
 *   poison 1" Immunity. Four make a squad pool of 12 (chapter/monster-basics.md).
 * - monster/goblin/statblock/goblin-warrior.md: Free Strike 1 (untyped).
 * - feature/trait/revenant/tough-but-withered.md: "you have fire weakness 5".
 * - complication/rogue-talent.md: "Drawback: You have psychic weakness 5."
 * - feature/ability/talent/level-1/mind-spike.md: "Strained: The target takes an extra 2 psychic
 *   damage. You also take 2 psychic damage that can't be reduced in any way." Q-STRAIN-1 (answered):
 *   immunity is skipped, weakness still adds.
 * - tests/fixtures/v104-elementalist-expected.json v104-1: Hurl Element damage by tier (poison
 *   5/7/9, fire 6/8/10). Dice 7 + 6 + Reason 2 = 15 is tier 2 (rule/dice/power-roll.md).
 * - tests/fixtures/v105-talent-expected.json v105-2: Mind Spike 4 at tier 1, strained 6.
 * - rule/damage/damage-immunity.md, damage-weakness.md: typed entries apply to damage "of the
 *   indicated type"; weakness first, then immunity.
 */
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { readFileSync } from 'node:fs';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import type { EvaluationInput, SelectionValue } from '../../shared/contracts/characterEvaluation';
import type { CompiledResult } from '../../shared/contracts/compiledResult';
import type { DamageApplication } from '../../shared/contracts/rollResolution';
import { definitions } from '../../shared/content/level-one-decisions';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import elementalistLedger from '../fixtures/v104-elementalist-expected.json' with { type: 'json' };
import talentLedger from '../fixtures/v105-talent-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');
const MUMMY = 'mcdm.monsters.v1/monster.undead.2nd-echelon.statblock/mummy';
const SKELETON = 'mcdm.monsters.v1/monster.undead.1st-echelon.statblock/decrepit-skeleton';
const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

async function atDice(t: Backend, campaignId: Id<'campaigns'>, faces: [number, number]) {
  await t.run(async ctx => {
    let state = await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique();
    if (!state) {
      const seed = crypto.getRandomValues(new Uint8Array(32));
      const id = await ctx.db.insert('diceStates', {
        campaignId,
        seed: [...seed].map(b => b.toString(16).padStart(2, '0')).join(''),
        counter: 0,
      });
      state = (await ctx.db.get(id))!;
    }
    const seed = fromHex(state.seed);
    const spec = [
      { id: 'd10a', sides: 10 },
      { id: 'd10b', sides: 10 },
    ];
    for (let counter = state.counter; counter < state.counter + 100000; counter++) {
      const out = generate(seed, counter, spec);
      if (out.dice[0]!.value === faces[0] && out.dice[1]!.value === faces[1]) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('Fixture dice position not found');
  });
}

/** A level 1 Revenant (the remaining-ancestries fixture's Fury with the ancestry replaced). */
function revenant(extra: Record<string, SelectionValue> = {}) {
  const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
    selections: Record<string, SelectionValue>;
  };
  for (const key of Object.keys(fixture.selections))
    if (key.startsWith('ancestry.')) delete fixture.selections[key];
  return draftSelectionsFrom(
    {
      ...fixture.selections,
      'details.name': 'Ghost',
      'ancestry.choice': 'Revenant',
      'ancestry.revenant.former-life': 'Memonek',
      'ancestry.revenant.memonek.purchased-traits': ['Keeper of Order'],
      ...extra,
    },
    getDefinitions(1),
  );
}

const witness = elementalistLedger.witnesses[0]!;
const byTier = (name: string) => witness.rolledActions.find(a => a.name === name)!.damageByTier;

let sequence = 0;
async function setup() {
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Mage',
    draftSelectionsFrom(
      {
        ...(witness.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Mage',
      },
      definitions,
    ),
  );
  const command = (text: string, client = f.director.client) =>
    client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `immunity-weakness-${++sequence}`,
      text,
    });
  const addFoe = (definitionId: string) =>
    f.director.client.mutation(api.foes.add, {
      campaignId: f.campaignId,
      definitionId,
      commandId: `immunity-weakness-${++sequence}`,
    });
  const hurl = (type: string, target: string) =>
    command(
      `@Mage /ability use ability="Hurl Element" targets=[${target}] damage-type=${type}`,
      f.player.client,
    );
  const applied = async (eventId: Id<'events'>) =>
    t.run(async ctx => {
      const result = await ctx.db
        .query('abilityResults')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .unique();
      if (result) return result.targets[0]!.applied as DamageApplication;
      const event = await ctx.db.get(eventId);
      return (event!.payload as { data: { damage: { application: DamageApplication }[] } }).data
        .damage[0]!.application;
    });
  return { t, f, command, addFoe, hurl, applied };
}

test('V178: a foe’s printed immunity and weakness apply to typed damage, not to untyped', async () => {
  const s = await setup();
  const mummy = await s.addFoe(MUMMY);
  const goblin = await s.addFoe(GOBLIN);
  const stamina = async () => (await s.t.run(ctx => ctx.db.get(mummy)))!.live.stamina;

  // Poison immunity 4: tier 2 poison 7 − 4.
  await atDice(s.t, s.f.campaignId, [7, 6]);
  const poison = await s.hurl('poison', `@{foe:${mummy}}`);
  expect(await s.applied(poison.eventId)).toMatchObject({
    incoming: byTier('Hurl Element: Poison')[1],
    weaknessApplied: 0,
    immunityApplied: 4,
  });
  expect(await stamina()).toBe(50 - (byTier('Hurl Element: Poison')[1]! - 4));

  // Fire weakness 5: tier 2 fire 8 + 5.
  await s.command(`@{foe:${mummy}} /adjust stamina value=50`);
  await atDice(s.t, s.f.campaignId, [7, 6]);
  const fire = await s.hurl('fire', `@{foe:${mummy}}`);
  expect(await s.applied(fire.eventId)).toMatchObject({ weaknessApplied: 5, immunityApplied: 0 });
  expect(await stamina()).toBe(50 - (byTier('Hurl Element: Fire')[1]! + 5));

  // Untyped: the goblin's free strike 1 meets neither cell.
  await s.command(`@{foe:${mummy}} /adjust stamina value=50`);
  const strike = await s.command(
    `@{foe:${goblin}} /ability use ability="Free Strike" targets=[@{foe:${mummy}}]`,
  );
  expect(await s.applied(strike.eventId)).toMatchObject({
    incoming: 1,
    weaknessApplied: 0,
    immunityApplied: 0,
  });
  expect(await stamina()).toBe(49);

  // A correction reuses the saved facts: tier 3 poison 9 − 4 from 50.
  await s.command(`@{foe:${mummy}} /adjust stamina value=50`);
  await atDice(s.t, s.f.campaignId, [7, 6]);
  const corrected = await s.hurl('poison', `@{foe:${mummy}}`);
  await s.command(
    `/ability correct event="${corrected.eventId}" target=@{foe:${mummy}} edges=1 banes=0`,
  );
  expect(await stamina()).toBe(50 - (byTier('Hurl Element: Poison')[2]! - 4));
});

test('V178: a squad member’s printed immunity reduces the damage its pool takes', async () => {
  const s = await setup();
  await s.command(`/squad add definition="${SKELETON}" count=4`);
  const squad = (await s.f.director.client.query(api.table.roster, { campaignId: s.f.campaignId }))
    .squads[0]!;
  expect((await s.t.run(ctx => ctx.db.get(squad.id as Id<'squads'>)))!.pool).toBe(12);
  await atDice(s.t, s.f.campaignId, [7, 6]);
  const hit = await s.hurl('poison', `@{foe:${squad.memberIds[0]}}`);
  expect(await s.applied(hit.eventId)).toMatchObject({ immunityApplied: 1 });
  expect((await s.t.run(ctx => ctx.db.get(squad.id as Id<'squads'>)))!.pool).toBe(
    12 - (byTier('Hurl Element: Poison')[1]! - 1),
  );
});

test('V178: a Revenant takes fire weakness 5 on fire damage', async () => {
  const s = await setup();
  const ghost = (await admitHero(
    s.t,
    s.f.player,
    s.f.director,
    s.f.campaignId,
    'Ghost',
    revenant(),
  )) as Id<'characters'>;
  await s.command('@Ghost /adjust stamina value=20');
  await atDice(s.t, s.f.campaignId, [7, 6]);
  const fire = await s.hurl('fire', '@Ghost');
  expect(await s.applied(fire.eventId)).toMatchObject({
    incoming: byTier('Hurl Element: Fire')[1],
    weaknessApplied: 5,
    immunityApplied: 0,
  });
  expect((await s.t.run(ctx => ctx.db.get(ghost)))!.liveState!.stamina).toBe(
    20 - (byTier('Hurl Element: Fire')[1]! + 5),
  );
});

test('V178: a strained Mind Spike’s unreducible 2 psychic takes the Rogue Talent’s weakness 5', async () => {
  const s = await setup();
  const seer = await admitHero(
    s.t,
    s.f.player,
    s.f.director,
    s.f.campaignId,
    'Seer',
    draftSelectionsFrom(
      {
        ...(talentLedger.witnesses.find(w => w.id === 'v105-2')!
          .selections as unknown as EvaluationInput['selections']),
        'details.name': 'Seer',
        'complication.choice': 'Rogue Talent',
      },
      definitions,
    ),
  );
  const goblin = await s.addFoe(GOBLIN);
  const ref = `@{character:${seer}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command(`${ref} /adjust heroic-resource value=-1`);
  await s.command(`${ref} /adjust temporary-stamina value=0`);
  const before = (await s.t.run(ctx => ctx.db.get(seer)))!.liveState!.stamina;
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const used = await s.command(
    `${ref} /ability use ability="Mind Spike" targets=[@{foe:${goblin}}]`,
  );
  // The goblin has no cells: 4 + 2 strained. The Talent: 2 psychic + weakness 5.
  expect((await s.t.run(ctx => ctx.db.get(goblin)))!.live.stamina).toBe(15 - 6);
  expect((await s.t.run(ctx => ctx.db.get(seer)))!.liveState!.stamina).toBe(before - 7);
  const section = await s.t.run(async ctx => {
    const result = await ctx.db
      .query('abilityResults')
      .withIndex('by_event', q => q.eq('eventId', used.eventId))
      .unique();
    return (result!.compiled as CompiledResult).effects.find(o => o.effect.kind === 'strained')!
      .effect;
  });
  expect(section).toMatchObject({
    status: 'applied',
    selfApplication: { incoming: 2, weaknessApplied: 5, immunityApplied: 0, afterImmunity: 7 },
  });
});

test('V178 review: features that change immunity or weakness during play keep damage manual', async () => {
  const s = await setup();
  // monster/count-rhodar-von-glauer: Grave Ward, "Rhodar has damage immunity 5. If he takes holy
  // damage, he loses this immunity until the end of the round."
  const rhodar = await s.addFoe(
    'mcdm.monsters.v1/monster.count-rhodar-von-glauer.statblock/count-rhodar-von-glauer',
  );
  const before = (await s.t.run(ctx => ctx.db.get(rhodar)))!.live.stamina;
  await atDice(s.t, s.f.campaignId, [7, 6]);
  const hit = await s.hurl('fire', `@{foe:${rhodar}}`);
  const description = (await s.t.run(ctx => ctx.db.get(hit.eventId)))!.description;
  expect(description).toContain('Grave Ward and Sanguine Mist change its damage immunity');
  expect(description).toContain('damage is left for manual application');
  expect((await s.t.run(ctx => ctx.db.get(rhodar)))!.live.stamina).toBe(before);

  // complication/corrupted-mentor.md: "Each time you use Corrupt Spirit, your holy weakness
  // increases by 1".
  const mentor = (await admitHero(
    s.t,
    s.f.player,
    s.f.director,
    s.f.campaignId,
    'Ghost',
    revenant({ 'complication.choice': 'Corrupted Mentor' }),
  )) as Id<'characters'>;
  await s.command('@Ghost /adjust stamina value=20');
  await atDice(s.t, s.f.campaignId, [7, 6]);
  const fire = await s.hurl('fire', '@Ghost');
  expect((await s.t.run(ctx => ctx.db.get(fire.eventId)))!.description).toContain(
    'Corrupted Mentor changes their damage weakness during play',
  );
  expect((await s.t.run(ctx => ctx.db.get(mentor)))!.liveState!.stamina).toBe(20);
});
