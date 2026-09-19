// SPDX-License-Identifier: GPL-3.0-only
/** Level-one Devil content; stable R01 decision IDs and source wording (V46 completes it). */
import type { Decision } from '../../../evaluate/definitions.ts';

export const levelOneDecisions = [
  {
    id: 'ancestry.devil.base-statistics',
    kind: 'automatic',
    availableWhen: {
      decision: 'ancestry.choice',
      value: 'Devil',
    },
    shape: {
      type: 'none',
    },
    source: 'en/books/heroes/clean/Draw Steel Heroes.md',
    quote:
      'Unless otherwise noted, a character of any of these ancestries is size 1M and has speed 5 and stability 0.',
    grants: [
      {
        kind: 'statistic',
        value: 'size 1M, speed 5, stability 0 (derived in R02)',
      },
    ],
    note:
      'The same sentence is in the unified tree at en/unified/md/rule/character/speed.md, which is' +
      ' the path the evaluator cites for this contribution; it is absent only from' +
      ' en/unified/md/chapter/ancestries.md. Corrected in V46 after a rules review found the' +
      ' earlier note claimed it existed only in the clean Heroes text.',
  },
  {
    id: 'ancestry.devil.signature-trait',
    kind: 'automatic',
    availableWhen: {
      decision: 'ancestry.choice',
      value: 'Devil',
    },
    shape: {
      type: 'none',
    },
    source: 'en/unified/md/chapter/ancestries.md',
    quote:
      'Each ancestry has one or more signature traits, which your hero gets for free if they take that ancestry.',
    grants: [
      {
        kind: 'trait',
        value: 'Silver Tongue',
        source: 'en/unified/md/feature/trait/devil/silver-tongue.md',
      },
    ],
  },
  {
    id: 'ancestry.devil.silver-tongue-skill',
    kind: 'choice',
    dependsOn: ['ancestry.devil.signature-trait'],
    shape: {
      type: 'single',
      count: 1,
    },
    source: 'en/unified/md/feature/trait/devil/silver-tongue.md',
    quote: 'You have one skill of your choice from the interpersonal skill group',
    optionsFrom: 'pool.skills.interpersonal',
    // V46: the complete interpersonal group. The pool, not this list, defines eligibility.
    supportedInV001: [
      'Brag',
      'Empathize',
      'Flirt',
      'Gamble',
      'Handle Animals',
      'Interrogate',
      'Intimidate',
      'Lead',
      'Lie',
      'Music',
      'Perform',
      'Persuade',
      'Read Person',
    ],
    questions: [],
  },
  {
    id: 'ancestry.devil.purchased-traits',
    kind: 'choice',
    availableWhen: {
      decision: 'ancestry.choice',
      value: 'Devil',
    },
    shape: {
      type: 'points',
      budget: 3,
      costField: 'cost',
    },
    source: 'en/unified/md/feature/trait/devil/devil-traits.md',
    quote: 'You have 3 ancestry points to spend on the following traits.',
    budgetRule: {
      source: 'en/unified/md/chapter/ancestries.md',
      quote:
        "But they couldn't select both Impressive Horns and Wings, since their combined cost of 4 exceeds the ancestry points budget for the devil.",
    },
    options: [
      {
        id: 'trait.devil.barbed-tail',
        value: 'Barbed Tail',
        cost: 1,
        source: 'en/unified/md/feature/trait/devil/barbed-tail.md',
        costQuote: 'cost: 1 Point',
        supportedInV001: true,
      },
      {
        id: 'trait.devil.beast-legs',
        value: 'Beast Legs',
        cost: 1,
        source: 'en/unified/md/feature/trait/devil/beast-legs.md',
        costQuote: 'cost: 1 Point',
        supportedInV001: true,
      },
      {
        id: 'trait.devil.glowing-eyes',
        value: 'Glowing Eyes',
        cost: 1,
        source: 'en/unified/md/feature/trait/devil/glowing-eyes.md',
        costQuote: 'cost: 1 Point',
        supportedInV001: true,
        grants: [
          {
            kind: 'ancestry-ability',
            value: 'Glowing Eyes',
            source: 'en/unified/md/feature/trait/devil/glowing-eyes.md',
            quote:
              'Whenever you take damage from a creature, you can use a triggered action to deal that creature psychic damage equal to 1d10 + your level.',
            note: 'Readable grant only: the trigger, the roll and the damage are resolved manually.',
          },
        ],
      },
      {
        id: 'trait.devil.hellsight',
        value: 'Hellsight',
        cost: 1,
        source: 'en/unified/md/feature/trait/devil/hellsight.md',
        costQuote: 'cost: 1 Point',
        supportedInV001: true,
      },
      {
        id: 'trait.devil.impressive-horns',
        value: 'Impressive Horns',
        cost: 2,
        source: 'en/unified/md/feature/trait/devil/impressive-horns.md',
        costQuote: 'cost: 2 Points',
        supportedInV001: true,
      },
      {
        id: 'trait.devil.prehensile-tail',
        value: 'Prehensile Tail',
        cost: 2,
        source: 'en/unified/md/feature/trait/devil/prehensile-tail.md',
        costQuote: 'cost: 2 Points',
        supportedInV001: true,
      },
      {
        id: 'trait.devil.wings',
        value: 'Wings',
        cost: 2,
        source: 'en/unified/md/feature/trait/devil/wings.md',
        costQuote: 'cost: 2 Points',
        supportedInV001: true,
      },
    ],
    questions: [],
  },
] as Decision[];
