// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import fury from './fixtures/v25-fury.json' with { type: 'json' };
import elementalist from './fixtures/v25-bethell.json' with { type: 'json' };
import traitCorpus from '../shared/content/compendium/trait.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { pruneUnavailable } from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const definitions = getDefinitions(1);
const traitsId = 'ancestry.human.purchased-traits';
function selections(
  traits: string[],
  fixture: Record<string, SelectionValue> = elementalist.selections,
) {
  const choices = { ...fixture };
  for (const id of Object.keys(choices)) if (id.startsWith('ancestry.')) delete choices[id];
  return { ...choices, 'ancestry.choice': 'Human', [traitsId]: traits };
}
const evaluate = (choices: Record<string, SelectionValue>) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections: choices,
    },
    definitions,
  );

// Catches applying +2 to healing amount instead of recovery count, or dropping it in one class path.
test('Human quick build adds recovery capacity for kit and no-kit classes without changing healing or ordinary speed', () => {
  for (const [fixture, capacity, healing, stamina, stability] of [
    [elementalist.selections, 10, 6, 18, 0],
    [fury.selections, 12, 10, 30, 2],
  ] as const) {
    const result = evaluate(selections(['Perseverance', 'Staying Power'], fixture));
    expect(result.status).toBe('complete');
    const hero = result.baseline!;
    expect(hero.recoveriesMaximum.value).toBe(capacity);
    expect(hero.recoveryValue.value).toBe(healing);
    expect(hero.staminaMaximum.value).toBe(stamina);
    expect(hero.speed.value).toBe(5);
    expect(hero.stability.value).toBe(stability);
    expect(hero.size.value).toBe('1M');
    expect(hero.recoveriesMaximum.provenance.some(p => p.selection === 'Staying Power')).toBe(true);
  }
});

// Catches conditional damage/condition responses being misrepresented as permanent immunity,
// and grants whose source cards are missing from the shipped corpus. Covers all non-quick-build purchases.
test('Human supernatural responses remain readable manual rules, including the signature maneuver', () => {
  for (const traits of [
    ['Determination', "Can't Take Hold"],
    ['Perseverance', 'Resist the Unnatural', "Can't Take Hold"],
  ]) {
    const result = evaluate(selections(traits));
    expect(result.status).toBe('complete');
    const hero = result.baseline!;
    expect(hero.traits.map(t => t.name).sort()).toEqual(
      [...traits, 'Detect the Supernatural'].sort(),
    );
    expect(hero.damageImmunities ?? []).toEqual([]);
    expect(hero.conditionImmunities ?? []).toEqual([]);
    expect(hero.recoveriesMaximum.value).toBe(8);
    expect(hero.speed.value).toBe(5);
    for (const trait of hero.traits) {
      const source = traitCorpus.find(
        entry => entry.sourcePath === `vendor/steel-compendium/${trait.sourcePath}`,
      );
      expect(source, `${trait.name} source must ship`).toBeDefined();
      if (trait.name === 'Detect the Supernatural') {
        expect(source!.text).toContain('As a maneuver');
        expect(source!.text).toContain('within 5 squares');
      }
      if (trait.name === 'Resist the Unnatural') expect(source!.text).toContain('triggered action');
      if (trait.name === 'Determination') expect(source!.text).toContain('end one');
    }
  }
});

// Catches allowing both two-point traits, and leaking Staying Power from a refused purchase list.
test('Human four-point purchases refuse the build and grant no extra recoveries', () => {
  const result = evaluate(selections(['Determination', 'Staying Power']));
  expect(result.status).toBe('invalid');
  expect(result.diagnostics[traitsId]?.map(d => d.code)).toContain('budget-exceeded');
  expect(result.partial!.recoveriesMaximum!.value).toBe(8);
});

// Catches a full-edit ancestry switch retaining Human recovery capacity or its signature.
test('Replacing Human removes its traits and recovery bonus while preserving class choices', () => {
  const changed = pruneUnavailable(
    {
      ...selections(['Perseverance', 'Staying Power']),
      'ancestry.choice': 'Polder',
      'ancestry.polder.purchased-traits': ['Corruption Immunity', 'Fearless', 'Graceful Retreat'],
    },
    definitions,
  );
  expect(changed.removed).toContain(traitsId);
  const hero = evaluate(changed.selections).baseline!;
  expect(hero.recoveriesMaximum.value).toBe(8);
  expect(hero.size.value).toBe('1S');
  expect(hero.class.value).toBe('Elementalist');
  expect(hero.traits.some(t => t.name === 'Detect the Supernatural')).toBe(false);
});
