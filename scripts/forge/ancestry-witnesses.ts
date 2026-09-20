// SPDX-License-Identifier: GPL-3.0-only
/** Counterparts built from retained V45 exports and the unmodified pinned Forge definitions. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { devil } from '@/data/ancestries/devil';
import { polder } from '@/data/ancestries/polder';
import { dwarf } from '@/data/ancestries/dwarf';
import { human } from '@/data/ancestries/human';
import { hakaan } from '@/data/ancestries/hakaan';
import { orc } from '@/data/ancestries/orc';
import { Characteristic } from '@/enums/characteristic';
import { FeatureType } from '@/enums/feature-type';
import type { Ancestry } from '@/models/ancestry';
import type { Feature, FeatureChoice } from '@/models/feature';
import type { Hero } from '@/models/hero';

export interface ForgeWitness {
  id: string;
  hero: Hero;
  selections: Record<string, unknown>;
  ancestry: string;
  purchasedTraits: string[];
  /** Explicit adapter differences; these must not be mistaken for independent Forge proof. */
  calibration: string[];
}

export const forgeNameAliases: Record<string, string> = {
  Perseverence: 'Perseverance',
  'All Is A Feather': 'All Is a Feather',
};

const interpersonal = [
  'Brag',
  'Empathize',
  'Flirt',
  'Gamble',
  'Handle Animals',
  'Interrogate',
  'Intimidate',
  'Lead',
  'Lie',
  'Music',
  'Perform',
  'Persuade',
  'Read Person',
];
const crafting = [
  'Alchemy',
  'Architecture',
  'Blacksmithing',
  'Carpentry',
  'Cooking',
  'Fletching',
  'Forgery',
  'Jewelry',
  'Mechanics',
  'Tailoring',
];

const families: { ancestry: Ancestry; bundles: string[][] }[] = [
  {
    ancestry: devil,
    bundles: [
      ['Beast Legs', 'Impressive Horns'],
      ['Prehensile Tail', 'Beast Legs'],
      ['Barbed Tail', 'Glowing Eyes', 'Hellsight'],
      ['Wings', 'Beast Legs'],
    ],
  },
  {
    ancestry: polder,
    bundles: [
      ['Corruption Immunity', 'Graceful Retreat', 'Fearless'],
      ['Nimblestep', 'Polder Geist', 'Reactive Tumble'],
    ],
  },
  {
    ancestry: dwarf,
    bundles: [
      ['Grounded', 'Spark Off Your Skin'],
      ['Great Fortitude', 'Stand Tough'],
      ['Grounded', 'Stand Tough', 'Stone Singer'],
    ],
  },
  {
    ancestry: human,
    bundles: [
      ['Perseverance', 'Staying Power'],
      ['Determination', "Can't Take Hold"],
      ['Perseverance', 'Resist the Unnatural', "Can't Take Hold"],
    ],
  },
  {
    ancestry: hakaan,
    bundles: [
      ['Great Fortitude', 'Stand Tough'],
      ['Doomsight', 'Forceful'],
      ['All Is a Feather', 'Forceful', 'Stand Tough'],
    ],
  },
  {
    ancestry: orc,
    bundles: [
      ['Grounded', 'Nonstop'],
      ['Bloodfire Rush', 'Glowing Recovery'],
      ['Bloodfire Rush', 'Grounded', 'Passionate Artisan'],
    ],
  },
];

function traitChoice(ancestry: Ancestry): FeatureChoice {
  const choice = ancestry.features.find(
    feature => feature.type === FeatureType.Choice && feature.data.count === 'ancestry',
  );
  if (!choice || choice.type !== FeatureType.Choice)
    throw new Error(`Pinned Forge ancestry lacks purchase choice: ${ancestry.name}`);
  return choice;
}

function chooseTraits(ancestry: Ancestry, names: string[]) {
  const choice = traitChoice(ancestry);
  const options = names.map(name => {
    const option = choice.data.options.find(
      entry => (forgeNameAliases[entry.feature.name] ?? entry.feature.name) === name,
    );
    if (!option) throw new Error(`Pinned Forge option missing: ${ancestry.name}/${name}`);
    return option;
  });
  if (options.reduce((total, option) => total + option.value, 0) !== ancestry.ancestryPoints)
    throw new Error(`Counterpart does not spend exact Forge budget: ${ancestry.name}`);
  choice.data.selected = options.map(option => structuredClone(option.feature));
}

function skillChoice(features: Feature[], id: string, skill: string): boolean {
  for (const feature of features) {
    if (feature.id === id && feature.type === FeatureType.SkillChoice) {
      feature.data.selected = [skill];
      return true;
    }
    if (feature.type === FeatureType.Multiple && skillChoice(feature.data.features, id, skill))
      return true;
  }
  return false;
}

