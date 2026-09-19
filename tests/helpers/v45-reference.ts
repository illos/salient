// SPDX-License-Identifier: GPL-3.0-only
/** Read-only reference projection, not an import adapter or a rules evaluator.
 * Selection traversal follows the pinned Forge FeatureLogic/ HeroLogic; see V45 inventory.
 * Deliberately bounded: unsupported container types fail instead of silently certifying them.
 */
import assert from 'node:assert/strict';

export interface ForgeFeature {
  id: string;
  name: string;
  type: string;
  data: {
    selected?: (string | ForgeFeature | ForgeKit)[];
    selectedIDs?: string[];
    features?: ForgeFeature[];
    ability?: { id: string; name: string };
    count?: number | string;
    language?: string;
    classID?: string;
    source?: Record<string, boolean>;
  } | null;
}
interface ForgeKit {
  id: string;
  name: string;
  features: ForgeFeature[];
}
interface ForgeLevels {
  level: number;
  features: ForgeFeature[];
}
export interface ForgeHero {
  name: string;
  ancestry: { name: string; features: ForgeFeature[] };
  culture: {
    name: string;
    language: ForgeFeature;
    environment: ForgeFeature;
    organization: ForgeFeature;
    upbringing: ForgeFeature;
  };
  career: {
    name: string;
    features: ForgeFeature[];
    incitingIncidents: { selected: { name: string } };
  };
  class: {
    name: string;
    level: number;
    characteristics: { characteristic: string; value: number }[];
    featuresByLevel: ForgeLevels[];
    abilities: { id: string; name: string }[];
    subclasses: {
      name: string;
      selected: boolean;
      featuresByLevel: ForgeLevels[];
      abilities: { id: string; name: string }[];
    }[];
  };
  complication: unknown;
  features: ForgeFeature[];
  state: { tutorialMode: string; titles: unknown[]; inventory: unknown[] };
  abilityCustomizations: unknown[];
}

// Only the two documented presentation differences; do not erase arbitrary mismatches.
export const referenceName = (name: string) =>
  name.replaceAll('’', "'").replace(/^Pain For Pain$/, 'Pain for Pain');
export const sortedNames = (names: string[]) => [...new Set(names.map(referenceName))].sort();

export function projectForgeReference(hero: ForgeHero) {
  assert.equal(
    hero.state.tutorialMode,
    'Complete',
    'tutorial-gated grants need a separate projection',
  );
  assert.equal(hero.complication, null, 'complication projection not yet supported');
  assert.deepEqual(hero.state.titles, [], 'title projection not yet supported');
  assert.deepEqual(hero.state.inventory, [], 'inventory grants require separate projection');
  assert.deepEqual(hero.abilityCustomizations, [], 'custom ability projection not yet supported');
  const active: ForgeFeature[] = [];
  const chosenNames: Record<string, string[]> = {};
  const kits: ForgeKit[] = [];
  const abilities: string[] = [];
  const passiveTypes = new Set([
    'Text',
    'Bonus',
    'Ability Damage',
    'Damage Modifier',
    'Condition Immunity',
    'Heroic Resource',
    'Heroic Resource Threshold',
    'Roll Modifier',
    'Size',
    'Speed',
    // Pinned Forge Devil Wings includes a passive Movement Mode child (mode: Fly).
    'Movement Mode',
    'Save Threshold',
    'Surge Gain',
    'Skill Choice',
    'Language Choice',
    'Language',
  ]);
  const subclasses = hero.class.subclasses.filter(branch => branch.selected);
  const add = (feature: ForgeFeature) => {
    active.push(feature);
    const data = feature.data;
    if (data?.selected)
      chosenNames[feature.id] = data.selected.map(row =>
        referenceName(typeof row === 'string' ? row : row.name),
      );
    if (feature.type === 'Choice' || feature.type === 'Perk') {
      for (const row of data!.selected!) {
        assert.ok(typeof row === 'object' && 'type' in row);
        add(row);
      }
    } else if (feature.type === 'Multiple Features') {
      data!.features!.forEach(add);
    } else if (feature.type === 'Kit') {
      for (const row of data!.selected!) {
        assert.ok(typeof row === 'object' && 'features' in row);
        kits.push(row);
        row.features.forEach(add);
      }
    } else if (feature.type === 'Ability') {
      assert.ok(data?.ability);
      abilities.push(data.ability.name);
    } else if (feature.type === 'Class Ability') {
      assert.ok(!data?.classID, 'cross-class ability choice needs an explicit resolver');
      assert.ok(data?.source?.fromClassAbilities);
      assert.ok(
        !data.source.fromUnselectedSubclassAbilities &&
          !data.source.fromClassLevels &&
          !data.source.fromSelectedSubclassLevels &&
          !data.source.fromUnselectedSubclassLevels,
      );
      const pool = [
        ...hero.class.abilities,
        ...(data.source.fromSelectedSubclassAbilities
          ? subclasses.flatMap(branch => branch.abilities)
          : []),
      ];
      chosenNames[feature.id] = data.selectedIDs!.map(id => {
        const match = pool.find(ability => ability.id === id);
        assert.ok(match, `Unresolved selected ability ${id}`);
        abilities.push(match.name);
        return referenceName(match.name);
      });
    } else {
      assert.ok(
        passiveTypes.has(feature.type),
        `Unsupported reference feature type: ${feature.type}`,
      );
    }
  };
  hero.ancestry.features.forEach(add);
  const culture = hero.culture;
  [culture.language, culture.environment, culture.organization, culture.upbringing].forEach(add);
  hero.career.features.forEach(add);
  for (const branch of [hero.class, ...subclasses]) {
    branch.featuresByLevel
      .filter(row => row.level <= hero.class.level)
      .flatMap(row => row.features)
      .forEach(add);
  }
  hero.features.forEach(add);
  const selectionsOfType = (type: string) =>
    active
      .filter(feature => feature.type === type)
      .flatMap(feature => chosenNames[feature.id] ?? []);
  return {
    level: hero.class.level,
    ancestry: referenceName(hero.ancestry.name),
    class: referenceName(hero.class.name),
    subclasses: sortedNames(subclasses.map(branch => branch.name)),
    career: referenceName(hero.career.name),
    characteristics: Object.fromEntries(
      hero.class.characteristics.map(row => [row.characteristic[0], row.value]),
    ),
    chosenNames,
    activeFeatureNames: sortedNames(active.map(feature => feature.name)),
    abilities: sortedNames(abilities),
    kits: sortedNames(kits.map(kit => kit.name)),
    skills: sortedNames(selectionsOfType('Skill Choice')),
    languages: sortedNames([
      ...selectionsOfType('Language Choice'),
      ...active
        .filter(feature => feature.type === 'Language')
        .map(feature => feature.data!.language!),
    ]),
    deferredLanguages: active
      .filter(feature => feature.type === 'Language Choice')
      .flatMap(feature => {
        assert.equal(typeof feature.data!.count, 'number');
        const count = (feature.data!.count as number) - chosenNames[feature.id].length;
        assert.ok(count >= 0);
        return count ? [{ featureID: feature.id, count }] : [];
      }),
  };
}
