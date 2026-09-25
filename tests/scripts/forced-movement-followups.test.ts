// SPDX-License-Identifier: GPL-3.0-only
/**
 * V176 forced-movement follow-ups. Expected values come from the pinned Compendium
 * (`en/unified/md`): each ability's tiers and Effect, movement/forced-movement.md,
 * rule/dice/power-roll.md (tier bands 11 or lower, 12-16, 17 or higher) and rule/dice/edge (an edge
 * adds 2). The engine never learns what moved; only allowances and table work are checked here.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility, riderAdmitted } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
  type CompiledPushOutcome,
  type MovementFacts,
} from '../../shared/resolve/compiledOutcome.ts';
import { effectRider, plain } from '../../shared/resolve/abilityGrammar.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const envelope = (name: string) =>
  structuredClone(
    compilerEnvelope(
      corpus.find(e => e.name === name && e.corpus === 'hero-standalone')!,
      inputs,
    ),
  );
const covered = (targetId?: string): MovementFacts & { targetId: string } => ({
  targetId: targetId ?? '',
  kind: 'creature',
  size: '1M',
  stability: 3,
  conditions: { kind: 'none' },
  traits: { kind: 'none' },
  modifiers: { kind: 'none' },
});
/** Every characteristic 2; dice 7 + 7 + 2 = 16 is tier 2 without edges or banes. */
const facts = (
  targetIds: string[],
  resource?: string,
  edges: number[] = [],
): CompiledAbilityInput => ({
  actor: {
    actorId: 'hero',
    characteristics: { M: 2, A: 2, R: 2, I: 2, P: 2 },
    kitMeleeDamageBonus: [0, 0, 0],
  },
  targets: targetIds.map((targetId, i) => ({ targetId, edges: edges[i] ?? 0, banes: 0 })),
  dice: { d10a: 7, d10b: 7 },
  inCombat: false,
  targetFacts: targetIds.map(targetId => ({
    targetId,
    kind: 'foe' as const,
    stamina: 50,
    maxStamina: 50,
    temporaryStamina: 0,
    immunities: [],
    weaknesses: [],
  })),
  movement: { actor: covered(), targets: targetIds.map(covered) },
  ...(resource ? { resourcePool: { resource, current: 9, legalFloor: 0 } } : {}),
});
const resolved = (name: string, input: CompiledAbilityInput) => {
  const result = resolveCompiledAbility(compileAbility(envelope(name)), input);
  if (result.kind !== 'resolved') throw new Error(`${name}: ${result.kind}`);
  return result;
};
const pushes = (result: ReturnType<typeof resolved>) =>
  result.effects.filter((e): e is CompiledPushOutcome => e.kind === 'push');

test.each([
  ['Sentenced', 'forced-movement', 'after-effects', undefined],
  ['Call the Thunder Down', 'forced-movement', 'after-effects', { kind: 'same-distance' }],
  ['Thunder Roar', 'forced-movement', 'independent', undefined],
  ['Phase Inversion Strike', 'teleport', 'independent', { kind: 'teleport-first' }],
  [
    'Machinations of Sound',
    'forced-movement',
    'independent',
    { kind: 'stability-replaced', reducedBy: 'I' },
  ],
])('%s compiles with its whole Effect as one %s section', (name, shape, dependency, rule) => {
  const definition = compileAbility(envelope(name));
  expect(definition.execution).toBe('supported');
  expect(definition.sections).toHaveLength(1);
  expect(definition.sections[0]).toMatchObject({ kind: 'rider', shape, dependency });
  expect(
    definition.sections[0]!.kind === 'rider' && definition.sections[0]!.forcedMovement,
  ).toEqual(rule ?? undefined);
  const source = definition.envelope.blocks.find(b => b.kind === 'section');
  expect(definition.sections[0]!.clause).toBe(source?.kind === 'section' ? source.text : undefined);
});

// Each depends on what actually happened in or around the movement, or changes another use.
test.each(['Out of the Way!', 'Impart Force', 'Special Delivery', 'Repel'])(
  '%s stays manual',
  name => {
    const definition = compileAbility(envelope(name));
    expect(definition.execution).toBe('manual');
    expect(definition.sections.some(n => n.kind === 'unsupported')).toBe(true);
  },
);

// shadow/level-2/machinations-of-sound.md: Agility roll, tier 2 "Slide 5"; "This forced movement
// ignores stability. Instead, the forced movement is reduced by a number equal to the target's
// Intuition score." Stability 3 is ignored; Intuition 1 leaves 4, Intuition 6 leaves nothing.
test('Machinations of Sound replaces stability with each target’s Intuition', () => {
  const input = facts(['low', 'high', 'negative', 'unknown'], 'insight');
  input.conditionFacts = {
    targets: [
      { targetId: 'low', kind: 'foe', characteristics: { I: 1 } },
      { targetId: 'high', kind: 'foe', characteristics: { I: 6 } },
      { targetId: 'negative', kind: 'foe', characteristics: { I: -1 } },
      { targetId: 'unknown', kind: 'foe' },
    ],
  };
  const result = resolved('Machinations of Sound', input);
  const [low, high, negative, unknown] = pushes(result);
  expect(low).toMatchObject({
    status: 'instruction',
    movement: 'slide',
    printed: 5,
    allowance: 4,
    stabilityReduction: 'ignored',
    reduction: { characteristic: 'I', score: 1 },
  });
  expect(low!.stability).toBeUndefined();
  expect(high).toMatchObject({ status: 'instruction', allowance: 0 });
  // Q-FM-1: a negative score is not guessed either way.
  expect(negative).toMatchObject({ status: 'manual' });
  expect(negative!.allowance).toBeUndefined();
  expect(unknown).toMatchObject({
    status: 'fact-needed',
    requirements: ['target:unknown.characteristics.I'],
  });
  // The section is executed in the allowances, so it is not also listed as table work.
  expect(result.effects.some(e => e.kind === 'rider')).toBe(false);
});

