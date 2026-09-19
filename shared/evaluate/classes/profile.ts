// SPDX-License-Identifier: GPL-3.0-only
/** V45 extraction: preserve existing source contributions and their phase/order. */
import type { DerivationContext } from '../derivation.ts';
import type {
  DerivedBaseline,
  DerivedValue,
  Provenance,
  PartialBaseline,
} from '../../contracts/characterEvaluation.ts';
import { SENTENCES } from '../sources.ts';
import type { Characteristic } from '../../contracts/rollResolution.ts';
export function applyClassProfile(ctx: DerivationContext, out: PartialBaseline) {
  const profile = ctx.definitions.classProfiles?.[ctx.single('class.choice') ?? ''];
  const dv = <T>(value: T, provenance: Provenance[]): DerivedValue<T> => ({ value, provenance });
  const sourced = (
    decisionId: string,
    source: string,
    quote: string,
    extra: Partial<Provenance> = {},
  ): Provenance => ({ decisionId, source: ctx.sentence({ path: source, quote }), ...extra });
  const names: Record<Characteristic, string> = {
    M: 'Might',
    A: 'Agility',
    R: 'Reason',
    I: 'Intuition',
    P: 'Presence',
  };
  if (
    profile &&
    !ctx.available.has('class.fury.baseline') &&
    ctx.available.has(profile.baselineDecisionId)
  ) {
    const id = profile.baselineDecisionId;
    const entry = (quote: string, extra: Partial<Provenance> = {}) =>
      sourced(id, profile.source, quote, extra);
    const assignment = ctx.valid.get(profile.assignmentDecisionId);
    const array = ctx.single(profile.arrayDecisionId);
    if (array && assignment && typeof assignment === 'object' && !Array.isArray(assignment)) {
      out.characteristics = Object.fromEntries(
        Object.entries(names).map(([key, name]) => {
          const fixed = profile.fixedCharacteristics[name];
          return [
            key,
            fixed !== undefined
              ? dv(fixed, [
                  sourced(profile.fixedDecisionId, profile.source, profile.characteristicsQuote, {
                    operation: 'set',
                    amount: fixed,
                  }),
                ])
              : dv(assignment[name]!, [
                  sourced(profile.arrayDecisionId, profile.source, profile.characteristicsQuote, {
                    selection: array,
                  }),
                  sourced(
                    profile.assignmentDecisionId,
                    profile.source,
                    profile.characteristicsQuote,
                    {
                      selection: `${name} ${assignment[name]}`,
                      operation: 'set',
                      amount: assignment[name]!,
                    },
                  ),
                ]),
          ];
        }),
      ) as DerivedBaseline['characteristics'];
    }
    const subclass = ctx.single(profile.subclassDecisionId);
    if (subclass)
      out.subclass = dv(subclass, [
        {
          decisionId: profile.subclassDecisionId,
          selection: subclass,
          source: ctx.own(ctx.decisions.get(profile.subclassDecisionId)!),
        },
      ]);
    if (profile.kit === 'none') {
      out.kit = null;
      out.staminaMaximum = dv(profile.startingStamina, [
        entry(`Starting Stamina at 1st Level: ${profile.startingStamina}`, {
          operation: 'base',
          amount: profile.startingStamina,
        }),
      ]);
    }
    out.recoveriesMaximum = dv(profile.recoveries, [
      entry(`Recoveries: ${profile.recoveries}`, {
        operation: 'set',
        amount: profile.recoveries,
      }),
    ]);
    if (out.staminaMaximum) {
      out.recoveryValue = dv(Math.floor(out.staminaMaximum.value / 3), [
        sourced(id, SENTENCES.recoveryValue.path, SENTENCES.recoveryValue.quote, {
          operation: 'floor-divide',
          amount: 3,
        }),
      ]);
      out.windedValue = dv(Math.floor(out.staminaMaximum.value / 2), [
        sourced(id, SENTENCES.winded.path, SENTENCES.winded.quote, {
          operation: 'floor-divide',
          amount: 2,
        }),
      ]);
    }
    out.potencyCharacteristic = dv(profile.potencyCharacteristic, [
      entry(`Strong Potency: ${names[profile.potencyCharacteristic]}`),
    ]);
    const score = out.characteristics?.[profile.potencyCharacteristic].value;
    if (score !== undefined) {
      const name = names[profile.potencyCharacteristic];
      out.potency = {
        weak: dv(score - 2, [
          entry(`Weak Potency: ${name} − 2`, { operation: 'set', amount: score - 2 }),
        ]),
        average: dv(score - 1, [
          entry(`Average Potency: ${name} − 1`, { operation: 'set', amount: score - 1 }),
        ]),
        strong: dv(score, [entry(`Strong Potency: ${name}`, { operation: 'set', amount: score })]),
      };
    }
    out.heroicResource = {
      name: dv(profile.resource, [sourced(id, profile.resourceSource, profile.resourceQuote)]),
      startingValue: dv(0, [
        sourced(id, profile.resourceSource, profile.resourceOutsideCombatQuote, {
          operation: 'set',
          amount: 0,
          note: 'A newly created hero has not gained combat resources; live initialization is separate.',
        }),
      ]),
    };
  }
}
