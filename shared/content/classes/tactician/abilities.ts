// SPDX-License-Identifier: GPL-3.0-only
/** App labels for actions embedded in the complete pinned source; effects remain manual. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };

function source(path: string) {
  const row = [...abilitySources, ...featureSources].find(
    entry => entry.sourcePath === `vendor/steel-compendium/${path}`,
  );
  if (!row) throw new Error(`Missing Tactician action source: ${path}`);
  return row.text;
}
const mark = 'en/unified/md/feature/ability/tactician/level-1/mark.md';
const studied = 'en/unified/md/feature/tactician/level-1/studied-commander.md';
const levelFeature = (level: number, slug: string) =>
  `en/unified/md/feature/tactician/level-${level}/${slug}.md`;
const levelAbility = (slug: string) => `en/unified/md/feature/ability/tactician/level-2/${slug}.md`;
export const TACTICIAN_ACTIONS = [
  {
    name: 'Mark: Trigger',
    parent: 'Mark',
    sourcePath: mark,
    actionType: 'Free triggered action',
    cost: '1 Focus',
    trigger: 'You or an ally uses an ability to deal rolled damage to a creature marked by you.',
    activationCondition:
      'The source trigger must occur. Choose exactly one printed benefit per trigger; resolve the chosen benefit manually. This records use and pays Focus, not mark state or the benefit.',
    text: source(mark),
  },
  {
    name: 'Mark: Retarget',
    parent: 'Mark',
    sourcePath: mark,
    actionType: 'Free triggered action',
    trigger: 'A creature marked by you is reduced to 0 Stamina.',
    activationCondition:
      'The source trigger must occur; mark a new target within 10 squares manually. This records use, not mark state.',
    text: source(mark),
  },
  {
    name: 'Studied Commander: Prepare',
    parent: 'Studied Commander',
    sourcePath: studied,
    actionType: 'Respite activity',
    activationCondition:
      'At least 24 hours before a combat encounter or negotiation, with one or more clues or rumors. Once per encounter or negotiation. Make the Reason test and resolve the printed outcome manually; this records the activity, not completion of a respite.',
    text: source(studied),
  },
  {
    name: 'Infiltration Tactics: Surge',
    parent: 'Infiltration Tactics',
    sourcePath: levelFeature(2, 'infiltration-tactics'),
    actionType: 'When a creature becomes hidden',
    activationCondition:
      'Whenever you or an ally within 10 squares of you becomes hidden, that creature gains 1 surge. Confirm the trigger and adjust surges manually.',
    text: source(levelFeature(2, 'infiltration-tactics')),
  },
  {
    name: 'Goaded: Redirect Strike',
    parent: 'Goaded',
    sourcePath: levelFeature(2, 'goaded'),
    actionType: 'Free triggered action',
    trigger:
      'A creature marked by you uses a strike that targets you or an ally within your line of effect.',
    activationCondition:
      'Change one target of the strike to you or another ally within your line of effect, within the ability’s distance and the attacker’s line of effect. Retarget manually.',
    text: source(levelFeature(2, 'goaded')),
  },
  {
    name: 'Melee Superiority: Halt',
    parent: 'Melee Superiority',
    sourcePath: levelFeature(2, 'melee-superiority'),
    actionType: 'Part of an opportunity attack',
    activationCondition:
      'Whenever you make an opportunity attack, the target’s speed is 0 until the end of the current turn. Track the speed change manually.',
    text: source(levelFeature(2, 'melee-superiority')),
  },
  {
    name: 'Melee Superiority: Mark Free Strike',
    parent: 'Melee Superiority',
    sourcePath: levelFeature(2, 'melee-superiority'),
    actionType: 'Free triggered action',
    cost: '2 Focus',
    trigger:
      'A creature marked by you attempts to move or shift within distance of your melee free strike.',
    activationCondition:
      'Pay 2 Focus to make a melee free strike against that creature. Resolve the free strike manually.',
    text: source(levelFeature(2, 'melee-superiority')),
  },
  {
    name: 'Out of Position: Mark and Slide',
    parent: 'Out of Position',
    sourcePath: levelFeature(3, 'out-of-position'),
    actionType: 'Free triggered action',
    trigger: 'An encounter starts.',
    activationCondition:
      'At the start of an encounter, even if surprised: use Mark against one enemy you have line of effect to, then slide it up to 3 squares ignoring stability, never into harm, dying, a condition or other negative effect. Record the mark and slide manually.',
    text: source(levelFeature(3, 'out-of-position')),
  },
  {
    name: 'Fog of War: Forced Free Strike',
    parent: 'Fog of War',
    sourcePath: levelAbility('fog-of-war'),
    actionType: 'Mark benefit',
    cost: '2 Focus',
    activationCondition:
      'Until the end of the encounter, when you or an ally strikes a creature marked by you, pay 2 Focus to force it to make a free strike against a creature of your choice within 5 squares of it. Resolve manually.',
    text: source(levelAbility('fog-of-war')),
  },
  {
    name: 'Targets of Opportunity: Extra Target',
    parent: 'Targets of Opportunity',
    sourcePath: levelAbility('targets-of-opportunity'),
    actionType: 'Mark benefit',
    cost: '2 Focus',
    activationCondition:
      'Until the end of the encounter, when you or an ally strikes a creature marked by you, pay 2 Focus to add one additional target to the strike. Resolve the extra target manually.',
    text: source(levelAbility('targets-of-opportunity')),
  },
];

/** Printed clauses of chosen level-2/3 abilities the resolver does not model. */
export const TACTICIAN_ACTIVATION: Record<string, string> = {
  'Fog of War':
    'Each target is marked by you and must immediately make a free strike against a creature of your choice within 5 squares of it. Record the marks and resolve the free strikes manually; use Fog of War: Forced Free Strike for its mark benefit.',
  'Targets of Opportunity':
    'Each target is marked by you and you gain two surges. Record the marks and adjust surges manually; use Targets of Opportunity: Extra Target for its mark benefit.',
  "I've Got Your Back":
    'After the roll, one ally adjacent to the target can spend a Recovery. Resolve the Recovery manually.',
  'Try Me Instead':
    'Shift up to your speed directly toward an ally, ending adjacent, then swap places if you can fit into each other’s spaces; the ally can spend a Recovery, and you can make the printed melee 1 weapon strike against a creature, never yourself. Movement, the Recovery, the power roll, damage and frightened are resolved manually.',
  'No Dying on My Watch':
    'Move up to your speed toward the triggering ally, ending adjacent to it or in the nearest square if you cannot reach one; it can spend a Recovery and gains 5 temporary Stamina per enemy you came adjacent to. Then make the power roll + Might against the target (Reason potency, frightened of the triggering ally). The ability is recorded: movement, the Recovery, temporary Stamina and the whole power roll are resolved manually.',
  'Squad! On Me!':
    'Until the start of your next turn, you and each ally in the area gain a stability bonus equal to your Might, and each gains 2 surges. Apply both manually.',
  'Frontal Assault':
    'Until the end of the encounter or until you are dying: the first time each turn you or an ally damages a target marked by you, that creature can push it 2 and shift 2; allies charging a marked target can use a melee strike signature or heroic ability. Resolve manually.',
  "Hit 'Em Hard!":
    'Until the end of the encounter or until you are dying, whenever you or an ally damages a target marked by you, that creature gains 2 surges it can use immediately. Adjust surges manually.',
  Rout: 'Until the end of the encounter or until you are dying, whenever you or an ally damages a target marked by you with Reason below your average potency, it is frightened of that creature (save ends). Apply manually.',
  'Stay Strong and Focus!':
    'Until the end of the encounter or until you are dying, whenever you or an ally damages a target marked by you, that creature can spend a Recovery. Resolve manually.',
};
