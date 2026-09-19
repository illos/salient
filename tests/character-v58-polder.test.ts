// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import reference from './fixtures/v25-bethell.json' with { type: 'json' };
import { definitions } from '../shared/content/level-one-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';

const traitsId = 'ancestry.polder.purchased-traits';
const evaluate = (traits: string[]) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: reference.compendiumRevision,
      level: 1,
      selections: { ...reference.selections, [traitsId]: traits },
    },
    definitions,
  );

// Source: pinned feature/trait/polder/{nimblestep,polder-geist,reactive-tumble}.
// Catches unsupported options or accidental always-on movement bonuses; V25 only
// exercised Corruption Immunity/Fearless/Graceful Retreat, never these three traits.
test('Polder manual movement traits complete a four-point build without permanent speed or Disengage bonuses', () => {
  const result = evaluate(['Nimblestep', 'Polder Geist', 'Reactive Tumble']);
  expect(result.status).toBe('complete');
  const baseline = result.baseline!;
  expect(baseline.traits.map(trait => trait.name).sort()).toEqual([
    'Nimblestep',
    'Polder Geist',
    'Reactive Tumble',
    'Shadowmeld',
    'Small!',
  ]);
  expect(baseline.speed.value).toBe(5);
  expect(baseline.disengage.value).toBe(1);
  expect(baseline.size.value).toBe('1S');
  expect(baseline.damageImmunities ?? []).toEqual([]);
  expect(baseline.conditionImmunities ?? []).toEqual([]);
  expect(baseline.abilities.filter(ability => ability.name === 'Shadowmeld')).toHaveLength(1);
});

// Distinct failure: enabling the new options with wrong costs or a relaxed budget
// would accept five points. The exact-boundary build proves Nimblestep costs two
// while all three newly enabled options remain compatible with older traits.
test('Polder new and existing traits share the four-point budget and an overspend grants no purchased traits', () => {
  const exact = evaluate(['Nimblestep', 'Fearless']);
  expect(exact.status).toBe('complete');
  expect(exact.baseline!.conditionImmunities?.map(row => row.condition)).toEqual(['frightened']);
  const over = evaluate(['Nimblestep', 'Fearless', 'Polder Geist']);
  expect(over.status).toBe('invalid');
  expect(over.diagnostics[traitsId]?.map(row => row.code)).toContain('budget-exceeded');
  expect(over.partial?.traits?.filter(trait => trait.kind === 'ancestry-purchased-trait')).toEqual(
    [],
  );
});
