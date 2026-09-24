// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v106-beastheart-expected.json' with { type: 'json' };
import ledger from './fixtures/v137-beastheart-three-expected.json' with { type: 'json' };
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
const sorted = (values: readonly string[]) => [...values].sort();
/** Named features; the ledger's structural rows (Perk, Wild Nature Feature, …) are headings. */
const structural = [
  'Perk',
  '2nd-Level Wild Nature Feature',
  '2nd-Level Wild Nature Ability',
  'Companion Advancement Feature',
  '7-Ferocity Ability',
];
const cases = Object.entries(ledger.witnesses).map(([id, w]) => {
  const base = levelOne.witnesses.find(b => b.id === w.base)!;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.beastheart.level-2.perk': w.levelTwo.addedSelections.perk,
    [`class.beastheart.level-2.${w.wildNature.toLowerCase()}-ability`]:
      w.levelTwo.addedSelections.natureAbility,
  };
  const l3: Selections = {
    ...l2,
    'class.beastheart.level-3.ability-7': w.levelThree.addedSelections.ability7,
  };
  return { id, w, base, l2, l3 };
});
const records = (selections: Selections, level: number) =>
  Object.fromEntries(
    evaluate(selections, level)
      .baseline!.abilities.filter(a => !a.provenance.decisionId.endsWith('.perk'))
      .map(a => [a.name, a.cost?.amount ?? 0]),
  );

test('Beastheart levels two and three match the independent ledger for every nature and companion', () => {
  for (const { id, w, base, l2, l3 } of cases) {
    const one = records(base.selections as unknown as Selections, 1);
    for (const [level, selections, expected, added] of [
      [2, l2, w.levelTwo, w.levelTwo.addedRecords],
      [3, l3, w.levelThree, { ...w.levelTwo.addedRecords, ...w.levelThree.addedRecords }],
    ] as const) {
      const label = `${id} L${level}`;
      const result = evaluate(selections, level);
      assert.equal(result.status, 'complete', `${label}: ${JSON.stringify(result.diagnostics)}`);
      const hero = result.baseline!;
      for (const field of [
        'level',
        'staminaMaximum',
        'recoveriesMaximum',
        'recoveryValue',
        'windedValue',
        'speed',
        'stability',
        'disengage',
      ] as const)
        assert.equal(hero[field].value, expected[field], `${label} ${field}`);
      // companion-rules.md: the companion's Stamina maximum equals yours.
      assert.equal(hero.companion?.staminaMaximum, expected.companionStaminaMaximum, label);
      assert.equal(hero.companion?.windedValue, expected.companionWindedValue, label);
      for (const field of ['characteristics', 'potency'] as const)
        assert.deepEqual(
          Object.fromEntries(Object.entries(hero[field]).map(([k, v]) => [k, v.value])),
          expected[field],
          `${label} ${field}`,
        );
      const features = [
        ...w.levelTwo.addedFeatures,
        ...(level === 3 ? w.levelThree.addedFeatures : []),
      ].filter(name => !structural.includes(name));
      const levelOneFeatures = evaluate(
        base.selections as unknown as Selections,
        1,
      ).baseline!.features.map(f => f.name);
      assert.deepEqual(
        sorted(hero.features.map(f => f.name).filter(n => !levelOneFeatures.includes(n))),
        sorted(features),
        `${label} new features`,
      );
      assert.deepEqual(
        sorted(hero.perks.map(p => p.name)),
        sorted(expected.perks),
        `${label} perks`,
      );
      const now = records(selections, level);
      const fresh = Object.fromEntries(Object.entries(now).filter(([name]) => !(name in one)));
      assert.deepEqual(fresh, added, `${label} new records and Ferocity costs`);
    }
  }
});

test('the level-two perk offers exactly the source exploration, interpersonal and intrigue perks', () => {
  const perk = getDefinitions(2)
    .steps.flatMap(step => step.decisions)
    .find(d => d.id === 'class.beastheart.level-2.perk')!;
  assert.deepEqual(
    sorted(perk.options!.map(o => o.value)),
    sorted(
      Object.values(ledger.levelTwo.eligibleCorePerks)
        .flat()
        .map(p => (typeof p === 'string' ? p : p.name)),
    ),
  );
});

test('a level-two perk that grants an action keeps it beside the manual records', () => {
  // perk/forgettable-face.md: a sourced perk use (perk-abilities.ts), not a Beastheart record.
  const { l2 } = cases[0]!;
  const abilities = evaluate({ ...l2, 'class.beastheart.level-2.perk': 'Forgettable Face' }, 2)
    .baseline!.abilities;
  assert.ok(abilities.some(a => a.name === 'Forgettable Face'));
});

test('nature pools are exclusive; level, nature and companion edits prune dependents', () => {
  const punisher = cases.find(c => c.id === 'v106-3')!;
  const foreign = evaluate(
    { ...punisher.l2, 'class.beastheart.level-2.punisher-ability': 'Fetch!' },
    2,
  );
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.beastheart.level-2.punisher-ability']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  const down = changeLevel(punisher.l3, getDefinitions(3), getDefinitions(2));
  assert.ok(down.removed.includes('class.beastheart.level-3.ability-7'));
  const two = evaluate(down.selections, 2).baseline!;
  assert.ok(!two.features.some(f => f.name === punisher.w.levelThree.addedFeatures[1]));
  const companion = changeChoice(
    punisher.l3,
    getDefinitions(3),
    'class.beastheart.companion',
    'Wolf',
  );
  const after = evaluate(companion.selections, 3);
  const features = (after.baseline ?? after.partial)?.features;
  assert.ok(features);
  assert.ok(!features.some(f => f.name === 'Greased Pig'));
  assert.ok(features.some(f => f.name === 'My, What Big Teeth You Have'));
});
