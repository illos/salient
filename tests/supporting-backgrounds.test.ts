// SPDX-License-Identifier: GPL-3.0-only
/** Independent V37 expectations transcribed from the pinned Heroes source. */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { CAREER_INCIDENTS, CORE_PERKS } from '../shared/content/supporting-backgrounds.ts';
import { KIT_BONUS_SOURCES, SUPPORTING_KITS } from '../shared/content/supporting-kits.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import {
  indexDecisions,
  isAvailable,
  isSupported,
  knowledgeCandidates,
  poolOf,
  pruneUnavailable,
} from '../shared/evaluate/structure.ts';
import type { EvaluationInput, SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const defs = () => getDefinitions(1);
const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
  selections: Record<string, SelectionValue>;
};
const base = () => structuredClone(fixture.selections);
const evaluate = (selections: Record<string, SelectionValue>, level = 1) => {
  const definitions = getDefinitions(level);
  const input: EvaluationInput = {
    definitionsSchemaVersion: 'r01.1',
    compendiumRevision: definitions.compendiumRevision,
    level,
    selections,
  };
  return evaluateCharacter(input, definitions);
};
const all = () => defs().steps.flatMap(step => step.decisions);
const readDecision = (id: string) => {
  const found = all().find(d => d.id === id);
  assert.ok(found, id);
  return found;
};
const sorted = (values: string[]) => [...values].sort();
const normalize = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*|_/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// [career, fixed skills, total career skills, extra languages, initial Renown delta, Wealth delta, project points, perk group]
const CAREER_EXPECTATIONS: [string, string[], number, number, number, number, number, string][] = [
  ['Agent', ['Sneak'], 3, 2, 0, 0, 0, 'intrigue'],
  ['Aristocrat', [], 2, 1, 1, 1, 0, 'lore'],
  ['Artisan', [], 2, 1, 0, 0, 240, 'crafting'],
  ['Beggar', ['Rumors'], 3, 2, 0, 0, 0, 'interpersonal'],
  ['Criminal', ['Criminal Underworld'], 3, 1, 0, 0, 120, 'intrigue'],
  ['Disciple', ['Religion'], 3, 0, 0, 0, 240, 'supernatural'],
  ['Explorer', ['Navigate'], 3, 2, 0, 0, 0, 'exploration'],
  ['Farmer', ['Handle Animals'], 3, 1, 0, 0, 120, 'exploration'],
  ['Gladiator', [], 2, 1, 2, 0, 0, 'exploration'],
  ['Laborer', ['Endurance'], 3, 1, 0, 0, 120, 'exploration'],
  ["Mage's Apprentice", ['Magic'], 3, 1, 1, 0, 0, 'supernatural'],
  ['Performer', [], 3, 0, 2, 0, 0, 'interpersonal'],
  ['Politician', [], 2, 1, 1, 1, 0, 'interpersonal'],
  ['Sage', [], 2, 1, 0, 0, 240, 'lore'],
  ['Sailor', ['Swim'], 3, 2, 0, 0, 0, 'exploration'],
  ['Soldier', [], 2, 2, 1, 0, 0, 'exploration'],
  ['Warden', ['Nature'], 3, 1, 0, 0, 120, 'exploration'],
  ['Watch Officer', ['Alertness'], 3, 2, 0, 0, 0, 'exploration'],
];
for (const [
  career,
  fixed,
  skills,
  languages,
  renown,
  wealth,
  projectPoints,
  group,
] of CAREER_EXPECTATIONS) {
  test(`V37 ${career}: source skill/language/perk counts and initial rewards`, () => {
    const selections = base();
    for (const id of Object.keys(selections)) if (id.startsWith('career.')) delete selections[id];
    selections['career.choice'] = career;
    const decisions = all().filter(
      d => d.availableWhen?.decision === 'career.choice' && d.availableWhen.value === career,
    );
    assert.deepEqual(
      sorted(
        decisions
          .filter(d => d.kind === 'automatic')
          .flatMap(d => (d.grants ?? []).filter(g => g.kind === 'skill').map(g => g.value)),
      ),
      sorted(fixed),
    );
    const skillDecisions = decisions.filter(
      d => d.kind === 'choice' && d.selectionRole === 'skill',
    );
    assert.equal(
      fixed.length +
        skillDecisions.reduce(
          (sum, d) =>
            sum + (d.shape.type === 'single' || d.shape.type === 'multi' ? d.shape.count : 0),
          0,
        ),
      skills,
    );
    const language = decisions.find(d => d.selectionRole === 'language');
    assert.equal(language?.shape.type === 'multi' ? language.shape.count : 0, languages);
    if (language) {
      assert.equal(language.shape.type, 'multi');
      if (language.shape.type === 'multi') assert.equal(language.shape.deferrable, true);
    }
    const perk = decisions.find(d => d.id.endsWith('.perk'))!;
    assert.deepEqual(
      sorted(poolOf(perk, selections, defs()).values),
      sorted(CORE_PERKS.filter(p => p.group === group).map(p => p.name)),
    );
    const incidents = decisions.find(d => d.id.endsWith('.inciting-incident'))!;
    assert.equal(poolOf(incidents, selections, defs()).values.length, 6);
    assert.equal(CAREER_INCIDENTS[career]?.length, 6);
    assert.ok(CAREER_INCIDENTS[career]!.every(i => i.text.length > 60));
    const result = evaluate(selections);
    const stats = result.baseline ?? result.partial;
    assert.equal(stats?.renown?.value, renown);
    assert.equal(stats?.wealth?.value, 1 + wealth);
    const grant = decisions.find(d => d.id.endsWith('.project-points'));
    assert.equal(grant ? Number(grant.quote.match(/\d+/)?.[0]) : 0, projectPoints);
  });
}

