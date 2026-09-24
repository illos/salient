// SPDX-License-Identifier: GPL-3.0-only
import {
  TROUBADOUR_ACTIONS,
  TROUBADOUR_ACTIVATION,
  troubadourActionText,
} from '../content/classes/troubadour/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? TROUBADOUR_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function troubadourAbilitySource(
  ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>,
) {
  const action = managed(ability);
  return action
    ? {
        ...action,
        text: troubadourActionText(action),
        ...(action.cost ? { cost: `${action.cost} Drama` } : { cost: undefined }),
      }
    : undefined;
}
export function troubadourAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(a => !managed(a));
  for (const action of TROUBADOUR_ACTIONS) {
    const parent = [...features, ...result].find(
      p => p.name === action.parent && p.provenance.decisionId.startsWith('class.troubadour.'),
    );
    if (!parent) continue;
    result.push({
      name: action.name,
      kind: 'class',
      sourcePath: action.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: action.activationCondition,
      ...(action.cost ? { cost: { resource: 'drama', amount: action.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: {
          ...parent.provenance.source,
          path: action.sourcePath,
          quote: troubadourActionText(action),
        },
      },
    });
  }
  return result.map(a => {
    if (!a.provenance.decisionId.startsWith('class.troubadour.')) return a;
    const later = a.provenance.decisionId.startsWith('class.troubadour.level-')
      ? TROUBADOUR_ACTIVATION[a.name]
      : undefined;
    if (later) return { ...a, activationCondition: later };
    const cost = a.name === 'Star Power' ? 1 : a.name === 'Harmonize' ? 3 : undefined;
    const performance = [
      'Choreography',
      'Revitalizing Limerick',
      'Blocking',
      'Acrobatics',
      '"Ballad of the Beast"',
      '"Thunder Mother"',
    ].includes(a.name);
    return {
      ...a,
      ...(cost ? { cost: { resource: 'drama' as const, amount: cost } } : {}),
      ...(performance
        ? {
            activationCondition:
              'At start of a combat round choose this as your one performance only while not dazed, dead or surprised. Lifecycle, area and timed effects remain manual. Thunder Mother attacks only at end of round, ignores cover and cannot repeat a target; its level-based damage roll is manual.',
          }
        : {}),
      ...(a.name === 'Upstage'
        ? {
            activationCondition:
              'Self describes the shift, not a target of taunt or prone. Shift up to speed, then one roll against enemies passed adjacent to. Movement, target selection and outcomes are manual.',
          }
        : {}),
    };
  });
}
