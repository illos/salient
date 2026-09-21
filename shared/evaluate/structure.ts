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
import { COMPLICATION_FUTURE_ABILITY_ELIGIBILITY } from '../content/supporting-complications.ts';
import { SECOND_KIT_DECISION, arsenalOverlaps } from './classes/tactician.ts';

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

/** A `dependsOn`/`dependsOnAny` parent is satisfied when it is available and, for a choice, chosen from its options. */
function parentSatisfied(
  parentId: string,
  selections: Selections,
  decisions: Map<string, Decision>,
  scanningFixedGrants: boolean,
): boolean {
  const parent = decisions.get(parentId);
  if (!parent || !isAvailable(parent, selections, decisions, scanningFixedGrants)) return false;
  if (parent.kind === 'choice' && selections[parentId] === undefined) return false;
  if (
    parent.kind === 'choice' &&
    parent.shape.type === 'single' &&
    parent.options &&
    !parent.options.some(option => option.value === selections[parentId])
  )
    return false;
  return true;
}

/**
 * The parent whose chosen value governs a decision's `optionsByParent` pool, missing-choice sentence
 * and pruning. `dependsOn` parents are all required, so its first entry is effective whatever its
 * state. With `dependsOnAny` the effective parent is the first listed parent that is satisfied and,
 * when `optionsByParent` exists, chosen with a value that has an entry; `undefined` when none
 * qualifies, which makes the decision unavailable.
 */
export function effectiveParent(
  decision: Decision,
  selections: Selections,
  decisions: Map<string, Decision>,
  scanningFixedGrants = false,
): { id: string; value?: string } | undefined {
  if (decision.dependsOnAny?.length) {
    for (const id of decision.dependsOnAny) {
      if (!parentSatisfied(id, selections, decisions, scanningFixedGrants)) continue;
      const value = singleValue(selections, id);
      if (decision.optionsByParent && (value === undefined || !decision.optionsByParent[value]))
        continue;
      return { id, value };
    }
    return undefined;
  }
  const id = decision.dependsOn?.[0];
  return id === undefined ? undefined : { id, value: singleValue(selections, id) };
}

/**
 * Availability under the raw selections: `availableWhen` holds, every `dependsOn` parent is available
 * and chosen, and (when `dependsOnAny` is set) an effective parent exists.
 */
export function isAvailable(
  decision: Decision,
  selections: Selections,
  decisions: Map<string, Decision>,
  scanningFixedGrants = false,
): boolean {
  if (scanningFixedGrants && decision.duplicateFixedSkill) return false;
  if (
    decision.availableWhen &&
    singleValue(selections, decision.availableWhen.decision) !== decision.availableWhen.value
  )
    return false;
  for (const condition of decision.conditions ?? []) {
    const selected = selections[condition.decision];
    const matches = condition.includes
      ? Array.isArray(selected) && selected.includes(condition.value)
      : selected === condition.value;
    if (condition.not ? matches : !matches) return false;
  }
  if (decision.duplicateFixedSkill) {
    const { skill, occurrence } = decision.duplicateFixedSkill;
    let count = 0;
    for (const candidate of decisions.values()) {
      if (candidate.duplicateFixedSkill || !isAvailable(candidate, selections, decisions, true))
        continue;
      const value = selections[candidate.id];
      const selected = Array.isArray(value) ? value : [value];
      const grants =
        candidate.kind === 'automatic'
          ? (candidate.grants ?? [])
          : selected.flatMap(
              item =>
                candidate.options?.find(option => option.value === item && option.supportedInV001)
                  ?.grants ?? [],
            );
      count += grants.filter(grant => grant.kind === 'skill' && grant.value === skill).length;
    }
    if (count < occurrence) return false;
  }
  // Field Arsenal: a benefit choice exists only while both kits print different values for it.
  if (
    decision.overlapBenefit &&
    arsenalOverlaps(
      singleValue(selections, 'kit.choice'),
      singleValue(selections, SECOND_KIT_DECISION),
    )[decision.overlapBenefit] !== 'differs'
  )
    return false;
  for (const parentId of decision.dependsOn ?? [])
    if (!parentSatisfied(parentId, selections, decisions, scanningFixedGrants)) return false;
  if (
    decision.dependsOnAny?.length &&
    !effectiveParent(decision, selections, decisions, scanningFixedGrants)
  )
    return false;
  return true;
}

