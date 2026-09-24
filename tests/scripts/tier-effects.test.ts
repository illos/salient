// SPDX-License-Identifier: GPL-3.0-only
// V113: tier forced movement, EoT and no-duration conditions. Expected values cite the pinned source.
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import {
  forcedMovementExpression,
  tierConditionExpression,
} from '../../shared/resolve/abilityGrammar.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const envelope = (name: string, parent?: RegExp) =>
  structuredClone(
    compilerEnvelope(
      corpus.find(e => e.name === name && (!parent || parent.test(e.parent ?? '')))!,
      inputs,
    ),
  );
const facts = (
  kind: 'hero' | 'foe' | 'object',
  characteristics: CompiledAbilityInput['actor']['characteristics'],
  resource?: string,
): CompiledAbilityInput => ({
  actor: { actorId: 'actor', characteristics },
  targets: [{ targetId: 't', edges: 0, banes: 0 }],
  targetFacts: [
    {
      targetId: 't',
      kind: kind === 'object' ? 'foe' : kind,
      stamina: 40,
      maxStamina: 40,
      temporaryStamina: 0,
      immunities: [],
      weaknesses: [],
    },
  ],
  dice: { d10a: 7, d10b: 7 },
  inCombat: true,
  ...(resource ? { resourcePool: { resource, current: 10, legalFloor: 0 } } : {}),
  movement: {
    actor: {
      kind: 'creature',
      size: '1M',
      conditions: { kind: 'none' },
      traits: { kind: 'none' },
      modifiers: { kind: 'none' },
    },
    targets: [
      {
        targetId: 't',
        kind: kind === 'object' ? 'object' : 'creature',
        size: '1M',
        stability: 0,
        conditions: { kind: 'none' },
        traits: { kind: 'none' },
        modifiers: { kind: 'none' },
      },
    ],
  },
});

// rule/combat/end-of-turn.md (EoT); rule/general/saving-throw.md (save ends); condition/prone.md
// (no duration: ends with Stand Up). Grabbed keeps only V88's save-ends form (condition/grabbed.md).
test('the V113 condition reader admits printed durations and rejects unbounded forms', () => {
  expect(tierConditionExpression('A < WEAK, [slowed](x) ([EoT](y))')).toEqual({
    characteristic: 'A',
    threshold: { kind: 'potency', tier: 'weak' },
    condition: 'slowed',
    duration: 'eot',
  });
  expect(tierConditionExpression('[Taunted](x) ([EoT](y))')).toEqual({
    threshold: { kind: 'always' },
    condition: 'taunted',
    duration: 'eot',
  });
  expect(tierConditionExpression('M < 1 [prone](x)')).toMatchObject({
    threshold: { kind: 'printed', value: 1 },
    condition: 'prone',
    duration: 'none',
  });
  for (const rejected of [
    'M < 1 slowed',
    'A < 2 grabbed',
    'grabbed (EoT)',
    'm < 1 prone',
    "prone and can't stand (save ends)",
    'M < 1 dazed and slowed (save ends)',
  ])
    expect(tierConditionExpression(rejected), rejected).toBeUndefined();
  expect(forcedMovementExpression('vertical [pull](x) 2')).toEqual({
    movement: 'pull',
    vertical: true,
    distance: 2,
  });
  expect(forcedMovementExpression('[Slide](x) 1')).toEqual({
    movement: 'slide',
    vertical: false,
    distance: 1,
  });
  expect(forcedMovementExpression('M < 1 vertical push 3')).toBeUndefined();
});

// kit/retiarius.md Net and Stab: printed 4/6/8 + M or A (kit bonus included); A < WEAK/AVERAGE
// slowed, A < STRONG restrained, all (EoT). M2 A2 actor: 7 + 7 + 2 = 16, tier 2, 6 + 2 = 8
// damage; potency from the highest characteristic 2 is 0/1/2 (rule/character/potency.md).
test('an EoT condition applies below the average potency and resists at it', () => {
  const definition = compileAbility(envelope('Net and Stab'));
  expect(definition.execution).toBe('supported');
  for (const [score, status] of [
    [0, 'applied'],
    [1, 'resisted'],
  ] as const) {
    const input = facts('hero', { M: 2, A: 2, R: 0, I: 0, P: 0 });
    input.conditionFacts = {
      potency: { characteristic: 'A', weak: 0, average: 1, strong: 2 },
      targets: [{ targetId: 't', kind: 'hero', characteristics: { A: score } }],
    };
    const result = resolveCompiledAbility(definition, input);
    if (result.kind !== 'resolved') throw new Error(result.kind);
    expect(result.roll.damageApplications[0]!.staminaAfter).toBe(40 - 8);
    expect(result.effects.find(e => e.kind === 'condition')).toMatchObject({
      condition: 'slowed',
      duration: 'eot',
      threshold: 1,
      status,
    });
  }
});

