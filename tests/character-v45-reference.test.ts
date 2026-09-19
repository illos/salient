// SPDX-License-Identifier: GPL-3.0-only
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
import {
  projectForgeReference,
  referenceName,
  sortedNames,
  type ForgeHero,
} from './helpers/v45-reference.ts';
import { readPinnedSource } from './helpers/pinned-source.ts';

const directory = 'tests/fixtures/v45-reference/';
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const examples = [
  { name: 'Grug-level-1', fixture: 'v25-fury', fury: true },
  { name: 'Grug-level-2', fixture: 'v32-fury-level-two', fury: true },
  { name: 'Bethell-corrected-export', fixture: 'v25-bethell', fury: false },
];

test('V45 recovered reference bytes agree with the original capture manifests and pinned sources', () => {
  const manifest = readJson(`${directory}manifest.json`);
  for (const artifact of manifest.artifacts) {
    const raw = readFileSync(artifact.path);
    assert.equal(raw.length, artifact.bytes, artifact.path);
    assert.equal(createHash('sha256').update(raw).digest('hex'), artifact.sha256, artifact.path);
    const original = readJson(artifact.originalMetadata).artifacts.find(
      (row: { path: string }) => row.path === artifact.originalPath,
    );
    assert.ok(original, artifact.originalPath);
    assert.equal(original.sha256, artifact.sha256);
    assert.equal(original.bytes, artifact.bytes);
  }
  // The numerical oracle was authored from these sources before the evaluator, not generated from it.
  for (const example of examples) {
    const fixture = readJson(`tests/fixtures/${example.fixture}.json`);
    assert.equal(fixture.compendiumRevision, manifest.compendiumRevision);
    for (const entry of fixture.ledger) {
      const content = readPinnedSource(
        process.cwd(),
        join(process.cwd(), 'vendor/steel-compendium', entry.sourcePath),
      );
      assert.equal(
        createHash('sha256').update(content).digest('hex'),
        entry.sourceSha256,
        entry.sourcePath,
      );
    }
  }
});

