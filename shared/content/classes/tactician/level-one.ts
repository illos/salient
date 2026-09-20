// SPDX-License-Identifier: GPL-3.0-only
/**
 * V94 level-one Tactician content. Every quote is verbatim (links stripped) from the cited file
 * under the pinned Compendium; see docs/build/V94-tactician-level-one.md for the design table.
 */
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import type { KitBenefit } from '../../../contracts/characterEvaluation.ts';
import {
  FIELD_ARSENAL,
  FIELD_ARSENAL_PATH,
  KIT_BENEFITS,
  SECOND_KIT_DECISION,
  arsenalDecisionId,
} from '../../../evaluate/classes/tactician.ts';
import { ORDINARY_KIT_NAMES } from '../../supporting-kits.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const tactician = path('class/tactician');
const feature = (slug: string) => path(`feature/tactician/level-1/${slug}`);
const ability = (slug: string) => path(`feature/ability/tactician/level-1/${slug}`);
const characteristicsQuote =
  'You start with a Might of 2 and a Reason of 2, and you can choose one of the following arrays for your other characteristic scores:';
const skillsQuote =
  'Then choose any two skills from Alertness, Architecture, Blacksmithing, Brag, Culture, Empathize, Fletching, Mechanics, Monsters, Search, Strategy, or the skills of the exploration skill group.';
const doctrineQuote =
  'you choose a tactical doctrine from the following options, each of which grants you a skill.';
const triggeredQuote =
  'Your tactical doctrine grants you a triggered action, as shown on the Doctrine Triggered Actions table.';
const namedSkills = [
  'Alertness',
  'Architecture',
  'Blacksmithing',
  'Brag',
  'Culture',
  'Empathize',
  'Fletching',
  'Mechanics',
  'Monsters',
  'Search',
  'Strategy',
];

export const classProfile: ClassProfile = {
  fixedCharacteristics: { Might: 2, Reason: 2 },
  assignmentDecisionId: 'class.tactician.array-assignment',
  arrayDecisionId: 'class.tactician.characteristic-array',
  fixedDecisionId: 'class.tactician.fixed-characteristics',
  baselineDecisionId: 'class.tactician.baseline',
  subclassDecisionId: 'class.tactician.doctrine',
  source: tactician,
  characteristicsQuote,
  startingStamina: 21,
  recoveries: 10,
  potencyCharacteristic: 'R',
  resource: 'focus',
  resourceSource: feature('focus'),
  resourceQuote: 'granting you a Heroic Resource called focus',
  resourceOutsideCombatQuote:
    "Though you can't gain focus outside of combat, you can use your heroic abilities and effects that cost focus without spending it.",
  kit: 'required',
};

/**
 * One doctrine option: its feature and triggered action. The doctrine's skill is a separate choice
 * from a skill group (`class.tactician.doctrine-skill`). Ability grants carry no quote: the ability
 * files hold the ability itself (the doctrine tables say only which one is granted).
 */
const doctrine = (
  value: string,
  doctrineFeature: { name: string; slug: string },
  triggered: { name: string; slug: string },
) =>
  option(value, feature('tactical-doctrine'), {
    grants: [
      grant('class-feature', doctrineFeature.name, feature(doctrineFeature.slug)),
      grant('aspect-ability', triggered.name, ability(triggered.slug)),
    ],
  });

const abilityOption = (name: string, costQuote: string) =>
  option(
    name,
    ability(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    ),
    {
      abilityKind: 'heroic',
      costQuote,
    },
  );

const benefitLabels: Record<KitBenefit, string> = {
  stamina: 'Stamina',
  speed: 'speed',
  stability: 'stability',
  disengage: 'disengage',
  meleeDamage: 'melee damage',
  rangedDamage: 'ranged damage',
  meleeDistance: 'melee distance',
  rangedDistance: 'ranged distance',
};

