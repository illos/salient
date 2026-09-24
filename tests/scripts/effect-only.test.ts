// SPDX-License-Identifier: GPL-3.0-only
/**
 * V157 abilities without a power roll. Expected values are read from the pinned Compendium files
 * named on each case (en/unified/md), never from a run of the compiler or resolver.
 */
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility, type CompiledAbility } from '../../shared/resolve/compileAbility.ts';
import {
  effectOnlyClause,
  effectOnlyTarget,
  readEffectOnlySection,
} from '../../shared/resolve/effectOnly.ts';
import {
  resolveEffectOnly,
  type EffectOnlyInput,
  type EffectOnlyRecipient,
} from '../../shared/resolve/compiledOutcome.ts';

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
const hero = (id: string, temporaryStamina = 0, surges = 0): EffectOnlyRecipient => ({
  id,
  kind: 'hero',
  temporaryStamina,
  surges,
});
const use = (
  actor: EffectOnlyRecipient,
  targets: EffectOnlyRecipient[],
  pool?: { resource: string; current: number },
): EffectOnlyInput => ({
  actor,
  targets,
  inCombat: true,
  ...(pool ? { resourcePool: { ...pool, legalFloor: 0 } } : {}),
});

test('whole sentences only: a changed wording, an added sentence or a zero amount is refused', () => {
  // fury/level-3/steelbreaker.md, conduit/level-3/saints-raiment.md, tactician/level-1/now.md.
  expect(readEffectOnlySection('You gain 20 temporary Stamina.')).toMatchObject([
    { clause: { kind: 'gain', subject: 'actor', temporaryStamina: 20 } },
  ]);
  expect(
    readEffectOnlySection('The target gains 20 temporary Stamina and 3 surges.'),
  ).toMatchObject([
    { clause: { kind: 'gain', subject: 'target', temporaryStamina: 20, surges: 3 } },
  ]);
  expect(readEffectOnlySection('Each target can make a free strike.')).toMatchObject([
    { clause: { kind: 'instruction', subject: 'target', shape: 'free-strike' } },
  ]);
  for (const text of [
    'You gain 20 temporary Stamina. You gain 1 surge. Each enemy is frightened.',
    'You gain 20 temporary Stamina and can shift 2 squares.',
    'You gain 0 temporary Stamina.',
    'Each target can make a free strike that deals extra damage equal to your Might score.',
    'Each target can spend a Recovery. Additionally, each target can shift 1 square.',
    'you gain 20 temporary Stamina.',
    'You gain 20 temporary Stamina',
  ])
    expect(readEffectOnlySection(text), text).toBeUndefined();
  // A stored clause re-reads as exactly one sentence pattern.
  expect(effectOnlyClause('You gain 20 temporary Stamina.')).toBeDefined();
  expect(effectOnlyClause('You gain 20 temporary Stamina. You gain 1 surge.')).toBeUndefined();
});

test('the effect-only target reader (rule/combat/target.md)', () => {
  expect(effectOnlyTarget('Self', [])).toEqual({ kind: 'self' });
  expect(effectOnlyTarget('One ally', ['Magic'])).toEqual({ kind: 'one', self: false });
  expect(effectOnlyTarget('Self or one ally', [])).toEqual({ kind: 'one', self: true });
  expect(effectOnlyTarget('Three allies', [])).toEqual({ kind: 'allies', max: 3, self: false });
  expect(effectOnlyTarget('Self and two allies', [])).toEqual({
    kind: 'allies',
    max: 2,
    self: true,
  });
  expect(effectOnlyTarget('Each ally in the area', ['Area', 'Magic'])).toEqual({ kind: 'area' });
  expect(effectOnlyTarget('Each enemy in the area', ['Area'])).toBeUndefined();
  expect(effectOnlyTarget('Self and each ally in the area', ['Area'])).toBeUndefined();
  expect(effectOnlyTarget('One willing ally', [])).toBeUndefined();
});

