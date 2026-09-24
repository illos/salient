// SPDX-License-Identifier: GPL-3.0-only
/** V26 pure evaluation. Results describe calculations, never persisted or spatial changes. */
import type {
  AbilityRollBlocked,
  AbilityRollResult,
  DamageApplication,
  DamageBreakdown,
  TierDamageText,
} from '../contracts/rollResolution.ts';
import type { CompiledAbility, CompiledNode, PushNode, ConditionNode } from './compileAbility.ts';
import { effectRider, plain, targetShapeDetail, type Characteristic } from './abilityGrammar.ts';
import type { RiderNode } from './compileAbility.ts';
import { plainText, resolveAbilityRoll, type AbilityRollInput } from './index.ts';

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
    }[];
    potency?: { characteristic: Characteristic; weak: number; average: number; strong: number };
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
  status: 'applied' | 'resisted' | 'fact-needed' | 'manual';
  after: string;
  characteristic: Characteristic;
  threshold?: number;
  thresholdSource: ConditionNode['threshold'];
  potencyCharacteristic?: Characteristic;
  targetScore?: number;
  condition: ConditionNode['condition'];
  duration: 'save-ends';
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
  const rawThreshold =
    node.threshold.kind === 'printed' ? node.threshold.value : potency?.[node.threshold.tier];
  const threshold = Number.isSafeInteger(rawThreshold) ? rawThreshold : undefined;
  if (threshold === undefined)
    requirements.push(
      `actor.potency.${node.threshold.kind === 'potency' ? node.threshold.tier : 'printed'}`,
    );
  const eligible = target?.kind === 'hero' || target?.kind === 'foe';
  if (!eligible) requirements.push(`target:${targetId}.evaluatedCreatureCharacteristics`);
  const rawScore = eligible ? target.characteristics?.[node.characteristic] : undefined;
  const targetScore = Number.isSafeInteger(rawScore) ? rawScore : undefined;
  if (targetScore === undefined)
    requirements.push(`target:${targetId}.characteristics.${node.characteristic}`);
  if (!damageComplete) requirements.push(`damage:${node.after}.completion`);
  return {
    kind: 'condition',
    nodeId: node.id,
    targetId,
    locator: node.locator,
    clause: node.clause,
    after: node.after,
    characteristic: node.characteristic,
    thresholdSource: node.threshold,
    ...(threshold !== undefined ? { threshold } : {}),
    ...(targetScore !== undefined ? { targetScore } : {}),
    ...(node.threshold.kind === 'potency' && potency
      ? { potencyCharacteristic: potency.characteristic }
      : {}),
    condition: node.condition,
    duration: node.duration,
    requirements,
    status: requirements.length
      ? 'fact-needed'
      : targetScore! < threshold!
        ? 'applied'
        : 'resisted',
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
}

export type CompiledEffectOutcome =
  | CompiledDamageOutcome
  | CompiledPushOutcome
  | CompiledConditionOutcome
  | CompiledManualOutcome
  | CompiledRiderOutcome;

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
  const keywords = definition.metadata!.keywords.map(k => plainText(k).toLowerCase());
  const qualifies = keywords.includes('melee') && keywords.includes('weapon');
  let sizeBonus: number | undefined;
  if (!qualifies) sizeBonus = 0;
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
    instruction:
      'Ordinary push: up to the allowance, including zero, in a straight line away from the source; each square must be farther away. No route or destination is established.',
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
    definition.sections.some(node => {
      if (node.kind !== 'rider') return true;
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
        nodes.filter(node => node.kind === 'damage').length !== 1 ||
        nodes.some(
          (node, index) =>
            node.kind === 'condition' &&
            (nodes.length !== 2 ||
              index !== 1 ||
              nodes[0]?.kind !== 'damage' ||
              nodes[0].id !== node.after ||
              node.duration !== 'save-ends' ||
              (node.threshold.kind === 'printed' && !Number.isSafeInteger(node.threshold.value))),
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
            (!Number.isSafeInteger(node.distance) ||
              node.distance < 0 ||
              node.distance >= Number.MAX_SAFE_INTEGER ||
              !nodes.some(prior => prior.kind === 'damage' && prior.id === node.after)),
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
    const damage = nodes.find(node => node.kind === 'damage')!;
    if (damage.kind !== 'damage') throw new Error('Missing compiled damage node.');
    return {
      text: nodes.map(node => node.clause).join('; '),
      damage: damage.expression,
      ...(damage.damageType ? { damageType: damage.damageType } : {}),
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
        remainder.push(conditionOutcome(node, target.targetId, input, !!application));
      } else if (node.kind === 'push') {
        remainder.push(pushOutcome(node, target.targetId, definition, input, !!application));
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
  // Sections occur once per use, after tier effects in printed order; never one award per target.
  // Multi/area envelopes admit only use-subject sections, addressed through the first target.
  for (const node of definition.sections) {
    if (node.kind !== 'rider') continue;
    const after = node.dependency === 'after-damage' ? effects.map(effect => effect.nodeId) : [];
    const requirements =
      node.dependency === 'after-movement'
        ? [
            'Actual table-resolved push and the printed movement prerequisite; a calculated allowance or disposition is not movement',
          ]
        : node.dependency === 'after-damage'
          ? effects
              .filter(effect => effect.kind === 'damage' && !effect.application)
              .map(effect => `damage:${effect.nodeId}.completion`)
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
    });
  }
  return { kind: 'resolved', definition, roll, effects: [...effects, ...remainder] };
}
