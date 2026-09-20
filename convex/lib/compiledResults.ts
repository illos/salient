// SPDX-License-Identifier: GPL-3.0-only
/** Live V72 facts are deliberately narrower than the pure evaluator's complete fixture facts. */
import type { MovementFacts } from '../../shared/resolve/compiledOutcome';
import type { CompiledResult, PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { baselineOf, requireHeroLive } from './characterBuild';
import { foeSnapshot, type TargetRecord } from './resolve';

export function movementFacts(record: TargetRecord): MovementFacts {
  const baseline = record.character ? baselineOf(record.character.derivedBaseline) : null;
  const snapshot = record.foe ? foeSnapshot(record.foe).structured : undefined;
  const size = baseline?.size.value ?? snapshot?.size;
  const stability = baseline?.stability.value ?? snapshot?.stability;
  const conditions = record.character
    ? requireHeroLive(record.character).conditions
    : record.foe?.live.conditions;
  const active = Object.entries(conditions ?? {})
    .filter(([, enabled]) => enabled)
    .map(([id]) => id);
  // Toggle absence does not establish all movement-condition/trait/modifier coverage. Unknown
  // categories remain absent; active toggles identify known, unevaluated consequences explicitly.
  return {
    kind: 'creature',
    ...(typeof size === 'string' ? { size } : {}),
    ...(typeof stability === 'number'
      ? { stability }
      : typeof stability === 'string' && /^\d+$/.test(stability)
        ? { stability: Number(stability) }
        : {}),
    ...(active.length ? { conditions: { kind: 'unhandled' as const, labels: active } } : {}),
  };
}

export function publicCompiledResult(
  result: CompiledResult,
  foeIds: Set<string>,
  director: boolean,
  numerical: boolean,
  controlledTargetIds: ReadonlySet<string> = new Set(),
): PublicCompiledResult {
  const { inputs, ...publicResult } = result;
  void inputs;
  return {
    ...publicResult,
    effects: result.effects.map(occurrence => {
      const effect = occurrence.effect;
      if (
        effect.kind === 'condition' &&
        !director &&
        (foeIds.has(effect.targetId) || !controlledTargetIds.has(effect.targetId))
      ) {
        const { targetScore, ...publicEffect } = effect;
        void targetScore;
        return { ...occurrence, effect: publicEffect };
      }
      if (
        director ||
        !foeIds.has(effect.targetId) ||
        effect.kind !== 'damage' ||
        !effect.application
      )
        return occurrence;
      const {
        staminaBefore,
        staminaAfter,
        temporaryStaminaBefore,
        temporaryStaminaAfter,
        ...rest
      } = effect.application;
      void temporaryStaminaBefore;
      void temporaryStaminaAfter;
      // The existing ability-result query applies this same audience projection to damage.
      return {
        ...occurrence,
        effect: {
          ...effect,
          application: { ...rest, ...(numerical ? { staminaBefore, staminaAfter } : {}) },
        },
      };
    }),
  } as PublicCompiledResult;
}

/** Original potency facts: absence is unknown, never a zero/default characteristic. */
export function conditionFacts(
  actor: TargetRecord,
  targets: TargetRecord[],
): NonNullable<
  import('../../shared/resolve/compiledOutcome').CompiledAbilityInput['conditionFacts']
> {
  const baseline = actor.character ? baselineOf(actor.character.derivedBaseline) : null;
  const letters = ['M', 'A', 'R', 'I', 'P'] as const;
  const names = { M: 'might', A: 'agility', R: 'reason', I: 'intuition', P: 'presence' };
  return {
    ...(baseline?.potency && baseline.potencyCharacteristic
      ? {
          potency: {
            characteristic: baseline.potencyCharacteristic.value,
            weak: baseline.potency.weak.value,
            average: baseline.potency.average.value,
            strong: baseline.potency.strong.value,
          },
        }
      : {}),
    targets: targets.map(record => {
      if (record.squad || record.actor.kind === 'squad')
        return { targetId: record.actor.id, kind: 'squad' as const };
      const targetBaseline = record.character ? baselineOf(record.character.derivedBaseline) : null;
      const structured = record.foe ? foeSnapshot(record.foe).structured : undefined;
      const characteristics = Object.fromEntries(
        letters.flatMap(letter => {
          const value =
            targetBaseline?.characteristics[letter]?.value ?? structured?.[names[letter]];
          const score =
            typeof value === 'number'
              ? value
              : typeof value === 'string' && /^-?\d+$/.test(value.trim())
                ? Number(value)
                : undefined;
          return score !== undefined && Number.isSafeInteger(score) ? [[letter, score]] : [];
        }),
      );
      return {
        targetId: record.actor.id,
        kind: record.character
          ? ('hero' as const)
          : record.foe
            ? ('foe' as const)
            : ('object' as const),
        characteristics,
      };
    }),
  };
}
