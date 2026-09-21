// SPDX-License-Identifier: GPL-3.0-only
/** Shadow advancement table, Basics, and the two level-three features in the pinned Compendium. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
const feature = (slug: string) => path(`feature/shadow/level-3/${slug}`);
const ability = (slug: string) => path(`feature/ability/shadow/level-3/${slug}`);
export const levelThreeDecisions: Decision[] = [
  auto(
    'class.shadow.level-3.stamina',
    'class.choice',
    'Shadow',
    path('class/shadow'),
    'Stamina Gained at 2nd and Higher Levels: 6',
    [grant('statistic', 'Stamina +6', path('class/shadow'))],
  ),
  auto(
    'class.shadow.level-3.careful-observation',
    'class.choice',
    'Shadow',
    feature('careful-observation'),
    'You have the following ability.',
    [
      grant('class-feature', 'Careful Observation', feature('careful-observation')),
      grant('class-ability', 'Careful Observation', ability('careful-observation')),
    ],
  ),
  choice(
    'class.shadow.level-3.ability-7',
    'class.choice',
    'Shadow',
    feature('7-insight-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 insight to use.',
    ['Dancer', 'Misdirecting Strike', 'Pinning Shot', 'Staggering Blow'].map(name =>
      option(name, ability(name.toLowerCase().replaceAll(' ', '-')), {
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Insight',
      }),
    ),
    { label: 'Level 3 7-Insight ability' },
  ),
];
