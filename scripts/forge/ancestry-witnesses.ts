// SPDX-License-Identifier: GPL-3.0-only
/** Counterparts built from retained V45 exports and the unmodified pinned Forge definitions. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dragonKnight } from '@/data/ancestries/dragon-knight';
import { highElf } from '@/data/ancestries/elf-high';
import { memonek } from '@/data/ancestries/memonek';
import { timeRaider } from '@/data/ancestries/time-raider';
import { revenant } from '@/data/ancestries/revenant';
import { wodeElf } from '@/data/ancestries/elf-wode';
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
import { forgeNameAliases } from '../../shared/interchange/forge-steel/names.ts';

export { forgeNameAliases };

export interface ForgeWitness {
  id: string;
  hero: Hero;
  selections: Record<string, unknown>;
  ancestry: string;
  purchasedTraits: string[];
  /** Explicit adapter differences; these must not be mistaken for independent Forge proof. */
  calibration: string[];
}

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

const damageTypes = ['acid', 'cold', 'corruption', 'fire', 'lightning', 'poison'];
const psionicGifts = ['Concussive Slam', 'Psionic Bolt', 'Minor Acceleration'];
const slug = (name: string) => name.toLowerCase().replaceAll(' ', '-');

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
  {
    ancestry: dragonKnight,
    bundles: [
      ...damageTypes.map(type => ['Dragon Breath', `Prismatic Scales (${type})`]),
      ['Draconian Pride', 'Draconian Guard'],
      ['Wings', 'Remember Your Oath'],
    ],
  },
  {
    ancestry: highElf,
    bundles: [
      ['Unstoppable Mind', 'Graceful Retreat'],
      ['Otherworldly Grace', 'High Senses'],
      ['Otherworldly Grace', 'Revisit Memory'],
      ['Glamor of Terror', 'High Senses'],
    ],
  },
  {
    ancestry: memonek,
    bundles: [
      ['I Am Law', 'Systematic Mind', 'Unphased', 'Useful Emotion'],
      ['Keeper of Order', 'Lightning Nimbleness'],
      ['Nonstop', 'I Am Law', 'Useful Emotion'],
    ],
  },
  {
    ancestry: timeRaider,
    bundles: [
      ['Beyondsight', 'Foresight', 'Four-Armed Athletics'],
      ['Four-Armed Martial Arts', 'Beyondsight'],
      ['Unstoppable Mind', 'Foresight'],
      ...psionicGifts.map(() => ['Psionic Gift', 'Four-Armed Athletics']),
    ],
  },
  {
    ancestry: wodeElf,
    bundles: [
      ['Forest Walk', 'Revisit Memory', 'Swift'],
      ['Otherworldly Grace', 'Quick and Brutal'],
      ['The Wode Defends', 'Swift'],
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
    const ancestry = forgeNameAliases[family.ancestry.name] ?? family.ancestry.name;
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
      const id = `${slug(ancestry)}-${index + 1}`;
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
      selections[`ancestry.${slug(ancestry)}.purchased-traits`] = purchasedTraits.map(name =>
        name.startsWith('Prismatic Scales (') ? 'Prismatic Scales' : name,
      );
      if (ancestry === 'Dragon Knight') {
        const choice = hero.ancestry.features.find(f => f.id === 'dragon-knight-feature-1');
        if (!choice || choice.type !== FeatureType.Choice) throw new Error('Missing Wyrmplate');
        const type = damageTypes[(index + 1) % damageTypes.length]!;
        choice.data.selected = [
          structuredClone(choice.data.options[(index + 1) % damageTypes.length]!.feature),
        ];
        selections['ancestry.dragon-knight.wyrmplate-immunity'] = type;
        const scales = purchasedTraits.find(name => name.startsWith('Prismatic Scales ('));
        if (scales)
          selections['ancestry.dragon-knight.prismatic-scales-immunity'] = scales.slice(18, -1);
        calibration.push(
          'Forge typed Prismatic Scales purchases map to the Compendium trait plus its permanent damage-type child choice; Draconic Pride spelling maps to Draconian Pride.',
        );
      }
      if (ancestry === 'Time Raider' && purchasedTraits.includes('Psionic Gift')) {
        const gift = psionicGifts[index - 3]!;
        const choice = traitChoice(hero.ancestry).data.selected.find(
          f => f.name === 'Psionic Gift',
        );
        if (!choice || choice.type !== FeatureType.Choice) throw new Error('Missing Psionic Gift');
        choice.data.selected = [
          structuredClone(choice.data.options.find(o => o.feature.name === gift)!.feature),
        ];
        selections['ancestry.time-raider.psionic-gift.ability'] = gift;
      }
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
      result.push({
        id,
        hero,
        selections,
        ancestry,
        purchasedTraits: purchasedTraits.map(name =>
          name.startsWith('Prismatic Scales (') ? 'Prismatic Scales' : name,
        ),
        calibration,
      });
    }
  }
  const formerFamilies = families.map(f => f.ancestry);
  const template = result.find(w => w.ancestry === 'Dwarf')!;
  for (const former of formerFamilies) {
    const formerName = forgeNameAliases[former.name] ?? former.name;
    const formerSlug = slug(formerName);
    const options = traitChoice(former).data.options.filter(
      o => !o.feature.name.startsWith('Prismatic Scales ('),
    );
    // Each native former-life size plus every eligible exact-cost purchased trait.
    const cases: { native?: string; option?: (typeof options)[number]; variant?: number }[] = [
      { native: 'Bloodless' },
      ...options.flatMap(option => {
        const variants =
          option.feature.name === 'Psionic Gift'
            ? 3
            : option.feature.name === 'Passionate Artisan'
              ? 5
              : 1;
        return Array.from({ length: variants }, (_, variant) => ({ option, variant }));
      }),
    ];
    if (formerName === 'Human') cases.push({ native: 'Vengeance Mark' });
    for (let index = 0; index < cases.length; index++) {
      const item = cases[index]!;
      const hero = structuredClone(template.hero);
      hero.ancestry = structuredClone(revenant);
      const formerChoice = hero.ancestry.features.find(f => f.type === FeatureType.AncestryChoice);
      if (!formerChoice || formerChoice.type !== FeatureType.AncestryChoice)
        throw new Error('Pinned former life missing');
      formerChoice.data.selected = structuredClone(former);
      const purchases = traitChoice(hero.ancestry);
      const purchasedTraits: string[] = [];
      if (item.option) {
        const wrapper = purchases.data.options.find(
          o =>
            o.feature.type === FeatureType.AncestryFeatureChoice &&
            o.feature.data.value === item.option!.value,
        )?.feature;
        if (!wrapper || wrapper.type !== FeatureType.AncestryFeatureChoice)
          throw new Error('Pinned Previous Life wrapper missing');
        const selected = structuredClone(wrapper);
        selected.data.selected = structuredClone(item.option.feature);
        purchases.data.selected = [selected];
        purchasedTraits.push(
          forgeNameAliases[item.option.feature.name] ?? item.option.feature.name,
        );
      } else {
        const native = purchases.data.options.find(o => o.feature.name === item.native);
        if (!native) throw new Error('Pinned native Revenant purchase missing');
        purchases.data.selected = [structuredClone(native.feature)];
        purchasedTraits.push(item.native!);
      }
      const budget = formerName === 'Polder' ? 3 : 2;
      const spent = item.option?.value ?? 2;
      const remainder = budget - spent;
      if (remainder) {
        const filler = purchases.data.options.find(
          o => o.feature.name === (remainder === 2 ? 'Bloodless' : 'Undead Influence'),
        );
        if (!filler || filler.value !== remainder)
          throw new Error('Pinned Revenant filler missing');
        purchases.data.selected.push(structuredClone(filler.feature));
        purchasedTraits.push(filler.feature.name);
      }
      const selections = structuredClone(template.selections);
      for (const key of Object.keys(selections))
        if (key.startsWith('ancestry.')) delete selections[key];
      selections['ancestry.choice'] = 'Revenant';
      selections['ancestry.revenant.former-life'] = formerName;
      selections[`ancestry.revenant.${formerSlug}.purchased-traits`] = purchasedTraits;
      const calibration = [
        ...template.calibration,
        'Forge Previous Life wrappers project to the selected purchased trait; former ancestry grants only size, never its signature traits.',
      ];
      if (purchasedTraits.includes('Psionic Gift')) {
        const wrapper = purchases.data.selected.find(
          f => f.type === FeatureType.AncestryFeatureChoice,
        );
        const choice =
          wrapper?.type === FeatureType.AncestryFeatureChoice ? wrapper.data.selected : null;
        if (!choice || choice.type !== FeatureType.Choice)
          throw new Error('Borrowed Psionic Gift missing');
        const gift = psionicGifts[item.variant ?? 0]!;
        choice.data.selected = [
          structuredClone(choice.data.options.find(o => o.feature.name === gift)!.feature),
        ];
        selections['ancestry.revenant.time-raider.psionic-gift.ability'] = gift;
      }
      if (purchasedTraits.includes('Passionate Artisan')) {
        const targets = crafting.slice((item.variant ?? 0) * 2, (item.variant ?? 0) * 2 + 2);
        selections['ancestry.revenant.orc.passionate-artisan.skills'] = targets;
        calibration.push(
          `Forge Passionate Artisan remains text only; ${targets.join(' / ')} target persistence is Salient-only proof.`,
        );
      }
      const id = `revenant-${formerSlug}-${index + 1}`;
      hero.name = `Forge counterpart ${id}`;
      selections['details.name'] = hero.name;
      result.push({ id, hero, selections, ancestry: 'Revenant', purchasedTraits, calibration });
    }
  }
  // Pinned ConfigChoice stores direct former paid features, allowing distinct repeated Previous Life purchases.
  const repeated = structuredClone(result.find(w => w.id === 'revenant-polder-1')!);
  repeated.id = 'revenant-polder-repeated-one-point';
  repeated.purchasedTraits = ['Corruption Immunity', 'Graceful Retreat', 'Reactive Tumble'];
  repeated.selections['ancestry.revenant.polder.purchased-traits'] = repeated.purchasedTraits;
  const repeatedPurchase = traitChoice(repeated.hero.ancestry!);
  repeatedPurchase.data.selected = repeated.purchasedTraits.map(name => {
    const source = traitChoice(polder).data.options.find(o => o.feature.name === name);
    if (!source || source.value !== 1)
      throw new Error('Pinned repeated Previous Life purchase missing');
    return structuredClone(source.feature);
  });
  repeated.hero.name = `Forge counterpart ${repeated.id}`;
  repeated.selections['details.name'] = repeated.hero.name;
  repeated.calibration.push(
    'Pinned ConfigChoice replaces Previous Life wrapper options with former ancestry paid features; this witness retains that direct selected-feature representation for three distinct one-point purchases.',
  );
  result.push(repeated);
  return result;
}