/** Knowledge candidates retain each fixed origin, so duplicate entitlements are not lost. */
export function knowledgeCandidates(
  selections: Selections,
  definitions: DecisionDefinitions,
  kind: 'skill' | 'language',
  includeRemoved = false,
): { name: string; decisionId: string; fixed: boolean }[] {
  const index = indexDecisions(definitions);
  const out: { name: string; decisionId: string; fixed: boolean }[] = [];
  for (const decision of index.values()) {
    if (!isAvailable(decision, selections, index)) continue;
    const selected = selections[decision.id];
    const values = (Array.isArray(selected) ? selected : [selected]).filter(
      (value): value is string => typeof value === 'string',
    );
    const grants =
      decision.kind === 'automatic'
        ? (decision.grants ?? [])
        : values.flatMap(
            value =>
              decision.options?.find(option => option.value === value && option.supportedInV001)
                ?.grants ?? [],
          );
    for (const grant of grants)
      if (grant.kind === kind)
        out.push({ name: grant.value, decisionId: decision.id, fixed: true });
    const inferred =
      kind === 'skill'
        ? /\.skills?(\.|$)|-skill$/.test(decision.id) || !!decision.replacesDuplicateSkill
        : decision.id === 'culture.language' || decision.id.endsWith('.languages');
    if (
      decision.kind !== 'choice' ||
      !(decision.selectionRole ? decision.selectionRole === kind : inferred)
    )
      continue;
    const pool = basePoolOf(decision, selections, definitions).values;
    for (const value of values)
      if (pool.includes(value) && isSupported(decision, value))
        out.push({ name: value, decisionId: decision.id, fixed: false });
  }
  if (kind === 'skill') {
    const fixed = new Set(out.filter(item => item.fixed).map(item => item.name));
    const chosen = out.filter(item => !item.fixed);
    const invalid = new Set(
      chosen
        .filter(
          item =>
            fixed.has(item.name) || chosen.filter(other => other.name === item.name).length > 1,
        )
        .map(item => item.decisionId),
    );
    out.splice(0, out.length, ...out.filter(item => item.fixed || !invalid.has(item.decisionId)));
  }
  if (includeRemoved) return out;
  const removed = new Set<string>();
  for (const decision of index.values()) {
    if (decision.selectionRole !== `${kind}-removal` || !isAvailable(decision, selections, index))
      continue;
    const selected = selections[decision.id];
    const values = Array.isArray(selected) ? selected : [selected];
    const base = basePoolOf(decision, selections, definitions).values;
    const chosen = decision.selectedPool ? selections[decision.selectedPool.decision] : undefined;
    for (const value of values)
      if (
        typeof value === 'string' &&
        base.includes(value) &&
        (!decision.selectedPool ||
          (Array.isArray(chosen) ? chosen.includes(value) : chosen === value)) &&
        out.some(item => item.name === value)
      )
        removed.add(value);
  }
  return out.filter(item => !removed.has(item.name));
}

