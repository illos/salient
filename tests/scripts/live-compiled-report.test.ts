// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { liveCompiledSupportReport } from '../../scripts/report-live-compiled-abilities.ts';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import { resolveCompiledAbility } from '../../shared/resolve/compiledOutcome.ts';

// This inventory assertion catches an unnoticed new live migration; it is not runtime dispatch.
test('V72 availability follows current grants and loading, not catalog presence', () => {
  const report = liveCompiledSupportReport();
  expect(
    report.entries
      .filter(e => e.live === 'compiled')
      .map(e => e.name)
      .sort(),
  ).toEqual([
    // V87 seeds the full core corpus: both Worg Bite and Ghoul Razor Claws are reachable.
    'Bite',
    'Bola Knock',
    'Brutal Slam',
    'Bury the Point',
    // V94: the Tactician's 3-Focus Concussive Strike is reachable through the class ability choice.
    'Concussive Strike',
    'Curse of Terror',
    'Cutting Sarcasm',
    // V92: the Shadow's 3-Insight Eviscerate is reachable through the class ability choice.
    'Eviscerate',
    'Eye Flash',
    'Eye of Surlach',
    'Halt Miscreant!',
    'Melee Weapon Free Strike',
    'Pinning Shot',
    'Power Chord',
    'Ranged Weapon Free Strike',
    'Razor Claws',
    'Repent!',
    'Spear Charge',
    'The Wode Defends',
    'Viscous Fire',
  ]);
  expect(
    report.entries
      .filter(e => e.execution === 'supported' && e.live === 'not-reachable')
      .map(e => e.name)
      .sort(),
  ).toEqual(['Meteoric Introduction', 'Ray of Agonizing Self-Reflection']);
});

// Pinned Ghoul and Worg source: fixed +2 roll, constant 3/4/5 damage. No Agility damage bonus.
// These comparisons add no live creature or grant and execute none of the parent traits.
test.each([
  ['Razor Claws', /\/ghoul$/],
  ['Bite', /\/worg$/],
] as const)('%s retains independently checked pure constant-damage arithmetic', (name, parent) => {
  const inputs = readInputs();
  const source = buildCorpus(inputs).envelopes.find(
    e => e.name === name && parent.test(e.parent ?? ''),
  )!;
  const definition = compileAbility(compilerEnvelope(source, inputs));
  expect(definition.execution).toBe('supported');
  for (const [a, b, tier, damage] of [
    [4, 5, 1, 3],
    [7, 7, 2, 4],
    [8, 7, 3, 5],
  ] as const) {
    const outcome = resolveCompiledAbility(definition, {
      actor: { actorId: 'source', characteristics: { M: 0, A: 2, R: -2, I: 0, P: -1 } },
      targets: [{ targetId: 'hero', edges: 0, banes: 0 }],
      dice: { d10a: a, d10b: b },
      inCombat: true,
      targetFacts: [
        {
          targetId: 'hero',
          kind: 'hero',
          stamina: 30,
          maxStamina: 30,
          temporaryStamina: 0,
          immunities: [],
          weaknesses: [],
        },
      ],
    });
    expect(outcome.kind).toBe('resolved');
    if (outcome.kind !== 'resolved') throw new Error('Missing pure resolution');
    expect(outcome.roll.targets[0]).toMatchObject({
      total: a + b + 2,
      tier,
      damage: { rolledDamage: damage },
    });
    expect(outcome.roll.damageApplications[0]).toMatchObject({ staminaAfter: 30 - damage });
    expect(outcome.effects.filter(e => e.kind === 'push')).toEqual([]);
    const manual = outcome.effects.filter(e => e.kind === 'condition');
    expect(manual).toHaveLength(name === 'Razor Claws' && tier === 3 ? 1 : 0);
    if (manual.length) expect(manual[0]!.clause).toMatch(/M < 2 .*bleeding.*save ends/);
  }
});

