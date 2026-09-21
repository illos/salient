// SPDX-License-Identifier: GPL-3.0-only
/** V45 extraction: preserve existing source contributions and their phase/order. */
import { SENTENCES } from '../sources.ts';
import type { DerivationContext } from '../derivation.ts';
import type {
  DerivedBaseline,
  Provenance,
  PartialBaseline,
} from '../../contracts/characterEvaluation.ts';
export function applyElementalistModifiers(ctx: DerivationContext, out: PartialBaseline) {
  if (ctx.single('class.choice') !== 'Elementalist') return;
  const sourced = (
    decisionId: string,
    source: string,
    quote: string,
    extra: Partial<Provenance> = {},
  ): Provenance => ({ decisionId, source: ctx.sentence({ path: source, quote }), ...extra });
  const enchantment = ctx.single('class.elementalist.enchantment');
  const source = (id: string, slug: string, quote: string, amount?: number): Provenance =>
    sourced(
      `class.elementalist.${id}`,
      `en/unified/md/feature/elementalist/level-1/${slug}.md`,
      quote,
      amount === undefined ? {} : { operation: 'add', amount },
    );
  const add = (
    field: 'staminaMaximum' | 'stability' | 'speed' | 'disengage' | 'savingThrowThreshold',
    amount: number,
    p: Provenance,
  ) => {
    const v = out[field];
    if (v) out[field] = { value: v.value + amount, provenance: [...v.provenance, p] };
  };
  if (enchantment === 'Enchantment of Permanence') {
    add(
      'staminaMaximum',
      6,
      source('enchantment', 'enchantment-of-permanence', 'You gain a +6 bonus to Stamina', 6),
    );
    add(
      'stability',
      1,
      source(
        'enchantment',
        'enchantment-of-permanence',
        'Additionally, you gain a +1 bonus to stability.',
        1,
      ),
    );
    if (out.staminaMaximum) {
      out.recoveryValue = {
        value: Math.floor(out.staminaMaximum.value / 3),
        provenance: [
          ...out.staminaMaximum.provenance,
          {
            decisionId: 'class.elementalist.enchantment',
            source: ctx.sentence(SENTENCES.recoveryValue),
            operation: 'floor-divide',
            amount: 3,
          },
        ],
      };
      out.windedValue = {
        value: Math.floor(out.staminaMaximum.value / 2),
        provenance: [
          ...out.staminaMaximum.provenance,
          {
            decisionId: 'class.elementalist.enchantment',
            source: ctx.sentence(SENTENCES.winded),
            operation: 'floor-divide',
            amount: 2,
          },
        ],
      };
    }
  }
  if (enchantment === 'Enchantment of Celerity')
    for (const field of ['speed', 'disengage'] as const)
      add(
        field,
        1,
        source(
          'enchantment',
          'enchantment-of-celerity',
          'You gain a +1 bonus to speed and to the distance you can shift when you take the Disengage move action.',
          1,
        ),
      );
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
