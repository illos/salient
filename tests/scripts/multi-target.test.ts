// SPDX-License-Identifier: GPL-3.0-only
// V110: counted and area envelopes. Expected values are read from the pinned source cited per test.
import { expect, test } from 'vitest';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import {
  resolveCompiledAbility,
  type CompiledAbilityInput,
} from '../../shared/resolve/compiledOutcome.ts';
import { effectRider } from '../../shared/resolve/abilityGrammar.ts';

const inputs = readInputs();
const corpus = buildCorpus(inputs).envelopes;
const envelope = (name: string, parent?: RegExp) =>
  structuredClone(
    compilerEnvelope(
      corpus.find(e => e.name === name && (!parent || parent.test(e.parent ?? '')))!,
      inputs,
    ),
  );
const target = (targetId: string, stamina = 40) => ({
  targetId,
  kind: 'foe' as const,
  stamina,
  maxStamina: stamina,
  temporaryStamina: 0,
  immunities: [],
  weaknesses: [],
});
// Each ability below has a printed fixed cost; a recorded pool of 10 affords it.
const facts = (
  resource: string,
  ids: string[],
  edges: number[] = ids.map(() => 0),
): CompiledAbilityInput => ({
  actor: { actorId: 'hero', characteristics: { M: 2, A: 2, R: 2, I: 2, P: 2 } },
  targets: ids.map((targetId, i) => ({ targetId, edges: edges[i]!, banes: 0 })),
  targetFacts: ids.map(id => target(id)),
  dice: { d10a: 7, d10b: 7 },
  inCombat: true,
  resourcePool: { resource, current: 10, legalFloor: 0 },
});

// feature/ability/troubadour/level-1/quick-rewrite.md: Area, 3 cube within 10, each enemy in the
// area; Presence roll; 4/5/6 damage; P < WEAK/AVERAGE slowed, P < STRONG restrained (save ends);
// Effect: the area is difficult terrain for enemies. 7 + 7 + P2 = 16 is tier 2; one edge (+2) is
// 18, tier 3 (rule/dice/edge.md). rule/dice/ability-roll.md: one roll, each target's own tier;
// tier effects follow all damage; an effect on the user or area occurs once.
test('one area roll resolves each target at its own tier, then conditions, then one area rider', () => {
  const definition = compileAbility(envelope('Quick Rewrite'));
  expect(definition.execution).toBe('supported');
  const input = facts('drama', ['a', 'b'], [0, 1]);
  input.conditionFacts = {
    potency: { characteristic: 'P', weak: 0, average: 1, strong: 2 },
    targets: [
      { targetId: 'a', kind: 'foe', characteristics: { P: 0 } },
      { targetId: 'b', kind: 'foe', characteristics: { P: 2 } },
    ],
  };
  const result = resolveCompiledAbility(definition, input);
  if (result.kind !== 'resolved') throw new Error(result.kind);
  expect(result.roll.targets.map(t => t.tier)).toEqual([2, 3]);
  expect(result.roll.damageApplications.map(a => [a.targetId, 40 - a.staminaAfter])).toEqual([
    ['a', 5],
    ['b', 6],
  ]);
  expect(result.effects.map(e => `${e.kind}:${e.targetId}`)).toEqual([
    'damage:a',
    'damage:b',
    'condition:a',
    'condition:b',
    'rider:a',
  ]);
  // P0 < AVERAGE 1 applies slowed; P2 is not below STRONG 2, so restrained is resisted.
  expect(result.effects[2]).toMatchObject({ condition: 'slowed', status: 'applied', threshold: 1 });
  expect(result.effects[3]).toMatchObject({
    condition: 'restrained',
    status: 'resisted',
    threshold: 2,
  });
  expect(result.effects.filter(e => e.kind === 'rider')).toHaveLength(1);
});

