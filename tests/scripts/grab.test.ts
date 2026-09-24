// SPDX-License-Identifier: GPL-3.0-only
// V119: a bare grab in a tier and the grab size rule. Expected values cite the pinned source.
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  grabEligibility,
  resolveCompiledAbility,
  smallerSize,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import { tierConditionExpression } from '../../shared/resolve/abilityGrammar.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;

// condition/grabbed.md: "A creature can grab only creatures of their size or smaller. If a
// creature's Might score is 2 or higher, they can grab any creature larger than them with a size
// equal to or less than their Might score." rule/character/size.md orders 1T < 1S < 1M < 1L < 2.
test('the grab size rule follows size order and the Might exception', () => {
  expect(grabEligibility('1M', '1M', 0)).toBe('allowed');
  expect(grabEligibility('1M', '1S', -1)).toBe('allowed');
  expect(grabEligibility('1S', '1M', 1)).toBe('ineligible');
  expect(grabEligibility('1S', '1M', 2)).toBe('allowed'); // size 1 ≤ Might 2
  expect(grabEligibility('1M', '2', 2)).toBe('allowed');
  expect(grabEligibility('1M', '3', 2)).toBe('ineligible');
  expect(grabEligibility('1M', '1', 2)).toBe('unknown'); // bare 1 is ambiguous
  expect(smallerSize('1S', '1M')).toBe(true);
  expect(smallerSize('2', '1L')).toBe(false);
});

// feature/ability/null/level-1/joint-lock.md: Melee, Psionic, Strike, Weapon; one creature or
// object; tier 2 "7 + A damage; A < AVERAGE, grabbed" — a grab with no printed duration.
test('a bare potency grab compiles and respects the grabber size', () => {
  expect(tierConditionExpression('A < AVERAGE, [grabbed](x)')).toMatchObject({
    condition: 'grabbed',
    duration: 'none',
  });
  expect(tierConditionExpression('A < 2 grabbed (EoT)')).toBeUndefined();
  const definition = compileAbility(
    structuredClone(
      compilerEnvelope(
        corpus.find(e => e.name === 'Joint Lock')!,
        inputs,
      ),
    ),
  );
  expect(definition.execution).toBe('supported');
  const facts = (actorSize: string, might: number): CompiledAbilityInput => ({
    actor: { actorId: 'null', characteristics: { M: might, A: 2, R: 0, I: 2, P: 0 } },
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
    dice: { d10a: 7, d10b: 7 },
    inCombat: false,
    conditionFacts: {
      potency: { characteristic: 'A', weak: 0, average: 1, strong: 2 },
      targets: [{ targetId: 't', kind: 'foe', characteristics: { A: 0 } }],
    },
    movement: {
      actor: { kind: 'creature', size: actorSize },
      targets: [{ targetId: 't', size: '1L' }],
    },
  });
  for (const [size, might, status] of [
    ['1M', 0, 'ineligible'],
    ['1M', 2, 'applied'],
    ['1L', 0, 'applied'],
  ] as const) {
    const result = resolveCompiledAbility(definition, facts(size, might));
    if (result.kind !== 'resolved') throw new Error(result.kind);
    expect(
      result.effects.find(e => e.kind === 'condition'),
      `${size} M${might}`,
    ).toMatchObject({
      condition: 'grabbed',
      duration: 'none',
      status,
    });
  }
});

// chapter/classes.md, Stacking Unique Effects: "A character who is grabbed by an enemy can't be
// grabbed again by another enemy." chapter/monster-basics.md, Creatures Who Grab: one creature
// grabbed at a time unless the stat block says otherwise. Both are withheld for the table.
// monster/undead/2nd-echelon/statblock/giant-zombie.md Rotten Smash: two creatures or objects;
// tier 2 "A < 2 grabbed".
test('stacked, held and multi-target grabs are withheld for the table', () => {
  const joint = compileAbility(
    structuredClone(
      compilerEnvelope(
        corpus.find(e => e.name === 'Joint Lock')!,
        inputs,
      ),
    ),
  );
  const base = (): CompiledAbilityInput => ({
    actor: { actorId: 'null', characteristics: { M: 0, A: 2, R: 0, I: 2, P: 0 } },
    targets: [{ targetId: 't', edges: 0, banes: 0 }],
    targetFacts: [],
    dice: { d10a: 7, d10b: 7 },
    inCombat: false,
    conditionFacts: {
      potency: { characteristic: 'A', weak: 0, average: 1, strong: 2 },
      targets: [{ targetId: 't', kind: 'foe', characteristics: { A: -1 } }],
    },
    movement: { actor: { kind: 'creature', size: '1M' }, targets: [{ targetId: 't', size: '1M' }] },
  });
  const status = (input: CompiledAbilityInput) => {
    const result = resolveCompiledAbility(joint, input);
    if (result.kind !== 'resolved') throw new Error(result.kind);
    return result.effects.find(e => e.kind === 'condition')!;
  };
  expect(status(base())).toMatchObject({ status: 'fact-needed' }); // damage facts absent
  const complete = base();
  complete.targetFacts = [
    {
      targetId: 't',
      kind: 'foe',
      stamina: 40,
      maxStamina: 40,
      temporaryStamina: 0,
      immunities: [],
      weaknesses: [],
    },
  ];
  expect(status(complete)).toMatchObject({ status: 'applied' });
  const stacked = structuredClone(complete);
  stacked.conditionFacts!.targets[0]!.grabbedBy = ['other'];
  expect(status(stacked)).toMatchObject({
    status: 'fact-needed',
    requirements: ['target:t.alreadyGrabbed'],
  });
  const held = structuredClone(complete);
  held.conditionFacts!.actorHolding = ['someone'];
  expect(status(held)).toMatchObject({ status: 'fact-needed', requirements: ['actor.grabLimit'] });

  const smash = compileAbility(
    structuredClone(
      compilerEnvelope(
        corpus.find(e => e.name === 'Rotten Smash')!,
        inputs,
      ),
    ),
  );
  expect(smash.execution).toBe('supported');
  const two: CompiledAbilityInput = {
    actor: { actorId: 'zombie', characteristics: { M: 4, A: -1, R: -5, I: -2, P: -1 } },
    targets: ['a', 'b'].map(targetId => ({ targetId, edges: 0, banes: 0 })),
    targetFacts: ['a', 'b'].map(targetId => ({
      targetId,
      kind: 'hero' as const,
      stamina: 40,
      maxStamina: 40,
      temporaryStamina: 0,
      immunities: [],
      weaknesses: [],
    })),
    dice: { d10a: 7, d10b: 7 },
    inCombat: true,
    resourcePool: { resource: 'malice', current: 10, legalFloor: 0 },
    conditionFacts: {
      targets: ['a', 'b'].map(targetId => ({
        targetId,
        kind: 'hero' as const,
        characteristics: { A: -1 },
      })),
    },
    movement: {
      actor: { kind: 'creature', size: '2' },
      targets: ['a', 'b'].map(targetId => ({ targetId, size: '1M' })),
    },
  };
  const result = resolveCompiledAbility(smash, two);
  if (result.kind !== 'resolved') throw new Error(result.kind);
  expect(
    result.effects.filter(e => e.kind === 'condition').map(e => e.kind === 'condition' && e.status),
  ).toEqual(['fact-needed', 'fact-needed']);
});
