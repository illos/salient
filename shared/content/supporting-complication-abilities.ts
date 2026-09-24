// SPDX-License-Identifier: GPL-3.0-only
/** Source-bound complication abilities and prose activities (V37/V85).
 * V85 prose operations retain literal timing; unspecified timing is not a combat action.
 * Labels qualifying unnamed prose operations are app labels.
 * V37 exact pinned ability text. Embedded complication abilities retain their parent source.
 * Declaring a source grant does not execute it or activate a conditional trait.
 */
import complicationSource from './compendium/complication.json' with { type: 'json' };
import { abilities as dragonKnightProseAbilities } from './ancestries/dragon-knight/abilities.ts';

export interface ComplicationAbilitySource {
  complication: string;
  name: string;
  sourcePath: string;
  text: string;
  kind: 'heroic' | 'complication' | 'signature';
  availability: { decision: string; value: string };
  selectedTrait?: { decision: string; value: string };
  condition?: string;
  /** Present for prose operations; structured abilities use their embedded table. */
  actionType?: string;
  trigger?: string;
  cost?: string;
}
/** Preserve the complete pinned body, including costs, drawbacks and exceptions. */
function prose(
  complication: string,
  name: string,
  actionType: string,
  metadata: Pick<ComplicationAbilitySource, 'condition' | 'trigger' | 'cost'> = {},
): ComplicationAbilitySource {
  const source = complicationSource.find(entry => entry.name === complication);
  if (!source) throw new Error(`Missing complication source: ${complication}`);
  return {
    complication,
    name,
    actionType,
    sourcePath: source.sourcePath.replace('vendor/steel-compendium/', ''),
    text: source.text.split('---').slice(2).join('---').trim(),
    kind: 'complication',
    availability: { decision: 'complication.choice', value: complication },
    ...metadata,
  };
}

