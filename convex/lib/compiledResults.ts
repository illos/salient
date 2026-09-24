// SPDX-License-Identifier: GPL-3.0-only
/** Live V72 facts are deliberately narrower than the pure evaluator's complete fixture facts. */
import type { MovementFacts } from '../../shared/resolve/compiledOutcome';
import type { CompiledResult, PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { baselineOf, requireHeroLive } from './characterBuild';
import { foeSnapshot, type TargetRecord } from './resolve';
import type { ConditionId } from '../../shared/contracts/liveState';
import { derivedValue } from '../../shared/resolve/modifiers';

export function movementFacts(record: TargetRecord): MovementFacts {
  const baseline = record.character ? baselineOf(record.character.derivedBaseline) : null;
  const snapshot = record.foe ? foeSnapshot(record.foe).structured : undefined;
  const size = baseline?.size.value ?? snapshot?.size;
  const base = baseline?.stability.value ?? snapshot?.stability;
  // V159: active stability effects feed the forced-movement stability (rule/character/stability.md;
  // docs/lasting-effects-design.md#2-modifier-pipeline, derived values).
  const holderId = record.character?._id ?? record.foe?._id;
  const numeric =
    typeof base === 'number'
      ? base
      : typeof base === 'string' && /^\d+$/.test(base)
        ? Number(base)
        : undefined;
  const effects =
    numeric !== undefined && holderId
      ? derivedValue(
          numeric,
          holderId,
          (record.character
            ? record.character.liveState?.effectInstances
            : record.foe?.live.effectInstances) ?? [],
          'stability',
        )
      : undefined;
  const stability = effects?.value ?? numeric;
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
    ...(stability !== undefined ? { stability } : {}),
    ...(effects?.contributions.length ? { stabilityEffects: effects.contributions } : {}),
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

const CONDITIONS = [
  'bleeding',
  'dazed',
  'frightened',
  'grabbed',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
] as const;

/**
 * Conditions a stat block's own text says the creature "can't be" given, for example
 * monster/elemental/statblock/crux-of-fire.md Fickle and Free ("can't be restrained, slowed, or
 * knocked prone"). Detection only withholds automation; it never grants an immunity.
 */
export function printedPrevention(text: string): ConditionId[] {
  const found = new Set<ConditionId>();
  for (const sentence of text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').split(/(?<=[.!?])\s+|\n+/))
    if (/can['’]t be\b/i.test(sentence))
      for (const condition of CONDITIONS)
        if (new RegExp(`\\b${condition}\\b`, 'i').test(sentence)) found.add(condition);
  return [...found];
}

/**
 * Who holds this creature's active grabs. A manual grabbed toggle, or a toggle with no active
 * sourced instance, is `unrecorded`; retained history of ended or other conditions never counts.
 */
export function grabbedBy(record: TargetRecord): string[] {
  const live = record.character?.liveState ?? record.foe?.live;
  if (!live?.conditions?.grabbed) return [];
  const sources = (live.conditionInstances ?? [])
    .filter(i => i.status === 'active' && i.condition === 'grabbed')
    .map(i => i.sourceActorId ?? 'unrecorded');
  if (live.manualConditions?.grabbed) sources.push('unrecorded');
  return sources.length ? [...new Set(sources)] : ['unrecorded'];
}

/** A stat block's trait text only: ability text describes its targets, not the creature. */
function traitText(snapshot: { text: string; features?: unknown[] }): string {
  if (!Array.isArray(snapshot.features)) return snapshot.text;
  return snapshot.features
    .filter(
      (feature): feature is { feature_type: string } =>
        !!feature &&
        typeof feature === 'object' &&
        (feature as { feature_type?: unknown }).feature_type === 'trait',
    )
    .map(feature => JSON.stringify(feature))
    .join('\n');
}

/** Original potency facts: absence is unknown, never a zero/default characteristic. */
export function conditionFacts(
  actor: TargetRecord,
  targets: TargetRecord[],
  actorHolding: string[] = [],
): NonNullable<
  import('../../shared/resolve/compiledOutcome').CompiledAbilityInput['conditionFacts']
> {
  const baseline = actor.character ? baselineOf(actor.character.derivedBaseline) : null;
  const letters = ['M', 'A', 'R', 'I', 'P'] as const;
  const names = { M: 'might', A: 'agility', R: 'reason', I: 'intuition', P: 'presence' };
  return {
    ...(actorHolding.length ? { actorHolding } : {}),
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
      // V115: evaluated hero immunities are facts; printed foe prevention text is not evaluated,
      // so a condition it names stays fact-needed instead of assumed (monster traits are manual).
      const immunities = (targetBaseline?.conditionImmunities ?? [])
        .map(entry => entry.condition)
        .filter((id): id is ConditionId => (CONDITIONS as readonly string[]).includes(id));
      const prevention = record.foe ? printedPrevention(traitText(foeSnapshot(record.foe))) : [];
      return {
        targetId: record.actor.id,
        kind: record.character
          ? ('hero' as const)
          : record.foe
            ? ('foe' as const)
            : ('object' as const),
        characteristics,
        ...(immunities.length ? { conditionImmunities: immunities } : {}),
        ...(prevention.length ? { conditionPreventionUnevaluated: prevention } : {}),
        ...(grabbedBy(record).length ? { grabbedBy: grabbedBy(record) } : {}),
      };
    }),
  };
}
