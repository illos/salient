// SPDX-License-Identifier: GPL-3.0-only
/** Source-prose choices, reactions and activities; unsupported timing/spatial effects stay manual. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
export interface TalentAction {
  name: string;
  parent: string;
  sourcePath: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  trigger?: string;
}
export const TALENT_ACTIONS: TalentAction[] = [
  {
    name: 'Augmentation and Ward: Change',
    parent: 'Psionic Augmentation',
    sourcePath: 'en/unified/md/feature/talent/level-1/psionic-augmentation.md',
    actionType: 'Respite activity',
    activationCondition:
      'During a respite meditate, then change augmentation and ward through the full character editor. Resolve the stated effects manually.',
  },
  {
    name: 'Telepathic Speech: Communicate',
    parent: 'Telepathic Speech',
    sourcePath: 'en/unified/md/feature/talent/level-1/telepathic-speech.md',
    actionType: 'Source activity',
    activationCondition:
      'Communicate with a creature within Mind Spike distance, sharing a language and aware of each other. They may reply telepathically. Resolve the stated effects manually.',
  },
  {
    name: 'Clarity and Strain: Turn-End Damage',
    parent: 'Clarity and Strain',
    sourcePath: 'en/unified/md/feature/talent/level-1/clarity-and-strain.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'At end of your own turn, take one damage per negative Clarity point. This is not on each spend. Levels 1–6: the app applies this damage at the end of each of your turns in combat, adds Victories at combat start and 1d3 at each turn start, and resets Clarity to 0 at encounter end; claim the first forced movement each round with /resource claim trigger=talent-forced-movement. Do not also apply them by hand, except strain for a Talent with Steel Ward or Force Orbs: the log gives the damage due and you apply what your immunity leaves with /adjust stamina. Level 7+ and outside combat: resolve the stated effects manually.',
  },
  {
    name: 'Clarity and Strain: Outside Combat',
    parent: 'Clarity and Strain',
    sourcePath: 'en/unified/md/feature/talent/level-1/clarity-and-strain.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Paid effects waive cost outside combat but cannot repeat until Victory/respite. A paid use within one minute of another deals 1d6 damage and incurs its strain; you can voluntarily take 1d6 to incur an ability strain. Unlimited spend budget equals Victories. Resolve the stated effects manually.',
  },
  {
    name: 'Accelerate: Maneuver',
    parent: 'Accelerate',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/accelerate.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With Accelerate, the target can use a maneuver. Resolve the stated effects manually.',
    cost: 2,
  },
  {
    name: 'Minor Telekinesis: Larger Target',
    parent: 'Minor Telekinesis',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/minor-telekinesis.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With Minor Telekinesis, increase eligible size by one per 2 Clarity. Repeat this option for each size increase; outside combat total spend is limited to Victories. Resolve the stated effects manually.',
    cost: 2,
  },
  {
    name: 'Minor Telekinesis: Vertical Slide',
    parent: 'Minor Telekinesis',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/minor-telekinesis.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With Minor Telekinesis, slide vertically. Resolve the stated effects manually.',
    cost: 3,
  },
  {
    name: 'Remote Assistance: Additional Target',
    parent: 'Remote Assistance',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/remote-assistance.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With Remote Assistance, target one additional creature or object. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Entropy Ward: React',
    parent: 'Entropy Ward',
    sourcePath: 'en/unified/md/feature/talent/level-1/entropy-ward.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'When a creature damages you, reduce its speed by Reason and prevent its triggered actions until end of its next turn. Resolve the stated effects manually.',
  },
  {
    name: 'Repulsive Ward: React',
    parent: 'Repulsive Ward',
    sourcePath: 'en/unified/md/feature/talent/level-1/repulsive-ward.md',
    actionType: 'Free triggered action',
    activationCondition:
      'When an adjacent creature damages you, optionally push it up to Reason. Resolve the stated effects manually.',
  },
  {
    name: 'Steel Ward: React',
    parent: 'Steel Ward',
    sourcePath: 'en/unified/md/feature/talent/level-1/steel-ward.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'After incoming damage resolves, gain damage immunity Reason until end of your next turn. Does not mitigate the triggering damage. Resolve the stated effects manually.',
  },
  {
    name: 'Vanishing Ward: React',
    parent: 'Vanishing Ward',
    sourcePath: 'en/unified/md/feature/talent/level-1/vanishing-ward.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'When damaged, become invisible until end of your next turn. Resolve the stated effects manually.',
  },
  {
    name: 'Repel: Return Push',
    parent: 'Repel',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/repel.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Only if Repel reduced forced movement to zero, target may push its source up to Reason. Resolve the stated effects manually.',
  },
  {
    name: 'Precognition: Free Strike',
    parent: 'Precognition',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/precognition.md',
    actionType: 'Triggered action',
    activationCondition:
      'While parent effect active, whenever target takes damage, it may use a triggered action for a free strike against that source. Resolve the stated effects manually.',
  },
  {
    name: 'Optic Blast: Reflection',
    parent: 'Optic Blast',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/optic-blast.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'When targeting a solid reflective object or its wearer/carrier, select one additional creature/object within 3 of first target. Resolve second parent attack manually without new activation payment. Resolve the stated effects manually.',
  },
  {
    name: 'Materialize: Create Object',
    parent: 'Materialize',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/materialize.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Parent damage leaves a worthless size 1M wood/stone/metal object in an adjacent unoccupied space of your choice. Resolve the stated effects manually.',
  },
  {
    name: 'Incinerate: Lingering Fire',
    parent: 'Incinerate',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/incinerate.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Until start of your next turn, first enemy entry each round or starting there takes 2 fire damage. Strained fire ends at end of your current turn. Fixed damage has no Force bonus. Resolve the stated effects manually.',
  },
  {
    name: 'Entropic Bolt: Repeated Target',
    parent: 'Entropic Bolt',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/entropic-bolt.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Target takes extra 1 corruption for each additional time targeted this encounter. Resolve the stated effects manually.',
  },
  {
    name: 'Spirit Sword: Surge',
    parent: 'Spirit Sword',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/spirit-sword.md',
    actionType: 'Part of parent ability',
    activationCondition: 'Gain 1 surge with the parent use. Resolve the stated effects manually.',
  },
  {
    name: 'Choke: Vertical Pull',
    parent: 'Choke',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/choke.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With parent, optionally vertical pull up to 2; ignore stability only if restrained by this ability. Resolve the stated effects manually.',
  },
  {
    name: 'Inertia Soak: Push',
    parent: 'Inertia Soak',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/inertia-soak.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'While active, each square entered permits pushing one adjacent creature Reason; may ignore allied stability; each creature once per turn. Resolve the stated effects manually.',
  },
  {
    name: 'Perfect Clarity: Regain Clarity',
    parent: 'Perfect Clarity',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/perfect-clarity.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'When target next power roll under the double edge gets tier 3, caster gains 1 Clarity. Resolve the stated effects manually.',
  },
  {
    name: 'Mind Spike: Strain',
    parent: 'Mind Spike',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/mind-spike.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Target takes extra 2 psychic damage; caster takes 2 psychic damage that cannot be reduced. Resolve the stated effects manually.',
  },
  {
    name: 'Entropic Bolt: Strain',
    parent: 'Entropic Bolt',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/entropic-bolt.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Gain 1 Clarity on a tier 2 or 3 parent roll. Resolve the stated effects manually.',
  },
  {
    name: 'Hoarfrost: Strain',
    parent: 'Hoarfrost',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/hoarfrost.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Caster slowed until end of next turn; target slowed by parent is restrained instead. Resolve the stated effects manually.',
  },
  {
    name: 'Incinerate: Strain',
    parent: 'Incinerate',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/incinerate.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Cube size increases by 2, but lingering fire ends at end of current turn. Resolve the stated effects manually.',
  },
  {
    name: 'Kinetic Grip: Strain',
    parent: 'Kinetic Grip',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/kinetic-grip.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Must vertical push instead of slide, using the parent result. Resolve the stated effects manually.',
  },
  {
    name: 'Kinetic Pulse: Strain',
    parent: 'Kinetic Pulse',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/kinetic-pulse.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Burst size increases by 2 and caster bleeding until next turn starts. Resolve the stated effects manually.',
  },
  {
    name: 'Materialize: Strain',
    parent: 'Materialize',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/materialize.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. After parent damage, each creature adjacent to target takes Reason damage; caster takes Reason damage that cannot be reduced. Resolve the stated effects manually.',
  },
  {
    name: 'Optic Blast: Strain',
    parent: 'Optic Blast',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/optic-blast.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Caster gains 1 surge usable immediately and takes Reason damage that cannot be reduced. Resolve the stated effects manually.',
  },
  {
    name: 'Spirit Sword: Strain',
    parent: 'Spirit Sword',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/spirit-sword.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Target takes extra 3 damage; caster takes 3 damage that cannot be reduced. Resolve the stated effects manually.',
  },
  {
    name: 'Flashback: Strain',
    parent: 'Flashback',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/flashback.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Caster takes 1d6 damage and is slowed (save ends). Resolve the stated effects manually.',
  },
  {
    name: 'Inertia Soak: Strain',
    parent: 'Inertia Soak',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/inertia-soak.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Caster weakened (save ends); while weakened this way incoming forced movement distance +5. Resolve the stated effects manually.',
  },
  {
    name: 'Iron: Strain',
    parent: 'Iron',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/iron.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Caster cannot use maneuvers (save ends). Resolve the stated effects manually.',
  },
  {
    name: 'Perfect Clarity: Strain',
    parent: 'Perfect Clarity',
    sourcePath: 'en/unified/md/feature/ability/talent/level-1/perfect-clarity.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Caster takes 1d6 damage and cannot use triggered actions (save ends). Resolve the stated effects manually.',
  },
];
export function talentActionText(action: TalentAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Talent source ${action.sourcePath}`);
  return `${action.activationCondition}\n\n${entry.text}`;
}
