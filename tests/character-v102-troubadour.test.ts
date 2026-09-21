// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v102-troubadour-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { troubadourAbilitySource } from '../shared/evaluate/troubadourAbilities.ts';
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
test('Troubadour acts derive source-ledger characteristics, kits, skills, costs and every granted action', () => {
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
    assert.equal(h.heroicResource.name.value, 'drama');
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
        (ledger.embeddedDramaCosts as Record<string, number>)[name] ??
        (ledger.paidSourceCosts as Record<string, number>)[name] ??
        0;
      assert.deepEqual(a.cost, cost ? { resource: 'drama', amount: cost } : undefined, name);
      if (troubadourAbilitySource(a)) {
        assert.ok(a.activationCondition, name);
        if (cost) assert.equal(troubadourAbilitySource(a)?.cost, `${cost} Drama`);
      }
    }
  }
});
test('Troubadour rejects foreign choices and higher levels, and prunes class-act grants on edits', () => {
  const defs = getDefinitions(1);
  const first = witnesses[0]!.selections;
  for (const patch of [
    { 'kit.choice': 'Boren' },
    { 'class.troubadour.class-act': 'Berserker' },
    { 'class.troubadour.signature-ability': 'Harsh Critic' },
  ] as Selections[])
    assert.notEqual(evaluate({ ...first, ...patch }).status, 'complete');
  assert.notEqual(evaluate(first, 2).status, 'complete');
  const changed = changeChoice(first, defs, 'class.troubadour.class-act', 'Duelist').selections;
  const h = evaluate(changed).baseline!;
  assert.ok(h.abilities.some(a => a.name === 'Star Power: Greater Speed'));
  assert.ok(
    !h.abilities.some(
      a => a.name.startsWith('Dramatic Monologue') || a.name.startsWith('Turnabout'),
    ),
  );
  const missing = { ...first };
  delete missing['class.troubadour.ability-5'];
  assert.equal(evaluate(missing).status, 'incomplete');
  const other = changeChoice(first, defs, 'class.choice', 'Conduit').selections;
  assert.ok(!Object.keys(other).some(k => k.startsWith('class.troubadour.')));
  assert.equal(other['kit.choice'], undefined);
});
