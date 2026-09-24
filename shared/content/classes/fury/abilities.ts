// SPDX-License-Identifier: GPL-3.0-only
/** Source-timed Fury effects; optional costs are separate from the base ability. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import kitSources from '../../compendium/kit.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
export interface FuryAction {
  name: string;
  parent: string;
  sourcePath: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  trigger?: string;
}
const ability = (slug: string) => `en/unified/md/feature/ability/fury/level-1/${slug}.md`;
const kitFeature = (kit: string, slug: string) => `en/unified/md/feature/fury/${kit}/${slug}.md`;
const levelFeature = (level: number, slug: string) =>
  `en/unified/md/feature/fury/level-${level}/${slug}.md`;
const levelAbility = (level: number, slug: string) =>
  `en/unified/md/feature/ability/fury/level-${level}/${slug}.md`;
const wild = 'en/unified/md/feature/ability/fury/stormwight-kits/aspect-of-the-wild.md';
export const FURY_ACTIONS: FuryAction[] = [
  {
    name: 'Blood for Blood!: Extra Damage',
    parent: 'Blood for Blood!',
    sourcePath: ability('blood-for-blood'),
    actionType: 'Part of Blood for Blood!',
    activationCondition:
      'When using Blood for Blood, optionally take 1d6 damage to deal an additional 1d6 damage to the target. Resolve both rolls and damage manually.',
  },
  {
    name: 'To the Death!: Target Opportunity Attack',
    parent: 'To the Death!',
    sourcePath: ability('to-the-death'),
    actionType: 'Target free triggered action',
    activationCondition:
      'Manual proxy for the target’s permission from To the Death: the target, not the Fury, can make an opportunity attack against the Fury as a free triggered action. Resolve with the target’s attack statistics manually.',
  },
  {
    name: 'Out of the Way!: Follow',
    parent: 'Out of the Way!',
    sourcePath: ability('out-of-the-way'),
    actionType: 'Part of Out of the Way!',
    activationCondition:
      'You can move into squares the target leaves during the slide. Any opportunity-attack damage you take during this movement is also dealt to that target. Movement and retaliatory damage are manual.',
  },
  {
    name: 'Wing Buffet: Shift',
    parent: 'Wing Buffet',
    sourcePath: 'en/unified/md/kit/corven.md',
    actionType: 'Part of Wing Buffet',
    activationCondition:
      'Shift up to 2 squares before or after making the Wing Buffet power roll. Resolve movement manually.',
  },
  {
    name: 'Driving Pounce: Follow',
    parent: 'Driving Pounce',
    sourcePath: 'en/unified/md/kit/raden.md',
    actionType: 'Part of Driving Pounce',
    activationCondition:
      'Shift up to the actual number of squares you pushed the target with Driving Pounce. Resolve movement manually.',
  },
  {
    name: 'Lines of Force: Enhance',
    parent: 'Lines of Force',
    sourcePath: ability('lines-of-force'),
    actionType: 'Part of Lines of Force',
    cost: 1,
    activationCondition:
      'Only with Lines of Force when its target would be force moved; replace the Might distance bonus with twice Might. Resolve movement manually.',
  },
  {
    name: 'Unearthly Reflexes: Reduce Potency',
    parent: 'Unearthly Reflexes',
    sourcePath: ability('unearthly-reflexes'),
    actionType: 'Part of Unearthly Reflexes',
    cost: 1,
    activationCondition:
      'Only with Unearthly Reflexes when you take damage with an associated potency effect; reduce its potency by 1 for you. Resolve manually.',
  },
  {
    name: 'Furious Change: Recovery',
    parent: 'Furious Change',
    sourcePath: ability('furious-change'),
    actionType: 'Part of Furious Change',
    cost: 1,
    activationCondition:
      'Only with Furious Change when you lose Stamina and are not dying; if still not dying, you can spend a Recovery. Recovery payment/healing is manual.',
  },
  {
    name: 'Aspect of the Wild: Second Shapeshift',
    parent: 'Aspect of the Wild',
    sourcePath: wild,
    actionType: 'Free maneuver',
    cost: 1,
    activationCondition:
      'After Aspect of the Wild, shapeshift a second time into a form granted by your current kit or your true form. Form state and restrictions are manual.',
  },
  {
    name: 'To the Uttermost End: Extra Ferocity',
    parent: 'To the Uttermost End',
    sourcePath: ability('to-the-uttermost-end'),
    actionType: 'Part of To the Uttermost End',
    cost: 1,
    activationCondition:
      'Only while winded or dying and using To the Uttermost End. Each use spends one additional Ferocity in combat: add 1d6 damage while winded or 1d10 while dying per Ferocity spent. Lose 1d6 Stamina once after the strike, not per spend. Outside combat use the Victories-equivalent total, not repeated free spends. Track the total and resolve dice/damage manually.',
  },
  {
    name: 'Primordial Cunning: Slide Instead',
    parent: 'Primordial Cunning',
    sourcePath: 'en/unified/md/feature/fury/level-1/primordial-cunning.md',
    actionType: 'Part of forced movement',
    activationCondition:
      'Whenever you would push a target with forced movement, you can slide them instead. Resolve movement manually.',
  },
  {
    name: 'Boren: Pull Instead',
    parent: 'Boren: Aspect Benefits',
    sourcePath: kitFeature('boren', 'aspect-benefits'),
    actionType: 'Part of forced movement',
    activationCondition:
      'Whenever you would push a creature with forced movement, you can pull it instead. Resolve manually.',
  },
  {
    name: 'Boren: Grab Pulled Creature',
    parent: 'Boren: Aspect Benefits',
    sourcePath: kitFeature('boren', 'aspect-benefits'),
    actionType: 'Free triggered action',
    trigger: 'You pull a creature adjacent to you and its Might is below your average potency.',
    activationCondition:
      'Only after pulling a creature adjacent, with its Might strictly below your average potency. Make it grabbed by you; validate position/potency and resolve manually.',
  },
  {
    name: 'Corven: Falling Shapeshift',
    parent: 'Corven: Aspect Benefits',
    sourcePath: kitFeature('corven', 'aspect-benefits'),
    actionType: 'Free triggered action',
    trigger: 'You fall.',
    activationCondition:
      'Whenever you fall, use Aspect of the Wild as a free triggered action. Form state/restrictions are manual.',
  },
  ...(['Corven', 'Raden'] as const).map(kit => ({
    name: `${kit}: Animal Hide`,
    parent: `Animal Form: ${kit === 'Corven' ? 'Crow' : 'Rat'}`,
    sourcePath: kitFeature(kit.toLowerCase(), `animal-form-${kit === 'Corven' ? 'crow' : 'rat'}`),
    actionType: 'Free maneuver',
    activationCondition: `Only in ${kit === 'Corven' ? 'crow' : 'rat'} form: use Hide as a free maneuver and allies as cover. You cannot use abilities in this animal form except Aspect of the Wild. Form, hiding and cover are manual.`,
  })),
  {
    name: 'Vuken: Aid After Knockback',
    parent: 'Vuken: Aspect Benefits',
    sourcePath: kitFeature('vuken', 'aspect-benefits'),
    actionType: 'Free triggered action',
    trigger: 'You use the Knockback maneuver.',
    activationCondition:
      'After using Knockback, use Aid Attack as a free triggered action. Resolve the aid manually.',
  },
  {
    name: 'Your Entrails Are Your Extrails!: Ongoing Damage',
    parent: 'Your Entrails Are Your Extrails!',
    sourcePath: ability('your-entrails-are-your-extrails'),
    actionType: 'End of your turn',
    activationCondition:
      'Only while the target is bleeding from this ability: at the end of each of your turns it takes damage equal to your Might. Track the effect and apply damage manually.',
  },
  {
    name: 'Unstoppable Force: Charge With Ability',
    parent: 'Unstoppable Force',
    sourcePath: levelFeature(2, 'unstoppable-force'),
    actionType: 'Part of Charge',
    activationCondition:
      'Only when using the Charge main action: use a strike signature or strike heroic ability instead of the free strike, and you can jump as part of the charge. Pay any heroic cost and resolve movement manually.',
  },
  {
    name: 'Tooth and Claw: Adjacent Damage',
    parent: 'Tooth and Claw',
    sourcePath: levelFeature(2, 'tooth-and-claw'),
    actionType: 'End of your turn',
    activationCondition:
      'At the end of each of your turns, each enemy adjacent to you takes damage equal to your Might score. Confirm adjacency and apply damage manually.',
  },
  {
    name: 'Special Delivery: Ally Free Strike',
    parent: 'Special Delivery',
    sourcePath: levelAbility(2, 'special-delivery'),
    actionType: 'Target free strike',
    activationCondition:
      'Manual proxy for the pushed ally: at the end of the vertical push, the ally can make a free strike that deals extra damage equal to your Might score. Resolve with the ally’s free strike manually.',
  },
  {
    name: 'Apex Predator: Pursue',
    parent: 'Apex Predator',
    sourcePath: levelAbility(2, 'apex-predator'),
    actionType: 'Free triggered action',
    trigger: 'The Apex Predator target willingly moves.',
    activationCondition:
      'Only after Apex Predator and until the end of the encounter, when its target willingly moves: move. Resolve movement manually; the target also cannot be hidden from you for 24 hours.',
  },
  {
    name: 'You Are Already Dead: Free Strike',
    parent: 'You Are Already Dead',
    sourcePath: levelAbility(3, 'you-are-already-dead'),
    actionType: 'Part of You Are Already Dead',
    activationCondition:
      'Only if the target is a leader or solo creature: you can make a melee free strike against it. Resolve the free strike manually.',
  },
];
export function furyActionText(action: FuryAction): string {
  const entry = [...abilitySources, ...featureSources, ...kitSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Fury action source: ${action.sourcePath}`);
  return entry.text;
}