/** Field Arsenal decisions for the kit step: the second kit and one choice per overlapping benefit. */
export function getKitStepDecisions(optionSources: Record<string, string> | undefined): Decision[] {
  return [
    {
      id: SECOND_KIT_DECISION,
      label: 'Second kit',
      kind: 'choice',
      shape: { type: 'single', count: 1 },
      availableWhen: { decision: 'class.choice', value: 'Tactician' },
      dependsOn: ['kit.choice'],
      source: FIELD_ARSENAL_PATH,
      quote: FIELD_ARSENAL.twoKits.quote,
      optionsFrom: ['pool.kits.standard'],
      ...(optionSources ? { optionSources } : {}),
      selectedPool: { decision: 'kit.choice', exclude: true },
      supportedInV001: [...ORDINARY_KIT_NAMES],
      note: 'Whenever you would choose or change one kit, you can choose or change your second kit as well. Stormwight kits stay with Beast Shape (Q-R-103).',
    },
    ...KIT_BENEFITS.map((benefit): Decision => ({
      id: arsenalDecisionId(benefit),
      label: `Field Arsenal: ${benefitLabels[benefit]} bonus from`,
      kind: 'choice',
      shape: { type: 'single', count: 1 },
      availableWhen: { decision: 'class.choice', value: 'Tactician' },
      dependsOn: ['kit.choice', SECOND_KIT_DECISION],
      overlapBenefit: benefit,
      source: FIELD_ARSENAL_PATH,
      quote: FIELD_ARSENAL.sameBenefit.quote,
      supportedInV001: [...ORDINARY_KIT_NAMES],
      note: 'Offered only while both kits print different values for this benefit; a damage bonus is one whole tuple (the Battle Grace example).',
    })),
  ];
}

