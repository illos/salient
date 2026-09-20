// SPDX-License-Identifier: GPL-3.0-only
import { STARTING_ITEM_ABILITIES } from '../content/starting-item-abilities.ts';
import manifest from '../content/compendium/manifest.json';
import type { StartingRewards } from '../contracts/startingRewards.ts';
import type { GrantedAbility } from '../contracts/characterEvaluation.ts';

/** Possessions are persistent play data. A draft entitlement never grants a usable item action. */
export function startingItemAbilities(rewards: StartingRewards | undefined): GrantedAbility[] {
  return STARTING_ITEM_ABILITIES.flatMap(source => {
    const item = rewards?.items.find(
      item =>
        item.state === 'possessed' &&
        item.name === source.item &&
        item.sourcePath === source.sourcePath,
    );
    if (!item) return [];
    return [
      {
        name: source.name,
        kind: 'item' as const,
        sourcePath: source.sourcePath,
        kitBonusesIncluded: false,
        ...(source.activationCondition ? { activationCondition: source.activationCondition } : {}),
        provenance: {
          decisionId: item.decisionId,
          selection: item.name,
          source: {
            path: source.sourcePath,
            quote: source.quote,
            revision: manifest.compendium.revision,
          },
        },
      },
    ];
  });
}
export function startingItemAbilitySource(ability: GrantedAbility) {
  return ability.kind === 'item'
    ? STARTING_ITEM_ABILITIES.find(
        s => s.name === ability.name && s.sourcePath === ability.sourcePath,
      )
    : undefined;
}
