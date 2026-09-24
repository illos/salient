// SPDX-License-Identifier: GPL-3.0-only
/**
 * V153 compound tier conditions and a condition followed by forced movement in one clause.
 * Expected values come from the pinned Compendium sources named on each test.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import {
  tierCompoundConditionExpression,
  tierConditionMovementExpression,
} from '../../shared/resolve/abilityGrammar.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const compiled = (name: string) =>
  compileAbility(
    structuredClone(
      compilerEnvelope(
        corpus.find(e => e.name === name && e.corpus === 'hero-standalone')!,
        inputs,
      ),
    ),
  );
const input = (dice: [number, number], score: number, immune: string[] = []) =>
  ({
    actor: {
      actorId: 'hero',
      characteristics: { M: 2, A: 2, R: 2, I: 2, P: 2 },
      kitMeleeDamageBonus: [0, 0, 0],
      kitRangedDamageBonus: [0, 0, 0],
    },
    targets: [{ targetId: 'target', edges: 0, banes: 0 }],
    dice: { d10a: dice[0], d10b: dice[1] },
    inCombat: false,
    resourcePool: { resource: 'ferocity', current: 5, legalFloor: 0 },
    targetFacts: [
      {
        targetId: 'target',
        kind: 'hero',
        stamina: 40,
        maxStamina: 40,
        temporaryStamina: 0,
        immunities: [],
        weaknesses: [],
      },
    ],
    conditionFacts: {
      targets: [
        {
          targetId: 'target',
          kind: 'hero',
          characteristics: { P: score },
          conditionImmunities: immune,
        },
      ],
      potency: { characteristic: 'M', weak: 0, average: 1, strong: 2 },
    },
  }) as unknown as CompiledAbilityInput;

// rule/general/saving-throw.md: a "(save ends)" effect is removed by one saving throw, so the
// conditions of one clause share a potency, a duration and a group.
test('the compound grammar reads one potency and duration for two or more conditions', () => {
  expect(tierCompoundConditionExpression('P < WEAK, dazed and frightened (save ends)')).toEqual({
    characteristic: 'P',
    threshold: { kind: 'potency', tier: 'weak' },
    conditions: ['dazed', 'frightened'],
    duration: 'save-ends',
  });
  expect(tierCompoundConditionExpression('R < 2 dazed and slowed (EoT)')).toMatchObject({
    threshold: { kind: 'printed', value: 2 },
    conditions: ['dazed', 'slowed'],
    duration: 'eot',
  });
  for (const refused of [
    // No printed duration: nothing says when the pair ends.
    'M < WEAK, bleeding and weakened',
    // condition/prone.md lets Stand Up end prone unless the effect says otherwise.
    'A < STRONG, prone and weakened (save ends)',
    // condition/grabbed.md relationships stay single-condition.
    'M < 2, grabbed and slowed (save ends)',
    'P < WEAK, dazed and dazed (save ends)',
    'P < WEAK, dazed or frightened (save ends)',
    'A < STRONG, prone and can’t stand (save ends)',
  ])
    expect(tierCompoundConditionExpression(refused), refused).toBeUndefined();
});

test('a condition then movement clause is split only without a potency', () => {
  expect(tierConditionMovementExpression('taunted (EoT), slide 2')).toMatchObject({
    condition: { condition: 'taunted', duration: 'eot', threshold: { kind: 'always' } },
    movement: { movement: 'slide', distance: 2, vertical: false },
  });
  // Whether a potency also gates the movement is not stated.
  expect(tierConditionMovementExpression('R < 3 grabbed, pull 2')).toBeUndefined();
  expect(tierConditionMovementExpression('R < 3 slowed (save ends), pull 2')).toBeUndefined();
});

// feature/ability/fury/level-2/death-death.md: "3/5/8 + M damage; P < WEAK/AVERAGE/STRONG, dazed and
// frightened (save ends)". Dice 6 + 6 + M2 = 14 is tier 2 (threshold average 1).
test('Death... Death! applies both conditions or neither, and immunity splits them', () => {
  const definition = compiled('Death... Death!');
  expect(definition.execution).toBe('supported');
  for (const nodes of definition.tiers) {
    const conditions = nodes.filter(n => n.kind === 'condition');
    expect(conditions.map(n => n.kind === 'condition' && n.condition)).toEqual([
      'dazed',
      'frightened',
    ]);
    expect(new Set(conditions.map(n => n.id)).size).toBe(2);
    expect(new Set(conditions.map(n => n.kind === 'condition' && n.group)).size).toBe(1);
  }
  const statuses = (score: number, immune: string[] = []) => {
    const result = resolveCompiledAbility(definition, input([6, 6], score, immune));
    if (result.kind !== 'resolved') throw new Error(result.kind);
    return result.effects
      .filter(e => e.kind === 'condition')
      .map(e => e.kind === 'condition' && [e.condition, e.status, e.group !== undefined]);
  };
  expect(statuses(0)).toEqual([
    ['dazed', 'applied', true],
    ['frightened', 'applied', true],
  ]);
  expect(statuses(1)).toEqual([
    ['dazed', 'resisted', true],
    ['frightened', 'resisted', true],
  ]);
  expect(statuses(0, ['frightened'])).toEqual([
    ['dazed', 'applied', true],
    ['frightened', 'immune', true],
  ]);
});

// feature/ability/null/level-1/kinetic-strike.md: "4/5/6 + A damage; taunted (EoT)[, slide 1/2]".
test('Kinetic Strike taunts, then slides, in printed order after damage', () => {
  const definition = compiled('Kinetic Strike');
  expect(definition.execution).toBe('supported');
  expect(definition.tiers.map(nodes => nodes.map(n => n.kind))).toEqual([
    ['damage', 'condition'],
    ['damage', 'condition', 'push'],
    ['damage', 'condition', 'push'],
  ]);
  const [, condition, push] = definition.tiers[2]!;
  expect(condition).toMatchObject({ condition: 'taunted', duration: 'eot' });
  expect(push).toMatchObject({ movement: 'slide', distance: 2 });
  expect(condition!.id).not.toBe(push!.id);
});

test('a tampered compound member is outside the supported envelope', () => {
  const definition = compiled('Death... Death!');
  expect(resolveCompiledAbility(definition, input([6, 6], 0)).kind).toBe('resolved');
  // Each tamper passes the older V88/V113 checks and is caught only by the V153 group check.
  for (const tamper of [
    (member: { id: string }) => (member.id = `${member.id}x`),
    (member: { condition: string }) => (member.condition = 'prone'),
  ]) {
    const changed = structuredClone(definition);
    const member = changed.tiers[0]!.find(n => n.kind === 'condition')!;
    if (member.kind !== 'condition') throw new Error('Missing member');
    tamper(member as never);
    expect(resolveCompiledAbility(changed, input([6, 6], 0))).toMatchObject({
      kind: 'manual',
      reason: 'Compiled structure is outside the supported envelope.',
    });
  }
});
