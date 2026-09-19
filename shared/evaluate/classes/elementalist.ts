// SPDX-License-Identifier: GPL-3.0-only
/** V45 extraction: preserve existing source contributions and their phase/order. */
import type { DerivationContext } from '../derivation.ts';
import type {
  DerivedBaseline,
  Provenance,
  PartialBaseline,
} from '../../contracts/characterEvaluation.ts';
export function applyElementalistModifiers(ctx: DerivationContext, out: PartialBaseline) {
  const sourced = (
    decisionId: string,
    source: string,
    quote: string,
    extra: Partial<Provenance> = {},
  ): Provenance => ({ decisionId, source: ctx.sentence({ path: source, quote }), ...extra });
  const modifiers: NonNullable<DerivedBaseline['abilityModifiers']> = [];
  if (ctx.single('class.elementalist.enchantment') === 'Enchantment of Destruction')
    modifiers.push({
      id: 'elementalist.enchantment-of-destruction',
      label: 'Enchantment of Destruction',
      field: 'rolled-damage',
      amount: 1,
      keywords: ['Magic'],
      provenance: sourced(
        'class.elementalist.enchantment',
        'en/unified/md/feature/elementalist/level-1/enchantment-of-destruction.md',
        'You gain a +1 bonus to rolled damage with magic abilities.',
        { selection: 'Enchantment of Destruction', operation: 'add', amount: 1 },
      ),
    });
  if (ctx.single('class.elementalist.specialization') === 'Fire')
    modifiers.push({
      id: 'elementalist.acolyte-of-fire',
      label: 'Fire: Acolyte of Fire',
      field: 'rolled-damage',
      amount: 1,
      keywords: ['Fire', 'Magic'],
      alternative: { ability: 'Hurl Element', damageType: 'fire' },
      provenance: sourced(
        'class.elementalist.specialization',
        'en/unified/md/feature/elementalist/level-1/fire-acolyte-of-fire.md',
        'Your abilities that have the Fire and Magic keywords gain a +1 bonus to rolled damage. Your Hurl Element ability (see below) also gains this bonus when you use it to deal fire damage.',
        { selection: 'Fire', operation: 'add', amount: 1 },
      ),
    });
  if (modifiers.length) out.abilityModifiers = modifiers;
}
