// SPDX-License-Identifier: GPL-3.0-only
import type { AncestryAbilitySource } from '../../ancestry-abilities.ts';
export const memonekAbilities: AncestryAbilitySource[] = [
  {
    name: 'Keeper of Order',
    ancestry: 'Memonek',
    trait: 'Keeper of Order',
    sourcePath: 'en/unified/md/feature/trait/memonek/keeper-of-order.md',
    decisionId: 'ancestry.memonek.purchased-traits',
    selection: 'Keeper of Order',
    actionType: 'Free triggered action',
    group: 'triggered',
    trigger: 'When you or an adjacent creature makes a power roll.',
    activationCondition: 'Once per round.',
    quote:
      'Your connection to Axiom, the plane of Uttermost Law, allows you to manage chaos around you. Once per round when you or an [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) creature makes a [power roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll), you can use a free [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to remove an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) or a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) on the roll, to [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) a double [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) into an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge), or to [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) a double [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane) into a [bane](scc.v1:mcdm.heroes.v1/rule.dice/bane).',
  },
];
