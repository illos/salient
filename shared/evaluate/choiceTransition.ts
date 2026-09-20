// SPDX-License-Identifier: GPL-3.0-only
/** The wizard's choice edit, shared by interactive and programmatic clients. */
import type { SelectionValue } from '../contracts/characterEvaluation.ts';
import type { DecisionDefinitions } from './definitions.ts';
import { assignmentContext } from './assignment.ts';
import { pruneUnavailable, type Selections } from './structure.ts';

export function changeChoice(
  selections: Selections,
  definitions: DecisionDefinitions,
  decisionId: string,
  value?: SelectionValue,
): { selections: Selections; removed: string[] } {
  const next = { ...selections };
  const assignment = assignmentContext(selections, definitions);
  if (assignment?.arrayDecisionId === decisionId && value !== selections[decisionId])
    delete next[assignment.decisionId];
  if (value === undefined) delete next[decisionId];
  else next[decisionId] = value;
  return pruneUnavailable(next, definitions);
}
