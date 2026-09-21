// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v97-shadow-two-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { changeLevel } from '../shared/evaluate/levelTransition.ts';
import { supportsCurrentAdvancement } from '../shared/content/character-support.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const evaluate = (selections: Selections, level = 2) =>
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

test('Shadow level two grants only the source-selected college ability and correct level-two baseline', () => {
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
      amount: 5,
    });
    assert.ok(
      hero.staminaMaximum.provenance.some(
        p => p.decisionId === 'class.shadow.level-2.stamina' && p.amount === 6,
      ),
    );
  }
});

test('Shadow level-two missing and foreign options remain invalid; other classes and level three are not enabled', () => {
  const missing: Selections = { ...first.selections };
  delete missing[first.abilityDecision];
  assert.equal(evaluate(missing).status, 'incomplete');
  for (const [id, value] of [
    [first.abilityDecision, 'Sticky Bomb'],
    ['class.shadow.level-2.perk', 'Arcane Trick'],
  ] as const) {
    const result = evaluate({ ...first.selections, [id]: value });
    assert.equal(result.status, 'invalid');
    assert.ok(result.diagnostics[id]?.some(d => d.code === 'value-not-in-pool'));
  }
  assert.notEqual(evaluate(first.selections, 3).status, 'complete');
  assert.notEqual(
    evaluate({ ...first.selections, 'class.choice': 'Elementalist' }).status,
    'complete',
  );
  assert.equal(supportsCurrentAdvancement(1, 'Shadow', 'Black Ash'), false);
});

test('target-level and college edits remove later grants and preserve earlier choices without restoring stale choices', () => {
  const down = changeLevel(first.selections, getDefinitions(2), getDefinitions(1));
  assert.ok(down.removed.includes(first.abilityDecision));
  assert.ok(down.removed.includes('class.shadow.level-2.perk'));
  const hero = evaluate(down.selections, 1).baseline!;
  assert.equal(hero.staminaMaximum.value, 21);
  assert.ok(!hero.features.some(f => f.name === 'Burning Ash'));
  assert.ok(!hero.abilities.some(a => a.name === first.newAbility));
  assert.equal(down.selections['kit.choice'], 'Cloak and Dagger');
  assert.equal(
    evaluate(changeLevel(down.selections, getDefinitions(1), getDefinitions(2)).selections).status,
    'incomplete',
  );
  const college = changeChoice(
    first.selections,
    getDefinitions(2),
    'class.shadow.college',
    'Caustic Alchemy',
  );
  assert.ok(college.removed.includes(first.abilityDecision));
  assert.equal(college.selections['class.shadow.level-2.perk'], 'Danger Sense');
  const replacement = changeChoice(
    college.selections,
    getDefinitions(2),
    'class.shadow.level-2.trained-assassin-ability',
    'Sticky Bomb',
  );
  const updated = evaluate(replacement.selections).baseline!;
  assert.ok(updated.features.some(f => f.name === 'Trained Assassin'));
  assert.ok(!updated.features.some(f => f.name === 'Burning Ash'));
  const otherClass = changeChoice(
    replacement.selections,
    getDefinitions(2),
    'class.choice',
    'Elementalist',
  );
  assert.ok(Object.keys(otherClass.selections).every(id => !id.startsWith('class.shadow.')));
});
