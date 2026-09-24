// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v101-fury-expected.json' with { type: 'json' };
import ledger from './fixtures/v114-fury-three-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { changeLevel } from '../shared/evaluate/levelTransition.ts';
import { supportsCurrentAdvancement } from '../shared/content/character-support.ts';
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
const sorted = (values: readonly string[]) => [...values].sort();

/** Ledger choices keyed by ability name; decision ids are the implementation's per-aspect ids. */
const abilityDecision: Record<string, string> = {
  Berserker: 'class.fury.level-2.aspect-ability',
  Reaver: 'class.fury.level-2.reaver-ability',
  Stormwight: 'class.fury.level-2.stormwight-ability',
};
/** Source clauses that are separate timed uses (Fury abilities/feature files at levels 2 and 3). */
const embedded: Record<string, string[]> = {
  'Unstoppable Force': ['Unstoppable Force: Charge With Ability'],
  'Tooth and Claw': ['Tooth and Claw: Adjacent Damage'],
  'Special Delivery': ['Special Delivery: Ally Free Strike'],
  'Apex Predator': ['Apex Predator: Pursue'],
  'You Are Already Dead': ['You Are Already Dead: Free Strike'],
};
const cases = ledger.witnesses.map(w => {
  const base = levelOne.witnesses.find(b => b.id === w.id)!;
  const two = w.levelTwo.addedSelections as Record<string, string>;
  const three = w.levelThree.addedSelections as Record<string, string>;
  const perk = two['class.fury.level-2.perk']!;
  const second = two['class.fury.level-2.aspect-ability']!;
  const seventh = three['class.fury.level-3.7-ferocity-ability']!;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.fury.level-2.perk': perk,
    [abilityDecision[w.subclass]!]: second,
  };
  return {
    w,
    base,
    perk,
    second,
    seventh,
    l2,
    l3: { ...l2, 'class.fury.level-3.ability-7': seventh },
  };
});
const embeddedOf = (names: readonly string[]) => names.flatMap(name => embedded[name] ?? []);

test('Fury levels two and three match the independent ledger for every aspect and Stormwight kit', () => {
  for (const { w, base, perk, second, seventh, l2, l3 } of cases)
    for (const [level, selections, expected, features, abilities] of [
      [2, l2, w.levelTwo, [w.levelTwo.addedFeatures[0]!], [second]],
      [
        3,
        l3,
        w.levelThree,
        [w.levelTwo.addedFeatures[0]!, ...w.levelThree.addedFeatures],
        [second, seventh],
      ],
    ] as const) {
      const result = evaluate(selections, level);
      const label = `${w.id} L${level}`;
      assert.equal(result.status, 'complete', `${label}: ${JSON.stringify(result.diagnostics)}`);
      const hero = result.baseline!;
      for (const field of [
        'level',
        'staminaMaximum',
        'recoveriesMaximum',
        'recoveryValue',
        'windedValue',
        'speed',
        'stability',
        'disengage',
      ] as const)
        assert.equal(hero[field].value, expected[field], `${label} ${field}`);
      assert.equal(hero.kit!.echelon.value, expected.echelon);
      for (const field of ['characteristics', 'potency'] as const)
        assert.deepEqual(
          Object.fromEntries(Object.entries(hero[field]).map(([k, v]) => [k, v.value])),
          expected[field],
          `${label} ${field}`,
        );
      assert.deepEqual(
        sorted(hero.features.map(f => f.name)),
        sorted([...base.expected.features, ...features]),
        `${label} features`,
      );
      for (const a of hero.abilities.filter(
        a => a.provenance.decisionId === 'class.fury.level-2.perk',
      ))
        assert.ok(a.name.startsWith(perk), `${label} perk action ${a.name}`);
      assert.ok(
        hero.perks.some(p => p.name === perk),
        `${label} perk ${perk}`,
      );
      assert.deepEqual(
        sorted(
          hero.abilities
            .filter(a => a.provenance.decisionId !== 'class.fury.level-2.perk')
            .map(a => a.name),
        ),
        sorted([
          ...base.expected.abilities,
          ...abilities,
          ...embeddedOf([...features, ...abilities]),
        ]),
        `${label} abilities`,
      );
      for (const [name, amount] of [
        [second, 5],
        [seventh, 7],
      ] as const)
        if (abilities.includes(name))
          assert.deepEqual(hero.abilities.find(a => a.name === name)!.cost, {
            resource: 'ferocity',
            amount,
          });
      assert.equal(
        hero.staminaMaximum.provenance.filter(p =>
          /^class\.fury\.level-[23]\.stamina$/.test(p.decisionId),
        ).length,
        level - 1,
      );
    }
});

test('aspect ability pools are exclusive, level edits prune only higher-level choices', () => {
  const reaver = cases.find(c => c.w.subclass === 'Reaver')!;
  // A Berserker ability is not in the Reaver pool.
  const foreign = evaluate(
    { ...reaver.l2, 'class.fury.level-2.reaver-ability': 'Wrecking Ball' },
    2,
  );
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.fury.level-2.reaver-ability']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  const missing: Selections = { ...reaver.l3 };
  delete missing['class.fury.level-3.ability-7'];
  assert.equal(evaluate(missing, 3).status, 'incomplete');
  assert.equal(
    evaluate({ ...reaver.l3, 'class.fury.level-3.ability-7': 'Dancer' }, 3).status,
    'invalid',
  );
  // Speed bonus is Inescapable Wrath's; lowering to level one removes it with the level-2 choices.
  const down = changeLevel(reaver.l3, getDefinitions(3), getDefinitions(1));
  assert.ok(down.removed.includes('class.fury.level-3.ability-7'));
  assert.ok(down.removed.includes('class.fury.level-2.reaver-ability'));
  assert.equal(evaluate(down.selections, 1).baseline!.speed.value, reaver.base.expected.speed);
  const two = changeLevel(reaver.l3, getDefinitions(3), getDefinitions(2));
  assert.equal(two.selections['class.fury.level-2.reaver-ability'], reaver.second);
  assert.equal(evaluate(two.selections, 2).status, 'complete');
  // Changing aspect drops the aspect ability but keeps the perk and 7-Ferocity choice.
  const aspect = changeChoice(reaver.l3, getDefinitions(3), 'class.fury.aspect', 'Berserker');
  assert.ok(!aspect.selections['class.fury.level-2.reaver-ability']);
  assert.equal(aspect.selections['class.fury.level-2.perk'], reaver.perk);
  assert.equal(aspect.selections['class.fury.level-3.ability-7'], reaver.seventh);
  const berserker = evaluate(aspect.selections, 3);
  assert.notEqual(berserker.status, 'complete');
  assert.ok(!berserker.partial?.features?.some(f => f.name === 'Inescapable Wrath'));
  // Guided advancement stays the V32 Berserker 1→2 transition.
  assert.equal(supportsCurrentAdvancement(1, 'Fury', 'Reaver'), false);
  assert.equal(supportsCurrentAdvancement(2, 'Fury', 'Berserker'), false);
});