// rule/combat/target.md: the Target entry is the number that can be targeted; fewer is allowed.
// feature/ability/shadow/level-1/two-throats-at-once.md: two creatures or objects; 4/6/10 damage.
test('a counted envelope accepts up to its printed number of distinct targets', () => {
  const definition = compileAbility(envelope('Two Throats at Once'));
  expect(definition.execution).toBe('supported');
  for (const ids of [['a'], ['a', 'b']]) {
    const result = resolveCompiledAbility(definition, facts('insight', ids));
    if (result.kind !== 'resolved') throw new Error(result.kind);
    expect(result.roll.damageApplications.map(a => 40 - a.staminaAfter)).toEqual(ids.map(() => 6));
  }
  for (const ids of [[], ['a', 'b', 'c'], ['a', 'a']])
    expect(resolveCompiledAbility(definition, facts('insight', ids)).kind).toBe('manual');
});

// monster/goblin/statblock/goblin-assassin.md, Shadow Chains (3 Malice): three creatures; Power
// Roll + 2; 2/4/5 corruption damage; A < 0/1/2 restrained (save ends). 7 + 7 + 2 = 16 is tier 2.
test('printed foe thresholds apply per target on a three-target foe ability', () => {
  const definition = compileAbility(envelope('Shadow Chains', /goblin-assassin/));
  expect(definition.execution).toBe('supported');
  const input = facts('malice', ['a', 'b', 'c']);
  input.actor = { actorId: 'assassin', characteristics: { M: 0, A: 0, R: 0, I: 0, P: 0 } };
  input.conditionFacts = {
    targets: [
      { targetId: 'a', kind: 'hero', characteristics: { A: 0 } },
      { targetId: 'b', kind: 'hero', characteristics: { A: 1 } },
      { targetId: 'c', kind: 'squad' },
    ],
  };
  const result = resolveCompiledAbility(definition, input);
  if (result.kind !== 'resolved') throw new Error(result.kind);
  expect(result.roll.targets.map(t => t.tier)).toEqual([2, 2, 2]);
  expect(result.roll.damageApplications.map(a => 40 - a.staminaAfter)).toEqual([4, 4, 4]);
  expect(
    result.effects.filter(e => e.kind === 'condition').map(c => [c.targetId, c.status]),
  ).toEqual([
    ['a', 'applied'],
    ['b', 'resisted'],
    ['c', 'fact-needed'],
  ]);
});

// rule/dice/ability-roll.md: with several targets tiers can differ and the user chooses the tier
// for an effect on themselves, so sections written about "the target" stay manual there.
test('target-subject sections stay manual on counted envelopes but not on one target', () => {
  const text = 'The target is taunted until the end of their next turn.';
  expect(effectRider(text)).toMatchObject({ shape: 'taunt', subject: 'target' });
  expect(effectRider('The area is difficult terrain for enemies.')).toMatchObject({
    subject: 'use',
  });
  const multi = envelope('Two Throats at Once');
  multi.blocks.push({ kind: 'section', label: 'Effect', text });
  multi.markdown += `\n\n**Effect:** ${text}`;
  const definition = compileAbility(multi);
  expect(definition.execution).toBe('manual');
  expect(definition.sections).toEqual([
    expect.objectContaining({ kind: 'unsupported', clause: text }),
  ]);
  expect(definition.diagnostics.map(d => d.code)).toEqual(['manual-section']);
  const single = compileAbility(envelope('Instigator'));
  expect(single.sections).toEqual([expect.objectContaining({ kind: 'rider', shape: 'taunt' })]);
});

test('self, unknown and inconsistent Area envelopes keep the target boundary', () => {
  const area = envelope('Two Throats at Once');
  area.keywords = [...area.keywords, 'Area'];
  const self = envelope('Two Throats at Once');
  self.target = 'Self';
  const unknown = envelope('Two Throats at Once');
  unknown.target = 'One creature or object per minion';
  for (const changed of [area, self, unknown])
    expect(compileAbility(changed).diagnostics.map(d => d.code)).toContain('target-boundary');
});
