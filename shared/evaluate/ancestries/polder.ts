// SPDX-License-Identifier: GPL-3.0-only
/** V45 extraction: preserve existing source contributions and their phase/order. */
import type { DerivationContext } from '../derivation.ts';
import type {
  DerivedValue,
  Provenance,
  PartialBaseline,
} from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
export function applyPolderBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  const sourced = (
    decisionId: string,
    source: string,
    quote: string,
    extra: Partial<Provenance> = {},
  ): Provenance => ({ decisionId, source: ctx.sentence({ path: source, quote }), ...extra });
  const polder = ctx.available.has('ancestry.polder.base-statistics');
  if (polder) {
    const base = (amount: number) =>
      sourced(
        'ancestry.polder.base-statistics',
        SENTENCES.baseStatistics.path,
        SENTENCES.baseStatistics.quote,
        { operation: 'base', amount },
      );
    const kit = out.kit;
    out.speed = dv(5 + (kit?.speedBonus.value ?? 0), [
      base(5),
      ...(kit?.speedBonus.provenance ?? []),
    ]);
    if (kit || noKit)
      out.stability = dv(kit?.stabilityBonus.value ?? 0, [
        base(0),
        ...(kit?.stabilityBonus.provenance ?? []),
      ]);
    out.size = dv('1S', [
      sourced(
        'ancestry.polder.signature-trait',
        'en/unified/md/feature/trait/polder/small.md',
        'Your size is 1S.',
        { operation: 'set' },
      ),
    ]);
    const selected = ctx.list('ancestry.polder.purchased-traits') ?? [];
    if (selected.includes('Corruption Immunity'))
      out.damageImmunities = [
        {
          damageType: 'corruption',
          value: dv(ctx.level + 2, [
            sourced(
              'ancestry.polder.purchased-traits',
              'en/unified/md/feature/trait/polder/corruption-immunity.md',
              'You have corruption immunity equal to your level + 2.',
              {
                selection: 'Corruption Immunity',
                operation: 'set',
                amount: ctx.level + 2,
                note: `Level ${ctx.level} + 2`,
              },
            ),
          ]),
        },
      ];
    if (selected.includes('Fearless'))
      out.conditionImmunities = [
        {
          condition: 'frightened',
          provenance: sourced(
            'ancestry.polder.purchased-traits',
            'en/unified/md/feature/trait/polder/fearless.md',
            "You can't be made frightened.",
            { selection: 'Fearless' },
          ),
        },
      ];
  }
}
export function applyPolderDisengage(ctx: DerivationContext, out: PartialBaseline) {
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  const sourced = (
    decisionId: string,
    source: string,
    quote: string,
    extra: Partial<Provenance> = {},
  ): Provenance => ({ decisionId, source: ctx.sentence({ path: source, quote }), ...extra });
  if (
    out.disengage &&
    (ctx.list('ancestry.polder.purchased-traits') ?? []).includes('Graceful Retreat')
  ) {
    out.disengage = dv(out.disengage.value + 1, [
      ...out.disengage.provenance,
      sourced(
        'ancestry.polder.purchased-traits',
        'en/unified/md/feature/trait/polder/graceful-retreat.md',
        'You gain a +1 bonus to the distance you can shift when you take the Disengage move action.',
        { selection: 'Graceful Retreat', operation: 'add', amount: 1 },
      ),
    ]);
  }
}
