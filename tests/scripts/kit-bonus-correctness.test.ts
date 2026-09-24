// SPDX-License-Identifier: GPL-3.0-only
// V115: melee-or-ranged mode, Field Arsenal signature bonuses and known condition immunity.
// Expected values are read from the pinned sources cited per test, never from the engine.
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import { modeMatters } from '../../shared/resolve/index.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const envelope = (name: string) =>
  structuredClone(
    compilerEnvelope(
      corpus.find(e => e.name === name)!,
      inputs,
    ),
  );
const facts = (
  actor: Partial<CompiledAbilityInput['actor']>,
  resource: string,
  tier3 = true,
): CompiledAbilityInput => ({
  actor: { actorId: 'hero', characteristics: { M: 2, A: 2, R: 0, I: 0, P: 0 }, ...actor },
  targets: [{ targetId: 't', edges: 0, banes: 0 }],
  targetFacts: [
    {
      targetId: 't',
      kind: 'foe',
      stamina: 40,
      maxStamina: 40,
      temporaryStamina: 0,
      immunities: [],
      weaknesses: [],
    },
  ],
  // Natural 19 is tier 3 whatever the modifiers (rule/dice/power-roll.md); 7 + 7 + 2 is tier 2.
  dice: tier3 ? { d10a: 10, d10b: 9 } : { d10a: 7, d10b: 7 },
  inCombat: true,
  resourcePool: { resource, current: 10, legalFloor: 0 },
});

// rule/combat/distance.md, Melee or Ranged: you choose melee or ranged for each use.
// feature/ability/shadow/level-1/two-throats-at-once.md: Melee, Ranged, Strike, Weapon; 4/6/10.
// kit/panther.md: melee damage +0/+0/+4, no ranged bonus (chapter/kits.md, Damage Bonuses).
test('a Panther Two Throats at Once deals 14 at tier 3 in melee and 10 at range', () => {
  const definition = compileAbility(envelope('Two Throats at Once'));
  const panther = { kitMeleeDamageBonus: [0, 0, 4] as [number, number, number] };
  expect(modeMatters(definition.metadata!, facts(panther, 'insight').actor)).toBe(true);
  expect(() => resolveCompiledAbility(definition, facts(panther, 'insight'))).toThrow(
    /Choose melee or ranged/,
  );
  for (const [mode, damage] of [
    ['melee', 14],
    ['ranged', 10],
  ] as const) {
    const result = resolveCompiledAbility(definition, {
      ...facts(panther, 'insight'),
      selectedMode: mode,
    });
    if (result.kind !== 'resolved') throw new Error(result.kind);
    expect(result.roll.targets[0]!.tier).toBe(3);
    expect(result.roll.selectedMode).toBe(mode);
    expect(result.roll.damageApplications[0]!.staminaAfter).toBe(40 - damage);
  }
  // Without a kit the modes agree, so no choice is demanded.
  expect(modeMatters(definition.metadata!, facts({}, 'insight').actor)).toBe(false);
});

// feature/tactician/level-1/field-arsenal.md: a signature loses its printed kit bonus and gains the
// chosen kit's. kit/rapid-fire.md Two Shot prints 4/6/8 including ranged +2/+2/+2; choosing
// kit/sniper.md's ranged +0/+0/+4 gives 2/4/10.
test('a Field Arsenal replacement adjusts printed kit signature damage per tier', () => {
  const definition = compileAbility(envelope('Two Shot'));
  const arsenal = {
    kitRangedDamageBonus: [0, 0, 4] as [number, number, number],
    kitSignatureAdjustments: [
      {
        ability: 'Two Shot',
        sourcePath: 'kit/rapid-fire.md',
        rangedDamage: [-2, -2, 2] as [number, number, number],
      },
    ],
  };
  const tier2 = resolveCompiledAbility(definition, facts(arsenal, 'focus', false));
  const tier3 = resolveCompiledAbility(definition, facts(arsenal, 'focus'));
  if (tier2.kind !== 'resolved' || tier3.kind !== 'resolved') throw new Error('unresolved');
  expect(tier2.roll.damageApplications[0]!.staminaAfter).toBe(40 - 4);
  expect(tier3.roll.damageApplications[0]!.staminaAfter).toBe(40 - 10);
  // Printed damage is untouched without a replacement (V109 kit signatures).
  const plain = resolveCompiledAbility(definition, facts({}, 'focus'));
  if (plain.kind !== 'resolved') throw new Error(plain.kind);
  expect(plain.roll.damageApplications[0]!.staminaAfter).toBe(40 - 8);
});

// kit/retiarius.md Net and Stab: A < AVERAGE slowed (EoT) at tier 2. feature/trait/orc/nonstop.md:
// "You can't be made slowed." Damage still applies; printed foe prevention stays fact-needed.
test('known immunity prevents the condition without touching damage', () => {
  const definition = compileAbility(envelope('Net and Stab'));
  const base = facts({}, 'ferocity', false);
  base.conditionFacts = {
    potency: { characteristic: 'M', weak: 0, average: 1, strong: 2 },
    targets: [
      {
        targetId: 't',
        kind: 'hero',
        characteristics: { A: -1 },
        conditionImmunities: ['slowed'],
      },
    ],
  };
  const immune = resolveCompiledAbility(definition, base);
  if (immune.kind !== 'resolved') throw new Error(immune.kind);
  expect(immune.roll.damageApplications[0]!.staminaAfter).toBe(40 - 8);
  expect(immune.effects.find(e => e.kind === 'condition')).toMatchObject({
    condition: 'slowed',
    status: 'immune',
  });
  base.conditionFacts.targets[0] = {
    targetId: 't',
    kind: 'foe',
    characteristics: { A: -1 },
    conditionPreventionUnevaluated: ['slowed'],
  };
  const unknown = resolveCompiledAbility(definition, base);
  if (unknown.kind !== 'resolved') throw new Error(unknown.kind);
  expect(unknown.effects.find(e => e.kind === 'condition')).toMatchObject({
    status: 'fact-needed',
    requirements: ['target:t.conditionPrevention.slowed'],
  });
});
