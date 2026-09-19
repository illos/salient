// SPDX-License-Identifier: GPL-3.0-only
/**
 * V47 counterpart comparison ledger.
 *
 * STATUS: NEVER EXECUTED.
 *
 * Rewritten 2026-09-19 after review. The previous version hand-rolled its own projection of a
 * .ds-hero and then reported "matches source-derived expectations" while silently checking three
 * fields out of roughly twenty-five. That is the failure mode this project treats most seriously:
 * a green result that never looked at most of the claim. It also mis-keyed characteristics
 * (Forge writes "Might", the expectations use "M"), walked unselected options and later levels,
 * skipped ancestry, culture and career, and folded language selections into skills.
 *
 * The fix is not a better projection here. **The authoritative projection already exists**:
 * `tests/helpers/v45-reference.ts` `projectForgeReference()`, which follows the pinned Forge
 * FeatureLogic/HeroLogic, keeps only selected subclasses, filters features by level, resolves
 * ability `selectedIDs` against their owning pool, separates skills from languages, and fails on
 * container types it does not support instead of silently certifying them. The comparison belongs
 * in a test that imports that helper, where TypeScript and the existing fixtures already live.
 *
 * This file is therefore deliberately small: it owns the *ledger* — which expected fields are
 * checked by code, which are read by a person from the captured sheet, and which are not verified
 * at all — and it refuses to call a partial check a match.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * How each expected field is verified. `helper` fields come from the export through
 * `projectForgeReference`; `sheet-manual` fields are read by a person from the captured sheet image
 * and text, which is honest evidence and does not need automating now; `salient-only` fields are
 * inputs we chose rather than results to compare.
 */
export const FIELD_LEDGER = {
  level: 'helper',
  ancestry: 'helper',
  class: 'helper',
  subclass: 'helper',
  career: 'helper',
  characteristics: 'helper',
  skills: 'helper',
  languages: 'helper',
  kit: 'helper',
  abilities: 'helper',
  traits: 'helper',
  features: 'helper',
  perks: 'helper',
  staminaMaximum: 'sheet-manual',
  recoveriesMaximum: 'sheet-manual',
  recoveryValue: 'sheet-manual',
  windedValue: 'sheet-manual',
  size: 'sheet-manual',
  speed: 'sheet-manual',
  stability: 'sheet-manual',
  disengage: 'sheet-manual',
  potency: 'sheet-manual',
  savingThrowThreshold: 'sheet-manual',
  renown: 'sheet-manual',
  wealth: 'sheet-manual',
  kitMeleeDamageBonusApplies: 'sheet-manual',
  kitMeleeDamageBonusExcluded: 'sheet-manual',
  primordialDamageType: 'sheet-manual',
  heroicResource: 'sheet-manual',
  potencyCharacteristic: 'sheet-manual',
};

/**
 * Build the completeness ledger for one build's expectations. `projected` is the output of
 * `projectForgeReference` when a test has run it, or null during preparation; `sheetFindings` is
 * what a person recorded from the captured sheet, keyed by field.
 *
 * The verdict is `incomplete` unless every expected field has been checked one way or the other.
 * There is no code path that returns "matches" while a required field is unchecked.
 */
export function ledgerFor(expected, { projected = null, sheetFindings = {} } = {}) {
  const checked = [];
  const unverified = [];
  const different = [];

  for (const field of Object.keys(expected)) {
    const how = FIELD_LEDGER[field];
    if (!how) {
      unverified.push({ field, why: 'no verification route is defined for this field' });
      continue;
    }
    if (how === 'helper') {
      if (!projected) {
        unverified.push({ field, why: 'the export projection has not been run' });
        continue;
      }
      if (!(field in projected)) {
        unverified.push({ field, why: 'the projection does not expose this field' });
        continue;
      }
      const same = JSON.stringify(projected[field]) === JSON.stringify(expected[field]);
      (same ? checked : different).push(
        same ? { field, how } : { field, sourceDerived: expected[field], forge: projected[field] },
      );
      continue;
    }
    if (!(field in sheetFindings)) {
      unverified.push({ field, why: 'no recorded reading from the captured sheet' });
      continue;
    }
    const finding = sheetFindings[field];
    (finding.matches ? checked : different).push(
      finding.matches
        ? { field, how, evidence: finding.evidence }
        : { field, sourceDerived: expected[field], forge: finding.observed, evidence: finding.evidence },
    );
  }

  return {
    checked,
    unverified,
    different,
    verdict: different.length
      ? 'differences found'
      : unverified.length
        ? 'incomplete: some expected fields were not verified'
        : 'every expected field verified',
    notes: [
      'Forge agreeing with us is not evidence that either matches the source. The source-derived ' +
        'column is the arbiter, and every difference needs a recorded source-backed explanation.',
      'Derived sheet values are read from the captured sheet by a person and recorded as ' +
        'sheetFindings. Nothing in this file inspects a screenshot.',
      'The export projection is tests/helpers/v45-reference.ts projectForgeReference. Do not write ' +
        'a second traversal here; if it lacks a field, extend it there with its assertions intact.',
    ],
  };
}

async function main() {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .join(' ')
      .split('--')
      .filter(Boolean)
      .map(part => part.trim().split(/\s+/))
      .map(([key, ...rest]) => [key, rest.join(' ')]),
  );
  if (!args.build) {
    console.error(
      'Usage: node normalize.mjs --build <id>\n' +
        'Prints the verification ledger for that build. Running the export projection and ' +
        'recording sheet findings happen in the slice tests, not here.',
    );
    process.exitCode = 2;
    return;
  }
  const data = JSON.parse(await readFile(join(HERE, 'builds.json'), 'utf8'));
  const build = data.builds.find(entry => entry.id === args.build);
  if (!build) {
    console.error(`No build "${args.build}" in builds.json.`);
    process.exitCode = 1;
    return;
  }
  const ledger = ledgerFor(build.expected);
  console.log(JSON.stringify({ build: build.id, ...ledger }, null, 2));
  if (ledger.verdict !== 'every expected field verified') process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
