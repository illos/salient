// SPDX-License-Identifier: GPL-3.0-only
// R04 worked examples (docs/roll-and-damage-resolution.md section 10) against the pure engine in
// shared/resolve/index.ts. Every expected number below is copied from the section named in the test
// title, never derived by running the code. Fixture numbers: section 10 table (Grug Might 2,
// Agility 2, max Stamina 30, Mountain +0/+0/+4; Goblin Warrior Might −2, Agility 2, Stamina 15).
import { describe, expect, test } from 'vitest';
import type {
  AbilityRollMetadata,
  ActorRollFacts,
  D10,
  DamageTargetFacts,
} from '../shared/contracts/rollResolution.ts';
import {
  applyDamage,
  checkAffordability,
  correctTarget,
  parseTierText,
  resolveAbilityRoll,
  resolveCatchBreath,
  resolveCreatureFreeStrike,
  resolveEdgeBane,
  resolveSavingThrow,
  resolveTestRoll,
  selectCharacteristic,
  tierOf,
} from '../shared/resolve/index.ts';

const REVISION = 'fb83a789da8f0327a389c277a0c790b1648d5810';
const source = (path: string, id: string) => ({ path, revision: REVISION, id });

/** Melee Weapon Free Strike (feature/ability/common/melee-weapon-free-strike.md). */
const freeStrike: AbilityRollMetadata = {
  abilityId: 'mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike',
  name: 'Melee Weapon Free Strike',
  source: source(
    'vendor/steel-compendium/en/unified/md/feature/ability/common/melee-weapon-free-strike.md',
    'mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike',
  ),
  actionType: 'main action',
  keywords: ['Charge', 'Melee', 'Strike', 'Weapon'],
  permittedCharacteristics: ['M', 'A'],
  tiers: [
    parseTierText('2 + M or A damage'),
    parseTierText('5 + M or A damage'),
    parseTierText('7 + M or A damage'),
  ],
  kitBonusesIncluded: false,
};

/** Brutal Slam (feature/ability/fury/level-1/brutal-slam.md). */
const brutalSlam: AbilityRollMetadata = {
  abilityId: 'mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam',
  name: 'Brutal Slam',
  source: source(
    'vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md',
    'mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam',
  ),
  actionType: 'main action',
  keywords: ['Melee', 'Strike', 'Weapon'],
  permittedCharacteristics: ['M'],
  tiers: [
    parseTierText('3 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1'),
    parseTierText('6 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2'),
    parseTierText('9 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4'),
  ],
  kitBonusesIncluded: false,
};

/** Thunder Roar (feature/ability/fury/level-1/thunder-roar.md): 5 Ferocity; Area, Melee, Weapon. */
const thunderRoar: AbilityRollMetadata = {
  abilityId: 'mcdm.heroes.v1/feature.ability.fury.level-1/thunder-roar',
  name: 'Thunder Roar',
  source: source(
    'vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/thunder-roar.md',
    'mcdm.heroes.v1/feature.ability.fury.level-1/thunder-roar',
  ),
  actionType: 'main action',
  keywords: ['Area', 'Melee', 'Weapon'],
  permittedCharacteristics: ['M'],
  tiers: [
    parseTierText('6 damage; push 2'),
    parseTierText('9 damage; push 4'),
    parseTierText('13 damage; push 6'),
  ],
  fixedCost: { resource: 'ferocity', amount: 5 },
  kitBonusesIncluded: false,
};

const grug: ActorRollFacts = {
  actorId: 'grug',
  characteristics: { M: 2, A: 2, R: 0, I: 1, P: 0 },
  kitMeleeDamageBonus: [0, 0, 4],
};

const goblin = (id = 'goblin', stamina = 15, temporaryStamina = 0): DamageTargetFacts => ({
  targetId: id,
  kind: 'foe',
  stamina,
  maxStamina: 15,
  temporaryStamina,
});
const grugTarget = (stamina = 30, temporaryStamina = 0): DamageTargetFacts => ({
  targetId: 'grug',
  kind: 'hero',
  stamina,
  maxStamina: 30,
  temporaryStamina,
});

const dice = (d10a: number, d10b: number) => ({ d10a: d10a as D10, d10b: d10b as D10 });

