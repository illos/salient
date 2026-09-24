// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { COMPLICATION_ABILITIES } from '../shared/content/supporting-complication-abilities.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { indexDecisions, poolOf } from '../shared/evaluate/structure.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
import { vendorPath } from '../scripts/lib/vendor.ts';

const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));
const definitions = getDefinitions(1);
const build = (selections: Record<string, SelectionValue>) =>
  evaluateCharacter(
    { ...fixture, definitionsSchemaVersion: 'r01.1', selections, level: 1 },
    definitions,
  );

// Catches prose timing collapsed into "other", Recovery spending lost, and flavor-only test
// instructions omitted (Waking Dreams). Coverage is the source-to-action metadata boundary.
test('complication prose actions retain source timing, trigger, costs and complete rules', () => {
  const expected = [
    ['Animal Form', 'Maneuver'],
    ['Curse of Stone: Stone Appearance', 'Free maneuver'],
    ['Gnoll-Mauled: Retaliate', 'Triggered action'],
    ['Guilty Conscience: Stay Alive', 'Free triggered action'],
    ['Host Body: Transfer Host', 'Main action'],
    ['Hawk Rider: Summon Hawk', '1 uninterrupted minute'],
    ['Hawk Rider: Dismiss Hawk', 'No action'],
    ['Hawk Rider: Restore Hawk', 'Respite activity'],
    ['Waking Dreams: Receive Vision', 'During respite'],
    ['Cult Victim: Pass Through Matter', 'During movement'],
    ['Psychic Blast: Forced Eruption', 'Free triggered action'],
    ['Telekinetic Grasp: Ranged Free Strike', 'Ranged free strike'],
    ['Stolen Face: Change Face', '5 uninterrupted minutes'],
  ];
  for (const [name, timing] of expected) {
    const record = COMPLICATION_ABILITIES.find(ability => ability.name === name);
    expect(record, name).toBeDefined();
    expect(record!.actionType).toBe(timing);
    const source = readFileSync(
      vendorPath(`vendor/steel-compendium/${record!.sourcePath}`),
      'utf8',
    );
    expect(source).toContain(record!.text);
    expect(record!.text).toContain('**Drawback:');
  }
  const conscience = COMPLICATION_ABILITIES.find(a => a.name === 'Guilty Conscience: Stay Alive')!;
  expect(conscience.cost).toBe('1 Recovery');
  expect(conscience.trigger).toBe('When your Stamina reaches the negative of your winded value.');
  const dreams = COMPLICATION_ABILITIES.find(a => a.name === 'Waking Dreams: Receive Vision')!;
  expect(dreams.text).toContain('[Reason]');
  expect(dreams.text).toContain('lose 1');
  for (const name of ['Psychic Blast', 'Psychic Blast: Forced Eruption'])
    expect(COMPLICATION_ABILITIES.find(a => a.name === name)!.cost).toBe('All Heroic Resource');
  expect(
    COMPLICATION_ABILITIES.find(a => a.name === 'Psychic Blast: Forced Eruption')!.trigger,
  ).toBe('Whenever you become bleeding, frightened, or weakened.');
});

// Catches source text remaining a feature with no usable grants. Covers a named form, paired
// toggles, three independently timed mount activities, a triggered cost, and a downtime activity.
test('wizard grants prose actions while retaining the granting complication', () => {
  const cases: [string, string[], Record<string, SelectionValue>][] = [
    ['Animal Form', ['Animal Form'], { 'complication.animal-form.animalForm': 'mouse' }],
    [
      'Crash Landed',
      ['Crash Landed: Activate Power Pack', 'Crash Landed: Deactivate Power Pack'],
      {},
    ],
    [
      'Hawk Rider',
      ['Hawk Rider: Summon Hawk', 'Hawk Rider: Dismiss Hawk', 'Hawk Rider: Restore Hawk'],
      {},
    ],
    ['Guilty Conscience', ['Guilty Conscience: Stay Alive'], {}],
    ['Advanced Studies', ['Advanced Studies: Study Notebook'], {}],
  ];
  for (const [complication, expected, extra] of cases) {
    const result = build({ ...fixture.selections, 'complication.choice': complication, ...extra });
    expect(result.status, JSON.stringify(result.diagnostics)).toBe('complete');
    expect(result.baseline!.features.some(feature => feature.name === complication)).toBe(true);
    expect(
      result.baseline!.abilities.filter(a => a.kind === 'complication').map(a => a.name),
    ).toEqual(expected);
  }
});

