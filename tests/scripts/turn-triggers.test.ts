// SPDX-License-Identifier: GPL-3.0-only
/**
 * V202 turn-boundary triggered actions, pure parts (docs/build/V202-turn-trigger-offers.md).
 * Expected values are read from the pinned Compendium (en/unified/md), never from a run of the code
 * under test:
 * - feature/ability/censor/level-1/my-life-for-yours.md: Triggered, Ranged 10, Self or one ally;
 *   Trigger "The target starts their turn or takes damage."; Effect "You spend a Recovery and the
 *   target regains Stamina equal to your recovery value."; "Spend 1 Wrath: You can end one effect on
 *   the target that is ended by a saving throw or that ends at the end of their turn, or a prone
 *   target can stand up."
 * - feature/ability/elementalist/level-1/breath-of-dawn-remembered.md: Triggered, Ranged 10, Self or
 *   one ally; the same Trigger; Effect "The target can spend a Recovery."; "Spend 1+ Essence: The
 *   target can spend an additional Recovery for each essence spent."
 * - feature/ability/shadow/level-1/hesitation-is-weakness.md: Free triggered, 1 Insight, Self; Trigger
 *   "Another hero ends their turn. That hero can't have used this ability to start their turn.";
 *   Effect "You take your turn after the triggering hero."
 * - feature/ability/censor/level-2/prescient-grace.md: Trigger "An enemy within 10 squares starts
 *   their turn."; the Effect's second sentence "The target can then take their turn immediately
 *   before the triggering enemy." (manual).
 * - feature/ability/elementalist/level-1/subtle-relocation.md: Trigger "The target starts their turn,
 *   moves, or is force moved." (movement: manual).
 * - rule/combat/triggered-action.md: "A free triggered action follows the same rules as a triggered
 *   action, but it doesn't count against your limit of one triggered action per round."
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import { resolveEffectOnly, type EffectOnlyInput } from '../../shared/resolve/compiledOutcome.ts';
import {
  triggerEligibility,
  triggerSection,
  triggerTarget,
  triggerTargetFor,
  triggerTargetForTurn,
  type TriggerCreature,
  type TriggerHolder,
  type TurnOccurrence,
} from '../../shared/resolve/triggers.ts';

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
const withTrigger = (name: string, text: string) => {
  const e = envelope(name);
  for (const block of e.blocks)
    if (block.kind === 'section' && block.label === 'Trigger') block.text = text;
  return compileAbility(e);
};

test('My Life for Yours, Breath of Dawn Remembered and Hesitation Is Weakness compile as turn-boundary responses', () => {
  const life = compiled('My Life for Yours');
  expect(life.execution).toBe('supported');
  expect(life.activation).toMatchObject({
    actionType: 'triggered action',
    targetShape: { kind: 'one', self: true },
  });
  expect(life.trigger).toEqual({
    effect: 'trigger',
    event: 'turn-start',
    whose: 'target',
    orDamageTaken: true,
    text: 'The target starts their turn or takes damage.',
  });
  expect(life.sections).toMatchObject([
    { kind: 'instruction', subject: 'target', shape: 'recovery' },
    {
      kind: 'response-spend',
      resource: 'wrath',
      amount: 1,
      variable: false,
      effect: { kind: 'instruction', shape: 'end-effect' },
    },
  ]);

  const breath = compiled('Breath of Dawn Remembered');
  expect(breath.execution).toBe('supported');
  expect(breath.trigger).toEqual(life.trigger);
  expect(breath.sections).toMatchObject([
    { kind: 'instruction', subject: 'target', shape: 'recovery' },
    {
      kind: 'response-spend',
      resource: 'essence',
      amount: 1,
      variable: true,
      effect: { kind: 'instruction', shape: 'recovery' },
    },
  ]);

  const hesitation = compiled('Hesitation Is Weakness');
  expect(hesitation.execution).toBe('supported');
  expect(hesitation.activation).toMatchObject({
    actionType: 'free triggered action',
    fixedCost: { resource: 'insight', amount: 1 },
    targetShape: { kind: 'self' },
  });
  expect(hesitation.trigger).toEqual({
    effect: 'trigger',
    event: 'turn-end',
    whose: 'other-hero',
    notStartedByThis: true,
    text: "Another hero ends their turn. That hero can't have used this ability to start their turn.",
  });
  expect(hesitation.sections).toMatchObject([
    { kind: 'instruction', subject: 'actor', shape: 'turn-order' },
  ]);
});

test('Prescient Grace and movement triggers stay manual with a precise diagnostic', () => {
  const grace = compiled('Prescient Grace');
  expect(grace.execution).toBe('manual');
  const message = grace.diagnostics.find(d => d.code === 'trigger-manual')?.message;
  expect(message).toMatch(/before the triggering enemy, whose turn the clock has already started/);
  expect(message).toMatch(/"Self or one ally", which the card can't name/);
  for (const name of ['Subtle Relocation', 'Halt!']) {
    const definition = compiled(name);
    expect(definition.execution, name).toBe('manual');
    expect(
      definition.diagnostics.find(d => d.code === 'trigger-unobserved')?.message,
      name,
    ).toMatch(/movement is a table fact/);
  }
  // A turn-boundary sentence the clock doesn't read whole (null/level-9/time-loop.md).
  expect(triggerSection('Another creature on the encounter map ends their turn.')).toEqual({
    unobserved: expect.stringMatching(/turn-boundary sentences V202 reads whole/),
  });
});

test('a sentence needs the trigger it speaks of', () => {
  // "The triggering damage" has no damage at a turn boundary, even one that also answers damage.
  expect(
    withTrigger('Feedback Loop', 'The target starts their turn or takes damage.').execution,
  ).toBe('manual');
  // "The triggering hero" needs another hero's turn end.
  expect(withTrigger('Hesitation Is Weakness', 'You take damage.').execution).toBe('manual');
  // A trigger about another creature's turn names no target but the user (rule/combat/target.md).
  expect(
    withTrigger('My Life for Yours', 'An enemy within 10 squares starts their turn.').execution,
  ).toBe('manual');
});

const censor: TriggerCreature = { id: 'censor', side: 'heroes' };
const thorn: TriggerCreature = { id: 'thorn', side: 'heroes' };
const goblin: TriggerCreature = { id: 'goblin', side: 'director' };
const holder = (name: string, owner: TriggerCreature = censor): TriggerHolder => {
  const definition = compiled(name);
  return {
    owner,
    spec: definition.trigger!,
    target: triggerTarget(definition.envelope.target)!,
  };
};
const turn = (
  boundary: TurnOccurrence['boundary'],
  creature: TriggerCreature,
  extra: Partial<TurnOccurrence> = {},
): TurnOccurrence => ({
  boundary,
  creature,
  hero: creature.side === 'heroes',
  startedByThis: false,
  ...extra,
});

test('matching: "The target starts their turn or takes damage." for self or one ally', () => {
  const life = holder('My Life for Yours');
  expect(triggerTargetForTurn(life, turn('turn-start', thorn))).toBe('thorn');
  expect(triggerTargetForTurn(life, turn('turn-start', censor))).toBe('censor');
  // Not an ally, and not a turn start.
  expect(triggerTargetForTurn(life, turn('turn-start', goblin))).toBeUndefined();
  expect(triggerTargetForTurn(life, turn('turn-end', thorn))).toBeUndefined();
  // "Or takes damage": the damage writer's damage-taken of the same target.
  expect(triggerTargetFor(life, { damaged: thorn, dealer: goblin, amount: 5 })).toBe('thorn');
  expect(triggerTargetFor(life, { damaged: censor, amount: 3 })).toBe('censor');
  expect(triggerTargetFor(life, { damaged: goblin, dealer: thorn, amount: 5 })).toBeUndefined();
  expect(triggerTargetFor(life, { damaged: thorn, dealer: goblin, amount: 0 })).toBeUndefined();
});

test('matching: Hesitation Is Weakness answers another hero ending a turn it did not start with it', () => {
  const shadow: TriggerCreature = { id: 'shadow', side: 'heroes' };
  const hesitation = holder('Hesitation Is Weakness', shadow);
  expect(triggerTargetForTurn(hesitation, turn('turn-end', thorn))).toBe('shadow');
  // Another hero, not the Shadow; a hero, not a foe; a turn end, not a start.
  expect(triggerTargetForTurn(hesitation, turn('turn-end', shadow))).toBeUndefined();
  expect(triggerTargetForTurn(hesitation, turn('turn-end', goblin))).toBeUndefined();
  expect(triggerTargetForTurn(hesitation, turn('turn-start', thorn))).toBeUndefined();
  // "That hero can't have used this ability to start their turn."
  expect(
    triggerTargetForTurn(hesitation, turn('turn-end', thorn, { startedByThis: true })),
  ).toBeUndefined();
  // Damage never sets it off.
  expect(triggerTargetFor(hesitation, { damaged: thorn, dealer: goblin, amount: 5 })).toBe(
    undefined,
  );
});

test('eligibility: a free triggered action needs a turn left when it takes the user’s turn', () => {
  const free = {
    actionType: 'free triggered action' as const,
    ordinaryUsedThisRound: true,
    preventions: [],
  };
  // rule/combat/triggered-action.md: the ordinary allowance doesn't bind a free triggered action.
  expect(triggerEligibility({ ...free, turnLeft: true })).toEqual({ eligible: true });
  // Q-TURNTRIG-1 (interpretation): "your turn" is the user's turn this round.
  expect(triggerEligibility({ ...free, turnLeft: false })).toMatchObject({
    eligible: false,
    reason: expect.stringMatching(/already taken their turn this round/),
  });
  // A prevention still blocks it (condition/dazed.md).
  expect(triggerEligibility({ ...free, turnLeft: true, preventions: ['dazed'] })).toMatchObject({
    eligible: false,
    reason: expect.stringContaining('dazed'),
  });
});

test('resolve: Breath of Dawn Remembered pays 1+ Essence for table work; tampering is refused', () => {
  const breath = compiled('Breath of Dawn Remembered');
  const input = (spend?: number): EffectOnlyInput => ({
    actor: { id: 'elementalist', kind: 'hero', temporaryStamina: 0, surges: 0 },
    targets: [{ id: 'thorn', kind: 'hero', temporaryStamina: 0, surges: 0 }],
    inCombat: true,
    resourcePool: { resource: 'essence', current: 3, legalFloor: 0 },
    trigger: { damage: 0 },
    ...(spend === undefined ? {} : { spend }),
  });
  const plain = resolveEffectOnly(breath, input());
  expect(plain).toMatchObject({ kind: 'resolved' });
  if (plain.kind !== 'resolved') throw new Error('unreachable');
  expect(plain.cost).toBeUndefined();
  // "Spend 1+ Essence": two essence spent, 3 → 1.
  const spent = resolveEffectOnly(breath, input(2));
  expect(spent).toMatchObject({
    kind: 'resolved',
    cost: { resource: 'essence', amount: 2, before: 3, after: 1 },
  });
  expect(resolveEffectOnly(breath, input(0)).kind).toBe('manual');
  const tampered = structuredClone(breath);
  delete tampered.trigger!.orDamageTaken;
  expect(resolveEffectOnly(tampered, input()).kind).toBe('manual');
  // Hesitation Is Weakness targets only its user.
  const hesitation = compiled('Hesitation Is Weakness');
  expect(
    resolveEffectOnly(hesitation, {
      ...input(),
      actor: { id: 'shadow', kind: 'hero', temporaryStamina: 0, surges: 0 },
      resourcePool: { resource: 'insight', current: 1, legalFloor: 0 },
    }).kind,
  ).toBe('manual');
});
