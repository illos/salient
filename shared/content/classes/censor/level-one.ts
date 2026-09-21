// SPDX-License-Identifier: GPL-3.0-only
/** Censor Basics and level-one advancement, pinned Compendium; citations travel with decisions. */
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CENSOR_DEITIES } from './deities.ts';
const censor = path('class/censor');
const feature = (slug: string) => path(`feature/censor/level-1/${slug}`);
const ability = (slug: string) => path(`feature/ability/censor/level-1/${slug}`);
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
const characteristicsQuote =
  'You start with a Might of 2 and a Presence of 2, and you can choose one of the following arrays for your other characteristic scores:';
export const CENSOR_DOMAINS = [
  ['Creation', 'Hands of the Maker', 'crafting'],
  ['Death', 'Grave Speech', 'lore'],
  ['Fate', 'Oracular Visions', 'lore'],
  ['Knowledge', 'Blessing of Comprehension', 'lore'],
  ['Life', 'Revitalizing Ritual', 'exploration'],
  ['Love', 'Blessing of Compassion', 'interpersonal'],
  ['Nature', 'Faithful Friend', 'exploration'],
  ['Protection', 'Protective Circle', 'exploration'],
  ['Storm', 'Blessing of Fortunate Weather', 'exploration'],
  ['Sun', 'Inner Light', 'lore'],
  ['Trickery', 'Inspired Deception', 'intrigue'],
  ['War', 'Sanctified Weapon', 'exploration'],
] as const;
export const CENSOR_ABILITIES = [
  {
    name: 'Arrest',
    slug: 'arrest',
    cost: 5,
  },
  {
    name: 'Back Blasphemer!',
    slug: 'back-blasphemer',
    cost: 0,
  },
  {
    name: 'Behold a Shield of Faith!',
    slug: 'behold-a-shield-of-faith',
    cost: 3,
  },
  {
    name: 'Behold the Face of Justice!',
    slug: 'behold-the-face-of-justice',
    cost: 5,
  },
  {
    name: 'Censored',
    slug: 'censored',
    cost: 5,
  },
  {
    name: 'Driving Assault',
    slug: 'driving-assault',
    cost: 3,
  },
  {
    name: 'Every Step... Death!',
    slug: 'every-step-death',
    cost: 0,
  },
  {
    name: 'Halt Miscreant!',
    slug: 'halt-miscreant',
    cost: 0,
  },
  {
    name: 'Purifying Fire',
    slug: 'purifying-fire',
    cost: 5,
  },
  {
    name: 'Repent!',
    slug: 'repent',
    cost: 3,
  },
  {
    name: 'The Gods Punish and Defend',
    slug: 'the-gods-punish-and-defend',
    cost: 3,
  },
  {
    name: 'Your Allies Cannot Save You!',
    slug: 'your-allies-cannot-save-you',
    cost: 0,
  },
] as const;
export const classProfile: ClassProfile = {
  fixedCharacteristics: { Might: 2, Presence: 2 },
  assignmentDecisionId: 'class.censor.array-assignment',
  arrayDecisionId: 'class.censor.characteristic-array',
  fixedDecisionId: 'class.censor.fixed-characteristics',
  baselineDecisionId: 'class.censor.baseline',
  subclassDecisionId: 'class.censor.order',
  source: censor,
  characteristicsQuote,
  startingStamina: 21,
  recoveries: 12,
  potencyCharacteristic: 'P',
  resource: 'wrath',
  resourceSource: feature('wrath'),
  resourceQuote: 'The power you serve grants you a Heroic Resource called wrath',
  resourceOutsideCombatQuote:
    "Though you can't gain wrath outside of combat, you can use your heroic abilities and effects that cost wrath without spending it.",
  kit: 'required',
};
export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  const domains = CENSOR_DOMAINS.map(([name]) => name);
  const ordinaryDomain: Decision = {
    id: 'class.censor.domain',
    label: 'Domain',
    kind: 'choice',
    shape: { type: 'single', count: 1 },
    dependsOnAny: ['class.censor.deity'],
    source: feature('deity-and-domains'),
    quote: 'After choosing your deity, pick one domain from their portfolio.',
    optionsByParent: Object.fromEntries(
      CENSOR_DEITIES.map(deity => [
        deity.source,
        {
          parentValue: deity.name,
          source: deity.source,
          quote: `Domains: ${deity.domains.join(', ')}`,
          values: [...deity.domains],
        },
      ]),
    ),
    supportedInV001: domains,
  };
  const customDomain: Decision = {
    id: 'class.censor.custom-domain',
    label: 'Domain',
    kind: 'choice',
    shape: { type: 'single', count: 1 },
    dependsOn: ['class.censor.custom-portfolio'],
    source: feature('deity-and-domains'),
    quote: 'After choosing your deity, pick one domain from their portfolio.',
    options: domains.map(name => option(name, feature('deity-and-domains'))),
    selectedPool: { decision: 'class.censor.custom-portfolio' },
  };
  return [
    auto(
      'class.censor.fixed-characteristics',
      'class.choice',
      'Censor',
      censor,
      'You start with a Might of 2 and a Presence of 2',
      [grant('characteristic', 'Might 2', censor), grant('characteristic', 'Presence 2', censor)],
    ),
    choice(
      'class.censor.characteristic-array',
      'class.choice',
      'Censor',
      censor,
      characteristicsQuote,
      ['2, −1, −1', '1, 1, −1', '1, 0, 0'].map(value => option(value, censor)),
    ),
    {
      id: 'class.censor.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Agility', 'Reason', 'Intuition'] },
      dependsOn: ['class.censor.characteristic-array'],
      source: censor,
      quote: characteristicsQuote,
    },
    auto(
      'class.censor.baseline',
      'class.choice',
      'Censor',
      censor,
      'Starting Stamina at 1st Level: 21',
      [
        grant('statistic', 'Starting Stamina at 1st Level: 21', censor),
        grant('statistic', 'Recoveries: 12', censor),
        grant(
          'potency',
          'Weak Potency: Presence − 2; Average Potency: Presence − 1; Strong Potency: Presence',
          censor,
        ),
      ],
    ),
    {
      id: 'class.censor.skills',
      kind: 'choice',
      shape: { type: 'multi', count: 2 },
      dependsOn: ['class.choice'],
      availableWhen: { decision: 'class.choice', value: 'Censor' },
      source: censor,
      quote: 'Choose any two skills from the interpersonal or lore skill groups',
      selectionRole: 'skill',
      optionsFrom: ['pool.skills.interpersonal', 'pool.skills.lore'],
      supportedInV001: [
        ...pools['pool.skills.interpersonal']!.values,
        ...pools['pool.skills.lore']!.values,
      ],
    },
    auto('class.censor.features', 'class.choice', 'Censor', censor, 'Censor Advancement Table', [
      ...[
        'Censor Order',
        'Deity and Domains',
        'Wrath',
        'Judgment',
        'Kit',
        'My Life for Yours',
        '1st-Level Domain Feature',
        'Censor Abilities',
      ].map(name => grant('class-feature', name, feature(slug(name)))),
      grant('class-ability', 'Judgment', ability('judgment')),
      grant('class-ability', 'My Life for Yours', ability('my-life-for-yours')),
    ]),
    choice(
      'class.censor.order',
      'class.choice',
      'Censor',
      feature('censor-order'),
      'you choose a censor order from the following options, each of which grants you a skill.',
      [
        ['Exorcist', 'Read Person'],
        ['Oracle', 'Magic'],
        ['Paragon', 'Lead'],
      ].map(([name, skill]) =>
        option(name!, feature('censor-order'), {
          grants: [
            grant('skill', skill!, feature('censor-order'), `You have the ${skill} skill.`),
            grant(
              'class-feature',
              `Judgment Order Benefit: ${name}`,
              feature('judgment-order-benefit'),
            ),
          ],
        }),
      ),
    ),
    choice(
      'class.censor.deity',
      'class.choice',
      'Censor',
      feature('deity-and-domains'),
      'Choose a god or saint who your character reveres from Chapter 14: Gods and Religion, or ask your Director about the deities in your campaign world.',
      [
        ...CENSOR_DEITIES.map(deity => option(deity.name, deity.source)),
        option('Custom deity', feature('deity-and-domains')),
      ],
      {
        label: 'Deity or saint',
        note: 'For a campaign deity, choose Custom deity and record the Director-approved name and four-domain portfolio.',
      },
    ),
    {
      id: 'class.censor.custom-deity-name',
      label: 'Custom deity name',
      kind: 'authored',
      shape: { type: 'text' },
      availableWhen: { decision: 'class.censor.deity', value: 'Custom deity' },
      dependsOn: ['class.censor.deity'],
      requiredText: true,
      decisionActor: 'owner+Director',
      source: feature('deity-and-domains'),
      quote:
        "With the Director's permission, you can also create your own deity and choose four domains to be part of their portfolio.",
    },
    {
      id: 'class.censor.custom-portfolio',
      label: 'Custom deity: four domains',
      kind: 'choice',
      shape: { type: 'multi', count: 4 },
      availableWhen: { decision: 'class.censor.deity', value: 'Custom deity' },
      dependsOn: ['class.censor.deity'],
      decisionActor: 'owner+Director',
      source: feature('deity-and-domains'),
      quote:
        "With the Director's permission, you can also create your own deity and choose four domains to be part of their portfolio.",
      options: domains.map(name => option(name, feature('deity-and-domains'))),
    },
    ordinaryDomain,
    customDomain,
    {
      id: 'class.censor.domain-skill',
      label: 'Domain skill',
      kind: 'choice',
      shape: { type: 'single', count: 1 },
      dependsOnAny: ['class.censor.domain', 'class.censor.custom-domain'],
      selectionRole: 'skill',
      source: feature('1st-level-domain-feature'),
      quote:
        'Additionally, you gain a skill from your domain, chosen from the skill group indicated on the table.',
      optionsByParent: Object.fromEntries(
        CENSOR_DOMAINS.map(([name, , group]) => [
          name,
          { source: feature('1st-level-domain-feature'), optionsFrom: [`pool.skills.${group}`] },
        ]),
      ),
      supportedInV001: [
        ...new Set(CENSOR_DOMAINS.flatMap(([, , group]) => pools[`pool.skills.${group}`]!.values)),
      ],
    },
    ...['class.censor.domain', 'class.censor.custom-domain'].flatMap(parent =>
      CENSOR_DOMAINS.map(([name, feat]) => ({
        ...auto(
          `${parent}.${slug(name)}-feature`,
          parent,
          name,
          feature('1st-level-domain-feature'),
          'You gain a domain feature from your domain, as shown on the 1st-Level Censor Domain Features table.',
          [
            grant('class-feature', feat, feature(slug(feat))),
            ...(['Creation', 'Death', 'Nature'].includes(name)
              ? [grant('class-ability', feat, ability(slug(feat)))]
              : []),
          ],
        ),
        dependsOn: [parent],
      })),
    ),
    ...[0, 3, 5].map(cost =>
      choice(
        `class.censor.${cost ? `ability-${cost}` : 'signature-ability'}`,
        'class.choice',
        'Censor',
        feature('censor-abilities'),
        cost
          ? `Choose one heroic ability from the following options, each of which costs ${cost} wrath to use.`
          : 'Choose one signature ability from the following options.',
        CENSOR_ABILITIES.filter(a => a.cost === cost).map(a =>
          option(a.name, ability(a.slug), {
            abilityKind: cost ? 'heroic' : 'signature',
            ...(cost ? { costQuote: `cost: ${cost} Wrath` } : {}),
          }),
        ),
      ),
    ),
  ];
}
