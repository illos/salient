// SPDX-License-Identifier: GPL-3.0-only
/** Shared eligibility for permanent rolled-damage contributions; no effect execution or tier parsing. */
export interface ModifierEligibility {
  keywords: readonly string[];
  alternative?: { ability: string; damageType: string };
}
export interface ModifierAbility {
  name: string;
  keywords: readonly string[];
}

/** Every required keyword must match. A named alternative requires the selected damage type. */
export function matchesAbilityModifier(
  modifier: ModifierEligibility,
  ability: ModifierAbility,
  damageType?: string,
): boolean {
  const keywords = new Set(ability.keywords.map(keyword => keyword.toLowerCase()));
  if (modifier.keywords.every(keyword => keywords.has(keyword.toLowerCase()))) return true;
  return (
    !!modifier.alternative &&
    modifier.alternative.ability.toLowerCase() === ability.name.toLowerCase() &&
    modifier.alternative.damageType.toLowerCase() === damageType?.toLowerCase()
  );
}

/** A sheet may describe an available alternative, but must not present it as already applied. */
export function abilityModifierCondition(
  modifier: ModifierEligibility,
  ability: ModifierAbility,
): string | null {
  if (matchesAbilityModifier(modifier, ability)) return null;
  return modifier.alternative?.ability.toLowerCase() === ability.name.toLowerCase()
    ? `when choosing ${modifier.alternative.damageType} damage`
    : null;
}
