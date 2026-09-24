// SPDX-License-Identifier: GPL-3.0-only
/**
 * Beastheart levels two and three: pinned class/beastheart.md Basics and Beastheart Advancement Table,
 * feature/beastheart/level-2 and level-3, and each companion stat block's level 3 feature. The
 * 2nd-level wild nature ability file prints the per-nature headings without options; each ability
 * file's `subclass:` frontmatter names its wild nature.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';
import { BEASTHEART_COMPANIONS } from './companions.ts';

const feature = (level: number, slug: string) => path(`feature/beastheart/level-${level}/${slug}`);
const ability = (level: number, slug: string) =>
  path(`feature/ability/beastheart/level-${level}/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replaceAll('’', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.beastheart.level-${level}.stamina`,
    'class.choice',
    'Beastheart',
    path('class/beastheart'),
    'Stamina Gained at 2nd and Higher Levels: 12',
  );
const natureDependent = { dependsOn: ['class.beastheart.wild-nature'] };

export const BEASTHEART_LEVEL_TWO_NATURES = [
  ['Guardian', 'Watchdog', ['Fetch!', 'Omnomnom']],
  ['Prowler', 'Supersniffer', ['Jump Scare', 'On You Like Your Shadow']],
  ['Punisher', "This One's Yours", ['Foe Bowling', "One Roar and We're Back In the Fight"]],
  ['Spark', 'Stormheart', ['Burning Lash', 'Howling Gale']],
] as const;

/** Each companion stat block's level 3 advancement feature (feature/companion/beastheart/<species>/level-3). */
export const BEASTHEART_COMPANION_LEVEL_THREE: Record<string, string> = {
  Basilisk: 'Foes Forever Frozen',
  Bear: 'Foe Thresher',
  Boar: 'Greased Pig',
  Condor: 'Dive Bomb',
  Deinonychus: 'Tear You to Ribbons',
  Drake: 'Endless Breath',
  'Elemental Spark': 'Electroshock',
  'Gummy Ball': 'Suck It Up',
  Hellhound: 'Infernal Apparition',
  Lightbender: 'Hit and Run',
  Panther: 'Cat and Mouse',
  Spider: 'Dripping Fangs',
  Sporeling: 'Slowing Spores',
  Wolf: 'My, What Big Teeth You Have',
};

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  auto(
    'class.beastheart.level-2.everyones-best-friend',
    'class.choice',
    'Beastheart',
    feature(2, 'everyones-best-friend'),
    "Everyone's Best Friend",
    [grant('class-feature', "Everyone's Best Friend", feature(2, 'everyones-best-friend'))],
  ),
  choice(
    'class.beastheart.level-2.perk',
    'class.choice',
    'Beastheart',
    feature(2, 'perk'),
    'You gain one exploration, interpersonal, or intrigue perk of your choice.',
    CORE_PERKS.filter(perk =>
      ['exploration', 'interpersonal', 'intrigue'].includes(perk.group),
    ).map(perk => option(perk.name, perk.source)),
  ),
  ...BEASTHEART_LEVEL_TWO_NATURES.flatMap(([nature, name, abilities]): Decision[] => [
    {
      ...auto(
        `class.beastheart.level-2.${slug(name)}`,
        'class.beastheart.wild-nature',
        nature,
        feature(2, '2nd-level-wild-nature-feature'),
        `${nature} | ${name}`,
        [
          grant('class-feature', name, feature(2, slug(name))),
          ...(name === "This One's Yours"
            ? [grant('class-ability', name, ability(2, slug(name)))]
            : []),
        ],
      ),
      ...natureDependent,
    },
    choice(
      `class.beastheart.level-2.${nature.toLowerCase()}-ability`,
      'class.beastheart.wild-nature',
      nature,
      feature(2, '2nd-level-wild-nature-ability'),
      'Your wild nature grants your choice of one of two heroic abilities.',
      abilities.map(abilityName =>
        option(abilityName, ability(2, slug(abilityName)), {
          id: slug(abilityName),
          abilityKind: 'heroic',
          costQuote: 'cost: 5 Ferocity',
        }),
      ),
      { ...natureDependent, label: `Level 2 ${nature} ability` },
    ),
  ]),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  ...BEASTHEART_COMPANIONS.map((companion): Decision => ({
    ...auto(
      `class.beastheart.level-3.companion.${companion.slug}`,
      'class.beastheart.companion',
      companion.name,
      feature(3, 'companion-advancement-feature'),
      'Your companion gains the level 3 advancement feature granted by their stat block.',
      [
        grant(
          'class-feature',
          BEASTHEART_COMPANION_LEVEL_THREE[companion.name]!,
          path(
            `feature/companion/beastheart/${companion.slug}/level-3/${slug(BEASTHEART_COMPANION_LEVEL_THREE[companion.name]!)}`,
          ),
        ),
      ],
    ),
    dependsOn: ['class.beastheart.companion'],
  })),
  choice(
    'class.beastheart.level-3.ability-7',
    'class.choice',
    'Beastheart',
    feature(3, '7-ferocity-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 ferocity to use.',
    ['Death and Violence', 'Head to Head', 'Jaws of Death', 'Shieldbreaker'].map(name =>
      option(name, ability(3, slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Ferocity',
      }),
    ),
    { label: 'Level 3 7-Ferocity ability' },
  ),
];
