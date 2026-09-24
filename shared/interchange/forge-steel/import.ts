// SPDX-License-Identifier: GPL-3.0-only
/**
 * Forge Steel hero import (V09 part a; docs/character-wizard-spec.md#required-import). Pure: turns
 * a pinned-shape `.ds-hero` into a Salient level, a decision-id → value selection map, the authored
 * name and notes, and diagnostics for everything it does not translate. The caller persists the
 * result through the ordinary create path, which evaluates it; nothing here decides legality.
 *
 * Never guesses: a Forge choice without a scoped rule (mappings.ts), or whose value is not one of the
 * decision's Compendium-sourced options, becomes a diagnostic and its decision stays empty. Play
 * state, complications, titles, inventory, projects, ability customizations and sourcebook
 * enablement are reported, not mapped (V09 parts b/c). Imported ids, folders and flags grant nothing.
 */
import { getDefinitions } from '../../content/character-decisions.ts';
import type { SelectionValue } from '../../contracts/characterEvaluation.ts';
import type { Decision, DecisionDefinitions } from '../../evaluate/definitions.ts';
import { featureRules, ruleKey } from './mappings.ts';
import { decisionSlug, resolveName } from './names.ts';
import { assertForgeHero, parseForgeHero, type ForgeFeature, type ForgeHero } from './shape.ts';
import { activeFeatures, type ActiveFeature } from './walker.ts';

export { ForgeShapeError } from './shape.ts';

/** The Forge Steel revision whose hero shape and ids this adapter targets. */
export const FORGE_STEEL_REVISION = '5a846aadb623a9855a023e9403bb887a956c341f';
/** Upper bound on an accepted file; the retained exports are 130–165 KB. */
export const MAX_FORGE_PAYLOAD_BYTES = 512 * 1024;

export interface ForgeImportDiagnostic {
  path: string;
  forgeId?: string;
  name?: string;
  reason: string;
}
export interface ForgeImportResult {
  level: number;
  selections: Record<string, SelectionValue>;
  authored: { name: string; notes: string };
  diagnostics: ForgeImportDiagnostic[];
  /** Payload paths holding data this import did not translate (preserved in the stored payload). */
  unmapped: string[];
}

/** Feature types that record a player choice; each needs a mapping rule or a diagnostic. */
const choiceTypes = new Set([
  'Ancestry Choice',
  'Ancestry Feature Choice',
  'Choice',
  'Class Ability',
  'Companion',
  'Complication',
  'Domain',
  'Domain Feature',
  'Item Choice',
  'Kit',
  'Language Choice',
  'Perk',
  'Skill Cancel Choice',
  'Skill Choice',
  'Summon Choice',
  'Tagged Feature Choice',
  'Title',
  'Toggle',
]);

/** Forge's new-hero state (FactoryLogic.createHeroState at the pin); other values are play state. */
const defaultState: Record<string, number | boolean | string> = {
  staminaDamage: 0,
  staminaTemp: 0,
  recoveriesUsed: 0,
  surges: 0,
  victories: 0,
  xp: 0,
  heroTokens: 0,
  renown: 0,
  wealth: 1,
  projectPoints: 0,
  inventoryText: '',
  hidden: false,
  defeated: false,
};

function allowedValues(decision: Decision, definitions: DecisionDefinitions): string[] | null {
  const pools = (ids: string | string[]) =>
    [ids].flat().flatMap(id => definitions.pools[id]?.values ?? []);
  if (decision.options) return decision.options.map(option => option.value);
  if (decision.optionsFrom) return pools(decision.optionsFrom);
  if (decision.optionsByParent)
    return [
      ...new Set([
        ...Object.values(decision.optionsByParent).flatMap(entry => [
          ...(entry.values ?? []),
          ...pools(entry.optionsFrom ?? []),
        ]),
        ...(decision.supportedInV001 ?? []),
      ]),
    ];
  return decision.supportedInV001 ?? null;
}

