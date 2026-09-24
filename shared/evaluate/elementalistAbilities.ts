// SPDX-License-Identifier: GPL-3.0-only
import {
  ELEMENTALIST_ACTIONS,
  ELEMENTALIST_ACTIVATION,
  elementalistActionText,
  elementalistSourceText,
} from '../content/classes/elementalist/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? ELEMENTALIST_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function elementalistAbilitySource(
  ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>,
) {
  const action = managed(ability);
  return action
    ? {
        ...action,
        text: elementalistActionText(action),
        ...(action.cost ? { cost: `${action.cost} Essence` } : { cost: undefined }),
      }
    : undefined;
}
export function elementalistAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(a => !managed(a));
  for (const action of ELEMENTALIST_ACTIONS) {
    const parent = [...features, ...result].find(
      p => p.name === action.parent && p.provenance.decisionId.startsWith('class.elementalist.'),
    );
    if (!parent) continue;
    result.push({
      name: action.name,
      kind: 'class',
      sourcePath: action.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: action.activationCondition,
      ...(action.cost ? { cost: { resource: 'essence', amount: action.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: {
          ...parent.provenance.source,
          path: action.sourcePath,
          quote: elementalistSourceText(action),
        },
      },
    });
  }
  for (const a of result)
    if (a.name === 'Hurl Element' && a.provenance.decisionId.startsWith('class.elementalist.'))
      a.activationCondition =
        'Choose a typed Hurl Element action to roll and apply damage. This base entry records the choice manually.';
  return result.map(a =>
    a.provenance.decisionId.startsWith('class.elementalist.level-') &&
    ELEMENTALIST_ACTIVATION[a.name]
      ? { ...a, activationCondition: ELEMENTALIST_ACTIVATION[a.name]! }
      : a.name === 'Instantaneous Excavation' &&
          a.provenance.decisionId.startsWith('class.elementalist.')
        ? {
            ...a,
            activationCondition:
              'Open the source holes, then roll separately for each eligible creature above them. No critical hit: this is a maneuver. Geometry, separate rolls, falling and persistent upkeep remain manual.',
          }
        : a,
  );
}
