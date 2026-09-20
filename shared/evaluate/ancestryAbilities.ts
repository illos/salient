// SPDX-License-Identifier: GPL-3.0-only
import { ANCESTRY_ABILITIES } from '../content/ancestry-abilities.ts';
import type { GrantedAbility, GrantedFeature } from '../contracts/characterEvaluation.ts';

export type ActiveRune = 'Detection' | 'Light' | 'Voice' | null;

/** Derive from actual granted traits, including old saved builds, never merely an ancestry label.
 * Rune maneuvers depend on current play state; they are not stored in a build revision.
 */
export function ancestryAbilities(
  traits: GrantedFeature[],
  existing: GrantedAbility[],
  rune: ActiveRune = null,
): GrantedAbility[] {
  const managed = new Set(ANCESTRY_ABILITIES.map(source => source.name));
  const result = existing.filter(
    ability => !(ability.kind === 'ancestry' && managed.has(ability.name)),
  );
  for (const source of ANCESTRY_ABILITIES) {
    if (source.rune && source.rune !== rune) continue;
    const trait = traits.find(
      trait => trait.name === source.trait && trait.sourcePath === source.sourcePath,
    );
    if (!trait) continue;
    result.push({
      name: source.name,
      kind: 'ancestry',
      sourcePath: source.sourcePath,
      kitBonusesIncluded: false,
      ...(source.activationCondition ? { activationCondition: source.activationCondition } : {}),
      provenance: {
        ...trait.provenance,
        source: { ...trait.provenance.source, path: source.sourcePath, quote: source.quote },
      },
    });
  }
  return result;
}

export function ancestryAbilitySource(
  ability: Pick<GrantedAbility, 'name' | 'sourcePath' | 'kind'>,
) {
  return ability.kind === 'ancestry'
    ? ANCESTRY_ABILITIES.find(
        source => source.name === ability.name && source.sourcePath === ability.sourcePath,
      )
    : undefined;
}