/** A human reason a decision is unavailable, for the wizard. */
export function unavailableReason(decision: Decision, decisions: Map<string, Decision>): string {
  if (decision.availableWhen)
    return `Available when ${decision.availableWhen.decision} is ${decision.availableWhen.value}.`;
  const parents = (decision.dependsOn ?? []).map(id => decisions.get(id)?.id ?? id);
  const alternatives = (decision.dependsOnAny ?? []).map(id => decisions.get(id)?.id ?? id);
  const clauses = [
    ...(parents.length ? [parents.join(', ')] : []),
    ...(alternatives.length ? [`one of ${alternatives.join(', ')}`] : []),
  ];
  return clauses.length ? `Available after ${clauses.join(' and ')}.` : 'Not available.';
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
function basePoolOf(
  decision: Decision,
  selections: Selections,
  definitions: DecisionDefinitions,
): { values: string[]; parent?: OptionsByParentEntry; parentValue?: string } {
  if (decision.options) return { values: decision.options.map(option => option.value) };
  if (decision.overlapBenefit)
    return {
      values: [
        singleValue(selections, 'kit.choice'),
        singleValue(selections, SECOND_KIT_DECISION),
      ].filter((name): name is string => typeof name === 'string'),
    };
  if (decision.optionsByParent) {
    const parentValue = effectiveParent(decision, selections, indexDecisions(definitions))?.value;
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

/** Shared owned-skill/language restrictions for editor controls and evaluator validation. */
export function poolOf(
  decision: Decision,
  selections: Selections,
  definitions: DecisionDefinitions,
): { values: string[]; parent?: OptionsByParentEntry; parentValue?: string } {
  let pool = basePoolOf(decision, selections, definitions);
  if (decision.options?.some(option => option.requiresFeature || option.excludesFeatures?.length)) {
    const index = indexDecisions(definitions);
    const features = new Set<string>();
    for (const candidate of index.values()) {
      if (candidate.id === decision.id || !isAvailable(candidate, selections, index)) continue;
      const value = selections[candidate.id];
      const selected = Array.isArray(value) ? value : [value];
      const grants =
        candidate.kind === 'automatic'
          ? (candidate.grants ?? [])
          : selected.flatMap(
              item => candidate.options?.find(option => option.value === item)?.grants ?? [],
            );
      for (const grant of grants) features.add(grant.value);
      if (candidate.id.startsWith('ancestry.') && candidate.id.endsWith('.purchased-traits'))
        for (const item of selected)
          if (typeof item === 'string' && candidate.options?.some(option => option.value === item))
            features.add(item);
    }
    pool = {
      ...pool,
      values: pool.values.filter(value => {
        const option = decision.options?.find(option => option.value === value);
        return (
          (!option?.requiresFeature || features.has(option.requiresFeature)) &&
          !option?.excludesFeatures?.some(feature => features.has(feature))
        );
      }),
    };
  }
  pool = {
    ...pool,
    values: pool.values.filter(value => {
      const excluded = decision.options?.find(option => option.value === value)?.excludedWhen;
      return (
        !excluded?.length ||
        !excluded.every(condition => selections[condition.decision] === condition.value)
      );
    }),
  };
  if (decision.selectedPool) {
    const selected = selections[decision.selectedPool.decision];
    const values = Array.isArray(selected) ? selected : [selected];
    pool = {
      ...pool,
      values: pool.values.filter(value =>
        decision.selectedPool!.exclude ? !values.includes(value) : values.includes(value),
      ),
    };
  }
  if (decision.abilityPool) {
    const restriction = decision.abilityPool;
    const classSlug = singleValue(selections, 'class.choice')?.toLowerCase();
    const known = new Set<string>();
    const index = indexDecisions(definitions);
    for (const candidate of index.values()) {
      if (candidate.id === decision.id || !isAvailable(candidate, selections, index)) continue;
      const value = selections[candidate.id];
      const selected = Array.isArray(value) ? value : [value];
      for (const option of candidate.options ?? [])
        if (
          (option.abilityKind || /^class\.fury\.ability-(3|5)$/.test(candidate.id)) &&
          option.supportedInV001 &&
          selected.includes(option.value)
        )
          known.add(option.value);
      const grants =
        candidate.kind === 'automatic'
          ? (candidate.grants ?? [])
          : selected.flatMap(
              item => candidate.options?.find(option => option.value === item)?.grants ?? [],
            );
      for (const grant of grants)
        if (grant.kind === 'ability' || grant.kind.endsWith('-ability')) known.add(grant.value);
    }
    pool = {
      ...pool,
      values: pool.values.filter(value => {
        if (restriction.knownOnly && !known.has(value)) return false;
        const paths = decision.optionSources?.[value]
          ? [decision.optionSources[value]]
          : (decision.options ?? [])
              .filter(option => option.value === value)
              .map(option => option.source ?? '');
        const origin = definitions.choiceOrigins?.[decision.id];
        const originLevel =
          origin?.value === value &&
          origin.value === singleValue(selections, decision.id) &&
          Number.isInteger(origin.level) &&
          origin.level >= 1 &&
          origin.level <= (definitions.level ?? 1)
            ? origin.level
            : (definitions.level ?? 1);
        return paths.some(path => {
          if (restriction.classOnly && (!classSlug || !path.includes(`/ability/${classSlug}/`)))
            return false;
          const eligibility = COMPLICATION_FUTURE_ABILITY_ELIGIBILITY[path];
          if (
            restriction.classOnly &&
            eligibility?.requiredChoice &&
            singleValue(selections, eligibility.requiredChoice.decision) !==
              eligibility.requiredChoice.value
          )
            return false;
          if (
            restriction.higherLevelThanCurrent &&
            Number(/\/level-(\d+)\//.exec(path)?.[1] ?? 0) <= originLevel
          )
            return false;
          return true;
        });
      }),
    };
  }
  if (!decision.ownedPool) return pool;
  const { kind, groups, exclude, fromDecision } = decision.ownedPool;
  const known = new Set(
    knowledgeCandidates(
      selections,
      definitions,
      kind,
      decision.selectionRole === `${kind}-removal` || decision.selectionRole === kind,
    )
      .filter(
        candidate =>
          candidate.decisionId !== decision.id &&
          (!fromDecision || candidate.decisionId === fromDecision),
      )
      .map(candidate => candidate.name),
  );
  const allowedGroups = groups
    ? new Set(
        poolValues(
          definitions,
          groups.map(group => `pool.skills.${group}`),
        ),
      )
    : null;
  return {
    ...pool,
    values: pool.values.filter(
      value =>
        (!allowedGroups || allowedGroups.has(value)) &&
        (exclude ? !known.has(value) : known.has(value)),
    ),
  };
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
      if (next[decision.id] === undefined || !['choice', 'authored'].includes(decision.kind))
        continue;
      const selected = next[decision.id];
      const pool = poolOf(decision, next, definitions).values;
      let noLongerFits = false;
      if (decision.shape.type === 'single')
        noLongerFits =
          typeof selected !== 'string' ||
          (!decision.shape.customAllowed && !pool.includes(selected));
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
