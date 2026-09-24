// SPDX-License-Identifier: GPL-3.0-only
/**
 * Q-CHAR-2, revised 2026-09-24 (docs/character-wizard-spec.md#current-values-when-a-build-changes):
 * a build change keeps the damage taken and Recoveries spent as maxima rise or fall,
 * `newCurrent = newMaximum − (oldMaximum − oldCurrent)`. It never drops a hero to 0 Stamina or
 * below (a hero already at 0 or below is not pushed further down) nor Recoveries below 0.
 */
import type { DerivedBaseline } from '../contracts/characterEvaluation.ts';
import type { BuildReconciliation, HeroLiveState } from '../contracts/liveState.ts';

const FLOOR = { stamina: 1, recoveries: 0 } as const;

export function reconciledCurrent(
  field: keyof typeof FLOOR,
  currentBefore: number,
  maximumBefore: number | null,
  maximumAfter: number,
): number {
  // Without a previous maximum there is no known deficit; keep the amount within the new maximum.
  if (maximumBefore === null) return Math.min(currentBefore, maximumAfter);
  // A current amount above its old maximum is not carried above the new one (spec, current values).
  const kept = Math.min(maximumAfter, maximumAfter - (maximumBefore - currentBefore));
  if (kept >= FLOOR[field]) return kept;
  return Math.max(kept, Math.min(currentBefore, FLOOR[field]));
}

export function previewBuildReconciliation(
  live: HeroLiveState,
  previous: DerivedBaseline | null,
  next: DerivedBaseline,
): BuildReconciliation {
  const changes: BuildReconciliation['changes'] = [];
  for (const [field, maximum] of [
    ['stamina', 'staminaMaximum'],
    ['recoveries', 'recoveriesMaximum'],
  ] as const) {
    const maximumBefore = previous?.[maximum].value ?? null;
    const maximumAfter = next[maximum].value;
    const currentBefore = live[field];
    const currentAfter = reconciledCurrent(field, currentBefore, maximumBefore, maximumAfter);
    if (maximumBefore !== maximumAfter || currentBefore !== currentAfter)
      changes.push({ field, maximumBefore, maximumAfter, currentBefore, currentAfter });
  }
  const nextResource = next.heroicResource.name.value;
  return {
    changes,
    incompatibleResource:
      live.heroicResource.name === nextResource
        ? null
        : { before: live.heroicResource.name, after: nextResource },
  };
}