// Shadow/level-3/pinning-shot: A < weak/average/strong, restrained (save ends).
// Sniper: +0/+0/+4 ranged damage; no other combat modifiers.
test('Pinning Shot evaluates each source potency threshold strictly after tier damage', () => {
  const inputs = readInputs();
  const source = buildCorpus(inputs).envelopes.find(e => e.name === 'Pinning Shot')!;
  const definition = compileAbility(compilerEnvelope(source, inputs));
  expect(definition.execution).toBe('supported');
  for (const [d10a, d10b, tier, threshold, damage] of [
    [4, 5, 1, 0, 10],
    [7, 7, 2, 1, 14],
    [8, 7, 3, 2, 22],
  ] as const) {
    for (const [agility, status] of [
      [threshold - 1, 'applied'],
      [threshold, 'resisted'],
    ] as const) {
      const outcome = resolveCompiledAbility(definition, {
        actor: {
          actorId: 'shadow',
          characteristics: { M: 2, A: 2, R: 1, I: 1, P: -1 },
          kitRangedDamageBonus: [0, 0, 4],
        },
        targets: [{ targetId: 'target', edges: 0, banes: 0 }],
        dice: { d10a, d10b },
        inCombat: true,
        resourcePool: { resource: 'insight', current: 7, legalFloor: 0 },
        targetFacts: [
          {
            targetId: 'target',
            kind: 'hero',
            stamina: 30,
            maxStamina: 30,
            temporaryStamina: 0,
            immunities: [],
            weaknesses: [],
          },
        ],
        conditionFacts: {
          potency: { characteristic: 'A', weak: 0, average: 1, strong: 2 },
          targets: [{ targetId: 'target', kind: 'hero', characteristics: { A: agility } }],
        },
      });
      expect(outcome.kind).toBe('resolved');
      if (outcome.kind !== 'resolved') throw new Error('Pinning Shot did not resolve');
      expect(outcome.roll.targets[0]).toMatchObject({ tier, damage: { rolledDamage: damage } });
      expect(outcome.roll.cost).toMatchObject({ amount: 7, after: 0 });
      expect(outcome.effects.find(e => e.kind === 'condition')).toMatchObject({
        status,
        condition: 'restrained',
        duration: 'save-ends',
        threshold,
        targetScore: agility,
      });
    }
  }
});

// Censor/level-1: Halt Miscreant! tests P, Repent! tests I; both strict P-derived 0/1/2 potency.
test.each([
  ['Halt Miscreant!', 'P', 'slowed', [4, 7, 9], 0, 'wrath'],
  ['Repent!', 'I', 'dazed', [7, 10, 13], 3, 'wrath'],
  // Conduit/level-1/curse-of-terror: I-derived potency, 6/9/13 + I holy, 5 Piety.
  ['Curse of Terror', 'I', 'frightened', [8, 11, 15], 5, 'piety'],
  // Troubadour/level-1/cutting-sarcasm: P-derived bleeding, printed 2/5/7 + P psychic.
  ['Cutting Sarcasm', 'P', 'bleeding', [4, 7, 9], 0, 'drama'],
] as const)(
  '%s retains each strict source threshold and resource cost',
  (name, characteristic, condition, damages, cost, resource) => {
    const inputs = readInputs();
    const source = buildCorpus(inputs).envelopes.find(e => e.name === name)!;
    const definition = compileAbility(compilerEnvelope(source, inputs));
    for (const [d10a, d10b, tier, threshold] of [
      [4, 5, 1, 0],
      [7, 7, 2, 1],
      [8, 7, 3, 2],
    ] as const) {
      for (const [score, status] of [
        [threshold - 1, 'applied'],
        [threshold, 'resisted'],
      ] as const) {
        const outcome = resolveCompiledAbility(definition, {
          actor: {
            actorId: 'censor',
            characteristics: { M: 2, A: 1, R: 1, I: resource === 'piety' ? 2 : -1, P: 2 },
          },
          targets: [{ targetId: 'target', edges: 0, banes: 0 }],
          dice: { d10a, d10b },
          inCombat: true,
          resourcePool: { resource, current: cost, legalFloor: 0 },
          targetFacts: [
            {
              targetId: 'target',
              kind: 'hero',
              stamina: 30,
              maxStamina: 30,
              temporaryStamina: 0,
              immunities: [],
              weaknesses: [],
            },
          ],
          conditionFacts: {
            potency: {
              characteristic: resource === 'piety' ? 'I' : 'P',
              weak: 0,
              average: 1,
              strong: 2,
            },
            targets: [
              { targetId: 'target', kind: 'hero', characteristics: { [characteristic]: score } },
            ],
          },
        });
        expect(outcome.kind).toBe('resolved');
        if (outcome.kind !== 'resolved') throw new Error(name);
        expect(outcome.roll.targets[0]).toMatchObject({
          tier,
          damage: { rolledDamage: damages[tier - 1] },
        });
        if (cost) expect(outcome.roll.cost).toMatchObject({ amount: cost, after: 0 });
        expect(outcome.effects.find(e => e.kind === 'condition')).toMatchObject({
          status,
          condition,
          duration: 'save-ends',
          threshold,
          targetScore: score,
        });
      }
    }
  },
);
