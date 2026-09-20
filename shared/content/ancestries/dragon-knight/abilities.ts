// SPDX-License-Identifier: GPL-3.0-only
import type { AncestryAbilitySource } from '../../ancestry-abilities.ts';
export const abilities: AncestryAbilitySource[] = [
  {
    name: 'Draconian Guard',
    ancestry: 'Dragon Knight',
    trait: 'Draconian Guard',
    sourcePath: 'en/unified/md/feature/trait/dragon-knight/draconian-guard.md',
    decisionId: 'ancestry.dragon-knight.purchased-traits',
    selection: 'Draconian Guard',
    actionType: 'Triggered action',
    group: 'triggered',
    quote:
      'Whenever you or an [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) creature takes damage from a [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to guard against the blow. You reduce any damage from the [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike) by an amount equal to your level.',
    trigger: 'Whenever you or an adjacent creature takes damage from a strike.',
  },
  {
    name: 'Remember Your Oath',
    ancestry: 'Dragon Knight',
    trait: 'Remember Your Oath',
    sourcePath: 'en/unified/md/feature/trait/dragon-knight/remember-your-oath.md',
    decisionId: 'ancestry.dragon-knight.purchased-traits',
    selection: 'Remember Your Oath',
    actionType: 'Maneuver',
    group: 'maneuver',
    quote:
      'As a maneuver, you can recite the following oath. Until the start of your next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), whenever you make a [saving throw](scc.v1:mcdm.heroes.v1/rule.general/saving-throw), you succeed on a 4 or higher.\n\n*Even should the sun stop in the sky Even should the night last a thousand years I will stand forever I shall not yield Those who suffer and yearn for justice I am your sword and shield I will yield no ground I will speak no lies I will stand against all tyrants Until the last villain dies*',
  },
];
