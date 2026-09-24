// SPDX-License-Identifier: GPL-3.0-only
/** Source-prose choices, reactions and activities; unsupported timing/spatial effects stay manual. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
export interface ElementalistAction {
  name: string;
  parent: string;
  sourcePath: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  damageType?: string;
  trigger?: string;
}
export const ELEMENTALIST_ACTIONS: ElementalistAction[] = [
  ...['acid', 'cold', 'corruption', 'fire', 'lightning', 'poison', 'sonic'].map(damageType => ({
    name: `Hurl Element: ${damageType[0]!.toUpperCase()}${damageType.slice(1)}`,
    parent: 'Hurl Element',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/hurl-element.md',
    actionType: 'Main action',
    damageType,
    activationCondition: `Choose ${damageType} for Hurl Element's damage. Uses the original Reason roll and source tiers; may be used as a ranged free strike.`,
  })),
  {
    name: 'Enchantment and Ward: Change',
    parent: 'Enchantment',
    sourcePath: 'en/unified/md/feature/elementalist/level-1/enchantment.md',
    actionType: 'Respite activity',
    activationCondition:
      'During a respite perform a complex ritual, then change enchantment and ward through the shared full character editor. Resolve the stated effects manually.',
  },
  {
    name: 'Persistent Magic: Maintain',
    parent: 'Persistent Magic',
    sourcePath: 'en/unified/md/feature/elementalist/level-1/persistent-magic.md',
    actionType: 'No action',
    activationCondition:
      'After using a persistent ability, choose to maintain it. Levels 1–6 in combat: record it with /resource maintain ability="…" (and value=off to stop); the app reduces the start-of-turn Essence gain by its persistent value, refuses maintenance that would make the gain negative, and stops all maintenance when you take damage of at least five times Reason in one turn. No stacking on a creature; same roll for all targets. Outside combat maintain up to Victories rounds. Resolve the persistent effects themselves manually.',
  },
  {
    name: 'Persistent Magic: End',
    parent: 'Persistent Magic',
    sourcePath: 'en/unified/md/feature/elementalist/level-1/persistent-magic.md',
    actionType: 'No action',
    activationCondition:
      'Stop maintaining an ability at any time. In combat record it with /resource maintain ability="…" value=off, so the upkeep stops reducing your turn-start Essence. Resolve the stated effects manually.',
  },
  {
    name: 'Practical Magic: Knockback',
    parent: 'Practical Magic',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/practical-magic.md',
    actionType: 'Maneuver',
    activationCondition:
      'Use Knockback with Hurl Element distance and Reason instead of Might. Resolve the stated effects manually.',
  },
  {
    name: 'Practical Magic: Elemental Damage',
    parent: 'Practical Magic',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/practical-magic.md',
    actionType: 'Maneuver',
    activationCondition:
      'Choose a creature within Hurl Element distance; deal Reason acid, cold, corruption, fire, lightning, poison or sonic damage. This fixed damage gets no rolled-damage bonus. Resolve the stated effects manually.',
  },
  {
    name: 'Practical Magic: Teleport',
    parent: 'Practical Magic',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/practical-magic.md',
    actionType: 'Maneuver',
    activationCondition: 'Teleport up to Reason squares. Resolve the stated effects manually.',
  },
  {
    name: 'Practical Magic: Additional Square',
    parent: 'Practical Magic',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/practical-magic.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Only with its teleport option, add one square per Essence. Repeat this paid option for each additional square; outside combat total is limited to Victories. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Skin Like Castle Walls: Reduce Potency',
    parent: 'Skin Like Castle Walls',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/skin-like-castle-walls.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'When the parent halves incoming damage, reduce associated potency by 1 for the target. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Explosive Assistance: Enhance',
    parent: 'Explosive Assistance',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/explosive-assistance.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'When parent target force moves, use twice Reason instead of Reason as the distance bonus. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Breath of Dawn Remembered: Additional Recovery',
    parent: 'Breath of Dawn Remembered',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/breath-of-dawn-remembered.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With the parent, target can spend one additional Recovery per Essence. Repeat for each additional Recovery; outside combat total is limited to Victories. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Subtle Relocation: Enhance',
    parent: 'Subtle Relocation',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/subtle-relocation.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'When parent triggers, teleport target up to twice Reason instead of Reason. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Earth: Acolyte of Earth: Stability',
    parent: 'Earth: Acolyte of Earth',
    sourcePath: 'en/unified/md/feature/elementalist/level-1/earth-acolyte-of-earth.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Whenever you use an Earth and Magic ability, gain cumulative +1 stability until start of next turn. Resolve the stated effects manually.',
  },
  {
    name: 'Green: Acolyte of the Green: Temporary Stamina',
    parent: 'Green: Acolyte of the Green',
    sourcePath: 'en/unified/md/feature/elementalist/level-1/green-acolyte-of-the-green.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'After dealing damage with a Green and Magic ability that costs Essence, you or a creature within 10 gains temporary Stamina equal to Reason. Resolve the stated effects manually.',
  },
  {
    name: 'It Is the Soul Which Hears: Communicate',
    parent: 'It Is the Soul Which Hears',
    sourcePath: 'en/unified/md/feature/elementalist/level-1/it-is-the-soul-which-hears.md',
    actionType: 'Source activity',
    activationCondition:
      'Communicate with animals, beasts and plant creatures; use Reason instead of Presence to influence. Touch a living noncreature plant to exchange words for feelings and sensations. Resolve the stated effects manually.',
  },
  {
    name: "Ward of Nature's Affection: Retaliate",
    parent: "Ward of Nature's Affection",
    sourcePath: 'en/unified/md/feature/elementalist/level-1/ward-of-natures-affection.md',
    actionType: 'Free triggered action',
    activationCondition:
      'When a creature within Reason squares damages you, slide it up to Reason squares. Resolve the stated effects manually.',
  },
  {
    name: 'Ward of Surprising Reactivity: Retaliate',
    parent: 'Ward of Surprising Reactivity',
    sourcePath: 'en/unified/md/feature/elementalist/level-1/ward-of-surprising-reactivity.md',
    actionType: 'Free triggered action',
    activationCondition:
      'When an adjacent creature damages you, push it up to twice Reason squares. Resolve the stated effects manually.',
  },
  {
    name: 'Afflict a Bountiful Decay: End Effect',
    parent: 'Afflict a Bountiful Decay',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/afflict-a-bountiful-decay.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With the parent, you or one ally within distance can end one save-ends or end-of-turn effect. Resolve the stated effects manually.',
  },
  {
    name: 'Grasp of Beyond: Teleport',
    parent: 'Grasp of Beyond',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/grasp-of-beyond.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With the parent, teleport up to Reason squares. Resolve the stated effects manually.',
  },
  {
    name: 'The Green Within, the Green Without: Slide',
    parent: 'The Green Within, the Green Without',
    sourcePath:
      'en/unified/md/feature/ability/elementalist/level-1/the-green-within-the-green-without.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With the parent, slide one creature within 10 of its target up to 2 squares. Resolve the stated effects manually.',
  },
  {
    name: 'Invigorating Growth: Remove Mushrooms',
    parent: 'Invigorating Growth',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/invigorating-growth.md',
    actionType: 'Main action',
    activationCondition:
      'Target or adjacent creature can remove the mushrooms with a main action. Resolve the stated effects manually.',
  },
  {
    name: 'Ripples in the Earth: Raise Pillar',
    parent: 'Ripples in the Earth',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/ripples-in-the-earth.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Must touch ground. Choose ground in area unoccupied or occupied by self/ally; raise pillar up to Reason squares without collisions. Resolve the stated effects manually.',
  },
  {
    name: 'Test of Rain: End Effect',
    parent: 'Test of Rain',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/test-of-rain.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With the parent, you and each ally in area can end one save-ends or end-of-turn effect. Resolve the stated effects manually.',
  },
  {
    name: 'Behold the Mystery: Persistent Effect',
    parent: 'Behold the Mystery',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/behold-the-mystery.md',
    actionType: 'Maneuver',
    activationCondition:
      'While maintaining Persistent 1, at start of turn use parent effect without another Essence payment. This records the maintenance effect; any repeat rolls and damage are resolved manually. Resolve the stated effects manually.',
  },
  {
    name: 'Conflagration: Persistent Effect',
    parent: 'Conflagration',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/conflagration.md',
    actionType: 'Maneuver',
    activationCondition:
      'While maintaining Persistent 2, at start of turn use parent effect without another Essence payment. This records the maintenance effect; any repeat rolls and damage are resolved manually. Resolve the stated effects manually.',
  },
  {
    name: 'The Flesh, a Crucible: Persistent Effect',
    parent: 'The Flesh, a Crucible',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/the-flesh-a-crucible.md',
    actionType: 'No action',
    activationCondition:
      'While maintaining Persistent 1 and target within distance, at start of turn repeat power roll without Essence payment. This records the maintenance effect; any repeat rolls and damage are resolved manually. Resolve the stated effects manually.',
  },
  {
    name: 'Instantaneous Excavation: Persistent Effect',
    parent: 'Instantaneous Excavation',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/instantaneous-excavation.md',
    actionType: 'No action',
    activationCondition:
      'While maintaining Persistent 1, at start of turn open another hole; roll separately for each eligible creature above it, without Essence payment. This records the maintenance effect; any repeat rolls and damage are resolved manually. Resolve the stated effects manually.',
  },
  {
    name: 'No More Than a Breeze: Persistent Effect',
    parent: 'No More Than a Breeze',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-1/no-more-than-a-breeze.md',
    actionType: 'No action',
    activationCondition:
      'While maintaining Persistent 1, effect lasts until start of next turn. This records the maintenance effect; any repeat rolls and damage are resolved manually. Resolve the stated effects manually.',
  },
  {
    name: 'Disciple of Fire: Encounter Surges',
    parent: 'Disciple of Fire',
    sourcePath: 'en/unified/md/feature/elementalist/level-2/disciple-of-fire.md',
    actionType: 'Start of a combat encounter',
    activationCondition:
      'At the start of a combat encounter, gain surges equal to your Victories. Whenever you spend a surge to deal extra damage, you can make that damage fire damage, and your fire damage ignores fire immunity. Adjust surges and damage manually.',
  },
  {
    name: 'Disciple of the Green: Animal Form',
    parent: 'Disciple of the Green',
    sourcePath: 'en/unified/md/feature/elementalist/level-2/disciple-of-the-green.md',
    actionType: 'Maneuver',
    activationCondition:
      'Only in your true form and not dying: shapeshift into a Green Animal Forms type whose prerequisite level you have (canine, fish or rodent at 2nd; bird or great cat at 3rd). Apply the form’s temporary Stamina, speed, size, stability and melee damage bonus and its special rule manually; melee free strikes use Reason.',
  },
  {
    name: 'Disciple of the Green: Revert',
    parent: 'Disciple of the Green',
    sourcePath: 'en/unified/md/feature/elementalist/level-2/disciple-of-the-green.md',
    actionType: 'Maneuver',
    activationCondition:
      'Return to your true form, losing the form’s temporary Stamina; you revert automatically when dying. Restore statistics manually.',
  },
  {
    name: 'A Conversation With Fire: Speak',
    parent: 'A Conversation With Fire',
    sourcePath: 'en/unified/md/feature/elementalist/level-3/a-conversation-with-fire.md',
    actionType: '1 uninterrupted minute before a fire',
    activationCondition:
      'Speak another creature’s name; if it is willing, you speak through images in the fire as if together. Either of you ends it as a maneuver. Resolve manually.',
  },
  {
    name: 'Distance Is Only Memory: Open Portal',
    parent: 'Distance Is Only Memory',
    sourcePath: 'en/unified/md/feature/elementalist/level-3/distance-is-only-memory.md',
    actionType: 'After a respite',
    activationCondition:
      'Each time you finish a respite, open a two-way portal to any place you have previously been; you and allies can pass through. It lasts 1 hour or until you dismiss it as a main action. Resolve manually.',
  },
  {
    name: 'O Flower Aid, O Earth Defend: Persistent Effect',
    parent: 'O Flower Aid, O Earth Defend',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-2/o-flower-aid-o-earth-defend.md',
    actionType: 'Maneuver',
    activationCondition:
      'While maintaining Persistent 1, the area remains until the start of your next turn and you can move it up to 5 squares as a maneuver; it ends if the area leaves your line of effect. Resolve the area manually.',
  },
  {
    name: 'Swarm of Spirits: Persistent Effect',
    parent: 'Swarm of Spirits',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-3/swarm-of-spirits.md',
    actionType: 'No action',
    activationCondition:
      'While maintaining Persistent 1, make the power roll again against each enemy in the area without spending essence; the ally effect lasts until the start of your next turn. This records the maintenance; resolve the repeat roll manually.',
  },
  {
    name: 'Wall of Fire: Persistent Effect',
    parent: 'Wall of Fire',
    sourcePath: 'en/unified/md/feature/ability/elementalist/level-3/wall-of-fire.md',
    actionType: 'No action',
    activationCondition:
      'While maintaining Persistent 1, the wall lasts until the start of your next turn and you can add squares equal to your Reason. Resolve the wall and its damage manually.',
  },
];
export function elementalistSourceText(action: ElementalistAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Elementalist source ${action.sourcePath}`);
  return entry.text;
}

export function elementalistActionText(action: ElementalistAction): string {
  return `${action.activationCondition}\n\n${elementalistSourceText(action)}`;
}

/** Level-2/3 ability notes: what the table resolves automatically and which clauses stay manual. */
export const ELEMENTALIST_ACTIVATION: Record<string, string> = {
  'There Is No Space Between':
    'Open two size 1 portals within 10 squares, no higher than 1 square; you and allies touching one can emerge from another. Open another at the start of each of your turns. Portals end if you move beyond distance, end them as a maneuver or are dying. Resolve manually.',
  'O Flower Aid, O Earth Defend':
    'Until the start of your next turn: once as a free maneuver at the start of your turn you and allies in the area can spend any number of Recoveries; it is difficult terrain for enemies; enemies entering it first each round or starting there take damage equal to your Reason. Resolve manually.',
  'Subvert the Green Within':
    'The target first uses its signature ability against a creature of your choice, then you make the power roll against it; the target action, roll and poison damage are resolved manually.',
  'Translated Through Flame':
    'Teleport yourself or an ally within 10 squares, then the power roll affects each enemy adjacent to the new space, never the teleported creature; the roll and fire damage are resolved manually.',
  'Earth Accepts Me':
    'Step into a mundane dirt, metal or stone object at least your size and stay as long as you like, observing and speaking but without line of effect outside. Resolve manually.',
  'Remember Growth and Sun and Rain':
    'See and hear events within 10 squares of a mundane wooden object from the last 12 hours, from its location. Resolve manually.',
  Erase:
    'The power roll sets how many creatures are targeted (one, two or three), so the roll and fading effects (bane, double bane, gone for 1 hour) are resolved manually.',
  'Maw of Earth': 'The ground in or beneath the area drops 3 squares; resolve the fall manually.',
  'Swarm of Spirits':
    'Until the end of your next turn, allies in the area treat each characteristic as 1 higher to resist potencies and have +1 to saving throws. Apply manually; use Swarm of Spirits: Persistent Effect to maintain.',
  'Wall of Fire':
    'The wall lasts until the start of your next turn; enemies entering it first each round or starting there take fire damage equal to your Reason for each square they enter. Resolve manually.',
};