// conduit/level-1/call-the-thunder-down.md: Intuition roll, tier 2 "push 2", tier 3 "push 3"; "You
// can push each willing ally in the area the same distance, ignoring stability." One edge makes
// 16 + 2 = 18, tier 3, for that target only.
test('Call the Thunder Down reads the tier push distance, and asks when targets differ', () => {
  const same = resolved('Call the Thunder Down', facts(['a', 'b'], 'piety'));
  const rider = same.effects.find(e => e.kind === 'rider');
  expect(pushes(same).map(p => p.subtotal)).toEqual([2, 2]);
  expect(rider).toMatchObject({ status: 'manual', distances: [2], requirements: [] });
  expect(rider!.after).toEqual(expect.arrayContaining(pushes(same).map(p => p.nodeId)));
  const differ = resolved('Call the Thunder Down', facts(['a', 'b'], 'piety', [1, 0]));
  expect(pushes(differ).map(p => p.subtotal)).toEqual([3, 2]);
  const asked = differ.effects.find(e => e.kind === 'rider')!;
  expect(asked).toMatchObject({ status: 'fact-needed' });
  expect(asked.kind === 'rider' && asked.distances).toBeUndefined();
  expect(asked.kind === 'rider' && asked.requirements.join(' ')).toMatch(/2 or 3.*Q-FM-2/);
});

// null/level-1/phase-inversion-strike.md: Agility roll, tier 2 "6 + A damage; push 4". "If the
// target can't be teleported this way, you can't push them": the allowance waits on the table.
test('Phase Inversion Strike holds its push allowance until the table teleport', () => {
  const result = resolved('Phase Inversion Strike', facts(['target']));
  const [push] = pushes(result);
  expect(push).toMatchObject({ status: 'fact-needed', printed: 4, sizeBonus: 0, subtotal: 4 });
  expect(push!.allowance).toBeUndefined();
  expect(push!.precondition?.clause).toBe(
    result.effects.find(e => e.kind === 'rider' && e.shape === 'teleport')?.clause,
  );
  expect(result.effects.map(e => e.kind)).toEqual(['damage', 'push', 'rider']);
});

// censor/level-2/sentenced.md: Presence roll, tier 2 "9 + P damage; P < AVERAGE, restrained (save
// ends)". The rider reads "restrained this way", so it waits for that outcome, as Choke does.
test('Sentenced waits for its restrained outcome', () => {
  const unknown = resolved('Sentenced', facts(['target'], 'wrath'));
  const condition = unknown.effects.find(e => e.kind === 'condition')!;
  expect(unknown.effects.find(e => e.kind === 'rider')).toMatchObject({
    status: 'fact-needed',
    requirements: [`condition:${condition.nodeId}.outcome`],
  });
  const input = facts(['target'], 'wrath');
  input.conditionFacts = {
    targets: [{ targetId: 'target', kind: 'foe', characteristics: { P: 0 } }],
    potency: { characteristic: 'P', weak: 0, average: 1, strong: 2 },
  };
  const known = resolved('Sentenced', input);
  expect(known.effects.find(e => e.kind === 'condition')).toMatchObject({ status: 'applied' });
  expect(known.effects.find(e => e.kind === 'rider')).toMatchObject({ status: 'manual' });
});

// fury/level-1/thunder-roar.md: the Effect is about all the targets, so it occurs once per use.
test('Thunder Roar lists its ordering once on an area use', () => {
  const result = resolved('Thunder Roar', facts(['a', 'b', 'c'], 'ferocity'));
  expect(result.effects.filter(e => e.kind === 'rider')).toHaveLength(1);
  expect(pushes(result)).toHaveLength(3);
});

test('admission is whole-sentence and needs one tier forced movement to govern', () => {
  expect(
    effectRider(
      "This forced movement ignores stability. Instead, the forced movement is reduced by a number equal to the target's Luck score.",
    ),
  ).toBeUndefined();
  expect(
    effectRider(
      'You can push each willing ally in the area the same distance, ignoring stability. Each ally takes 2 damage.',
    ),
  ).toBeUndefined();
  const rule = effectRider(
    plain(
      "This forced movement ignores stability. Instead, the forced movement is reduced by a number equal to the target's Intuition score.",
    ),
  )!;
  expect(
    riderAdmitted(rule, [[{ kind: 'push' }], [{ kind: 'push' }], [{ kind: 'push' }]], 'area'),
  ).toBe(true);
  expect(
    riderAdmitted(rule, [[{ kind: 'damage' }], [{ kind: 'push' }], [{ kind: 'push' }]], 'area'),
  ).toBe(false);
  // A stored definition whose rule was removed no longer re-reads to the same section.
  const definition = compileAbility(envelope('Machinations of Sound'));
  const tampered = structuredClone(definition);
  const section = tampered.sections[0]!;
  if (section.kind === 'rider') delete section.forcedMovement;
  const input = facts(['a'], 'insight');
  expect(resolveCompiledAbility(tampered, input).kind).toBe('manual');
  expect(resolveCompiledAbility(definition, input).kind).toBe('resolved');
});
