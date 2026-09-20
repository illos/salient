// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
const definitions = getDefinitions(1);
const traitsId = 'ancestry.time-raider.purchased-traits';
const giftId = 'ancestry.time-raider.psionic-gift.ability';
function build(traits: string[], gift?: string): Record<string, SelectionValue> {
  return { ...Object.fromEntries(Object.entries(fury.selections).filter(([key]) => !key.startsWith('ancestry.'))), 'ancestry.choice': 'Time Raider', [traitsId]: traits, ...(gift ? { [giftId]: gift } : {}) };
}
function evaluate(selections: Record<string, SelectionValue>) {
  return evaluateCharacter({ definitionsSchemaVersion: 'r01.1', compendiumRevision: definitions.compendiumRevision, level: 1, selections }, definitions);
}
// Catches an unimplemented nested gift, duplicate grants, and failure to expose the prose-granted maneuver.
test('V80 every Psionic Gift grants exactly its chosen signature alongside Beyondsight', () => {
  for (const gift of ['Concussive Slam', 'Minor Acceleration', 'Psionic Bolt']) {
    const result = evaluate(build(['Beyondsight', 'Psionic Gift'], gift));
    assert.equal(result.status, 'complete');
    const hero = result.baseline!;
    assert.deepEqual(hero.abilities.filter(a => a.kind === 'ancestry').map(a => a.name).sort(), ['Beyondsight', gift].sort());
    assert.deepEqual(hero.traits.map(t => t.name).sort(), ['Beyondsight', 'Psionic Gift', 'Psychic Scar']);
    assert.equal(hero.size.value, '1M');
    assert.equal(hero.speed.value, 5);
    assert.equal(hero.stability.value, 2);
    assert.equal(hero.damageImmunities?.find(i => i.damageType === 'psychic')?.value.value, 1);
  }
});
// Catches granting a gift before its mandatory child is chosen and accepting another ancestry's ability.
test('V80 Psionic Gift requires a supported ability and obeys the three-point budget', () => {
  assert.equal(evaluate(build(['Beyondsight', 'Psionic Gift'])).status, 'incomplete');
  assert.equal(evaluate(build(['Beyondsight', 'Psionic Gift'], 'Shadowmeld')).status, 'invalid');
  const invalid = evaluate(build(['Psionic Gift', 'Unstoppable Mind'], 'Psionic Bolt'));
  assert.equal(invalid.status, 'invalid');
  assert.ok(invalid.diagnostics[traitsId]?.some(d => d.code === 'budget-exceeded'));
  assert.ok(!invalid.partial?.abilities?.some(a => a.name === 'Psionic Bolt'));
  assert.deepEqual(invalid.partial?.conditionImmunities ?? [], []);
});
// Exercises embedded Unstoppable Mind and Foresight's active half while leaving passive combat modifiers manual.
test('V80 Foresight grants its reaction and Unstoppable Mind grants dazed immunity', () => {
  const hero = evaluate(build(['Foresight', 'Unstoppable Mind'])).baseline!;
  assert.deepEqual(hero.conditionImmunities?.map(i => i.condition), ['dazed']);
  assert.ok(hero.abilities.some(a => a.name === 'Foresight'));
  const athletics = evaluate(build(['Four-Armed Athletics', 'Four-Armed Martial Arts']));
  assert.equal(athletics.status, 'complete');
  assert.equal(athletics.baseline!.speed.value, 5);
  assert.deepEqual(athletics.baseline!.skills.map(s => s.name), hero.skills.map(s => s.name));
  assert.ok(!athletics.baseline!.abilities.some(a => a.name === 'Foresight'));
});
// Child and its ability must both disappear after replacing Psionic Gift; ancestry changes revoke Psychic Scar too.
test('V80 gift and ancestry replacement remove stale child selections and grants', () => {
  const original = build(['Beyondsight', 'Psionic Gift'], 'Psionic Bolt');
  const replacement = pruneUnavailable({ ...original, [traitsId]: ['Foresight', 'Unstoppable Mind'] }, definitions);
  assert.ok(replacement.removed.includes(giftId));
  const hero = evaluate(replacement.selections).baseline!;
  assert.ok(!hero.abilities.some(a => ['Psionic Bolt', 'Beyondsight'].includes(a.name)));
  const changed = pruneUnavailable({ ...original, 'ancestry.choice': 'Polder', 'ancestry.polder.purchased-traits': ['Corruption Immunity', 'Fearless', 'Graceful Retreat'] }, definitions);
  assert.ok(changed.removed.includes(giftId));
  assert.ok(changed.removed.includes(traitsId));
  assert.ok(!evaluate(changed.selections).baseline!.damageImmunities?.some(i => i.damageType === 'psychic'));
});