function strike(
  ability: AbilityRollMetadata,
  faces: [number, number],
  target: DamageTargetFacts = goblin(),
  counts: { edges?: number; banes?: number } = {},
) {
  const response = resolveAbilityRoll({
    ability,
    actor: grug,
    targets: [{ targetId: target.targetId, edges: counts.edges ?? 0, banes: counts.banes ?? 0 }],
    targetFacts: [target],
    dice: dice(...faces),
    inCombat: true,
  });
  if (response.kind !== 'resolved') throw new Error(`blocked: ${response.reason}`);
  return response;
}

describe('R04 section 10 worked examples', () => {
  test('10.1 single-target free strike, tier 1: dice 4 + 5, total 11, damage 4, Goblin 15 → 11', () => {
    const r = strike(freeStrike, [4, 5]);
    expect(r.naturalRoll).toBe(9);
    // Might and Agility tie at 2; Might is first in the printed order (1.8).
    expect(r.selectedCharacteristic).toBe('M');
    expect(r.characteristicValue).toBe(2);
    expect(r.targets[0]).toMatchObject({ total: 11, tier: 1, bonusTotal: 0 });
    expect(r.targets[0]!.damage).toMatchObject({
      tierConstant: 2,
      damageCharacteristicValue: 2,
      kitBonus: 0,
      rolledDamage: 4,
      uncertainty: 'Q-R-2',
    });
    expect(r.damageApplications[0]).toMatchObject({
      incoming: 4,
      absorbedByTemporaryStamina: 0,
      staminaBefore: 15,
      staminaAfter: 11,
      windedValue: 7,
      windedAfter: false,
      slain: false,
    });
    expect(r.criticalHit).toBe(false);
    expect(r.additionalMainActionOffered).toBe(false);
  });

  test('10.2 single-target free strike, tier 2: dice 6 + 7, total 15, damage 7, Goblin 15 → 8', () => {
    const r = strike(freeStrike, [6, 7]);
    expect(r.targets[0]).toMatchObject({ total: 15, tier: 2 });
    expect(r.targets[0]!.damage!.rolledDamage).toBe(7);
    expect(r.damageApplications[0]).toMatchObject({ staminaAfter: 8, windedAfter: false });
  });

  test('10.3 tier 3 without a critical: dice 8 + 9, total 19, damage 7 + 2 + 4 = 13, Goblin 15 → 2 winded', () => {
    const r = strike(freeStrike, [8, 9]);
    expect(r.naturalRoll).toBe(17);
    expect(r.targets[0]).toMatchObject({ total: 19, tier: 3 });
    expect(r.targets[0]!.damage).toMatchObject({ kitBonus: 4, rolledDamage: 13 });
    expect(r.criticalHit).toBe(false);
    expect(r.damageApplications[0]).toMatchObject({
      staminaAfter: 2,
      windedAfter: true,
      slain: false,
    });
  });

  test('10.4 critical hit: dice 10 + 10, total 22, tier 3, damage 13, Goblin 15 → 2; extra main action offered, not executed', () => {
    const r = strike(freeStrike, [10, 10]);
    expect(r.naturalRoll).toBe(20);
    expect(r.naturalNineteenOrTwenty).toBe(true);
    expect(r.targets[0]).toMatchObject({ total: 22, tier: 3 });
    expect(r.targets[0]!.damage!.rolledDamage).toBe(13);
    expect(r.damageApplications[0]).toMatchObject({ staminaAfter: 2, windedAfter: true });
    expect(r.criticalHit).toBe(true);
    expect(r.additionalMainActionOffered).toBe(true);
    // Variant: natural 19 (9 + 10) with one bane: 19 + 2 − 2 = 19, tier 3, critical hit.
    const v = strike(freeStrike, [9, 10], goblin(), { banes: 1 });
    expect(v.targets[0]).toMatchObject({ total: 19, tier: 3 });
    expect(v.criticalHit).toBe(true);
    // A maneuver ability roll never scores a critical hit (section 2).
    const m = resolveAbilityRoll({
      ability: { ...freeStrike, actionType: 'maneuver' },
      actor: grug,
      targets: [{ targetId: 'goblin', edges: 0, banes: 0 }],
      targetFacts: [goblin()],
      dice: dice(10, 10),
      inCombat: true,
    });
    expect(m.kind === 'resolved' && m.criticalHit).toBe(false);
  });

  test('10.5 edge and bane combinations on natural 12 with Might 2', () => {
    const table: [number, number, number, number, number, number][] = [
      // edges, banes, net, modifier, tierShift, total, tier  (tier separate below)
      [0, 0, 0, 0, 0, 14],
      [1, 0, 1, 2, 0, 16],
      [2, 0, 2, 0, 1, 14],
      [0, 1, -1, -2, 0, 12],
      [0, 2, -2, 0, -1, 14],
      [1, 1, 0, 0, 0, 14],
      [2, 1, 1, 2, 0, 16],
      [3, 1, 1, 2, 0, 16],
      [1, 2, -1, -2, 0, 12],
      [2, 2, 0, 0, 0, 14],
      [3, 5, 0, 0, 0, 14],
    ];
    const tiers = [2, 2, 3, 2, 1, 2, 2, 2, 2, 2, 2];
    table.forEach(([edges, banes, net, modifier, tierShift, total], i) => {
      const eb = resolveEdgeBane(edges, banes);
      expect([eb.net, eb.modifier, eb.tierShift]).toEqual([net, modifier, tierShift]);
      const r = strike(freeStrike, [6, 6], goblin(), { edges, banes });
      expect(r.targets[0]!.total).toBe(total);
      expect(r.targets[0]!.tier).toBe(tiers[i]);
    });
    // Boundary check with natural 15, Might 2 (total 17, tier 3).
    expect(strike(freeStrike, [7, 8], goblin(), { banes: 1 }).targets[0]).toMatchObject({
      total: 15,
      tier: 2,
    });
    expect(strike(freeStrike, [7, 8], goblin(), { banes: 2 }).targets[0]).toMatchObject({
      total: 17,
      baseTier: 3,
      tier: 2,
    });
    expect(strike(freeStrike, [7, 8], goblin(), { edges: 3, banes: 2 }).targets[0]).toMatchObject({
      total: 17,
      tier: 3,
    });
    expect(tierOf(17, -1)).toBe(2);
  });

  test('10.6 multi-target Thunder Roar: Ferocity 6 → 1; dice 7 + 6; per-target tiers 3/1/2, damage 17/6/9, Stamina −2/9/6', () => {
    const response = resolveAbilityRoll({
      ability: thunderRoar,
      actor: grug,
      targets: [
        { targetId: 'w1', edges: 1, banes: 0 },
        { targetId: 'w2', edges: 0, banes: 2 },
        { targetId: 'w3', edges: 0, banes: 0 },
      ],
      targetFacts: [goblin('w1'), goblin('w2'), goblin('w3')],
      dice: dice(7, 6),
      inCombat: true,
      resourcePool: { resource: 'ferocity', current: 6, legalFloor: 0 },
      effectClauses: [
        {
          label: 'Effect',
          text: 'The targets are force moved one at a time, starting with the target nearest to you, and can be pushed into other targets in the same line.',
        },
      ],
    });
    expect(response.kind).toBe('resolved');
    if (response.kind !== 'resolved') return;
    expect(response.cost).toEqual({
      resource: 'ferocity',
      amount: 5,
      waived: false,
      before: 6,
      after: 1,
    });
    expect(response.naturalRoll).toBe(13);
    expect(response.criticalHit).toBe(false);
    expect(
      response.targets.map(t => [t.targetId, t.total, t.tier, t.damage!.rolledDamage]),
    ).toEqual([
      ['w1', 17, 3, 17],
      ['w2', 15, 1, 6],
      ['w3', 15, 2, 9],
    ]);
    expect(response.targets[0]!.damage).toMatchObject({ tierConstant: 13, kitBonus: 4 });
    expect(response.targets[1]!.damage).toMatchObject({ tierConstant: 6, kitBonus: 0 });
    expect(
      response.damageApplications.map(d => [d.targetId, d.staminaAfter, d.windedAfter, d.slain]),
    ).toEqual([
      ['w1', -2, true, true],
      ['w2', 9, false, false],
      ['w3', 6, true, false],
    ]);
    // Push clauses verbatim per target; the Effect clause recorded, never applied.
    expect(response.targets.map(t => t.unresolvedClauses)).toEqual([
      ['push 6'],
      ['push 2'],
      ['push 4'],
    ]);
    expect(response.manualResolutions!.map(m => m.sourceClause)).toEqual([
      'Effect: The targets are force moved one at a time, starting with the target nearest to you, and can be pushed into other targets in the same line.',
    ]);
  });

  test('10.7 damage that crosses winded: Grug 30 takes 16 → 14, winded value 15, transition false → true', () => {
    const d = applyDamage(grugTarget(), {
      targetId: 'grug',
      amount: 16,
      causeLabel: 'manual Director entry',
    });
    expect(d).toMatchObject({
      staminaAfter: 14,
      windedValue: 15,
      windedBefore: false,
      windedAfter: true,
      dying: false,
      deadThresholdReached: false,
    });
  });

  test('10.8 temporary Stamina is consumed first', () => {
    const source = applyDamage(grugTarget(30, 10), {
      targetId: 'grug',
      amount: 16,
      causeLabel: 'x',
    });
    expect(source).toMatchObject({
      absorbedByTemporaryStamina: 10,
      temporaryStaminaAfter: 0,
      staminaDelta: 6,
      staminaAfter: 24,
      windedAfter: false,
    });
    const check6 = applyDamage(
      { targetId: 'h', kind: 'hero', stamina: 20, maxStamina: 30, temporaryStamina: 3 },
      { targetId: 'h', amount: 5, causeLabel: 'x' },
    );
    expect(check6).toMatchObject({
      absorbedByTemporaryStamina: 3,
      temporaryStaminaAfter: 0,
      staminaDelta: 2,
      staminaAfter: 18,
    });
    const partial = applyDamage(grugTarget(30, 10), {
      targetId: 'grug',
      amount: 4,
      causeLabel: 'x',
    });
    expect(partial).toMatchObject({
      absorbedByTemporaryStamina: 4,
      temporaryStaminaAfter: 6,
      staminaDelta: 0,
      staminaAfter: 30,
    });
  });

  test('10.9 Catch Breath at and near the cap (recovery value 10, Recoveries 10 → 9)', () => {
    const base = {
      actorId: 'grug',
      inCombat: true,
      maxStamina: 30,
      temporaryStamina: 0,
      recoveries: 10,
    };
    expect(resolveCatchBreath({ ...base, stamina: 19 })).toMatchObject({
      kind: 'resolved',
      recoveryValue: 10,
      recoveriesAfter: 9,
      staminaAfter: 29,
      healed: 10,
      capApplied: false,
    });
    expect(resolveCatchBreath({ ...base, stamina: 22 })).toMatchObject({
      staminaAfter: 30,
      healed: 8,
      capApplied: true,
      uncertainty: 'Q-R-3',
    });
    const full = resolveCatchBreath({ ...base, stamina: 30 });
    expect(full).toMatchObject({ staminaAfter: 30, healed: 0, recoveriesAfter: 9 });
    expect(full.kind === 'resolved' && full.warnings.length).toBeGreaterThan(0);
    expect(resolveCatchBreath({ ...base, stamina: 24, temporaryStamina: 5 })).toMatchObject({
      staminaAfter: 30,
      temporaryStaminaUnchanged: 5,
    });
    expect(
      resolveCatchBreath({
        actorId: 'goblin',
        inCombat: true,
        stamina: 15,
        maxStamina: 15,
        temporaryStamina: 0,
      }),
    ).toMatchObject({ kind: 'blocked' });
  });

  test('10.10 post-roll bane addition changes the tier with the same dice; removal restores it', () => {
    // Original: dice 8 + 2 → natural 10; total 12 → tier 2; damage 7; Goblin 15 → 8.
    const original = strike(freeStrike, [8, 2]);
    expect(original.targets[0]).toMatchObject({ total: 12, tier: 2 });
    expect(original.damageApplications[0]!.staminaAfter).toBe(8);
    const applied = original.damageApplications[0]!;
    const current = goblin('goblin', 8);
    const corrected = correctTarget(
      freeStrike,
      grug,
      original,
      'e1',
      original.targets[0]!,
      applied,
      current,
      0,
      1,
    );
    expect(corrected.dice).toEqual(dice(8, 2));
    expect(corrected.after).toMatchObject({ total: 10, tier: 1 });
    expect(corrected.after.damage!.rolledDamage).toBe(4);
    expect(corrected.staminaReconciliationDelta).toBe(3);
    expect(corrected.damageAfter!.staminaAfter).toBe(11);
    expect(corrected.damageAfter!.windedAfter).toBe(false);
    // Removing the bane again restores tier 2 / 7 damage / Stamina 8 as a further linked correction.
    const restored = correctTarget(
      freeStrike,
      grug,
      original,
      'e1',
      corrected.after,
      corrected.damageAfter,
      goblin('goblin', 11),
      0,
      0,
    );
    expect(restored.after).toMatchObject({ tier: 2 });
    expect(restored.after.damage!.rolledDamage).toBe(7);
    expect(restored.damageAfter!.staminaAfter).toBe(8);
    expect(restored.staminaReconciliationDelta).toBe(-3);
    // Tier-3 case: natural 15, total 17 → tier 3, damage 13, Goblin 15 → 2 (winded).
    const t3 = strike(freeStrike, [7, 8]);
    expect(t3.targets[0]).toMatchObject({ total: 17, tier: 3 });
    expect(t3.damageApplications[0]).toMatchObject({ staminaAfter: 2, windedAfter: true });
    const oneBane = correctTarget(
      freeStrike,
      grug,
      t3,
      'e2',
      t3.targets[0]!,
      t3.damageApplications[0],
      goblin('goblin', 2),
      0,
      1,
    );
    expect(oneBane.after).toMatchObject({ total: 15, tier: 2 });
    expect(oneBane.after.damage!.rolledDamage).toBe(7);
    expect(oneBane.damageAfter).toMatchObject({ staminaAfter: 8, windedAfter: false });
    const twoBanes = correctTarget(
      freeStrike,
      grug,
      t3,
      'e2',
      oneBane.after,
      oneBane.damageAfter,
      goblin('goblin', 8),
      0,
      2,
    );
    expect(twoBanes.after).toMatchObject({ total: 17, baseTier: 3, tier: 2 });
    expect(twoBanes.after.damage!.rolledDamage).toBe(7);
    expect(twoBanes.staminaReconciliationDelta).toBe(0);
    // Natural 19 with two banes → Q-R-1 provisional tier 3, labeled.
    const nat19 = strike(freeStrike, [9, 10], goblin(), { banes: 2 });
    expect(nat19.targets[0]).toMatchObject({ tier: 3, uncertainty: 'Q-R-1' });
    expect(() =>
      correctTarget(freeStrike, grug, t3, 'e2', t3.targets[0]!, undefined, undefined, -1, 0),
    ).toThrow();
  });

  test('10.11 blocked unaffordable ability: Ferocity 2, cost 5 → blocked, no dice, no debit; waived outside combat', () => {
    const blocked = resolveAbilityRoll({
      ability: thunderRoar,
      actor: grug,
      targets: [{ targetId: 'goblin', edges: 0, banes: 0 }],
      targetFacts: [goblin()],
      dice: dice(7, 6),
      inCombat: true,
      resourcePool: { resource: 'ferocity', current: 2, legalFloor: 0 },
    });
    expect(blocked).toEqual({
      kind: 'blocked',
      abilityId: thunderRoar.abilityId,
      actorId: 'grug',
      cost: { resource: 'ferocity', amount: 5 },
      poolBefore: 2,
      reason: 'Ferocity 2 < cost 5',
    });
    // Spec example: cost 3 with 2 available → blocked.
    expect(
      checkAffordability(
        { resource: 'ferocity', amount: 3 },
        { resource: 'ferocity', current: 2, legalFloor: 0 },
        true,
      ),
    ).toMatchObject({ kind: 'blocked', poolBefore: 2, reason: 'Ferocity 2 < cost 3' });
    // Same hero in FreePlay: cost waived → executes with no debit.
    const waived = resolveAbilityRoll({
      ability: thunderRoar,
      actor: grug,
      targets: [{ targetId: 'goblin', edges: 0, banes: 0 }],
      targetFacts: [goblin()],
      dice: dice(7, 6),
      inCombat: false,
      resourcePool: { resource: 'ferocity', current: 2, legalFloor: 0 },
    });
    expect(waived.kind).toBe('resolved');
    if (waived.kind !== 'resolved') return;
    expect(waived.cost).toMatchObject({ waived: true, before: 2, after: 2 });
    expect(waived.warnings).toEqual([]);
    // A second FreePlay use before a Victory or respite executes with a warning.
    const again = resolveAbilityRoll({
      ability: thunderRoar,
      actor: grug,
      targets: [{ targetId: 'goblin', edges: 0, banes: 0 }],
      targetFacts: [goblin()],
      dice: dice(7, 6),
      inCombat: false,
      resourcePool: {
        resource: 'ferocity',
        current: 2,
        legalFloor: 0,
        usedOutsideCombatSinceLastVictoryOrRespite: true,
      },
    });
    expect(again.kind === 'resolved' && again.warnings.length).toBe(1);
    expect(again.kind === 'resolved' && again.cost!.after).toBe(2);
  });

  test('10.12 direct test and save', () => {
    const climbRequest = {
      actorId: 'grug',
      characteristic: 'M' as const,
      characteristicValue: 2,
      dice: dice(7, 4),
      skill: 'Climb',
      edges: 1,
      banes: 0,
    };
    const climb = resolveTestRoll({ ...climbRequest, difficulty: 'medium' });
    expect(climb).toMatchObject({ naturalRoll: 11, total: 17, tier: 3, outcome: 'Success' });
    expect(resolveTestRoll({ ...climbRequest, difficulty: 'hard' }).outcome).toBe('Success');
    const open = resolveTestRoll({
      actorId: 'grug',
      characteristic: 'M',
      characteristicValue: 2,
      dice: dice(7, 4),
      skill: 'Climb',
      edges: 1,
      banes: 0,
    });
    expect(open.outcome).toBeUndefined();
    const crit = resolveTestRoll({
      actorId: 'grug',
      characteristic: 'M',
      characteristicValue: 2,
      dice: dice(9, 10),
      edges: 0,
      banes: 1,
      difficulty: 'hard',
    });
    expect(crit).toMatchObject({
      total: 19,
      tier: 3,
      criticalSuccess: true,
      outcome: 'Success with a reward',
    });
    expect(resolveSavingThrow({ actorId: 'g', condition: 'prone', d10: 6 }).success).toBe(true);
    expect(resolveSavingThrow({ actorId: 'g', condition: 'prone', d10: 5 }).success).toBe(false);
    expect(
      resolveSavingThrow({
        actorId: 'g',
        condition: 'prone',
        d10: 5,
        threshold: 5,
        thresholdSourceLabel: 'Impressive Horns',
      }),
    ).toMatchObject({ threshold: 5, success: true });
  });

  test('10.13 Brutal Slam: 5 / 8 / 15 damage, Goblin 15 → 10 / 7 / 0; push clauses unresolved; natural 18 not a critical', () => {
    const rows: [number, number, number, number, number, number, boolean, boolean][] = [
      // d10a, d10b, natural, total, tier, damage, winded, slain
      [3, 6, 9, 11, 1, 5, false, false],
      [7, 7, 14, 16, 2, 8, true, false],
      [9, 9, 18, 20, 3, 15, true, true],
    ];
    for (const [a, b, natural, total, tier, damage, winded, slain] of rows) {
      const r = strike(brutalSlam, [a, b]);
      expect(r.naturalRoll).toBe(natural);
      // Power roll + Might: no characteristic choice.
      expect(r.selectedCharacteristic).toBe('M');
      expect(r.targets[0]).toMatchObject({ total, tier });
      expect(r.targets[0]!.damage!.rolledDamage).toBe(damage);
      expect(r.targets[0]!.damage!.uncertainty).toBeUndefined();
      expect(r.damageApplications[0]).toMatchObject({
        staminaAfter: 15 - damage,
        windedAfter: winded,
        slain,
      });
      expect(r.criticalHit).toBe(false);
    }
    expect(strike(brutalSlam, [9, 9]).targets[0]!.unresolvedClauses).toEqual([
      '[push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4',
    ]);
    expect(strike(brutalSlam, [9, 10]).criticalHit).toBe(true);
  });

  test('10.14 creature free strike: no roll, damage 1 → Grug 29; with 3 temporary Stamina → temporary 2, Stamina unchanged', () => {
    const plain = resolveCreatureFreeStrike(
      { actorId: 'goblin', freeStrikeValue: 1, targetId: 'grug' },
      grugTarget(),
    );
    expect(plain).toMatchObject({ incoming: 1, staminaAfter: 29, temporaryStaminaAfter: 0 });
    const withTemporary = resolveCreatureFreeStrike(
      { actorId: 'goblin', freeStrikeValue: 1, targetId: 'grug' },
      grugTarget(30, 3),
    );
    expect(withTemporary).toMatchObject({
      absorbedByTemporaryStamina: 1,
      temporaryStaminaAfter: 2,
      staminaAfter: 30,
    });
  });

  test('section 1.8 characteristic selection and section 4.1 clause parsing', () => {
    expect(selectCharacteristic(freeStrike, grug)).toEqual({ selected: 'M', value: 2 });
    expect(selectCharacteristic(freeStrike, grug, 'A')).toEqual({ selected: 'A', value: 2 });
    expect(() => selectCharacteristic(freeStrike, grug, 'R')).toThrow('not permitted');
    expect(
      selectCharacteristic(
        { permittedCharacteristics: ['M', 'A'], fixedRollBonus: undefined },
        { characteristics: { M: 1, A: 3, R: 0, I: 0, P: 0 } },
      ),
    ).toEqual({ selected: 'A', value: 3 });
    expect(selectCharacteristic({ permittedCharacteristics: [], fixedRollBonus: 2 }, grug)).toEqual(
      { value: 2 },
    );
    expect(parseTierText('5 damage; M < 0 [bleeding](x) (save ends)')).toEqual({
      text: '5 damage; M < 0 [bleeding](x) (save ends)',
      damage: { kind: 'flat', constant: 5 },
      unresolvedClauses: ['M < 0 [bleeding](x) (save ends)'],
    });
    expect(parseTierText('3 fire damage').damageType).toBe('fire');
    expect(parseTierText('2 + M or A damage').damage).toEqual({
      kind: 'plusChoice',
      constant: 2,
      choices: ['M', 'A'],
    });
    expect(parseTierText('Slide 2').unresolvedClauses).toEqual(['Slide 2']);
  });

  test('section 6.2 weakness before immunity, highest of each, untyped matched only by untyped entries', () => {
    // "if a creature has fire weakness 5 and is dealt 10 fire damage, they take 15 fire damage instead."
    const fire = applyDamage(
      { ...grugTarget(), weaknesses: [{ type: 'fire', value: 5 }] },
      { targetId: 'grug', amount: 10, damageType: 'fire', causeLabel: 'x' },
    );
    expect(fire).toMatchObject({ weaknessApplied: 5, afterImmunity: 15, staminaAfter: 15 });
    const untypedVersusTyped = applyDamage(
      {
        ...grugTarget(),
        weaknesses: [{ type: 'fire', value: 5 }],
        immunities: [{ type: 'fire', value: 3 }],
      },
      { targetId: 'grug', amount: 10, causeLabel: 'x' },
    );
    expect(untypedVersusTyped).toMatchObject({
      weaknessApplied: 0,
      immunityApplied: 0,
      afterImmunity: 10,
    });
    const all = applyDamage(
      {
        ...grugTarget(),
        immunities: [
          { type: 'all-damage', value: 2 },
          { type: 'fire', value: 'all' },
        ],
      },
      { targetId: 'grug', amount: 10, damageType: 'fire', causeLabel: 'x' },
    );
    expect(all).toMatchObject({ immunityApplied: 'all', afterImmunity: 0, staminaAfter: 30 });
    const floor = applyDamage(
      { ...grugTarget(), immunities: [{ type: 'all-damage', value: 12 }] },
      { targetId: 'grug', amount: 10, causeLabel: 'x' },
    );
    expect(floor).toMatchObject({ afterImmunity: 0, staminaAfter: 30 });
  });
});
