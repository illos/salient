// SPDX-License-Identifier: GPL-3.0-only
/** Embedded choices and source-timed uses, with explicit manual boundaries. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
export interface TroubadourAction {
  name: string;
  parent: string;
  sourcePath: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  trigger?: string;
}
const a = (s: string) => `en/unified/md/feature/ability/troubadour/level-1/${s}.md`;
const f = (s: string) => `en/unified/md/feature/troubadour/level-1/${s}.md`;
const lf = (level: number, s: string) => `en/unified/md/feature/troubadour/level-${level}/${s}.md`;
const la = (level: number, s: string) =>
  `en/unified/md/feature/ability/troubadour/level-${level}/${s}.md`;
export const TROUBADOUR_ACTIONS: TroubadourAction[] = [
  {
    name: 'Artful Flourish: Additional Target',
    parent: 'Artful Flourish',
    sourcePath: a('artful-flourish'),
    actionType: 'Part of Artful Flourish',
    cost: 2,
    activationCondition:
      'After paying for the parent use, spend 2 Drama per additional creature or object beyond its two targets. Target selection and extra roll resolution are manual. Outside combat the total unlimited spend is limited to Victories.',
  },
  {
    name: 'Artful Flourish: Shift',
    parent: 'Artful Flourish',
    sourcePath: a('artful-flourish'),
    actionType: 'Part of Artful Flourish',
    activationCondition: 'With Artful Flourish, shift up to 3 squares. Resolve movement manually.',
  },
  {
    name: 'Witty Banter: End Effect',
    parent: 'Witty Banter',
    sourcePath: a('witty-banter'),
    actionType: 'Part of Witty Banter',
    activationCondition:
      'Choose one ally within 10 squares, not necessarily the struck creature. That ally can end one save-ends or end-of-turn effect. Resolve removal manually for the selected ally.',
  },
  {
    name: 'Witty Banter: Recovery',
    parent: 'Witty Banter',
    sourcePath: a('witty-banter'),
    actionType: 'Part of Witty Banter',
    cost: 1,
    activationCondition:
      'The ally chosen by Witty Banter can spend a Recovery. Pay this additional Drama separately; Recovery payment/healing is manual.',
  },
  {
    name: 'Hypnotic Overtones: Larger Burst',
    parent: 'Hypnotic Overtones',
    sourcePath: a('hypnotic-overtones'),
    actionType: 'Part of Hypnotic Overtones',
    cost: 2,
    activationCondition:
      'After the 3-Drama parent use, add 1 to burst size per 2 additional Drama. Resolve area and added targets manually; outside combat total unlimited spend is limited to Victories.',
  },
  ...[
    [
      'Ally Edge',
      'One ally gains an edge on their next power roll before the start of your next turn.',
    ],
    ['Ally Surge', 'One ally gains 1 surge.'],
    [
      'Enemy Bane',
      'One enemy takes a bane on their next power roll before the end of their next turn.',
    ],
  ].map(([label, effect]) => ({
    name: `Dramatic Monologue: ${label}`,
    parent: 'Dramatic Monologue',
    sourcePath: a('dramatic-monologue'),
    actionType: 'Maneuver',
    activationCondition: `Choose exactly one Dramatic Monologue effect, ranged 10. ${effect} Resolve the modifier/surge manually for the recorded recipient.`,
  })),
  {
    name: 'Dramatic Monologue: Two Targets',
    parent: 'Dramatic Monologue',
    sourcePath: a('dramatic-monologue'),
    actionType: 'Part of Dramatic Monologue',
    cost: 1,
    activationCondition:
      'After choosing exactly one Dramatic Monologue effect, apply that same effect to two targets within range. Resolve manually; this does not permit two different effects.',
  },
  {
    name: 'Star Power: Greater Speed',
    parent: 'Star Power',
    sourcePath: a('star-power'),
    actionType: 'Part of Star Power',
    cost: 1,
    activationCondition:
      'After paying Star Power’s base 1 Drama, pay 1 additional Drama to replace its +2 speed with +4 until end of your turn, not +6. The next-roll tier floor remains. Resolve timed bonuses manually.',
  },
  {
    name: 'Turnabout Is Fair Play: Stronger Reversal',
    parent: 'Turnabout Is Fair Play',
    sourcePath: a('turnabout-is-fair-play'),
    actionType: 'Part of Turnabout Is Fair Play',
    cost: 3,
    activationCondition:
      'Only with the parent trigger: edge becomes double bane; double edge is negated; bane becomes double edge; double bane is negated. Apply the chosen change manually to the triggering roll.',
  },
  {
    name: 'Harmonize: Higher Resource Cost',
    parent: 'Harmonize',
    sourcePath: a('harmonize'),
    actionType: 'Part of Harmonize',
    cost: 1,
    activationCondition:
      'After Harmonize’s base 3 Drama, spend 1 additional Drama per point above 3 of the triggering ally ability’s cost. Still only one added target, whose damage is sonic. Resolve manually; outside-combat unlimited spend uses Victories.',
  },
  {
    name: 'Method Acting: Bleeding Exchange',
    parent: 'Method Acting',
    sourcePath: a('method-acting'),
    actionType: 'Part of Method Acting',
    activationCondition:
      'With Method Acting, optionally become bleeding (save ends) yourself to deal an extra 5 corruption damage to its target. Resolve both actor condition and target damage manually; neither is automatic from the base roll.',
  },
  {
    name: 'Scene Partner: Form Bond',
    parent: 'Scene Partner',
    sourcePath: f('scene-partner'),
    actionType: 'After a successful interpersonal test',
    activationCondition:
      'After succeeding on an interpersonal NPC test, form a bond. At level one retain only one bond; choose the replaced bond. Track NPC identity, negotiation patience +1 (max 5) and first personal +1 interest argument becoming +2 (max 5) manually.',
  },
  {
    name: 'Routines: Maintain Performance',
    parent: 'Routines',
    sourcePath: f('routines'),
    actionType: 'No action',
    activationCondition:
      'At start of a combat round, while not dazed, dead or surprised, maintain your one current performance or use a granted performance to choose a new one. Track current performance, eligibility, area and ending at inability to maintain or encounter end manually.',
  },
  {
    name: 'Drama: Return to Life',
    parent: 'Drama',
    sourcePath: f('drama'),
    actionType: 'No action',
    cost: 30,
    activationCondition:
      'Only while dead with an intact body during the same encounter in which you died, at 30 Drama: return with 1 Stamina and 0 Drama. This action pays 30; resurrection, Stamina and any remaining balance must be set manually. Not an outside-combat permission.',
  },
  {
    name: 'Appeal to the Muses: Appeal',
    parent: 'Appeal to the Muses',
    sourcePath: lf(2, 'appeal-to-the-muses'),
    actionType: 'No action',
    trigger: 'Before you roll to gain drama at the start of your turn.',
    activationCondition:
      'Before the start-of-turn drama roll: on a 1 gain 1 more drama and the Director gains 1d3 Malice; on a 2 gain 1 Heroic Resource to keep or give to an ally within the distance of your active performance and the Director gains 1 Malice; on a 3 gain 2 Heroic Resource to distribute among yourself and allies within that distance. Resolve resources and Malice manually.',
  },
  {
    name: "Allow Me to Introduce Tonight's Players: Introduce",
    parent: "Allow Me to Introduce Tonight's Players",
    sourcePath: lf(2, 'allow-me-to-introduce-tonights-players'),
    actionType: 'Main action',
    trigger: 'You take the first turn in a combat encounter.',
    activationCondition:
      'Only on the first turn of a combat encounter: each ally can shift up to their speed, ability rolls against them have a double bane until the end of the round, and surprised enemies stop being surprised. Resolve manually.',
  },
  {
    name: 'Formal Introductions: Scribe Notice',
    parent: 'Formal Introductions',
    sourcePath: lf(2, 'formal-introductions'),
    actionType: 'Respite activity',
    activationCondition:
      'Address one notice to an enemy; only one is active. Once the target receives it, the Director gains 1 extra Malice per round in encounters involving it and the heroes start each such encounter with 2 additional hero tokens that disappear at its end. Resolve manually.',
  },
  {
    name: 'My Reputation Precedes Me: Invoke',
    parent: 'My Reputation Precedes Me',
    sourcePath: lf(2, 'my-reputation-precedes-me'),
    actionType: 'Start of a social interaction',
    activationCondition:
      'With NPCs who have not met you: bond one as with Scene Partner (counts against its limit); heroes treat Renown as 2 higher to start a negotiation with them. The Director can instead award 1 hero token to make you infamous: no bond, and heroes take a bane on interpersonal tests with the group until you improve your reputation. Resolve manually.',
  },
  {
    name: 'Missed Cue: Remove Enemy',
    parent: 'Missed Cue',
    sourcePath: lf(3, 'missed-cue'),
    actionType: 'Start of an encounter',
    activationCondition:
      'Only if you are not surprised: choose one enemy within line of effect that is not a leader or solo; the Director removes it until the start of the second combat round. You must earn 3 Victories before using this again. Resolve manually.',
  },
  {
    name: 'Foil: Choose Foil',
    parent: 'Foil',
    sourcePath: lf(3, 'foil'),
    actionType: 'Start of an encounter',
    activationCondition:
      'Choose one creature within line of effect: you and it each have a double edge on power rolls against or in competition with the other. If it is reduced to 0 Stamina, choose a new foil at the start of the next round. Apply the edges manually.',
  },
  {
    name: 'En Garde!: Exchange Free Strikes',
    parent: 'En Garde!',
    sourcePath: la(2, 'en-garde'),
    actionType: 'Part of En Garde!',
    activationCondition:
      'The target can make a melee free strike against you; if it does, you can make a melee free strike against it. Resolve both free strikes manually.',
  },
  {
    name: 'Tough Crowd: End-of-Turn Roll',
    parent: 'Tough Crowd',
    sourcePath: la(2, 'tough-crowd'),
    actionType: 'End of your turn',
    activationCondition:
      'Until the end of the encounter, at the end of each of your turns, you can make one power roll + Presence against each enemy in the area: 5/9/12 corruption damage and, against Might below weak/average/strong potency, pull 1/2/3 toward its center. Resolve the roll, damage and pulls manually.',
  },
  {
    name: 'Star Solo: Repeat Use',
    parent: 'Star Solo',
    sourcePath: la(3, 'star-solo'),
    actionType: 'Main action',
    activationCondition:
      'For the next 2 combat rounds you can use Star Solo against the same target without spending drama. Record the free repeat and resolve its roll manually.',
  },
  {
    name: 'We Meet at Last: Message',
    parent: 'We Meet at Last',
    sourcePath: la(3, 'we-meet-at-last'),
    actionType: 'Free maneuver',
    activationCondition:
      'Once on each of your turns while We Meet at Last lasts: grant the target 2 surges, or give it a bane on its next ability roll before the start of your next turn. Resolve manually.',
  },
  {
    name: 'Classic Chandelier Stunt: Free Strike',
    parent: 'Classic Chandelier Stunt',
    sourcePath: la(2, 'classic-chandelier-stunt'),
    actionType: 'Part of Classic Chandelier Stunt',
    activationCondition:
      'After the shifts, you (and the willing ally) can make a melee free strike dealing extra damage equal to twice your highest characteristic score. Resolve the free strikes manually.',
  },
  {
    name: '"Fire Up the Night": Search',
    parent: '"Fire Up the Night"',
    sourcePath: la(3, 'fire-up-the-night'),
    actionType: 'Free maneuver',
    activationCondition:
      'While the performance is active and you started your turn in its aura: once during your turn, search for hidden creatures as a free maneuver (Hide and Sneak, Chapter 9). Resolve the search manually.',
  },
];
export function troubadourActionText(action: TroubadourAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Troubadour source ${action.sourcePath}`);
  return `${action.activationCondition}\n\n${entry.text}`;
}

/** Printed clauses of chosen level-2/3 abilities the resolver does not model. */
export const TROUBADOUR_ACTIVATION: Record<string, string> = {
  'Guest Star':
    'A guest star appears within 10 squares: controlled by you, with its own turn, your characteristics, half your Stamina maximum and only your melee and ranged free strikes. It leaves at the end of the encounter or at 0 Stamina; a bystander can be uplifted once per encounter. Track it manually.',
  'Twist at the End':
    'A dead target that is not a leader or solo returns with half its Stamina as an ally under the Director’s control until the end of the encounter, then turns to dust. Resolve manually.',
  'Classic Chandelier Stunt':
    'You and one willing ally can each shift up to 5 squares, including vertically, ending adjacent to each other on solid ground; each can then make a melee free strike dealing extra damage equal to twice their highest characteristic. Resolve manually.',
  'En Garde!':
    'After the roll, use En Garde!: Exchange Free Strikes for the optional free strikes.',
  Encore:
    'Use a Strike ability observed this combat round costing 5 or fewer of a Heroic Resource and no Malice, rolling with Presence and dealing sonic damage. Resolve the borrowed ability manually.',
  'Tough Crowd':
    'The 3 cube within 10 is haunted until the end of the encounter; allies enter its squares without spending movement. Its power roll happens at the end of each of your turns, not on use: use Tough Crowd: End-of-Turn Roll.',
  'Extensive Rewrites':
    'Slides and the potency to ignore stability are manual; instead of sliding a target you can swap it with another target that fits. You cannot slide targets into creatures or objects.',
  'Infernal Gavotte':
    'Weakened (save ends) is manual; each ally in the area can shift up to 2 squares.',
  'Star Solo':
    'Choose melee 1 or ranged 10 when using it. Pushes are manual; you can choose sonic damage. Use Star Solo: Repeat Use for the free repeats.',
  'We Meet at Last':
    'Until the end of the encounter you and the target can target each other beyond distance, using this ability’s distance; the target cannot be force moved by such a use. Use We Meet at Last: Message each turn. Resolve manually.',
  '"Fire Up the Night"':
    'At the start of a combat round choose this as your one performance only while not dazed, dead or surprised (Routines). While active, each target who starts its turn in the aura takes no bane on strikes against creatures with concealment and once during its turn can search for hidden creatures as a free maneuver. Lifecycle and effects are manual.',
  '"Never-Ending Hero"':
    'At the start of a combat round choose this as your one performance only while not dazed, dead or surprised (Routines). While active, each target who starts its turn dying in the aura gains an edge on power rolls and ignores bleeding until the end of its turn. Lifecycle and effects are manual.',
};
