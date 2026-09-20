// SPDX-License-Identifier: GPL-3.0-only
/**
 * Minion squad arithmetic, pure and client-independent: the shared Stamina pool ladder, casualty
 * derivation, captain Stamina benefit changes and proportional encounter value. Nothing here reads
 * or writes state; the Convex squad operations feed it the current squad and apply what it returns.
 *
 * Owning specification: docs/table-spec.md#minion-squads-and-captain-state, in particular the
 * "User decisions, 2026-09-20" block. Pinned source: vendor/steel-compendium/en/unified/md/chapter/
 * monster-basics.md (Shared Low Stamina, Dropping One Minion, Dropping Multiple Minions, Minions and
 * Area Effects) and rule/monster/captain.md (Captain Benefits).
 */

export interface SquadPoolState {
  /** Current shared Stamina pool. Never below zero (clamped by the 2026-09-20 ruling). */
  pool: number;
  /** Current per-member step: printed Stamina plus an attached captain's Stamina benefit. */
  step: number;
  /** Damage taken since the last ladder casualty; survives captain changes (2026-09-20). */
  carried: number;
  /** Living member ids in roster order. */
  living: string[];
}

export interface SquadHit {
  memberId: string;
  /** Damage this member takes from the instance, after the ordinary per-target modifiers. */
  damage: number;
}

export interface SquadDamageResult {
  state: SquadPoolState;
  poolBefore: number;
  poolAfter: number;
  /** Pool loss actually applied (after the area per-member cap and the zero clamp). */
  applied: number;
  /** Per directly damaged member: incoming damage and what reached the pool. */
  contributions: { memberId: string; incoming: number; applied: number; capped: boolean }[];
  /** Ladder deaths this instance produced (before exhaustion, which takes everyone). */
  ladderCasualties: number;
  /** Members the rules identify without a choice: exhausted squad, or the only eligible candidates. */
  casualties: string[];
  /** Deaths still to be assigned by the table, and who may be chosen. */
  pending: { count: number; candidates: string[]; reason: 'directly-damaged' | 'nearest' } | null;
  /** The pool reached zero and every remaining member died. */
  exhausted: boolean;
}

