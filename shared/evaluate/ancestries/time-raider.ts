// SPDX-License-Identifier: GPL-3.0-only
import type { DerivationContext } from '../derivation.ts';
import type { PartialBaseline, Provenance } from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
/** Apply permanent statistics; perception and four-arm maneuver effects remain manual. */
export function applyTimeRaiderBaseline(ctx: DerivationContext, out: PartialBaseline, noKit: boolean | undefined) {
  if (!ctx.available.has('ancestry.time-raider.base-statistics')) return;
  const base = (amount?: number): Provenance => ({ decisionId: 'ancestry.time-raider.base-statistics', source: ctx.sentence(SENTENCES.baseStatistics), operation: amount === undefined ? 'set' : 'base', ...(amount === undefined ? {} : { amount }) });
  out.size = { value: '1M', provenance: [base()] };
  out.speed = { value: 5 + (out.kit?.speedBonus.value ?? 0), provenance: [base(5), ...(out.kit?.speedBonus.provenance ?? [])] };
  if (out.kit || noKit) out.stability = { value: out.kit?.stabilityBonus.value ?? 0, provenance: [base(0), ...(out.kit?.stabilityBonus.provenance ?? [])] };
  const psychic: Provenance = { decisionId: 'ancestry.time-raider.signature-trait', source: ctx.sentence({ path: 'en/unified/md/feature/trait/time-raider/psychic-scar.md', quote: 'You have psychic immunity equal to your level.' }), operation: 'set', amount: ctx.level };
  (out.damageImmunities ??= []).push({ damageType: 'psychic', value: { value: ctx.level, provenance: [psychic] } });
  if ((ctx.list('ancestry.time-raider.purchased-traits') ?? []).includes('Unstoppable Mind')) (out.conditionImmunities ??= []).push({ condition: 'dazed', provenance: { decisionId: 'ancestry.time-raider.purchased-traits', selection: 'Unstoppable Mind', source: ctx.sentence({ path: 'en/unified/md/feature/trait/time-raider/time-raider-traits.md', quote: "You can't be made dazed." }) } });
}
