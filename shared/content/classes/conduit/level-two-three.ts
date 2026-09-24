// SPDX-License-Identifier: GPL-3.0-only
/**
 * Conduit levels two and three: pinned class/conduit.md Basics and Conduit Advancement Table,
 * feature/conduit/level-2 and level-3.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';
import { CENSOR_DOMAINS as DOMAINS } from '../censor/level-one.ts';

const feature = (level: number, slug: string) => path(`feature/conduit/level-${level}/${slug}`);
const ability = (level: number, slug: string) =>
  path(`feature/ability/conduit/level-${level}/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.conduit.level-${level}.stamina`,
    'class.choice',
    'Conduit',
    path('class/conduit'),
    'Stamina Gained at 2nd and Higher Levels: 6',
  );

/** 2nd-level-domain-ability.md, 2nd-Level Conduit Domain Abilities Table. */
export const CONDUIT_LEVEL_TWO_DOMAIN_ABILITIES: Record<string, string> = {
  Creation: 'Statue of Power',
  Death: 'Reap',
  Fate: 'Blessing of Fate and Destiny',
  Knowledge: 'The Gods Command You Obey',
  Life: 'Wellspring of Grace',
  Love: 'Our Hearts Your Strength',
  Nature: 'Nature Judges Thee',
  Protection: 'Sacred Bond',
  Storm: "Saint's Tempest",
  Sun: 'Morning Light',
  Trickery: 'Divine Comedy',
  War: 'Blessing of Insight',
};

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  auto(
    'class.conduit.level-2.the-lists-of-heaven',
    'class.choice',
    'Conduit',
    feature(2, 'the-lists-of-heaven'),
    'The Lists of Heaven',
    [grant('class-feature', 'The Lists of Heaven', feature(2, 'the-lists-of-heaven'))],
  ),
  choice(
    'class.conduit.level-2.perk',
    'class.choice',
    'Conduit',
    feature(2, 'perk'),
    'You gain one crafting, lore, or supernatural perk of your choice.',
    CORE_PERKS.filter(perk => ['crafting', 'lore', 'supernatural'].includes(perk.group)).map(perk =>
      option(perk.name, perk.source),
    ),
  ),
  // 2nd-level-domain-feature.md: the 1st-level domain feature and skill of the other chosen domain.
  ...DOMAINS.flatMap(([domain, name, group]): Decision[] => {
    const conditions = [
      { decision: 'class.conduit.domains', value: domain, includes: true },
      { decision: 'class.conduit.domain-feature', value: domain, not: true },
    ];
    const level1 = path('feature/conduit/level-1/1st-level-domain-feature');
    return [
      {
        id: `class.conduit.level-2.domain-feature.${slug(domain)}`,
        kind: 'automatic',
        shape: { type: 'none' },
        dependsOn: ['class.conduit.domains', 'class.conduit.domain-feature'],
        conditions,
        source: feature(2, '2nd-level-domain-feature'),
        quote:
          "You gain the 1st-level domain feature and ability to choose a skill for the domain you selected at 1st level but whose domain feature you didn't take at that level",
        grants: [
          grant('class-feature', name, path(`feature/conduit/level-1/${slug(name)}`)),
          ...(['Creation', 'Death', 'Nature'].includes(domain)
            ? [grant('class-ability', name, path(`feature/ability/conduit/level-1/${slug(name)}`))]
            : []),
        ],
      },
      {
        id: `class.conduit.level-2.domain-skill.${slug(domain)}`,
        label: `${domain} domain skill`,
        kind: 'choice',
        shape: { type: 'single', count: 1 },
        dependsOn: ['class.conduit.domains', 'class.conduit.domain-feature'],
        conditions,
        selectionRole: 'skill',
        source: level1,
        quote:
          'Additionally, you gain a skill from the chosen domain, selected from the skill group indicated on the table.',
        optionsFrom: [`pool.skills.${group}`],
      },
    ];
  }),
  {
    id: 'class.conduit.level-2.domain-ability',
    label: 'Level 2 domain ability',
    kind: 'choice',
    shape: { type: 'single', count: 1 },
    dependsOn: ['class.conduit.domains'],
    selectedPool: { decision: 'class.conduit.domains' },
    source: feature(2, '2nd-level-domain-ability'),
    quote: 'Choose one of your domains. You gain a heroic ability from that domain',
    options: DOMAINS.map(([domain]) => option(domain, feature(2, '2nd-level-domain-ability'))),
  },
  ...DOMAINS.map(([domain]): Decision => {
    const name = CONDUIT_LEVEL_TWO_DOMAIN_ABILITIES[domain]!;
    return {
      ...auto(
        `class.conduit.level-2.domain-ability.${slug(domain)}`,
        'class.conduit.level-2.domain-ability',
        domain,
        feature(2, '2nd-level-domain-ability'),
        '2nd-Level Conduit Domain Abilities Table',
        [grant('heroic-ability', name, ability(2, slug(name)), 'cost: 5 Piety')],
      ),
      dependsOn: ['class.conduit.level-2.domain-ability'],
    };
  }),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  auto(
    'class.conduit.level-3.minor-miracle',
    'class.choice',
    'Conduit',
    feature(3, 'minor-miracle'),
    'Minor Miracle',
    [grant('class-feature', 'Minor Miracle', feature(3, 'minor-miracle'))],
  ),
  choice(
    'class.conduit.level-3.ability-7',
    'class.choice',
    'Conduit',
    feature(3, '7-piety-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 piety to use.',
    ['Fear of the Gods', "Saint's Raiment", 'Soul Siphon', 'Words of Wrath and Grace'].map(name =>
      option(name, ability(3, slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Piety',
      }),
    ),
    { label: 'Level 3 7-Piety ability' },
  ),
];
