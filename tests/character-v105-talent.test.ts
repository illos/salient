import { heroicResourceFloor } from '../shared/resolve/resourceFloor.ts';
import { checkAffordability } from '../shared/resolve/index.ts';
// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v105-talent-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { talentAbilitySource } from '../shared/evaluate/talentAbilities.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
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
const sorted = (values: readonly string[]) => [...values].sort();
test('Talent traditions derive source-ledger statistics, skills, costs and every granted action', () => {
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
    assert.equal(h.heroicResource.name.value, 'clarity');
    for (const k of ['characteristics', 'potency'] as const)
      assert.deepEqual(
        Object.fromEntries(Object.entries(h[k]).map(([name, value]) => [name, value.value])),
        w.expected[k],
      );
    for (const k of ['skills', 'languages', 'features', 'abilities'] as const)
      assert.deepEqual(sorted(h[k].map(x => x.name)), sorted(w.expected[k]), `${w.id} ${k}`);
    for (const name of w.classActions) {
      const a = h.abilities.find(a => a.name === name)!;
      const cost =
        (ledger.embeddedClarityCosts as Record<string, number>)[name] ??
        (ledger.paidSourceCosts as Record<string, number>)[name] ??
        0;
      assert.deepEqual(a.cost, cost ? { resource: 'clarity', amount: cost } : undefined, name);
      if (talentAbilitySource(a)) {
        assert.ok(a.activationCondition, name);
        if (cost) assert.equal(talentAbilitySource(a)?.cost, `${cost} Clarity`);
      }
    }
  }
});
test('Talent edits prune tradition grants, keep fixed skills, and use the source negative floor', () => {
  const defs = getDefinitions(1),
    first = witnesses[0]!.selections;
  for (const patch of [
    { 'kit.choice': 'Sniper' },
    { 'class.talent.tradition': 'Cryokinesis' },
    { 'class.talent.signature-abilities': ['Entropic Bolt', 'Entropic Bolt'] },
    { 'class.talent.skills': ['Psionics', 'Timescape'] },
  ] as Selections[])
    assert.notEqual(evaluate({ ...first, ...patch }).status, 'complete');
  const changed = changeChoice(first, defs, 'class.talent.tradition', 'Telekinesis').selections;
  const h = evaluate(changed).baseline!;
  assert.ok(h.abilities.some(a => a.name === 'Minor Telekinesis: Vertical Slide'));
  assert.ok(!h.abilities.some(a => a.name === 'Accelerate'));
  const density = evaluate(
    changeChoice(first, defs, 'class.talent.augmentation', 'Density Augmentation').selections,
  ).baseline!;
  assert.equal(density.staminaMaximum.value, 24);
  assert.equal(density.recoveryValue.value, 8);
  assert.equal(
    density.abilityModifiers?.some(m => m.id === 'talent.force-augmentation') ?? false,
    false,
  );
  assert.equal(heroicResourceFloor(h, 'clarity'), -3);
  assert.equal(heroicResourceFloor(h, 'discipline'), 0);
  for (const [current, cost, kind] of [
    [0, 3, 'affordable'],
    [2, 5, 'affordable'],
    [1, 5, 'blocked'],
    [-3, 1, 'blocked'],
  ] as const) {
    const result = checkAffordability(
      { resource: 'clarity', amount: cost },
      { resource: 'clarity', current, legalFloor: heroicResourceFloor(h, 'clarity') },
      true,
    );
    assert.equal(result.kind, kind);
    if (result.kind === 'affordable') assert.equal(result.after, -3);
  }
});
