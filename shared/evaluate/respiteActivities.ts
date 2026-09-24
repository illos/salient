// SPDX-License-Identifier: GPL-3.0-only
/**
 * How many respite activities a hero may undertake in one respite.
 *
 * - rule/resource/respite.md: "You can also undertake one respite activity".
 * - feature/null/level-2/rapid-processing.md (Chronokinetic): "during any respite, you can take an
 *   additional respite activity." It is the only such grant at levels 1–3.
 *
 * Deferred and resolved manually (docs/build/V169-respite-extra-activity.md):
 * - Further grants above level 3: feature/talent/level-8/doubling-the-hours.md,
 *   feature/fury/level-8/menagerie.md, feature/tactician/level-7/grand-strategy.md and
 *   shock-and-awe.md, title/master-librarian.md; and, at any level, treasure/artifact/mortal-coil.md
 *   and project/spend-time-with-loved-ones.md (Event 2: a project roll that is not an activity).
 * - Conditional losses of the activity, at any level: complication/evanesceria.md (a rolled
 *   drawback), complication/ward.md (when the ward needs help), and monster effects on the next
 *   respite (flesh-mournling, high-elf-palinode, radenwight-malice). The Director records the lost
 *   activity by name with `/respite activity`.
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
