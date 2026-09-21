// SPDX-License-Identifier: GPL-3.0-only
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { SUMMONER_MINIONS } from './minions.ts';
const base = path('class/summoner');
const f = (s: string) => path(`feature/summoner/level-1/${s}`);
const a = (s: string) => path(`feature/ability/summoner/level-1/${s}`);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const quote = 'You start with a Reason of 2';
export const SUMMONER_HEROICS = [
  'Distraction Tactics',
  'Essence Transfer',
  'Explosive Parade',
  'Rallying Cry',
  'Shields of Essence',
  "Summoner's Sword",
];
export const SUMMONER_CIRCLES = [
  ['Blight', 'Death Snap', 'Soulsense'],
  ['Graves', 'Dead Men Tell All Tales', 'Rise!'],
  ['Spring', 'Fairy Whispers', 'Pixie Dust'],
  ['Storms', 'Elemental Affinity', 'Heart of Nature'],
] as const;
export const classProfile: ClassProfile = {
  fixedCharacteristics: { Reason: 2 },
  assignmentDecisionId: 'class.summoner.array-assignment',
  arrayDecisionId: 'class.summoner.characteristic-array',
  fixedDecisionId: 'class.summoner.fixed-characteristics',
  baselineDecisionId: 'class.summoner.baseline',
  subclassDecisionId: 'class.summoner.circle',
  source: base,
  characteristicsQuote: quote,
  startingStamina: 15,
  recoveries: 8,
  potencyCharacteristic: 'R',
  resource: 'essence',
  resourceSource: f('essence'),
  resourceQuote: 'You and your minions have a unique reserve of essence as your Heroic Resource.',
  resourceOutsideCombatQuote:
    "Though you can't gain essence outside of combat, you can use your heroic abilities and effects that cost essence without spending it.",
  kit: 'none',
};
export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  return [
    auto('class.summoner.fixed-characteristics', 'class.choice', 'Summoner', base, quote, [
      grant('characteristic', 'Reason 2', base),
    ]),
    choice(
      'class.summoner.characteristic-array',
      'class.choice',
      'Summoner',
      base,
      quote,
      ['2, 2, −1, −1', '2, 1, 1, −1', '2, 1, 0, 0', '1, 1, 1, 0'].map(v => option(v, base)),
    ),
    {
      id: 'class.summoner.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Might', 'Agility', 'Intuition', 'Presence'] },
      dependsOn: ['class.summoner.characteristic-array'],
      source: base,
      quote,
    },
    auto(
      'class.summoner.baseline',
      'class.choice',
      'Summoner',
      base,
      'Starting Stamina at 1st Level: 15',
    ),
    auto(
      'class.summoner.skills.fixed',
      'class.choice',
      'Summoner',
      base,
      'You gain the Magic and Strategy skills',
      [grant('skill', 'Magic', base), grant('skill', 'Strategy', base)],
    ),
    choice(
      'class.summoner.skills',
      'class.choice',
      'Summoner',
      base,
      'can choose any two skills from the intrigue or lore skill groups.',
      [],
      {
        shape: { type: 'multi', count: 2 },
        options: undefined,
        selectionRole: 'skill',
        optionsFrom: ['pool.skills.intrigue', 'pool.skills.lore'],
        supportedInV001: [
          ...new Set(['intrigue', 'lore'].flatMap(g => pools[`pool.skills.${g}`]!.values)),
        ],
      },
    ),
    auto('class.summoner.features', 'class.choice', 'Summoner', base, 'Summoner Advancement', [
      ...[
        'Minions',
        'Essence',
        'Summoner Strike',
        'Strike for Me',
        'Minion Bridge',
        'Formation',
        'Quick Command',
        'Summoner Abilities',
        'Summoner Circle',
        'Portfolio',
      ].map(n => grant('class-feature', n, f(slug(n)))),
      ...['Summoner Strike', 'Strike for Me', 'Minion Bridge', 'Call Forth (1+ Essence)'].map(n =>
        grant('class-ability', n, a(n.startsWith('Call Forth') ? 'call-forth' : slug(n))),
      ),
    ]),
    choice(
      'class.summoner.circle',
      'class.choice',
      'Summoner',
      f('summoner-circle'),
      'Choose a summoner circle from the following options',
      SUMMONER_CIRCLES.map(([n, ...features]) =>
        option(n, f('summoner-circle'), {
          grants: features.map(x => grant('class-feature', x, f(slug(x)))),
        }),
      ),
    ),
    choice(
      'class.summoner.formation',
      'class.choice',
      'Summoner',
      f('formation'),
      'Choose one of the following formations: horde, platoon, elite, or leader.',
      ['Horde', 'Platoon', 'Elite', 'Leader'].map(n =>
        option(n, f(slug(n) + '-formation'), {
          grants: [grant('class-feature', n + ' Formation', f(slug(n) + '-formation'))],
        }),
      ),
    ),
    choice(
      'class.summoner.quick-command',
      'class.choice',
      'Summoner',
      f('quick-command'),
      'Choose one of the following quick commands.',
      ['Focus Fire!', 'Halt!', 'Not Yet!', 'Shield!'].map(n =>
        option(n, a(slug(n)), { grants: [grant('class-ability', n, a(slug(n)))] }),
      ),
    ),
    choice(
      'class.summoner.ability-5',
      'class.choice',
      'Summoner',
      f('summoner-abilities'),
      'each of which costs 5 essence to use.',
      SUMMONER_HEROICS.map(n =>
        option(n, a(slug(n)), { abilityKind: 'heroic', costQuote: 'cost: 5 Essence' }),
      ),
    ),
    // Labelled reading of the advancement row 1,1,3,3; see V107 scope.
    ...SUMMONER_CIRCLES.flatMap(([circle]) =>
      [1, 3].map(cost =>
        choice(
          `class.summoner.portfolio.${circle.toLowerCase()}.${cost}`,
          'class.summoner.circle',
          circle,
          base,
          '1, 1, 3, 3',
          SUMMONER_MINIONS.filter(m => m.circle === circle && m.cost === cost).map(m =>
            option(m.name, m.sourcePath, {
              grants: [grant('class-feature', m.name, m.sourcePath)],
            }),
          ),
          { shape: { type: 'multi', count: 2 } },
        ),
      ),
    ),
  ];
}
