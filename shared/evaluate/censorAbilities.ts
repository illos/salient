// SPDX-License-Identifier: GPL-3.0-only
import { CENSOR_ACTIONS, censorActionText } from '../content/classes/censor/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? CENSOR_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function censorAbilitySource(ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) {
  const action = managed(ability);
  return action
    ? {
        ...action,
        text: censorActionText(action),
        ...(action.cost ? { cost: `${action.cost} Wrath` } : { cost: undefined }),
      }
    : undefined;
}
export function censorAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(a => !managed(a));
  for (const action of CENSOR_ACTIONS) {
    const parent = [...features, ...result].find(
      p => p.name === action.parent && p.provenance.decisionId.startsWith('class.censor.'),
    );
    if (!parent) continue;
    result.push({
      name: action.name,
      kind: 'class',
      sourcePath: action.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: action.activationCondition,
      ...(action.cost ? { cost: { resource: 'wrath', amount: action.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: {
          ...parent.provenance.source,
          path: action.sourcePath,
          quote: censorActionText(action),
        },
      },
    });
  }
  return result.map(a =>
    a.name === 'My Life for Yours' && a.provenance.decisionId.startsWith('class.censor.')
      ? {
          ...a,
          activationCondition:
            'Only when the target starts their turn or takes damage. Spend your Recovery and resolve the healing manually. The optional Cleanse action pays 1 Wrath separately.',
        }
      : a,
  );
}