test('V37 all thirteen culture aspect pools preserve union counts and mixed explicit skills', () => {
  const expected: [string, string, string[], string[]][] = [
    ['environment', 'Nomadic', ['exploration', 'interpersonal'], []],
    ['environment', 'Rural', ['crafting', 'lore'], []],
    ['environment', 'Secluded', ['interpersonal', 'lore'], []],
    ['environment', 'Urban', ['interpersonal', 'intrigue'], []],
    ['environment', 'Wilderness', ['crafting', 'exploration'], []],
    ['organization', 'Bureaucratic', ['interpersonal', 'intrigue'], []],
    ['organization', 'Communal', ['crafting', 'exploration'], []],
    ['upbringing', 'Academic', ['lore'], []],
    ['upbringing', 'Creative', ['crafting'], ['Music', 'Perform']],
    ['upbringing', 'Labor', ['exploration'], ['Blacksmithing', 'Handle Animals']],
    ['upbringing', 'Lawless', ['intrigue'], []],
    [
      'upbringing',
      'Martial',
      [],
      [
        'Blacksmithing',
        'Fletching',
        'Climb',
        'Endurance',
        'Ride',
        'Intimidate',
        'Alertness',
        'Track',
        'Monsters',
        'Strategy',
      ],
    ],
    ['upbringing', 'Noble', ['interpersonal'], []],
  ];
  const ledger = JSON.parse(readFileSync('docs/research/v37-backgrounds.json', 'utf8')) as {
    skills: { name: string; group: string }[];
  };
  for (const [aspect, value, groups, names] of expected) {
    const selections = { ...base(), [`culture.${aspect}`]: value };
    const choice = readDecision(`culture.${aspect}.skill`);
    assert.equal(choice.shape.type, 'single');
    const pool = poolOf(choice, selections, defs()).values;
    assert.deepEqual(
      sorted(pool),
      sorted([
        ...new Set([
          ...names,
          ...ledger.skills.filter(s => groups.includes(s.group)).map(s => s.name),
        ]),
      ]),
    );
    assert.ok(pool.every(name => isSupported(choice, name)));
    assert.ok(isSupported(readDecision(`culture.${aspect}`), value));
  }
});

// [name, Stamina/echelon, speed, stability] copied from the source Kits Table, not SUPPORTING_KITS.
const KITS: [string, number, number, number][] = [
  ['Arcane Archer', 0, 1, 0],
  ['Battlemind', 3, 2, 1],
  ['Cloak and Dagger', 3, 2, 0],
  ['Dual Wielder', 6, 2, 0],
  ['Guisarmier', 6, 0, 1],
  ['Martial Artist', 3, 3, 0],
  ['Mountain', 9, 0, 2],
  ['Panther', 6, 1, 1],
  ['Pugilist', 6, 2, 1],
  ['Raider', 6, 1, 0],
  ['Ranger', 6, 1, 0],
  ['Rapid-Fire', 3, 1, 0],
  ['Retiarius', 3, 1, 0],
  ['Shining Armor', 12, 0, 1],
  ['Sniper', 0, 1, 0],
  ['Spellsword', 6, 1, 1],
  ['Stick and Robe', 3, 2, 0],
  ['Swashbuckler', 3, 3, 0],
  ['Sword and Board', 9, 0, 1],
  ['Warrior Priest', 9, 1, 1],
  ['Whirlwind', 0, 3, 0],
];
for (const [kit, stamina, speed, stability] of KITS) {
  test(`V37 ${kit}: derived kit baseline and printed signature source`, () => {
    const result = evaluate({ ...base(), 'kit.choice': kit });
    assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
    assert.equal(result.baseline?.staminaMaximum.value, 21 + stamina);
    assert.equal(result.baseline?.speed.value, 6 + speed); // Devil Beast Legs.
    assert.equal(result.baseline?.stability.value, stability);
    assert.ok(
      result.baseline?.abilities.some(
        a => a.sourcePath === SUPPORTING_KITS[kit]!.entryPath && a.kitBonusesIncluded,
      ),
    );
  });
}

test('V37 ordinary kit selector excludes the four Stormwight catalog records', () => {
  const choice = readDecision('kit.choice');
  const offered = poolOf(choice, base(), defs()).values.filter(name => isSupported(choice, name));
  assert.deepEqual(sorted(offered), sorted(KITS.map(row => row[0])));
  assert.equal(Object.keys(SUPPORTING_KITS).length, 25);
  for (const kit of ['Boren', 'Corven', 'Raden', 'Vuken']) {
    assert.ok(SUPPORTING_KITS[kit]);
    assert.notEqual(evaluate({ ...base(), 'kit.choice': kit }).status, 'complete');
  }
  const elementalist = { ...base(), 'class.choice': 'Elementalist' };
  assert.equal(isAvailable(choice, elementalist, indexDecisions(defs())), false);
});

