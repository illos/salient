// SPDX-License-Identifier: GPL-3.0-only
/**
 * V190 XP-based advancement at a campaign's XP-per-level pace (docs/table-spec.md#respite-mode,
 * user ruling 2026-09-25).
 *
 * chapter/making-a-hero.md, Heroic Advancement: XP is cumulative and the Heroic Advancement table
 * gives 16 XP per level (level 2 at 16 … level 10 at 144). "Adjusted XP Advancement" gives double
 * speed (8 per level) and half speed (32 per level), and "Directors can also create their own
 * customized pace". A campaign stores one whole-number XP per level; absent means 16.
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

/**
 * The level a hero entered play at. Heroes created or admitted above level 1 store
 * `entryLevelXpOffset = (entryLevel − 1) × 16` (convex/lib/characterBuild.ts), a standard-table XP
 * figure kept without a schema change; V190 reads it only as the entry level, so the campaign pace
 * applies to XP earned after entry. Absent means level 1.
 */
export function entryLevelOf(entryLevelXpOffset: number | undefined): number {
  return Math.floor((entryLevelXpOffset ?? 0) / STANDARD_XP_PER_LEVEL) + 1;
}

/** min(10, entryLevel + floor(xp / xpPerLevel)), where xp is the hero's cumulative XP. */
export function earnedLevel(xp: number, xpPerLevel: number, entryLevelXpOffset?: number): number {
  return Math.min(
    MAX_HERO_LEVEL,
    entryLevelOf(entryLevelXpOffset) + Math.floor(Math.max(0, xp) / xpPerLevel),
  );
}

/**
 * Level-ups a completed respite grants: the levels owed and not yet held or pending,
 * max(0, earnedLevel − (level + pendingLevelUps)). Lowering the pace grants catch-up levels at the
 * next Complete; raising it never removes a level or a pending level-up.
 */
export function levelUpsOwed(
  xp: number,
  xpPerLevel: number,
  entryLevelXpOffset: number | undefined,
  levelWithPending: number,
): number {
  return Math.max(0, earnedLevel(xp, xpPerLevel, entryLevelXpOffset) - levelWithPending);
}

export interface XpProgress {
  xp: number;
  xpPerLevel: number;
  /** The level this XP reaches at this pace. */
  earnedLevel: number;
  /**
   * The next level a Complete would grant and the XP it needs; null when level 10 is held, pending
   * or earned. It counts from max(earnedLevel, level + pending), because Complete grants only above
   * level + pending (after a raised pace or a manual grant the XP-earned level may already be held).
   */
  next: { level: number; at: number } | null;
}

/** The sheet's "XP 20 · level 3 at 32" line; outside a campaign pass 16. */
export function xpProgress(
  xp: number,
  xpPerLevel: number,
  entryLevelXpOffset: number | undefined,
  levelWithPending: number,
): XpProgress {
  const level = earnedLevel(xp, xpPerLevel, entryLevelXpOffset);
  const nextLevel = Math.max(level, levelWithPending) + 1;
  return {
    xp,
    xpPerLevel,
    earnedLevel: level,
    next:
      nextLevel > MAX_HERO_LEVEL
        ? null
        : { level: nextLevel, at: (nextLevel - entryLevelOf(entryLevelXpOffset)) * xpPerLevel },
  };
}

/** "20 · level 3 at 32"; at level 10 only the XP. */
export function xpProgressText(progress: XpProgress): string {
  return progress.next
    ? `${progress.xp} · level ${progress.next.level} at ${progress.next.at}`
    : `${progress.xp}`;
}
