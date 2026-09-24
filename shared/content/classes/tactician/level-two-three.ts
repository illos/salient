// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tactician levels two and three: pinned class/tactician.md Basics and Tactician Advancement Table,
 * feature/tactician/level-2 and level-3. Doctrine ability pairs are grouped in
 * en/books/heroes/clean/Draw Steel Heroes.md, 2nd-Level Insurgent/Mastermind/Vanguard Ability; the
 * unified 2nd-level-doctrine-ability.md prints the headings without the options.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';

const feature = (level: number, slug: string) => path(`feature/tactician/level-${level}/${slug}`);
const ability = (level: number, slug: string) =>
  path(`feature/ability/tactician/level-${level}/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.tactician.level-${level}.stamina`,
    'class.choice',
    'Tactician',
    path('class/tactician'),
    'Stamina Gained at 2nd and Higher Levels: 9',
  );

export const TACTICIAN_LEVEL_TWO_DOCTRINES = [
  ['Insurgent', 'Infiltration Tactics', ['Fog of War', 'Try Me Instead']],
  ['Mastermind', 'Goaded', ["I've Got Your Back", 'Targets of Opportunity']],
  ['Vanguard', 'Melee Superiority', ['No Dying on My Watch', 'Squad! On Me!']],
] as const;

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  choice(
    'class.tactician.level-2.perk',
    'class.choice',
    'Tactician',
    feature(2, 'perk'),
    'You gain one exploration, interpersonal, or intrigue perk of your choice.',
    CORE_PERKS.filter(perk =>
      ['exploration', 'interpersonal', 'intrigue'].includes(perk.group),
    ).map(perk => option(perk.name, perk.source)),
  ),
  ...TACTICIAN_LEVEL_TWO_DOCTRINES.flatMap(([doctrine, name, abilities]): Decision[] => [
    {
      ...auto(
        `class.tactician.level-2.${slug(name)}`,
        'class.tactician.doctrine',
        doctrine,
        feature(2, '2nd-level-doctrine-feature'),
        `${doctrine} | ${name}`,
        [grant('class-feature', name, feature(2, slug(name)))],
      ),
      dependsOn: ['class.tactician.doctrine'],
    },
    choice(
      `class.tactician.level-2.${doctrine.toLowerCase()}-ability`,
      'class.tactician.doctrine',
      doctrine,
      feature(2, '2nd-level-doctrine-ability'),
      'Your tactical doctrine grants your choice of one of two heroic abilities.',
      abilities.map(name =>
        option(name, ability(2, slug(name)), {
          id: slug(name),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Focus',
        }),
      ),
      { dependsOn: ['class.tactician.doctrine'], label: `Level 2 ${doctrine} ability` },
    ),
  ]),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  auto(
    'class.tactician.level-3.out-of-position',
    'class.choice',
    'Tactician',
    feature(3, 'out-of-position'),
    'Out of Position',
    [grant('class-feature', 'Out of Position', feature(3, 'out-of-position'))],
  ),
  choice(
    'class.tactician.level-3.ability-7',
    'class.choice',
    'Tactician',
    feature(3, '7-focus-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 focus to use.',
    ['Frontal Assault', "Hit 'Em Hard!", 'Rout', 'Stay Strong and Focus!'].map(name =>
      option(name, ability(3, slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Focus',
      }),
    ),
    { label: 'Level 3 7-Focus ability' },
  ),
];
