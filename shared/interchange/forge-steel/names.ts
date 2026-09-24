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
  // V182, class levels 1–3. Each Forge entry was matched to the Compendium file named, by the
  // pinned Forge definition's cost, keywords, distance and flavor text where the words differ.
  'Rapid Fire': 'Rapid-Fire', // kit/rapid-fire.md
  'Back, Blasphemer!': 'Back Blasphemer!', // feature/ability/censor/level-1/back-blasphemer.md
  'Every Step ... Death!': 'Every Step... Death!', // .../censor/level-1/every-step-death.md
  'Halt, Miscreant!': 'Halt Miscreant!', // .../censor/level-1/halt-miscreant.md
  'Behold, a Shield of Faith!': 'Behold a Shield of Faith!', // .../behold-a-shield-of-faith.md
  'A Meteoric Introduction': 'Meteoric Introduction', // feature/ability/elementalist/level-1/
  'Ray of Agonizing Self Reflection': 'Ray of Agonizing Self-Reflection', // same folder
  'Death ... Deeaaath!': 'Death... Death!', // feature/ability/fury/level-2/death-death.md
  'Rally Cry': 'Rallying Cry', // feature/ability/summoner/level-1/rallying-cry.md (same flavor)
  'Force Orb': 'Force Orbs', // feature/ability/talent/level-3/force-orbs.md (same flavor)
  'Assursed Mummy': 'Accursed Mummy', // monster/minion/summoner/undead/statblock/accursed-mummy.md
  // Subclass names: the Compendium's option names drop the "College of"/"Circle of" prefix in
  // Salient's decisions (feature/shadow/level-1/shadow-college.md,
  // feature/summoner/level-1/summoner-circle.md).
  'College of Black Ash': 'Black Ash',
  'College of Caustic Alchemy': 'Caustic Alchemy',
  'College of the Harlequin Mask': 'Harlequin Mask',
  'Circle of Blight': 'Blight',
  'Circle of Graves': 'Graves',
  'Circle of Spring': 'Spring',
  'Circle of Storms': 'Storms',
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
