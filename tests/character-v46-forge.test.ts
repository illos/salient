// SPDX-License-Identifier: GPL-3.0-only
/**
 * V46 Forge Steel counterparts. Each witness was built by driving the real editor of the pinned
 * Forge Steel application and exported through its own export path; these tests read the retained
 * bytes. Expected values come from the pinned Compendium (docs/build/evidence/V46/expectations.md),
 * never from Forge: Forge is a same-build counterpart, not a rules oracle.
 *
 * The comparison reuses V45's `projectForgeReference`, so every witness is checked as a complete
 * build — culture, career, class, subclass, kit, perk, incident, abilities, skills and languages —
 * not only its ancestry rows.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import {
  projectForgeReference,
  referenceName,
  sortedNames,
  type ForgeHero,
} from './helpers/v45-reference.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const dir = 'tests/fixtures/v46-devil';
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fixture = readJson(join(dir, 'templates.json'));
const manifest = readJson(join(dir, 'counterparts.json'));
const bases: Record<string, Record<string, SelectionValue>> = {
  'v25-fury': readJson('tests/fixtures/v25-fury.json').selections,
  'v25-bethell': readJson('tests/fixtures/v25-bethell.json').selections,
};
const definitions = getDefinitions(1);

/** The Salient selections for one witness: its audited base build with the Devil rows replaced. */
function selectionsFor(entry: {
  template: string;
  skill: string;
  traits: string[];
  heroName: string;
}) {
  const template = fixture.templates[entry.template];
  return pruneUnavailable(
    {
      ...bases[template.base],
      'ancestry.choice': 'Devil',
      'ancestry.devil.silver-tongue-skill': entry.skill,
      'ancestry.devil.purchased-traits': [...entry.traits],
      // The counterpart's own authored name: these are the same build in both builders.
      'details.name': entry.heroName,
      ...(template.overrides ?? {}),
    },
    definitions,
  ).selections;
}

/** Forge's feature ids for the choices each template makes, by which the two builds are aligned. */
const FEATURE_IDS: Record<string, Record<string, string>> = {
  fury: {
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
  },
  elementalist: {
    'ancestry.devil.silver-tongue-skill': 'devil-feature-1b',
    'ancestry.devil.purchased-traits': 'devil-feature-2',
    'career.mages-apprentice.skills': 'mages-apprentice-feature-2',
    'career.mages-apprentice.languages': 'mages-apprentice-feature-3',
    'career.mages-apprentice.perk': 'mages-apprentice-feature-5',
    'class.elementalist.skills': 'elementalist-1-2',
    'class.elementalist.enchantment': 'elementalist-1-7',
    'class.elementalist.ward': 'elementalist-1-8',
    'class.elementalist.signature-abilities': 'elementalist-1-9',
    'class.elementalist.ability-3': 'elementalist-1-10',
    'class.elementalist.ability-5': 'elementalist-1-11',
  },
};

/** Forge's hero sheet prints label/value pairs on separate lines. */
function sheetValue(text: string, label: string): string {
  const lines = text.split('\n').map(line => line.trim());
  const at = lines.indexOf(label);
  assert.ok(at >= 0 && at + 1 < lines.length, `sheet has no ${label}`);
  return lines[at + 1]!;
}
/** Forge annotates a value, for example speed as "5 (Fly)", so read the leading number. */
function sheetNumber(text: string, label: string): number {
  const raw = sheetValue(text, label);
  const match = /^-?\d+/.exec(raw);
  assert.ok(match, `sheet ${label} is not numeric: ${raw}`);
  return Number(match[0]);
}

test('V46 counterparts: the retained bytes are the ones that were captured', () => {
  assert.equal(manifest.witnesses.length, 13, 'one completed witness per required option group');
  for (const entry of manifest.witnesses) {
    for (const [file, hash] of [
      [entry.export, entry.sha256],
      [entry.sheet, entry.sheetSha256],
    ] as const) {
      const bytes = readFileSync(join(dir, file));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `${file} hash`);
    }
    assert.equal(readFileSync(join(dir, entry.export)).length, entry.bytes, entry.export);
    // Each hero was saved with no outstanding editor choice; an incomplete build is not a witness.
    assert.deepEqual(entry.editorWarnings, [], `${entry.label} saved complete`);
  }
  assert.equal(manifest.forgeRevision, fixture.forgeRevision);
  assert.equal(manifest.compendiumRevision, fixture.compendiumRevision);
});