// Each admitted ability, its printed action and cost (frontmatter of the pinned file under
// feature/ability/) and the nodes its Effect section gives.
test.each([
  ['Steelbreaker', 'maneuver', { resource: 'ferocity', amount: 7 }, [['gain', 'actor']]],
  ["Saint's Raiment", 'maneuver', { resource: 'piety', amount: 7 }, [['gain', 'target']]],
  [
    'Now!',
    'maneuver',
    { resource: 'focus', amount: 5 },
    [['instruction', 'target', 'free-strike']],
  ],
  [
    'Squad! Forward!',
    'maneuver',
    { resource: 'focus', amount: 3 },
    [['instruction', 'target', 'move']],
  ],
  [
    'Sermon of Grace',
    'main action',
    { resource: 'piety', amount: 5 },
    [['instruction', 'target', 'recovery']],
  ],
  [
    'Shadowstrike',
    'main action',
    { resource: 'insight', amount: 5 },
    [['instruction', 'actor', 'ability-use']],
  ],
  [
    'Blur',
    'maneuver',
    { resource: 'discipline', amount: 5 },
    [['instruction', 'actor', 'ability-use']],
  ],
] as const)('%s compiles as effect-only', (name, actionType, fixedCost, nodes) => {
  const definition = compiled(name);
  expect(definition.diagnostics).toEqual([]);
  expect(definition.execution).toBe('supported');
  expect(definition.effectOnly).toBe(true);
  expect(definition.metadata).toBeUndefined();
  expect(definition.activation).toMatchObject({ actionType });
  expect(definition.activation!.fixedCost).toEqual(fixedCost);
  expect(definition.tiers).toEqual([[], [], []]);
  expect(
    definition.sections.map(node => [
      node.kind,
      'subject' in node ? node.subject : undefined,
      ...(node.kind === 'instruction' ? [node.shape] : []),
    ]),
  ).toEqual(nodes);
});

test('Steelbreaker gains 20 temporary Stamina for the actor, keeping a greater amount', () => {
  // fury/level-3/steelbreaker.md: 7 Ferocity, "You gain 20 temporary Stamina."
  // rule/health/temporary-stamina.md: "you get whichever amount of temporary Stamina is greater".
  const definition = compiled('Steelbreaker');
  const fresh = resolveEffectOnly(
    definition,
    use(hero('fury', 5, 1), [hero('fury', 5, 1)], { resource: 'ferocity', current: 7 }),
  );
  expect(fresh).toMatchObject({
    kind: 'resolved',
    cost: { resource: 'ferocity', amount: 7, before: 7, after: 0, waived: false },
    writes: [{ id: 'fury', temporaryStamina: 20, surges: 1 }],
  });
  if (fresh.kind !== 'resolved') throw new Error('unresolved');
  expect(fresh.effects).toEqual([
    expect.objectContaining({
      kind: 'gain',
      status: 'applied',
      targetId: 'fury',
      temporaryStamina: 20,
      application: { temporaryStaminaBefore: 5, temporaryStaminaAfter: 20 },
    }),
  ]);
  const greater = resolveEffectOnly(
    definition,
    use(hero('fury', 25), [hero('fury', 25)], { resource: 'ferocity', current: 9 }),
  );
  expect(greater).toMatchObject({ writes: [{ id: 'fury', temporaryStamina: 25, surges: 0 }] });
  // Unaffordable: 6 Ferocity < 7; nothing is resolved.
  expect(
    resolveEffectOnly(
      definition,
      use(hero('fury'), [hero('fury')], { resource: 'ferocity', current: 6 }),
    ),
  ).toMatchObject({ kind: 'blocked', effects: [] });
});

test("Saint's Raiment gives the target 20 temporary Stamina and 3 surges", () => {
  // conduit/level-3/saints-raiment.md: 7 Piety, One ally, "The target gains 20 temporary Stamina
  // and 3 surges." Surges add (rule/resource/surge.md).
  const definition = compiled("Saint's Raiment");
  const outcome = resolveEffectOnly(
    definition,
    use(hero('conduit'), [hero('ally', 4, 2)], { resource: 'piety', current: 8 }),
  );
  expect(outcome).toMatchObject({
    kind: 'resolved',
    cost: { before: 8, after: 1 },
    writes: [{ id: 'ally', temporaryStamina: 20, surges: 5 }],
    effects: [
      {
        kind: 'gain',
        status: 'applied',
        targetId: 'ally',
        temporaryStamina: 20,
        surges: 3,
        application: {
          temporaryStaminaBefore: 4,
          temporaryStaminaAfter: 20,
          surgesBefore: 2,
          surgesAfter: 5,
        },
      },
    ],
  });
  // A foe carries no surge counter: the gain stays manual and nothing is written.
  const foe = resolveEffectOnly(
    definition,
    use(hero('conduit'), [{ id: 'goblin', kind: 'foe' }], { resource: 'piety', current: 8 }),
  );
  expect(foe).toMatchObject({ writes: [], effects: [{ kind: 'gain', status: 'manual' }] });
  // "One ally": the user is not an eligible target, and only one creature can be named.
  for (const targets of [[hero('conduit')], [hero('a'), hero('b')], []])
    expect(
      resolveEffectOnly(
        definition,
        use(hero('conduit'), targets, { resource: 'piety', current: 8 }),
      ).kind,
    ).toBe('manual');
});

