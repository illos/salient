// SPDX-License-Identifier: GPL-3.0-only
/**
 * V182: Forge Steel import at class levels two and three for all eleven classes, the interim level
 * ceiling (Q-V-6) and play-state reconciliation.
 *
 * The heroes in tests/fixtures/v182-forge are Forge-built from the pinned Forge definitions
 * (scripts/forge/import-witnesses.ts; manifest.json), not Forge UI exports. Expected selections are
 * the independent per-class source ledgers (tests/fixtures/level-three-builds.ts), never the
 * importer's output. The liveSeed variant of Grug is labelled synthetic: only its play-state fields
 * are edited, and its maxima come from the hand-derived tests/fixtures/v25-fury.json.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { forgeImportRefusal, importForgeText } from '../shared/interchange/forge-steel/import.ts';
import {
  forgeLiveSeed,
  forgePlayState,
  liveSeedDiagnostics,
} from '../shared/interchange/forge-steel/state.ts';
import { forgeNameAliases, resolveName } from '../shared/interchange/forge-steel/names.ts';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { vendorPath } from '../scripts/lib/vendor.ts';
import { levelThreeBuilds } from './fixtures/level-three-builds.ts';

const directory = 'tests/fixtures/v182-forge';
const manifest = JSON.parse(readFileSync(`${directory}/manifest.json`, 'utf8')) as {
  forgeVendorRevision: string;
  heroes: { id: string; path: string; sha256: string }[];
};
const heroText = (id: string) => {
  const row = manifest.heroes.find(hero => hero.id === id)!;
  const text = gunzipSync(readFileSync(row.path)).toString('utf8');
  assert.equal(createHash('sha256').update(text).digest('hex'), row.sha256, `${id} digest`);
  return text;
};
const comparable = (value: unknown) =>
  Array.isArray(value) ? value.map(String).sort() : (value as unknown);

/**
 * Salient decisions the pinned Forge hero does not record, so they stay open after import:
 * Forge keeps a Censor's or Conduit's domains but no deity, and Salient offers domains per deity
 * (class/censor.md, class/conduit.md "Deity and Domains"); every choice downstream of the domains
 * follows. Forge has no Beastheart companion melee bonus choice
 * (feature/beastheart/level-1/companion.md).
 */
const forgeGaps: Record<string, RegExp> = {
  Censor: /^class\.censor\.(deity|domain|domain-skill)$/,
  Conduit:
    /^class\.conduit\.(deity|domains|domain-feature|domain-skill|level-2\.domain-ability|level-2\.domain-skill\..+)$/,
  Beastheart: /^class\.beastheart\.companion-melee-bonus$/,
};

test('V182 retained Forge-built heroes cover every class at levels two and three', () => {
  assert.equal(manifest.forgeVendorRevision, '5a846aadb623a9855a023e9403bb887a956c341f');
  assert.equal(manifest.heroes.length, 22);
});

for (const build of levelThreeBuilds())
  for (const level of [2, 3])
    test(`V182 ${build.className} level ${level} imports the ledger's class and kit choices`, () => {
      const result = importForgeText(heroText(`${build.className.toLowerCase()}-level-${level}`));
      assert.equal(result.level, level);
      assert.equal(result.selections['class.choice'], build.className);
      assert.equal(forgeImportRefusal(result), null);
      const gap = forgeGaps[build.className];
      const expected = Object.entries(build.selections).filter(
        ([key]) => /^(class|kit)\./.test(key) && (level === 3 || !/\.level-3\./.test(key)),
      );
      for (const [key, value] of expected)
        if (gap?.test(key)) assert.equal(result.selections[key], undefined, `${key} stays open`);
        else assert.deepEqual(comparable(result.selections[key]), comparable(value), key);
      // Nothing beyond the ledger's class and kit choices is written.
      const keys = new Set(expected.map(([key]) => key));
      assert.deepEqual(
        Object.keys(result.selections).filter(key => /^(class|kit)\./.test(key) && !keys.has(key)),
        [],
      );
      if (build.className === 'Censor' || build.className === 'Conduit')
        assert.ok(
          result.diagnostics.some(d => /but no deity/.test(d.reason)),
          'the missing deity is reported',
        );
      // feature/beastheart/level-1/kit.md: the companion's melee bonus choice has no Forge field.
      if (build.className === 'Beastheart')
        assert.ok(
          result.diagnostics.some(d => d.reason.includes('class.beastheart.companion-melee-bonus')),
          'the missing companion melee bonus is reported',
        );
    });

