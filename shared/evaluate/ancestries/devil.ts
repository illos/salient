// SPDX-License-Identifier: GPL-3.0-only
/** V45 extraction: preserve existing source contributions and their phase/order. */
import type { DerivationContext, SelectedKit } from '../derivation.ts';
import type {
  ConditionalEffect,
  DerivedValue,
  GrantedMovementMode,
  Provenance,
  PartialBaseline,
  GrantedFeature,
} from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
import {
  TRAIT_EFFECTS,
  WINGS_WEAKNESS_SENTENCE,
  UNTYPED_DAMAGE_WEAKNESS,
  FLY_RULE,
  KIT_BONUSES_HEADING,
  KITS_PATH,
  KITS_TABLE_HEADING,
} from '../sources.ts';

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
    if (kit) {
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
    if (kit) {
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

/**
 * V46: Wings' flight and the conditional amounts Wings and Barbed Tail calculate. This runs after
 * the class characteristics exist, because both amounts read them; `applyDevilMovement` is too
 * early for any class whose characteristics come from the shared class profile.
 */
export function applyDevilConditionalEffects(ctx: DerivationContext, out: PartialBaseline) {
  if (!ctx.available.has('ancestry.devil.purchased-traits')) return;
  const traits = (ctx.list('ancestry.devil.purchased-traits') ?? []).filter(
    (trait): trait is string => trait !== null,
  );
  if (!traits.length) return;
  const p = (entry: Provenance) => ctx.provenance(entry);
  const selected = (
    name: string,
    sentence: Parameters<DerivationContext['sentence']>[0],
    extra: Partial<Provenance> = {},
  ) =>
    p({
      decisionId: 'ancestry.devil.purchased-traits',
      selection: name,
      source: ctx.sentence(sentence),
      ...extra,
    });
  const modes: GrantedMovementMode[] = [];
  const conditional: ConditionalEffect[] = [];

  if (traits.includes('Barbed Tail')) {
    // "extra damage ... equal to your highest characteristic score": a build amount, applied by
    // the table only when the player uses the once-per-round option.
    const characteristics = Object.values(out.characteristics ?? {});
    if (characteristics.length) {
      const highest = characteristics.reduce((best, entry) =>
        entry.value > best.value ? entry : best,
      );
      conditional.push({
        feature: 'Barbed Tail',
        effect: 'extra-strike-damage',
        condition: TRAIT_EFFECTS['Barbed Tail']!.sentence.quote,
        sourcePath: TRAIT_EFFECTS['Barbed Tail']!.sentence.path,
        amount: {
          value: highest.value,
          provenance: [
            selected('Barbed Tail', TRAIT_EFFECTS['Barbed Tail']!.sentence, {
              operation: 'set',
              amount: highest.value,
            }),
            ...highest.provenance,
          ],
        },
      });
    }
  }

  if (traits.includes('Wings')) {
    const wings = TRAIT_EFFECTS['Wings']!.sentence;
    modes.push({
      mode: 'Fly',
      sourcePath: wings.path,
      ruleSourcePath: FLY_RULE.path,
      condition: 'While using your wings to fly',
      provenance: selected('Wings', wings),
    });
    const might = out.characteristics?.M;
    if (might) {
      // "a number of rounds equal to your Might score (minimum 1 round)".
      const rounds = Math.max(1, might.value);
      conditional.push({
        feature: 'Wings',
        effect: 'rounds-aloft',
        // The whole sentence, so the recorded amount reads as the maximum before falling rather
        // than as elapsed play state.
        condition: wings.quote,
        sourcePath: wings.path,
        amount: {
          value: rounds,
          provenance: [
            selected('Wings', wings, { operation: 'set', amount: rounds }),
            ...might.provenance,
          ],
        },
      });
    }
    // "at 3rd level or lower": inert at every level this build supports, and it keeps a later
    // level unit from inheriting the weakness without verifying that level.
    if (ctx.level <= 3)
      conditional.push({
        feature: 'Wings',
        effect: 'damage-weakness',
        condition: WINGS_WEAKNESS_SENTENCE.quote,
        sourcePath: WINGS_WEAKNESS_SENTENCE.path,
        // Wings names no damage type, and the damage-weakness rule makes an untyped weakness
        // apply to damage of any type. `all-damage` is the literal the resolution contract
        // documents for that case (shared/contracts/rollResolution.ts DamageModifierEntry);
        // the older `damageWeaknesses` list spells it `allDamage`, which this field does not copy.
        damageType: 'all-damage',
        amount: {
          value: 5,
          provenance: [
            selected('Wings', WINGS_WEAKNESS_SENTENCE, { operation: 'set', amount: 5 }),
            selected('Wings', UNTYPED_DAMAGE_WEAKNESS),
          ],
        },
      });
  }

  if (modes.length) out.movementModes = [...(out.movementModes ?? []), ...modes];
  if (conditional.length)
    out.conditionalEffects = [...(out.conditionalEffects ?? []), ...conditional];
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
        ...(effect?.field ? { affects: [effect.field] } : {}),
      });
    }
}
