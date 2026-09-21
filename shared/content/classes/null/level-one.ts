// SPDX-License-Identifier: GPL-3.0-only
/** Null Basics and level-one advancement from the pinned Compendium. */
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
const base = path('class/null');
const f = (s: string) => path(`feature/null/level-1/${s}`);
const a = (s: string) => path(`feature/ability/null/level-1/${s}`);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const characteristicsQuote = 'You start with an Agility of 2 and an Intuition of 2';
export const NULL_CHOICES = [
  ['Dance of Blows', 0],
  ['Faster Than the Eye', 0],
  ['Inertial Step', 0],
  ['Joint Lock', 0],
  ['Kinetic Strike', 0],
  ['Magnetic Strike', 0],
  ['Phase Inversion Strike', 0],
  ['Pressure Points', 0],
  ['Chronal Spike', 3],
  ['Psychic Pulse', 3],
  ['Relentless Nemesis', 3],
  ['Stunning Blow', 3],
  ['A Squad Unto Myself', 5],
  ['Arcane Disruptor', 5],
  ['Impart Force', 5],
  ['Phase Strike', 5],
] as const;
export const classProfile: ClassProfile = {
  fixedCharacteristics: { Agility: 2, Intuition: 2 },
  assignmentDecisionId: 'class.null.array-assignment',
  arrayDecisionId: 'class.null.characteristic-array',
  fixedDecisionId: 'class.null.fixed-characteristics',
  baselineDecisionId: 'class.null.baseline',
  subclassDecisionId: 'class.null.tradition',
  source: base,
  characteristicsQuote,
  startingStamina: 21,
  recoveries: 8,
  potencyCharacteristic: 'I',
  resource: 'discipline',
  resourceSource: f('discipline'),
  resourceQuote: 'a Heroic Resource called discipline',
  resourceOutsideCombatQuote:
    "Though you can't gain discipline outside of combat, you can use your heroic abilities and effects that cost discipline without spending it.",
  kit: 'none',
};
export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  return [
    auto('class.null.fixed-characteristics', 'class.choice', 'Null', base, characteristicsQuote, [
      grant('characteristic', 'Agility 2', base),
      grant('characteristic', 'Intuition 2', base),
    ]),
    choice(
      'class.null.characteristic-array',
      'class.choice',
      'Null',
      base,
      characteristicsQuote,
      ['2, −1, −1', '1, 1, −1', '1, 0, 0'].map(v => option(v, base)),
    ),
    {
      id: 'class.null.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Might', 'Reason', 'Presence'] },
      dependsOn: ['class.null.characteristic-array'],
      source: base,
      quote: characteristicsQuote,
    },
    auto('class.null.baseline', 'class.choice', 'Null', base, 'Starting Stamina at 1st Level: 21', [
      grant('statistic', 'Starting Stamina at 1st Level: 21', base),
      grant('statistic', 'Recoveries: 8', base),
      grant(
        'potency',
        'Weak Potency: Intuition − 2; Average Potency: Intuition − 1; Strong Potency: Intuition',
        base,
      ),
    ]),
    auto('class.null.skills.fixed', 'class.choice', 'Null', base, 'You gain the Psionics skill', [
      grant('skill', 'Psionics', base),
    ]),
    choice(
      'class.null.skills',
      'class.choice',
      'Null',
      base,
      'Then choose any two skills from the interpersonal or lore skill groups.',
      [],
      {
        shape: { type: 'multi', count: 2 },
        options: undefined,
        selectionRole: 'skill',
        optionsFrom: ['pool.skills.interpersonal', 'pool.skills.lore'],
        supportedInV001: [
          ...new Set(['interpersonal', 'lore'].flatMap(g => pools[`pool.skills.${g}`]!.values)),
        ],
      },
    ),
    auto('class.null.features', 'class.choice', 'Null', base, 'Null Advancement Table', [
      ...[
        'Null Tradition',
        'Discipline',
        'Null Field',
        'Inertial Shield',
        'Discipline Mastery',
        'Null Speed',
        'Psionic Augmentation',
        'Psionic Martial Arts',
        'Null Abilities',
      ].map(n => grant('class-feature', n, f(slug(n)))),
      grant('class-ability', 'Null Field', a('null-field')),
      grant('class-ability', 'Inertial Shield', a('inertial-shield')),
    ]),
    choice(
      'class.null.tradition',
      'class.choice',
      'Null',
      f('null-tradition'),
      'you choose a null tradition from the following options, each of which grants you a skill.',
      ['Chronokinetic', 'Cryokinetic', 'Metakinetic'].map(n =>
        option(n, f('null-tradition'), {
          grants: [grant('class-feature', `${n} Mastery`, f(`${n.toLowerCase()}-mastery`))],
        }),
      ),
    ),
    ...(
      [
        ['Chronokinetic', 'lore'],
        ['Cryokinetic', 'crafting'],
        ['Metakinetic', 'exploration'],
      ] as const
    ).map(([name, group]) =>
      choice(
        `class.null.tradition-skill.${name.toLowerCase()}`,
        'class.null.tradition',
        name,
        f('null-tradition'),
        `You gain one skill from the ${group} group.`,
        [],
        {
          shape: { type: 'multi', count: 1 },
          options: undefined,
          selectionRole: 'skill',
          optionsFrom: `pool.skills.${group}`,
          supportedInV001: pools[`pool.skills.${group}`]!.values,
        },
      ),
    ),
    choice(
      'class.null.augmentation',
      'class.choice',
      'Null',
      f('psionic-augmentation'),
      'Choose one of the following augmentations.',
      ['Density Augmentation', 'Force Augmentation', 'Speed Augmentation'].map(n =>
        option(n, f(slug(n)), { grants: [grant('class-feature', n, f(slug(n)))] }),
      ),
    ),
    ...[0, 3, 5].map(cost =>
      choice(
        `class.null.${cost ? `ability-${cost}` : 'signature-abilities'}`,
        'class.choice',
        'Null',
        f('null-abilities'),
        cost
          ? `each of which costs ${cost} discipline to use.`
          : 'Choose two signature abilities from the following options.',
        NULL_CHOICES.filter(([, c]) => c === cost).map(([name]) =>
          option(name, a(slug(name)), {
            abilityKind: cost ? 'heroic' : 'signature',
            ...(cost ? { costQuote: `cost: ${cost} Discipline` } : {}),
          }),
        ),
        cost ? {} : { shape: { type: 'multi', count: 2 } },
      ),
    ),
  ];
}
