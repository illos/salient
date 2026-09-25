// SPDX-License-Identifier: GPL-3.0-only
/** V26 pure evaluation. Results describe calculations, never persisted or spatial changes. */
import type {
  AbilityRollBlocked,
  AbilityRollResult,
  CostApplication,
  DamageApplication,
  DamageBreakdown,
  ResourcePoolFacts,
  TierDamageText,
} from '../contracts/rollResolution.ts';
import type { CompiledAbility, CompiledNode, PushNode, ConditionNode } from './compileAbility.ts';
import {
  eachAreaTarget,
  effectRider,
  plain,
  targetShapeDetail,
  type Characteristic,
} from './abilityGrammar.ts';
import type { RiderNode } from './compileAbility.ts';
import { sameForcedMovementRule, tierInstruction } from './effectRiders.ts';
import { lastingInstruction, type LastingSpec } from './lastingEffects.ts';
import {
  bindModifier,
  effectOnlyModifier,
  sameModifierSpec,
  sectionModifier,
  type ModifierSpec,
  type StatContribution,
} from './modifiers.ts';
import type { ModifierPayload, Watcher } from '../contracts/liveState.ts';
import {
  bindWatcher,
  effectOnlyWatcher,
  sameWatcherSpec,
  sectionWatcher,
  type WatcherSpec,
} from './watchers.ts';
import {
  sameStrainedSpec,
  strainedExtraDamage,
  strainedSection,
  type StrainedSpec,
  type StrainedState,
} from './strained.ts';
import {
  actionTypeOfUsage,
  revisionFits,
  riderAdmitted,
  spendSubjectFits,
  strainedAdmitted,
} from './compileAbility.ts';
import {
  halveApplication,
  responseSpend,
  sameResponseSpend,
  type ResponseSpendClause,
} from './damageRevision.ts';
import type { EffectRider } from './effectRiders.ts';
import { sameTriggerSpec, triggerSection } from './triggers.ts';
import { readMarkAbility, sameMarkSpec, type MarkSpec } from './marks.ts';
import { damageTypeAdmitted, sameDamageTypeSpec, sectionDamageType } from './damageTypes.ts';
import {
  effectOnlyClause,
  type EffectOnlySentence,
  effectOnlyTarget,
  effectOnlyTargetLimit,
  readEffectOnlySection,
} from './effectOnly.ts';
import {
  checkAffordability,
  plainText,
  resolveAbilityRoll,
  withMode,
  type AbilityRollInput,
} from './index.ts';

/** Absence is unknown. `none` asserts coverage of this category for forced movement. */
export type MovementCoverage = { kind: 'none' } | { kind: 'unhandled'; labels: string[] };

export interface MovementFacts {
  kind?: 'creature' | 'object';
  /** Bare `1` does not distinguish 1T, 1S, 1M and 1L. */
  size?: string;
  /** V159: base stability plus `stabilityEffects`. */
  stability?: number;
  /** V159: active effects included in `stability`, with their sources (rule/character/stability.md). */
  stabilityEffects?: StatContribution[];
  conditions?: MovementCoverage;
  traits?: MovementCoverage;
  modifiers?: MovementCoverage;
}

export interface CompiledAbilityInput extends Omit<AbilityRollInput, 'ability'> {
  conditionFacts?: {
    targets: {
      targetId: string;
      kind: 'hero' | 'foe' | 'object' | 'squad';
      characteristics?: Partial<Record<Characteristic, number>>;
      /** V115: evaluated immunities (for example Nonstop, feature/trait/orc/nonstop.md). */
      conditionImmunities?: ConditionNode['condition'][];
      /** V115: printed prevention text the app has not evaluated; never assumed susceptible. */
      conditionPreventionUnevaluated?: ConditionNode['condition'][];
      /**
       * V119: who already has this target grabbed (creature ids, or `unrecorded` for a manual
       * toggle). chapter/classes.md, Stacking Unique Effects: a character grabbed by an enemy
       * can't be grabbed again by another enemy.
       */
      grabbedBy?: string[];
    }[];
    potency?: { characteristic: Characteristic; weak: number; average: number; strong: number };
    /** V119: creatures the actor already has grabbed (chapter/monster-basics.md, Creatures Who Grab). */
    actorHolding?: string[];
  };
  movement?: {
    actor: MovementFacts;
    targets: (MovementFacts & { targetId: string })[];
  };
  /**
   * V170: whether this use is strained, decided by the use from the clarity pool before and after
   * its payment, or declared by the table (shared/resolve/strained.ts). Saved with the inputs, so a
   * correction recomputes with the same decision. Absent: a Strained section stays manual.
   */
  strained?: StrainedState;
}

interface EffectIdentity {
  /** Structural node/target identity only; persistence must add use and revision identities. */
  nodeId: string;
  targetId: string;
  locator: CompiledNode['locator'];
  clause: string;
}

export interface CompiledDamageOutcome extends EffectIdentity {
  kind: 'damage';
  status: 'calculated' | 'fact-needed' | 'manual';
  breakdown?: DamageBreakdown;
  application?: DamageApplication;
  requirements: string[];
}

export interface CompiledPushOutcome extends EffectIdentity {
  kind: 'push';
  status: 'instruction' | 'fact-needed' | 'manual';
  after: string;
  /** V113: absent for an ordinary push. */
  movement?: 'pull' | 'slide';
  vertical?: true;
  printed: number;
  sizeBonus?: number;
  subtotal?: number;
  /**
   * Allowance before optional stability reduction; never an executed distance. V176: with a
   * `stability-replaced` rule it is the allowance after the printed reduction, and stability is
   * ignored.
   */
  allowance?: number;
  stability?: number;
  /** V159: the effects included in `stability`, with their sources. */
  stabilityEffects?: StatContribution[];
  /** V176 `ignored`: the ability's own section says this forced movement ignores stability. */
  stabilityReduction: 'optional' | 'ignored';
  /**
   * V176 `stability-replaced` (shadow/level-2/machinations-of-sound.md): the printed reduction by
   * the target's characteristic score, from the section `nodeId`.
   */
  reduction?: { nodeId: string; characteristic: Characteristic; score?: number };
  /**
   * V176 `teleport-first` (null/level-1/phase-inversion-strike.md): the section whose table work
   * must happen first. Without it the allowance is 0 ("you can't push them").
   */
  precondition?: { nodeId: string; clause: string };
  requirements: string[];
  manualReasons: string[];
  instruction: string;
  manualScope: string[];
  rulePaths: string[];
}

export interface CompiledConditionOutcome extends EffectIdentity {
  kind: 'condition';
  /**
   * `immune`: an evaluated immunity prevents the condition; damage is unaffected (V115).
   * `ineligible`: the grabber is too small to grab this target (condition/grabbed.md, V119).
   */
  status: 'applied' | 'resisted' | 'immune' | 'ineligible' | 'fact-needed' | 'manual';
  after: string;
  /** Absent for a V113 unconditional condition, which has no potency to resist. */
  characteristic?: Characteristic;
  threshold?: number;
  thresholdSource: ConditionNode['threshold'];
  potencyCharacteristic?: Characteristic;
  targetScore?: number;
  condition: ConditionNode['condition'];
  duration: ConditionNode['duration'];
  /** V153: shared by the conditions of one compound clause; they take one saving throw. */
  group?: string;
  /** V155: the timed restriction on standing that holds a prone creature down. */
  restriction?: 'cant-stand';
  requirements: string[];
}

