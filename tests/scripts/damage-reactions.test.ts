// SPDX-License-Identifier: GPL-3.0-only
/**
 * V174 damage-changing responses, pure parts. Expected values are read from the pinned sources named
 * on each case (Compendium en/unified/md), never from a run of the code under test:
 * - rule/general/always-round-down.md: "if a tactician takes 7 damage and uses the Parry ability in
 *   response—a triggered action that halves the damage—then the damage is reduced to 3."
 * - rule/damage/damage-immunity.md: "if your hero has fire immunity 5 and takes 8 fire damage, they
 *   take 3 damage. But if an ally first halved the damage with a triggered action, your hero would
 *   take 4 damage before immunity is applied, with immunity then reducing the damage to 0."
 * - rule/damage/damage-weakness.md: "if a creature has fire weakness 5 and is dealt 10 fire damage,
 *   they take 15 fire damage instead"; "apply the weakness first, then the immunity". Halving before
 *   weakness is Q-REACT-1's labelled interpretation: half of 10 is 5, plus weakness 5 is 10.
 * - rule/health/temporary-stamina.md: "if you have 10 temporary Stamina and take 16 damage, you lose
 *   the temporary Stamina and then lose another 6 Stamina." Half of 16 is 8: 2 temporary Stamina
 *   remain and Stamina is untouched.
 * - rule/health/winded.md: winded at or below half the Stamina maximum (20 → 10);
 *   rule/health/dying.md: "When your Stamina is 0 or lower, you are dying."
 * - rule/character/potency.md: an effect applies "only if the effect's potency value is higher than
 *   the target's indicated characteristic score".
 * - The six compiled responses and their Spend sections: null/level-1/inertial-shield.md,
 *   elementalist/level-1/skin-like-castle-walls.md, tactician/level-1/parry.md,
 *   shadow/level-1/defensive-roll.md, shadow/level-1/in-all-this-confusion.md,
 *   fury/level-1/unearthly-reflexes.md (all under feature/ability).
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import { resolveEffectOnly, type EffectOnlyInput } from '../../shared/resolve/compiledOutcome.ts';
import {
  damageTaken,
  eventsNoLongerTrue,
  halveApplication,
  potencyRevision,
  reducePotency,
  responseSpend,
  revisionDelta,
  unspentGain,
} from '../../shared/resolve/damageRevision.ts';
import { applyDamage } from '../../shared/resolve/index.ts';
import type { DamageTargetFacts } from '../../shared/contracts/rollResolution.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const envelope = (name: string) =>
  structuredClone(
    compilerEnvelope(
      corpus.find(e => e.name === name && e.corpus === 'hero-standalone')!,
      inputs,
    ),
  );
const compiled = (name: string) => compileAbility(envelope(name));

const hero = (facts: Partial<DamageTargetFacts> = {}): DamageTargetFacts => ({
  targetId: 'hero',
  kind: 'hero',
  stamina: 20,
  maxStamina: 20,
  temporaryStamina: 0,
  ...facts,
});
const hit = (facts: Partial<DamageTargetFacts>, amount: number, damageType?: string) =>
  applyDamage(hero(facts), {
    targetId: 'hero',
    amount,
    ...(damageType ? { damageType } : {}),
    causeLabel: 'hit',
  });

test('the six damage-changing responses compile with their revision and Spend sections', () => {
  const expected: Record<string, object[]> = {
    'Inertial Shield': [
      { kind: 'damage-revision', subject: 'actor', share: 'half', instructions: [] },
      {
        kind: 'response-spend',
        resource: 'discipline',
        amount: 1,
        variable: false,
        effect: { kind: 'potency', scope: 'one' },
      },
    ],
    'Skin Like Castle Walls': [
      { kind: 'damage-revision', subject: 'target', instructions: [] },
      { kind: 'response-spend', resource: 'essence', effect: { kind: 'potency', scope: 'any' } },
    ],
    Parry: [
      {
        kind: 'damage-revision',
        subject: 'target',
        instructions: ['shift'],
        confirm: 'self-or-adjacent',
        potency: 'any',
      },
      {
        kind: 'response-spend',
        resource: 'focus',
        effect: { kind: 'instruction', shape: 'shift' },
      },
    ],
    'Defensive Roll': [
      { kind: 'damage-revision', subject: 'actor', instructions: ['shift', 'ability-use'] },
      { kind: 'response-spend', resource: 'insight', effect: { kind: 'potency', scope: 'any' } },
    ],
    'In All This Confusion': [
      { kind: 'damage-revision', subject: 'actor', instructions: ['teleport'] },
      {
        kind: 'response-spend',
        resource: 'insight',
        amount: 1,
        variable: true,
        effect: { kind: 'instruction', shape: 'teleport' },
      },
    ],
    'Unearthly Reflexes': [
      { kind: 'damage-revision', subject: 'actor', instructions: ['shift'] },
      { kind: 'response-spend', resource: 'ferocity', effect: { kind: 'potency', scope: 'any' } },
    ],
  };
  for (const [name, sections] of Object.entries(expected)) {
    const ability = compiled(name);
    expect(ability.execution, name).toBe('supported');
    expect(ability.trigger?.event, name).toBe('damage-taken');
    expect(ability.sections, name).toMatchObject(sections);
  }
  // Repel also answers forced movement, which has no map; Word of Judgment answers "would take
  // damage", before the hit is written.
  expect(compiled('Repel').diagnostics.map(d => d.code)).toContain('trigger-unobserved');
  expect(compiled('Word of Judgment').diagnostics.map(d => d.code)).toContain('trigger-unobserved');
});

test('a changed Spend section or a revision without a damage-taken trigger stays manual', () => {
  expect(responseSpend('Spend 1 Discipline', 'The potency of one effect is reduced by 1.')).toBe(
    undefined,
  );
  // "Spend 1+" only for the variable teleport, and the resource must be the one named.
  expect(
    responseSpend('Spend 1 Insight', 'You teleport 1 additional square for each insight spent.'),
  ).toBe(undefined);
  expect(
    responseSpend('Spend 1+ Focus', 'You teleport 1 additional square for each insight spent.'),
  ).toBe(undefined);
  const tampered = envelope('Inertial Shield');
  tampered.blocks = tampered.blocks.map(block =>
    block.kind === 'section' && block.label === 'Trigger'
      ? { ...block, text: 'The target deals damage to an ally.' }
      : block,
  );
  expect(compileAbility(tampered).execution).toBe('manual');
  // A tampered saved spend is refused on resolution.
  const definition = compiled('Inertial Shield');
  const bad = structuredClone(definition);
  const spend = bad.sections.find(node => node.kind === 'response-spend')!;
  Object.assign(spend, { amount: 0 });
  expect(resolveEffectOnly(bad, input()).kind).toBe('manual');
});

test('halving: the Parry example, immunity last, weakness after the halving, temporary Stamina first', () => {
  // always-round-down.md: 7 damage halved is 3.
  const parry = halveApplication(hit({}, 7), 'hero');
  expect(damageTaken(parry)).toBe(3);
  expect(revisionDelta(hit({}, 7), parry)).toEqual({ stamina: 4, temporaryStamina: 0 });
  // damage-immunity.md: 8 fire against fire immunity 5 takes 3; halved first it takes 0.
  const immune = hit({ immunities: [{ type: 'fire', value: 5 }] }, 8, 'fire');
  expect(damageTaken(immune)).toBe(3);
  expect(damageTaken(halveApplication(immune, 'hero'))).toBe(0);
  // damage-weakness.md: 10 fire against fire weakness 5 takes 15; Q-REACT-1: halved, 5 + 5 = 10.
  const weak = hit({ weaknesses: [{ type: 'fire', value: 5 }] }, 10, 'fire');
  expect(damageTaken(weak)).toBe(15);
  expect(damageTaken(halveApplication(weak, 'hero'))).toBe(10);
  // temporary-stamina.md: 10 temporary Stamina and 16 damage loses it and 6 Stamina; half of 16
  // is 8, leaving 2 temporary Stamina and Stamina untouched.
  const temporary = hit({ temporaryStamina: 10 }, 16);
  expect([temporary.temporaryStaminaAfter, temporary.staminaAfter]).toEqual([0, 14]);
  const halved = halveApplication(temporary, 'hero');
  expect([halved.temporaryStaminaAfter, halved.staminaAfter]).toEqual([2, 20]);
  expect(revisionDelta(temporary, halved)).toEqual({ stamina: 6, temporaryStamina: 2 });
});

test('winded and dying follow the revised Stamina; a second response recomputes from the first', () => {
  // winded.md: 20 maximum, winded at 10 or lower. 15 − 8 = 7 is winded; 15 − 4 = 11 is not.
  const winded = hit({ stamina: 15 }, 8);
  const revised = halveApplication(winded, 'hero');
  expect([winded.windedAfter, revised.windedAfter]).toEqual([true, false]);
  expect(eventsNoLongerTrue(winded, revised, 'hero')).toEqual(['made-winded']);
  // dying.md: 3 − 7 = −4 is dying; 3 − 3 = 0 is still dying ("0 or lower").
  const dying = hit({ stamina: 3 }, 7);
  const still = halveApplication(dying, 'hero');
  expect([dying.dying, still.dying, still.staminaAfter]).toEqual([true, true, 0]);
  expect(eventsNoLongerTrue(dying, still, 'hero')).toEqual([]);
  // Design 5b: a second response halves the current revision (7 → 3 → 1), never the original.
  expect(damageTaken(halveApplication(halveApplication(hit({}, 7), 'hero'), 'hero'))).toBe(1);
  // 1 halved is 0 (Q-RES-4: no damage taken).
  expect(eventsNoLongerTrue(hit({}, 1), halveApplication(hit({}, 1), 'hero'), 'hero')).toEqual([
    'damage-taken',
  ]);
});

test('a reversed gain: the spent part stands, most recent gains counted as spent first', () => {
  // Pool 2, gained 1 (→ 3), nothing spent since: all of it is reversed.
  expect(unspentGain({ current: 3, afterGain: 3, gain: 1, floor: 0 })).toEqual({
    reversed: 1,
    spent: 0,
  });
  // Spent 1 since (3 → 2): the gain was spent and stands.
  expect(unspentGain({ current: 2, afterGain: 3, gain: 1, floor: 0 })).toEqual({
    reversed: 0,
    spent: 1,
  });
  // A 3-point gain (2 → 5), then 1 spent (→ 4): 2 are reversed, 1 stands.
  expect(unspentGain({ current: 4, afterGain: 5, gain: 3, floor: 0 })).toEqual({
    reversed: 2,
    spent: 1,
  });
});

test('potency reduced by 1 re-checks the hit’s potency effects', () => {
  // potency.md: applied only if potency > score. A < 2 against Agility 1 applies; at 1 it doesn't.
  const prone = { id: 'p', effect: 'n1', condition: 'prone', status: 'applied', threshold: 2 };
  expect(potencyRevision([{ ...prone, targetScore: 1 }], 'any')).toMatchObject({
    kind: 'revised',
    ended: [{ id: 'p' }],
  });
  // Agility 0: 0 < 1 still applies.
  expect(potencyRevision([{ ...prone, targetScore: 0 }], 'any')).toMatchObject({
    kind: 'revised',
    ended: [],
    unchanged: [{ id: 'p' }],
  });
  // "one effect": two effects would change, so the user picks one.
  const slowed = { ...prone, id: 's', effect: 'n2', condition: 'slowed', targetScore: 1 };
  const both = [{ ...prone, targetScore: 1 }, slowed];
  expect(potencyRevision(both, 'one')).toEqual({
    kind: 'choose',
    options: ['prone', 'slowed'],
  });
  expect(potencyRevision(both, 'one', 'slowed')).toMatchObject({ ended: [{ id: 's' }] });
  expect(potencyRevision([], 'any')).toEqual({ kind: 'none' });
  // "one effect" with several effects and none that would change (Agility 0 against potency 2 → 1
  // still applies both): the reduction is lasting, so the user names the effect.
  const low = [
    { ...prone, targetScore: 0 },
    { ...slowed, targetScore: 0 },
  ];
  expect(potencyRevision(low, 'one')).toEqual({ kind: 'choose', options: ['prone', 'slowed'] });
  // A single effect needs no choice.
  expect(potencyRevision([low[0]!], 'one')).toMatchObject({
    kind: 'revised',
    unchanged: [{ id: 'p' }],
  });
});

test('a one-effect reduction keeps its chosen effect when there are several (QC1 train 16 R1)', () => {
  // potency.md: applied only if potency > score. Both at potency 2 against 0.
  const prone = {
    id: 'p',
    effect: 'n1',
    condition: 'prone',
    status: 'applied',
    threshold: 2,
    targetScore: 0,
  };
  const slowed = { ...prone, id: 's', effect: 'n2', condition: 'slowed' };
  // Inertial Shield's spend names slowed: 2 → 1, still applied (0 < 1); only slowed carries it.
  const first = reducePotency([prone, slowed], {}, 'one', 'slowed');
  expect(first.outcome).toMatchObject({ kind: 'revised', ended: [], unchanged: [{ id: 's' }] });
  expect(first.reductions).toEqual({ s: 1 });
  // Parry then reduces any effect from the current accepted potency: prone 2 → 1 (0 < 1, still
  // prone); slowed 1 → 0 (0 is not below 0: no longer slowed).
  const second = reducePotency([prone, slowed], first.reductions, 'any');
  expect(second.outcome).toMatchObject({
    kind: 'revised',
    ended: [{ id: 's' }],
    unchanged: [{ id: 'p' }],
  });
  expect(second.reductions).toEqual({ p: 1, s: 2 });
});

function input(extra: Partial<EffectOnlyInput> = {}): EffectOnlyInput {
  const self = { id: 'null', kind: 'hero' as const, temporaryStamina: 0, surges: 0 };
  return {
    actor: self,
    targets: [self],
    inCombat: true,
    resourcePool: { resource: 'discipline', current: 1, legalFloor: 0 } as never,
    ...extra,
  };
}

test('resolution: the revised hit from the card, the spend paid, a use by hand left manual', () => {
  const definition = compiled('Inertial Shield');
  const original = hit({}, 7);
  const accepted = resolveEffectOnly(
    definition,
    input({
      trigger: {
        damage: 7,
        revision: { hitEventId: 'e', targetId: 'null', kind: 'hero', current: original },
      },
      spend: 1,
    }),
  );
  expect(accepted).toMatchObject({
    kind: 'resolved',
    cost: { resource: 'discipline', amount: 1, before: 1, after: 0 },
    effects: [
      { kind: 'damage-revision', status: 'calculated', application: { staminaAfter: 17 } },
      { kind: 'response-spend', status: 'spent', amount: 1 },
    ],
  });
  // Spend 1 Discipline, not 2.
  expect(resolveEffectOnly(definition, input({ spend: 2 })).kind).toBe('manual');
  // Nothing to spend: the card stays open.
  expect(
    resolveEffectOnly(
      definition,
      input({
        spend: 1,
        resourcePool: { resource: 'discipline', current: 0, legalFloor: 0 } as never,
      }),
    ).kind,
  ).toBe('blocked');
  // By hand: no hit to revise.
  expect(resolveEffectOnly(definition, input())).toMatchObject({
    effects: [
      { kind: 'damage-revision', status: 'manual' },
      { kind: 'response-spend', status: 'not-spent' },
    ],
  });
  // "Spend 1+ Insight": 3 is allowed.
  const confusion = compiled('In All This Confusion');
  expect(
    resolveEffectOnly(
      confusion,
      input({
        spend: 3,
        resourcePool: { resource: 'insight', current: 3, legalFloor: 0 } as never,
      }),
    ),
  ).toMatchObject({ kind: 'resolved', cost: { amount: 3 } });
});
