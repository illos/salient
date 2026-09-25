// SPDX-License-Identifier: GPL-3.0-only
/**
 * V177 damage-type options. Expected values come from the pinned Compendium (`en/unified/md`):
 * each ability's tiers and Effect, rule/dice/power-roll.md (tier bands 11 or lower, 12-16, 17 or
 * higher), rule/damage/damage-type.md, rule/damage/damage-immunity.md ("Whenever a target with
 * damage immunity takes damage of the indicated type, they can reduce the damage by the value of
 * the immunity") and rule/damage/damage-weakness.md ("A creature who has "damage weakness X" with no
 * specific type or keyword indicated has weakness of the indicated amount when they take damage of
 * any type").
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import { chooseDamageType, sectionDamageType } from '../../shared/resolve/damageTypes.ts';
import { correctTarget } from '../../shared/resolve/index.ts';
import type { DamageModifierEntry } from '../../shared/contracts/rollResolution.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const envelope = (name: string) =>
  structuredClone(
    compilerEnvelope(
      corpus.find(e => e.name === name && e.corpus === 'hero-standalone')!,
      inputs,
    ),
  );
/** Every characteristic 2; dice 7 + 7 + 2 = 16 is tier 2 without edges or banes. */
const facts = (
  selectedDamageType: string | undefined,
  modifiers: { immunities?: DamageModifierEntry[]; weaknesses?: DamageModifierEntry[] } = {},
): CompiledAbilityInput => ({
  actor: { actorId: 'hero', characteristics: { M: 2, A: 2, R: 2, I: 2, P: 2 } },
  targets: [{ targetId: 'foe', edges: 0, banes: 0 }],
  dice: { d10a: 7, d10b: 7 },
  inCombat: false,
  // Visceral Roar costs 5 Ferocity; Ray of Wrath and Hurl Element have no cost.
  resourcePool: { resource: 'ferocity', current: 9, legalFloor: 0 },
  targetFacts: [
    {
      targetId: 'foe',
      kind: 'foe',
      stamina: 50,
      maxStamina: 50,
      temporaryStamina: 0,
      immunities: modifiers.immunities ?? [],
      weaknesses: modifiers.weaknesses ?? [],
    },
  ],
  conditionFacts: { targets: [{ targetId: 'foe', kind: 'foe', characteristics: { M: 9 } }] },
  ...(selectedDamageType ? { selectedDamageType } : {}),
});
const use = (name: string, input: CompiledAbilityInput) =>
  resolveCompiledAbility(compileAbility(envelope(name)), input);
const damageOf = (name: string, input: CompiledAbilityInput) => {
  const result = use(name, input);
  if (result.kind !== 'resolved') throw new Error(`${name}: ${result.kind}`);
  expect(result.roll.targets[0]!.tier).toBe(2);
  return { result, application: result.roll.damageApplications[0]! };
};

test.each([
  ['Ray of Wrath', 'optional', ['holy']],
  [
    'Hurl Element',
    'required',
    ['acid', 'cold', 'corruption', 'fire', 'lightning', 'poison', 'sonic'],
  ],
  ['Visceral Roar', 'primordial', ['cold', 'fire', 'corruption', 'lightning']],
])('%s compiles its whole Effect as one damage-type section', (name, choice, options) => {
  const definition = compileAbility(envelope(name));
  expect(definition.execution).toBe('supported');
  expect(definition.sections).toHaveLength(1);
  expect(definition.sections[0]).toMatchObject({ kind: 'damage-type', spec: { choice, options } });
  const source = definition.envelope.blocks.find(b => b.kind === 'section');
  expect(definition.sections[0]!.clause).toBe(source?.kind === 'section' ? source.text : undefined);
  // Executed in the damage, never listed as table work.
  const result = use(name, facts(choice === 'optional' ? undefined : options[0]));
  expect(result.kind).toBe('resolved');
  expect(result.effects.some(e => e.kind === 'rider' || e.kind === 'unsupported')).toBe(false);
});

test('whole-section admission: a changed sentence is not a damage-type option', () => {
  expect(sectionDamageType('You can have this ability deal holy damage.')).toBeDefined();
  expect(sectionDamageType('You can have this ability deal radiant damage.')).toBeUndefined();
  expect(
    sectionDamageType('You can have this ability deal holy damage. The target is weakened.'),
  ).toBeUndefined();
  expect(
    sectionDamageType(
      'When you make this strike, choose the damage type from one of the following options: acid, cold, or radiant.',
    ),
  ).toBeUndefined();
});

// conduit/level-1/ray-of-wrath.md: tier 2 "4 + I damage" is 6 with Intuition 2.
test('Ray of Wrath deals untyped damage unless holy is chosen', () => {
  const holyImmunity = { immunities: [{ type: 'holy', value: 4 }] };
  const untyped = damageOf('Ray of Wrath', facts(undefined, holyImmunity));
  expect(untyped.result.roll.targets[0]!.damage).toMatchObject({ rolledDamage: 6 });
  expect(untyped.result.roll.targets[0]!.damage!.damageType).toBeUndefined();
  // Holy immunity applies only to holy damage.
  expect(untyped.application).toMatchObject({ immunityApplied: 0, afterImmunity: 6 });
  const holy = damageOf('Ray of Wrath', facts('holy', holyImmunity));
  expect(holy.result.roll.selectedDamageType).toBe('holy');
  expect(holy.result.roll.targets[0]!.damage).toMatchObject({
    rolledDamage: 6,
    damageType: 'holy',
  });
  expect(holy.application).toMatchObject({ immunityApplied: 4, afterImmunity: 2 });
  // Only the printed option: fire is not one.
  expect(use('Ray of Wrath', facts('fire')).kind).toBe('manual');
});