function conditionOutcome(
  node: ConditionNode,
  targetId: string,
  input: CompiledAbilityInput,
  damageComplete: boolean,
): CompiledConditionOutcome {
  const requirements: string[] = [];
  const target = input.conditionFacts?.targets.find(fact => fact.targetId === targetId);
  const potency = input.conditionFacts?.potency;
  // rule/combat/target.md: objects are immune to an ability's other effects; squads stay manual.
  const eligible = target?.kind === 'hero' || target?.kind === 'foe';
  const identity = {
    kind: 'condition' as const,
    nodeId: node.id,
    targetId,
    locator: node.locator,
    clause: node.clause,
    after: node.after,
    thresholdSource: node.threshold,
    condition: node.condition,
    duration: node.duration,
    ...(node.group !== undefined ? { group: node.group } : {}),
    ...(node.restriction !== undefined ? { restriction: node.restriction } : {}),
  };
  const threshold = node.threshold;
  if (eligible && target.conditionImmunities?.includes(node.condition))
    return { ...identity, requirements: [], status: 'immune' };
  if (eligible && node.condition === 'grabbed') {
    const size = grabSize(input, targetId);
    if (size.requirements.length) requirements.push(...size.requirements);
    else if (!size.allowed) return { ...identity, requirements: [], status: 'ineligible' };
    // Stacking Unique Effects: an existing grab by someone else is left to the table.
    if (target.grabbedBy?.some(source => source !== input.actor.actorId))
      requirements.push(`target:${targetId}.alreadyGrabbed`);
    // Creatures Who Grab: one grab at a time unless a stat block says otherwise.
    if (input.conditionFacts?.actorHolding?.some(id => id !== targetId))
      requirements.push('actor.grabLimit');
  }
  if (eligible && target.conditionPreventionUnevaluated?.includes(node.condition))
    requirements.push(`target:${targetId}.conditionPrevention.${node.condition}`);
  if (threshold.kind === 'always' || !node.characteristic) {
    // V113: no potency to resist; an eligible creature is affected once damage is complete.
    if (!eligible) requirements.push(`target:${targetId}.evaluatedCreatureCharacteristics`);
    if (!damageComplete) requirements.push(`damage:${node.after}.completion`);
    return { ...identity, requirements, status: requirements.length ? 'fact-needed' : 'applied' };
  }
  // V88 order and requirements unchanged.
  const rawThreshold = threshold.kind === 'printed' ? threshold.value : potency?.[threshold.tier];
  const value = Number.isSafeInteger(rawThreshold) ? rawThreshold : undefined;
  if (value === undefined)
    requirements.push(`actor.potency.${threshold.kind === 'potency' ? threshold.tier : 'printed'}`);
  if (!eligible) requirements.push(`target:${targetId}.evaluatedCreatureCharacteristics`);
  const rawScore = eligible ? target.characteristics?.[node.characteristic] : undefined;
  const targetScore = Number.isSafeInteger(rawScore) ? rawScore : undefined;
  if (targetScore === undefined)
    requirements.push(`target:${targetId}.characteristics.${node.characteristic}`);
  if (!damageComplete) requirements.push(`damage:${node.after}.completion`);
  return {
    ...identity,
    characteristic: node.characteristic,
    ...(value !== undefined ? { threshold: value } : {}),
    ...(targetScore !== undefined ? { targetScore } : {}),
    ...(threshold.kind === 'potency' && potency
      ? { potencyCharacteristic: potency.characteristic }
      : {}),
    requirements,
    status: requirements.length ? 'fact-needed' : targetScore! < value! ? 'applied' : 'resisted',
  };
}

export interface CompiledManualOutcome extends EffectIdentity {
  kind: 'unsupported';
  status: 'manual';
  reason: string;
  dependency: 'after-damage' | 'unknown';
}

/** One whole Effect section, attached to the use's sole target for occurrence addressing.
 * Its printed subject may be the actor or an ally. No inferred beneficiary or state writes.
 */
export interface CompiledRiderOutcome extends EffectIdentity {
  kind: 'rider';
  status: 'manual' | 'fact-needed';
  shape: RiderNode['shape'];
  dependency: RiderNode['dependency'];
  after: string[];
  requirements: string[];
  /**
   * V154: a tier instruction for this target's own outcome, not a once-per-use section. A
   * correction of another target keeps it.
   */
  tier?: true;
  /** V158: the lasting instruction a use stores as an effect instance on commit. */
  lasting?: LastingSpec;
  /**
   * V176 `same-distance` (conduit/level-1/call-the-thunder-down.md): the distinct tier push
   * allowances of this use's targets, from their push outcomes. Absent until each is known.
   */
  distances?: number[];
}

/** V158: two lasting specs read from the same printed section are the same, field by field. */
export function sameLasting(a: LastingSpec, b: LastingSpec): boolean {
  const duration = (d: LastingSpec['duration']) => `${d.kind}:${'anchor' in d ? d.anchor : ''}`;
  return (
    a.effect === b.effect &&
    a.shape === b.shape &&
    a.subject === b.subject &&
    a.text === b.text &&
    duration(a.duration) === duration(b.duration) &&
    a.endsWhen.length === b.endsWhen.length &&
    a.endsWhen.every((trigger, index) => b.endsWhen[index] === trigger)
  );
}

/**
 * V157 executed gain of an effect-only use for one recipient. `applied` for a hero, whose live
 * state carries temporary Stamina and surges; `manual` otherwise (foes carry no surge counter).
 */
export interface CompiledGainOutcome extends EffectIdentity {
  kind: 'gain';
  status: 'applied' | 'manual';
  subject: 'actor' | 'target';
  temporaryStamina?: number;
  surges?: number;
  /** Present when applied: the recipient's values before and after this gain. */
  application?: {
    temporaryStaminaBefore?: number;
    temporaryStaminaAfter?: number;
    surgesBefore?: number;
    surgesAfter?: number;
  };
  requirements: string[];
}

/**
 * V159 modifier of one subject (docs/lasting-effects-design.md#2-modifier-pipeline). `applied`: the
 * use stores a `modifier` effect instance on a hero or foe, and the engine applies it to later
 * rolls or derived values. `manual`: the subject can't hold one the engine reads (an object, a
 * squad minion whose squad action doesn't read modifiers) or its amount is unknown; the table
 * applies it.
 */
export interface CompiledModifierOutcome extends EffectIdentity {
  kind: 'modifier';
  status: 'applied' | 'manual';
  subject: 'actor' | 'target';
  spec: ModifierSpec;
  /** The modifier with its printed amount bound at use; absent when the amount is unknown. */
  payload?: ModifierPayload;
  requirements: string[];
}

/**
 * V170: a Strained section's outcome for one use, addressed through the first target like other
 * once-per-use sections.
 * - `applied`: the use is strained. The target's extra damage is already in its damage outcome
 *   (breakdown `extraDamage`); the user's own damage is applied by the use, which records it here.
 * - `not-strained`: the section does not apply to this use.
 * - `manual`: the use gave no strained decision, or the user's damage could not be applied; the
 *   table resolves what `requirements` names.
 */
export interface CompiledStrainedOutcome extends EffectIdentity {
  kind: 'strained';
  status: 'applied' | 'not-strained' | 'manual';
  spec: StrainedSpec;
  state?: StrainedState;
  /** The user's damage as applied at the use, when the spec has any and it applied. */
  selfApplication?: DamageApplication;
  requirements: string[];
}

/**
 * V171 watcher of one subject (docs/lasting-effects-design.md#3-watchers). `applied`: the use stores
 * a `watcher` effect instance on a hero or foe, and the engine fires it when the watched event
 * happens. `manual`: the subject can't hold one (an object, or a squad minion, whose events the
 * engine doesn't observe per creature) or a printed amount is unknown; the table resolves it.
 */
export interface CompiledWatcherOutcome extends EffectIdentity {
  kind: 'watcher';
  status: 'applied' | 'manual';
  subject: 'actor' | 'target';
  spec: WatcherSpec;
  /** The watcher with its printed amounts bound at use; absent when an amount is unknown. */
  payload?: Watcher;
  requirements: string[];
}

/**
 * V173: a triggered ability's damage sized by the triggering damage, for its one target.
 * `calculated`: an accepted offer supplied the triggering damage; the amount is half of it rounded
 * down (rule/general/always-round-down.md) and the use applies it through the damage writer, which
 * records `application`. `manual`: a use by hand, which doesn't know the triggering damage.
 */
export interface CompiledTriggeredDamageOutcome extends EffectIdentity {
  kind: 'triggered-damage';
  status: 'calculated' | 'manual';
  damageType: string;
  triggeringDamage?: number;
  amount?: number;
  application?: DamageApplication;
  requirements: string[];
}

/**
 * V174: a response that revises the triggering damage (shared/resolve/damageRevision.ts). Only an
 * offer accepted from that damage knows the hit; a use by hand leaves the halving to the table.
 * `before` is the hit's current accepted revision and `application` the revised hit. The use adds
 * `consequences`: what the revision reversed or left standing (design 5b), for the log.
 */
