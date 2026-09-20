// SPDX-License-Identifier: GPL-3.0-only
/** V37: source-bound complication choices; gameplay activation stays in the play-state layer.
 * Evidence: docs/research/v37-complications.md and .json. No Forge factory defaults are rules.
 */
import complicationSource from './compendium/complication.json' with { type: 'json' };
import { COMPLICATION_ABILITIES } from './supporting-complication-abilities.ts';
import type { Decision, DecisionDefinitions, DecisionOption } from '../evaluate/definitions.ts';

export interface ComplicationSelectionEffect {
  decision: string;
  operation:
    | 'skill-bonus'
    | 'skill-edge'
    | 'skill-remove'
    | 'language-remove'
    | 'skill-conditional'
    | 'ability-cost'
    | 'benefit'
    | 'movement'
    | 'item'
    | 'damage-type';
  value?: number | string;
  condition?: string;
}
export interface ComplicationEffect {
  id: string;
  source: string;
  fullText: string;
  fixedSkills: string[];
  permanentModifiers: {
    field: string;
    operation: string;
    value: number | string | boolean | number[];
    quote?: string;
  }[];
  grantedAbilities: string[];
  conditionalText: string;
  initialStateIntents: string[];
  selectionEffects: ComplicationSelectionEffect[];
}
type AuthoredEffect = Partial<Omit<ComplicationEffect, 'id' | 'source' | 'fullText'>>;
const AUTHORED_EFFECTS: Record<string, AuthoredEffect> = {
  'Advanced Studies': {
    conditionalText:
      'Respite activity: highest-characteristic test; <=11 summons hostile demon of level <= hero acting first; 12–16 nothing; 17+ chooses one qualifying class heroic ability until next respite. No permanent or creation ability grant.',
    selectionEffects: [],
  },
  Amnesia: {
    initialStateIntents: [
      'One selected treasure inventory grant, initialized once; selected treasure effects must be evaluated under owning inventory contract.',
    ],
    conditionalText:
      'Bane on every lore-recall test. Chosen trinket is an actual initial possession with its own rules and possible dependencies.',
    selectionEffects: [
      {
        decision: 'complication.amnesia.trinket',
        operation: 'item',
      },
    ],
  },
  'Animal Form': {
    conditionalText:
      'Maneuver transforms into the recorded specific size-1T animal until next turn start unless repeated; cannot talk/actions; only Escape Grab, Hide, Stand Up maneuvers. Animal movement applies only in form; +2 speed only if no additional movement. Director 1 Malice at start of ANY turn while winded forces transformation, once per respite.',
    selectionEffects: [],
  },
  Antihero: {
    initialStateIntents: ['antiheroTokens=3'],
    conditionalText:
      'Initial three antihero tokens; one replaces one Heroic Resource for an ability/effect. Regain one instead of party deed hero token when below three. While below three, hero AND each ally within 5 take interaction-test bane. Never a permanent Heroic Resource or Renown adjustment.',
    selectionEffects: [],
  },
  'Artifact Bonded': {
    conditionalText:
      'Chosen artifact manifests first involuntary reduction to 0 Stamina each encounter; ends at earliest next-turn end/property benefit/Stamina >0. Each appearance costs current Recovery, else 1d10 irreducible damage. Artifact is selected at build even while absent; no always-active item effects.',
    selectionEffects: [
      {
        decision: 'complication.artifact-bonded.artifact',
        operation: 'item',
      },
    ],
  },
  Bereaved: {
    permanentModifiers: [
      {
        field: 'weakness.corruption',
        operation: 'set',
        value: 5,
        quote: 'You have corruption weakness 5.',
      },
    ],
    conditionalText:
      'Spend hero token for Director best next course of action (even privileged information); no token spent if no good course. Corruption weakness is permanent.',
    selectionEffects: [],
  },
  Betrothed: {
    permanentModifiers: [
      {
        field: 'renownMaximum',
        operation: 'cap',
        value: 'level - 1',
        quote:
          "All those who learn of you running out on your commitment think less of you and spread nasty rumors about you. Your Renown can't ever be more than your level − 1.",
      },
    ],
    initialStateIntents: [
      'One selected treasure inventory grant, initialized once; selected treasure effects must be evaluated under owning inventory contract.',
    ],
    conditionalText:
      'Initial first-echelon trinket. Renown maximum is level−1, not a subtract-one grant; apply cap after other starting grants and retain cap for later gains.',
    selectionEffects: [
      {
        decision: 'complication.betrothed.trinket',
        operation: 'item',
      },
    ],
  },
  'Chaos Touched': {
    permanentModifiers: [
      {
        field: 'additionalHeldItems',
        operation: 'add',
        value: 1,
        quote:
          'You gain an edge on the Escape Grab, Grab, and Knockback maneuvers. Additionally, you can hold an additional item even when your hands are full.',
      },
    ],
    conditionalText:
      'Edge on Escape Grab, Grab and Knockback, plus can hold one additional item while hands full. While dying, bane on ALL power rolls, including tests; not just ability rolls.',
    selectionEffects: [],
  },
  'Chosen One': {
    initialStateIntents: ['destinyPoints=3'],
    conditionalText:
      'Initial three destiny points; replace one or more class Heroic Resource; regain one per Victory. Each spend event, regardless of points spent, causes 1d10 irreducible psychic damage and reveals location to cult.',
    selectionEffects: [],
  },
  'Consuming Interest': {
    conditionalText:
      'Own chosen lore skill. Study Lore is a future project, maximum three completions, distinct project sources, goals 120/150/180; each completion adds one to that skill bonus. Director rolls chosen-skill lore recall in secret, gives correct or false information. Do not grant completed project bonuses at creation.',
    selectionEffects: [],
  },
  'Corrupted Mentor': {
    permanentModifiers: [
      {
        field: 'weakness.holy',
        operation: 'initialBaseline',
        value: 1,
        quote:
          'You have holy weakness 1. Each time you use Corrupt Spirit, your holy weakness increases by 1, to a maximum equal to your recovery value. Whenever you take holy damage, this weakness resets to 1.',
      },
    ],
    grantedAbilities: ['Corrupt Spirit'],
    conditionalText:
      'Corrupt Spirit is a granted Magic self maneuver. Until turn end, single-target damage-dealing heroic abilities gain corruption damage = highest characteristic. Base holy weakness 1 rises one per use to recovery-value cap, resets to 1 on holy damage; rising value is gameplay state.',
    selectionEffects: [],
  },
  Coward: {
    conditionalText:
      'Frightened hero may move toward fear source. Saves ending frightened roll a d10 twice, use lower; no creation target.',
    selectionEffects: [],
  },
  'Crash Landed': {
    fixedSkills: ['Timescape'],
    conditionalText:
      'Timescape fixed skill; power pack activation/deactivation is a maneuver. Choose cold/fire/lightning/sonic ON ACTIVATION, converting damage-dealing abilities until deactivated. Bane recalling information about crash-landed world.',
    selectionEffects: [],
  },
  'Cult Victim': {
    permanentModifiers: [
      {
        field: 'weakness.corruption',
        operation: 'set',
        value: 5,
        quote: 'You have corruption weakness 5.',
      },
    ],
    conditionalText:
      'Once/turn pass through <=1 square solid matter; ending turn inside ejects to entry space and deals 5 irreducible damage. Corruption weakness 5 permanent.',
    selectionEffects: [],
  },
  'Curse of Caution': {
    permanentModifiers: [
      {
        field: 'speed',
        operation: 'add',
        value: -1,
        quote: 'You have a −1 penalty to speed.',
      },
    ],
    conditionalText:
      'Until own turn taken in a round, incoming strikes take bane. Speed penalty −1 is unconditional baseline.',
    selectionEffects: [],
  },
  'Curse of Immortality': {
    conditionalText:
      'Does not age; death replaced with suspended animation; if body survives, return after 12 hours with recovery-value Stamina. Lore-recall tests take bane.',
    selectionEffects: [],
  },
  'Curse of Misfortune': {
    conditionalText:
      'Combat test consequence replaced by hero and adjacent allies falling prone. No permanent stats/creation choices.',
    selectionEffects: [],
  },
  'Curse of Poverty': {
    conditionalText:
      'On respite with Wealth >1 set Wealth to 1, +1 Recovery per Wealth lost; boosted Recoveries reset first respite with current Recoveries below maximum. This is an event-driven conversion, not a starting Wealth cap or permanent maximum increase.',
    selectionEffects: [],
  },
  'Curse of Punishment': {
    permanentModifiers: [
      {
        field: 'recoveriesMaximum',
        operation: 'add',
        value: 1,
        quote: 'You have 1 additional Recovery.',
      },
    ],
    conditionalText:
      'One additional maximum Recovery; while current Recoveries exhausted, dying regardless of Stamina. Do not initialize dying or current Recovery loss from the feature.',
    selectionEffects: [],
  },
  'Curse of Stone': {
    permanentModifiers: [
      {
        field: 'stability',
        operation: 'add',
        value: 1,
        quote:
          'You have a +1 bonus to stability. Additionally, you can use a free maneuver to cause your body, gear, and any items you hold to take on the appearance of stone, making you appear to be a mundane statue while you remain unmoving.',
      },
      {
        field: 'weakness.sonic',
        operation: 'set',
        value: 5,
        quote: 'You have sonic weakness 5. Additionally, while you are winded, you are dazed.',
      },
    ],
    conditionalText:
      'Stability +1; free maneuver stone statue disguise while motionless. Sonic weakness 5; winded causes dazed. No baseline dazed condition.',
    selectionEffects: [],
  },
  'Cursed Weapon': {
    permanentModifiers: [
      {
        field: 'weakness.allDamage',
        operation: 'set',
        value: 2,
        quote: 'You have damage weakness 2.',
      },
    ],
    initialStateIntents: [
      'One selected treasure inventory grant, initialized once; selected treasure effects must be evaluated under owning inventory contract.',
    ],
    conditionalText:
      'Choose one leveled weapon initial possession; all-damage weakness 2 is unconditional. Include selected weapon build effects and choices through item contract; no free arbitrary treasure.',
    selectionEffects: [
      {
        decision: 'complication.cursed-weapon.weapon',
        operation: 'item',
      },
    ],
  },
  Disgraced: {
    permanentModifiers: [
      {
        field: 'initialRenown',
        operation: 'add',
        value: 1,
        quote:
          'You earn 1 Renown, and you have one skill of your choice from the interpersonal or intrigue skill group.',
      },
    ],
    conditionalText:
      'Gain 1 initial Renown and one skill from the UNION of interpersonal/intrigue. Infamous reputation; participating negotiation with NPC interest <=2 causes later hostile plan.',
    selectionEffects: [],
  },
  'Dragon Dreams': {
    conditionalText:
      'Preselect purchased Dragon Knight traits costing two points; benefits active only at >=5 Victories. Reaching 0 Stamina causes self and each creature within 5 to take fire damage 2×level; self damage irreducible. Conditional traits do not become baseline benefits before threshold. Dragon Breath is Area/Magic main action 3 cube within1, enemies, Might/Presence damage2/4/6; damage type chosen on use from acid/cold/corruption/fire/lightning/poison, not a permanent type lock. Draconian Pride is Area/Magic main action1 burst enemies, Might/Presence damage2/5/7 with push0/1/2. Both are signatures, active only with complication threshold. Wyrmplate is referenced for dependency research, NOT granted.',
    selectionEffects: [],
  },
  'Elemental Inside': {
    permanentModifiers: [
      {
        field: 'staminaMaximum',
        operation: 'add',
        value: '3 * echelon',
        quote:
          'You gain a +3 bonus to Stamina at 1st level, then again at 4th, 7th, and 10th levels.',
      },
    ],
    conditionalText:
      'Maximum Stamina +3 at levels 1,4,7,10, cumulative. While dying elemental takes control, attacks nearest noticed creature and Director may control if rage not fulfilled. No change to normal character ownership.',
    selectionEffects: [],
  },
  Evanesceria: {
    conditionalText:
      'Round-start optional d10 >=6 disappearance until own turn, returning chosen nearest free space if needed; recharge after >=1 Victory. Respite-activity 2d10 with either 1 means absent and no activity, though respite benefits retained.',
    selectionEffects: [],
  },
  Exile: {
    conditionalText:
      'One extant language entitlement. Recognizing homeland NPCs try to harm hero at Director discretion.',
    selectionEffects: [],
  },
  'Fallen Immortal': {
    fixedSkills: ['Religion'],
    conditionalText:
      'Religion fixed skill. Any untyped-damage ability may deal holy instead (not restricted to strikes). Bane on tests to deceive.',
    selectionEffects: [],
  },
  'Famous Relative': {
    initialStateIntents: ['magic jewelry; relative summon unused this level'],
    conditionalText:
      'Magic jewelry summons same-stat relative (Renown 10, power-roll edge, no hero treasure benefits) as maneuver, until peril resolved or one hour; one use per level. No Victories for challenges relative attends and next Renown award transferred each summon. Relative Renown is not hero Renown.',
    selectionEffects: [],
  },
  Feytouched: {
    conditionalText:
      'At combat start optional +1 Heroic Resource paired with +3 Director Malice. No starting maximum resource modifier.',
    selectionEffects: [],
  },
  'Fiery Ideal': {
    conditionalText:
      'Special purpose informs conditional tier-3 damage-dealing ability extra fire = highest characteristic. Director judges violations causing irreducible fire 5+level. Purpose is narrative context, not a prewritten selectable rules pool.',
    selectionEffects: [],
  },
  'Fire and Chaos': {
    permanentModifiers: [
      {
        field: 'immunity.fire',
        operation: 'set',
        value: 5,
        quote: 'You have fire immunity 5.',
      },
      {
        field: 'weakness.cold',
        operation: 'set',
        value: 5,
        quote: 'You have cold weakness 5.',
      },
    ],
    conditionalText: 'Fire immunity 5 and cold weakness 5, both permanent.',
    selectionEffects: [],
  },
  'Following in the Footsteps': {
    conditionalText:
      'Select higher-level class heroic ability now; when later learned its cost is reduced 2, minimum 1. Independently select one currently known heroic ability whose cost permanently rises 1. Neither reference grants an ability; persist selections and original selection level.',
    selectionEffects: [
      {
        decision: 'complication.following-in-the-footsteps.futureAbility',
        operation: 'ability-cost',
        value: -2,
      },
      {
        decision: 'complication.following-in-the-footsteps.costlierAbility',
        operation: 'ability-cost',
        value: 1,
      },
    ],
  },
  'Forbidden Romance': {
    conditionalText:
      'Lover grants secret constrained favors; reciprocal rescue obligations and discovery worsen separation. Narrative relationship only; no fabricated numeric bonus.',
    selectionEffects: [],
  },
  Frostheart: {
    permanentModifiers: [
      {
        field: 'immunity.cold',
        operation: 'set',
        value: 5,
        quote:
          'You have cold immunity 5. Additionally, whenever you make a strike that deals untyped damage, that strike can deal cold damage instead.',
      },
      {
        field: 'weakness.fire',
        operation: 'set',
        value: 5,
        quote: 'You have fire weakness 5.',
      },
    ],
    conditionalText:
      'Cold immunity 5 and fire weakness 5. Untyped STRIKES may become cold; non-strike abilities are not covered.',
    selectionEffects: [],
  },
  'Getting Too Old for This': {
    conditionalText:
      'On own turn choose a heroic ability learnable one level higher, all other prerequisites and cost apply; use once then recharge after >=2 Victories. While winded speed −2; no required creation ability selection.',
    selectionEffects: [],
  },
  'Gnoll-Mauled': {
    conditionalText:
      'Ally within 5 reaches 0 Stamina: triggered action move speed then free strike. While dazed at turn start adjacent to creature, main action must make melee free strike against adjacent creature. Ineligible if hero cannot be made dazed.',
    selectionEffects: [],
  },
  Greening: {
    permanentModifiers: [
      {
        field: 'immunity.corruption',
        operation: 'set',
        value: 5,
        quote: 'You have corruption immunity 5.',
      },
      {
        field: 'weakness.fire',
        operation: 'set',
        value: 5,
        quote: 'You have fire weakness 5.',
      },
    ],
    conditionalText:
      'Corruption immunity 5 and fire weakness 5. Golden sapling is narrative possession, not an unlisted magical treasure.',
    selectionEffects: [],
  },
  Grifter: {
    conditionalText:
      'One intrigue skill. Director may recognize first-met NPC as old con victim; party gains hero token when invoked.',
    selectionEffects: [],
  },
  Grounded: {
    grantedAbilities: ['Motivate Earth'],
    conditionalText:
      'Grant Motivate Earth feature and complete linked ability; if already gained elsewhere change this ability to ranged 5. Nearby creature within 2 taking lightning causes hero 5 irreducible lightning. Do not mistake range enhancement for an extra identical ability. Motivate Earth main action normally Melee1, Earth/Magic/Melee, special target: touch mundane dirt/stone/metal square to create5 wall including it; alternatively open1-square hole in >=2-square structure, or seal <=1-square opening with same material. Duplicate grant changes ability to Ranged5 and corresponding range category.',
    selectionEffects: [],
  },
  'Guilty Conscience': {
    conditionalText:
      'At negative winded Stamina, free triggered action spend Recovery. Interaction tests and strikes against people who know past wrongdoing take bane.',
    selectionEffects: [],
  },
  'Hawk Rider': {
    conditionalText:
      'Summon specified giant hawk outdoors with uninterrupted minute; mount only for hero, refuses structures; dismiss freely; restore full Stamina or revive as respite activity. Informed witnesses cause interaction bane and may report to Hawklords. Companion play is separate scope, not missing hero stat calculation.',
    selectionEffects: [],
  },
  'Host Body': {
    permanentModifiers: [
      {
        field: 'weakness.fire',
        operation: 'set',
        value: 5,
        quote:
          "You have fire weakness 5. Additionally, you take a bane on any test made to read a humanoid creature's emotions or body language.",
      },
    ],
    conditionalText:
      'Host considered alive; main action transfers to dead playable-ancestry humanoid within 10 while alive or <=24h after death; old body dies; replace ancestry-derived statistics with host ancestry, start 1 Stamina and may spend Recovery. Fire weakness 5 always. Bane reading humanoid emotions/body language, not only named Read Person skill.',
    selectionEffects: [],
  },
  Hunted: {
    conditionalText:
      'One intrigue skill. Lay low respite activity resets pursuers search. Renown gain reveals location; agents in 1d10 days unless move/lay low; lingering allows pursuer to find hero.',
    selectionEffects: [],
  },
  Hunter: {
    conditionalText:
      'One of eight printed skills, plus quarry clue/search-test edge. Bane tracking other creatures; quarry must be identifiable to apply conditional effects.',
    selectionEffects: [],
  },
  Indebted: {
    permanentModifiers: [
      {
        field: 'initialWealth',
        operation: 'set',
        value: -5,
        quote:
          "Your starting Wealth is −5. While your Wealth is lower than 1, you can purchase items as if you had 1 Wealth, but you're frequently visited by threatening creditors, and shopkeepers often lock their doors when they see you coming.",
      },
    ],
    conditionalText:
      'Starting Wealth SET to −5 (not subtract five from other grants). While below 1, purchase as Wealth 1. Subsequent Wealth-earning events add one extra; creditors/closed shops narrative. Never reapply starting −5 on every revision.',
    selectionEffects: [],
  },
  'Infernal Contract... But, Like, Bad': {
    conditionalText:
      'Choose exactly one of +2 initial Renown, +2 initial Wealth, +3 maximum Stamina. Fiendish mark causes conditional interaction bane; death sends soul to Hell, prevents restoration.',
    selectionEffects: [
      {
        decision: 'complication.infernal-contract-but-like-bad.benefit',
        operation: 'benefit',
      },
    ],
  },
  'Infernal Contract': {
    conditionalText:
      'Initiative d10 threshold 4+ when both sides contain nonsurprised creatures. Patron service and pursuit narrative; no choice between initiative benefit and contract drawback.',
    selectionEffects: [],
  },
  'Ivory Tower': {
    conditionalText:
      'Choose three distinct skills from any group, then DIRECTOR chooses one of those three to remove permanently and ban relearning; bane whenever that skill would apply. One explicit dead-language entitlement. Removed skill cannot become unrestricted replacement: drawback must remain.',
    selectionEffects: [
      {
        decision: 'complication.ivory-tower.lostSkill',
        operation: 'skill-remove',
      },
    ],
  },
  Lifebonded: {
    conditionalText:
      'Identify a DIFFERENT creature without Lifebonded. Own death disappears body until linked creature respite or Victory, return adjacent fully healed. Linked creature death kills hero regardless of other protections.',
    selectionEffects: [],
  },
  'Lightning Soul': {
    conditionalText:
      'Regaining Stamina IN COMBAT gives one surge; surge extra damage may become lightning. When wet all-damage weakness 5; neither surge nor weakness is unconditional initial state.',
    selectionEffects: [],
  },
  Loner: {
    conditionalText:
      'At end of respite choose one not-owned skill until end of next respite. Keep as respite configuration, not permanent chosen skill. Ally reaching 0 causes taunt toward attacker until ally >0, new taunt, or encounter end.',
    selectionEffects: [],
  },
  'Lost in Time': {
    conditionalText:
      'One fixed damage-type parameter from nine printed types; each signature use may convert to that type. Automatically fail recall tests concerning suspended period. Store period as narrative context without inventing date precision.',
    selectionEffects: [
      {
        decision: 'complication.lost-in-time.damageType',
        operation: 'damage-type',
      },
    ],
  },
  'Lost Your Head': {
    grantedAbilities: ['Share Head'],
    conditionalText:
      'Grant Share Head: Psionic/Ranged maneuver, range 10 willing creature; senses and borrowed speech until different target/range/willingness ends. No own senses/speech except through ability; cannot wear head-required gear. Creature recipient is play-time target, not creation requirement.',
    selectionEffects: [],
  },
  Lucky: {
    conditionalText:
      'Spend hero token to save/reroll test, d10 >=6 retains token. Tier-1 test without token reroll gives next test bane.',
    selectionEffects: [],
  },
  'Master Chef': {
    fixedSkills: ['Cooking'],
    conditionalText:
      'Cooking fixed skill. After respite or sleep, uninterrupted hour with ingredients/tools feeds up to 10, each gets one free Recovery benefit within 24h. First daily meal not personally prepared loses two CURRENT Recoveries, not max.',
    selectionEffects: [],
  },
  'Meddling Butler': {
    conditionalText:
      'Gain one retainer, independent of Renown follower grants, but only one retainer may serve at once. Director controls retainer outside combat. Retainer identity/stat reference is setup dependency; playable companion subsystem remains deferred.',
    selectionEffects: [],
  },
  Medium: {
    grantedAbilities: ['Contact Spirits'],
    conditionalText:
      'Telepathic communication from incorporeal undead within 10. Grant Contact Spirits Magic/self main action: Intuition or Presence; tier1 corruption 5+level, tier2 spirit and one question, tier3 three; recently nearby dead hostile/friendly grant double bane/edge; recharge after >=1 Victory.',
    selectionEffects: [],
  },
  'Medusa Blood': {
    grantedAbilities: ['Stone Eyes'],
    conditionalText:
      'Grant Stone Eyes Magic/Ranged/Strike main action range10 one creature; Might or Presence; damage 2/4/6, Might potency weak/average/strong slows save ends; no effect if cannot see eyes/avoids gaze, 0 Stamina petrifies. Out of combat involuntary gaze trigger, companions know to avoid.',
    selectionEffects: [],
  },
  Misunderstood: {
    conditionalText:
      'Revealed appearance to unfamiliar creatures gives edge where Brag/Intimidate COULD apply, bane where Flirt/Lead/Persuade COULD apply. Does not grant those skills or require actually using them.',
    selectionEffects: [],
  },
  Mundane: {
    permanentModifiers: [
      {
        field: 'immunity.corruption',
        operation: 'set',
        value: 'level',
        quote: 'You have immunity to corruption, holy, and psychic damage equal to your level.',
      },
      {
        field: 'immunity.holy',
        operation: 'set',
        value: 'level',
        quote: 'You have immunity to corruption, holy, and psychic damage equal to your level.',
      },
      {
        field: 'immunity.psychic',
        operation: 'set',
        value: 'level',
        quote: 'You have immunity to corruption, holy, and psychic damage equal to your level.',
      },
    ],
    conditionalText:
      'Corruption/holy/psychic immunity equal level. Carrying >3 magic treasures gives bane on ALL power rolls, not only ability rolls. No prohibition on selecting magical classes.',
    selectionEffects: [],
  },
  Outlaw: {
    permanentModifiers: [
      {
        field: 'initialRenown',
        operation: 'add',
        value: 1,
        quote: 'You earn 1 Renown.',
      },
    ],
    conditionalText: 'One initial Renown. Recognizing law enforcers/bounty hunters attempt arrest.',
    selectionEffects: [],
  },
  Pirate: {
    conditionalText:
      'Renown TREATED +2 with pirates/pirate hunters only; no global Renown grant. Holds one map piece, other holders threaten and treasure cursed/haunted.',
    selectionEffects: [],
  },
  Preacher: {
    conditionalText:
      'Respite Presence conversion test at Director difficulty; success one Director-chosen follower, max one success per level. Failure loses Director-chosen existing follower else −1 Renown else if already zero no respite benefits. No starting follower or Renown change.',
    selectionEffects: [],
  },
  'Primordial Sickness': {
    permanentModifiers: [
      {
        field: 'immunity.corruption',
        operation: 'set',
        value: 5,
        quote: 'You have corruption immunity 5 and poison immunity 5.',
      },
      {
        field: 'immunity.poison',
        operation: 'set',
        value: 5,
        quote: 'You have corruption immunity 5 and poison immunity 5.',
      },
      {
        field: 'recoveriesMaximum',
        operation: 'add',
        value: -1,
        quote: 'Your number of Recoveries is permanently reduced by 1.',
      },
    ],
    conditionalText:
      'Corruption and poison immunity 5; maximum Recoveries −1. Permanent penalty must affect initial maximum and later derivation.',
    selectionEffects: [],
  },
  'Prisoner of the Synlirii': {
    conditionalText:
      'Telepathy within 10 with mutual awareness and shared language, target may respond. Voiceless talkers within one mile detect location and understand/overhear telepathy. No language grant.',
    selectionEffects: [],
  },
  'Promising Apprentice': {
    conditionalText:
      'Grant one new crafting skill, then independently target ANY owned crafting skill for edge. Bane on any test not using one of hero skills. Modifier target may equal newly granted skill but need not.',
    selectionEffects: [
      {
        decision: 'complication.promising-apprentice.edgeSkill',
        operation: 'skill-edge',
        value: 'edge',
      },
    ],
  },
  'Psychic Eruption': {
    grantedAbilities: ['Psychic Blast'],
    conditionalText:
      'Grant Psychic Blast heroic ability with special ALL Heroic Resource cost; Area/Psionic/main/3 burst/all creatures; highest characteristic; psychic per resource capped at level / level+highest / uncapped. Becoming bleeding/frightened/weakened forces free triggered use. Do not copy Forge default zero cost.',
    selectionEffects: [],
  },
  'Raised by Beasts': {
    fixedSkills: ['Handle Animals'],
    permanentModifiers: [
      {
        field: 'culture',
        operation: 'remove',
        value:
          'all culture aspects, their skills, language entitlement and culture-specific edges; retain Caelian',
        quote:
          "You don't have a culture (see Culture in Chapter 4: Background), though you can speak Caelian.",
      },
    ],
    conditionalText:
      'Grant Handle Animals; choose related animal type, edge on Handle Animals with type, communicate as shared language, normally not initially hostile. REMOVE culture including environment/organization/upbringing grants and culture language/edges; retain Caelian and unrelated career/class grants.',
    selectionEffects: [],
  },
  Refugee: {
    conditionalText:
      'Director and owner define family asset (trinket/leveled treasure/Wealth/project source/etc.) held by invaders. It is a future recoverable asset, not initial usable inventory or Wealth. Hostile faction may harm recognized hero.',
    selectionEffects: [],
  },
  Rival: {
    conditionalText:
      'Select owned skill: its ordinary +2 skill contribution becomes +3. Director separately specifies rival best skill; bane using it, regardless of hero ownership. No new skill granted.',
    selectionEffects: [
      {
        decision: 'complication.rival.betterSkill',
        operation: 'skill-bonus',
        value: 3,
      },
      {
        decision: 'complication.rival.rivalSkill',
        operation: 'skill-edge',
        value: 'bane',
      },
    ],
  },
  'Rogue Talent': {
    permanentModifiers: [
      {
        field: 'weakness.psychic',
        operation: 'set',
        value: 5,
        quote: 'You have psychic weakness 5.',
      },
    ],
    grantedAbilities: ['Telekinetic Grasp'],
    conditionalText:
      'Grant Telekinetic Grasp Psionic/Ranged/Strike maneuver usable as ranged free strike, range10 creature/object; Might/Intuition/Presence; push or pull 1/2/3, no damage. Psychic weakness 5.',
    selectionEffects: [],
  },
  Runaway: {
    conditionalText: 'One crafting skill. Extended family seeks return; narrative pressure only.',
    selectionEffects: [],
  },
  'Searching for a Cure': {
    conditionalText:
      'Choose monster type related to plight; saves against its abilities +1, characteristics TREATED +1 only to resist their potencies. Director and owner set campaign-relevant transformation timeline. Do not globally increase characteristics or saves.',
    selectionEffects: [],
  },
  'Secret Identity': {
    conditionalText:
      'One intrigue skill. True identity temporarily treats Renown and Wealth +2, with optional Director benefits; daily 20% cumulative discovery risk resets after full day hidden. No baseline Renown/Wealth grant.',
    selectionEffects: [],
  },
  'Secret Twin': {
    initialStateIntents: [
      'One selected treasure inventory grant, initialized once; selected treasure effects must be evaluated under owning inventory contract.',
    ],
    conditionalText:
      'One first-echelon trinket with twin marking. End-respite d10 1–2 allows Director past threat; no default assassin encounter at creation.',
    selectionEffects: [
      {
        decision: 'complication.secret-twin.trinket',
        operation: 'item',
      },
    ],
  },
  'Self-Taught': {
    conditionalText:
      'At own combat turn start may forgo ALL Heroic Resource gain until next turn start, to gain strike damage bonus = highest characteristic for same duration. Optional play stance, no permanent strike modifier.',
    selectionEffects: [],
  },
  'Sewer Folk': {
    permanentModifiers: [
      {
        field: 'weakness.poison',
        operation: 'set',
        value: 5,
        quote: 'You have poison weakness 5.',
      },
      {
        field: 'automaticFullSpeedMovement',
        operation: 'selected',
        value: 'climb OR swim',
        quote:
          'You can automatically climb or swim (your choice) at full speed while moving, and you never get lost while underground. Additionally, while in a city with sewers, you and your companions can move from place to place without being detected, as the Director determines.',
      },
    ],
    conditionalText:
      'Choose automatic full-speed climb OR swim, not both; never lost underground; city sewer undetected travel at Director determination. Poison weakness 5.',
    selectionEffects: [
      {
        decision: 'complication.sewer-folk.movement',
        operation: 'movement',
      },
    ],
  },
  'Shadow Born': {
    permanentModifiers: [
      {
        field: 'weakness.holy',
        operation: 'set',
        value: 5,
        quote: 'You have holy weakness 5.',
      },
    ],
    conditionalText:
      'EACH turn start with concealment gain one surge (not once per round). Holy weakness 5.',
    selectionEffects: [],
  },
  'Shared Spirit': {
    conditionalText:
      'Choose three currently owned skills usable only by self and three distinct new skills usable only by spirit. Other known skills stay available to either. Daily d6 1–4 self/5–6 spirit or choose if good terms; do not grant six skills unconditionally.',
    selectionEffects: [
      {
        decision: 'complication.shared-spirit.selfSkills',
        operation: 'skill-conditional',
        condition: 'self',
      },
      {
        decision: 'complication.shared-spirit.spiritSkills',
        operation: 'skill-conditional',
        condition: 'spirit',
      },
    ],
  },
  'Shattered Legacy': {
    initialStateIntents: [
      'One chosen broken leveled treasure and its project source; inoperative until repaired.',
    ],
    conditionalText:
      'One language and one leveled treasure chosen at build; treasure is BROKEN/inoperative and source for repair possessed. Craft Treasure repair at half normal project goal, must obtain item prerequisite. No treasure bonuses until repaired; retain item identity while broken.',
    selectionEffects: [
      {
        decision: 'complication.shattered-legacy.brokenTreasure',
        operation: 'item',
      },
    ],
  },
  Shipwrecked: {
    conditionalText:
      'Choose two exploration skills, then remove one currently known language of choice. Cannot remove empty deferred entitlement. Source says forgotten, not permanently barred from relearning.',
    selectionEffects: [
      {
        decision: 'complication.shipwrecked.forgottenLanguage',
        operation: 'language-remove',
      },
    ],
  },
  "Sibling's Shield": {
    conditionalText:
      'Sibling ceremonial shield on back prevents flanking, not a general kit shield bonus. Respite Intuition test cannot use skill; tiers1/2 regain one fewer CURRENT Recoveries. No permanent Recovery penalty.',
    selectionEffects: [],
  },
  'Silent Sentinel': {
    fixedSkills: ['Eavesdrop', 'Sneak'],
    permanentModifiers: [
      {
        field: 'weakness.sonic',
        operation: 'set',
        value: 5,
        quote:
          'You have sonic weakness 5. Additionally, whenever you take sonic damage, you are dazed until the end of your next turn.',
      },
    ],
    conditionalText:
      'Eavesdrop and Sneak fixed grants plus one lore skill. Mutual observation/shared language telepathy, no fixed range cap. Sonic weakness 5; sonic damage dazes until next turn end.',
    selectionEffects: [],
  },
  'Slight Case of Lycanthropy': {
    conditionalText:
      'Non-minion winded or killed gives surge. Turn start >=5 surges or >=1 under moonlight: lose all, wolf hybrid until turn end, shift speed toward nearest then mandatory melee free strike, ally wins tie. Ineligible Stormwight Fury only, not all Furies.',
    selectionEffects: [],
  },
  'Stolen Face': {
    conditionalText:
      'Five uninterrupted minutes to copy previously observed same-ancestry face, no hair/nonface changes; double edge impersonation/disguise tests. Taking damage blanks face until feature used, but senses/speech intact.',
    selectionEffects: [],
  },
  'Strange Inheritance': {
    initialStateIntents: [
      'One Director-chosen secret second-echelon trinket; conditional operation and revelation.',
    ],
    conditionalText:
      'DIRECTOR chooses unknown second-echelon trinket; operational only level+Victories >=5, powers hidden until first operational. First Wealth >1 loses one Wealth, one-time event; not global Wealth penalty.',
    selectionEffects: [
      {
        decision: 'complication.strange-inheritance.secretTrinket',
        operation: 'item',
      },
    ],
  },
  'Stripped of Rank': {
    permanentModifiers: [
      {
        field: 'followerRenownThresholds',
        operation: 'replace',
        value: [4, 8, 12, 16],
        quote:
          'Rather than attracting followers at 3, 6, 9, and 12 Renown, you can attract followers only when your Renown reaches 4, 8, 12, and 16. See Renown in Chapter 13: Rewards.',
      },
    ],
    grantedAbilities: ['Issue Order'],
    conditionalText:
      'Grant Issue Order ranged10 main action one ally: triggered main/maneuver/move; if hero has Strike Now, recipient free triggered instead. Follower Renown thresholds replace 3/6/9/12 with 4/8/12/16.',
    selectionEffects: [],
  },
  'Thrill Seeker': {
    conditionalText:
      'Party reaching 2/4/6 Victories grants hero token; session start excludes normal token for this hero. No starting stat changes.',
    selectionEffects: [],
  },
  'Vampire Scion': {
    conditionalText:
      'Adjacent melee free strike may bite; tier3 grants temporary Stamina = damage until next respite end. While that temporary Stamina persists fangs, Presence interaction bane with humanoids and progenitor location sense. No unconditional temporary Stamina.',
    selectionEffects: [],
  },
  'Voice in Your Head': {
    conditionalText:
      'Director provides useful vague voice advice; displeased voice may interrupt respite for two fewer Recoveries regained. No permanent Recovery modifier.',
    selectionEffects: [],
  },
  'Vow of Duty': {
    permanentModifiers: [
      {
        field: 'stability',
        operation: 'add',
        value: 1,
        quote: 'You gain a +1 bonus to stability.',
      },
    ],
    conditionalText:
      'Stability +1 baseline; forced disobedience SETS stability to 0 until doubts resolved/new organization, not merely removes +1.',
    selectionEffects: [],
  },
  'Vow of Honesty': {
    conditionalText:
      'Detect lower-level lies; double edge persuading specific fact. Lying disables benefit and causes interpersonal-skill test bane until penance. Neither grants Persuade skill nor allows permanently active benefit after oath broken.',
    selectionEffects: [],
  },
  'Waking Dreams': {
    conditionalText:
      'Each respite Reason test: tier1 lose Recovery AFTER finish; tier2 helpful brief current-world vision; tier3 >=1 minute. No build ability/initial Recovery loss.',
    selectionEffects: [],
  },
  'War Dog Collar': {
    grantedAbilities: ['Posthumous Retirement'],
    conditionalText:
      'Worn collar prevents others Posthumous Promotion on hero. Grant Posthumous Retirement Area/Magic maneuver 1 burst enemies, fire5+level; reset with uninterrupted minute out of combat. Director may spend3 Malice per use to hit hero too.',
    selectionEffects: [],
  },
  'War of Assassins': {
    initialStateIntents: ['assassin favors remaining=3'],
    conditionalText:
      'Initial three reasonable in-power favors from helped assassins faction. Other faction hostile. Favor count is spendable state, not three starting followers.',
    selectionEffects: [],
  },
  Ward: {
    conditionalText:
      'Negotiating with monarch/aristocrat/wealthy leader grants NPC patience+1 max5. Respite d10=1 forces helping ward instead of activity, not loss of other respite benefits.',
    selectionEffects: [],
  },
  Waterborn: {
    permanentModifiers: [
      {
        field: 'automaticFullSpeedMovement',
        operation: 'grant',
        value: 'swim',
        quote:
          'You can automatically swim at full speed while moving, and you can breathe underwater. Additionally, you have the following ability.',
      },
      {
        field: 'underwaterBreathing',
        operation: 'grant',
        value: true,
        quote:
          'You can automatically swim at full speed while moving, and you can breathe underwater. Additionally, you have the following ability.',
      },
      {
        field: 'weakness.lightning',
        operation: 'set',
        value: 5,
        quote:
          "You have lightning weakness 5. Additionally, the ocean or a creature it sends to seek you can assign you a quest. If you don't do the ocean's bidding, it might temporarily deny you this complication's benefits—including being able to breathe underwater—at an inconvenient time.",
      },
    ],
    grantedAbilities: ['Rogue Wave'],
    conditionalText:
      'Automatic full-speed swimming and underwater breathing plus Rogue Wave Magic/Ranged/Strike main range10 creature/object, highest characteristic, damage2/5/7 push-or-pull1/2/3, can forgo damage. Lightning weakness5; ocean may temporarily withdraw benefits for disobedience.',
    selectionEffects: [],
  },
  Wodewalker: {
    permanentModifiers: [
      {
        field: 'recoveryValue',
        operation: 'addAfterBaseline',
        value: 'highest characteristic',
        quote:
          'Your recovery value increases by an amount equal to your highest characteristic score.',
      },
      {
        field: 'weakness.fire',
        operation: 'set',
        value: 5,
        quote: 'You have fire weakness 5.',
      },
    ],
    conditionalText:
      'Recovery value adds highest characteristic AFTER floor(max Stamina/3). Fire weakness5; recalculate highest when build changes.',
    selectionEffects: [],
  },
  'Wrathful Spirit': {
    conditionalText:
      'While taunted, edge striking taunter; may spend1 Heroic Resource for double edge. Being struck while not taunted creates taunt until next turn end; insults force insult response or spend Recovery.',
    selectionEffects: [],
  },
  'Wrongly Imprisoned': {
    conditionalText:
      'Two distinct skills from crafting/exploration/intrigue/lore UNION. Winded cough prevents hiding/sneaking; no permanent loss of Sneak skill.',
    selectionEffects: [],
  },
};

