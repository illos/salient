// SPDX-License-Identifier: GPL-3.0-only
/** Executed by TESTER: independent pinned-Forge results and Compendium-ledger comparison. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createShadowWitnesses } from './shadow-witnesses';
import { project } from './project';

const output = process.env.SALIENT_FORGE_OUTPUT;
if (!output) throw new Error('Missing artifact directory');
const ledger = JSON.parse(readFileSync('tests/fixtures/v92-shadow-expected.json', 'utf8')) as {
  witnesses: { id: string; expected: Record<string, unknown> }[];
};
const witnesses = createShadowWitnesses().map(witness => ({
  ...witness,
  forge: project(witness.hero),
}));
writeFileSync(join(output, 'counterparts.json'), JSON.stringify(witnesses, null, 2) + '\n');
/** Forge prints a few names with diacritics or title case (Coup de Grâce, Two Throats At Once). */
const names = (values: string[]) =>
  values
    .map(v =>
      v
        .replaceAll('’', "'")
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase(),
    )
    .sort();
const results = witnesses.map(witness => {
  const expected = ledger.witnesses.find(row => row.id === witness.id)!.expected;
  try {
    assert.equal(
      witness.forge.complete,
      true,
      JSON.stringify({
        outstanding: witness.forge.outstandingChoices,
        unsupported: witness.forge.unsupportedChoices,
      }),
    );
    for (const field of [
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'size',
      'disengage',
      'characteristics',
    ] as const)
      assert.deepEqual(witness.forge.baseline[field], expected[field], `${witness.id}: ${field}`);
    for (const field of ['skills', 'languages', 'abilities'] as const)
      assert.deepEqual(
        names(witness.forge[field]),
        names(expected[field] as string[]),
        `${witness.id}: ${field}`,
      );
    return { id: witness.id, status: 'pass' };
  } catch (error) {
    return {
      id: witness.id,
      status: 'fail',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
});
const summary = { family: 'shadow', counterparts: witnesses.length, results };
writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (results.some(row => row.status !== 'pass')) process.exitCode = 1;
