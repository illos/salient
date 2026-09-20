// SPDX-License-Identifier: GPL-3.0-only
/**
 * V92 level-one Shadow content. Every quote is verbatim (links stripped) from the cited file under
 * the pinned Compendium; see docs/build/V92-shadow-level-one.md for the design table.
 */
import type { ClassProfile, Decision, DecisionDefinitions } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';

const shadow = path('class/shadow');
const feature = (slug: string) => path(`feature/shadow/level-1/${slug}`);
const ability = (slug: string) => path(`feature/ability/shadow/level-1/${slug}`);
const characteristicsQuote =
  'You start with an Agility of 2, and you can choose one of the following arrays for your other characteristic scores:';
const triggeredQuote =
  'Your shadow college grants you a triggered action, as shown on the College Triggered Actions table.';
const skillPools = ['pool.skills.exploration', 'pool.skills.interpersonal', 'pool.skills.intrigue'];

export const classProfile: ClassProfile = {
  fixedCharacteristics: { Agility: 2 },
  assignmentDecisionId: 'class.shadow.array-assignment',
  arrayDecisionId: 'class.shadow.characteristic-array',
  fixedDecisionId: 'class.shadow.fixed-characteristics',
  baselineDecisionId: 'class.shadow.baseline',
  subclassDecisionId: 'class.shadow.college',
  source: shadow,
  characteristicsQuote,
  startingStamina: 18,
  recoveries: 8,
  potencyCharacteristic: 'A',
  resource: 'insight',
  resourceSource: feature('insight'),
  resourceQuote: 'building up a Heroic Resource called insight',
  resourceOutsideCombatQuote:
    "Although you can't gain insight outside of combat, you can use your heroic abilities and effects that cost insight without spending it.",
  kit: 'required',
};

/**
 * One college option: its skill, class ability, optional extra feature and triggered action. Ability
 * grants carry no quote: the ability files hold the ability itself, and provenance falls back to the
 * granting decision's sentence (feature/shadow/level-1/<slug>.md says only "You have the following
 * ability.").
 */
const college = (
  value: string,
  skill: string,
  maneuver: { name: string; slug: string },
  triggered: { name: string; slug: string },
  extraFeature?: { name: string; slug: string },
) =>
  option(value, feature('shadow-college'), {
    grants: [
      grant('skill', skill, feature('shadow-college'), `You have the ${skill} skill.`),
      grant('class-ability', maneuver.name, ability(maneuver.slug)),
      ...(extraFeature
        ? [grant('class-feature', extraFeature.name, feature(extraFeature.slug))]
        : []),
      grant('aspect-ability', triggered.name, ability(triggered.slug)),
    ],
  });

const abilityOption = (name: string, abilityKind: 'signature' | 'heroic', costQuote?: string) =>
  option(name, ability(name.toLowerCase().replace(/[^a-z0-9]+/g, '-')), {
    abilityKind,
    ...(costQuote ? { costQuote } : {}),
  });

