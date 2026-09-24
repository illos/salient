// SPDX-License-Identifier: GPL-3.0-only
/**
 * V170 Strained sections of Talent abilities. Pure: no dice, persistence or live reads.
 *
 * Source (pinned Compendium en/unified/md), feature/talent/level-1/clarity-and-strain.md:
 * - Clarity in Combat: "Whenever you have clarity below 0, you are strained. Some psionic abilities
 *   have additional effects if you are already strained or become strained when you use them.
 *   Strained effects can still impact you even after you are no longer strained."
 * - Clarity Outside of Combat: "whenever you use any ability or effect that costs clarity within 1
 *   minute of using another such ability, you take 1d6 damage and incur any strain effect from
 *   using the new ability. Whenever you use an ability with a strain effect outside of combat, you
 *   can take 1d6 damage and incur the effect if you don't incur it for other reasons."
 *
 * The engine knows the clarity pool before and after this use's payment, so in combat it decides
 * "already strained" and "become strained" itself. It cannot observe the one-minute window or a
 * voluntary choice outside combat, so the table declares those (`strained=yes|no` on ability.use);
 * a declaration against the automatic value in combat is the table's manual override.
 */
import type { CostApplication, LabeledBonus } from '../contracts/rollResolution.ts';

export const CLARITY_AND_STRAIN =
  'vendor/steel-compendium/en/unified/md/feature/talent/level-1/clarity-and-strain.md';

/**
 * The work of one admitted Strained section, as printed. Whole-section grammar: every sentence is
 * one of the two forms below, each at most once, in this order. Anything else stays manual.
 */
export interface StrainedSpec {
  /**
   * "The target takes an extra N [type] damage." (feature/ability/talent/level-1/mind-spike.md,
   * spirit-sword.md). Admitted only when N is the same type as every tier's damage, so it is more of
   * this use's damage to that target (see `strainedExtraDamage`).
   */
  targetExtraDamage?: { amount: number; damageType?: string };
  /**
   * "You also take N [type] damage that can't be reduced in any way." Damage to the user after the
   * target's damage, in printed order. Q-RES-6 (labelled interpretation, as for the Conduit's
   * angered gods, feature/conduit/level-1/piety.md): immunity does not apply; temporary Stamina
   * still absorbs it first (rule/health/temporary-stamina.md), and a weakness, which adds rather
   * than reduces (rule/damage/damage-weakness.md), still applies.
   */
  selfDamage?: { amount: number; damageType?: string; unreducible: true };
}

const TYPES = 'acid|cold|corruption|fire|holy|lightning|poison|psychic|sonic';
const TARGET_EXTRA = new RegExp(`^The target takes an extra (\\d+) (?:(${TYPES}) )?damage\\.$`);
const SELF_UNREDUCIBLE = new RegExp(
  `^You (?:also )?take (\\d+) (?:(${TYPES}) )?damage that can['’]t be reduced in any way\\.$`,
);

/** The whole Strained section read as a spec, or `undefined` when any sentence is unsupported. */
export function strainedSection(text: string): StrainedSpec | undefined {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=\.) (?=[A-Z])/);
  const spec: StrainedSpec = {};
  for (const sentence of sentences) {
    const target = TARGET_EXTRA.exec(sentence);
    if (target && !spec.targetExtraDamage && !spec.selfDamage) {
      const amount = Number(target[1]);
      if (!Number.isSafeInteger(amount)) return undefined;
      spec.targetExtraDamage = { amount, ...(target[2] ? { damageType: target[2] } : {}) };
      continue;
    }
    const self = SELF_UNREDUCIBLE.exec(sentence);
    if (self && !spec.selfDamage) {
      const amount = Number(self[1]);
      if (!Number.isSafeInteger(amount)) return undefined;
      spec.selfDamage = {
        amount,
        ...(self[2] ? { damageType: self[2] } : {}),
        unreducible: true,
      };
      continue;
    }
    return undefined;
  }
  return spec.targetExtraDamage || spec.selfDamage ? spec : undefined;
}

export function sameStrainedSpec(a: StrainedSpec, b: StrainedSpec): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}
function canonical(spec: StrainedSpec) {
  return [
    spec.targetExtraDamage
      ? [spec.targetExtraDamage.amount, spec.targetExtraDamage.damageType ?? null]
      : null,
    spec.selfDamage
      ? [spec.selfDamage.amount, spec.selfDamage.damageType ?? null, spec.selfDamage.unreducible]
      : null,
  ];
}

