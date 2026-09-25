// SPDX-License-Identifier: GPL-3.0-only
/**
 * V200 areas and auras, pure parts. Expected values are read from the pinned sources named on each
 * case (Compendium en/unified/md), never from a run of the code under test:
 * - feature/ability/talent/level-1/incinerate.md: Main action, 3 cube within 10, "Each enemy in the
 *   area"; Effect "A column of fire remains in the area until the start of your next turn. Each
 *   enemy who enters the area for the first time in a combat round or starts their turn there takes
 *   2 fire damage."; Strained "The size of the cube increases by 2, but the fire disappears at the
 *   end of your turn."
 * - feature/ability/censor/level-2/blessing-of-the-faithful.md: Maneuver, 5 Wrath, 3 aura, "Self and
 *   each ally in the area"; "Until the end of the encounter or until you are dying, each target gains
 *   1 surge at the end of each of your turns."
 * - feature/ability/conduit/level-2/wellspring-of-grace.md: Main action, 5 Piety, 3 aura, "Each ally
 *   in the area"; "Until the end of the encounter or until you are dying, whenever a target starts
 *   their turn in the area, they can spend a Recovery."
 * - feature/ability/troubadour/level-1/ballad-of-the-beast.md: No action, Performance, 5 aura, "Self
 *   and each ally in the area"; "While this performance is active, each target who starts their
 *   turn in the area gains 1 surge."
 * - feature/ability/troubadour/level-1/revitalizing-limerick.md: "At the end of each of your turns
 *   while this performance is active, you can choose up to a number of targets equal to your
 *   Presence score. Each chosen target can spend a Recovery."
 * - feature/ability/troubadour/level-3/fire-up-the-night.md: "While this performance is active, each
 *   target who starts their turn in the area doesn't take a bane on strikes against creatures with
 *   concealment. Once during their turn, they can search for hidden creatures as a free maneuver
 *   (see Hide and Sneak in Chapter 9: Tests)."
 * - rule/combat/side.md: the heroes and their allies are one side; every creature opposing them the
 *   other. rule/combat/combat-round.md: the "first time in a combat round" window is a round.
 * - User rulings (2026-09-25): adding a member is it entering the area.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility, type AreaNode } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  resolveEffectOnly,
  type CompiledAbilityInput,
  type EffectOnlyInput,
} from '../../shared/resolve/compiledOutcome.ts';
import {
  areaTargetRelation,
  effectOnlyArea,
  riderApplies,
  sectionArea,
} from '../../shared/resolve/areas.ts';
import { strainedSection } from '../../shared/resolve/strained.ts';
import { watcherDue, watches } from '../../shared/resolve/watchers.ts';
import type { EffectInstance, Watcher } from '../../shared/contracts/liveState.ts';

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

const COLUMN =
  'A column of fire remains in the area until the start of your next turn. Each enemy who enters the area for the first time in a combat round or starts their turn there takes 2 fire damage.';
const FAITHFUL =
  'Until the end of the encounter or until you are dying, each target gains 1 surge at the end of each of your turns.';
const WELLSPRING =
  'Until the end of the encounter or until you are dying, whenever a target starts their turn in the area, they can spend a Recovery.';
const BALLAD =
  'While this performance is active, each target who starts their turn in the area gains 1 surge.';
const LIMERICK =
  'At the end of each of your turns while this performance is active, you can choose up to a number of targets equal to your Presence score. Each chosen target can spend a Recovery.';
const NIGHT =
  "While this performance is active, each target who starts their turn in the area doesn't take a bane on strikes against creatures with concealment. Once during their turn, they can search for hidden creatures as a free maneuver (see Hide and Sneak in Chapter 9: Tests).";

const fire = {
  kind: 'damage' as const,
  recipient: 'subject' as const,
  amount: 2,
  damageType: 'fire',
};
const enemy = { self: false, others: 'enemy' as const };
const selfAndAllies = { self: true, others: 'ally' as const };

test('grammar: each admitted section reads to its printed riders, and a changed one is refused', () => {
  expect(sectionArea(COLUMN, 'Each enemy in the area')).toEqual({
    effect: 'area',
    duration: { kind: 'start-of-next-turn', anchor: 'owner' },
    endsWhen: [],
    riders: [
      {
        who: enemy,
        watcher: { event: 'area-entered', whose: 'subject', limit: 'round', responses: [fire] },
      },
      {
        who: enemy,
        watcher: { event: 'turn-start', whose: 'subject', limit: 'each', responses: [fire] },
      },
    ],
    text: COLUMN,
  });
  expect(effectOnlyArea(FAITHFUL, 'Self and each ally in the area')).toMatchObject({
    duration: { kind: 'encounter' },
    endsWhen: ['owner-dying'],
    riders: [
      {
        who: selfAndAllies,
        watcher: {
          event: 'turn-end',
          whose: 'owner',
          limit: 'each',
          responses: [{ kind: 'gain', recipient: 'subject', surges: 1 }],
        },
      },
    ],
  });
  expect(effectOnlyArea(WELLSPRING, 'Each ally in the area')).toMatchObject({
    riders: [
      {
        who: { self: false, others: 'ally' },
        watcher: {
          event: 'turn-start',
          whose: 'subject',
          responses: [{ kind: 'instruction', text: 'they can spend a Recovery.' }],
        },
      },
    ],
  });
  expect(effectOnlyArea(BALLAD, 'Self and each ally in the area')).toMatchObject({
    duration: { kind: 'encounter' },
    endsWhen: ['performance'],
    riders: [
      {
        who: selfAndAllies,
        watcher: {
          event: 'turn-start',
          whose: 'subject',
          responses: [{ kind: 'gain', recipient: 'subject', surges: 1 }],
        },
      },
    ],
  });
  // The Limerick's choice is made once, by the user, at the end of the user's turns.
  expect(effectOnlyArea(LIMERICK, 'Self and each ally in the area')).toMatchObject({
    endsWhen: ['performance'],
    riders: [
      {
        who: { self: true, others: 'none' },
        watcher: {
          event: 'turn-end',
          whose: 'owner',
          responses: [
            {
              kind: 'instruction',
              text: 'you can choose up to a number of targets equal to your Presence score. Each chosen target can spend a Recovery.',
            },
          ],
        },
      },
    ],
  });
  expect(effectOnlyArea(NIGHT, 'Self and each ally in the area')?.riders[0]!.watcher).toMatchObject(
    {
      event: 'turn-start',
      responses: [{ kind: 'instruction', text: expect.stringMatching(/^doesn't take a bane/) }],
    },
  );
  for (const text of [
    COLUMN.replace('for the first time in a combat round ', ''),
    COLUMN.replace('fire damage', 'force damage'),
    COLUMN.replace('start of your next turn', 'end of your next turn'),
    `${COLUMN} The area is difficult terrain.`,
  ])
    expect(sectionArea(text, 'Each enemy in the area'), text).toBeUndefined();
  // A target line the grammar doesn't read has no relation to bind "each target" to.
  expect(effectOnlyArea(FAITHFUL, 'Self and each ally')).toBeUndefined();
  expect(areaTargetRelation('Each creature in the area')).toBeUndefined();
  expect(
    effectOnlyArea(
      BALLAD.replace('1 surge', '1 surge and 1 Recovery'),
      'Self and each ally in the area',
    ),
  ).toBeUndefined();
});

test('the Strained section ends the column at the end of the user’s turn, only with the area', () => {
  expect(
    strainedSection(
      'The size of the cube increases by 2, but the fire disappears at the end of your turn.',
    ),
  ).toEqual({ area: { sizeIncrease: 2, endsAtTurnEnd: true } });
  expect(
    strainedSection(
      'The size of the cube increases by 2, but the fire lingers until the end of your turn.',
    ),
  ).toBeUndefined();
});

test('six abilities compile; the other candidates stay manual with a precise area diagnostic', () => {
  expect(compiled('Incinerate').execution).toBe('supported');
  expect(compiled('Incinerate').sections.map(node => node.kind)).toEqual(['area', 'strained']);
  for (const name of [
    'Blessing of the Faithful',
    'Wellspring of Grace',
    '"Ballad of the Beast"',
    'Revitalizing Limerick',
    '"Fire Up the Night"',
  ]) {
    const definition = compiled(name);
    expect(definition.execution, name).toBe('supported');
    expect(
      definition.sections.map(node => node.kind),
      name,
    ).toEqual(['area']);
  }
  // rule/combat/turn.md "No action", admitted only for a performance (routines.md).
  expect(compiled('"Ballad of the Beast"').activation).toEqual({
    actionType: 'no action',
    targetShape: { kind: 'area', self: true },
  });
  for (const name of [
    'Choreography',
    'Acrobatics',
    '"Never-Ending Hero"',
    'Null Field',
    'Psychic Pulse',
    'Heat Sink',
    'Absorption Field',
    'Molecular Rearrangement Field',
    'Stabilizing Field',
    'Synapse Field',
    'Font of Wrath',
    'Statue of Power',
    'Wall of Fire',
    'O Flower Aid, O Earth Defend',
  ]) {
    const definition = compiled(name);
    expect(definition.execution, name).toBe('manual');
    expect(
      definition.diagnostics.some(d => d.code === 'area-manual'),
      name,
    ).toBe(true);
  }
  // Without the Performance keyword the same text is neither a performance nor a no-action use.
  const plain = envelope('"Ballad of the Beast"');
  plain.keywords = plain.keywords.filter(k => !/performance/i.test(k));
  expect(compileAbility(plain).execution).toBe('manual');
});

const rolled: CompiledAbilityInput = {
  actor: { actorId: 'talent', characteristics: { M: 0, A: 1, R: 2, I: 1, P: 0 } },
  targets: [
    { targetId: 'goblin-1', edges: 0, banes: 0 },
    { targetId: 'goblin-2', edges: 0, banes: 0 },
  ],
  dice: { d10a: 1, d10b: 1 },
  inCombat: true,
  targetFacts: [],
};

test('Incinerate: one area per use with the targets as members; strained ends it at the turn’s end; tampering is refused', () => {
  const definition = compiled('Incinerate');
  const at = (strained?: boolean) => {
    const outcome = resolveCompiledAbility(definition, {
      ...rolled,
      ...(strained === undefined
        ? {}
        : {
            strained: {
              applies: strained,
              basis: strained ? 'already-strained' : 'not-strained',
              automatic: strained,
              inCombat: true,
            },
          }),
    });
    if (outcome.kind !== 'resolved') throw new Error(outcome.kind);
    return outcome.effects.filter(effect => effect.kind === 'area');
  };
  expect(at(false)).toEqual([
    expect.objectContaining({
      status: 'applied',
      targetId: 'goblin-1',
      members: ['goblin-1', 'goblin-2'],
      duration: { kind: 'start-of-next-turn', anchor: 'owner' },
    }),
  ]);
  expect(at(true)[0]).toMatchObject({ status: 'applied', duration: { kind: 'eot' } });
  // Without the use's strained decision the area's duration is unknown: the table resolves it.
  expect(at()[0]).toMatchObject({ status: 'manual', requirements: ['actor.strained'] });
  const tampered = structuredClone(definition);
  (tampered.sections[0] as AreaNode).spec.riders[0]!.who = { self: false, others: 'ally' };
  expect(resolveCompiledAbility(tampered, { ...rolled }).kind).toBe('manual');
});

const faithfulInput: EffectOnlyInput = {
  actor: { id: 'censor', kind: 'hero', temporaryStamina: 0, surges: 0 },
  targets: [
    { id: 'censor', kind: 'hero', temporaryStamina: 0, surges: 0 },
    { id: 'ally', kind: 'hero', temporaryStamina: 0, surges: 0 },
  ],
  inCombat: true,
  resourcePool: { resource: 'wrath', current: 5, legalFloor: 0 },
};

test('Blessing of the Faithful: one area whose members are the targets, always naming the user', () => {
  const definition = compiled('Blessing of the Faithful');
  const outcome = resolveEffectOnly(definition, faithfulInput);
  if (outcome.kind !== 'resolved') throw new Error(outcome.kind);
  expect(outcome.effects).toEqual([
    expect.objectContaining({
      kind: 'area',
      status: 'applied',
      members: ['censor', 'ally'],
      duration: { kind: 'encounter' },
    }),
  ]);
  expect(outcome.writes).toEqual([]);
  expect(
    resolveEffectOnly(definition, { ...faithfulInput, targets: faithfulInput.targets.slice(1) })
      .kind,
  ).toBe('manual');
  const tampered = structuredClone(definition);
  (tampered.sections[0] as AreaNode).spec.endsWhen = [];
  expect(resolveEffectOnly(tampered, faithfulInput).kind).toBe('manual');
});

test('which members a rider is about: the owner, and allies or enemies by side', () => {
  const owner = { id: 'talent', side: 'heroes' as const };
  expect(riderApplies(enemy, { id: 'goblin', side: 'director' }, owner)).toBe(true);
  expect(riderApplies(enemy, { id: 'thorn', side: 'heroes' }, owner)).toBe(false);
  expect(riderApplies(enemy, owner, owner)).toBe(false);
  expect(riderApplies(selfAndAllies, owner, owner)).toBe(true);
  expect(riderApplies(selfAndAllies, { id: 'thorn', side: 'heroes' }, owner)).toBe(true);
  expect(riderApplies(selfAndAllies, { id: 'goblin', side: 'director' }, owner)).toBe(false);
  expect(riderApplies({ self: true, others: 'none' }, { id: 'thorn', side: 'heroes' }, owner)).toBe(
    false,
  );
});

const entered: Watcher = {
  event: 'area-entered',
  whose: 'subject',
  limit: 'round',
  responses: [fire],
};
function rider(extra: Partial<EffectInstance> = {}): EffectInstance {
  return {
    id: 'rider-1',
    kind: 'watcher',
    sourceUseEventId: 'use-1',
    sourceActorId: 'talent',
    abilityId: 'incinerate',
    abilityName: 'Incinerate',
    actorLabel: 'Seer',
    sourcePath: 'feature/ability/talent/level-1/incinerate.md',
    clause: COLUMN,
    owner: { kind: 'character', id: 'talent', name: 'Seer' },
    subject: { kind: 'foe', id: 'goblin', name: 'Goblin' },
    payload: { kind: 'watcher', text: COLUMN, watcher: entered },
    printedDuration: { kind: 'none' },
    duration: { kind: 'none' },
    endsWhen: [],
    status: 'active',
    registrationIds: [],
    appliedSequence: 1,
    area: { id: 'area-1', holder: { kind: 'character', id: 'talent' }, rider: 0 },
    ...extra,
  };
}

test('enter riders: only their own area, once per combat round per creature, never outside combat', () => {
  const instance = rider();
  expect(
    watches(instance, 'goblin', { event: 'area-entered', creatureId: 'goblin', areaId: 'area-1' }),
  ).toBe(true);
  expect(
    watches(instance, 'goblin', { event: 'area-entered', creatureId: 'goblin', areaId: 'area-2' }),
  ).toBe(false);
  expect(
    watches(instance, 'goblin', { event: 'area-entered', creatureId: 'other', areaId: 'area-1' }),
  ).toBe(false);
  const round1 = { encounterId: 'e', round: 1, turnId: 't1' };
  expect(watcherDue(instance, round1)).toEqual({
    status: 'fire',
    window: { encounterId: 'e', round: 1 },
  });
  // Entered already this round (even on another turn): limited. A new round is a new window.
  const fired = rider({ firings: [{ causeEventId: 'add-1', encounterId: 'e', round: 1 }] });
  expect(watcherDue(fired, { ...round1, turnId: 't2' })).toEqual({ status: 'limited' });
  expect(watcherDue(fired, { encounterId: 'e', round: 2, turnId: 't3' }).status).toBe('fire');
  // "In a combat round" has no window outside combat: the table resolves it.
  expect(watcherDue(instance, {}).status).toBe('manual');
});
