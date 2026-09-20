// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';

/** Apply permanent ancestry values after class/kit vitals; conditional traits stay manual. */
export function applyHakaanBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  if (!ctx.available.has('ancestry.hakaan.base-statistics')) return;
  const base = (amount: number): Provenance => ({
    decisionId: 'ancestry.hakaan.base-statistics',
    source: ctx.sentence(SENTENCES.baseStatistics),
    operation: 'base',
    amount,
  });
  out.size = {
    value: '1L',
    provenance: [
      {
        decisionId: 'ancestry.hakaan.signature-trait',
        source: ctx.sentence({
          path: 'en/unified/md/feature/trait/hakaan/big.md',
          quote: 'Your size is 1L.',
        }),
        operation: 'set',
      },
    ],
  };
  out.speed = {
    value: 5 + (out.kit?.speedBonus.value ?? 0),
    provenance: [base(5), ...(out.kit?.speedBonus.provenance ?? [])],
  };
  if (out.kit || noKit)
    out.stability = {
      value: out.kit?.stabilityBonus.value ?? 0,
      provenance: [base(0), ...(out.kit?.stabilityBonus.provenance ?? [])],
    };
  if ((ctx.list('ancestry.hakaan.purchased-traits') ?? []).includes('Great Fortitude'))
    (out.conditionImmunities ??= []).push({
      condition: 'weakened',
      provenance: {
        decisionId: 'ancestry.hakaan.purchased-traits',
        selection: 'Great Fortitude',
        source: ctx.sentence({
          path: 'en/unified/md/feature/trait/hakaan/great-fortitude.md',
          quote: "You can't be made weakened.",
        }),
      },
    });
}
