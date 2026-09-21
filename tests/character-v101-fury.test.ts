// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v101-fury-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { furyAbilitySource } from '../shared/evaluate/furyAbilities.ts';
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
test('Fury aspects and four Stormwight kits derive printed true-form values and every granted action', () => {
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
    assert.equal(h.kit?.name.value, w.expected.kit);
    assert.equal(h.heroicResource.name.value, 'ferocity');
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
        (ledger.embeddedFerocityCosts as Record<string, number>)[name] ??
        (ledger.paidSourceCosts as Record<string, number>)[name] ??
        0;
      assert.deepEqual(a.cost, cost ? { resource: 'ferocity', amount: cost } : undefined, name);
      if (furyAbilitySource(a)) {
        assert.ok(a.activationCondition, name);
        if (cost) assert.equal(furyAbilitySource(a)?.cost, `${cost} Ferocity`);
      }
    }
  }
});
test('Fury aspect/kit edits prune incompatible grants, reject cross-kit choices and retain level-two limits', () => {
  const defs = getDefinitions(1);
  const boren = witnesses[2]!.selections;
  for (const patch of [
    { 'kit.choice': 'Mountain' },
    { 'class.fury.aspect': 'Reaver' },
    { 'class.fury.signature-ability': 'Lines of Force' },
  ] as Selections[])
    assert.notEqual(evaluate({ ...boren, ...patch }).status, 'complete');
  for (const w of witnesses.filter(w => w.expected.subclass !== 'Berserker'))
    assert.notEqual(evaluate(w.selections, 2).status, 'complete');
  const changed = changeChoice(boren, defs, 'class.fury.aspect', 'Reaver').selections;
  assert.equal(changed['kit.choice'], undefined);
  const h = evaluate(changed).partial!;
  assert.ok(!h.features?.some(f => f.name.startsWith('Boren:') || f.name === 'Beast Shape'));
  assert.ok(
    !h.abilities?.some(
      a =>
        a.name.includes('Shapeshift') || a.name === 'Aspect of the Wild' || a.name === 'Bear Claws',
    ),
  );
  assert.ok(h.abilities?.some(a => a.name === 'Unearthly Reflexes'));
  const corven = changeChoice(boren, defs, 'kit.choice', 'Corven').selections;
  const c = evaluate(corven).baseline!;
  assert.ok(c.abilities.some(a => a.name === 'Wing Buffet: Shift'));
  assert.ok(!c.abilities.some(a => a.name.startsWith('Boren:') || a.name === 'Bear Claws'));
  const other = changeChoice(boren, defs, 'class.choice', 'Conduit').selections;
  assert.ok(!Object.keys(other).some(k => k.startsWith('class.fury.')));
  assert.equal(other['kit.choice'], undefined);
});
