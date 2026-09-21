// SPDX-License-Identifier: GPL-3.0-only
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { BEASTHEART_COMPANIONS } from './companions.ts';
const base = path('class/beastheart');
const f = (s: string) => path(`feature/beastheart/level-1/${s}`);
const a = (s: string) => path(`feature/ability/beastheart/level-1/${s}`);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const characteristicsQuote = 'You start with a Might of 2 and an Intuition of 2';
export const BEASTHEART_CHOICES = [
  ['Bodyswap', 0],
  ['Come On!', 0],
  ['Covering Fire', 0],
  ['Stormrage', 0],
  ['Bring the Thunder', 3],
  ['Herd the Sheep', 3],
  ['Hungry Like the Wolf', 3],
  ['Pushover', 3],
  ['All of You Versus All of Me', 5],
  ['I Feed On Your Pain!', 5],
  ['Rain of Fire', 5],
  ['You Let Me Get Too Close', 5],
] as const;
export const classProfile: ClassProfile = {
  fixedCharacteristics: { Might: 2, Intuition: 2 },
  assignmentDecisionId: 'class.beastheart.array-assignment',
  arrayDecisionId: 'class.beastheart.characteristic-array',
  fixedDecisionId: 'class.beastheart.fixed-characteristics',
  baselineDecisionId: 'class.beastheart.baseline',
  subclassDecisionId: 'class.beastheart.wild-nature',
  source: base,
  characteristicsQuote,
  startingStamina: 21,
  recoveries: 12,
  potencyCharacteristic: 'M',
  resource: 'ferocity',
  resourceSource: f('ferocity'),
  resourceQuote: 'a Heroic Resource called ferocity',
  resourceOutsideCombatQuote:
    "Though you can't gain ferocity outside of combat, you can use your heroic abilities and effects that cost ferocity without spending it.",
  kit: 'required',
};
export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  return [
    auto(
      'class.beastheart.fixed-characteristics',
      'class.choice',
      'Beastheart',
      base,
      characteristicsQuote,
      [grant('characteristic', 'Might 2', base), grant('characteristic', 'Intuition 2', base)],
    ),
    choice(
      'class.beastheart.characteristic-array',
      'class.choice',
      'Beastheart',
      base,
      characteristicsQuote,
      ['2, −1, −1', '1, 1, −1', '1, 0, 0'].map(n => option(n, base)),
    ),
    {
      id: 'class.beastheart.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Agility', 'Reason', 'Presence'] },
      dependsOn: ['class.beastheart.characteristic-array'],
      source: base,
      quote: characteristicsQuote,
    },
    auto(
      'class.beastheart.baseline',
      'class.choice',
      'Beastheart',
      base,
      'Starting Stamina at 1st Level: 21',
      [
        grant('statistic', 'Starting Stamina at 1st Level: 21', base),
        grant('statistic', 'Recoveries: 12', base),
        grant(
          'potency',
          'Weak Potency: Might − 2; Average Potency: Might − 1; Strong Potency: Might',
          base,
        ),
      ],
    ),
    auto(
      'class.beastheart.skills.fixed',
      'class.choice',
      'Beastheart',
      base,
      'You gain the Animal Handling skill.',
      [grant('skill', 'Handle Animals', base)],
    ),
    choice(
      'class.beastheart.skills',
      'class.choice',
      'Beastheart',
      base,
      'Then choose any two skills from the exploration or intrigue skill groups.',
      [],
      {
        shape: { type: 'multi', count: 2 },
        options: undefined,
        selectionRole: 'skill',
        optionsFrom: ['pool.skills.exploration', 'pool.skills.intrigue'],
        supportedInV001: [
          ...new Set(['exploration', 'intrigue'].flatMap(g => pools[`pool.skills.${g}`]!.values)),
        ],
      },
    ),
    auto(
      'class.beastheart.features',
      'class.choice',
      'Beastheart',
      base,
      'Beastheart Advancement Table',
      [
        ...[
          'Wild Nature',
          'Companion',
          'Companion Rules',
          'Heart of the Beast',
          'Ferocity',
          'Rampage',
          'Wild Nature Maneuver',
          'Wild Nature Triggered Action',
          'Kit',
          'Beastheart Abilities',
          'Adding and Subtracting Actions',
          'Beasthearts and Magic Treasure',
        ].map(n => grant('class-feature', n, f(slug(n)))),
        grant('class-ability', 'Heart of the Beast', a('heart-of-the-beast')),
        grant('class-ability', 'Feral Strike', a('feral-strike')),
      ],
    ),
    choice(
      'class.beastheart.wild-nature',
      'class.choice',
      'Beastheart',
      f('wild-nature'),
      'you choose a wild nature from the following options, each of which grants you a skill.',
      [
        ['Guardian', 'Read Person', 'Living Arrow', 'The Pack Defends'],
        ['Prowler', 'Hide', 'Lightning Leap', 'Shadow in the Mist'],
        ['Punisher', 'Endurance', 'Avalanche Rush', 'Thunderclap'],
        ['Spark', 'Magic', 'Jaws of the Storm', 'Pyre'],
      ].map(([n, s, m, t]) =>
        option(n!, f('wild-nature'), {
          grants: [
            grant('skill', s!, f('wild-nature')),
            grant('class-ability', m!, a(slug(m!))),
            grant('class-ability', t!, a(slug(t!))),
          ],
        }),
      ),
    ),
    choice(
      'class.beastheart.companion',
      'class.choice',
      'Beastheart',
      f('companion'),
      'Choose a companion from the following options.',
      BEASTHEART_COMPANIONS.map(c =>
        option(c.name, c.sourcePath, {
          grants: [
            grant('skill', c.skill, c.sourcePath),
            ...c.features.map(x => grant('class-feature', x.name, x.path)),
            ...c.abilities.map(x => grant('class-ability', x.name, x.path)),
          ],
        }),
      ),
    ),
    choice(
      'class.beastheart.drake-attunement',
      'class.beastheart.companion',
      'Drake',
      path('feature/companion/beastheart/drake/level-1/elementally-attuned'),
      'choose their attuned damage type from acid, cold, corruption, fire, lightning, poison, or sonic.',
      ['Acid', 'Cold', 'Corruption', 'Fire', 'Lightning', 'Poison', 'Sonic'].map(n =>
        option(n, path('feature/companion/beastheart/drake/level-1/elementally-attuned')),
      ),
    ),
    choice(
      'class.beastheart.companion-melee-bonus',
      'class.choice',
      'Beastheart',
      f('kit'),
      'your companion can choose between the melee damage bonus provided by the kit (if any) or a melee damage bonus of +0/+0/+4.',
      ['Kit bonus', 'Armed to the teeth (+0/+0/+4)'].map(n => option(n, f('kit'))),
    ),
    ...[0, 3, 5].map(cost =>
      choice(
        `class.beastheart.${cost ? `ability-${cost}` : 'signature-ability'}`,
        'class.choice',
        'Beastheart',
        f('beastheart-abilities'),
        cost
          ? `each of which costs ${cost} ferocity to use.`
          : 'Choose one signature ability from the following options.',
        BEASTHEART_CHOICES.filter(([, c]) => c === cost).map(([n]) =>
          option(n, a(slug(n)), {
            abilityKind: cost ? 'heroic' : 'signature',
            ...(cost ? { costQuote: `cost: ${cost} Ferocity` } : {}),
          }),
        ),
      ),
    ),
  ];
}
