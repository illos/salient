// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v94-tactician-expected.json' with { type: 'json' };
import ledger from './fixtures/v116-tactician-three-expected.json' with { type: 'json' };
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
/** Named doctrine/level features; the ledger's structural rows (Perk, Doctrine Feature) are headings. */
const named = ['Infiltration Tactics', 'Goaded', 'Melee Superiority', 'Out of Position'];
/** Source clauses granted as separate uses (feature/tactician/level-2/3, level-2 mark benefits). */
const embedded: Record<string, string[]> = {
  'Infiltration Tactics': ['Infiltration Tactics: Surge'],
  Goaded: ['Goaded: Redirect Strike'],
  'Melee Superiority': ['Melee Superiority: Halt', 'Melee Superiority: Mark Free Strike'],
  'Out of Position': ['Out of Position: Mark and Slide'],
  'Fog of War': ['Fog of War: Forced Free Strike'],
  'Targets of Opportunity': ['Targets of Opportunity: Extra Target'],
};
/** V94 lists level-one embedded uses separately: Mark's trigger/retarget and Studied Commander. */
const levelOneEmbedded = (
  rows: readonly { sourceAbility?: string; sourceFeature?: string; cost?: unknown }[],
) =>
  rows.map(row =>
    row.sourceFeature
      ? `${row.sourceFeature}: Prepare`
      : row.cost
        ? `${row.sourceAbility}: Trigger`
        : `${row.sourceAbility}: Retarget`,
  );
const cases = Object.entries(ledger.witnesses).map(([id, w]) => {
  const base = levelOne.witnesses.find(b => b.id === w.base)!;
  const two = w.levelTwo.addedSelections;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.tactician.level-2.perk': two.perk,
    [`class.tactician.level-2.${w.doctrine.toLowerCase()}-ability`]: two.doctrineAbility,
  };
  return {
    id,
    w,
    base,
    l2,
    l3: {
      ...l2,
      'class.tactician.level-3.ability-7': w.levelThree.addedSelections.ability7,
    } as Selections,
  };
});

test('Tactician levels two and three match the independent ledger for every doctrine', () => {
  for (const { id, w, base, l2, l3 } of cases)
    for (const [level, selections, expected, abilities] of [
      [2, l2, w.levelTwo, [w.levelTwo.addedSelections.doctrineAbility]],
      [
        3,
        l3,
        w.levelThree,
        [w.levelTwo.addedSelections.doctrineAbility, w.levelThree.addedSelections.ability7],
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
      assert.deepEqual(
        sorted(
          hero.abilities
            .filter(a => a.provenance.decisionId !== 'class.tactician.level-2.perk')
            .map(a => a.name),
        ),
        sorted([
          ...base.expected.abilities,
          ...levelOneEmbedded(base.expected.embeddedActions),
          ...abilities,
          ...[...features, ...abilities].flatMap(name => embedded[name] ?? []),
        ]),
        `${label} abilities`,
      );
      for (const name of abilities)
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          {
            resource: 'focus',
            amount: (ledger.abilities as Record<string, { cost: { amount: number } }>)[name]!.cost
              .amount,
          },
          `${label} ${name} cost`,
        );
      for (const name of ['Melee Superiority: Mark Free Strike', 'Fog of War: Forced Free Strike'])
        if (hero.abilities.some(a => a.name === name))
          assert.deepEqual(hero.abilities.find(a => a.name === name)!.cost, {
            resource: 'focus',
            amount: 2,
          });
    }
});

test('doctrine pools are exclusive; level and doctrine edits prune only dependent choices', () => {
  const vanguard = cases.find(c => c.id === 'v94-tactician-3')!;
  const foreign = evaluate(
    { ...vanguard.l2, 'class.tactician.level-2.vanguard-ability': 'Fog of War' },
    2,
  );
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.tactician.level-2.vanguard-ability']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  const missing: Selections = { ...vanguard.l3 };
  delete missing['class.tactician.level-3.ability-7'];
  assert.equal(evaluate(missing, 3).status, 'incomplete');
  const down = changeLevel(vanguard.l3, getDefinitions(3), getDefinitions(2));
  assert.ok(down.removed.includes('class.tactician.level-3.ability-7'));
  const two = evaluate(down.selections, 2).baseline!;
  assert.equal(two.staminaMaximum.value, vanguard.w.levelTwo.staminaMaximum);
  assert.ok(!two.features.some(f => f.name === 'Out of Position'));
  const doctrine = changeChoice(
    vanguard.l3,
    getDefinitions(3),
    'class.tactician.doctrine',
    'Mastermind',
  );
  assert.ok(!doctrine.selections['class.tactician.level-2.vanguard-ability']);
  assert.equal(
    doctrine.selections['class.tactician.level-2.perk'],
    vanguard.l3['class.tactician.level-2.perk'],
  );
  const mastermind = evaluate(doctrine.selections, 3);
  assert.notEqual(mastermind.status, 'complete');
  assert.ok(!mastermind.partial?.features?.some(f => f.name === 'Melee Superiority'));
});
