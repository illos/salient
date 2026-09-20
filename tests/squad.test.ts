// SPDX-License-Identifier: GPL-3.0-only
// Squad pool arithmetic against the pinned examples and the user's 2026-09-20 rulings. Expected
// values come from vendor/steel-compendium/en/unified/md/chapter/monster-basics.md (Shared Low
// Stamina, Dropping One/Multiple Minions, Minions and Area Effects) and the worked cases in
// docs/table-spec.md#minion-squads-and-captain-state; none were produced by running this code.
import { describe, expect, test } from 'vitest';
import {
  applyCaptainStamina,
  applySquadDamage,
  assignCasualties,
  parseCaptainBenefit,
  parsePrintedEv,
  proportionalEv,
  type SquadPoolState,
} from '../shared/resolve/squad.ts';

const members = (n: number, prefix = 'm') =>
  Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
const squad = (count: number, step: number, pool = count * step): SquadPoolState => ({
  pool,
  step,
  carried: 0,
  living: members(count),
});

describe('shared pool ladder (Shared Low Stamina, Dropping One Minion)', () => {
  test('eight Spinecleavers: 3 then 2 crosses 35 and drops the second minion hit', () => {
    let state = squad(8, 5);
    const a = applySquadDamage(state, [{ memberId: 'm1', damage: 3 }], false);
    expect([a.poolAfter, a.casualties, a.pending]).toEqual([37, [], null]);
    state = a.state;
    const b = applySquadDamage(state, [{ memberId: 'm2', damage: 2 }], false);
    expect([b.poolAfter, b.casualties, b.pending, b.state.carried]).toEqual([35, ['m2'], null, 0]);
    expect(b.state.living).toHaveLength(7);
  });
  test('12 non-area damage to one of seven drops it plus one nearest member the table names', () => {
    const state: SquadPoolState = { pool: 35, step: 5, carried: 0, living: members(7).slice(0) };
    const c = applySquadDamage(state, [{ memberId: 'm3', damage: 12 }], false);
    expect(c.poolAfter).toBe(23);
    expect(c.ladderCasualties).toBe(2);
    expect(c.casualties).toEqual(['m3']);
    expect(c.pending).toEqual({
      count: 1,
      candidates: members(7).filter(id => id !== 'm3'),
      reason: 'nearest',
    });
    expect(c.state.carried).toBe(2);
    const after = assignCasualties(c.state, ['m4']);
    expect(after.living).toEqual(['m1', 'm2', 'm5', 'm6', 'm7']);
    // The accumulated remainder crosses the next threshold with a later 3.
    const d = applySquadDamage(after, [{ memberId: 'm5', damage: 3 }], false);
    expect([d.poolAfter, d.casualties]).toEqual([20, ['m5']]);
  });
  test('five Stamina-4 minions: 10 drops two with no personal remainder; a later 2 drops the target', () => {
    const first = applySquadDamage(squad(5, 4), [{ memberId: 'm1', damage: 10 }], false);
    expect([first.poolAfter, first.casualties, first.pending?.count]).toEqual([10, ['m1'], 1]);
    const state = assignCasualties(first.state, ['m2']);
    const second = applySquadDamage(state, [{ memberId: 'm3', damage: 2 }], false);
    expect([second.poolAfter, second.casualties]).toEqual([8, ['m3']]);
  });
  test('two directly damaged members and one death: the damaging creature chooses', () => {
    const r = applySquadDamage(
      squad(4, 5),
      [
        { memberId: 'm1', damage: 3 },
        { memberId: 'm2', damage: 3 },
      ],
      false,
    );
    expect(r.casualties).toEqual([]);
    expect(r.pending).toEqual({ count: 1, candidates: ['m1', 'm2'], reason: 'directly-damaged' });
  });
});

