// SPDX-License-Identifier: GPL-3.0-only
/** Existing V32 level-two Berserker content; other aspects remain unsupported. */
import type { Decision, DecisionOption } from '../../../evaluate/definitions.ts';

const source = (path: string) => `en/unified/md/${path}.md`;
const feature = (slug: string) => source(`feature/fury/level-2/${slug}`);
const aspectParent = {
  availableWhen: { decision: 'class.fury.aspect', value: 'Berserker' },
  // Also check availability of the aspect itself: stale Fury selections on another class grant nothing.
  dependsOn: ['class.fury.aspect'],
};

/** Heroes book perk categories; the unified chapter/perks entry belongs to another book. */
export const FURY_LEVEL_TWO_PERK_GROUPS = {
  crafting: [
    'Area of Expertise',
    'Expert Artisan',
    'Handy',
    'Improvisation Creation',
    'Inspired Artisan',
    'Traveling Artisan',
  ],
  exploration: [
    'Brawny',
    'Camouflage Hunter',
    'Danger Sense',
    'Friend Catapult',
    "I've Got You!",
    'Monster Whisperer',
    'Put Your Back Into It!',
    'Team Leader',
    'Teamwork',
    'Wood Wise',
  ],
  intrigue: [
    'Criminal Contacts',
    'Forgettable Face',
    'Gum Up the Works',
    'Lucky Dog',
    'Master of Disguise',
    'Slipped Lead',
  ],
} as const;
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
const perkOptions: DecisionOption[] = Object.values(FURY_LEVEL_TWO_PERK_GROUPS)
  .flat()
  .map(value => ({
    id: slug(value),
    value,
    source: source(`perk/${slug(value)}`),
    supportedInV001: value === 'Danger Sense',
  }));

export const levelTwoDecisions: Decision[] = [
  {
    id: 'class.fury.level-2.stamina',
    kind: 'automatic',
    shape: { type: 'none' },
    ...aspectParent,
    source: source('class/fury'),
    quote: 'Stamina Gained at 2nd and Higher Levels: 9',
  },
  {
    id: 'class.fury.level-2.perk',
    kind: 'choice',
    shape: { type: 'single', count: 1 },
    ...aspectParent,
    source: feature('perk'),
    quote: 'You gain one crafting, exploration, or intrigue perk of your choice.',
    options: perkOptions,
    note: 'V32 supports Danger Sense. Other core options are readable source alternatives; their build choices and gameplay require later coverage.',
  },
  {
    id: 'class.fury.level-2.aspect-feature',
    kind: 'automatic',
    shape: { type: 'none' },
    ...aspectParent,
    source: feature('2nd-level-aspect-feature'),
    quote: 'Berserker | Unstoppable Force',
    grants: [
      { kind: 'aspect-feature', value: 'Unstoppable Force', source: feature('unstoppable-force') },
    ],
  },
  {
    id: 'class.fury.level-2.aspect-ability',
    kind: 'choice',
    shape: { type: 'single', count: 1 },
    ...aspectParent,
    source: feature('2nd-level-aspect-ability'),
    quote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    options: ['Special Delivery', 'Wrecking Ball'].map(value => ({
      id: slug(value),
      value,
      source: source(`feature/ability/fury/level-2/${slug(value)}`),
      supportedInV001: true,
      abilityKind: 'heroic',
      costQuote: 'cost: 5 Ferocity',
    })),
    note: 'The Berserker option grouping is in en/books/heroes/clean/Draw Steel Heroes.md, 2nd-Level Berserker Ability. Both options are maneuvers without Strike.',
  },
];
