// SPDX-License-Identifier: GPL-3.0-only
/** One-time refactor evidence against an explicitly archived baseline, never an expected-rules oracle. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { definitions as levelOne } from '../shared/content/level-one-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const baselineRoot = process.argv[2];
assert.ok(baselineRoot, 'Pass the root of an archived pre-refactor tree (shared/ directory).');
const prior = async (path: string) => import(pathToFileURL(resolve(baselineRoot, path)).href);
const { getDefinitions: oldDefinitions } = await prior('shared/content/character-decisions.ts');
const { definitions: oldLevelOne } = await prior('shared/content/level-one-decisions.ts');
const { evaluateCharacter: oldEvaluate } = await prior('shared/evaluate/character.ts');
assert.deepEqual(levelOne, oldLevelOne, 'legacy level-one definitions');
const levels = [1, 2, 3, 10, 0, -1, 1.5, Number.NaN, Infinity];
for (const level of levels)
  assert.deepEqual(getDefinitions(level), oldDefinitions(level), `definitions ${level}`);

let comparisons = 0;
const statuses = new Set<string>();
function compare(selections: Record<string, SelectionValue>, level: number, label: string) {
  const definitions = getDefinitions(level);
  const input = {
    definitionsSchemaVersion: 'r01.1' as const,
    compendiumRevision: definitions.compendiumRevision,
    level,
    selections,
  };
  const actual = evaluateCharacter(input, definitions);
  assert.deepEqual(actual, oldEvaluate(input, oldDefinitions(level)), label);
  statuses.add(actual.status);
  comparisons++;
}

for (const [file, level] of [
  ['v25-fury.json', 1],
  ['v25-bethell.json', 1],
  ['v32-fury-level-two.json', 2],
] as const) {
  const fixture = JSON.parse(readFileSync(`tests/fixtures/${file}`, 'utf8'));
  const selections = fixture.selections as Record<string, SelectionValue>;
  compare(selections, level, file);
  for (const otherLevel of levels) compare(selections, otherLevel, `${file} level ${otherLevel}`);
  for (const id of Object.keys(selections)) {
    const missing = { ...selections };
    delete missing[id];
    compare(missing, level, `${file} missing ${id}`);
    compare({ ...selections, [id]: 'not-an-option' }, level, `${file} invalid ${id}`);
  }
  // Contrast every single-choice option, including unsupported parents. Other source-led suites
  // establish expected rules; this check proves the refactor preserves even incomplete output.
  for (const decision of getDefinitions(level).steps.flatMap(step => step.decisions))
    if (decision.shape.type === 'single')
      for (const option of decision.options ?? [])
        compare(
          { ...selections, [decision.id]: option.value },
          level,
          `${file} ${decision.id}=${option.value}`,
        );
}
assert.deepEqual([...statuses].sort(), ['complete', 'incomplete', 'invalid', 'unsupported']);
console.log(
  JSON.stringify(
    {
      definitions: levels.length + 1,
      evaluations: comparisons,
      statuses: [...statuses].sort(),
      result: 'exact deep equality',
    },
    null,
    2,
  ),
);
