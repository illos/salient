// SPDX-License-Identifier: GPL-3.0-only
/** Source quotations and explicitly manual timing for Shadow levels four through six. */
export const SHADOW_LATER_ACTIONS = [
  {
    name: 'Keep It Down: Conceal Conversation',
    sourcePath: 'en/unified/md/feature/shadow/level-4/keep-it-down.md',
    actionType: 'While conversing',
    quote:
      "While conversing with any creature you share a language with, you can decide whether anyone else can perceive what you're conveying, even while yelling.",
    activationCondition:
      'Requires a shared language with the creature. Choose who can perceive this communication; resolve manually.',
  },
  {
    name: 'Surge of Insight: Gain Insight',
    sourcePath: 'en/unified/md/feature/shadow/level-4/surge-of-insight.md',
    actionType: 'First qualifying damage each combat round',
    quote:
      'The first time each [combat round](scc.v1:mcdm.heroes.v1/rule.combat/combat-round) that you deal damage incorporating 1 or more [surges](scc.v1:mcdm.heroes.v1/rule.resource/surge), you gain 2 insight instead of 1.',
    activationCondition:
      'First damage incorporating one or more surges this combat round: gain 2 Insight INSTEAD OF 1. Confirm eligibility and adjust the resource manually, once per round.',
  },
  {
    name: 'Trail of Cinders: Teleport',
    sourcePath: 'en/unified/md/feature/shadow/level-5/trail-of-cinders.md',
    actionType: 'Free maneuver',
    quote:
      "Whenever you reduce a non-minion creature to 0 [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina), you can immediately use a [free maneuver](scc.v1:mcdm.heroes.v1/rule.combat/free-maneuver) to use your [Black Ash Teleport](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/black-ash-teleport) ability.\n\nAdditionally, you can now bring an [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) willing creature along with you whenever you use a shadow ability to [teleport](scc.v1:mcdm.heroes.v1/movement/teleport). The creature appears in an unoccupied space [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to the space into which you [teleport](scc.v1:mcdm.heroes.v1/movement/teleport)ed. If no such space exists, they can't [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) with you.",
    activationCondition:
      'Immediately after you reduce a non-minion creature to 0 Stamina, use Black Ash Teleport. Optional paid extension still costs Insight; record and resolve movement manually.',
  },
  {
    name: 'Trail of Cinders: Passenger',
    sourcePath: 'en/unified/md/feature/shadow/level-5/trail-of-cinders.md',
    actionType: 'Part of a Shadow teleport',
    quote:
      "Whenever you reduce a non-minion creature to 0 [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina), you can immediately use a [free maneuver](scc.v1:mcdm.heroes.v1/rule.combat/free-maneuver) to use your [Black Ash Teleport](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/black-ash-teleport) ability.\n\nAdditionally, you can now bring an [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) willing creature along with you whenever you use a shadow ability to [teleport](scc.v1:mcdm.heroes.v1/movement/teleport). The creature appears in an unoccupied space [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to the space into which you [teleport](scc.v1:mcdm.heroes.v1/movement/teleport)ed. If no such space exists, they can't [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) with you.",
    activationCondition:
      'Only with an adjacent willing creature and an unoccupied adjacent arrival space. Resolve the passenger teleport manually.',
  },
  {
    name: 'Volatile Reagents: Fire',
    sourcePath: 'en/unified/md/feature/shadow/level-5/volatile-reagents.md',
    actionType: 'When you take damage',
    quote:
      "Whenever you take damage, each enemy [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you takes fire, acid, or poison damage (your choice) equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score.\n\nAdditionally, your [Defensive Roll](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/defensive-roll) ability now allows you to [shift](scc.v1:mcdm.heroes.v1/movement/shifting) up to 5 squares, including [shifting](scc.v1:mcdm.heroes.v1/movement/shifting) vertically. If you don't end this [shift](scc.v1:mcdm.heroes.v1/movement/shifting) on solid ground and are not [flying](scc.v1:mcdm.heroes.v1/movement/fly), you fall.",
    activationCondition:
      'After you take damage, each adjacent enemy takes Agility fire damage. Resolve adjacency and damage manually; do not apply all three alternatives.',
  },
  {
    name: 'Volatile Reagents: Acid',
    sourcePath: 'en/unified/md/feature/shadow/level-5/volatile-reagents.md',
    actionType: 'When you take damage',
    quote:
      "Whenever you take damage, each enemy [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you takes fire, acid, or poison damage (your choice) equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score.\n\nAdditionally, your [Defensive Roll](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/defensive-roll) ability now allows you to [shift](scc.v1:mcdm.heroes.v1/movement/shifting) up to 5 squares, including [shifting](scc.v1:mcdm.heroes.v1/movement/shifting) vertically. If you don't end this [shift](scc.v1:mcdm.heroes.v1/movement/shifting) on solid ground and are not [flying](scc.v1:mcdm.heroes.v1/movement/fly), you fall.",
    activationCondition:
      'After you take damage, each adjacent enemy takes Agility acid damage. Resolve adjacency and damage manually; do not apply all three alternatives.',
  },
  {
    name: 'Volatile Reagents: Poison',
    sourcePath: 'en/unified/md/feature/shadow/level-5/volatile-reagents.md',
    actionType: 'When you take damage',
    quote:
      "Whenever you take damage, each enemy [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you takes fire, acid, or poison damage (your choice) equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score.\n\nAdditionally, your [Defensive Roll](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/defensive-roll) ability now allows you to [shift](scc.v1:mcdm.heroes.v1/movement/shifting) up to 5 squares, including [shifting](scc.v1:mcdm.heroes.v1/movement/shifting) vertically. If you don't end this [shift](scc.v1:mcdm.heroes.v1/movement/shifting) on solid ground and are not [flying](scc.v1:mcdm.heroes.v1/movement/fly), you fall.",
    activationCondition:
      'After you take damage, each adjacent enemy takes Agility poison damage. Resolve adjacency and damage manually; do not apply all three alternatives.',
  },
  {
    name: 'Volatile Reagents: Defensive Roll',
    sourcePath: 'en/unified/md/feature/shadow/level-5/volatile-reagents.md',
    actionType: 'Part of Defensive Roll',
    quote:
      "Whenever you take damage, each enemy [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you takes fire, acid, or poison damage (your choice) equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score.\n\nAdditionally, your [Defensive Roll](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/defensive-roll) ability now allows you to [shift](scc.v1:mcdm.heroes.v1/movement/shifting) up to 5 squares, including [shifting](scc.v1:mcdm.heroes.v1/movement/shifting) vertically. If you don't end this [shift](scc.v1:mcdm.heroes.v1/movement/shifting) on solid ground and are not [flying](scc.v1:mcdm.heroes.v1/movement/fly), you fall.",
    activationCondition:
      'When resolving Defensive Roll, replace shift 2 with shift up to 5, including vertically; fall if ending without solid ground or flight. Retain half damage, trigger timing, Hide and optional paid potency reduction. Resolve manually.',
  },
  {
    name: 'Harlequin Gambit: Escape',
    sourcePath: 'en/unified/md/feature/shadow/level-5/harlequin-gambit.md',
    actionType: 'Free maneuver',
    quote:
      "Whenever you reduce an [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) non-minion creature to 0 [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina), you can immediately use a [free maneuver](scc.v1:mcdm.heroes.v1/rule.combat/free-maneuver) to use your [I'm No Threat](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/im-no-threat) ability and then move up to your [speed](scc.v1:mcdm.heroes.v1/rule.character/speed).\n\nIf the creature is the same [size](scc.v1:mcdm.heroes.v1/rule.character/size) as you, you can disguise yourself as them using [I'm No Threat](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/im-no-threat) without spending insight. If you do, while [I'm No Threat](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/im-no-threat) is active, the creature's body is disguised to look like your body. The illusion ends on their body if another creature physically interacts with it. When the illusion would end for either you or the creature's body, it ends for both.",
    activationCondition:
      "Immediately after reducing an adjacent non-minion to 0 Stamina, use I'm No Threat then move up to speed. Resolve manually; normal paid disguise stays paid unless the same-size condition holds.",
  },
  {
    name: 'Harlequin Gambit: Disguise',
    sourcePath: 'en/unified/md/feature/shadow/level-5/harlequin-gambit.md',
    actionType: 'Part of Harlequin Gambit',
    quote:
      "Whenever you reduce an [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) non-minion creature to 0 [Stamina](scc.v1:mcdm.heroes.v1/rule.health/stamina), you can immediately use a [free maneuver](scc.v1:mcdm.heroes.v1/rule.combat/free-maneuver) to use your [I'm No Threat](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/im-no-threat) ability and then move up to your [speed](scc.v1:mcdm.heroes.v1/rule.character/speed).\n\nIf the creature is the same [size](scc.v1:mcdm.heroes.v1/rule.character/size) as you, you can disguise yourself as them using [I'm No Threat](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/im-no-threat) without spending insight. If you do, while [I'm No Threat](scc.v1:mcdm.heroes.v1/feature.ability.shadow.level-1/im-no-threat) is active, the creature's body is disguised to look like your body. The illusion ends on their body if another creature physically interacts with it. When the illusion would end for either you or the creature's body, it ends for both.",
    activationCondition:
      'Only after reducing an adjacent same-size non-minion to 0 Stamina: disguise as that creature without Insight; its body looks like yours. Physical interaction with the body or either illusion ending ends both. Resolve manually.',
  },
  {
    name: 'Umbral Form',
    sourcePath: 'en/unified/md/feature/shadow/level-6/umbral-form.md',
    actionType: 'Maneuver',
    quote:
      "As a maneuver, you lose control of yourself, becoming a shadow creature dripping with ash. This transformation lasts until the end of the encounter, until you are [dying](scc.v1:mcdm.heroes.v1/rule.health/dying), or after 1 uninterrupted hour of quiet focus outside of combat. You gain the following effects while in this form:\n\n- You can automatically climb at full [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) while moving.\n- Enemies' spaces don't count as [difficult terrain](scc.v1:mcdm.heroes.v1/movement/difficult-terrain) for you. An enemy takes corruption damage equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score the first time you pass through their space on a [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n- If you end your [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) with [cover](scc.v1:mcdm.heroes.v1/rule.combat/cover) or [concealment](scc.v1:mcdm.heroes.v1/rule.combat/concealment) from another creature, you are automatically hidden from that creature.\n- You gain 1 [surge](scc.v1:mcdm.heroes.v1/rule.resource/surge) at the start of each of your [turns](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n- You have corruption immunity equal to 5 + your level.\n- Creatures gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [strikes](scc.v1:mcdm.heroes.v1/rule.combat/strike) against you.\n- You take a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to interact with other creatures.",
    activationCondition:
      'Activate manually until encounter end, dying, or one uninterrupted hour of quiet focus outside combat. While active: climb full speed, ignore enemy-space difficult terrain, corruption immunity 5 + level; enemies gain edge on strikes against you and you take a bane on Presence interaction tests. Other source benefits also remain manual. No permanent baseline bonuses or invented at-will exit.',
  },
  {
    name: 'Umbral Form: Passage',
    sourcePath: 'en/unified/md/feature/shadow/level-6/umbral-form.md',
    actionType: 'Part of movement',
    quote:
      "As a maneuver, you lose control of yourself, becoming a shadow creature dripping with ash. This transformation lasts until the end of the encounter, until you are [dying](scc.v1:mcdm.heroes.v1/rule.health/dying), or after 1 uninterrupted hour of quiet focus outside of combat. You gain the following effects while in this form:\n\n- You can automatically climb at full [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) while moving.\n- Enemies' spaces don't count as [difficult terrain](scc.v1:mcdm.heroes.v1/movement/difficult-terrain) for you. An enemy takes corruption damage equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score the first time you pass through their space on a [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n- If you end your [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) with [cover](scc.v1:mcdm.heroes.v1/rule.combat/cover) or [concealment](scc.v1:mcdm.heroes.v1/rule.combat/concealment) from another creature, you are automatically hidden from that creature.\n- You gain 1 [surge](scc.v1:mcdm.heroes.v1/rule.resource/surge) at the start of each of your [turns](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n- You have corruption immunity equal to 5 + your level.\n- Creatures gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [strikes](scc.v1:mcdm.heroes.v1/rule.combat/strike) against you.\n- You take a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to interact with other creatures.",
    activationCondition:
      'Only while Umbral Form is active: first passage through each enemy space on a turn deals Agility corruption damage to that enemy. Resolve manually.',
  },
  {
    name: 'Umbral Form: Hide',
    sourcePath: 'en/unified/md/feature/shadow/level-6/umbral-form.md',
    actionType: 'At end of your turn',
    quote:
      "As a maneuver, you lose control of yourself, becoming a shadow creature dripping with ash. This transformation lasts until the end of the encounter, until you are [dying](scc.v1:mcdm.heroes.v1/rule.health/dying), or after 1 uninterrupted hour of quiet focus outside of combat. You gain the following effects while in this form:\n\n- You can automatically climb at full [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) while moving.\n- Enemies' spaces don't count as [difficult terrain](scc.v1:mcdm.heroes.v1/movement/difficult-terrain) for you. An enemy takes corruption damage equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score the first time you pass through their space on a [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n- If you end your [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) with [cover](scc.v1:mcdm.heroes.v1/rule.combat/cover) or [concealment](scc.v1:mcdm.heroes.v1/rule.combat/concealment) from another creature, you are automatically hidden from that creature.\n- You gain 1 [surge](scc.v1:mcdm.heroes.v1/rule.resource/surge) at the start of each of your [turns](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n- You have corruption immunity equal to 5 + your level.\n- Creatures gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [strikes](scc.v1:mcdm.heroes.v1/rule.combat/strike) against you.\n- You take a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to interact with other creatures.",
    activationCondition:
      'Only while Umbral Form is active, become hidden from each creature from whom you end your turn covered or concealed. Resolve manually.',
  },
  {
    name: 'Umbral Form: Surge',
    sourcePath: 'en/unified/md/feature/shadow/level-6/umbral-form.md',
    actionType: 'At start of your turn',
    quote:
      "As a maneuver, you lose control of yourself, becoming a shadow creature dripping with ash. This transformation lasts until the end of the encounter, until you are [dying](scc.v1:mcdm.heroes.v1/rule.health/dying), or after 1 uninterrupted hour of quiet focus outside of combat. You gain the following effects while in this form:\n\n- You can automatically climb at full [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) while moving.\n- Enemies' spaces don't count as [difficult terrain](scc.v1:mcdm.heroes.v1/movement/difficult-terrain) for you. An enemy takes corruption damage equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score the first time you pass through their space on a [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n- If you end your [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) with [cover](scc.v1:mcdm.heroes.v1/rule.combat/cover) or [concealment](scc.v1:mcdm.heroes.v1/rule.combat/concealment) from another creature, you are automatically hidden from that creature.\n- You gain 1 [surge](scc.v1:mcdm.heroes.v1/rule.resource/surge) at the start of each of your [turns](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n- You have corruption immunity equal to 5 + your level.\n- Creatures gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [strikes](scc.v1:mcdm.heroes.v1/rule.combat/strike) against you.\n- You take a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to interact with other creatures.",
    activationCondition:
      'Only while Umbral Form is active: gain 1 surge at the start of your turn; adjust the surge manually.',
  },
  {
    name: 'Blackout: Shift and Free Strike',
    sourcePath: 'en/unified/md/feature/ability/shadow/level-5/blackout.md',
    actionType: 'Free triggered action',
    quote:
      '*You cause a plume of shadow to erupt from your eyes and create a cloud of darkness.*\n\n| **Area, Magic** |   **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|-----------------|---------------:|\n| **📏 3 [burst](scc.v1:mcdm.heroes.v1/rule.combat/burst)**  | **🎯 Special** |\n\n**Effect:** A black cloud fills the area until the end of your next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), granting you and your allies [concealment](scc.v1:mcdm.heroes.v1/rule.combat/concealment) against enemies. While you are in the area, whenever an enemy ends their [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) in the area, you can use a free [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to [shift](scc.v1:mcdm.heroes.v1/movement/shifting) to a new location within the area and make a [free strike](scc.v1:mcdm.heroes.v1/feature.common.main-actions/free-strike) against them.',
    activationCondition:
      'Only after Blackout, before the end of your next turn, while you are inside the cloud and an enemy ends its turn there. Shift within the area and free strike that enemy manually; no second 9-Insight payment.',
  },
  {
    name: 'Cinderstorm: Hide',
    sourcePath: 'en/unified/md/feature/ability/shadow/level-6/cinderstorm.md',
    actionType: 'Maneuver',
    quote:
      '*You [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) your friends in a burst of ash and fire.*\n\n| **Magic**      |                          **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|----------------|--------------------------------------:|\n| **📏 4 [burst](scc.v1:mcdm.heroes.v1/rule.combat/burst)** | **🎯 Self and each ally in the area** |\n\n**Effect:** Each target can [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) up to 5 squares. For each target in addition to you who [teleports](scc.v1:mcdm.heroes.v1/movement/teleport) away from or into a space [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to an enemy, that enemy takes fire damage equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score. Additionally, a target who ends this movement in [concealment](scc.v1:mcdm.heroes.v1/rule.combat/concealment) or [cover](scc.v1:mcdm.heroes.v1/rule.combat/cover) can use the [Hide](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/hide) maneuver even if they are observed.',
    activationCondition:
      'Only a target whose Cinderstorm teleport ends in cover or concealment can use Hide even observed. No free action is granted. Resolve manually.',
  },
  {
    name: 'Cinderstorm: Fire',
    sourcePath: 'en/unified/md/feature/ability/shadow/level-6/cinderstorm.md',
    actionType: 'Part of Cinderstorm teleport',
    quote:
      '*You [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) your friends in a burst of ash and fire.*\n\n| **Magic**      |                          **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|----------------|--------------------------------------:|\n| **📏 4 [burst](scc.v1:mcdm.heroes.v1/rule.combat/burst)** | **🎯 Self and each ally in the area** |\n\n**Effect:** Each target can [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) up to 5 squares. For each target in addition to you who [teleports](scc.v1:mcdm.heroes.v1/movement/teleport) away from or into a space [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to an enemy, that enemy takes fire damage equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score. Additionally, a target who ends this movement in [concealment](scc.v1:mcdm.heroes.v1/rule.combat/concealment) or [cover](scc.v1:mcdm.heroes.v1/rule.combat/cover) can use the [Hide](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/hide) maneuver even if they are observed.',
    activationCondition:
      'For each teleporting target OTHER THAN YOU that leaves or enters adjacency with an enemy, that enemy takes your Agility fire damage. Resolve adjacency and damage manually.',
  },
  {
    name: 'One Vial Makes You Better: Drink (Acid)',
    sourcePath: 'en/unified/md/feature/ability/shadow/level-6/one-vial-makes-you-better.md',
    actionType: 'No action immediately; Use Consumable later',
    quote:
      "*A well-timed throw of a potion will keep your allies in the fight.*\n\n| **[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)**       |           **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|------------------|-----------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10** | **🎯 Three creatures** |\n\n**Effect:** You ready, hand, or lob a potion to each target, who can immediately quaff the potion (no action required). If they don't drink the potion right away, they must use the [Use Consumable](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/use-consumable) maneuver to consume it later. The potion loses its [potency](scc.v1:mcdm.heroes.v1/rule.character/potency) at the end of the encounter.\n\nA creature who drinks the potion can spend up to 2 [Recoveries](scc.v1:mcdm.heroes.v1/rule.health/recoveries), and has acid immunity, fire immunity, or poison immunity (their choice) equal to your level until the end of the encounter.",
    activationCondition:
      'Only an unexpired potion already delivered with One Vial Makes You Better. Drinker may spend up to 2 Recoveries and gains acid immunity equal to the Shadow level until encounter end. Resolve consumption, recovery spending/healing and immunity manually; no second 9-Insight cost.',
  },
  {
    name: 'One Vial Makes You Better: Drink (Fire)',
    sourcePath: 'en/unified/md/feature/ability/shadow/level-6/one-vial-makes-you-better.md',
    actionType: 'No action immediately; Use Consumable later',
    quote:
      "*A well-timed throw of a potion will keep your allies in the fight.*\n\n| **[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)**       |           **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|------------------|-----------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10** | **🎯 Three creatures** |\n\n**Effect:** You ready, hand, or lob a potion to each target, who can immediately quaff the potion (no action required). If they don't drink the potion right away, they must use the [Use Consumable](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/use-consumable) maneuver to consume it later. The potion loses its [potency](scc.v1:mcdm.heroes.v1/rule.character/potency) at the end of the encounter.\n\nA creature who drinks the potion can spend up to 2 [Recoveries](scc.v1:mcdm.heroes.v1/rule.health/recoveries), and has acid immunity, fire immunity, or poison immunity (their choice) equal to your level until the end of the encounter.",
    activationCondition:
      'Only an unexpired potion already delivered with One Vial Makes You Better. Drinker may spend up to 2 Recoveries and gains fire immunity equal to the Shadow level until encounter end. Resolve consumption, recovery spending/healing and immunity manually; no second 9-Insight cost.',
  },
  {
    name: 'One Vial Makes You Better: Drink (Poison)',
    sourcePath: 'en/unified/md/feature/ability/shadow/level-6/one-vial-makes-you-better.md',
    actionType: 'No action immediately; Use Consumable later',
    quote:
      "*A well-timed throw of a potion will keep your allies in the fight.*\n\n| **[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)**       |           **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|------------------|-----------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10** | **🎯 Three creatures** |\n\n**Effect:** You ready, hand, or lob a potion to each target, who can immediately quaff the potion (no action required). If they don't drink the potion right away, they must use the [Use Consumable](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/use-consumable) maneuver to consume it later. The potion loses its [potency](scc.v1:mcdm.heroes.v1/rule.character/potency) at the end of the encounter.\n\nA creature who drinks the potion can spend up to 2 [Recoveries](scc.v1:mcdm.heroes.v1/rule.health/recoveries), and has acid immunity, fire immunity, or poison immunity (their choice) equal to your level until the end of the encounter.",
    activationCondition:
      'Only an unexpired potion already delivered with One Vial Makes You Better. Drinker may spend up to 2 Recoveries and gains poison immunity equal to the Shadow level until encounter end. Resolve consumption, recovery spending/healing and immunity manually; no second 9-Insight cost.',
  },
  {
    name: 'One Vial Makes You Faster: Drink',
    sourcePath: 'en/unified/md/feature/ability/shadow/level-6/one-vial-makes-you-faster.md',
    actionType: 'No action immediately; Use Consumable later',
    quote:
      "*Each ally who catches a potion you throw can take the battle to the next level.*\n\n| **[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)**       |        **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|------------------|-----------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10** | **🎯 Three creatures** |\n\n**Effect:** You ready, hand, or lob a potion to each target, who can immediately quaff the potion (no action required). If they don't drink the potion right away, they must use the [Use Consumable](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/use-consumable) maneuver to consume it later. The potion loses its [potency](scc.v1:mcdm.heroes.v1/rule.character/potency) at the end of the encounter.\n\nA creature who drinks the potion receives benefits based on your [power roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll).\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility):**\n\n- **≤11:** The creature's [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) is increased by 2 until the end of the encounter.\n- **12-16:** The creature can [fly](scc.v1:mcdm.heroes.v1/movement/fly) until the end of the encounter.\n- **17+:** The creature [turns](scc.v1:mcdm.heroes.v1/rule.combat/turn) invisible until the end of their next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).",
    activationCondition:
      'Only an unexpired potion already delivered with One Vial Makes You Faster. Use its associated power-roll tier: speed +2 until encounter end OR flight until encounter end OR invisibility through end of drinker next turn. Alternatives do not accumulate. Resolve consumption and benefits manually; no second 9-Insight cost.',
  },
];
