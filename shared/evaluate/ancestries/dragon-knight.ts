// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';

/** Apply after class/kit values, before supporting choices and complications. */
export function applyDragonKnightBaseline(
  ctx: DerivationContext,
  out: PartialBaseline,
  noKit: boolean | undefined,
) {
  if (!ctx.available.has('ancestry.dragon-knight.base-statistics')) return;
  const base = (amount?: number): Provenance => ({
    decisionId: 'ancestry.dragon-knight.base-statistics',
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
  for (const [decision, feature] of [
    ['wyrmplate-immunity', 'wyrmplate'],
    ['prismatic-scales-immunity', 'prismatic-scales'],
  ] as const) {
    const id = `ancestry.dragon-knight.${decision}`;
    const damageType = ctx.single(id);
    if (!damageType || !ctx.available.has(id)) continue;
    const provenance: Provenance = {
      decisionId: id,
      selection: damageType,
      source: ctx.sentence({
        path: `en/unified/md/feature/trait/dragon-knight/${feature}.md`,
        quote:
          feature === 'wyrmplate'
            ? 'Your hardened scales grant you damage immunity equal to your level to one of the following damage types: acid, cold, corruption, fire, lightning, or poison.'
            : 'You always have this immunity, in addition to the immunity granted by Wyrmplate.',
      }),
      operation: 'set',
      amount: ctx.level,
    };
    const prior = (out.damageImmunities ??= []).find(i => i.damageType === damageType);
    if (prior) prior.value.provenance.push(provenance);
    else
      out.damageImmunities.push({
        damageType,
        value: { value: ctx.level, provenance: [provenance] },
      });
  }
}
