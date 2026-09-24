// SPDX-License-Identifier: GPL-3.0-only
import {
  CONDUIT_ACTIONS,
  conduitActionText,
  CONDUIT_ACTIVATION,
} from '../content/classes/conduit/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? CONDUIT_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function conduitAbilitySource(
  ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>,
) {
  const action = managed(ability);
  return action
    ? {
        ...action,
        text: conduitActionText(action),
        ...(action.cost ? { cost: `${action.cost} Piety` } : { cost: undefined }),
      }
    : undefined;
}
export function conduitAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(a => !managed(a));
  for (const action of CONDUIT_ACTIONS) {
    const parent = [...features, ...result].find(
      p => p.name === action.parent && p.provenance.decisionId.startsWith('class.conduit.'),
    );
    if (!parent) continue;
    result.push({
      name: action.name,
      kind: 'class',
      sourcePath: action.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: action.activationCondition,
      ...(action.cost ? { cost: { resource: 'piety', amount: action.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: {
          ...parent.provenance.source,
          path: action.sourcePath,
          quote: conduitActionText(action),
        },
      },
    });
  }
  return result.map(a => {
    if (!a.provenance.decisionId.startsWith('class.conduit.')) return a;
    const later = a.provenance.decisionId.startsWith('class.conduit.level-')
      ? CONDUIT_ACTIVATION[a.name]
      : undefined;
    if (later) return { ...a, activationCondition: later };
    if (a.name === 'Healing Grace')
      return {
        ...a,
        activationCondition:
          'Once on your turn. Target Recovery payment/healing is manual. Optional enhancements pay separately; outside combat their total is limited to your Victories.',
      };
    if (a.name === 'Ray of Wrath')
      return {
        ...a,
        activationCondition:
          'Can also be used as a ranged free strike. Optional holy damage and Prayer of Distance range bonus are manual.',
      };
    return a;
  });
}
