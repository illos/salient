// SPDX-License-Identifier: GPL-3.0-only
/** V86: the one-time starting award, independent of later build edits and inventory policy. */
import type { DerivedBaseline, DerivedValue } from './characterEvaluation.ts';
import { startingRewardItems } from '../content/starting-reward-items.ts';

export interface StartingRewardItem {
  /** Stable within this award, even if a later build selects a different item. */
  id: string;
  decisionId: string;
  name: string;
  sourcePath: string;
  state: 'possessed' | 'broken' | 'absent' | 'pending-Director';
  condition?: string;
  projectSource?: string;
}

export interface StartingRewards<RevisionId extends string = string> {
  originRevisionId: RevisionId;
  initializedAt: number;
  wealth: number;
  renown: number;
  projectPoints: number;
  sources: { wealth: string[]; renown: string[]; projectPoints: string[] };
  items: StartingRewardItem[];
}

function sourcePaths(value: DerivedValue<number> | undefined): string[] {
  return [...new Set(value?.provenance.map(entry => entry.source.path) ?? [])];
}

/** No evaluation or hidden inheritance lookup: copy the admitted source-backed award once. */
export function makeStartingRewards<RevisionId extends string>(
  baseline: DerivedBaseline,
  originRevisionId: RevisionId,
  initializedAt: number,
): StartingRewards<RevisionId> {
  return {
    originRevisionId,
    initializedAt,
    wealth: baseline.wealth.value,
    renown: baseline.renown.value,
    projectPoints: baseline.projectPoints?.value ?? 0,
    sources: {
      wealth: sourcePaths(baseline.wealth),
      renown: sourcePaths(baseline.renown),
      projectPoints: sourcePaths(baseline.projectPoints),
    },
    items: startingRewardItems(baseline.features, baseline.initialItems).map((item, index) => ({
      ...item,
      id: `${originRevisionId}:starting-item:${index}`,
    })),
  };
}
