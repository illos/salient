// SPDX-License-Identifier: GPL-3.0-only
/**
 * V170 Strained sections. Expected values come from the pinned Compendium (en/unified/md):
 * - feature/talent/level-1/clarity-and-strain.md: "Whenever you have clarity below 0, you are
 *   strained. Some psionic abilities have additional effects if you are already strained or become
 *   strained when you use them." Outside combat: "Whenever you use an ability with a strain effect
 *   outside of combat, you can take 1d6 damage and incur the effect".
 * - feature/ability/talent/level-1/mind-spike.md: Power Roll + Reason; ≤11 2 + R psychic, 12-16
 *   4 + R psychic, 17+ 6 + R psychic; "Strained: The target takes an extra 2 psychic damage. You
 *   also take 2 psychic damage that can't be reduced in any way."
 * - feature/ability/talent/level-1/spirit-sword.md: Power Roll + Presence; ≤11 3 + P damage;
 *   "Strained: The target takes an extra 3 damage. You also take 3 damage that can't be reduced in
 *   any way."
 * - rule/dice/power-roll.md: a natural 2 + 2 is tier 1 (≤11); a natural 20 is tier 3.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import { strainedSection, strainedState } from '../../shared/resolve/strained.ts';

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
const input = (
  dice: [number, number],
  strained?: CompiledAbilityInput['strained'],
  immunities: { type: string; value: number }[] = [],
) =>
  ({
    actor: { actorId: 'talent', characteristics: { M: 0, A: 0, R: 2, I: 0, P: 2 } },
    targets: [{ targetId: 't', edges: 0, banes: 0 }],
    dice: { d10a: dice[0], d10b: dice[1] },
    inCombat: true,
    targetFacts: [
      {
        targetId: 't',
        kind: 'foe',
        stamina: 30,
        maxStamina: 30,
        temporaryStamina: 0,
        immunities,
        weaknesses: [],
      },
    ],
    ...(strained ? { strained } : {}),
  }) as unknown as CompiledAbilityInput;
const strainedNow = strainedState({ inCombat: true, clarity: -1 });
const calm = strainedState({ inCombat: true, clarity: 2 });

test('the grammar reads a whole Strained section of extra target damage and unreducible self-damage', () => {
  expect(
    strainedSection(
      "The target takes an extra 2 psychic damage. You also take 2 psychic damage that can't be reduced in any way.",
    ),
  ).toEqual({
    targetExtraDamage: { amount: 2, damageType: 'psychic' },
    selfDamage: { amount: 2, damageType: 'psychic', unreducible: true },
  });
  expect(
    strainedSection(
      "The target takes an extra 3 damage. You also take 3 damage that can't be reduced in any way.",
    ),
  ).toEqual({
    targetExtraDamage: { amount: 3 },
    selfDamage: { amount: 3, unreducible: true },
  });
  // Pinned texts of other Talent abilities stay manual: a Reason-valued or reducible self-damage,
  // a surge, an area change, or anything after the admitted sentences.
  for (const refused of [
    "You gain 1 surge that you can use immediately, and you take damage equal to your Reason score that can't be reduced in any way.",
    'You take half the damage the target takes.',
    'The size of the burst increases by 2, and you are bleeding until the start of your next turn.',
    'You take 1d6 damage and are slowed (save ends).',
    'The target takes an extra 2 psychic damage. You also take 2 psychic damage.',
    "You also take 2 psychic damage that can't be reduced in any way. The target takes an extra 2 psychic damage.",
    'The target takes an extra 2 psychic damage. The target is dazed (save ends).',
  ])
    expect(strainedSection(refused), refused).toBeUndefined();
});

test('strained is decided from clarity before and after the payment, or declared', () => {
  const pay = (before: number, amount: number, waived = false) => ({
    resource: 'clarity',
    amount,
    waived,
    before,
    after: waived ? before : before - amount,
  });
  // Already strained: clarity below 0 before the use, even with no cost (Mind Spike has none).
  expect(strainedState({ inCombat: true, clarity: -1 })).toMatchObject({
    applies: true,
    basis: 'already-strained',
  });
  // Becomes strained: 1 clarity paying 3 goes to −2.
  expect(strainedState({ inCombat: true, clarity: 1, cost: pay(1, 3) })).toMatchObject({
    applies: true,
    basis: 'became-strained',
    clarityBefore: 1,
    clarityAfter: -2,
  });
  // Paying down to exactly 0 is not below 0.
  expect(strainedState({ inCombat: true, clarity: 3, cost: pay(3, 3) })).toMatchObject({
    applies: false,
    basis: 'not-strained',
  });
  expect(strainedState({ inCombat: true })).toMatchObject({ applies: false, basis: 'no-clarity' });
  // Outside combat the cost is waived; the table declares the one-minute or voluntary strain,
  // which costs 1d6 damage.
  expect(
    strainedState({ inCombat: false, clarity: 0, cost: pay(0, 3, true), declared: 'yes' }),
  ).toMatchObject({ applies: true, basis: 'outside-combat', incurDamage: { dice: '1d6' } });
  expect(strainedState({ inCombat: false, clarity: 0, cost: pay(0, 3, true) })).toMatchObject({
    applies: false,
    basis: 'not-strained',
  });
  // "if you don't incur it for other reasons": already strained outside combat costs no 1d6.
  expect(
    strainedState({ inCombat: false, clarity: -1, declared: 'yes' }).incurDamage,
  ).toBeUndefined();
  // In combat a declaration against the automatic value is the table's override.
  expect(strainedState({ inCombat: true, clarity: -1, declared: 'no' })).toMatchObject({
    applies: false,
    basis: 'declared-not-strained',
  });
  expect(strainedState({ inCombat: true, clarity: 2, declared: 'yes' })).toMatchObject({
    applies: true,
    basis: 'declared-strained',
  });
});

test('Mind Spike and Spirit Sword compile; other Strained sections keep their ability manual', () => {
  for (const name of ['Mind Spike', 'Spirit Sword']) {
    const definition = compiled(name);
    expect(definition.execution, name).toBe('supported');
    expect(definition.sections.filter(node => node.kind === 'strained')).toHaveLength(1);
  }
  for (const name of ['Hoarfrost', 'Optic Blast', 'Levity and Gravity', 'Kinetic Pulse']) {
    const definition = compiled(name);
    expect(definition.execution, name).toBe('manual');
    // The Strained section is read as a section (no block-count or unaccounted-paragraph noise),
    // and preserved as manual work.
    expect(
      definition.diagnostics.map(d => d.code),
      name,
    ).not.toContain('source-block-count');
    expect(
      definition.diagnostics.map(d => d.code),
      name,
    ).not.toContain('unaccounted-paragraph');
    expect(
      definition.sections.some(
        node => node.kind === 'unsupported' && node.shape === 'effect-paragraph:strained',
      ),
      name,
    ).toBe(true);
  }
});

test('a strained Mind Spike adds 2 psychic damage to the target; an unstrained one does not', () => {
  const definition = compiled('Mind Spike');
  const outcome = (
    strained?: CompiledAbilityInput['strained'],
    dice: [number, number] = [1, 1],
  ) => {
    const result = resolveCompiledAbility(definition, input(dice, strained));
    if (result.kind !== 'resolved') throw new Error(result.kind);
    return result;
  };
  // Tier 1: 2 + R (2) = 4; strained 4 + 2 = 6.
  expect(outcome(calm).roll.targets[0]!.damage!.rolledDamage).toBe(4);
  expect(outcome(strainedNow).roll.targets[0]!.damage!.rolledDamage).toBe(6);
  expect(outcome(strainedNow).roll.damageApplications[0]!.staminaAfter).toBe(30 - 6);
  // Tier 3 (natural 20): 6 + 2 = 8; strained 10.
  expect(outcome(strainedNow, [10, 10]).roll.targets[0]!.damage!.rolledDamage).toBe(10);
  const section = (strained?: CompiledAbilityInput['strained']) =>
    outcome(strained).effects.find(effect => effect.kind === 'strained');
  expect(section(strainedNow)).toMatchObject({ status: 'applied', targetId: 't' });
  expect(section(calm)).toMatchObject({ status: 'not-strained' });
  // Without a decision the section is table work and adds nothing.
  expect(section(undefined)).toMatchObject({ status: 'manual', requirements: ['actor.strained'] });
  expect(outcome(undefined).roll.targets[0]!.damage!.rolledDamage).toBe(4);
});

test('Spirit Sword adds its untyped 3 when strained', () => {
  const result = resolveCompiledAbility(compiled('Spirit Sword'), input([1, 1], strainedNow));
  if (result.kind !== 'resolved') throw new Error(result.kind);
  // Tier 1: 3 + P (2) = 5; strained 5 + 3 = 8.
  expect(result.roll.targets[0]!.damage!.rolledDamage).toBe(8);
});

test('a changed Strained spec is refused as tampering', () => {
  const definition = compiled('Mind Spike');
  const changed = structuredClone(definition);
  const node = changed.sections.find(n => n.kind === 'strained')!;
  if (node.kind !== 'strained') throw new Error('expected a strained node');
  node.spec.targetExtraDamage = { amount: 20, damageType: 'psychic' };
  expect(resolveCompiledAbility(changed, input([1, 1], strainedNow)).kind).toBe('manual');
});
