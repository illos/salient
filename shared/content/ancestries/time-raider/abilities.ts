// SPDX-License-Identifier: GPL-3.0-only
import type { AncestryAbilitySource } from '../../ancestry-abilities.ts';
export const timeRaiderAbilities: AncestryAbilitySource[] = [
  {
    "name": "Beyondsight",
    "ancestry": "Time Raider",
    "trait": "Beyondsight",
    "sourcePath": "en/unified/md/feature/trait/time-raider/beyondsight.md",
    "decisionId": "ancestry.time-raider.purchased-traits",
    "selection": "Beyondsight",
    "actionType": "Maneuver",
    "group": "maneuver",
    "quote": "As a maneuver, you can adjust your vision to allow you to see through mundane obstructions that are 1 square thick or less. While your vision is adjusted this way, you can't see the area within 1 square of you and you don't have [line of effect](scc.v1:mcdm.heroes.v1/rule.combat/line-of-effect) to any creature or object in that area. You can restore your usual vision as a maneuver."
  },
  {
    "name": "Foresight",
    "ancestry": "Time Raider",
    "trait": "Foresight",
    "sourcePath": "en/unified/md/feature/trait/time-raider/foresight.md",
    "decisionId": "ancestry.time-raider.purchased-traits",
    "selection": "Foresight",
    "actionType": "Triggered action",
    "group": "triggered",
    "quote": "Your senses extend past mundane obscuration and the veil of the future alike. You automatically know the location of any creature with [concealment](scc.v1:mcdm.heroes.v1/rule.combat/concealment) who isn't hidden from you within 20, and you negate the usual [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on [strikes](scc.v1:mcdm.heroes.v1/rule.combat/strike) against such creatures. Additionally, whenever you are targeted by a [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to impose a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on the [power roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll).",
    "trigger": "Whenever you are targeted by a strike."
  }
];
