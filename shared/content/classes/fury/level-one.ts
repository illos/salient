// SPDX-License-Identifier: GPL-3.0-only
/** Existing level-one Fury content; stable R01 decision IDs and source wording. */
import type { Decision, ClassProfile } from '../../../evaluate/definitions.ts';
import { SENTENCES } from '../../../evaluate/sources.ts';
import { path } from '../../decision-builders.ts';

export const levelOneDecisions = [
  {
    id: 'class.fury.fixed-characteristics',
    kind: 'automatic',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'none',
    },
    source: 'en/unified/md/class/fury.md',
    quote: 'You start with a Might of 2 and an Agility of 2',
    grants: [
      {
        kind: 'characteristic',
        value: 'Might 2',
      },
      {
        kind: 'characteristic',
        value: 'Agility 2',
      },
    ],
  },
  {
    id: 'class.fury.characteristic-array',
    kind: 'choice',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'single',
      count: 1,
    },
    source: 'en/unified/md/class/fury.md',
    quote: 'you can choose one of the following arrays for your other characteristic scores:',
    options: [
      {
        id: 'class.fury.array.2-m1-m1',
        value: '2, −1, −1',
        supportedInV001: true,
      },
      {
        id: 'class.fury.array.1-1-m1',
        value: '1, 1, −1',
        supportedInV001: true,
      },
      {
        id: 'class.fury.array.1-0-0',
        value: '1, 0, 0',
        supportedInV001: true,
      },
    ],
  },
  {
    id: 'class.fury.array-assignment',
    kind: 'choice',
    dependsOn: ['class.fury.characteristic-array'],
    shape: {
      type: 'assignment',
      targets: ['Reason', 'Intuition', 'Presence'],
    },
    source: 'en/unified/md/class/fury.md',
    quote: 'for your other characteristic scores',
    questions: [],
    note: 'Q-R-101 resolved: any ordering of the chosen source array; fixed Might and Agility remain locked, new assignable slots start blank.',
  },
  {
    id: 'class.fury.baseline',
    kind: 'automatic',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'none',
    },
    source: 'en/unified/md/class/fury.md',
    quote: 'Starting Stamina at 1st Level: 21',
    grants: [
      {
        kind: 'statistic',
        value: 'Starting Stamina at 1st Level: 21',
        note: 'derived in R02',
      },
      {
        kind: 'statistic',
        value: 'Recoveries: 10',
        note: 'derived in R02',
      },
      {
        kind: 'potency',
        value: 'Weak Potency: Might − 2; Average Potency: Might − 1; Strong Potency: Might',
        note: 'R02/R04',
      },
    ],
  },
  {
    id: 'class.fury.skill.nature',
    kind: 'automatic',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'none',
    },
    source: 'en/unified/md/class/fury.md',
    quote: 'You gain the Nature skill',
    grants: [
      {
        kind: 'skill',
        value: 'Nature',
      },
    ],
    questions: [],
  },
  {
    id: 'class.fury.skills',
    kind: 'choice',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'multi',
      count: 2,
    },
    source: 'en/unified/md/class/fury.md',
    quote: 'Then choose any two skills from the exploration or intrigue skill groups.',
    optionsFrom: ['pool.skills.exploration', 'pool.skills.intrigue'],
    supportedInV001: ['Jump', 'Climb'],
    questions: [],
  },
  {
    id: 'class.fury.features',
    kind: 'automatic',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'none',
    },
    source: 'en/unified/md/class/fury.md',
    quote:
      'Primordial Aspect, Ferocity, Growing Ferocity, Aspect Features, Aspect Triggered Action, Mighty Leaps, Fury Abilities',
    grants: [
      {
        kind: 'feature',
        value: 'Ferocity',
        source: 'en/unified/md/feature/fury/level-1/ferocity.md',
      },
      {
        kind: 'feature',
        value: 'Growing Ferocity',
        source: 'en/unified/md/feature/fury/level-1/growing-ferocity.md',
      },
      {
        kind: 'feature',
        value: 'Mighty Leaps',
        source: 'en/unified/md/feature/fury/level-1/mighty-leaps.md',
      },
    ],
  },
  {
    id: 'class.fury.aspect',
    kind: 'choice',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'single',
      count: 1,
    },
    source: 'en/unified/md/feature/fury/level-1/primordial-aspect.md',
    quote:
      'You choose a primordial aspect from the following options, each of which grants you a skill.',
    options: [
      {
        id: 'class.fury.aspect.berserker',
        value: 'Berserker',
        supportedInV001: true,
        grants: [
          {
            kind: 'skill',
            value: 'Lift',
            source: 'en/unified/md/feature/fury/level-1/primordial-aspect.md',
            quote: 'You have the Lift skill.',
          },
          {
            kind: 'feature',
            value: 'Kit',
            source: 'en/unified/md/feature/fury/level-1/1st-level-aspect-features.md',
          },
          {
            kind: 'feature',
            value: 'Primordial Strength',
            source: 'en/unified/md/feature/fury/level-1/primordial-strength.md',
          },
          {
            kind: 'ability',
            value: 'Lines of Force',
            source: 'en/unified/md/feature/ability/fury/level-1/lines-of-force.md',
          },
        ],
      },
      {
        id: 'class.fury.aspect.reaver',
        value: 'Reaver',
        supportedInV001: false,
        grants: [
          {
            kind: 'skill',
            value: 'Hide',
            source: 'en/unified/md/feature/fury/level-1/primordial-aspect.md',
            quote: 'You have the Hide skill.',
          },
          {
            kind: 'feature',
            value: 'Kit',
            source: 'en/unified/md/feature/fury/level-1/1st-level-aspect-features.md',
          },
          {
            kind: 'feature',
            value: 'Primordial Cunning',
            source: 'en/unified/md/feature/fury/level-1/primordial-cunning.md',
          },
          {
            kind: 'ability',
            value: 'Unearthly Reflexes',
            source: 'en/unified/md/feature/ability/fury/level-1/unearthly-reflexes.md',
          },
        ],
      },
      {
        id: 'class.fury.aspect.stormwight',
        value: 'Stormwight',
        supportedInV001: false,
        grants: [
          {
            kind: 'skill',
            value: 'Track',
            source: 'en/unified/md/feature/fury/level-1/primordial-aspect.md',
            quote: 'You have the Track skill.',
          },
          {
            kind: 'feature',
            value: 'Beast Shape',
            source: 'en/unified/md/feature/fury/level-1/beast-shape.md',
          },
          {
            kind: 'feature',
            value: 'Relentless Hunter',
            source: 'en/unified/md/feature/fury/level-1/relentless-hunter.md',
          },
          {
            kind: 'ability',
            value: 'Furious Change',
            source: 'en/unified/md/feature/ability/fury/level-1/furious-change.md',
          },
        ],
      },
    ],
    featureRule: {
      source: 'en/unified/md/feature/fury/level-1/1st-level-aspect-features.md',
      quote:
        'Your primordial aspect grants you two features, as shown on the 1st-Level Aspect Features table.',
    },
    triggeredRule: {
      source: 'en/unified/md/feature/fury/level-1/aspect-triggered-action.md',
      quote:
        'Your primordial aspect grants you a triggered action, as shown on the Aspect Triggered Actions table.',
    },
    questions: [],
  },
  {
    id: 'class.fury.signature-ability',
    kind: 'choice',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'single',
      count: 1,
    },
    source: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    quote: 'Choose one signature ability from the following options.',
    poolSource: {
      source: 'en/books/heroes/clean/Draw Steel Heroes.md',
      note: "The unified feature entry omits the option list; membership is taken from the ability headings under Signature Ability in the clean Heroes text and the ability entries' missing cost field.",
    },
    options: [
      {
        id: 'ability.fury.brutal-slam',
        value: 'Brutal Slam',
        source: 'en/unified/md/feature/ability/fury/level-1/brutal-slam.md',
        supportedInV001: true,
      },
      {
        id: 'ability.fury.hit-and-run',
        value: 'Hit and Run',
        source: 'en/unified/md/feature/ability/fury/level-1/hit-and-run.md',
        supportedInV001: false,
      },
      {
        id: 'ability.fury.impaled',
        value: 'Impaled!',
        source: 'en/unified/md/feature/ability/fury/level-1/impaled.md',
        supportedInV001: false,
      },
      {
        id: 'ability.fury.to-the-death',
        value: 'To the Death!',
        source: 'en/unified/md/feature/ability/fury/level-1/to-the-death.md',
        supportedInV001: false,
      },
    ],
  },
  {
    id: 'class.fury.ability-3',
    kind: 'choice',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'single',
      count: 1,
    },
    source: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    quote:
      'Choose one heroic ability from the following options, each of which costs 3 ferocity to use.',
    options: [
      {
        id: 'ability.fury.back',
        value: 'Back!',
        source: 'en/unified/md/feature/ability/fury/level-1/back.md',
        costQuote: 'cost: 3 Ferocity',
        supportedInV001: false,
      },
      {
        id: 'ability.fury.out-of-the-way',
        value: 'Out of the Way!',
        source: 'en/unified/md/feature/ability/fury/level-1/out-of-the-way.md',
        costQuote: 'cost: 3 Ferocity',
        supportedInV001: true,
      },
      {
        id: 'ability.fury.tide-of-death',
        value: 'Tide of Death',
        source: 'en/unified/md/feature/ability/fury/level-1/tide-of-death.md',
        costQuote: 'cost: 3 Ferocity',
        supportedInV001: false,
      },
      {
        id: 'ability.fury.your-entrails-are-your-extrails',
        value: 'Your Entrails Are Your Extrails!',
        source: 'en/unified/md/feature/ability/fury/level-1/your-entrails-are-your-extrails.md',
        costQuote: 'cost: 3 Ferocity',
        supportedInV001: false,
      },
    ],
  },
  {
    id: 'class.fury.ability-5',
    kind: 'choice',
    availableWhen: {
      decision: 'class.choice',
      value: 'Fury',
    },
    shape: {
      type: 'single',
      count: 1,
    },
    source: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    quote:
      'Choose one heroic ability from the following options, each of which costs 5 ferocity to use.',
    options: [
      {
        id: 'ability.fury.blood-for-blood',
        value: 'Blood for Blood!',
        source: 'en/unified/md/feature/ability/fury/level-1/blood-for-blood.md',
        costQuote: 'cost: 5 Ferocity',
        supportedInV001: false,
      },
      {
        id: 'ability.fury.make-peace-with-your-god',
        value: 'Make Peace With Your God!',
        source: 'en/unified/md/feature/ability/fury/level-1/make-peace-with-your-god.md',
        costQuote: 'cost: 5 Ferocity',
        supportedInV001: false,
      },
      {
        id: 'ability.fury.thunder-roar',
        value: 'Thunder Roar',
        source: 'en/unified/md/feature/ability/fury/level-1/thunder-roar.md',
        costQuote: 'cost: 5 Ferocity',
        supportedInV001: true,
      },
      {
        id: 'ability.fury.to-the-uttermost-end',
        value: 'To the Uttermost End',
        source: 'en/unified/md/feature/ability/fury/level-1/to-the-uttermost-end.md',
        costQuote: 'cost: 5 Ferocity',
        supportedInV001: false,
      },
    ],
  },
] as Decision[];

export const classProfile: ClassProfile = {
  fixedCharacteristics: { Might: 2, Agility: 2 },
  assignmentDecisionId: 'class.fury.array-assignment',
  arrayDecisionId: 'class.fury.characteristic-array',
  fixedDecisionId: 'class.fury.fixed-characteristics',
  baselineDecisionId: 'class.fury.baseline',
  subclassDecisionId: 'class.fury.aspect',
  source: path('class/fury'),
  characteristicsQuote: SENTENCES.characteristicArray.quote,
  startingStamina: 21,
  recoveries: 10,
  potencyCharacteristic: 'M',
  resource: 'ferocity',
  resourceSource: SENTENCES.ferocityName.path,
  resourceQuote: SENTENCES.ferocityName.quote,
  resourceOutsideCombatQuote: SENTENCES.ferocityOutsideCombat.quote,
  kit: 'required',
};
