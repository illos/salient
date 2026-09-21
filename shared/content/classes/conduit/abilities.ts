// SPDX-License-Identifier: GPL-3.0-only
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
import { CENSOR_ACTIONS, type CensorAction } from '../censor/abilities.ts';
export const CONDUIT_ACTIONS: CensorAction[] = [
  // Identical domain feature activities; Conduit uses Intuition where its own source says so.
  ...CENSOR_ACTIONS.filter(a =>
    [
      'Hands of the Maker',
      'Faithful Friend',
      'Oracular Visions',
      'Revitalizing Ritual',
      'Blessing of Compassion',
      'Protective Circle',
      'Blessing of Fortunate Weather',
      'Inner Light',
      'Inspired Deception',
      'Sanctified Weapon',
    ].includes(a.parent),
  ).map(a => ({
    ...a,
    name: a.name.replace('Use Presence', 'Use Intuition'),
    sourcePath: a.sourcePath.replace('/censor/', '/conduit/'),
    activationCondition: a.activationCondition.replaceAll('Presence', 'Intuition'),
  })),
  {
    name: 'Violence Will Not Aid Thee: Retaliation',
    parent: 'Violence Will Not Aid Thee',
    sourcePath: 'en/unified/md/feature/ability/conduit/level-1/violence-will-not-aid-thee.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'Until the save ends: the first time on a turn the affected target damages another creature, it takes 1d10 lightning damage. Resolve manually.',
  },
  {
    name: 'Faithful Friend: Backlash',
    parent: 'Faithful Friend',
    sourcePath: 'en/unified/md/feature/ability/conduit/level-1/faithful-friend.md',
    actionType: 'Source-timed effect',
    activationCondition:
      'If the spirit takes any damage, dismiss it and take 1d10 irreducible psychic damage. Resolve manually.',
  },
  ...[
    {
      name: 'Piety: Pray',
      parent: 'Piety',
      sourcePath: 'en/unified/md/feature/conduit/level-1/piety.md',
      actionType: 'No action',
      activationCondition:
        'Before your start-of-turn d3 Piety roll in combat: resolve the source extra Piety, possible irreducible damage and domain effect; resource generation is manual. Resolve the stated effects manually.',
    },
    {
      name: 'Prayer and Ward: Change',
      parent: 'Prayer',
      sourcePath: 'en/unified/md/feature/conduit/level-1/prayer.md',
      actionType: 'Respite activity',
      activationCondition:
        'Pray during a respite to change prayer and ward through the full character editor; ordinary campaign edit rules apply. Resolve the stated effects manually.',
    },
    {
      name: 'Healing Grace: Additional Ally',
      parent: 'Healing Grace',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/healing-grace.md',
      actionType: 'Part of Healing Grace',
      activationCondition:
        'Only while using Healing Grace once on your turn: target one additional ally within distance. Each use spends one Piety in combat. Outside combat, total enhancements across this Healing Grace use cannot exceed your Victories; track this total manually. Resolve the stated effects manually.',
      cost: 1,
    },
    {
      name: 'Healing Grace: End Effect',
      parent: 'Healing Grace',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/healing-grace.md',
      actionType: 'Part of Healing Grace',
      activationCondition:
        'Only while using Healing Grace once on your turn: end one save-ends or end-of-turn effect on a target. Each use spends one Piety in combat. Outside combat, total enhancements across this Healing Grace use cannot exceed your Victories; track this total manually. Resolve the stated effects manually.',
      cost: 1,
    },
    {
      name: 'Healing Grace: Stand',
      parent: 'Healing Grace',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/healing-grace.md',
      actionType: 'Part of Healing Grace',
      activationCondition:
        'Only while using Healing Grace once on your turn: let a prone target stand. Each use spends one Piety in combat. Outside combat, total enhancements across this Healing Grace use cannot exceed your Victories; track this total manually. Resolve the stated effects manually.',
      cost: 1,
    },
    {
      name: 'Healing Grace: Additional Recovery',
      parent: 'Healing Grace',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/healing-grace.md',
      actionType: 'Part of Healing Grace',
      activationCondition:
        'Only while using Healing Grace once on your turn: let a target spend one additional Recovery. Each use spends one Piety in combat. Outside combat, total enhancements across this Healing Grace use cannot exceed your Victories; track this total manually. Resolve the stated effects manually.',
      cost: 1,
    },
    {
      name: 'Word of Guidance: Enhance',
      parent: 'Word of Guidance',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/word-of-guidance.md',
      actionType: 'Part of Word of Guidance',
      activationCondition:
        'Only with the base triggered action and its source trigger; replace its edge with a double edge. Resolve the stated effects manually.',
      cost: 1,
    },
    {
      name: 'Word of Judgment: Enhance',
      parent: 'Word of Judgment',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/word-of-judgment.md',
      actionType: 'Part of Word of Judgment',
      activationCondition:
        'Only with the base triggered action and its source trigger; replace its bane with a double bane. Resolve the stated effects manually.',
      cost: 1,
    },
    {
      name: 'Quickness Ward: Shift',
      parent: 'Quickness Ward',
      sourcePath: 'en/unified/md/feature/conduit/level-1/quickness-ward.md',
      actionType: 'After damage',
      activationCondition:
        'After an adjacent creature damages you, shift up to your Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Spirit Ward: Retaliate',
      parent: 'Spirit Ward',
      sourcePath: 'en/unified/md/feature/conduit/level-1/spirit-ward.md',
      actionType: 'After damage',
      activationCondition:
        'After an adjacent creature damages you, it takes corruption damage equal to your Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Sanctuary Ward: Protection',
      parent: 'Sanctuary Ward',
      sourcePath: 'en/unified/md/feature/conduit/level-1/sanctuary-ward.md',
      actionType: 'After damage',
      activationCondition:
        'After another creature damages you, it cannot target you with strikes until you harm it or its allies, or until its next turn ends. Resolve the stated effects manually.',
    },
    {
      name: 'Font of Wrath: Damage',
      parent: 'Font of Wrath',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/font-of-wrath.md',
      actionType: 'Source-timed effect',
      activationCondition:
        'Only while your Font spirit lasts (until your next turn ends): enemy first moves within 2 squares in a round or starts its turn there; holy damage equals Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Sermon of Grace: Cleanse',
      parent: 'Sermon of Grace',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/sermon-of-grace.md',
      actionType: 'Free triggered action',
      activationCondition:
        'Only for a target of Sermon of Grace: end one save-ends/end-of-turn effect or stand if prone; optional Recovery is manual. Resolve the stated effects manually.',
    },
    {
      name: 'Sacrificial Offer: Impose Bane',
      parent: 'Sacrificial Offer',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/sacrificial-offer.md',
      actionType: 'Part of a power roll',
      activationCondition:
        'Only for the chosen protected creature, on one power roll against it before its next turn ends. Resolve the stated effects manually.',
    },
    {
      name: 'Drain: Recovery',
      parent: 'Drain',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/drain.md',
      actionType: 'Part of Drain',
      activationCondition:
        'Only yourself or the ally selected within distance after using Drain may spend a Recovery. Resolve the stated effects manually.',
    },
    {
      name: 'Ray of Wrath: Holy Damage',
      parent: 'Ray of Wrath',
      sourcePath: 'en/unified/md/feature/ability/conduit/level-1/ray-of-wrath.md',
      actionType: 'Part of Ray of Wrath',
      activationCondition:
        'Choose holy damage for this Ray of Wrath use; resolve damage-type interactions manually. Resolve the stated effects manually.',
    },
    {
      name: 'Creation: Domain Prayer',
      parent: 'Creation Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. Create a size 5 + Intuition stone wall within 10 until encounter end. Resolve the stated effects manually.',
    },
    {
      name: 'Death: Domain Prayer',
      parent: 'Death Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. Up to two enemies within 10 take corruption damage equal to twice Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Fate: Domain Prayer',
      parent: 'Fate Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. One creature within 10 obtains your choice of tier1 or tier3 on its next power roll before encounter end. Resolve the stated effects manually.',
    },
    {
      name: 'Knowledge: Domain Prayer',
      parent: 'Knowledge Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. Up to five allies within 10, with yourself optionally replacing one, each gain one surge. Resolve the stated effects manually.',
    },
    {
      name: 'Life: Domain Prayer',
      parent: 'Life Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. You or one ally within 10 may spend a Recovery, end one save/end-turn effect, stand if prone, or instead gain temporary Stamina equal to twice Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Love: Domain Prayer',
      parent: 'Love Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. Each ally within 10 gains temporary Stamina equal to twice Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Nature: Domain Prayer',
      parent: 'Nature Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. Slide up to Intuition creatures on floor or ground within 10 up to Intuition squares. Resolve the stated effects manually.',
    },
    {
      name: 'Protection: Domain Prayer',
      parent: 'Protection Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. One ally within 10 gains temporary Stamina equal to four times Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Storm: Domain Prayer',
      parent: 'Storm Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. Each enemy in a 3 cube within 10 takes lightning damage equal to twice Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Sun: Domain Prayer',
      parent: 'Sun Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. One enemy within 10 takes fire damage equal to three times Intuition. Resolve the stated effects manually.',
    },
    {
      name: 'Trickery: Domain Prayer',
      parent: 'Trickery Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. Slide one creature within 10 up to 5 + Conduit level squares. Resolve the stated effects manually.',
    },
    {
      name: 'War: Domain Prayer',
      parent: 'War Domain Piety and Effect',
      sourcePath: 'en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md',
      actionType: 'Part of praying for Piety',
      activationCondition:
        'Only when praying for Piety activates a domain effect; choose one of your two domains. Up to three allies within 10, with yourself optionally replacing one, each gain two surges. Resolve the stated effects manually.',
    },
  ],
];
export function conduitActionText(action: CensorAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Conduit source ${action.sourcePath}`);
  return entry.text;
}
