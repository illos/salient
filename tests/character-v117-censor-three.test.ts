// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v99-censor-expected.json' with { type: 'json' };
import ledger from './fixtures/v117-censor-three-expected.json' with { type: 'json' };
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
const sorted = (values: readonly string[]) => [...values].sort();
/** Named order/level features; the ledger's structural rows (Perk, Order Features) are headings. */
const named = [
  "Saint's Vigilance",
  'A Sense for Truth',
  'It Was Foretold',
  'Judge of Character',
  'Lead by Example',
  'Stalwart Icon',
  'Look On My Work and Despair',
];
/** Source clauses granted as separate uses (feature/censor/level-2/3, level-2 abilities). */
const embedded: Record<string, string[]> = {
  "Saint's Vigilance": ["Saint's Vigilance: Judgment"],
  'It Was Foretold': ['It Was Foretold: Opening Action', 'It Was Foretold: Montage Test'],
  'Look On My Work and Despair': [
    'Look On My Work and Despair: Frighten',
    'Look On My Work and Despair: Retarget Frighten',
  ],
  Revelator: ['Revelator: Judgment'],
  'With My Blessing': ['With My Blessing: Target Strike'],
};
/** look-on-my-work-and-despair.md: "you can spend 1 wrath". */
const paid: Record<string, number> = { 'Look On My Work and Despair: Frighten': 1 };
const cases = Object.entries(ledger.witnesses).map(([id, w]) => {
  const base = levelOne.witnesses.find(b => b.id === w.base)!;
  const two = w.levelTwo.addedSelections;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.censor.level-2.perk': two.perk,
    [`class.censor.level-2.${w.order.toLowerCase()}-ability`]: two.orderAbility,
  };
  const l3: Selections = {
    ...l2,
    'class.censor.level-3.ability-7': w.levelThree.addedSelections.ability7,
  };
  return { id, w, base, l2, l3 };
});

test('Censor levels two and three match the independent ledger for every order', () => {
  for (const { id, w, base, l2, l3 } of cases)
    for (const [level, selections, expected, abilities] of [
      [2, l2, w.levelTwo, [w.levelTwo.addedSelections.orderAbility]],
      [
        3,
        l3,
        w.levelThree,
        [w.levelTwo.addedSelections.orderAbility, w.levelThree.addedSelections.ability7],
      ],
    ] as const) {
      const label = `${id} L${level}`;
      const result = evaluate(selections, level);
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
      for (const field of ['characteristics', 'potency'] as const)
        assert.deepEqual(
          Object.fromEntries(Object.entries(hero[field]).map(([k, v]) => [k, v.value])),
          expected[field],
          `${label} ${field}`,
        );
      const features = [
        ...w.levelTwo.addedFeatures,
        ...(level === 3 ? w.levelThree.addedFeatures : []),
      ].filter(name => named.includes(name));
      assert.deepEqual(
        sorted(hero.features.map(f => f.name)),
        sorted([...base.expected.features, ...features]),
        `${label} features`,
      );
      assert.deepEqual(
        sorted(hero.perks.map(p => p.name)),
        sorted(expected.perks),
        `${label} perks`,
      );
      const added = [...features, ...abilities].flatMap(name => embedded[name] ?? []);
      assert.deepEqual(
        sorted(
          hero.abilities
            .filter(a => a.provenance.decisionId !== 'class.censor.level-2.perk')
            .map(a => a.name),
        ),
        sorted([...base.expected.abilities, ...abilities, ...added]),
        `${label} abilities`,
      );
      for (const name of abilities)
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          {
            resource: 'wrath',
            amount: (ledger.abilities as Record<string, { cost: { amount: number } }>)[name]!.cost
              .amount,
          },
          `${label} ${name} cost`,
        );
      for (const name of added)
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          paid[name] ? { resource: 'wrath', amount: paid[name] } : undefined,
          `${label} ${name} cost`,
        );
    }
});

test('the level-two perk offers exactly the source interpersonal, lore and supernatural perks', () => {
  const perk = getDefinitions(2)
    .steps.flatMap(step => step.decisions)
    .find(d => d.id === 'class.censor.level-2.perk')!;
  assert.deepEqual(
    sorted(perk.options!.map(o => o.value)),
    sorted(
      Object.values(ledger.levelTwo.eligibleCorePerks)
        .flat()
        .map(p => (typeof p === 'string' ? p : p.name)),
    ),
  );
});

test('order pools are exclusive; level and order edits prune only dependent choices', () => {
  const paragon = cases.find(c => c.id === 'v99-war')!;
  const foreign = evaluate(
    { ...paragon.l2, 'class.censor.level-2.paragon-ability': 'Revelator' },
    2,
  );
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.censor.level-2.paragon-ability']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  const missing: Selections = { ...paragon.l3 };
  delete missing['class.censor.level-3.ability-7'];
  assert.equal(evaluate(missing, 3).status, 'incomplete');
  const down = changeLevel(paragon.l3, getDefinitions(3), getDefinitions(2));
  assert.ok(down.removed.includes('class.censor.level-3.ability-7'));
  const two = evaluate(down.selections, 2).baseline!;
  assert.equal(two.staminaMaximum.value, paragon.w.levelTwo.staminaMaximum);
  assert.ok(!two.features.some(f => f.name === 'Look On My Work and Despair'));
  const order = changeChoice(paragon.l3, getDefinitions(3), 'class.censor.order', 'Oracle');
  assert.ok(!order.selections['class.censor.level-2.paragon-ability']);
  assert.equal(
    order.selections['class.censor.level-2.perk'],
    paragon.l3['class.censor.level-2.perk'],
  );
  const oracle = evaluate(order.selections, 3);
  assert.notEqual(oracle.status, 'complete');
  assert.ok(!oracle.partial?.features?.some(f => f.name === 'Lead by Example'));
});
