// SPDX-License-Identifier: GPL-3.0-only
/**
 * V47 normalized projection and comparison.
 *
 * STATUS: NEVER EXECUTED. No capture exists yet, so this has never been run against a real export.
 *
 * A .ds-hero file embeds definitions as well as choices — whole subclass trees, later levels and
 * unselected options — so diffing the raw file is meaningless. This projects an export down to the
 * fields the V47 ledger actually compares, then reports differences against the source-derived
 * expectations in builds.json.
 *
 * It deliberately reports rather than asserts: an unexplained mismatch blocks the unit, and the
 * explanation is a human judgement recorded in the slice, not something a script should decide.
 *
 *   node normalize.mjs --build A-devil-reaver-panther --export ../forge/A.../export.ds-hero
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Fields excluded on purpose: play state and identity, not the build. */
const EXCLUDED = ['state', 'abilityCustomizations', 'picture', 'folder', 'id'];

const names = list => (list ?? []).map(entry => entry?.name ?? entry).filter(Boolean);

/** Walk features recursively; a selection can itself contain choices. */
function collectFeatures(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const entry of node) collectFeatures(entry, out);
    return out;
  }
  if (node.name && node.type) out.push(node);
  for (const key of ['features', 'featuresByLevel', 'selected', 'options', 'data', 'choices'])
    if (node[key]) collectFeatures(node[key], out);
  return out;
}

/**
 * Project an export into the comparable set. Only the active path counts: an embedded subclass
 * carries its own `selected` flag, and presence in the file never means the hero has the feature.
 */
export function projectExport(hero) {
  const selectedSubclasses = (hero.class?.subclasses ?? []).filter(entry => entry.selected);
  const features = collectFeatures(hero.class?.featuresByLevel ?? []).concat(
    collectFeatures(selectedSubclasses.map(entry => entry.featuresByLevel ?? [])),
    collectFeatures(hero.features ?? []),
  );

  return {
    ancestry: hero.ancestry?.name ?? null,
    culture: {
      language: names(hero.culture?.languages).join(', ') || null,
      environment: hero.culture?.environment?.name ?? null,
      organization: hero.culture?.organization?.name ?? null,
      upbringing: hero.culture?.upbringing?.name ?? null,
    },
    career: hero.career?.name ?? null,
    class: hero.class?.name ?? null,
    subclass: selectedSubclasses.map(entry => entry.name),
    level: hero.class?.level ?? null,
    characteristics: Object.fromEntries(
      (hero.class?.characteristics ?? []).map(entry => [entry.characteristic, entry.value]),
    ),
    // Class ability choices store selected ids; resolve them within their owning class or subclass,
    // because Forge ids are not safe to assume globally unique.
    abilityIds: features
      .filter(feature => feature.data?.selectedIDs)
      .flatMap(feature => feature.data.selectedIDs),
    skills: [...new Set(features.flatMap(feature => feature.data?.selected ?? []))].filter(
      value => typeof value === 'string',
    ),
    kit: names(features.find(feature => feature.type === 'Kit')?.data?.selected ?? []),
    featureNames: [...new Set(features.map(feature => feature.name))].sort(),
    excluded: EXCLUDED,
  };
}

/** Compare a projection against the source-derived expectations. Reports; never decides. */
export function compare(projection, expected) {
  const differences = [];
  const note = (field, ours, theirs) =>
    differences.push({ field, sourceDerived: ours, forge: theirs });

  for (const [key, value] of Object.entries(expected.characteristics ?? {}))
    if (projection.characteristics[key] !== value)
      note(`characteristics.${key}`, value, projection.characteristics[key] ?? null);

  for (const skill of expected.skills ?? [])
    if (!projection.skills.includes(skill)) note('skills.missing', skill, null);
  for (const skill of projection.skills)
    if (!(expected.skills ?? []).includes(skill)) note('skills.extra', null, skill);

  if (expected.kit && !projection.kit.includes(expected.kit))
    note('kit', expected.kit, projection.kit.join(', ') || null);

  return {
    differences,
    verdict: differences.length === 0 ? 'matches source-derived expectations' : 'differences found',
    reminder:
      'Forge agreeing with us is not evidence that either matches the source. Every difference ' +
      'needs a recorded source-backed explanation before this unit can pass, and derived sheet ' +
      'values (Stamina, recoveries, recovery value, winded, speed, size, stability, disengage, ' +
      'damage bonuses) are compared from the captured sheet text, not from this projection.',
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
  if (!args.build || !args.export) {
    console.error('Usage: node normalize.mjs --build <id> --export <path to .ds-hero>');
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

  const hero = JSON.parse(await readFile(args.export, 'utf8'));
  const projection = projectExport(hero);
  console.log(JSON.stringify({ projection, ...compare(projection, build.expected) }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
