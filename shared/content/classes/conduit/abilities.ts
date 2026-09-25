// SPDX-License-Identifier: GPL-3.0-only
import abilitySources from '../../compendium/ability.json' with { type: 'json' };
import featureSources from '../../compendium/feature.json' with { type: 'json' };
import { CENSOR_ACTIONS, type CensorAction } from '../censor/abilities.ts';
import { sourceBody } from '../../source-body.ts';
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
        'Before your start-of-turn d3 Piety roll in combat. Levels 1–6: declare it with /resource pray before your turn starts; the app adds the extra Piety and applies the angered-gods psychic damage on a 1, and on a 3 you resolve the chosen domain effect manually. Domain piety: claim your two domains once per encounter (/resource claim). Level 7+: resolve the stated effects manually.',
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
        'Use Ray of Wrath with damage-type=holy to have it deal holy damage; the engine applies holy immunity and weakness. This entry records nothing itself.',
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
  {
    name: 'The Lists of Heaven: Spend Recovery',
    parent: 'The Lists of Heaven',
    sourcePath: 'en/unified/md/feature/conduit/level-2/the-lists-of-heaven.md',
    actionType: 'When another creature spends a Recovery you allowed',
    activationCondition:
      'Whenever you allow another creature to spend a Recovery, you can also spend a Recovery. Spend it manually.',
  },
  {
    name: 'Minor Miracle: Ritual',
    parent: 'Minor Miracle',
    sourcePath: 'en/unified/md/feature/conduit/level-3/minor-miracle.md',
    actionType: 'Respite activity',
    activationCondition:
      'With at least half the remains of a creature that died within 24 hours of a cause that is not age, and whose soul is willing: at the end of the respite it returns with full Stamina and half its Recoveries, and you regain only half your Recoveries. Resolve manually.',
  },
  {
    name: 'Sacred Bond: Take Damage',
    parent: 'Sacred Bond',
    sourcePath: 'en/unified/md/feature/ability/conduit/level-2/sacred-bond.md',
    actionType: 'Free triggered action',
    trigger: 'The other bonded target takes damage.',
    activationCondition:
      'Until the end of the encounter, take the damage instead; the original target still suffers its other effects. Move the damage manually.',
  },
  {
    name: 'Sacred Bond: Spend Recovery',
    parent: 'Sacred Bond',
    sourcePath: 'en/unified/md/feature/ability/conduit/level-2/sacred-bond.md',
    actionType: 'Free triggered action',
    trigger: 'The other bonded target spends a Recovery.',
    activationCondition: 'Until the end of the encounter, spend a Recovery too. Spend it manually.',
  },
];
export function conduitActionText(action: CensorAction): string {
  const entry = [...abilitySources, ...featureSources].find(
    e => e.sourcePath === `vendor/steel-compendium/${action.sourcePath}`,
  );
  if (!entry) throw new Error(`Missing Conduit source ${action.sourcePath}`);
  return sourceBody(entry.text);
}

/** Level-2/3 ability notes: what the table resolves automatically and which clauses stay manual. */
export const CONDUIT_ACTIVATION: Record<string, string> = {
  'Statue of Power':
    'A size 2 statue rises within 10 squares until the end of the encounter; while within 3 squares of it you gain 1 surge at the start of each of your turns, and each ally within 3 squares gains the same benefit. It is destroyed at 20 damage and has immunity all to poison and psychic damage. Track it manually.',
  Reap: 'Until the start of your next turn, each ally that kills an enemy regains Stamina equal to 5 + your Intuition. Resolve manually.',
  'Blessing of Fate and Destiny':
    'Three creatures (you can target yourself instead of one): until the end of the encounter or until you are dying, choose one effect: roll three dice and keep two of your choice, or roll three dice and keep the lowest two. Apply manually.',
  'The Gods Command You Obey':
    'At every tier, a target whose Presence is below the potency acts before taking the damage (a free strike, an ability of your choice, or a shift and an ability), so the power roll, target actions and damage are resolved manually.',
  'Wellspring of Grace':
    'Until the end of the encounter or until you are dying, each ally who starts their turn in the aura can spend a Recovery. Resolve manually.',
  'Our Hearts Your Strength':
    'Until the end of the encounter or until the target is dying, at the start of each of its turns it gains a speed and rolled-damage bonus equal to the allies within 10 squares, until the start of its next turn. Apply manually.',
  'Nature Judges Thee':
    'The table resolves the damage and restrained (save ends) against Agility for each enemy in the 3 cube.',
  'Sacred Bond':
    'Use Sacred Bond: Take Damage and Sacred Bond: Spend Recovery while the bond lasts (until the end of the encounter).',
  "Saint's Tempest":
    'The table resolves lightning damage and records the vertical slide 1/2/3 as an instruction; move the targets on the map.',
  'Morning Light':
    'Each ally in the area deals fire damage equal to your Intuition with their next strike before the end of their next turn. Apply manually.',
  'Divine Comedy':
    'You and each ally in the 5 burst can swap places with another creature in the area that fits. Resolve manually.',
  'Blessing of Insight':
    'Until the end of the encounter or until you are dying, you and each ally within 10 squares gain 1 surge at the end of each of your turns. Adjust surges manually.',
  'Fear of the Gods':
    'Frightened (save ends) against Intuition potency is manual; each target is frightened of you or a creature you choose within distance.',
  "Saint's Raiment":
    'The ally gains 20 temporary Stamina and 3 surges; the app applies both (V157). Do not add them again by hand.',
  'Soul Siphon':
    'Afterward one ally within distance can spend any number of Recoveries. Resolve manually.',
  'Words of Wrath and Grace': 'Each ally in the area can spend a Recovery. Resolve manually.',
};
