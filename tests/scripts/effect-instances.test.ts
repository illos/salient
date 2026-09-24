// SPDX-License-Identifier: GPL-3.0-only
/**
 * V158 effect instances, pure parts. Expected values are read from the pinned sources named on each
 * case (Compendium en/unified/md, and en/books/heroes/clean/Draw Steel Heroes.md for "Stacking
 * Unique Effects"), never from a run of the code under test.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility, type RiderNode } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import {
  bindDuration,
  effectiveAggregate,
  lastingInstruction,
  timingFor,
  type AggregateInput,
} from '../../shared/resolve/lastingEffects.ts';

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

// feature/ability/null/level-1/relentless-nemesis.md, Effect section.
const NEMESIS_BODY =
  'whenever the target finishes moving or being force moved, you can use a free triggered action to shift up to your speed. You must end this shift adjacent to the target.';
const NEMESIS = `Until the start of your next turn, ${NEMESIS_BODY}`;

test('Relentless Nemesis compiles with its Effect as a lasting instruction', () => {
  const definition = compiled('Relentless Nemesis');
  expect(definition.execution).toBe('supported');
  expect(definition.diagnostics).toEqual([]);
  expect(definition.sections).toHaveLength(1);
  const node = definition.sections[0] as RiderNode;
  expect(node).toMatchObject({ kind: 'rider', shape: 'shift', dependency: 'independent' });
  expect(node.lasting).toEqual({
    effect: 'instruction',
    shape: 'shift',
    subject: 'target',
    duration: { kind: 'start-of-next-turn', anchor: 'owner' },
    endsWhen: [],
    text: NEMESIS_BODY,
  });
});

test('pattern admission: whole sections, bound durations and admitted table work only', () => {
  expect(lastingInstruction(NEMESIS)).toMatchObject({
    duration: { kind: 'start-of-next-turn', anchor: 'owner' },
    endsWhen: [],
    text: NEMESIS_BODY,
  });
  // The duration may follow the first sentence's table work instead.
  expect(
    lastingInstruction(
      'Whenever the target finishes moving or being force moved, you can use a free triggered action to shift up to your speed until the start of your next turn. You must end this shift adjacent to the target.',
    ),
  ).toMatchObject({ duration: { kind: 'start-of-next-turn', anchor: 'owner' }, endsWhen: [] });
  // censor/level-2/blessing-of-the-faithful.md prints "Until the end of the encounter or until you
  // are dying": the whole phrase binds, never its shorter prefix.
  expect(
    lastingInstruction(`Until the end of the encounter or until you are dying, ${NEMESIS_BODY}`),
  ).toMatchObject({ duration: { kind: 'encounter' }, endsWhen: ['owner-dying'] });
  for (const text of [
    // A duration the engine does not bind.
    `Until the end of the day, ${NEMESIS_BODY}`,
    // Changed or added table work.
    `Until the start of your next turn, ${NEMESIS_BODY.replace('your speed', 'twice your speed')}`,
    `${NEMESIS} Each enemy is frightened.`,
    'Until the start of your next turn, whenever the target finishes moving or being force moved, you can use a free triggered action to shift up to your speed.',
    // tactician/level-2/squad-on-me.md: changes stability, a number the engine computes.
    'Until the start of your next turn, each target has a bonus to stability equal to your Might score. Additionally, each target gains 2 surges.',
    // talent/level-1/precognition.md: its triggered free strike watches damage the engine observes.
    'Ability rolls made against the target take a bane until the start of your next turn. Whenever the target takes damage while under this effect, they can use a triggered action to make a free strike against the source of the damage.',
    // shadow/level-3/dancer.md: "or damages you" is an observable trigger (watchers, later slice).
    'Until the end of the encounter, whenever an enemy moves or is force moved adjacent to you or damages you, you can take the Disengage move action as a free triggered action.',
    // fury/level-2/apex-predator.md: "for 24 hours" is a duration the engine does not bind.
    "The target can't be hidden from you for 24 hours. Until the end of the encounter, whenever the target willingly moves, you can use a free triggered action to move.",
  ])
    expect(lastingInstruction(text), text).toBeUndefined();
  for (const name of ['Squad! On Me!', 'Precognition', 'Dancer', 'Apex Predator'])
    expect(compiled(name).execution, name).toBe('manual');
});

test('durations bind to the right creatures and clock timings', () => {
  // docs/lasting-effects-design.md, Durations: "your" is the owner, "their" the subject.
  expect(bindDuration({ kind: 'start-of-next-turn', anchor: 'owner' }, 'null', 'goblin')).toEqual({
    kind: 'start-of-next-turn',
    creatureId: 'null',
  });
  expect(bindDuration({ kind: 'end-of-next-turn', anchor: 'owner' }, 'null', 'goblin')).toEqual({
    kind: 'end-of-next-turn',
    creatureId: 'null',
  });
  expect(bindDuration({ kind: 'end-of-next-turn', anchor: 'subject' }, 'null', 'goblin')).toEqual({
    kind: 'end-of-next-turn',
    creatureId: 'goblin',
  });
  // rule/general/saving-throw.md and rule/combat/end-of-turn.md: the affected creature.
  expect(bindDuration({ kind: 'save-ends' }, 'null', 'goblin')).toEqual({
    kind: 'save-ends',
    creatureId: 'goblin',
  });
  expect(bindDuration({ kind: 'eot' }, 'null', 'goblin')).toEqual({
    kind: 'eot',
    creatureId: 'goblin',
  });
  // feature/elementalist/level-1/persistent-magic.md: the user maintains.
  expect(bindDuration({ kind: 'maintained' }, 'null', 'goblin')).toEqual({
    kind: 'maintained',
    creatureId: 'null',
  });
  expect(bindDuration({ kind: 'encounter' }, 'null', 'goblin')).toEqual({ kind: 'encounter' });

  expect(timingFor({ kind: 'start-of-next-turn', creatureId: 'null' })).toEqual({
    timing: {
      scope: 'creature-turn',
      boundary: 'turn-start',
      creatureId: 'null',
      occurrence: 'next',
    },
    work: 'expire-effect',
  });
  expect(timingFor({ kind: 'end-of-next-turn', creatureId: 'goblin' })).toEqual({
    timing: { scope: 'end-of-next-turn', creatureId: 'goblin' },
    work: 'expire-effect',
  });
  expect(timingFor({ kind: 'encounter' })).toEqual({
    timing: { scope: 'combat', boundary: 'combat-end' },
    work: 'expire-effect',
  });
  expect(timingFor({ kind: 'save-ends', creatureId: 'goblin' })).toEqual({
    timing: {
      scope: 'creature-turn',
      boundary: 'turn-end',
      creatureId: 'goblin',
      occurrence: 'each',
    },
    work: 'saving-throw',
    creatureId: 'goblin',
  });
  expect(timingFor({ kind: 'maintained', creatureId: 'null' })).toBeUndefined();
  expect(timingFor({ kind: 'none' })).toBeUndefined();
});

test('effectiveAggregate follows "Stacking Unique Effects"', () => {
  type Payload = { potency?: number; bonus?: number; condition?: string };
  const instance = (
    id: string,
    abilityId: string,
    appliedSequence: number,
    payload: Payload,
    status: 'active' | 'ended' = 'active',
  ): AggregateInput<Payload> => ({
    id,
    abilityId,
    abilityName: abilityId,
    appliedSequence,
    status,
    payload,
  });
  // "two allied nulls each have their Null Field ability active … that cultist's potencies are
  // reduced by 1, not by 2."
  const fields = effectiveAggregate(
    [
      instance('a', 'null-field', 1, { potency: -1 }),
      instance('b', 'null-field', 2, { potency: -1 }),
    ],
    { impact: p => Math.abs(p.potency ?? 0) },
  );
  expect(fields.groups).toHaveLength(1);
  expect(fields.groups[0]!.applies.payload.potency).toBe(-1);
  expect(fields.groups[0]!.sources).toEqual(['a', 'b']);
  // "the most impactful effect—such as the highest bonus—from each use of the ability applies. The
  // most recently used ability applies for determining duration."
  const bonus = effectiveAggregate(
    [instance('old', 'blessing', 1, { bonus: 3 }), instance('new', 'blessing', 2, { bonus: 1 })],
    { impact: p => p.bonus ?? 0 },
  );
  expect(bonus.groups[0]!.applies.id).toBe('old');
  expect(bonus.groups[0]!.applies.payload.bonus).toBe(3);
  expect(bonus.groups[0]!.durationFrom.id).toBe('new');
  // "The unique effects of different abilities are combined"; "Different effects that impose the
  // same condition don't stack": weakened from two abilities is imposed once.
  const combined = effectiveAggregate(
    [
      instance('w1', 'wither', 1, { condition: 'weakened' }),
      instance('w2', 'cutting-sarcasm', 2, { condition: 'weakened' }),
      instance('x', 'blessing', 3, { bonus: 2 }),
      instance('gone', 'hex', 4, { condition: 'slowed' }, 'ended'),
    ],
    { consequence: p => p.condition },
  );
  expect(combined.groups.map(group => group.abilityId).sort()).toEqual([
    'blessing',
    'cutting-sarcasm',
    'wither',
  ]);
  expect(combined.consequences).toEqual(['weakened']);
});

test('a lasting instruction resolves with the use, and tampering is refused', () => {
  const definition = compiled('Relentless Nemesis');
  // relentless-nemesis.md: 3 Discipline; Power Roll + Agility; 17+: 12 + A damage.
  const input: CompiledAbilityInput = {
    actor: { actorId: 'null', characteristics: { M: 0, A: 2, R: 0, I: 1, P: 0 } },
    targets: [{ targetId: 'goblin', edges: 0, banes: 0 }],
    dice: { d10a: 8, d10b: 7 },
    inCombat: true,
    resourcePool: { resource: 'discipline', current: 3, legalFloor: 0 },
    targetFacts: [
      {
        targetId: 'goblin',
        kind: 'foe',
        stamina: 30,
        maxStamina: 30,
        temporaryStamina: 0,
        immunities: [],
        weaknesses: [],
      },
    ],
  };
  const outcome = resolveCompiledAbility(definition, input);
  expect(outcome.kind).toBe('resolved');
  if (outcome.kind !== 'resolved') throw new Error('unresolved');
  expect(outcome.roll.targets[0]).toMatchObject({ tier: 3, damage: { rolledDamage: 14 } });
  expect(outcome.effects.find(e => e.kind === 'rider')).toMatchObject({
    targetId: 'goblin',
    status: 'manual',
    lasting: { duration: { kind: 'start-of-next-turn', anchor: 'owner' }, text: NEMESIS_BODY },
  });
  const tampered = (change: (node: RiderNode) => void) => {
    const copy = structuredClone(definition);
    change(copy.sections[0] as RiderNode);
    return resolveCompiledAbility(copy, input).kind;
  };
  expect(tampered(n => (n.lasting!.duration = { kind: 'encounter' }))).toBe('manual');
  expect(tampered(n => (n.lasting!.endsWhen = ['reused']))).toBe('manual');
  expect(tampered(n => (n.lasting!.text = 'you can shift up to your speed.'))).toBe('manual');
  expect(tampered(n => (n.lasting!.subject = 'owner'))).toBe('manual');
  expect(tampered(n => (n.clause = `Until the end of the encounter, ${NEMESIS_BODY}`))).toBe(
    'manual',
  );
  expect(tampered(n => delete n.lasting)).toBe('manual');
});
