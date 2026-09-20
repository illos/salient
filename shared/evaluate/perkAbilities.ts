// SPDX-License-Identifier: GPL-3.0-only
import { PERK_ABILITIES } from '../content/perk-abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';

/** Reproject from actual granted perks, including saved builds predating action extraction. */
export function perkAbilities(
  perks: GrantedFeature[],
  existing: GrantedAbility[],
): GrantedAbility[] {
  const managed = new Set(PERK_ABILITIES.map(source => source.name));
  const result = existing.filter(
    ability => !(ability.kind === 'perk' && managed.has(ability.name)),
  );
  for (const source of PERK_ABILITIES) {
    const perk = perks.find(
      perk => perk.name === source.perk && perk.sourcePath === source.sourcePath,
    );
    if (!perk) continue;
    result.push({
      name: source.name,
      kind: 'perk',
      sourcePath: source.sourcePath,
      kitBonusesIncluded: false,
      ...(source.activationCondition ? { activationCondition: source.activationCondition } : {}),
      provenance: {
        ...perk.provenance,
        source: { ...perk.provenance.source, path: source.sourcePath, quote: source.quote },
      },
    });
  }
  return result;
}

export function perkAbilitySource(ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>) {
  return ability.kind === 'perk'
    ? PERK_ABILITIES.find(
        source => source.name === ability.name && source.sourcePath === ability.sourcePath,
      )
    : undefined;
}