/** Read only approved pre-pilot fixtures. Caller supplies repository fixture root if cwd differs. */
export function createWitnesses(fixtureRoot = 'tests/fixtures'): ForgeWitness[] {
  const read = (path: string) => JSON.parse(readFileSync(join(fixtureRoot, path), 'utf8'));
  const fury = read('v25-fury.json') as { selections: Record<string, unknown> };
  const elementalist = read('v25-bethell.json') as { selections: Record<string, unknown> };
  const grug = read('v45-reference/Grug-level-1.ds-hero') as Hero;
  const bethell = read('v45-reference/Bethell-corrected-export.ds-hero') as Hero;
  const result: ForgeWitness[] = [];
  for (const family of families) {
    const ancestry = family.ancestry.name;
    const isElementalist = ancestry === 'Polder' || ancestry === 'Human';
    // Every Silver Tongue option and every Artisan target receives a persisted counterpart.
    const variants =
      ancestry === 'Devil'
        ? interpersonal.length
        : ancestry === 'Orc'
          ? 2 + crafting.length / 2
          : family.bundles.length;
    for (let index = 0; index < variants; index++) {
      const hero = structuredClone(isElementalist ? bethell : grug);
      const selections = structuredClone((isElementalist ? elementalist : fury).selections);
      const purchasedTraits = [
        ...family.bundles[ancestry === 'Orc' ? Math.min(index, 2) : index % family.bundles.length]!,
      ];
      const id = `${ancestry.toLowerCase()}-${index + 1}`;
      const calibration: string[] = [];
      if (isElementalist && hero.class?.primaryCharacteristics.length === 0) {
        hero.class.primaryCharacteristics = [Characteristic.Reason];
        calibration.push(
          'Retained Bethell omits primaryCharacteristics; restored Reason from its sole pinned class option. Numeric characteristics unchanged.',
        );
      }
      hero.ancestry = structuredClone(family.ancestry);
      chooseTraits(hero.ancestry, purchasedTraits);
      for (const key of Object.keys(selections))
        if (key.startsWith('ancestry.')) delete selections[key];
      selections['ancestry.choice'] = ancestry;
      selections[`ancestry.${ancestry.toLowerCase()}.purchased-traits`] = purchasedTraits;
      hero.name = `Forge counterpart ${id}`;
      selections['details.name'] = hero.name;
      if (isElementalist)
        calibration.push(
          'Retained Bethell maps the fixed Magic collision to career Empathize; ' +
            'Salient records the same choice as class.elementalist.magic-replacement.',
        );
      if (!isElementalist) {
        const language = hero.career?.features.find(
          feature => feature.id === 'career-soldier-feature-3',
        );
        if (!language || language.type !== FeatureType.LanguageChoice)
          throw new Error('Retained Soldier language choice missing');
        language.data.selected = ['Kalliak', 'Vaslorian'];
        selections['career.soldier.languages'] = ['Kalliak', 'Vaslorian'];
        calibration.push(
          'Filled retained optional Soldier language vacancy with Kalliak in both inputs.',
        );
      }
      if (ancestry === 'Devil') {
        const skill = interpersonal[index]!;
        if (!skillChoice(hero.ancestry.features, 'devil-feature-1b', skill))
          throw new Error('Pinned Silver Tongue skill choice missing');
        const upbringing = hero.culture?.upbringing;
        if (!upbringing || upbringing.type !== FeatureType.SkillChoice)
          throw new Error('Retained Martial skill choice missing');
        upbringing.data.selected = ['Ride'];
        selections['culture.upbringing.skill'] = 'Ride';
        selections['ancestry.devil.silver-tongue-skill'] = skill;
        calibration.push(
          'Martial selects Ride in both inputs to avoid Silver Tongue Intimidate collision.',
        );
      }
      if (purchasedTraits.includes('Passionate Artisan')) {
        const targets = crafting.slice((index - 2) * 2, (index - 2) * 2 + 2);
        selections['ancestry.orc.passionate-artisan.skills'] = targets;
        calibration.push(
          `Forge stores Passionate Artisan as text only: target pair ${targets.join(' / ')} ` +
            'has no Forge choice field. Compare its trait and absence of extra skill grants; ' +
            'target persistence is Salient-only proof.',
        );
      }
      if (ancestry === 'Human')
        calibration.push('Forge Perseverence spelling maps to Compendium Perseverance.');
      if (ancestry === 'Hakaan')
        calibration.push(
          'Forge All Is A Feather capitalization maps to Compendium All Is a Feather.',
        );
      if (ancestry === 'Dwarf')
        calibration.push('Runic Carving is a Forge play-time choice; no active rune selected.');
      result.push({ id, hero, selections, ancestry, purchasedTraits, calibration });
    }
  }
  return result;
}
