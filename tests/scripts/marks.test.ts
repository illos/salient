// SPDX-License-Identifier: GPL-3.0-only
/**
 * V175 marks, pure parts. Expected values are read from the pinned sources named on each case
 * (Compendium en/unified/md), never from a run of the code under test:
 * - feature/ability/tactician/level-1/mark.md: Maneuver, Ranged 10, One creature; "until the end of
 *   the encounter, until you are dying, or until you use this ability again"; "You can willingly end
 *   your mark"; "if another tactician marks a creature, your mark on that creature ends"; "you and
 *   allies within your line of effect gain an edge on power rolls made against that creature"; "you
 *   can spend 1 focus to gain one of the following benefits as a free triggered action"; the four
 *   benefits, the taunt only "If you damage a creature marked by you with a melee ability"; "You
 *   can't gain more than one benefit from the same trigger."
 * - rule/dice/power-roll.md: a test is a power roll without a target; rule/combat/side.md: heroes and
 *   their allies are one side.
 * - rule/damage/damage-immunity.md and damage-weakness.md: they apply to damage as a whole.
 * - feature/ability/tactician/level-3/hit-em-hard.md and stay-strong-and-focus.md: "whenever you or
 *   any ally deals damage to a target marked by you, that creature gains 2 surges …" / "… the
 *   creature who dealt the damage can spend a Recovery."
 * - Manual: mind-game.md ("You mark the target."), fog-of-war.md and targets-of-opportunity.md
 *   ("Each target is marked by you, and …", "Mark Benefit: …"), level-3/rout.md, frontal-assault.md.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import type { EffectInstance } from '../../shared/contracts/liveState.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import { resolveEffectOnly, type EffectOnlyInput } from '../../shared/resolve/compiledOutcome.ts';
import {
  benefitTaken,
  effectVisibleTo,
  markBenefitOptions,
  planMarkBenefit,
} from '../../shared/resolve/marks.ts';
import { rollContributions, withContributions } from '../../shared/resolve/modifiers.ts';
import { watches } from '../../shared/resolve/watchers.ts';

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
const use = (targets: EffectOnlyInput['targets']): EffectOnlyInput => ({
  actor: { id: 'kell', kind: 'hero', temporaryStamina: 0, surges: 0 },
  targets,
  inCombat: true,
});

test('Mark compiles whole from its printed paragraphs, with the printed lifecycle and benefits', () => {
  const mark = compiled('Mark');
  expect(mark.execution).toBe('supported');
  expect(mark.diagnostics).toEqual([]);
  expect(mark.activation).toEqual({
    actionType: 'maneuver',
    targetShape: { kind: 'one', self: false },
  });
  expect(mark.sections).toHaveLength(1);
  expect(mark.sections[0]).toMatchObject({
    kind: 'mark',
    spec: {
      duration: { kind: 'encounter' },
      endsWhen: ['owner-dying', 'reused', 'willingly-ended'],
      exclusive: 'one-tactician',
      retarget: { actionType: 'free triggered action', distance: 'Ranged 10' },
      edge: { edges: 1, scope: 'power-roll', rollers: 'owner-and-allies' },
      benefit: {
        actionType: 'free triggered action',
        cost: { resource: 'focus', amount: 1 },
        trigger: 'rolled-damage',
        options: ['extra-damage', 'recovery', 'shift', 'taunt'],
        perTrigger: 1,
      },
    },
  });
  const resolved = resolveEffectOnly(mark, use([{ id: 'goblin', kind: 'foe' }]));
  expect(resolved.kind).toBe('resolved');
  expect(resolved.effects).toMatchObject([{ kind: 'mark', status: 'applied', targetId: 'goblin' }]);
  // A squad member holds no mark the engine tracks; an object isn't a creature.
  for (const kind of ['squad', 'object'] as const)
    expect(resolveEffectOnly(mark, use([{ id: 'x', kind }])).effects).toMatchObject([
      { kind: 'mark', status: 'manual' },
    ]);
  // "You aren't an eligible creature target for your own abilities" (rule/combat/target.md).
  expect(resolveEffectOnly(mark, use([{ id: 'kell', kind: 'hero' }])).kind).toBe('manual');
});

test('a changed printed paragraph or a tampered spec leaves the Mark manual', () => {
  const changed = envelope('Mark');
  changed.markdown = changed.markdown.replace('spend 1 focus', 'spend 2 focus');
  expect(compileAbility(changed).execution).toBe('manual');
  const mark = compiled('Mark');
  const node = mark.sections[0]!;
  if (node.kind !== 'mark') throw new Error('expected a mark node');
  const tampered = structuredClone(mark);
  (tampered.sections[0] as typeof node).spec.edge = { ...node.spec.edge, edges: 2 as 1 };
  expect(resolveEffectOnly(tampered, use([{ id: 'goblin', kind: 'foe' }])).kind).toBe('manual');
});

const markOn = (subject: string, owner: string, sequence = 1): EffectInstance => ({
  id: `mark-${owner}-${sequence}`,
  kind: 'mark',
  sourceUseEventId: 'use',
  sourceActorId: owner,
  abilityId: 'mcdm.heroes.v1/feature.ability.tactician.level-1/mark',
  abilityName: 'Mark',
  actorLabel: owner,
  sourcePath: 'vendor/steel-compendium/en/unified/md/feature/ability/tactician/level-1/mark.md',
  clause: 'The target is marked by you.',
  owner: { kind: 'character', id: owner, name: owner },
  subject: { kind: 'foe', id: subject, name: 'Goblin' },
  payload: {
    kind: 'mark',
    text: 'The target is marked by you.',
    mark: { retargetDistance: 'Ranged 10' },
  },
  printedDuration: { kind: 'encounter' },
  duration: { kind: 'encounter' },
  endsWhen: ['owner-dying', 'reused', 'willingly-ended'],
  status: 'active',
  registrationIds: [],
  appliedSequence: sequence,
});

test('the Mark edge: once, for the marker and allies against the marked creature, and excluded by the table', () => {
  const goblin = { id: 'goblin', name: 'Goblin', instances: [markOn('goblin', 'kell')] };
  const roll = (
    roller: { id: string; side: 'heroes' | 'director' },
    exclude: string[] = [],
    test = false,
  ) =>
    rollContributions({
      actor: { id: roller.id, instances: [] },
      targets: [goblin],
      roll: { strike: true, ...(test ? { test } : {}) },
      exclude,
      roller,
    })[0]!.contributions;
  // The marker and an ally each get one edge (rule/dice/edge.md: +2), labelled with both conditions.
  for (const roller of [
    { id: 'kell', side: 'heroes' as const },
    { id: 'thorn', side: 'heroes' as const },
  ]) {
    const [edge, ...rest] = roll(roller);
    expect(rest).toEqual([]);
    expect(edge).toMatchObject({ instanceId: 'mark-kell-1', side: 'target', edges: 1, banes: 0 });
    expect(edge!.text).toMatch(
      /Goblin is within kell's line of effect and the roller is within kell's line of effect/,
    );
    expect(withContributions({ targetId: 'goblin', edges: 0, banes: 0 }, [edge!]).edges).toBe(1);
  }
  // A creature on the other side gets nothing; neither does a test.
  expect(roll({ id: 'orc', side: 'director' })).toEqual([]);
  expect(roll({ id: 'thorn', side: 'heroes' }, [], true)).toEqual([]);
  // Exclusion records the contribution and applies none of it.
  const [excluded] = roll({ id: 'thorn', side: 'heroes' }, ['mark-kell-1']);
  expect(excluded).toMatchObject({ excluded: true });
  expect(withContributions({ targetId: 'goblin', edges: 0, banes: 0 }, [excluded!]).edges).toBe(0);
  // One status: two marks of one owner still give one edge.
  const twice = rollContributions({
    actor: { id: 'thorn', instances: [] },
    targets: [{ ...goblin, instances: [markOn('goblin', 'kell', 1), markOn('goblin', 'kell', 2)] }],
    roll: { strike: true },
    roller: { id: 'thorn', side: 'heroes' },
  })[0]!.contributions;
  expect(twice.map(c => c.edges)).toEqual([1]);
});

test('benefits: the taunt only for your own melee ability; one benefit per trigger; what applies', () => {
  expect(markBenefitOptions({ dealerIsOwner: false, meleeAbility: true })).toEqual([
    'extra-damage',
    'recovery',
    'shift',
  ]);
  expect(markBenefitOptions({ dealerIsOwner: true, meleeAbility: false })).not.toContain('taunt');
  expect(markBenefitOptions({ dealerIsOwner: true, meleeAbility: true })).toContain('taunt');
  expect(benefitTaken([{ triggeringEventId: 'hit-1' }], 'hit-1')).toBe(true);
  expect(benefitTaken([{ triggeringEventId: 'hit-1' }], 'hit-2')).toBe(false);
  const facts = {
    reason: 2,
    target: { damageable: true, immunityOrWeakness: false, name: 'Goblin' },
    dealer: { hero: true, name: 'Thorn' },
    ownerName: 'Kell',
  };
  // "extra damage equal to twice your Reason score": 2 × 2.
  expect(planMarkBenefit('extra-damage', facts)).toEqual({
    kind: 'extra-damage',
    status: 'apply',
    amount: 4,
  });
  // Immunity or weakness applies to the ability's damage as a whole: the table adds it.
  expect(
    planMarkBenefit('extra-damage', {
      ...facts,
      target: { ...facts.target, immunityOrWeakness: true },
    }),
  ).toMatchObject({ status: 'instruction' });
  expect(planMarkBenefit('recovery', facts)).toEqual({ kind: 'recovery', status: 'apply' });
  expect(
    planMarkBenefit('recovery', { ...facts, dealer: { hero: false, name: 'Ally' } }),
  ).toMatchObject({
    status: 'instruction',
  });
  expect(planMarkBenefit('shift', facts)).toMatchObject({
    status: 'instruction',
    text: expect.stringContaining('up to 2 squares'),
  });
  expect(planMarkBenefit('taunt', facts)).toMatchObject({ status: 'instruction' });
});

test("Hit 'Em Hard! and Stay Strong and Focus! watch damage to the owner's marked creatures", () => {
  const hit = compiled("Hit 'Em Hard!");
  expect(hit.execution).toBe('supported');
  expect(hit.activation).toMatchObject({
    fixedCost: { resource: 'focus', amount: 7 },
    targetShape: { kind: 'self' },
  });
  expect(hit.sections).toMatchObject([
    {
      kind: 'watcher',
      spec: {
        subject: 'owner',
        watcher: {
          event: 'marked-damaged',
          whose: 'owner',
          limit: 'each',
          responses: [{ kind: 'gain', recipient: 'dealer', surges: 2 }],
        },
        duration: { kind: 'encounter' },
        endsWhen: ['owner-dying'],
      },
    },
  ]);
  const stay = compiled('Stay Strong and Focus!');
  expect(stay.execution).toBe('supported');
  expect(stay.sections).toMatchObject([
    {
      kind: 'watcher',
      spec: {
        watcher: {
          event: 'marked-damaged',
          responses: [
            {
              kind: 'instruction',
              text: 'the creature who dealt the damage can spend a Recovery.',
            },
          ],
        },
      },
    },
  ]);
  const node = hit.sections[0]!;
  if (node.kind !== 'watcher') throw new Error('expected a watcher');
  const instance = {
    ...markOn('kell', 'kell'),
    kind: 'watcher',
    subject: { kind: 'character', id: 'kell', name: 'Kell' },
    payload: {
      kind: 'watcher',
      text: node.spec.text,
      watcher: { ...node.spec.watcher, responses: [] },
    },
  } as EffectInstance;
  expect(
    watches(instance, 'kell', { event: 'marked-damaged', creatureId: 'kell', otherId: 'thorn' }),
  ).toBe(true);
  expect(
    watches(instance, 'kell', { event: 'marked-damaged', creatureId: 'rival', otherId: 'thorn' }),
  ).toBe(false);
});

test('other mark sources stay manual with the precise missing piece', () => {
  const reasons = (name: string) =>
    compiled(name)
      .diagnostics.filter(d => d.code === 'mark-manual')
      .map(d => d.message);
  expect(compiled('Mind Game').execution).toBe('manual');
  expect(reasons('Mind Game')).toEqual([
    expect.stringContaining('Q-MARK-1'),
    expect.stringContaining('once-only limit'),
  ]);
  for (const name of ['Fog of War', 'Targets of Opportunity']) {
    expect(compiled(name).execution).toBe('manual');
    expect(reasons(name).some(r => r.includes('paid response to a strike'))).toBe(true);
  }
  expect(reasons('Rout')).toEqual([
    expect.stringContaining('frightened of the creature who dealt the damage'),
  ]);
  expect(reasons('Frontal Assault')).toEqual([expect.stringContaining('Charge substitution')]);
});

test('players see marks: the one visibility rule', () => {
  expect(effectVisibleTo('mark', 'player')).toBe(true);
  expect(effectVisibleTo('mark', 'observer')).toBe(true);
  expect(effectVisibleTo('mark', 'director')).toBe(true);
  expect(effectVisibleTo('modifier', 'player')).toBe(true);
});
