// SPDX-License-Identifier: GPL-3.0-only
/** Every inventoried complication must admit a persisted decision shape on a supported hero.
 * Detailed expected source mechanics are independently asserted by supporting-complications.test.ts.
 */
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { COMPLICATION_EFFECTS } from '../shared/content/supporting-complications.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import {
  indexDecisions,
  isAvailable,
  knowledgeCandidates,
  poolOf,
  pruneUnavailable,
} from '../shared/evaluate/structure.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';

const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8'));
for (const name of Object.keys(COMPLICATION_EFFECTS))
  test(`V37 complete supporting decision path: ${name}`, () => {
    const definitions = getDefinitions(1);
    const decisions = indexDecisions(definitions);
    let selections: Record<string, SelectionValue> = {
      ...fixture.selections,
      'complication.choice': name,
    };
    selections = pruneUnavailable(selections, definitions).selections;
    for (const decision of decisions.values()) {
      if (
        !isAvailable(decision, selections, decisions) ||
        selections[decision.id] !== undefined ||
        decision.optional
      )
        continue;
      if (decision.kind === 'authored' && decision.requiredText) {
        selections[decision.id] =
          'Agreed with the Director: a different creature or source-eligible form.';
        continue;
      }
      if (decision.kind !== 'choice') continue;
      let values = poolOf(decision, selections, definitions).values;
      if (decision.selectionRole === 'skill') {
        const known = new Set(
          knowledgeCandidates(selections, definitions, 'skill', true).map(skill => skill.name),
        );
        values = values.filter(value => !known.has(value));
      }
      if (decision.shape.type === 'single') selections[decision.id] = values[0]!;
      if (decision.shape.type === 'multi')
        selections[decision.id] = values.slice(0, decision.shape.count);
      if (decision.shape.type === 'points') {
        const budget = decision.shape.budget;
        const find = (remaining: number, start = 0): string[] | null => {
          if (!remaining) return [];
          for (let i = start; i < values.length; i++) {
            const cost = decision.options!.find(option => option.value === values[i])!.cost!;
            if (cost > remaining) continue;
            const rest = find(remaining - cost, i + 1);
            if (rest) return [values[i]!, ...rest];
          }
          return null;
        };
        selections[decision.id] = find(budget)!;
      }
    }
    const result = evaluateCharacter(
      {
        definitionsSchemaVersion: 'r01.1',
        compendiumRevision: definitions.compendiumRevision,
        level: 1,
        selections,
      },
      definitions,
    );
    expect(result.status, JSON.stringify(result.diagnostics)).toBe('complete');
    expect(result.baseline!.features.find(feature => feature.kind === 'complication')?.name).toBe(
      name,
    );
  });

test('Mundane scales all three printed immunities with level, while lost skills cannot satisfy perk targets', () => {
  const levelTwo = {
    'class.fury.level-2.perk': 'Danger Sense',
    'class.fury.level-2.aspect-ability': 'Wrecking Ball',
  };
  for (const level of [1, 2]) {
    const definitions = getDefinitions(level);
    const result = evaluateCharacter(
      {
        definitionsSchemaVersion: 'r01.1',
        compendiumRevision: definitions.compendiumRevision,
        level,
        selections: {
          ...fixture.selections,
          ...(level === 2 ? levelTwo : {}),
          'complication.choice': 'Mundane',
        },
      },
      definitions,
    );
    expect(result.status).toBe('complete');
    expect(
      result.baseline!.damageImmunities!.map(item => [item.damageType, item.value.value]).sort(),
    ).toEqual([
      ['corruption', level],
      ['holy', level],
      ['psychic', level],
    ]);
  }
  const definitions = getDefinitions(2);
  const result = evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 2,
      selections: {
        ...fixture.selections,
        ...levelTwo,
        'class.fury.level-2.perk': 'Area of Expertise',
        'class.fury.level-2.perk.area-of-expertise.target': 'Alchemy',
        'complication.choice': 'Ivory Tower',
        'complication.ivory-tower.skills': ['Alchemy', 'Cooking', 'Magic'],
        'complication.ivory-tower.language': ['Ananjali'],
        'complication.ivory-tower.lostSkill': 'Alchemy',
      },
    },
    definitions,
  );
  expect(result.status).toBe('invalid');
  expect(
    result.diagnostics['class.fury.level-2.perk.area-of-expertise.target']?.some(
      diagnostic => diagnostic.code === 'value-not-in-pool',
    ),
  ).toBe(true);
});
