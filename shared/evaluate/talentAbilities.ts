// SPDX-License-Identifier: GPL-3.0-only
import {
  TALENT_ACTIONS,
  talentActionText,
  TALENT_ACTIVATION,
} from '../content/classes/talent/abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';
const managed = (ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) =>
  ability.kind === 'class'
    ? TALENT_ACTIONS.find(a => a.name === ability.name && a.sourcePath === ability.sourcePath)
    : undefined;
export function talentAbilitySource(ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) {
  const action = managed(ability);
  return action
    ? {
        ...action,
        text: talentActionText(action),
        ...(action.cost ? { cost: `${action.cost} Clarity` } : { cost: undefined }),
      }
    : undefined;
}
export function talentAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(a => !managed(a));
  for (const action of TALENT_ACTIONS) {
    const parent = [...features, ...result].find(
      p => p.name === action.parent && p.provenance.decisionId.startsWith('class.talent.'),
    );
    if (!parent) continue;
    result.push({
      name: action.name,
      kind: 'class',
      sourcePath: action.sourcePath,
      kitBonusesIncluded: false,
      activationCondition: action.activationCondition,
      ...(action.cost ? { cost: { resource: 'clarity', amount: action.cost } } : {}),
      provenance: {
        ...parent.provenance,
        source: {
          ...parent.provenance.source,
          path: action.sourcePath,
          quote: talentActionText(action),
        },
      },
    });
  }
  // Perk grants carry their own perk text: they cost no Clarity and have no Strained effect.
  return result.map(a =>
    a.provenance.decisionId.startsWith('class.talent.') &&
    !a.provenance.decisionId.endsWith('.perk')
      ? {
          ...a,
          activationCondition:
            (a.provenance.decisionId.startsWith('class.talent.level-')
              ? TALENT_ACTIVATION[a.name]
              : undefined) ??
            a.activationCondition ??
            (a.name === 'Awe'
              ? 'Choose ally benefit (temporary Stamina three times Presence and end one effect) OR enemy roll. Entire branched effect is manual; never automatically attack an ally.'
              : a.name === 'Smolder'
                ? 'Choose acid, corruption or fire for both damage and weakness; apply damage before weakness. Entire typed effect remains manual.'
                : 'Strain effects are manual and apply when already below zero Clarity or this use crosses zero; outside-combat one-minute and voluntary strain rules also apply. Resource generation, end-turn negative damage and encounter reset are manual.'),
        }
      : a,
  );
}
