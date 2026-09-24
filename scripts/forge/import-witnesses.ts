// SPDX-License-Identifier: GPL-3.0-only
/**
 * Builds level-two and level-three Forge Steel heroes for every class (V182) from the unchanged
 * pinned Forge definitions and the selections of tests/fixtures/level-three-builds.ts. The builder
 * reads only selections, never expected results, and never edits a rule payload: it clones the
 * pinned class, kit, perk, domain and summon definitions and fills Forge's own selection fields
 * (`selected`, `selectedIDs`, `level`, `characteristics`), as the Forge UI does.
 *
 * Culture, career and ancestry come unchanged from the retained real export
 * tests/fixtures/v45-reference/Grug-level-2.ds-hero (Devil, Soldier), as the V94 Tactician
 * counterparts reused Grug. Fixed Compendium skills that Forge models as free choices are filled
 * with the Compendium grant (class/<name>.md "Skills"; subclass skills in
 * feature/<class>/level-1/<subclass feature>.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { core } from '@/data/sourcebooks/official/core';
import { orden } from '@/data/sourcebooks/official/orden';
import { beastheartSourcebook } from '@/data/sourcebooks/official/beastheart';
import { summonerSourcebook } from '@/data/sourcebooks/official/summoner';
import { Characteristic } from '@/enums/characteristic';
import { FeatureType } from '@/enums/feature-type';
import { SourcebookLogic } from '@/logic/sourcebook-logic';
import type { Feature } from '@/models/feature';
import type { Hero } from '@/models/hero';
import { levelThreeBuilds } from '../../tests/fixtures/level-three-builds.ts';

export const sourcebooks = [core, orden, beastheartSourcebook, summonerSourcebook];
type Selections = Record<string, unknown>;

const loose = (name: string) =>
  name.replaceAll('’', "'").normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
/**
 * Builder-only lookup key: Forge punctuates some names differently from the Compendium ("Back,
 * Blasphemer!" / "Back Blasphemer!"). Matches must still be unique; the importer resolves names
 * through its own reviewed aliases, not this key.
 */
const nameKey = (name: string) => loose(name).replace(/[^a-z0-9]/g, '');

/** Compendium fixed skills Forge offers as a free "Skill" choice, by Forge feature id. */
const fixedSkills: Record<string, string[]> = {
  // class/<name>.md, Basics, Skills
  'fury-1-1': ['Nature'],
  'elementalist-1-1': ['Magic'],
  'null-1-1': ['Psionics'],
  'shadow-1-1': ['Hide', 'Sneak'],
  'tactician-1-1': ['Lead'],
  'talent-skill-a': ['Psionics', 'Read Person'],
  'troubadour-3': ['Read Person'],
  'beastheart-1-1a': ['Handle Animals'],
  'summoner-1-1': ['Magic', 'Strategy'],
  // feature/talent/level-1/telepathic-speech.md (a language; Forge presets it)
  'talent-1-3': ['Mindspeech'],
  // feature/fury/level-1/primordial-aspect.md
  'fury-sub-1-1-1': ['Lift'],
  'fury-sub-2-1-1': ['Hide'],
  'fury-sub-3-1-1': ['Track'],
  // feature/shadow/level-1/shadow-college.md
  'shadow-sub-1-1-1': ['Magic'],
  'shadow-sub-2-1-1': ['Alchemy'],
  'shadow-sub-3-1-1': ['Lie'],
  // feature/troubadour/level-1/troubadour-class-act.md
  'troubadour-auteur-1': ['Brag'],
  'troubadour-duelist-1': ['Gymnastics'],
  'troubadour-virtuoso-1': ['Music'],
  // feature/beastheart/level-1/wild-nature.md
  'beastheart-sub-1-1-1': ['Read Person'],
  'beastheart-sub-2-1-1': ['Hide'],
  'beastheart-sub-3-1-1': ['Endurance'],
  'beastheart-sub-4-1-1': ['Magic'],
  // feature/censor/level-1/censor-order.md
  'censor-sub-1-1-1': ['Read Person'],
  'censor-sub-2-1-1': ['Magic'],
  'censor-sub-3-1-1': ['Lead'],
};

