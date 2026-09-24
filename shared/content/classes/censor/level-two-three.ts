// SPDX-License-Identifier: GPL-3.0-only
/**
 * Censor levels two and three: pinned class/censor.md Basics and Censor Advancement Table,
 * feature/censor/level-2 and level-3. Order ability pairs are grouped in
 * en/books/heroes/clean/Draw Steel Heroes.md, 2nd-Level Exorcist/Oracle/Paragon Ability; the
 * unified 2nd-level-order-ability.md prints the headings without the options.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';

const feature = (level: number, slug: string) => path(`feature/censor/level-${level}/${slug}`);
const ability = (level: number, slug: string) =>
  path(`feature/ability/censor/level-${level}/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.censor.level-${level}.stamina`,
    'class.choice',
    'Censor',
    path('class/censor'),
    'Stamina Gained at 2nd and Higher Levels: 9',
  );

/** 2nd-level-order-features.md: each order grants two features. */
export const CENSOR_LEVEL_TWO_ORDERS = [
  ['Exorcist', ["Saint's Vigilance", 'A Sense for Truth'], ['It Is Justice You Fear', 'Revelator']],
  ['Oracle', ['It Was Foretold', 'Judge of Character'], ['Prescient Grace', 'With My Blessing']],
  ['Paragon', ['Lead by Example', 'Stalwart Icon'], ['Blessing of the Faithful', 'Sentenced']],
] as const;

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  choice(
    'class.censor.level-2.perk',
    'class.choice',
    'Censor',
    feature(2, 'perk'),
    'You gain one interpersonal, lore, or supernatural perk of your choice.',
    CORE_PERKS.filter(perk => ['interpersonal', 'lore', 'supernatural'].includes(perk.group)).map(
      perk => option(perk.name, perk.source),
    ),
  ),
  ...CENSOR_LEVEL_TWO_ORDERS.flatMap(([order, features, abilities]): Decision[] => [
    {
      ...auto(
        `class.censor.level-2.${order.toLowerCase()}-features`,
        'class.censor.order',
        order,
        feature(2, '2nd-level-order-features'),
        `${order} | ${features.join(', ')}`,
        features.map(name => grant('class-feature', name, feature(2, slug(name)))),
      ),
      dependsOn: ['class.censor.order'],
    },
    choice(
      `class.censor.level-2.${order.toLowerCase()}-ability`,
      'class.censor.order',
      order,
      feature(2, '2nd-level-order-ability'),
      'Your censor order grants your choice of one of two heroic abilities.',
      abilities.map(name =>
        option(name, ability(2, slug(name)), {
          id: slug(name),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Wrath',
        }),
      ),
      { dependsOn: ['class.censor.order'], label: `Level 2 ${order} ability` },
    ),
  ]),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  auto(
    'class.censor.level-3.look-on-my-work-and-despair',
    'class.choice',
    'Censor',
    feature(3, 'look-on-my-work-and-despair'),
    'Look On My Work and Despair',
    [
      grant(
        'class-feature',
        'Look On My Work and Despair',
        feature(3, 'look-on-my-work-and-despair'),
      ),
    ],
  ),
  choice(
    'class.censor.level-3.ability-7',
    'class.choice',
    'Censor',
    feature(3, '7-wrath-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 wrath to use.',
    [
      'Edict of Disruptive Isolation',
      'Edict of Perfect Order',
      'Edict of Purifying Pacifism',
      'Edict of Stillness',
    ].map(name =>
      option(name, ability(3, slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Wrath',
      }),
    ),
    { label: 'Level 3 7-Wrath ability' },
  ),
];
