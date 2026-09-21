// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v99-censor-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const definitions = getDefinitions(1);
const evaluate = (selections: Selections, level = 1) =>
  evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: ledger.compendiumRevision,
      level,
      selections,
    },
    getDefinitions(level),
  );
const witnesses = ledger.witnesses.map(w => ({
  ...w,
  selections: w.selections as unknown as Selections,
}));
const sorted = (a: readonly string[]) => [...a].sort();
test('Censor level one: twelve domains retain independent stats, skills, actions and Wrath costs', () => {
  for (const w of witnesses) {
    const result = evaluate(w.selections);
    assert.equal(result.status, 'complete', `${w.id}: ${JSON.stringify(result.diagnostics)}`);
    const hero = result.baseline!;
    for (const key of [
      'level',
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'disengage',
    ] as const)
      assert.equal(hero[key].value, w.expected[key], `${w.id} ${key}`);
    for (const key of ['characteristics', 'potency'] as const)
      assert.deepEqual(
        Object.fromEntries(Object.entries(hero[key]).map(([k, v]) => [k, v.value])),
        w.expected[key],
      );
    for (const key of ['features', 'skills', 'abilities'] as const)
      assert.deepEqual(
        sorted(hero[key].map(x => x.name)),
        sorted(w.expected[key]),
        `${w.id} ${key}`,
      );
    assert.equal(hero.heroicResource.name.value, 'wrath');
    for (const a of w.rolledActions)
      assert.deepEqual(
        hero.abilities.find(x => x.name === a.name)?.cost,
        a.cost ? { resource: 'wrath', amount: a.cost } : undefined,
      );
    for (const a of hero.abilities.filter(x => x.name.startsWith('Judgment:'))) {
      assert.ok(a.activationCondition);
      assert.ok(a.provenance.source.quote);
    }
  }
});
test('Censor deity, portfolio, order and class changes revoke incompatible choices and grants', () => {
  const first = witnesses[0]!.selections;
  assert.notEqual(evaluate({ ...first, 'class.censor.domain': 'Death' }).status, 'complete');
  assert.notEqual(evaluate({ ...first, 'class.censor.domain-skill': 'Magic' }).status, 'complete');
  assert.notEqual(evaluate(first, 2).status, 'complete');
  const order = changeChoice(first, definitions, 'class.censor.order', 'Oracle').selections;
  const hero = evaluate(order).baseline!;
  assert.ok(hero.skills.some(s => s.name === 'Magic'));
  assert.ok(!hero.skills.some(s => s.name === 'Read Person'));
  assert.ok(!hero.abilities.some(a => a.name === 'Judgment: Exorcist Benefit'));
  const custom = changeChoice(first, definitions, 'class.censor.deity', 'Custom deity').selections;
  assert.ok(!custom['class.censor.domain']);
  assert.equal(evaluate(custom).status, 'incomplete');
  const complete = {
    ...custom,
    'class.censor.custom-deity-name': 'The Witness',
    'class.censor.custom-portfolio': ['Creation', 'Life', 'Love', 'Protection'],
    'class.censor.custom-domain': 'Creation',
    'class.censor.domain-skill': 'Tailoring',
  };
  assert.equal(
    evaluate(complete).status,
    'complete',
    JSON.stringify(evaluate(complete).diagnostics),
  );
  assert.notEqual(
    evaluate({ ...complete, 'class.censor.custom-portfolio': ['Creation', 'Life', 'Love'] }).status,
    'complete',
  );
  assert.notEqual(
    evaluate({ ...complete, 'class.censor.custom-domain': 'Death' }).status,
    'complete',
  );
  const removed = changeChoice(complete, definitions, 'class.censor.custom-portfolio', [
    'War',
    'Life',
    'Love',
    'Protection',
  ]).selections;
  assert.ok(!removed['class.censor.custom-domain']);
  assert.ok(!removed['class.censor.domain-skill']);
  const changed = changeChoice(first, definitions, 'class.choice', 'Shadow').selections;
  assert.ok(!Object.keys(changed).some(k => k.startsWith('class.censor.')));
});

test('Wrath costs outside combat retain the sourced waiver and repeated-use warning', async () => {
  const { checkAffordability } = await import('../shared/resolve/index.ts');
  const result = checkAffordability(
    { resource: 'wrath', amount: 5 },
    {
      resource: 'wrath',
      current: 0,
      legalFloor: 0,
      usedOutsideCombatSinceLastVictoryOrRespite: true,
    },
    false,
  );
  assert.equal(result.kind, 'waived');
  if (result.kind === 'waived') assert.match(result.warnings.join(' '), /censor\/level-1\/wrath/);
  assert.equal(
    checkAffordability(
      { resource: 'wrath', amount: 5 },
      { resource: 'wrath', current: 0, legalFloor: 0 },
      true,
    ).kind,
    'blocked',
  );
});