export function importForgeHero(
  value: unknown,
  definitionsFor: (level: number) => DecisionDefinitions = getDefinitions,
): ForgeImportResult {
  assertForgeHero(value);
  const hero: ForgeHero = value;
  const level = hero.class ? hero.class.level : 1;
  const definitions = definitionsFor(level);
  const decisions = new Map(
    definitions.steps.flatMap(step => step.decisions.map(decision => [decision.id, decision])),
  );
  const selections: Record<string, SelectionValue> = {};
  const diagnostics: ForgeImportDiagnostic[] = [];
  const unmapped = new Set<string>();
  const note = (diagnostic: ForgeImportDiagnostic, isUnmapped = true) => {
    diagnostics.push(diagnostic);
    if (isUnmapped) unmapped.add(diagnostic.path);
  };
  const about = (feature: ForgeFeature) => ({ forgeId: feature.id, name: feature.name });

  /** Writes `names` to a decision after option and shape checks; any failure leaves it empty. */
  const assign = (
    decisionId: string,
    names: string[],
    path: string,
    subject: { forgeId?: string; name?: string } = {},
  ) => {
    const decision = decisions.get(decisionId);
    if (!decision) {
      note({
        path,
        ...subject,
        reason: `Salient has no decision ${decisionId} at level ${level}.`,
      });
      return;
    }
    if (decisionId in selections) {
      note({ path, ...subject, reason: `${decisionId} is already set by another Forge entry.` });
      return;
    }
    const allowed = allowedValues(decision, definitions);
    const values: string[] = [];
    for (const name of names) {
      const resolved = allowed ? resolveName(name, allowed) : name;
      if (resolved === null) {
        note({
          path,
          ...subject,
          reason: `"${name}" is not an option of ${decisionId}; the choice is left open.`,
        });
        return;
      }
      values.push(resolved);
    }
    const shape = decision.shape;
    if (shape.type === 'single') {
      if (values.length > 1)
        note({
          path,
          ...subject,
          reason: `${decisionId} takes one choice; Forge has ${values.length}.`,
        });
      else if (values.length === 1) selections[decisionId] = values[0]!;
    } else if (shape.type === 'multi') {
      if (values.length > shape.count)
        note({
          path,
          ...subject,
          reason: `${decisionId} takes ${shape.count} choices; Forge has ${values.length}.`,
        });
      // Unfilled slots stay open; Salient decides whether that is a deferral or an incomplete build.
      else if (values.length)
        selections[decisionId] = [
          ...values,
          ...Array<null>(shape.count - values.length).fill(null),
        ];
    } else if (shape.type === 'points') {
      if (values.length) selections[decisionId] = values;
    } else note({ path, ...subject, reason: `${decisionId} is not a list or single choice.` });
  };

  /** Names a Forge choice currently selects, or a reason it cannot be read. */
  const selectedNames = (active: ActiveFeature): string[] | string => {
    const { feature } = active;
    const data = feature.data ?? {};
    const selected = Array.isArray(data.selected) ? data.selected : [];
    switch (feature.type) {
      case 'Skill Choice':
      case 'Language Choice':
        return selected.every(row => typeof row === 'string')
          ? (selected as string[])
          : 'Selections are not names.';
      case 'Choice':
      case 'Perk':
      case 'Kit':
        return selected.every(row => typeof (row as { name?: unknown })?.name === 'string')
          ? selected.map(row => (row as { name: string }).name)
          : 'Selections are not named entries.';
      case 'Class Ability': {
        const heroClass = hero.class;
        const source = (data.source ?? {}) as Record<string, unknown>;
        if (!heroClass || (data.classID && data.classID !== heroClass.id))
          return 'Ability choices from another class are not mapped.';
        if (
          source.fromUnselectedSubclassAbilities ||
          source.fromClassLevels ||
          source.fromSelectedSubclassLevels ||
          source.fromUnselectedSubclassLevels
        )
          return 'This ability pool is not mapped.';
        const pool = [
          ...(source.fromClassAbilities ? heroClass.abilities : []),
          ...(source.fromSelectedSubclassAbilities
            ? heroClass.subclasses.filter(s => s.selected).flatMap(s => s.abilities)
            : []),
        ];
        const ids = Array.isArray(data.selectedIDs) ? data.selectedIDs : [];
        const names: string[] = [];
        for (const id of ids) {
          const ability = pool.find(row => row.id === id);
          if (!ability) return `Selected ability ${String(id)} is not in the embedded pool.`;
          names.push(ability.name);
        }
        return names;
      }
    }
    return `Forge ${feature.type} selections are not mapped.`;
  };

  // --- Ancestry (chapter/ancestries.md; ancestry/<name>.md) ---
  let ancestrySlug: string | null = null;
  if (hero.ancestry) {
    const before = 'ancestry.choice' in selections;
    assign('ancestry.choice', [hero.ancestry.name], 'ancestry.name', {
      forgeId: hero.ancestry.id,
      name: hero.ancestry.name,
    });
    if (!before && typeof selections['ancestry.choice'] === 'string')
      ancestrySlug = decisionSlug(selections['ancestry.choice']);
  }

  // --- Culture (Draw Steel Heroes.md, Culture) ---
  if (hero.culture?.name.trim()) selections['culture.name'] = hero.culture.name.trim();

  // --- Career (chapter/making-a-hero.md; career/<name>.md) ---
  if (hero.career) {
    assign('career.choice', [hero.career.name], 'career.name', {
      forgeId: hero.career.id,
      name: hero.career.name,
    });
    const career = selections['career.choice'];
    if (typeof career === 'string') {
      const careerSlug = decisionSlug(career);
      const incident = hero.career.incitingIncidents.selected;
      if (incident)
        assign(
          `career.${careerSlug}.inciting-incident`,
          [incident.name],
          'career.incitingIncidents.selected',
          { forgeId: incident.id, name: incident.name },
        );
    }
  }

  // --- Class, subclass and characteristics (class/<name>.md) ---
  const heroClass = hero.class;
  if (heroClass) {
    assign('class.choice', [heroClass.name], 'class.name', {
      forgeId: heroClass.id,
      name: heroClass.name,
    });
    const className = selections['class.choice'];
    const profile = typeof className === 'string' ? definitions.classProfiles?.[className] : null;
    if (profile) {
      const chosen = heroClass.subclasses.filter(subclass => subclass.selected);
      if (chosen.length)
        assign(
          profile.subclassDecisionId,
          chosen.map(subclass => subclass.name),
          'class.subclasses',
          chosen.length === 1 ? { forgeId: chosen[0]!.id, name: chosen[0]!.name } : {},
        );
      mapCharacteristics(profile);
    } else if (typeof className === 'string')
      note({ path: 'class', forgeId: heroClass.id, reason: `No class profile for ${className}.` });
  }
  if (!Number.isInteger(level) || level < 1)
    note({ path: 'class.level', reason: `Level ${level} is not a hero level.` });

  function mapCharacteristics(profile: NonNullable<DecisionDefinitions['classProfiles']>[string]) {
    // "You start with a Might of 2 and an Agility of 2 ... choose one of the following arrays for
    // your other characteristic scores" (class/<name>.md, Basics), per the class profile.
    const scores = new Map(heroClass!.characteristics.map(row => [row.characteristic, row.value]));
    const assignment = decisions.get(profile.assignmentDecisionId);
    const arrays = decisions.get(profile.arrayDecisionId);
    const path = 'class.characteristics';
    if (!assignment || assignment.shape.type !== 'assignment' || !arrays?.options) {
      note({ path, reason: 'The class characteristic decisions are unavailable.' });
      return;
    }
    const targets = assignment.shape.targets;
    const fixed = Object.entries(profile.fixedCharacteristics);
    if (!scores.size) return; // An unassigned draft; nothing to map.
    const known = new Set([...targets, ...fixed.map(([name]) => name)]);
    if (
      scores.size !== known.size ||
      [...scores.keys()].some(name => !known.has(name)) ||
      fixed.some(([name, score]) => scores.get(name) !== score)
    ) {
      note({
        path,
        reason: `Forge characteristics do not match the class's fixed scores (${fixed
          .map(([name, score]) => `${name} ${score}`)
          .join(', ')}); the array is left open.`,
      });
      return;
    }
    const values = targets.map(target => scores.get(target)!);
    const sorted = (list: number[]) => [...list].sort((a, b) => a - b).join(',');
    const option = arrays.options.find(
      row =>
        sorted(
          row.value
            .replaceAll('−', '-')
            .split(',')
            .map(part => Number(part.trim())),
        ) === sorted(values),
    );
    if (!option) {
      note({ path, reason: `Scores ${values.join(', ')} are not one of the class arrays.` });
      return;
    }
    selections[profile.arrayDecisionId] = option.value;
    selections[profile.assignmentDecisionId] = Object.fromEntries(
      targets.map((target, index) => [target, values[index]!]),
    );
  }

  // --- Active features: scoped rules, structural rules, or a diagnostic ---
  for (const active of activeFeatures(hero)) {
    const { feature, path, scope } = active;
    if (active.opaque) {
      note({ ...about(feature), path, reason: `Forge ${feature.type} content is not imported.` });
      continue;
    }
    if (active.cultureRole) {
      mapCulture(active);
      continue;
    }
    if (!choiceTypes.has(feature.type)) continue; // Passive grant: Salient derives it from content.
    const data = feature.data ?? {};
    if (data.selectAt === 'play') {
      const selected = Array.isArray(data.selected) ? data.selected : [];
      if (selected.length)
        note({ ...about(feature), path, reason: 'Play-time choice state is not imported.' });
      continue;
    }
    const rule = featureRules[ruleKey(scope, feature.id)];
    const names = selectedNames(active);
    if (typeof names === 'string') {
      note({ ...about(feature), path, reason: names });
      continue;
    }
    if (rule?.kind === 'fixed') {
      if (names.length === 0 || (names.length === 1 && names[0] === rule.expected)) continue;
      const replacement =
        names.length === 1 && hero.class ? rule.duplicateReplacement?.[hero.class.id] : undefined;
      if (replacement) assign(replacement, names, path, about(feature));
      else
        note({
          ...about(feature),
          path,
          reason: `The Compendium grants ${rule.expected} here (${rule.source}); Forge selected ${names.join(', ')}.`,
        });
      continue;
    }
    if (rule?.kind === 'decision') {
      assign(rule.decision, names, path, about(feature));
      continue;
    }
    // Ancestry purchased traits: the ancestry's point-budget Choice (chapter/ancestries.md).
    if (
      active.root &&
      scope.startsWith('ancestry:') &&
      feature.type === 'Choice' &&
      data.count === 'ancestry'
    ) {
      const selected = Array.isArray(data.selected) ? (data.selected as ForgeFeature[]) : [];
      if (!ancestrySlug)
        note({
          ...about(feature),
          path,
          reason: 'The ancestry is not mapped, so neither are its traits.',
        });
      else if (selected.some(row => row.type === 'Ancestry Feature Choice'))
        note({
          ...about(feature),
          path,
          reason: 'Borrowed former-ancestry traits are not mapped.',
        });
      else assign(`ancestry.${ancestrySlug}.purchased-traits`, names, path, about(feature));
      continue;
    }
    // A class kit slot with one kit is the kit decision (chapter/kits.md; the Salient kit.choice
    // options are its Compendium kit list). Two-kit slots such as Field Arsenal are not mapped.
    if (feature.type === 'Kit' && scope.startsWith('class:') && data.count === 1) {
      assign('kit.choice', names, path, about(feature));
      continue;
    }
    note({ ...about(feature), path, reason: `No mapping for this Forge ${feature.type}.` });
  }

  function mapCulture(active: ActiveFeature) {
    const { feature, path } = active;
    const role = active.cultureRole!;
    const names = selectedNames(active);
    if (typeof names === 'string') {
      note({ ...about(feature), path, reason: names });
      return;
    }
    if (role === 'language') {
      assign('culture.language', names, path, about(feature));
      return;
    }
    assign(`culture.${role}`, [feature.name], path, about(feature));
    if (`culture.${role}` in selections)
      assign(`culture.${role}.skill`, names, path, about(feature));
  }

  // --- Authored details and unmapped data ---
  const name = hero.name.trim();
  if (name) selections['details.name'] = name;
  if (hero.complication !== null)
    note({
      path: 'complication',
      name: String((hero.complication as { name?: unknown }).name ?? ''),
      reason: 'Complications are not imported yet; choose it in Salient.',
    });
  for (const list of ['titles', 'inventory', 'projects', 'conditions'] as const)
    if (hero.state[list].length)
      note({ path: `state.${list}`, reason: `Forge ${list} are not imported.` });
  if (hero.abilityCustomizations.length)
    note({ path: 'abilityCustomizations', reason: 'Ability customizations are not imported.' });
  if (hero.state.tutorialMode !== 'Complete')
    note({
      path: 'state.tutorialMode',
      reason: 'Forge tutorial mode hides perk grants; they were not read.',
    });
  for (const [field, initial] of Object.entries(defaultState))
    if (field in hero.state && hero.state[field] !== initial)
      note({ path: `state.${field}`, reason: 'Forge play state is not imported.' });
  const extraBooks = hero.sourcebookIDs.filter(id => id !== 'core');
  if (extraBooks.length)
    note({
      path: 'sourcebookIDs',
      reason: `Forge sourcebooks ${extraBooks.join(', ')} are not enabled by import; only content that maps to the pinned Compendium is imported.`,
    });
  if (hero.picture !== null) note({ path: 'picture', reason: 'Portraits are not imported.' });
  if (hero.folder) note({ path: 'folder', reason: 'Forge folders are not imported.' });

  return {
    level,
    selections,
    authored: { name, notes: hero.state.notes },
    diagnostics,
    unmapped: [...unmapped].sort(),
  };
}

/** Parses file text and imports it; malformed JSON or shape throws `ForgeShapeError`. */
export function importForgeText(
  text: string,
  definitionsFor?: (level: number) => DecisionDefinitions,
): ForgeImportResult {
  return importForgeHero(parseForgeHero(text), definitionsFor);
}
