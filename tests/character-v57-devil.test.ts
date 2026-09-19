// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { isSupported, poolOf, pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));
const definitions = getDefinitions(1);
const selections = (): Record<string, SelectionValue> => ({ ...fixture.selections });
const evaluate = (choices: Record<string, SelectionValue>) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections: choices,
    },
    definitions,
  );

// Source oracle: Compendium skill/group/interpersonal.md table and devil/silver-tongue.md.
// Catches an editor/evaluator allowlist leaving a legal signature skill disabled or ungranted.
test('V57 Silver Tongue offers and grants every interpersonal skill without bypassing collisions', () => {
  const decision = definitions.steps
    .flatMap(step => step.decisions)
    .find(row => row.id === 'ancestry.devil.silver-tongue-skill')!;
  for (const skill of [
    'Brag', 'Empathize', 'Flirt', 'Gamble', 'Handle Animals', 'Interrogate', 'Intimidate',
    'Lead', 'Lie', 'Music', 'Perform', 'Persuade', 'Read Person',
  ]) {
    const choices = selections();
    choices['culture.upbringing.skill'] = 'Ride'; // Legal Martial choice, avoids Intimidate collision.
    choices[decision.id] = skill;
    assert.ok(poolOf(decision, choices, definitions).values.includes(skill), skill);
    assert.ok(isSupported(decision, skill), skill);
    const result = evaluate(choices);
    assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
    assert.equal(result.baseline!.skills.filter(row => row.name === skill).length, 1);
  }
  const collision = evaluate({ ...selections(), [decision.id]: 'Intimidate' });
  assert.equal(collision.status, 'invalid');
  assert.ok(Object.values(collision.diagnostics).flat().some(row => row.code === 'duplicate-skill'));
});

// Costs and effects were read from the seven devil trait entries before evaluator execution.
// Newly unlocked conditional effects must remain readable grants, never unconditional baseline damage.
test('V57 legal Devil purchases grant all traits and retain only unconditional numeric effects', () => {
  for (const [traits, speed, save] of [
    [['Barbed Tail', 'Glowing Eyes', 'Hellsight'], 5, 6],
    [['Prehensile Tail', 'Beast Legs'], 6, 6],
    [['Wings', 'Beast Legs'], 6, 6],
    [['Impressive Horns', 'Hellsight'], 5, 5],
  ] as const) {
    const result = evaluate({ ...selections(), 'ancestry.devil.purchased-traits': [...traits] });
    assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
    const baseline = result.baseline!;
    assert.deepEqual(baseline.traits.map(row => row.name).sort(), ['Silver Tongue', ...traits].sort());
    assert.equal(baseline.speed.value, speed);
    assert.equal(baseline.savingThrowThreshold.value, save);
    assert.equal(baseline.size.value, '1M');
    assert.equal(baseline.stability.value, 2); // Mountain kit; no ancestry stability bonus.
    assert.equal(baseline.damageWeaknesses?.length ?? 0, 0); // Wings only while flying.
  }
  const overspent = evaluate({
    ...selections(), 'ancestry.devil.purchased-traits': ['Wings', 'Prehensile Tail'],
  });
  assert.equal(overspent.status, 'invalid');
  assert.ok(overspent.diagnostics['ancestry.devil.purchased-traits'].some(row => row.code === 'budget-exceeded'));
});

// Extends existing parent-pruning coverage to the newly enabled manual grants and skill branch.
test('V57 ancestry replacement removes new Devil grants and preserves unrelated build choices', () => {
  const choices = {
    ...selections(),
    'ancestry.choice': 'Polder',
    'ancestry.devil.silver-tongue-skill': 'Lie',
    'ancestry.devil.purchased-traits': ['Wings', 'Barbed Tail'],
    'ancestry.polder.purchased-traits': ['Corruption Immunity', 'Graceful Retreat'],
  };
  const pruned = pruneUnavailable(choices, definitions);
  assert.deepEqual(pruned.removed.sort(), ['ancestry.devil.purchased-traits', 'ancestry.devil.silver-tongue-skill']);
  assert.equal(pruned.selections['kit.choice'], 'Mountain');
  const result = evaluate(pruned.selections);
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  assert.ok(!result.baseline!.traits.some(row => ['Silver Tongue', 'Wings', 'Barbed Tail'].includes(row.name)));
  assert.ok(!result.baseline!.skills.some(row => row.name === 'Lie'));
});
