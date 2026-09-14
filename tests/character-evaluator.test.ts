// SPDX-License-Identifier: GPL-3.0-only
// A02 acceptance for the evaluator: the three R02 worked examples (docs/character-derived-values.md
// section 4) reproduced exactly from shared/content/character-evaluation-examples.json. Expected
// values are the hand-computed examples, which tests/character-derived-values.test.ts checks against
// the pinned source; nothing here is derived by running the evaluator.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EvaluationInput, EvaluationResult } from '../shared/contracts/characterEvaluation.ts';
import type { DecisionDefinitions } from '../shared/evaluate/definitions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';

interface ExamplesFile {
  compendiumRevision: string;
  definitions: string;
  examples: Record<string, { input: EvaluationInput; expected: EvaluationResult }>;
}

const root = process.cwd();
const file = JSON.parse(
  readFileSync(join(root, 'shared/content/character-evaluation-examples.json'), 'utf8'),
) as ExamplesFile;
const definitions = JSON.parse(
  readFileSync(join(root, file.definitions), 'utf8'),
) as DecisionDefinitions;

for (const [name, example] of Object.entries(file.examples)) {
  test(`R02 example "${name}" is reproduced exactly (status, diagnostics, baseline or partial, provenance)`, () => {
    const result = evaluateCharacter(example.input, definitions);
    assert.deepEqual(result, example.expected);
  });
}

test('R02 status precedence: R01 Set C reports invalid with the three stated diagnostics', () => {
  const set = definitions.selectionSets['invalid-over-budget-and-incomplete']!;
  const result = evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections: set.selections as EvaluationInput['selections'],
    },
    definitions,
  );
  assert.equal(result.status, 'invalid');
  assert.equal(result.baseline, null);
  const codes = Object.entries(result.diagnostics).flatMap(([id, list]) =>
    list
      .filter(d => d.severity !== 'warning' && d.severity !== 'unsupported')
      .map(d => `${id}: ${d.code}`),
  );
  assert.deepEqual(codes.sort(), [
    'ancestry.devil.purchased-traits: budget-exceeded',
    'class.fury.ability-5: required-choice-missing',
    'culture.upbringing.skill: required-choice-missing',
  ]);
  // The rejected trait set grants nothing (docs/character-wizard-spec.md#3-decision-system).
  assert.deepEqual(
    result.partial?.traits?.map(t => t.name),
    ['Silver Tongue'],
  );
});

test('a legal option outside the v0.01 subset yields unsupported, never invalid, and keeps its grants visible', () => {
  const set = definitions.selectionSets['second-legal-path']!;
  const result = evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections: set.selections as EvaluationInput['selections'],
    },
    definitions,
  );
  assert.equal(result.status, 'unsupported');
  const severities = new Set(
    Object.values(result.diagnostics)
      .flat()
      .map(d => d.severity),
  );
  assert.ok(!severities.has('invalid') && !severities.has('incomplete'));
  // R01 Set B: Reaver grants Hide, Kit, Primordial Cunning and Unearthly Reflexes.
  assert.ok(result.partial?.skills?.some(s => s.name === 'Hide'));
  assert.ok(result.partial?.abilities?.some(a => a.name === 'Unearthly Reflexes'));
  // Panther is not a supported kit, so no kit numbers are derived (no invented bonuses).
  assert.equal(result.partial?.kit, undefined);
  assert.equal(result.partial?.staminaMaximum, undefined);
});

test('selections for an unavailable decision, an unknown decision and a mismatched revision are invalid', () => {
  const base = file.examples.complete!.input;
  const result = evaluateCharacter(
    {
      ...base,
      compendiumRevision: 'not-the-pin',
      selections: { ...base.selections, 'ancestry.choice': 'Human', 'no.such': 'x' },
    },
    definitions,
  );
  assert.equal(result.status, 'invalid');
  assert.equal(result.diagnostics['definitions']?.[0]?.code, 'definition-mismatch');
  assert.equal(result.diagnostics['no.such']?.[0]?.code, 'unknown-decision');
  assert.equal(
    result.diagnostics['ancestry.devil.purchased-traits']?.[0]?.code,
    'unavailable-decision',
  );
  assert.equal(result.diagnostics['ancestry.choice']?.[0]?.code, 'unsupported-option');
});
