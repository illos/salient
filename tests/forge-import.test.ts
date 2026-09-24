// SPDX-License-Identifier: GPL-3.0-only
/**
 * V09 part a: Forge Steel import of the retained exports. Expected selections are the hand-derived,
 * Compendium-audited fixtures (tests/fixtures/v25-fury.json, v25-bethell.json,
 * v32-fury-level-two.json), never the importer's output.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ForgeShapeError,
  importForgeHero,
  importForgeText,
} from '../shared/interchange/forge-steel/import.ts';

const directory = 'tests/fixtures/v45-reference/';
const read = (path: string) => readFileSync(path, 'utf8');
const expectedSelections = (fixture: string) =>
  (JSON.parse(read(`tests/fixtures/${fixture}.json`)) as { selections: Record<string, unknown> })
    .selections;
/**
 * Lists compare as multisets: Forge keeps no slot order for list choices, and a deferred language
 * slot is an open (null) slot wherever it sits. Scalars and assignments compare exactly.
 */
const comparable = (selections: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(selections).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(item => String(item)).sort() : value,
    ]),
  );

const examples = [
  { file: 'Grug-level-1.ds-hero', fixture: 'v25-fury', level: 1 },
  { file: 'Grug-level-2.ds-hero', fixture: 'v32-fury-level-two', level: 2 },
  { file: 'Bethell-corrected-export.ds-hero', fixture: 'v25-bethell', level: 1 },
];

for (const example of examples)
  test(`V09 ${example.file} imports exactly the fixture selections`, () => {
    const result = importForgeText(read(`${directory}${example.file}`));
    const expected = { ...expectedSelections(example.fixture) };
    assert.equal(result.level, example.level);
    if (example.fixture === 'v25-bethell') {
      // The documented authored-name-only difference (tests/character-v45-reference.test.ts).
      assert.equal(expected['details.name'], 'Bethell');
      expected['details.name'] = 'Bethell Corrected V25';
    }
    assert.deepEqual(comparable(result.selections), comparable(expected));
    assert.equal(result.authored.name, expected['details.name']);
    assert.equal(result.authored.notes, '');
    // Nothing selection-bearing is left unmapped in these exports; only enablement/state notes.
    const expectedUnmapped = ['sourcebookIDs', ...(example.level === 2 ? ['state.xp'] : [])];
    assert.deepEqual(result.unmapped, expectedUnmapped.sort());
    assert.deepEqual(result.diagnostics.map(d => d.path).sort(), expectedUnmapped.sort());
  });

test('V09 malformed input and a wrong shape are rejected', () => {
  assert.throws(() => importForgeText('{"name": "Grug",'), ForgeShapeError);
  assert.throws(() => importForgeText('[]'), ForgeShapeError);
  assert.throws(() => importForgeText('{"name":"Grug"}'), ForgeShapeError);
  const hero = JSON.parse(read(`${directory}Grug-level-1.ds-hero`));
  hero.class.level = 'one';
  assert.throws(() => importForgeHero(hero), /class\.level must be an integer/);
  const nested = JSON.parse(read(`${directory}Grug-level-1.ds-hero`));
  nested.career.features[0].type = 7;
  assert.throws(() => importForgeHero(nested), /career\.features\[0\]\.type/);
});

test('V09 an incomplete valid hero imports as a partial draft, not an error', () => {
  const hero = JSON.parse(read(`${directory}Grug-level-1.ds-hero`));
  hero.class = null;
  hero.career = null;
  const result = importForgeHero(hero);
  assert.equal(result.level, 1);
  assert.equal(result.selections['ancestry.choice'], 'Devil');
  assert.equal(result.selections['class.choice'], undefined);
  assert.equal(result.selections['career.choice'], undefined);
});

test('V09 unmapped and unmatched Forge data become diagnostics and leave decisions empty', () => {
  const hero = JSON.parse(read(`${directory}Grug-level-1.ds-hero`));
  hero.complication = { id: 'complication-x', name: 'Amnesia', features: [] };
  hero.state.inventory = [{ id: 'item-x', name: 'Rope' }];
  hero.state.titles = [{ id: 'title-x', name: 'Ratcatcher' }];
  hero.state.projects = [{ id: 'project-x', name: 'Forge a sword' }];
  hero.abilityCustomizations = [{ abilityID: 'fury-ability-1', name: 'Renamed' }];
  hero.state.staminaDamage = 5;
  hero.state.recoveriesUsed = 2;
  hero.folder = 'Campaign A';
  // A trait the Compendium Devil list does not contain (feature/trait/devil/devil-traits.md).
  const traits = hero.ancestry.features.find((f: { id: string }) => f.id === 'devil-feature-2');
  traits.data.selected[1].name = 'Homebrew Horns';
  // class/fury.md grants Nature; Forge lets the player choose any skill in that slot.
  const nature = hero.class.featuresByLevel[0].features.find(
    (f: { id: string }) => f.id === 'fury-1-1',
  );
  nature.data.selected = ['Swim'];
  // An active choice with no scoped rule.
  hero.features.push({
    id: 'homebrew-choice',
    name: 'Homebrew Skill',
    type: 'Skill Choice',
    data: { options: [], listOptions: ['Lore'], count: 1, selectAt: 'build', selected: ['Magic'] },
  });
  const result = importForgeHero(hero);
  const byPath = (path: string) => result.diagnostics.filter(d => d.path === path);
  for (const path of [
    'complication',
    'state.inventory',
    'state.titles',
    'state.projects',
    'abilityCustomizations',
    'state.staminaDamage',
    'state.recoveriesUsed',
    'folder',
  ]) {
    assert.equal(byPath(path).length, 1, path);
    assert.ok(result.unmapped.includes(path), path);
  }
  assert.equal(byPath('complication')[0]!.name, 'Amnesia');
  assert.equal(result.selections['ancestry.devil.purchased-traits'], undefined);
  const traitNote = result.diagnostics.find(d => d.forgeId === 'devil-feature-2')!;
  assert.match(traitNote.reason, /"Homebrew Horns" is not an option/);
  const natureNote = result.diagnostics.find(d => d.forgeId === 'fury-1-1')!;
  assert.match(natureNote.reason, /grants Nature .*class\/fury\.md.*Swim/);
  const homebrew = result.diagnostics.find(d => d.forgeId === 'homebrew-choice')!;
  assert.equal(homebrew.path, 'features[1]');
  // Unaffected choices still map.
  assert.equal(result.selections['class.fury.signature-ability'], 'Brutal Slam');
});

test('V09 scoped rules do not fire outside their branch', () => {
  // The same Forge feature id under a different ancestry scope is not the Devil skill choice.
  const hero = JSON.parse(read(`${directory}Grug-level-1.ds-hero`));
  hero.ancestry.id = 'ancestry-homebrew';
  hero.ancestry.name = 'Homebrew';
  const result = importForgeHero(hero);
  assert.equal(result.selections['ancestry.choice'], undefined);
  assert.equal(result.selections['ancestry.devil.silver-tongue-skill'], undefined);
  assert.ok(result.diagnostics.some(d => d.forgeId === 'devil-feature-1b'));
  assert.ok(result.diagnostics.some(d => d.forgeId === 'devil-feature-2'));
  assert.ok(result.diagnostics.some(d => d.path === 'ancestry.name'));
});