/** Keys match the stable selection values (canonical source names), not Forge aliases. */
export const COMPLICATION_EFFECTS: Record<string, ComplicationEffect> = Object.fromEntries(
  complicationSource.map(record => [
    record.name,
    {
      id: record.id,
      source: record.sourcePath.replace('vendor/steel-compendium/', ''),
      fullText: record.text,
      fixedSkills: [],
      permanentModifiers: [],
      conditionalText: '',
      initialStateIntents: [],
      selectionEffects: [],
      ...AUTHORED_EFFECTS[record.name],
      grantedAbilities: COMPLICATION_ABILITIES.filter(
        ability => ability.complication === record.name && !ability.selectedTrait,
      ).map(ability => ability.name),
    },
  ]),
);

const SOURCE_POOLS: Record<string, string[]> = {
  craftingSkills: [
    'Alchemy',
    'Architecture',
    'Blacksmithing',
    'Carpentry',
    'Cooking',
    'Fletching',
    'Forgery',
    'Jewelry',
    'Mechanics',
    'Tailoring',
  ],
  explorationSkills: [
    'Climb',
    'Drive',
    'Endurance',
    'Gymnastics',
    'Heal',
    'Jump',
    'Lift',
    'Navigate',
    'Ride',
    'Swim',
  ],
  interpersonalSkills: [
    'Brag',
    'Empathize',
    'Flirt',
    'Gamble',
    'Handle Animals',
    'Interrogate',
    'Intimidate',
    'Lead',
    'Lie',
    'Music',
    'Perform',
    'Persuade',
    'Read Person',
  ],
  intrigueSkills: [
    'Alertness',
    'Conceal Object',
    'Disguise',
    'Eavesdrop',
    'Escape Artist',
    'Hide',
    'Pick Lock',
    'Pick Pocket',
    'Sabotage',
    'Search',
    'Sneak',
    'Track',
  ],
  loreSkills: [
    'Criminal Underworld',
    'Culture',
    'History',
    'Magic',
    'Monsters',
    'Nature',
    'Psionics',
    'Religion',
    'Rumors',
    'Society',
    'Strategy',
    'Timescape',
  ],
  allSkills: [
    'Alchemy',
    'Architecture',
    'Blacksmithing',
    'Carpentry',
    'Cooking',
    'Fletching',
    'Forgery',
    'Jewelry',
    'Mechanics',
    'Tailoring',
    'Climb',
    'Drive',
    'Endurance',
    'Gymnastics',
    'Heal',
    'Jump',
    'Lift',
    'Navigate',
    'Ride',
    'Swim',
    'Brag',
    'Empathize',
    'Flirt',
    'Gamble',
    'Handle Animals',
    'Interrogate',
    'Intimidate',
    'Lead',
    'Lie',
    'Music',
    'Perform',
    'Persuade',
    'Read Person',
    'Alertness',
    'Conceal Object',
    'Disguise',
    'Eavesdrop',
    'Escape Artist',
    'Hide',
    'Pick Lock',
    'Pick Pocket',
    'Sabotage',
    'Search',
    'Sneak',
    'Track',
    'Criminal Underworld',
    'Culture',
    'History',
    'Magic',
    'Monsters',
    'Nature',
    'Psionics',
    'Religion',
    'Rumors',
    'Society',
    'Strategy',
    'Timescape',
  ],
  nonInterpersonalSkills: [
    'Alchemy',
    'Architecture',
    'Blacksmithing',
    'Carpentry',
    'Cooking',
    'Fletching',
    'Forgery',
    'Jewelry',
    'Mechanics',
    'Tailoring',
    'Climb',
    'Drive',
    'Endurance',
    'Gymnastics',
    'Heal',
    'Jump',
    'Lift',
    'Navigate',
    'Ride',
    'Swim',
    'Alertness',
    'Conceal Object',
    'Disguise',
    'Eavesdrop',
    'Escape Artist',
    'Hide',
    'Pick Lock',
    'Pick Pocket',
    'Sabotage',
    'Search',
    'Sneak',
    'Track',
    'Criminal Underworld',
    'Culture',
    'History',
    'Magic',
    'Monsters',
    'Nature',
    'Psionics',
    'Religion',
    'Rumors',
    'Society',
    'Strategy',
    'Timescape',
  ],
  interpersonalOrIntrigueSkills: [
    'Brag',
    'Empathize',
    'Flirt',
    'Gamble',
    'Handle Animals',
    'Interrogate',
    'Intimidate',
    'Lead',
    'Lie',
    'Music',
    'Perform',
    'Persuade',
    'Read Person',
    'Alertness',
    'Conceal Object',
    'Disguise',
    'Eavesdrop',
    'Escape Artist',
    'Hide',
    'Pick Lock',
    'Pick Pocket',
    'Sabotage',
    'Search',
    'Sneak',
    'Track',
  ],
  hunterSkills: [
    'Interrogate',
    'Alertness',
    'Eavesdrop',
    'Search',
    'Track',
    'Criminal Underworld',
    'Rumors',
    'Society',
  ],
  damageTypes: [
    'acid',
    'cold',
    'corruption',
    'fire',
    'holy',
    'lightning',
    'poison',
    'psychic',
    'sonic',
  ],
  deadLanguages: [
    'Ananjali',
    'High Rhyvian',
    'Khamish',
    'Kheltivari',
    'Low Rhyvian',
    'Old Variac',
    'Phorialtic',
    'Rallarian',
    'Ullorvic',
  ],
  firstEchelonTrinkets: [
    'Color Cloak (Blue)',
    'Color Cloak (Red)',
    'Color Cloak (Yellow)',
    'Deadweight',
    'Displacing Replacement Bracer',
    'Divine Vine',
    'Flameshade Gloves',
    'Gecko Gloves',
    'Hellcharger Helm',
    'Mask of the Many',
    'Quantum Satchel',
    'Unbinder Boots',
  ],
  secondEchelonTrinkets: [
    'Bastion Belt',
    'Evilest Eye',
    'Insightful Crown',
    'Key of Inquiry',
    "Mediator's Charm",
    'Necklace of the Bayou',
    'Scannerstone',
    "Stop-'n-Go Coin",
  ],
  leveledTreasures: [
    'Adaptive Second Skin of Toxins',
    'Chain of the Sea and Sky',
    'Grand Scarab',
    "King's Roar",
    "Kuran'zoi Prismscale",
    'Paper Trappings',
    'Shrouded Memory',
    'Spiny Turtle',
    'Star-Hunter',
    'Telekinetic Bulwark',
    "Abjurer's Bastion",
    'Brittlebreaker',
    'Chaldorb',
    'Ether-Fueled Vessel',
    'Foesense Lenses',
    'Words Become Wonders at Next Breath',
    "Authority's End",
    'Blade of Quintessence',
    'Blade of the Luxurious Fop',
    'Displacer',
    "Executioner's Blade",
    'Icemaker Maul',
    'Knife of Nine',
    'Lance of the Sundered Star',
    'Molten Constrictor',
    'Onerous Bow',
    'Steeltongue',
    'Third Eye Seeker',
    'Thunderhead Bident',
    'Wetwork',
    'Bloodbound Band',
    'Bloody Hand Wraps',
    'Lightning Treads',
    "Revenger's Wrap",
    'Thief of Joy',
  ],
  leveledWeapons: [
    "Authority's End",
    'Blade of Quintessence',
    'Blade of the Luxurious Fop',
    'Displacer',
    "Executioner's Blade",
    'Icemaker Maul',
    'Knife of Nine',
    'Lance of the Sundered Star',
    'Molten Constrictor',
    'Onerous Bow',
    'Steeltongue',
    'Third Eye Seeker',
    'Thunderhead Bident',
    'Wetwork',
  ],
  artifacts: ['Blade of a Thousand Years', 'Encepter', 'Mortal Coil'],
};

