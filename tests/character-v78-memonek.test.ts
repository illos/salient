// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
const definitions = getDefinitions(1);
const traitsId = 'ancestry.memonek.purchased-traits';
function build(traits: string[]) {
  return {
    ...Object.fromEntries(
      Object.entries(fury.selections).filter(([key]) => !key.startsWith('ancestry.')),
    ),
    'ancestry.choice': 'Memonek',
    [traitsId]: traits,
  };
}
function evaluate(selections: ReturnType<typeof build>) {
  return evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections,
    },
    definitions,
  );
}
// Catches omitting the second signature or applying Lightweight's conditional size reduction permanently.
test('V78 Memonek quick build has both signatures, base speed seven, and slowed immunity', () => {
  const result = evaluate(build(['Lightning Nimbleness', 'Nonstop']));
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.equal(hero.size.value, '1M');
  assert.equal(hero.speed.value, 7);
  assert.equal(hero.stability.value, 2);
  assert.deepEqual(hero.traits.map(t => t.name).sort(), [
    'Fall Lightly',
    'Lightning Nimbleness',
    'Lightweight',
    'Nonstop',
  ]);
  assert.deepEqual(
    hero.conditionImmunities?.map(i => i.condition),
    ['slowed'],
  );
});
// Covers the prose-granted trigger, independent surprised immunity, and revocation on a valid replacement.
test('V78 Keeper of Order is granted only when purchased and never becomes a permanent roll bonus', () => {
  const hero = evaluate(build(['Keeper of Order', 'Unphased', 'Useful Emotion'])).baseline!;
  assert.equal(hero.speed.value, 5);
  assert.deepEqual(
    hero.conditionImmunities?.map(i => i.condition),
    ['surprised'],
  );
  const ability = hero.abilities.find(a => a.name === 'Keeper of Order');
  assert.ok(ability);
  assert.equal(ability.activationCondition, 'Once per round.');
  const replacement = evaluate(
    build(['I Am Law', 'Systematic Mind', 'Unphased', 'Useful Emotion']),
  );
  assert.equal(replacement.status, 'complete');
  assert.ok(!replacement.baseline!.abilities.some(a => a.name === 'Keeper of Order'));
  assert.deepEqual(
    replacement.baseline!.languages.map(l => l.name),
    hero.languages.map(l => l.name),
  );
});
// Distinct budget failure must not leak speed/immunities; ancestry replacement removes all Memonek grants.
test('V78 overspending cannot grant traits and ancestry replacement removes their effects', () => {
  const invalid = evaluate(build(['Keeper of Order', 'Lightning Nimbleness', 'Nonstop']));
  assert.equal(invalid.status, 'invalid');
  assert.ok(invalid.diagnostics[traitsId]?.some(d => d.code === 'budget-exceeded'));
  assert.equal(invalid.partial?.speed?.value, 5);
  assert.deepEqual(invalid.partial?.conditionImmunities ?? [], []);
  const changed = pruneUnavailable(
    {
      ...build(['Keeper of Order', 'Nonstop']),
      'ancestry.choice': 'Polder',
      'ancestry.polder.purchased-traits': ['Corruption Immunity', 'Fearless', 'Graceful Retreat'],
    },
    definitions,
  );
  assert.ok(changed.removed.includes(traitsId));
  const hero = evaluate(changed.selections as ReturnType<typeof build>).baseline!;
  assert.equal(hero.size.value, '1S');
  assert.ok(!hero.abilities.some(a => a.name === 'Keeper of Order'));
  assert.ok(!hero.traits.some(t => t.name === 'Lightweight'));
});
