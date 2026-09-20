// SPDX-License-Identifier: GPL-3.0-only
/** Core perk actions and usable activities from pinned Compendium
 * fb83a789da8f0327a389c277a0c790b1648d5810. Retain the perk itself.
 * Quoted source is verbatim; names qualifying unnamed prose operations are app labels.
 * Activity durations and unspecified timing are not invented combat action types.
 * Conditional effects remain explicitly manual unless their shared operation applies them.
 */
export interface PerkAbilitySource {
  perk: string;
  name: string;
  sourcePath: string;
  actionType: string;
  quote: string;
  embedded?: boolean;
  trigger?: string;
  activationCondition?: string;
  cost?: string;
}

export const PERK_ABILITIES: PerkAbilitySource[] = [
  {
    perk: 'Arcane Trick',
    name: 'Arcane Trick',
    sourcePath: 'en/unified/md/perk/arcane-trick.md',
    actionType: 'Main action',
    quote:
      "You have the following ability.\n\n> ###### Arcane Trick\n>\n> *You cast an entertaining spell that creates a minor but impressive magical effect.*\n>\n> | **Magic**              | **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n> |------------------------|----------------:|\n> | **📏 Self; see below** |     **🎯 Self** |\n>\n> **Effect:** Choose one of the following effects:\n>\n> - You [teleport](scc.v1:mcdm.heroes.v1/movement/teleport) a [size](scc.v1:mcdm.heroes.v1/rule.character/size) 1S or smaller object [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you into an unoccupied space [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you.\n> - Until the start of your next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), a part of your body shoots a shower of harmless noisy sparks that light up each square [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you.\n> - You ignite or snuff out (your choice) every mundane light source of 1L or smaller [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you.\n> - You transform up to 1 pound of edible food you touch to make it taste delicious or disgusting.\n> - Until the start of your next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), you make your body exude a particular odor you've smelled before. This smell can be sensed by each creature within 5 squares of you, but can't impose any [condition](scc.v1:mcdm.heroes.v1/rule.combat/condition) or other drawback on those creatures.\n> - You place a small magical inscription on the surface of a mundane object you touch, or you can remove an inscription that was made by you or by another creature using [Arcane Trick](scc.v1:mcdm.heroes.v1/perk/arcane-trick).\n> - You touch a [size](scc.v1:mcdm.heroes.v1/rule.character/size) 1T object to cover it with an illusion that makes it look like a different object. Any creature who handles the object becomes aware of the illusion. The illusion ends when you stop touching the object.",
    embedded: true,
  },
  {
    perk: 'Area of Expertise',
    name: 'Area of Expertise: Inspect Object',
    sourcePath: 'en/unified/md/perk/area-of-expertise.md',
    actionType: '1 minute',
    quote:
      'Choose one skill you already have from the [crafting skill group](scc.v1:mcdm.heroes.v1/skill.group/crafting). Whenever you obtain a tier 1 outcome on an easy or medium [test](scc.v1:mcdm.heroes.v1/rule.test/test) using this skill, you treat it as a tier 2 outcome instead. Additionally, if you spend 1 minute inspecting an object related to the chosen skill, you can estimate its value and learn of any flaws in its construction.',
    activationCondition: 'The object relates to your chosen crafting skill.',
  },
  {
    perk: 'Creature Sense',
    name: 'Creature Sense',
    sourcePath: 'en/unified/md/perk/creature-sense.md',
    actionType: 'Maneuver',
    quote:
      'As a maneuver, choose a creature within 10 squares. If that creature is your level or lower, you learn the keywords in their stat block (Demon, Humanoid, Undead, and so forth).',
    activationCondition:
      'Choose a creature within 10 squares; learn its keywords only if its level is no higher than yours.',
  },
  {
    perk: 'Criminal Contacts',
    name: 'Criminal Contacts',
    sourcePath: 'en/unified/md/perk/criminal-contacts.md',
    actionType: 'Respite activity',
    quote:
      "You have access to a network of [criminal contacts](scc.v1:mcdm.heroes.v1/perk/criminal-contacts). As a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite) activity while you take a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite) in a settlement, you can ask a question of your contacts by making a [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence) [test](scc.v1:mcdm.heroes.v1/rule.test/test). On a tier 2 outcome, you learn one piece of information that would be common among criminals—the secret entrances into a building, the location of a local criminal in hiding, the name of a local thieves' guild leader, and so forth. On a tier 3 outcome, you can instead gain knowledge that would be uncommon among criminals as long as such information exists—the location of a local treasure cache, the location of a murder weapon used in a noble's assassination, the name of an [NPC](scc.v1:mcdm.heroes.v1/rule.general/npc) secretly bankrolling a local assassin's guild, and so forth.",
    activationCondition: 'While taking a respite in a settlement.',
  },
  {
    perk: 'Eidetic Memory',
    name: 'Eidetic Memory: Memorize Text',
    sourcePath: 'en/unified/md/perk/eidetic-memory.md',
    actionType: '1 uninterrupted minute or more',
    quote:
      "Your mind is an encyclopedia, though not always an easy one to organize. When you finish a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite), choose one skill from the [lore skill group](scc.v1:mcdm.heroes.v1/skill.group/lore) that you don't have. You have that skill until you finish your next [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite). Additionally, if you spend 1 uninterrupted minute or more reading any page of text, you can memorize its contents, allowing you to memorize entire books with sufficient time.",
    activationCondition: 'Reading a page of text.',
  },
  {
    perk: 'Engrossing Monologue',
    name: 'Engrossing Monologue',
    sourcePath: 'en/unified/md/perk/engrossing-monologue.md',
    actionType: 'Outside combat',
    quote:
      'Whenever you are not in combat, you can shout to get the attention of hearing creatures within 10 squares of you. Each such creature who is not hostile toward you listens to what you have to say for 1 uninterrupted minute or more, or until they sense danger or any form of imminent harm. While creatures are listening to you, each of your allies gains an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to avoid being noticed by those creatures.',
    activationCondition:
      'Hearing creatures within 10 squares; only nonhostile creatures listen, until they sense danger or imminent harm.',
  },
  {
    perk: 'Familiar',
    name: 'Familiar: Restore',
    sourcePath: 'en/unified/md/perk/familiar.md',
    actionType: 'Main action',
    quote:
      'If your [familiar](scc.v1:mcdm.heroes.v1/perk/familiar) is destroyed, you can restore them as a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite) activity, or by spending a [Recovery](scc.v1:mcdm.heroes.v1/rule.health/recoveries) as a main action to bring them back into existence in an unoccupied space [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you.',
    activationCondition:
      'Your familiar has been destroyed; this precondition is resolved manually. An adjacent unoccupied space is required.',
    cost: '1 Recovery',
  },
  {
    perk: 'Familiar',
    name: 'Familiar: Restore During Respite',
    sourcePath: 'en/unified/md/perk/familiar.md',
    actionType: 'Respite activity',
    quote:
      'If your [familiar](scc.v1:mcdm.heroes.v1/perk/familiar) is destroyed, you can restore them as a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite) activity, or by spending a [Recovery](scc.v1:mcdm.heroes.v1/rule.health/recoveries) as a main action to bring them back into existence in an unoccupied space [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you.',
    activationCondition:
      'Your familiar has been destroyed; this precondition is resolved manually.',
  },
  {
    perk: 'Forgettable Face',
    name: 'Forgettable Face',
    sourcePath: 'en/unified/md/perk/forgettable-face.md',
    actionType: 'Timing unspecified',
    quote:
      "If you spend 10 minutes or less interacting with a creature who hasn't met you before, you can cause them to forget your face when you part. If asked to describe you, the creature gives only a vague, blank, and unhelpful description. Additionally, if you spend 1 hour or more assembling a disguise, you automatically obtain a tier 2 outcome on any [test](scc.v1:mcdm.heroes.v1/rule.test/test) that could make use of the Disguise skill. If you have the Disguise skill, you automatically obtain a tier 3 outcome on the [test](scc.v1:mcdm.heroes.v1/rule.test/test).",
    trigger:
      'When you part after no more than 10 minutes interacting with a creature who has not met you before.',
  },
  {
    perk: 'Friend Catapult',
    name: 'Friend Catapult',
    sourcePath: 'en/unified/md/perk/friend-catapult.md',
    actionType: 'Maneuver',
    quote:
      "As a maneuver, you grab a willing [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) ally or object of your [size](scc.v1:mcdm.heroes.v1/rule.character/size) or smaller, then vertical [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) that target up to a number of squares equal to twice your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score. If a creature you [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) falls as a result of this movement, the effective [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) of the fall is reduced by a number of squares equal to twice your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score. When you use this perk, you can't use it again until you earn 1 or more [Victories](scc.v1:mcdm.heroes.v1/rule.resource/victories).",
    activationCondition:
      'Willing adjacent ally or object of your size or smaller. After use, unavailable until you earn 1 or more Victories.',
  },
  {
    perk: 'Gum Up the Works',
    name: 'Gum Up the Works',
    sourcePath: 'en/unified/md/perk/gum-up-the-works.md',
    actionType: 'Triggered action',
    quote:
      "Whenever a mundane trap activates within 3 squares, you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to move up to 3 squares toward it. If this movement brings you [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to any of the trap's mechanisms, you can jam the trap, preventing it from activating. As long as you stay [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to the mechanism, the trap can't go off unless an attempt to disarm it fails.",
    trigger: 'A mundane trap activates within 3 squares.',
  },
  {
    perk: 'Improvisation Creation',
    name: 'Improvisation Creation',
    sourcePath: 'en/unified/md/perk/improvisation-creation.md',
    actionType: 'Timing unspecified',
    quote:
      'Without needing to make a [test](scc.v1:mcdm.heroes.v1/rule.test/test)—and even without tools—you can quickly jury-rig or repair a mundane item or piece of equipment related to a skill you have from the [crafting skill group](scc.v1:mcdm.heroes.v1/skill.group/crafting). That item lasts for 1 hour or works for one use or activation (whichever comes first, as the Director determines), then breaks beyond repair. For example, if you have the Carpentry skill, you could repair a rickety wooden bridge long enough for a group of creatures to cross it, or build a simple shovel made of wood that can be used for 1 hour.',
    activationCondition: 'Mundane item or equipment related to an owned crafting skill.',
  },
  {
    perk: 'Invisible Force',
    name: 'Invisible Force',
    sourcePath: 'en/unified/md/perk/invisible-force.md',
    actionType: 'Maneuver',
    quote:
      "You have the following ability.\n\n> ###### Invisible Force\n>\n> *You manipulate a tiny object with your mind.*\n>\n> | **Psionic, [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)** |              **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n> |---------------------|--------------------------:|\n> | **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10**    | **🎯 One [size](scc.v1:mcdm.heroes.v1/rule.character/size) 1T object** |\n>\n> **Effect:** You can grab or manipulate the target object with your mind, moving the object up to a number of squares equal to your [Reason](scc.v1:mcdm.heroes.v1/rule.character/reason), [Intuition](scc.v1:mcdm.heroes.v1/rule.character/intuition), or [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence) score (your choice). You can use this ability to [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) doorknobs, pull levers, and so forth. You can manipulate any small movable piece of a larger object as long as the piece is unattended and [size](scc.v1:mcdm.heroes.v1/rule.character/size) 1T. You can't use this ability to break a smaller piece off a larger object.",
    embedded: true,
  },
  {
    perk: "I've Got You!",
    name: "I've Got You!",
    sourcePath: 'en/unified/md/perk/ive-got-you.md',
    actionType: 'Free triggered action',
    quote:
      "Whenever a willing ally falls and would land on you or [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to you, you can safely catch them as a free [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action). Neither of you takes damage from the ally's fall.",
    trigger: 'A willing ally falls and would land on you or adjacent to you.',
  },
  {
    perk: "I've Read About This Place",
    name: "I've Read About This Place",
    sourcePath: 'en/unified/md/perk/ive-read-about-this-place.md',
    actionType: 'Timing unspecified',
    quote:
      "Each time you enter a settlement you've never been to before, you can ask the Director one of the following questions:\n\n- Who is the most influential public figure in this settlement?\n- Who in this settlement would be the friendliest to us right now?\n- What does this settlement need most from outsiders?\n\nIf the Director doesn't have an answer to the question you ask, or doesn't want to answer, you can instead ask a different question.",
    trigger: 'You enter a settlement you have never visited before.',
  },
  {
    perk: 'Lie Detector',
    name: 'Lie Detector',
    sourcePath: 'en/unified/md/perk/lie-detector.md',
    actionType: 'Timing unspecified',
    quote:
      'In response to another creature communicating information to you, you can spend a [hero token](scc.v1:mcdm.heroes.v1/rule.resource/hero-token) to determine whether that information contained any knowing lies. If so, you know what the lies are, but not what the truth is.',
    trigger: 'Another creature communicates information to you.',
    cost: '1 HeroToken',
    activationCondition:
      'Requires a hero token; unavailable while the application has no supported hero-token pool.',
  },
  {
    perk: 'Open Book',
    name: 'Open Book',
    sourcePath: 'en/unified/md/perk/open-book.md',
    actionType: 'Timing unspecified',
    quote:
      'Whenever you speak one-on-one with a creature, you can ask them one question about themself that might typically offend them or raise suspicion. If they choose not to answer honestly, they simply deflect or redirect the question, with no further complications. If they choose to answer honestly, the creature can immediately ask you a question about yourself in turn, which you must answer honestly.',
    activationCondition: 'Speaking one-on-one with a creature.',
  },
  {
    perk: 'Psychic Whisper',
    name: 'Psychic Whisper',
    sourcePath: 'en/unified/md/perk/psychic-whisper.md',
    actionType: 'Maneuver',
    quote:
      'You have the following ability.\n\n> ###### Psychic Whisper\n>\n> *You send a one-way telepathic message to a friend.*\n>\n> | **Psionic, [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)** |    **[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n> |---------------------|----------------:|\n> | **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 10**    | **🎯 One ally** |\n>\n> **Effect:** As long as the target understands one or more languages, you send a telepathic message to them that takes 10 seconds or less to speak. The target knows who the message is from and can decide to ignore it and subsequent messages.',
    embedded: true,
  },
  {
    perk: 'Ritualist',
    name: 'Ritualist',
    sourcePath: 'en/unified/md/perk/ritualist.md',
    actionType: '1 uninterrupted minute',
    quote:
      "You can spend 1 uninterrupted minute to perform a magic ritual of blessing, targeting yourself or one willing creature you touch. The target has a double [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on the next [test](scc.v1:mcdm.heroes.v1/rule.test/test) they make within the next minute. A target can't use this benefit on an activity that takes longer than 1 minute.",
    activationCondition: 'Yourself or a willing creature you touch.',
  },
  {
    perk: 'Slipped Lead',
    name: 'Slipped Lead: Escape Bonds',
    sourcePath: 'en/unified/md/perk/slipped-lead.md',
    actionType: '1 uninterrupted minute',
    quote:
      "You gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to escape bonds. Given 1 uninterrupted minute, you can escape any mundane bonds without making a [test](scc.v1:mcdm.heroes.v1/rule.test/test). Additionally, it's not immediately obvious when you've escaped bonds until you do something that makes it clear you have done so (cast them off, use an ability that harms one or more creatures, and so forth).",
    activationCondition: 'Mundane bonds.',
  },
  {
    perk: 'So Tell Me...',
    name: 'So Tell Me...',
    sourcePath: 'en/unified/md/perk/so-tell-me.md',
    actionType: 'Timing unspecified',
    quote:
      "Whenever you succeed on a [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence) [test](scc.v1:mcdm.heroes.v1/rule.test/test) to influence one or more creatures, you can ask one creature you influenced a follow-up question after the [test](scc.v1:mcdm.heroes.v1/rule.test/test) resolves, which they must answer honestly. At the Director's discretion, the creature doesn't have to answer the question completely—or at all—if the response would put them or a loved one in danger.",
    trigger: 'After resolving a successful Presence test to influence one or more creatures.',
  },
  {
    perk: 'Thingspeaker',
    name: 'Thingspeaker',
    sourcePath: 'en/unified/md/perk/thingspeaker.md',
    actionType: '1 uninterrupted minute',
    quote:
      "When you hold an object in your hand for 1 uninterrupted minute, you can sense whether it bears emotional resonance. Objects with emotional resonance could include treasured gifts, murder weapons, or personal keepsakes. If the Director determines that the object bears emotional resonance, you learn the most dominant emotion associated with the object, then receive a vision that answers one of the following questions:\n\n- What was the name of the person whose emotion is imprinted on this object?\n- Why does this emotion linger on the object?\n- How long has it been since the object was held by the person whose emotion lingers on it?\n\nAfter asking one question, you can choose to delve deeper by asking one additional question from the list, but you are then overcome with emotions that do not belong to you. You take a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on [Intuition](scc.v1:mcdm.heroes.v1/rule.character/intuition) and [Presence](scc.v1:mcdm.heroes.v1/rule.character/presence) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) until you finish a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite), and you can't use this perk again while you suffer this [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane).",
    activationCondition:
      'Hold any object to sense whether it has emotional resonance; answers require resonance determined by the Director. Cannot reuse while suffering the bane from asking an additional question.',
  },
  {
    perk: 'Traveling Artisan',
    name: 'Traveling Artisan',
    sourcePath: 'en/unified/md/perk/traveling-artisan.md',
    actionType: '1 uninterrupted hour',
    quote:
      "On any day when you don't take a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite), you can spend 1 uninterrupted hour working on a [crafting project](scc.v1:mcdm.heroes.v1/rule.downtime/crafting-project) using a skill you have from the [crafting skill group](scc.v1:mcdm.heroes.v1/skill.group/crafting). If you do so, you gain 1d10 [project points](scc.v1:mcdm.heroes.v1/rule.downtime/project-points) toward that project.\n\n> **Perks and [Tests](scc.v1:mcdm.heroes.v1/rule.test/test)**\n>\n> The existence of specific perks doesn't mean that a hero can't attempt the task related to a perk without having that perk. Aside from [supernatural](scc.v1:mcdm.heroes.v1/rule.general/supernatural) perks, a Director can always allow a hero to attempt a mundane task mentioned in a perk by making a [test](scc.v1:mcdm.heroes.v1/rule.test/test). Perks are special because they allow a hero to attempt a specific task without a [test](scc.v1:mcdm.heroes.v1/rule.test/test), and often give a better result than a successful [test](scc.v1:mcdm.heroes.v1/rule.test/test)—or even a [test](scc.v1:mcdm.heroes.v1/rule.test/test) with a reward would give.\n>\n> For example, can a hero catch a falling ally if they don't have the I've Got You perk? A Director can absolutely allow it, but might decide that the hero needs to succeed on a [Might](scc.v1:mcdm.heroes.v1/rule.character/might) [test](scc.v1:mcdm.heroes.v1/rule.test/test) to accomplish the task, using a main action or maneuver to prepare for it. Being able to catch an ally automatically as a free [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) is what the perk gets you!",
    activationCondition:
      'A day on which you do not take a respite; a crafting project using an owned crafting skill.',
  },
  {
    perk: 'Traveling Sage',
    name: 'Traveling Sage',
    sourcePath: 'en/unified/md/perk/traveling-sage.md',
    actionType: '1 uninterrupted hour',
    quote:
      "On any day when you don't take a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite), you can spend 1 uninterrupted hour working on a [research project](scc.v1:mcdm.heroes.v1/rule.downtime/research-project) using a skill you have from the [lore skill group](scc.v1:mcdm.heroes.v1/skill.group/lore). If you do so, you gain 1d10 [project points](scc.v1:mcdm.heroes.v1/rule.downtime/project-points) toward that project.",
    activationCondition:
      'A day on which you do not take a respite; a research project using an owned lore skill.',
  },
];
