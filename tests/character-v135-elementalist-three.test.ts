// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v104-elementalist-expected.json' with { type: 'json' };
import ledger from './fixtures/v135-elementalist-three-expected.json' with { type: 'json' };
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
/** Named specialization features; the ledger's structural rows are headings. */
const named = [
  'Disciple of Earth',
  'Disciple of Fire',
  'Disciple of the Green',
  'There Is No Space Between',
  'Earth Accepts Me',
  'A Conversation With Fire',
  'Remember Growth and Sun and Rain',
  'Distance Is Only Memory',
];
/** Source clauses granted as separate uses (feature/elementalist/level-2/3, level-2/3 abilities). */
const embedded: Record<string, string[]> = {
  'Disciple of Fire': ['Disciple of Fire: Encounter Surges'],
  'Disciple of the Green': ['Disciple of the Green: Animal Form', 'Disciple of the Green: Revert'],
  'A Conversation With Fire': ['A Conversation With Fire: Speak'],
  'Distance Is Only Memory': ['Distance Is Only Memory: Open Portal'],
  'O Flower Aid, O Earth Defend': ['O Flower Aid, O Earth Defend: Persistent Effect'],
  'Swarm of Spirits': ['Swarm of Spirits: Persistent Effect'],
  'Wall of Fire': ['Wall of Fire: Persistent Effect'],
  // Level-1 persistent upkeep already modelled for the level-1 alternative (V104).
  Conflagration: ['Conflagration: Persistent Effect'],
};
const cases = Object.entries(ledger.witnesses).map(([id, w]) => {
  const base = levelOne.witnesses.find(b => b.id === w.base)!;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.elementalist.level-2.perk': w.levelTwo.addedSelections.perk,
    'class.elementalist.level-2.ability-5': w.levelTwo.addedSelections.ability5,
  };
  const l3: Selections = {
    ...l2,
    'class.elementalist.level-3.ability-7': w.levelThree.addedSelections.ability7,
  };
  return { id, w, base, l2, l3 };
});

test('Elementalist levels two and three match the independent ledger for every specialization', () => {
  for (const { id, w, base, l2, l3 } of cases)
    for (const [level, selections, expected] of [
      [2, l2, w.levelTwo],
      [3, l3, w.levelThree],
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
      const abilities = [
        ...w.levelTwo.addedAbilities,
        ...(level === 3 ? w.levelThree.addedAbilities : []),
      ];
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
      const added = [...new Set([...features, ...abilities])].flatMap(name => embedded[name] ?? []);
      assert.deepEqual(
        sorted(
          hero.abilities
            .filter(a => a.provenance.decisionId !== 'class.elementalist.level-2.perk')
            .map(a => a.name),
        ),
        sorted([...base.expected.abilities, ...new Set(abilities), ...added]),
        `${label} abilities`,
      );
      for (const [name, amount] of [
        [w.levelTwo.addedSelections.ability5, 5],
        ...(level === 3 ? [[w.levelThree.addedSelections.ability7, 7] as const] : []),
      ] as const)
        assert.deepEqual(
          hero.abilities.find(a => a.name === name && a.provenance.decisionId.includes('level-'))!
            .cost,
          { resource: 'essence', amount },
          `${label} ${name}`,
        );
    }
});

test('the level-two perk offers exactly the source crafting, lore and supernatural perks', () => {
  const perk = getDefinitions(2)
    .steps.flatMap(step => step.decisions)
    .find(d => d.id === 'class.elementalist.level-2.perk')!;
  assert.deepEqual(
    sorted(perk.options!.map(o => o.value)),
    sorted(
      Object.values(ledger.levelTwo.eligibleCorePerks)
        .flat()
        .map(p => (typeof p === 'string' ? p : p.name)),
    ),
  );
});

test('a level-1 5-Essence pick cannot repeat; level and specialization edits prune dependents', () => {
  for (const example of ledger.invalidExamples) {
    const c = cases.find(k => k.id === example.witness)!;
    const result = evaluate(
      { ...c.l2, 'class.elementalist.level-2.ability-5': example.selection.ability5 },
      2,
    );
    assert.equal(result.status, 'invalid', example.id);
    assert.ok(
      result.diagnostics['class.elementalist.level-2.ability-5']!.some(
        d => d.code === 'value-not-in-pool',
      ),
    );
  }
  const fire = cases.find(c => c.id === 'v104-1')!;
  const down = changeLevel(fire.l3, getDefinitions(3), getDefinitions(1));
  assert.ok(down.removed.includes('class.elementalist.level-2.ability-5'));
  assert.deepEqual(evaluate(down.selections, 1).baseline!.damageImmunities ?? [], []);
  const earth = cases.find(c => c.id === 'v104-2')!;
  const swapped = changeChoice(
    earth.l3,
    getDefinitions(3),
    'class.elementalist.specialization',
    'Void',
  );
  const after = evaluate(swapped.selections, 3);
  const features = (after.baseline ?? after.partial)?.features;
  assert.ok(features);
  assert.ok(!features.some(f => f.name === 'Disciple of Earth'));
  assert.ok(features.some(f => f.name === 'There Is No Space Between'));
  assert.equal(
    swapped.selections['class.elementalist.level-2.perk'],
    earth.l3['class.elementalist.level-2.perk'],
  );
});
