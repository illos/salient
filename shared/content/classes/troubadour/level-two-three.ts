// SPDX-License-Identifier: GPL-3.0-only
/**
 * Troubadour levels two and three: pinned class/troubadour.md Basics and Troubadour Advancement
 * Table, feature/troubadour/level-2 and level-3. Class act ability pairs and the Second Album
 * performances are grouped in en/books/heroes/clean/Draw Steel Heroes.md (2nd-Level Auteur/Duelist/
 * Virtuoso Ability; Second Album); the unified files print the headings without the options.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';

const feature = (level: number, slug: string) => path(`feature/troubadour/level-${level}/${slug}`);
const ability = (level: number, slug: string) =>
  path(`feature/ability/troubadour/level-${level}/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replaceAll('"', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.troubadour.level-${level}.stamina`,
    'class.choice',
    'Troubadour',
    path('class/troubadour'),
    'Stamina Gained at 2nd and Higher Levels: 6',
  );
const actDependent = { dependsOn: ['class.troubadour.class-act'] };

export const TROUBADOUR_LEVEL_TWO_ACTS = [
  ['Auteur', ['Guest Star', 'Twist at the End']],
  ['Duelist', ['Classic Chandelier Stunt', 'En Garde!']],
  ['Virtuoso', ['Encore', 'Tough Crowd']],
] as const;
export const TROUBADOUR_INVOCATIONS = [
  "Allow Me to Introduce Tonight's Players",
  'Formal Introductions',
  'My Reputation Precedes Me',
] as const;

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  auto(
    'class.troubadour.level-2.appeal-to-the-muses',
    'class.choice',
    'Troubadour',
    feature(2, 'appeal-to-the-muses'),
    'Appeal to the Muses',
    [grant('class-feature', 'Appeal to the Muses', feature(2, 'appeal-to-the-muses'))],
  ),
  choice(
    'class.troubadour.level-2.invocation',
    'class.choice',
    'Troubadour',
    feature(2, 'invocation'),
    'Choose one of the following features.',
    TROUBADOUR_INVOCATIONS.map(name =>
      option(name, feature(2, slug(name)), {
        id: slug(name),
        grants: [grant('class-feature', name, feature(2, slug(name)))],
      }),
    ),
    { label: 'Level 2 invocation' },
  ),
  choice(
    'class.troubadour.level-2.perk',
    'class.choice',
    'Troubadour',
    feature(2, 'perk'),
    'You gain one interpersonal, lore, or supernatural perk of your choice.',
    CORE_PERKS.filter(perk => ['interpersonal', 'lore', 'supernatural'].includes(perk.group)).map(
      perk => option(perk.name, perk.source),
    ),
  ),
  ...TROUBADOUR_LEVEL_TWO_ACTS.map(([act, abilities]) =>
    choice(
      `class.troubadour.level-2.${act.toLowerCase()}-ability`,
      'class.troubadour.class-act',
      act,
      feature(2, '2nd-level-class-act-ability'),
      'Your troubadour class act grants your choice of one of two heroic abilities.',
      abilities.map(name =>
        option(name, ability(2, slug(name)), {
          id: slug(name),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Drama',
        }),
      ),
      { ...actDependent, label: `Level 2 ${act} ability` },
    ),
  ),
];

/** 3rd-level-class-act-feature.md table (Foil's row is unlinked; foil.md is the entry). */
export const levelThreeDecisions: Decision[] = [
  stamina(3),
  ...(
    [
      ['Auteur', 'Missed Cue', []],
      ['Duelist', 'Foil', []],
      ['Virtuoso', 'Second Album', ['"Fire Up the Night"', '"Never-Ending Hero"']],
    ] as const
  ).map(([act, name, performances]): Decision => ({
    ...auto(
      `class.troubadour.level-3.${slug(name)}`,
      'class.troubadour.class-act',
      act,
      feature(3, '3rd-level-class-act-feature'),
      `${act} | ${name}`,
      [
        grant('class-feature', name, feature(3, slug(name))),
        ...performances.map(p => grant('class-ability', p, ability(3, slug(p)))),
      ],
    ),
    ...actDependent,
  })),
  choice(
    'class.troubadour.level-3.ability-7',
    'class.choice',
    'Troubadour',
    feature(3, '7-drama-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 drama to use.',
    ['Extensive Rewrites', 'Infernal Gavotte', 'Star Solo', 'We Meet at Last'].map(name =>
      option(name, ability(3, slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Drama',
      }),
    ),
    { label: 'Level 3 7-Drama ability' },
  ),
];
