// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v138-summoner-three-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { changeLevel } from '../shared/evaluate/levelTransition.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const evaluate = (selections: Selections, level: number) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: ledger.compendiumRevision,
      level,
      selections,
    },
    getDefinitions(level),
  );
const src = (relative: string) => `en/unified/md/${relative}`;
/**
 * Manual notes this slice adds beyond the ledger's printed actions: the Summoner's Kit strike
 * change (feature/summoner/level-3/summoners-kit.md) and Howling Ward's aura
 * (feature/summoner/level-3/howling-ward.md), which the ledger lists as passive.
 */
const notes = (ward: string, ability7: string) => ({
  "Summoner: Summoner Strike: Summoner's Kit": 0,
  ...(ward === 'Howling Ward' ? { 'Summoner: Howling Ward': 0 } : {}),
  // essence-funnel.md Special: the minion sacrifice rider (V151 follow-up actions).
  ...(ability7 === 'Essence Funnel' ? { 'Summoner: Essence Funnel: Sacrifice minions': 0 } : {}),
});
const cases = ledger.witnesses.map(w => {
  const circle = w.circle.toLowerCase();
  const l1 = w.level1Selections as unknown as Selections;
  const l2: Selections = {
    ...l1,
    'class.summoner.level-2.perk': w.level2Selections['class.summoner.level-2.perk'],
    [`class.summoner.portfolio.${circle}.5`]: w.newPortfolioMinion.name,
  };
  const l3: Selections = {
    ...l2,
    'class.summoner.level-3.ward': w.level3Selections['class.summoner.level-3.ward'],
    'class.summoner.level-3.ability-7': w.level3Selections['class.summoner.level-3.ability-7'],
  };
  return { w, l1, l2, l3 };
});
/** Summoner records (V107 naming); a perk's own action is checked separately. */
const records = (selections: Selections, level: number) =>
  Object.fromEntries(
    evaluate(selections, level)
      .baseline!.abilities.filter(
        a =>
          a.provenance.decisionId.startsWith('class.summoner.') &&
          !a.provenance.decisionId.endsWith('.perk'),
      )
      .map(a => [a.name, a.cost?.amount ?? 0]),
  );
const added = (after: Record<string, number>, before: Record<string, number>) =>
  Object.fromEntries(Object.entries(after).filter(([name]) => !(name in before)));
const withoutPerk = (actions: Record<string, number | undefined>): Record<string, number> =>
  Object.fromEntries(
    Object.entries(actions).filter(
      (entry): entry is [string, number] =>
        !entry[0].startsWith('Perk: ') && entry[1] !== undefined,
    ),
  );

test('Summoner levels two and three match the independent ledger for every circle', () => {
  for (const { w, l1, l2, l3 } of cases) {
    const base = records(l1, 1);
    const two = records(l2, 2);
    for (const [level, selections, expected] of [
      [2, l2, w.level2],
      [3, l3, w.level3],
    ] as const) {
      const label = `${w.id} L${level}`;
      const result = evaluate(selections, level);
      assert.equal(result.status, 'complete', `${label}: ${JSON.stringify(result.diagnostics)}`);
      const hero = result.baseline!;
      for (const field of [
        'staminaMaximum',
        'recoveriesMaximum',
        'recoveryValue',
        'windedValue',
        'speed',
        'stability',
        'disengage',
      ] as const)
        assert.equal(hero[field].value, expected[field], `${label} ${field}`);
      const summoner = hero.summoner!;
      assert.equal(summoner.range, expected.summonersRange, label);
      const fixture = expected.dominionFixture;
      assert.deepEqual(
        summoner.fixture,
        {
          name: fixture.name,
          sourcePath: src(fixture.sourcePath),
          size: fixture.size,
          stamina: fixture.stamina,
          traits: fixture.baseTraits,
        },
        label,
      );
      const minion = summoner.portfolio.find(m => m.name === w.newPortfolioMinion.name);
      assert.ok(minion, label);
      assert.equal(minion.cost, w.newPortfolioMinion.cost);
      assert.equal(minion.summonCount, w.newPortfolioMinion.summonCount);
      assert.equal(minion.stamina, w.newPortfolioMinion.effective.stamina, label);
      assert.equal(minion.stability, w.newPortfolioMinion.effective.stability, label);
      assert.deepEqual(minion.traits, w.newPortfolioMinion.traits);
      const names = hero.features.map(f => f.name);
      for (const name of [
        "Summoner's Dominion",
        'New Portfolio Minion',
        fixture.name,
        w.newPortfolioMinion.name,
        ...(level === 3 ? ["Summoner's Kit", w.ward.name] : []),
      ])
        assert.ok(names.includes(name), `${label} feature ${name}`);
      if (level === 3) {
        const strike = w.level3.summonerStrike;
        assert.deepEqual(summoner.strike, {
          damage: strike.damage,
          potency: strike.potency,
          distance: strike.distanceValue,
        });
      } else assert.equal(summoner.strike, undefined);
    }
    assert.deepEqual(added(two, base), withoutPerk(w.actionsAddedAtLevel2), `${w.id} L2 records`);
    assert.deepEqual(
      added(records(l3, 3), two),
      { ...withoutPerk(w.actionsAddedAtLevel3), ...notes(w.ward.name, w.sevenEssenceAbility.name) },
      `${w.id} L3 records`,
    );
  }
});

test('a level-two perk that grants an action keeps it beside the manual records', () => {
  // perk/creature-sense.md: a sourced perk use (perk-abilities.ts), not a Summoner record.
  const c = cases.find(c => c.l2['class.summoner.level-2.perk'] === 'Creature Sense')!;
  assert.ok(evaluate(c.l2, 2).baseline!.abilities.some(a => a.name === 'Creature Sense'));
});

test('portfolio pools are exclusive; level and circle edits prune dependents', () => {
  const blight = cases.find(c => c.w.circle === 'Blight')!;
  const foreign = evaluate({ ...blight.l2, 'class.summoner.portfolio.blight.5': 'Phase Ghoul' }, 2);
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.summoner.portfolio.blight.5']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  const down = changeLevel(blight.l3, getDefinitions(3), getDefinitions(2));
  assert.ok(down.removed.includes('class.summoner.level-3.ward'));
  assert.ok(down.removed.includes('class.summoner.level-3.ability-7'));
  const two = evaluate(down.selections, 2).baseline!;
  assert.ok(!two.features.some(f => f.name === blight.w.ward.name));
  assert.equal(two.staminaMaximum.value, blight.w.level2.staminaMaximum);
  const graves = changeChoice(blight.l3, getDefinitions(3), 'class.summoner.circle', 'Graves');
  assert.ok(graves.removed.includes('class.summoner.portfolio.blight.5'));
  const after = evaluate(graves.selections, 3);
  const features = (after.baseline ?? after.partial)?.features;
  assert.ok(features);
  assert.ok(
    !features.some(f => f.name === 'The Boil' || f.name === blight.w.newPortfolioMinion.name),
  );
  assert.ok(features.some(f => f.name === 'Barrow Gates'));
});