export interface CompiledDamageRevisionOutcome extends EffectIdentity {
  kind: 'damage-revision';
  status: 'calculated' | 'manual';
  share: 'half';
  instructions: EffectRider['shape'][];
  confirm?: 'self-or-adjacent';
  potency?: 'any';
  hitEventId?: string;
  before?: DamageApplication;
  application?: DamageApplication;
  consequences?: string[];
  /**
   * The hit's accepted potency reductions per effect occurrence after this revision, cumulative
   * (convex/lib/damageRevisions.ts): the next revision of the same hit starts from them.
   */
  potencyReductions?: Record<string, number>;
  requirements: string[];
}
/** V174: the optional Spend section of such a response, spent or not. */
export interface CompiledResponseSpendOutcome extends EffectIdentity {
  kind: 'response-spend';
  status: 'spent' | 'not-spent';
  resource: string;
  amount?: number;
  effect:
    | { kind: 'potency'; scope: 'one' | 'any' }
    | { kind: 'instruction'; shape: EffectRider['shape'] };
  requirements: string[];
}

/**
 * V175: the Mark on one target (feature/ability/tactician/level-1/mark.md). `applied`: the use stores
 * a `mark` effect instance on a hero or foe outside a squad. `manual`: the target can't hold one (a
 * squad minion, whose squad's rolls and pool the engine doesn't read per creature, or an object:
 * the Mark targets "One creature"); the table tracks it.
 */
export interface CompiledMarkOutcome extends EffectIdentity {
  kind: 'mark';
  status: 'applied' | 'manual';
  spec: MarkSpec;
  requirements: string[];
}

export type CompiledEffectOutcome =
  | CompiledMarkOutcome
  | CompiledDamageRevisionOutcome
  | CompiledResponseSpendOutcome
  | CompiledTriggeredDamageOutcome
  | CompiledWatcherOutcome
  | CompiledStrainedOutcome
  | CompiledDamageOutcome
  | CompiledPushOutcome
  | CompiledConditionOutcome
  | CompiledManualOutcome
  | CompiledRiderOutcome
  | CompiledGainOutcome
  | CompiledModifierOutcome;

/**
 * V159: one subject's modifier outcome. A subject holds the instance only when it is a hero or a
 * foe outside a squad (rule/combat/target.md: objects are immune to an ability's other effects; a
 * squad acts through /squad act, which doesn't read modifiers, so its minions' modifiers stay
 * table work).
 */
function modifierOutcome(
  identity: EffectIdentity,
  spec: ModifierSpec,
  subject: 'actor' | 'target',
  holder: 'hero' | 'foe' | 'object' | 'squad' | undefined,
  characteristics: Partial<Record<Characteristic, number>> | undefined,
): CompiledModifierOutcome {
  const requirements: string[] = [];
  const bound = bindModifier(spec.modifier, characteristics);
  if ('requirement' in bound) requirements.push(bound.requirement);
  if (holder !== 'hero' && holder !== 'foe')
    requirements.push(
      `${subject === 'actor' ? 'actor' : `target:${identity.targetId}`}.${holder ?? 'unknown'} holds no modifier the engine reads`,
    );
  return {
    ...identity,
    kind: 'modifier',
    status: requirements.length ? 'manual' : 'applied',
    subject,
    spec,
    ...('payload' in bound ? { payload: bound.payload } : {}),
    requirements,
  };
}

/**
 * V171: one subject's watcher outcome. As for modifiers, only a hero or a foe outside a squad holds
 * the instance (V158: squads and objects are not tracked).
 */
function watcherOutcome(
  identity: EffectIdentity,
  spec: WatcherSpec,
  subject: 'actor' | 'target',
  holder: 'hero' | 'foe' | 'object' | 'squad' | undefined,
  characteristics: Partial<Record<Characteristic, number>> | undefined,
): CompiledWatcherOutcome {
  const requirements: string[] = [];
  const bound = bindWatcher(spec.watcher, characteristics);
  if ('requirement' in bound) requirements.push(bound.requirement);
  if (holder !== 'hero' && holder !== 'foe')
    requirements.push(
      `${subject === 'actor' ? 'actor' : `target:${identity.targetId}`}.${holder ?? 'unknown'} holds no watcher the engine runs`,
    );
  return {
    ...identity,
    kind: 'watcher',
    status: requirements.length ? 'manual' : 'applied',
    subject,
    spec,
    ...('payload' in bound ? { payload: bound.payload } : {}),
    requirements,
  };
}

export type CompiledAbilityOutcome =
  | { kind: 'manual'; definition: CompiledAbility; reason: string; effects: [] }
  | { kind: 'blocked'; definition: CompiledAbility; roll: AbilityRollBlocked; effects: [] }
  | {
      kind: 'resolved';
      definition: CompiledAbility;
      roll: AbilityRollResult;
      /** All targets' damage precedes any post-damage effect. */
      effects: CompiledEffectOutcome[];
    };

/**
 * V119, condition/grabbed.md: "A creature can grab only creatures of their size or smaller. If a
 * creature's Might score is 2 or higher, they can grab any creature larger than them with a size
 * equal to or less than their Might score." Sizes 1T–1L count as size 1 (rule/character/size.md: a
 * mechanic naming size 1 applies to all size-1 creatures).
 * Interpretation (Q-GRAB-2): the sentence is read as applying to grabs imposed by abilities too.
 * The alternatives are that such grabs ignore size, or that the table decides.
 */
function grabSize(
  input: CompiledAbilityInput,
  targetId: string,
): { allowed: boolean; requirements: string[] } {
  const actorSize = input.movement?.actor.size;
  const targetSize = input.movement?.targets.find(t => t.targetId === targetId)?.size;
  const requirements: string[] = [];
  if (sizeRank(actorSize) === undefined) requirements.push('actor.preciseSize');
  if (sizeRank(targetSize) === undefined) requirements.push(`target:${targetId}.preciseSize`);
  if (requirements.length) return { allowed: false, requirements };
  return {
    allowed: grabEligibility(actorSize, targetSize, input.actor.characteristics.M) === 'allowed',
    requirements,
  };
}

/** Shared by compiled grabs and the Grab maneuver: allowed, ineligible, or unknown sizes. */
export function grabEligibility(
  actorSize: string | undefined,
  targetSize: string | undefined,
  might: number | undefined,
): 'allowed' | 'ineligible' | 'unknown' {
  const actorRank = sizeRank(actorSize);
  const targetRank = sizeRank(targetSize);
  if (actorRank === undefined || targetRank === undefined) return 'unknown';
  if (targetRank <= actorRank) return 'allowed';
  const squares = targetRank <= 3 ? 1 : targetRank - 2;
  return might !== undefined && Number.isSafeInteger(might) && might >= 2 && squares <= might
    ? 'allowed'
    : 'ineligible';
}

/** Whether the first size is smaller than the second; undefined when either is ambiguous. */
export function smallerSize(a: string | undefined, b: string | undefined): boolean | undefined {
  const x = sizeRank(a);
  const y = sizeRank(b);
  return x === undefined || y === undefined ? undefined : x < y;
}

/** Pinned rule.character/size: 1T < 1S < 1M < 1L < 2 < ...; ambiguous sizes stay unknown. */
function sizeRank(size: string | undefined): number | undefined {
  if (size === undefined) return undefined;
  const small = ['1T', '1S', '1M', '1L'].indexOf(size);
  if (small >= 0) return small;
  if (!/^[2-9]\d*$|^1\d+$/.test(size)) return undefined;
  const squares = Number(size);
  return Number.isSafeInteger(squares) && squares <= Number.MAX_SAFE_INTEGER - 2
    ? squares + 2
    : undefined;
}

/** movement/forced-movement.md: Push X, Pull X, Slide X and Vertical. Instructions only. */
function forcedInstruction(node: PushNode): string {
  const vertical = node.vertical
    ? " Vertical: the target can also be moved up or down; a creature who can't fly left in midair falls."
    : '';
  switch (node.movement) {
    case 'pull':
      return `Pull: up to the allowance, including zero, in a straight line toward the source; each square must be closer${node.vertical ? '' : ', without moving vertically'}. No route or destination is established.${vertical}`;
    case 'slide':
      return `Slide: up to the allowance, including zero, in any direction${node.vertical ? '' : ' except vertically'}; the path need not be straight. No route or destination is established.${vertical}`;
    default:
      return node.vertical
        ? `Vertical push: up to the allowance, including zero, in a straight line away from the source; each square must be farther away. No route or destination is established.${vertical}`
        : 'Ordinary push: up to the allowance, including zero, in a straight line away from the source; each square must be farther away. No route or destination is established.';
  }
}

