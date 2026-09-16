// SPDX-License-Identifier: GPL-3.0-only
// Independent source values: Compendium fb83a789, Elementalist level-1 Conflagration,
// Enchantment of Destruction, Fire: Acolyte of Fire, and Essence. See V25 source ledger.
import { expect, test } from 'vitest';
import type { AbilityRollMetadata, ActorRollFacts } from '../shared/contracts/rollResolution.ts';
import { checkAffordability, parseTierText, resolveTarget } from '../shared/resolve/index.ts';

const actor: ActorRollFacts = {
  actorId: 'bethell',
  characteristics: { M: -1, A: 1, R: 2, I: 2, P: 1 },
  abilityDamageModifiers: [
    { label: 'Enchantment of Destruction', amount: 1, keywords: ['Magic'] },
    {
      label: 'Acolyte of Fire',
      amount: 1,
      keywords: ['Fire', 'Magic'],
      alternative: { ability: 'Hurl Element', damageType: 'fire' },
    },
  ],
};
const ability: AbilityRollMetadata = {
  abilityId: 'conflagration',
  name: 'Conflagration',
  actionType: 'main action',
  source: {
    path: 'en/unified/md/feature/ability/elementalist/level-1/conflagration.md',
    id: 'mcdm.heroes.v1/feature.ability.elementalist.level-1/conflagration',
    revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
  },
  keywords: ['Area', 'Fire', 'Magic', 'Ranged'],
  permittedCharacteristics: ['R'],
  tiers: [
    parseTierText('4 fire damage'),
    parseTierText('6 fire damage'),
    parseTierText('10 fire damage'),
  ],
  kitBonusesIncluded: false,
};
const inputs = { targetId: 'foe', edges: 0, banes: 0 };

test('Conflagration adds both permanent bonuses once to all three tiers, including Area damage', () => {
  for (const [roll, expected] of [
    [5, 6],
    [10, 8],
    [15, 12],
  ]) {
    const result = resolveTarget(ability, actor, roll!, 2, 'R', inputs);
    expect(result.damage?.rolledDamage).toBe(expected);
    expect(result.damage?.kitBonus).toBe(0);
    expect(result.damage?.buildBonuses).toEqual([
      { label: 'Enchantment of Destruction', amount: 1 },
      { label: 'Acolyte of Fire', amount: 1 },
    ]);
  }
  expect(ability.tiers[0].text).toBe('4 fire damage');
});

test('bonuses require Magic; conditional Hurl fire bonus does not apply to another damage type', () => {
  const fireWeapon = { ...ability, keywords: ['Fire', 'Weapon'] };
  expect(resolveTarget(fireWeapon, actor, 5, 2, 'R', inputs).damage?.rolledDamage).toBe(4);
  for (const [type, expected] of [
    ['fire', 6],
    ['cold', 5],
  ] as const) {
    const hurl = {
      ...ability,
      name: 'Hurl Element',
      keywords: ['Magic', 'Ranged', 'Strike'],
      tiers: [
        parseTierText(`2 + R ${type} damage`),
        ...ability.tiers.slice(1),
      ] as AbilityRollMetadata['tiers'],
    };
    expect(resolveTarget(hurl, actor, 5, 2, 'R', inputs).damage?.rolledDamage).toBe(expected);
  }
});

test('unparsed and non-damage clauses gain no invented damage', () => {
  const manual = {
    ...ability,
    tiers: [
      parseTierText('The target is slowed'),
      ...ability.tiers.slice(1),
    ] as AbilityRollMetadata['tiers'],
  };
  const result = resolveTarget(manual, actor, 5, 2, 'R', inputs);
  expect(result.damage).toBeUndefined();
  expect(result.unresolvedClauses).toEqual(['The target is slowed']);
});

test('Essence fixed costs respect combat affordability and sourced outside-combat waiver', () => {
  const cost = { resource: 'essence', amount: 5 };
  const pool = { resource: 'essence', current: 0, legalFloor: 0 };
  expect(checkAffordability(cost, pool, true).kind).toBe('blocked');
  expect(checkAffordability(cost, { ...pool, current: 5 }, true)).toMatchObject({
    kind: 'affordable',
    after: 0,
  });
  expect(checkAffordability(cost, pool, false).kind).toBe('waived');
  const repeated = checkAffordability(
    cost,
    { ...pool, usedOutsideCombatSinceLastVictoryOrRespite: true },
    false,
  );
  expect(repeated).toMatchObject({
    kind: 'waived',
    warnings: [expect.stringContaining('elementalist/level-1/essence.md')],
  });
  expect(checkAffordability(cost, undefined, false).kind).toBe('blocked');
});
