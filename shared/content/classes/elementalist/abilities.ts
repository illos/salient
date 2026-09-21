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
      'After using a persistent ability, choose to maintain it. Reduce start-of-turn Essence by its persistent value; never below zero. No stacking on a creature; same roll for all targets. Ends with encounter or damage in one turn at least five times Reason. Outside combat maintain up to Victories rounds. Resolve the stated effects manually.',
  },
  {
    name: 'Persistent Magic: End',
    parent: 'Persistent Magic',
    sourcePath: 'en/unified/md/feature/elementalist/level-1/persistent-magic.md',
    actionType: 'No action',
    activationCondition:
      'Stop maintaining an ability at any time. Resolve the stated effects manually.',
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
];
export function elementalistActionText(action: ElementalistAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Elementalist source ${action.sourcePath}`);
  return `${action.activationCondition}\n\n${entry.text}`;
}
