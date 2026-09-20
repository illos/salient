import { revenantAbilities } from './ancestries/revenant/abilities.ts';
import { timeRaiderAbilities } from './ancestries/time-raider/abilities.ts';
import { abilities as dragonKnightAbilities } from './ancestries/dragon-knight/abilities.ts';
import { abilities as highElfAbilities } from './ancestries/high-elf/abilities.ts';
import { memonekAbilities } from './ancestries/memonek/abilities.ts';
// SPDX-License-Identifier: GPL-3.0-only
/** Ancestry traits also expose their granted actions. Source text, not automation.
 * Authority: pinned Steel Compendium fb83a789da8f0327a389c277a0c790b1648d5810.
 * Runtime rune selection is separate from character-build purchases.
 */
export interface AncestryAbilitySource {
  name: string;
  ancestry: string;
  trait: string;
  sourcePath: string;
  decisionId: string;
  selection?: string;
  rune?: 'Detection' | 'Light' | 'Voice';
  actionType: string;
  group: 'maneuver' | 'triggered' | 'other';
  trigger?: string;
  activationCondition?: string;
  quote: string;
}

export const ANCESTRY_ABILITIES: AncestryAbilitySource[] = [
  ...revenantAbilities,
  ...timeRaiderAbilities,
  ...dragonKnightAbilities,
  ...highElfAbilities,
  ...memonekAbilities,
  {
    name: 'Glowing Eyes',
    ancestry: 'Devil',
    trait: 'Glowing Eyes',
    sourcePath: 'en/unified/md/feature/trait/devil/glowing-eyes.md',
    decisionId: 'ancestry.devil.purchased-traits',
    selection: 'Glowing Eyes',
    actionType: 'Triggered action',
    group: 'triggered',
    quote:
      'Your eyes are a solid, vibrant color that flares to show your excitement or rage. Whenever you take damage from a creature, you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to deal that creature psychic damage equal to 1d10 + your level.',
    trigger: 'Whenever you take damage from a creature.',
  },
  {
    name: 'Reactive Tumble',
    ancestry: 'Polder',
    trait: 'Reactive Tumble',
    sourcePath: 'en/unified/md/feature/trait/polder/reactive-tumble.md',
    decisionId: 'ancestry.polder.purchased-traits',
    selection: 'Reactive Tumble',
    actionType: 'Free triggered action',
    group: 'triggered',
    quote:
      'Staying light on your feet lets you quickly get back into position. Whenever you are [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement), you can use a free [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to [shift](scc.v1:mcdm.heroes.v1/movement/shifting) 1 square after the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) is resolved.',
    trigger: 'Whenever you are force moved; shift after the forced movement is resolved.',
  },
  {
    name: 'Detect the Supernatural',
    ancestry: 'Human',
    trait: 'Detect the Supernatural',
    sourcePath: 'en/unified/md/feature/trait/human/detect-the-supernatural.md',
    decisionId: 'ancestry.human.signature-trait',
    actionType: 'Maneuver',
    group: 'maneuver',
    quote:
      "As a maneuver, you can open your awareness to detect [supernatural](scc.v1:mcdm.heroes.v1/rule.general/supernatural) creatures and phenomena. Until the end of your next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), you know the location of any [supernatural](scc.v1:mcdm.heroes.v1/rule.general/supernatural) object, or any undead, construct, or creature from another world within 5 squares, even if you don't have [line of effect](scc.v1:mcdm.heroes.v1/rule.combat/line-of-effect) to that object or creature. You know if you're detecting an item or a creature, and you know the nature of any creature you detect.",
  },
  {
    name: 'Determination',
    ancestry: 'Human',
    trait: 'Determination',
    sourcePath: 'en/unified/md/feature/trait/human/determination.md',
    decisionId: 'ancestry.human.purchased-traits',
    selection: 'Determination',
    actionType: 'Maneuver',
    group: 'maneuver',
    quote:
      'A tolerance for pain and distress allows you to push through difficult situations. If you are [frightened](scc.v1:mcdm.heroes.v1/condition/frightened), [slowed](scc.v1:mcdm.heroes.v1/condition/slowed), or [weakened](scc.v1:mcdm.heroes.v1/condition/weakened), you can use a maneuver to immediately end one of those [conditions](scc.v1:mcdm.heroes.v1/rule.combat/condition).',
    activationCondition: 'While frightened, slowed, or weakened.',
  },
  {
    name: 'Resist the Unnatural',
    ancestry: 'Human',
    trait: 'Resist the Unnatural',
    sourcePath: 'en/unified/md/feature/trait/human/resist-the-unnatural.md',
    decisionId: 'ancestry.human.purchased-traits',
    selection: 'Resist the Unnatural',
    actionType: 'Triggered action',
    group: 'triggered',
    quote:
      "Your instinctive resilience protects you from injuries beyond the routine. Whenever you take damage that isn't untyped, you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to take half the damage.",
    trigger: "Whenever you take damage that isn't untyped.",
  },
  {
    name: 'Stone Singer',
    ancestry: 'Dwarf',
    trait: 'Stone Singer',
    sourcePath: 'en/unified/md/feature/trait/dwarf/stone-singer.md',
    decisionId: 'ancestry.dwarf.purchased-traits',
    selection: 'Stone Singer',
    actionType: '1 uninterrupted hour',
    group: 'other',
    quote:
      "You have a magic connection to the earth. When you spend 1 uninterrupted hour singing, you can reshape any unworked mundane stone within 3 squares. You can't destroy this stone, but you can move each square of it anywhere within 3 squares, piling it off to one side to dig a hole or building it up to create a wall.",
  },
  {
    name: 'Doomsight',
    ancestry: 'Hakaan',
    trait: 'Doomsight',
    sourcePath: 'en/unified/md/feature/trait/hakaan/doomsight.md',
    decisionId: 'ancestry.hakaan.purchased-traits',
    selection: 'Doomsight',
    actionType: 'No action required',
    group: 'other',
    quote:
      "Working with your Director, you can predetermine an encounter in which you will die. When that encounter begins, you become doomed. While doomed, you automatically obtain a tier 3 outcome on [tests](scc.v1:mcdm.heroes.v1/rule.test/test) and [ability rolls](scc.v1:mcdm.heroes.v1/rule.dice/ability-roll), and you don't die no matter how low your [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina) falls. You then die immediately at the end of the encounter, and can't be returned to life by any means.\n\nIf you don't predetermine your death encounter, you can choose to become doomed while you are [dying](scc.v1:mcdm.heroes.v1/rule.health/dying) with the Director's approval (no action required). Doing so should be reserved for encounters in which you are [dying](scc.v1:mcdm.heroes.v1/rule.health/dying) as a result of suitable heroism, such as making a last stand against a boss or saving civilians, or when the consequences of your actions have finally caught up to you—not because you're playing a one-shot and have nothing to lose, Hacaarl.\n\nAdditionally, when your [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina) reaches the negative of your [winded](scc.v1:mcdm.heroes.v1/rule.health/winded) value and you are not doomed, you turn to rubble instead of experiencing death. You are unaware of your surroundings in this state, and you can't regain [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina) or have this effect undone in any way. After 12 hours, you regain [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina) equal to your [recovery value](scc.v1:mcdm.heroes.v1/rule.health/recoveries).",
    activationCondition:
      "While dying, if you have not predetermined your death encounter, with the Director's approval.",
  },
  {
    name: 'Relentless',
    ancestry: 'Orc',
    trait: 'Relentless',
    sourcePath: 'en/unified/md/feature/trait/orc/relentless.md',
    decisionId: 'ancestry.orc.signature-trait',
    actionType: 'Not specified by source',
    group: 'other',
    quote:
      'Whenever a creature deals damage to you that leaves you [dying](scc.v1:mcdm.heroes.v1/rule.health/dying), you can make a [free strike](scc.v1:mcdm.heroes.v1/feature.common.main-actions/free-strike) against any creature. If the creature is reduced to 0 [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina) by your [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), you can spend a [Recovery](scc.v1:mcdm.heroes.v1/rule.health/recoveries).',
    trigger: 'Whenever a creature deals damage to you that leaves you dying.',
  },
  {
    name: 'Runic Carving: Detection',
    ancestry: 'Dwarf',
    trait: 'Runic Carving',
    sourcePath: 'en/unified/md/feature/trait/dwarf/runic-carving.md',
    decisionId: 'ancestry.dwarf.signature-trait',
    actionType: 'Maneuver',
    group: 'maneuver',
    quote:
      "**Detection:** Pick a specific type of creature (such as goblins or [humans](scc.v1:mcdm.heroes.v1/ancestry/human)) or object (such as gems or potions). Your rune glows softly when you are within 20 squares of any creature or object of that type, even if you don't have [line of effect](scc.v1:mcdm.heroes.v1/rule.combat/line-of-effect) to the creature or object. You can change the type of creature or object as a maneuver.\n\nYou can have one rune active at a time, and can change or remove a rune with 10 uninterrupted minutes of work.",
    rune: 'Detection',
    activationCondition: 'While the Detection rune is active.',
  },
  {
    name: 'Runic Carving: Light',
    ancestry: 'Dwarf',
    trait: 'Runic Carving',
    sourcePath: 'en/unified/md/feature/trait/dwarf/runic-carving.md',
    decisionId: 'ancestry.dwarf.signature-trait',
    actionType: 'Maneuver',
    group: 'maneuver',
    quote:
      '**Light:** Your skin sheds light for 10 squares. You can [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) this light on and off as a maneuver.\n\nYou can have one rune active at a time, and can change or remove a rune with 10 uninterrupted minutes of work.',
    rune: 'Light',
    activationCondition: 'While the Light rune is active.',
  },
  {
    name: 'Runic Carving: Voice',
    ancestry: 'Dwarf',
    trait: 'Runic Carving',
    sourcePath: 'en/unified/md/feature/trait/dwarf/runic-carving.md',
    decisionId: 'ancestry.dwarf.signature-trait',
    actionType: 'Maneuver',
    group: 'maneuver',
    quote:
      "**Voice:** As a maneuver, you can communicate telepathically with a willing creature you have met before and who is within 1 mile of you. You must know the creature's name, and they must speak and understand a language you know. You and the creature can respond to one another as if having a spoken conversation. You can communicate with a different creature by changing the rune.\n\nYou can have one rune active at a time, and can change or remove a rune with 10 uninterrupted minutes of work.",
    rune: 'Voice',
    activationCondition: 'While the Voice rune is active.',
  },
  {
    name: 'Runic Carving: Carve, Change, or Remove Rune',
    ancestry: 'Dwarf',
    trait: 'Runic Carving',
    sourcePath: 'en/unified/md/feature/trait/dwarf/runic-carving.md',
    decisionId: 'ancestry.dwarf.signature-trait',
    actionType: '10 uninterrupted minutes',
    group: 'other',
    quote:
      'You can carve a rune onto your skin with 10 uninterrupted minutes of work, which is activated by the magic within your body. The rune you carve determines the benefit you receive, chosen from among the following:\n\nYou can have one rune active at a time, and can change or remove a rune with 10 uninterrupted minutes of work.',
  },
];
