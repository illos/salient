// SPDX-License-Identifier: GPL-3.0-only
/**
 * Elementalist levels two and three: pinned class/elementalist.md Basics and Elementalist Advancement
 * Table, feature/elementalist/level-2 and level-3. The new 5-Essence and 7-Essence option lists are
 * printed in en/books/heroes/clean/Draw Steel Heroes.md (New 5-Essence Ability; 7-Essence Ability).
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';
import { ELEMENTALIST_CHOICES } from './level-one.ts';

const feature = (level: number, slug: string) =>
  path(`feature/elementalist/level-${level}/${slug}`);
const ability = (level: number, slug: string) =>
  path(`feature/ability/elementalist/level-${level}/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.elementalist.level-${level}.stamina`,
    'class.choice',
    'Elementalist',
    path('class/elementalist'),
    'Stamina Gained at 2nd and Higher Levels: 6',
  );
const specializationDependent = { dependsOn: ['class.elementalist.specialization'] };

/** 2nd- and 3rd-level specialization feature tables; ability grants where the feature says so. */
export const ELEMENTALIST_SPECIALIZATION_FEATURES = {
  2: [
    ['Earth', 'Disciple of Earth', false],
    ['Fire', 'Disciple of Fire', false],
    ['Green', 'Disciple of the Green', false],
    ['Void', 'There Is No Space Between', true],
  ],
  3: [
    ['Earth', 'Earth Accepts Me', true],
    ['Fire', 'A Conversation With Fire', false],
    ['Green', 'Remember Growth and Sun and Rain', true],
    ['Void', 'Distance Is Only Memory', false],
  ],
} as const;

const specializationFeatures = (level: 2 | 3): Decision[] =>
  ELEMENTALIST_SPECIALIZATION_FEATURES[level].map(([specialization, name, grantsAbility]) => ({
    ...auto(
      `class.elementalist.level-${level}.${slug(name)}`,
      'class.elementalist.specialization',
      specialization,
      feature(level, `${level === 2 ? '2nd' : '3rd'}-level-specialization-feature`),
      `${specialization} | ${name}`,
      [
        grant('class-feature', name, feature(level, slug(name))),
        ...(grantsAbility ? [grant('class-ability', name, ability(level, slug(name)))] : []),
      ],
    ),
    ...specializationDependent,
  }));

const LEVEL_ONE_FIVE = ELEMENTALIST_CHOICES.filter(([, cost]) => cost === 5).map(([name]) => name);

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  choice(
    'class.elementalist.level-2.perk',
    'class.choice',
    'Elementalist',
    feature(2, 'perk'),
    'You gain one crafting, lore, or supernatural perk of your choice.',
    CORE_PERKS.filter(perk => ['crafting', 'lore', 'supernatural'].includes(perk.group)).map(perk =>
      option(perk.name, perk.source),
    ),
  ),
  ...specializationFeatures(2),
  choice(
    'class.elementalist.level-2.ability-5',
    'class.choice',
    'Elementalist',
    feature(2, 'new-5-essence-ability'),
    "Choose one heroic ability from the following options, each of which costs 5 essence to use. Alternatively, you can choose one of the 5-essence abilities you didn't select at 1st level",
    [
      ...[
        'O Flower Aid, O Earth Defend',
        'Subvert the Green Within',
        'Translated Through Flame',
        "Volcano's Embrace",
      ].map(name =>
        option(name, ability(2, slug(name)), {
          id: slug(name),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Essence',
        }),
      ),
      ...LEVEL_ONE_FIVE.map(name =>
        option(name, path(`feature/ability/elementalist/level-1/${slug(name)}`), {
          id: slug(name),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Essence',
          excludedWhen: [{ decision: 'class.elementalist.ability-5', value: name }],
          unavailableReason: 'Already selected as your 1st-level 5-essence ability.',
        }),
      ),
    ],
    { label: 'Level 2 new 5-Essence ability' },
  ),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  ...specializationFeatures(3),
  choice(
    'class.elementalist.level-3.ability-7',
    'class.choice',
    'Elementalist',
    feature(3, '7-essence-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 essence to use.',
    ['Erase', 'Maw of Earth', 'Swarm of Spirits', 'Wall of Fire'].map(name =>
      option(name, ability(3, slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Essence',
      }),
    ),
    { label: 'Level 3 7-Essence ability' },
  ),
];