for (const example of examples)
  test(`V45 ${example.name}: actual Forge choices and grants match the existing build`, () => {
    const hero = readJson(`${directory}${example.name}.ds-hero`) as ForgeHero;
    const reference = projectForgeReference(hero);
    const fixture = readJson(`tests/fixtures/${example.fixture}.json`);
    const selections = fixture.selections as Record<string, SelectionValue>;
    const checked = new Set<string>();
    const check = (key: string, actual: unknown) => {
      const expected = selections[key];
      assert.ok(expected !== undefined, `Missing source fixture selection ${key}`);
      checked.add(key);
      if (Array.isArray(expected)) {
        assert.ok(Array.isArray(actual), key);
        assert.deepEqual(
          sortedNames(actual),
          sortedNames(expected.filter((row): row is string => typeof row === 'string')),
          key,
        );
      } else {
        assert.deepEqual(actual, expected, key);
      }
    };
    const chosen = (key: string, featureID: string) => {
      const names = reference.chosenNames[featureID];
      assert.ok(names, featureID);
      if (typeof selections[key] === 'string') assert.equal(names.length, 1, featureID);
      check(key, typeof selections[key] === 'string' ? names[0] : names);
    };
    check('ancestry.choice', reference.ancestry);
    check('class.choice', reference.class);
    check('career.choice', reference.career);
    check('culture.name', hero.culture.name);
    chosen('culture.language', hero.culture.language.id);
    for (const part of ['environment', 'organization', 'upbringing'] as const) {
      check(`culture.${part}`, hero.culture[part].name);
      chosen(`culture.${part}.skill`, hero.culture[part].id);
    }
    const prefix = example.fury ? 'class.fury' : 'class.elementalist';
    const assignment = Object.fromEntries(
      hero.class.characteristics
        .filter(row =>
          example.fury
            ? !['Might', 'Agility'].includes(row.characteristic)
            : row.characteristic !== 'Reason',
        )
        .map(row => [row.characteristic, row.value]),
    );
    check(`${prefix}.array-assignment`, assignment);
    checked.add(`${prefix}.characteristic-array`);
    assert.deepEqual(
      Object.values(assignment).sort(),
      String(selections[`${prefix}.characteristic-array`])
        .replaceAll('−', '-')
        .split(',')
        .map(Number)
        .sort(),
    );
    assert.equal(reference.subclasses.length, 1);
    check(`${prefix}.${example.fury ? 'aspect' : 'specialization'}`, reference.subclasses[0]);
    const featureMap = example.fury
      ? {
          'ancestry.devil.silver-tongue-skill': 'devil-feature-1b',
          'ancestry.devil.purchased-traits': 'devil-feature-2',
          'career.soldier.skill.exploration': 'career-soldier-feature-1',
          'career.soldier.skill.intrigue': 'career-soldier-feature-2',
          'career.soldier.languages': 'career-soldier-feature-3',
          'career.soldier.perk': 'career-soldier-feature-5',
          'class.fury.skills': 'fury-1-2',
          'class.fury.signature-ability': 'fury-1-5',
          'class.fury.ability-3': 'fury-1-6',
          'class.fury.ability-5': 'fury-1-7',
          'kit.choice': 'fury-sub-1-1-2',
        }
      : {
          'ancestry.polder.purchased-traits': 'polder-feature-3',
          'career.mages-apprentice.skills': 'mages-apprentice-feature-2',
          'career.mages-apprentice.languages': 'mages-apprentice-feature-3',
          'career.mages-apprentice.perk': 'mages-apprentice-feature-5',
          'class.elementalist.skills': 'elementalist-1-2',
          // Forge serializes the fixed Magic collision as a career choice; Salient keeps both origins.
          'class.elementalist.magic-replacement': 'mages-apprentice-feature-1',
          'class.elementalist.enchantment': 'elementalist-1-7',
          'class.elementalist.ward': 'elementalist-1-8',
          'class.elementalist.signature-abilities': 'elementalist-1-9',
          'class.elementalist.ability-3': 'elementalist-1-10',
          'class.elementalist.ability-5': 'elementalist-1-11',
        };
    for (const [key, id] of Object.entries(featureMap)) chosen(key, id!);
    check(
      `career.${example.fury ? 'soldier' : 'mages-apprentice'}.inciting-incident`,
      hero.career.incitingIncidents.selected.name,
    );
    if (reference.level === 2) {
      chosen('class.fury.level-2.perk', 'fury-2-1');
      chosen('class.fury.level-2.aspect-ability', 'fury-sub-1-2-2');
      assert.ok(reference.activeFeatureNames.includes('Unstoppable Force'));
    } else {
      assert.ok(!reference.activeFeatureNames.includes('Unstoppable Force'));
      assert.ok(!reference.abilities.includes('Wrecking Ball'));
    }
    if (example.fury) check('details.name', hero.name);
    else {
      checked.add('details.name');
      assert.equal(hero.name, 'Bethell Corrected V25');
      assert.equal(selections['details.name'], 'Bethell'); // Documented authored-name-only difference.
    }
    assert.deepEqual(
      [...checked].sort(),
      Object.keys(selections).sort(),
      'Every fixture selection has an explicit raw-export mapping',
    );
    assert.deepEqual(
      reference.deferredLanguages,
      example.fury ? [{ featureID: 'career-soldier-feature-3', count: 1 }] : [],
    );
    if (example.fury)
      assert.equal(
        (selections['career.soldier.languages'] as (string | null)[]).filter(
          value => value === null,
        ).length,
        1,
      );

    const expected = fixture.expected;
    assert.equal(reference.level, expected.level);
    assert.deepEqual(reference.characteristics, expected.characteristics);
    for (const category of ['skills', 'languages'] as const)
      assert.deepEqual(reference[category], sortedNames(expected[category]), category);
    assert.deepEqual(reference.kits, expected.kit ? [expected.kit] : []);
    assert.deepEqual(
      reference.abilities,
      sortedNames(
        expected.abilities.filter(
          (name: string) =>
            !['Melee Weapon Free Strike', 'Ranged Weapon Free Strike'].includes(name),
        ),
      ),
    );
    for (const name of [...expected.traits, ...expected.perks])
      assert.ok(reference.activeFeatureNames.includes(referenceName(name)), name);
    // These source entitlements are represented by culture/subclass/ability choices in Forge,
    // not their own serialized feature. Every other expected feature must be active in the export.
    const structuralEntitlements = [
      'Culture edge',
      'Elemental Specialization',
      'Elementalist Abilities',
    ];
    for (const name of expected.features as string[]) {
      if (structuralEntitlements.includes(name)) continue;
      const forgeName = name === 'Fire: Acolyte of Fire' ? 'Acolyte of Fire' : name;
      assert.ok(
        reference.activeFeatureNames.includes(forgeName),
        `Active Forge feature ${forgeName}`,
      );
    }

    const result = evaluateCharacter(
      {
        definitionsSchemaVersion: 'r01.1',
        compendiumRevision: fixture.compendiumRevision,
        level: expected.level,
        selections,
      },
      getDefinitions(expected.level),
    );
    assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
    const baseline = result.baseline!;
    for (const field of [
      'level',
      'ancestry',
      'class',
      'subclass',
      'career',
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'size',
      'disengage',
      'savingThrowThreshold',
      'renown',
      'wealth',
    ] as const)
      assert.equal(baseline[field].value, expected[field], field);
    for (const category of [
      'skills',
      'languages',
      'traits',
      'features',
      'perks',
      'abilities',
    ] as const)
      assert.deepEqual(
        sortedNames(baseline[category].map(row => row.name)),
        sortedNames(expected[category]),
        category,
      );
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(baseline.characteristics).map(([key, row]) => [key, row.value]),
      ),
      reference.characteristics,
    );

    // Check actual rendered sheet values, without pretending raw live-state counters are totals.
    const sheetName = example.fury ? `${example.name}-sheet.txt` : 'Bethell-corrected-sheet.txt';
    const sheet = readFileSync(`${directory}${sheetName}`, 'utf8');
    for (const [label, field] of Object.entries({
      Stamina: 'staminaMaximum',
      Recoveries: 'recoveriesMaximum',
      'Recovery Value': 'recoveryValue',
      Speed: 'speed',
      Stability: 'stability',
      Disengage: 'disengage',
      Save: 'savingThrowThreshold',
      Renown: 'renown',
      Wealth: 'wealth',
    })) {
      assert.ok(
        sheet.includes(`${label}\n${expected[field]}\n`),
        `${label}: expected ${expected[field]} in captured Forge sheet`,
      );
    }
  });

