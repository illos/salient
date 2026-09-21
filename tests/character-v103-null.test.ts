// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v103-null-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { nullAbilitySource } from '../shared/evaluate/nullAbilities.ts';
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
test('Null traditions derive source-ledger statistics, skills, costs and every granted action', () => {
  const target = evaluate(ledger.lowAgilityTarget as unknown as Selections);
  assert.equal(target.status, 'complete');
  assert.equal(target.baseline!.characteristics.A.value, -1);
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
    assert.equal(h.heroicResource.name.value, 'discipline');
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
        (ledger.embeddedDisciplineCosts as Record<string, number>)[name] ??
        (ledger.paidSourceCosts as Record<string, number>)[name] ??
        0;
      assert.deepEqual(a.cost, cost ? { resource: 'discipline', amount: cost } : undefined, name);
      if (nullAbilitySource(a)) {
        assert.ok(a.activationCondition, name);
        if (cost) assert.equal(nullAbilitySource(a)?.cost, `${cost} Discipline`);
      }
    }
  }
});
test('Null rejects kits, repeated signatures and foreign choices; edits prune tradition grants', () => {
  const defs = getDefinitions(1),
    first = witnesses[0]!.selections;
  for (const patch of [
    { 'kit.choice': 'Sniper' },
    { 'class.null.tradition': 'Berserker' },
    { 'class.null.signature-abilities': ['Dance of Blows'] },
    { 'class.null.signature-abilities': ['Dance of Blows', 'Dance of Blows'] },
    { 'class.null.augmentation': 'Prayer of Steel' },
  ] as Selections[])
    assert.notEqual(evaluate({ ...first, ...patch }).status, 'complete');
  assert.notEqual(evaluate(first, 2).status, 'complete');
  const changed = changeChoice(first, defs, 'class.null.tradition', 'Cryokinetic').selections;
  assert.equal(changed['class.null.tradition-skill.chronokinetic'], undefined);
  const h = evaluate(changed).partial!;
  assert.ok(h.abilities?.some(a => a.name === 'Cryokinetic Mastery: Grab'));
  assert.ok(!h.abilities?.some(a => a.name.startsWith('Chronokinetic Mastery:')));
  const density = evaluate(
    changeChoice(first, defs, 'class.null.augmentation', 'Density Augmentation').selections,
  ).baseline!;
  assert.equal(density.staminaMaximum.value, 27);
  assert.equal(density.recoveryValue.value, 9);
  assert.equal(
    density.abilityModifiers?.some(m => m.id === 'null.force-augmentation') ?? false,
    false,
  );
  const missing = { ...first };
  delete missing['class.null.ability-5'];
  assert.equal(evaluate(missing).status, 'incomplete');
  const other = changeChoice(first, defs, 'class.choice', 'Conduit').selections;
  assert.ok(!Object.keys(other).some(k => k.startsWith('class.null.')));
});
