// SPDX-License-Identifier: GPL-3.0-only
/**
 * How many respite activities a hero may undertake in one respite.
 *
 * - rule/resource/respite.md: "You can also undertake one respite activity".
 * - feature/null/level-2/rapid-processing.md (Chronokinetic): "during any respite, you can take an
 *   additional respite activity." It is the only additional-activity grant in the Compendium.
 */
import type { GrantedFeature } from '../contracts/characterEvaluation.ts';

const ADDITIONAL_ACTIVITY_SOURCES = ['feature/null/level-2/rapid-processing.md'];

/** The activities a respite participant has undertaken, in order. */
export function activitiesOf(participant: {
  activity?: string;
  moreActivities?: string[];
}): string[] {
  return participant.activity ? [participant.activity, ...(participant.moreActivities ?? [])] : [];
}

export function respiteActivityAllowance(
  features: readonly Pick<GrantedFeature, 'sourcePath'>[] | null | undefined,
): number {
  const extra = (features ?? []).filter(feature =>
    ADDITIONAL_ACTIVITY_SOURCES.some(source => feature.sourcePath.endsWith(source)),
  ).length;
  return 1 + extra;
}
