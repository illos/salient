// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v105-talent-expected.json' with { type: 'json' };
import followUps from './fixtures/v151-follow-up-actions.json' with { type: 'json' };
import ledger from './fixtures/v136-talent-three-expected.json' with { type: 'json' };
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
/** Named tradition/level features; the ledger's structural rows are headings. */
const named = ['Ease the Hours', 'Ease Their Fall', 'Ease the Mind', 'Scan'];
const strained = [
  'Applied Chronometrics',
  'Slow',
  'Gravitic Burst',
  'Levity and Gravity',
  'Overwhelm',
  'Synaptic Override',
  'Fling Through Time',
  'Force Orbs',
  'Reflector Field',
  'Soul Burn',
];
/** Source clauses granted as separate uses; each Strained paragraph is its own record (as V105). */
const embedded: Record<string, string[]> = {
  'Ease the Hours': ['Ease the Hours: Extend Montage'],
  'Ease Their Fall': ['Ease Their Fall: Reduce Falling Damage'],
  Scan: ['Scan: Search'],
  ...Object.fromEntries(strained.map(name => [name, [`${name}: Strain`]])),
};
embedded['Force Orbs'] = ['Force Orbs: Fire Orb', 'Force Orbs: Strain'];
/** V151 (QC1 V135 R1): separate follow-up actions each parent's source grants. */
const followUpsOf = (cls: string, parents: string[], level: number) =>
  followUps.actions
    .filter(
      a =>
        a.class === cls &&
        parents.includes(a.parent) &&
        level >= ((a as { minLevel?: number }).minLevel ?? 0),
    )
    .map(a => a.name);
const cases = Object.entries(ledger.witnesses).map(([id, w]) => {
  const base = levelOne.witnesses.find(b => b.id === w.base)!;
  const two = w.levelTwo.addedSelections;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.talent.level-2.perk': two.perk,
    [`class.talent.level-2.${w.tradition.toLowerCase()}-ability`]: two.traditionAbility,
  };
  const l3: Selections = {
    ...l2,
    'class.talent.level-3.ability-7': w.levelThree.addedSelections.ability7,
  };
  return { id, w, base, l2, l3 };
});

test('Talent levels two and three match the independent ledger for every tradition', () => {
  for (const { id, w, base, l2, l3 } of cases)
    for (const [level, selections, expected, abilities] of [
      [2, l2, w.levelTwo, [w.levelTwo.addedSelections.traditionAbility]],
      [
        3,
        l3,
        w.levelThree,
        [w.levelTwo.addedSelections.traditionAbility, w.levelThree.addedSelections.ability7],
      ],
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
      for (const field of ['characteristics', 'potency'] as const)
        assert.deepEqual(
          Object.fromEntries(Object.entries(hero[field]).map(([k, v]) => [k, v.value])),
          expected[field],
          `${label} ${field}`,
        );
      const features = [
        ...w.levelTwo.addedFeatures,
        ...(level === 3 ? w.levelThree.addedFeatures : []),
      ].filter(name => named.includes(name));
      assert.deepEqual(
        sorted(hero.features.map(f => f.name)),
        sorted([...base.expected.features, ...features]),
        `${label} features`,
      );
      assert.deepEqual(
        sorted(hero.perks.map(p => p.name)),
        sorted(expected.perks),
        `${label} perks`,
      );
      const added = [
        ...[...features, ...abilities].flatMap(name => embedded[name] ?? []),
        ...followUpsOf('Talent', [...features, ...abilities], level),
      ];
      assert.deepEqual(
        sorted(
          hero.abilities
            .filter(a => a.provenance.decisionId !== 'class.talent.level-2.perk')
            .map(a => a.name),
        ),
        sorted([...base.expected.abilities, ...abilities, ...added]),
        `${label} abilities`,
      );
      for (const name of abilities)
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          {
            resource: 'clarity',
            amount: (ledger.abilities as Record<string, { cost: { amount: number } }>)[name]!.cost
              .amount,
          },
          `${label} ${name} cost`,
        );
      for (const name of added)
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          undefined,
          `${label} ${name} cost`,
        );
    }
});

test('the level-two perk offers exactly the source interpersonal, lore and supernatural perks', () => {
  const perk = getDefinitions(2)
    .steps.flatMap(step => step.decisions)
    .find(d => d.id === 'class.talent.level-2.perk')!;
  assert.deepEqual(
    sorted(perk.options!.map(o => o.value)),
    sorted(
      Object.values(ledger.levelTwo.eligibleCorePerks)
        .flat()
        .map(p => (typeof p === 'string' ? p : p.name)),
    ),
  );
});

test('tradition pools are exclusive; level and tradition edits prune only dependent choices', () => {
  const tele = cases.find(c => c.id === 'v105-2')!;
  const foreign = evaluate({ ...tele.l2, 'class.talent.level-2.telekinesis-ability': 'Slow' }, 2);
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.talent.level-2.telekinesis-ability']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  const missing: Selections = { ...tele.l3 };
  delete missing['class.talent.level-3.ability-7'];
  assert.equal(evaluate(missing, 3).status, 'incomplete');
  const down = changeLevel(tele.l3, getDefinitions(3), getDefinitions(2));
  assert.ok(down.removed.includes('class.talent.level-3.ability-7'));
  const two = evaluate(down.selections, 2).baseline!;
  assert.equal(two.staminaMaximum.value, tele.w.levelTwo.staminaMaximum);
  assert.ok(!two.features.some(f => f.name === 'Scan'));
  const tradition = changeChoice(tele.l3, getDefinitions(3), 'class.talent.tradition', 'Telepathy');
  assert.ok(!tradition.selections['class.talent.level-2.telekinesis-ability']);
  assert.equal(
    tradition.selections['class.talent.level-2.perk'],
    tele.l3['class.talent.level-2.perk'],
  );
  const after = evaluate(tradition.selections, 3);
  const features = (after.baseline ?? after.partial)?.features;
  assert.ok(features);
  assert.ok(!features.some(f => f.name === 'Ease Their Fall'));
});

test('perk-granted abilities keep their own text, not the Talent strain note', () => {
  // feature/talent/level-1/clarity-and-strain.md: strain belongs to Clarity-costing talent effects.
  const c = cases[0]!;
  const result = evaluate({ ...c.l2, 'class.talent.level-2.perk': 'Psychic Whisper' }, 2);
  assert.equal(result.status, 'complete', JSON.stringify(result.diagnostics));
  const perk = result.baseline!.abilities.filter(
    a => a.provenance.decisionId === 'class.talent.level-2.perk',
  );
  assert.ok(perk.length);
  for (const a of perk)
    assert.doesNotMatch(a.activationCondition ?? '', /Strain effects are manual/);
});