// monster/orc/statblock/orc-chainlock.md Heavy Crossbolt (3 Malice), tier 3: 9 damage; prone;
// A < 2 slowed (save ends). An unconditional condition needs no potency but still needs a creature
// (rule/combat/target.md: objects are immune to an ability's other effects).
test('an unconditional tier-three prone applies to creatures and waits on objects', () => {
  const definition = compileAbility(envelope('Heavy Crossbolt', /orc-chainlock/));
  expect(definition.execution).toBe('supported');
  const input = facts('foe', { M: 0, A: 0, R: 0, I: 0, P: 0 }, 'malice');
  input.dice = { d10a: 10, d10b: 9 };
  input.conditionFacts = { targets: [{ targetId: 't', kind: 'hero', characteristics: { A: 2 } }] };
  const result = resolveCompiledAbility(definition, input);
  if (result.kind !== 'resolved') throw new Error(result.kind);
  expect(result.roll.targets[0]!.tier).toBe(3);
  expect(
    result.effects
      .filter(e => e.kind === 'condition')
      .map(e => e.kind === 'condition' && [e.condition, e.duration, e.status]),
  ).toEqual([
    ['prone', 'none', 'applied'],
    ['slowed', 'save-ends', 'resisted'],
  ]);
  input.conditionFacts = { targets: [{ targetId: 't', kind: 'object' }] };
  const object = resolveCompiledAbility(definition, input);
  if (object.kind !== 'resolved') throw new Error(object.kind);
  expect(object.effects.find(e => e.kind === 'condition')).toMatchObject({
    condition: 'prone',
    status: 'fact-needed',
  });
});

// monster/demon/2nd-echelon/statblock/fangling.md Tumbling Gore: "2 damage; pull 1; A < 1
// bleeding (save ends)" — effects after damage resolve in printed order (rule/dice/ability-roll.md).
// feature/ability/conduit/level-1/holy-lash.md: Magic, Ranged, so no melee-weapon size bonus
// (movement/forced-movement.md, Big Versus Little); "vertical pull 3" at tier 2.
test('pull, slide and vertical movement are ordered instructions, never executed movement', () => {
  const gore = compileAbility(envelope('Tumbling Gore'));
  expect(gore.execution).toBe('supported');
  expect(gore.tiers[0]!.map(n => n.kind)).toEqual(['damage', 'push', 'condition']);
  expect(gore.tiers[0]![1]).toMatchObject({ movement: 'pull', distance: 1 });
  const lash = compileAbility(envelope('Holy Lash'));
  const result = resolveCompiledAbility(lash, facts('foe', { M: 0, A: 0, R: 0, I: 2, P: 0 }));
  if (result.kind !== 'resolved') throw new Error(result.kind);
  expect(result.effects.find(e => e.kind === 'push')).toMatchObject({
    movement: 'pull',
    vertical: true,
    printed: 3,
    sizeBonus: 0,
    allowance: 3,
    status: 'instruction',
  });
  const push = result.effects.find(e => e.kind === 'push');
  if (push?.kind !== 'push') throw new Error('Missing pull');
  expect(push.instruction).toMatch(/toward the source/);
  expect(push.instruction).toMatch(/up or down/);
});

test('tampered durations or movement fall back to manual resolution', () => {
  const definition = compileAbility(envelope('Net and Stab'));
  const tampered = structuredClone(definition);
  const node = tampered.tiers[1]!.find(n => n.kind === 'condition')!;
  if (node.kind !== 'condition') throw new Error('Missing condition');
  node.duration = 'none';
  expect(
    resolveCompiledAbility(tampered, facts('hero', { M: 2, A: 2, R: 0, I: 0, P: 0 })).kind,
  ).toBe('manual');
  const lash = compileAbility(envelope('Holy Lash'));
  const push = lash.tiers[0]!.find(n => n.kind === 'push')!;
  if (push.kind !== 'push') throw new Error('Missing pull');
  (push as { movement?: string }).movement = 'teleport';
  expect(resolveCompiledAbility(lash, facts('foe', { M: 0, A: 0, R: 0, I: 2, P: 0 })).kind).toBe(
    'manual',
  );
});
