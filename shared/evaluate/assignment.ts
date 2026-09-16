// SPDX-License-Identifier: GPL-3.0-only
/** One transition for named input and drag/drop; fixed class scores are never assignments. */
import type { SelectionValue } from '../contracts/characterEvaluation.ts';
import type { DecisionDefinitions } from './definitions.ts';
import { isAvailable, indexDecisions, isSupported } from './structure.ts';

/** Legacy names remain stable for saved Fury selections and headless callers. */
export const ASSIGNABLE_CHARACTERISTICS = ['Reason', 'Intuition', 'Presence'] as const;
export const ASSIGNMENT_ID = 'class.fury.array-assignment';
export function characteristicArray(value: SelectionValue | undefined): number[] {
  return typeof value === 'string'
    ? value.split(',').map(part => Number(part.trim().replace('−', '-')))
    : [];
}

export function assignmentContext(
  selections: Record<string, SelectionValue>,
  definitions?: DecisionDefinitions,
) {
  if (!definitions)
    return {
      decisionId: ASSIGNMENT_ID,
      arrayDecisionId: 'class.fury.characteristic-array',
      targets: [...ASSIGNABLE_CHARACTERISTICS] as string[],
      fixed: { Might: 2, Agility: 2 } as Record<string, number>,
      array: characteristicArray(selections['class.fury.characteristic-array']),
    };
  const decisions = indexDecisions(definitions);
  const decision = [...decisions.values()].find(
    d => d.shape.type === 'assignment' && isAvailable(d, selections, decisions),
  );
  if (!decision || decision.shape.type !== 'assignment') return null;
  const className = selections['class.choice'];
  const profile =
    typeof className === 'string' ? definitions.classProfiles?.[className] : undefined;
  const arrayDecisionId = decision.dependsOn?.[0] ?? '';
  return {
    decisionId: decision.id,
    arrayDecisionId,
    targets: decision.shape.targets,
    fixed: profile?.fixedCharacteristics ?? { Might: 2, Agility: 2 },
    array: characteristicArray(selections[arrayDecisionId]),
  };
}

/** Returns null for a valid partial/full assignment, otherwise a useful refusal reason. */
export function assignmentError(
  value: Record<string, number>,
  array: number[],
  targets: readonly string[] = ASSIGNABLE_CHARACTERISTICS,
): string | null {
  if (Object.keys(value).some(key => !targets.includes(key)))
    return targets === ASSIGNABLE_CHARACTERISTICS
      ? 'Might and Agility are fixed at 2; assign only Reason, Intuition and Presence.'
      : `Assign only ${targets.join(', ')}; the other class characteristics are fixed.`;
  const remaining = [...array];
  for (const amount of Object.values(value)) {
    const index = remaining.indexOf(amount);
    if (!Number.isInteger(amount) || index < 0)
      return 'Use each value of the selected characteristic array once, including repeated values.';
    remaining.splice(index, 1);
  }
  return null;
}

export function assignCharacteristic(
  selections: Record<string, SelectionValue>,
  target: string,
  value: number | null,
  fromTarget?: string,
  definitions?: DecisionDefinitions,
): Record<string, SelectionValue> {
  const context = assignmentContext(selections, definitions);
  if (!context || !context.targets.includes(target))
    throw new Error(
      `Assign only ${context?.targets.join(', ') ?? 'the available characteristics'}; other class characteristics are fixed.`,
    );
  const { array, decisionId, arrayDecisionId } = context;
  const arrayDecision = definitions ? indexDecisions(definitions).get(arrayDecisionId) : undefined;
  const selected = selections[arrayDecisionId];
  if (
    arrayDecision
      ? typeof selected !== 'string' || !isSupported(arrayDecision, selected)
      : !['2,-1,-1', '1,1,-1', '1,0,0'].includes(array.join(','))
  )
    throw new Error('Choose a supported characteristic array before assigning scores.');
  const existing = selections[decisionId];
  const assignment =
    existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...existing } : {};
  if (fromTarget) {
    if (assignment[fromTarget] !== value) throw new Error('The dragged value has changed.');
    delete assignment[fromTarget];
  }
  if (value === null) delete assignment[target];
  else assignment[target] = value;
  const error = assignmentError(assignment, array, context.targets);
  if (error) throw new Error(error);
  return { ...selections, [decisionId]: assignment };
}
