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
      corpus.find(e => e.name === name)!,
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
