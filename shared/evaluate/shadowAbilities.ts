// SPDX-License-Identifier: GPL-3.0-only
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';

import { SHADOW_LATER_ACTIONS } from '../content/classes/shadow/later-actions.ts';

const dancerPath = 'en/unified/md/feature/ability/shadow/level-3/dancer.md';
const sourcePath = 'en/unified/md/feature/shadow/level-2/friend.md';
/** Source-timed uses of Friend!; neither effect is automatically adjudicated. */
export const SHADOW_ACTIONS: {
  name: string;
  sourcePath: string;
  actionType: string;
  quote: string;
  activationCondition: string;
  trigger?: string;
}[] = [
  ...SHADOW_LATER_ACTIONS,
  {
    name: 'Dancer: Disengage',
    sourcePath: dancerPath,
    actionType: 'Free triggered action',
    quote:
      'Until the end of the encounter, whenever an enemy moves or is force moved adjacent to you or damages you, you can take the Disengage move action as a free triggered action.',
    trigger: 'An enemy moves or is force moved adjacent to you or damages you.',
    activationCondition:
      'Only after using Dancer and before the encounter ends, when an enemy moves or is force moved adjacent to you or damages you. Track activation and resolve movement manually.',
  },
  {
    name: 'Friend!: Join an Effect',
    sourcePath,
    actionType: 'Part of an enemy effect',
    quote:
      'Whenever an enemy uses an ability or trait that targets multiple allies and you are within distance of the effect, you can choose to be a target of the effect as well.',
    activationCondition:
      'Only when the enemy effect targets multiple allies and you are within its distance. Resolve inclusion manually.',
  },
  {
    name: 'Friend!: Disengage',
    sourcePath,
    actionType: "Part of I'm No Threat",
    quote:
      "Additionally, when you use your I'm No Threat ability, you can take the Disengage move action as part of that ability.",
    activationCondition:
      "Only as part of using I'm No Threat. Resolve the Disengage movement manually.",
  },
];
export function shadowAbilitySource(ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) {
  return ability.kind === 'class'
    ? SHADOW_ACTIONS.find(
        action => action.name === ability.name && action.sourcePath === ability.sourcePath,
      )
    : undefined;
}
export function shadowAbilities(
  features: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const result = existing.filter(ability => !shadowAbilitySource(ability));
  for (const action of SHADOW_ACTIONS) {
    const parent = action.sourcePath.includes('/feature/ability/')
      ? result.find(
          ability => ability.sourcePath === action.sourcePath && !shadowAbilitySource(ability),
        )
      : features.find(feature => feature.sourcePath === action.sourcePath);
    if (parent)
      result.push({
        name: action.name,
        kind: 'class',
        sourcePath: action.sourcePath,
        kitBonusesIncluded: false,
        activationCondition: action.activationCondition,
        provenance: {
          ...parent.provenance,
          source: { ...parent.provenance.source, path: action.sourcePath, quote: action.quote },
        },
      });
  }
  return result.map(ability => {
    const instructions: Record<string, string> = {
      'Into the Shadows':
        'Pay now and remove both creatures; return at the start of your next turn, THEN roll and resolve printed damage manually. This initial record deals no damage.',
      'Puppet Strings':
        'Roll manually and compare Reason to potency. Each qualifying target acts BEFORE taking damage; choose its targets and preserve hidden/disguise. This initial record deals no damage.',
      'One Vial Makes You Faster':
        'Potion delivery and its roll do not automatically consume it. Associate the rolled tier with each potion, then resolve the printed alternative only on consumption; expiry and benefits remain manual.',
    };
    const condition = instructions[ability.name];
    if (condition && ability.sourcePath.includes('/feature/ability/shadow/'))
      return { ...ability, activationCondition: condition };
    if (ability.name === 'Defensive Roll' && features.some(f => f.name === 'Volatile Reagents'))
      return {
        ...ability,
        activationCondition:
          'Volatile Reagents upgrades the shift to up to 5 squares, including vertically; fall without solid ground or flight. Retain all other Defensive Roll effects. Resolve manually.',
      };
    return ability;
  });
}
