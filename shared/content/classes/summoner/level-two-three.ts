// SPDX-License-Identifier: GPL-3.0-only
/**
 * Summoner levels two and three: pinned class/summoner.md Basics and Summoner Advancement table,
 * feature/summoner/level-2 and level-3, feature/ability/summoner/level-3. Fixtures are the
 * monster/fixture/<family>/featureblock stat blocks; the family is the circle's portfolio from the
 * Summoner Circle Portfolio table (feature/summoner/level-1/portfolio.md). See V138 scope.
 */
import type { Decision } from '../../../evaluate/definitions.ts';
import { auto, choice, grant, option, path } from '../../decision-builders.ts';
import { CORE_PERKS } from '../../supporting-backgrounds.ts';
import { SUMMONER_CIRCLES } from './level-one.ts';
import { SUMMONER_MINIONS } from './minions.ts';

const base = path('class/summoner');
const feature = (level: number, slug: string) => path(`feature/summoner/level-${level}/${slug}`);
const ability = (slug: string) => path(`feature/ability/summoner/level-3/${slug}`);
const slug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll("'", '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stamina = (level: number) =>
  auto(
    `class.summoner.level-${level}.stamina`,
    'class.choice',
    'Summoner',
    base,
    'Stamina Gained at 2nd and Higher Levels: 6',
  );
const circleDependent = { dependsOn: ['class.summoner.circle'] };

/**
 * Summoner's Dominion fixtures by circle; Stamina is "20 + your level" in each featureblock. Texts are
 * the verbatim featureblock bodies (as minions.ts), so functions need not bundle featureblock.json.
 */
export const SUMMONER_FIXTURES = [
  {
    circle: 'Blight',
    name: 'The Boil',
    sourcePath: path('monster/fixture/demon/featureblock/the-boil'),
    text: "---\nfeatures:\n    - body: Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the boil is I < AVERAGE [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) (EoT) by the boil, or I < WEAK [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) (EoT) by the boil and can't move further from it.\n      effects:\n        - effect: Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the boil is I < AVERAGE [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) (EoT) by the boil, or I < WEAK [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) (EoT) by the boil and can't move further from it.\n      icon: ⭐️\n      name: Hunger Thrush\n    - body: When the boil is destroyed, each enemy within 3 squares of the boil takes acid [damage](scc.v1:mcdm.heroes.v1/rule.damage/damage) equal to your level and is A < STRONG [weakened](scc.v1:mcdm.heroes.v1/condition/weakened) (save ends).\n      effects:\n        - effect: When the boil is destroyed, each enemy within 3 squares of the boil takes acid [damage](scc.v1:mcdm.heroes.v1/rule.damage/damage) equal to your level and is A < STRONG [weakened](scc.v1:mcdm.heroes.v1/condition/weakened) (save ends).\n      icon: ⭐️\n      name: Oh, It Pops\nname: The Boil\nrole: Support\nscc: mcdm.summoner.v1/monster.fixture.demon.featureblock/the-boil\nstats:\n    - name: Stamina\n      value: 20 + your level\n    - name: Size\n      value: \"2\"\nterrain_type: Hazard\ntype: featureblock\n---\n\n*Hazard Support*\n\n| **Stamina:** 20 + your level | **Size:** 2 |\n|------------------------------|------------:|\n\n> ⭐️ **Hunger Thrush**\n>\n> Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the boil is I < AVERAGE [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) (EoT) by the boil, or I < WEAK [taunted](scc.v1:mcdm.heroes.v1/condition/taunted) (EoT) by the boil and can't move further from it.\n\n> ⭐️ **Oh, It Pops**\n>\n> When the boil is destroyed, each enemy within 3 squares of the boil takes acid [damage](scc.v1:mcdm.heroes.v1/rule.damage/damage) equal to your level and is A < STRONG [weakened](scc.v1:mcdm.heroes.v1/condition/weakened) (save ends).\n",
    size: '2',
    traits: ['Hunger Thrush', 'Oh, It Pops'],
  },
  {
    circle: 'Graves',
    name: 'Barrow Gates',
    sourcePath: path('monster/fixture/undead/featureblock/barrow-gates'),
    text: '---\nfeatures:\n    - body: Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the gates is I < AVERAGE [frightened](scc.v1:mcdm.heroes.v1/condition/frightened) (EoT) by the gates. The [potency](scc.v1:mcdm.heroes.v1/rule.character/potency) increases by 1 for [winded](scc.v1:mcdm.heroes.v1/rule.health/winded) enemies.\n      effects:\n        - effect: Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the gates is I < AVERAGE [frightened](scc.v1:mcdm.heroes.v1/condition/frightened) (EoT) by the gates. The [potency](scc.v1:mcdm.heroes.v1/rule.character/potency) increases by 1 for [winded](scc.v1:mcdm.heroes.v1/rule.health/winded) enemies.\n      icon: ⭐️\n      name: The Bell Tolls\n    - body: Each of your undead [minions](scc.v1:mcdm.summoner.v1/feature.summoner.level-1/minions) has [damage immunity](scc.v1:mcdm.heroes.v1/rule.damage/damage-immunity) 2 while occupying a space within 3 squares of the gates.\n      effects:\n        - effect: Each of your undead [minions](scc.v1:mcdm.summoner.v1/feature.summoner.level-1/minions) has [damage immunity](scc.v1:mcdm.heroes.v1/rule.damage/damage-immunity) 2 while occupying a space within 3 squares of the gates.\n      icon: ⭐️\n      name: Undead Dominion\nname: Barrow Gates\nrole: Defender\nscc: mcdm.summoner.v1/monster.fixture.undead.featureblock/barrow-gates\nstats:\n    - name: Stamina\n      value: 20 + your level\n    - name: Size\n      value: "2"\nterrain_type: Fortification\ntype: featureblock\n---\n\n*Fortification Defender*\n\n| **Stamina:** 20 + your level | **Size:** 2 |\n|------------------------------|------------:|\n\n> ⭐️ **The Bell Tolls**\n>\n> Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the gates is I < AVERAGE [frightened](scc.v1:mcdm.heroes.v1/condition/frightened) (EoT) by the gates. The [potency](scc.v1:mcdm.heroes.v1/rule.character/potency) increases by 1 for [winded](scc.v1:mcdm.heroes.v1/rule.health/winded) enemies.\n\n> ⭐️ **Undead Dominion**\n>\n> Each of your undead [minions](scc.v1:mcdm.summoner.v1/feature.summoner.level-1/minions) has [damage immunity](scc.v1:mcdm.heroes.v1/rule.damage/damage-immunity) 2 while occupying a space within 3 squares of the gates.\n',
    size: '2',
    traits: ['The Bell Tolls', 'Undead Dominion'],
  },
  {
    circle: 'Spring',
    name: 'Glade Pond',
    sourcePath: path('monster/fixture/fey/featureblock/glade-pond'),
    text: '---\nfeatures:\n    - body: You and each non-minion ally that enters one or more squares within 3 squares of the pond or starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) there has their [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) increased by 2 until the end of their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n      effects:\n        - effect: You and each non-minion ally that enters one or more squares within 3 squares of the pond or starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) there has their [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) increased by 2 until the end of their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n      icon: ⭐️\n      name: Bubbling Boost\n    - body: Each of your fey [minions](scc.v1:mcdm.summoner.v1/feature.summoner.level-1/minions) that ends their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the pond is hidden until the start of their next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n      effects:\n        - effect: Each of your fey [minions](scc.v1:mcdm.summoner.v1/feature.summoner.level-1/minions) that ends their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the pond is hidden until the start of their next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n      icon: ⭐️\n      name: Overgrowth\nname: Glade Pond\nrole: Ambusher\nscc: mcdm.summoner.v1/monster.fixture.fey.featureblock/glade-pond\nstats:\n    - name: Stamina\n      value: 20 + your level\n    - name: Size\n      value: "2"\nterrain_type: Hazard\ntype: featureblock\n---\n\n*Hazard Ambusher*\n\n| **Stamina:** 20 + your level | **Size:** 2 |\n|------------------------------|------------:|\n\n> ⭐️ **Bubbling Boost**\n>\n> You and each non-minion ally that enters one or more squares within 3 squares of the pond or starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) there has their [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) increased by 2 until the end of their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n\n> ⭐️ **Overgrowth**\n>\n> Each of your fey [minions](scc.v1:mcdm.summoner.v1/feature.summoner.level-1/minions) that ends their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the pond is hidden until the start of their next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n',
    size: '2',
    traits: ['Bubbling Boost', 'Overgrowth'],
  },
  {
    circle: 'Storms',
    name: 'Primordial Crystal',
    sourcePath: path('monster/fixture/elemental/featureblock/primordial-crystal'),
    text: '---\nfeatures:\n    - body: Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the crystal is vertically pulled 3.\n      effects:\n        - effect: Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the crystal is vertically pulled 3.\n      icon: ⭐️\n      name: Magnetic Pull\n    - body: When you or an ally uses a ranged ability that draws a line through the crystal, the distance increases by 5.\n      effects:\n        - effect: When you or an ally uses a ranged ability that draws a line through the crystal, the distance increases by 5.\n      icon: ⭐️\n      name: Elemental Boost\nname: Primordial Crystal\nrole: Artillery\nscc: mcdm.summoner.v1/monster.fixture.elemental.featureblock/primordial-crystal\nstats:\n    - name: Stamina\n      value: 20 + your level\n    - name: Size\n      value: "2"\nterrain_type: Relic\ntype: featureblock\n---\n\n*Relic Artillery*\n\n| **Stamina:** 20 + your level | **Size:** 2 |\n|------------------------------|------------:|\n\n> ⭐️ **Magnetic Pull**\n>\n> Each enemy that starts their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) within 3 squares of the crystal is vertically pulled 3.\n\n> ⭐️ **Elemental Boost**\n>\n> When you or an ally uses a ranged ability that draws a line through the crystal, the distance increases by 5.\n',
    size: '2',
    traits: ['Magnetic Pull', 'Elemental Boost'],
  },
] as const;

export const SUMMONER_WARDS = ['Conjured Ward', 'Emergency Ward', 'Howling Ward', 'Snare Ward'];
export const SUMMONER_SEVEN_ESSENCE = [
  'Blitz Tactics',
  'Cavalry Call',
  'Essence Funnel',
  'Lead By Example',
];

export const levelTwoDecisions: Decision[] = [
  stamina(2),
  choice(
    'class.summoner.level-2.perk',
    'class.choice',
    'Summoner',
    feature(2, 'perk'),
    'You gain an intrigue, lore, or supernatural perk of your choice.',
    CORE_PERKS.filter(perk => ['intrigue', 'lore', 'supernatural'].includes(perk.group)).map(perk =>
      option(perk.name, perk.source),
    ),
  ),
  auto(
    'class.summoner.level-2.features',
    'class.choice',
    'Summoner',
    base,
    'Summoner Advancement',
    [
      grant('class-feature', "Summoner's Dominion", feature(2, 'summoners-dominion')),
      grant('class-feature', 'New Portfolio Minion', feature(2, 'new-portfolio-minion')),
    ],
  ),
  ...SUMMONER_FIXTURES.map((fixture): Decision => ({
    ...auto(
      `class.summoner.level-2.dominion.${fixture.circle.toLowerCase()}`,
      'class.summoner.circle',
      fixture.circle,
      feature(2, 'summoners-dominion'),
      "Your circle allows you to call forth a piece of your portfolio's dominion like any minion.",
      [grant('class-feature', fixture.name, fixture.sourcePath)],
    ),
    ...circleDependent,
  })),
  // Advancement row "1, 1, 3, 3, 5": one 5-essence minion from the circle's portfolio.
  ...SUMMONER_CIRCLES.map(([circle]) =>
    choice(
      `class.summoner.portfolio.${circle.toLowerCase()}.5`,
      'class.summoner.circle',
      circle,
      feature(2, 'new-portfolio-minion'),
      'Your circle allows you to select new minions to add to your portfolio.',
      SUMMONER_MINIONS.filter(m => m.circle === circle && m.cost === 5).map(m =>
        option(m.name, m.sourcePath, {
          grants: [grant('class-feature', m.name, m.sourcePath)],
        }),
      ),
      { ...circleDependent, label: `Level 2 ${circle} 5-essence minion` },
    ),
  ),
];

export const levelThreeDecisions: Decision[] = [
  stamina(3),
  auto(
    'class.summoner.level-3.features',
    'class.choice',
    'Summoner',
    base,
    'Summoner Advancement',
    [grant('class-feature', "Summoner's Kit", feature(3, 'summoners-kit'))],
  ),
  choice(
    'class.summoner.level-3.ward',
    'class.choice',
    'Summoner',
    feature(3, 'summoners-kit'),
    'Choose one of the following wards.',
    SUMMONER_WARDS.map(name =>
      option(name, feature(3, slug(name)), {
        grants: [grant('class-feature', name, feature(3, slug(name)))],
      }),
    ),
    { label: 'Level 3 ward' },
  ),
  choice(
    'class.summoner.level-3.ability-7',
    'class.choice',
    'Summoner',
    feature(3, '7-essence-ability'),
    'Choose one heroic ability from the following options, each of which costs 7 essence to use.',
    SUMMONER_SEVEN_ESSENCE.map(name =>
      option(name, ability(slug(name)), {
        id: slug(name),
        abilityKind: 'heroic',
        costQuote: 'cost: 7 Essence',
      }),
    ),
    { label: 'Level 3 7-Essence ability' },
  ),
];