export function getLevelOneDecisions(pools: DecisionDefinitions['pools']): Decision[] {
  const skillValues = ['Criminal Underworld'];
  const skillOptions = [
    ...new Set([...skillValues, ...skillPools.flatMap(id => pools[id]?.values ?? [])]),
  ];
  return [
    auto(
      'class.shadow.fixed-characteristics',
      'class.choice',
      'Shadow',
      shadow,
      'You start with an Agility of 2',
      [grant('characteristic', 'Agility 2')],
    ),
    choice(
      'class.shadow.characteristic-array',
      'class.choice',
      'Shadow',
      shadow,
      characteristicsQuote,
      ['2, 2, −1, −1', '2, 1, 1, −1', '2, 1, 0, 0', '1, 1, 1, 0'].map(value =>
        option(value, shadow),
      ),
    ),
    {
      id: 'class.shadow.array-assignment',
      kind: 'choice',
      shape: { type: 'assignment', targets: ['Might', 'Reason', 'Intuition', 'Presence'] },
      dependsOn: ['class.shadow.characteristic-array'],
      source: shadow,
      quote: characteristicsQuote,
    },
    auto(
      'class.shadow.baseline',
      'class.choice',
      'Shadow',
      shadow,
      'Starting Stamina at 1st Level: 18',
      [
        grant('statistic', 'Starting Stamina at 1st Level: 18', shadow),
        grant('statistic', 'Recoveries: 8', shadow),
        grant(
          'potency',
          'Weak Potency: Agility − 2; Average Potency: Agility − 1; Strong Potency: Agility',
        ),
      ],
    ),
    auto(
      'class.shadow.skills.fixed',
      'class.choice',
      'Shadow',
      shadow,
      'You gain the Hide and Sneak skills',
      [grant('skill', 'Hide', shadow), grant('skill', 'Sneak', shadow)],
    ),
    {
      id: 'class.shadow.skills',
      kind: 'choice',
      shape: { type: 'multi', count: 5 },
      availableWhen: { decision: 'class.choice', value: 'Shadow' },
      dependsOn: ['class.choice'],
      source: shadow,
      quote:
        'Then choose any five skills from Criminal Underworld or the skills of the exploration, interpersonal, or intrigue skill groups.',
      optionsByParent: {
        Shadow: {
          source: shadow,
          quote:
            'Then choose any five skills from Criminal Underworld or the skills of the exploration, interpersonal, or intrigue skill groups.',
          values: skillValues,
          optionsFrom: skillPools,
        },
      },
      supportedInV001: skillOptions,
    },
    auto('class.shadow.features', 'class.choice', 'Shadow', shadow, 'Shadow Advancement Table', [
      grant('class-feature', 'Shadow College', feature('shadow-college')),
      grant('class-feature', 'Insight', feature('insight')),
      grant('class-feature', 'College Features', feature('1st-level-college-features')),
      grant('class-feature', 'College Triggered Action', feature('college-triggered-action')),
      grant('class-feature', 'Kit', feature('kit')),
      grant('class-feature', 'Shadow Abilities', feature('shadow-abilities')),
      grant('class-ability', 'Hesitation Is Weakness', ability('hesitation-is-weakness')),
    ]),
    choice(
      'class.shadow.college',
      'class.choice',
      'Shadow',
      feature('shadow-college'),
      'You graduated from a shadow college chosen from the following options, each of which grants you a skill.',
      [
        college(
          'Black Ash',
          'Magic',
          { name: 'Black Ash Teleport', slug: 'black-ash-teleport' },
          { name: 'In All This Confusion', slug: 'in-all-this-confusion' },
        ),
        college(
          'Caustic Alchemy',
          'Alchemy',
          { name: 'Coat the Blade', slug: 'coat-the-blade' },
          { name: 'Defensive Roll', slug: 'defensive-roll' },
          { name: 'Smoke Bomb', slug: 'smoke-bomb' },
        ),
        college(
          'Harlequin Mask',
          'Lie',
          { name: "I'm No Threat", slug: 'im-no-threat' },
          { name: 'Clever Trick', slug: 'clever-trick' },
        ),
      ],
      {
        featureRule: {
          source: feature('1st-level-college-features'),
          quote:
            'Your shadow college grants you one or two features, as shown on the 1st-Level College Features table.',
        },
        triggeredRule: { source: feature('college-triggered-action'), quote: triggeredQuote },
        note: 'Option values shorten the source names College of Black Ash, College of Caustic Alchemy and College of the Harlequin Mask to mirror the Fury aspect values; Forge Steel (vendor/forge-steel/src/data/classes/shadow) uses the full source names.',
      },
    ),
    choice(
      'class.shadow.signature-ability',
      'class.choice',
      'Shadow',
      feature('shadow-abilities'),
      'Choose one signature ability from the following options.',
      [
        'Gasping in Pain',
        'I Work Better Alone',
        'Teamwork Has Its Place',
        'You Were Watching the Wrong One',
      ].map(name => abilityOption(name, 'signature')),
    ),
    choice(
      'class.shadow.ability-3',
      'class.choice',
      'Shadow',
      feature('shadow-abilities'),
      'Choose one heroic ability from the following options, each of which costs 3 insight to use.',
      ['Disorienting Strike', 'Eviscerate', 'Get In Get Out', 'Two Throats at Once'].map(name =>
        abilityOption(name, 'heroic', 'cost: 3 Insight'),
      ),
    ),
    choice(
      'class.shadow.ability-5',
      'class.choice',
      'Shadow',
      feature('shadow-abilities'),
      'Choose one heroic ability from the following options, each of which costs 5 insight to use.',
      ['Coup de Grace', 'One Hundred Throats', 'Setup', 'Shadowstrike'].map(name =>
        abilityOption(name, 'heroic', 'cost: 5 Insight'),
      ),
    ),
  ];
}