/**
 * Why the Strained section applied or not for one use:
 * - `already-strained`: clarity was below 0 before the use;
 * - `became-strained`: paying this use's clarity cost took it below 0;
 * - `not-strained`: neither;
 * - `no-clarity`: the user has no clarity pool, so is never strained by the rule;
 * - `outside-combat`: declared outside combat, where the engine can't see the one-minute window or a
 *   voluntary choice; the user takes 1d6 damage and incurs the effect;
 * - `declared-strained` / `declared-not-strained`: the table's override of the automatic value in
 *   combat.
 */
export type StrainedBasis =
  | 'already-strained'
  | 'became-strained'
  | 'not-strained'
  | 'no-clarity'
  | 'outside-combat'
  | 'declared-strained'
  | 'declared-not-strained';

export interface StrainedState {
  applies: boolean;
  basis: StrainedBasis;
  /** What the engine decided from the pool alone. */
  automatic: boolean;
  inCombat: boolean;
  clarityBefore?: number;
  clarityAfter?: number;
  declared?: 'yes' | 'no';
  /** `outside-combat` only: "you take 1d6 damage" to incur the effect. */
  incurDamage?: { dice: '1d6'; sourcePath: string };
}

/**
 * Whether this use is strained. `clarity` is the user's clarity pool before the use, absent when
 * the user has none; `cost` is this use's payment (a waived or other-resource cost changes
 * nothing).
 */
export function strainedState(input: {
  inCombat: boolean;
  clarity?: number;
  cost?: CostApplication;
  declared?: 'yes' | 'no';
}): StrainedState {
  const before = input.clarity;
  const after =
    before === undefined
      ? undefined
      : input.cost && input.cost.resource === 'clarity' && !input.cost.waived
        ? input.cost.after
        : before;
  const automaticBasis: StrainedBasis =
    before === undefined
      ? 'no-clarity'
      : before < 0
        ? 'already-strained'
        : after! < 0
          ? 'became-strained'
          : 'not-strained';
  const automatic = automaticBasis === 'already-strained' || automaticBasis === 'became-strained';
  const common = {
    automatic,
    inCombat: input.inCombat,
    ...(before !== undefined ? { clarityBefore: before, clarityAfter: after! } : {}),
    ...(input.declared ? { declared: input.declared } : {}),
  };
  if (input.declared === 'yes' && !automatic)
    return input.inCombat
      ? { ...common, applies: true, basis: 'declared-strained' }
      : {
          ...common,
          applies: true,
          basis: 'outside-combat',
          incurDamage: { dice: '1d6', sourcePath: CLARITY_AND_STRAIN },
        };
  if (input.declared === 'no' && automatic)
    return { ...common, applies: false, basis: 'declared-not-strained' };
  return { ...common, applies: automatic, basis: automaticBasis };
}

/** The log wording for a basis. */
export function describeStrainedBasis(state: StrainedState): string {
  const pool =
    state.clarityBefore !== undefined
      ? state.clarityAfter !== state.clarityBefore
        ? `clarity ${state.clarityBefore} → ${state.clarityAfter}`
        : `clarity ${state.clarityBefore}`
      : 'no clarity pool';
  switch (state.basis) {
    case 'already-strained':
      return `strained: already strained (${pool})`;
    case 'became-strained':
      return `strained: became strained paying the cost (${pool})`;
    case 'not-strained':
      return `not strained (${pool})`;
    case 'no-clarity':
      return 'not strained (no clarity pool)';
    case 'outside-combat':
      return `strained: declared outside combat (${pool}), taking 1d6 damage to incur the effect`;
    case 'declared-strained':
      return `strained: declared by the table (automatic: not strained, ${pool})`;
    case 'declared-not-strained':
      return `not strained: declared by the table (automatic: strained, ${pool})`;
  }
}

/** The extra damage a strained use adds to each target's damage, for the roll and corrections. */
export function strainedExtraDamage(
  spec: StrainedSpec | undefined,
  state: StrainedState | undefined,
): LabeledBonus[] {
  return spec?.targetExtraDamage && state?.applies
    ? [
        {
          label: `Strained: extra ${spec.targetExtraDamage.amount}${spec.targetExtraDamage.damageType ? ` ${spec.targetExtraDamage.damageType}` : ''} damage`,
          amount: spec.targetExtraDamage.amount,
        },
      ]
    : [];
}
