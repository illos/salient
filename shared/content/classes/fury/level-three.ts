// SPDX-License-Identifier: GPL-3.0-only
/** Fury level three: pinned class/fury.md Basics and advancement table, feature/fury/level-3. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const feature = (slug: string) => path(`feature/fury/level-3/${slug}`);
const ability = (slug: string) => path(`feature/ability/fury/level-3/${slug}`);

/** 3rd-level-aspect-feature.md table. Its Stormwight row is unlinked; natures-knight.md is the entry. */
export const FURY_LEVEL_THREE_ASPECTS = [
  ['Berserker', 'Immovable Object', 'immovable-object'],
  ['Reaver', 'See Through Their Tricks', 'see-through-their-tricks'],
  ['Stormwight', "Nature's Knight", 'natures-knight'],
] as const;

export const levelThreeDecisions: Decision[] = [
  auto(
    'class.fury.level-3.stamina',
    'class.choice',
    'Fury',
    path('class/fury'),
    'Stamina Gained at 2nd and Higher Levels: 9',
  ),
  ...FURY_LEVEL_THREE_ASPECTS.map(([aspect, name, slug]): Decision => ({
    ...auto(
      `class.fury.level-3.${slug}`,
      'class.fury.aspect',
      aspect,
      feature('3rd-level-aspect-feature'),
      `${aspect} | ${name}`,
      [grant('aspect-feature', name, feature(slug))],
    ),
    dependsOn: ['class.fury.aspect'],
  })),
  choice(
    'class.fury.level-3.ability-7',
    'class.choice',
    'Fury',
    feature('7-ferocity-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 ferocity to use.',
    [
      ['Demon Unleashed', 'demon-unleashed'],
      ['Face the Storm!', 'face-the-storm'],
      ['Steelbreaker', 'steelbreaker'],
      ['You Are Already Dead', 'you-are-already-dead'],
    ].map(([name, slug]) =>
      option(name!, ability(slug!), {
        id: slug!,
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Ferocity',
      }),
    ),
    { label: 'Level 3 7-Ferocity ability' },
  ),
];
