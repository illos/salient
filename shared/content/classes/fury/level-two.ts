// SPDX-License-Identifier: GPL-3.0-only
/**
 * Fury level two for every primordial aspect: pinned class/fury.md Basics and advancement table,
 * feature/fury/level-2, and feature/ability/fury/level-2. Berserker keeps its V32 decision ids.
 */
import type { Decision, DecisionOption } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const source = (relative: string) => path(relative);
const feature = (slug: string) => path(`feature/fury/level-2/${slug}`);
const ability = (slug: string) => path(`feature/ability/fury/level-2/${slug}`);

/** Heroes book perk categories; the unified chapter/perks entry belongs to another book. */
export const FURY_LEVEL_TWO_PERK_GROUPS = {
  crafting: [
    'Area of Expertise',
    'Expert Artisan',
    'Handy',
    'Improvisation Creation',
    'Inspired Artisan',
    'Traveling Artisan',
  ],
  exploration: [
    'Brawny',
    'Camouflage Hunter',
    'Danger Sense',
    'Friend Catapult',
    "I've Got You!",
    'Monster Whisperer',
    'Put Your Back Into It!',
    'Team Leader',
    'Teamwork',
    'Wood Wise',
  ],
  intrigue: [
    'Criminal Contacts',
    'Forgettable Face',
    'Gum Up the Works',
    'Lucky Dog',
    'Master of Disguise',
    'Slipped Lead',
  ],
} as const;
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
/** Replaced by every source-eligible core perk in supporting-backgrounds.ts. */
const perkOptions: DecisionOption[] = Object.values(FURY_LEVEL_TWO_PERK_GROUPS)
  .flat()
  .map(value => option(value, source(`perk/${slug(value)}`), { id: slug(value) }));

/**
 * Aspect grouping: 2nd-level-aspect-feature.md table; ability pairs from
 * en/books/heroes/clean/Draw Steel Heroes.md, 2nd-Level Berserker/Reaver/Stormwight Ability
 * (the unified 2nd-level-aspect-ability.md prints the headings without the option list).
 */
export const FURY_LEVEL_TWO_ASPECTS = [
  {
    aspect: 'Berserker',
    feature: 'Unstoppable Force',
    featureSlug: 'unstoppable-force',
    abilities: ['Special Delivery', 'Wrecking Ball'],
    featureId: 'class.fury.level-2.aspect-feature',
    abilityId: 'class.fury.level-2.aspect-ability',
  },
  {
    aspect: 'Reaver',
    feature: 'Inescapable Wrath',
    featureSlug: 'inescapable-wrath',
    abilities: ['Death... Death!', 'Phalanx-Breaker'],
    featureId: 'class.fury.level-2.reaver-feature',
    abilityId: 'class.fury.level-2.reaver-ability',
  },
  {
    aspect: 'Stormwight',
    feature: 'Tooth and Claw',
    featureSlug: 'tooth-and-claw',
    abilities: ['Apex Predator', 'Visceral Roar'],
    featureId: 'class.fury.level-2.stormwight-feature',
    abilityId: 'class.fury.level-2.stormwight-ability',
  },
] as const;

const aspectDependent = { dependsOn: ['class.fury.aspect'] };

export const levelTwoDecisions: Decision[] = [
  auto(
    'class.fury.level-2.stamina',
    'class.choice',
    'Fury',
    source('class/fury'),
    'Stamina Gained at 2nd and Higher Levels: 9',
  ),
  choice(
    'class.fury.level-2.perk',
    'class.choice',
    'Fury',
    feature('perk'),
    'You gain one crafting, exploration, or intrigue perk of your choice.',
    perkOptions,
  ),
  ...FURY_LEVEL_TWO_ASPECTS.flatMap((entry): Decision[] => [
    {
      ...auto(
        entry.featureId,
        'class.fury.aspect',
        entry.aspect,
        feature('2nd-level-aspect-feature'),
        `${entry.aspect} | ${entry.feature}`,
        [grant('aspect-feature', entry.feature, feature(entry.featureSlug))],
      ),
      ...aspectDependent,
    },
    choice(
      entry.abilityId,
      'class.fury.aspect',
      entry.aspect,
      feature('2nd-level-aspect-ability'),
      'Your primordial aspect grants your choice of one of two heroic abilities.',
      entry.abilities.map(name =>
        option(name, ability(slug(name)), {
          id: slug(name),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Ferocity',
        }),
      ),
      {
        ...aspectDependent,
        label: `Level 2 ${entry.aspect} ability`,
        note: `The ${entry.aspect} option grouping is in en/books/heroes/clean/Draw Steel Heroes.md, 2nd-Level ${entry.aspect} Ability.`,
      },
    ),
  ]),
];
