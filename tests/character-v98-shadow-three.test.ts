// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v98-shadow-three-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { changeLevel } from '../shared/evaluate/levelTransition.ts';
import { supportsCurrentAdvancement } from '../shared/content/character-support.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const evaluate = (selections: Selections, level = 3) =>
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
const first = witnesses[0]!;
const sorted = (a: readonly string[]) => [...a].sort();

test('Shadow level three retains earlier grants and adds sourced vitals and exactly one 7-Insight ability', () => {
  for (const witness of witnesses) {
    const result = evaluate(witness.selections);
    assert.equal(result.status, 'complete', `${witness.id}: ${JSON.stringify(result.diagnostics)}`);
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
      assert.equal(hero[field].value, witness.expected[field], `${witness.id} ${field}`);
    assert.deepEqual(
      Object.fromEntries(Object.entries(hero.characteristics).map(([k, v]) => [k, v.value])),
      witness.expected.characteristics,
    );
    assert.deepEqual(
      Object.fromEntries(Object.entries(hero.potency).map(([k, v]) => [k, v.value])),
      witness.expected.potency,
    );
    for (const field of ['features', 'perks', 'abilities', 'skills', 'languages'] as const)
      assert.deepEqual(
        sorted(hero[field].map(x => x.name)),
        sorted(witness.expected[field]),
        `${witness.id} ${field}`,
      );
    assert.deepEqual(hero.abilities.find(a => a.name === witness.newAbility)?.cost, {
      resource: 'insight',
      amount: 7,
    });
    assert.ok(
      hero.staminaMaximum.provenance.some(
        p => p.decisionId === 'class.shadow.level-3.stamina' && p.amount === 6,
      ),
    );
  }
});

test('level three rejects missing/foreign choices and prunes only unavailable higher-level choices', () => {
  const missing = { ...first.selections };
  delete missing[first.abilityDecision];
  assert.equal(evaluate(missing).status, 'incomplete');
  assert.equal(
    evaluate({ ...first.selections, [first.abilityDecision]: 'Too Slow' }).status,
    'invalid',
  );
  assert.notEqual(evaluate({ ...first.selections, 'class.choice': 'Fury' }).status, 'complete');
  assert.notEqual(evaluate(first.selections, 4).status, 'complete');
  const down = changeLevel(first.selections, getDefinitions(3), getDefinitions(2));
  assert.ok(down.removed.includes(first.abilityDecision));
  assert.equal(down.selections['class.shadow.level-2.burning-ash-ability'], 'In a Puff of Ash');
  const hero = evaluate(down.selections, 2).baseline!;
  assert.equal(hero.staminaMaximum.value, 27);
  assert.ok(
    !hero.abilities.some(a =>
      ['Dancer', 'Dancer: Disengage', 'Careful Observation'].includes(a.name),
    ),
  );
  assert.equal(
    evaluate(changeLevel(down.selections, getDefinitions(2), getDefinitions(3)).selections).status,
    'incomplete',
  );
  const changed = changeChoice(
    first.selections,
    getDefinitions(3),
    first.abilityDecision,
    'Pinning Shot',
  );
  assert.ok(
    !evaluate(changed.selections).baseline!.abilities.some(a => a.name === 'Dancer: Disengage'),
  );
  const college = changeChoice(
    first.selections,
    getDefinitions(3),
    'class.shadow.college',
    'Caustic Alchemy',
  );
  assert.equal(college.selections[first.abilityDecision], 'Dancer');
  assert.ok(!college.selections['class.shadow.level-2.burning-ash-ability']);
  const changedClass = changeChoice(first.selections, getDefinitions(3), 'class.choice', 'Fury');
  assert.ok(!changedClass.selections[first.abilityDecision]);
  assert.equal(supportsCurrentAdvancement(2, 'Shadow', 'Black Ash'), false);
});
