// SPDX-License-Identifier: GPL-3.0-only
/**
 * Forge Steel play-state reconciliation (V182; docs/forge-steel-interchange.md#current-state-is-not-simply-current-totals).
 * Forge stores damage taken and Recoveries spent, not current totals. Salient recomputes the
 * current values against its own maxima, so a Forge maximum that differs from Salient's never
 * carries over:
 *
 * - Stamina = Salient Stamina maximum − Forge `staminaDamage`. rule/health/stamina.md: "your Stamina
 *   is reduced by an amount equal to the remaining damage". Not clamped at 0: a hero's Stamina can
 *   fall below 0 (rule/health/dying.md).
 * - Recoveries = max(0, Salient Recoveries maximum − Forge `recoveriesUsed`). rule/health/recoveries.md:
 *   "Each hero has a number of Recoveries determined by their class"; spending one reduces them,
 *   and a hero cannot have fewer than none.
 * - Temporary Stamina and surges are carried as Forge records them (rule/health/temporary-stamina.md,
 *   rule/resource/surge.md).
 *
 * The seed is stored on the import record only. Whether it survives admission is Q-V-3 (open);
 * until answered, admission starts from full as docs/live-state-initialization.md describes.
 */

/** The four Forge `state` fields this reconciles, each a non-negative integer. */
export interface ForgePlayState {
  staminaDamage: number;
  recoveriesUsed: number;
  staminaTemp: number;
  surges: number;
}
export interface ForgeLiveSeed {
  stamina: number;
  recoveries: number;
  temporaryStamina: number;
  surges: number;
  /** Salient's maxima the values were computed against. */
  staminaMaximum: number;
  recoveriesMaximum: number;
  /** The Forge values, verbatim. */
  forge: ForgePlayState;
}

const fields = ['staminaDamage', 'recoveriesUsed', 'staminaTemp', 'surges'] as const;

/** The Forge play-state fields, or null when any is missing or not a non-negative integer. */
export function forgePlayState(state: Record<string, unknown>): ForgePlayState | null {
  const values = fields.map(field => state[field]);
  if (values.some(value => typeof value !== 'number' || !Number.isInteger(value) || value < 0))
    return null;
  const [staminaDamage, recoveriesUsed, staminaTemp, surges] = values as number[];
  return {
    staminaDamage: staminaDamage!,
    recoveriesUsed: recoveriesUsed!,
    staminaTemp: staminaTemp!,
    surges: surges!,
  };
}

/** Current values against Salient's maxima; null when either maximum is unknown (incomplete build). */
export function forgeLiveSeed(
  play: ForgePlayState | null,
  maxima: { staminaMaximum: number | null; recoveriesMaximum: number | null },
): ForgeLiveSeed | null {
  const { staminaMaximum, recoveriesMaximum } = maxima;
  if (!play || !Number.isInteger(staminaMaximum) || !Number.isInteger(recoveriesMaximum))
    return null;
  return {
    stamina: staminaMaximum! - play.staminaDamage,
    recoveries: Math.max(0, recoveriesMaximum! - play.recoveriesUsed),
    temporaryStamina: play.staminaTemp,
    surges: play.surges,
    staminaMaximum: staminaMaximum!,
    recoveriesMaximum: recoveriesMaximum!,
    forge: play,
  };
}
