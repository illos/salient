// SPDX-License-Identifier: GPL-3.0-only
/** V45 extraction: preserve existing source contributions and their phase/order. */
import type { DerivationContext, SelectedKit } from '../derivation.ts';
import type {
  DerivedValue,
  Provenance,
  PartialBaseline,
  GrantedFeature,
} from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
import { TRAIT_EFFECTS, KIT_BONUSES_HEADING, KITS_PATH, KITS_TABLE_HEADING } from '../sources.ts';

export function applyDevilMovement(
  ctx: DerivationContext,
  out: PartialBaseline,
  kit: SelectedKit | undefined,
) {
  const p = (entry: Provenance) => ctx.provenance(entry);
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  // 1.6 to 1.8 Speed, stability and size from the ancestry base statistics.
  const traits = (ctx.list('ancestry.devil.purchased-traits') ?? []).filter(
    (t): t is string => t !== null,
  );
  if (ctx.available.has('ancestry.devil.base-statistics')) {
    const base = (amount: number) =>
      p({
        decisionId: 'ancestry.devil.base-statistics',
        source: ctx.sentence(SENTENCES.baseStatistics),
        operation: 'base',
        amount,
      });
    let speed = 5;
    const speedProvenance: Provenance[] = [base(5)];
    for (const trait of traits) {
      const effect = TRAIT_EFFECTS[trait];
      if (effect?.field === 'speed') {
        speed = effect.value;
        speedProvenance.push(
          p({
            decisionId: 'ancestry.devil.purchased-traits',
            selection: trait,
            source: ctx.sentence(effect.sentence),
            operation: 'set',
            amount: effect.value,
          }),
        );
      }
    }
    const arsenal = out.kits?.length === 2 ? out.kit : undefined;
    if (arsenal) {
      speed += arsenal.speedBonus.value;
      speedProvenance.push(
        ...arsenal.speedBonus.provenance.map(entry => ({ ...entry, operation: 'add' as const })),
      );
    } else if (kit) {
      speed += kit.s.speedBonus;
      speedProvenance.push(
        p({
          decisionId: kit.decisionId,
          source: ctx.sentence({
            path: KITS_PATH,
            quote: kit.s.tableRow,
            heading: KITS_TABLE_HEADING,
          }),
          operation: 'add',
          amount: kit.s.speedBonus,
          note: kit.s.notes.speed,
        }),
      );
    }
    out.speed = dv(speed, speedProvenance);
    if (arsenal) {
      out.stability = dv(Math.max(0, arsenal.stabilityBonus.value), [
        base(0),
        ...arsenal.stabilityBonus.provenance.map(entry => ({
          ...entry,
          operation: 'add' as const,
        })),
      ]);
    } else if (kit) {
      const bonus = kit.s.stabilityBonus;
      out.stability = dv(Math.max(0, 0 + (bonus?.amount ?? 0)), [
        base(0),
        p({
          decisionId: kit.decisionId,
          source: bonus
            ? ctx.sentence({
                path: kit.s.entryPath,
                quote: bonus.quote,
                heading: KIT_BONUSES_HEADING,
              })
            : ctx.sentence({
                path: KITS_PATH,
                quote: kit.s.tableRow,
                heading: KITS_TABLE_HEADING,
              }),
          operation: 'add',
          amount: bonus?.amount ?? 0,
          note: kit.s.notes.stability,
        }),
      ]);
    }
    out.size = dv('1M', [
      p({
        decisionId: 'ancestry.devil.base-statistics',
        source: ctx.sentence(SENTENCES.baseStatistics),
        operation: 'set',
      }),
    ]);
  }
}
export function applyDevilSavingThrow(
  ctx: DerivationContext,
  provenance: Provenance[],
  setThreshold: (value: number) => void,
) {
  const p = (entry: Provenance) => ctx.provenance(entry);
  const traits = (ctx.list('ancestry.devil.purchased-traits') ?? []).filter(
    (trait): trait is string => trait !== null,
  );
  for (const trait of traits) {
    const effect = TRAIT_EFFECTS[trait];
    if (effect?.field === 'savingThrowThreshold') {
      setThreshold(effect.value);
      provenance.push(
        p({
          decisionId: 'ancestry.devil.purchased-traits',
          selection: trait,
          source: ctx.sentence(effect.sentence),
          operation: 'set',
          amount: effect.value,
        }),
      );
    }
  }
}
export function applyDevilNoKit(
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
  if (noKit && ctx.available.has('ancestry.devil.base-statistics')) {
    out.stability = dv(0, [
      sourced(
        'ancestry.devil.base-statistics',
        SENTENCES.baseStatistics.path,
        SENTENCES.baseStatistics.quote,
        { operation: 'base', amount: 0 },
      ),
    ]);
  }
}

export function appendDevilTraits(ctx: DerivationContext, out: GrantedFeature[]) {
  const signature = ctx.decisions.get('ancestry.devil.signature-trait');
  if (signature && ctx.available.has(signature.id))
    for (const grant of signature.grants ?? [])
      if (grant.kind === 'trait')
        out.push({
          name: grant.value,
          kind: 'ancestry-signature-trait',
          sourcePath: grant.source ?? signature.source,
          provenance: ctx.provenance({
            decisionId: signature.id,
            source: ctx.sentence(SENTENCES.ancestryTraits),
          }),
        });
  const purchased = ctx.decisions.get('ancestry.devil.purchased-traits');
  if (purchased)
    for (const name of (ctx.list('ancestry.devil.purchased-traits') ?? []).filter(
      (name): name is string => name !== null,
    )) {
      const option = purchased.options?.find(o => o.value === name);
      if (!option) continue;
      const effect = TRAIT_EFFECTS[name];
      out.push({
        name,
        kind: 'ancestry-purchased-trait',
        sourcePath: option.source ?? purchased.source,
        ...(option.cost !== undefined ? { cost: option.cost } : {}),
        provenance: ctx.provenance({
          decisionId: purchased.id,
          selection: name,
          source: ctx.own(purchased),
        }),
        ...(effect ? { affects: [effect.field] } : {}),
      });
    }
}
