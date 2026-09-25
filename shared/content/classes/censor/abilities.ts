// SPDX-License-Identifier: GPL-3.0-only
/** Source-timed uses embedded in the pinned Censor features/abilities; effects explicitly manual. */
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
import { sourceBody } from '../../source-body.ts';
export interface CensorAction {
  name: string;
  parent: string;
  sourcePath: string;
  actionType: string;
  activationCondition: string;
  cost?: number;
  trigger?: string;
}
const levelFeature = (level: number, slug: string) =>
  `en/unified/md/feature/censor/level-${level}/${slug}.md`;
const levelAbility = (level: number, slug: string) =>
  `en/unified/md/feature/ability/censor/level-${level}/${slug}.md`;
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
  {
    name: "Saint's Vigilance: Judgment",
    parent: "Saint's Vigilance",
    sourcePath: levelFeature(2, 'saints-vigilance'),
    actionType: 'Free triggered action',
    trigger: 'You find a hidden creature.',
    activationCondition:
      'If you find a hidden creature, use Judgment against it as a free triggered action. Creatures judged by you cannot use the Hide maneuver. Resolve manually.',
  },
  {
    name: 'Judge of Character: Use Presence',
    parent: 'Judge of Character',
    sourcePath: levelFeature(2, 'judge-of-character'),
    actionType: 'Part of a test',
    activationCondition:
      'Whenever you would make an Intuition test, you can make a Presence test instead. Resolve the test manually.',
  },
  {
    name: 'It Was Foretold: Opening Action',
    parent: 'It Was Foretold',
    sourcePath: levelFeature(2, 'it-was-foretold'),
    actionType: 'Main action',
    trigger: 'An encounter starts.',
    activationCondition:
      'At the start of an encounter, take one main action before any other creature and before your first turn. Record the action and resolve its order manually.',
  },
  {
    name: 'It Was Foretold: Montage Test',
    parent: 'It Was Foretold',
    sourcePath: levelFeature(2, 'it-was-foretold'),
    actionType: 'Free test',
    trigger: 'The Director calls for a montage test.',
    activationCondition:
      'Before the montage begins, make one free test; it counts as an earned success or failure as usual. Resolve the test manually.',
  },
  {
    name: 'Look On My Work and Despair: Frighten',
    parent: 'Look On My Work and Despair',
    sourcePath: levelFeature(3, 'look-on-my-work-and-despair'),
    actionType: 'Part of Judgment',
    cost: 1,
    activationCondition:
      'When you use Judgment, spend 1 Wrath: if the target has Presence below your average potency, it is frightened of you (save ends). Compare potency and apply the condition manually. Interpretation: the source’s closing already-frightened sentence is read with the retarget clause only (see Look On My Work and Despair: Retarget Frighten); the alternative reading applies it here too, so adjudicate an already-frightened target manually.',
  },
  {
    name: 'Look On My Work and Despair: Retarget Frighten',
    parent: 'Look On My Work and Despair',
    sourcePath: levelFeature(3, 'look-on-my-work-and-despair'),
    actionType: 'Part of Judgment: Retarget',
    activationCondition:
      'When a creature judged by you is reduced to 0 Stamina and you use Judgment as a free triggered action: if the new target has Presence below your strong potency it is frightened of you (save ends); if it is already frightened of you, it instead takes holy damage equal to twice your Presence. Interpretation: this closing sentence is read with the retarget clause, where it immediately follows; the alternative applies it to the 1-Wrath option too. Resolve manually.',
  },
  {
    name: 'Revelator: Judgment',
    parent: 'Revelator',
    sourcePath: levelAbility(2, 'revelator'),
    actionType: 'Free triggered action',
    activationCondition:
      'After Revelator, use Judgment against one of its targets as a free triggered action. Resolve manually.',
  },
  {
    name: 'With My Blessing: Target Strike',
    parent: 'With My Blessing',
    sourcePath: levelAbility(2, 'with-my-blessing'),
    actionType: 'Target free triggered action',
    activationCondition:
      'Manual proxy for the target: it uses a strike signature or strike heroic ability as a free triggered action with a double edge; a heroic ability costs 3 less of its Heroic Resource (minimum 0). Resolve with the target’s ability manually.',
  },
];

/** Printed clauses of chosen level-2/3 abilities the resolver does not model. */
export const CENSOR_ACTIVATION: Record<string, string> = {
  'It Is Justice You Fear':
    'If the target is already frightened of you or another creature and this ability would frighten it again, it instead takes psychic damage equal to twice your Presence. Compare potency and resolve frightened or the psychic damage manually.',
  Revelator:
    'Each target takes holy damage equal to twice your Presence; each hidden target is revealed and cannot become hidden again until the start of your next turn. You can then use Revelator: Judgment. Damage and reveal are resolved manually.',
  'Prescient Grace':
    'Trigger: an enemy within 10 squares starts its turn. You can spend a Recovery so the target regains Stamina equal to your recovery value; it can then take its turn immediately before the triggering enemy. Resolve manually.',
  'With My Blessing':
    'The target can use With My Blessing: Target Strike. Resolve the granted strike manually.',
  'Blessing of the Faithful':
    'Until the end of the encounter or until you are dying, you and each ally in the aura gain 1 surge at the end of each of your turns. The engine keeps the aura: its members are the targets, then who the table adds or removes (/effect members), and each member gains the surge at your turn end.',
  Sentenced:
    'Restrained is manual; while the target is restrained this way, your abilities that impose forced movement can still move it.',
  'Edict of Disruptive Isolation':
    'Until the end of the encounter or until you are dying, each enemy in the aura takes holy damage equal to your Presence at the end of each of your turns, plus 2d6 holy if judged by you or adjacent to any enemy. Resolve manually.',
  'Edict of Perfect Order':
    'Until the end of the encounter or until you are dying, whenever an enemy in the aura uses an ability that costs Malice, it takes holy damage equal to three times your Presence, plus 2d6 holy if judged by you. Resolve manually.',
  'Edict of Purifying Pacifism':
    'Until the end of the encounter or until you are dying, whenever an enemy in the aura makes a strike, it takes holy damage equal to twice your Presence, plus 2d6 holy if judged by you. Resolve manually.',
  'Edict of Stillness':
    'Until the end of the encounter or until you are dying, whenever an enemy moves or is force moved out of the aura, it takes holy damage equal to twice your Presence, plus 2d6 holy if judged by you and moving willingly. Resolve manually.',
};
export function censorActionText(action: CensorAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Censor action source: ${action.sourcePath}`);
  return sourceBody(entry.text);
}
