// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import traitCorpus from '../shared/content/compendium/trait.json' with { type: 'json' };
import elementalist from './fixtures/v25-bethell.json' with { type: 'json' };
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
  return { ...selections, 'ancestry.choice': 'Dwarf', 'ancestry.dwarf.purchased-traits': traits };
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

// Catches omitting kit stacking or updating Stamina without its dependent health values.
test('V60 Dwarf quick build adds Grounded and Spark to a Mountain Fury', () => {
  const result = evaluate(build(['Grounded', 'Spark Off Your Skin']));
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.equal(hero.size.value, '1M');
  assert.equal(hero.speed.value, 5);
  assert.equal(hero.stability.value, 3);
  assert.equal(hero.staminaMaximum.value, 36);
  assert.equal(hero.recoveryValue.value, 12);
  assert.equal(hero.windedValue.value, 18);
  assert.ok(hero.staminaMaximum.provenance.some(p => p.selection === 'Spark Off Your Skin'));
});

// Covers the no-kit derivation phase and prevents ancestry recalculation erasing complication benefits.
test('V60 no-kit Spark health derives before Wodewalker recovery bonus', () => {
  const result = evaluate({
    ...build(['Grounded', 'Spark Off Your Skin'], elementalist.selections),
    'complication.choice': 'Wodewalker',
  });
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.equal(hero.kit, null);
  assert.equal(hero.stability.value, 1);
  assert.equal(hero.staminaMaximum.value, 24);
  assert.equal(hero.recoveryValue.value, 10);
  assert.equal(hero.windedValue.value, 12);
});

// Covers distinct permanent immunity and prevents a resistance-only Might benefit changing attacks/potencies.
test('V60 Great Fortitude grants immunity while Stand Tough leaves core Might intact', () => {
  const result = evaluate(build(['Great Fortitude', 'Stand Tough']));
  assert.equal(result.status, 'complete');
  const hero = result.baseline!;
  assert.deepEqual(
    hero.conditionImmunities?.map(i => i.condition),
    ['weakened'],
  );
  assert.equal(hero.characteristics.M.value, 2);
  assert.equal(hero.potency.strong.value, 2);
  assert.ok(
    hero.traits.some(t => t.name === 'Stand Tough' && t.sourcePath.endsWith('/stand-tough.md')),
  );
});

// Covers the remaining legal purchase and ensures Runic Carving does not introduce a required creation rune.
test('V60 all three one-point traits complete with readable manual trait grants', () => {
  const result = evaluate(build(['Grounded', 'Stand Tough', 'Stone Singer']));
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.baseline!.traits.map(t => t.name).sort(), [
    'Grounded',
    'Runic Carving',
    'Stand Tough',
    'Stone Singer',
  ]);
  for (const trait of result.baseline!.traits) {
    const readable = traitCorpus.find(
      entry => entry.sourcePath === `vendor/steel-compendium/${trait.sourcePath}`,
    );
    assert.ok(readable, `${trait.name} must resolve in the app's shipped rules corpus`);
    if (trait.name === 'Runic Carving') {
      for (const rune of ['Detection:', 'Light:', 'Voice:'])
        assert.ok(readable.text.includes(rune));
      assert.ok(readable.text.includes('one rune active at a time'));
    }
    if (trait.name === 'Stand Tough')
      assert.ok(readable.text.includes('for the purpose of resisting'));
    if (trait.name === 'Stone Singer') assert.ok(readable.text.includes('1 uninterrupted hour'));
  }
});

// Exercises this ancestry's budget through evaluation, including no benefit leakage from refused selections.
test('V60 four-point purchases cannot yield an accepted build or Spark bonus', () => {
  const result = evaluate(build(['Great Fortitude', 'Spark Off Your Skin']));
  assert.equal(result.status, 'invalid');
  assert.equal(result.baseline, null);
  assert.ok(result.diagnostics['ancestry.dwarf.purchased-traits'].length > 0);
  assert.equal(result.partial!.staminaMaximum!.value, 30);
});

// Catches Dwarf-only stale traits surviving a parent edit while checking unrelated authored choices survive.
test('V60 changing ancestry removes purchased Dwarf choices and permanent benefits', () => {
  const previous = build(['Grounded', 'Spark Off Your Skin']);
  const changed = pruneUnavailable(
    {
      ...previous,
      'ancestry.choice': 'Polder',
      'ancestry.polder.purchased-traits': ['Corruption Immunity', 'Fearless', 'Graceful Retreat'],
    },
    definitions,
  );
  assert.ok(changed.removed.includes('ancestry.dwarf.purchased-traits'));
  assert.equal(changed.selections['details.name'], 'Grug');
  assert.equal(changed.selections['kit.choice'], 'Mountain');
  const hero = evaluate(changed.selections).baseline!;
  assert.equal(hero.staminaMaximum.value, 30);
  assert.equal(hero.stability.value, 2);
  assert.ok(!hero.traits.some(t => t.name === 'Runic Carving'));
});