function ladder(carried: number, applied: number, step: number) {
  const total = carried + applied;
  const deaths = step > 0 ? Math.floor(total / step) : 0;
  return { deaths, carried: total - deaths * step };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/**
 * Applies one damage instance to a squad. Non-area damage counts in full and may drop additional
 * nearest members; area damage counts each affected member at most one step and can only drop
 * members in the area. The pool reaching zero drops every remaining member, whatever the source
 * (2026-09-20). Casualties are derived, never re-deducted: `applied` is the only pool change.
 */
export function applySquadDamage(
  state: SquadPoolState,
  hits: SquadHit[],
  area: boolean,
): SquadDamageResult {
  const living = new Set(state.living);
  const damaged = unique(hits.map(h => h.memberId)).filter(id => living.has(id));
  const contributions = hits
    .filter(h => living.has(h.memberId) && h.damage > 0)
    .map(h => {
      const capped = area && h.damage > state.step;
      return {
        memberId: h.memberId,
        incoming: h.damage,
        applied: capped ? state.step : h.damage,
        capped,
      };
    });
  const requested = contributions.reduce((sum, c) => sum + c.applied, 0);
  const poolAfter = Math.max(0, state.pool - requested);
  const applied = state.pool - poolAfter;
  const base = { poolBefore: state.pool, poolAfter, applied, contributions };
  if (poolAfter === 0 && state.living.length) {
    return {
      ...base,
      state: { ...state, pool: 0, carried: 0, living: [] },
      ladderCasualties: state.living.length,
      casualties: [...state.living],
      pending: null,
      exhausted: true,
    };
  }
  const { deaths, carried } = ladder(state.carried, applied, state.step);
  const next: SquadPoolState = { ...state, pool: poolAfter, carried };
  if (deaths === 0)
    return {
      ...base,
      state: next,
      ladderCasualties: 0,
      casualties: [],
      pending: null,
      exhausted: false,
    };
  let casualties: string[] = [];
  let pending: SquadDamageResult['pending'] = null;
  if (area) {
    // Members whose own damage reached the step die; further ladder deaths stay inside the area.
    const byId = new Map(contributions.map(c => [c.memberId, c]));
    const dead = damaged.filter(id => (byId.get(id)?.incoming ?? 0) >= state.step);
    const survivorsInArea = damaged.filter(id => !dead.includes(id));
    const remaining = deaths - dead.length;
    casualties = [...dead];
    if (remaining >= survivorsInArea.length) casualties.push(...survivorsInArea);
    else if (remaining > 0)
      pending = { count: remaining, candidates: survivorsInArea, reason: 'directly-damaged' };
  } else if (deaths >= damaged.length) {
    // Every directly damaged member dies; the rest are the nearest members, which the table names.
    casualties = [...damaged];
    const remaining = deaths - damaged.length;
    const others = state.living.filter(id => !damaged.includes(id));
    if (remaining > 0) {
      if (remaining >= others.length) casualties.push(...others);
      else pending = { count: remaining, candidates: others, reason: 'nearest' };
    }
  } else {
    // Fewer deaths than directly damaged members: the creature who dealt the damage chooses.
    pending = { count: deaths, candidates: damaged, reason: 'directly-damaged' };
  }
  next.living = state.living.filter(id => !casualties.includes(id));
  return { ...base, state: next, ladderCasualties: deaths, casualties, pending, exhausted: false };
}

/** Records chosen casualties for a pending assignment. Returns the ids that were actually living. */
export function assignCasualties(state: SquadPoolState, chosen: string[]): SquadPoolState {
  const remove = new Set(chosen);
  return { ...state, living: state.living.filter(id => !remove.has(id)) };
}

export interface CaptainStaminaChange {
  state: SquadPoolState;
  poolBefore: number;
  poolAfter: number;
  stepBefore: number;
  stepAfter: number;
  /** Bonus change per living member (positive on attach, negative on loss). */
  perMember: number;
  /** The reversion took the pool to zero: every remaining member dies (2026-09-20). */
  exhausted: boolean;
  casualties: string[];
}

/**
 * Attaching or losing a captain with a Stamina benefit moves the pool by the benefit per living
 * member and the step by the benefit. Carried damage is untouched. No casualty unless the pool
 * reaches zero, in which case the whole squad dies.
 */
export function applyCaptainStamina(
  state: SquadPoolState,
  perMember: number,
): CaptainStaminaChange {
  const poolAfter = Math.max(0, state.pool + perMember * state.living.length);
  const stepAfter = state.step + perMember;
  const exhausted = poolAfter === 0 && state.living.length > 0;
  return {
    state: {
      pool: poolAfter,
      step: stepAfter,
      carried: exhausted ? 0 : state.carried,
      living: exhausted ? [] : state.living,
    },
    poolBefore: state.pool,
    poolAfter,
    stepBefore: state.step,
    stepAfter,
    perMember,
    exhausted,
    casualties: exhausted ? [...state.living] : [],
  };
}

/** Selected count × printed EV ÷ printed quantity, fractions preserved (confirmed 2026-09-13). */
export function proportionalEv(
  count: number,
  ev: { amount: number | null; quantity: number | null },
): number | null {
  if (ev.amount === null || ev.quantity === null || ev.quantity <= 0) return null;
  return (count * ev.amount) / ev.quantity;
}

/** Printed "EV 3 for four minions" style values → amount and creature quantity, or nulls. */
const COUNT_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
};
export function parsePrintedEv(printed: string | null): {
  amount: number | null;
  quantity: number | null;
} {
  if (!printed) return { amount: null, quantity: null };
  const text = printed.trim().toLowerCase();
  const match = /^(\d+)(?:\s+for\s+(\w+)\s+minions?)?$/.exec(text);
  if (!match) return { amount: null, quantity: null };
  const amount = Number(match[1]);
  if (!match[2]) return { amount, quantity: 1 };
  const quantity = COUNT_WORDS[match[2]] ?? Number(match[2]);
  return Number.isInteger(quantity) && quantity > 0
    ? { amount, quantity }
    : { amount, quantity: null };
}

/** The printed With Captain benefits the app applies; anything else stays readable text for the table. */
export interface CaptainBenefit {
  text: string;
  stamina: number;
  strikeDamage: number;
  strikeEdges: number;
  /** True when the printed text is not one of the three automated forms. */
  manual: boolean;
}

export function parseCaptainBenefit(text: string | null): CaptainBenefit | null {
  if (!text || !text.trim()) return null;
  const plain = text.trim();
  let match = /^\+(\d+) bonus to stamina$/i.exec(plain);
  if (match)
    return {
      text: plain,
      stamina: Number(match[1]),
      strikeDamage: 0,
      strikeEdges: 0,
      manual: false,
    };
  match = /^\+(\d+) damage bonus to strikes$/i.exec(plain);
  if (match)
    return {
      text: plain,
      stamina: 0,
      strikeDamage: Number(match[1]),
      strikeEdges: 0,
      manual: false,
    };
  if (/^gain an edge on strikes$/i.test(plain))
    return { text: plain, stamina: 0, strikeDamage: 0, strikeEdges: 1, manual: false };
  if (/^have a double edge on strikes$/i.test(plain))
    return { text: plain, stamina: 0, strikeDamage: 0, strikeEdges: 2, manual: false };
  return { text: plain, stamina: 0, strikeDamage: 0, strikeEdges: 0, manual: true };
}
