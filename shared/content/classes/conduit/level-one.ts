// SPDX-License-Identifier: GPL-3.0-only
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CENSOR_DEITIES as DEITIES } from '../censor/deities.ts';
import { CENSOR_DOMAINS as DOMAINS } from '../censor/level-one.ts';
const base = path('class/conduit');
const f = (s: string) => path(`feature/conduit/level-1/${s}`);
const a = (s: string) => path(`feature/ability/conduit/level-1/${s}`);
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
const characteristicsQuote =
  'You start with an Intuition of 2, and can choose one of the following arrays for your other characteristic scores:';
export const CONDUIT_ABILITIES = [
  {
    name: 'Blessed Light',
    slug: 'blessed-light',
    cost: 0,
    group: 'signature',
  },
  {
    name: 'Call the Thunder Down',
    slug: 'call-the-thunder-down',
    cost: 3,
    group: 'heroic',
  },
  {
    name: "Corruption's Curse",
    slug: 'corruptions-curse',
    cost: 5,
    group: 'heroic',
  },
  {
    name: 'Curse of Terror',
    slug: 'curse-of-terror',
    cost: 5,
    group: 'heroic',
  },
  {
    name: 'Drain',
    slug: 'drain',
    cost: 0,
    group: 'signature',
  },
  {
    name: 'Faith Is Our Armor',
    slug: 'faith-is-our-armor',
    cost: 5,
    group: 'heroic',
  },
  {
    name: 'Faithful Friend',
    slug: 'faithful-friend',
    cost: 0,
    group: 'automatic',
  },
  {
    name: 'Font of Wrath',
    slug: 'font-of-wrath',
    cost: 3,
    group: 'heroic',
  },
  {
    name: 'Grave Speech',
    slug: 'grave-speech',
    cost: 0,
    group: 'automatic',
  },
  {
    name: 'Hands of the Maker',
    slug: 'hands-of-the-maker',
    cost: 0,
    group: 'automatic',
  },
  {
    name: 'Healing Grace',
    slug: 'healing-grace',
    cost: 0,
    group: 'automatic',
  },
  {
    name: 'Holy Lash',
    slug: 'holy-lash',
    cost: 0,
    group: 'signature',
  },
  {
    name: "Judgment's Hammer",
    slug: 'judgments-hammer',
    cost: 3,
    group: 'heroic',
  },
  {
    name: 'Lightfall',
    slug: 'lightfall',
    cost: 0,
    group: 'signature',
  },
  {
    name: 'Ray of Wrath',
    slug: 'ray-of-wrath',
    cost: 0,
    group: 'automatic',
  },
  {
    name: 'Sacrificial Offer',
    slug: 'sacrificial-offer',
    cost: 0,
    group: 'signature',
  },
  {
    name: 'Sermon of Grace',
    slug: 'sermon-of-grace',
    cost: 5,
    group: 'heroic',
  },
  {
    name: 'Staggering Curse',
    slug: 'staggering-curse',
    cost: 0,
    group: 'signature',
  },
  {
    name: 'Violence Will Not Aid Thee',
    slug: 'violence-will-not-aid-thee',
    cost: 3,
    group: 'heroic',
  },
  {
    name: "Warrior's Prayer",
    slug: 'warriors-prayer',
    cost: 0,
    group: 'signature',
  },
  {
    name: 'Wither',
    slug: 'wither',
    cost: 0,
    group: 'signature',
  },
  {
    name: 'Word of Guidance',
    slug: 'word-of-guidance',
    cost: 0,
    group: 'triggered',
  },
  {
    name: 'Word of Judgment',
    slug: 'word-of-judgment',
    cost: 0,
    group: 'triggered',
  },
] as const;
export const classProfile: ClassProfile = {
  fixedCharacteristics: { Intuition: 2 },
  assignmentDecisionId: 'class.conduit.array-assignment',
  arrayDecisionId: 'class.conduit.characteristic-array',
  fixedDecisionId: 'class.conduit.fixed-characteristics',
  baselineDecisionId: 'class.conduit.baseline',
  subclassDecisionId: 'class.conduit.domains',
  source: base,
  characteristicsQuote,
  startingStamina: 18,
  recoveries: 8,
  potencyCharacteristic: 'I',
  resource: 'piety',
  resourceSource: f('piety'),
  resourceQuote: 'Your deity grants you a Heroic Resource called piety',
  resourceOutsideCombatQuote:
    "Though you can't gain piety outside of combat, you can use your heroic abilities and effects that cost piety without spending it.",
  kit: 'none',
};
export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  const domains = DOMAINS.map(([n]) => n);
  return [
    auto(
      'class.conduit.fixed-characteristics',
      'class.choice',
      'Conduit',
      base,
      characteristicsQuote,
      [grant('characteristic', 'Intuition 2', base)],
    ),
    choice(
      'class.conduit.characteristic-array',
      'class.choice',
      'Conduit',
      base,
      characteristicsQuote,
      ['2, 2, −1, −1', '2, 1, 1, −1', '2, 1, 0, 0', '1, 1, 1, 0'].map(v => option(v, base)),
    ),
    {
      id: 'class.conduit.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Might', 'Agility', 'Reason', 'Presence'] },
      dependsOn: ['class.conduit.characteristic-array'],
      source: base,
      quote: characteristicsQuote,
    },
    auto(
      'class.conduit.baseline',
      'class.choice',
      'Conduit',
      base,
      'Starting Stamina at 1st Level: 18',
      [
        grant('statistic', 'Starting Stamina at 1st Level: 18', base),
        grant('statistic', 'Recoveries: 8', base),
        grant(
          'potency',
          'Weak Potency: Intuition − 2; Average Potency: Intuition − 1; Strong Potency: Intuition',
          base,
        ),
      ],
    ),
    {
      id: 'class.conduit.skills',
      kind: 'choice',
      shape: { type: 'multi', count: 2 },
      dependsOn: ['class.choice'],
      availableWhen: { decision: 'class.choice', value: 'Conduit' },
      source: base,
      quote: 'Choose any two skills from the interpersonal or lore skill groups',
      selectionRole: 'skill',
      optionsFrom: ['pool.skills.interpersonal', 'pool.skills.lore'],
      supportedInV001: [
        ...pools['pool.skills.interpersonal']!.values,
        ...pools['pool.skills.lore']!.values,
      ],
    },
    auto('class.conduit.features', 'class.choice', 'Conduit', base, 'Conduit Advancement Table', [
      ...[
        'Deity and Domains',
        'Piety',
        '1st-Level Domain Feature',
        'Healing Grace',
        'Ray of Wrath',
        'Triggered Action',
        'Prayer',
        'Conduit Ward',
        'Conduit Abilities',
        'Domain Piety and Effects',
      ].map(n => grant('class-feature', n, f(slug(n)))),
      grant('class-ability', 'Healing Grace', a('healing-grace')),
      grant('class-ability', 'Ray of Wrath', a('ray-of-wrath')),
    ]),
    choice(
      'class.conduit.deity',
      'class.choice',
      'Conduit',
      f('deity-and-domains'),
      'Choose a god or saint who your character reveres from Chapter 14: Gods and Religion',
      DEITIES.map(d => option(d.name, d.source)),
      { label: 'Deity or saint' },
    ),
    {
      id: 'class.conduit.domains',
      label: 'Two domains',
      kind: 'choice',
      shape: { type: 'multi', count: 2 },
      dependsOnAny: ['class.conduit.deity'],
      source: f('deity-and-domains'),
      quote: 'After choosing your deity, pick two domains from their portfolio.',
      optionsByParent: Object.fromEntries(
        DEITIES.map(d => [
          d.source,
          {
            parentValue: d.name,
            source: d.source,
            quote: `Domains: ${d.domains.join(', ')}`,
            values: [...d.domains],
          },
        ]),
      ),
      supportedInV001: domains,
    },
    {
      id: 'class.conduit.domain-feature',
      label: 'Level-one domain feature',
      kind: 'choice',
      shape: { type: 'single', count: 1 },
      dependsOn: ['class.conduit.domains'],
      selectedPool: { decision: 'class.conduit.domains' },
      source: f('1st-level-domain-feature'),
      quote: 'Choose one of your domains. You gain a domain feature for that domain',
      options: domains.map(n => option(n, f('1st-level-domain-feature'))),
    },
    {
      id: 'class.conduit.domain-skill',
      label: 'Domain skill',
      kind: 'choice',
      shape: { type: 'single', count: 1 },
      dependsOn: ['class.conduit.domain-feature'],
      selectionRole: 'skill',
      source: f('1st-level-domain-feature'),
      quote:
        'Additionally, you gain a skill from the chosen domain, selected from the skill group indicated on the table.',
      optionsByParent: Object.fromEntries(
        DOMAINS.map(([n, , g]) => [
          n,
          { source: f('1st-level-domain-feature'), optionsFrom: [`pool.skills.${g}`] },
        ]),
      ),
      supportedInV001: [
        ...new Set(DOMAINS.flatMap(([, , g]) => pools[`pool.skills.${g}`]!.values)),
      ],
    },
    ...DOMAINS.map(([n, feature]) => ({
      ...auto(
        `class.conduit.domain-feature.${slug(n)}`,
        'class.conduit.domain-feature',
        n,
        f('1st-level-domain-feature'),
        '1st-Level Conduit Domain Features Table',
        [
          grant('class-feature', feature, f(slug(feature))),
          ...(['Creation', 'Death', 'Nature'].includes(n)
            ? [grant('class-ability', feature, a(slug(feature)))]
            : []),
        ],
      ),
      dependsOn: ['class.conduit.domain-feature'],
    })),
    ...DOMAINS.map(([n]) => ({
      id: `class.conduit.domain.${slug(n)}`,
      kind: 'automatic' as const,
      shape: { type: 'none' as const },
      dependsOn: ['class.conduit.domains'],
      conditions: [{ decision: 'class.conduit.domains', value: n, includes: true }],
      source: f('domain-piety-and-effects'),
      quote: `${n} Domain Piety and Effect`,
      grants: [
        grant('class-feature', `${n} Domain Piety and Effect`, f('domain-piety-and-effects')),
      ],
    })),
    choice(
      'class.conduit.prayer',
      'class.choice',
      'Conduit',
      f('prayer'),
      'Choose one of the following prayers.',
      [
        'Prayer of Destruction',
        'Prayer of Distance',
        "Prayer of Soldier's Skill",
        'Prayer of Speed',
        'Prayer of Steel',
      ].map(n =>
        option(n, f(n === "Prayer of Soldier's Skill" ? 'prayer-of-soldiers-skill' : slug(n)), {
          grants: [
            grant(
              'class-feature',
              n,
              f(n === "Prayer of Soldier's Skill" ? 'prayer-of-soldiers-skill' : slug(n)),
            ),
          ],
        }),
      ),
    ),
    choice(
      'class.conduit.ward',
      'class.choice',
      'Conduit',
      f('conduit-ward'),
      'Choose one of the following wards.',
      ['Bastion Ward', 'Quickness Ward', 'Sanctuary Ward', 'Spirit Ward'].map(n =>
        option(n, f(slug(n)), { grants: [grant('class-feature', n, f(slug(n)))] }),
      ),
    ),
    choice(
      'class.conduit.triggered-action',
      'class.choice',
      'Conduit',
      f('triggered-action'),
      'Choose one of the following triggered actions.',
      CONDUIT_ABILITIES.filter(x => x.group === 'triggered').map(x =>
        option(x.name, a(x.slug), { grants: [grant('class-ability', x.name, a(x.slug))] }),
      ),
    ),
    {
      ...choice(
        'class.conduit.signature-abilities',
        'class.choice',
        'Conduit',
        f('conduit-abilities'),
        'Choose two signature abilities from the following options.',
        CONDUIT_ABILITIES.filter(x => x.group === 'signature').map(x =>
          option(x.name, a(x.slug), { abilityKind: 'signature' }),
        ),
      ),
      shape: { type: 'multi', count: 2 },
    },
    ...[3, 5].map(cost =>
      choice(
        `class.conduit.ability-${cost}`,
        'class.choice',
        'Conduit',
        f('conduit-abilities'),
        `Choose one heroic ability from the following options, each of which costs ${cost} piety to use.`,
        CONDUIT_ABILITIES.filter(x => x.cost === cost).map(x =>
          option(x.name, a(x.slug), { abilityKind: 'heroic', costQuote: `cost: ${cost} Piety` }),
        ),
      ),
    ),
  ];
}
