// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import {
  characterSupportDiagnostics,
  isSupportedDefinitionLevel,
  supportsCurrentAdvancement,
} from '../shared/content/character-support.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const fury = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));
const evaluate = (selections: Record<string, SelectionValue>, level: number) => {
  const definitions = getDefinitions(level);
  return evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1' as const,
      compendiumRevision: definitions.compendiumRevision,
      level,
      selections,
    },
    definitions,
  );
};

test('V45 level-two Reaver/Stormwight definitions (V114) do not make guided advancement available', () => {
  for (const subclass of ['Reaver', 'Stormwight']) {
    const selections = { ...fury.selections, 'class.fury.aspect': subclass };
    // Even a future level-one option expansion cannot accidentally authorize its level-two build.
    const definitions = structuredClone(getDefinitions(2));
    const aspect = definitions.steps
      .flatMap(step => step.decisions)
      .find(d => d.id === 'class.fury.aspect')!;
    aspect.options!.find(option => option.value === subclass)!.supportedInV001 = true;
    const result = evaluateCharacter(
      {
        definitionsSchemaVersion: 'r01.1' as const,
        compendiumRevision: definitions.compendiumRevision,
        level: 2,
        selections,
      },
      definitions,
    );
    // V114 supports every aspect at level two; the level-one build still owes its level-two choices
    // (the Stormwight variant also lacks a Stormwight kit, so its status is invalid).
    assert.equal(result.status, subclass === 'Reaver' ? 'incomplete' : 'invalid');
    const owed = `class.fury.level-2.${subclass.toLowerCase()}-ability`;
    for (const id of ['class.fury.level-2.perk', owed])
      assert.equal(result.diagnostics[id]?.[0]?.code, 'required-choice-missing', id);
    assert.equal(result.baseline, null);
    assert.ok(!result.partial?.features?.some(feature => feature.name === 'Unstoppable Force'));
    assert.equal(supportsCurrentAdvancement(1, 'Fury', subclass), false);
  }
  assert.equal(supportsCurrentAdvancement(1, 'Fury', 'Berserker'), true);
  assert.equal(supportsCurrentAdvancement(2, 'Fury', 'Berserker'), false);
  assert.equal(supportsCurrentAdvancement(1, 'Elementalist', 'Fire'), false);
});

test('V45 incomplete kit and invalid levels retain absent values and explicit diagnostics', () => {
  const selections = { ...fury.selections };
  delete selections['kit.choice'];
  const incomplete = evaluate(selections, 1);
  assert.equal(incomplete.status, 'incomplete');
  assert.equal(incomplete.partial?.staminaMaximum, undefined);
  assert.equal(incomplete.partial?.recoveryValue, undefined);
  assert.equal(incomplete.partial?.stability, undefined);
  for (const level of [-1, 0, 1.5, 7, 10, Number.NaN, Infinity]) {
    assert.equal(isSupportedDefinitionLevel(level), false);
    assert.equal(characterSupportDiagnostics(level, fury.selections)[0].decisionId, 'class.level');
    assert.equal(evaluate(fury.selections, level).baseline, null);
  }
});

test('V45 per-build origins and extended definitions never mutate the owned modules', () => {
  const baseline = JSON.stringify(getDefinitions(1));
  const origins = {
    'complication.following-in-the-footsteps.ability': { level: 1, value: 'Example' },
  };
  const definitions = getDefinitions(1, origins);
  assert.notEqual(definitions.choiceOrigins, origins);
  origins['complication.following-in-the-footsteps.ability'].level = 2;
  assert.equal(
    definitions.choiceOrigins!['complication.following-in-the-footsteps.ability'].level,
    1,
  );
  assert.equal(JSON.stringify(getDefinitions(1)), baseline);
  const first = new Set(getDefinitions(1).steps.flatMap(step => step.decisions.map(d => d.id)));
  for (const id of first) assert.ok(!id.startsWith('class.fury.level-2.'));
  const second = getDefinitions(2).steps.flatMap(step => step.decisions.map(d => d.id));
  assert.equal(new Set(second).size, second.length);
  assert.ok(second.includes('class.fury.level-2.stamina'));
});
