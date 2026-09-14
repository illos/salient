// SPDX-License-Identifier: GPL-3.0-only
/**
 * Conversion between the evaluator's selection map and the persisted draft selection list
 * (shared/characterDraft.ts DraftSelection). The owning branch is the R01 step id and the source
 * reference is the decision's own source sentence at the pinned revision, so a saved choice stays
 * explainable without the definitions file.
 */
import type { DraftSelection, JsonValue } from '../characterDraft.ts';
import type { SelectionValue } from '../contracts/characterEvaluation.ts';
import type { DecisionDefinitions } from './definitions.ts';

/** Builds the persisted list for a selection map; unknown decision ids are kept under `step.unknown`. */
export function draftSelectionsFrom(
  selections: Record<string, SelectionValue>,
  definitions: DecisionDefinitions,
): DraftSelection[] {
  const owners = new Map<string, { stepId: string; source: string }>();
  for (const step of definitions.steps)
    for (const decision of step.decisions)
      owners.set(decision.id, { stepId: step.id, source: decision.source });
  return Object.entries(selections).map(([decisionId, value]) => {
    const owner = owners.get(decisionId);
    return {
      decisionId,
      ownerBranchId: owner?.stepId ?? 'step.unknown',
      sources: [
        {
          id: decisionId,
          path: owner?.source ?? 'unknown',
          revision: definitions.compendiumRevision,
        },
      ],
      value: value as JsonValue,
    };
  });
}