for (const level of [1, 2])
  test(`V45 original Forge level-${level} reimport changes only collision-generated hero ID`, () => {
    const original = readJson(`${directory}Grug-level-${level}.ds-hero`);
    const reimported = readJson(`${directory}Grug-level-${level}-reimported.ds-hero`);
    assert.notEqual(original.id, reimported.id);
    delete original.id;
    delete reimported.id;
    assert.deepEqual(reimported, original);
  });

test('V45 projection excludes embedded future/unselected definitions and refuses an unknown active container', () => {
  const hero = readJson(`${directory}Grug-level-1.ds-hero`) as ForgeHero;
  const before = projectForgeReference(hero);
  hero.class.featuresByLevel.push({
    level: 10,
    features: [
      { id: 'future-sentinel', name: 'Future sentinel', type: 'Unsupported container', data: null },
    ],
  });
  hero.class.subclasses
    .find(branch => !branch.selected)!
    .featuresByLevel.push({
      level: 1,
      features: [
        {
          id: 'unselected-sentinel',
          name: 'Unselected sentinel',
          type: 'Unsupported container',
          data: null,
        },
      ],
    });
  assert.deepEqual(projectForgeReference(hero), before);
  hero.features.push({
    id: 'active-sentinel',
    name: 'Active sentinel',
    type: 'Unsupported container',
    data: null,
  });
  assert.throws(() => projectForgeReference(hero), /Unsupported reference feature type/);
});
