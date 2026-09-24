// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import { effectRider, plain } from '../../shared/resolve/abilityGrammar.ts';
const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const envelope = (name: string) =>
  structuredClone(
    compilerEnvelope(
      // A griffon foe shares Wing Buffet's name; the Corven kit signature is the V152 witness.
      corpus.find(
        e => e.name === name && (name !== 'Wing Buffet' || e.corpus === 'kit-signature'),
      )!,
      inputs,
    ),
  );
const facts: CompiledAbilityInput = {
  actor: {
    actorId: 'hero',
    characteristics: { M: 2, A: 2, R: 2, I: 2, P: 2 },
    kitMeleeDamageBonus: [1, 1, 1],
    kitRangedDamageBonus: [0, 0, 4],
  },
  targets: [{ targetId: 'target', edges: 0, banes: 0 }],
  dice: { d10a: 7, d10b: 7 },
  inCombat: false,
  targetFacts: [
    {
      targetId: 'target',
      kind: 'hero',
      stamina: 50,
      maxStamina: 50,
      temporaryStamina: 0,
      immunities: [],
      weaknesses: [],
    },
  ],
};

// All pinned whole-section examples, not counts inferred from the changed compiler.
test.each([
  ['Behold a Shield of Faith!', 'bane'],
  ['Driving Assault', 'push-followup'],
  ['The Gods Punish and Defend', 'recovery'],
  ['Blessed Light', 'surges'],
  ['Drain', 'recovery'],
  ["Warrior's Prayer", 'temporary-stamina'],
  ['Grasp of Beyond', 'teleport'],
  ['Hit and Run', 'shift'],
  ['Inertial Step', 'shift'],
  ['Get In Get Out', 'shift'],
  ['Instigator', 'taunt'],
  ['Come On!', 'free-strike'],
  ['I Feed On Your Pain!', 'surges'],
  ['Command Saber', 'free-strike'],
  // V152, pinned sources named in shared/resolve/effectRiders.ts.
  ['Your Allies Cannot Save You!', 'forced-movement'],
  ['Lightfall', 'teleport'],
  ['Sacrificial Offer', 'bane'],
  ['Soul Siphon', 'recovery'],
  ['Words of Wrath and Grace', 'recovery'],
  ['Afflict a Bountiful Decay', 'end-effect'],
  ['Test of Rain', 'end-effect'],
  ['The Green Within, the Green Without', 'forced-movement'],
  ['A Squad Unto Myself', 'shift'],
  ['Dance of Blows', 'forced-movement'],
  ['Disorienting Strike', 'push-followup'],
  ['Misdirecting Strike', 'taunt'],
  ["I've Got Your Back", 'recovery'],
  ['Choke', 'forced-movement'],
  ['En Garde!', 'free-strike'],
  ['Infernal Gavotte', 'shift'],
  ['Wing Buffet', 'shift'],
  ["Let's Dance", 'push-followup'],
])('%s retains a whole source-linked manual %s rider', (name, shape) => {
  const definition = compileAbility(envelope(name));
  expect(definition.execution).toBe('supported');
  expect(definition.sections).toHaveLength(1);
  expect(definition.sections[0]).toMatchObject({ kind: 'rider', shape });
  const source = definition.envelope.blocks.find(b => b.kind === 'section');
  expect(definition.sections[0]!.clause).toBe(source?.kind === 'section' ? source.text : undefined);
});

test.each([
  'Ray of Wrath',
  'Hurl Element',
  "Summoner's Sword",
  'Method Acting',
  'I Work Better Alone',
  'Teamwork Has Its Place',
  'Censored',
  'Phase Inversion Strike',
  'Tide of Death',
  'Pain for Pain',
  'Patient Shot',
  'Devastating Rush',
])('%s does not bypass its current-outcome modifier', name => {
  const definition = compileAbility(envelope(name));
  expect(definition.execution).toBe('manual');
  expect(definition.sections.some(n => n.kind === 'unsupported')).toBe(true);
});

// V152 exclusions. Call the Thunder Down's "the same distance" reads each target's tier push;
// Thunder Roar orders the tier pushes on an area; Ripples in the Earth's use requirement would
// only be shown after the roll it gates.
test.each(['Call the Thunder Down', 'Thunder Roar', 'Ripples in the Earth'])(
  '%s keeps its Effect section manual',
  name => {
    const definition = compileAbility(envelope(name));
    expect(definition.execution).toBe('manual');
    expect(definition.sections.some(n => n.kind === 'unsupported')).toBe(true);
  },
);

