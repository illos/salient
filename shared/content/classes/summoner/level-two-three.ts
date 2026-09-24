// SPDX-License-Identifier: GPL-3.0-only
/**
 * Summoner levels two and three: pinned class/summoner.md Basics and Summoner Advancement table,
 * feature/summoner/level-2 and level-3, feature/ability/summoner/level-3. Fixtures are the
 * monster/fixture/<family>/featureblock stat blocks; the family is the circle's portfolio from the
 * Summoner Circle Portfolio table (feature/summoner/level-1/portfolio.md). See V138 scope.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';
import { SUMMONER_CIRCLES } from './level-one.ts';
import { SUMMONER_MINIONS } from './minions.ts';

const base = path('class/summoner');
const feature = (level: number, slug: string) => path(`feature/summoner/level-${level}/${slug}`);
const ability = (slug: string) => path(`feature/ability/summoner/level-3/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.summoner.level-${level}.stamina`,
    'class.choice',
    'Summoner',
    base,
    'Stamina Gained at 2nd and Higher Levels: 6',
  );
const circleDependent = { dependsOn: ['class.summoner.circle'] };

/** Summoner's Dominion fixtures by circle; Stamina is "20 + your level" in each featureblock. */
export const SUMMONER_FIXTURES = [
  {
    circle: 'Blight',
    name: 'The Boil',
    sourcePath: path('monster/fixture/demon/featureblock/the-boil'),
    size: '2',
    traits: ['Hunger Thrush', 'Oh, It Pops'],
  },
  {
    circle: 'Graves',
    name: 'Barrow Gates',
    sourcePath: path('monster/fixture/undead/featureblock/barrow-gates'),
    size: '2',
    traits: ['The Bell Tolls', 'Undead Dominion'],
  },
  {
    circle: 'Spring',
    name: 'Glade Pond',
    sourcePath: path('monster/fixture/fey/featureblock/glade-pond'),
    size: '2',
    traits: ['Bubbling Boost', 'Overgrowth'],
  },
  {
    circle: 'Storms',
    name: 'Primordial Crystal',
    sourcePath: path('monster/fixture/elemental/featureblock/primordial-crystal'),
    size: '2',
    traits: ['Magnetic Pull', 'Elemental Boost'],
  },
] as const;

export const SUMMONER_WARDS = ['Conjured Ward', 'Emergency Ward', 'Howling Ward', 'Snare Ward'];
export const SUMMONER_SEVEN_ESSENCE = [
  'Blitz Tactics',
  'Cavalry Call',
  'Essence Funnel',
  'Lead By Example',
];

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  choice(
    'class.summoner.level-2.perk',
    'class.choice',
    'Summoner',
    feature(2, 'perk'),
    'You gain an intrigue, lore, or supernatural perk of your choice.',
    CORE_PERKS.filter(perk => ['intrigue', 'lore', 'supernatural'].includes(perk.group)).map(perk =>
      option(perk.name, perk.source),
    ),
  ),
  auto(
    'class.summoner.level-2.features',
    'class.choice',
    'Summoner',
    base,
    'Summoner Advancement',
    [
      grant('class-feature', "Summoner's Dominion", feature(2, 'summoners-dominion')),
      grant('class-feature', 'New Portfolio Minion', feature(2, 'new-portfolio-minion')),
    ],
  ),
  ...SUMMONER_FIXTURES.map((fixture): Decision => ({
    ...auto(
      `class.summoner.level-2.dominion.${fixture.circle.toLowerCase()}`,
      'class.summoner.circle',
      fixture.circle,
      feature(2, 'summoners-dominion'),
      "Your circle allows you to call forth a piece of your portfolio's dominion like any minion.",
      [grant('class-feature', fixture.name, fixture.sourcePath)],
    ),
    ...circleDependent,
  })),
  // Advancement row "1, 1, 3, 3, 5": one 5-essence minion from the circle's portfolio.
  ...SUMMONER_CIRCLES.map(([circle]) =>
    choice(
      `class.summoner.portfolio.${circle.toLowerCase()}.5`,
      'class.summoner.circle',
      circle,
      feature(2, 'new-portfolio-minion'),
      'Your circle allows you to select new minions to add to your portfolio.',
      SUMMONER_MINIONS.filter(m => m.circle === circle && m.cost === 5).map(m =>
        option(m.name, m.sourcePath, {
          grants: [grant('class-feature', m.name, m.sourcePath)],
        }),
      ),
      { ...circleDependent, label: `Level 2 ${circle} 5-essence minion` },
    ),
  ),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  auto(
    'class.summoner.level-3.features',
    'class.choice',
    'Summoner',
    base,
    'Summoner Advancement',
    [grant('class-feature', "Summoner's Kit", feature(3, 'summoners-kit'))],
  ),
  choice(
    'class.summoner.level-3.ward',
    'class.choice',
    'Summoner',
    feature(3, 'summoners-kit'),
    'Choose one of the following wards.',
    SUMMONER_WARDS.map(name =>
      option(name, feature(3, slug(name)), {
        grants: [grant('class-feature', name, feature(3, slug(name)))],
      }),
    ),
    { label: 'Level 3 ward' },
  ),
  choice(
    'class.summoner.level-3.ability-7',
    'class.choice',
    'Summoner',
    feature(3, '7-essence-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 essence to use.',
    SUMMONER_SEVEN_ESSENCE.map(name =>
      option(name, ability(slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Essence',
      }),
    ),
    { label: 'Level 3 7-Essence ability' },
  ),
];
