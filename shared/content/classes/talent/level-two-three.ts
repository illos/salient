// SPDX-License-Identifier: GPL-3.0-only
/**
 * Talent levels two and three: pinned class/talent.md Basics and Talent Advancement Table,
 * feature/talent/level-2 and level-3. Tradition ability pairs are grouped in
 * en/books/heroes/clean/Draw Steel Heroes.md, 2nd-Level Chronopathy/Telekinesis/Telepathy Ability;
 * the unified 2nd-level-tradition-ability.md prints the headings without the options.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';

const feature = (level: number, slug: string) => path(`feature/talent/level-${level}/${slug}`);
const ability = (level: number, slug: string) =>
  path(`feature/ability/talent/level-${level}/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.talent.level-${level}.stamina`,
    'class.choice',
    'Talent',
    path('class/talent'),
    'Stamina Gained at 2nd and Higher Levels: 6',
  );
const traditionDependent = { dependsOn: ['class.talent.tradition'] };

export const TALENT_LEVEL_TWO_TRADITIONS = [
  ['Chronopathy', 'Ease the Hours', ['Applied Chronometrics', 'Slow']],
  ['Telekinesis', 'Ease Their Fall', ['Gravitic Burst', 'Levity and Gravity']],
  ['Telepathy', 'Ease the Mind', ['Overwhelm', 'Synaptic Override']],
] as const;

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  choice(
    'class.talent.level-2.perk',
    'class.choice',
    'Talent',
    feature(2, 'perk'),
    'You gain one interpersonal, lore, or supernatural perk of your choice.',
    CORE_PERKS.filter(perk => ['interpersonal', 'lore', 'supernatural'].includes(perk.group)).map(
      perk => option(perk.name, perk.source),
    ),
  ),
  ...TALENT_LEVEL_TWO_TRADITIONS.flatMap(([tradition, name, abilities]): Decision[] => [
    {
      ...auto(
        `class.talent.level-2.${slug(name)}`,
        'class.talent.tradition',
        tradition,
        feature(2, '2nd-level-tradition-feature'),
        `${tradition} | ${name}`,
        [grant('class-feature', name, feature(2, slug(name)))],
      ),
      ...traditionDependent,
    },
    choice(
      `class.talent.level-2.${tradition.toLowerCase()}-ability`,
      'class.talent.tradition',
      tradition,
      feature(2, '2nd-level-tradition-ability'),
      'Your talent tradition grants your choice of one of two heroic abilities.',
      abilities.map(abilityName =>
        option(abilityName, ability(2, slug(abilityName)), {
          id: slug(abilityName),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Clarity',
        }),
      ),
      { ...traditionDependent, label: `Level 2 ${tradition} ability` },
    ),
  ]),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  auto('class.talent.level-3.scan', 'class.choice', 'Talent', feature(3, 'scan'), 'Scan', [
    grant('class-feature', 'Scan', feature(3, 'scan')),
  ]),
  choice(
    'class.talent.level-3.ability-7',
    'class.choice',
    'Talent',
    feature(3, '7-clarity-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 clarity to use.',
    ['Fling Through Time', 'Force Orbs', 'Reflector Field', 'Soul Burn'].map(name =>
      option(name, ability(3, slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Clarity',
      }),
    ),
    { label: 'Level 3 7-Clarity ability' },
  ),
];
