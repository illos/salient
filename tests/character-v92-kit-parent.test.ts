// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import type { Decision } from '../shared/evaluate/definitions.ts';
import {
  effectiveParent,
  indexDecisions,
  isAvailable,
  poolOf,
  pruneUnavailable,
} from '../shared/evaluate/structure.ts';

const fury = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));

/** Level-one definitions with kit.choice rewired the way the Shadow content module does it. */
function rewired() {
  const definitions = structuredClone(getDefinitions(1));
  const kit = definitions.steps.flatMap(step => step.decisions).find(d => d.id === 'kit.choice')!;
  delete kit.dependsOn;
  kit.dependsOnAny = ['class.fury.aspect', 'class.choice'];
  kit.optionsByParent!.Shadow = {
    source: 'en/unified/md/feature/shadow/level-1/kit.md',
    optionsFrom: ['pool.kits.standard'],
  };
  const decisions = indexDecisions(definitions);
  return { definitions, decisions, kit: decisions.get('kit.choice') as Decision };
}

/** The pre-V92 wiring: kit.choice hangs on the Fury aspect alone. */
function legacy() {
  const definitions = structuredClone(getDefinitions(1));
  const kit = definitions.steps.flatMap(step => step.decisions).find(d => d.id === 'kit.choice')!;
  delete kit.dependsOnAny;
  kit.dependsOn = ['class.fury.aspect'];
  delete kit.optionsByParent!.Shadow;
  return definitions;
}

test('V92 kit.choice with dependsOnAny keeps the Fury aspect as its parent', () => {
  const { definitions, decisions, kit } = rewired();
  // Catches: the OR primitive making the kit step available before an aspect is chosen.
  assert.equal(isAvailable(kit, { 'class.choice': 'Fury' }, decisions), false);
  const selections = { 'class.choice': 'Fury', 'class.fury.aspect': 'Berserker' };
  // Catches: class.choice ('Fury' has no entry) shadowing the aspect as the effective parent.
  assert.deepEqual(effectiveParent(kit, selections, decisions), {
    id: 'class.fury.aspect',
    value: 'Berserker',
  });
  assert.equal(isAvailable(kit, selections, decisions), true);
  assert.ok(poolOf(kit, selections, definitions).values.includes('Mountain'));
  const stormwight = { 'class.choice': 'Fury', 'class.fury.aspect': 'Stormwight' };
  // Catches: the pool no longer following the aspect entry once the parent list is generalised.
  assert.deepEqual(poolOf(kit, stormwight, definitions).values, [
    'Boren',
    'Corven',
    'Raden',
    'Vuken',
  ]);
});

test('V92 kit.choice stays unavailable for a class without a kit entry', () => {
  const { definitions, decisions, kit } = rewired();
  const selections = { 'class.choice': 'Elementalist' };
  // Catches: treating "class.choice is chosen" as enough without an optionsByParent entry.
  assert.equal(effectiveParent(kit, selections, decisions), undefined);
  assert.equal(isAvailable(kit, selections, decisions), false);
  assert.deepEqual(poolOf(kit, selections, definitions).values, []);
});

test('V92 kit.choice becomes available for a class with its own kit entry', () => {
  const { definitions, decisions, kit } = rewired();
  const selections = { 'class.choice': 'Shadow' };
  // Catches: the effective parent skipping class.choice because the aspect parent is unavailable.
  assert.deepEqual(effectiveParent(kit, selections, decisions), {
    id: 'class.choice',
    value: 'Shadow',
  });
  assert.equal(isAvailable(kit, selections, decisions), true);
  const pool = poolOf(kit, selections, definitions);
  assert.equal(pool.parentValue, 'Shadow');
  assert.ok(pool.values.includes('Mountain'));
  assert.ok(!pool.values.includes('Boren'));
});

test('V92 a chosen kit is pruned when the class changes to one without a kit', () => {
  const { definitions } = rewired();
  const kept = pruneUnavailable(
    { 'class.choice': 'Shadow', 'kit.choice': 'Mountain' },
    definitions,
  );
  assert.deepEqual(kept.removed, []);
  // Catches: pruning keeping a kit whose only satisfying parent no longer has an entry.
  const pruned = pruneUnavailable(
    { 'class.choice': 'Elementalist', 'kit.choice': 'Mountain' },
    definitions,
  );
  assert.ok(pruned.removed.includes('kit.choice'));
  assert.equal(pruned.selections['kit.choice'], undefined);
});

test('V92 the evaluator derives the same Fury with dependsOnAny as with dependsOn', () => {
  const evaluate = (definitions: ReturnType<typeof getDefinitions>) =>
    evaluateCharacter(
      {
        definitionsSchemaVersion: 'r01.1' as const,
        compendiumRevision: definitions.compendiumRevision,
        level: 1,
        selections: fury.selections,
      },
      definitions,
    );
  const before = evaluate(legacy());
  const after = evaluate(rewired().definitions);
  // Catches: the evaluator's own pool() or missing() reading a different parent than structure.ts.
  assert.deepEqual(after.diagnostics['kit.choice'], before.diagnostics['kit.choice']);
  assert.deepEqual(after.partial?.staminaMaximum, before.partial?.staminaMaximum);
  assert.deepEqual(after.partial?.kit?.name, before.partial?.kit?.name);
});
