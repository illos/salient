// SPDX-License-Identifier: GPL-3.0-only
/** V155 "prone and can't stand": compile shape, potency and prone dependency (pinned sources). */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { tierCantStandExpression } from '../../shared/resolve/abilityGrammar.ts';
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
        corpus.find(e => e.name === name)!,
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
    targets: [{ targetId: 't', edges: 0, banes: 0 }],
    dice: { d10a: dice[0], d10b: dice[1] },
    inCombat: false,
    resourcePool: { resource: 'piety', current: 5, legalFloor: 0 },
    targetFacts: [
      {
        targetId: 't',
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
        { targetId: 't', kind: 'hero', characteristics: { A: score }, conditionImmunities: immune },
      ],
      potency: { characteristic: 'I', weak: 0, average: 1, strong: 2 },
    },
  }) as unknown as CompiledAbilityInput;

test('the grammar reads the combined and split forms, and refuses others', () => {
  expect(tierCantStandExpression("A < STRONG, prone and can't stand (save ends)")).toEqual({
    characteristic: 'A',
    threshold: { kind: 'potency', tier: 'strong' },
    withProne: true,
    duration: 'save-ends',
  });
  expect(tierCantStandExpression('I < 2 can’t stand (save ends)')).toMatchObject({
    withProne: false,
    threshold: { kind: 'printed', value: 2 },
  });
  expect(tierCantStandExpression("A < 4 prone and can't stand (EoT)")).toMatchObject({
    duration: 'eot',
  });
  for (const refused of [
    "prone and can't stand",
    "A < 2 prone and can't stand until the end of their next turn",
    "A < 2 slide 3, prone and can't stand (EoT)",
  ])
    expect(tierCantStandExpression(refused), refused).toBeUndefined();
});

// feature/ability/conduit/level-1/judgments-hammer.md tier 3: "9 + I holy damage; A < STRONG, prone
// and can't stand (save ends)". Dice 10 + 10 is tier 3; strong potency 2.
test("Judgment's Hammer applies prone and the restriction together, or neither", () => {
  const definition = compiled("Judgment's Hammer");
  expect(definition.execution).toBe('supported');
  const statuses = (score: number, immune: string[] = []) => {
    const result = resolveCompiledAbility(definition, input([10, 10], score, immune));
    if (result.kind !== 'resolved') throw new Error(result.kind);
    return result.effects
      .filter(e => e.kind === 'condition')
      .map(e => e.kind === 'condition' && [e.duration, e.restriction ?? '', e.status]);
  };
  expect(statuses(1)).toEqual([
    ['none', '', 'applied'],
    ['save-ends', 'cant-stand', 'applied'],
  ]);
  expect(statuses(2)).toEqual([
    ['none', '', 'resisted'],
    ['save-ends', 'cant-stand', 'resisted'],
  ]);
  // A creature that can't be knocked prone isn't held down either.
  expect(statuses(1, ['prone'])).toEqual([
    ['none', '', 'immune'],
    ['save-ends', 'cant-stand', 'immune'],
  ]);
});

test('a restriction without a prone before it is refused', () => {
  const definition = compiled("Judgment's Hammer");
  const changed = structuredClone(definition);
  changed.tiers[2] = changed.tiers[2]!.filter(
    n => !(n.kind === 'condition' && n.restriction === undefined),
  );
  expect(resolveCompiledAbility(changed, input([10, 10], 1)).kind).toBe('manual');
});
