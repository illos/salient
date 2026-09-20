// SPDX-License-Identifier: GPL-3.0-only
/** Actions available from possessed starting treasures, Compendium
 * fb83a789da8f0327a389c277a0c790b1648d5810. App labels name otherwise unnamed prose actions.
 * Quotes are verbatim source excerpts. Leveled weapons include only their first-level properties.
 * Timing not specified in the source stays unspecified; manual invocation is not automation.
 * All 12 core first-echelon trinkets and 14 leveled weapons were checked (V86 audit).
 * Gecko Gloves and eight weapons grant modifiers/passive effects without a separate level-one
 * action, so they do not appear here. Retain their source item separately.
 * Select these entries from actual persisted possessions, never from draft initial-item previews.
 * Broken, absent and unrevealed/inoperative items cannot grant these actions.
 */
export interface StartingItemAbilitySource {
  item: string;
  name: string;
  sourcePath: string;
  actionType: string;
  quote: string;
  trigger?: string;
  activationCondition?: string;
  cost?: string;
}

export const STARTING_ITEM_ABILITIES: StartingItemAbilitySource[] = [
  {
    item: 'Color Cloak (Blue)',
    name: 'Color Cloak (Blue): Cold Shift',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/color-cloak-blue.md',
    actionType: 'Triggered action',
    quote:
      "While worn, a blue Color Cloak grants you cold immunity equal to your level.\n\nAdditionally, when you are targeted by any effect that deals cold damage, you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to [shift](scc.v1:mcdm.heroes.v1/movement/shifting) a number of squares equal to your level. If you do so, the cold immunity granted by the cloak becomes cold weakness with the same value until the end of the next round. You can't use this [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) again until this weakness ends.",
    activationCondition:
      'Wear the cloak; its cold immunity must not currently be replaced by weakness. Effects and conditions are resolved manually.',
    trigger: 'You are targeted by an effect that deals cold damage.',
  },
  {
    item: 'Color Cloak (Red)',
    name: 'Color Cloak (Red): Negate Fire Damage',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/color-cloak-red.md',
    actionType: 'Triggered action',
    quote:
      "While worn, a red Color Cloak grants you fire immunity equal to your level.\n\nAdditionally, when you are targeted by any effect that deals fire damage, you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to reduce the damage to 0. If you do so, the fire immunity granted by this cloak becomes fire weakness with the same value until the end of the next round. You can't use this [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) again until this weakness ends.",
    activationCondition:
      'Wear the cloak; its fire immunity must not currently be replaced by weakness. Effects and conditions are resolved manually.',
    trigger: 'You are targeted by an effect that deals fire damage.',
  },
  {
    item: 'Color Cloak (Yellow)',
    name: 'Color Cloak (Yellow): Lightning Charge',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/color-cloak-yellow.md',
    actionType: 'Triggered action',
    quote:
      "While worn, a yellow Color Cloak grants you lightning immunity equal to your level.\n\nAdditionally, when you are targeted by any effect that deals lightning damage, you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to cause the next damage-dealing ability you use to deal extra lightning damage equal to your level. Once you deal this extra damage, your lightning immunity becomes lightning weakness with the same value until the end of the next round. You can't use this [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) again until this weakness ends.",
    activationCondition:
      'Wear the cloak; the granted lightning weakness must have ended before using this reaction again. Effects and conditions are resolved manually.',
    trigger: 'You are targeted by an effect that deals lightning damage.',
  },
  {
    item: 'Deadweight',
    name: 'Deadweight: Falling Free Strike',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/deadweight.md',
    actionType: 'Free maneuver',
    quote:
      'While holding the Deadweight, you fall twice as fast, taking an extra 1 damage for each square you fall (to a maximum of 75 total damage from a single fall). If you fall 5 or more squares this way, you can make a [melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) [free strike](scc.v1:mcdm.heroes.v1/feature.common.main-actions/free-strike) as a [free maneuver](scc.v1:mcdm.heroes.v1/rule.combat/free-maneuver) once during the fall before you hit the ground.',
    activationCondition:
      'Hold the Deadweight and fall at least 5 squares; make one melee free strike during this fall before reaching the ground. Effects and conditions are resolved manually.',
    trigger: 'You fall at least 5 squares while holding the Deadweight.',
  },
  {
    item: 'Displacing Replacement Bracer',
    name: 'Displacing Replacement Bracer: Swap Objects',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/displacing-replacement-bracer.md',
    actionType: 'Maneuver',
    quote:
      'As a maneuver, you transfer an object of [size](scc.v1:mcdm.heroes.v1/rule.character/size) 1S or 1T held in one hand with another object of the same [size](scc.v1:mcdm.heroes.v1/rule.character/size) that is within 10 squares. The objects change locations instantaneously and without creating any auditory or visual disturbance. If another creature is wearing or holding the object you transfer to your hand and they have I < 4, they fail to notice the transfer.',
    activationCondition:
      'Exchange a size 1S or 1T object held in one hand with an object of the same size within 10 squares; the printed Intuition potency determines whether a holding or wearing creature notices. Effects and conditions are resolved manually.',
  },
  {
    item: 'Divine Vine',
    name: 'Divine Vine: Distant Grab',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/divine-vine.md',
    actionType: 'Maneuver',
    quote:
      'As a maneuver, you call upon the Divine Vine in Yllyric, causing it to extend up to 5 squares from you and attach its jaws to a creature or object, allowing you to use the [Grab](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/grab) maneuver at a distance. If the target is [grabbed](scc.v1:mcdm.heroes.v1/condition/grabbed), you can choose to keep the divine vine extended, [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) the target [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you, or [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) yourself [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to the target. The divine vine stays attached to the target until it takes damage from a [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), the target escapes your grab, or you call upon the vine to release the target (no action required).',
    activationCondition:
      'Call on the vine in Yllyric; extend it up to 5 squares to a creature or object, with the source pull options when grabbed. Effects and conditions are resolved manually.',
  },
  {
    item: 'Divine Vine',
    name: 'Divine Vine: Release Target',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/divine-vine.md',
    actionType: 'No action required',
    quote:
      'As a maneuver, you call upon the Divine Vine in Yllyric, causing it to extend up to 5 squares from you and attach its jaws to a creature or object, allowing you to use the [Grab](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/grab) maneuver at a distance. If the target is [grabbed](scc.v1:mcdm.heroes.v1/condition/grabbed), you can choose to keep the divine vine extended, [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) the target [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you, or [pull](scc.v1:mcdm.heroes.v1/movement/forced-movement) yourself [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to the target. The divine vine stays attached to the target until it takes damage from a [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), the target escapes your grab, or you call upon the vine to release the target (no action required).',
    activationCondition:
      'The vine is attached to a target; call on it to release that target. Effects and conditions are resolved manually.',
  },
  {
    item: 'Flameshade Gloves',
    name: 'Flameshade Gloves: Pass Through Object',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/flameshade-gloves.md',
    actionType: 'As part of a move action',
    quote:
      "When you use a move action while wearing these gloves, you can place one hand upon a mundane object as part of that move action. If the object is 1 square thick or less and has open space on the other side (for example, a door or wall), you pull your body through it as though the object wasn't there.\n\nIf the object is too thick or has no open space on the other side, your hand becomes stuck inside the object. Removing your hand takes a successful hard [Might](scc.v1:mcdm.heroes.v1/rule.character/might) [test](scc.v1:mcdm.heroes.v1/rule.test/test) made as a main action.",
    activationCondition:
      'Wear the gloves and touch a mundane object; successful passage requires thickness at most 1 square and open space beyond. A failed attempt leaves the hand stuck. Effects and conditions are resolved manually.',
  },
  {
    item: 'Flameshade Gloves',
    name: 'Flameshade Gloves: Free Stuck Hand',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/flameshade-gloves.md',
    actionType: 'Main action',
    quote:
      "When you use a move action while wearing these gloves, you can place one hand upon a mundane object as part of that move action. If the object is 1 square thick or less and has open space on the other side (for example, a door or wall), you pull your body through it as though the object wasn't there.\n\nIf the object is too thick or has no open space on the other side, your hand becomes stuck inside the object. Removing your hand takes a successful hard [Might](scc.v1:mcdm.heroes.v1/rule.character/might) [test](scc.v1:mcdm.heroes.v1/rule.test/test) made as a main action.",
    activationCondition:
      'A failed passage left the hand stuck in the object; success requires a hard Might test. Effects and conditions are resolved manually.',
  },
  {
    item: 'Hellcharger Helm',
    name: 'Hellcharger Helm: Charge Knockback',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/hellcharger-helm.md',
    actionType: 'Free maneuver',
    quote:
      "Whenever you use the [Charge](scc.v1:mcdm.heroes.v1/feature.common.main-actions/charge) main action while wearing this helmet, you gain a +5 [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) to [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) until the end of your current [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn). After charging, you can use the [Knockback](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/knockback) maneuver as a [free maneuver](scc.v1:mcdm.heroes.v1/rule.combat/free-maneuver), regardless of the target creature's [size](scc.v1:mcdm.heroes.v1/rule.character/size).",
    activationCondition:
      'Wear the helm and have just charged; use Knockback regardless of target size. Effects and conditions are resolved manually.',
    trigger: 'After using the Charge main action.',
  },
  {
    item: 'Mask of the Many',
    name: 'Mask of the Many: Transform Appearance',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/mask-of-the-many.md',
    actionType: 'Maneuver',
    quote:
      "While you wear this mask, you can use a maneuver to transform into any humanoid of equivalent [size](scc.v1:mcdm.heroes.v1/rule.character/size) that you have previously seen. The humanoid's appearance reflects the last time you saw them, including whatever they were wearing. Your clothing and gear are transformed into the figure's clothing and gear, absorbed into your body, or retain their original forms, as you determine. If the figure possessed any treasures when you last saw them, they are duplicated as mundane copies while you are transformed.",
    activationCondition:
      'Wear the mask; choose a previously seen humanoid of equivalent size and the appearance of transformed clothing and gear. Copied treasures are mundane. Effects and conditions are resolved manually.',
  },
  {
    item: 'Quantum Satchel',
    name: 'Quantum Satchel: Entangle Location',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/quantum-satchel.md',
    actionType: 'Timing not specified',
    quote:
      "When the brooch is removed from this bag and placed in a container or room, it magically entangles that location to the bag. Any item that can be placed in the Quantum Satchel appears near to the brooch and can be recovered by reaching inside while picturing the desired object. The capacity of the satchel is dictated by the size of the container or room where the entangled brooch is. If an item is removed from the container or room containing the brooch, it can't be retrieved through the satchel.",
    activationCondition:
      'Remove the brooch from the satchel and place it in a container or room to establish the linked location. Effects and conditions are resolved manually.',
  },
  {
    item: 'Quantum Satchel',
    name: 'Quantum Satchel: Retrieve Object',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/quantum-satchel.md',
    actionType: 'Timing not specified',
    quote:
      "When the brooch is removed from this bag and placed in a container or room, it magically entangles that location to the bag. Any item that can be placed in the Quantum Satchel appears near to the brooch and can be recovered by reaching inside while picturing the desired object. The capacity of the satchel is dictated by the size of the container or room where the entangled brooch is. If an item is removed from the container or room containing the brooch, it can't be retrieved through the satchel.",
    activationCondition:
      'Reach inside while picturing the desired object; it must still be in the entangled location and fit through the satchel. Effects and conditions are resolved manually.',
  },
  {
    item: 'Unbinder Boots',
    name: 'Unbinder Boots: Airborne Movement',
    sourcePath: 'en/unified/md/treasure/1st-echelon/trinket/unbinder-boots.md',
    actionType: 'As part of movement',
    quote:
      'These boots can temporarily unbind themselves from the chains of the earth, letting you move through the air as high as 3 squares above the ground from where you started. If you end your [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) while you are still airborne, you fall.',
    activationCondition:
      'Use the boots to move through the air at most 3 squares above the starting ground; fall if still airborne at the end of the turn. Effects and conditions are resolved manually.',
  },
  {
    item: "Authority's End",
    name: "Authority's End: End Imposed Effect",
    sourcePath: 'en/unified/md/treasure/leveled/weapon/authoritys-end.md',
    actionType: 'Maneuver',
    quote:
      'Any weapon ability that deals [rolled damage](scc.v1:mcdm.heroes.v1/rule.damage/rolled-damage) using this weapon gains a +1 damage [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties). Whenever you damage a creature with the weapon, you can immediately use a maneuver to end one effect imposed by that creature on you or another creature within 5 squares of you.',
    activationCondition:
      'Immediately after damaging a creature with this weapon, end one effect it imposed on you or another creature within 5 squares. Effects and conditions are resolved manually.',
    trigger: 'You damage a creature with this weapon.',
  },
  {
    item: 'Blade of the Luxurious Fop',
    name: 'Blade of the Luxurious Fop: Shift After Damage',
    sourcePath: 'en/unified/md/treasure/leveled/weapon/blade-of-the-luxurious-fop.md',
    actionType: 'Timing not specified',
    quote:
      'Any weapon ability that deals [rolled damage](scc.v1:mcdm.heroes.v1/rule.damage/rolled-damage) using this weapon gains a +1 damage [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties). Additionally, whenever you deal [rolled damage](scc.v1:mcdm.heroes.v1/rule.damage/rolled-damage) with this weapon, you can immediately [shift](scc.v1:mcdm.heroes.v1/movement/shifting) 1 square. As well, while you wield or carry the weapon and are present in a negotiation, if an [NPC](scc.v1:mcdm.heroes.v1/rule.general/npc) in the negotiation has the greed, legacy, power, or revelry motivation, their starting interest increases by 1 (to a maximum of 5).',
    activationCondition:
      'Immediately shift 1 square after dealing rolled damage with this weapon. Effects and conditions are resolved manually.',
    trigger: 'You deal rolled damage with this weapon.',
  },
  {
    item: 'Displacer',
    name: 'Displacer: Trade Places',
    sourcePath: 'en/unified/md/treasure/leveled/weapon/displacer.md',
    actionType: 'Maneuver',
    quote:
      "Any weapon ability that deals [rolled damage](scc.v1:mcdm.heroes.v1/rule.damage/rolled-damage) using this weapon deals an extra 1 psychic damage. Additionally, whenever you deal [rolled damage](scc.v1:mcdm.heroes.v1/rule.damage/rolled-damage) to a creature, you can use a maneuver to [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) you and that creature, letting you trade places provided you both fit into each other's spaces.",
    activationCondition:
      'After dealing rolled damage to a creature, trade places with that creature only if both fit the exchanged spaces. Effects and conditions are resolved manually.',
    trigger: 'You deal rolled damage to a creature.',
  },
  {
    item: 'Icemaker Maul',
    name: 'Icemaker Maul: Create Ice Field',
    sourcePath: 'en/unified/md/treasure/leveled/weapon/icemaker-maul.md',
    actionType: 'Maneuver',
    quote:
      'Any weapon ability that deals [rolled damage](scc.v1:mcdm.heroes.v1/rule.damage/rolled-damage) using this weapon deals an extra 1 cold damage. Additionally, you can use a maneuver to create an ice field in a 3 [burst](scc.v1:mcdm.heroes.v1/rule.combat/burst). The ground in this area is [difficult terrain](scc.v1:mcdm.heroes.v1/movement/difficult-terrain) for enemies, and lasts until the end of the encounter or when you use this ability again.',
    activationCondition:
      'Create a 3-burst field of difficult terrain for enemies; it ends with the encounter or when this ability is used again. Effects and conditions are resolved manually.',
  },
  {
    item: 'Lance of the Sundered Star',
    name: 'Lance of the Sundered Star: Follow the Push',
    sourcePath: 'en/unified/md/treasure/leveled/weapon/lance-of-the-sundered-star.md',
    actionType: 'Timing not specified',
    quote:
      'Any weapon ability that deals [rolled damage](scc.v1:mcdm.heroes.v1/rule.damage/rolled-damage) using this weapon deals an extra 1 holy damage. Additionally, when the weapon is used with a weapon ability that allows you to [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) a target, you can [shift](scc.v1:mcdm.heroes.v1/movement/shifting) to any square [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to the target after the [push](scc.v1:mcdm.heroes.v1/movement/forced-movement).',
    activationCondition:
      'After pushing the target with a weapon ability using this weapon, shift to a square adjacent to that target. Effects and conditions are resolved manually.',
    trigger: 'An ability using this weapon pushes its target.',
  },
  {
    item: 'Wetwork',
    name: 'Wetwork: Finishing Free Strike',
    sourcePath: 'en/unified/md/treasure/leveled/weapon/wetwork.md',
    actionType: 'Maneuver',
    quote:
      'Any weapon ability that deals [rolled damage](scc.v1:mcdm.heroes.v1/rule.damage/rolled-damage) using this weapon deals an extra 1 psychic damage. Additionally, if you reduce a creature to 0 [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina) using this weapon, you can immediately use a maneuver to make a [melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) [free strike](scc.v1:mcdm.heroes.v1/feature.common.main-actions/free-strike).',
    activationCondition:
      'Immediately after reducing a creature to 0 Stamina using this weapon, make a melee free strike. Effects and conditions are resolved manually.',
    trigger: 'You reduce a creature to 0 Stamina using this weapon.',
  },
];
