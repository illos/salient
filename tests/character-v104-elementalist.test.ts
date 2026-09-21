// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v104-elementalist-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { elementalistAbilitySource } from '../shared/evaluate/elementalistAbilities.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const evaluate = (selections: Selections, level = 1) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: ledger.compendiumRevision,
      level,
      selections,
    },
    getDefinitions(level),
  );
const witnesses = ledger.witnesses.map(w => ({
  ...w,
  selections: w.selections as unknown as Selections,
}));
const sorted = (values: readonly string[]) => [...values].sort();
test('Elementalist traditions derive source-ledger statistics, skills, costs and every granted action', () => {
  const target = evaluate(ledger.lowReasonTarget as unknown as Selections);
  assert.equal(target.status, 'complete');
  assert.equal(target.baseline!.characteristics.R.value, -1);
  for (const w of witnesses) {
    const r = evaluate(w.selections);
    assert.equal(r.status, 'complete', `${w.id}: ${JSON.stringify(r.diagnostics)}`);
    const h = r.baseline!;
    for (const k of [
      'level',
      'subclass',
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'disengage',
      'savingThrowThreshold',
    ] as const)
      assert.equal(h[k].value, w.expected[k], `${w.id} ${k}`);
    assert.equal(h.kit, null);
    assert.equal(h.heroicResource.name.value, 'essence');
    for (const k of ['characteristics', 'potency'] as const)
      assert.deepEqual(
        Object.fromEntries(Object.entries(h[k]).map(([name, value]) => [name, value.value])),
        w.expected[k],
      );
    for (const k of ['skills', 'features', 'abilities'] as const)
      assert.deepEqual(sorted(h[k].map(x => x.name)), sorted(w.expected[k]), `${w.id} ${k}`);
    for (const name of w.classActions) {
      const a = h.abilities.find(a => a.name === name)!;
      const cost =
        (ledger.embeddedEssenceCosts as Record<string, number>)[name] ??
        (ledger.paidSourceCosts as Record<string, number>)[name] ??
        0;
      assert.deepEqual(a.cost, cost ? { resource: 'essence', amount: cost } : undefined, name);
      if (elementalistAbilitySource(a)) {
        assert.ok(a.activationCondition, name);
        if (cost) assert.equal(elementalistAbilitySource(a)?.cost, `${cost} Essence`);
      }
    }
  }
});
test('Elementalist prunes specialization grants and recalculates enchantments without granting a kit', () => {
  const defs = getDefinitions(1),
    first = witnesses[0]!.selections;
  for (const patch of [
    { 'kit.choice': 'Sniper' },
    { 'class.elementalist.specialization': 'Air' },
    { 'class.elementalist.signature-abilities': ['Viscous Fire', 'Viscous Fire'] },
  ])
    assert.notEqual(evaluate({ ...first, ...patch } as unknown as Selections).status, 'complete');
  const changed = changeChoice(
    first,
    defs,
    'class.elementalist.specialization',
    'Green',
  ).selections;
  const h = evaluate(changed).baseline!;
  assert.ok(h.abilities.some(a => a.name === 'Breath of Dawn Remembered: Additional Recovery'));
  assert.ok(!h.abilities.some(a => a.name.startsWith('Explosive Assistance')));
  const permanence = evaluate(
    changeChoice(first, defs, 'class.elementalist.enchantment', 'Enchantment of Permanence')
      .selections,
  ).baseline!;
  assert.equal(permanence.staminaMaximum.value, 24);
  assert.equal(permanence.recoveryValue.value, 8);
  assert.equal(
    permanence.abilityModifiers?.some(m => m.id === 'elementalist.enchantment-of-destruction') ??
      false,
    false,
  );
  const missing = { ...first };
  delete missing['class.elementalist.ability-5'];
  assert.equal(evaluate(missing).status, 'incomplete');
  const other = changeChoice(first, defs, 'class.choice', 'Null').selections;
  assert.ok(!Object.keys(other).some(k => k.startsWith('class.elementalist.')));
});