export const SECOND_ECHELON_TRINKETS = SOURCE_POOLS.secondEchelonTrinkets;

export const COMPLICATION_HEROIC_ABILITY_POOL = [
  {
    name: 'Arrest',
    source: 'en/unified/md/feature/ability/censor/level-1/arrest.md',
    class: 'censor',
    level: 1,
    cost: '5 Wrath',
  },
  {
    name: 'Behold a Shield of Faith!',
    source: 'en/unified/md/feature/ability/censor/level-1/behold-a-shield-of-faith.md',
    class: 'censor',
    level: 1,
    cost: '3 Wrath',
  },
  {
    name: 'Behold the Face of Justice!',
    source: 'en/unified/md/feature/ability/censor/level-1/behold-the-face-of-justice.md',
    class: 'censor',
    level: 1,
    cost: '5 Wrath',
  },
  {
    name: 'Censored',
    source: 'en/unified/md/feature/ability/censor/level-1/censored.md',
    class: 'censor',
    level: 1,
    cost: '5 Wrath',
  },
  {
    name: 'Driving Assault',
    source: 'en/unified/md/feature/ability/censor/level-1/driving-assault.md',
    class: 'censor',
    level: 1,
    cost: '3 Wrath',
  },
  {
    name: 'Purifying Fire',
    source: 'en/unified/md/feature/ability/censor/level-1/purifying-fire.md',
    class: 'censor',
    level: 1,
    cost: '5 Wrath',
  },
  {
    name: 'Repent!',
    source: 'en/unified/md/feature/ability/censor/level-1/repent.md',
    class: 'censor',
    level: 1,
    cost: '3 Wrath',
  },
  {
    name: 'The Gods Punish and Defend',
    source: 'en/unified/md/feature/ability/censor/level-1/the-gods-punish-and-defend.md',
    class: 'censor',
    level: 1,
    cost: '3 Wrath',
  },
  {
    name: 'Blessing of the Faithful',
    source: 'en/unified/md/feature/ability/censor/level-2/blessing-of-the-faithful.md',
    class: 'censor',
    level: 2,
    cost: '5 Wrath',
  },
  {
    name: 'It Is Justice You Fear',
    source: 'en/unified/md/feature/ability/censor/level-2/it-is-justice-you-fear.md',
    class: 'censor',
    level: 2,
    cost: '5 Wrath',
  },
  {
    name: 'Prescient Grace',
    source: 'en/unified/md/feature/ability/censor/level-2/prescient-grace.md',
    class: 'censor',
    level: 2,
    cost: '5 Wrath',
  },
  {
    name: 'Revelator',
    source: 'en/unified/md/feature/ability/censor/level-2/revelator.md',
    class: 'censor',
    level: 2,
    cost: '5 Wrath',
  },
  {
    name: 'Sentenced',
    source: 'en/unified/md/feature/ability/censor/level-2/sentenced.md',
    class: 'censor',
    level: 2,
    cost: '5 Wrath',
  },
  {
    name: 'With My Blessing',
    source: 'en/unified/md/feature/ability/censor/level-2/with-my-blessing.md',
    class: 'censor',
    level: 2,
    cost: '5 Wrath',
  },
  {
    name: 'Edict of Disruptive Isolation',
    source: 'en/unified/md/feature/ability/censor/level-3/edict-of-disruptive-isolation.md',
    class: 'censor',
    level: 3,
    cost: '7 Wrath',
  },
  {
    name: 'Edict of Perfect Order',
    source: 'en/unified/md/feature/ability/censor/level-3/edict-of-perfect-order.md',
    class: 'censor',
    level: 3,
    cost: '7 Wrath',
  },
  {
    name: 'Edict of Purifying Pacifism',
    source: 'en/unified/md/feature/ability/censor/level-3/edict-of-purifying-pacifism.md',
    class: 'censor',
    level: 3,
    cost: '7 Wrath',
  },
  {
    name: 'Edict of Stillness',
    source: 'en/unified/md/feature/ability/censor/level-3/edict-of-stillness.md',
    class: 'censor',
    level: 3,
    cost: '7 Wrath',
  },
  {
    name: 'Gods Grant Thee Strength',
    source: 'en/unified/md/feature/ability/censor/level-5/gods-grant-thee-strength.md',
    class: 'censor',
    level: 5,
    cost: '9 Wrath',
  },
  {
    name: 'Orison of Victory',
    source: 'en/unified/md/feature/ability/censor/level-5/orison-of-victory.md',
    class: 'censor',
    level: 5,
    cost: '9 Wrath',
  },
  {
    name: 'Righteous Judgment',
    source: 'en/unified/md/feature/ability/censor/level-5/righteous-judgment.md',
    class: 'censor',
    level: 5,
    cost: '9 Wrath',
  },
  {
    name: 'Shield of the Righteous',
    source: 'en/unified/md/feature/ability/censor/level-5/shield-of-the-righteous.md',
    class: 'censor',
    level: 5,
    cost: '9 Wrath',
  },
  {
    name: 'Begone!',
    source: 'en/unified/md/feature/ability/censor/level-6/begone.md',
    class: 'censor',
    level: 6,
    cost: '9 Wrath',
  },
  {
    name: 'Burden of Evil',
    source: 'en/unified/md/feature/ability/censor/level-6/burden-of-evil.md',
    class: 'censor',
    level: 6,
    cost: '9 Wrath',
  },
  {
    name: 'Congregation',
    source: 'en/unified/md/feature/ability/censor/level-6/congregation.md',
    class: 'censor',
    level: 6,
    cost: '9 Wrath',
  },
  {
    name: 'Edict of Peace',
    source: 'en/unified/md/feature/ability/censor/level-6/edict-of-peace.md',
    class: 'censor',
    level: 6,
    cost: '9 Wrath',
  },
  {
    name: 'Intercede',
    source: 'en/unified/md/feature/ability/censor/level-6/intercede.md',
    class: 'censor',
    level: 6,
    cost: '9 Wrath',
  },
  {
    name: 'Pain of Your Own Making',
    source: 'en/unified/md/feature/ability/censor/level-6/pain-of-your-own-making.md',
    class: 'censor',
    level: 6,
    cost: '9 Wrath',
  },
  {
    name: 'Trinity of Trickery',
    source: 'en/unified/md/feature/ability/censor/level-7/trinity-of-trickery.md',
    class: 'censor',
    level: 7,
    cost: '9 Wrath',
  },
  {
    name: 'Excommunication',
    source: 'en/unified/md/feature/ability/censor/level-8/excommunication.md',
    class: 'censor',
    level: 8,
    cost: '11 Wrath',
  },
  {
    name: 'Hand of the Gods',
    source: 'en/unified/md/feature/ability/censor/level-8/hand-of-the-gods.md',
    class: 'censor',
    level: 8,
    cost: '11 Wrath',
  },
  {
    name: 'Pillar of Holy Fire',
    source: 'en/unified/md/feature/ability/censor/level-8/pillar-of-holy-fire.md',
    class: 'censor',
    level: 8,
    cost: '11 Wrath',
  },
  {
    name: 'Your Allies Turn on You!',
    source: 'en/unified/md/feature/ability/censor/level-8/your-allies-turn-on-you.md',
    class: 'censor',
    level: 8,
    cost: '11 Wrath',
  },
  {
    name: 'Apostate',
    source: 'en/unified/md/feature/ability/censor/level-9/apostate.md',
    class: 'censor',
    level: 9,
    cost: '11 Wrath',
  },
  {
    name: 'Banish',
    source: 'en/unified/md/feature/ability/censor/level-9/banish.md',
    class: 'censor',
    level: 9,
    cost: '11 Wrath',
  },
  {
    name: 'Blessing and a Curse',
    source: 'en/unified/md/feature/ability/censor/level-9/blessing-and-a-curse.md',
    class: 'censor',
    level: 9,
    cost: '11 Wrath',
  },
  {
    name: 'Edict of Unyielding Resolve',
    source: 'en/unified/md/feature/ability/censor/level-9/edict-of-unyielding-resolve.md',
    class: 'censor',
    level: 9,
    cost: '11 Wrath',
  },
  {
    name: 'Fulfill Your Destiny',
    source: 'en/unified/md/feature/ability/censor/level-9/fulfill-your-destiny.md',
    class: 'censor',
    level: 9,
    cost: '11 Wrath',
  },
  {
    name: 'Terror Manifest',
    source: 'en/unified/md/feature/ability/censor/level-9/terror-manifest.md',
    class: 'censor',
    level: 9,
    cost: '11 Wrath',
  },
  {
    name: 'Call the Thunder Down',
    source: 'en/unified/md/feature/ability/conduit/level-1/call-the-thunder-down.md',
    class: 'conduit',
    level: 1,
    cost: '3 Piety',
  },
  {
    name: "Corruption's Curse",
    source: 'en/unified/md/feature/ability/conduit/level-1/corruptions-curse.md',
    class: 'conduit',
    level: 1,
    cost: '5 Piety',
  },
  {
    name: 'Curse of Terror',
    source: 'en/unified/md/feature/ability/conduit/level-1/curse-of-terror.md',
    class: 'conduit',
    level: 1,
    cost: '5 Piety',
  },
  {
    name: 'Faith Is Our Armor',
    source: 'en/unified/md/feature/ability/conduit/level-1/faith-is-our-armor.md',
    class: 'conduit',
    level: 1,
    cost: '5 Piety',
  },
  {
    name: 'Font of Wrath',
    source: 'en/unified/md/feature/ability/conduit/level-1/font-of-wrath.md',
    class: 'conduit',
    level: 1,
    cost: '3 Piety',
  },
  {
    name: "Judgment's Hammer",
    source: 'en/unified/md/feature/ability/conduit/level-1/judgments-hammer.md',
    class: 'conduit',
    level: 1,
    cost: '3 Piety',
  },
  {
    name: 'Sermon of Grace',
    source: 'en/unified/md/feature/ability/conduit/level-1/sermon-of-grace.md',
    class: 'conduit',
    level: 1,
    cost: '5 Piety',
  },
  {
    name: 'Violence Will Not Aid Thee',
    source: 'en/unified/md/feature/ability/conduit/level-1/violence-will-not-aid-thee.md',
    class: 'conduit',
    level: 1,
    cost: '3 Piety',
  },
  {
    name: 'Blessing of Fate and Destiny',
    source: 'en/unified/md/feature/ability/conduit/level-2/blessing-of-fate-and-destiny.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Blessing of Insight',
    source: 'en/unified/md/feature/ability/conduit/level-2/blessing-of-insight.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Divine Comedy',
    source: 'en/unified/md/feature/ability/conduit/level-2/divine-comedy.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Morning Light',
    source: 'en/unified/md/feature/ability/conduit/level-2/morning-light.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Nature Judges Thee',
    source: 'en/unified/md/feature/ability/conduit/level-2/nature-judges-thee.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Our Hearts Your Strength',
    source: 'en/unified/md/feature/ability/conduit/level-2/our-hearts-your-strength.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Reap',
    source: 'en/unified/md/feature/ability/conduit/level-2/reap.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Sacred Bond',
    source: 'en/unified/md/feature/ability/conduit/level-2/sacred-bond.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: "Saint's Tempest",
    source: 'en/unified/md/feature/ability/conduit/level-2/saints-tempest.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Statue of Power',
    source: 'en/unified/md/feature/ability/conduit/level-2/statue-of-power.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'The Gods Command You Obey',
    source: 'en/unified/md/feature/ability/conduit/level-2/the-gods-command-you-obey.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Wellspring of Grace',
    source: 'en/unified/md/feature/ability/conduit/level-2/wellspring-of-grace.md',
    class: 'conduit',
    level: 2,
    cost: '5 Piety',
  },
  {
    name: 'Fear of the Gods',
    source: 'en/unified/md/feature/ability/conduit/level-3/fear-of-the-gods.md',
    class: 'conduit',
    level: 3,
    cost: '7 Piety',
  },
  {
    name: "Saint's Raiment",
    source: 'en/unified/md/feature/ability/conduit/level-3/saints-raiment.md',
    class: 'conduit',
    level: 3,
    cost: '7 Piety',
  },
  {
    name: 'Soul Siphon',
    source: 'en/unified/md/feature/ability/conduit/level-3/soul-siphon.md',
    class: 'conduit',
    level: 3,
    cost: '7 Piety',
  },
  {
    name: 'Words of Wrath and Grace',
    source: 'en/unified/md/feature/ability/conduit/level-3/words-of-wrath-and-grace.md',
    class: 'conduit',
    level: 3,
    cost: '7 Piety',
  },
  {
    name: 'Beacon of Grace',
    source: 'en/unified/md/feature/ability/conduit/level-5/beacon-of-grace.md',
    class: 'conduit',
    level: 5,
    cost: '9 Piety',
  },
  {
    name: 'Penance',
    source: 'en/unified/md/feature/ability/conduit/level-5/penance.md',
    class: 'conduit',
    level: 5,
    cost: '9 Piety',
  },
  {
    name: 'Sanctuary',
    source: 'en/unified/md/feature/ability/conduit/level-5/sanctuary.md',
    class: 'conduit',
    level: 5,
    cost: '9 Piety',
  },
  {
    name: 'Vessel of Retribution',
    source: 'en/unified/md/feature/ability/conduit/level-5/vessel-of-retribution.md',
    class: 'conduit',
    level: 5,
    cost: '9 Piety',
  },
  {
    name: 'Aura of Souls',
    source: 'en/unified/md/feature/ability/conduit/level-6/aura-of-souls.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Blade of the Heavens',
    source: 'en/unified/md/feature/ability/conduit/level-6/blade-of-the-heavens.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Blessing of the Midday Sun',
    source: 'en/unified/md/feature/ability/conduit/level-6/blessing-of-the-midday-sun.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Cuirass of the Gods',
    source: 'en/unified/md/feature/ability/conduit/level-6/cuirass-of-the-gods.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: "Gods' Machine",
    source: 'en/unified/md/feature/ability/conduit/level-6/gods-machine.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Invocation of Mystery',
    source: 'en/unified/md/feature/ability/conduit/level-6/invocation-of-mystery.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Invocation of Undoing',
    source: 'en/unified/md/feature/ability/conduit/level-6/invocation-of-undoing.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Lauded by God',
    source: 'en/unified/md/feature/ability/conduit/level-6/lauded-by-god.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Lightning Lord',
    source: 'en/unified/md/feature/ability/conduit/level-6/lightning-lord.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Revitalizing Grace',
    source: 'en/unified/md/feature/ability/conduit/level-6/revitalizing-grace.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Spirit Stampede',
    source: 'en/unified/md/feature/ability/conduit/level-6/spirit-stampede.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Your Story Ends Here',
    source: 'en/unified/md/feature/ability/conduit/level-6/your-story-ends-here.md',
    class: 'conduit',
    level: 6,
    cost: '9 Piety',
  },
  {
    name: 'Trinity of Trickery',
    source: 'en/unified/md/feature/ability/conduit/level-7/trinity-of-trickery.md',
    class: 'conduit',
    level: 7,
    cost: '9 Piety',
  },
  {
    name: 'Arise!',
    source: 'en/unified/md/feature/ability/conduit/level-8/arise.md',
    class: 'conduit',
    level: 8,
    cost: '11 Piety',
  },
  {
    name: 'Blessing of Steel',
    source: 'en/unified/md/feature/ability/conduit/level-8/blessing-of-steel.md',
    class: 'conduit',
    level: 8,
    cost: '11 Piety',
  },
  {
    name: 'Blessing of the Blade',
    source: 'en/unified/md/feature/ability/conduit/level-8/blessing-of-the-blade.md',
    class: 'conduit',
    level: 8,
    cost: '11 Piety',
  },
  {
    name: 'Drag the Unworthy',
    source: 'en/unified/md/feature/ability/conduit/level-8/drag-the-unworthy.md',
    class: 'conduit',
    level: 8,
    cost: '11 Piety',
  },
  {
    name: 'Alacrity of the Heart',
    source: 'en/unified/md/feature/ability/conduit/level-9/alacrity-of-the-heart.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Bend Fate',
    source: 'en/unified/md/feature/ability/conduit/level-9/bend-fate.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Blessing of the Fortress',
    source: 'en/unified/md/feature/ability/conduit/level-9/blessing-of-the-fortress.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Divine Dragon',
    source: 'en/unified/md/feature/ability/conduit/level-9/divine-dragon.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Godstorm',
    source: 'en/unified/md/feature/ability/conduit/level-9/godstorm.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Night Falls',
    source: 'en/unified/md/feature/ability/conduit/level-9/night-falls.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Radiance of Grace',
    source: 'en/unified/md/feature/ability/conduit/level-9/radiance-of-grace.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Righteous Phalanx',
    source: 'en/unified/md/feature/ability/conduit/level-9/righteous-phalanx.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Solar Flare',
    source: 'en/unified/md/feature/ability/conduit/level-9/solar-flare.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Thorn Cage',
    source: 'en/unified/md/feature/ability/conduit/level-9/thorn-cage.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Word of Final Redemption',
    source: 'en/unified/md/feature/ability/conduit/level-9/word-of-final-redemption.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Word of Weakening',
    source: 'en/unified/md/feature/ability/conduit/level-9/word-of-weakening.md',
    class: 'conduit',
    level: 9,
    cost: '11 Piety',
  },
  {
    name: 'Behold the Mystery',
    source: 'en/unified/md/feature/ability/elementalist/level-1/behold-the-mystery.md',
    class: 'elementalist',
    level: 1,
    cost: '3 Essence',
  },
  {
    name: 'Conflagration',
    source: 'en/unified/md/feature/ability/elementalist/level-1/conflagration.md',
    class: 'elementalist',
    level: 1,
    cost: '5 Essence',
  },
  {
    name: 'Instantaneous Excavation',
    source: 'en/unified/md/feature/ability/elementalist/level-1/instantaneous-excavation.md',
    class: 'elementalist',
    level: 1,
    cost: '5 Essence',
  },
  {
    name: 'Invigorating Growth',
    source: 'en/unified/md/feature/ability/elementalist/level-1/invigorating-growth.md',
    class: 'elementalist',
    level: 1,
    cost: '3 Essence',
  },
  {
    name: 'No More Than a Breeze',
    source: 'en/unified/md/feature/ability/elementalist/level-1/no-more-than-a-breeze.md',
    class: 'elementalist',
    level: 1,
    cost: '5 Essence',
  },
  {
    name: 'Ripples in the Earth',
    source: 'en/unified/md/feature/ability/elementalist/level-1/ripples-in-the-earth.md',
    class: 'elementalist',
    level: 1,
    cost: '3 Essence',
  },
  {
    name: 'Test of Rain',
    source: 'en/unified/md/feature/ability/elementalist/level-1/test-of-rain.md',
    class: 'elementalist',
    level: 1,
    cost: '5 Essence',
  },
  {
    name: 'The Flesh, a Crucible',
    source: 'en/unified/md/feature/ability/elementalist/level-1/the-flesh-a-crucible.md',
    class: 'elementalist',
    level: 1,
    cost: '3 Essence',
  },
  {
    name: 'O Flower Aid, O Earth Defend',
    source: 'en/unified/md/feature/ability/elementalist/level-2/o-flower-aid-o-earth-defend.md',
    class: 'elementalist',
    level: 2,
    cost: '5 Essence',
  },
  {
    name: 'Subvert the Green Within',
    source: 'en/unified/md/feature/ability/elementalist/level-2/subvert-the-green-within.md',
    class: 'elementalist',
    level: 2,
    cost: '5 Essence',
  },
  {
    name: 'Translated Through Flame',
    source: 'en/unified/md/feature/ability/elementalist/level-2/translated-through-flame.md',
    class: 'elementalist',
    level: 2,
    cost: '5 Essence',
  },
  {
    name: "Volcano's Embrace",
    source: 'en/unified/md/feature/ability/elementalist/level-2/volcanos-embrace.md',
    class: 'elementalist',
    level: 2,
    cost: '5 Essence',
  },
  {
    name: 'Erase',
    source: 'en/unified/md/feature/ability/elementalist/level-3/erase.md',
    class: 'elementalist',
    level: 3,
    cost: '7 Essence',
  },
  {
    name: 'Maw of Earth',
    source: 'en/unified/md/feature/ability/elementalist/level-3/maw-of-earth.md',
    class: 'elementalist',
    level: 3,
    cost: '7 Essence',
  },
  {
    name: 'Swarm of Spirits',
    source: 'en/unified/md/feature/ability/elementalist/level-3/swarm-of-spirits.md',
    class: 'elementalist',
    level: 3,
    cost: '7 Essence',
  },
  {
    name: 'Wall of Fire',
    source: 'en/unified/md/feature/ability/elementalist/level-3/wall-of-fire.md',
    class: 'elementalist',
    level: 3,
    cost: '7 Essence',
  },
  {
    name: 'Combustion Deferred',
    source: 'en/unified/md/feature/ability/elementalist/level-5/combustion-deferred.md',
    class: 'elementalist',
    level: 5,
    cost: '9 Essence',
  },
  {
    name: 'Storm of Sands',
    source: 'en/unified/md/feature/ability/elementalist/level-5/storm-of-sands.md',
    class: 'elementalist',
    level: 5,
    cost: '9 Essence',
  },
  {
    name: 'Subverted Perception of Space',
    source: 'en/unified/md/feature/ability/elementalist/level-5/subverted-perception-of-space.md',
    class: 'elementalist',
    level: 5,
    cost: '9 Essence',
  },
  {
    name: "Web of All That's Come Before",
    source: 'en/unified/md/feature/ability/elementalist/level-5/web-of-all-thats-come-before.md',
    class: 'elementalist',
    level: 5,
    cost: '9 Essence',
  },
  {
    name: 'Luminous Champion Aloft',
    source: 'en/unified/md/feature/ability/elementalist/level-6/luminous-champion-aloft.md',
    class: 'elementalist',
    level: 6,
    cost: '9 Essence',
  },
  {
    name: 'Magma Titan',
    source: 'en/unified/md/feature/ability/elementalist/level-6/magma-titan.md',
    class: 'elementalist',
    level: 6,
    cost: '9 Essence',
  },
  {
    name: 'Meteor',
    source: 'en/unified/md/feature/ability/elementalist/level-6/meteor.md',
    class: 'elementalist',
    level: 6,
    cost: '9 Essence',
  },
  {
    name: 'The Wode Remembers and Returns',
    source: 'en/unified/md/feature/ability/elementalist/level-6/the-wode-remembers-and-returns.md',
    class: 'elementalist',
    level: 6,
    cost: '9 Essence',
  },
  {
    name: 'Heart of the Wode',
    source: 'en/unified/md/feature/ability/elementalist/level-8/heart-of-the-wode.md',
    class: 'elementalist',
    level: 8,
    cost: '11 Essence',
  },
  {
    name: 'Muse of Fire',
    source: 'en/unified/md/feature/ability/elementalist/level-8/muse-of-fire.md',
    class: 'elementalist',
    level: 8,
    cost: '11 Essence',
  },
  {
    name: 'Return to Oblivion',
    source: 'en/unified/md/feature/ability/elementalist/level-8/return-to-oblivion.md',
    class: 'elementalist',
    level: 8,
    cost: '11 Essence',
  },
  {
    name: 'World Torn Asunder',
    source: 'en/unified/md/feature/ability/elementalist/level-8/world-torn-asunder.md',
    class: 'elementalist',
    level: 8,
    cost: '11 Essence',
  },
  {
    name: 'Earth Rejects You',
    source: 'en/unified/md/feature/ability/elementalist/level-9/earth-rejects-you.md',
    class: 'elementalist',
    level: 9,
    cost: '11 Essence',
  },
  {
    name: 'Prism',
    source: 'en/unified/md/feature/ability/elementalist/level-9/prism.md',
    class: 'elementalist',
    level: 9,
    cost: '11 Essence',
  },
  {
    name: 'The Green Defends Its Servants',
    source: 'en/unified/md/feature/ability/elementalist/level-9/the-green-defends-its-servants.md',
    class: 'elementalist',
    level: 9,
    cost: '11 Essence',
  },
  {
    name: 'Unquenchable Fire',
    source: 'en/unified/md/feature/ability/elementalist/level-9/unquenchable-fire.md',
    class: 'elementalist',
    level: 9,
    cost: '11 Essence',
  },
  {
    name: 'Back!',
    source: 'en/unified/md/feature/ability/fury/level-1/back.md',
    class: 'fury',
    level: 1,
    cost: '3 Ferocity',
  },
  {
    name: 'Blood for Blood!',
    source: 'en/unified/md/feature/ability/fury/level-1/blood-for-blood.md',
    class: 'fury',
    level: 1,
    cost: '5 Ferocity',
  },
  {
    name: 'Make Peace With Your God!',
    source: 'en/unified/md/feature/ability/fury/level-1/make-peace-with-your-god.md',
    class: 'fury',
    level: 1,
    cost: '5 Ferocity',
  },
  {
    name: 'Out of the Way!',
    source: 'en/unified/md/feature/ability/fury/level-1/out-of-the-way.md',
    class: 'fury',
    level: 1,
    cost: '3 Ferocity',
  },
  {
    name: 'Thunder Roar',
    source: 'en/unified/md/feature/ability/fury/level-1/thunder-roar.md',
    class: 'fury',
    level: 1,
    cost: '5 Ferocity',
  },
  {
    name: 'Tide of Death',
    source: 'en/unified/md/feature/ability/fury/level-1/tide-of-death.md',
    class: 'fury',
    level: 1,
    cost: '3 Ferocity',
  },
  {
    name: 'To the Uttermost End',
    source: 'en/unified/md/feature/ability/fury/level-1/to-the-uttermost-end.md',
    class: 'fury',
    level: 1,
    cost: '5 Ferocity',
  },
  {
    name: 'Your Entrails Are Your Extrails!',
    source: 'en/unified/md/feature/ability/fury/level-1/your-entrails-are-your-extrails.md',
    class: 'fury',
    level: 1,
    cost: '3 Ferocity',
  },
  {
    name: 'Apex Predator',
    source: 'en/unified/md/feature/ability/fury/level-2/apex-predator.md',
    class: 'fury',
    level: 2,
    cost: '5 Ferocity',
  },
  {
    name: 'Death... Death!',
    source: 'en/unified/md/feature/ability/fury/level-2/death-death.md',
    class: 'fury',
    level: 2,
    cost: '5 Ferocity',
  },
  {
    name: 'Phalanx-Breaker',
    source: 'en/unified/md/feature/ability/fury/level-2/phalanx-breaker.md',
    class: 'fury',
    level: 2,
    cost: '5 Ferocity',
  },
  {
    name: 'Special Delivery',
    source: 'en/unified/md/feature/ability/fury/level-2/special-delivery.md',
    class: 'fury',
    level: 2,
    cost: '5 Ferocity',
  },
  {
    name: 'Visceral Roar',
    source: 'en/unified/md/feature/ability/fury/level-2/visceral-roar.md',
    class: 'fury',
    level: 2,
    cost: '5 Ferocity',
  },
  {
    name: 'Wrecking Ball',
    source: 'en/unified/md/feature/ability/fury/level-2/wrecking-ball.md',
    class: 'fury',
    level: 2,
    cost: '5 Ferocity',
  },
  {
    name: 'Demon Unleashed',
    source: 'en/unified/md/feature/ability/fury/level-3/demon-unleashed.md',
    class: 'fury',
    level: 3,
    cost: '7 Ferocity',
  },
  {
    name: 'Face the Storm!',
    source: 'en/unified/md/feature/ability/fury/level-3/face-the-storm.md',
    class: 'fury',
    level: 3,
    cost: '7 Ferocity',
  },
  {
    name: 'Steelbreaker',
    source: 'en/unified/md/feature/ability/fury/level-3/steelbreaker.md',
    class: 'fury',
    level: 3,
    cost: '7 Ferocity',
  },
  {
    name: 'You Are Already Dead',
    source: 'en/unified/md/feature/ability/fury/level-3/you-are-already-dead.md',
    class: 'fury',
    level: 3,
    cost: '7 Ferocity',
  },
  {
    name: 'Debilitating Strike',
    source: 'en/unified/md/feature/ability/fury/level-5/debilitating-strike.md',
    class: 'fury',
    level: 5,
    cost: '9 Ferocity',
  },
  {
    name: 'My Turn!',
    source: 'en/unified/md/feature/ability/fury/level-5/my-turn.md',
    class: 'fury',
    level: 5,
    cost: '9 Ferocity',
  },
  {
    name: 'Rebounding Storm',
    source: 'en/unified/md/feature/ability/fury/level-5/rebounding-storm.md',
    class: 'fury',
    level: 5,
    cost: '9 Ferocity',
  },
  {
    name: 'To Stone!',
    source: 'en/unified/md/feature/ability/fury/level-5/to-stone.md',
    class: 'fury',
    level: 5,
    cost: '9 Ferocity',
  },
  {
    name: 'Avalanche Impact',
    source: 'en/unified/md/feature/ability/fury/level-6/avalanche-impact.md',
    class: 'fury',
    level: 6,
    cost: '9 Ferocity',
  },
  {
    name: 'Death Strike',
    source: 'en/unified/md/feature/ability/fury/level-6/death-strike.md',
    class: 'fury',
    level: 6,
    cost: '9 Ferocity',
  },
  {
    name: 'Force of Storms',
    source: 'en/unified/md/feature/ability/fury/level-6/force-of-storms.md',
    class: 'fury',
    level: 6,
    cost: '9 Ferocity',
  },
  {
    name: 'Pounce',
    source: 'en/unified/md/feature/ability/fury/level-6/pounce.md',
    class: 'fury',
    level: 6,
    cost: '9 Ferocity',
  },
  {
    name: 'Riders on the Storm',
    source: 'en/unified/md/feature/ability/fury/level-6/riders-on-the-storm.md',
    class: 'fury',
    level: 6,
    cost: '9 Ferocity',
  },
  {
    name: 'Seek and Destroy',
    source: 'en/unified/md/feature/ability/fury/level-6/seek-and-destroy.md',
    class: 'fury',
    level: 6,
    cost: '9 Ferocity',
  },
  {
    name: 'Elemental Ferocity',
    source: 'en/unified/md/feature/ability/fury/level-8/elemental-ferocity.md',
    class: 'fury',
    level: 8,
    cost: '11 Ferocity',
  },
  {
    name: 'Overkill',
    source: 'en/unified/md/feature/ability/fury/level-8/overkill.md',
    class: 'fury',
    level: 8,
    cost: '11 Ferocity',
  },
  {
    name: 'Primordial Rage',
    source: 'en/unified/md/feature/ability/fury/level-8/primordial-rage.md',
    class: 'fury',
    level: 8,
    cost: '11 Ferocity',
  },
  {
    name: 'Relentless Death',
    source: 'en/unified/md/feature/ability/fury/level-8/relentless-death.md',
    class: 'fury',
    level: 8,
    cost: '11 Ferocity',
  },
  {
    name: 'Death Comes for You All!',
    source: 'en/unified/md/feature/ability/fury/level-9/death-comes-for-you-all.md',
    class: 'fury',
    level: 9,
    cost: '11 Ferocity',
  },
  {
    name: 'Death Rattle',
    source: 'en/unified/md/feature/ability/fury/level-9/death-rattle.md',
    class: 'fury',
    level: 9,
    cost: '11 Ferocity',
  },
  {
    name: 'Deluge',
    source: 'en/unified/md/feature/ability/fury/level-9/deluge.md',
    class: 'fury',
    level: 9,
    cost: '11 Ferocity',
  },
  {
    name: 'Primordial Bane',
    source: 'en/unified/md/feature/ability/fury/level-9/primordial-bane.md',
    class: 'fury',
    level: 9,
    cost: '11 Ferocity',
  },
  {
    name: 'Primordial Vortex',
    source: 'en/unified/md/feature/ability/fury/level-9/primordial-vortex.md',
    class: 'fury',
    level: 9,
    cost: '11 Ferocity',
  },
  {
    name: 'Shower of Blood',
    source: 'en/unified/md/feature/ability/fury/level-9/shower-of-blood.md',
    class: 'fury',
    level: 9,
    cost: '11 Ferocity',
  },
  {
    name: 'A Squad Unto Myself',
    source: 'en/unified/md/feature/ability/null/level-1/a-squad-unto-myself.md',
    class: 'null',
    level: 1,
    cost: '5 Discipline',
  },
  {
    name: 'Arcane Disruptor',
    source: 'en/unified/md/feature/ability/null/level-1/arcane-disruptor.md',
    class: 'null',
    level: 1,
    cost: '5 Discipline',
  },
  {
    name: 'Chronal Spike',
    source: 'en/unified/md/feature/ability/null/level-1/chronal-spike.md',
    class: 'null',
    level: 1,
    cost: '3 Discipline',
  },
  {
    name: 'Impart Force',
    source: 'en/unified/md/feature/ability/null/level-1/impart-force.md',
    class: 'null',
    level: 1,
    cost: '5 Discipline',
  },
  {
    name: 'Phase Strike',
    source: 'en/unified/md/feature/ability/null/level-1/phase-strike.md',
    class: 'null',
    level: 1,
    cost: '5 Discipline',
  },
  {
    name: 'Psychic Pulse',
    source: 'en/unified/md/feature/ability/null/level-1/psychic-pulse.md',
    class: 'null',
    level: 1,
    cost: '3 Discipline',
  },
  {
    name: 'Relentless Nemesis',
    source: 'en/unified/md/feature/ability/null/level-1/relentless-nemesis.md',
    class: 'null',
    level: 1,
    cost: '3 Discipline',
  },
  {
    name: 'Stunning Blow',
    source: 'en/unified/md/feature/ability/null/level-1/stunning-blow.md',
    class: 'null',
    level: 1,
    cost: '3 Discipline',
  },
  {
    name: 'Blur',
    source: 'en/unified/md/feature/ability/null/level-2/blur.md',
    class: 'null',
    level: 2,
    cost: '5 Discipline',
  },
  {
    name: 'Entropic Field',
    source: 'en/unified/md/feature/ability/null/level-2/entropic-field.md',
    class: 'null',
    level: 2,
    cost: '5 Discipline',
  },
  {
    name: 'Force Redirected',
    source: 'en/unified/md/feature/ability/null/level-2/force-redirected.md',
    class: 'null',
    level: 2,
    cost: '5 Discipline',
  },
  {
    name: 'Gravitic Strike',
    source: 'en/unified/md/feature/ability/null/level-2/gravitic-strike.md',
    class: 'null',
    level: 2,
    cost: '5 Discipline',
  },
  {
    name: 'Heat Sink',
    source: 'en/unified/md/feature/ability/null/level-2/heat-sink.md',
    class: 'null',
    level: 2,
    cost: '5 Discipline',
  },
  {
    name: 'Kinetic Shield',
    source: 'en/unified/md/feature/ability/null/level-2/kinetic-shield.md',
    class: 'null',
    level: 2,
    cost: '5 Discipline',
  },
  {
    name: 'Absorption Field',
    source: 'en/unified/md/feature/ability/null/level-3/absorption-field.md',
    class: 'null',
    level: 3,
    cost: '7 Discipline',
  },
  {
    name: 'Molecular Rearrangement Field',
    source: 'en/unified/md/feature/ability/null/level-3/molecular-rearrangement-field.md',
    class: 'null',
    level: 3,
    cost: '7 Discipline',
  },
  {
    name: 'Stabilizing Field',
    source: 'en/unified/md/feature/ability/null/level-3/stabilizing-field.md',
    class: 'null',
    level: 3,
    cost: '7 Discipline',
  },
  {
    name: 'Synapse Field',
    source: 'en/unified/md/feature/ability/null/level-3/synapse-field.md',
    class: 'null',
    level: 3,
    cost: '7 Discipline',
  },
  {
    name: 'Anticipating Strike',
    source: 'en/unified/md/feature/ability/null/level-5/anticipating-strike.md',
    class: 'null',
    level: 5,
    cost: '9 Discipline',
  },
  {
    name: 'Iron Grip',
    source: 'en/unified/md/feature/ability/null/level-5/iron-grip.md',
    class: 'null',
    level: 5,
    cost: '9 Discipline',
  },
  {
    name: 'Phase Leap',
    source: 'en/unified/md/feature/ability/null/level-5/phase-leap.md',
    class: 'null',
    level: 5,
    cost: '9 Discipline',
  },
  {
    name: 'Synaptic Reset',
    source: 'en/unified/md/feature/ability/null/level-5/synaptic-reset.md',
    class: 'null',
    level: 5,
    cost: '9 Discipline',
  },
  {
    name: 'Gravitic Charge',
    source: 'en/unified/md/feature/ability/null/level-6/gravitic-charge.md',
    class: 'null',
    level: 6,
    cost: '9 Discipline',
  },
  {
    name: 'Ice Pillars',
    source: 'en/unified/md/feature/ability/null/level-6/ice-pillars.md',
    class: 'null',
    level: 6,
    cost: '9 Discipline',
  },
  {
    name: 'Interphase',
    source: 'en/unified/md/feature/ability/null/level-6/interphase.md',
    class: 'null',
    level: 6,
    cost: '9 Discipline',
  },
  {
    name: 'Iron Body',
    source: 'en/unified/md/feature/ability/null/level-6/iron-body.md',
    class: 'null',
    level: 6,
    cost: '9 Discipline',
  },
  {
    name: 'Phase Step',
    source: 'en/unified/md/feature/ability/null/level-6/phase-step.md',
    class: 'null',
    level: 6,
    cost: '9 Discipline',
  },
  {
    name: 'Wall of Ice',
    source: 'en/unified/md/feature/ability/null/level-6/wall-of-ice.md',
    class: 'null',
    level: 6,
    cost: '9 Discipline',
  },
  {
    name: 'Arcane Purge',
    source: 'en/unified/md/feature/ability/null/level-8/arcane-purge.md',
    class: 'null',
    level: 8,
    cost: '11 Discipline',
  },
  {
    name: 'Phase Hurl',
    source: 'en/unified/md/feature/ability/null/level-8/phase-hurl.md',
    class: 'null',
    level: 8,
    cost: '11 Discipline',
  },
  {
    name: 'Scalar Assault',
    source: 'en/unified/md/feature/ability/null/level-8/scalar-assault.md',
    class: 'null',
    level: 8,
    cost: '11 Discipline',
  },
  {
    name: 'Synaptic Anchor',
    source: 'en/unified/md/feature/ability/null/level-8/synaptic-anchor.md',
    class: 'null',
    level: 8,
    cost: '11 Discipline',
  },
  {
    name: 'Absolute Zero',
    source: 'en/unified/md/feature/ability/null/level-9/absolute-zero.md',
    class: 'null',
    level: 9,
    cost: '11 Discipline',
  },
  {
    name: 'Arrestor Cycle',
    source: 'en/unified/md/feature/ability/null/level-9/arrestor-cycle.md',
    class: 'null',
    level: 9,
    cost: '11 Discipline',
  },
  {
    name: 'Heat Drain',
    source: 'en/unified/md/feature/ability/null/level-9/heat-drain.md',
    class: 'null',
    level: 9,
    cost: '11 Discipline',
  },
  {
    name: 'Inertial Absorption',
    source: 'en/unified/md/feature/ability/null/level-9/inertial-absorption.md',
    class: 'null',
    level: 9,
    cost: '11 Discipline',
  },
  {
    name: 'Realitas',
    source: 'en/unified/md/feature/ability/null/level-9/realitas.md',
    class: 'null',
    level: 9,
    cost: '11 Discipline',
  },
  {
    name: 'Time Loop',
    source: 'en/unified/md/feature/ability/null/level-9/time-loop.md',
    class: 'null',
    level: 9,
    cost: '11 Discipline',
  },
  {
    name: 'Clever Trick',
    source: 'en/unified/md/feature/ability/shadow/level-1/clever-trick.md',
    class: 'shadow',
    level: 1,
    cost: '1 Insight',
  },
  {
    name: 'Coup de Grace',
    source: 'en/unified/md/feature/ability/shadow/level-1/coup-de-grace.md',
    class: 'shadow',
    level: 1,
    cost: '5 Insight',
  },
  {
    name: 'Disorienting Strike',
    source: 'en/unified/md/feature/ability/shadow/level-1/disorienting-strike.md',
    class: 'shadow',
    level: 1,
    cost: '3 Insight',
  },
  {
    name: 'Eviscerate',
    source: 'en/unified/md/feature/ability/shadow/level-1/eviscerate.md',
    class: 'shadow',
    level: 1,
    cost: '3 Insight',
  },
  {
    name: 'Get In Get Out',
    source: 'en/unified/md/feature/ability/shadow/level-1/get-in-get-out.md',
    class: 'shadow',
    level: 1,
    cost: '3 Insight',
  },
  {
    name: 'Hesitation Is Weakness',
    source: 'en/unified/md/feature/ability/shadow/level-1/hesitation-is-weakness.md',
    class: 'shadow',
    level: 1,
    cost: '1 Insight',
  },
  {
    name: 'One Hundred Throats',
    source: 'en/unified/md/feature/ability/shadow/level-1/one-hundred-throats.md',
    class: 'shadow',
    level: 1,
    cost: '5 Insight',
  },
  {
    name: 'Setup',
    source: 'en/unified/md/feature/ability/shadow/level-1/setup.md',
    class: 'shadow',
    level: 1,
    cost: '5 Insight',
  },
  {
    name: 'Shadowstrike',
    source: 'en/unified/md/feature/ability/shadow/level-1/shadowstrike.md',
    class: 'shadow',
    level: 1,
    cost: '5 Insight',
  },
  {
    name: 'Two Throats at Once',
    source: 'en/unified/md/feature/ability/shadow/level-1/two-throats-at-once.md',
    class: 'shadow',
    level: 1,
    cost: '3 Insight',
  },
  {
    name: 'In a Puff of Ash',
    source: 'en/unified/md/feature/ability/shadow/level-2/in-a-puff-of-ash.md',
    class: 'shadow',
    level: 2,
    cost: '5 Insight',
  },
  {
    name: 'Machinations of Sound',
    source: 'en/unified/md/feature/ability/shadow/level-2/machinations-of-sound.md',
    class: 'shadow',
    level: 2,
    cost: '5 Insight',
  },
  {
    name: 'So Gullible',
    source: 'en/unified/md/feature/ability/shadow/level-2/so-gullible.md',
    class: 'shadow',
    level: 2,
    cost: '5 Insight',
  },
  {
    name: 'Sticky Bomb',
    source: 'en/unified/md/feature/ability/shadow/level-2/sticky-bomb.md',
    class: 'shadow',
    level: 2,
    cost: '5 Insight',
  },
  {
    name: 'Stink Bomb',
    source: 'en/unified/md/feature/ability/shadow/level-2/stink-bomb.md',
    class: 'shadow',
    level: 2,
    cost: '5 Insight',
  },
  {
    name: 'Too Slow',
    source: 'en/unified/md/feature/ability/shadow/level-2/too-slow.md',
    class: 'shadow',
    level: 2,
    cost: '5 Insight',
  },
  {
    name: 'Dancer',
    source: 'en/unified/md/feature/ability/shadow/level-3/dancer.md',
    class: 'shadow',
    level: 3,
    cost: '7 Insight',
  },
  {
    name: 'Misdirecting Strike',
    source: 'en/unified/md/feature/ability/shadow/level-3/misdirecting-strike.md',
    class: 'shadow',
    level: 3,
    cost: '7 Insight',
  },
  {
    name: 'Pinning Shot',
    source: 'en/unified/md/feature/ability/shadow/level-3/pinning-shot.md',
    class: 'shadow',
    level: 3,
    cost: '7 Insight',
  },
  {
    name: 'Staggering Blow',
    source: 'en/unified/md/feature/ability/shadow/level-3/staggering-blow.md',
    class: 'shadow',
    level: 3,
    cost: '7 Insight',
  },
  {
    name: 'Blackout',
    source: 'en/unified/md/feature/ability/shadow/level-5/blackout.md',
    class: 'shadow',
    level: 5,
    cost: '9 Insight',
  },
  {
    name: 'Into the Shadows',
    source: 'en/unified/md/feature/ability/shadow/level-5/into-the-shadows.md',
    class: 'shadow',
    level: 5,
    cost: '9 Insight',
  },
  {
    name: 'Shadowfall',
    source: 'en/unified/md/feature/ability/shadow/level-5/shadowfall.md',
    class: 'shadow',
    level: 5,
    cost: '9 Insight',
  },
  {
    name: 'You Talk Too Much',
    source: 'en/unified/md/feature/ability/shadow/level-5/you-talk-too-much.md',
    class: 'shadow',
    level: 5,
    cost: '9 Insight',
  },
  {
    name: 'Black Ash Eruption',
    source: 'en/unified/md/feature/ability/shadow/level-6/black-ash-eruption.md',
    class: 'shadow',
    level: 6,
    cost: '9 Insight',
  },
  {
    name: 'Cinderstorm',
    source: 'en/unified/md/feature/ability/shadow/level-6/cinderstorm.md',
    class: 'shadow',
    level: 6,
    cost: '9 Insight',
  },
  {
    name: 'Look!',
    source: 'en/unified/md/feature/ability/shadow/level-6/look.md',
    class: 'shadow',
    level: 6,
    cost: '9 Insight',
  },
  {
    name: 'One Vial Makes You Better',
    source: 'en/unified/md/feature/ability/shadow/level-6/one-vial-makes-you-better.md',
    class: 'shadow',
    level: 6,
    cost: '9 Insight',
  },
  {
    name: 'One Vial Makes You Faster',
    source: 'en/unified/md/feature/ability/shadow/level-6/one-vial-makes-you-faster.md',
    class: 'shadow',
    level: 6,
    cost: '9 Insight',
  },
  {
    name: 'Puppet Strings',
    source: 'en/unified/md/feature/ability/shadow/level-6/puppet-strings.md',
    class: 'shadow',
    level: 6,
    cost: '9 Insight',
  },
  {
    name: 'Assassinate',
    source: 'en/unified/md/feature/ability/shadow/level-8/assassinate.md',
    class: 'shadow',
    level: 8,
    cost: '11 Insight',
  },
  {
    name: 'Shadowgrasp',
    source: 'en/unified/md/feature/ability/shadow/level-8/shadowgrasp.md',
    class: 'shadow',
    level: 8,
    cost: '11 Insight',
  },
  {
    name: 'Speed of Shadows',
    source: 'en/unified/md/feature/ability/shadow/level-8/speed-of-shadows.md',
    class: 'shadow',
    level: 8,
    cost: '11 Insight',
  },
  {
    name: 'They Always Line Up',
    source: 'en/unified/md/feature/ability/shadow/level-8/they-always-line-up.md',
    class: 'shadow',
    level: 8,
    cost: '11 Insight',
  },
  {
    name: 'Cacophony of Cinders',
    source: 'en/unified/md/feature/ability/shadow/level-9/cacophony-of-cinders.md',
    class: 'shadow',
    level: 9,
    cost: '11 Insight',
  },
  {
    name: 'Chain Reaction',
    source: 'en/unified/md/feature/ability/shadow/level-9/chain-reaction.md',
    class: 'shadow',
    level: 9,
    cost: '11 Insight',
  },
  {
    name: 'Demon Door',
    source: 'en/unified/md/feature/ability/shadow/level-9/demon-door.md',
    class: 'shadow',
    level: 9,
    cost: '11 Insight',
  },
  {
    name: 'I Am You',
    source: 'en/unified/md/feature/ability/shadow/level-9/i-am-you.md',
    class: 'shadow',
    level: 9,
    cost: '11 Insight',
  },
  {
    name: 'It Was Me All Along',
    source: 'en/unified/md/feature/ability/shadow/level-9/it-was-me-all-along.md',
    class: 'shadow',
    level: 9,
    cost: '11 Insight',
  },
  {
    name: 'To the Stars',
    source: 'en/unified/md/feature/ability/shadow/level-9/to-the-stars.md',
    class: 'shadow',
    level: 9,
    cost: '11 Insight',
  },
  {
    name: 'Battle Cry',
    source: 'en/unified/md/feature/ability/tactician/level-1/battle-cry.md',
    class: 'tactician',
    level: 1,
    cost: '3 Focus',
  },
  {
    name: 'Concussive Strike',
    source: 'en/unified/md/feature/ability/tactician/level-1/concussive-strike.md',
    class: 'tactician',
    level: 1,
    cost: '3 Focus',
  },
  {
    name: 'Hammer and Anvil',
    source: 'en/unified/md/feature/ability/tactician/level-1/hammer-and-anvil.md',
    class: 'tactician',
    level: 1,
    cost: '5 Focus',
  },
  {
    name: 'Inspiring Strike',
    source: 'en/unified/md/feature/ability/tactician/level-1/inspiring-strike.md',
    class: 'tactician',
    level: 1,
    cost: '3 Focus',
  },
  {
    name: 'Mind Game',
    source: 'en/unified/md/feature/ability/tactician/level-1/mind-game.md',
    class: 'tactician',
    level: 1,
    cost: '5 Focus',
  },
  {
    name: 'Now!',
    source: 'en/unified/md/feature/ability/tactician/level-1/now.md',
    class: 'tactician',
    level: 1,
    cost: '5 Focus',
  },
  {
    name: 'Squad! Forward!',
    source: 'en/unified/md/feature/ability/tactician/level-1/squad-forward.md',
    class: 'tactician',
    level: 1,
    cost: '3 Focus',
  },
  {
    name: 'This Is What We Planned For',
    source: 'en/unified/md/feature/ability/tactician/level-1/this-is-what-we-planned-for.md',
    class: 'tactician',
    level: 1,
    cost: '5 Focus',
  },
  {
    name: 'Fog of War',
    source: 'en/unified/md/feature/ability/tactician/level-2/fog-of-war.md',
    class: 'tactician',
    level: 2,
    cost: '5 Focus',
  },
  {
    name: "I've Got Your Back",
    source: 'en/unified/md/feature/ability/tactician/level-2/ive-got-your-back.md',
    class: 'tactician',
    level: 2,
    cost: '5 Focus',
  },
  {
    name: 'No Dying on My Watch',
    source: 'en/unified/md/feature/ability/tactician/level-2/no-dying-on-my-watch.md',
    class: 'tactician',
    level: 2,
    cost: '5 Focus',
  },
  {
    name: 'Squad! On Me!',
    source: 'en/unified/md/feature/ability/tactician/level-2/squad-on-me.md',
    class: 'tactician',
    level: 2,
    cost: '5 Focus',
  },
  {
    name: 'Targets of Opportunity',
    source: 'en/unified/md/feature/ability/tactician/level-2/targets-of-opportunity.md',
    class: 'tactician',
    level: 2,
    cost: '5 Focus',
  },
  {
    name: 'Try Me Instead',
    source: 'en/unified/md/feature/ability/tactician/level-2/try-me-instead.md',
    class: 'tactician',
    level: 2,
    cost: '5 Focus',
  },
  {
    name: 'Frontal Assault',
    source: 'en/unified/md/feature/ability/tactician/level-3/frontal-assault.md',
    class: 'tactician',
    level: 3,
    cost: '7 Focus',
  },
  {
    name: "Hit 'Em Hard!",
    source: 'en/unified/md/feature/ability/tactician/level-3/hit-em-hard.md',
    class: 'tactician',
    level: 3,
    cost: '7 Focus',
  },
  {
    name: 'Rout',
    source: 'en/unified/md/feature/ability/tactician/level-3/rout.md',
    class: 'tactician',
    level: 3,
    cost: '7 Focus',
  },
  {
    name: 'Stay Strong and Focus!',
    source: 'en/unified/md/feature/ability/tactician/level-3/stay-strong-and-focus.md',
    class: 'tactician',
    level: 3,
    cost: '7 Focus',
  },
  {
    name: 'Squad! Gear Check!',
    source: 'en/unified/md/feature/ability/tactician/level-5/squad-gear-check.md',
    class: 'tactician',
    level: 5,
    cost: '9 Focus',
  },
  {
    name: 'Squad! Remember Your Training!',
    source: 'en/unified/md/feature/ability/tactician/level-5/squad-remember-your-training.md',
    class: 'tactician',
    level: 5,
    cost: '9 Focus',
  },
  {
    name: 'Win This Day!',
    source: 'en/unified/md/feature/ability/tactician/level-5/win-this-day.md',
    class: 'tactician',
    level: 5,
    cost: '9 Focus',
  },
  {
    name: "You've Still Got Something Left",
    source: 'en/unified/md/feature/ability/tactician/level-5/youve-still-got-something-left.md',
    class: 'tactician',
    level: 5,
    cost: '9 Focus',
  },
  {
    name: 'Battle Plan',
    source: 'en/unified/md/feature/ability/tactician/level-6/battle-plan.md',
    class: 'tactician',
    level: 6,
    cost: '9 Focus',
  },
  {
    name: 'Coordinated Execution',
    source: 'en/unified/md/feature/ability/tactician/level-6/coordinated-execution.md',
    class: 'tactician',
    level: 6,
    cost: '9 Focus',
  },
  {
    name: 'Hustle!',
    source: 'en/unified/md/feature/ability/tactician/level-6/hustle.md',
    class: 'tactician',
    level: 6,
    cost: '9 Focus',
  },
  {
    name: 'Instant Retaliation',
    source: 'en/unified/md/feature/ability/tactician/level-6/instant-retaliation.md',
    class: 'tactician',
    level: 6,
    cost: '9 Focus',
  },
  {
    name: 'Panic in Their Lines',
    source: 'en/unified/md/feature/ability/tactician/level-6/panic-in-their-lines.md',
    class: 'tactician',
    level: 6,
    cost: '9 Focus',
  },
  {
    name: 'To Me Squad!',
    source: 'en/unified/md/feature/ability/tactician/level-6/to-me-squad.md',
    class: 'tactician',
    level: 6,
    cost: '9 Focus',
  },
  {
    name: 'Finish Them!',
    source: 'en/unified/md/feature/ability/tactician/level-8/finish-them.md',
    class: 'tactician',
    level: 8,
    cost: '11 Focus',
  },
  {
    name: 'Floodgates Open',
    source: 'en/unified/md/feature/ability/tactician/level-8/floodgates-open.md',
    class: 'tactician',
    level: 8,
    cost: '11 Focus',
  },
  {
    name: 'Go Now and Speed Well',
    source: 'en/unified/md/feature/ability/tactician/level-8/go-now-and-speed-well.md',
    class: 'tactician',
    level: 8,
    cost: '11 Focus',
  },
  {
    name: "I'll Open and You'll Close",
    source: 'en/unified/md/feature/ability/tactician/level-8/ill-open-and-youll-close.md',
    class: 'tactician',
    level: 8,
    cost: '11 Focus',
  },
  {
    name: 'Blot Out the Sun!',
    source: 'en/unified/md/feature/ability/tactician/level-9/blot-out-the-sun.md',
    class: 'tactician',
    level: 9,
    cost: '11 Focus',
  },
  {
    name: 'Counterstrategy',
    source: 'en/unified/md/feature/ability/tactician/level-9/counterstrategy.md',
    class: 'tactician',
    level: 9,
    cost: '11 Focus',
  },
  {
    name: 'No Escape',
    source: 'en/unified/md/feature/ability/tactician/level-9/no-escape.md',
    class: 'tactician',
    level: 9,
    cost: '11 Focus',
  },
  {
    name: 'Squad! Hit and Run!',
    source: 'en/unified/md/feature/ability/tactician/level-9/squad-hit-and-run.md',
    class: 'tactician',
    level: 9,
    cost: '11 Focus',
  },
  {
    name: 'That One Is Mine!',
    source: 'en/unified/md/feature/ability/tactician/level-9/that-one-is-mine.md',
    class: 'tactician',
    level: 9,
    cost: '11 Focus',
  },
  {
    name: 'Their Lack of Focus Is Their Undoing',
    source:
      'en/unified/md/feature/ability/tactician/level-9/their-lack-of-focus-is-their-undoing.md',
    class: 'tactician',
    level: 9,
    cost: '11 Focus',
  },
  {
    name: 'Awe',
    source: 'en/unified/md/feature/ability/talent/level-1/awe.md',
    class: 'talent',
    level: 1,
    cost: '3 Clarity',
  },
  {
    name: 'Choke',
    source: 'en/unified/md/feature/ability/talent/level-1/choke.md',
    class: 'talent',
    level: 1,
    cost: '3 Clarity',
  },
  {
    name: 'Flashback',
    source: 'en/unified/md/feature/ability/talent/level-1/flashback.md',
    class: 'talent',
    level: 1,
    cost: '5 Clarity',
  },
  {
    name: 'Inertia Soak',
    source: 'en/unified/md/feature/ability/talent/level-1/inertia-soak.md',
    class: 'talent',
    level: 1,
    cost: '5 Clarity',
  },
  {
    name: 'Iron',
    source: 'en/unified/md/feature/ability/talent/level-1/iron.md',
    class: 'talent',
    level: 1,
    cost: '5 Clarity',
  },
  {
    name: 'Perfect Clarity',
    source: 'en/unified/md/feature/ability/talent/level-1/perfect-clarity.md',
    class: 'talent',
    level: 1,
    cost: '5 Clarity',
  },
  {
    name: 'Precognition',
    source: 'en/unified/md/feature/ability/talent/level-1/precognition.md',
    class: 'talent',
    level: 1,
    cost: '3 Clarity',
  },
  {
    name: 'Smolder',
    source: 'en/unified/md/feature/ability/talent/level-1/smolder.md',
    class: 'talent',
    level: 1,
    cost: '3 Clarity',
  },
  {
    name: 'Applied Chronometrics',
    source: 'en/unified/md/feature/ability/talent/level-2/applied-chronometrics.md',
    class: 'talent',
    level: 2,
    cost: '5 Clarity',
  },
  {
    name: 'Gravitic Burst',
    source: 'en/unified/md/feature/ability/talent/level-2/gravitic-burst.md',
    class: 'talent',
    level: 2,
    cost: '5 Clarity',
  },
  {
    name: 'Levity and Gravity',
    source: 'en/unified/md/feature/ability/talent/level-2/levity-and-gravity.md',
    class: 'talent',
    level: 2,
    cost: '5 Clarity',
  },
  {
    name: 'Overwhelm',
    source: 'en/unified/md/feature/ability/talent/level-2/overwhelm.md',
    class: 'talent',
    level: 2,
    cost: '5 Clarity',
  },
  {
    name: 'Slow',
    source: 'en/unified/md/feature/ability/talent/level-2/slow.md',
    class: 'talent',
    level: 2,
    cost: '5 Clarity',
  },
  {
    name: 'Synaptic Override',
    source: 'en/unified/md/feature/ability/talent/level-2/synaptic-override.md',
    class: 'talent',
    level: 2,
    cost: '5 Clarity',
  },
  {
    name: 'Fling Through Time',
    source: 'en/unified/md/feature/ability/talent/level-3/fling-through-time.md',
    class: 'talent',
    level: 3,
    cost: '7 Clarity',
  },
  {
    name: 'Force Orbs',
    source: 'en/unified/md/feature/ability/talent/level-3/force-orbs.md',
    class: 'talent',
    level: 3,
    cost: '7 Clarity',
  },
  {
    name: 'Reflector Field',
    source: 'en/unified/md/feature/ability/talent/level-3/reflector-field.md',
    class: 'talent',
    level: 3,
    cost: '7 Clarity',
  },
  {
    name: 'Soul Burn',
    source: 'en/unified/md/feature/ability/talent/level-3/soul-burn.md',
    class: 'talent',
    level: 3,
    cost: '7 Clarity',
  },
  {
    name: 'Exothermic Shield',
    source: 'en/unified/md/feature/ability/talent/level-5/exothermic-shield.md',
    class: 'talent',
    level: 5,
    cost: '9 Clarity',
  },
  {
    name: 'Hypersonic',
    source: 'en/unified/md/feature/ability/talent/level-5/hypersonic.md',
    class: 'talent',
    level: 5,
    cost: '9 Clarity',
  },
  {
    name: 'Mind Snare',
    source: 'en/unified/md/feature/ability/talent/level-5/mind-snare.md',
    class: 'talent',
    level: 5,
    cost: '9 Clarity',
  },
  {
    name: 'Soulbound',
    source: 'en/unified/md/feature/ability/talent/level-5/soulbound.md',
    class: 'talent',
    level: 5,
    cost: '9 Clarity',
  },
  {
    name: 'Fate',
    source: 'en/unified/md/feature/ability/talent/level-6/fate.md',
    class: 'talent',
    level: 6,
    cost: '9 Clarity',
  },
  {
    name: 'Gravitic Well',
    source: 'en/unified/md/feature/ability/talent/level-6/gravitic-well.md',
    class: 'talent',
    level: 6,
    cost: '9 Clarity',
  },
  {
    name: 'Greater Kinetic Grip',
    source: 'en/unified/md/feature/ability/talent/level-6/greater-kinetic-grip.md',
    class: 'talent',
    level: 6,
    cost: '9 Clarity',
  },
  {
    name: 'Stasis Field',
    source: 'en/unified/md/feature/ability/talent/level-6/stasis-field.md',
    class: 'talent',
    level: 6,
    cost: '9 Clarity',
  },
  {
    name: 'Synaptic Conditioning',
    source: 'en/unified/md/feature/ability/talent/level-6/synaptic-conditioning.md',
    class: 'talent',
    level: 6,
    cost: '9 Clarity',
  },
  {
    name: 'Synaptic Dissipation',
    source: 'en/unified/md/feature/ability/talent/level-6/synaptic-dissipation.md',
    class: 'talent',
    level: 6,
    cost: '9 Clarity',
  },
  {
    name: 'Doubt',
    source: 'en/unified/md/feature/ability/talent/level-8/doubt.md',
    class: 'talent',
    level: 8,
    cost: '11 Clarity',
  },
  {
    name: 'Mindwipe',
    source: 'en/unified/md/feature/ability/talent/level-8/mindwipe.md',
    class: 'talent',
    level: 8,
    cost: '11 Clarity',
  },
  {
    name: 'Rejuvenate',
    source: 'en/unified/md/feature/ability/talent/level-8/rejuvenate.md',
    class: 'talent',
    level: 8,
    cost: '11 Clarity',
  },
  {
    name: 'Stasis Shield',
    source: 'en/unified/md/feature/ability/talent/level-8/stasis-shield.md',
    class: 'talent',
    level: 8,
    cost: '3 Clarity',
  },
  {
    name: 'Steel',
    source: 'en/unified/md/feature/ability/talent/level-8/steel.md',
    class: 'talent',
    level: 8,
    cost: '11 Clarity',
  },
  {
    name: 'Acceleration Field',
    source: 'en/unified/md/feature/ability/talent/level-9/acceleration-field.md',
    class: 'talent',
    level: 9,
    cost: '11 Clarity',
  },
  {
    name: 'Borrow From the Future',
    source: 'en/unified/md/feature/ability/talent/level-9/borrow-from-the-future.md',
    class: 'talent',
    level: 9,
    cost: '11 Clarity',
  },
  {
    name: 'Fulcrum',
    source: 'en/unified/md/feature/ability/talent/level-9/fulcrum.md',
    class: 'talent',
    level: 9,
    cost: '11 Clarity',
  },
  {
    name: 'Gravitic Nova',
    source: 'en/unified/md/feature/ability/talent/level-9/gravitic-nova.md',
    class: 'talent',
    level: 9,
    cost: '11 Clarity',
  },
  {
    name: 'Resonant Mind Spike',
    source: 'en/unified/md/feature/ability/talent/level-9/resonant-mind-spike.md',
    class: 'talent',
    level: 9,
    cost: '11 Clarity',
  },
  {
    name: 'Synaptic Terror',
    source: 'en/unified/md/feature/ability/talent/level-9/synaptic-terror.md',
    class: 'talent',
    level: 9,
    cost: '11 Clarity',
  },
  {
    name: 'Dramatic Reversal',
    source: 'en/unified/md/feature/ability/troubadour/level-1/dramatic-reversal.md',
    class: 'troubadour',
    level: 1,
    cost: '5 Drama',
  },
  {
    name: 'Fake Your Death',
    source: 'en/unified/md/feature/ability/troubadour/level-1/fake-your-death.md',
    class: 'troubadour',
    level: 1,
    cost: '5 Drama',
  },
  {
    name: 'Flip the Script',
    source: 'en/unified/md/feature/ability/troubadour/level-1/flip-the-script.md',
    class: 'troubadour',
    level: 1,
    cost: '5 Drama',
  },
  {
    name: 'Harmonize',
    source: 'en/unified/md/feature/ability/troubadour/level-1/harmonize.md',
    class: 'troubadour',
    level: 1,
    cost: '3 Drama',
  },
  {
    name: 'Harsh Critic',
    source: 'en/unified/md/feature/ability/troubadour/level-1/harsh-critic.md',
    class: 'troubadour',
    level: 1,
    cost: '3 Drama',
  },
  {
    name: 'Hypnotic Overtones',
    source: 'en/unified/md/feature/ability/troubadour/level-1/hypnotic-overtones.md',
    class: 'troubadour',
    level: 1,
    cost: '3 Drama',
  },
  {
    name: 'Method Acting',
    source: 'en/unified/md/feature/ability/troubadour/level-1/method-acting.md',
    class: 'troubadour',
    level: 1,
    cost: '5 Drama',
  },
  {
    name: 'Quick Rewrite',
    source: 'en/unified/md/feature/ability/troubadour/level-1/quick-rewrite.md',
    class: 'troubadour',
    level: 1,
    cost: '3 Drama',
  },
  {
    name: 'Star Power',
    source: 'en/unified/md/feature/ability/troubadour/level-1/star-power.md',
    class: 'troubadour',
    level: 1,
    cost: '1 Drama',
  },
  {
    name: 'Upstage',
    source: 'en/unified/md/feature/ability/troubadour/level-1/upstage.md',
    class: 'troubadour',
    level: 1,
    cost: '3 Drama',
  },
  {
    name: 'Classic Chandelier Stunt',
    source: 'en/unified/md/feature/ability/troubadour/level-2/classic-chandelier-stunt.md',
    class: 'troubadour',
    level: 2,
    cost: '5 Drama',
  },
  {
    name: 'En Garde!',
    source: 'en/unified/md/feature/ability/troubadour/level-2/en-garde.md',
    class: 'troubadour',
    level: 2,
    cost: '5 Drama',
  },
  {
    name: 'Encore',
    source: 'en/unified/md/feature/ability/troubadour/level-2/encore.md',
    class: 'troubadour',
    level: 2,
    cost: '5 Drama',
  },
  {
    name: 'Guest Star',
    source: 'en/unified/md/feature/ability/troubadour/level-2/guest-star.md',
    class: 'troubadour',
    level: 2,
    cost: '5 Drama',
  },
  {
    name: 'Tough Crowd',
    source: 'en/unified/md/feature/ability/troubadour/level-2/tough-crowd.md',
    class: 'troubadour',
    level: 2,
    cost: '5 Drama',
  },
  {
    name: 'Twist at the End',
    source: 'en/unified/md/feature/ability/troubadour/level-2/twist-at-the-end.md',
    class: 'troubadour',
    level: 2,
    cost: '5 Drama',
  },
  {
    name: 'Extensive Rewrites',
    source: 'en/unified/md/feature/ability/troubadour/level-3/extensive-rewrites.md',
    class: 'troubadour',
    level: 3,
    cost: '7 Drama',
  },
  {
    name: 'Infernal Gavotte',
    source: 'en/unified/md/feature/ability/troubadour/level-3/infernal-gavotte.md',
    class: 'troubadour',
    level: 3,
    cost: '7 Drama',
  },
  {
    name: 'Star Solo',
    source: 'en/unified/md/feature/ability/troubadour/level-3/star-solo.md',
    class: 'troubadour',
    level: 3,
    cost: '7 Drama',
  },
  {
    name: 'We Meet at Last',
    source: 'en/unified/md/feature/ability/troubadour/level-3/we-meet-at-last.md',
    class: 'troubadour',
    level: 3,
    cost: '7 Drama',
  },
  {
    name: 'Action Hero',
    source: 'en/unified/md/feature/ability/troubadour/level-5/action-hero.md',
    class: 'troubadour',
    level: 5,
    cost: '9 Drama',
  },
  {
    name: 'Continuity Error',
    source: 'en/unified/md/feature/ability/troubadour/level-5/continuity-error.md',
    class: 'troubadour',
    level: 5,
    cost: '9 Drama',
  },
  {
    name: 'Love Song',
    source: 'en/unified/md/feature/ability/troubadour/level-5/love-song.md',
    class: 'troubadour',
    level: 5,
    cost: '9 Drama',
  },
  {
    name: 'Patter Song',
    source: 'en/unified/md/feature/ability/troubadour/level-5/patter-song.md',
    class: 'troubadour',
    level: 5,
    cost: '9 Drama',
  },
  {
    name: 'Blood on the Stage',
    source: 'en/unified/md/feature/ability/troubadour/level-6/blood-on-the-stage.md',
    class: 'troubadour',
    level: 6,
    cost: '9 Drama',
  },
  {
    name: 'Feedback',
    source: 'en/unified/md/feature/ability/troubadour/level-6/feedback.md',
    class: 'troubadour',
    level: 6,
    cost: '9 Drama',
  },
  {
    name: 'Fight Choreography',
    source: 'en/unified/md/feature/ability/troubadour/level-6/fight-choreography.md',
    class: 'troubadour',
    level: 6,
    cost: '9 Drama',
  },
  {
    name: "Here's How Your Story Ends",
    source: 'en/unified/md/feature/ability/troubadour/level-6/heres-how-your-story-ends.md',
    class: 'troubadour',
    level: 6,
    cost: '9 Drama',
  },
  {
    name: 'Legendary Drum Fill',
    source: 'en/unified/md/feature/ability/troubadour/level-6/legendary-drum-fill.md',
    class: 'troubadour',
    level: 6,
    cost: '9 Drama',
  },
  {
    name: "You're All My Understudies",
    source: 'en/unified/md/feature/ability/troubadour/level-6/youre-all-my-understudies.md',
    class: 'troubadour',
    level: 6,
    cost: '9 Drama',
  },
  {
    name: 'Dramatic Reveal',
    source: 'en/unified/md/feature/ability/troubadour/level-8/dramatic-reveal.md',
    class: 'troubadour',
    level: 8,
    cost: '11 Drama',
  },
  {
    name: 'Power Ballad',
    source: 'en/unified/md/feature/ability/troubadour/level-8/power-ballad.md',
    class: 'troubadour',
    level: 8,
    cost: '11 Drama',
  },
  {
    name: 'Saved in the Edit',
    source: 'en/unified/md/feature/ability/troubadour/level-8/saved-in-the-edit.md',
    class: 'troubadour',
    level: 8,
    cost: '11 Drama',
  },
  {
    name: 'The Show Must Go On',
    source: 'en/unified/md/feature/ability/troubadour/level-8/the-show-must-go-on.md',
    class: 'troubadour',
    level: 8,
    cost: '11 Drama',
  },
  {
    name: 'Epic',
    source: 'en/unified/md/feature/ability/troubadour/level-9/epic.md',
    class: 'troubadour',
    level: 9,
    cost: '11 Drama',
  },
  {
    name: 'Expert Fencer',
    source: 'en/unified/md/feature/ability/troubadour/level-9/expert-fencer.md',
    class: 'troubadour',
    level: 9,
    cost: '11 Drama',
  },
  {
    name: 'Jam Session',
    source: 'en/unified/md/feature/ability/troubadour/level-9/jam-session.md',
    class: 'troubadour',
    level: 9,
    cost: '11 Drama',
  },
  {
    name: 'Melt Their Faces',
    source: 'en/unified/md/feature/ability/troubadour/level-9/melt-their-faces.md',
    class: 'troubadour',
    level: 9,
    cost: '11 Drama',
  },
  {
    name: 'Renegotiated Contract',
    source: 'en/unified/md/feature/ability/troubadour/level-9/renegotiated-contract.md',
    class: 'troubadour',
    level: 9,
    cost: '11 Drama',
  },
  {
    name: 'Rising Tension',
    source: 'en/unified/md/feature/ability/troubadour/level-9/rising-tension.md',
    class: 'troubadour',
    level: 9,
    cost: '11 Drama',
  },
];