describe('captain Stamina benefit and carried damage (2026-09-20)', () => {
  test('Axethrowers: 36 → 26 with 1 carried; captain loss to 20 at step 7; deaths at 14, 7 and 0', () => {
    let state = squad(4, 9);
    const hit = applySquadDamage(state, [{ memberId: 'm1', damage: 10 }], false);
    expect([hit.poolAfter, hit.casualties, hit.state.carried]).toEqual([26, ['m1'], 1]);
    const loss = applyCaptainStamina(hit.state, -2);
    expect([loss.poolAfter, loss.stepAfter, loss.casualties, loss.state.carried]).toEqual([
      20,
      7,
      [],
      1,
    ]);
    state = loss.state;
    const six = applySquadDamage(state, [{ memberId: 'm2', damage: 6 }], false);
    expect([six.poolAfter, six.casualties]).toEqual([14, ['m2']]);
    const seven = applySquadDamage(six.state, [{ memberId: 'm3', damage: 7 }], false);
    expect([seven.poolAfter, seven.casualties]).toEqual([7, ['m3']]);
    const last = applySquadDamage(seven.state, [{ memberId: 'm4', damage: 7 }], false);
    expect([last.poolAfter, last.casualties, last.exhausted]).toEqual([0, ['m4'], true]);
  });
  test('carried damage above the new step drops a minion on the next hit of any size', () => {
    const state: SquadPoolState = { pool: 28, step: 9, carried: 8, living: members(4) };
    const loss = applyCaptainStamina(state, -2);
    expect([loss.poolAfter, loss.casualties]).toEqual([20, []]);
    const nick = applySquadDamage(loss.state, [{ memberId: 'm1', damage: 1 }], false);
    expect([nick.casualties, nick.state.carried]).toEqual([['m1'], 2]);
  });
  test('two Stamina-4 survivors at pool 3: 1 damage nothing, 3 damage both die at zero', () => {
    const state: SquadPoolState = { pool: 3, step: 4, carried: 0, living: ['a', 'b'] };
    expect(applySquadDamage(state, [{ memberId: 'a', damage: 1 }], false).casualties).toEqual([]);
    const r = applySquadDamage(state, [{ memberId: 'a', damage: 3 }], false);
    expect([r.casualties, r.exhausted, r.state.living]).toEqual([['a', 'b'], true, []]);
  });
  test('replacement captain adds the bonus for survivors only; bonus loss to zero kills the squad', () => {
    const three: SquadPoolState = { pool: 3, step: 4, carried: 0, living: ['a', 'b', 'c'] };
    const gain = applyCaptainStamina(three, 2);
    expect([gain.poolAfter, gain.stepAfter, gain.casualties]).toEqual([9, 6, []]);
    const drop = applyCaptainStamina({ pool: 4, step: 6, carried: 1, living: ['a', 'b'] }, -2);
    expect([drop.poolAfter, drop.exhausted, drop.casualties, drop.state.living]).toEqual([
      0,
      true,
      ['a', 'b'],
      [],
    ]);
  });
});

describe('area damage (Minions and Area Effects, 2026-09-13 ceiling, 2026-09-20 ladder)', () => {
  test('three of eight Spinecleavers take 6 fire: the pool loses 15, not 18, and only they die', () => {
    const r = applySquadDamage(
      squad(8, 5),
      [
        { memberId: 'm1', damage: 6 },
        { memberId: 'm2', damage: 6 },
        { memberId: 'm3', damage: 6 },
      ],
      true,
    );
    expect(r.applied).toBe(15);
    expect(r.poolAfter).toBe(25);
    expect(r.contributions.every(c => c.capped && c.applied === 5)).toBe(true);
    expect(r.casualties).toEqual(['m1', 'm2', 'm3']);
    expect(r.pending).toBeNull();
    expect(r.state.living).toEqual(members(8).slice(3));
  });
  test('sub-step area damage adds up on the ladder and the casualty stays inside the area', () => {
    const r = applySquadDamage(
      squad(4, 5),
      [
        { memberId: 'm1', damage: 3 },
        { memberId: 'm2', damage: 3 },
        { memberId: 'm3', damage: 3 },
      ],
      true,
    );
    expect([r.poolAfter, r.ladderCasualties, r.casualties]).toEqual([11, 1, []]);
    expect(r.pending).toEqual({
      count: 1,
      candidates: ['m1', 'm2', 'm3'],
      reason: 'directly-damaged',
    });
  });
  test('area damage draining the pool to zero kills the members outside the area too', () => {
    const state: SquadPoolState = { pool: 11, step: 5, carried: 1, living: members(4) };
    const r = applySquadDamage(
      state,
      [
        { memberId: 'm1', damage: 3 },
        { memberId: 'm2', damage: 3 },
        { memberId: 'm3', damage: 3 },
        { memberId: 'm4', damage: 3 },
      ],
      true,
    );
    expect([r.poolAfter, r.exhausted, r.casualties]).toEqual([0, true, members(4)]);
  });
});

describe('encounter value and captain benefit text', () => {
  test('six minions at EV 3 for four contribute 4.5; an ordinary EV keeps quantity one', () => {
    expect(parsePrintedEv('3 for four minions')).toEqual({ amount: 3, quantity: 4 });
    expect(proportionalEv(6, parsePrintedEv('3 for four minions'))).toBe(4.5);
    expect(parsePrintedEv('3')).toEqual({ amount: 3, quantity: 1 });
    expect(proportionalEv(3, parsePrintedEv('3 for four minions'))).toBe(2.25);
    expect(parsePrintedEv('EV varies')).toEqual({ amount: null, quantity: null });
  });
  test('the three automated With Captain forms parse; everything else stays manual text', () => {
    expect(parseCaptainBenefit('+2 bonus to Stamina')).toMatchObject({ stamina: 2, manual: false });
    expect(parseCaptainBenefit('+1 damage bonus to strikes')).toMatchObject({
      strikeDamage: 1,
      manual: false,
    });
    expect(parseCaptainBenefit('Gain an edge on strikes')).toMatchObject({
      strikeEdges: 1,
      manual: false,
    });
    expect(parseCaptainBenefit('Have a double edge on strikes')).toMatchObject({
      strikeEdges: 2,
      manual: false,
    });
    expect(parseCaptainBenefit('+2 bonus to speed')).toMatchObject({ manual: true, stamina: 0 });
    expect(parseCaptainBenefit(null)).toBeNull();
  });
});
