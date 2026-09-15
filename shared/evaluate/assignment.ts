// SPDX-License-Identifier: GPL-3.0-only
/** Q-R-101: one transition for named input and drag/drop; fixed Fury scores are never assignments. */
import type { SelectionValue } from '../contracts/characterEvaluation.ts';

export const ASSIGNABLE_CHARACTERISTICS = ['Reason', 'Intuition', 'Presence'] as const;
export const ASSIGNMENT_ID = 'class.fury.array-assignment';
export function characteristicArray(value: SelectionValue | undefined): number[] {
  return typeof value === 'string'
    ? value.split(',').map(part => Number(part.trim().replace('−', '-')))
    : [];
}

/** Returns null for a valid partial/full assignment, otherwise a useful refusal reason. */
export function assignmentError(value: Record<string, number>, array: number[]): string | null {
  if (Object.keys(value).some(key => !ASSIGNABLE_CHARACTERISTICS.includes(key as never)))
    return 'Might and Agility are fixed at 2; assign only Reason, Intuition and Presence.';
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
): Record<string, SelectionValue> {
  if (!ASSIGNABLE_CHARACTERISTICS.includes(target as never))
    throw new Error(
      'Might and Agility are fixed at 2; assign only Reason, Intuition and Presence.',
    );
  const array = characteristicArray(selections['class.fury.characteristic-array']);
  if (!['2,-1,-1', '1,1,-1', '1,0,0'].includes(array.join(',')))
    throw new Error('Choose a supported characteristic array before assigning scores.');
  const existing = selections[ASSIGNMENT_ID];
  const assignment =
    existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...existing } : {};
  if (fromTarget) {
    if (assignment[fromTarget] !== value) throw new Error('The dragged value has changed.');
    delete assignment[fromTarget];
  }
  if (value === null) delete assignment[target];
  else assignment[target] = value;
  const error = assignmentError(assignment, array);
  if (error) throw new Error(error);
  return { ...selections, [ASSIGNMENT_ID]: assignment };
}