export const COMPLICATION_ABILITIES: ComplicationAbilitySource[] = [
  prose('Advanced Studies', 'Advanced Studies: Study Notebook', 'Respite activity', {
    condition:
      'Resolve the highest-characteristic test and its temporary class-ability grant or hostile demon manually.',
  }),
  prose('Animal Form', 'Animal Form', 'Maneuver', {
    condition:
      'Use the specific recorded size-1T animal. Transformation and movement restrictions are resolved manually.',
  }),
  prose('Bereaved', 'Bereaved: Ask the Spirit', 'Special', {
    condition:
      'The Director must identify a particularly good course of action before spending the hero token; otherwise no token is spent.',
    cost: '1 HeroToken',
  }),
  prose('Consuming Interest', 'Consuming Interest: Study Lore', 'Downtime project', {
    condition:
      'Up to three completions for the chosen lore skill, each with a different project source; goals 120, 150, 180. Project progress and benefits are manual.',
  }),
  prose('Crash Landed', 'Crash Landed: Activate Power Pack', 'Maneuver', {
    condition:
      'Choose cold, fire, lightning, or sonic on activation. The selected type replaces damage from damage-dealing abilities until deactivated; resolve manually.',
  }),
  prose('Crash Landed', 'Crash Landed: Deactivate Power Pack', 'Maneuver', {
    condition: 'Your power pack is active; resolve its deactivation manually.',
  }),
  prose('Cult Victim', 'Cult Victim: Pass Through Matter', 'During movement', {
    condition:
      'Once per turn, move through solid matter at most 1 square thick. Ending your turn inside forces you back to the entry space and deals 5 irreducible damage; resolve manually.',
  }),
  prose('Psychic Eruption', 'Psychic Blast: Forced Eruption', 'Free triggered action', {
    trigger: 'Whenever you become bleeding, frightened, or weakened.',
    condition:
      'The complication requires this use when the trigger occurs. Spend all current Heroic Resource; resolve the power roll and damage manually.',
    cost: 'All Heroic Resource',
  }),
  prose('Rogue Talent', 'Telekinetic Grasp: Ranged Free Strike', 'Ranged free strike', {
    condition:
      'Use Telekinetic Grasp as a ranged free strike when entitled to make one; resolve the power roll and push or pull manually.',
  }),
  prose('Curse of Stone', 'Curse of Stone: Stone Appearance', 'Free maneuver', {
    condition:
      'You appear to be a mundane statue while you remain unmoving; resolve appearance manually.',
  }),
  prose('Evanesceria', 'Evanesceria: Absent from Reality', 'Start of combat round', {
    trigger: 'At the start of any combat round.',
    condition:
      'Roll a d10; disappear on 6+, returning when you take your turn. After attempting, earn at least 1 Victory before attempting again. Resolve manually.',
  }),
  prose('Famous Relative', 'Famous Relative: Summon Relative', 'Maneuver', {
    condition:
      'Use the magic jewelry; once summoned, gain a level before summoning again. Relative statistics, duration, lost Victories and diverted Renown are manual.',
  }),
  prose('Feytouched', 'Feytouched: Accept Fey Power', 'Start of combat encounter', {
    trigger: 'At the start of each combat encounter.',
    condition:
      'If chosen, gain 1 additional Heroic Resource and the Director gains 3 Malice; resolve both together manually.',
  }),
  prose('Forbidden Romance', 'Forbidden Romance: Request Favor', 'Special', {
    condition:
      'Ask the betrothed secretly; available aid is constrained and determined with the Director.',
  }),
  prose(
    'Getting Too Old for This',
    'Getting Too Old for This: Use Advanced Ability',
    'On your turn',
    {
      condition:
        'Choose a heroic ability learnable one level higher, meet all other prerequisites and pay its cost. After use, earn at least 2 Victories before using again. Selection, cost and use remain manual.',
    },
  ),
  prose('Gnoll-Mauled', 'Gnoll-Mauled: Retaliate', 'Triggered action', {
    trigger: 'Whenever an ally within 5 squares is reduced to 0 Stamina.',
    condition:
      'Move up to your speed and make a free strike; resolve the movement and strike manually.',
  }),
  prose('Guilty Conscience', 'Guilty Conscience: Stay Alive', 'Free triggered action', {
    trigger: 'When your Stamina reaches the negative of your winded value.',
    cost: '1 Recovery',
    condition:
      'The Recovery expenditure is recorded; its Stamina restoration must be resolved manually.',
  }),
  prose('Hawk Rider', 'Hawk Rider: Summon Hawk', '1 uninterrupted minute', {
    condition:
      'You are outside a building or other structure. Only you can ride the hawk; summon and mount state are manual.',
  }),
  prose('Hawk Rider', 'Hawk Rider: Dismiss Hawk', 'No action', {
    condition: 'Your hawk is present; resolve dismissal manually.',
  }),
  prose('Hawk Rider', 'Hawk Rider: Restore Hawk', 'Respite activity', {
    condition: 'Your hawk is damaged or dead; restore them to full Stamina manually.',
  }),
  prose('Host Body', 'Host Body: Transfer Host', 'Main action', {
    condition:
      'Current host alive or dead no more than 24 hours; dead humanoid of a playable ancestry within 10 squares. Resolve ancestry replacement, old-host death, 1 Stamina and optional Recovery manually.',
  }),
  prose('Hunted', 'Hunted: Lay Low', 'Respite activity', {
    condition:
      'One or more creatures are pursuing you. They lose your party location and restart their search; resolve manually.',
  }),
  prose('Loner', 'Loner: Choose Respite Skill', 'End of respite', {
    trigger: 'When you finish a respite.',
    condition:
      'Choose a skill you do not have; it lasts until the end of your next respite. Skill configuration remains manual.',
  }),
  prose('Master Chef', 'Master Chef: Prepare Meal', '1 uninterrupted hour', {
    condition:
      'After finishing a respite or waking from a night’s sleep, with ingredients and cooking tools; up to ten creatures. Each meal benefit may be used once within 24 hours; resolve manually.',
  }),
  prose('Preacher', 'Preacher: Convert Follower', 'Respite activity', {
    condition:
      'Director sets Presence test difficulty and follower type. After a successful conversion, gain a level before trying again; failure consequences remain manual.',
  }),
  prose('Prisoner of the Synlirii', 'Prisoner of the Synlirii: Telepathy', 'Special', {
    condition:
      'Creature within 10 squares, shared language, both aware of each other. The target may reply; voiceless talkers within 1 mile can overhear. Resolve communication manually.',
  }),
  prose('Secret Identity', 'Secret Identity: Resume True Identity', 'Special', {
    condition:
      'Treat Wealth and Renown as 2 higher while in true identity; daily discovery chance increases by 20 percent cumulatively while hunted. Resolve manually.',
  }),
  prose('Secret Identity', 'Secret Identity: Resume Secret Identity', 'Special', {
    condition:
      'After 1 day in secret identity, the cumulative discovery chance resets. Resolve manually.',
  }),
  prose('Self-Taught', 'Self-Taught: Forgo Heroic Resource', 'Start of your turn', {
    trigger: 'At the start of each of your turns during combat.',
    condition:
      'Forgo gaining Heroic Resource until the start of your next turn in exchange for a highest-characteristic strike damage bonus over that period. For a class whose Heroic Resource the app generates, declare it before the turn starts with /resource forgo; the app then adds nothing and refuses claims until your next turn start. Resolve the damage bonus manually.',
  }),
  prose('Shared Spirit', 'Shared Spirit: Determine Controller', 'Start of day', {
    condition:
      'Roll a d6 (1–4 self, 5–6 spirit), or choose if on good terms; only the controller’s exclusive skill set applies. Controller and skills remain manual.',
  }),
  prose('Silent Sentinel', 'Silent Sentinel: Telepathy', 'Special', {
    condition:
      'Share a language and observe each other; recipient may respond telepathically. Resolve communication manually.',
  }),
  prose('Stolen Face', 'Stolen Face: Change Face', '5 uninterrupted minutes', {
    condition:
      'Resemble a previously observed creature of your ancestry or restore your face; hair and nonfacial features do not change. Resolve appearance manually.',
  }),
  prose('Waking Dreams', 'Waking Dreams: Receive Vision', 'During respite', {
    trigger: 'Whenever you take a respite.',
    condition:
      'Make a Reason test; tier 1 loses 1 Recovery after the respite, higher tiers receive visions. Resolve manually.',
  }),
  prose('War Dog Collar', 'War Dog Collar: Reset Collar', '1 uninterrupted minute outside combat', {
    condition:
      'Reset after using Posthumous Retirement before that ability can be used again; resolve the reset manually.',
  }),
  prose('War of Assassins', 'War of Assassins: Call in Favor', 'Special', {
    condition:
      'At most three favors; the request must be reasonable and within the faction’s power. Resolve favor and uses manually.',
  }),
  ...dragonKnightProseAbilities.map((source): ComplicationAbilitySource => ({
    complication: 'Dragon Dreams',
    name: source.name,
    sourcePath: source.sourcePath,
    text: source.quote,
    actionType: source.actionType,
    ...(source.trigger ? { trigger: source.trigger } : {}),
    kind: 'complication',
    availability: { decision: 'complication.choice', value: 'Dragon Dreams' },
    selectedTrait: { decision: 'complication.dragon-dreams.traits', value: source.trait },
    condition: '5 or more Victories',
  })),
  {
    complication: 'Corrupted Mentor',
    name: 'Corrupt Spirit',
    sourcePath: 'en/unified/md/complication/corrupted-mentor.md',
    text: "###### Corrupt Spirit\n\n*You unlock the sinister secrets of pain.*\n\n| **Magic**   | **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|-------------|-------------:|\n| **📏 Self** |  **🎯 Self** |\n\n**Effect:** Until the end of your [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), whenever you use a damage-dealing [heroic ability](scc.v1:mcdm.heroes.v1/rule.general/heroic-ability) against a single target, you can weaken that target's life force. The ability deals extra corruption damage equal to your highest [characteristic](scc.v1:mcdm.heroes.v1/rule.character/characteristic) score.",
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'Corrupted Mentor',
    },
  },
  {
    complication: 'Grounded',
    name: 'Motivate Earth',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/motivate-earth.md',
    text: '*The earth rises, falls, or opens up at your command.*\n\n| **Earth, Magic, [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)** | **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|-------------------------|----------------:|\n| **📏 [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1**          |  **🎯 Special** |\n\n**Effect:** You touch a square containing mundane dirt, stone, or metal and create a 5 wall of the same material, which rises up out of the ground and must include the square you touched.\n\nAlternatively, you touch a structure made of mundane dirt, stone, or metal that occupies 2 or more squares. You can open a 1-square opening in the structure where you touched it. You can instead touch an existing doorway or other opening that is 1 square or smaller in a mundane dirt, stone, or metal surface. The opening is sealed by the same material that makes up the surface.',
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'Grounded',
    },
  },
  {
    complication: 'Lost Your Head',
    name: 'Share Head',
    sourcePath: 'en/unified/md/complication/lost-your-head.md',
    text: "###### Share Head\n\n*You don't have a head, but you can psionically borrow another.*\n\n| **Psionic, [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)** |                **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|---------------------|----------------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10**    | **🎯 One willing creature** |\n\n**Effect:** You can see, hear, and smell as if you were in the target's space. Additionally, you can borrow their mouth to speak when you wish to do so, speaking in your own voice. This effect ends when you use Share Head on a different target, when the target moves more than 10 squares away from you, or when the target is no longer willing to share their head with you.",
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'Lost Your Head',
    },
  },
  {
    complication: 'Medium',
    name: 'Contact Spirits',
    sourcePath: 'en/unified/md/complication/medium.md',
    text: "###### Contact Spirits\n\n*The restless dead speak to you.*\n\n| **Magic**   | **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|-------------|----------------:|\n| **📏 Self** |     **🎯 Self** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Intuition](scc.v1:mcdm.heroes.v1/rule.character/intuition) or [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence):**\n\n- **≤11:** You take corruption damage equal to 5 + your level.\n- **12-16:** The spirit of anyone you know of who has died speaks to you, provided they are on the same world as you. You learn how they died and can ask them one question, which they can answer truthfully or untruthfully. The spirit knows everything they knew in life, and is aware of events that took place in their immediate surroundings since their death.\n- **17+:** As tier 2, but you can ask three questions.\n\n**Effect:** If any sapient creatures have died nearby within the last 24 hours, you have a double [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on the [power roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) for this ability if any of those creatures were hostile to you, or a double [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) if any of them were friendly to you. When you use this ability, you can't do so again until you earn 1 or more [Victories](scc.v1:mcdm.heroes.v1/rule.resource/victories).",
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'Medium',
    },
  },
  {
    complication: 'Medusa Blood',
    name: 'Stone Eyes',
    sourcePath: 'en/unified/md/complication/medusa-blood.md',
    text: "###### Stone Eyes\n\n*Your looks don't kill—they petrify.*\n\n| **Magic, [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged), [Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)** |     **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|---------------------------|--------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10**          | **🎯 One creature** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence):**\n\n- **≤11:** 2 damage; M < WEAK, [slowed](scc.v1:mcdm.heroes.v1/condition/slowed) (save ends)\n- **12-16:** 4 damage; M < AVERAGE, [slowed](scc.v1:mcdm.heroes.v1/condition/slowed) (save ends)\n- **17+:** 6 damage; M < STRONG, [slowed](scc.v1:mcdm.heroes.v1/condition/slowed) (save ends)\n\n**Effect:** This ability has no effect on a creature who can't see you or who purposefully avoids looking at your eyes. A creature reduced to 0 [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina) by this ability is turned to inanimate stone.",
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'Medusa Blood',
    },
  },
  {
    complication: 'Psychic Eruption',
    name: 'Psychic Blast',
    cost: 'All Heroic Resource',
    sourcePath: 'en/unified/md/complication/psychic-eruption.md',
    text: '###### Psychic Blast (Special Heroic Resource Cost)\n\n*Psionic energy [bursts](scc.v1:mcdm.heroes.v1/rule.combat/burst) from your body in an iridescent shimmer.*\n\n| **Area, Psionic** |                  **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|-------------------|---------------------------------:|\n| **📏 3 [burst](scc.v1:mcdm.heroes.v1/rule.combat/burst)**    | **🎯 Each creature in the area** |\n\n**Effect:** Using this ability costs all your [Heroic Resource](scc.v1:mcdm.heroes.v1/rule.resource/heroic-resource).\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + Your Highest [Characteristic](scc.v1:mcdm.heroes.v1/rule.character/characteristic) Score:**\n\n- **≤11:** 1 psychic damage for each [Heroic Resource](scc.v1:mcdm.heroes.v1/rule.resource/heroic-resource) you spend, to a maximum equal to your level\n- **12-16:** 1 psychic damage for each [Heroic Resource](scc.v1:mcdm.heroes.v1/rule.resource/heroic-resource) you spend, to a maximum equal to your level + your highest [characteristic](scc.v1:mcdm.heroes.v1/rule.character/characteristic)\n- **17+:** 1 psychic damage for each [Heroic Resource](scc.v1:mcdm.heroes.v1/rule.resource/heroic-resource) you spend',
    kind: 'heroic',
    availability: {
      decision: 'complication.choice',
      value: 'Psychic Eruption',
    },
  },
  {
    complication: 'Rogue Talent',
    name: 'Telekinetic Grasp',
    sourcePath: 'en/unified/md/complication/rogue-talent.md',
    text: '###### Telekinetic Grasp\n\n*You reach out with your mind to move a creature or object.*\n\n| **Psionic, [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged), [Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)**   |                  **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|-------------------------------|------------------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10**              | **🎯 One creature or object** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might), [Intuition](scc.v1:mcdm.heroes.v1/rule.character/intuition), or [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence):**\n\n- **≤11:** [Push](scc.v1:mcdm.heroes.v1/movement/forced-movement) or [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1\n- **12-16:** [Push](scc.v1:mcdm.heroes.v1/movement/forced-movement) or [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\n- **17+:** [Push](scc.v1:mcdm.heroes.v1/movement/forced-movement) or [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) 3',
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'Rogue Talent',
    },
  },
  {
    complication: 'Stripped of Rank',
    name: 'Issue Order',
    sourcePath: 'en/unified/md/complication/stripped-of-rank.md',
    text: '###### Issue Order\n\n*"Move or die, folks."*\n\n| **[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)**       | **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|------------------|----------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10** | **🎯 One ally** |\n\n**Effect:** The target can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to take a main action, a maneuver, or a move action.\n\n**Special:** If you have the [Strike Now](scc.v1:mcdm.heroes.v1/feature.ability.tactician.level-1/strike-now) [tactician](scc.v1:mcdm.heroes.v1/class/tactician) ability, the target can use a free [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) instead of a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to gain the benefit of this ability.',
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'Stripped of Rank',
    },
  },
  {
    complication: 'War Dog Collar',
    name: 'Posthumous Retirement',
    sourcePath: 'en/unified/md/complication/war-dog-collar.md',
    text: "###### Posthumous Retirement\n\n*You make your modified collar explode.*\n\n| **Area, Magic** |                  **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|-----------------|------------------------------:|\n| **📏 1 [burst](scc.v1:mcdm.heroes.v1/rule.combat/burst)**  | **🎯 Each enemy in the area** |\n\n**Effect:** Your loyalty collar detonates, dealing fire damage equal to 5 plus your level to each target. Once you use this ability, you can't use it again until you spend 1 uninterrupted minute out of combat resetting the collar.",
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'War Dog Collar',
    },
  },
  {
    complication: 'Waterborn',
    name: 'Rogue Wave',
    sourcePath: 'en/unified/md/complication/waterborn.md',
    text: '###### Rogue Wave\n\n*You summon a wave of water to batter your foe.*\n\n| **Magic, [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged), [Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)** |               **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|---------------------------| -----------------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10**          | **🎯 One creature or object** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + Your Highest [Characteristic](scc.v1:mcdm.heroes.v1/rule.character/characteristic) Score:**\n\n- **≤11:** 2 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) or [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1\n- **12-16:** 5 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) or [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\n- **17+:** 7 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) or [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) 3\n\n**Effect:** You can forgo dealing damage with this ability.',
    kind: 'complication',
    availability: {
      decision: 'complication.choice',
      value: 'Waterborn',
    },
  },
  {
    complication: 'Dragon Dreams',
    name: 'Dragon Breath',
    sourcePath: 'en/unified/md/feature/ability/dragon-knight/dragon-breath.md',
    text: "*A furious exhalation of energy washes over your foes.*\n\n| **Area, Magic**        |               **Main action** |\n|------------------------|------------------------------:|\n| **📏 3 [cube](scc.v1:mcdm.heroes.v1/rule.combat/cube) within 1** | **🎯 Each enemy in the area** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence):**\n\n- **≤11:** 2 damage\n- **12-16:** 4 damage\n- **17+:** 6 damage\n\n**Effect:** You choose the ability's [damage type](scc.v1:mcdm.heroes.v1/rule.damage/damage-type) from acid, cold, corruption, fire, lightning, or poison.",
    kind: 'signature',
    availability: {
      decision: 'complication.choice',
      value: 'Dragon Dreams',
    },
    selectedTrait: {
      decision: 'complication.dragon-dreams.traits',
      value: 'Dragon Breath',
    },
    condition: '5 or more Victories',
  },
  {
    complication: 'Dragon Dreams',
    name: 'Draconian Pride',
    sourcePath: 'en/unified/md/feature/ability/dragon-knight/draconian-pride.md',
    text: "*You let loose a mighty roar to shake your foes' spirits.*\n\n| **Area, Magic** |               **Main action** |\n|-----------------|------------------------------:|\n| **📏 1 [burst](scc.v1:mcdm.heroes.v1/rule.combat/burst)**  | **🎯 Each enemy in the area** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence):**\n\n- **≤11:** 2 damage\n- **12-16:** 5 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1\n- **17+:** 7 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2",
    kind: 'signature',
    availability: {
      decision: 'complication.choice',
      value: 'Dragon Dreams',
    },
    selectedTrait: {
      decision: 'complication.dragon-dreams.traits',
      value: 'Draconian Pride',
    },
    condition: '5 or more Victories',
  },
];
