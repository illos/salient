// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
const definitions = getDefinitions(1);
function build(
  traits: string[],
  extra: Record<string, SelectionValue> = {},
): Record<string, SelectionValue> {
  const selections: Record<string, SelectionValue> = { ...fury.selections };
  for (const id of Object.keys(selections)) if (id.startsWith('ancestry.')) delete selections[id];
  return {
    ...selections,
    'ancestry.choice': 'High Elf',
    'ancestry.high-elf.purchased-traits': traits,
    ...extra,
  };
}
const evaluate = (selections: Record<string, SelectionValue>) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections,
    },
    definitions,
  );

// Catches Unstoppable Mind omitted from immunity derivation and Graceful Retreat overwriting kit disengage.
test('V77 permanent high-elf grants compose with the kit and are removed on ancestry replacement', () => {
  const selections = build(['Unstoppable Mind', 'Graceful Retreat']);
  const result = evaluate(selections);
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.equal(hero.size.value, '1M');
  assert.equal(hero.speed.value, 5);
  assert.equal(hero.disengage.value, 2);
  assert.ok(hero.conditionImmunities?.some(i => i.condition === 'dazed'));
  const changed = pruneUnavailable(
    {
      ...selections,
      'ancestry.choice': 'Human',
      'ancestry.human.purchased-traits': ['Staying Power', 'Perseverance'],
    },
    definitions,
  );
  assert.ok(changed.removed.includes('ancestry.high-elf.purchased-traits'));
  assert.ok(
    !evaluate(changed.selections).baseline!.conditionImmunities?.some(i => i.condition === 'dazed'),
  );
  assert.equal(evaluate(changed.selections).baseline!.disengage.value, 1);
});
// Catches the source's 5+ save threshold being treated as an edge or a bonus and covers both passive sense choices.
test('V77 save threshold and sense traits preserve source-defined passive behavior', () => {
  for (const sense of ['High Senses', 'Revisit Memory']) {
    const result = evaluate(build(['Otherworldly Grace', sense]));
    assert.equal(result.status, 'complete');
    assert.equal(result.baseline!.savingThrowThreshold.value, 5);
    assert.ok(result.baseline!.traits.some(t => t.name === sense));
    assert.ok(result.baseline!.traits.some(t => t.name === 'High Elf Glamor'));
    assert.ok(!result.baseline!.abilities.some(a => a.kind === 'ancestry'));
  }
});
// Catches the embedded triggered action being lost or surviving removal; adds the source-specific budget boundary.
test('V77 Glamor of Terror is both a trait and action and obeys replacement and budget', () => {
  const terror = evaluate(build(['Glamor of Terror', 'High Senses']));
  assert.equal(terror.status, 'complete');
  assert.ok(terror.baseline!.traits.some(t => t.name === 'Glamor of Terror'));
  assert.equal(terror.baseline!.abilities.filter(a => a.name === 'Glamor of Terror').length, 1);
  const replacement = evaluate(build(['Otherworldly Grace', 'High Senses']));
  assert.ok(!replacement.baseline!.abilities.some(a => a.name === 'Glamor of Terror'));
  assert.equal(evaluate(build(['Glamor of Terror', 'Unstoppable Mind'])).status, 'invalid');
});
