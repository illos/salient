// SPDX-License-Identifier: GPL-3.0-only
/** Troubadour Basics and level-one advancement from the pinned Compendium. */
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
const base = path('class/troubadour');
const f = (s: string) => path(`feature/troubadour/level-1/${s}`);
const a = (s: string) => path(`feature/ability/troubadour/level-1/${s}`);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const characteristicsQuote = 'You start with an Agility of 2 and a Presence of 2';
export const TROUBADOUR_CHOICES = [
  ['Artful Flourish', 0],
  ['Cutting Sarcasm', 0],
  ['Instigator', 0],
  ['Witty Banter', 0],
  ['Harsh Critic', 3],
  ['Hypnotic Overtones', 3],
  ['Quick Rewrite', 3],
  ['Upstage', 3],
  ['Dramatic Reversal', 5],
  ['Fake Your Death', 5],
  ['Flip the Script', 5],
  ['Method Acting', 5],
] as const;
export const classProfile: ClassProfile = {
  fixedCharacteristics: { Agility: 2, Presence: 2 },
  assignmentDecisionId: 'class.troubadour.array-assignment',
  arrayDecisionId: 'class.troubadour.characteristic-array',
  fixedDecisionId: 'class.troubadour.fixed-characteristics',
  baselineDecisionId: 'class.troubadour.baseline',
  subclassDecisionId: 'class.troubadour.class-act',
  source: base,
  characteristicsQuote,
  startingStamina: 18,
  recoveries: 8,
  potencyCharacteristic: 'P',
  resource: 'drama',
  resourceSource: f('drama'),
  resourceQuote: 'a Heroic Resource called drama',
  resourceOutsideCombatQuote:
    "Though you can't gain drama outside of combat, you can use your heroic abilities and effects that cost drama without spending it.",
  kit: 'required',
};
export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  return [
    auto(
      'class.troubadour.fixed-characteristics',
      'class.choice',
      'Troubadour',
      base,
      characteristicsQuote,
      [grant('characteristic', 'Agility 2', base), grant('characteristic', 'Presence 2', base)],
    ),
    choice(
      'class.troubadour.characteristic-array',
      'class.choice',
      'Troubadour',
      base,
      characteristicsQuote,
      ['2, −1, −1', '1, 1, −1', '1, 0, 0'].map(v => option(v, base)),
    ),
    {
      id: 'class.troubadour.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Might', 'Reason', 'Intuition'] },
      dependsOn: ['class.troubadour.characteristic-array'],
      source: base,
      quote: characteristicsQuote,
    },
    auto(
      'class.troubadour.baseline',
      'class.choice',
      'Troubadour',
      base,
      'Starting Stamina at 1st Level: 18',
      [
        grant('statistic', 'Starting Stamina at 1st Level: 18', base),
        grant('statistic', 'Recoveries: 8', base),
        grant(
          'potency',
          'Weak Potency: Presence − 2; Average Potency: Presence − 1; Strong Potency: Presence',
          base,
        ),
      ],
    ),
    auto(
      'class.troubadour.skills.fixed',
      'class.choice',
      'Troubadour',
      base,
      'You gain the Read Person skill',
      [grant('skill', 'Read Person', base)],
    ),
    ...(
      [
        [
          'interpersonal',
          2,
          ['interpersonal'],
          'Then choose two skills from the interpersonal skill group',
        ],
        [
          'intrigue-lore',
          1,
          ['intrigue', 'lore'],
          'one skill from the intrigue or lore skill groups.',
        ],
      ] as const
    ).map(([id, count, groups, quote]): Decision => ({
      id: `class.troubadour.skills.${id}`,
      kind: 'choice',
      shape: { type: 'multi', count },
      dependsOn: ['class.choice'],
      availableWhen: { decision: 'class.choice', value: 'Troubadour' },
      source: base,
      quote,
      selectionRole: 'skill',
      optionsFrom: groups.map(g => `pool.skills.${g}`),
      supportedInV001: [...new Set(groups.flatMap(g => pools[`pool.skills.${g}`]!.values))],
    })),
    auto(
      'class.troubadour.features',
      'class.choice',
      'Troubadour',
      base,
      'Troubadour Advancement Table',
      [
        ...[
          'Troubadour Class Act',
          'Drama',
          'Kit',
          'Scene Partner',
          'Routines',
          '1st-Level Class Act Features',
          'Class Act Triggered Action',
          'Troubadour Abilities',
        ].map(n => grant('class-feature', n, f(slug(n)))),
        grant('class-ability', 'Choreography', a('choreography')),
        grant('class-ability', 'Revitalizing Limerick', a('revitalizing-limerick')),
      ],
    ),
    choice(
      'class.troubadour.class-act',
      'class.choice',
      'Troubadour',
      f('troubadour-class-act'),
      'you choose a troubadour class act from the following options, each of which grants you a skill.',
      [
        [
          'Auteur',
          'Brag',
          ['Blocking', 'Dramatic Monologue'],
          ['Blocking', 'Dramatic Monologue'],
          'Turnabout Is Fair Play',
        ],
        [
          'Duelist',
          'Gymnastics',
          ['Acrobatics', 'Star Power'],
          ['Acrobatics', 'Star Power'],
          'Riposte',
        ],
        [
          'Virtuoso',
          'Music',
          ['Power Chord', 'Virtuoso Performances'],
          ['Power Chord', '"Ballad of the Beast"', '"Thunder Mother"'],
          'Harmonize',
        ],
      ].map(([name, skill, features, abilities, trigger]) =>
        option(name as string, f('troubadour-class-act'), {
          grants: [
            grant('skill', skill as string, f('troubadour-class-act')),
            ...(features as string[]).map(n => grant('class-feature', n, f(slug(n)))),
            ...(abilities as string[]).map(n => grant('class-ability', n, a(slug(n)))),
            grant('aspect-ability', trigger as string, a(slug(trigger as string))),
          ],
        }),
      ),
    ),
    ...[0, 3, 5].map(cost =>
      choice(
        `class.troubadour.${cost ? `ability-${cost}` : 'signature-ability'}`,
        'class.choice',
        'Troubadour',
        f('signature-ability'),
        cost
          ? `each of which costs ${cost} drama to use.`
          : 'Choose one signature ability from the following options.',
        TROUBADOUR_CHOICES.filter(([, c]) => c === cost).map(([name]) =>
          option(name, a(slug(name)), {
            abilityKind: cost ? 'heroic' : 'signature',
            ...(cost ? { costQuote: `cost: ${cost} Drama` } : {}),
          }),
        ),
      ),
    ),
  ];
}
