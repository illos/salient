// SPDX-License-Identifier: GPL-3.0-only
/**
 * V171 watchers, pure parts. Expected values are read from the pinned sources named on each case
 * (Compendium en/unified/md), never from a run of the code under test:
 * - feature/ability/conduit/level-1/violence-will-not-aid-thee.md: "The first time on a turn that
 *   the target deals damage to another creature, the target of this ability takes 1d10 lightning
 *   damage (save ends)."
 * - feature/ability/conduit/level-2/blessing-of-insight.md (Self and each ally): "Until the end of
 *   the encounter or until you are dying, each target gains 1 surge at the end of each of your
 *   turns."
 * - feature/ability/censor/level-2/blessing-of-the-faithful.md: the same sentence on a 3 aura,
 *   whose membership changes (rule/combat/aura.md: it "moves with you for the duration"); V200
 *   compiles it as an area, not a watcher.
 * - rule/health/winded.md: winded at or below half the Stamina maximum; rule/health/dying.md: a
 *   hero is dying at 0 Stamina or lower.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility, type WatcherNode } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  resolveEffectOnly,
  type CompiledAbilityInput,
  type EffectOnlyInput,
} from '../../shared/resolve/compiledOutcome.ts';
import {
  damageEvents,
  effectOnlyWatcher,
  sectionWatcher,
  watcherDue,
  watches,
} from '../../shared/resolve/watchers.ts';
import type { EffectInstance, Watcher } from '../../shared/contracts/liveState.ts';

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

const VIOLENCE =
  'The first time on a turn that the target deals damage to another creature, the target of this ability takes 1d10 lightning damage (save ends).';
const INSIGHT =
  'Until the end of the encounter or until you are dying, each target gains 1 surge at the end of each of your turns.';

test('pattern admission: Violence Will Not Aid Thee and Blessing of Insight compile; others stay manual', () => {
  expect(sectionWatcher(VIOLENCE)).toEqual({
    effect: 'watcher',
    subject: 'target',
    watcher: {
      event: 'damage-dealt',
      whose: 'subject',
      otherCreature: true,
      limit: 'turn',
      responses: [
        {
          kind: 'damage',
          recipient: 'subject',
          amount: { dice: { count: 1, sides: 10 } },
          damageType: 'lightning',
        },
      ],
    },
    duration: { kind: 'save-ends' },
    endsWhen: [],
    text: VIOLENCE,
  });
  expect(effectOnlyWatcher(INSIGHT)).toEqual({
    effect: 'watcher',
    subject: 'target',
    watcher: {
      event: 'turn-end',
      whose: 'owner',
      limit: 'each',
      responses: [{ kind: 'gain', recipient: 'subject', surges: 1 }],
    },
    duration: { kind: 'encounter' },
    endsWhen: ['owner-dying'],
    text: INSIGHT,
  });
  for (const text of [
    VIOLENCE.replace('first time on a turn', 'first time in a round'),
    VIOLENCE.replace('lightning', 'force'),
    VIOLENCE.replace(' (save ends)', ''),
    `${VIOLENCE} The target is slowed.`,
  ])
    expect(sectionWatcher(text), text).toBeUndefined();
  expect(effectOnlyWatcher(INSIGHT.replace('your turns', 'their turns'))).toBeUndefined();

  const violence = compiled('Violence Will Not Aid Thee');
  expect(violence.execution).toBe('supported');
  expect(violence.sections.map(node => node.kind)).toEqual(['watcher']);
  const insight = compiled('Blessing of Insight');
  expect(insight.execution).toBe('supported');
  expect(insight.activation).toEqual({
    actionType: 'maneuver',
    fixedCost: { resource: 'piety', amount: 5 },
    targetShape: { kind: 'each', self: true },
  });
  expect(insight.sections.map(node => node.kind)).toEqual(['watcher']);
  // Allies counted within 10 squares (Our Hearts Your Strength) and kills (Reap) are not observed.
  for (const name of ['Our Hearts Your Strength', 'Reap'])
    expect(compiled(name).execution, name).toBe('manual');
  // V200: the same sentence on a 3 aura is an area whose members the table keeps, never a watcher
  // of the use-time targets (design section 6; tests/scripts/areas.test.ts).
  expect(compiled('Blessing of the Faithful').sections.map(node => node.kind)).toEqual(['area']);
});

const rolled: CompiledAbilityInput = {
  actor: { actorId: 'conduit', characteristics: { M: 1, A: 1, R: 1, I: 2, P: 0 } },
  targets: [{ targetId: 'goblin', edges: 0, banes: 0 }],
  dice: { d10a: 5, d10b: 5 },
  inCombat: true,
  targetFacts: [],
  conditionFacts: { targets: [{ targetId: 'goblin', kind: 'foe' }] },
  // 3 Piety (the source's cost).
  resourcePool: { resource: 'piety', current: 3, legalFloor: 0 },
};

test('Violence Will Not Aid Thee gives its target a watcher; squads and objects stay manual; tampering is refused', () => {
  const definition = compiled('Violence Will Not Aid Thee');
  const outcome = resolveCompiledAbility(definition, rolled);
  if (outcome.kind !== 'resolved') throw new Error(outcome.kind);
  expect(outcome.effects.find(effect => effect.kind === 'watcher')).toMatchObject({
    status: 'applied',
    subject: 'target',
    targetId: 'goblin',
    payload: { event: 'damage-dealt', whose: 'subject', limit: 'turn' },
  });
  for (const kind of ['object', 'squad'] as const) {
    const other = resolveCompiledAbility(definition, {
      ...rolled,
      conditionFacts: { targets: [{ targetId: 'goblin', kind }] },
    });
    if (other.kind !== 'resolved') throw new Error(other.kind);
    expect(other.effects.find(effect => effect.kind === 'watcher')).toMatchObject({
      status: 'manual',
    });
  }
  const tampered = structuredClone(definition);
  (tampered.sections[0] as WatcherNode).spec.watcher.limit = 'each';
  expect(resolveCompiledAbility(tampered, rolled).kind).toBe('manual');
});

const insightInput: EffectOnlyInput = {
  actor: { id: 'conduit', kind: 'hero', temporaryStamina: 0, surges: 0 },
  targets: [
    { id: 'conduit', kind: 'hero', temporaryStamina: 0, surges: 0 },
    { id: 'ally', kind: 'hero', temporaryStamina: 0, surges: 1 },
    { id: 'minion', kind: 'squad' },
  ],
  inCombat: true,
  // 5 Piety (the source's cost).
  resourcePool: { resource: 'piety', current: 5, legalFloor: 0 },
};

test('Blessing of Insight gives each target a watcher of the user’s turn ends and always names the user', () => {
  const definition = compiled('Blessing of Insight');
  const outcome = resolveEffectOnly(definition, insightInput);
  if (outcome.kind !== 'resolved') throw new Error(outcome.kind);
  expect(outcome.effects.map(effect => [effect.kind, effect.targetId, effect.status])).toEqual([
    ['watcher', 'conduit', 'applied'],
    ['watcher', 'ally', 'applied'],
    ['watcher', 'minion', 'manual'],
  ]);
  // No immediate gain: the surge comes at the end of the user's turns.
  expect(outcome.writes).toEqual([]);
  expect(
    resolveEffectOnly(definition, { ...insightInput, targets: insightInput.targets.slice(1) }).kind,
  ).toBe('manual');
  const tampered = structuredClone(definition);
  (tampered.sections[0] as WatcherNode).spec.watcher.responses = [
    { kind: 'gain', recipient: 'subject', surges: 2 },
  ];
  expect(resolveEffectOnly(tampered, insightInput).kind).toBe('manual');
});

function watcher(payload: Watcher, extra: Partial<EffectInstance> = {}): EffectInstance {
  return {
    id: 'watcher-1',
    kind: 'watcher',
    sourceUseEventId: 'use-1',
    sourceActorId: 'conduit',
    abilityId: 'violence',
    abilityName: 'Violence Will Not Aid Thee',
    actorLabel: 'Conduit',
    sourcePath: 'feature/ability/conduit/level-1/violence-will-not-aid-thee.md',
    clause: VIOLENCE,
    owner: { kind: 'character', id: 'conduit', name: 'Conduit' },
    subject: { kind: 'foe', id: 'goblin', name: 'Goblin' },
    payload: { kind: 'watcher', text: VIOLENCE, watcher: payload },
    printedDuration: { kind: 'save-ends' },
    duration: { kind: 'save-ends', creatureId: 'goblin' },
    endsWhen: [],
    status: 'active',
    registrationIds: [],
    appliedSequence: 1,
    ...extra,
  };
}
const dealt: Watcher = {
  event: 'damage-dealt',
  whose: 'subject',
  otherCreature: true,
  limit: 'turn',
  responses: [],
};

test('matching: the watched creature, its event and "another creature"', () => {
  const instance = watcher(dealt);
  expect(
    watches(instance, 'goblin', { event: 'damage-dealt', creatureId: 'goblin', otherId: 'hero' }),
  ).toBe(true);
  // Damage the goblin deals to itself is not dealt to another creature.
  expect(
    watches(instance, 'goblin', { event: 'damage-dealt', creatureId: 'goblin', otherId: 'goblin' }),
  ).toBe(false);
  // Another creature's damage, or the goblin taking damage, is not watched.
  expect(
    watches(instance, 'goblin', { event: 'damage-dealt', creatureId: 'hero', otherId: 'goblin' }),
  ).toBe(false);
  expect(watches(instance, 'goblin', { event: 'damage-taken', creatureId: 'goblin' })).toBe(false);
  // An owner watcher watches the owner, wherever it is held.
  const owners = watcher({ ...dealt, event: 'turn-end', whose: 'owner', limit: 'each' });
  expect(watches(owners, 'goblin', { event: 'turn-end', creatureId: 'conduit' })).toBe(true);
  expect(watches(owners, 'goblin', { event: 'turn-end', creatureId: 'goblin' })).toBe(false);
  expect(
    watches({ ...instance, status: 'ended' }, 'goblin', {
      event: 'damage-dealt',
      creatureId: 'goblin',
      otherId: 'hero',
    }),
  ).toBe(false);
});

test('limits: the first time on a turn, once per round, and outside combat', () => {
  const at = { encounterId: 'e1', round: 2, turnId: 't1' };
  const fresh = watcher(dealt);
  expect(watcherDue(fresh, at)).toEqual({
    status: 'fire',
    window: { encounterId: 'e1', turnId: 't1' },
  });
  const fired = watcher(dealt, {
    firings: [{ causeEventId: 'x', encounterId: 'e1', turnId: 't1' }],
  });
  expect(watcherDue(fired, at)).toEqual({ status: 'limited' });
  // The next turn is a new window, whatever the round.
  expect(watcherDue(fired, { ...at, turnId: 't2' }).status).toBe('fire');
  // "The first time on a turn" needs a turn: between turns, or outside combat, the table decides.
  expect(watcherDue(fresh, { encounterId: 'e1', round: 2 }).status).toBe('manual');
  expect(watcherDue(fresh, {}).status).toBe('manual');
  // Once per round: the same round is used up whichever turn it is.
  const round = watcher(
    { ...dealt, limit: 'round' },
    {
      firings: [{ causeEventId: 'x', encounterId: 'e1', round: 2 }],
    },
  );
  expect(watcherDue(round, { ...at, turnId: 't9' })).toEqual({ status: 'limited' });
  expect(watcherDue(round, { ...at, round: 3 }).status).toBe('fire');
  // Each time: no limit.
  const each = watcher(
    { ...dealt, limit: 'each' },
    {
      firings: [{ causeEventId: 'x', encounterId: 'e1' }],
    },
  );
  expect(watcherDue(each, at).status).toBe('fire');
  // A manual stacking group is the table's (V158 R1b).
  expect(watcherDue(watcher(dealt, { manualStacking: true }), at).status).toBe('manual');
});

test('damage events: taken, made winded and dying', () => {
  // A hero with Stamina maximum 24 is winded at 12 (rule/health/winded.md).
  expect(
    damageEvents(
      'hero',
      12,
      { stamina: 20, temporaryStamina: 0 },
      { stamina: 12, temporaryStamina: 0 },
    ),
  ).toEqual(['damage-taken', 'made-winded']);
  // Already winded: not made winded again. Reaching 0 is dying (rule/health/dying.md).
  expect(
    damageEvents(
      'hero',
      12,
      { stamina: 5, temporaryStamina: 0 },
      { stamina: 0, temporaryStamina: 0 },
    ),
  ).toEqual(['damage-taken', 'dying']);
  // Only heroes are dying.
  expect(
    damageEvents(
      'foe',
      7,
      { stamina: 5, temporaryStamina: 0 },
      { stamina: -1, temporaryStamina: 0 },
    ),
  ).toEqual(['damage-taken']);
  // Temporary Stamina absorbing it is still damage taken; 0 damage is not (Q-RES-4).
  expect(
    damageEvents(
      'hero',
      12,
      { stamina: 20, temporaryStamina: 5 },
      { stamina: 20, temporaryStamina: 2 },
    ),
  ).toEqual(['damage-taken']);
  expect(
    damageEvents(
      'hero',
      12,
      { stamina: 20, temporaryStamina: 0 },
      { stamina: 20, temporaryStamina: 0 },
    ),
  ).toEqual([]);
});
