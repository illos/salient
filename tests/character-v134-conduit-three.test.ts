// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { test } from 'vitest';
import levelOne from './fixtures/v100-conduit-expected.json' with { type: 'json' };
import ledger from './fixtures/v134-conduit-three-expected.json' with { type: 'json' };
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
const sorted = (values: readonly string[]) => [...new Set(values)].sort();
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
/** Source clauses granted as separate uses (feature/conduit/level-2/3, level-2 abilities). */
const embedded: Record<string, string[]> = {
  'The Lists of Heaven': ['The Lists of Heaven: Spend Recovery'],
  'Minor Miracle': ['Minor Miracle: Ritual'],
  'Sacred Bond': ['Sacred Bond: Take Damage', 'Sacred Bond: Spend Recovery'],
};
type Level = (typeof ledger.witnesses)['v100-life']['levelTwo'];
const cases = Object.entries(ledger.witnesses).map(([id, w]) => {
  const base = levelOne.witnesses.find(b => b.id === w.base)!;
  const two = w.levelTwo as Level;
  const l2: Selections = {
    ...(base.selections as unknown as Selections),
    'class.conduit.level-2.perk': two.addedSelections.perk,
    'class.conduit.level-2.domain-ability': two.addedSelections.domainAbilityDomain,
    [`class.conduit.level-2.domain-skill.${slug(two.secondDomain)}`]:
      two.addedSelections.secondDomainSkill,
  };
  const l3: Selections = {
    ...l2,
    'class.conduit.level-3.ability-7': w.levelThree.addedSelections.ability7,
  };
  return { id, w, base, two, l2, l3 };
});
const costOf = (name: string) =>
  (ledger.abilities as Record<string, { cost?: { amount: number } | string | null }>)[name]!.cost;

test('Conduit levels two and three match the independent ledger for every domain', () => {
  for (const { id, w, base, two, l2, l3 } of cases)
    for (const [level, selections, expected] of [
      [2, l2, two],
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
      assert.deepEqual(
        sorted(hero.skills.map(s => s.name)),
        sorted(expected.skills),
        `${label} skills`,
      );
      assert.deepEqual(
        sorted(hero.perks.map(p => p.name)),
        sorted(expected.perks),
        `${label} perks`,
      );
      const features = [
        'The Lists of Heaven',
        two.secondDomainFeature,
        ...(level === 3 ? ['Minor Miracle'] : []),
      ];
      assert.deepEqual(
        sorted(hero.features.map(f => f.name)),
        sorted([...base.expected.features, ...features]),
        `${label} features`,
      );
      const chosen = [
        two.addedSelections.domainAbility,
        ...(level === 3 ? [w.levelThree.addedSelections.ability7] : []),
      ];
      assert.deepEqual(
        sorted(
          hero.abilities
            .filter(a => a.provenance.decisionId !== 'class.conduit.level-2.perk')
            .map(a => a.name),
        ),
        sorted([
          ...base.expected.abilities,
          ...chosen,
          ...two.addedActionsByV100NamingConvention,
          ...[...features, ...chosen].flatMap(name => embedded[name] ?? []),
        ]),
        `${label} abilities`,
      );
      for (const name of chosen) {
        const cost = costOf(name);
        const amount =
          typeof cost === 'object' && cost ? cost.amount : Number(/\d+/.exec(String(cost))?.[0]);
        assert.deepEqual(
          hero.abilities.find(a => a.name === name)!.cost,
          { resource: 'piety', amount },
          `${label} ${name}`,
        );
      }
    }
});

test('the level-two perk offers exactly the source crafting, lore and supernatural perks', () => {
  const perk = getDefinitions(2)
    .steps.flatMap(step => step.decisions)
    .find(d => d.id === 'class.conduit.level-2.perk')!;
  assert.deepEqual(
    sorted(perk.options!.map(o => o.value)),
    sorted(
      Object.values(ledger.levelTwo.eligibleCorePerks)
        .flat()
        .map(p => (typeof p === 'string' ? p : p.name)),
    ),
  );
});

test('domain abilities follow the chosen domains; level and domain edits prune dependents', () => {
  const life = cases.find(c => c.id === 'v100-life')!;
  // Life's domains are Life and Creation: a War domain ability is not in the pool.
  const foreign = evaluate({ ...life.l2, 'class.conduit.level-2.domain-ability': 'War' }, 2);
  assert.equal(foreign.status, 'invalid');
  assert.ok(
    foreign.diagnostics['class.conduit.level-2.domain-ability']!.some(
      d => d.code === 'value-not-in-pool',
    ),
  );
  // The other chosen domain's ability is the alternative.
  const other = evaluate(
    { ...life.l2, 'class.conduit.level-2.domain-ability': life.two.secondDomain },
    2,
  );
  assert.equal(other.status, 'complete');
  assert.ok(other.baseline!.abilities.some(a => a.name === 'Statue of Power'));
  const down = changeLevel(life.l3, getDefinitions(3), getDefinitions(1));
  assert.ok(down.removed.includes('class.conduit.level-2.domain-ability'));
  assert.ok(
    down.removed.includes(`class.conduit.level-2.domain-skill.${slug(life.two.secondDomain)}`),
  );
  const one = evaluate(down.selections, 1).baseline!;
  assert.ok(!one.features.some(f => f.name === life.two.secondDomainFeature));
  // Taking the other domain's feature at level 1 swaps which feature level 2 grants.
  const swapped = changeChoice(
    life.l2,
    getDefinitions(2),
    'class.conduit.domain-feature',
    life.two.secondDomain,
  );
  assert.ok(
    !swapped.selections[`class.conduit.level-2.domain-skill.${slug(life.two.secondDomain)}`],
  );
});
