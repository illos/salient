// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
/** Conditional falling/forced-movement size and combat surges remain manual. */
export function applyMemonekBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  if (!ctx.available.has('ancestry.memonek.base-statistics')) return;
  const base = (amount?: number): Provenance => ({
    decisionId: 'ancestry.memonek.base-statistics',
    source: ctx.sentence(SENTENCES.baseStatistics),
    operation: amount === undefined ? 'set' : 'base',
    ...(amount === undefined ? {} : { amount }),
  });
  const selected = ctx.list('ancestry.memonek.purchased-traits') ?? [];
  const purchased = (selection: string, slug: string, quote: string): Provenance => ({
    decisionId: 'ancestry.memonek.purchased-traits',
    selection,
    source: ctx.sentence({ path: `en/unified/md/feature/trait/memonek/${slug}.md`, quote }),
  });
  out.size = { value: '1M', provenance: [base()] };
  const nimble = selected.includes('Lightning Nimbleness');
  out.speed = {
    value: (nimble ? 7 : 5) + (out.kit?.speedBonus.value ?? 0),
    provenance: [
      nimble
        ? {
            ...purchased('Lightning Nimbleness', 'lightning-nimbleness', 'Your speed is 7.'),
            operation: 'set',
            amount: 7,
          }
        : base(5),
      ...(out.kit?.speedBonus.provenance ?? []),
    ],
  };
  if (out.kit || noKit)
    out.stability = {
      value: out.kit?.stabilityBonus.value ?? 0,
      provenance: [base(0), ...(out.kit?.stabilityBonus.provenance ?? [])],
    };
  for (const [name, slug, condition] of [
    ['Nonstop', 'nonstop', 'slowed'],
    ['Unphased', 'unphased', 'surprised'],
  ]) {
    if (selected.includes(name))
      (out.conditionImmunities ??= []).push({
        condition,
        provenance: purchased(name, slug, `You can't be made ${condition}.`),
      });
  }
}