/** Forge choice feature id → the selection key whose value the witness fills in. */
const chosenBy: Record<string, string> = {
  'fury-1-2': 'class.fury.skills',
  'null-1-2': 'class.null.skills',
  'null-sub-1-1-1': 'class.null.tradition-skill.chronokinetic',
  'null-sub-2-1-1': 'class.null.tradition-skill.cryokinetic',
  'null-sub-3-1-1': 'class.null.tradition-skill.metakinetic',
  'null-1-7': 'class.null.augmentation',
  'shadow-1-3': 'class.shadow.skills',
  'tactician-1-2': 'class.tactician.skills',
  'tactician-sub-1-1-1': 'class.tactician.doctrine-skill',
  'tactician-sub-2-1-1': 'class.tactician.doctrine-skill',
  'tactician-sub-3-1-1': 'class.tactician.doctrine-skill',
  'talent-skill-c': 'class.talent.skills',
  'talent-1-5': 'class.talent.augmentation',
  'talent-1-6': 'class.talent.ward',
  'troubadour-4': 'class.troubadour.skills.interpersonal',
  'troubadour-5': 'class.troubadour.skills.intrigue-lore',
  'troubadour-16': 'class.troubadour.level-2.invocation',
  'beastheart-1-1b': 'class.beastheart.skills',
  'beastheart-1-2a': 'class.beastheart.companion',
  'summoner-1-1c': 'class.summoner.skills',
  'summoner-1-7': 'class.summoner.formation',
  'summoner-1-8': 'class.summoner.quick-command',
  'summoner-3-2': 'class.summoner.level-3.ward',
  'censor-1-1': 'class.censor.skills',
  'conduit-1-1': 'class.conduit.skills',
  'conduit-1-7': 'class.conduit.triggered-action',
  'conduit-1-8': 'class.conduit.prayer',
  'conduit-1-9': 'class.conduit.ward',
  'elementalist-1-2': 'class.elementalist.skills',
  'elementalist-1-7': 'class.elementalist.enchantment',
  'elementalist-1-8': 'class.elementalist.ward',
};

const subclassKey: Record<string, string> = {
  Fury: 'class.fury.aspect',
  Shadow: 'class.shadow.college',
  Tactician: 'class.tactician.doctrine',
  Censor: 'class.censor.order',
  Troubadour: 'class.troubadour.class-act',
  Null: 'class.null.tradition',
  Elementalist: 'class.elementalist.specialization',
  Talent: 'class.talent.tradition',
  Beastheart: 'class.beastheart.wild-nature',
  Summoner: 'class.summoner.circle',
};

export interface ImportWitness {
  id: string;
  className: string;
  level: number;
  hero: Hero;
  /** The ledger selections the hero was built from (inputs, not expectations). */
  selections: Selections;
  /** Forge choices the builder left empty, with the reason. */
  unfilled: string[];
}

const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : [String(value)]);

