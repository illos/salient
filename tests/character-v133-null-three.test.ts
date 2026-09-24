// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v103-null-expected.json' with { type: 'json' };
import ledger from './fixtures/v133-null-three-expected.json' with { type: 'json' };
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
/** Named tradition/level features; the ledger's structural rows are headings. */
const named = [
  'Rapid Processing',
  'Entropic Adaptability',
  'Inertial Sink',
  'Psionic Leap',
  'Reorder',
];
/** Source clauses granted as separate uses (feature/null/level-2/3, level-2/3 abilities). */
const embedded: Record<string, string[]> = {
  'Rapid Processing': ['Rapid Processing: Read', 'Rapid Processing: Extra Respite Activity'],
  Reorder: ['Reorder: End Effect'],
  Blur: ['Blur: Use Ability'],
  'Heat Sink': ['Heat Sink: End-of-Turn Cold'],
  'Stabilizing Field': ['Stabilizing Field: End Effect'],
};
const paid: Record<string, number> = {};
const cases = Object.entries(ledger.witnesses).map(([id, w]) => {
  const base = levelOne.witnesses.find(b => b.id === w.base)!;
  const two = w.levelTwo.addedSelections;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.null.level-2.perk': two.perk,
    [`class.null.level-2.${w.tradition.toLowerCase()}-ability`]: two.traditionAbility,
  };
  const l3: Selections = {
    ...l2,
    'class.null.level-3.ability-7': w.levelThree.addedSelections.ability7,
  };
  return { id, w, base, l2, l3 };
});

test('Null levels two and three match the independent ledger for every tradition', () => {
  for (const { id, w, base, l2, l3 } of cases)
    for (const [level, selections, expected, abilities] of [
      [2, l2, w.levelTwo, [w.levelTwo.addedSelections.traditionAbility]],
      [
        3,
        l3,
        w.levelThree,
        [w.levelTwo.addedSelections.traditionAbility, w.levelThree.addedSelections.ability7],
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
      assert.deepEqual(
        (hero.damageImmunities ?? []).map(i => ({
          damageType: i.damageType,
          value: i.value.value,
        })),
        expected.damageImmunities,
        `${label} immunities`,
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
            .filter(a => a.provenance.decisionId !== 'class.null.level-2.perk')
            .map(a => a.name),
        ),
        sorted([...base.expected.abilities, ...abilities, ...added]),
        `${label} abilities`,
      );
      for (const name of abilities)
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          {
            resource: 'discipline',
            amount: (ledger.abilities as Record<string, { cost: { amount: number } }>)[name]!.cost
              .amount,
          },
          `${label} ${name} cost`,
        );
      for (const name of added)
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          paid[name] ? { resource: 'discipline', amount: paid[name] } : undefined,
          `${label} ${name} cost`,
        );
    }
});

test('the level-two perk offers exactly the source exploration, interpersonal and intrigue perks', () => {
  const perk = getDefinitions(2)
    .steps.flatMap(step => step.decisions)
    .find(d => d.id === 'class.null.level-2.perk')!;
  assert.deepEqual(
    sorted(perk.options!.map(o => o.value)),
    sorted(
      Object.values(ledger.levelTwo.eligibleCorePerks)
        .flat()
        .map(p => (typeof p === 'string' ? p : p.name))
        // The ledger drops Teamwork only because every base holds it; Q-FURY-2's interim reading
        // (docs/rules-questions-for-user.md) keeps held perks selectable.
        .concat('Teamwork'),
    ),
  );
});

test('tradition pools are exclusive; level and tradition edits prune only dependent choices', () => {
  const cryo = cases.find(c => c.id === 'v103-2')!;
  const foreign = evaluate({ ...cryo.l2, 'class.null.level-2.cryokinetic-ability': 'Blur' }, 2);
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.null.level-2.cryokinetic-ability']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  const missing: Selections = { ...cryo.l3 };
  delete missing['class.null.level-3.ability-7'];
  assert.equal(evaluate(missing, 3).status, 'incomplete');
  const down = changeLevel(cryo.l3, getDefinitions(3), getDefinitions(1));
  assert.ok(down.removed.includes('class.null.level-2.cryokinetic-ability'));
  const one = evaluate(down.selections, 1).baseline!;
  assert.deepEqual(one.damageImmunities ?? [], []);
  const tradition = changeChoice(cryo.l3, getDefinitions(3), 'class.null.tradition', 'Metakinetic');
  assert.ok(!tradition.selections['class.null.level-2.cryokinetic-ability']);
  assert.equal(tradition.selections['class.null.level-2.perk'], cryo.l3['class.null.level-2.perk']);
  const meta = evaluate(tradition.selections, 3);
  assert.notEqual(meta.status, 'complete');
  assert.ok(!meta.partial?.features?.some(f => f.name === 'Entropic Adaptability'));
});
