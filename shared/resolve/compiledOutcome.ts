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
import { tierInstruction } from './effectRiders.ts';
import { lastingInstruction, type LastingSpec } from './lastingEffects.ts';
import {
  effectOnlyClause,
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
  stability?: number;
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
  /** Allowance before optional stability reduction; never an executed distance. */
  allowance?: number;
  stability?: number;
  stabilityReduction: 'optional';
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

export type CompiledEffectOutcome =
  | CompiledDamageOutcome
  | CompiledPushOutcome
  | CompiledConditionOutcome
  | CompiledManualOutcome
  | CompiledRiderOutcome
  | CompiledGainOutcome;

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
  const stability = target?.stability;
  if (stability === undefined || !Number.isSafeInteger(stability) || stability < 0)
    requirements.push(`target:${targetId}.stability`);
  if (!damageComplete) requirements.push(`damage:${node.after}.completion`);
  const subtotal = sizeBonus === undefined ? undefined : node.distance + sizeBonus;
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
    stabilityReduction: 'optional',
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
        (shape.kind !== 'single' && parsed.subject !== 'use')
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
  const tiers = definition.tiers.map(nodes => {
    const damage = nodes[0]?.kind === 'damage' ? nodes[0] : undefined;
    return {
      text: nodes.map(node => node.clause).join('; '),
      ...(damage ? { damage: damage.expression } : {}),
      ...(damage?.damageType ? { damageType: damage.damageType } : {}),
      unresolvedClauses: nodes.filter(node => node.kind === 'unsupported').map(node => node.clause),
    };
  }) as [TierDamageText, TierDamageText, TierDamageText];
  const roll = resolveAbilityRoll({ ...input, ability: { ...definition.metadata, tiers } });
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
    if (node.kind !== 'rider') continue;
    const after =
      node.dependency === 'after-damage'
        ? effects.map(effect => effect.nodeId)
        : node.dependency === 'after-effects'
          ? [...effects, ...tierConditions].map(effect => effect.nodeId)
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
          : node.dependency === 'after-effects'
            ? [
                ...damageRequirements,
                ...tierConditions
                  .filter(effect => effect.status === 'fact-needed')
                  .map(effect => `condition:${effect.nodeId}.outcome`),
              ]
            : [];
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
  /** In the given order; the user is one of them only when the target shape allows self. */
  targets: EffectOnlyRecipient[];
  inCombat: boolean;
  resourcePool?: ResourcePoolFacts;
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
  const usage = plain(definition.envelope.usage).toLowerCase();
  const cost = definition.envelope.cost
    ? /^(\d+)\s+([A-Za-z]+)$/.exec(plain(definition.envelope.cost))
    : null;
  const expectedCost = cost
    ? { resource: cost[2]!.toLowerCase(), amount: Number(cost[1]) }
    : undefined;
  // Every Effect section, read whole again, must give exactly the saved nodes in order.
  const reread = definition.envelope.blocks.flatMap((block, index) =>
    block.kind === 'section' && block.label === 'Effect' && !block.cost
      ? (readEffectOnlySection(block.text) ?? [undefined]).map(sentence => ({ index, sentence }))
      : [{ index, sentence: undefined }],
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
      if (!again.sentence || !node.locator.startsWith(`block:${again.index}:`)) return true;
      if (node.kind !== 'gain' && node.kind !== 'instruction') return true;
      const parsed = effectOnlyClause(node.clause);
      if (!parsed || parsed.text !== again.sentence.text) return true;
      const clause = parsed.clause;
      if (
        (parsed.singleTarget && shape.kind !== 'one' && shape.kind !== 'self') ||
        (clause.subject === 'actor' && shape.kind !== 'self')
      )
        return true;
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
    shape.kind === 'self' || ((shape.kind === 'one' || shape.kind === 'allies') && shape.self);
  const includesSelf = input.targets.some(target => target.id === input.actor.id);
  const others = input.targets.filter(target => target.id !== input.actor.id).length;
  if (
    !input.targets.length ||
    new Set(input.targets.map(target => target.id)).size !== input.targets.length ||
    (limit !== undefined && input.targets.length > limit) ||
    (shape.kind === 'self' && !includesSelf) ||
    (includesSelf && !selfAllowed) ||
    (shape.kind === 'allies' && others > shape.max)
  )
    return manual(
      shape.kind === 'self'
        ? 'This ability targets only its user.'
        : `Give ${limit === 1 ? 'one target' : limit === undefined ? 'one or more distinct targets' : `one to ${limit} distinct targets`}${selfAllowed ? '' : ', not the user'}.`,
    );
  const affordability = checkAffordability(
    activation.fixedCost,
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
    if (node.kind !== 'gain' && node.kind !== 'instruction') continue;
    const recipients =
      node.subject === 'actor' ? [input.actor.id] : input.targets.map(target => target.id);
    for (const id of recipients) {
      const identity = {
        nodeId: node.id,
        targetId: id,
        locator: node.locator,
        clause: node.clause,
      };
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
