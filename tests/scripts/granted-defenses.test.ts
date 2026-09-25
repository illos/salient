// SPDX-License-Identifier: GPL-3.0-only
/**
 * V179 immunity and weakness granted in play, pure parts. Expected values are read from the pinned
 * Compendium (en/unified/md), never from a run of the code under test:
 * - feature/ability/shadow/level-1/setup.md: "6 + A damage; R < WEAK, the target has damage
 *   weakness 5 (save ends)", "9 + A damage; R < AVERAGE, …", "13 + A damage; R < STRONG, …".
 * - feature/ability/conduit/level-1/corruptions-curse.md: "3 + I corruption damage; M < WEAK,
 *   damage weakness 5 (save ends)" (AVERAGE, STRONG at tiers 2 and 3); "One creature or object".
 * - feature/ability/censor/level-1/purifying-fire.md: "M < WEAK, the target has fire weakness 3
 *   (save ends)", "M < AVERAGE, … fire weakness 5 …", "M < STRONG, … fire weakness 7 …"; Effect:
 *   "While the target has fire weakness from this ability, you can choose to have your abilities
 *   deal fire damage to the target instead of holy damage."
 * - monster/draconian/statblock/myxovidan-the-sintaker.md, Expunging Exhalation: "M < 1 the target
 *   has corruption weakness 3 (save ends)", "M < 2 …", "M < 3 …".
 * - feature/ability/talent/level-1/smolder.md: "R < WEAK, the target has weakness 5 (save ends)"
 *   with the type chosen in the Effect before the roll.
 * - rule/character/potency.md: an effect applies "only if the effect's potency value is higher than
 *   the target's indicated characteristic score"; weak = highest characteristic − 2, average − 1,
 *   strong = the score.
 * - rule/damage/damage-immunity.md: "If multiple damage immunities apply to a source of damage, only
 *   the immunity with the highest value applies. For instance, a creature with damage immunity 5
 *   and fire immunity 10 who takes 12 fire damage reduces the damage by 10 points."
 * - rule/damage/damage-weakness.md: "if a creature has fire weakness 5 and is dealt 10 fire damage,
 *   they take 15 fire damage instead."; "If a creature has both damage immunity and damage weakness
 *   for a source of damage, apply the weakness first, then the immunity."; "If multiple damage
 *   weaknesses apply to a source of damage, only the weakness with the highest value applies."
 * - monster/undead/2nd-echelon/statblock/mummy.md: Immunity "Corruption 4, poison 4", Weakness
 *   "Fire 5".
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility, type DamageModifierNode } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import {
  grantedDefenses,
  parseModifierCell,
  tierDamageModifier,
  withGrantedDefenses,
} from '../../shared/resolve/damageModifiers.ts';
import { applyDamage } from '../../shared/resolve/index.ts';
import { reducePotency } from '../../shared/resolve/damageRevision.ts';
import type { DamageModifier, EffectInstance } from '../../shared/contracts/liveState.ts';
import type { DamageTargetFacts } from '../../shared/contracts/rollResolution.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const compiled = (name: string, population = 'hero-standalone') =>
  compileAbility(
    structuredClone(
      compilerEnvelope(
        corpus.find(e => e.name === name && e.corpus === population)!,
        inputs,
      ),
    ),
  );
const weaknessNodes = (name: string, population?: string) =>
  compiled(name, population).tiers.map(
    nodes => nodes.find(node => node.kind === 'damage-modifier') as DamageModifierNode | undefined,
  );
const weakness = (damageType: string, value: number): DamageModifier => ({
  kind: 'damage-modifier',
  defense: 'weakness',
  damageType,
  value,
});

test('V179: tier weakness clauses compile with their potency, type, value and duration', () => {
  for (const [name, population, characteristic, thresholds, modifiers] of [
    [
      'Setup',
      'hero-standalone',
      'R',
      ['weak', 'average', 'strong'],
      [5, 5, 5].map(v => weakness('all-damage', v)),
    ],
    [
      "Corruption's Curse",
      'hero-standalone',
      'M',
      ['weak', 'average', 'strong'],
      [5, 5, 5].map(v => weakness('all-damage', v)),
    ],
    [
      'Purifying Fire',
      'hero-standalone',
      'M',
      ['weak', 'average', 'strong'],
      [3, 5, 7].map(v => weakness('fire', v)),
    ],
    [
      'Expunging Exhalation',
      'foe-ability',
      'M',
      [1, 2, 3],
      [3, 3, 3].map(v => weakness('corruption', v)),
    ],
  ] as const) {
    const nodes = weaknessNodes(name, population);
    nodes.forEach((node, tier) => {
      expect(node, `${name} tier ${tier + 1}`).toMatchObject({
        characteristic,
        threshold:
          typeof thresholds[tier] === 'number'
            ? { kind: 'printed', value: thresholds[tier] }
            : { kind: 'potency', tier: thresholds[tier] },
        spec: { subject: 'target', modifier: modifiers[tier], duration: { kind: 'save-ends' } },
      });
      // The weakness follows the tier's damage (rule/dice/ability-roll.md: effects after damage).
      expect(node!.after).toBe(compiled(name, population).tiers[tier]![0]!.id);
    });
  }
  // Setup, Corruption's Curse and Expunging Exhalation compile whole; Purifying Fire's Effect lets
  // later abilities change their damage type, so it stays manual and says so.
  for (const [name, population] of [
    ['Setup', 'hero-standalone'],
    ["Corruption's Curse", 'hero-standalone'],
    ['Expunging Exhalation', 'foe-ability'],
  ] as const)
    expect(compiled(name, population).execution, name).toBe('supported');
  const purifying = compiled('Purifying Fire');
  expect(purifying.execution).toBe('manual');
  expect(purifying.diagnostics.find(d => d.code === 'defense-manual')?.message).toMatch(
    /fire instead of holy damage/,
  );

  // Not read: a weakness without a type (Smolder's choice), an immunity, another duration.
  for (const clause of [
    'R < WEAK, the target has weakness 5 (save ends)',
    'R < WEAK, the target has fire immunity 5 (save ends)',
    'R < WEAK, the target has fire weakness 5 until the start of your next turn',
    'R < WEAK, the target has frost weakness 5 (save ends)',
  ])
    expect(tierDamageModifier(clause), clause).toBeUndefined();
  const smolder = compiled('Smolder');
  expect(smolder.execution).toBe('manual');
  expect(smolder.diagnostics.filter(d => d.code === 'defense-manual').length).toBeGreaterThan(0);
  // Weakening Brand, Force Orbs and Statue of Power each name why they stay manual.
  for (const [name, population, reason] of [
    ['Weakening Brand', 'kit-signature', /characteristic the power roll used/],
    ['Force Orbs', 'hero-standalone', /counts orbs/],
    ['Statue of Power', 'hero-standalone', /object/],
  ] as const) {
    const definition = compiled(name, population);
    expect(definition.execution, name).toBe('manual');
    expect(
      definition.diagnostics.some(d => d.code === 'defense-manual' && reason.test(d.message)),
      name,
    ).toBe(true);
  }
});

// v92-shadow-3: Agility 2 (potency weak 0, average 1, strong 2). 5 + 5 + 2 = 12 is tier 2.
const setupInput = (reason: number, kind: 'hero' | 'foe' | 'object' | 'squad' = 'foe') =>
  ({
    actor: { actorId: 'shade', characteristics: { M: 2, A: 2, R: 1, I: 0, P: 0 } },
    targets: [{ targetId: 'goblin', edges: 0, banes: 0 }],
    dice: { d10a: 5, d10b: 5 },
    inCombat: true,
    resourcePool: { resource: 'insight', current: 5, legalFloor: 0 },
    targetFacts: [
      { targetId: 'goblin', kind: 'foe', stamina: 15, maxStamina: 15, temporaryStamina: 0 },
    ],
    conditionFacts: {
      targets: [
        { targetId: 'goblin', kind, characteristics: { M: -2, A: 2, R: reason, I: 0, P: -1 } },
      ],
      potency: { characteristic: 'A', weak: 0, average: 1, strong: 2 },
    },
  }) satisfies CompiledAbilityInput;

test('V179: Setup’s weakness applies below the potency, is resisted at it, and objects stay manual', () => {
  const definition = compiled('Setup');
  const outcome = (input: CompiledAbilityInput) => {
    const resolved = resolveCompiledAbility(definition, input);
    if (resolved.kind !== 'resolved') throw new Error(resolved.kind);
    return resolved.effects.find(effect => effect.kind === 'modifier')!;
  };
  expect(outcome(setupInput(0))).toMatchObject({
    status: 'applied',
    tier: true,
    payload: weakness('all-damage', 5),
    potency: { characteristic: 'R', threshold: 1, targetScore: 0, potencyCharacteristic: 'A' },
  });
  expect(outcome(setupInput(1))).toMatchObject({ status: 'resisted' });
  for (const kind of ['object', 'squad'] as const)
    expect(outcome(setupInput(0, kind))).toMatchObject({ status: 'manual' });
  // Damage the engine couldn't apply leaves the weakness that follows it to the table.
  expect(outcome({ ...setupInput(0), targetFacts: [] })).toMatchObject({
    status: 'manual',
    requirements: expect.arrayContaining([expect.stringMatching(/completion/)]),
  });
  // Tamper refusal: a stored weakness that no longer matches its printed clause.
  const tampered = structuredClone(definition);
  (tampered.tiers[1]!.find(n => n.kind === 'damage-modifier') as DamageModifierNode).spec.modifier =
    weakness('all-damage', 10);
  expect(resolveCompiledAbility(tampered, setupInput(0)).kind).toBe('manual');
});

let sequence = 0;
function granted(modifier: DamageModifier, extra: Partial<EffectInstance> = {}): EffectInstance {
  const id = `granted-${++sequence}`;
  return {
    id,
    kind: 'modifier',
    sourceUseEventId: `use-${sequence}`,
    sourceActorId: 'owner',
    abilityId: 'setup',
    abilityName: 'Setup',
    actorLabel: 'Shade',
    sourcePath: 'feature/ability/shadow/level-1/setup.md',
    clause: 'printed',
    owner: { kind: 'character', id: 'owner', name: 'Shade' },
    subject: { kind: 'foe', id: 'mummy', name: 'Mummy' },
    payload: { kind: 'modifier', text: 'printed', modifier },
    printedDuration: { kind: 'save-ends' },
    duration: { kind: 'save-ends', creatureId: 'mummy' },
    endsWhen: [],
    status: 'active',
    registrationIds: [],
    appliedSequence: sequence,
    ...extra,
  };
}

const mummy = (instances: EffectInstance[]): DamageTargetFacts => {
  const read = grantedDefenses(instances);
  if ('manual' in read) throw new Error(read.manual);
  return withGrantedDefenses<DamageTargetFacts>(
    {
      targetId: 'mummy',
      kind: 'foe',
      stamina: 50,
      maxStamina: 50,
      temporaryStamina: 0,
      immunities: parseModifierCell('Immunity', 'Corruption 4, poison 4').entries,
      weaknesses: parseModifierCell('Weakness', 'Fire 5').entries,
    },
    read.granted,
  );
};
const hit = (facts: DamageTargetFacts, amount: number, damageType?: string) =>
  applyDamage(facts, {
    targetId: facts.targetId,
    amount,
    ...(damageType ? { damageType } : {}),
    causeLabel: 'test',
  });

test('V179: granted defenses join the printed cells, and only the highest of each applies', () => {
  // Printed fire weakness 5 and a granted damage weakness 5: 10 fire takes 15, not 20.
  expect(hit(mummy([granted(weakness('all-damage', 5))]), 10, 'fire')).toMatchObject({
    weaknessApplied: 5,
    afterImmunity: 15,
  });
  // The untyped weakness meets untyped damage (Q-IW-1 point 1): 6 + 5.
  expect(hit(mummy([granted(weakness('all-damage', 5))]), 6)).toMatchObject({
    weaknessApplied: 5,
    afterImmunity: 11,
  });
  // Weakness first, then immunity: 7 poison + 5 − 4.
  expect(hit(mummy([granted(weakness('all-damage', 5))]), 7, 'poison')).toMatchObject({
    weaknessApplied: 5,
    immunityApplied: 4,
    afterImmunity: 8,
  });
  // A typed grant meets only its type: corruption weakness 3 on 7 poison adds nothing.
  expect(hit(mummy([granted(weakness('corruption', 3))]), 7, 'poison')).toMatchObject({
    weaknessApplied: 0,
    afterImmunity: 3,
  });
  // Two grants: the highest applies (7, not 3 + 7).
  expect(
    hit(mummy([granted(weakness('fire', 3)), granted(weakness('fire', 7))]), 10, 'fire'),
  ).toMatchObject({ weaknessApplied: 7, afterImmunity: 17 });
  // The rule's example, with the fire immunity granted: damage immunity 5 and fire immunity 10
  // against 12 fire reduce it by 10.
  const facts = withGrantedDefenses<DamageTargetFacts>(
    {
      targetId: 'x',
      kind: 'foe',
      stamina: 30,
      maxStamina: 30,
      temporaryStamina: 0,
      immunities: [{ type: 'all-damage', value: 5 }],
    },
    [
      {
        instanceId: 'i',
        abilityName: 'A',
        actorLabel: 'B',
        sourcePath: 'p',
        defense: 'immunity',
        entry: { type: 'fire', value: 10 },
      },
    ],
  );
  expect(hit(facts, 12, 'fire')).toMatchObject({ immunityApplied: 10, afterImmunity: 2 });
});

test('V179: ended and object-held grants are ignored; a manual stacking group keeps damage manual', () => {
  const read = (instances: EffectInstance[]) => grantedDefenses(instances);
  expect(
    read([
      granted(weakness('all-damage', 5), { status: 'ended' }),
      granted(weakness('all-damage', 5), { status: 'consumed' }),
      granted(weakness('all-damage', 5), {
        subject: { kind: 'object', id: 'statue', name: 'Statue' },
      }),
    ]),
  ).toEqual({ granted: [] });
  expect(read([granted(weakness('all-damage', 5), { manualStacking: true })])).toMatchObject({
    manual: expect.stringMatching(/manual stacking group/),
  });
});

test('V179: a potency decrease re-checks a stored weakness as it does a condition', () => {
  // Expunging Exhalation tier 2 against Might 1: potency 2 applies; decreased to 1, it no longer
  // does (rule/character/potency.md).
  const reduced = reducePotency(
    [
      {
        id: 'w',
        store: 'effect',
        effect: 'node',
        condition: 'corruption weakness 3',
        status: 'applied',
        threshold: 2,
        targetScore: 1,
      },
    ],
    {},
    'any',
  );
  expect(reduced.outcome).toMatchObject({ kind: 'revised', ended: [{ id: 'w', store: 'effect' }] });
});

/**
 * Dealers whose damage ignores immunity. No compiled path applies it yet, so each stays manual:
 * - monster/demon/4th-echelon/statblock/optacus.md, Optical Flare: "17+: 10 fire damage; this
 *   damage ignores immunity";
 * - monster/kobold/statblock/kobold-adeptus.md, Arcane Telum: "This ability ignores banes, double
 *   banes, and damage immunity.";
 * - monster/devil/statblock/devil-jurist.md, Hellfire: "Fire damage dealt by the jurist ignores
 *   damage immunity." Foe free strikes are untyped in the app (convex/lib/abilityOperations.ts
 *   passes no damage type), so only a compiled ability dealing fire damage could meet it.
 * If one of these compiles, this fails, and the slice that compiles it must apply the rule.
 */
test('V179: abilities that ignore immunity, and the Jurist’s fire damage, stay manual', () => {
  const foeAbilities = (parent: string) =>
    corpus.filter(e => e.corpus === 'foe-ability' && e.parent?.endsWith(parent));
  for (const [parent, name] of [
    ['/optacus', 'Optical Flare'],
    ['/kobold-adeptus', 'Arcane Telum'],
  ] as const) {
    const envelope = foeAbilities(parent).find(e => e.name === name)!;
    expect(compileAbility(compilerEnvelope(envelope, inputs)).execution, name).toBe('manual');
  }
  const jurist = foeAbilities('/devil-jurist');
  expect(jurist.length).toBeGreaterThan(0);
  for (const envelope of jurist) {
    const definition = compileAbility(compilerEnvelope(envelope, inputs));
    const fire = definition.tiers.some(nodes =>
      nodes.some(node => node.kind === 'damage' && node.damageType === 'fire'),
    );
    expect(definition.execution === 'supported' && fire, envelope.name).toBe(false);
  }
});
