// SPDX-License-Identifier: GPL-3.0-only
/** Talent Basics and level-one advancement from the pinned Compendium. */
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
const base = path('class/talent');
const f = (s: string) => path(`feature/talent/level-1/${s}`);
const a = (s: string) => path(`feature/ability/talent/level-1/${s}`);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const characteristicsQuote = 'You start with an Reason of 2 and a Presence of 2';
export const TALENT_CHOICES = [
  ['Entropic Bolt', 0],
  ['Hoarfrost', 0],
  ['Incinerate', 0],
  ['Kinetic Grip', 0],
  ['Kinetic Pulse', 0],
  ['Materialize', 0],
  ['Optic Blast', 0],
  ['Spirit Sword', 0],
  ['Awe', 3],
  ['Choke', 3],
  ['Precognition', 3],
  ['Smolder', 3],
  ['Flashback', 5],
  ['Inertia Soak', 5],
  ['Iron', 5],
  ['Perfect Clarity', 5],
] as const;
export const classProfile: ClassProfile = {
  fixedCharacteristics: { Reason: 2, Presence: 2 },
  assignmentDecisionId: 'class.talent.array-assignment',
  arrayDecisionId: 'class.talent.characteristic-array',
  fixedDecisionId: 'class.talent.fixed-characteristics',
  baselineDecisionId: 'class.talent.baseline',
  subclassDecisionId: 'class.talent.tradition',
  source: base,
  characteristicsQuote,
  startingStamina: 18,
  recoveries: 8,
  potencyCharacteristic: 'R',
  resource: 'clarity',
  resourceSource: f('clarity-and-strain'),
  resourceQuote: 'a Heroic Resource called clarity',
  resourceOutsideCombatQuote:
    "Though you can't gain clarity outside of combat, you can use your heroic abilities and effects that cost clarity without spending it.",
  kit: 'none',
};
export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  return [
    auto(
      'class.talent.fixed-characteristics',
      'class.choice',
      'Talent',
      base,
      characteristicsQuote,
      [grant('characteristic', 'Reason 2', base), grant('characteristic', 'Presence 2', base)],
    ),
    choice(
      'class.talent.characteristic-array',
      'class.choice',
      'Talent',
      base,
      characteristicsQuote,
      ['2, −1, −1', '1, 1, −1', '1, 0, 0'].map(v => option(v, base)),
    ),
    {
      id: 'class.talent.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Might', 'Agility', 'Intuition'] },
      dependsOn: ['class.talent.characteristic-array'],
      source: base,
      quote: characteristicsQuote,
    },
    auto(
      'class.talent.baseline',
      'class.choice',
      'Talent',
      base,
      'Starting Stamina at 1st Level: 18',
      [
        grant('statistic', 'Starting Stamina at 1st Level: 18', base),
        grant('statistic', 'Recoveries: 8', base),
        grant(
          'potency',
          'Weak Potency: Reason − 2; Average Potency: Reason − 1; Strong Potency: Reason',
          base,
        ),
      ],
    ),
    auto(
      'class.talent.skills.fixed',
      'class.choice',
      'Talent',
      base,
      'You gain the Psionics skill',
      [grant('skill', 'Psionics', base), grant('skill', 'Read Person', base)],
    ),
    choice(
      'class.talent.skills',
      'class.choice',
      'Talent',
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
    auto('class.talent.features', 'class.choice', 'Talent', base, 'Talent Advancement Table', [
      ...[
        'Talent Tradition',
        'Clarity and Strain',
        'Mind Spike',
        'Psionic Augmentation',
        'Talent Ward',
        'Telepathic Speech',
        'Talent Abilities',
      ].map(n => grant('class-feature', n, f(slug(n)))),
      grant('class-ability', 'Mind Spike', a('mind-spike')),
      grant('language', 'Mindspeech', f('telepathic-speech'), 'You know the Mindspeech language'),
    ]),
    choice(
      'class.talent.tradition',
      'class.choice',
      'Talent',
      f('talent-tradition'),
      'You choose a talent tradition from the following options: chronopathy, telekinesis, or telepathy.',
      [
        ['Chronopathy', 'Accelerate', 'Again'],
        ['Telekinesis', 'Minor Telekinesis', 'Repel'],
        ['Telepathy', 'Feedback Loop', 'Remote Assistance'],
      ].map(([name, ...abilities]) =>
        option(name!, f('talent-tradition'), {
          grants: abilities.flatMap(n => [
            grant('class-feature', n, f(slug(n))),
            grant('class-ability', n, a(slug(n))),
          ]),
        }),
      ),
    ),
    choice(
      'class.talent.ward',
      'class.choice',
      'Talent',
      f('talent-ward'),
      'Choose one of the following wards.',
      ['Entropy', 'Repulsive', 'Steel', 'Vanishing'].map(n => {
        const name = `${n} Ward`;
        return option(name, f(slug(name)), {
          grants: [grant('class-feature', name, f(slug(name)))],
        });
      }),
    ),
    choice(
      'class.talent.augmentation',
      'class.choice',
      'Talent',
      f('psionic-augmentation'),
      'Choose one of the following augmentations.',
      [
        'Battle Augmentation',
        'Density Augmentation',
        'Distance Augmentation',
        'Force Augmentation',
        'Speed Augmentation',
      ].map(n => option(n, f(slug(n)), { grants: [grant('class-feature', n, f(slug(n)))] })),
    ),
    ...[0, 3, 5].map(cost =>
      choice(
        `class.talent.${cost ? `ability-${cost}` : 'signature-abilities'}`,
        'class.choice',
        'Talent',
        f('talent-abilities'),
        cost
          ? `each of which costs ${cost} clarity to use.`
          : 'Choose two signature abilities from the following options.',
        TALENT_CHOICES.filter(([, c]) => c === cost).map(([name]) =>
          option(name, a(slug(name)), {
            abilityKind: cost ? 'heroic' : 'signature',
            ...(cost ? { costQuote: `cost: ${cost} Clarity` } : {}),
          }),
        ),
        cost ? {} : { shape: { type: 'multi', count: 2 } },
      ),
    ),
  ];
}