test('V182 Field Arsenal benefit choices Forge cannot record are reported for conflicting kits', () => {
  // SYNTHETIC: the Forge-built Tactician level-3 hero with its Field Arsenal kits replaced by the
  // unchanged pinned Shining Armor (from the same file) and Mountain (from the Forge-built Fury).
  // kit/shining-armor.md: Stamina +12 per echelon, Stability +1, melee damage +2/+2/+2;
  // kit/mountain.md: Stamina +9 per echelon, Stability +2, melee damage +0/+0/+4. Both kits
  // print Stamina, Stability and melee damage with different values, so Field Arsenal
  // (feature/tactician/level-1/field-arsenal.md) asks which one to take for those three only.
  type Feature = { id: string; data: { selected: { name: string }[] } };
  const kitFeature = (
    hero: { class: { featuresByLevel: { features: Feature[] }[] } },
    id: string,
  ) => hero.class.featuresByLevel.flatMap(row => row.features).find(feature => feature.id === id)!;
  const tactician = JSON.parse(heroText('tactician-level-3'));
  const fury = JSON.parse(heroText('fury-level-3'));
  const furyKit = fury.class.subclasses
    .flatMap((s: { featuresByLevel: { features: Feature[] }[] }) =>
      s.featuresByLevel.flatMap(row => row.features),
    )
    .find((f: Feature) => f.id === 'fury-sub-1-1-2') as Feature;
  const arsenal = kitFeature(tactician, 'tactician-1-4');
  const shining = arsenal.data.selected.find(kit => kit.name === 'Shining Armor')!;
  const mountain = furyKit.data.selected.find(kit => kit.name === 'Mountain')!;
  arsenal.data.selected = [shining, mountain];
  const result = importForgeText(JSON.stringify(tactician));
  assert.equal(result.selections['kit.choice'], 'Shining Armor');
  assert.equal(result.selections['class.tactician.second-kit'], 'Mountain');
  const reported = result.diagnostics
    .map(d => /\((class\.tactician\.arsenal\.[A-Za-z]+)\)/.exec(d.reason)?.[1])
    .filter(Boolean)
    .sort();
  assert.deepEqual(reported, [
    'class.tactician.arsenal.meleeDamage',
    'class.tactician.arsenal.stability',
    'class.tactician.arsenal.stamina',
  ]);
});

test('V182 a level-three import leaves no level-three choice diagnosed for fully mapped classes', () => {
  for (const id of ['fury', 'shadow', 'tactician', 'troubadour', 'null', 'talent', 'summoner']) {
    const result = importForgeText(heroText(`${id}-level-3`));
    assert.deepEqual(
      result.diagnostics.filter(d => d.path.startsWith('class')),
      [],
      `${id}: class diagnostics`,
    );
  }
});

test('V182 a hero above its class ceiling is refused, naming the ceiling (Q-V-6 interim)', () => {
  // shared/content/character-support.ts: Fury is supported through level three; Shadow through six.
  const fury = JSON.parse(heroText('fury-level-3'));
  fury.class.level = 4;
  assert.equal(
    forgeImportRefusal(importForgeText(JSON.stringify(fury))),
    'This hero is level 4; Salient currently supports Fury heroes up to level 3, so the file was not imported.',
  );
  const shadow = JSON.parse(heroText('shadow-level-3'));
  shadow.class.level = 6;
  assert.equal(forgeImportRefusal(importForgeText(JSON.stringify(shadow))), null);
  shadow.class.level = 7;
  assert.match(
    forgeImportRefusal(importForgeText(JSON.stringify(shadow)))!,
    /Shadow heroes up to level 6/,
  );
});

test('V182 liveSeed reconciles Forge damage and Recoveries used against Salient maxima', () => {
  // SYNTHETIC variant of the retained Grug level-1 export: only state.staminaDamage and
  // state.recoveriesUsed are edited. Maxima 30 and 10 are Grug's hand-derived ledger values.
  const fury = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
    expected: { staminaMaximum: number; recoveriesMaximum: number };
  };
  const maxima = {
    staminaMaximum: fury.expected.staminaMaximum,
    recoveriesMaximum: fury.expected.recoveriesMaximum,
  };
  assert.deepEqual(maxima, { staminaMaximum: 30, recoveriesMaximum: 10 });
  const grug = JSON.parse(
    readFileSync('tests/fixtures/v45-reference/Grug-level-1.ds-hero', 'utf8'),
  );
  grug.state.staminaDamage = 5;
  grug.state.recoveriesUsed = 2;
  const result = importForgeText(JSON.stringify(grug));
  // rule/health/stamina.md and rule/health/recoveries.md: 30 − 5 = 25 Stamina; 10 − 2 = 8 Recoveries.
  assert.deepEqual(forgeLiveSeed(result.playState, maxima), {
    stamina: 25,
    recoveries: 8,
    temporaryStamina: 0,
    surges: 0,
    staminaMaximum: 30,
    recoveriesMaximum: 10,
    forge: { staminaDamage: 5, recoveriesUsed: 2, staminaTemp: 0, surges: 0 },
  });
  // More Recoveries used than Salient's maximum leaves none, never a negative count.
  const spent = forgeLiveSeed({ ...result.playState!, recoveriesUsed: 12 }, maxima);
  assert.equal(spent?.recoveries, 0);
  // ... and says so: 12 used against a maximum of 10.
  assert.deepEqual(
    liveSeedDiagnostics(spent).map(d => d.path),
    ['state.recoveriesUsed'],
  );
  assert.match(liveSeedDiagnostics(spent)[0]!.reason, /12 Recoveries used.*maximum of 10/);
  assert.deepEqual(liveSeedDiagnostics(forgeLiveSeed(result.playState, maxima)), []);
  // Without Salient maxima (an incomplete build) or with malformed Forge fields, nothing is seeded.
  assert.equal(forgeLiveSeed(result.playState, { ...maxima, staminaMaximum: null }), null);
  assert.equal(forgePlayState({ ...grug.state, staminaDamage: -1 }), null);
  assert.equal(forgePlayState({ ...grug.state, surges: '2' }), null);
});

