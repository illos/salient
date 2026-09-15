// SPDX-License-Identifier: GPL-3.0-only
/** Q-CHAR-2, confirmed 2026-09-15: retain compatible current amounts; cap downward only. */
import type { DerivedBaseline } from '../contracts/characterEvaluation.ts';
import type { BuildReconciliation, HeroLiveState } from '../contracts/liveState.ts';

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
    const currentAfter = Math.min(currentBefore, maximumAfter);
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
