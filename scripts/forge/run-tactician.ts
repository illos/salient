// SPDX-License-Identifier: GPL-3.0-only
/** Executed by TESTER: independent pinned-Forge results and Compendium-ledger comparison. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTacticianWitnesses } from './tactician-witnesses';
import { project } from './project';

const output = process.env.SALIENT_FORGE_OUTPUT;
if (!output) throw new Error('Missing artifact directory');
const ledger = JSON.parse(readFileSync('tests/fixtures/v94-tactician-expected.json', 'utf8')) as {
  witnesses: { id: string; expected: Record<string, unknown> }[];
};
const witnesses = createTacticianWitnesses().map(witness => ({
  ...witness,
  forge: project(witness.hero),
}));
writeFileSync(join(output, 'counterparts.json'), JSON.stringify(witnesses, null, 2) + '\n');
/** Normalize display typography only; retain every ability and raw result. */
const names = (values: string[]) =>
  values
    .map(v =>
      v
        .replaceAll('’', "'")
        .replace(/[“”]/g, '"')
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
    // Pinned Forge maximizes Stamina; Field Arsenal explicitly allows the lower choice.
    const lowerStamina = witness.id === 'v94-tactician-2';
    if (lowerStamina) {
      assert.equal(witness.selections['class.tactician.arsenal.stamina'], 'Martial Artist');
      assert.equal(expected.staminaMaximum, 24);
      assert.equal(expected.recoveryValue, 8);
      assert.equal(expected.windedValue, 12);
    }
    const overrides: Record<string, number> = lowerStamina
      ? { staminaMaximum: 30, recoveryValue: 10, windedValue: 15 }
      : {};
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
      assert.deepEqual(
        witness.forge.baseline[field],
        overrides[field] ?? expected[field],
        `${witness.id}: ${field}`,
      );
    for (const field of ['skills', 'languages'] as const)
      assert.deepEqual(
        names(witness.forge[field]),
        names(expected[field] as string[]),
        `${witness.id}: ${field}`,
      );
    // Forge names the full Mark body's 1-Focus free triggered effect separately.
    assert.deepEqual(
      names(witness.forge.abilities),
      names([...(expected.abilities as string[]), 'Mark: Trigger']),
      `${witness.id}: abilities`,
    );
    return {
      id: witness.id,
      status: 'pass',
      differences: [
        ...Object.entries(overrides).map(([field, value]) => ({
          field,
          compendium: expected[field],
          forge: value,
          reason:
            'Pinned Forge maximizes kit Stamina; Field Arsenal permits the chosen lower bonus. Raw output and vendor remain unchanged.',
        })),
        {
          field: 'abilities',
          compendium: expected.abilities,
          forge: witness.forge.abilities,
          reason:
            'Forge separately exposes Mark: Trigger from the full Mark body. Embedded retarget and Studied Commander activity remain source-ledger obligations.',
        },
      ],
    };
  } catch (error) {
    return {
      id: witness.id,
      status: 'fail',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
});
const summary = {
  family: 'tactician',
  counterparts: witnesses.length,
  scope:
    'Raw pinned Forge counterparts; baseline, skills, languages and published abilities checked against source ledger with exact differences. Arsenal choices and signature replacements require source-ledger/public readback proof.',
  results,
};
writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (results.some(row => row.status !== 'pass')) process.exitCode = 1;
