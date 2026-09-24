// SPDX-License-Identifier: GPL-3.0-only
/**
 * Runtime shape guard for a Forge Steel `.ds-hero` / `.drawsteel-hero` file (V09). The pinned Forge
 * exporter writes the whole `Hero` object as JSON (vendor/forge-steel src/models/hero.ts at
 * 5a846aadb623a9855a023e9403bb887a956c341f) and its own importer only casts it; this guard is the
 * runtime check the cast lacks. It covers the fields the importer reads. Unknown extra fields are
 * allowed and stay in the preserved payload. Research: docs/forge-steel-interchange.md.
 *
 * A wrong shape throws `ForgeShapeError`. A valid but incomplete hero (null ancestry, empty
 * selections) passes: that is an incomplete draft, not malformed input.
 */

export class ForgeShapeError extends Error {
  readonly path: string;
  constructor(path: string, message: string) {
    super(`Not a Forge Steel hero file: ${path} ${message}.`);
    this.name = 'ForgeShapeError';
    this.path = path;
  }
}

export interface ForgeFeature {
  id: string;
  name: string;
  type: string;
  data: Record<string, unknown> | null;
}
export interface ForgeLevel {
  level: number;
  features: ForgeFeature[];
}
export interface ForgeAbility {
  id: string;
  name: string;
}
export interface ForgeSubclass {
  id: string;
  name: string;
  selected: boolean;
  featuresByLevel: ForgeLevel[];
  abilities: ForgeAbility[];
}
export interface ForgeClass {
  id: string;
  name: string;
  level: number;
  characteristics: { characteristic: string; value: number }[];
  featuresByLevel: ForgeLevel[];
  abilities: ForgeAbility[];
  subclasses: ForgeSubclass[];
}
export interface ForgeAncestry {
  id: string;
  name: string;
  features: ForgeFeature[];
}
export interface ForgeCulture {
  id: string;
  name: string;
  language: ForgeFeature;
  environment: ForgeFeature | null;
  organization: ForgeFeature | null;
  upbringing: ForgeFeature | null;
}
export interface ForgeCareer {
  id: string;
  name: string;
  features: ForgeFeature[];
  incitingIncidents: {
    options: { id: string; name: string }[];
    selected: { id: string; name: string } | null;
  };
}
export interface ForgeState {
  tutorialMode: string;
  notes: string;
  conditions: unknown[];
  inventory: unknown[];
  projects: unknown[];
  titles: unknown[];
  [field: string]: unknown;
}
export interface ForgeHero {
  id: string;
  name: string;
  picture: string | null;
  folder: string;
  sourcebookIDs: string[];
  ancestry: ForgeAncestry | null;
  culture: ForgeCulture | null;
  career: ForgeCareer | null;
  class: ForgeClass | null;
  complication: unknown;
  features: ForgeFeature[];
  state: ForgeState;
  abilityCustomizations: unknown[];
}

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function object(value: unknown, path: string): Json {
  if (!isObject(value)) throw new ForgeShapeError(path, 'must be an object');
  return value;
}
function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new ForgeShapeError(path, 'must be a string');
  return value;
}
function integer(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value))
    throw new ForgeShapeError(path, 'must be an integer');
  return value;
}
function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new ForgeShapeError(path, 'must be a list');
  return value;
}
function nullable<T>(value: unknown, path: string, check: (v: unknown, p: string) => T): T | null {
  return value === null ? null : check(value, path);
}

// Nesting in the pinned data model is shallow (ancestry trait > nested choice > option); the cap
// only rejects hostile depth before recursion can exhaust the stack.
const MAX_FEATURE_DEPTH = 12;

/** Every feature carries id, name, type and a data object or null; nested features recurse. */
function feature(value: unknown, path: string, depth = 0): ForgeFeature {
  if (depth > MAX_FEATURE_DEPTH) throw new ForgeShapeError(path, 'nests too deeply');
  const row = object(value, path);
  string(row.id, `${path}.id`);
  string(row.name, `${path}.name`);
  string(row.type, `${path}.type`);
  const data = row.data === undefined ? null : nullable(row.data, `${path}.data`, object);
  if (data) {
    if (Array.isArray(data.features))
      data.features.forEach((child, index) =>
        feature(child, `${path}.data.features[${index}]`, depth + 1),
      );
    if (Array.isArray(data.selected))
      data.selected.forEach((child, index) => {
        if (typeof child === 'string') return;
        const entry = object(child, `${path}.data.selected[${index}]`);
        // A selected kit or item is a container of features; a selected feature is a feature.
        if (typeof entry.type === 'string' && entry.data !== undefined)
          feature(entry, `${path}.data.selected[${index}]`, depth + 1);
        else if (Array.isArray(entry.features))
          entry.features.forEach((child, inner) =>
            feature(child, `${path}.data.selected[${index}].features[${inner}]`, depth + 1),
          );
        else {
          string(entry.id, `${path}.data.selected[${index}].id`);
          string(entry.name, `${path}.data.selected[${index}].name`);
        }
      });
    else if (isObject(data.selected)) feature(data.selected, `${path}.data.selected`, depth + 1);
  }
  return row as unknown as ForgeFeature;
}
const features = (value: unknown, path: string) =>
  array(value, path).map((row, index) => feature(row, `${path}[${index}]`));
