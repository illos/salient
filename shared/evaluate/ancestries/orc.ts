// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';

/** Permanent values only; Bloodfire Rush and recovery/strike triggers remain manual. */
export function applyOrcBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  if (!ctx.available.has('ancestry.orc.base-statistics')) return;
  const base = (amount?: number): Provenance => ({
    decisionId: 'ancestry.orc.base-statistics',
    source: ctx.sentence(SENTENCES.baseStatistics),
    operation: amount === undefined ? 'set' : 'base',
    ...(amount === undefined ? {} : { amount }),
  });
  const selected = ctx.list('ancestry.orc.purchased-traits') ?? [];
  const purchased = (
    selection: string,
    slug: string,
    quote: string,
    amount?: number,
  ): Provenance => ({
    decisionId: 'ancestry.orc.purchased-traits',
    selection,
    source: ctx.sentence({ path: `en/unified/md/feature/trait/orc/${slug}.md`, quote }),
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
  if (selected.includes('Nonstop'))
    (out.conditionImmunities ??= []).push({
      condition: 'slowed',
      provenance: purchased('Nonstop', 'nonstop', "You can't be made slowed."),
    });
}
