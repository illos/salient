// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import elementalist from './fixtures/v25-bethell.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
const definitions = getDefinitions(1);
function build(traits: string[], fixture: Record<string, SelectionValue> = fury.selections) {
  const selections: Record<string, SelectionValue> = { ...fixture };
  for (const id of Object.keys(selections)) if (id.startsWith('ancestry.')) delete selections[id];
  return {
    ...selections,
    'ancestry.choice': 'Wode Elf',
    'ancestry.wode-elf.purchased-traits': traits,
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
// Catches default-speed fallback and treating save resistance as a characteristic bonus; proves quick build with and without a kit.
test('V81 Swift and Otherworldly Grace grant speed six and save five for both classes', () => {
  for (const fixture of [fury.selections, elementalist.selections]) {
    const result = evaluate(build(['Swift', 'Otherworldly Grace'], fixture));
    assert.equal(result.status, 'complete');
    const hero = result.baseline!;
    assert.equal(hero.size.value, '1M');
    assert.equal(hero.speed.value, 6 + (hero.kit?.speedBonus.value ?? 0));
    assert.equal(hero.savingThrowThreshold.value, 5);
    assert.ok(hero.traits.some(t => t.name === 'Wode Elf Glamor'));
  }
});
// Catches text-only signature purchase and stale ability after removal; covers the action-grant gate.
test('V81 The Wode Defends is granted only by its retained purchased trait', () => {
  const result = evaluate(build(['The Wode Defends', 'Forest Walk']));
  assert.equal(result.status, 'complete');
  assert.ok(result.baseline!.traits.some(t => t.name === 'The Wode Defends'));
  const actions = result.baseline!.abilities.filter(a => a.name === 'The Wode Defends');
  assert.equal(actions.length, 1);
  assert.equal(actions[0].sourcePath, 'en/unified/md/feature/ability/wode-elf/the-wode-defends.md');
  assert.ok(
    !evaluate(
      build(['Forest Walk', 'Quick and Brutal', 'Revisit Memory']),
    ).baseline!.abilities.some(a => a.name === 'The Wode Defends'),
  );
});
// Catches duplicate/over-budget purchase acceptance and conditional main-action text becoming a permanent stat grant.
test('V81 manual traits remain distinct purchases and illegal budgets do not grant abilities', () => {
  const hero = evaluate(build(['Forest Walk', 'Quick and Brutal', 'Revisit Memory'])).baseline!;
  assert.deepEqual(hero.traits.map(t => t.name).sort(), [
    'Forest Walk',
    'Quick and Brutal',
    'Revisit Memory',
    'Wode Elf Glamor',
  ]);
  assert.equal(hero.speed.value, 5);
  const illegal = evaluate(build(['The Wode Defends', 'Otherworldly Grace']));
  assert.equal(illegal.status, 'invalid');
  assert.ok(!illegal.partial?.abilities?.some(a => a.name === 'The Wode Defends'));
});
// Covers parent replacement revocation independently of merely editing the purchased list.
test('V81 replacing ancestry prunes the old list and its actions and save threshold', () => {
  const changed = pruneUnavailable(
    {
      ...build(['The Wode Defends', 'Swift']),
      'ancestry.choice': 'Human',
      'ancestry.human.purchased-traits': ['Staying Power', 'Perseverance'],
    },
    definitions,
  );
  assert.ok(changed.removed.includes('ancestry.wode-elf.purchased-traits'));
  const hero = evaluate(changed.selections).baseline!;
  assert.ok(!hero.abilities.some(a => a.name === 'The Wode Defends'));
  assert.equal(hero.speed.value, 5);
  assert.equal(hero.savingThrowThreshold.value, 6);
});
