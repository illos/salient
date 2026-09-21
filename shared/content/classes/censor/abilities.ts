// SPDX-License-Identifier: GPL-3.0-only
/** Source-timed uses embedded in the pinned Censor features/abilities; effects explicitly manual. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
export interface CensorAction {
  name: string;
  parent: string;
  sourcePath: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  trigger?: string;
}
export const CENSOR_ACTIONS: CensorAction[] = [
  {
    name: 'Judgment: End',
    parent: 'Judgment',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/judgment.md',
    actionType: 'No action',
    activationCondition: 'Only for your current judgment. Resolve the stated effects manually.',
  },
  {
    name: 'Judgment: Punish',
    parent: 'Judgment',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/judgment.md',
    actionType: 'Free triggered action',
    activationCondition:
      'A creature judged by you uses a main action within your line of effect; deal holy damage equal to twice your Presence. Resolve the stated effects manually.',
  },
  {
    name: 'Judgment: Retarget',
    parent: 'Judgment',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/judgment.md',
    actionType: 'Free triggered action',
    activationCondition:
      'A creature judged by you is reduced to 0 Stamina; use Judgment against a new target. Resolve the stated effects manually.',
  },
  {
    name: 'Judgment: Stop Shifting',
    parent: 'Judgment',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/judgment.md',
    actionType: 'Free triggered action',
    activationCondition:
      'An adjacent creature judged by you starts to shift; make a melee free strike and its speed becomes 0 until the current turn ends. Choose only one paid option at a time, even if the same effect triggers several. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Judgment: Impose Bane',
    parent: 'Judgment',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/judgment.md',
    actionType: 'Free triggered action',
    activationCondition:
      'A creature judged by you within 10 squares makes a power roll; impose a bane. Choose only one paid option at a time, even if the same effect triggers several. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Judgment: Reduce Potency',
    parent: 'Judgment',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/judgment.md',
    actionType: 'Free triggered action',
    activationCondition:
      'A creature judged by you within 10 squares uses an ability with potency targeting only one creature; reduce that potency by 1. Choose only one paid option at a time, even if the same effect triggers several. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Judgment: Taunt',
    parent: 'Judgment',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/judgment.md',
    actionType: 'Free triggered action',
    activationCondition:
      'You damage a creature judged by you with a melee ability; taunt it until its next turn ends. Choose only one paid option at a time, even if the same effect triggers several. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Judgment: Exorcist Benefit',
    parent: 'Judgment Order Benefit: Exorcist',
    sourcePath: 'en/unified/md/feature/censor/level-1/judgment-order-benefit.md',
    actionType: 'Part of Judgment',
    activationCondition:
      'Only the first time on a turn you use Judgment to judge a creature. Teleport up to twice your Presence, closer to the judged creature; destination needs no line of effect. Resolve the stated effects manually.',
  },
  {
    name: 'Judgment: Oracle Benefit',
    parent: 'Judgment Order Benefit: Oracle',
    sourcePath: 'en/unified/md/feature/censor/level-1/judgment-order-benefit.md',
    actionType: 'Part of Judgment',
    activationCondition:
      'Only the first time on a turn you use Judgment to judge a creature. Deal holy damage equal to twice your Presence to the judged creature. Resolve the stated effects manually.',
  },
  {
    name: 'Judgment: Paragon Benefit',
    parent: 'Judgment Order Benefit: Paragon',
    sourcePath: 'en/unified/md/feature/censor/level-1/judgment-order-benefit.md',
    actionType: 'Part of Judgment',
    activationCondition:
      'Only the first time on a turn you use Judgment to judge a creature. Vertical pull the judged creature up to twice your Presence. Resolve the stated effects manually.',
  },
  {
    name: 'My Life for Yours: Cleanse',
    parent: 'My Life for Yours',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/my-life-for-yours.md',
    actionType: 'Part of My Life for Yours',
    activationCondition:
      'Only while using My Life for Yours: end one save-ends/end-of-turn effect, or let a prone target stand. Resolve the base Recovery payment and healing manually. Resolve the stated effects manually.',
    cost: 1,
  },
  {
    name: 'Arrest: Redirect',
    parent: 'Arrest',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/arrest.md',
    actionType: 'Part of a grabbed target strike',
    activationCondition:
      'A creature grabbed by your Arrest makes a strike; deal holy damage equal to Presence and redirect the strike within its distance. Resolve the stated effects manually.',
    cost: 3,
  },
  {
    name: 'The Gods Punish and Defend: Heal',
    parent: 'The Gods Punish and Defend',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/the-gods-punish-and-defend.md',
    actionType: 'Part of The Gods Punish and Defend',
    activationCondition:
      'While using the ability, spend one of your Recoveries manually and heal yourself or an ally within 10 by your recovery value. Resolve the stated effects manually.',
  },
  {
    name: 'Purifying Fire: Fire Damage',
    parent: 'Purifying Fire',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/purifying-fire.md',
    actionType: 'Part of an ability',
    activationCondition:
      'Only while a target has fire weakness from your Purifying Fire; choose fire damage instead of holy damage against it. Resolve the stated effects manually.',
  },
  {
    name: 'Hands of the Maker: Destroy',
    parent: 'Hands of the Maker',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/hands-of-the-maker.md',
    actionType: 'No action',
    activationCondition:
      'Destroy one object created with your Hands of the Maker, at any distance. Resolve the stated effects manually.',
  },
  {
    name: 'Faithful Friend: Dismiss',
    parent: 'Faithful Friend',
    sourcePath: 'en/unified/md/feature/ability/censor/level-1/faithful-friend.md',
    actionType: 'No action',
    activationCondition:
      'Dismiss your conjured animal spirit. Resolve the stated effects manually.',
  },
  {
    name: 'Oracular Visions: Grant Edge',
    parent: 'Oracular Visions',
    sourcePath: 'en/unified/md/feature/censor/level-1/oracular-visions.md',
    actionType: 'Part of a test',
    activationCondition:
      'You or a creature within 10 squares makes a test. Spend 1 tracked fate point manually to grant an edge; fate points are not Wrath. Resolve the stated effects manually.',
  },
  {
    name: 'Revitalizing Ritual',
    parent: 'Revitalizing Ritual',
    sourcePath: 'en/unified/md/feature/censor/level-1/revitalizing-ritual.md',
    actionType: 'End of respite',
    activationCondition:
      'Choose yourself or an ally also finishing a respite; add your level to their recovery value until your next respite. Resolve the stated effects manually.',
  },
  {
    name: 'Blessing of Compassion: Negotiation',
    parent: 'Blessing of Compassion',
    sourcePath: 'en/unified/md/feature/censor/level-1/blessing-of-compassion.md',
    actionType: 'Start of negotiation',
    activationCondition:
      'While present at the start of a negotiation, choose one NPC: patience +1 (maximum 5) and an edge on the first influence test. Resolve the stated effects manually.',
  },
  {
    name: 'Protective Circle: Create',
    parent: 'Protective Circle',
    sourcePath: 'en/unified/md/feature/censor/level-1/protective-circle.md',
    actionType: '10-minute activity',
    activationCondition:
      'Spend 10 uninterrupted minutes to create the circle; designate who may enter. It lasts 24 hours, until replaced or dismissed. Resolve the stated effects manually.',
  },
  {
    name: 'Protective Circle: Dismiss',
    parent: 'Protective Circle',
    sourcePath: 'en/unified/md/feature/censor/level-1/protective-circle.md',
    actionType: 'No action',
    activationCondition: 'Dismiss your existing circle. Resolve the stated effects manually.',
  },
  {
    name: 'Blessing of Fortunate Weather',
    parent: 'Blessing of Fortunate Weather',
    sourcePath: 'en/unified/md/feature/censor/level-1/blessing-of-fortunate-weather.md',
    actionType: 'End of respite',
    activationCondition:
      'Choose Clear, Foggy, Overcast or Precipitation until your next respite; 100-square range, mundane outdoors, conflicting weather negates overlap. Resolve the stated effects manually.',
  },
  {
    name: 'Inner Light',
    parent: 'Inner Light',
    sourcePath: 'en/unified/md/feature/censor/level-1/inner-light.md',
    actionType: 'End of respite',
    activationCondition:
      'Choose yourself or an ally also finishing a respite; +1 to saving throws until your next respite. Resolve the stated effects manually.',
  },
  {
    name: 'Inspired Deception: Use Presence',
    parent: 'Inspired Deception',
    sourcePath: 'en/unified/md/feature/censor/level-1/inspired-deception.md',
    actionType: 'Part of a test',
    activationCondition:
      'On a test using an intrigue skill you have, choose Presence instead of another characteristic. Resolve the stated effects manually.',
  },
  {
    name: 'Sanctified Weapon',
    parent: 'Sanctified Weapon',
    sourcePath: 'en/unified/md/feature/censor/level-1/sanctified-weapon.md',
    actionType: 'Respite activity',
    activationCondition:
      'Bless one weapon; its wielder gains +1 rolled damage with abilities using that weapon until your next respite. Resolve the stated effects manually.',
  },
];
export function censorActionText(action: CensorAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Censor action source: ${action.sourcePath}`);
  return entry.text;
}
