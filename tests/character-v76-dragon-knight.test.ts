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
    'ancestry.choice': 'Dragon Knight',
    'ancestry.dragon-knight.purchased-traits': traits,
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

// Catches missing nested decisions and immunity stacking; covers each allowed damage type independently.
test('V76 Wyrmplate and Scales require selections, preserve both grants and never add same-type immunity', () => {
  const empty = evaluate(build(['Dragon Breath', 'Prismatic Scales']));
  assert.equal(empty.status, 'incomplete');
  for (const damage of ['acid', 'cold', 'corruption', 'fire', 'lightning', 'poison']) {
    const result = evaluate(
      build(['Dragon Breath', 'Prismatic Scales'], {
        'ancestry.dragon-knight.wyrmplate-immunity': damage,
        'ancestry.dragon-knight.prismatic-scales-immunity': 'fire',
      }),
    );
    assert.equal(result.status, 'complete');
    const hero = result.baseline!;
    assert.equal(hero.size.value, '1M');
    assert.equal(hero.speed.value, 5);
    assert.equal(hero.stability.value, 2);
    assert.deepEqual(
      hero.damageImmunities?.map(i => [i.damageType, i.value.value]),
      damage === 'fire'
        ? [['fire', 1]]
        : [
            [damage, 1],
            ['fire', 1],
          ],
    );
    assert.ok(hero.abilities.some(a => a.name === 'Dragon Breath'));
    assert.ok(hero.traits.some(t => t.name === 'Dragon Breath'));
  }
});
// Catches prose-only actions omitted from usable grants and structured ability purchases misclassified as traits only.
test('V76 each remaining purchase retains its trait and grants only its own actions', () => {
  for (const [traits, actions] of [
    [
      ['Draconian Pride', 'Draconian Guard'],
      ['Draconian Pride', 'Draconian Guard'],
    ],
    [['Wings', 'Remember Your Oath'], ['Remember Your Oath']],
  ] as [string[], string[]][]) {
    const result = evaluate(build(traits, { 'ancestry.dragon-knight.wyrmplate-immunity': 'cold' }));
    assert.equal(result.status, 'complete');
    for (const name of traits) assert.ok(result.baseline!.traits.some(t => t.name === name));
    assert.deepEqual(
      result
        .baseline!.abilities.filter(a => a.kind === 'ancestry')
        .map(a => a.name)
        .sort(),
      actions.sort(),
    );
  }
  const over = evaluate(
    build(['Wings', 'Dragon Breath'], { 'ancestry.dragon-knight.wyrmplate-immunity': 'cold' }),
  );
  assert.equal(over.status, 'invalid');
  assert.equal(over.baseline, null);
});
// Catches dangling required scales choices and stale immunities/actions after purchase or ancestry replacement.
test('V76 replacement prunes nested immunity decisions and removes old ability grants', () => {
  const original = build(['Dragon Breath', 'Prismatic Scales'], {
    'ancestry.dragon-knight.wyrmplate-immunity': 'poison',
    'ancestry.dragon-knight.prismatic-scales-immunity': 'acid',
  });
  const removed = pruneUnavailable(
    { ...original, 'ancestry.dragon-knight.purchased-traits': ['Wings', 'Remember Your Oath'] },
    definitions,
  );
  assert.ok(removed.removed.includes('ancestry.dragon-knight.prismatic-scales-immunity'));
  const hero = evaluate(removed.selections).baseline!;
  assert.deepEqual(
    hero.damageImmunities?.map(i => i.damageType),
    ['poison'],
  );
  assert.ok(!hero.abilities.some(a => a.name === 'Dragon Breath'));
  const changed = pruneUnavailable(
    {
      ...original,
      'ancestry.choice': 'Human',
      'ancestry.human.purchased-traits': ['Staying Power', 'Perseverance'],
    },
    definitions,
  );
  assert.ok(changed.removed.includes('ancestry.dragon-knight.wyrmplate-immunity'));
  assert.equal(evaluate(changed.selections).status, 'complete');
  assert.ok(!evaluate(changed.selections).baseline!.traits.some(t => t.name === 'Wyrmplate'));
});
