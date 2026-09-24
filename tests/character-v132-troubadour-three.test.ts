// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v102-troubadour-expected.json' with { type: 'json' };
import ledger from './fixtures/v132-troubadour-three-expected.json' with { type: 'json' };
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
/** Named features; the ledger's structural rows (Invocation, Perk, Class Act Feature) are headings. */
const named = [
  'Appeal to the Muses',
  "Allow Me to Introduce Tonight's Players",
  'Formal Introductions',
  'My Reputation Precedes Me',
  'Missed Cue',
  'Foil',
  'Second Album',
];
/** Source clauses granted as separate uses (feature/troubadour/level-2/3, level-2/3 abilities). */
const embedded: Record<string, string[]> = {
  'Appeal to the Muses': ['Appeal to the Muses: Appeal'],
  "Allow Me to Introduce Tonight's Players": ["Allow Me to Introduce Tonight's Players: Introduce"],
  'Formal Introductions': ['Formal Introductions: Scribe Notice'],
  'My Reputation Precedes Me': ['My Reputation Precedes Me: Invoke'],
  'Missed Cue': ['Missed Cue: Remove Enemy'],
  Foil: ['Foil: Choose Foil'],
  'En Garde!': ['En Garde!: Exchange Free Strikes'],
  'Tough Crowd': ['Tough Crowd: End-of-Turn Roll'],
  'Star Solo': ['Star Solo: Repeat Use'],
  'We Meet at Last': ['We Meet at Last: Message'],
  'Classic Chandelier Stunt': ['Classic Chandelier Stunt: Free Strike'],
  '"Fire Up the Night"': ['"Fire Up the Night": Search'],
};
const cases = Object.entries(ledger.witnesses).map(([id, w]) => {
  const base = levelOne.witnesses.find(b => b.id === w.base)!;
  const two = w.levelTwo.addedSelections;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.troubadour.level-2.perk': two.perk,
    'class.troubadour.level-2.invocation': two.invocation,
    [`class.troubadour.level-2.${w.classAct.toLowerCase()}-ability`]: two.classActAbility,
  };
  const l3: Selections = {
    ...l2,
    'class.troubadour.level-3.ability-7': w.levelThree.addedSelections.ability7,
  };
  return { id, w, base, l2, l3 };
});
const costOf = (name: string) =>
  (ledger.abilities as Record<string, { cost?: { amount: number } | null }>)[name]?.cost?.amount;

test('Troubadour levels two and three match the independent ledger for every class act', () => {
  for (const { id, w, base, l2, l3 } of cases)
    for (const [level, selections, expected] of [
      [2, l2, w.levelTwo],
      [3, l3, w.levelThree],
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
      const abilities = [
        ...w.levelTwo.addedAbilities,
        ...(level === 3 ? w.levelThree.addedAbilities : []),
      ];
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
      const added = [...features, ...abilities].flatMap(name => embedded[name] ?? []);
      assert.deepEqual(
        sorted(
          hero.abilities
            .filter(a => a.provenance.decisionId !== 'class.troubadour.level-2.perk')
            .map(a => a.name),
        ),
        sorted([...base.expected.abilities, ...abilities, ...added]),
        `${label} abilities`,
      );
      for (const name of abilities) {
        const amount = costOf(name);
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          amount ? { resource: 'drama', amount } : undefined,
          `${label} ${name} cost`,
        );
      }
      for (const name of added)
        assert.equal(hero.abilities.find(a => a.name === name)!.cost, undefined, name);
    }
});

test('the level-two perk offers exactly the source interpersonal, lore and supernatural perks', () => {
  const perk = getDefinitions(2)
    .steps.flatMap(step => step.decisions)
    .find(d => d.id === 'class.troubadour.level-2.perk')!;
  assert.deepEqual(
    sorted(perk.options!.map(o => o.value)),
    sorted(
      Object.values(ledger.levelTwo.eligibleCorePerks)
        .flat()
        .map(p => (typeof p === 'string' ? p : p.name)),
    ),
  );
});

test('class act pools are exclusive; level and class act edits prune only dependent choices', () => {
  const duelist = cases.find(c => c.id === 'v102-2')!;
  const foreign = evaluate(
    { ...duelist.l2, 'class.troubadour.level-2.duelist-ability': 'Encore' },
    2,
  );
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.troubadour.level-2.duelist-ability']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  const missing: Selections = { ...duelist.l3 };
  delete missing['class.troubadour.level-3.ability-7'];
  assert.equal(evaluate(missing, 3).status, 'incomplete');
  const down = changeLevel(duelist.l3, getDefinitions(3), getDefinitions(2));
  assert.ok(down.removed.includes('class.troubadour.level-3.ability-7'));
  const two = evaluate(down.selections, 2).baseline!;
  assert.equal(two.staminaMaximum.value, duelist.w.levelTwo.staminaMaximum);
  assert.ok(!two.features.some(f => f.name === 'Foil'));
  const act = changeChoice(duelist.l3, getDefinitions(3), 'class.troubadour.class-act', 'Virtuoso');
  assert.ok(!act.selections['class.troubadour.level-2.duelist-ability']);
  assert.equal(
    act.selections['class.troubadour.level-2.invocation'],
    duelist.l3['class.troubadour.level-2.invocation'],
  );
  const virtuoso = evaluate(act.selections, 3);
  assert.notEqual(virtuoso.status, 'complete');
  assert.ok(!virtuoso.partial?.features?.some(f => f.name === 'Foil'));
});