interface ChoiceSpec {
  slug: string;
  name: string;
  key: string;
  count: number;
  pool: string | string[];
  kind: string;
  actor: string;
  note: string;
}
const CHOICES: ChoiceSpec[] = [
  {
    slug: 'amnesia',
    name: 'Amnesia',
    key: 'trinket',
    count: 1,
    pool: 'firstEchelonTrinkets',
    kind: 'item',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'animal-form',
    name: 'Animal Form',
    key: 'animalForm',
    count: 1,
    pool: 'Specific harmless size-1T animal; book supplies no exhaustive species list',
    kind: 'form',
    actor: 'owner',
    note: 'Record animal and supported movement qualification; movement choice cannot be invented from a generic unrestricted trait selector.',
  },
  {
    slug: 'artifact-bonded',
    name: 'Artifact Bonded',
    key: 'artifact',
    count: 1,
    pool: 'artifacts',
    kind: 'item',
    actor: 'owner',
    note: 'Selection persists while manifestation is inactive.',
  },
  {
    slug: 'betrothed',
    name: 'Betrothed',
    key: 'trinket',
    count: 1,
    pool: 'firstEchelonTrinkets',
    kind: 'item',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'consuming-interest',
    name: 'Consuming Interest',
    key: 'obsessionSkill',
    count: 1,
    pool: 'loreSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'cursed-weapon',
    name: 'Cursed Weapon',
    key: 'weapon',
    count: 1,
    pool: 'leveledWeapons',
    kind: 'item',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'disgraced',
    name: 'Disgraced',
    key: 'skill',
    count: 1,
    pool: 'interpersonalOrIntrigueSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'dragon-dreams',
    name: 'Dragon Dreams',
    key: 'traits',
    count: 2,
    pool: 'purchasedDragonKnightTraits',
    kind: 'traitBudget',
    actor: 'owner',
    note: 'Count is point budget, not number of traits. Never grant Wyrmplate or full ancestry. Resolve nested prerequisites and choices. No source permission to repeat traits.',
  },
  {
    slug: 'exile',
    name: 'Exile',
    key: 'language',
    count: 1,
    pool: 'Printed extant spoken languages in Background; exclude dead/custom and already known Caelian',
    kind: 'language',
    actor: 'owner',
    note: 'Legal deferred entitlement follows I Speak Their Language; no language granted until chosen.',
  },
  {
    slug: 'following-in-the-footsteps',
    name: 'Following in the Footsteps',
    key: 'futureAbility',
    count: 1,
    pool: 'Heroic ability for chosen class whose source level exceeds level at selection',
    kind: 'abilityReference',
    actor: 'owner',
    note: 'Persist selection-level criterion and cost delta −2 floor1; grants no ability now.',
  },
  {
    slug: 'following-in-the-footsteps',
    name: 'Following in the Footsteps',
    key: 'costlierAbility',
    count: 1,
    pool: 'Currently known heroic abilities',
    kind: 'abilityReference',
    actor: 'owner',
    note: 'Cost +1; distinguish this from class ability selection.',
  },
  {
    slug: 'grifter',
    name: 'Grifter',
    key: 'skill',
    count: 1,
    pool: 'intrigueSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'hunted',
    name: 'Hunted',
    key: 'skill',
    count: 1,
    pool: 'intrigueSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'hunter',
    name: 'Hunter',
    key: 'skill',
    count: 1,
    pool: 'hunterSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'infernal-contract-but-like-bad',
    name: 'Infernal Contract... But, Like, Bad',
    key: 'benefit',
    count: 1,
    pool: ['renown+2', 'wealth+2', 'staminaMaximum+3'],
    kind: 'benefit',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'ivory-tower',
    name: 'Ivory Tower',
    key: 'skills',
    count: 3,
    pool: 'allSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'ivory-tower',
    name: 'Ivory Tower',
    key: 'lostSkill',
    count: 1,
    pool: 'Exactly the three skills selected at complication/skills',
    kind: 'skillRemoval',
    actor: 'Director',
    note: 'Remove and permanently forbid. This is not owner selecting one of any known skills.',
  },
  {
    slug: 'ivory-tower',
    name: 'Ivory Tower',
    key: 'language',
    count: 1,
    pool: 'deadLanguages',
    kind: 'language',
    actor: 'owner',
    note: 'Explicit dead grant; v0.01 generic language ruling does not silently erase a V1 exception; custom remains excluded.',
  },
  {
    slug: 'lifebonded',
    name: 'Lifebonded',
    key: 'bondedCreature',
    count: 1,
    pool: 'Another creature without Lifebonded complication',
    kind: 'creatureReference',
    actor: 'owner',
    note: 'Named reference/attestation suffices for manual narrative creature; not forced playable companion creation.',
  },
  {
    slug: 'lost-in-time',
    name: 'Lost in Time',
    key: 'damageType',
    count: 1,
    pool: 'damageTypes',
    kind: 'damageType',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'meddling-butler',
    name: 'Meddling Butler',
    key: 'retainer',
    count: 1,
    pool: 'Eligible retainer under Monsters Retainers and Rewards Renown',
    kind: 'retainer',
    actor: 'owner/Director setup',
    note: 'Source grants one but does not specify who picks species. Do not fabricate owner-exclusive selection authority or silently drop retainer. Only one retainer may serve at once.',
  },
  {
    slug: 'promising-apprentice',
    name: 'Promising Apprentice',
    key: 'skill',
    count: 1,
    pool: 'craftingSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'promising-apprentice',
    name: 'Promising Apprentice',
    key: 'edgeSkill',
    count: 1,
    pool: 'Owned crafting skills after all skill grants resolved',
    kind: 'skillModifier',
    actor: 'owner',
    note: 'Independent choice; need not equal newly granted skill. Does not grant target skill.',
  },
  {
    slug: 'raised-by-beasts',
    name: 'Raised by Beasts',
    key: 'animalType',
    count: 1,
    pool: 'Animal type related to animals that raised hero; no exhaustive source list',
    kind: 'animalType',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'refugee',
    name: 'Refugee',
    key: 'lostAsset',
    count: 1,
    pool: 'Director-agreed family asset: trinket, leveled treasure, Wealth, project source, or like',
    kind: 'narrativeAsset',
    actor: 'owner+Director',
    note: 'Not current inventory; narrative specification can remain pending without synthesizing a reward.',
  },
  {
    slug: 'rival',
    name: 'Rival',
    key: 'betterSkill',
    count: 1,
    pool: 'Owned skills',
    kind: 'skillModifier',
    actor: 'owner',
    note: 'Set ordinary skill contribution to3, do not add3.',
  },
  {
    slug: 'rival',
    name: 'Rival',
    key: 'rivalSkill',
    count: 1,
    pool: 'allSkills',
    kind: 'skillModifier',
    actor: 'Director',
    note: 'Does not need to be owned by hero; conditional bane applies when used.',
  },
  {
    slug: 'runaway',
    name: 'Runaway',
    key: 'skill',
    count: 1,
    pool: 'craftingSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'searching-for-a-cure',
    name: 'Searching for a Cure',
    key: 'monsterType',
    count: 1,
    pool: 'Type connected to homeland plight; e.g. vampire, ghost, medusa',
    kind: 'monsterType',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'searching-for-a-cure',
    name: 'Searching for a Cure',
    key: 'transformationTimeline',
    count: 1,
    pool: 'Campaign-relevant timeline agreed with Director',
    kind: 'narrativeTimeline',
    actor: 'owner+Director',
    note: 'Narrative context rather than automatic clock implementation.',
  },
  {
    slug: 'secret-identity',
    name: 'Secret Identity',
    key: 'skill',
    count: 1,
    pool: 'intrigueSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'secret-twin',
    name: 'Secret Twin',
    key: 'trinket',
    count: 1,
    pool: 'firstEchelonTrinkets',
    kind: 'item',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'sewer-folk',
    name: 'Sewer Folk',
    key: 'movement',
    count: 1,
    pool: ['climb', 'swim'],
    kind: 'movementMode',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'shared-spirit',
    name: 'Shared Spirit',
    key: 'selfSkills',
    count: 3,
    pool: 'Owned skills before Shared Spirit conditional grants',
    kind: 'skillCondition',
    actor: 'owner',
    note: 'Distinct targets; mark usable only by self.',
  },
  {
    slug: 'shared-spirit',
    name: 'Shared Spirit',
    key: 'spiritSkills',
    count: 3,
    pool: 'allSkills minus all previously owned skills',
    kind: 'skillCondition',
    actor: 'owner',
    note: 'Distinct new skills; available only with spirit control. Other known skills remain shared.',
  },
  {
    slug: 'shattered-legacy',
    name: 'Shattered Legacy',
    key: 'language',
    count: 1,
    pool: 'Printed language table entries subject to current language eligibility policy',
    kind: 'language',
    actor: 'owner',
    note: 'Source says one language without extant/dead restriction; Forge defaults all categories. Legal deferred slot retains restrictions.',
  },
  {
    slug: 'shattered-legacy',
    name: 'Shattered Legacy',
    key: 'brokenTreasure',
    count: 1,
    pool: 'leveledTreasures',
    kind: 'item',
    actor: 'owner',
    note: 'Identity/source retained even while broken; do not apply item benefits.',
  },
  {
    slug: 'shipwrecked',
    name: 'Shipwrecked',
    key: 'skills',
    count: 2,
    pool: 'explorationSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'shipwrecked',
    name: 'Shipwrecked',
    key: 'forgottenLanguage',
    count: 1,
    pool: 'Currently known languages (not unfilled/deferred entitlements)',
    kind: 'languageRemoval',
    actor: 'owner',
    note: 'Source does not forbid forgetting Caelian. Q-R-100 says automatic known, not explicitly unforgettably known; concrete collision requires case-specific ruling if enforced otherwise.',
  },
  {
    slug: 'silent-sentinel',
    name: 'Silent Sentinel',
    key: 'skill',
    count: 1,
    pool: 'loreSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
  {
    slug: 'strange-inheritance',
    name: 'Strange Inheritance',
    key: 'secretTrinket',
    count: 1,
    pool: 'secondEchelonTrinkets',
    kind: 'secretItem',
    actor: 'Director',
    note: 'Owner must not choose or see identity/powers before first operation. Unresolved setup is explicit, never random auto-selection.',
  },
  {
    slug: 'wrongly-imprisoned',
    name: 'Wrongly Imprisoned',
    key: 'skills',
    count: 2,
    pool: 'nonInterpersonalSkills',
    kind: 'skill',
    actor: 'owner',
    note: '',
  },
];

export const COMPLICATION_ITEM_SOURCES: Record<string, string> = {
  "Mediator's Charm": 'en/unified/md/treasure/2nd-echelon/trinket/mediators-charm.md',
  Scannerstone: 'en/unified/md/treasure/2nd-echelon/trinket/scannerstone.md',
  'Key of Inquiry': 'en/unified/md/treasure/2nd-echelon/trinket/key-of-inquiry.md',
  'Abyssal Map Ink': 'en/unified/md/treasure/2nd-echelon/trinket/abyssal-map-ink.md',
  'Insightful Crown': 'en/unified/md/treasure/2nd-echelon/trinket/insightful-crown.md',
  'Bastion Belt': 'en/unified/md/treasure/2nd-echelon/trinket/bastion-belt.md',
  'Grasp of the Chained Hand':
    'en/unified/md/treasure/2nd-echelon/trinket/grasp-of-the-chained-hand.md',
  "Stop-'n-Go Coin": 'en/unified/md/treasure/2nd-echelon/trinket/stop-n-go-coin.md',
  'Thunder Chariot': 'en/unified/md/treasure/2nd-echelon/trinket/thunder-chariot.md',
  'Evilest Eye': 'en/unified/md/treasure/2nd-echelon/trinket/evilest-eye.md',
  'Necklace of the Bayou': 'en/unified/md/treasure/2nd-echelon/trinket/necklace-of-the-bayou.md',
  'Werewolf Tooth Pendant': 'en/unified/md/treasure/2nd-echelon/trinket/werewolf-tooth-pendant.md',
  'Float Powder': 'en/unified/md/treasure/2nd-echelon/consumable/float-powder.md',
  'Scroll of Resurrection':
    'en/unified/md/treasure/2nd-echelon/consumable/scroll-of-resurrection.md',
  'Chocolate of Immovability':
    'en/unified/md/treasure/2nd-echelon/consumable/chocolate-of-immovability.md',
  Telemagnet: 'en/unified/md/treasure/2nd-echelon/consumable/telemagnet.md',
  'Breath of Dawn': 'en/unified/md/treasure/2nd-echelon/consumable/breath-of-dawn.md',
  'Purified Jelly': 'en/unified/md/treasure/2nd-echelon/consumable/purified-jelly.md',
  'Vial of Ethereal Attack':
    'en/unified/md/treasure/2nd-echelon/consumable/vial-of-ethereal-attack.md',
  'Concealment Potion': 'en/unified/md/treasure/2nd-echelon/consumable/concealment-potion.md',
  'Bull Shot': 'en/unified/md/treasure/2nd-echelon/consumable/bull-shot.md',
  'Warbanner of Wrath': 'en/unified/md/treasure/4th-echelon/trinket/warbanner-of-wrath.md',
  Hagbasket: 'en/unified/md/treasure/4th-echelon/trinket/hagbasket.md',
  'Psi Blade': 'en/unified/md/treasure/4th-echelon/trinket/psi-blade.md',
  "Gravekeeper's Lantern": 'en/unified/md/treasure/4th-echelon/trinket/gravekeepers-lantern.md',
  'Battle Wings': 'en/unified/md/treasure/4th-echelon/trinket/battle-wings.md',
  'Page From the Infinite Library: Solaris':
    'en/unified/md/treasure/4th-echelon/consumable/page-from-the-infinite-library-solaris.md',
  'Restorative of the Bright Court':
    'en/unified/md/treasure/4th-echelon/consumable/restorative-of-the-bright-court.md',
  'Breath of Creation': 'en/unified/md/treasure/4th-echelon/consumable/breath-of-creation.md',
  'Elixir of Saint Elspeth':
    'en/unified/md/treasure/4th-echelon/consumable/elixir-of-saint-elspeth.md',
  'Mask of Oversight': 'en/unified/md/treasure/3rd-echelon/trinket/mask-of-oversight.md',
  'Bandana of Invisibility':
    'en/unified/md/treasure/3rd-echelon/trinket/bandana-of-invisibility.md',
  'Shifting Ring': 'en/unified/md/treasure/3rd-echelon/trinket/shifting-ring.md',
  'Mirage Band': 'en/unified/md/treasure/3rd-echelon/trinket/mirage-band.md',
  'Warbanner of Pride': 'en/unified/md/treasure/3rd-echelon/trinket/warbanner-of-pride.md',
  'Bracers of Strife': 'en/unified/md/treasure/3rd-echelon/trinket/bracers-of-strife.md',
  'Cross of the Scorned Puppeteer':
    'en/unified/md/treasure/3rd-echelon/trinket/cross-of-the-scorned-puppeteer.md',
  'Crystallized Essence': 'en/unified/md/treasure/3rd-echelon/trinket/crystallized-essence.md',
  'Nullfield Resonator Ring':
    'en/unified/md/treasure/3rd-echelon/trinket/nullfield-resonator-ring.md',
  'Bottled Paradox': 'en/unified/md/treasure/3rd-echelon/consumable/bottled-paradox.md',
  'Wellness Tonic': 'en/unified/md/treasure/3rd-echelon/consumable/wellness-tonic.md',
  'Ward Token': 'en/unified/md/treasure/3rd-echelon/consumable/ward-token.md',
  Timesplitter: 'en/unified/md/treasure/3rd-echelon/consumable/timesplitter.md',
  'Anamorphic Larva': 'en/unified/md/treasure/3rd-echelon/consumable/anamorphic-larva.md',
  'Personal Effigy': 'en/unified/md/treasure/3rd-echelon/consumable/personal-effigy.md',
  "G'Allios Visiting Card":
    'en/unified/md/treasure/3rd-echelon/consumable/gallios-visiting-card.md',
  'Stygian Liquor': 'en/unified/md/treasure/3rd-echelon/consumable/stygian-liquor.md',
  'Quantum Satchel': 'en/unified/md/treasure/1st-echelon/trinket/quantum-satchel.md',
  'Ruby Ring of Recall': 'en/unified/md/treasure/1st-echelon/trinket/ruby-ring-of-recall.md',
  'Snakerattle Bangle': 'en/unified/md/treasure/1st-echelon/trinket/snakerattle-bangle.md',
  Deadweight: 'en/unified/md/treasure/1st-echelon/trinket/deadweight.md',
  'Speaking Scarab': 'en/unified/md/treasure/1st-echelon/trinket/speaking-scarab.md',
  'Color Cloak (Yellow)': 'en/unified/md/treasure/1st-echelon/trinket/color-cloak-yellow.md',
  'Flameshade Gloves': 'en/unified/md/treasure/1st-echelon/trinket/flameshade-gloves.md',
  'Unbinder Boots': 'en/unified/md/treasure/1st-echelon/trinket/unbinder-boots.md',
  'Gecko Gloves': 'en/unified/md/treasure/1st-echelon/trinket/gecko-gloves.md',
  'Mask of the Many': 'en/unified/md/treasure/1st-echelon/trinket/mask-of-the-many.md',
  'Displacing Replacement Bracer':
    'en/unified/md/treasure/1st-echelon/trinket/displacing-replacement-bracer.md',
  'Precious Collar': 'en/unified/md/treasure/1st-echelon/trinket/precious-collar.md',
  'Color Cloak (Red)': 'en/unified/md/treasure/1st-echelon/trinket/color-cloak-red.md',
  'Color Cloak (Blue)': 'en/unified/md/treasure/1st-echelon/trinket/color-cloak-blue.md',
  'Divine Vine': 'en/unified/md/treasure/1st-echelon/trinket/divine-vine.md',
  'Hellcharger Helm': 'en/unified/md/treasure/1st-echelon/trinket/hellcharger-helm.md',
  'Pocket Homunculus': 'en/unified/md/treasure/1st-echelon/consumable/pocket-homunculus.md',
  'Catapult Dust': 'en/unified/md/treasure/1st-echelon/consumable/catapult-dust.md',
  'Healing Potion': 'en/unified/md/treasure/1st-echelon/consumable/healing-potion.md',
  "Giant's-Blood Flame": 'en/unified/md/treasure/1st-echelon/consumable/giants-blood-flame.md',
  'Portable Cloud': 'en/unified/md/treasure/1st-echelon/consumable/portable-cloud.md',
  "Professor Veratismo's Quaff 'n Huff Snuff":
    'en/unified/md/treasure/1st-echelon/consumable/professor-veratismos-quaff-n-huff-snuff.md',
  Snapdragon: 'en/unified/md/treasure/1st-echelon/consumable/snapdragon.md',
  'Mirror Token': 'en/unified/md/treasure/1st-echelon/consumable/mirror-token.md',
  'Buzz Balm': 'en/unified/md/treasure/1st-echelon/consumable/buzz-balm.md',
  'Growth Potion': 'en/unified/md/treasure/1st-echelon/consumable/growth-potion.md',
  'Blood Essence Vial': 'en/unified/md/treasure/1st-echelon/consumable/blood-essence-vial.md',
  'Lachomp Tooth': 'en/unified/md/treasure/1st-echelon/consumable/lachomp-tooth.md',
  'Black Ash Dart': 'en/unified/md/treasure/1st-echelon/consumable/black-ash-dart.md',
  "Imp's Tongue": 'en/unified/md/treasure/1st-echelon/consumable/imps-tongue.md',
  'Rex Scepter': 'en/unified/md/treasure/leveled/implement/rex-scepter.md',
  'Ether-Fueled Vessel': 'en/unified/md/treasure/leveled/implement/ether-fueled-vessel.md',
  'Wand of the Unheard Orchestra':
    'en/unified/md/treasure/leveled/implement/wand-of-the-unheard-orchestra.md',
  Brittlebreaker: 'en/unified/md/treasure/leveled/implement/brittlebreaker.md',
  '33 Field Commanders Baton':
    'en/unified/md/treasure/leveled/implement/33-field-commanders-baton.md',
  'Sanctuary Horn': 'en/unified/md/treasure/leveled/implement/sanctuary-horn.md',
  "Abjurer's Bastion": 'en/unified/md/treasure/leveled/implement/abjurers-bastion.md',
  'Foesense Lenses': 'en/unified/md/treasure/leveled/implement/foesense-lenses.md',
  Chaldorb: 'en/unified/md/treasure/leveled/implement/chaldorb.md',
  'Words Become Wonders at Next Breath':
    'en/unified/md/treasure/leveled/implement/words-become-wonders-at-next-breath.md',
  "Authority's End": 'en/unified/md/treasure/leveled/weapon/authoritys-end.md',
  "Executioner's Blade": 'en/unified/md/treasure/leveled/weapon/executioners-blade.md',
  'Thunderhead Bident': 'en/unified/md/treasure/leveled/weapon/thunderhead-bident.md',
  Displacer: 'en/unified/md/treasure/leveled/weapon/displacer.md',
  Longclaw: 'en/unified/md/treasure/leveled/weapon/longclaw.md',
  'Scorpion Tails': 'en/unified/md/treasure/leveled/weapon/scorpion-tails.md',
  'Third Eye Seeker': 'en/unified/md/treasure/leveled/weapon/third-eye-seeker.md',
  'Lance of the Sundered Star':
    'en/unified/md/treasure/leveled/weapon/lance-of-the-sundered-star.md',
  'Molten Constrictor': 'en/unified/md/treasure/leveled/weapon/molten-constrictor.md',
  Steeltongue: 'en/unified/md/treasure/leveled/weapon/steeltongue.md',
  'Horned Champion': 'en/unified/md/treasure/leveled/weapon/horned-champion.md',
  Wetwork: 'en/unified/md/treasure/leveled/weapon/wetwork.md',
  'Glancing Bow': 'en/unified/md/treasure/leveled/weapon/glancing-bow.md',
  'Onerous Bow': 'en/unified/md/treasure/leveled/weapon/onerous-bow.md',
  'Icemaker Maul': 'en/unified/md/treasure/leveled/weapon/icemaker-maul.md',
  'Knife of Nine': 'en/unified/md/treasure/leveled/weapon/knife-of-nine.md',
  'Blade of Quintessence': 'en/unified/md/treasure/leveled/weapon/blade-of-quintessence.md',
  'Blade of the Luxurious Fop':
    'en/unified/md/treasure/leveled/weapon/blade-of-the-luxurious-fop.md',
  'Lightning Treads': 'en/unified/md/treasure/leveled/other/lightning-treads.md',
  'Thief of Joy': 'en/unified/md/treasure/leveled/other/thief-of-joy.md',
  'Bloody Hand Wraps': 'en/unified/md/treasure/leveled/other/bloody-hand-wraps.md',
  'Bloodbound Band': 'en/unified/md/treasure/leveled/other/bloodbound-band.md',
  "Revenger's Wrap": 'en/unified/md/treasure/leveled/other/revengers-wrap.md',
  'Spiny Turtle': 'en/unified/md/treasure/leveled/armor/spiny-turtle.md',
  'Shrouded Memory': 'en/unified/md/treasure/leveled/armor/shrouded-memory.md',
  'Chain of the Sea and Sky': 'en/unified/md/treasure/leveled/armor/chain-of-the-sea-and-sky.md',
  'Pack Harness': 'en/unified/md/treasure/leveled/armor/pack-harness.md',
  'Telekinetic Bulwark': 'en/unified/md/treasure/leveled/armor/telekinetic-bulwark.md',
  'Paper Trappings': 'en/unified/md/treasure/leveled/armor/paper-trappings.md',
  'Cavalry Armor': 'en/unified/md/treasure/leveled/armor/cavalry-armor.md',
  'Adaptive Second Skin of Toxins':
    'en/unified/md/treasure/leveled/armor/adaptive-second-skin-of-toxins.md',
  'Thorn Dragonscale': 'en/unified/md/treasure/leveled/armor/thorn-dragonscale.md',
  'Star-Hunter': 'en/unified/md/treasure/leveled/armor/star-hunter.md',
  "Kuran'zoi Prismscale": 'en/unified/md/treasure/leveled/armor/kuranzoi-prismscale.md',
  'Rampant Shield': 'en/unified/md/treasure/leveled/armor/rampant-shield.md',
  "King's Roar": 'en/unified/md/treasure/leveled/armor/kings-roar.md',
  'Grand Scarab': 'en/unified/md/treasure/leveled/armor/grand-scarab.md',
  'Blade of a Thousand Years': 'en/unified/md/treasure/artifact/blade-of-a-thousand-years.md',
  Encepter: 'en/unified/md/treasure/artifact/encepter.md',
  'Mortal Coil': 'en/unified/md/treasure/artifact/mortal-coil.md',
};

const skillGroups = ['crafting', 'exploration', 'interpersonal', 'intrigue', 'lore'];
const sourceFor = (name: string) => COMPLICATION_EFFECTS[name].source;
const options = (values: string[], source: string): DecisionOption[] =>
  values.map((value, i) => ({ id: `${source}#${i}`, value, source, supportedInV001: true }));

/** Extend the supplied definitions in place, preserving existing class/ancestry steps. */
export function extendComplicationDefinitions(defs: DecisionDefinitions): DecisionDefinitions {
  const result = defs;
  const step = result.steps.find(item => item.id === 'step.complication');
  if (!step) throw new Error('Missing complication step');
  step.presentedInV001 = true;
  step.optional = true;
  const parent = step.decisions.find(item => item.id === 'complication.choice');
  if (!parent) throw new Error('Missing complication.choice');
  parent.label = 'Complication';
  parent.optional = true;
  parent.note =
    'Optional. Full benefits, drawbacks and required supporting choices apply together.';
  parent.options = complicationSource.map(record => ({
    id: record.id,
    value: record.name,
    source: sourceFor(record.name),
    supportedInV001: true,
    ...(record.name === 'Gnoll-Mauled'
      ? {
          excludesFeatures: ['Unstoppable Mind'],
          unavailableReason: 'Cannot be taken by a hero who cannot be made dazed.',
        }
      : {}),
    ...(record.name === 'Slight Case of Lycanthropy'
      ? {
          excludedWhen: [
            { decision: 'class.choice', value: 'Fury' },
            { decision: 'class.fury.aspect', value: 'Stormwight' },
          ],
          unavailableReason: 'Cannot be taken by a fury with the stormwight primordial aspect.',
        }
      : {}),
    grants: COMPLICATION_EFFECTS[record.name].fixedSkills.map(value => ({
      kind: 'skill',
      value,
      source: sourceFor(record.name),
    })),
  }));
  // Idempotent when callers reconstruct a target level or class build.
  step.decisions = [parent];
  for (const spec of CHOICES) {
    const source = sourceFor(spec.name);
    const id = `complication.${spec.slug}.${spec.key}`;
    const decision: Decision = {
      id,
      label: spec.key.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase()),
      kind: 'choice',
      shape: spec.count === 1 ? { type: 'single', count: 1 } : { type: 'multi', count: spec.count },
      source,
      quote: COMPLICATION_EFFECTS[spec.name].fullText.split('---').slice(2).join('---').trim(),
      availableWhen: { decision: 'complication.choice', value: spec.name },
      dependsOn: ['complication.choice'],
      selectionRole: 'reference',
      note: spec.note,
      decisionActor:
        spec.actor === 'Director'
          ? 'Director'
          : spec.actor.includes('Director')
            ? 'owner+Director'
            : 'owner',
    };
    const poolName = typeof spec.pool === 'string' ? spec.pool : undefined;
    let values = Array.isArray(spec.pool) ? spec.pool : SOURCE_POOLS[poolName ?? ''];
    if (spec.kind === 'skill') {
      decision.selectionRole = 'skill';
      decision.ownedPool = { kind: 'skill', exclude: true };
    }
    if (
      spec.kind === 'skillModifier' ||
      spec.kind === 'skillCondition' ||
      spec.kind === 'skillRemoval'
    ) {
      values = SOURCE_POOLS.allSkills;
      decision.selectionRole =
        spec.kind === 'skillModifier'
          ? 'skill-target'
          : spec.kind === 'skillRemoval'
            ? 'skill-removal'
            : 'skill-conditional';
      if (spec.key !== 'rivalSkill')
        decision.ownedPool = { kind: 'skill', exclude: spec.key === 'spiritSkills' };
      if (spec.key === 'edgeSkill') {
        values = SOURCE_POOLS.craftingSkills;
        decision.ownedPool = { kind: 'skill', groups: ['crafting'] };
      }
      if (spec.key === 'lostSkill') {
        decision.selectedPool = { decision: 'complication.ivory-tower.skills' };
        decision.dependsOn!.push('complication.ivory-tower.skills');
      }
    }
    if (spec.kind === 'language' || spec.kind === 'languageRemoval') {
      decision.selectionRole = spec.kind === 'language' ? 'language' : 'language-removal';
      const extant = [
        ...new Set([
          ...(result.pools['pool.languages.by-ancestry']?.values ?? []),
          ...(result.pools['pool.languages.vaslorian-human']?.values ?? []),
        ]),
      ];
      values =
        spec.name === 'Ivory Tower'
          ? SOURCE_POOLS.deadLanguages
          : extant.filter(value => value !== 'Caelian');
      if (spec.kind === 'languageRemoval')
        values = [...new Set([...extant, ...SOURCE_POOLS.deadLanguages])];
      decision.ownedPool = { kind: 'language', exclude: spec.kind === 'language' };
      if (spec.kind === 'language') decision.shape = { type: 'multi', count: 1, deferrable: true };
    }
    if (spec.kind === 'abilityReference') {
      decision.abilityPool = {
        classOnly: spec.key === 'futureAbility',
        knownOnly: spec.key === 'costlierAbility',
        higherLevelThanCurrent: spec.key === 'futureAbility',
      };
      decision.options = COMPLICATION_HEROIC_ABILITY_POOL.map((ability, index) => ({
        id: `complication-heroic-${index}`,
        value: ability.name,
        source: ability.source,
        supportedInV001: true,
      }));
      // The complication-granted heroic ability is also eligible when already known.
      if (spec.key === 'costlierAbility')
        decision.options.push({
          id: 'complication-psychic-blast',
          value: 'Psychic Blast',
          source: sourceFor('Psychic Eruption'),
          supportedInV001: true,
        });
    }
    if (spec.kind === 'traitBudget') {
      decision.shape = { type: 'points', budget: 2, costField: 'cost' };
      decision.exactBudget = true;
      decision.options = [
        {
          id: 'mcdm.heroes.v1/feature.trait.dragon-knight/draconian-guard',
          value: 'Draconian Guard',
          cost: 1,
          source: 'en/unified/md/feature/trait/dragon-knight/draconian-guard.md',
          supportedInV001: true,
        },
        {
          id: 'mcdm.heroes.v1/feature.trait.dragon-knight/prismatic-scales',
          value: 'Prismatic Scales',
          cost: 1,
          source: 'en/unified/md/feature/trait/dragon-knight/prismatic-scales.md',
          supportedInV001: true,
          requiresFeature: 'Wyrmplate',
          unavailableReason:
            'Requires Wyrmplate. Dragon Dreams grants purchased traits, not this signature trait.',
        },
        {
          id: 'mcdm.heroes.v1/feature.trait.dragon-knight/remember-your-oath',
          value: 'Remember Your Oath',
          cost: 1,
          source: 'en/unified/md/feature/trait/dragon-knight/remember-your-oath.md',
          supportedInV001: true,
        },
        {
          id: 'mcdm.heroes.v1/feature.trait.dragon-knight/draconian-pride',
          value: 'Draconian Pride',
          cost: 2,
          source: 'en/unified/md/feature/trait/dragon-knight/draconian-pride.md',
          supportedInV001: true,
        },
        {
          id: 'mcdm.heroes.v1/feature.trait.dragon-knight/dragon-breath',
          value: 'Dragon Breath',
          cost: 2,
          source: 'en/unified/md/feature/trait/dragon-knight/dragon-breath.md',
          supportedInV001: true,
        },
        {
          id: 'mcdm.heroes.v1/feature.trait.dragon-knight/wings',
          value: 'Wings',
          cost: 2,
          source: 'en/unified/md/feature/trait/dragon-knight/wings.md',
          supportedInV001: true,
        },
      ];
      decision.note =
        'Two points of purchased traits; active only at 5+ Victories. Prismatic Scales requires Wyrmplate under Q-CHAR-15; it grants no missing signature.';
    }
    if (values && !decision.options) decision.options = options(values, source);
    if (spec.kind === 'item' && decision.options) {
      for (const option of decision.options)
        option.source = COMPLICATION_ITEM_SOURCES[option.value] ?? source;
    }
    if (spec.kind === 'secretItem') {
      decision.kind = 'automatic';
      decision.shape = { type: 'none' };
      decision.options = undefined;
      decision.requiredText = false;
      decision.note =
        'Pending private Director choice of one second-echelon trinket. Do not store the identity or powers in owner selections. Powers remain unknown until first operative at level plus Victories at least 5.';
      step.decisions.push(decision);
      continue;
    }
    if (!decision.options) {
      decision.kind = 'authored';
      decision.shape = { type: 'text' };
      decision.requiredText = true;
      decision.note = `${spec.pool}. ${spec.note}`;
    }
    step.decisions.push(decision);
  }
  // The additional immunity is a build parameter even while the trait is inactive.
  step.decisions.push({
    id: 'complication.dragon-dreams.immunity',
    label: 'Prismatic Scales immunity',
    kind: 'choice',
    shape: { type: 'single', count: 1 },
    source: 'en/unified/md/feature/trait/dragon-knight/prismatic-scales.md',
    quote: 'Select one damage immunity granted by your Wyrmplate trait.',
    availableWhen: { decision: 'complication.choice', value: 'Dragon Dreams' },
    conditions: [
      { decision: 'complication.dragon-dreams.traits', value: 'Prismatic Scales', includes: true },
    ],
    dependsOn: ['complication.dragon-dreams.traits'],
    selectionRole: 'reference',
    options: options(
      ['acid', 'cold', 'corruption', 'fire', 'lightning', 'poison'],
      'en/unified/md/feature/trait/dragon-knight/wyrmplate.md',
    ),
    note: 'Immunity equals level; active with selected trait at 5+ Victories. Does not grant Wyrmplate.',
  });
  // Loner is expressly respite-selected. Its current configuration is optional at creation.
  step.decisions.push({
    id: 'complication.loner.currentSkill',
    label: 'Current respite skill (if configured)',
    kind: 'choice',
    shape: { type: 'single', count: 1 },
    optional: true,
    source: sourceFor('Loner'),
    quote: 'When you finish a respite, choose a skill you do not have.',
    availableWhen: { decision: 'complication.choice', value: 'Loner' },
    selectionRole: 'skill-conditional',
    ownedPool: { kind: 'skill', exclude: true },
    options: options(SOURCE_POOLS.allSkills, sourceFor('Loner')),
    note: 'Current respite configuration; lasts until end of next respite. No automatic permanent skill grant.',
  });
  // Pools remain names only and never create fixed-skill replacements by deliberate duplication.
  for (const group of skillGroups) {
    result.pools[`pool.complication.skills.${group}`] = {
      source: `en/unified/md/skill/group/${group}.md`,
      values: SOURCE_POOLS[`${group}Skills`],
    };
  }
  return result;
}

