// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type {
  PartialBaseline,
  Provenance,
  DerivedValue,
} from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';

/** Apply after class/kit values, before supporting choices and complications. */
export function applyHighElfBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  if (!ctx.available.has('ancestry.high-elf.base-statistics')) return;
  const base = (amount?: number): Provenance => ({
    decisionId: 'ancestry.high-elf.base-statistics',
    source: ctx.sentence(SENTENCES.baseStatistics),
    operation: amount === undefined ? 'set' : 'base',
    ...(amount === undefined ? {} : { amount }),
  });
  out.size = { value: '1M', provenance: [base()] };
  out.speed = {
    value: 5 + (out.kit?.speedBonus.value ?? 0),
    provenance: [base(5), ...(out.kit?.speedBonus.provenance ?? [])],
  };
  if (out.kit || noKit)
    out.stability = {
      value: out.kit?.stabilityBonus.value ?? 0,
      provenance: [base(0), ...(out.kit?.stabilityBonus.provenance ?? [])],
    };
  const selected = ctx.list('ancestry.high-elf.purchased-traits') ?? [];
  if (selected.includes('Unstoppable Mind'))
    (out.conditionImmunities ??= []).push({
      condition: 'dazed',
      provenance: {
        decisionId: 'ancestry.high-elf.purchased-traits',
        selection: 'Unstoppable Mind',
        source: ctx.sentence({
          path: 'en/unified/md/feature/trait/high-elf/unstoppable-mind.md',
          quote: "You can't be made dazed.",
        }),
      },
    });
  if (selected.includes('Otherworldly Grace') && out.savingThrowThreshold)
    out.savingThrowThreshold = {
      value: Math.min(out.savingThrowThreshold.value, 5),
      provenance: [
        ...out.savingThrowThreshold.provenance,
        {
          decisionId: 'ancestry.high-elf.purchased-traits',
          selection: 'Otherworldly Grace',
          source: ctx.sentence({
            path: 'en/unified/md/feature/trait/high-elf/otherworldly-grace.md',
            quote: 'Whenever you make a saving throw, you succeed on a roll of 5 or higher.',
          }),
          operation: 'set',
          amount: 5,
        },
      ],
    };
}

export function applyHighElfDisengage(ctx: DerivationContext, out: PartialBaseline) {
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  const sourced = (
    decisionId: string,
    source: string,
    quote: string,
    extra: Partial<Provenance> = {},
  ): Provenance => ({ decisionId, source: ctx.sentence({ path: source, quote }), ...extra });
  if (
    out.disengage &&
    (ctx.list('ancestry.high-elf.purchased-traits') ?? []).includes('Graceful Retreat')
  ) {
    out.disengage = dv(out.disengage.value + 1, [
      ...out.disengage.provenance,
      sourced(
        'ancestry.high-elf.purchased-traits',
        'en/unified/md/feature/trait/high-elf/graceful-retreat.md',
        'You gain a +1 bonus to the distance you can shift when you take the Disengage move action.',
        { selection: 'Graceful Retreat', operation: 'add', amount: 1 },
      ),
    ]);
  }
}
