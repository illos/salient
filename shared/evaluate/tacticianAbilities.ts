// SPDX-License-Identifier: GPL-3.0-only
import { TACTICIAN_ACTIONS, TACTICIAN_ACTIVATION } from '../content/classes/tactician/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';

/** Reconstruct only from retained class grants, including saved pre-extraction builds. */
export function tacticianAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(ability => !tacticianAbilitySource(ability));
  for (const source of TACTICIAN_ACTIONS) {
    const parent = [...features, ...result].find(
      granted =>
        granted.name === source.parent &&
        granted.provenance.decisionId.startsWith('class.tactician.'),
    );
    if (!parent) continue;
    result.push({
      name: source.name,
      kind: 'class',
      sourcePath: source.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: source.activationCondition,
      ...(source.cost
        ? { cost: { resource: 'focus' as const, amount: Number.parseInt(source.cost) } }
        : {}),
      provenance: {
        ...parent.provenance,
        source: { ...parent.provenance.source, path: source.sourcePath, quote: source.text },
      },
    });
  }
  return result.map(ability => {
    const condition = ability.provenance.decisionId.startsWith('class.tactician.level-')
      ? TACTICIAN_ACTIVATION[ability.name]
      : undefined;
    return condition ? { ...ability, activationCondition: condition } : ability;
  });
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