function pushOutcome(
  node: PushNode,
  targetId: string,
  definition: CompiledAbility,
  input: CompiledAbilityInput,
  damageComplete: boolean,
): CompiledPushOutcome {
  const requirements: string[] = [];
  const manualReasons: string[] = [];
  const actor = input.movement?.actor;
  const target = input.movement?.targets.find(f => f.targetId === targetId);
  // V115: a Melee-and-Ranged ability counts as melee only when used in melee (rule/combat/distance.md).
  const keywords = withMode(definition.metadata!, input.selectedMode).keywords.map(k =>
    plainText(k).toLowerCase(),
  );
  const qualifies = keywords.includes('melee') && keywords.includes('weapon');
  let sizeBonus: number | undefined;
  if (qualifies && keywords.includes('ranged')) requirements.push('actor.mode');
  else if (!qualifies) sizeBonus = 0;
  else {
    if (!actor?.kind) requirements.push('actor.kind');
    if (!target?.kind) requirements.push(`target:${targetId}.kind`);
    if (actor?.kind && target?.kind) {
      if (actor.kind === 'object' || target.kind === 'object') sizeBonus = 0;
      else {
        const actorSize = sizeRank(actor.size);
        const targetSize = sizeRank(target.size);
        if (actorSize === undefined) requirements.push('actor.preciseSize');
        if (targetSize === undefined) requirements.push(`target:${targetId}.preciseSize`);
        if (actorSize !== undefined && targetSize !== undefined)
          sizeBonus = actorSize > targetSize ? 1 : 0;
      }
    }
  }
  for (const [label, facts] of [
    ['actor', actor],
    [`target:${targetId}`, target],
  ] as const) {
    for (const category of ['conditions', 'traits', 'modifiers'] as const) {
      const coverage = facts?.[category];
      if (!coverage) requirements.push(`${label}.${category}`);
      else if (coverage.kind === 'unhandled')
        manualReasons.push(`${label}.${category}: ${coverage.labels.join(', ') || 'unevaluated'}`);
    }
  }
  // V176: a section of this ability that governs its own forced movement.
  const ruleNode = definition.sections.find(
    (section): section is RiderNode => section.kind === 'rider' && !!section.forcedMovement,
  );
  const rule = ruleNode?.forcedMovement;
  const replaced = rule?.kind === 'stability-replaced' ? rule : undefined;
  let reduction: CompiledPushOutcome['reduction'];
  if (replaced) {
    // shadow/level-2/machinations-of-sound.md: "This forced movement ignores stability. Instead,
    // the forced movement is reduced by a number equal to the target's Intuition score."
    const score = input.conditionFacts?.targets.find(fact => fact.targetId === targetId)
      ?.characteristics?.[replaced.reducedBy];
    reduction = {
      nodeId: ruleNode!.id,
      characteristic: replaced.reducedBy,
      ...(score !== undefined ? { score } : {}),
    };
    if (score === undefined || !Number.isSafeInteger(score))
      requirements.push(`target:${targetId}.characteristics.${replaced.reducedBy}`);
    // Q-FM-1 (docs/rules-questions-for-user.md): the source does not say whether a negative
    // score lengthens the movement or reduces it by nothing, so that target stays manual.
    else if (score < 0)
      manualReasons.push(
        `target:${targetId}.characteristics.${replaced.reducedBy}: a negative score's reduction is unresolved (Q-FM-1)`,
      );
  }
  const stability = replaced ? undefined : target?.stability;
  if (!replaced && (stability === undefined || !Number.isSafeInteger(stability) || stability < 0))
    requirements.push(`target:${targetId}.stability`);
  if (!damageComplete) requirements.push(`damage:${node.after}.completion`);
  // null/level-1/phase-inversion-strike.md: "If the target can't be teleported this way, you can't
  // push them." The teleport is table work, so the allowance waits on it.
  const precondition =
    rule?.kind === 'teleport-first'
      ? { nodeId: ruleNode!.id, clause: ruleNode!.clause }
      : undefined;
  if (precondition)
    requirements.push(
      "The table's teleport of the target before the push; if it can't be teleported this way, the push allowance is 0",
    );
  const printedSubtotal = sizeBonus === undefined ? undefined : node.distance + sizeBonus;
  // A reduction never makes an allowance negative: "up to" X squares (movement/forced-movement.md).
  const subtotal =
    printedSubtotal !== undefined && reduction
      ? reduction.score !== undefined && reduction.score >= 0
        ? Math.max(0, printedSubtotal - reduction.score)
        : undefined
      : printedSubtotal;
  const status = manualReasons.length
    ? 'manual'
    : requirements.length
      ? 'fact-needed'
      : 'instruction';
  return {
    kind: 'push',
    nodeId: node.id,
    targetId,
    locator: node.locator,
    clause: node.clause,
    status,
    after: node.after,
    printed: node.distance,
    ...(sizeBonus !== undefined ? { sizeBonus } : {}),
    ...(subtotal !== undefined ? { subtotal } : {}),
    ...(status === 'instruction' ? { allowance: subtotal } : {}),
    ...(stability !== undefined && Number.isSafeInteger(stability) && stability >= 0
      ? { stability }
      : {}),
    ...(!replaced && target?.stabilityEffects?.length
      ? { stabilityEffects: target.stabilityEffects }
      : {}),
    stabilityReduction: replaced ? 'ignored' : 'optional',
    ...(reduction ? { reduction } : {}),
    ...(precondition ? { precondition } : {}),
    requirements,
    manualReasons,
    ...(node.movement ? { movement: node.movement } : {}),
    ...(node.vertical ? { vertical: true as const } : {}),
    instruction: forcedInstruction(node),
    manualScope: [
      'Actual movement and voluntary stability reduction',
      'Flying, vertical and slope exceptions',
      'Paths, terrain, collisions and movement triggers',
      'Death effects after forced movement',
    ],
    rulePaths: [
      'movement/forced-movement.md',
      'rule/character/size.md',
      'rule/character/stability.md',
    ],
  };
}

