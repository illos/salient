// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import elementalist from './fixtures/v25-bethell.json' with { type: 'json' };
import traitCorpus from '../shared/content/compendium/trait.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const definitions = getDefinitions(1);
function build(
  traits: string[],
  fixture: Record<string, SelectionValue> = fury.selections,
): Record<string, SelectionValue> {
  const selections: Record<string, SelectionValue> = { ...fixture };
  for (const id of Object.keys(selections)) if (id.startsWith('ancestry.')) delete selections[id];
  return { ...selections, 'ancestry.choice': 'Hakaan', 'ancestry.hakaan.purchased-traits': traits };
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

// Catches Big! falling back to size 1M and Doomsight being mistaken for permanent extra health.
// Adds quick-build coverage and verifies both branches of the readable death/rubble rule survive ingestion.
test('V70 Hakaan quick build is large with readable Doomsight and Forceful rules', () => {
  const result = evaluate(build(['Doomsight', 'Forceful']));
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.equal(hero.size.value, '1L');
  assert.equal(hero.speed.value, 5);
  assert.equal(hero.stability.value, 2);
  assert.equal(hero.staminaMaximum.value, 30);
  assert.equal(hero.recoveryValue.value, 10);
  assert.equal(hero.windedValue.value, 15);
  assert.deepEqual(hero.traits.map(t => t.name).sort(), ['Big!', 'Doomsight', 'Forceful']);
  const doom = traitCorpus.find(entry =>
    entry.sourcePath.endsWith('/feature/trait/hakaan/doomsight.md'),
  );
  assert.ok(doom, 'Doomsight must resolve in the shipped rules corpus');
  for (const rule of ['tier 3', 'die immediately', '12 hours', 'Director'])
    assert.ok(doom.text.includes(rule), `Doomsight must retain ${rule}`);
  const forceful = traitCorpus.find(entry =>
    entry.sourcePath.endsWith('/feature/trait/hakaan/forceful.md'),
  );
  assert.ok(forceful?.text.includes('+1'));
});

// Covers purchased immunity in the no-kit phase; catches Stand Tough incorrectly increasing core Might.
test('V70 Great Fortitude and Stand Tough grant immunity without changing Might or potency', () => {
  const result = evaluate(build(['Great Fortitude', 'Stand Tough'], elementalist.selections));
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.equal(hero.kit, null);
  assert.equal(hero.stability.value, 0);
  assert.equal(hero.size.value, '1L');
  assert.deepEqual(hero.conditionImmunities?.map(i => i.condition), ['weakened']);
  const control = evaluate(build(['Doomsight', 'Forceful'], elementalist.selections)).baseline!;
  assert.deepEqual(hero.characteristics, control.characteristics);
  assert.deepEqual(hero.potency, control.potency);
  const stand = traitCorpus.find(entry =>
    entry.sourcePath.endsWith('/feature/trait/hakaan/stand-tough.md'),
  );
  assert.ok(stand?.text.includes('for the purpose of resisting'));
});

// Adds the remaining purchase witness and catches a missing readable manual strength benefit.
test('V70 the three one-point traits complete with All Is a Feather source text', () => {
  const result = evaluate(build(['All Is a Feather', 'Forceful', 'Stand Tough']));
  assert.equal(result.status, 'complete');
  const feather = result.baseline!.traits.find(t => t.name === 'All Is a Feather');
  assert.ok(feather);
  const readable = traitCorpus.find(
    entry => entry.sourcePath === `vendor/steel-compendium/${feather.sourcePath}`,
  );
  assert.ok(readable?.text.includes('lift and haul heavy objects'));
  assert.equal(result.baseline!.characteristics.M.value, 2);
});

// Exercises the ancestry-specific cost boundary and catches refused immunity leaking into partial values.
test('V70 two two-point traits are rejected without granting Great Fortitude', () => {
  const result = evaluate(build(['Doomsight', 'Great Fortitude']));
  assert.equal(result.status, 'invalid');
  assert.equal(result.baseline, null);
  assert.ok(result.diagnostics['ancestry.hakaan.purchased-traits'].length > 0);
  assert.ok(!result.partial?.conditionImmunities?.some(i => i.condition === 'weakened'));
});

// Catches stale size/immunity after a parent edit while preserving unrelated saved choices.
test('V70 replacing Hakaan removes its size and immunity grants', () => {
  const changed = pruneUnavailable(
    {
      ...build(['Great Fortitude', 'Stand Tough']),
      'ancestry.choice': 'Polder',
      'ancestry.polder.purchased-traits': ['Corruption Immunity', 'Fearless', 'Graceful Retreat'],
    },
    definitions,
  );
  assert.ok(changed.removed.includes('ancestry.hakaan.purchased-traits'));
  assert.equal(changed.selections['details.name'], 'Grug');
  assert.equal(changed.selections['kit.choice'], 'Mountain');
  const hero = evaluate(changed.selections).baseline!;
  assert.equal(hero.size.value, '1S');
  assert.ok(!hero.conditionImmunities?.some(i => i.condition === 'weakened'));
  assert.ok(!hero.traits.some(t => t.name === 'Big!'));
});
