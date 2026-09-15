// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from 'vitest';
import definitionsJson from '../shared/content/fury-level-one-decisions.json' with { type: 'json' };
import examples from '../shared/content/character-evaluation-examples.json' with { type: 'json' };
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import type { DecisionDefinitions } from '../shared/evaluate/definitions.ts';
import type { EvaluationInput } from '../shared/contracts/characterEvaluation.ts';

const definitions = definitionsJson as unknown as DecisionDefinitions;
const fixture = examples.examples.complete.input as EvaluationInput;
const evaluate = (selections: EvaluationInput['selections']) =>
  evaluateCharacter({ ...fixture, selections }, definitions);

test.each([['Impressive Horns'], []])(
  'Q-CHAR-10 permits an otherwise complete under-budget ancestry: %j',
  (...traits) => {
    // test.each spreads its row; both the two-point and zero-point selections are intentional.
    const selected = traits.filter(value => typeof value === 'string');
    const result = evaluate({ ...fixture.selections, 'ancestry.devil.purchased-traits': selected });
    expect(result.status).toBe('complete');
    expect(result.baseline!.uncertainties).toEqual([]);
    const warnings = result.diagnostics['ancestry.devil.purchased-traits']!;
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ severity: 'warning', code: 'budget-unspent' });
    expect(warnings[0]).not.toHaveProperty('uncertainty');
    expect(warnings[0]!.message).not.toContain('open');
  },
);

test('Q-CHAR-10 does not complete missing choices or permit overspending', () => {
  const selections: EvaluationInput['selections'] = {
    ...fixture.selections,
    'ancestry.devil.purchased-traits': ['Impressive Horns'],
  };
  delete selections['kit.choice'];
  expect(evaluate(selections).status).toBe('incomplete');
  expect(
    evaluate({
      ...fixture.selections,
      'ancestry.devil.purchased-traits': ['Impressive Horns', 'Wings'],
    }).status,
  ).toBe('invalid');
});

test('Q-CHAR-11 reserves a later fixed Lift grant before an earlier discretionary choice', () => {
  const selections = { ...fixture.selections, 'career.soldier.skill.exploration': 'Lift' };
  const result = evaluate(selections);
  expect(result.status).toBe('invalid');
  expect(result.diagnostics['career.soldier.skill.exploration']).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ severity: 'invalid', code: 'duplicate-skill' }),
    ]),
  );
  const lift = result.partial!.skills!.filter(skill => skill.name === 'Lift');
  expect(lift).toHaveLength(1);
  expect(lift[0]!.provenance.decisionId).toBe('class.fury.aspect');
  expect(evaluate(Object.fromEntries(Object.entries(selections).reverse()))).toEqual(result);
});

test('Q-CHAR-11 chosen collisions invalidate both choices without minting replacement grants', () => {
  const selections = { ...fixture.selections, 'career.soldier.skill.exploration': 'Swim' };
  const result = evaluate(selections);
  expect(result.status).toBe('invalid');
  for (const id of ['culture.environment.skill', 'career.soldier.skill.exploration'])
    expect(result.diagnostics[id]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate-skill', severity: 'invalid' }),
      ]),
    );
  expect(result.partial!.skills!.some(skill => skill.name === 'Swim')).toBe(false);
  expect(
    result.partial!.skills!.filter(skill => ['Nature', 'Lift'].includes(skill.name)),
  ).toHaveLength(2);
  expect(evaluate(Object.fromEntries(Object.entries(selections).reverse()))).toEqual(result);
});

test('the supported skill set has distinct fixed and discretionary grants and no stale open tags', () => {
  const result = evaluate(fixture.selections);
  expect(result.status).toBe('complete');
  expect(new Set(result.baseline!.skills.map(skill => skill.name)).size).toBe(10);
  expect(result.baseline!.uncertainties).toEqual([]);
  expect(definitionsJson.questions).toEqual([]);
  for (const decision of definitions.steps.flatMap(step => step.decisions))
    expect(decision.questions ?? []).toEqual([]);
});
