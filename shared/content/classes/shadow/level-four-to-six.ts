// SPDX-License-Identifier: GPL-3.0-only
/** Pinned Shadow advancement, levels four through six. */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';
const feature = (level: number, slug: string) => path(`feature/shadow/level-${level}/${slug}`);
const ability = (level: number, name: string) =>
  path(
    `feature/ability/shadow/level-${level}/${name.toLowerCase().replaceAll(' ', '-').replaceAll('!', '')}`,
  );
const stamina = (level: number) =>
  auto(
    `class.shadow.level-${level}.stamina`,
    'class.choice',
    'Shadow',
    path('class/shadow'),
    'Stamina Gained at 2nd and Higher Levels: 6',
    [grant('statistic', 'Stamina +6', path('class/shadow'))],
  );
const perk = (level: number) =>
  choice(
    `class.shadow.level-${level}.perk`,
    'class.choice',
    'Shadow',
    feature(level, 'perk'),
    'You gain one perk of your choice.',
    CORE_PERKS.map(p => option(p.name, p.source)),
    { label: `Level ${level} perk` },
  );
const heroic = (level: number, name: string) =>
  option(name, ability(level, name), { abilityKind: 'heroic', costQuote: 'cost: 9 Insight' });
export const shadowLaterDecisions: Record<number, Decision[]> = {
  4: [
    stamina(4),
    perk(4),
    auto(
      'class.shadow.level-4.agility',
      'class.choice',
      'Shadow',
      path('feature/shadow/level-4/characteristic-increase'),
      'Your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score increases to 3. Additionally, you can increase one of your [characteristic](scc.v1:mcdm.heroes.v1/rule.character/characteristic) scores by 1, to a maximum of 3.',
      [grant('statistic', 'Agility 3', path('feature/shadow/level-4/characteristic-increase'))],
    ),
    choice(
      'class.shadow.level-4.characteristic',
      'class.choice',
      'Shadow',
      path('feature/shadow/level-4/characteristic-increase'),
      'Your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score increases to 3. Additionally, you can increase one of your [characteristic](scc.v1:mcdm.heroes.v1/rule.character/characteristic) scores by 1, to a maximum of 3.',
      ['Might', 'Reason', 'Intuition', 'Presence'].map(name =>
        option(name, path('feature/shadow/level-4/characteristic-increase')),
      ),
      {
        label: 'Level 4 characteristic increase',
        dependsOn: ['class.shadow.array-assignment'],
        note: 'Agility becomes 3; raise one other characteristic by 1, to a maximum of 3.',
      },
    ),
    {
      ...choice(
        'class.shadow.level-4.skill',
        'class.choice',
        'Shadow',
        feature(4, 'skill'),
        'You gain one skill of your choice.',
        [],
      ),
      options: undefined,
      optionsFrom: [
        'pool.skills.crafting',
        'pool.skills.exploration',
        'pool.skills.interpersonal',
        'pool.skills.intrigue',
        'pool.skills.lore',
      ],
      selectionRole: 'skill',
      ownedPool: { kind: 'skill', exclude: true },
      label: 'Level 4 skill',
    },
    auto(
      'class.shadow.level-4.keep-it-down',
      'class.choice',
      'Shadow',
      feature(4, 'keep-it-down'),
      "While conversing with any creature you share a language with, you can decide whether anyone else can perceive what you're conveying, even while yelling.",
      [grant('class-feature', 'Keep It Down', feature(4, 'keep-it-down'))],
    ),
    auto(
      'class.shadow.level-4.night-watch',
      'class.choice',
      'Shadow',
      feature(4, 'night-watch'),
      'Your sense for stealth shows those around you how to evade notice. While you are hidden, enemies take a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to search for you or other hidden creatures within 10 squares of you.',
      [
        grant('class-feature', 'Night Watch', feature(4, 'night-watch')),
        grant('class-ability', 'Night Watch', ability(4, 'Night Watch')),
      ],
    ),
    auto(
      'class.shadow.level-4.surge-of-insight',
      'class.choice',
      'Shadow',
      feature(4, 'surge-of-insight'),
      'The first time each [combat round](scc.v1:mcdm.heroes.v1/rule.combat/combat-round) that you deal damage incorporating 1 or more [surges](scc.v1:mcdm.heroes.v1/rule.resource/surge), you gain 2 insight instead of 1.',
      [grant('class-feature', 'Surge of Insight', feature(4, 'surge-of-insight'))],
    ),
  ],
  5: [
    stamina(5),
    {
      ...auto(
        'class.shadow.level-5.trail-of-cinders',
        'class.shadow.college',
        'Black Ash',
        feature(5, '5th-level-college-feature'),
        'Your [shadow college](scc.v1:mcdm.heroes.v1/feature.shadow.level-1/shadow-college) grants you a feature, as shown on the 5th-Level College Features table.',
        [grant('class-feature', 'Trail of Cinders', feature(5, 'trail-of-cinders'))],
      ),
      dependsOn: ['class.shadow.college'],
    },
    {
      ...auto(
        'class.shadow.level-5.volatile-reagents',
        'class.shadow.college',
        'Caustic Alchemy',
        feature(5, '5th-level-college-feature'),
        'Your [shadow college](scc.v1:mcdm.heroes.v1/feature.shadow.level-1/shadow-college) grants you a feature, as shown on the 5th-Level College Features table.',
        [grant('class-feature', 'Volatile Reagents', feature(5, 'volatile-reagents'))],
      ),
      dependsOn: ['class.shadow.college'],
    },
    {
      ...auto(
        'class.shadow.level-5.harlequin-gambit',
        'class.shadow.college',
        'Harlequin Mask',
        feature(5, '5th-level-college-feature'),
        'Your [shadow college](scc.v1:mcdm.heroes.v1/feature.shadow.level-1/shadow-college) grants you a feature, as shown on the 5th-Level College Features table.',
        [grant('class-feature', 'Harlequin Gambit', feature(5, 'harlequin-gambit'))],
      ),
      dependsOn: ['class.shadow.college'],
    },
    choice(
      'class.shadow.level-5.ability-9',
      'class.choice',
      'Shadow',
      feature(5, '9-insight-ability'),
      'Choose one [heroic ability](scc.v1:mcdm.heroes.v1/rule.general/heroic-ability) from the following options, each of which costs 9 insight to use.',
      ['Blackout', 'Into the Shadows', 'Shadowfall', 'You Talk Too Much'].map(name =>
        heroic(5, name),
      ),
      { label: 'Level 5 9-Insight ability' },
    ),
  ],
  6: [
    stamina(6),
    perk(6),
    auto(
      'class.shadow.level-6.umbral-form',
      'class.choice',
      'Shadow',
      feature(6, 'umbral-form'),
      'As a maneuver, you lose control of yourself, becoming a shadow creature dripping with ash. This transformation lasts until the end of the encounter, until you are [dying](scc.v1:mcdm.heroes.v1/rule.health/dying), or after 1 uninterrupted hour of quiet focus outside of combat. You gain the following effects while in this form:',
      [grant('class-feature', 'Umbral Form', feature(6, 'umbral-form'))],
    ),
    choice(
      'class.shadow.level-6.black-ash-ability',
      'class.shadow.college',
      'Black Ash',
      feature(6, '6th-level-college-ability'),
      'Your [shadow college](scc.v1:mcdm.heroes.v1/feature.shadow.level-1/shadow-college) grants your choice of one of two [heroic abilities](scc.v1:mcdm.heroes.v1/rule.general/heroic-ability).',
      ['Black Ash Eruption', 'Cinderstorm'].map(name => heroic(6, name)),
      { label: 'Level 6 Black Ash ability', dependsOn: ['class.shadow.college'] },
    ),
    choice(
      'class.shadow.level-6.caustic-alchemy-ability',
      'class.shadow.college',
      'Caustic Alchemy',
      feature(6, '6th-level-college-ability'),
      'Your [shadow college](scc.v1:mcdm.heroes.v1/feature.shadow.level-1/shadow-college) grants your choice of one of two [heroic abilities](scc.v1:mcdm.heroes.v1/rule.general/heroic-ability).',
      ['One Vial Makes You Better', 'One Vial Makes You Faster'].map(name => heroic(6, name)),
      { label: 'Level 6 Caustic Alchemy ability', dependsOn: ['class.shadow.college'] },
    ),
    choice(
      'class.shadow.level-6.harlequin-mask-ability',
      'class.shadow.college',
      'Harlequin Mask',
      feature(6, '6th-level-college-ability'),
      'Your [shadow college](scc.v1:mcdm.heroes.v1/feature.shadow.level-1/shadow-college) grants your choice of one of two [heroic abilities](scc.v1:mcdm.heroes.v1/rule.general/heroic-ability).',
      ['Look!', 'Puppet Strings'].map(name => heroic(6, name)),
      { label: 'Level 6 Harlequin Mask ability', dependsOn: ['class.shadow.college'] },
    ),
  ],
};
