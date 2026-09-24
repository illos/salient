// SPDX-License-Identifier: GPL-3.0-only
/**
 * Null levels two and three: pinned class/null.md Basics and Null Advancement Table,
 * feature/null/level-2 and level-3. Tradition ability pairs are grouped in
 * en/books/heroes/clean/Draw Steel Heroes.md, 2nd-Level Chronokinetic/Cryokinetic/Metakinetic Ability;
 * the unified 2nd-level-tradition-ability.md prints the headings without the options.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';

const feature = (level: number, slug: string) => path(`feature/null/level-${level}/${slug}`);
const ability = (level: number, slug: string) =>
  path(`feature/ability/null/level-${level}/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.null.level-${level}.stamina`,
    'class.choice',
    'Null',
    path('class/null'),
    'Stamina Gained at 2nd and Higher Levels: 9',
  );
const traditionDependent = { dependsOn: ['class.null.tradition'] };

export const NULL_LEVEL_TWO_TRADITIONS = [
  ['Chronokinetic', 'Rapid Processing', ['Blur', 'Force Redirected']],
  ['Cryokinetic', 'Entropic Adaptability', ['Entropic Field', 'Heat Sink']],
  ['Metakinetic', 'Inertial Sink', ['Gravitic Strike', 'Kinetic Shield']],
] as const;

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  choice(
    'class.null.level-2.perk',
    'class.choice',
    'Null',
    feature(2, 'perk'),
    'You gain one exploration, interpersonal, or intrigue perk of your choice.',
    CORE_PERKS.filter(perk =>
      ['exploration', 'interpersonal', 'intrigue'].includes(perk.group),
    ).map(perk => option(perk.name, perk.source)),
  ),
  ...NULL_LEVEL_TWO_TRADITIONS.flatMap(([tradition, name, abilities]): Decision[] => [
    {
      ...auto(
        `class.null.level-2.${slug(name)}`,
        'class.null.tradition',
        tradition,
        feature(2, '2nd-level-tradition-feature'),
        `${tradition} | ${name}`,
        [grant('class-feature', name, feature(2, slug(name)))],
      ),
      ...traditionDependent,
    },
    choice(
      `class.null.level-2.${tradition.toLowerCase()}-ability`,
      'class.null.tradition',
      tradition,
      feature(2, '2nd-level-tradition-ability'),
      'Your null tradition grants your choice of one of two abilities.',
      abilities.map(name =>
        option(name, ability(2, slug(name)), {
          id: slug(name),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Discipline',
        }),
      ),
      { ...traditionDependent, label: `Level 2 ${tradition} ability` },
    ),
  ]),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  auto(
    'class.null.level-3.features',
    'class.choice',
    'Null',
    path('class/null'),
    'Null Advancement Table',
    [
      grant('class-feature', 'Psionic Leap', feature(3, 'psionic-leap')),
      grant('class-feature', 'Reorder', feature(3, 'reorder')),
    ],
  ),
  choice(
    'class.null.level-3.ability-7',
    'class.choice',
    'Null',
    feature(3, '7-discipline-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 discipline to use.',
    ['Absorption Field', 'Molecular Rearrangement Field', 'Stabilizing Field', 'Synapse Field'].map(
      name =>
        option(name, ability(3, slug(name)), {
          id: slug(name),
          abilityKind: 'heroic',
          costQuote: 'cost: 7 Discipline',
        }),
    ),
    { label: 'Level 3 7-Discipline ability' },
  ),
];
