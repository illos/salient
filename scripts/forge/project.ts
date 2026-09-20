// SPDX-License-Identifier: GPL-3.0-only
/** Bounded projection for the six ancestry/Fury/Elementalist witnesses, not a general importer. */
import { AbilityData } from '@/data/ability-data';
import { core } from '@/data/sourcebooks/official/core';
import { orden } from '@/data/sourcebooks/official/orden';
import { Characteristic } from '@/enums/characteristic';
import { DamageModifierType } from '@/enums/damage-modifier-type';
import { FeatureType } from '@/enums/feature-type';
import { FeatureLogic } from '@/logic/feature-logic';
import { HeroLogic } from '@/logic/hero-logic';
import { SourcebookLogic } from '@/logic/sourcebook-logic';
import { isDeepStrictEqual } from 'node:util';
import type { Feature } from '@/models/feature';
import type { Hero } from '@/models/hero';

const sourcebooks = [core, orden];
const supportedChoiceTypes = new Set<FeatureType>([
  FeatureType.Choice,
  FeatureType.AncestryChoice,
  FeatureType.AncestryFeatureChoice,
  FeatureType.SkillChoice,
  FeatureType.LanguageChoice,
  FeatureType.ClassAbility,
  FeatureType.Kit,
  FeatureType.Perk,
]);
const names = (values: string[]) => [...new Set(values)].sort();
const displayNames: Record<string, string> = {
  'Elf (high)': 'High Elf',
  'Elf (wode)': 'Wode Elf',
  'Draconic Pride': 'Draconian Pride',
  'Remember your Oath': 'Remember Your Oath',
  Perseverence: 'Perseverance',
  'All Is A Feather': 'All Is a Feather',
  'Free Strike (melee)': 'Melee Weapon Free Strike',
  'Free Strike (ranged)': 'Ranged Weapon Free Strike',
};
const displayName = (name: string) =>
  name.startsWith('Prismatic Scales (') ? 'Prismatic Scales' : (displayNames[name] ?? name);

type ChoiceProblem = { id: string; name: string; type: string; reason: string };
const problem = (feature: Feature, reason: string): ChoiceProblem => ({
  id: feature.id,
  name: feature.name,
  type: feature.type,
  reason,
});

/** Choice state may change; pinned rule payloads and eligible pools may not. */
function canonicalPayload(feature: Feature): Feature {
  const copy = structuredClone(feature);
  if (copy.type === FeatureType.Choice) copy.data.selected = [];
  if (copy.type === FeatureType.AncestryChoice || copy.type === FeatureType.AncestryFeatureChoice)
    copy.data.selected = null;
  if (copy.type === FeatureType.Multiple)
    copy.data.features = copy.data.features.map(canonicalPayload);
  return copy;
}
const samePayload = (selected: Feature, canonical: Feature) =>
  isDeepStrictEqual(canonicalPayload(selected), canonicalPayload(canonical));