// elementalist/level-1/hurl-element.md: tier 2 "4 + R damage" is 6 with Reason 2.
test('Hurl Element needs a choice and applies the chosen type to weakness and immunity', () => {
  expect(use('Hurl Element', facts(undefined)).kind).toBe('manual');
  expect(use('Hurl Element', facts('holy')).kind).toBe('manual');
  const fireWeak = { weaknesses: [{ type: 'fire', value: 5 }] };
  expect(damageOf('Hurl Element', facts('fire', fireWeak)).application).toMatchObject({
    weaknessApplied: 5,
    afterImmunity: 11,
  });
  expect(damageOf('Hurl Element', facts('cold', fireWeak)).application).toMatchObject({
    weaknessApplied: 0,
    afterImmunity: 6,
  });
  // An untyped "damage weakness 3" applies to damage of any type.
  expect(
    damageOf('Hurl Element', facts('cold', { weaknesses: [{ type: 'all-damage', value: 3 }] }))
      .application,
  ).toMatchObject({ weaknessApplied: 3, afterImmunity: 9 });
});

// elementalist/level-1/fire-acolyte-of-fire.md: "Your Hurl Element ability (see below) also gains
// this bonus when you use it to deal fire damage." (+1 rolled damage).
test('Acolyte of Fire adds its bonus to Hurl Element only when fire is chosen', () => {
  const withAcolyte = (type: string) => {
    const input = facts(type);
    input.actor.abilityDamageModifiers = [
      {
        label: 'Fire: Acolyte of Fire',
        amount: 1,
        keywords: ['Fire', 'Magic'],
        alternative: { ability: 'Hurl Element', damageType: 'fire' },
      },
    ];
    return damageOf('Hurl Element', input).result.roll.targets[0]!.damage!.rolledDamage;
  };
  expect(withAcolyte('fire')).toBe(7);
  expect(withAcolyte('acid')).toBe(6);
});

// fury/level-2/visceral-roar.md: tier 2 "5 damage"; the Boren kit's Primordial Storm is cold
// (fury/boren/primordial-storm-blizzard.md).
test('Visceral Roar deals the primordial damage type of the kit, which is not chosen', () => {
  const spec = compileAbility(envelope('Visceral Roar')).sections[0]!;
  if (spec.kind !== 'damage-type') throw new Error('no damage-type section');
  const boren = [{ name: 'Primordial Storm: Blizzard' }];
  expect(chooseDamageType(spec.spec, undefined, boren, 'Visceral Roar')).toMatchObject({
    type: 'cold',
  });
  expect(chooseDamageType(spec.spec, 'cold', boren, 'Visceral Roar')).toMatchObject({
    type: 'cold',
  });
  expect(chooseDamageType(spec.spec, 'fire', boren, 'Visceral Roar')).toHaveProperty('refusal');
  expect(chooseDamageType(spec.spec, undefined, [], 'Visceral Roar')).toHaveProperty('refusal');
  const cold = damageOf(
    'Visceral Roar',
    facts('cold', { weaknesses: [{ type: 'cold', value: 2 }] }),
  );
  expect(cold.application).toMatchObject({ incoming: 5, weaknessApplied: 2, afterImmunity: 7 });
});

test('Hurl Element refuses a missing or unprinted choice; Ray of Wrath allows none', () => {
  const hurl = compileAbility(envelope('Hurl Element')).sections[0]!;
  const ray = compileAbility(envelope('Ray of Wrath')).sections[0]!;
  if (hurl.kind !== 'damage-type' || ray.kind !== 'damage-type') throw new Error('sections');
  expect(chooseDamageType(hurl.spec, undefined, [], 'Hurl Element')).toHaveProperty('refusal');
  expect(chooseDamageType(hurl.spec, 'holy', [], 'Hurl Element')).toHaveProperty('refusal');
  expect(chooseDamageType(hurl.spec, 'Fire', [], 'Hurl Element')).toEqual({ type: 'fire' });
  expect(chooseDamageType(ray.spec, undefined, [], 'Ray of Wrath')).toEqual({});
});

test('a tampered damage-type section is refused', () => {
  const definition = compileAbility(envelope('Hurl Element'));
  const node = definition.sections[0]!;
  if (node.kind !== 'damage-type') throw new Error('no damage-type section');
  node.spec.options.push('holy');
  expect(resolveCompiledAbility(definition, facts('holy')).kind).toBe('manual');
});

// A correction recomputes with the use's saved type: edges 0 → 1 gives 18, tier 3 "6 + R" = 8
// fire damage, plus fire weakness 5.
test('a correction keeps the chosen damage type', () => {
  const input = facts('fire', { weaknesses: [{ type: 'fire', value: 5 }] });
  const { result, application } = damageOf('Hurl Element', input);
  const correction = correctTarget(
    result.definition.metadata!,
    input.actor,
    result.roll,
    'use',
    result.roll.targets[0]!,
    application,
    { ...input.targetFacts[0]!, stamina: application.staminaAfter },
    1,
    0,
  );
  expect(correction.after).toMatchObject({
    tier: 3,
    damage: { rolledDamage: 8, damageType: 'fire' },
  });
  expect(correction.damageAfter).toMatchObject({ weaknessApplied: 5, afterImmunity: 13 });
});
