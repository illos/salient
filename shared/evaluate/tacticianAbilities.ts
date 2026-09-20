// SPDX-License-Identifier: GPL-3.0-only
import { TACTICIAN_ACTIONS } from '../content/classes/tactician/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';

/** Reconstruct only from retained class grants, including saved pre-extraction builds. */
export function tacticianAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(ability => !tacticianAbilitySource(ability));
  for (const source of TACTICIAN_ACTIONS) {
    const parent = features.find(
      feature =>
        feature.name === source.parent &&
        feature.provenance.decisionId.startsWith('class.tactician.'),
    );
    if (!parent) continue;
    result.push({
      name: source.name,
      kind: 'class',
      sourcePath: source.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: source.activationCondition,
      ...(source.cost ? { cost: { resource: 'focus' as const, amount: 1 } } : {}),
      provenance: {
        ...parent.provenance,
        source: { ...parent.provenance.source, path: source.sourcePath, quote: source.text },
      },
    });
  }
  return result;
}
export function tacticianAbilitySource(
  ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>,
) {
  return ability.kind === 'class'
    ? TACTICIAN_ACTIONS.find(
        source => source.name === ability.name && source.sourcePath === ability.sourcePath,
      )
    : undefined;
}
