// SPDX-License-Identifier: GPL-3.0-only
/**
 * Forge Steel display names that differ from the pinned Steel Compendium spelling. Each alias was
 * checked against the Compendium entry it names (V45/V94 witnesses, scripts/forge/). Aliases only
 * rename; they never choose between candidates.
 */
export const forgeNameAliases: Record<string, string> = {
  'Elf (high)': 'High Elf',
  'Elf (wode)': 'Wode Elf',
  'Draconic Pride': 'Draconian Pride',
  'Remember your Oath': 'Remember Your Oath',
  Perseverence: 'Perseverance',
  'All Is A Feather': 'All Is a Feather',
};

/** Typographic apostrophes, accents and letter case are presentation, not identity. */
export const looseName = (name: string) =>
  name
    .replaceAll('’', "'")
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Salient decision-id segment for a Compendium name: "Mage's Apprentice" → "mages-apprentice". */
export const decisionSlug = (name: string) =>
  looseName(name).replaceAll("'", '').replace(/\s+/g, '-');

/**
 * Resolves a Forge name to one of `allowed`: exact, then alias, then a unique loose match. Returns
 * null when nothing matches or more than one candidate does; the caller records a diagnostic.
 */
export function resolveName(name: string, allowed: readonly string[]): string | null {
  if (allowed.includes(name)) return name;
  const alias = forgeNameAliases[name];
  if (alias && allowed.includes(alias)) return alias;
  const loose = looseName(alias ?? name);
  const matches = [...new Set(allowed.filter(value => looseName(value) === loose))];
  return matches.length === 1 ? matches[0]! : null;
}