export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  const skillOptions = [
    ...new Set([...namedSkills, ...(pools['pool.skills.exploration']?.values ?? [])]),
  ];
  const doctrineSkillPools: Record<string, string> = {
    Insurgent: 'intrigue',
    Mastermind: 'lore',
    Vanguard: 'interpersonal',
  };
  return [
    auto(
      'class.tactician.fixed-characteristics',
      'class.choice',
      'Tactician',
      tactician,
      'You start with a Might of 2 and a Reason of 2',
      [
        grant('characteristic', 'Might 2', tactician),
        grant('characteristic', 'Reason 2', tactician),
      ],
    ),
    choice(
      'class.tactician.characteristic-array',
      'class.choice',
      'Tactician',
      tactician,
      characteristicsQuote,
      ['2, −1, −1', '1, 1, −1', '1, 0, 0'].map(value => option(value, tactician)),
    ),
    {
      id: 'class.tactician.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Agility', 'Intuition', 'Presence'] },
      dependsOn: ['class.tactician.characteristic-array'],
      source: tactician,
      quote: characteristicsQuote,
    },
    auto(
      'class.tactician.baseline',
      'class.choice',
      'Tactician',
      tactician,
      'Starting Stamina at 1st Level: 21',
      [
        grant('statistic', 'Starting Stamina at 1st Level: 21', tactician),
        grant('statistic', 'Recoveries: 10', tactician),
        grant(
          'potency',
          'Weak Potency: Reason − 2; Average Potency: Reason − 1; Strong Potency: Reason',
          tactician,
        ),
      ],
    ),
    auto(
      'class.tactician.skills.fixed',
      'class.choice',
      'Tactician',
      tactician,
      'You gain the Lead skill',
      [grant('skill', 'Lead', tactician)],
    ),
    {
      id: 'class.tactician.skills',
      kind: 'choice',
      shape: { type: 'multi', count: 2 },
      availableWhen: { decision: 'class.choice', value: 'Tactician' },
      dependsOn: ['class.choice'],
      source: tactician,
      quote: skillsQuote,
      optionsByParent: {
        Tactician: {
          source: tactician,
          quote: skillsQuote,
          values: namedSkills,
          optionsFrom: ['pool.skills.exploration'],
        },
      },
      supportedInV001: skillOptions,
    },
    auto(
      'class.tactician.features',
      'class.choice',
      'Tactician',
      tactician,
      'Tactician Advancement Table',
      [
        grant('class-feature', 'Tactical Doctrine', feature('tactical-doctrine')),
        grant('class-feature', 'Focus', feature('focus')),
        grant('class-feature', 'Doctrine Feature', feature('1st-level-doctrine-feature')),
        grant('class-feature', 'Doctrine Triggered Action', feature('doctrine-triggered-action')),
        grant('class-feature', 'Field Arsenal', feature('field-arsenal')),
        grant('class-feature', 'Kit Signature Ability', feature('kit-signature-ability')),
        grant('class-feature', 'Mark', feature('mark')),
        grant('class-feature', 'Strike Now', feature('strike-now')),
        grant('class-feature', 'Tactician Abilities', feature('tactician-abilities')),
        grant('class-ability', 'Mark', ability('mark')),
        grant('class-ability', '"Strike Now!"', ability('strike-now')),
      ],
    ),
    choice(
      'class.tactician.doctrine',
      'class.choice',
      'Tactician',
      feature('tactical-doctrine'),
      doctrineQuote,
      [
        doctrine(
          'Insurgent',
          { name: 'Covert Operations', slug: 'covert-operations' },
          { name: 'Advanced Tactics', slug: 'advanced-tactics' },
        ),
        doctrine(
          'Mastermind',
          { name: 'Studied Commander', slug: 'studied-commander' },
          { name: 'Overwatch', slug: 'overwatch' },
        ),
        doctrine(
          'Vanguard',
          { name: 'Commanding Presence', slug: 'commanding-presence' },
          { name: 'Parry', slug: 'parry' },
        ),
      ],
      {
        featureRule: {
          source: feature('1st-level-doctrine-feature'),
          quote:
            'Your tactical doctrine grants you a feature, as shown on the 1st-Level Doctrine Features table.',
        },
        triggeredRule: { source: feature('doctrine-triggered-action'), quote: triggeredQuote },
        note: 'Studied Commander grants a conditioned Reason-test respite activity. Mark grants a paid free trigger and free retarget. These actions are listed and recorded through the shared route; narrative effects and trigger adjudication remain manual.',
      },
    ),
    {
      id: 'class.tactician.doctrine-skill',
      label: 'Doctrine skill',
      kind: 'choice',
      shape: { type: 'single', count: 1 },
      availableWhen: { decision: 'class.choice', value: 'Tactician' },
      dependsOn: ['class.tactician.doctrine'],
      source: feature('tactical-doctrine'),
      quote: doctrineQuote,
      optionsByParent: Object.fromEntries(
        Object.entries(doctrineSkillPools).map(([value, group]) => [
          value,
          {
            source: feature('tactical-doctrine'),
            quote: `You gain a skill from the ${group} skill group.`,
            optionsFrom: [`pool.skills.${group}`],
          },
        ]),
      ),
      supportedInV001: [
        ...new Set(
          Object.values(doctrineSkillPools).flatMap(
            group => pools[`pool.skills.${group}`]?.values ?? [],
          ),
        ),
      ],
    },
    choice(
      'class.tactician.ability-3',
      'class.choice',
      'Tactician',
      feature('tactician-abilities'),
      'Choose one heroic ability from the following options, each of which costs 3 focus to use.',
      ['Battle Cry', 'Concussive Strike', 'Inspiring Strike', 'Squad! Forward!'].map(name =>
        abilityOption(name, 'cost: 3 Focus'),
      ),
    ),
    choice(
      'class.tactician.ability-5',
      'class.choice',
      'Tactician',
      feature('5-focus-ability'),
      'Choose one heroic ability from the following options, each of which costs 5 focus to use.',
      ['Hammer and Anvil', 'Mind Game', 'Now!', 'This Is What We Planned For'].map(name =>
        abilityOption(name, 'cost: 5 Focus'),
      ),
    ),
  ];
}