// Catches the two previously missing one-point Dragon Dreams actions, leaking grants from
// unselected traits, and stale conditional actions after parent replacement.
test('Dragon Dreams grants both one-point trait actions and revokes them on replacement', () => {
  const selected = {
    ...fixture.selections,
    'complication.choice': 'Dragon Dreams',
    'complication.dragon-dreams.traits': ['Draconian Guard', 'Remember Your Oath'],
  };
  const result = build(selected);
  expect(result.status, JSON.stringify(result.diagnostics)).toBe('complete');
  for (const name of ['Draconian Guard', 'Remember Your Oath']) {
    const grant = result.baseline!.abilities.find(ability => ability.name === name)!;
    expect(grant, name).toBeDefined();
    expect(grant.activationCondition).toBe('5 or more Victories');
    expect(grant.provenance.decisionId).toBe('complication.dragon-dreams.traits');
  }
  expect(result.baseline!.abilities.some(a => a.name === 'Dragon Breath')).toBe(false);
  const replaced = changeChoice(selected, definitions, 'complication.choice', 'Crash Landed');
  const after = build(replaced.selections);
  expect(after.status, JSON.stringify(after.diagnostics)).toBe('complete');
  expect(
    after.baseline!.abilities.some(a => ['Draconian Guard', 'Remember Your Oath'].includes(a.name)),
  ).toBe(false);
  expect(after.baseline!.abilities.some(a => a.name === 'Crash Landed: Activate Power Pack')).toBe(
    true,
  );
  expect(after.baseline!.staminaMaximum.value).toBe(result.baseline!.staminaMaximum.value);
});

// Catches availability enforced only in the UI, checking selected traits rather than granted
// features, and omitting Revenant-borrowed immunity. Also proves ordinary eligible builds survive.
test('complication exclusions apply to actual immunity grants and Stormwight aspect', () => {
  const parent = indexDecisions(definitions).get('complication.choice')!;
  const ordinary = { ...fixture.selections, 'complication.choice': 'Gnoll-Mauled' };
  expect(build(ordinary).status).toBe('complete');
  const immunityCases = [
    {
      'ancestry.choice': 'High Elf',
      'ancestry.high-elf.purchased-traits': ['Unstoppable Mind', 'High Senses'],
    },
    {
      'ancestry.choice': 'Time Raider',
      'ancestry.time-raider.purchased-traits': ['Unstoppable Mind', 'Beyondsight'],
    },
    {
      'ancestry.choice': 'Revenant',
      'ancestry.revenant.former-life': 'High Elf',
      'ancestry.revenant.high-elf.purchased-traits': ['Unstoppable Mind'],
    },
  ];
  for (const ancestry of immunityCases) {
    const selected = { ...ordinary, ...ancestry };
    expect(poolOf(parent, selected, definitions).values).not.toContain('Gnoll-Mauled');
    const result = build(selected);
    expect(result.diagnostics['complication.choice']?.some(d => d.severity === 'invalid')).toBe(
      true,
    );
  }
  const stormwight = {
    ...fixture.selections,
    'class.fury.aspect': 'Stormwight',
    'complication.choice': 'Slight Case of Lycanthropy',
  };
  expect(poolOf(parent, stormwight, definitions).values).not.toContain(
    'Slight Case of Lycanthropy',
  );
  expect(
    build(stormwight).diagnostics['complication.choice']?.some(d => d.severity === 'invalid'),
  ).toBe(true);
  expect(build({ ...stormwight, 'class.fury.aspect': 'Berserker' }).status).toBe('complete');
});