/** Compendium `name:` frontmatter of a file under en/unified/md. */
const compendiumName = (path: string) =>
  /^name: (.+)$/m
    .exec(readFileSync(vendorPath(`vendor/steel-compendium/en/unified/md/${path}`), 'utf8'))![1]!
    .trim();
/** V182 aliases: Forge spelling → the Compendium file whose name is the target. */
const aliasSources: Record<string, string> = {
  'Rapid Fire': 'kit/rapid-fire.md',
  'Back, Blasphemer!': 'feature/ability/censor/level-1/back-blasphemer.md',
  'Every Step ... Death!': 'feature/ability/censor/level-1/every-step-death.md',
  'Halt, Miscreant!': 'feature/ability/censor/level-1/halt-miscreant.md',
  'Behold, a Shield of Faith!': 'feature/ability/censor/level-1/behold-a-shield-of-faith.md',
  'A Meteoric Introduction': 'feature/ability/elementalist/level-1/meteoric-introduction.md',
  'Ray of Agonizing Self Reflection':
    'feature/ability/elementalist/level-1/ray-of-agonizing-self-reflection.md',
  'Death ... Deeaaath!': 'feature/ability/fury/level-2/death-death.md',
  'Rally Cry': 'feature/ability/summoner/level-1/rallying-cry.md',
  'Force Orb': 'feature/ability/talent/level-3/force-orbs.md',
  'Assursed Mummy': 'monster/minion/summoner/undead/statblock/accursed-mummy.md',
};
/** Subclass aliases: the Compendium file names the subclass; Salient's option drops the prefix. */
const subclassSources: Record<string, [file: string, decision: string]> = {
  'College of Black Ash': ['feature/shadow/level-1/shadow-college.md', 'class.shadow.college'],
  'College of Caustic Alchemy': [
    'feature/shadow/level-1/shadow-college.md',
    'class.shadow.college',
  ],
  'College of the Harlequin Mask': [
    'feature/shadow/level-1/shadow-college.md',
    'class.shadow.college',
  ],
  'Circle of Blight': ['feature/summoner/level-1/summoner-circle.md', 'class.summoner.circle'],
  'Circle of Graves': ['feature/summoner/level-1/summoner-circle.md', 'class.summoner.circle'],
  'Circle of Spring': ['feature/summoner/level-1/summoner-circle.md', 'class.summoner.circle'],
  'Circle of Storms': ['feature/summoner/level-1/summoner-circle.md', 'class.summoner.circle'],
};

test('V182 every new Forge name alias resolves to its Compendium name', () => {
  const partA = [
    'Elf (high)',
    'Elf (wode)',
    'Draconic Pride',
    'Remember your Oath',
    'Perseverence',
    'All Is A Feather',
  ];
  assert.deepEqual(
    Object.keys(forgeNameAliases)
      .filter(name => !partA.includes(name))
      .sort(),
    [...Object.keys(aliasSources), ...Object.keys(subclassSources)].sort(),
    'every V182 alias is covered here',
  );
  for (const [forge, file] of Object.entries(aliasSources)) {
    const target = compendiumName(file);
    // Resolves among decoys, so the alias, not a loose match, picks the Compendium name.
    assert.equal(resolveName(forge, ['Decoy', target]), target, forge);
  }
  const decisions = getDefinitions(1).steps.flatMap(step => step.decisions);
  for (const [forge, [file, decisionId]] of Object.entries(subclassSources)) {
    const text = readFileSync(vendorPath(`vendor/steel-compendium/en/unified/md/${file}`), 'utf8');
    assert.ok(text.includes(forge), `${file} names ${forge}`);
    const options = decisions.find(d => d.id === decisionId)!.options!.map(o => o.value);
    const target = forge.replace(/^(College of (the )?|Circle of )/, '');
    assert.ok(options.includes(target), `${decisionId} offers ${target}`);
    assert.equal(resolveName(forge, options), target, forge);
  }
});