/** Reuse the R04 resolver for roll, cost, kit/build modifiers, immunities and Stamina arithmetic. */
export function resolveCompiledAbility(
  definition: CompiledAbility,
  input: CompiledAbilityInput,
): CompiledAbilityOutcome {
  if (definition.execution !== 'supported' || !definition.metadata)
    return {
      kind: 'manual',
      definition,
      reason: 'Compiled envelope is not executable.',
      effects: [],
    };
  // V110: pinned rule/combat/target.md: the entry is the most that can be targeted; fewer is legal.
  const shape = targetShapeDetail(definition.envelope.target, definition.envelope.keywords);
  const limit = shape.kind === 'single' ? 1 : shape.kind === 'multi' ? shape.max! : undefined;
  if (
    !input.targets.length ||
    (shape.kind === 'single' && input.targets.length !== 1) ||
    (limit !== undefined && input.targets.length > limit) ||
    new Set(input.targets.map(target => target.targetId)).size !== input.targets.length
  )
    return {
      kind: 'manual',
      definition,
      reason:
        shape.kind === 'single'
          ? 'Compiled execution requires exactly one target.'
          : `Compiled execution requires one or more distinct targets${limit !== undefined ? `, at most ${limit}` : ''}.`,
      effects: [],
    };
  if (input.effectClauses?.length)
    return {
      kind: 'manual',
      definition,
      reason: 'Additional effects require compilation with the source envelope.',
      effects: [],
    };
  if (
    definition.format !== 'salient.compiled-ability' ||
    definition.version !== 1 ||
    definition.tiers.length !== 3 ||
    !['single', 'multi', 'area'].includes(shape.kind) ||
    (shape.kind === 'area' && !eachAreaTarget(definition.envelope.target)) ||
    definition.sections.some(node => {
      // V170: a Strained section re-reads to the same spec and is still admitted for these tiers.
      if (node.kind === 'strained') {
        const again = strainedSection(plain(node.clause));
        return (
          !again ||
          !sameStrainedSpec(again, node.spec) ||
          !strainedAdmitted(again, definition.tiers, shape.kind) ||
          definition.sections.filter(other => other.kind === 'strained').length !== 1
        );
      }
      // V171: a watcher re-reads to the same spec, or the definition was tampered with.
      if (node.kind === 'watcher') {
        const again = sectionWatcher(plain(node.clause));
        return (
          !again ||
          !sameWatcherSpec(again, node.spec) ||
          again.subject !== 'target' ||
          shape.kind !== 'single'
        );
      }
      // V159: a modifier re-reads to the same spec, or the definition was tampered with.
      if (node.kind === 'modifier') {
        const again = sectionModifier(plain(node.clause));
        return (
          !again ||
          !sameModifierSpec(again, node.spec) ||
          again.subject !== 'target' ||
          shape.kind !== 'single'
        );
      }
      // V177: a damage-type section re-reads to the same spec, is the only one, and every tier's
      // damage is still untyped.
      if (node.kind === 'damage-type') {
        const again = sectionDamageType(node.clause);
        return (
          !again ||
          !sameDamageTypeSpec(again, node.spec) ||
          !damageTypeAdmitted(definition.tiers) ||
          definition.sections.filter(other => other.kind === 'damage-type').length !== 1
        );
      }
      if (node.kind !== 'rider') return true;
      // V158: a lasting instruction re-reads to the same spec, or the definition was tampered with.
      if (node.lasting) {
        const again = lastingInstruction(plain(node.clause));
        return (
          !again ||
          !sameLasting(again, node.lasting) ||
          again.shape !== node.shape ||
          node.dependency !== 'independent' ||
          (shape.kind !== 'single' && again.subject === 'target')
        );
      }
      const parsed = effectRider(plain(node.clause));
      return (
        !parsed ||
        parsed.shape !== node.shape ||
        parsed.dependency !== node.dependency ||
        !sameForcedMovementRule(parsed.forcedMovement, node.forcedMovement) ||
        !riderAdmitted(parsed, definition.tiers, shape.kind) ||
        definition.sections.filter(other => other.kind === 'rider' && other.forcedMovement).length >
          1
      );
    }) ||
    definition.tiers.some(
      nodes =>
        nodes.some(node => node.kind === 'rider') ||
        // V154: a tier has one damage node first, or none (Power Chord's "Push 1").
        nodes.length === 0 ||
        nodes.filter(node => node.kind === 'damage').length > 1 ||
        nodes.some((node, index) => node.kind === 'damage' && index !== 0) ||
        nodes.some(
          node =>
            (node.kind === 'push' || node.kind === 'condition' || node.kind === 'instruction') &&
            node.after !== (nodes[0]?.kind === 'damage' ? nodes[0].id : ''),
        ) ||
        nodes.some(node => {
          if (node.kind !== 'instruction') return false;
          const parsed = tierInstruction(plain(node.clause));
          return (
            parsed?.shape !== node.shape || (parsed.subject === 'actor' && shape.kind !== 'single')
          );
        }) ||
        // An after-damage remainder needs damage to follow.
        (nodes[0]?.kind !== 'damage' && nodes.some(node => node.kind === 'unsupported')) ||
        nodes.some(
          (node, index) =>
            node.kind === 'condition' &&
            (index < (nodes[0]?.kind === 'damage' ? 1 : 0) ||
              nodes
                .slice(nodes[0]?.kind === 'damage' ? 1 : 0, index)
                .some(
                  prior =>
                    prior.kind !== 'push' &&
                    prior.kind !== 'condition' &&
                    prior.kind !== 'instruction',
                ) ||
              !['save-ends', 'eot', 'none'].includes(node.duration) ||
              (node.duration === 'none' &&
                node.condition !== 'prone' &&
                node.condition !== 'grabbed') ||
              (node.condition === 'grabbed' && node.duration === 'eot') ||
              (node.threshold.kind === 'always') !== (node.characteristic === undefined) ||
              (node.threshold.kind === 'printed' && !Number.isSafeInteger(node.threshold.value)) ||
              // V153: a compound member carries its clause's id, never a bare or grab duration.
              (node.group !== undefined &&
                (node.duration === 'none' ||
                  node.condition === 'grabbed' ||
                  node.condition === 'prone' ||
                  node.id !== `${node.group}~${node.condition}`)) ||
              // V155: a restriction holds down a prone printed before it in the same tier.
              (node.restriction !== undefined &&
                (node.restriction !== 'cant-stand' ||
                  node.condition !== 'prone' ||
                  (node.duration !== 'save-ends' && node.duration !== 'eot') ||
                  !node.id.endsWith('~cant-stand') ||
                  !nodes
                    .slice(0, index)
                    .some(
                      prior =>
                        prior.kind === 'condition' &&
                        prior.condition === 'prone' &&
                        prior.restriction === undefined,
                    )))),
        ) ||
        nodes.some(node => node.kind === 'unsupported' && node.dependency !== 'after-damage') ||
        nodes.some(
          node =>
            node.kind === 'damage' &&
            node.kitBonusesIncluded !== definition.metadata!.kitBonusesIncluded,
        ) ||
        nodes.some(
          node =>
            node.kind === 'push' &&
            (![undefined, 'pull', 'slide'].includes(node.movement) ||
              ![undefined, true].includes(node.vertical) ||
              !Number.isSafeInteger(node.distance) ||
              node.distance < 0 ||
              node.distance >= Number.MAX_SAFE_INTEGER),
        ),
    )
  )
    return {
      kind: 'manual',
      definition,
      reason: 'Compiled structure is outside the supported envelope.',
      effects: [],
    };
  if (
    [input.dice.d10a, input.dice.d10b].some(die => !Number.isInteger(die) || die < 1 || die > 10) ||
    input.targets.some(target =>
      [target.edges, target.banes].some(count => !Number.isSafeInteger(count) || count < 0),
    )
  )
    throw new Error('Accepted dice and edge/bane counts must be valid integers.');
  // V177: the use's damage type is one the section prints, and a required choice was made. The
  // section is executed in every tier's damage (resolveTarget), so it is not listed as table work.
  const damageTypeNode = definition.sections.find(node => node.kind === 'damage-type');
  if (
    (input.selectedDamageType !== undefined &&
      !damageTypeNode?.spec.options.includes(input.selectedDamageType)) ||
    (damageTypeNode?.spec.choice !== undefined &&
      damageTypeNode.spec.choice !== 'optional' &&
      input.selectedDamageType === undefined)
  )
    return {
      kind: 'manual',
      definition,
      reason: damageTypeNode
        ? `The damage type must be one of ${damageTypeNode.spec.options.join(', ')}${damageTypeNode.spec.choice === 'optional' ? ', or none' : ''}.`
        : 'This ability prints no damage-type option.',
      effects: [],
    };
  const tiers = definition.tiers.map(nodes => {
    const damage = nodes[0]?.kind === 'damage' ? nodes[0] : undefined;
    return {
      text: nodes.map(node => node.clause).join('; '),
      ...(damage ? { damage: damage.expression } : {}),
      ...(damage?.damageType ? { damageType: damage.damageType } : {}),
      unresolvedClauses: nodes.filter(node => node.kind === 'unsupported').map(node => node.clause),
    };
  }) as [TierDamageText, TierDamageText, TierDamageText];
  // V170: a strained use adds the section's extra damage to each target's damage for this use.
  const strainedNode = definition.sections.find(node => node.kind === 'strained');
  const extra = strainedExtraDamage(strainedNode?.spec, input.strained);
  const roll = resolveAbilityRoll({
    ...input,
    ...(extra.length
      ? {
          targets: input.targets.map(target => ({
            ...target,
            extraDamage: [...(target.extraDamage ?? []), ...extra],
          })),
        }
      : {}),
    ability: { ...definition.metadata, tiers },
  });
  if (roll.kind === 'blocked') return { kind: 'blocked', definition, roll, effects: [] };
  const effects: CompiledEffectOutcome[] = [];
  const remainder: CompiledEffectOutcome[] = [];
  for (const target of roll.targets) {
    const nodes = definition.tiers[target.tier - 1]!;
    const application = roll.damageApplications.find(a => a.targetId === target.targetId);
    // V154: a tier without damage has nothing to wait for.
    const damageComplete = !!application || nodes[0]?.kind !== 'damage';
    for (const node of nodes) {
      const identity = {
        nodeId: node.id,
        targetId: target.targetId,
        locator: node.locator,
        clause: node.clause,
      };
      if (node.kind === 'damage') {
        effects.push({
          ...identity,
          kind: 'damage',
          status: application
            ? 'calculated'
            : target.damage?.uncertainty
              ? 'manual'
              : 'fact-needed',
          ...(target.damage ? { breakdown: target.damage } : {}),
          ...(application ? { application } : {}),
          requirements: application ? [] : ['Supported damage and complete target damage facts'],
        });
      } else if (node.kind === 'condition') {
        remainder.push(conditionOutcome(node, target.targetId, input, damageComplete));
      } else if (node.kind === 'push') {
        remainder.push(pushOutcome(node, target.targetId, definition, input, damageComplete));
      } else if (node.kind === 'instruction') {
        // Table work for this target's tier outcome, recorded like a section rider.
        const requirements = damageComplete ? [] : [`damage:${node.after}.completion`];
        remainder.push({
          ...identity,
          kind: 'rider',
          shape: node.shape,
          dependency: node.after ? 'after-damage' : 'independent',
          after: node.after ? [node.after] : [],
          requirements,
          status: requirements.length ? 'fact-needed' : 'manual',
          tier: true,
        });
      } else if (node.kind === 'unsupported') {
        remainder.push({
          ...identity,
          kind: 'unsupported',
          status: 'manual',
          reason: node.reason,
          dependency: node.dependency,
        });
      }
    }
  }
  // V155: can't stand holds down only a creature this tier made prone. If that prone was resisted,
  // prevented or is still unknown, the restriction takes the prone's status instead of its own.
  for (const [index, effect] of remainder.entries()) {
    if (effect.kind !== 'condition' || effect.restriction !== 'cant-stand') continue;
    const prone = remainder
      .slice(0, index)
      .reverse()
      .find(
        (prior): prior is CompiledConditionOutcome =>
          prior.kind === 'condition' &&
          prior.targetId === effect.targetId &&
          prior.condition === 'prone' &&
          prior.restriction === undefined,
      );
    if (prone && prone.status !== 'applied' && effect.status === 'applied') {
      effect.status = prone.status;
      effect.requirements = [...effect.requirements, ...prone.requirements];
    }
  }
  // Sections occur once per use, after tier effects in printed order; never one award per target.
  // Multi/area envelopes admit only use-subject sections, addressed through the first target.
  // V152: an `after-effects` reader also waits for the condition outcomes it reads.
  const tierConditions = remainder.filter(
    (effect): effect is CompiledConditionOutcome => effect.kind === 'condition',
  );
  for (const node of definition.sections) {
    // V170: the Strained section, once per use. The user's damage is applied by the use.
    if (node.kind === 'strained') {
      const state = input.strained;
      remainder.push({
        kind: 'strained',
        nodeId: node.id,
        targetId: roll.targets[0]!.targetId,
        locator: node.locator,
        clause: node.clause,
        status: !state ? 'manual' : state.applies ? 'applied' : 'not-strained',
        spec: node.spec,
        ...(state ? { state } : {}),
        requirements: state ? [] : ['actor.strained'],
      });
      continue;
    }
    // V171: a watcher section is once per use and independent of the roll; "the target" is the
    // single target (V110), which holds its instance.
    if (node.kind === 'watcher') {
      const targetId = roll.targets[0]!.targetId;
      remainder.push(
        watcherOutcome(
          { nodeId: node.id, targetId, locator: node.locator, clause: node.clause },
          node.spec,
          'target',
          input.conditionFacts?.targets.find(fact => fact.targetId === targetId)?.kind,
          input.actor.characteristics,
        ),
      );
      continue;
    }
    // V159: a modifier section is once per use and independent of the roll; it applies to the
    // single target (V110), which holds its instance.
    if (node.kind === 'modifier') {
      const targetId = roll.targets[0]!.targetId;
      remainder.push(
        modifierOutcome(
          { nodeId: node.id, targetId, locator: node.locator, clause: node.clause },
          node.spec,
          'target',
          input.conditionFacts?.targets.find(fact => fact.targetId === targetId)?.kind,
          input.actor.characteristics,
        ),
      );
      continue;
    }
    if (node.kind !== 'rider') continue;
    // V176: a stability replacement is executed in each push allowance; it is not table work.
    if (node.forcedMovement?.kind === 'stability-replaced') continue;
    // V176 `same-distance` reads the tier push allowances instead of condition outcomes.
    const tierPushes =
      node.forcedMovement?.kind === 'same-distance'
        ? remainder.filter((effect): effect is CompiledPushOutcome => effect.kind === 'push')
        : [];
    const after =
      node.dependency === 'after-damage'
        ? effects.map(effect => effect.nodeId)
        : node.dependency === 'after-effects'
          ? [...effects, ...(tierPushes.length ? tierPushes : tierConditions)].map(
              effect => effect.nodeId,
            )
          : [];
    const damageRequirements = effects
      .filter(effect => effect.kind === 'damage' && !effect.application)
      .map(effect => `damage:${effect.nodeId}.completion`);
    const requirements =
      node.dependency === 'after-movement'
        ? [
            'Actual table-resolved push and the printed movement prerequisite; a calculated allowance or disposition is not movement',
          ]
        : node.dependency === 'after-damage'
          ? damageRequirements
          : node.dependency === 'after-effects' && tierPushes.length
            ? [
                ...damageRequirements,
                ...tierPushes
                  .filter(effect => effect.subtotal === undefined)
                  .map(effect => `push:${effect.nodeId}.allowance`),
              ]
            : node.dependency === 'after-effects'
              ? [
                  ...damageRequirements,
                  ...tierConditions
                    .filter(effect => effect.status === 'fact-needed')
                    .map(effect => `condition:${effect.nodeId}.outcome`),
                ]
              : [];
    // "The same distance" with several targets on different tiers names no one distance. By
    // analogy with rule/dice/ability-roll.md ("the creature using the ability picks which tier of
    // rolled effect applies"), the table picks; this is an interpretation (Q-FM-2).
    const distances = [
      ...new Set(
        tierPushes.flatMap(effect => (effect.subtotal !== undefined ? [effect.subtotal] : [])),
      ),
    ].sort((a, b) => a - b);
    if (tierPushes.length && distances.length > 1)
      requirements.push(
        `The user picks which tier's push distance (${distances.join(' or ')}) the allies' push uses (Q-FM-2)`,
      );
    remainder.push({
      kind: 'rider',
      nodeId: node.id,
      targetId: roll.targets[0]!.targetId,
      locator: node.locator,
      clause: node.clause,
      shape: node.shape,
      dependency: node.dependency,
      after,
      requirements,
      status: requirements.length ? 'fact-needed' : 'manual',
      ...(node.lasting ? { lasting: node.lasting } : {}),
      ...(tierPushes.length && !requirements.length ? { distances } : {}),
    });
  }
  // V119, chapter/monster-basics.md, Creatures Who Grab ("only one creature … grabbed at a time
  // unless their stat block specifies otherwise"): one use never grabs several targets on its own.
  const grabs = remainder.filter(
    (e): e is CompiledConditionOutcome =>
      e.kind === 'condition' && e.condition === 'grabbed' && e.status === 'applied',
  );
  if (new Set(grabs.map(g => g.targetId)).size > 1)
    for (const grab of grabs) {
      grab.status = 'fact-needed';
      grab.requirements = [...grab.requirements, 'actor.grabLimit'];
    }
  return { kind: 'resolved', definition, roll, effects: [...effects, ...remainder] };
}