function levels(value: unknown, path: string): ForgeLevel[] {
  return array(value, path).map((row, index) => {
    const level = object(row, `${path}[${index}]`);
    integer(level.level, `${path}[${index}].level`);
    features(level.features, `${path}[${index}].features`);
    return level as unknown as ForgeLevel;
  });
}
function abilities(value: unknown, path: string): ForgeAbility[] {
  return array(value, path).map((row, index) => {
    const ability = object(row, `${path}[${index}]`);
    string(ability.id, `${path}[${index}].id`);
    string(ability.name, `${path}[${index}].name`);
    return ability as unknown as ForgeAbility;
  });
}
function named(value: unknown, path: string) {
  const row = object(value, path);
  string(row.id, `${path}.id`);
  string(row.name, `${path}.name`);
  return row;
}

/** Throws `ForgeShapeError` unless `value` has the pinned hero shape the importer reads. */
export function assertForgeHero(value: unknown): asserts value is ForgeHero {
  const hero = object(value, 'hero');
  string(hero.id, 'id');
  string(hero.name, 'name');
  nullable(hero.picture, 'picture', string);
  string(hero.folder, 'folder');
  array(hero.sourcebookIDs, 'sourcebookIDs').forEach((id, index) =>
    string(id, `sourcebookIDs[${index}]`),
  );
  nullable(hero.ancestry, 'ancestry', (ancestry, path) => {
    features(named(ancestry, path).features, `${path}.features`);
  });
  nullable(hero.culture, 'culture', (culture, path) => {
    const row = named(culture, path);
    feature(row.language, `${path}.language`);
    for (const part of ['environment', 'organization', 'upbringing'])
      nullable(row[part] ?? null, `${path}.${part}`, feature);
  });
  nullable(hero.career, 'career', (career, path) => {
    const row = named(career, path);
    features(row.features, `${path}.features`);
    const incidents = object(row.incitingIncidents, `${path}.incitingIncidents`);
    array(incidents.options, `${path}.incitingIncidents.options`).forEach((option, index) =>
      named(option, `${path}.incitingIncidents.options[${index}]`),
    );
    nullable(incidents.selected ?? null, `${path}.incitingIncidents.selected`, named);
  });
  nullable(hero.class, 'class', (heroClass, path) => {
    const row = named(heroClass, path);
    integer(row.level, `${path}.level`);
    array(row.characteristics, `${path}.characteristics`).forEach((entry, index) => {
      const characteristic = object(entry, `${path}.characteristics[${index}]`);
      string(characteristic.characteristic, `${path}.characteristics[${index}].characteristic`);
      integer(characteristic.value, `${path}.characteristics[${index}].value`);
    });
    levels(row.featuresByLevel, `${path}.featuresByLevel`);
    abilities(row.abilities, `${path}.abilities`);
    array(row.subclasses, `${path}.subclasses`).forEach((entry, index) => {
      const subclass = named(entry, `${path}.subclasses[${index}]`);
      if (typeof subclass.selected !== 'boolean')
        throw new ForgeShapeError(`${path}.subclasses[${index}].selected`, 'must be true or false');
      levels(subclass.featuresByLevel, `${path}.subclasses[${index}].featuresByLevel`);
      abilities(subclass.abilities, `${path}.subclasses[${index}].abilities`);
    });
  });
  if (hero.complication !== null) object(hero.complication, 'complication');
  features(hero.features, 'features');
  const state = object(hero.state, 'state');
  string(state.tutorialMode, 'state.tutorialMode');
  string(state.notes, 'state.notes');
  for (const list of ['conditions', 'inventory', 'projects', 'titles'])
    array(state[list], `state.${list}`);
  array(hero.abilityCustomizations, 'abilityCustomizations');
}

/** Parses file text; malformed JSON and a wrong shape both throw `ForgeShapeError`. */
export function parseForgeHero(text: string): ForgeHero {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ForgeShapeError('file', 'is not valid JSON');
  }
  assertForgeHero(value);
  return value;
}