/** Source-path keyed eligibility for the two currently supported classes.
 * Fury levels 2/6/9 are aspect pools; levels 1/3/5/8 are common class pools.
 * Elementalist heroic options at all these levels are shared across specializations;
 * fire/earth/green/void keywords do not restrict the class's selection pool.
 * Footsteps eligibility compares minimumLevel to the recorded selection-origin level.
 */
export interface ComplicationFutureAbilityEligibility {
  name: string;
  class: string;
  minimumLevel: number;
  grantSource: string;
  grantQuote: string;
  requiredChoice?: { decision: string; value: string };
  membershipEvidence?: string;
  note?: string;
}
export const COMPLICATION_FUTURE_ABILITY_ELIGIBILITY: Record<
  string,
  ComplicationFutureAbilityEligibility
> = {
  'en/unified/md/feature/ability/elementalist/level-1/behold-the-mystery.md': {
    name: 'Behold the Mystery',
    class: 'Elementalist',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/elementalist/level-1/elementalist-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-1/conflagration.md': {
    name: 'Conflagration',
    class: 'Elementalist',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/elementalist/level-1/elementalist-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-1/instantaneous-excavation.md': {
    name: 'Instantaneous Excavation',
    class: 'Elementalist',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/elementalist/level-1/elementalist-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-1/invigorating-growth.md': {
    name: 'Invigorating Growth',
    class: 'Elementalist',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/elementalist/level-1/elementalist-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-1/no-more-than-a-breeze.md': {
    name: 'No More Than a Breeze',
    class: 'Elementalist',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/elementalist/level-1/elementalist-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-1/ripples-in-the-earth.md': {
    name: 'Ripples in the Earth',
    class: 'Elementalist',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/elementalist/level-1/elementalist-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-1/test-of-rain.md': {
    name: 'Test of Rain',
    class: 'Elementalist',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/elementalist/level-1/elementalist-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-1/the-flesh-a-crucible.md': {
    name: 'The Flesh, a Crucible',
    class: 'Elementalist',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/elementalist/level-1/elementalist-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-2/o-flower-aid-o-earth-defend.md': {
    name: 'O Flower Aid, O Earth Defend',
    class: 'Elementalist',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/elementalist/level-2/new-5-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-2/subvert-the-green-within.md': {
    name: 'Subvert the Green Within',
    class: 'Elementalist',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/elementalist/level-2/new-5-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-2/translated-through-flame.md': {
    name: 'Translated Through Flame',
    class: 'Elementalist',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/elementalist/level-2/new-5-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-2/volcanos-embrace.md': {
    name: "Volcano's Embrace",
    class: 'Elementalist',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/elementalist/level-2/new-5-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-3/erase.md': {
    name: 'Erase',
    class: 'Elementalist',
    minimumLevel: 3,
    grantSource: 'en/unified/md/feature/elementalist/level-3/7-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-3/maw-of-earth.md': {
    name: 'Maw of Earth',
    class: 'Elementalist',
    minimumLevel: 3,
    grantSource: 'en/unified/md/feature/elementalist/level-3/7-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-3/swarm-of-spirits.md': {
    name: 'Swarm of Spirits',
    class: 'Elementalist',
    minimumLevel: 3,
    grantSource: 'en/unified/md/feature/elementalist/level-3/7-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-3/wall-of-fire.md': {
    name: 'Wall of Fire',
    class: 'Elementalist',
    minimumLevel: 3,
    grantSource: 'en/unified/md/feature/elementalist/level-3/7-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-5/combustion-deferred.md': {
    name: 'Combustion Deferred',
    class: 'Elementalist',
    minimumLevel: 5,
    grantSource: 'en/unified/md/feature/elementalist/level-5/9-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-5/storm-of-sands.md': {
    name: 'Storm of Sands',
    class: 'Elementalist',
    minimumLevel: 5,
    grantSource: 'en/unified/md/feature/elementalist/level-5/9-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-5/subverted-perception-of-space.md': {
    name: 'Subverted Perception of Space',
    class: 'Elementalist',
    minimumLevel: 5,
    grantSource: 'en/unified/md/feature/elementalist/level-5/9-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-5/web-of-all-thats-come-before.md': {
    name: "Web of All That's Come Before",
    class: 'Elementalist',
    minimumLevel: 5,
    grantSource: 'en/unified/md/feature/elementalist/level-5/9-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-6/luminous-champion-aloft.md': {
    name: 'Luminous Champion Aloft',
    class: 'Elementalist',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/elementalist/level-6/new-9-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-6/magma-titan.md': {
    name: 'Magma Titan',
    class: 'Elementalist',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/elementalist/level-6/new-9-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-6/meteor.md': {
    name: 'Meteor',
    class: 'Elementalist',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/elementalist/level-6/new-9-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-6/the-wode-remembers-and-returns.md': {
    name: 'The Wode Remembers and Returns',
    class: 'Elementalist',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/elementalist/level-6/new-9-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-8/heart-of-the-wode.md': {
    name: 'Heart of the Wode',
    class: 'Elementalist',
    minimumLevel: 8,
    grantSource: 'en/unified/md/feature/elementalist/level-8/11-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-8/muse-of-fire.md': {
    name: 'Muse of Fire',
    class: 'Elementalist',
    minimumLevel: 8,
    grantSource: 'en/unified/md/feature/elementalist/level-8/11-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-8/return-to-oblivion.md': {
    name: 'Return to Oblivion',
    class: 'Elementalist',
    minimumLevel: 8,
    grantSource: 'en/unified/md/feature/elementalist/level-8/11-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-8/world-torn-asunder.md': {
    name: 'World Torn Asunder',
    class: 'Elementalist',
    minimumLevel: 8,
    grantSource: 'en/unified/md/feature/elementalist/level-8/11-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-9/earth-rejects-you.md': {
    name: 'Earth Rejects You',
    class: 'Elementalist',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/elementalist/level-9/new-11-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-9/prism.md': {
    name: 'Prism',
    class: 'Elementalist',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/elementalist/level-9/new-11-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-9/the-green-defends-its-servants.md': {
    name: 'The Green Defends Its Servants',
    class: 'Elementalist',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/elementalist/level-9/new-11-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/elementalist/level-9/unquenchable-fire.md': {
    name: 'Unquenchable Fire',
    class: 'Elementalist',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/elementalist/level-9/new-11-essence-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This pool has no specialization restriction. Element keywords alone are not a specialization prerequisite.',
  },
  'en/unified/md/feature/ability/fury/level-1/back.md': {
    name: 'Back!',
    class: 'Fury',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-1/blood-for-blood.md': {
    name: 'Blood for Blood!',
    class: 'Fury',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-1/make-peace-with-your-god.md': {
    name: 'Make Peace With Your God!',
    class: 'Fury',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-1/out-of-the-way.md': {
    name: 'Out of the Way!',
    class: 'Fury',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-1/thunder-roar.md': {
    name: 'Thunder Roar',
    class: 'Fury',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-1/tide-of-death.md': {
    name: 'Tide of Death',
    class: 'Fury',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-1/to-the-uttermost-end.md': {
    name: 'To the Uttermost End',
    class: 'Fury',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-1/your-entrails-are-your-extrails.md': {
    name: 'Your Entrails Are Your Extrails!',
    class: 'Fury',
    minimumLevel: 1,
    grantSource: 'en/unified/md/feature/fury/level-1/fury-abilities.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-2/apex-predator.md': {
    name: 'Apex Predator',
    class: 'Fury',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/fury/level-2/2nd-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Stormwight',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#2-level Stormwight abilities',
  },
  'en/unified/md/feature/ability/fury/level-2/death-death.md': {
    name: 'Death... Death!',
    class: 'Fury',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/fury/level-2/2nd-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Reaver',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#2-level Reaver abilities',
  },
  'en/unified/md/feature/ability/fury/level-2/phalanx-breaker.md': {
    name: 'Phalanx-Breaker',
    class: 'Fury',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/fury/level-2/2nd-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Reaver',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#2-level Reaver abilities',
  },
  'en/unified/md/feature/ability/fury/level-2/special-delivery.md': {
    name: 'Special Delivery',
    class: 'Fury',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/fury/level-2/2nd-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Berserker',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#2-level Berserker abilities',
  },
  'en/unified/md/feature/ability/fury/level-2/visceral-roar.md': {
    name: 'Visceral Roar',
    class: 'Fury',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/fury/level-2/2nd-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Stormwight',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#2-level Stormwight abilities',
  },
  'en/unified/md/feature/ability/fury/level-2/wrecking-ball.md': {
    name: 'Wrecking Ball',
    class: 'Fury',
    minimumLevel: 2,
    grantSource: 'en/unified/md/feature/fury/level-2/2nd-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Berserker',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#2-level Berserker abilities',
  },
  'en/unified/md/feature/ability/fury/level-3/demon-unleashed.md': {
    name: 'Demon Unleashed',
    class: 'Fury',
    minimumLevel: 3,
    grantSource: 'en/unified/md/feature/fury/level-3/7-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-3/face-the-storm.md': {
    name: 'Face the Storm!',
    class: 'Fury',
    minimumLevel: 3,
    grantSource: 'en/unified/md/feature/fury/level-3/7-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-3/steelbreaker.md': {
    name: 'Steelbreaker',
    class: 'Fury',
    minimumLevel: 3,
    grantSource: 'en/unified/md/feature/fury/level-3/7-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-3/you-are-already-dead.md': {
    name: 'You Are Already Dead',
    class: 'Fury',
    minimumLevel: 3,
    grantSource: 'en/unified/md/feature/fury/level-3/7-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-5/debilitating-strike.md': {
    name: 'Debilitating Strike',
    class: 'Fury',
    minimumLevel: 5,
    grantSource: 'en/unified/md/feature/fury/level-5/9-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-5/my-turn.md': {
    name: 'My Turn!',
    class: 'Fury',
    minimumLevel: 5,
    grantSource: 'en/unified/md/feature/fury/level-5/9-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-5/rebounding-storm.md': {
    name: 'Rebounding Storm',
    class: 'Fury',
    minimumLevel: 5,
    grantSource: 'en/unified/md/feature/fury/level-5/9-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-5/to-stone.md': {
    name: 'To Stone!',
    class: 'Fury',
    minimumLevel: 5,
    grantSource: 'en/unified/md/feature/fury/level-5/9-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-6/avalanche-impact.md': {
    name: 'Avalanche Impact',
    class: 'Fury',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/fury/level-6/6th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Berserker',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#6-level Berserker abilities',
  },
  'en/unified/md/feature/ability/fury/level-6/death-strike.md': {
    name: 'Death Strike',
    class: 'Fury',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/fury/level-6/6th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Reaver',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#6-level Reaver abilities',
  },
  'en/unified/md/feature/ability/fury/level-6/force-of-storms.md': {
    name: 'Force of Storms',
    class: 'Fury',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/fury/level-6/6th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Berserker',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#6-level Berserker abilities',
  },
  'en/unified/md/feature/ability/fury/level-6/pounce.md': {
    name: 'Pounce',
    class: 'Fury',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/fury/level-6/6th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Stormwight',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#6-level Stormwight abilities',
  },
  'en/unified/md/feature/ability/fury/level-6/riders-on-the-storm.md': {
    name: 'Riders on the Storm',
    class: 'Fury',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/fury/level-6/6th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Stormwight',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#6-level Stormwight abilities',
  },
  'en/unified/md/feature/ability/fury/level-6/seek-and-destroy.md': {
    name: 'Seek and Destroy',
    class: 'Fury',
    minimumLevel: 6,
    grantSource: 'en/unified/md/feature/fury/level-6/6th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Reaver',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#6-level Reaver abilities',
  },
  'en/unified/md/feature/ability/fury/level-8/elemental-ferocity.md': {
    name: 'Elemental Ferocity',
    class: 'Fury',
    minimumLevel: 8,
    grantSource: 'en/unified/md/feature/fury/level-8/11-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-8/overkill.md': {
    name: 'Overkill',
    class: 'Fury',
    minimumLevel: 8,
    grantSource: 'en/unified/md/feature/fury/level-8/11-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-8/primordial-rage.md': {
    name: 'Primordial Rage',
    class: 'Fury',
    minimumLevel: 8,
    grantSource: 'en/unified/md/feature/fury/level-8/11-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-8/relentless-death.md': {
    name: 'Relentless Death',
    class: 'Fury',
    minimumLevel: 8,
    grantSource: 'en/unified/md/feature/fury/level-8/11-ferocity-ability.md',
    grantQuote: 'Choose one heroic ability from the following options',
    note: 'This level uses the shared Fury heroic ability pool, not an aspect pool.',
  },
  'en/unified/md/feature/ability/fury/level-9/death-comes-for-you-all.md': {
    name: 'Death Comes for You All!',
    class: 'Fury',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/fury/level-9/9th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Berserker',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#9-level Berserker abilities',
  },
  'en/unified/md/feature/ability/fury/level-9/death-rattle.md': {
    name: 'Death Rattle',
    class: 'Fury',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/fury/level-9/9th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Stormwight',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#9-level Stormwight abilities',
  },
  'en/unified/md/feature/ability/fury/level-9/deluge.md': {
    name: 'Deluge',
    class: 'Fury',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/fury/level-9/9th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Stormwight',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#9-level Stormwight abilities',
  },
  'en/unified/md/feature/ability/fury/level-9/primordial-bane.md': {
    name: 'Primordial Bane',
    class: 'Fury',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/fury/level-9/9th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Reaver',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#9-level Reaver abilities',
  },
  'en/unified/md/feature/ability/fury/level-9/primordial-vortex.md': {
    name: 'Primordial Vortex',
    class: 'Fury',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/fury/level-9/9th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Berserker',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#9-level Berserker abilities',
  },
  'en/unified/md/feature/ability/fury/level-9/shower-of-blood.md': {
    name: 'Shower of Blood',
    class: 'Fury',
    minimumLevel: 9,
    grantSource: 'en/unified/md/feature/fury/level-9/9th-level-aspect-ability.md',
    requiredChoice: {
      decision: 'class.fury.aspect',
      value: 'Reaver',
    },
    grantQuote: 'Your primordial aspect grants your choice of one of two heroic abilities.',
    membershipEvidence: 'en/books/heroes/clean/Draw Steel Heroes.md#9-level Reaver abilities',
  },
};
