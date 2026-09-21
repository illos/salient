// SPDX-License-Identifier: GPL-3.0-only
/** Shadow level two: pinned class Basics and feature/shadow/level-2. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';

const feature = (slug: string) => path(`feature/shadow/level-2/${slug}`);
const colleges = [
  ['Black Ash', 'Burning Ash', 'burning-ash', ['In a Puff of Ash', 'Too Slow']],
  ['Caustic Alchemy', 'Trained Assassin', 'trained-assassin', ['Sticky Bomb', 'Stink Bomb']],
  ['Harlequin Mask', 'Friend!', 'friend', ['Machinations of Sound', 'So Gullible']],
] as const;
export const levelTwoDecisions: Decision[] = [
  auto(
    'class.shadow.level-2.stamina',
    'class.choice',
    'Shadow',
    path('class/shadow'),
    'Stamina Gained at 2nd and Higher Levels: 6',
    [grant('statistic', 'Stamina +6', path('class/shadow'))],
  ),
  choice(
    'class.shadow.level-2.perk',
    'class.choice',
    'Shadow',
    feature('perk'),
    'You gain one exploration, interpersonal, or intrigue perk of your choice.',
    CORE_PERKS.filter(perk =>
      ['exploration', 'interpersonal', 'intrigue'].includes(perk.group),
    ).map(perk => option(perk.name, perk.source)),
  ),
  ...colleges
    .flatMap(([college, name, slug, abilities]): Decision[] => [
      auto(
        `class.shadow.level-2.${slug}`,
        'class.shadow.college',
        college,
        feature('2nd-level-college-feature'),
        'Your shadow college grants you a feature, as shown on the 2nd-Level College Features table.',
        [grant('class-feature', name, feature(slug))],
      ),
      choice(
        `class.shadow.level-2.${slug}-ability`,
        'class.shadow.college',
        college,
        feature('2nd-level-college-ability'),
        'Your shadow college grants your choice of one of two heroic abilities.',
        abilities.map(name =>
          option(
            name,
            path(`feature/ability/shadow/level-2/${name.toLowerCase().replaceAll(' ', '-')}`),
            { abilityKind: 'heroic', costQuote: 'cost: 5 Insight' },
          ),
        ),
        { label: `Level 2 ${college} ability`, dependsOn: ['class.shadow.college'] },
      ),
    ])
    .map(decision => ({
      ...decision,
      conditions: [{ decision: 'class.choice', value: 'Shadow' }],
    })),
];
