// SPDX-License-Identifier: GPL-3.0-only
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';

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
  const parent = features.find(
    feature => feature.name === 'Friend!' && feature.sourcePath === sourcePath,
  );
  if (parent)
    for (const action of SHADOW_ACTIONS)
      result.push({
        name: action.name,
        kind: 'class',
        sourcePath,
        kitBonusesIncluded: false,
        activationCondition: action.activationCondition,
        provenance: {
          ...parent.provenance,
          source: { ...parent.provenance.source, path: sourcePath, quote: action.quote },
        },
      });
  return result;
}
