// SPDX-License-Identifier: GPL-3.0-only
/**
 * V154 tiers without damage and tier clauses that are table work. Expected values come from the
 * pinned Compendium sources named on each test.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { tierInstruction } from '../../shared/resolve/effectRiders.ts';
import { plain } from '../../shared/resolve/abilityGrammar.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const compiled = (name: string, corpusKind = 'hero-standalone') =>
  compileAbility(
    structuredClone(
      compilerEnvelope(
        corpus.find(e => e.name === name && e.corpus === corpusKind)!,
        inputs,
      ),
    ),
  );
const hero = (targetId: string) => ({
  targetId,
  kind: 'hero' as const,
  stamina: 30,
  maxStamina: 30,
  temporaryStamina: 0,
  immunities: [],
  weaknesses: [],
});
const input = (
  dice: [number, number],
  targets: string[],
  pool?: { resource: string; current: number },
): CompiledAbilityInput =>
  ({
    actor: {
      actorId: 'hero',
      characteristics: { M: 2, A: 2, R: 2, I: 2, P: 2 },
      kitMeleeDamageBonus: [0, 0, 0],
      kitRangedDamageBonus: [0, 0, 0],
    },
    targets: targets.map(targetId => ({ targetId, edges: 0, banes: 0 })),
    dice: { d10a: dice[0], d10b: dice[1] },
    inCombat: false,
    ...(pool ? { resourcePool: { ...pool, legalFloor: 0 } } : {}),
    targetFacts: targets.map(hero),
    movement: {
      actor: {
        kind: 'creature',
        size: '1M',
        conditions: { kind: 'none' },
        traits: { kind: 'none' },
        modifiers: { kind: 'none' },
      },
      targets: targets.map(targetId => ({
        targetId,
        kind: 'creature',
        size: '1M',
        stability: 0,
        conditions: { kind: 'none' },
        traits: { kind: 'none' },
        modifiers: { kind: 'none' },
      })),
    },
  }) as unknown as CompiledAbilityInput;

test('tier instructions match whole printed clauses only', () => {
  expect(tierInstruction('you can teleport the target up to 3 squares')).toEqual({
    shape: 'teleport',
  });
  expect(tierInstruction('Each target gains 2 surges.')).toEqual({ shape: 'surges' });
  for (const refused of [
    'you can teleport the target up to 3 squares and deal 2 damage',
    'Each target gains 2 surges and 5 temporary Stamina',
    'the target can shift up to 2 squares',
  ])
    expect(tierInstruction(refused), refused).toBeUndefined();
});

// feature/ability/troubadour/level-1/power-chord.md: "≤11: Push 1; 12-16: Push 2; 17+: Push 3"
// on "Each enemy in the area". Dice 6 + 6 + P2 = 14 is tier 2 for each target.
test('Power Chord pushes each target by its tier with no damage', () => {
  const definition = compiled('Power Chord');
  expect(definition.execution).toBe('supported');
  expect(definition.metadata!.tiers.every(tier => tier.damage === undefined)).toBe(true);
  const result = resolveCompiledAbility(definition, input([6, 6], ['a', 'b']));
  if (result.kind !== 'resolved') throw new Error(result.kind);
  expect(result.roll.damageApplications).toEqual([]);
  expect(result.effects.map(e => [e.kind, e.targetId, e.kind === 'push' && e.printed])).toEqual([
    ['push', 'a', 2],
    ['push', 'b', 2],
  ]);
  expect(result.effects.every(e => e.kind === 'push' && e.status === 'instruction')).toBe(true);
});

// feature/ability/tactician/level-1/battle-cry.md: "Three allies"; "Each target gains 1/2/3
// surge(s)." Costs 3 Focus. Dice 10 + 10 is tier 3: each ally's instruction reads 3 surges and changes no state.
test('Battle Cry records one surge instruction per ally, ready at once', () => {
  const definition = compiled('Battle Cry');
  expect(definition.execution).toBe('supported');
  const result = resolveCompiledAbility(
    definition,
    input([10, 10], ['a', 'b', 'c'], { resource: 'focus', current: 3 }),
  );
  if (result.kind !== 'resolved') throw new Error(result.kind);
  expect(result.effects).toHaveLength(3);
  for (const [index, effect] of result.effects.entries())
    expect(effect).toMatchObject({
      kind: 'rider',
      targetId: ['a', 'b', 'c'][index],
      shape: 'surges',
      status: 'manual',
      tier: true,
      after: [],
    });
  expect(result.effects.every(e => plain(e.clause) === 'Each target gains 3 surges.')).toBe(true);
});

// feature/ability/shadow/level-2/in-a-puff-of-ash.md tier 2: "10 + A damage; you can teleport the
// target up to 3 squares". Dice 6 + 6 + A2 = 14 is tier 2; the instruction waits for the damage.
test('In a Puff of Ash orders its teleport after the damage it follows', () => {
  const definition = compiled('In a Puff of Ash');
  expect(definition.execution).toBe('supported');
  const facts = input([6, 6], ['a'], { resource: 'insight', current: 5 });
  const done = resolveCompiledAbility(definition, facts);
  if (done.kind !== 'resolved') throw new Error(done.kind);
  const [damage, teleport] = done.effects;
  expect(damage).toMatchObject({ kind: 'damage', status: 'calculated' });
  expect(teleport).toMatchObject({
    kind: 'rider',
    shape: 'teleport',
    status: 'manual',
    after: [damage!.nodeId],
    tier: true,
  });
  const waiting = resolveCompiledAbility(definition, { ...facts, targetFacts: [] });
  if (waiting.kind !== 'resolved') throw new Error(waiting.kind);
  expect(waiting.effects[1]).toMatchObject({
    status: 'fact-needed',
    requirements: [`damage:${damage!.nodeId}.completion`],
  });
});

test('a tampered instruction or misplaced damage is outside the supported envelope', () => {
  const definition = compiled('Fade', 'kit-signature');
  expect(definition.execution).toBe('supported');
  const changed = structuredClone(definition);
  const instruction = changed.tiers[1]!.find(n => n.kind === 'instruction')!;
  if (instruction.kind !== 'instruction') throw new Error('Missing instruction');
  instruction.shape = 'recovery';
  expect(resolveCompiledAbility(changed, input([6, 6], ['a'])).kind).toBe('manual');
  const reordered = structuredClone(definition);
  reordered.tiers[1]!.reverse();
  expect(resolveCompiledAbility(reordered, input([6, 6], ['a'])).kind).toBe('manual');
});
