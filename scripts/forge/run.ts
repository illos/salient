// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { project } from './project';
import { createWitnesses } from './ancestry-witnesses';
import type { Hero } from '@/models/hero';
import { Characteristic } from '@/enums/characteristic';
import { FeatureType } from '@/enums/feature-type';

const output = process.env.SALIENT_FORGE_OUTPUT;
if (!output) throw new Error('Missing artifact directory');
// Upstream catches some traversal errors and logs them. Such a partial result must fail.
console.error = () => {
  throw new Error('Forge reported an internal error; projection refused');
};
const fixtures = 'tests/fixtures/v45-reference';
const calibrations = [
  {
    file: 'Grug-level-1.ds-hero',
    expected: {
      staminaMaximum: 30,
      recoveriesMaximum: 10,
      recoveryValue: 10,
      speed: 6,
      stability: 2,
      size: '1M',
      disengage: 1,
      savingThrowThreshold: 5,
    },
  },
  {
    file: 'Bethell-corrected-export.ds-hero',
    expected: {
      staminaMaximum: 18,
      recoveriesMaximum: 8,
      recoveryValue: 6,
      speed: 5,
      stability: 0,
      size: '1S',
      disengage: 2,
      savingThrowThreshold: 6,
    },
  },
];
const calibration = calibrations.map(({ file, expected }) => {
  const raw = readFileSync(join(fixtures, file));
  const hero = JSON.parse(raw.toString()) as Hero;
  const calibrationNotes: string[] = [];
  if (
    file === 'Bethell-corrected-export.ds-hero' &&
    hero.class?.primaryCharacteristics.length === 0
  ) {
    hero.class.primaryCharacteristics = [Characteristic.Reason];
    calibrationNotes.push(
      'Legacy export omits primaryCharacteristics; restored sole pinned class option Reason without changing any numeric characteristics.',
    );
  }
  const result = project(hero);
  for (const [key, value] of Object.entries(expected))
    assert.deepEqual(
      result.baseline[key as keyof typeof result.baseline],
      value,
      `${file}: retained sheet ${key}`,
    );
  return {
    file,
    sha256: createHash('sha256').update(raw).digest('hex'),
    expected,
    calibrationNotes,
    result,
  };
});
writeFileSync(join(output, 'calibration.json'), JSON.stringify(calibration, null, 2) + '\n');
const witnesses = createWitnesses().map(witness => ({ ...witness, forge: project(witness.hero) }));
// These catch false-positive certification by upstream's permissive >= budget check.
const negatives = ['missing', 'duplicate', 'foreign'] as const;
for (const kind of negatives) {
  const hero = structuredClone(witnesses[0]!.hero);
  const choice = hero.ancestry!.features.find(
    f => f.type === FeatureType.Choice && f.data.count === 'ancestry',
  );
  assert.ok(choice?.type === FeatureType.Choice);
  if (kind === 'missing') choice.data.selected = [];
  if (kind === 'duplicate') choice.data.selected.push(structuredClone(choice.data.selected[0]!));
  if (kind === 'foreign') choice.data.selected[0]!.id = 'not-a-pinned-ancestry-option';
  assert.equal(project(hero).complete, false, `${kind} purchase must not certify complete`);
}
// Catches nested state being mistaken for altered source payload, and malformed state accepted as complete.
for (const kind of ['missing-child', 'altered-payload'] as const) {
  const hero = structuredClone(
    witnesses.find(w => w.ancestry === 'Time Raider' && w.purchasedTraits.includes('Psionic Gift'))!
      .hero,
  );
  const purchase = hero.ancestry!.features.find(
    f => f.type === FeatureType.Choice && f.data.count === 'ancestry',
  );
  assert.ok(purchase?.type === FeatureType.Choice);
  const child = purchase.data.selected.find(f => f.type === FeatureType.Choice);
  assert.ok(child?.type === FeatureType.Choice);
  if (kind === 'missing-child') child.data.selected = [];
  else child.data.selected[0]!.description = 'Forged source text';
  assert.equal(project(hero).complete, false, `${kind} must not certify complete`);
}
// Catches a foreign/signature trait masquerading as Previous Life, or a modified former ancestry.
for (const kind of ['missing-borrowed', 'foreign-borrowed', 'altered-former'] as const) {
  const hero = structuredClone(witnesses.find(w => w.id.startsWith('revenant-devil-2'))!.hero);
  const purchase = hero.ancestry!.features.find(
    f => f.type === FeatureType.Choice && f.data.count === 'ancestry',
  );
  assert.ok(purchase?.type === FeatureType.Choice);
  const borrowed = purchase.data.selected.find(f => f.type === FeatureType.AncestryFeatureChoice);
  assert.ok(borrowed?.type === FeatureType.AncestryFeatureChoice);
  if (kind === 'missing-borrowed') borrowed.data.selected = null;
  if (kind === 'foreign-borrowed') borrowed.data.selected!.id = 'not-an-eligible-purchased-trait';
  if (kind === 'altered-former') {
    const former = hero.ancestry!.features.find(f => f.type === FeatureType.AncestryChoice);
    assert.ok(former?.type === FeatureType.AncestryChoice);
    former.data.selected!.ancestryPoints = 99;
  }
  assert.equal(project(hero).complete, false, `${kind} must not certify complete`);
}
// Catches source-invalid duplicate or foreign direct purchases accepted through Forge's expanded former pool.
for (const kind of ['duplicate-former', 'foreign-former'] as const) {
  const hero = structuredClone(
    witnesses.find(w => w.id === 'revenant-polder-repeated-one-point')!.hero,
  );
  const purchase = hero.ancestry!.features.find(
    f => f.type === FeatureType.Choice && f.data.count === 'ancestry',
  );
  assert.ok(purchase?.type === FeatureType.Choice);
  if (kind === 'duplicate-former')
    purchase.data.selected[1] = structuredClone(purchase.data.selected[0]!);
  else purchase.data.selected[0]!.id = 'devil-feature-1';
  assert.equal(project(hero).complete, false, `${kind} must not certify complete`);
}
writeFileSync(join(output, 'counterparts.json'), JSON.stringify(witnesses, null, 2) + '\n');
const incomplete = witnesses
  .filter(w => !w.forge.complete)
  .map(w => ({
    id: w.id,
    outstanding: w.forge.outstandingChoices,
    unsupported: w.forge.unsupportedChoices,
  }));
writeFileSync(
  join(output, 'summary.json'),
  JSON.stringify({ calibration: 'pass', counterparts: witnesses.length, incomplete }, null, 2) +
    '\n',
);
console.log(
  JSON.stringify({ calibration: 'pass', counterparts: witnesses.length, incomplete }, null, 2),
);
if (incomplete.length) process.exitCode = 1;
