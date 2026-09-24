// SPDX-License-Identifier: GPL-3.0-only
/**
 * V159 modifiers, pure parts. Expected values are read from the pinned sources named on each case
 * (Compendium en/unified/md; en/books/heroes/clean/Draw Steel Heroes.md for "Stacking Unique
 * Effects"), never from a run of the code under test:
 * - kit/raider.md, feature/ability/raider/raiders-awe.md: "The target takes a bane on their next
 *   power roll made before the end of their next turn."
 * - feature/ability/tactician/level-2/squad-on-me.md (5 Focus, Self and each ally in the area):
 *   "Until the start of your next turn, each target has a bonus to stability equal to your Might
 *   score. Additionally, each target gains 2 surges."
 * - rule/dice/power-roll.md, "Rolling With Edges and Banes": an edge and a bane cancel; a double
 *   edge and one bane leave one edge; a double edge and a double bane cancel.
 * - rule/dice/bonuses-and-penalties.md: bonuses add together, before edges and banes.
 * - rule/character/stability.md: stability can't be less than 0, even when reduced by a penalty.
 * - rule/general/saving-throw.md: a d10, 6 or higher ends the effect.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility, type ModifierNode } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  resolveEffectOnly,
  type CompiledAbilityInput,
  type EffectOnlyInput,
} from '../../shared/resolve/compiledOutcome.ts';
import { resolveEdgeBane, saveSucceeds } from '../../shared/resolve/index.ts';
import {
  consumedBy,
  derivedValue,
  rollContributions,
  sectionModifier,
  statModifiers,
  withContributions,
} from '../../shared/resolve/modifiers.ts';
import type { EffectInstance, ModifierPayload } from '../../shared/contracts/liveState.ts';

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

const RAIDER =
  'The target takes a bane on their next power roll made before the end of their next turn.';

let sequence = 0;
function instance(
  subjectId: string,
  abilityId: string,
  modifier: ModifierPayload,
  extra: Partial<EffectInstance> = {},
): EffectInstance {
  const id = `instance-${++sequence}`;
  return {
    id,
    kind: 'modifier',
    sourceUseEventId: `use-${sequence}`,
    sourceActorId: 'owner',
    abilityId,
    abilityName: abilityId,
    actorLabel: 'Owner',
    sourcePath: `${abilityId}.md`,
    clause: 'printed',
    owner: { kind: 'character', id: 'owner', name: 'Owner' },
    subject: { kind: 'foe', id: subjectId, name: subjectId },
    payload: { kind: 'modifier', text: 'printed', modifier },
    printedDuration: { kind: 'encounter' },
    duration: { kind: 'encounter' },
    endsWhen: [],
    status: 'active',
    registrationIds: [],
    appliedSequence: sequence,
    ...extra,
  };
}
const bane: ModifierPayload = {
  kind: 'roll',
  target: 'rolls-by',
  scope: 'power-roll',
  banes: 1,
};

test("pattern admission: Raider's Awe and Squad! On Me! compile; changed or added sentences don't", () => {
  expect(sectionModifier(RAIDER)).toEqual({
    effect: 'modifier',
    subject: 'target',
    modifier: { kind: 'roll', target: 'rolls-by', scope: 'power-roll', banes: 1 },
    duration: { kind: 'end-of-next-turn', anchor: 'subject' },
    endsWhen: [],
    consumeOn: { event: 'power-roll' },
    text: RAIDER,
  });
  for (const text of [
    RAIDER.replace('a bane', 'a double bane'),
    RAIDER.replace('their next turn', 'your next turn'),
    `${RAIDER} The target is slowed.`,
    // conduit/level-1/wither.md prints no expiry and a potency; not this sentence.
    'The target takes a bane on their next power roll.',
    // talent/level-1/remote-assistance.md: an ally's roll against the target; not admitted.
    'The next ability roll an ally makes against the target before the start of your next turn gains an edge.',
  ])
    expect(sectionModifier(text), text).toBeUndefined();

  const raider = compiled("Raider's Awe", 'kit-signature');
  expect(raider.execution).toBe('supported');
  expect(raider.sections.map(node => node.kind)).toEqual(['modifier']);

  const squad = compiled('Squad! On Me!');
  expect(squad.execution).toBe('supported');
  expect(squad.effectOnly).toBe(true);
  expect(squad.activation).toEqual({
    actionType: 'maneuver',
    fixedCost: { resource: 'focus', amount: 5 },
    targetShape: { kind: 'area', self: true },
  });
  expect(squad.sections.map(node => node.kind)).toEqual(['modifier', 'gain']);
  expect((squad.sections[0] as ModifierNode).spec).toMatchObject({
    subject: 'target',
    modifier: { kind: 'stat', stat: 'stability', amount: { characteristic: 'M' } },
    duration: { kind: 'start-of-next-turn', anchor: 'owner' },
  });
  expect(squad.sections[1]).toMatchObject({ kind: 'gain', subject: 'target', surges: 2 });

  // Refusals: a choice of score (time-raider/minor-acceleration.md), a tier-3 clarity watcher
  // (talent/level-1/perfect-clarity.md), a damage-triggered strike (talent/level-1/precognition.md).
  for (const name of ['Minor Acceleration', 'Perfect Clarity', 'Precognition'])
    expect(compiled(name).execution, name).toBe('manual');
  // censor/level-1/behold-a-shield-of-faith.md: allies adjacent to you are table knowledge; the
  // section stays V109 table work.
  expect(compiled('Behold a Shield of Faith!').sections.map(node => node.kind)).toEqual(['rider']);
});

const rolled: CompiledAbilityInput = {
  actor: { actorId: 'hero', characteristics: { M: 2, A: 2, R: 0, I: 0, P: 0 } },
  targets: [{ targetId: 'goblin', edges: 0, banes: 0 }],
  dice: { d10a: 5, d10b: 5 },
  inCombat: true,
  targetFacts: [],
  conditionFacts: { targets: [{ targetId: 'goblin', kind: 'foe' }] },
};

test("Raider's Awe gives its single target a modifier outcome; objects and squad minions stay manual", () => {
  const definition = compiled("Raider's Awe", 'kit-signature');
  const outcome = resolveCompiledAbility(definition, rolled);
  if (outcome.kind !== 'resolved') throw new Error(outcome.kind);
  const modifier = outcome.effects.find(effect => effect.kind === 'modifier')!;
  expect(modifier).toMatchObject({
    kind: 'modifier',
    status: 'applied',
    subject: 'target',
    targetId: 'goblin',
    payload: { kind: 'roll', target: 'rolls-by', scope: 'power-roll', banes: 1 },
  });
  for (const kind of ['object', 'squad'] as const) {
    const other = resolveCompiledAbility(definition, {
      ...rolled,
      conditionFacts: { targets: [{ targetId: 'goblin', kind }] },
    });
    if (other.kind !== 'resolved') throw new Error(other.kind);
    expect(other.effects.find(effect => effect.kind === 'modifier')).toMatchObject({
      status: 'manual',
    });
  }
  // Tamper refusal: a stored spec that no longer matches its printed clause.
  const tampered = structuredClone(definition);
  (tampered.sections[0] as ModifierNode).spec.modifier = { ...bane, banes: 2 };
  expect(resolveCompiledAbility(tampered, rolled).kind).toBe('manual');
});

const squadInput = (might: number): EffectOnlyInput => ({
  actor: { id: 'tactician', kind: 'hero', temporaryStamina: 0, surges: 0 },
  actorCharacteristics: { M: might, A: 1, R: 1, I: 0, P: 0 },
  targets: [
    { id: 'tactician', kind: 'hero', temporaryStamina: 0, surges: 0 },
    { id: 'ally', kind: 'hero', temporaryStamina: 0, surges: 1 },
  ],
  inCombat: true,
  resourcePool: { resource: 'focus', current: 5, legalFloor: 0 },
});

test('Squad! On Me! binds the stability bonus to the user’s Might for each target and adds 2 surges', () => {
  const definition = compiled('Squad! On Me!');
  const outcome = resolveEffectOnly(definition, squadInput(2));
  if (outcome.kind !== 'resolved') throw new Error(outcome.kind);
  expect(outcome.cost).toMatchObject({ resource: 'focus', amount: 5, before: 5, after: 0 });
  expect(
    outcome.effects.map(effect => [
      effect.kind,
      effect.targetId,
      effect.kind === 'modifier' ? effect.payload : effect.kind === 'gain' ? effect.surges : null,
    ]),
  ).toEqual([
    ['modifier', 'tactician', { kind: 'stat', stat: 'stability', amount: 2 }],
    ['modifier', 'ally', { kind: 'stat', stat: 'stability', amount: 2 }],
    ['gain', 'tactician', 2],
    ['gain', 'ally', 2],
  ]);
  expect(outcome.writes).toEqual([
    { id: 'tactician', temporaryStamina: 0, surges: 2 },
    { id: 'ally', temporaryStamina: 0, surges: 3 },
  ]);
  // "Self and each ally in the area" always names the user.
  expect(
    resolveEffectOnly(definition, {
      ...squadInput(2),
      targets: [{ id: 'ally', kind: 'hero', temporaryStamina: 0, surges: 1 }],
    }).kind,
  ).toBe('manual');
  // A negative score: the source doesn't establish a bonus equal to it, so the table decides.
  const negative = resolveEffectOnly(definition, squadInput(-1));
  if (negative.kind !== 'resolved') throw new Error(negative.kind);
  expect(negative.effects.filter(effect => effect.kind === 'modifier')).toEqual(
    expect.arrayContaining([expect.objectContaining({ status: 'manual' })]),
  );
  expect(negative.effects.some(e => e.kind === 'modifier' && e.status === 'applied')).toBe(false);
});

test('aggregation follows the printed stacking', () => {
  // Same ability, two owners: one bane, not two ("the effects of the same ability used multiple
  // times don't stack").
  const next = { consumeOn: { event: 'power-roll' as const } };
  const first = instance('goblin', 'raiders-awe', bane, next);
  const second = instance('goblin', 'raiders-awe', bane, { ...next, actorLabel: 'Other' });
  const [one] = rollContributions({
    actor: { id: 'goblin', instances: [first, second] },
    targets: [{ id: 'hero', instances: [] }],
    roll: { strike: true },
  });
  expect(one!.contributions).toHaveLength(1);
  expect(withContributions({ targetId: 'hero', edges: 0, banes: 0 }, one!.contributions)).toEqual({
    targetId: 'hero',
    edges: 0,
    banes: 1,
  });
  // Both uses' "next power roll" is this roll: both are used up.
  expect(consumedBy([one!]).map(c => c.instanceId)).toEqual([first.id, second.id]);
  // Different abilities combine: two banes from two abilities.
  const other = instance('goblin', 'other-ability', bane);
  const [two] = rollContributions({
    actor: { id: 'goblin', instances: [first, other] },
    targets: [{ id: 'hero', instances: [] }],
    roll: { strike: true },
  });
  expect(
    withContributions({ targetId: 'hero', edges: 0, banes: 0 }, two!.contributions).banes,
  ).toBe(2);
  // Stat: an old +3 with a newer +1 from the same ability gives +3; another ability adds.
  const old = instance('hero', 'squad', { kind: 'stat', stat: 'stability', amount: 3 });
  const newer = instance('hero', 'squad', { kind: 'stat', stat: 'stability', amount: 1 });
  expect(statModifiers([old, newer], 'stability').total).toBe(3);
  const iron = instance('hero', 'iron', { kind: 'stat', stat: 'stability', amount: 2 });
  expect(statModifiers([old, newer, iron], 'stability').total).toBe(5);
  // rule/character/stability.md: never below 0, even with a penalty.
  const penalty = instance('hero', 'phase', { kind: 'stat', stat: 'stability', amount: -2 });
  expect(derivedValue(1, [penalty], 'stability').value).toBe(0);
  expect(derivedValue(1, [old, penalty], 'stability').value).toBe(2);
  // Ended and consumed instances no longer count.
  expect(statModifiers([{ ...old, status: 'ended' }], 'stability').total).toBe(0);
  // V158 R1b: an unresolved same-ability group (manual stacking) is the table's; it never applies.
  expect(statModifiers([{ ...old, manualStacking: true }], 'stability').total).toBe(0);
  const [manual] = rollContributions({
    actor: { id: 'goblin', instances: [{ ...first, manualStacking: true }] },
    targets: [{ id: 'hero', instances: [] }],
    roll: { strike: true },
  });
  expect(manual!.contributions).toHaveLength(0);
});

test('scope matching: by versus against, strikes versus every power roll', () => {
  const by = instance('hero', 'a', bane);
  const against = instance('hero', 'b', {
    kind: 'roll',
    target: 'rolls-against',
    scope: 'power-roll',
    banes: 1,
  });
  const strikeEdge = instance('hero', 'c', {
    kind: 'roll',
    target: 'rolls-by',
    scope: 'strike',
    edges: 1,
  });
  const bonus = instance('goblin', 'd', {
    kind: 'roll',
    target: 'rolls-against',
    scope: 'ability-roll',
    bonus: 2,
  });
  const contributions = (strike: boolean) =>
    rollContributions({
      actor: { id: 'hero', instances: [by, against, strikeEdge] },
      targets: [{ id: 'goblin', instances: [bonus] }],
      roll: { strike },
    })[0]!.contributions.map(c => c.abilityId);
  // The hero's own roll: its rolls-by modifiers; the goblin's rolls-against ones.
  expect(contributions(true)).toEqual(['a', 'c', 'd']);
  expect(contributions(false)).toEqual(['a', 'd']);
  const [goblin] = rollContributions({
    actor: { id: 'hero', instances: [by, against, strikeEdge] },
    targets: [{ id: 'goblin', instances: [bonus] }],
    roll: { strike: true },
  });
  // Bonuses add before edges and banes; one edge and one bane cancel.
  const inputs = withContributions(
    { targetId: 'goblin', edges: 0, banes: 0 },
    goblin!.contributions,
  );
  expect(inputs).toEqual({
    targetId: 'goblin',
    edges: 1,
    banes: 1,
    bonuses: [{ label: "Owner's d", amount: 2 }],
  });
  expect(resolveEdgeBane(inputs.edges, inputs.banes).net).toBe(0);
  // An object's effect is held by its owner and never modifies the owner's own rolls.
  const onObject = { ...by, subject: { kind: 'object' as const, id: 'door', name: 'Door' } };
  expect(
    rollContributions({
      actor: { id: 'hero', instances: [onObject] },
      targets: [{ id: 'goblin', instances: [] }],
      roll: { strike: true },
    })[0]!.contributions,
  ).toEqual([]);
  expect(
    statModifiers(
      [
        {
          ...onObject,
          payload: {
            kind: 'modifier',
            text: '',
            modifier: { kind: 'stat', stat: 'speed', amount: 2 },
          },
        },
      ],
      'speed',
    ).total,
  ).toBe(0);
});

test('consumption: the next power roll uses a consumable up even when banes cancel it', () => {
  // docs/lasting-effects-design.md 5a, Perfect Clarity's shape: a double edge on the next power
  // roll, made with two circumstance banes, gives no net edge and is still used up.
  const doubleEdge = instance(
    'ally',
    'clarity',
    { kind: 'roll', target: 'rolls-by', scope: 'power-roll', edges: 2 },
    { consumeOn: { event: 'power-roll' } },
  );
  const lasting = instance('ally', 'lasting', bane);
  const [roll] = rollContributions({
    actor: { id: 'ally', instances: [doubleEdge, lasting] },
    targets: [{ id: 'goblin', instances: [] }],
    roll: { strike: false },
  });
  const inputs = withContributions({ targetId: 'goblin', edges: 0, banes: 2 }, roll!.contributions);
  // Two edges against three banes: counts above two add nothing, so a double edge and a double
  // bane cancel.
  expect(resolveEdgeBane(inputs.edges, inputs.banes).net).toBe(0);
  expect(consumedBy([roll!])).toEqual([{ instanceId: doubleEdge.id, subjectId: 'ally' }]);
  // Two banes against the double edge alone: net 0, still consumed.
  const [alone] = rollContributions({
    actor: { id: 'ally', instances: [doubleEdge] },
    targets: [{ id: 'goblin', instances: [] }],
    roll: { strike: false },
  });
  const cancelled = withContributions(
    { targetId: 'goblin', edges: 0, banes: 2 },
    alone!.contributions,
  );
  expect(resolveEdgeBane(cancelled.edges, cancelled.banes).net).toBe(0);
  expect(consumedBy([alone!]).map(c => c.instanceId)).toEqual([doubleEdge.id]);
  // Several targets share one roll: consumed once.
  const shared = rollContributions({
    actor: { id: 'ally', instances: [doubleEdge] },
    targets: [
      { id: 'goblin', instances: [] },
      { id: 'kobold', instances: [] },
    ],
    roll: { strike: false },
  });
  expect(consumedBy(shared)).toHaveLength(1);
});

test('exclusion: an excluded contribution is recorded, not applied and not consumed', () => {
  const consumable = instance('goblin', 'raiders-awe', bane, {
    consumeOn: { event: 'power-roll' },
  });
  const lasting = instance('goblin', 'other', {
    kind: 'roll',
    target: 'rolls-by',
    scope: 'power-roll',
    edges: 1,
  });
  const [roll] = rollContributions({
    actor: { id: 'goblin', instances: [consumable, lasting] },
    targets: [{ id: 'hero', instances: [] }],
    roll: { strike: true },
    exclude: [consumable.id],
  });
  expect(roll!.contributions.map(c => [c.abilityId, c.excluded ?? false])).toEqual([
    ['other', false],
    ['raiders-awe', true],
  ]);
  expect(withContributions({ targetId: 'hero', edges: 0, banes: 0 }, roll!.contributions)).toEqual({
    targetId: 'hero',
    edges: 1,
    banes: 0,
  });
  expect(consumedBy([roll!])).toEqual([]);
});

test('saving throws: a bonus adds to the d10 before the 6-or-higher threshold', () => {
  expect(saveSucceeds(5, 0, 6)).toBe(false);
  expect(saveSucceeds(5, 1, 6)).toBe(true);
  expect(saveSucceeds(6, 0, 6)).toBe(true);
  const plusOne = instance('hero', 'swarm', { kind: 'stat', stat: 'saving-throw', amount: 1 });
  expect(statModifiers([plusOne], 'saving-throw').total).toBe(1);
});

test('V159: a test is a power roll but not an ability roll (rule/dice/power-roll.md)', () => {
  const abilityEdge = instance('ally', 'ability-edge', {
    kind: 'roll',
    target: 'rolls-by',
    scope: 'ability-roll',
    edges: 1,
  });
  const powerBane = instance('ally', 'power-bane', {
    kind: 'roll',
    target: 'rolls-by',
    scope: 'power-roll',
    banes: 1,
  });
  const contributing = (test: boolean) =>
    rollContributions({
      actor: { id: 'ally', instances: [abilityEdge, powerBane] },
      targets: [{ id: 'ally', instances: [] }],
      roll: { strike: false, test },
    })[0]!.contributions.map(c => c.instanceId);
  expect(contributing(false).sort()).toEqual([abilityEdge.id, powerBane.id].sort());
  expect(contributing(true)).toEqual([powerBane.id]);
});
