// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';

/** After class/kit vitals and before supporting/complication modifiers. */
export function applyDwarfBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  if (!ctx.available.has('ancestry.dwarf.base-statistics')) return;
  const base = (amount?: number): Provenance => ({
    decisionId: 'ancestry.dwarf.base-statistics',
    source: ctx.sentence(SENTENCES.baseStatistics),
    operation: amount === undefined ? 'set' : 'base',
    ...(amount === undefined ? {} : { amount }),
  });
  const selected = ctx.list('ancestry.dwarf.purchased-traits') ?? [];
  const purchased = (
    selection: string,
    slug: string,
    quote: string,
    amount?: number,
  ): Provenance => ({
    decisionId: 'ancestry.dwarf.purchased-traits',
    selection,
    source: ctx.sentence({ path: `en/unified/md/feature/trait/dwarf/${slug}.md`, quote }),
    ...(amount === undefined ? {} : { operation: 'add', amount }),
  });
  out.size = { value: '1M', provenance: [base()] };
  out.speed = {
    value: 5 + (out.kit?.speedBonus.value ?? 0),
    provenance: [base(5), ...(out.kit?.speedBonus.provenance ?? [])],
  };
  if (out.kit || noKit) {
    out.stability = {
      value: out.kit?.stabilityBonus.value ?? 0,
      provenance: [base(0), ...(out.kit?.stabilityBonus.provenance ?? [])],
    };
    if (selected.includes('Grounded')) {
      out.stability.value += 1;
      out.stability.provenance.push(
        purchased('Grounded', 'grounded', 'You have a +1 bonus to stability.', 1),
      );
    }
  }
  if (selected.includes('Great Fortitude'))
    (out.conditionImmunities ??= []).push({
      condition: 'weakened',
      provenance: purchased('Great Fortitude', 'great-fortitude', "You can't be made weakened."),
    });
  if (selected.includes('Spark Off Your Skin') && out.staminaMaximum) {
    // Levels 1 and 2 are currently supported; both retain the level-one +6 grant.
    out.staminaMaximum = {
      value: out.staminaMaximum.value + 6,
      provenance: [
        ...out.staminaMaximum.provenance,
        purchased(
          'Spark Off Your Skin',
          'spark-off-your-skin',
          'You have a +6 bonus to Stamina, and that bonus increases by 6 at 4th, 7th, and 10th levels.',
          6,
        ),
      ],
    };
    for (const [field, divisor, sentence] of [
      ['recoveryValue', 3, SENTENCES.recoveryValue],
      ['windedValue', 2, SENTENCES.winded],
    ] as const)
      out[field] = {
        value: Math.floor(out.staminaMaximum.value / divisor),
        provenance: [
          ...out.staminaMaximum.provenance,
          {
            decisionId: 'ancestry.dwarf.purchased-traits',
            selection: 'Spark Off Your Skin',
            source: ctx.sentence(sentence),
            operation: 'floor-divide',
            amount: divisor,
          },
        ],
      };
  }
}
