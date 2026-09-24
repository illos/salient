// SPDX-License-Identifier: GPL-3.0-only
import {
  NULL_ACTIONS,
  NULL_ACTIVATION,
  nullActionText,
} from '../content/classes/null/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? NULL_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function nullAbilitySource(ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) {
  const action = managed(ability);
  return action
    ? {
        ...action,
        text: nullActionText(action),
        ...(action.cost ? { cost: `${action.cost} Discipline` } : { cost: undefined }),
      }
    : undefined;
}
export function nullAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(a => !managed(a));
  for (const action of NULL_ACTIONS) {
    const parent = [...features, ...result].find(
      p => p.name === action.parent && p.provenance.decisionId.startsWith('class.null.'),
    );
    if (!parent) continue;
    result.push({
      name: action.name,
      kind: 'class',
      sourcePath: action.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: action.activationCondition,
      ...(action.cost ? { cost: { resource: 'discipline', amount: action.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: {
          ...parent.provenance.source,
          path: action.sourcePath,
          quote: nullActionText(action),
        },
      },
    });
  }
  return result.map(a =>
    a.provenance.decisionId.startsWith('class.null.level-') && NULL_ACTIVATION[a.name]
      ? { ...a, activationCondition: NULL_ACTIVATION[a.name]! }
      : a.provenance.decisionId.startsWith('class.null.')
        ? {
            ...a,
            ...(a.name === 'Null Field'
              ? {
                  activationCondition:
                    'Aura potencies, once-per-turn enhancements and lifecycle are manual. Persists across encounters; ends if dying or willingly ended.',
                }
              : {}),
            ...(a.name === 'Impart Force'
              ? {
                  activationCondition:
                    'Apply the granted edge to this roll manually. Object must be your size or smaller; psychic damage equals actual squares pushed, resolved manually.',
                }
              : {}),
            ...(a.name === 'Phase Inversion Strike'
              ? {
                  activationCondition:
                    'Teleport opposite before resolving push; if teleport is impossible no push is allowed. Conditional movement remains manual.',
                }
              : {}),
          }
        : a,
  );
}