/** V157: a creature an effect-only use names, with the live values a gain changes. */
export interface EffectOnlyRecipient {
  id: string;
  kind: 'hero' | 'foe' | 'object' | 'squad';
  /** Required for a hero recipient; a hero without them keeps its gains manual. */
  temporaryStamina?: number;
  surges?: number;
}
export interface EffectOnlyInput {
  actor: EffectOnlyRecipient;
  /** V159: the user's characteristic scores, for a modifier "equal to your <score>". */
  actorCharacteristics?: Partial<Record<Characteristic, number>>;
  /** In the given order; the user is one of them only when the target shape allows self. */
  targets: EffectOnlyRecipient[];
  inCombat: boolean;
  resourcePool?: ResourcePoolFacts;
  /**
   * V173: the event an accepted offer answers. `damage` is the triggering damage (Stamina and
   * temporary Stamina the damaged creature lost, after immunity and weakness).
   */
  trigger?: {
    damage: number;
    /**
     * V174: the hit a damage-changing response revises: its current accepted revision for the
     * damaged creature (design 5b), loaded by the use from the triggering entry.
     */
    revision?: {
      hitEventId: string;
      targetId: string;
      kind: 'hero' | 'foe';
      current: DamageApplication;
    };
  };
  /** V174: the amount the user spends on the response's optional Spend section, if any. */
  spend?: number;
}
export type EffectOnlyOutcome =
  | { kind: 'manual'; definition: CompiledAbility; reason: string; effects: [] }
  | { kind: 'blocked'; definition: CompiledAbility; reason: string; effects: [] }
  | {
      kind: 'resolved';
      definition: CompiledAbility;
      cost?: CostApplication;
      warnings: string[];
      /** In printed order: each sentence's outcomes for its recipients in target order. */
      effects: CompiledEffectOutcome[];
      /** The final live values to write for each hero recipient whose gains applied. */
      writes: { id: string; temporaryStamina: number; surges: number }[];
    };

