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
];
export function troubadourActionText(action: TroubadourAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Troubadour source ${action.sourcePath}`);
  return `${action.activationCondition}\n\n${entry.text}`;
}
