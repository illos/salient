// SPDX-License-Identifier: GPL-3.0-only
/**
 * V173 triggered actions, pure parts. Expected values are read from the pinned sources named on each
 * case (Compendium en/unified/md), never from a run of the code under test:
 * - rule/combat/triggered-action.md: one triggered action per round; a free triggered action
 *   "doesn't count against your limit"; "Any effect that prevents you from using triggered actions
 *   also prevents you from using free triggered actions."
 * - condition/dazed.md: a dazed creature "can't use triggered actions, free triggered actions, or
 *   free maneuvers"; rule/combat/surprised.md: "A surprised creature can't take triggered actions
 *   or free triggered actions".
 * - feature/ability/talent/level-1/feedback-loop.md: Triggered, Ranged 10, One creature; Trigger
 *   "The target deals damage to an ally."; Effect "The target takes psychic damage equal to half the
 *   triggering damage." rule/general/always-round-down.md: 7 halved is 3.
 * - feature/ability/troubadour/level-1/riposte.md: Triggered, Melee 1, Self or one ally; Trigger "The
 *   target takes damage from a melee strike."; Effect "The target makes a free strike against the
 *   creature who made the triggering strike."
 * - rule/combat/target.md: "You aren't an eligible creature target for your own abilities unless
 *   those abilities also have "self" as a target (see below), or unless the ability indicates
 *   otherwise." ("An ally" excluding yourself is Q-TRIG-1's labelled interpretation.)
 * - Manual examples: censor/level-1/my-life-for-yours.md (turn start or damage, and a Spend section),
 *   elementalist/level-1/skin-like-castle-walls.md ("take half the damage": V174),
 *   conduit/level-1/word-of-judgment.md ("would take damage"), shadow/level-1/hesitation-is-weakness.md
 *   (another hero ends their turn), tactician/level-2/no-dying-on-my-watch.md (a power roll).
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import { resolveEffectOnly, type EffectOnlyInput } from '../../shared/resolve/compiledOutcome.ts';
import {
  distanceNote,
  triggerEligibility,
  triggerSection,
  triggerTarget,
  triggerTargetFor,
  type DamageOccurrence,
  type TriggerHolder,
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

test('Feedback Loop and Riposte compile as triggered actions with observed triggers', () => {
  const feedback = compiled('Feedback Loop');
  expect(feedback.execution).toBe('supported');
  expect(feedback.activation).toMatchObject({
    actionType: 'triggered action',
    targetShape: { kind: 'one', self: false },
  });
  expect(feedback.trigger).toEqual({
    effect: 'trigger',
    event: 'damage-dealt',
    whose: 'target',
    damaged: 'ally',
    text: 'The target deals damage to an ally.',
  });
  expect(feedback.sections.map(s => s.kind)).toEqual(['triggered-damage']);
  expect(feedback.sections[0]).toMatchObject({ damageType: 'psychic', share: 'half' });

  const riposte = compiled('Riposte');
  expect(riposte.execution).toBe('supported');
  expect(riposte.activation).toMatchObject({
    actionType: 'triggered action',
    targetShape: { kind: 'one', self: true },
  });
  expect(riposte.trigger).toMatchObject({
    event: 'damage-taken',
    whose: 'target',
    from: 'melee-strike',
  });
  expect(riposte.sections).toMatchObject([
    { kind: 'instruction', shape: 'free-strike', subject: 'target' },
  ]);
});

test('unobserved triggers and manual effects keep the ability manual with a precise diagnostic', () => {
  const codes = (name: string) => compiled(name).diagnostics.map(d => d.code);
  for (const name of ['My Life for Yours', 'Word of Judgment', 'Hesitation Is Weakness']) {
    expect(compiled(name).execution, name).toBe('manual');
    expect(codes(name), name).toContain('trigger-unobserved');
  }
  // An observed trigger with a manual effect ("take half the damage" is V174).
  expect(compiled('Skin Like Castle Walls').execution).toBe('manual');
  expect(codes('Skin Like Castle Walls')).toContain('trigger-manual');
  // A power roll: offered only without one in V173.
  expect(compiled('No Dying on My Watch').execution).toBe('manual');
  expect(
    compiled('No Dying on My Watch').diagnostics.find(d => d.code === 'trigger-manual')?.message,
  ).toMatch(/without a power roll/);
  // The unrecognised hero action type is recognised now.
  expect(codes('Word of Judgment')).not.toContain('action-type');
  expect(
    triggerSection('The target would take damage from an ability that uses a power roll.'),
  ).toEqual({
    unobserved: expect.stringMatching(/V174/),
  });
  expect(triggerSection('The target moves.')).toEqual({ unobserved: expect.stringMatching(/map/) });
});

test('"the triggering damage" needs a damage trigger; a tampered trigger is refused', () => {
  const noTrigger = envelope('Feedback Loop');
  noTrigger.blocks = noTrigger.blocks.filter(b => b.kind !== 'section' || b.label !== 'Trigger');
  expect(compileAbility(noTrigger).execution).toBe('manual');
  const definition = compiled('Feedback Loop');
  const input = (damage?: number): EffectOnlyInput => ({
    actor: { id: 'talent', kind: 'hero', temporaryStamina: 0, surges: 0 },
    targets: [{ id: 'goblin', kind: 'foe' }],
    inCombat: true,
    ...(damage === undefined ? {} : { trigger: { damage } }),
  });
  const tampered = structuredClone(definition);
  tampered.trigger = { ...tampered.trigger!, damaged: 'any' };
  expect(resolveEffectOnly(tampered, input(7)).kind).toBe('manual');
  const retyped = structuredClone(definition);
  retyped.envelope.usage = 'Main action';
  expect(resolveEffectOnly(retyped, input(7)).kind).toBe('manual');
});

test('Feedback Loop deals half the triggering damage, rounded down; by hand it is table work', () => {
  const definition = compiled('Feedback Loop');
  const base: EffectOnlyInput = {
    actor: { id: 'talent', kind: 'hero', temporaryStamina: 0, surges: 0 },
    targets: [{ id: 'goblin', kind: 'foe' }],
    inCombat: true,
  };
  const offered = resolveEffectOnly(definition, { ...base, trigger: { damage: 7 } });
  expect(offered.kind).toBe('resolved');
  if (offered.kind !== 'resolved') throw new Error('unreachable');
  expect(offered.effects).toMatchObject([
    {
      kind: 'triggered-damage',
      status: 'calculated',
      targetId: 'goblin',
      damageType: 'psychic',
      triggeringDamage: 7,
      amount: 3,
    },
  ]);
  const byHand = resolveEffectOnly(definition, base);
  if (byHand.kind !== 'resolved') throw new Error('unreachable');
  expect(byHand.effects).toMatchObject([{ kind: 'triggered-damage', status: 'manual' }]);
  // "One creature": the user is not an eligible target (rule/combat/target.md).
  expect(
    resolveEffectOnly(definition, {
      ...base,
      targets: [{ id: 'talent', kind: 'hero', temporaryStamina: 0, surges: 0 }],
    }).kind,
  ).toBe('manual');
});

const talent = { id: 'talent', side: 'heroes' as const };
const ally = { id: 'thorn', side: 'heroes' as const };
const goblin = { id: 'goblin', side: 'director' as const };
const holder = (name: string): TriggerHolder => {
  const definition = compiled(name);
  return {
    owner: talent,
    spec: definition.trigger!,
    target: triggerTarget(definition.envelope.target)!,
  };
};
const hit = (damaged: DamageOccurrence['damaged'], extra: Partial<DamageOccurrence> = {}) => ({
  damaged,
  dealer: goblin,
  amount: 5,
  ...extra,
});

test('matching: Feedback Loop answers damage dealt to an ally and targets the dealer', () => {
  const feedback = holder('Feedback Loop');
  expect(triggerTargetFor(feedback, hit(ally))).toBe('goblin');
  // Not an ally: the Talent itself, and a foe the ally damaged.
  expect(triggerTargetFor(feedback, hit(talent))).toBeUndefined();
  expect(triggerTargetFor(feedback, hit(goblin, { dealer: ally }))).toBeUndefined();
  // No dealer (a watcher's own damage), and zero damage (Q-RES-4), set off nothing.
  expect(triggerTargetFor(feedback, { damaged: ally, amount: 5 })).toBeUndefined();
  expect(triggerTargetFor(feedback, hit(ally, { amount: 0 }))).toBeUndefined();
  // Another hero damaging an ally is a creature the Talent may target ("One creature").
  expect(triggerTargetFor(feedback, hit(ally, { dealer: { id: 'mira', side: 'heroes' } }))).toBe(
    'mira',
  );
});

test('matching: Riposte answers a melee strike on its user or an ally', () => {
  const riposte = holder('Riposte');
  expect(triggerTargetFor(riposte, hit(talent, { meleeStrike: true }))).toBe('talent');
  expect(triggerTargetFor(riposte, hit(ally, { meleeStrike: true }))).toBe('thorn');
  expect(
    triggerTargetFor(riposte, hit(goblin, { dealer: ally, meleeStrike: true })),
  ).toBeUndefined();
  expect(triggerTargetFor(riposte, hit(ally, { meleeStrike: false }))).toBeUndefined();
  expect(triggerTargetFor(riposte, hit(ally))).toBeUndefined();
});

test('eligibility: one ordinary triggered action per round; free ones still offered; preventions block both', () => {
  const ordinary = { actionType: 'triggered action' as const, preventions: [] };
  const free = { actionType: 'free triggered action' as const, preventions: [] };
  // Two competing ordinary offers to one owner: both are offered while none is used...
  expect(triggerEligibility({ ...ordinary, ordinaryUsedThisRound: false })).toEqual({
    eligible: true,
  });
  // ...and once one is accepted, the other is refused on its re-check.
  expect(triggerEligibility({ ...ordinary, ordinaryUsedThisRound: true })).toMatchObject({
    eligible: false,
    reason: expect.stringMatching(/already used a triggered action this round/),
  });
  // A free triggered action is still offered after the ordinary one is used.
  expect(triggerEligibility({ ...free, ordinaryUsedThisRound: true })).toEqual({ eligible: true });
  // rule/health/dying.md: a dead hero is prevented; dying alone is not ("you can still act").
  for (const prevention of ['dazed', 'surprised', 'dead'] as const)
    for (const kind of [ordinary, free])
      expect(
        triggerEligibility({ ...kind, ordinaryUsedThisRound: false, preventions: [prevention] }),
      ).toMatchObject({ eligible: false, reason: expect.stringContaining(prevention) });
});

test('the card names the printed distance for the table to confirm', () => {
  expect(distanceNote('[Ranged](scc.v1:x) 10')).toBe(
    'within 10 squares (ranged): the table confirms',
  );
  expect(distanceNote('Melee 1')).toBe('within 1 square (melee): the table confirms');
});
