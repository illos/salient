// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v100-conduit-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { checkAffordability } from '../shared/resolve/index.ts';
import { conduitAbilitySource } from '../shared/evaluate/conduitAbilities.ts';
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
const sorted = (s: readonly string[]) => [...s].sort();
test('Conduit domain pairs grant exactly one feature and source-derived prayer/ward statistics', () => {
  for (const w of witnesses) {
    const r = evaluate(w.selections);
    assert.equal(r.status, 'complete', `${w.id}: ${JSON.stringify(r.diagnostics)}`);
    const h = r.baseline!;
    for (const k of [
      'level',
      'subclass',
      'staminaMaximum',
      'recoveriesMaximum',
      'recoveryValue',
      'windedValue',
      'speed',
      'stability',
      'disengage',
      'savingThrowThreshold',
    ] as const)
      assert.equal(h[k].value, w.expected[k], `${w.id} ${k}`);
    assert.equal(h.kit, null);
    assert.equal(h.heroicResource.name.value, 'piety');
    for (const k of ['characteristics', 'potency'] as const)
      assert.deepEqual(
        Object.fromEntries(Object.entries(h[k]).map(([n, v]) => [n, v.value])),
        w.expected[k],
      );
    for (const k of ['skills', 'features', 'abilities'] as const)
      assert.deepEqual(sorted(h[k].map(x => x.name)), sorted(w.expected[k]), `${w.id} ${k}`);
    for (const name of w.classActions) {
      const a = h.abilities.find(a => a.name === name)!;
      const cost =
        (ledger.embeddedPietyCosts as Record<string, number>)[name] ??
        (ledger.paidSourceCosts as Record<string, number>)[name] ??
        0;
      assert.deepEqual(a.cost, cost ? { resource: 'piety', amount: cost } : undefined, name);
      if (conduitAbilitySource(a) && cost)
        assert.equal(conduitAbilitySource(a)?.cost, `${cost} Piety`);
    }
  }
});
test('Conduit portfolio and chosen feature prune independently, with no custom deity or kit path', () => {
  const first = witnesses[0]!.selections;
  for (const patch of [
    { 'class.conduit.domains': ['Creation'] },
    { 'class.conduit.domains': ['Creation', 'Creation'] },
    { 'class.conduit.domains': ['Creation', 'Death'] },
    { 'class.conduit.domain-feature': 'Death' },
    { 'class.conduit.deity': 'Custom deity' },
    { 'class.conduit.signature-abilities': ['Drain'] },
    { 'kit.choice': 'Sniper' },
  ] as Selections[])
    assert.notEqual(evaluate({ ...first, ...patch }).status, 'complete');
  assert.notEqual(evaluate(first, 2).status, 'complete');
  const swapped = changeChoice(
    first,
    definitions,
    'class.conduit.domain-feature',
    'Life',
  ).selections;
  const h = evaluate(swapped).partial!;
  assert.ok(!h.abilities?.some(a => a.name === 'Hands of the Maker'));
  assert.ok(h.abilities?.some(a => a.name === 'Creation: Domain Prayer'));
  assert.ok(h.abilities?.some(a => a.name === 'Life: Domain Prayer'));
  const pair = changeChoice(first, definitions, 'class.conduit.domains', [
    'Life',
    'Protection',
  ]).selections;
  assert.ok(!pair['class.conduit.domain-feature']);
  assert.ok(!pair['class.conduit.domain-skill']);
  const deity = changeChoice(first, definitions, 'class.conduit.deity', 'Cyrvis').selections;
  assert.ok(!deity['class.conduit.domains']);
  const cls = changeChoice(first, definitions, 'class.choice', 'Shadow').selections;
  assert.ok(!Object.keys(cls).some(k => k.startsWith('class.conduit.')));
});
test('Piety has the class waiver outside combat but requires the correct affordable pool in combat', () => {
  const cost = { resource: 'piety', amount: 3 };
  const waived = checkAffordability(
    cost,
    {
      resource: 'piety',
      current: 0,
      legalFloor: 0,
      usedOutsideCombatSinceLastVictoryOrRespite: true,
    },
    false,
  );
  assert.equal(waived.kind, 'waived');
  if (waived.kind === 'waived') assert.match(waived.warnings.join(' '), /conduit\/level-1\/piety/);
  assert.equal(
    checkAffordability(cost, { resource: 'piety', current: 2, legalFloor: 0 }, true).kind,
    'blocked',
  );
  assert.equal(
    checkAffordability(cost, { resource: 'wrath', current: 5, legalFloor: 0 }, true).kind,
    'blocked',
  );
});