test('V46 counterparts: every supported option has a completed same-build witness', () => {
  const byOption = new Map<string, string[]>();
  for (const entry of manifest.witnesses) {
    const record = readJson(join(dir, entry.export)) as ForgeHero;
    assert.equal(referenceName(record.ancestry.name), 'Devil', `${entry.label} ancestry`);
    for (const option of [...entry.traits, entry.skill])
      byOption.set(option, [...(byOption.get(option) ?? []), entry.label]);
  }
  for (const row of fixture.witnessLedger)
    assert.ok(byOption.has(row.option), `${row.option} has no completed Forge witness`);
  assert.deepEqual(
    [...byOption.keys()].sort(),
    [...Object.keys(fixture.traitCosts), ...fixture.interpersonalSkills].sort(),
    'every option and no other',
  );
});

for (const entry of manifest.witnesses)
  test(`V46 ${entry.label}: the whole Forge build matches the Salient build`, () => {
    const hero = readJson(join(dir, entry.export)) as ForgeHero;
    const reference = projectForgeReference(hero);
    const selections = selectionsFor(entry);
    const fury = entry.template !== 'D';
    const prefix = fury ? 'class.fury' : 'class.elementalist';
    const career = fury ? 'soldier' : 'mages-apprentice';
    const checked = new Set<string>();
    const check = (key: string, actual: unknown) => {
      const expected = selections[key];
      assert.ok(expected !== undefined, `missing Salient selection ${key}`);
      checked.add(key);
      if (Array.isArray(expected))
        assert.deepEqual(
          sortedNames(actual as string[]),
          sortedNames(expected.filter((row): row is string => typeof row === 'string')),
          key,
        );
      else assert.deepEqual(actual, expected, key);
    };
    const chosen = (key: string, featureID: string) => {
      const names = reference.chosenNames[featureID];
      assert.ok(names, `${entry.label}: no Forge selection for ${featureID}`);
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
    const assignment = Object.fromEntries(
      hero.class.characteristics
        .filter(row =>
          fury
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
      'the chosen array is the one assigned',
    );
    assert.equal(reference.subclasses.length, 1);
    check(`${prefix}.${fury ? 'aspect' : 'specialization'}`, reference.subclasses[0]);
    for (const [key, id] of Object.entries(FEATURE_IDS[fury ? 'fury' : 'elementalist']!))
      chosen(key, id);
    if (!fury) {
      // Forge gives the career and the class one free skill choice each, from any list, and the
      // two are interchangeable: the V45 Bethell capture holds Empathize in the career slot and
      // Magic in the class slot, this capture the other way round. Assert what is actually
      // required — that between them they hold Magic and the recorded replacement — rather than
      // pinning either skill to a slot. See `forgeDifferences` in templates.json.
      const free = sortedNames([
        ...(reference.chosenNames['mages-apprentice-feature-1'] ?? []),
        ...(reference.chosenNames['elementalist-1-1'] ?? []),
      ]);
      assert.deepEqual(
        free,
        sortedNames(['Magic', String(selections['class.elementalist.magic-replacement'])]),
        'the two free skill slots hold Magic and its replacement',
      );
      checked.add('class.elementalist.magic-replacement');
    }
    check(`career.${career}.inciting-incident`, hero.career.incitingIncidents.selected.name);
    check('details.name', hero.name);
    assert.deepEqual(
      [...checked].sort(),
      Object.keys(selections).sort(),
      'every Salient selection has an explicit raw-export mapping',
    );
    // Both Soldier language slots are chosen in these witnesses, unlike the V45 Grug captures.
    assert.deepEqual(reference.deferredLanguages, []);

    // Wings, and only Wings, grants flight in Forge too.
    assert.deepEqual(
      reference.movementModes,
      entry.traits.includes('Wings') ? ['Fly'] : [],
      `${entry.label} movement modes`,
    );

    // Now the derived build: Salient's evaluation of the same selections.
    const result = evaluateCharacter(
      {
        definitionsSchemaVersion: 'r01.1',
        compendiumRevision: fixture.compendiumRevision,
        level: 1,
        selections,
      },
      definitions,
    );
    assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
    const baseline = result.baseline!;
    assert.equal(reference.level, baseline.level.value);
    // projectForgeReference keys characteristics by their initial, as the baseline does.
    assert.deepEqual(
      reference.characteristics,
      Object.fromEntries(
        (['M', 'A', 'R', 'I', 'P'] as const).map(key => [key, baseline.characteristics[key].value]),
      ),
      'characteristics',
    );
    assert.deepEqual(
      reference.skills,
      sortedNames(baseline.skills.map(skill => skill.name)),
      'skills',
    );
    assert.deepEqual(
      reference.languages,
      sortedNames(baseline.languages.map(language => language.name)),
      'languages',
    );
    assert.deepEqual(reference.kits, baseline.kit ? [baseline.kit.name.value] : [], 'kit');
    // Free strikes are shared grants supplied outside the exported ability graph (V45 records this).
    assert.deepEqual(
      reference.abilities,
      sortedNames(
        baseline.abilities.map(ability => ability.name).filter(name => !/Free Strike$/.test(name)),
      ),
      'abilities',
    );
    // Every trait and perk Salient grants is an active feature of the Forge build.
    for (const granted of [...baseline.traits, ...baseline.perks])
      assert.ok(
        reference.activeFeatureNames.includes(referenceName(granted.name)),
        `${entry.label}: Forge is missing ${granted.name}`,
      );
    // Salient's own entitlement wrappers have no separate Forge feature record (V45 records these).
    const structural = ['Culture edge', 'Elemental Specialization', 'Elementalist Abilities'];
    for (const feature of baseline.features) {
      if (structural.includes(feature.name)) continue;
      const forgeName = feature.name === 'Fire: Acolyte of Fire' ? 'Acolyte of Fire' : feature.name;
      assert.ok(
        reference.activeFeatureNames.includes(referenceName(forgeName)),
        `${entry.label}: Forge is missing feature ${forgeName}`,
      );
    }

    // Finally the rendered sheet, against the source-derived expectations for this template.
    const text = readFileSync(join(dir, entry.sheet), 'utf8');
    const expected = fixture.templates[entry.template].expected;
    assert.equal(sheetValue(text, 'Size'), expected.size, 'sheet size');
    assert.equal(sheetNumber(text, 'Spd'), expected.speed, 'sheet speed');
    assert.equal(sheetNumber(text, 'Stab'), expected.stability, 'sheet stability');
    assert.equal(sheetNumber(text, 'Save'), expected.savingThrowThreshold, 'sheet saving throw');
    assert.equal(sheetValue(text, 'Size'), baseline.size.value, 'sheet size matches Salient');
    assert.equal(sheetNumber(text, 'Spd'), baseline.speed.value, 'sheet speed matches Salient');
    assert.equal(
      sheetNumber(text, 'Stab'),
      baseline.stability.value,
      'sheet stability matches Salient',
    );
    assert.equal(
      sheetNumber(text, 'Save'),
      baseline.savingThrowThreshold.value,
      'sheet saving throw matches Salient',
    );
    assert.equal(
      /\(Fly\)/.test(sheetValue(text, 'Spd')),
      (baseline.movementModes ?? []).some(mode => mode.mode === 'Fly'),
      'the flight annotation agrees with the movement mode',
    );
  });

test('V46 counterparts: Forge encodes the same trait mechanics the Compendium states', () => {
  const seen = new Set<string>();
  for (const entry of manifest.witnesses) {
    const hero = readJson(join(dir, entry.export)) as ForgeHero;
    const choice = hero.ancestry.features.find(feature => feature.name === 'Devil Traits');
    assert.ok(choice, `${entry.label}: no Devil Traits choice`);
    for (const trait of choice.data!.selected as {
      name: string;
      type: string;
      data?: Record<string, unknown> & { features?: { type: string; data?: unknown }[] };
    }[]) {
      seen.add(trait.name);
      const nested = [trait, ...(trait.data?.features ?? [])];
      switch (trait.name) {
        // "You have speed 6": a replacement, which Forge also encodes as a value, not a bonus.
        case 'Beast Legs':
          assert.equal(trait.type, 'Speed');
          assert.equal(trait.data?.speed, 6);
          break;
        // "you succeed on a roll of 5 or higher".
        case 'Impressive Horns':
          assert.equal(trait.type, 'Save Threshold');
          assert.equal(trait.data?.value, 5);
          break;
        // "you can use a triggered action to deal that creature psychic damage".
        case 'Glowing Eyes':
          assert.ok(nested.some(feature => feature.type === 'Ability'));
          break;
        // "While using your wings to fly": a movement mode plus its restrictions.
        case 'Wings': {
          const mode = nested.find(feature => /movement mode/i.test(feature.type)) as
            { data?: { mode?: string } } | undefined;
          assert.ok(mode, `${entry.label} Wings grants a movement mode`);
          assert.equal(mode.data?.mode, 'Fly');
          break;
        }
        // The remaining three change no statistic in either builder.
        case 'Barbed Tail':
        case 'Hellsight':
        case 'Prehensile Tail':
          assert.equal(trait.type, 'Text', `${entry.label} ${trait.name}`);
          break;
        default:
          throw new Error(`${entry.label}: unexpected trait ${trait.name}`);
      }
    }
  }
  assert.deepEqual([...seen].sort(), Object.keys(fixture.traitCosts).sort());
});