function projectChecked(hero: Hero) {
  if (!hero.ancestry || !hero.culture || !hero.career || !hero.class)
    throw new Error('Forge counterpart lacks ancestry, culture, career or class');
  if (
    ![
      'Devil',
      'Polder',
      'Dwarf',
      'Human',
      'Hakaan',
      'Orc',
      'Dragon Knight',
      'Elf (high)',
      'Memonek',
      'Revenant',
      'Time Raider',
      'Elf (wode)',
    ].includes(hero.ancestry.name) ||
    !['Fury', 'Elementalist'].includes(hero.class.name) ||
    hero.class.level !== 1
  )
    throw new Error('Forge projection supports only declared level-one witness families');
  if (hero.state.conditions.length || hero.state.inventory.length || hero.state.titles.length)
    throw new Error('Forge baseline projection requires the clean witness play state');
  if (hero.state.tutorialMode !== 'Complete')
    throw new Error('Tutorial-filtered heroes unsupported');
  if (
    !hero.career.incitingIncidents.selected ||
    !hero.career.incitingIncidents.options.some(
      option => option.id === hero.career!.incitingIncidents.selected!.id,
    )
  )
    throw new Error('Missing or unknown career inciting incident');
  if (
    hero.class.subclasses.filter(subclass => subclass.selected).length !== hero.class.subclassCount
  )
    throw new Error('Missing or excess subclass selection');
  const primary = hero.class.primaryCharacteristics;
  if (
    !hero.class.primaryCharacteristicsOptions.some(option =>
      isDeepStrictEqual([...option].sort(), [...primary].sort()),
    )
  )
    throw new Error('Invalid primary characteristic selection');
  const characteristics = hero.class.characteristics;
  if (
    characteristics.length !== 5 ||
    new Set(characteristics.map(row => row.characteristic)).size !== 5 ||
    !Object.values(Characteristic).every(value =>
      characteristics.some(row => row.characteristic === value),
    ) ||
    characteristics.some(row => primary.includes(row.characteristic) && row.value !== 2) ||
    !HeroLogic.getCharacteristicArrays(primary.length).some(array =>
      isDeepStrictEqual(
        [...array].sort(),
        characteristics
          .filter(row => !primary.includes(row.characteristic))
          .map(row => row.value)
          .sort(),
      ),
    )
  )
    throw new Error('Invalid or missing characteristic assignment');

  const active = HeroLogic.getFeatures(hero).map(entry => entry.feature);
  const outstandingChoices: ChoiceProblem[] = [];
  const unsupportedChoices: ChoiceProblem[] = [];
  for (const feature of active) {
    if (!FeatureLogic.isChoice(feature)) continue;
    if (feature.data && 'selectAt' in feature.data && feature.data.selectAt === 'play') continue;
    if (!supportedChoiceTypes.has(feature.type)) {
      unsupportedChoices.push(
        problem(feature, 'Choice semantics outside declared witness support'),
      );
      continue;
    }
    if (!FeatureLogic.isChosen(feature, hero, sourcebooks))
      outstandingChoices.push(problem(feature, 'Pinned Forge isChosen returned false'));
    const check = (selected: string[], count: number, allowed: string[]) => {
      if (selected.length !== count || new Set(selected).size !== selected.length)
        outstandingChoices.push(problem(feature, 'Selection count or uniqueness invalid'));
      if (selected.some(value => !allowed.includes(value)))
        outstandingChoices.push(problem(feature, 'Selected option outside eligible pool'));
    };
    switch (feature.type) {
      case FeatureType.AncestryChoice: {
        const selected = feature.data.selected;
        const canonical = sourcebooks
          .flatMap(book => book.ancestries)
          .find(a => a.id === selected?.id);
        if (
          !selected ||
          !canonical ||
          canonical.name === 'Revenant' ||
          !isDeepStrictEqual(selected, canonical)
        )
          outstandingChoices.push(
            problem(feature, 'Former ancestry must be an unchanged eligible pinned ancestry'),
          );
        break;
      }
      case FeatureType.AncestryFeatureChoice: {
        const former = HeroLogic.getFormerAncestries(hero);
        const source = feature.data.source;
        if (!source.former || source.current || source.customID || former.length !== 1) {
          unsupportedChoices.push(
            problem(feature, 'Only one former-ancestry purchased trait is supported'),
          );
          break;
        }
        const selected = feature.data.selected;
        const canonical = sourcebooks
          .flatMap(book => book.ancestries)
          .find(a => a.id === former[0]!.id);
        const options =
          canonical?.features.flatMap(f =>
            f.type === FeatureType.Choice && f.data.count === 'ancestry' ? f.data.options : [],
          ) ?? [];
        const option = options.find(
          o => o.feature.id === selected?.id && o.value === feature.data.value,
        );
        if (
          !selected ||
          !option ||
          selected.name.startsWith('Prismatic Scales (') ||
          !samePayload(selected, option.feature)
        )
          outstandingChoices.push(
            problem(
              feature,
              'Borrowed trait must be an eligible exact-cost pinned former-ancestry purchase',
            ),
          );
        break;
      }

      case FeatureType.SkillChoice:
        check(feature.data.selected, feature.data.count, [
          ...feature.data.options,
          ...SourcebookLogic.getSkills(sourcebooks)
            .filter(skill => feature.data.listOptions.includes(skill.list))
            .map(skill => skill.name),
        ]);
        break;
      case FeatureType.LanguageChoice:
        check(feature.data.selected, feature.data.count, [
          ...feature.data.options,
          ...sourcebooks
            .flatMap(book => book.languages)
            .filter(language => feature.data.allowedTypes.includes(language.type))
            .map(language => language.name),
        ]);
        break;
      case FeatureType.ClassAbility: {
        if (feature.data.classID && feature.data.classID !== hero.class.id) {
          unsupportedChoices.push(problem(feature, 'Cross-class ability choice unsupported'));
          break;
        }
        const source = feature.data.source;
        const abilities = SourcebookLogic.getAbilitiesFromClass(
          hero.class,
          source.fromClassAbilities,
          source.fromSelectedSubclassAbilities,
          source.fromUnselectedSubclassAbilities,
          source.fromClassLevels,
          source.fromSelectedSubclassLevels,
          source.fromUnselectedSubclassLevels,
        );
        check(
          feature.data.selectedIDs,
          feature.data.count,
          abilities
            .filter(ability => ability.cost === feature.data.cost)
            .map(ability => ability.id),
        );
        if (feature.data.minLevel > hero.class.level)
          outstandingChoices.push(problem(feature, 'Ability choice is above hero level'));
        break;
      }
      case FeatureType.Kit:
        check(
          feature.data.selected.map(kit => kit.id),
          feature.data.count,
          SourcebookLogic.getKits(sourcebooks)
            .filter(kit => feature.data.types.length === 0 || feature.data.types.includes(kit.type))
            .map(kit => kit.id),
        );
        break;
      case FeatureType.Perk:
        check(
          feature.data.selected.map(perk => perk.id),
          feature.data.count,
          SourcebookLogic.getPerks(sourcebooks)
            .filter(perk => feature.data.lists.includes(perk.list))
            .map(perk => perk.id),
        );
        break;
      case FeatureType.Choice:
        if (feature.data.count !== 'ancestry') {
          const ids = feature.data.selected.map(entry => entry.id);
          const options = ids.map(id =>
            feature.data.options.find(option => option.feature.id === id),
          );
          if (
            feature.data.selected.some(
              (selected, index) =>
                options[index] && !samePayload(selected, options[index]!.feature),
            )
          )
            outstandingChoices.push(
              problem(feature, 'Nested choice payload differs from its pinned eligible option'),
            );
          if (
            new Set(ids).size !== ids.length ||
            options.some(option => !option) ||
            options.reduce((sum, option) => sum + (option?.value ?? 0), 0) !== feature.data.count
          )
            outstandingChoices.push(
              problem(feature, 'Choice membership, uniqueness or exact budget invalid'),
            );
        }
        break;
    }

    // Upstream isChosen only checks >= budget and searches every ancestry. Tighten that
    // check for our same-ancestry witnesses so duplicates/foreign choices cannot pass.
    if (feature.type === FeatureType.Choice && feature.data.count === 'ancestry') {
      const canonical = sourcebooks
        .flatMap(book => book.ancestries)
        .find(ancestry => ancestry.id === hero.ancestry!.id)
        ?.features.find(entry => entry.id === feature.id);
      if (!canonical || canonical.type !== FeatureType.Choice)
        throw new Error(`Pinned ancestry purchase definition missing: ${feature.id}`);
      const ids = feature.data.selected.map(entry => entry.id);
      const effectiveIds = feature.data.selected.map(entry =>
        entry.type === FeatureType.AncestryFeatureChoice
          ? (entry.data.selected?.id ?? entry.id)
          : entry.id,
      );
      if (new Set(effectiveIds).size !== effectiveIds.length)
        outstandingChoices.push(problem(feature, 'Duplicate underlying ancestry purchase'));
      if (new Set(ids).size !== ids.length)
        outstandingChoices.push(problem(feature, 'Duplicate ancestry purchase'));
      // Pinned ConfigChoice (choice.tsx) exposes former paid options directly; it does not
      // clone the one-point Previous Life wrapper for each purchase. Preserve strict source pools.
      const eligible = [...canonical.data.options];
      if (hero.ancestry.name === 'Revenant') {
        const former = HeroLogic.getFormerAncestries(hero);
        if (former.length === 1) {
          const pinnedFormer = sourcebooks
            .flatMap(book => book.ancestries)
            .find(a => a.id === former[0]!.id);
          eligible.push(
            ...(
              pinnedFormer?.features.flatMap(f =>
                f.type === FeatureType.Choice && f.data.count === 'ancestry' ? f.data.options : [],
              ) ?? []
            ).filter(
              o =>
                (o.value === 1 || o.value === 2) &&
                !o.feature.name.startsWith('Prismatic Scales ('),
            ),
          );
        }
      }
      const options = ids.map(id => eligible.find(option => option.feature.id === id));
      if (options.some(option => !option))
        outstandingChoices.push(problem(feature, 'Purchase outside this pinned ancestry'));
      if (
        feature.data.selected.some(
          (selected, index) => options[index] && !samePayload(selected, options[index]!.feature),
        )
      )
        outstandingChoices.push(
          problem(feature, 'Selected ancestry payload differs from pinned definition'),
        );
      if (
        options.reduce((total, option) => total + (option?.value ?? 0), 0) !==
        HeroLogic.getAncestryPoints(hero)
      )
        outstandingChoices.push(
          problem(feature, 'Ancestry purchases do not spend the exact budget'),
        );
    }
  }
  const size = HeroLogic.getSize(hero);
  const baseline = {
    staminaMaximum: HeroLogic.getStamina(hero),
    recoveriesMaximum: HeroLogic.getRecoveries(hero),
    recoveryValue: HeroLogic.getRecoveryValue(hero),
    windedValue: HeroLogic.getWindedThreshold(hero),
    speed: HeroLogic.getSpeed(hero).value,
    stability: HeroLogic.getStability(hero),
    size: `${size.value}${size.mod}`,
    disengage: HeroLogic.getDisengage(hero),
    savingThrowThreshold: HeroLogic.getSaveThreshold(hero),
    renown: HeroLogic.getRenown(hero),
    wealth: HeroLogic.getWealth(hero),
    characteristics: {
      M: HeroLogic.getCharacteristic(hero, Characteristic.Might),
      A: HeroLogic.getCharacteristic(hero, Characteristic.Agility),
      R: HeroLogic.getCharacteristic(hero, Characteristic.Reason),
      I: HeroLogic.getCharacteristic(hero, Characteristic.Intuition),
      P: HeroLogic.getCharacteristic(hero, Characteristic.Presence),
    },
  };
  if (
    Object.values(baseline).some(value => typeof value === 'number' && !Number.isFinite(value)) ||
    Object.values(baseline.characteristics).some(value => !Number.isFinite(value))
  )
    throw new Error('Pinned Forge returned a non-finite baseline');
  return {
    baseline,
    skills: names(HeroLogic.getSkills(hero, sourcebooks).map(skill => skill.name)),
    languages: names(HeroLogic.getLanguages(hero, sourcebooks).map(language => language.name)),
    // Forge exposes weapon free strikes separately from its selected-feature ability list.
    abilities: names(
      [
        ...HeroLogic.getAbilities(hero, sourcebooks, []).map(entry => entry.ability.name),
        AbilityData.freeStrikeMelee.name,
        AbilityData.freeStrikeRanged.name,
      ].map(displayName),
    ),
    conditionImmunities: names(
      HeroLogic.getConditionImmunities(hero).map(value => value.toLowerCase()),
    ),
    damageImmunities: HeroLogic.getDamageModifiers(hero)
      .filter(modifier => modifier.modifierType === DamageModifierType.Immunity)
      .map(modifier => ({ damageType: modifier.damageType.toLowerCase(), value: modifier.value })),
    damageWeaknesses: HeroLogic.getDamageModifiers(hero)
      .filter(modifier => modifier.modifierType === DamageModifierType.Weakness)
      .map(modifier => ({ damageType: modifier.damageType.toLowerCase(), value: modifier.value })),
    ancestryFeatures: names(
      hero.ancestry.features.flatMap(feature =>
        feature.type === FeatureType.Choice && feature.data.count === 'ancestry'
          ? feature.data.selected.map(selected =>
              displayName(
                selected.type === FeatureType.AncestryFeatureChoice && selected.data.selected
                  ? selected.data.selected.name
                  : selected.name,
              ),
            )
          : [displayName(feature.name)],
      ),
    ),
    features: names(active.map(feature => displayName(feature.name))),
    outstandingChoices,
    unsupportedChoices,
    complete: outstandingChoices.length === 0 && unsupportedChoices.length === 0,
  };
}

/** Forge catches some internal exceptions and logs them; never certify that partial result. */
export function project(hero: Hero) {
  const originalError = console.error;
  let reportedError = false;
  console.error = (...args: unknown[]) => {
    reportedError = true;
    originalError(...args);
  };
  try {
    const result = projectChecked(hero);
    if (reportedError) throw new Error('Pinned Forge logged an internal error during projection');
    return result;
  } finally {
    console.error = originalError;
  }
}

export type ForgeProjection = ReturnType<typeof project>;
