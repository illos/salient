// SPDX-License-Identifier: GPL-3.0-only
import type { DerivedBaseline } from '../contracts/characterEvaluation.ts';
/** Pinned feature/talent/level-1/clarity-and-strain.md: maximum negative is 1 + Reason. */
export function heroicResourceFloor(
  baseline: DerivedBaseline | null | undefined,
  resource: string,
): number {
  return resource === 'clarity' && baseline?.class.value === 'Talent'
    ? -(1 + baseline.characteristics.R.value)
    : 0;
}
