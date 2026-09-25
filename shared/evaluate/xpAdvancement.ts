// SPDX-License-Identifier: GPL-3.0-only
/**
 * V190 campaign XP-per-level pace and V191 XP bank (docs/table-spec.md#respite-mode, user rulings
 * 2026-09-25).
 *
 * chapter/making-a-hero.md, Heroic Advancement: "The amount of Experience you gain is cumulative"
 * and the Heroic Advancement table gives 16 XP per level (level 2 at 16 … level 10 at 144).
 * "Adjusted XP Advancement" gives double speed (8 per level) and half speed (32 per level), and
 * "Directors can also create their own customized pace". A campaign stores one whole-number XP per
 * level; absent means 16.
 *
 * User-ruled adaptation (V191, 2026-09-25: "Switch to a bank. The books mention using different
 * rates of advancement, but they assume 16 almost always in their text. The app actually makes that
 * recommendation of adjustment a reality and so a bank makes more sense."): instead of a cumulative
 * total read against the table, each hero keeps an XP bank. Respite Complete adds Victories to the
 * bank and spends each full XP-per-level on one pending level-up; the remainder stays banked. At a
 * fixed pace from level 1 this reaches the same levels as the cumulative table. Alternatives
 * considered: V190's cumulative XP with owed levels (superseded) and cumulative table XP from the
 * entry level (Q-XP-1, resolved by this ruling).
 */

/** chapter/making-a-hero.md, Heroic Advancement Table: 16 XP per level. */
export const STANDARD_XP_PER_LEVEL = 16;
/** Adjusted XP Advancement Table: double speed 8, half speed 32 (the slider's snap points). */
export const XP_PER_LEVEL_PRESETS = [
  { label: 'Double', value: 8 },
  { label: 'Standard', value: 16 },
  { label: 'Half', value: 32 },
] as const;
/** Accepted custom pace (a product bound, not a rule): whole numbers from 1 to 200. */
export const XP_PER_LEVEL_MIN = 1;
export const XP_PER_LEVEL_MAX = 200;
export const MAX_HERO_LEVEL = 10;

/** Why a proposed XP-per-level value is refused, or null when it is accepted. */
export function xpPerLevelProblem(value: number): string | null {
  return Number.isInteger(value) && value >= XP_PER_LEVEL_MIN && value <= XP_PER_LEVEL_MAX
    ? null
    : `XP per level must be a whole number from ${XP_PER_LEVEL_MIN} to ${XP_PER_LEVEL_MAX}.`;
}

/** What Respite Complete does to one hero's XP (V191 bank). */
export interface RespiteXp {
  /** The bank after conversion and spending. */
  bank: number;
  /** Lifetime XP after the Victories are added (display only). */
  lifetime: number;
  /** Pending level-ups this Complete grants. */
  levelUps: number;
}

/**
 * rule/resource/experience.md: "you gain XP equal to your Victories, then your Victories reset to
 * 0". V191 bank: bank += Victories and lifetime += Victories; then while bank ≥ xpPerLevel and
 * level + pending < 10, bank −= xpPerLevel and one level-up is granted. A remainder, or everything
 * at level 10, stays in the bank. The pace is read at this Complete, so a changed pace simply
 * applies to the bank from now on.
 */
export function respiteXp(
  bank: number,
  lifetime: number | undefined,
  victories: number,
  xpPerLevel: number,
  levelWithPending: number,
): RespiteXp {
  let next = bank + victories;
  let levelUps = 0;
  while (next >= xpPerLevel && levelWithPending + levelUps < MAX_HERO_LEVEL) {
    next -= xpPerLevel;
    levelUps += 1;
  }
  return { bank: next, lifetime: (lifetime ?? 0) + victories, levelUps };
}

export interface XpProgress {
  /** The XP bank. */
  bank: number;
  xpPerLevel: number;
  /** Lifetime XP, or null when the hero has none recorded. */
  lifetime: number | null;
  /** Level 10 is held or pending, so the bank buys nothing more. */
  capped: boolean;
}

/** The sheet's XP figures; outside a campaign pass 16. */
export function xpProgress(
  bank: number,
  xpPerLevel: number,
  lifetime: number | undefined,
  levelWithPending: number,
): XpProgress {
  return {
    bank,
    xpPerLevel,
    lifetime: lifetime ?? null,
    capped: levelWithPending >= MAX_HERO_LEVEL,
  };
}

/** Sheet rows: "XP 5 / 16" (only the bank at level 10), then "Lifetime XP 37" when recorded. */
export function xpProgressRows(progress: XpProgress): [string, string][] {
  const rows: [string, string][] = [
    ['XP', progress.capped ? `${progress.bank}` : `${progress.bank} / ${progress.xpPerLevel}`],
  ];
  if (progress.lifetime !== null) rows.push(['Lifetime XP', `${progress.lifetime}`]);
  return rows;
}