test('V37 every kit numeric citation exists in its actual source, including omitted-zero table cells', () => {
  for (const [kit, fields] of Object.entries(KIT_BONUS_SOURCES)) {
    for (const [field, reference] of Object.entries(fields)) {
      if (!reference) continue;
      assert.ok(reference.quote.length > 0, `${kit} ${field}`);
      const source = normalize(
        readFileSync(join('vendor/steel-compendium', reference.path), 'utf8'),
      );
      assert.ok(
        source.includes(normalize(reference.quote)),
        `${kit} ${field}: ${reference.path} lacks ${reference.quote}`,
      );
    }
  }
});

test('V37 all47 core perks have canonical source paths and FuryL2 retains its restricted22-option pool', () => {
  assert.equal(CORE_PERKS.length, 47);
  assert.equal(new Set(CORE_PERKS.map(p => p.name)).size, 47);
  const counts = Object.fromEntries(
    ['crafting', 'exploration', 'interpersonal', 'intrigue', 'lore', 'supernatural'].map(group => [
      group,
      CORE_PERKS.filter(p => p.group === group).length,
    ]),
  );
  assert.deepEqual(counts, {
    crafting: 6,
    exploration: 10,
    interpersonal: 10,
    intrigue: 6,
    lore: 8,
    supernatural: 7,
  });
  const d = getDefinitions(2)
    .steps.flatMap(step => step.decisions)
    .find(d => d.id === 'class.fury.level-2.perk')!;
  assert.equal(d.options?.filter(o => o.supportedInV001).length, 22);
  assert.ok(!d.options?.some(o => o.value === 'Linguist' || o.value === 'Born Tracker'));
});

test('V37 an owned-skill target does not grant a skill and disappears with its source perk', () => {
  const selections = base();
  for (const id of Object.keys(selections))
    if (id.startsWith('career.soldier.')) delete selections[id];
  Object.assign(selections, {
    'career.choice': 'Artisan',
    'career.artisan.perk': 'Area of Expertise',
  });
  const target = readDecision('career.artisan.perk.area-of-expertise.target');
  assert.equal(target.selectionRole, 'skill-target');
  assert.deepEqual(poolOf(target, selections, defs()).values, ['Blacksmithing']);
  assert.ok(
    !knowledgeCandidates({ ...selections, [target.id]: 'Blacksmithing' }, defs(), 'skill').some(
      s => s.decisionId === target.id,
    ),
  );
  const bad = evaluate({ ...selections, [target.id]: 'Alchemy' });
  assert.ok(bad.diagnostics[target.id]?.some(d => d.code === 'value-not-in-pool'));
  const changed = pruneUnavailable(
    { ...selections, [target.id]: 'Blacksmithing', 'career.artisan.perk': 'Handy' },
    defs(),
  );
  assert.equal(changed.selections[target.id], undefined);
});

test('V37 Linguist grants exactly two new/deferred languages with source exposure instruction', () => {
  const selections = { ...base(), 'career.choice': 'Sage', 'career.sage.perk': 'Linguist' };
  const choice = readDecision('career.sage.perk.linguist.languages');
  assert.deepEqual(choice.shape, { type: 'multi', count: 2, deferrable: true });
  assert.match(choice.quote, /regularly heard.*seen them written/);
  assert.ok(poolOf(choice, selections, defs()).values.includes('Ananjali'));
  assert.ok(!poolOf(choice, selections, defs()).values.includes('Caelian'));
  assert.ok(!poolOf(choice, selections, defs()).values.includes('Anjali'));
  const result = evaluate({ ...selections, [choice.id]: ['Anjali', null] });
  assert.ok(
    result.diagnostics[choice.id]?.some(
      d => d.code === 'duplicate-language' || d.code === 'value-not-in-pool',
    ),
  );
});

test('V37 fixed Warden/Fury Nature duplication grants one unrestricted replacement entitlement', () => {
  const selections = base();
  for (const id of Object.keys(selections))
    if (id.startsWith('career.soldier.')) delete selections[id];
  selections['career.choice'] = 'Warden';
  const index = indexDecisions(defs());
  const replacements = all().filter(
    d => d.duplicateFixedSkill?.skill === 'Nature' && isAvailable(d, selections, index),
  );
  assert.equal(replacements.length, 1);
  assert.ok(poolOf(replacements[0]!, selections, defs()).values.includes('Alchemy'));
  assert.ok(poolOf(replacements[0]!, selections, defs()).values.includes('Music'));
  const result = evaluate({ ...selections, [replacements[0]!.id]: 'Alchemy' });
  const stats = result.baseline ?? result.partial;
  assert.equal(stats?.skills?.filter(s => s.name === 'Nature').length, 1);
  assert.equal(stats?.skills?.filter(s => s.name === 'Alchemy').length, 1);
});
