// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structural reads of the R01 decision table for presentation: which decisions are available for
 * the current selections, which option values a decision offers, and which of them the v0.01
 * application supports. These mirror the evaluator's availability and pool rules
 * (shared/evaluate/character.ts) so the wizard shows the same decisions the evaluator judges; no
 * derived value or diagnostic is produced here.
 */
import type { SelectionValue } from '../contracts/characterEvaluation.ts';
import type { Decision, DecisionDefinitions, OptionsByParentEntry } from './definitions.ts';

export type Selections = Record<string, SelectionValue>;

export function indexDecisions(definitions: DecisionDefinitions): Map<string, Decision> {
  const index = new Map<string, Decision>();
  for (const step of definitions.steps)
    for (const decision of step.decisions) index.set(decision.id, decision);
  return index;
}

export function singleValue(selections: Selections, id: string): string | undefined {
  const value = selections[id];
  return typeof value === 'string' ? value : undefined;
}

/** Availability under the raw selections: `availableWhen` holds and every `dependsOn` parent is available and chosen. */
export function isAvailable(
  decision: Decision,
  selections: Selections,
  decisions: Map<string, Decision>,
): boolean {
  if (
    decision.availableWhen &&
    singleValue(selections, decision.availableWhen.decision) !== decision.availableWhen.value
  )
    return false;
  for (const parentId of decision.dependsOn ?? []) {
    const parent = decisions.get(parentId);
    if (!parent || !isAvailable(parent, selections, decisions)) return false;
    if (parent.kind === 'choice' && selections[parentId] === undefined) return false;
    if (
      parent.kind === 'choice' &&
      parent.shape.type === 'single' &&
      parent.options &&
      !parent.options.some(option => option.value === selections[parentId])
    )
      return false;
  }
  return true;
}

/** A human reason a decision is unavailable, for the wizard. */
export function unavailableReason(decision: Decision, decisions: Map<string, Decision>): string {
  if (decision.availableWhen)
    return `Available when ${decision.availableWhen.decision} is ${decision.availableWhen.value}.`;
  const parents = (decision.dependsOn ?? []).map(id => decisions.get(id)?.id ?? id);
  return parents.length ? `Available after ${parents.join(', ')}.` : 'Not available.';
}

export function poolValues(
  definitions: DecisionDefinitions,
  from: string | string[] | undefined,
): string[] {
  if (!from) return [];
  const ids = Array.isArray(from) ? from : [from];
  return [
    ...new Set(
      ids.flatMap(poolId =>
        (definitions.pools[poolId]?.values ?? []).filter(
          value => !poolId.startsWith('pool.languages.') || value !== 'Caelian',
        ),
      ),
    ),
  ];
}

/** The option values a decision offers for the current parent selections. */
export function poolOf(
  decision: Decision,
  selections: Selections,
  definitions: DecisionDefinitions,
): { values: string[]; parent?: OptionsByParentEntry; parentValue?: string } {
  if (decision.options) return { values: decision.options.map(option => option.value) };
  if (decision.optionsByParent) {
    const parentValue = singleValue(selections, decision.dependsOn?.[0] ?? '');
    const parent = parentValue ? decision.optionsByParent[parentValue] : undefined;
    if (!parent) return { values: [] };
    return {
      values: [...(parent.values ?? []), ...poolValues(definitions, parent.optionsFrom)],
      parent,
      parentValue,
    };
  }
  return { values: poolValues(definitions, decision.optionsFrom) };
}

/** Whether the v0.01 application offers an option value (the R01 supported marking). */
export function isSupported(decision: Decision, value: string): boolean {
  const option = decision.options?.find(o => o.value === value);
  if (option) return option.supportedInV001;
  if (decision.supportedInV001) return decision.supportedInV001.includes(value);
  if (decision.supportedSetInV001) return decision.supportedSetInV001.includes(value);
  return false;
}

/**
 * Drops selections of choice decisions that are no longer available (a parent changed), so an
 * invalidated selection cannot keep granting anything. Returns the ids removed.
 */
export function pruneUnavailable(
  selections: Selections,
  definitions: DecisionDefinitions,
): { selections: Selections; removed: string[] } {
  const decisions = indexDecisions(definitions);
  const next: Selections = { ...selections };
  const removed: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const decision of decisions.values()) {
      if (next[decision.id] === undefined || decision.kind !== 'choice') continue;
      const selected = next[decision.id];
      const pool = poolOf(decision, next, definitions).values;
      let noLongerFits = false;
      if (decision.shape.type === 'single')
        noLongerFits = typeof selected !== 'string' || !pool.includes(selected);
      if (decision.shape.type === 'multi' || decision.shape.type === 'points')
        noLongerFits =
          !Array.isArray(selected) ||
          selected.some(value => value !== null && !pool.includes(value));
      if (decision.shape.type === 'assignment') {
        const rawArray = singleValue(next, decision.dependsOn?.[0] ?? '');
        const remaining =
          rawArray?.split(',').map(value => Number(value.trim().replace('−', '-'))) ?? [];
        const targets = decision.shape.targets;
        noLongerFits =
          !selected ||
          typeof selected !== 'object' ||
          Array.isArray(selected) ||
          Object.entries(selected).some(([target, value]) => {
            const index = remaining.indexOf(value);
            if (!targets.includes(target) || index < 0) return true;
            remaining.splice(index, 1);
            return false;
          });
      }
      if (!isAvailable(decision, next, decisions) || noLongerFits) {
        delete next[decision.id];
        removed.push(decision.id);
        changed = true;
      }
    }
  }
  return { selections: next, removed };
}
