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
import { forgeLiveSeed, forgePlayState } from '../shared/interchange/forge-steel/state.ts';
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
  // Without Salient maxima (an incomplete build) or with malformed Forge fields, nothing is seeded.
  assert.equal(forgeLiveSeed(result.playState, { ...maxima, staminaMaximum: null }), null);
  assert.equal(forgePlayState({ ...grug.state, staminaDamage: -1 }), null);
  assert.equal(forgePlayState({ ...grug.state, surges: '2' }), null);
});
