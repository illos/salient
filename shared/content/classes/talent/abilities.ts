// SPDX-License-Identifier: GPL-3.0-only
/** Source-prose choices, reactions and activities; unsupported timing/spatial effects stay manual. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
import { sourceBody } from '../../source-body.ts';
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
      'The engine applies this with Mind Spike when you are strained: already below zero Clarity, or taken below zero by the use. Outside combat, add strained=yes to the use to incur it by the one-minute or voluntary rule (the engine also deals the 1d6); strained=no overrides. Target takes extra 2 psychic damage; caster takes 2 psychic damage that cannot be reduced. Effects may persist after Clarity recovers. Record it here only for a use the engine did not resolve, and then resolve the stated effects manually.',
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
      'The engine applies this with Spirit Sword when you are strained: already below zero Clarity, or taken below zero by the use. Outside combat, add strained=yes to the use to incur it by the one-minute or voluntary rule (the engine also deals the 1d6); strained=no overrides. Target takes extra 3 damage; caster takes 3 damage that cannot be reduced. Effects may persist after Clarity recovers. Record it here only for a use the engine did not resolve, and then resolve the stated effects manually.',
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
  {
    name: 'Ease the Hours: Extend Montage',
    parent: 'Ease the Hours',
    sourcePath: 'en/unified/md/feature/talent/level-2/ease-the-hours.md',
    actionType: 'During a montage test',
    activationCondition:
      'If a montage test would end before the heroes hit the success limit, increase its number of rounds by 1. Resolve manually.',
  },
  {
    name: 'Ease Their Fall: Reduce Falling Damage',
    parent: 'Ease Their Fall',
    sourcePath: 'en/unified/md/feature/talent/level-2/ease-their-fall.md',
    actionType: 'Free triggered action',
    trigger: 'You land after a fall, or a falling creature lands within 2 squares of you.',
    activationCondition:
      'Reduce the falling damage by 2 + your Reason score. Apply the reduction manually.',
  },
  {
    name: 'Scan: Search',
    parent: 'Scan',
    sourcePath: 'en/unified/md/feature/talent/level-3/scan.md',
    actionType: 'Free maneuver',
    activationCondition:
      'Once on each of your turns, search for hidden creatures (Hide and Sneak). Once you establish line of effect to a thinking creature within your Mind Spike distance, you keep line of effect to it until it moves beyond that distance. Resolve manually.',
  },
  {
    name: 'Force Orbs: Fire Orb',
    parent: 'Force Orbs',
    sourcePath: 'en/unified/md/feature/ability/talent/level-3/force-orbs.md',
    actionType: 'Free maneuver',
    activationCondition:
      'Only while you have at least one orb, once on each of your turns: fire an orb at a creature or object within 5 squares as a ranged strike (power roll + Reason: 2/3/5 damage), losing the orb. Whether a distance bonus extends the 5 squares is Q-TALENT-2. Resolve the roll and damage manually.',
  },
  {
    name: 'Applied Chronometrics: Strain',
    parent: 'Applied Chronometrics',
    sourcePath: 'en/unified/md/feature/ability/talent/level-2/applied-chronometrics.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. Your speed is halved until the end of the encounter. Resolve the stated effects manually.',
  },
  {
    name: 'Slow: Strain',
    parent: 'Slow',
    sourcePath: 'en/unified/md/feature/ability/talent/level-2/slow.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. The potency increases by 1 and you take 1d6 damage; at the start of each combat round while any target is affected you take 1d6 damage (use Slow: End Effect to end it). Resolve the stated effects manually.',
  },
  // V151 (QC1 V135 R1): the strained Slow's own end choice.
  {
    name: 'Slow: End Effect',
    parent: 'Slow',
    sourcePath: 'en/unified/md/feature/ability/talent/level-2/slow.md',
    actionType: 'No action',
    activationCondition:
      'Only after a strained Slow while any target is still affected: end the effect on all affected targets at any time, which stops the 1d6 damage you take each combat round. Resolve manually.',
  },
  {
    name: 'Gravitic Burst: Strain',
    parent: 'Gravitic Burst',
    sourcePath: 'en/unified/md/feature/ability/talent/level-2/gravitic-burst.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. The burst increases by 1 and you are weakened until the end of your turn. Resolve the stated effects manually.',
  },
  {
    name: 'Levity and Gravity: Strain',
    parent: 'Levity and Gravity',
    sourcePath: 'en/unified/md/feature/ability/talent/level-2/levity-and-gravity.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. You take half the damage the target takes. Resolve the stated effects manually.',
  },
  {
    name: 'Overwhelm: Strain',
    parent: 'Overwhelm',
    sourcePath: 'en/unified/md/feature/ability/talent/level-2/overwhelm.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. You start crying, and you cannot use triggered actions or make free strikes until the end of the target’s next turn. Resolve the stated effects manually.',
  },
  {
    name: 'Synaptic Override: Strain',
    parent: 'Synaptic Override',
    sourcePath: 'en/unified/md/feature/ability/talent/level-2/synaptic-override.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. You take 1d6 damage and are weakened until the end of your turn. Resolve the stated effects manually.',
  },
  {
    name: 'Fling Through Time: Strain',
    parent: 'Fling Through Time',
    sourcePath: 'en/unified/md/feature/ability/talent/level-3/fling-through-time.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. You take 2d6 damage and permanently age about 10 years; on a tier 3 outcome you gain 2 clarity. Resolve the stated effects manually.',
  },
  {
    name: 'Force Orbs: Strain',
    parent: 'Force Orbs',
    sourcePath: 'en/unified/md/feature/ability/talent/level-3/force-orbs.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. You create five orbs and are weakened while you have any orbs active. Resolve the stated effects manually.',
  },
  {
    name: 'Reflector Field: Strain',
    parent: 'Reflector Field',
    sourcePath: 'en/unified/md/feature/ability/talent/level-3/reflector-field.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. The aura increases by 1; whenever it reflects an ability you take 2d6 damage and forget a memory determined with the Director. Resolve the stated effects manually.',
  },
  {
    name: 'Soul Burn: Strain',
    parent: 'Soul Burn',
    sourcePath: 'en/unified/md/feature/ability/talent/level-3/soul-burn.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Apply when already below zero Clarity OR the parent use takes Clarity below zero, and when the outside-combat rules incur strain. Effects may persist after Clarity recovers. The potency increases by 1; you take 2d6 damage and gain 3 surges you can use immediately. Resolve the stated effects manually.',
  },
];
export function talentActionText(action: TalentAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Talent source ${action.sourcePath}`);
  return `${action.activationCondition}\n\n${sourceBody(entry.text)}`;
}

/** Level-2/3 ability notes: what the table resolves automatically and which clauses stay manual. */
export const TALENT_ACTIVATION: Record<string, string> = {
  'Applied Chronometrics':
    'The power roll sets how many creatures are targeted (two, three or four, one of which can be you); until the start of your next turn each gains +5 speed, cannot be made dazed (ending dazed) and gains an extra maneuver. The roll and effects are resolved manually.',
  Slow: 'Speed halved, slowed or speed 0 by tier and Presence potency (save ends), and a target so reduced cannot use triggered actions. Resolve manually.',
  'Synaptic Override':
    'You control the target: a free strike, or a shift or move and its signature ability against enemies you choose; it cannot be moved into harm, dying, a condition or other negative effect, but can provoke opportunity attacks. Resolve manually.',
  'Fling Through Time':
    'A flung target leaves the map until the end of its next turn, reappearing in its space or the nearest unoccupied one; weakened by Presence potency. Resolve manually.',
  'Force Orbs':
    'Three size 1T orbs each give cumulative damage immunity 1; you lose one each time you take damage. Use Force Orbs: Fire Orb for the orb strikes. Resolve manually.',
  'Reflector Field':
    'Until the start of your next turn, a ranged ability an enemy uses against an ally in the aura is negated and reflected back at half damage without its other effects. Resolve manually.',
  'Soul Burn':
    'The target also takes a bane on Presence tests until the end of the encounter. Resolve manually.',
};
