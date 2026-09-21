// SPDX-License-Identifier: GPL-3.0-only
/** Source-prose choices, reactions and activities; unsupported timing/spatial effects stay manual. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
export interface NullAction {
  name: string;
  parent: string;
  sourcePath: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  trigger?: string;
}
export const NULL_ACTIONS: NullAction[] = [
  {
    name: 'Null Field: Gravitic Disruption',
    parent: 'Null Field',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/null-field.md',
    actionType: 'Free maneuver',
    activationCondition:
      'Once as a free maneuver on each of your turns choose one of the three enhancements, lasting until start of your next turn. First time on a turn a target takes damage, optionally slide them up to 2. Resolve aura eligibility, timing and effect manually.',
    cost: 1,
  },
  {
    name: 'Null Field: Inertial Anchor',
    parent: 'Null Field',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/null-field.md',
    actionType: 'Free maneuver',
    activationCondition:
      'Once as a free maneuver on each of your turns choose one of the three enhancements, lasting until start of your next turn. Targets starting their turn in the aura cannot shift. Resolve aura eligibility, timing and effect manually.',
    cost: 1,
  },
  {
    name: 'Null Field: Synaptic Break',
    parent: 'Null Field',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/null-field.md',
    actionType: 'Free maneuver',
    activationCondition:
      'Once as a free maneuver on each of your turns choose one of the three enhancements, lasting until start of your next turn. Potencies of your or allied abilities against targets increase by 1. Resolve aura eligibility, timing and effect manually.',
    cost: 1,
  },
  {
    name: 'Null Field: End',
    parent: 'Null Field',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/null-field.md',
    actionType: 'No action',
    activationCondition:
      'Willingly end the field, no action. It otherwise lasts across encounters and ends if dying. Track aura lifecycle manually.',
  },
  {
    name: 'Inertial Shield: Reduce Potency',
    parent: 'Inertial Shield',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/inertial-shield.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Only when taking damage with Inertial Shield: reduce one associated effect potency by 1 for yourself. Half damage and potency change remain manual.',
    cost: 1,
  },
  {
    name: 'Chronokinetic Mastery: Disengage',
    parent: 'Chronokinetic Mastery',
    sourcePath: 'en/unified/md/feature/null/level-1/chronokinetic-mastery.md',
    actionType: 'Free triggered action',
    activationCondition:
      'After using Inertial Shield, use Disengage as a free triggered action. For Grab/Knockback use Intuition instead of Might, including size eligibility; Knockback can slide. Resolve the maneuver manually.',
  },
  {
    name: 'Cryokinetic Mastery: Grab',
    parent: 'Cryokinetic Mastery',
    sourcePath: 'en/unified/md/feature/null/level-1/cryokinetic-mastery.md',
    actionType: 'Free triggered action',
    activationCondition:
      'After using Inertial Shield, use Grab as a free triggered action. For Grab/Knockback use Intuition instead of Might, including size eligibility; Knockback can slide. Resolve the maneuver manually.',
  },
  {
    name: 'Metakinetic Mastery: Knockback',
    parent: 'Metakinetic Mastery',
    sourcePath: 'en/unified/md/feature/null/level-1/metakinetic-mastery.md',
    actionType: 'Free triggered action',
    activationCondition:
      'After using Inertial Shield, use Knockback as a free triggered action. For Grab/Knockback use Intuition instead of Might, including size eligibility; Knockback can slide. Resolve the maneuver manually.',
  },
  {
    name: 'Chronokinetic Mastery: Knockback Disengage',
    parent: 'Chronokinetic Mastery',
    sourcePath: 'en/unified/md/feature/null/level-1/chronokinetic-mastery.md',
    actionType: 'Free triggered action',
    activationCondition:
      'At 2 Discipline, before or after Knockback use Disengage as a free triggered action. Threshold benefits persist until end of your turn even after spending; track eligibility and movement manually.',
  },
  {
    name: 'Cryokinetic Mastery: Cold Damage',
    parent: 'Cryokinetic Mastery',
    sourcePath: 'en/unified/md/feature/null/level-1/cryokinetic-mastery.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'At 2 Discipline, when dealing untyped damage with a psionic ability, optionally change it to cold. Threshold benefit persists until end of your turn after spending. Resolve damage-type change manually.',
  },
  {
    name: 'Cryokinetic Mastery: Additional Knockback Target',
    parent: 'Cryokinetic Mastery',
    sourcePath: 'en/unified/md/feature/null/level-1/cryokinetic-mastery.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'At 2 Discipline, Knockback can target one additional creature. Threshold benefit persists until end of your turn after spending. Resolve additional maneuver manually.',
  },
  {
    name: 'Psionic Martial Arts: Grab',
    parent: 'Psionic Martial Arts',
    sourcePath: 'en/unified/md/feature/null/level-1/psionic-martial-arts.md',
    actionType: 'Maneuver',
    activationCondition:
      'Use Intuition instead of Might for the Grab power roll and size eligibility. Resolve the maneuver manually; its ordinary source applies otherwise.',
  },
  {
    name: 'Psionic Martial Arts: Knockback',
    parent: 'Psionic Martial Arts',
    sourcePath: 'en/unified/md/feature/null/level-1/psionic-martial-arts.md',
    actionType: 'Maneuver',
    activationCondition:
      'Use Intuition instead of Might for the Knockback power roll and size eligibility. You may slide instead of push. Resolve the maneuver manually; its ordinary source applies otherwise.',
  },
  {
    name: 'Psionic Augmentation: Change Augmentation',
    parent: 'Psionic Augmentation',
    sourcePath: 'en/unified/md/feature/null/level-1/psionic-augmentation.md',
    actionType: 'Respite activity',
    activationCondition:
      'Only during a respite, undergo psionic meditation and choose another augmentation through the shared wizard editing operation. This records the activity; it does not change the build automatically.',
  },
  {
    name: 'Dance of Blows: Slide',
    parent: 'Dance of Blows',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/dance-of-blows.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With the parent use, optionally slide one adjacent enemy up to Intuition squares. Resolve chosen enemy and movement manually.',
  },
  {
    name: 'Faster Than the Eye: Adjacent Damage',
    parent: 'Faster Than the Eye',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/faster-than-the-eye.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'With the parent use, optionally deal Agility damage to one adjacent creature or object. Resolve separately from the two rolled targets, manually. Force Augmentation does not modify this unrolled damage.',
  },
  {
    name: 'Inertial Step: Shift',
    parent: 'Inertial Step',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/inertial-step.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Before or after the parent strike, optionally shift up to half your speed. Resolve movement manually.',
  },
  {
    name: 'Chronal Spike: Shift',
    parent: 'Chronal Spike',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/chronal-spike.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Before or after the parent strike, optionally shift up to half your speed. Resolve movement manually.',
  },
  {
    name: 'Chronal Spike: Replacement Strike',
    parent: 'Chronal Spike',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/chronal-spike.md',
    actionType: 'Part of parent ability',
    activationCondition:
      'Only when an effect permits a free strike or signature ability, use the original Chronal Spike action and pay its normal 3 Discipline cost. This records the permission; original action owns the roll and payment. Do not pay twice.',
  },
  {
    name: 'Relentless Nemesis: Follow',
    parent: 'Relentless Nemesis',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/relentless-nemesis.md',
    actionType: 'Free triggered action',
    activationCondition:
      'Until start of your next turn, when the struck target finishes moving or being force moved, shift up to speed ending adjacent to that target. Resolve timing and movement manually.',
  },
  {
    name: 'A Squad Unto Myself: Disengage',
    parent: 'A Squad Unto Myself',
    sourcePath: 'en/unified/md/feature/ability/null/level-1/a-squad-unto-myself.md',
    actionType: 'Free maneuver',
    activationCondition:
      'Before or after parent use, optionally take Disengage as a free maneuver. Resolve movement manually.',
  },
];
export function nullActionText(action: NullAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Null source ${action.sourcePath}`);
  return `${action.activationCondition}\n\n${entry.text}`;
}