function build(className: string, witness: string, selections: Selections, level: number) {
  const template = JSON.parse(
    readFileSync(join('tests/fixtures/v45-reference', 'Grug-level-2.ds-hero'), 'utf8'),
  ) as Hero;
  const hero = structuredClone(template);
  const unfilled: string[] = [];
  hero.id = `v182-${witness}-${level}`;
  hero.name = `${className} ${level}`;
  hero.state.xp = 0;
  const definition = SourcebookLogic.getClasses(sourcebooks).find(c => c.name === className);
  if (!definition) throw new Error(`Pinned Forge class missing: ${className}`);
  const heroClass = structuredClone(definition);
  heroClass.level = level;
  const slug = className.toLowerCase();
  const assignment = selections[`class.${slug}.array-assignment`] as Record<string, number>;
  const primary = Object.values(Characteristic).filter(c => !(c in assignment));
  if (
    !heroClass.primaryCharacteristicsOptions.some(
      option => [...option].sort().join() === [...primary].sort().join(),
    )
  )
    throw new Error(`${className}: no pinned primary characteristic option ${primary.join()}`);
  heroClass.primaryCharacteristics = primary;
  heroClass.characteristics = Object.values(Characteristic).map(characteristic => ({
    characteristic,
    value: primary.includes(characteristic) ? 2 : assignment[characteristic]!,
  }));
  const subclassName = subclassKey[className]
    ? String(selections[subclassKey[className]])
    : undefined;
  if (subclassName) {
    const chosen = heroClass.subclasses.filter(s =>
      [loose(s.name), loose(s.name).replace(/^(college of (the )?|circle of )/, '')].includes(
        loose(subclassName),
      ),
    );
    if (chosen.length !== 1) throw new Error(`${className}: subclass ${subclassName} not found`);
    for (const s of heroClass.subclasses) s.selected = s === chosen[0];
  }
  hero.class = heroClass;

  const kits = SourcebookLogic.getKits(sourcebooks);
  const perks = sourcebooks.flatMap(book => book.perks);
  const domains = SourcebookLogic.getDomains(sourcebooks);
  const pool = [
    ...heroClass.abilities,
    ...heroClass.subclasses.filter(s => s.selected).flatMap(s => s.abilities),
  ];
  const abilityKey = (cost: unknown, featureLevel: number) => {
    if (cost === 'signature')
      return [`class.${slug}.signature-ability`, `class.${slug}.signature-abilities`].find(
        key => key in selections,
      );
    if (featureLevel === 3 && cost === 7) return `class.${slug}.level-3.ability-7`;
    if (featureLevel === 2 && cost === 5) return `class.${slug}.level-2.ability-5`;
    return `class.${slug}.ability-${String(cost)}`;
  };

  const fill = (feature: Feature, featureLevel: number, subclassLevelTwo: boolean) => {
    const data = feature.data as Record<string, unknown> & { selected?: unknown };
    const fixed = fixedSkills[feature.id];
    const chosen = chosenBy[feature.id];
    switch (feature.type) {
      case FeatureType.SkillChoice:
      case FeatureType.LanguageChoice:
        if (fixed) data.selected = [...fixed];
        else if (chosen && chosen in selections) data.selected = list(selections[chosen]);
        else unfilled.push(`${feature.id}: no input`);
        return;
      case FeatureType.ClassAbility: {
        const abilityKeyName = abilityKey(data.cost, featureLevel);
        if (!abilityKeyName || !(abilityKeyName in selections)) {
          unfilled.push(`${feature.id}: no input`);
          return;
        }
        data.selectedIDs = list(selections[abilityKeyName]).map(name => {
          const matches = pool.filter(
            a => nameKey(a.name) === nameKey(name) && a.cost === data.cost,
          );
          const ability = matches.length === 1 ? matches[0] : undefined;
          if (!ability) throw new Error(`${className}: ability ${name} not in pinned pool`);
          return ability.id;
        });
        return;
      }
      case FeatureType.Kit: {
        const names =
          className === 'Tactician'
            ? [selections['kit.choice'], selections['class.tactician.second-kit']]
            : [selections['kit.choice']];
        data.selected = names.map(name => {
          const kit = kits.find(k => nameKey(k.name) === nameKey(String(name)));
          if (!kit) throw new Error(`${className}: kit ${String(name)} missing`);
          return structuredClone(kit);
        });
        return;
      }
      case FeatureType.Perk: {
        const name = String(selections[`class.${slug}.level-2.perk`]);
        const perk = perks.find(p => nameKey(p.name) === nameKey(name));
        if (!perk) throw new Error(`${className}: perk ${name} missing`);
        data.selected = [structuredClone(perk)];
        return;
      }
      case FeatureType.Domain: {
        const names = list(
          selections[`class.${slug}.domain`] ?? selections[`class.${slug}.domains`] ?? [],
        );
        data.selected = names.map(name => {
          const domain = domains.find(d => nameKey(d.name) === nameKey(name));
          if (!domain) throw new Error(`${className}: domain ${name} missing`);
          return structuredClone(domain);
        });
        return;
      }
      case FeatureType.SummonChoice: {
        const summonKey =
          chosen ??
          (subclassName
            ? `class.summoner.portfolio.${loose(subclassName)}.${data.count === 1 ? 5 : feature.name.startsWith('Signature') ? 1 : 3}`
            : undefined);
        if (!summonKey || !(summonKey in selections)) {
          unfilled.push(`${feature.id}: no input`);
          return;
        }
        const options = (data.options ?? []) as { name: string }[];
        data.selected = list(selections[summonKey]).map(name => {
          const option = options.find(o => nameKey(o.name) === nameKey(name));
          if (!option) throw new Error(`${className}: summon ${name} missing`);
          return structuredClone(option);
        });
        return;
      }
      case FeatureType.Choice: {
        const choiceKey =
          chosen ??
          (subclassLevelTwo
            ? Object.keys(selections).find(k =>
                new RegExp(`^class\\.${slug}\\.level-2\\.[a-z-]+-ability$`).test(k),
              )
            : undefined);
        if (!choiceKey || !(choiceKey in selections)) {
          unfilled.push(`${feature.id}: no input`);
          return;
        }
        const options = (data.options ?? []) as { feature: Feature }[];
        data.selected = list(selections[choiceKey]).map(name => {
          const option = options.filter(
            o =>
              nameKey(o.feature.name) === nameKey(name) ||
              loose(o.feature.name).startsWith(`${loose(name)} `),
          );
          if (option.length !== 1)
            throw new Error(`${className}: ${feature.id} option ${name} not unique`);
          return structuredClone(option[0]!.feature);
        });
        return;
      }
      case FeatureType.DomainFeature:
        unfilled.push(`${feature.id}: domain features are not filled by this builder`);
        return;
      case FeatureType.Multiple:
        for (const inner of (data as { features: Feature[] }).features)
          fill(inner, featureLevel, subclassLevelTwo);
        return;
    }
  };
  for (const row of heroClass.featuresByLevel)
    if (row.level <= level) for (const feature of row.features) fill(feature, row.level, false);
  for (const subclass of heroClass.subclasses.filter(s => s.selected))
    for (const row of subclass.featuresByLevel)
      if (row.level <= level)
        for (const feature of row.features) fill(feature, row.level, row.level === 2);
  return { hero, unfilled };
}

/** Level-two and level-three witnesses for every class, level-two inputs only at level two. */
export function createImportWitnesses(): ImportWitness[] {
  return levelThreeBuilds().flatMap(({ className, witness, selections }) =>
    [2, 3].map(level => {
      const input = Object.fromEntries(
        Object.entries(selections).filter(([key]) => level === 3 || !/\.level-3\./.test(key)),
      );
      const { hero, unfilled } = build(className, witness, input, level);
      return {
        id: `${className.toLowerCase()}-level-${level}`,
        className,
        level,
        hero,
        selections: input,
        unfilled,
      };
    }),
  );
}
