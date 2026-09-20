// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { liveCompiledSupportReport } from '../../scripts/report-live-compiled-abilities.ts';
import { buildCorpus, readInputs } from '../../scripts/audit-ability-grammar.ts';
import { compilerEnvelope } from '../../scripts/report-compiled-abilities.ts';
import { compileAbility } from '../../shared/resolve/compileAbility.ts';
import { resolveCompiledAbility } from '../../shared/resolve/compiledOutcome.ts';

// This inventory assertion catches an unnoticed new live migration; it is not runtime dispatch.
test('V72 availability follows current grants and loading, not catalog presence', () => {
  const report = liveCompiledSupportReport();
  expect(
    report.entries
      .filter(e => e.live === 'compiled')
      .map(e => e.name)
      .sort(),
  ).toEqual([
    // V02 widened public loading to every seeded stat block (goblin and dwarf families), so the
    // Worg's Bite is now reachable through /foe add; the Ghoul remains unseeded.
    'Bite',
    'Brutal Slam',
    'Bury the Point',
    'Eye of Surlach',
    'Melee Weapon Free Strike',
    'Ranged Weapon Free Strike',
    'Spear Charge',
    'The Wode Defends',
    'Viscous Fire',
  ]);
  expect(
    report.entries
      .filter(e => e.execution === 'supported' && e.live === 'not-reachable')
      .map(e => e.name)
      .sort(),
  ).toEqual([
    'Bola Knock',
    'Eye Flash',
    'Meteoric Introduction',
    'Power Chord',
    'Ray of Agonizing Self-Reflection',
    'Razor Claws',
  ]);
});

// Pinned Ghoul and Worg source: fixed +2 roll, constant 3/4/5 damage. No Agility damage bonus.
// These comparisons add no live creature or grant and execute none of the parent traits.
test.each([
  ['Razor Claws', /\/ghoul$/],
  ['Bite', /\/worg$/],
] as const)(
  '%s remains an independently checked compile-only constant-damage example',
  (name, parent) => {
    const inputs = readInputs();
    const source = buildCorpus(inputs).envelopes.find(
      e => e.name === name && parent.test(e.parent ?? ''),
    )!;
    const definition = compileAbility(compilerEnvelope(source, inputs));
    expect(definition.execution).toBe('supported');
    for (const [a, b, tier, damage] of [
      [4, 5, 1, 3],
      [7, 7, 2, 4],
      [8, 7, 3, 5],
    ] as const) {
      const outcome = resolveCompiledAbility(definition, {
        actor: { actorId: 'source', characteristics: { M: 0, A: 2, R: -2, I: 0, P: -1 } },
        targets: [{ targetId: 'hero', edges: 0, banes: 0 }],
        dice: { d10a: a, d10b: b },
        inCombat: true,
        targetFacts: [
          {
            targetId: 'hero',
            kind: 'hero',
            stamina: 30,
            maxStamina: 30,
            temporaryStamina: 0,
            immunities: [],
            weaknesses: [],
          },
        ],
      });
      expect(outcome.kind).toBe('resolved');
      if (outcome.kind !== 'resolved') throw new Error('Missing pure resolution');
      expect(outcome.roll.targets[0]).toMatchObject({
        total: a + b + 2,
        tier,
        damage: { rolledDamage: damage },
      });
      expect(outcome.roll.damageApplications[0]).toMatchObject({ staminaAfter: 30 - damage });
      expect(outcome.effects.filter(e => e.kind === 'push')).toEqual([]);
      const manual = outcome.effects.filter(e => e.kind === 'condition');
      expect(manual).toHaveLength(name === 'Razor Claws' && tier === 3 ? 1 : 0);
      if (manual.length) expect(manual[0]!.clause).toMatch(/M < 2 .*bleeding.*save ends/);
    }
  },
);