test('V152 dependencies follow the printed reader', () => {
  const choke = compileAbility(envelope('Choke')).sections[0]!;
  expect(choke).toMatchObject({ kind: 'rider', dependency: 'after-effects' });
  expect(compileAbility(envelope('Disorienting Strike')).sections[0]).toMatchObject({
    dependency: 'after-movement',
  });
  expect(compileAbility(envelope('Soul Siphon')).sections[0]).toMatchObject({
    dependency: 'independent',
  });
  // Whole-sentence admission: a changed amount or an added clause is not the printed rider.
  expect(
    effectRider('Each ally in the area can spend a Recovery and gain 5 surges.'),
  ).toBeUndefined();
  expect(
    effectRider(
      'You can slide one adjacent enemy up to a number of squares equal to your Luck score.',
    ),
  ).toBeUndefined();
});

// talent/level-1/choke.md: "If the target is made restrained by this ability, this forced movement
// ignores their stability." Tier 3 is "8 + R damage; M < STRONG, restrained (save ends)"; dice 10 + 10
// with R2 is tier 3. The rider must wait for that restrained outcome, not only for damage.
test('Choke waits for the restrained outcome it reads', () => {
  const definition = compileAbility(envelope('Choke'));
  const tier3 = {
    ...facts,
    dice: { d10a: 10, d10b: 10 },
    resourcePool: { resource: 'clarity', current: 3 },
  };
  const unknown = resolveCompiledAbility(definition, tier3);
  if (unknown.kind !== 'resolved') throw new Error('Missing result');
  const condition = unknown.effects.find(e => e.kind === 'condition')!;
  expect(condition).toMatchObject({ condition: 'restrained', status: 'fact-needed' });
  expect(unknown.effects.find(e => e.kind === 'rider')).toMatchObject({
    status: 'fact-needed',
    requirements: [`condition:${condition.nodeId}.outcome`],
    after: expect.arrayContaining([condition.nodeId]),
  });
  const known = resolveCompiledAbility(definition, {
    ...tier3,
    conditionFacts: {
      targets: [{ targetId: 'target', kind: 'hero', characteristics: { M: 0 } }],
      potency: { characteristic: 'R', weak: 0, average: 1, strong: 2 },
    },
  });
  if (known.kind !== 'resolved') throw new Error('Missing result');
  expect(known.effects.find(e => e.kind === 'condition')).toMatchObject({ status: 'applied' });
  expect(known.effects.find(e => e.kind === 'rider')).toMatchObject({
    status: 'manual',
    requirements: [],
  });
});

test('whole text, explicit Effect label, and printed after-roll position bound admission', () => {
  const e = envelope('Blessed Light');
  const section = e.blocks.find(b => b.kind === 'section')!;
  if (section.kind !== 'section') throw new Error('Missing section');
  expect(effectRider(plain(section.text) + ' This strike deals 10 extra damage.')).toBeUndefined();
  const changed = structuredClone(e);
  changed.blocks = [section, ...e.blocks.filter(b => b !== section)];
  expect(compileAbility(changed).execution).toBe('manual');
  section.label = 'Spend 1 Piety';
  expect(compileAbility(e).sections[0]!.kind).toBe('unsupported');
  expect(effectRider('You gain 1 surge before making the power roll.')).toBeUndefined();
});

test('after-damage readers wait for completion and never award state or disclose damage facts', () => {
  const definition = compileAbility(envelope('Blessed Light'));
  for (const complete of [true, false]) {
    const result = resolveCompiledAbility(definition, {
      ...facts,
      targetFacts: complete ? facts.targetFacts : [],
    });
    expect(result.kind).toBe('resolved');
    if (result.kind !== 'resolved') throw new Error('Missing result');
    expect(result.effects.map(e => e.kind)).toEqual(['damage', 'rider']);
    expect(result.effects[1]).toMatchObject({
      kind: 'rider',
      status: complete ? 'manual' : 'fact-needed',
      dependency: 'after-damage',
      after: [result.effects[0]!.nodeId],
    });
    expect(result.roll.damageApplications).toHaveLength(complete ? 1 : 0);
    if (complete) expect(result.roll.damageApplications[0]!.staminaAfter).toBe(43); // tier2 5+I2 holy; no Weapon kit bonus.
  }
});

// Printed kit damage already includes the kit's own bonuses. These must never be added twice.
test.each([
  ['Hamstring Shot', 7, 0],
  ["Raider's Awe", 8, 1],
  ['Protective Attack', 10, 1],
  ['Fancy Footwork', 9, 1],
  ['Driving Pounce', 9, 1],
])('%s admits declared kit flavor and includes printed kit damage once', (name, damage, riders) => {
  const definition = compileAbility(envelope(name));
  expect(definition.execution).toBe('supported');
  expect(definition.metadata!.kitBonusesIncluded).toBe(true);
  const result = resolveCompiledAbility(definition, facts);
  expect(result.kind).toBe('resolved');
  if (result.kind !== 'resolved') throw new Error('Missing result');
  expect(result.roll.damageApplications[0]!.staminaAfter).toBe(50 - damage);
  expect(result.effects.filter(e => e.kind === 'rider')).toHaveLength(riders);
  const extra = envelope(name);
  extra.markdown += '\n\n*Deal 99 extra damage.*';
  expect(compileAbility(extra).execution).toBe('manual');
});
