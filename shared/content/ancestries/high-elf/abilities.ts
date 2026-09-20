// SPDX-License-Identifier: GPL-3.0-only
import type { AncestryAbilitySource } from '../../ancestry-abilities.ts';
export const abilities: AncestryAbilitySource[] = [
  {
    name: 'Glamor of Terror',
    ancestry: 'High Elf',
    trait: 'Glamor of Terror',
    sourcePath: 'en/unified/md/feature/trait/high-elf/glamor-of-terror.md',
    decisionId: 'ancestry.high-elf.purchased-traits',
    selection: 'Glamor of Terror',
    actionType: 'Triggered action',
    group: 'triggered',
    quote:
      'When a foe strikes, you reverse the magic of your glamor to instill fear into their heart. Whenever you take damage from a creature, you can use a [triggered action](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action) to make that creature [frightened](scc.v1:mcdm.heroes.v1/condition/frightened) of you until the end of their next [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).',
    trigger: 'Whenever you take damage from a creature.',
  },
];
