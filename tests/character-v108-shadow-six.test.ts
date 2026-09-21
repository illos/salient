// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import ledger from './fixtures/v108-shadow-six-expected.json' with { type: 'json' };
import { getDefinitions } from '../shared/content/character-decisions.ts';
import { evaluateCharacter } from '../shared/evaluate/character.ts';
import { changeChoice } from '../shared/evaluate/choiceTransition.ts';
import { changeLevel } from '../shared/evaluate/levelTransition.ts';
import type { SelectionValue } from '../shared/contracts/characterEvaluation.ts';
type Selections = Record<string, SelectionValue>;
const evaluate = (selections: Selections, level: number) =>
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
test('Shadow4–6 source ledger: cumulative choices, A3, second-echelon vitals and distinct perk slots', () => {
  for (const w of witnesses) {
    const result = evaluate(w.selections, w.level);
    assert.equal(result.status, 'complete', `${w.id}: ${JSON.stringify(result.diagnostics)}`);
    const b = result.baseline!;
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
      assert.equal(b[key].value, w.expected[key], `${w.id} ${key}`);
    assert.deepEqual(
      Object.fromEntries(Object.entries(b.characteristics).map(([k, v]) => [k, v.value])),
      w.expected.characteristics,
    );
    assert.deepEqual(
      Object.fromEntries(Object.entries(b.potency).map(([k, v]) => [k, v.value])),
      w.expected.potency,
    );
    assert.equal(b.kit?.echelon.value, 2);
    for (const key of ['features', 'perks', 'abilities', 'skills', 'languages'] as const)
      assert.deepEqual(sorted(b[key].map(x => x.name)), sorted(w.expected[key]), `${w.id} ${key}`);
    for (const a of w.actions)
      assert.deepEqual(
        b.abilities.find(x => x.name === a.name)?.cost,
        a.cost ? { resource: 'insight', amount: a.cost } : undefined,
        a.name,
      );
    assert.ok(
      !b.damageImmunities?.some(x => x.damageType === 'corruption'),
      'Umbral Form must not become permanent immunity',
    );
  }
});
test('level and college edits revoke only dependent choices; Agility cannot be raised to4', () => {
  const w = witnesses[2]!;
  const invalid = { ...w.selections, 'class.shadow.level-4.characteristic': 'Agility' };
  assert.equal(evaluate(invalid, 6).status, 'invalid');
  const missing = { ...w.selections };
  delete missing['class.shadow.level-4.characteristic'];
  assert.equal(evaluate(missing, 6).status, 'incomplete');
  const down = changeLevel(w.selections, getDefinitions(6), getDefinitions(3));
  assert.ok(down.removed.includes('class.shadow.level-4.characteristic'));
  assert.ok(down.removed.includes('class.shadow.level-5.ability-9'));
  assert.ok(down.removed.includes('class.shadow.level-6.perk'));
  assert.equal(down.selections['class.shadow.level-2.perk'], 'Danger Sense');
  assert.equal(evaluate(down.selections, 3).baseline!.staminaMaximum.value, 33);
  assert.equal(
    evaluate(changeLevel(down.selections, getDefinitions(3), getDefinitions(6)).selections, 6)
      .status,
    'incomplete',
  );
  const changed = changeChoice(
    w.selections,
    getDefinitions(6),
    'class.shadow.college',
    'Harlequin Mask',
  );
  assert.equal(changed.selections['class.shadow.level-6.black-ash-ability'], undefined);
  assert.equal(
    changed.selections['class.shadow.level-5.ability-9'],
    w.selections['class.shadow.level-5.ability-9'],
  );
  assert.equal(
    changed.selections['class.shadow.level-4.characteristic'],
    w.selections['class.shadow.level-4.characteristic'],
  );
  const hero = evaluate(changed.selections, 6).partial;
  assert.ok(!hero?.abilities?.some(a => a.name.startsWith('Trail of Cinders')));
  assert.notEqual(evaluate(w.selections, 7).status, 'complete');
  assert.notEqual(evaluate({ ...w.selections, 'class.choice': 'Fury' }, 6).status, 'complete');
});
// Spark source +6 at1 and another6 at4; borrowed purchase has the identical source schedule.
test('native and borrowed Spark scale at4, retain source provenance and refresh Recovery values', () => {
  for (const level of [3, 4, 6])
    for (const ancestry of ['Dwarf', 'Revenant'])
      for (const spark of [false, true]) {
        const initial = witnesses[2]!.selections;
        const s = changeLevel(initial, getDefinitions(6), getDefinitions(level)).selections;
        for (const id of Object.keys(s)) if (id.startsWith('ancestry.')) delete s[id];
        s['ancestry.choice'] = ancestry;
        if (ancestry === 'Dwarf')
          s['ancestry.dwarf.purchased-traits'] = spark
            ? ['Spark Off Your Skin', 'Grounded']
            : ['Great Fortitude', 'Grounded'];
        else {
          s['ancestry.revenant.former-life'] = 'Dwarf';
          s['ancestry.revenant.dwarf.purchased-traits'] = spark
            ? ['Spark Off Your Skin']
            : ['Bloodless'];
        }
        const result = evaluate(s, level);
        assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
        const b = result.baseline!;
        const amount = level === 3 ? 6 : 12;
        const max =
          ({ 3: 33, 4: 42, 6: 54 } as Record<number, number>)[level]! + (spark ? amount : 0);
        assert.equal(b.staminaMaximum.value, max);
        assert.equal(b.recoveryValue.value, Math.floor(max / 3));
        assert.equal(b.windedValue.value, Math.floor(max / 2));
        assert.equal(
          b.staminaMaximum.provenance.find(p => p.selection === 'Spark Off Your Skin')?.amount,
          spark ? amount : undefined,
        );
        if (ancestry === 'Revenant') {
          assert.equal(
            b.damageImmunities?.find(i => i.damageType === 'corruption')?.value.value,
            level,
          );
          assert.equal(b.damageWeaknesses?.find(i => i.damageType === 'fire')?.value.value, 5);
        }
      }
});
