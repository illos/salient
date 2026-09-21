// SPDX-License-Identifier: GPL-3.0-only
import type { Decision, DecisionDefinitions } from '../shared/evaluate/definitions.ts';
import { isAvailable, isSupported, poolOf, type Selections } from '../shared/evaluate/structure.ts';

/** Conservative positive proof: one finite single choice from a two-item portfolio selection.
 * Unrecognized/dynamic forms remain unknown; absence of a witness is never claimed impossible.
 */
export function selectedPoolWitness(
  decision: Decision,
  required: string | undefined,
  definitions: DecisionDefinitions,
  index: Map<string, Decision>,
): Selections | undefined {
  const ordinary = (d: Decision) =>
    !(
      d.abilityPool ||
      d.ownedPool ||
      d.overlapBenefit ||
      d.duplicateFixedSkill ||
      d.conditions?.length ||
      d.optionsFrom ||
      d.options?.some(
        o => o.requiresFeature || o.excludesFeatures?.length || o.excludedWhen?.length,
      )
    );
  if (
    !required ||
    decision.shape.type !== 'single' ||
    !decision.selectedPool ||
    decision.selectedPool.exclude ||
    !ordinary(decision) ||
    decision.availableWhen ||
    decision.dependsOnAny?.length ||
    decision.dependsOn?.length !== 1 ||
    decision.dependsOn[0] !== decision.selectedPool.decision ||
    !isSupported(decision, required)
  )
    return;
  const multi = index.get(decision.selectedPool.decision);
  if (
    !multi ||
    !ordinary(multi) ||
    multi.shape.type !== 'multi' ||
    multi.shape.count !== 2 ||
    multi.selectedPool ||
    multi.availableWhen ||
    multi.dependsOn?.length ||
    multi.dependsOnAny?.length !== 1 ||
    !multi.optionsByParent ||
    Object.values(multi.optionsByParent).some(p => !p.values || p.optionsFrom)
  )
    return;
  const parent = index.get(multi.dependsOnAny[0]!);
  if (!parent) return;
  // Establish one consistent ancestor map; only finite single choices and equality gates qualify.
  const choose = (
    d: Decision,
    value: string,
    selections: Selections,
    seen = new Set<string>(),
  ): boolean => {
    if (
      seen.has(d.id) ||
      !ordinary(d) ||
      d.kind !== 'choice' ||
      d.shape.type !== 'single' ||
      d.selectedPool ||
      d.optionsByParent ||
      d.dependsOnAny?.length ||
      !d.options ||
      !isSupported(d, value) ||
      (selections[d.id] !== undefined && selections[d.id] !== value)
    )
      return false;
    seen.add(d.id);
    selections[d.id] = value;
    if ((d.dependsOn ?? []).some(id => id !== d.availableWhen?.decision)) return false;
    if (d.availableWhen) {
      const ancestor = index.get(d.availableWhen.decision);
      if (!ancestor || !choose(ancestor, d.availableWhen.value, selections, seen)) return false;
    }
    return (
      isAvailable(d, selections, index) && poolOf(d, selections, definitions).values.includes(value)
    );
  };
  for (const option of parent.options ?? []) {
    const selections: Selections = {};
    if (!choose(parent, option.value, selections) || !isAvailable(multi, selections, index))
      continue;
    const values = [...new Set(poolOf(multi, selections, definitions).values)].filter(v =>
      isSupported(multi, v),
    );
    if (!values.includes(required)) continue;
    for (const other of values.filter(v => v !== required)) {
      selections[multi.id] = [required, other];
      selections[decision.id] = required;
      if (
        isAvailable(decision, selections, index) &&
        poolOf(decision, selections, definitions).values.includes(required)
      )
        return selections;
    }
  }
}