test('Now! records one free-strike instruction per ally and changes nothing', () => {
  // tactician/level-1/now.md: 5 Focus, Three allies, "Each target can make a free strike."
  const definition = compiled('Now!');
  const focus = { resource: 'focus', current: 5 };
  const outcome = resolveEffectOnly(
    definition,
    use(hero('tactician'), [hero('a'), hero('b'), hero('c')], focus),
  );
  if (outcome.kind !== 'resolved') throw new Error(outcome.kind);
  expect(outcome.writes).toEqual([]);
  expect(outcome.cost).toMatchObject({ resource: 'focus', amount: 5, before: 5, after: 0 });
  expect(outcome.effects.map(e => [e.kind, e.targetId, e.status])).toEqual([
    ['rider', 'a', 'manual'],
    ['rider', 'b', 'manual'],
    ['rider', 'c', 'manual'],
  ]);
  expect(outcome.effects[0]).toMatchObject({
    shape: 'free-strike',
    tier: true,
    clause: 'Each target can make a free strike.',
  });
  // Three allies at most, never the user.
  expect(
    resolveEffectOnly(
      definition,
      use(hero('t'), [hero('a'), hero('b'), hero('c'), hero('d')], focus),
    ).kind,
  ).toBe('manual');
  expect(resolveEffectOnly(definition, use(hero('t'), [hero('t')], focus)).kind).toBe('manual');
  // tactician/level-1/squad-forward.md, 3 Focus, "Self and two allies": the user and two others.
  const squad = compiled('Squad! Forward!');
  const three = { resource: 'focus', current: 3 };
  expect(
    resolveEffectOnly(squad, use(hero('t'), [hero('t'), hero('a'), hero('b')], three)).kind,
  ).toBe('resolved');
  expect(
    resolveEffectOnly(squad, use(hero('t'), [hero('a'), hero('b'), hero('c')], three)).kind,
  ).toBe('manual');
});

test('tampering with a saved definition is refused', () => {
  const steel = compiled('Steelbreaker');
  const facts = use(hero('fury'), [hero('fury')], { resource: 'ferocity', current: 7 });
  const tampered = (change: (d: CompiledAbility) => void) => {
    const copy = structuredClone(steel);
    change(copy);
    return resolveEffectOnly(copy, facts).kind;
  };
  expect(resolveEffectOnly(steel, facts).kind).toBe('resolved');
  expect(
    tampered(d => {
      (d.sections[0] as { temporaryStamina: number }).temporaryStamina = 200;
    }),
  ).toBe('manual');
  expect(
    tampered(d => {
      d.sections[0]!.clause = 'You gain 200 temporary Stamina.';
    }),
  ).toBe('manual');
  expect(
    tampered(d => {
      (d.sections[0] as { subject: string }).subject = 'target';
    }),
  ).toBe('manual');
  expect(tampered(d => d.sections.push(structuredClone(d.sections[0]!)))).toBe('manual');
  expect(
    tampered(d => {
      d.activation!.fixedCost = { resource: 'ferocity', amount: 1 };
    }),
  ).toBe('manual');
  expect(
    tampered(d => {
      d.activation!.targetShape = { kind: 'area' };
    }),
  ).toBe('manual');
  expect(
    tampered(d => {
      d.envelope.target = 'Three allies';
    }),
  ).toBe('manual');
  const now = compiled('Now!');
  const shape = structuredClone(now);
  (shape.sections[0] as { shape: string }).shape = 'recovery';
  const focus = { resource: 'focus', current: 5 };
  expect(resolveEffectOnly(now, use(hero('t'), [hero('a')], focus)).kind).toBe('resolved');
  expect(resolveEffectOnly(shape, use(hero('t'), [hero('a')], focus)).kind).toBe('manual');
});

test('triggered actions and abilities with Spend or Strained sections stay manual', () => {
  // conduit/level-1/healing-grace.md: Effect "The target can spend a Recovery." and a Spend section.
  // troubadour/level-1/riposte.md and censor/level-2/prescient-grace.md: triggered actions.
  // talent/level-1/iron.md: a Strained section. shadow/level-1/coat-the-blade.md: a Spend section.
  for (const name of ['Healing Grace', 'Riposte', 'Iron', 'Coat the Blade', 'Prescient Grace']) {
    const definition = compiled(name);
    expect(definition.effectOnly, name).toBeUndefined();
    expect(definition.execution, name).toBe('manual');
    expect(
      definition.diagnostics.map(d => d.code),
      name,
    ).toContain('grammar');
  }
  // Steelbreaker with an added Strained section, or as a triggered action, is not read.
  const strained = envelope('Steelbreaker');
  strained.blocks.push({ kind: 'section', label: 'Strained', text: 'You gain 1 surge.' });
  expect(compileAbility(strained).effectOnly).toBeUndefined();
  const triggered = envelope('Steelbreaker');
  triggered.usage = 'Triggered action';
  expect(compileAbility(triggered).effectOnly).toBeUndefined();
  expect(compileAbility(triggered).execution).toBe('manual');
});
