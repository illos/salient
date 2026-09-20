// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';

/** Apply after class/kit values, before supporting choices and complications. */
export function applyHumanBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  if (!ctx.available.has('ancestry.human.base-statistics')) return;
  const base = (amount?: number): Provenance => ({
    decisionId: 'ancestry.human.base-statistics',
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
  if (
    ctx.list('ancestry.human.purchased-traits')?.includes('Staying Power') &&
    out.recoveriesMaximum
  ) {
    out.recoveriesMaximum = {
      value: out.recoveriesMaximum.value + 2,
      provenance: [
        ...out.recoveriesMaximum.provenance,
        {
          decisionId: 'ancestry.human.purchased-traits',
          selection: 'Staying Power',
          source: ctx.sentence({
            path: 'en/unified/md/feature/trait/human/staying-power.md',
            quote: 'You increase your number of Recoveries by 2.',
          }),
          operation: 'add',
          amount: 2,
        },
      ],
    };
  }
}
