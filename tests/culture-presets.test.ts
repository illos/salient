// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CULTURE_PRESETS, CULTURE_PRESET_SOURCE } from '../shared/content/culture-presets.ts';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
  selections: Record<string, SelectionValue>;
};
const chapterEntries = JSON.parse(
  readFileSync('shared/content/compendium/chapter.json', 'utf8'),
) as {
  sourcePath: string;
  text: string;
}[];
const background = chapterEntries.find(entry =>
  entry.sourcePath.endsWith(CULTURE_PRESET_SOURCE),
)!.text;

function sourceRows(heading: string): string[][] {
  return background
    .split(`###### ${heading}\n`)[1]!
    .split(/\n#{1,6} /)[0]!
    .split('\n')
    .filter(line => line.startsWith('|'))
    .slice(2)
    .map(line =>
      line
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim()),
    );
}

// Catches omitted presets, transposed aspects and Forge-only spellings; expected values come
// directly from the independently audited Compendium tables, never from the preset mapping.
test('culture presets match every pinned ancestral and archetypical source row', () => {
  for (const [category, heading] of [
    ['ancestral', 'Typical Ancestry Cultures Table'],
    ['professional', 'Archetypical Cultures Table'],
  ] as const) {
    const source = sourceRows(heading).map(([name, ...values]) => [name!.toLowerCase(), ...values]);
    const catalog = CULTURE_PRESETS.filter(preset => preset.category === category).map(preset => [
      preset.name.toLowerCase(),
      ...(preset.language ? [preset.language] : []),
      preset.environment,
      preset.organization,
      preset.upbringing,
    ]);
    expect(catalog).toEqual(source);
  }
});

// Catches ancestry-gated templates, clearing valid child skills, carrying invalid old skills,
// or granting invented professional languages. Adds atomic transition proof beyond catalog data.
test('presets change culture independently and prune only invalid dependent skills', () => {
  const definitions = getDefinitions(1);
  const dwarf = { ...fixture.selections, 'ancestry.choice': 'Dwarf' };
  const wode = changeChoice(dwarf, definitions, 'culture.preset', 'Wode Elf');
  expect(wode.selections).toMatchObject({
    'ancestry.choice': 'Dwarf',
    'culture.preset': 'Wode Elf',
    'culture.name': 'Wode Elf',
    'culture.language': 'Yllyric',
    'culture.environment': 'Wilderness',
    'culture.organization': 'Bureaucratic',
    'culture.upbringing': 'Martial',
    'culture.environment.skill': 'Swim',
    'culture.upbringing.skill': 'Intimidate',
  });
  expect(wode.selections['culture.organization.skill']).toBeUndefined();
  expect(wode.removed).toContain('culture.organization.skill');
  const pirate = changeChoice(wode.selections, definitions, 'culture.preset', 'Pirate Crew');
  expect(pirate.selections).toMatchObject({
    'ancestry.choice': 'Dwarf',
    'culture.name': 'Pirate Crew',
    'culture.language': 'Yllyric',
    'culture.environment': 'Nomadic',
    'culture.organization': 'Communal',
    'culture.upbringing': 'Lawless',
  });
  const human = changeChoice(pirate.selections, definitions, 'ancestry.choice', 'Human');
  expect(human.selections['culture.preset']).toBe('Pirate Crew');
  expect(human.selections['culture.language']).toBe('Yllyric');
});

// Catches a preset falsely remaining selected after customization, resetting a bespoke build,
// and treating a professional culture's freely chosen language as a conflicting preset default.
test('culture customization marks bespoke without locking or erasing existing choices', () => {
  const definitions = getDefinitions(1);
  const original = changeChoice(
    fixture.selections,
    definitions,
    'culture.preset',
    'Dwarf',
  ).selections;
  for (const [id, value] of [
    ['culture.name', 'Under the Mountain'],
    ['culture.environment', 'Urban'],
    ['culture.organization', 'Communal'],
    ['culture.upbringing', 'Academic'],
    ['culture.language', 'Yllyric'],
  ]) {
    const custom = changeChoice(original, definitions, id!, value).selections;
    expect(custom['culture.preset']).toBe('Bespoke');
    expect(custom[id!]).toBe(value);
    if (id !== 'culture.name') expect(custom['culture.name']).toBe('Dwarf');
  }
  const bespoke = changeChoice(original, definitions, 'culture.preset', 'Bespoke').selections;
  expect(bespoke).toEqual({ ...original, 'culture.preset': 'Bespoke' });
  const professional = changeChoice(
    original,
    definitions,
    'culture.preset',
    'Artisan Guild',
  ).selections;
  const language = changeChoice(professional, definitions, 'culture.language', 'Voll').selections;
  expect(language['culture.preset']).toBe('Artisan Guild');
  expect(language['culture.language']).toBe('Voll');
});