/**
 * V157 abilities without a power roll (docs/build/V157-effect-only-abilities.md#resolve). The saved
 * definition is validated as the rolled path's is: every section node re-reads from its clause,
 * the activation re-reads from the envelope, and target counts stay within the target shape.
 * Gains apply in printed order: temporary Stamina keeps the greater of the current and granted
 * amounts (rule/health/temporary-stamina.md); surges add (rule/resource/surge.md). Instructions
 * are rider outcomes that change no state.
 */
export function resolveEffectOnly(
  definition: CompiledAbility,
  input: EffectOnlyInput,
): EffectOnlyOutcome {
  const manual = (reason: string): EffectOnlyOutcome => ({
    kind: 'manual',
    definition,
    reason,
    effects: [],
  });
  if (
    definition.execution !== 'supported' ||
    definition.effectOnly !== true ||
    !definition.activation ||
    definition.metadata
  )
    return manual('Compiled envelope is not an executable ability without a power roll.');
  const activation = definition.activation;
  const shape = effectOnlyTarget(definition.envelope.target, definition.envelope.keywords);
  const usage = actionTypeOfUsage(definition.envelope.usage);
  const cost = definition.envelope.cost
    ? /^(\d+)\s+([A-Za-z]+)$/.exec(plain(definition.envelope.cost))
    : null;
  const expectedCost = cost
    ? { resource: cost[2]!.toLowerCase(), amount: Number(cost[1]) }
    : undefined;
  // V173: the one Trigger section re-reads to the saved trigger; it has no nodes of its own.
  const triggerBlocks = definition.envelope.blocks.filter(
    block => block.kind === 'section' && block.label === 'Trigger',
  );
  const triggerAgain =
    triggerBlocks.length === 1 && triggerBlocks[0]!.kind === 'section' && !triggerBlocks[0]!.cost
      ? triggerSection(triggerBlocks[0]!.text)
      : undefined;
  const triggered = usage === 'triggered action' || usage === 'free triggered action';
  if (
    triggered !== (definition.trigger !== undefined) ||
    triggerBlocks.length !== (triggered ? 1 : 0) ||
    (definition.trigger &&
      (!triggerAgain ||
        'unobserved' in triggerAgain ||
        !sameTriggerSpec(triggerAgain, definition.trigger)))
  )
    return manual('Compiled structure is outside the supported envelope.');
  // Every Effect section, read whole again, must give exactly the saved nodes in order.
  // V175: the Mark is read whole from its printed text, not sentence by sentence.
  const markAgain = definition.sections.some(node => node.kind === 'mark')
    ? readMarkAbility(definition.envelope)
    : undefined;
  const reread: {
    index: number;
    sentence: EffectOnlySentence | undefined;
    spend?: ResponseSpendClause | undefined;
    mark?: MarkSpec;
  }[] = definition.envelope.blocks.flatMap((block, index) =>
    block.kind === 'section' && block.label === 'Trigger' && triggered
      ? []
      : markAgain
        ? [{ index, sentence: undefined, mark: markAgain.spec }]
        : block.kind === 'section' && block.label === 'Effect' && !block.cost
          ? (readEffectOnlySection(block.text) ?? [undefined]).map(sentence => ({
              index,
              sentence,
            }))
          : [
              {
                index,
                sentence: undefined,
                // V174: a response's Spend section.
                spend:
                  block.kind === 'section' && block.cost && triggered
                    ? responseSpend(block.cost, block.text)
                    : undefined,
              },
            ],
  );
  if (
    definition.format !== 'salient.compiled-ability' ||
    definition.version !== 1 ||
    !shape ||
    JSON.stringify(shape) !== JSON.stringify(activation.targetShape) ||
    usage !== activation.actionType ||
    JSON.stringify(expectedCost) !== JSON.stringify(activation.fixedCost) ||
    (expectedCost && !Number.isSafeInteger(expectedCost.amount)) ||
    definition.tiers.length !== 3 ||
    definition.tiers.some(nodes => nodes.length) ||
    !definition.sections.length ||
    reread.length !== definition.sections.length ||
    definition.sections.some((node, index) => {
      const again = reread[index]!;
      // V174: the Spend section of a damage-changing response re-reads to the same spend.
      if (node.kind === 'response-spend') {
        const spend = again.spend;
        const { id: _id, locator, clause: _clause, ...saved } = node;
        void _id;
        void _clause;
        return (
          !spend ||
          !locator.startsWith(`block:${again.index}:`) ||
          !sameResponseSpend(spend, saved) ||
          (spend.effect.kind === 'potency' && !spendSubjectFits(spend, shape)) ||
          !definition.sections.some(other => other.kind === 'damage-revision')
        );
      }
      if (node.kind === 'mark')
        return (
          !again.mark ||
          node.locator !== `block:${again.index}:0` ||
          !sameMarkSpec(again.mark, node.spec) ||
          definition.sections.length !== 1 ||
          shape.kind !== 'one' ||
          shape.self
        );
      if (!again.sentence || !node.locator.startsWith(`block:${again.index}:`)) return true;
      if (
        node.kind !== 'gain' &&
        node.kind !== 'instruction' &&
        node.kind !== 'modifier' &&
        node.kind !== 'watcher' &&
        node.kind !== 'triggered-damage' &&
        node.kind !== 'damage-revision'
      )
        return true;
      const parsed = effectOnlyClause(node.clause);
      if (!parsed || parsed.text !== again.sentence.text) return true;
      const clause = parsed.clause;
      if (
        (parsed.singleTarget && shape.kind !== 'one' && shape.kind !== 'self') ||
        (clause.subject === 'actor' && shape.kind !== 'self') ||
        (parsed.trigger === 'damage' && !definition.trigger) ||
        (parsed.trigger === 'melee-strike' && definition.trigger?.from !== 'melee-strike') ||
        (parsed.trigger === 'damage-taken' && !revisionFits(clause, definition.trigger))
      )
        return true;
      if (node.kind === 'damage-revision') {
        const { id: _id, locator: _locator, clause: _text, ...saved } = node;
        void _id;
        void _locator;
        void _text;
        return JSON.stringify(saved) !== JSON.stringify(clause);
      }
      if (node.kind === 'triggered-damage')
        return (
          clause.kind !== 'triggered-damage' ||
          node.subject !== clause.subject ||
          node.damageType !== clause.damageType ||
          node.share !== clause.share
        );
      if (node.kind === 'watcher') {
        const again = effectOnlyWatcher(node.clause);
        return (
          clause.kind !== 'watcher' ||
          shape.kind === 'area' ||
          !again ||
          !sameWatcherSpec(again, node.spec) ||
          !sameWatcherSpec(clause.spec, node.spec)
        );
      }
      if (node.kind === 'modifier') {
        const again = effectOnlyModifier(node.clause);
        return (
          clause.kind !== 'modifier' ||
          !again ||
          !sameModifierSpec(again, node.spec) ||
          !sameModifierSpec(clause.spec, node.spec)
        );
      }
      return node.kind === 'gain'
        ? clause.kind !== 'gain' ||
            node.subject !== clause.subject ||
            node.temporaryStamina !== clause.temporaryStamina ||
            node.surges !== clause.surges
        : clause.kind !== 'instruction' ||
            node.subject !== clause.subject ||
            node.shape !== clause.shape ||
            node.after !== '';
    })
  )
    return manual('Compiled structure is outside the supported envelope.');
  // rule/combat/target.md: fewer targets are legal; the user is a target only when "self" is.
  const limit = effectOnlyTargetLimit(shape);
  const selfAllowed =
    shape.kind === 'self' ||
    ((shape.kind === 'one' || shape.kind === 'allies') && shape.self) ||
    ((shape.kind === 'area' || shape.kind === 'each') && shape.self === true);
  const includesSelf = input.targets.some(target => target.id === input.actor.id);
  const others = input.targets.filter(target => target.id !== input.actor.id).length;
  if (
    !input.targets.length ||
    new Set(input.targets.map(target => target.id)).size !== input.targets.length ||
    (limit !== undefined && input.targets.length > limit) ||
    // V159: "Self and each ally in the area" always names the user.
    // V171: so does "Self and each ally".
    ((shape.kind === 'self' ||
      ((shape.kind === 'area' || shape.kind === 'each') && shape.self === true)) &&
      !includesSelf) ||
    (includesSelf && !selfAllowed) ||
    (shape.kind === 'allies' && others > shape.max)
  )
    return manual(
      shape.kind === 'self'
        ? 'This ability targets only its user.'
        : (shape.kind === 'area' || shape.kind === 'each') && shape.self === true && !includesSelf
          ? `Include yourself: the target is Self and each ally${shape.kind === 'area' ? ' in the area' : ''}.`
          : `Give ${limit === 1 ? 'one target' : limit === undefined ? 'one or more distinct targets' : `one to ${limit} distinct targets`}${selfAllowed ? '' : ', not the user'}.`,
    );
  // V174: the optional Spend section is the use's only cost (the compiler admits no fixed cost
  // beside it). The printed amount, or at least it for "Spend 1+".
  const spendNode = definition.sections.find(node => node.kind === 'response-spend');
  if (input.spend !== undefined) {
    if (!spendNode) return manual(`${definition.name} has no Spend section the engine applies.`);
    if (
      !Number.isSafeInteger(input.spend) ||
      input.spend < spendNode.amount ||
      (!spendNode.variable && input.spend !== spendNode.amount)
    )
      return manual(
        `${spendNode.cost}: spend ${spendNode.variable ? `${spendNode.amount} or more` : spendNode.amount} ${spendNode.resource}.`,
      );
  }
  const affordability = checkAffordability(
    spendNode && input.spend !== undefined
      ? { resource: spendNode.resource, amount: input.spend }
      : activation.fixedCost,
    input.resourcePool,
    input.inCombat,
  );
  if (affordability.kind === 'blocked')
    return { kind: 'blocked', definition, reason: affordability.reason, effects: [] };
  const costApplication: CostApplication | undefined =
    affordability.kind === 'affordable'
      ? {
          ...affordability.cost,
          waived: false,
          before: affordability.before,
          after: affordability.after,
        }
      : affordability.kind === 'waived'
        ? {
            ...affordability.cost,
            waived: true,
            before: affordability.pool,
            after: affordability.pool,
          }
        : undefined;
  // The running values of each hero recipient, so several gains apply in printed order.
  const state = new Map<string, { temporaryStamina: number; surges: number }>();
  const recipientOf = (id: string) =>
    id === input.actor.id ? input.actor : input.targets.find(target => target.id === id)!;
  const effects: CompiledEffectOutcome[] = [];
  for (const node of definition.sections) {
    // V175: each target is marked by the user; only a hero or a foe outside a squad holds it.
    if (node.kind === 'mark') {
      for (const target of input.targets)
        effects.push({
          nodeId: node.id,
          targetId: target.id,
          locator: node.locator,
          clause: node.clause,
          kind: 'mark',
          spec: node.spec,
          ...(target.kind === 'hero' || target.kind === 'foe'
            ? { status: 'applied' as const, requirements: [] }
            : {
                status: 'manual' as const,
                requirements: [
                  `target:${target.id}.${target.kind} holds no mark the engine tracks (${target.kind === 'object' ? 'the Mark targets one creature' : 'a squad acts and takes damage as one'}); track it at the table`,
                ],
              }),
        });
      continue;
    }
    // V174: the revised hit, computed from its current accepted revision (design 5b).
    if (node.kind === 'damage-revision') {
      for (const target of input.targets) {
        const identity = {
          nodeId: node.id,
          targetId: target.id,
          locator: node.locator,
          clause: node.clause,
          kind: 'damage-revision' as const,
          share: node.share,
          instructions: node.instructions,
          ...(node.confirm ? { confirm: node.confirm } : {}),
          ...(node.potency ? { potency: node.potency } : {}),
        };
        const hit = input.trigger?.revision;
        effects.push(
          hit && hit.targetId === target.id
            ? {
                ...identity,
                status: 'calculated',
                hitEventId: hit.hitEventId,
                before: hit.current,
                application: halveApplication(hit.current, hit.kind),
                requirements: [],
              }
            : {
                ...identity,
                status: 'manual',
                requirements: [
                  'trigger.hit (used by hand: the table halves the damage and resolves the rest)',
                ],
              },
        );
      }
      continue;
    }
    if (node.kind === 'response-spend') {
      effects.push({
        nodeId: node.id,
        targetId: input.targets[0]!.id,
        locator: node.locator,
        clause: node.clause,
        kind: 'response-spend',
        status: input.spend !== undefined ? 'spent' : 'not-spent',
        resource: node.resource,
        ...(input.spend !== undefined ? { amount: input.spend } : {}),
        effect: node.effect,
        requirements: [],
      });
      continue;
    }
    if (node.kind === 'triggered-damage') {
      for (const target of input.targets) {
        const identity = {
          nodeId: node.id,
          targetId: target.id,
          locator: node.locator,
          clause: node.clause,
        };
        const triggering = input.trigger?.damage;
        effects.push(
          triggering !== undefined && Number.isSafeInteger(triggering) && triggering >= 0
            ? {
                ...identity,
                kind: 'triggered-damage',
                status: 'calculated',
                damageType: node.damageType,
                triggeringDamage: triggering,
                // rule/general/always-round-down.md: an odd number halved rounds down.
                amount: Math.floor(triggering / 2),
                requirements: [],
              }
            : {
                ...identity,
                kind: 'triggered-damage',
                status: 'manual',
                damageType: node.damageType,
                requirements: ['trigger.damage (used by hand: the table applies it)'],
              },
        );
      }
      continue;
    }
    if (
      node.kind !== 'gain' &&
      node.kind !== 'instruction' &&
      node.kind !== 'modifier' &&
      node.kind !== 'watcher'
    )
      continue;
    const subject = (
      node.kind === 'modifier' || node.kind === 'watcher'
        ? node.spec.subject === 'owner'
        : node.subject === 'actor'
    )
      ? 'actor'
      : 'target';
    const recipients =
      subject === 'actor' ? [input.actor.id] : input.targets.map(target => target.id);
    for (const id of recipients) {
      const identity = {
        nodeId: node.id,
        targetId: id,
        locator: node.locator,
        clause: node.clause,
      };
      if (node.kind === 'watcher') {
        effects.push(
          watcherOutcome(
            identity,
            node.spec,
            subject,
            recipientOf(id).kind,
            input.actorCharacteristics,
          ),
        );
        continue;
      }
      if (node.kind === 'modifier') {
        effects.push(
          modifierOutcome(
            identity,
            node.spec,
            subject,
            recipientOf(id).kind,
            input.actorCharacteristics,
          ),
        );
        continue;
      }
      if (node.kind === 'instruction') {
        effects.push({
          ...identity,
          kind: 'rider',
          status: 'manual',
          shape: node.shape,
          dependency: 'independent',
          after: [],
          requirements: [],
          ...(node.subject === 'target' ? { tier: true as const } : {}),
        });
        continue;
      }
      const recipient = recipientOf(id);
      const amounts = {
        ...(node.temporaryStamina !== undefined ? { temporaryStamina: node.temporaryStamina } : {}),
        ...(node.surges !== undefined ? { surges: node.surges } : {}),
      };
      const known =
        recipient.kind === 'hero' &&
        Number.isSafeInteger(recipient.temporaryStamina) &&
        Number.isSafeInteger(recipient.surges);
      if (!known) {
        effects.push({
          ...identity,
          kind: 'gain',
          status: 'manual',
          subject: node.subject,
          ...amounts,
          requirements: [
            recipient.kind === 'hero'
              ? `target:${id}.liveState`
              : `target:${id}.heroLiveState (a ${recipient.kind} records its gains at the table)`,
          ],
        });
        continue;
      }
      const before = state.get(id) ?? {
        temporaryStamina: recipient.temporaryStamina!,
        surges: recipient.surges!,
      };
      const after = {
        temporaryStamina:
          node.temporaryStamina === undefined
            ? before.temporaryStamina
            : Math.max(before.temporaryStamina, node.temporaryStamina),
        surges: node.surges === undefined ? before.surges : before.surges + node.surges,
      };
      state.set(id, after);
      effects.push({
        ...identity,
        kind: 'gain',
        status: 'applied',
        subject: node.subject,
        ...amounts,
        application: {
          ...(node.temporaryStamina !== undefined
            ? {
                temporaryStaminaBefore: before.temporaryStamina,
                temporaryStaminaAfter: after.temporaryStamina,
              }
            : {}),
          ...(node.surges !== undefined
            ? { surgesBefore: before.surges, surgesAfter: after.surges }
            : {}),
        },
        requirements: [],
      });
    }
  }
  return {
    kind: 'resolved',
    definition,
    ...(costApplication ? { cost: costApplication } : {}),
    warnings: affordability.kind === 'waived' ? affordability.warnings : [],
    effects,
    writes: [...state].map(([id, values]) => ({ id, ...values })),
  };
}
