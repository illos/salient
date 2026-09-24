// SPDX-License-Identifier: GPL-3.0-only
/**
 * Active-feature walker for a Forge Steel hero. Mirrors the pinned Forge
 * `HeroLogic.getFeatures` / `FeatureLogic.simplifyFeatures` (vendor/forge-steel src/logic/
 * hero-logic.ts and feature-logic.ts at 5a846aadb623a9855a023e9403bb887a956c341f): ancestry, culture,
 * career, class features up to the hero's level, the selected subclasses' features up to that level,
 * and hero-level customizations; Choice, Perk, Multiple Features, Kit and Ancestry Feature Choice
 * selections are active children. Embedded later-level and unselected-branch definitions are not
 * active. Containers whose semantics this importer does not map (domains, items, titles, toggles,
 * complications, tagged features) are returned but not descended; the importer diagnoses them.
 *
 * Replaces the test-only walker in tests/helpers/v45-reference.ts for import purposes.
 */
import type { ForgeFeature, ForgeHero } from './shape.ts';

export type CultureRole = 'language' | 'environment' | 'organization' | 'upbringing';

export interface ActiveFeature {
  feature: ForgeFeature;
  /** JSON path into the original payload, for diagnostics. */
  path: string;
  /**
   * Scope of the owning branch: `ancestry:<id>`, `culture`, `career:<id>`, `class:<id>@<level>`,
   * `class:<id>/<subclassId>@<level>` or `hero`. Mapping keys always include it.
   */
  scope: string;
  /** Top-level feature of its branch (not a nested selection). */
  root: boolean;
  cultureRole?: CultureRole;
  /** A container kind the walker does not descend. */
  opaque?: boolean;
}

const opaqueContainers = new Set([
  'Ancestry Choice',
  'Domain',
  'Domain Feature',
  'Item Choice',
  'Tagged Feature Choice',
  'Complication',
  'Title',
  'Toggle',
]);

const isFeature = (value: unknown): value is ForgeFeature =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ForgeFeature).type === 'string' &&
  'data' in value;

export function activeFeatures(hero: ForgeHero): ActiveFeature[] {
  const list: ActiveFeature[] = [];
  // Forge hides perk grants unless tutorial mode is Complete (FeatureLogic.simplifyFeatures).
  const perksActive = hero.state.tutorialMode === 'Complete';
  const add = (
    feature: ForgeFeature,
    path: string,
    scope: string,
    root: boolean,
    cultureRole?: CultureRole,
  ) => {
    const opaque = opaqueContainers.has(feature.type);
    list.push({
      feature,
      path,
      scope,
      root,
      ...(cultureRole ? { cultureRole } : {}),
      ...(opaque ? { opaque } : {}),
    });
    if (opaque) return;
    const data = feature.data ?? {};
    const selected = data.selected;
    switch (feature.type) {
      case 'Ancestry Feature Choice':
        if (isFeature(selected)) add(selected, `${path}.data.selected`, scope, false);
        break;
      case 'Choice':
        if (Array.isArray(selected))
          selected.forEach((row, index) => {
            if (isFeature(row)) add(row, `${path}.data.selected[${index}]`, scope, false);
          });
        break;
      case 'Perk':
        if (perksActive && Array.isArray(selected))
          selected.forEach((row, index) => {
            if (isFeature(row)) add(row, `${path}.data.selected[${index}]`, scope, false);
          });
        break;
      case 'Multiple Features':
        if (Array.isArray(data.features))
          data.features.forEach((row, index) => {
            if (isFeature(row)) add(row, `${path}.data.features[${index}]`, scope, false);
          });
        break;
      case 'Kit':
        if (Array.isArray(selected))
          selected.forEach((kit, index) => {
            const kitFeatures = (kit as { features?: unknown }).features;
            if (Array.isArray(kitFeatures))
              kitFeatures.forEach((row, inner) => {
                if (isFeature(row))
                  add(row, `${path}.data.selected[${index}].features[${inner}]`, scope, false);
              });
          });
        break;
    }
  };

  if (hero.ancestry)
    hero.ancestry.features.forEach((feature, index) =>
      add(feature, `ancestry.features[${index}]`, `ancestry:${hero.ancestry!.id}`, true),
    );
  if (hero.culture)
    for (const role of ['language', 'environment', 'organization', 'upbringing'] as const) {
      const feature = hero.culture[role];
      if (feature) add(feature, `culture.${role}`, 'culture', true, role);
    }
  if (hero.career)
    hero.career.features.forEach((feature, index) =>
      add(feature, `career.features[${index}]`, `career:${hero.career!.id}`, true),
    );
  const heroClass = hero.class;
  if (heroClass) {
    heroClass.featuresByLevel.forEach((row, levelIndex) => {
      if (row.level > heroClass.level) return;
      row.features.forEach((feature, index) =>
        add(
          feature,
          `class.featuresByLevel[${levelIndex}].features[${index}]`,
          `class:${heroClass.id}@${row.level}`,
          true,
        ),
      );
    });
    heroClass.subclasses.forEach((subclass, subclassIndex) => {
      if (!subclass.selected) return;
      subclass.featuresByLevel.forEach((row, levelIndex) => {
        if (row.level > heroClass.level) return;
        row.features.forEach((feature, index) =>
          add(
            feature,
            `class.subclasses[${subclassIndex}].featuresByLevel[${levelIndex}].features[${index}]`,
            `class:${heroClass.id}/${subclass.id}@${row.level}`,
            true,
          ),
        );
      });
    });
  }
  hero.features.forEach((feature, index) => add(feature, `features[${index}]`, 'hero', true));
  return list;
}
