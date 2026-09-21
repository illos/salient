// SPDX-License-Identifier: GPL-3.0-only
/**
 * R04 roll and damage resolution engine: pure functions over the types in
 * shared/contracts/rollResolution.ts. No dice generation, no storage, no authorization. Every
 * function names the section of docs/roll-and-damage-resolution.md it implements and does exactly
 * what that section states; unsupported negative rolled damage retains its section 11 label.
 *
 * Owning specifications: docs/roll-and-damage-resolution.md (all arithmetic),
 * docs/table-spec.md#v001-edge-and-bane-inputs (target-only counts), #v001-roll-characteristic-default,
 * #v001-critical-hits-and-additional-main-actions, #ability-costs-and-optional-spending,
 * #v001-temporary-stamina, #v001-catch-breath, #director-edits-to-inline-results (same dice, per-target
 * recompute). Pinned source: vendor/steel-compendium @ fb83a789da8f0327a389c277a0c790b1648d5810.
 */
import type {
  AbilityRollMetadata,
  AbilityRollRequest,
  AbilityRollResponse,
  AbilityRollResult,
  ActorRollFacts,
  CatchBreathRequest,
  CatchBreathResponse,
  Characteristic,
  CostApplication,
  CreatureFreeStrikeRequest,
  D10,
  DamageApplication,
  DamageBreakdown,
  DamageExpression,
  DamageInstance,
  DamageModifierEntry,
  DamageTargetFacts,
  EdgeBaneResolution,
  ManualResolution,
  PostRollCorrectionResult,
  PowerRollDice,
  ResourceCost,
  ResourcePoolFacts,
  SavingThrowRequest,
  SavingThrowResult,
  TargetRollInputs,
  TargetRollOutcome,
  TestDifficulty,
  TestOutcome,
  TestRollRequest,
  TestRollResult,
  Tier,
  TierDamageText,
} from '../contracts/rollResolution.ts';
import { matchesAbilityModifier } from '../evaluate/abilityModifiers.ts';

export const CHARACTERISTICS: Characteristic[] = ['M', 'A', 'R', 'I', 'P'];

// ---------------------------------------------------------------------------------------------
// Section 1: the power roll.

/** Section 1.2: the natural roll is the two dice alone. */
export function naturalRollOf(dice: PowerRollDice): number {
  return dice.d10a + dice.d10b;
}

/** Section 1.4: counts above two add nothing; net decides a ±2 modifier or a one-tier shift. */
export function resolveEdgeBane(edges: number, banes: number): EdgeBaneResolution {
  const effectiveEdges = Math.min(edges, 2) as 0 | 1 | 2;
  const effectiveBanes = Math.min(banes, 2) as 0 | 1 | 2;
  const net = (effectiveEdges - effectiveBanes) as -2 | -1 | 0 | 1 | 2;
  const modifier = net === 1 ? 2 : net === -1 ? -2 : 0;
  const tierShift = net === 2 ? 1 : net === -2 ? -1 : 0;
  return { edges, banes, effectiveEdges, effectiveBanes, net, modifier, tierShift };
}

/** Section 1.5: 11 or lower is tier 1, 12 to 16 tier 2, 17 or higher tier 3. */
export function baseTierOf(total: number): Tier {
  return total <= 11 ? 1 : total <= 16 ? 2 : 3;
}

/** Section 1.5: the base tier plus the double edge/bane shift, clamped to 1..3. */
export function tierOf(total: number, tierShift: -1 | 0 | 1): Tier {
  return Math.max(1, Math.min(3, baseTierOf(total) + tierShift)) as Tier;
}

/**
 * Section 1.8: the permitted characteristic with the highest current value, ties to the printed
 * order; an explicit override must be in the printed set. A stat block's fixed "Power Roll + N" has
 * no characteristic and uses `fixedRollBonus` (section 1.1).
 */
export function selectCharacteristic(
  ability: Pick<AbilityRollMetadata, 'permittedCharacteristics' | 'fixedRollBonus'>,
  actor: Pick<ActorRollFacts, 'characteristics'>,
  override?: Characteristic,
): { selected?: Characteristic; value: number } {
  if (ability.fixedRollBonus !== undefined) return { value: ability.fixedRollBonus };
  const permitted = ability.permittedCharacteristics;
  if (!permitted.length) return { value: 0 };
  if (override !== undefined) {
    if (!permitted.includes(override))
      throw new Error(
        `Characteristic ${override} is not permitted for this power roll (${permitted.join(' or ')}).`,
      );
    return { selected: override, value: actor.characteristics[override] };
  }
  let selected = permitted[0]!;
  for (const candidate of permitted.slice(1))
    if (actor.characteristics[candidate] > actor.characteristics[selected]) selected = candidate;
  return { selected, value: actor.characteristics[selected] };
}

// ---------------------------------------------------------------------------------------------
// Section 4.1: tier text into a damage expression plus verbatim unresolved clauses.

const LETTER_NAMES: Record<string, Characteristic> = {
  M: 'M',
  A: 'A',
  R: 'R',
  I: 'I',
  P: 'P',
  Might: 'M',
  Agility: 'A',
  Reason: 'R',
  Intuition: 'I',
  Presence: 'P',
};

/** Display markup only: link labels kept, bold removed, unicode minus normalized. */
export function plainText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^\n)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/[−–]/g, '-')
    .trim();
}

const DAMAGE_TYPES = '(?:acid|cold|corruption|fire|holy|lightning|poison|psychic|sonic|untyped)';
const DAMAGE_CLAUSE = new RegExp(
  `^(\\d+)(?:\\s*\\+\\s*([A-Za-z]+)(?:\\s+or\\s+([A-Za-z]+))?)?(?:\\s+(${DAMAGE_TYPES}))?\\s+damage$`,
  'i',
);

/**
 * Section 4.1: a flat number, `N + <letter>` or `N + M or A` (optionally typed) is a supported
 * damage clause; every other clause is kept verbatim as unresolved. Only the first supported damage
 * clause of a tier is taken; a second damage clause is unresolved (the contract has one damage
 * number per tier).
 */
export function parseTierText(text: string): TierDamageText {
  const result: TierDamageText = { text, unresolvedClauses: [] };
  for (const raw of text.split(';')) {
    const clause = raw.trim();
    if (!clause) continue;
    const match = result.damage ? null : DAMAGE_CLAUSE.exec(plainText(clause));
    if (!match) {
      result.unresolvedClauses.push(clause);
      continue;
    }
    const constant = Number(match[1]);
    const first = match[2] ? LETTER_NAMES[match[2]] : undefined;
    const second = match[3] ? LETTER_NAMES[match[3]] : undefined;
    if ((match[2] && !first) || (match[3] && !second) || !Number.isSafeInteger(constant)) {
      result.unresolvedClauses.push(clause);
      continue;
    }
    let damage: DamageExpression;
    if (first && second) damage = { kind: 'plusChoice', constant, choices: [first, second] };
    else if (first) damage = { kind: 'plusCharacteristic', constant, characteristic: first };
    else damage = { kind: 'flat', constant };
    result.damage = damage;
    if (match[4] && match[4].toLowerCase() !== 'untyped')
      result.damageType = match[4].toLowerCase();
  }
  return result;
}

// ---------------------------------------------------------------------------------------------
// Section 4.2 and 4.3: damage number.

function hasKeywords(keywords: string[], ...wanted: string[]): boolean {
  const plain = keywords.map(k => plainText(k).toLowerCase());
  return wanted.every(w => plain.includes(w));
}

/** Section 4.2: the kit bonus for the tier, or 0 when the rule does not apply. */
export function kitBonusFor(
  ability: Pick<
    AbilityRollMetadata,
    'keywords' | 'kitBonusesIncluded' | 'permittedCharacteristics' | 'fixedRollBonus'
  >,
  actor: ActorRollFacts,
  tier: Tier,
): number {
  const rolled =
    ability.permittedCharacteristics.length > 0 || ability.fixedRollBonus !== undefined;
  if (!rolled || ability.kitBonusesIncluded || actor.improvisedWeapon) return 0;
  if (hasKeywords(ability.keywords, 'melee', 'weapon') && actor.kitMeleeDamageBonus)
    return actor.kitMeleeDamageBonus[tier - 1];
  if (hasKeywords(ability.keywords, 'ranged', 'weapon') && actor.kitRangedDamageBonus)
    return actor.kitRangedDamageBonus[tier - 1];
  return 0;
}

/**
 * Section 4.1 and 4.3: `rolledDamage = tierConstant + damageCharacteristicValue + kitBonus`. A
 * Damage choices default to the highest permitted current score independently from the roll.
 * An explicit damage override must be among the expression’s permitted choices (confirmed Q-R-2).
 */
export function damageFor(
  expression: DamageExpression,
  actor: ActorRollFacts,
  _selectedCharacteristic: Characteristic | undefined,
  kitBonus: number,
  damageType?: string,
  damageCharacteristic?: Characteristic,
): DamageBreakdown | undefined {
  let characteristic: Characteristic | undefined;
  if (expression.kind === 'plusCharacteristic') characteristic = expression.characteristic;
  else if (expression.kind === 'plusChoice') {
    if (damageCharacteristic && !expression.choices.includes(damageCharacteristic))
      throw new Error(`Damage characteristic ${damageCharacteristic} is not permitted.`);
    characteristic =
      damageCharacteristic ??
      expression.choices.reduce((best, next) =>
        actor.characteristics[next] > actor.characteristics[best] ? next : best,
      );
  }
  const damageCharacteristicValue = characteristic ? actor.characteristics[characteristic] : 0;
  const rolledDamage = expression.constant + damageCharacteristicValue + kitBonus;
  return {
    tierConstant: expression.constant,
    ...(characteristic ? { damageCharacteristic: characteristic } : {}),
    damageCharacteristicValue,
    kitBonus,
    rolledDamage,
    ...(damageType ? { damageType } : {}),
    ...(rolledDamage < 0 ? { uncertainty: 'negative-rolled-damage' as const } : {}),
  };
}

// ---------------------------------------------------------------------------------------------
// Sections 1.3 to 1.7 and 4 for one target.

/**
 * One target's outcome from the shared natural roll: bonuses, that target's edges and banes, total,
 * tier with the confirmed natural 19/20 override, then the tier's damage clause.
 */
export function resolveTarget(
  ability: AbilityRollMetadata,
  actor: ActorRollFacts,
  naturalRoll: number,
  characteristicValue: number,
  selectedCharacteristic: Characteristic | undefined,
  inputs: TargetRollInputs,
  damageCharacteristic?: Characteristic,
): TargetRollOutcome {
  const edgeBane = resolveEdgeBane(inputs.edges, inputs.banes);
  // Section 1.3: bonuses and penalties add together, before edges and banes.
  const bonusTotal = (inputs.bonuses ?? []).reduce((sum, bonus) => sum + bonus.amount, 0);
  // Section 1.5.
  const total = naturalRoll + characteristicValue + bonusTotal + edgeBane.modifier;
  const baseTier = baseTierOf(total);
  const shifted = tierOf(total, edgeBane.tierShift);
  // Section 1.6: natural 19 or 20 is tier 3 regardless of any modifier, including a double bane.
  const natural = naturalRoll >= 19;
  const tier: Tier = natural ? 3 : shifted;
  const tierText = ability.tiers[tier - 1]!;
  const unresolvedClauses = [...tierText.unresolvedClauses];
  let damage: DamageBreakdown | undefined;
  if (tierText.damage) {
    damage = damageFor(
      tierText.damage,
      actor,
      selectedCharacteristic,
      kitBonusFor(ability, actor, tier),
      tierText.damageType,
      damageCharacteristic,
    );
    if (damage) {
      const bonuses = (actor.abilityDamageModifiers ?? [])
        .filter(modifier => matchesAbilityModifier(modifier, ability, tierText.damageType))
        .map(({ label, amount }) => ({ label, amount }));
      if (bonuses.length) {
        damage.buildBonuses = bonuses;
        damage.rolledDamage += bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      }
      if (inputs.extraDamage?.length) {
        damage.extraDamage = inputs.extraDamage;
        damage.rolledDamage += inputs.extraDamage.reduce((sum, bonus) => sum + bonus.amount, 0);
      }
    }
    if (!damage) unresolvedClauses.unshift(plainText(tierText.text.split(';')[0]!));
  }
  return {
    targetId: inputs.targetId,
    edgeBane,
    bonusTotal,
    total,
    baseTier,
    tier,
    tierText: tierText.text,
    ...(damage ? { damage } : {}),
    unresolvedClauses,
  };
}

// ---------------------------------------------------------------------------------------------
// Section 6: damage application.

function highest(entries: DamageModifierEntry[] | undefined, damageType?: string): number | 'all' {
  let best = 0;
  for (const entry of entries ?? []) {
    // Section 6.2: "all-damage" matches any type; a typed entry matches only its type; untyped damage
    // is matched only by untyped entries.
    const applies =
      entry.type === 'all-damage' || (damageType !== undefined && entry.type === damageType);
    if (!applies) continue;
    if (entry.value === 'all') return 'all';
    if (entry.value > best) best = entry.value;
  }
  return best;
}

/** Section 6.3: floor(maxStamina / 2). */
export function windedValueOf(maxStamina: number): number {
  return Math.floor(maxStamina / 2);
}

/** Sections 6.1 to 6.4 for one target and one damage instance. Pure: returns the record only. */
export function applyDamage(
  target: DamageTargetFacts,
  instance: DamageInstance,
): DamageApplication {
  const incoming = instance.manualDamageOverride ?? instance.amount;
  const weakness = highest(target.weaknesses, instance.damageType);
  const immunity = highest(target.immunities, instance.damageType);
  // Section 6.2: only the highest weakness and immunity apply; weakness first, then immunity.
  const weaknessApplied = weakness === 'all' ? 0 : weakness;
  const afterWeakness = incoming + weaknessApplied;
  const afterImmunity = immunity === 'all' ? 0 : Math.max(0, afterWeakness - immunity);
  // Section 6.1 step 4: temporary Stamina decreases first.
  const absorbed = Math.min(target.temporaryStamina, afterImmunity);
  const temporaryStaminaAfter = target.temporaryStamina - absorbed;
  // Step 5: the leftover reduces Stamina with no floor (6.4 interpretation).
  const staminaDelta = afterImmunity - absorbed;
  const staminaAfter = target.stamina - staminaDelta;
  const windedValue = windedValueOf(target.maxStamina);
  const application: DamageApplication = {
    targetId: target.targetId,
    incoming,
    weaknessApplied,
    immunityApplied: immunity,
    afterImmunity,
    absorbedByTemporaryStamina: absorbed,
    temporaryStaminaBefore: target.temporaryStamina,
    temporaryStaminaAfter,
    staminaDelta,
    staminaBefore: target.stamina,
    staminaAfter,
    windedValue,
    windedBefore: target.stamina <= windedValue,
    windedAfter: staminaAfter <= windedValue,
  };
  if (target.kind === 'foe') application.slain = staminaAfter <= 0;
  else {
    application.dying = staminaAfter <= 0;
    application.deadThresholdReached = staminaAfter <= -windedValue;
  }
  return application;
}

/** Section 4.4: a Director-controlled creature's free strike never rolls. */
export function resolveCreatureFreeStrike(
  request: CreatureFreeStrikeRequest,
  target: DamageTargetFacts,
): DamageApplication {
  return applyDamage(target, {
    targetId: target.targetId,
    amount: request.freeStrikeValue,
    ...(request.damageType ? { damageType: request.damageType } : {}),
    causeLabel: 'free strike',
  });
}

// ---------------------------------------------------------------------------------------------
// Section 9: affordability.

export type Affordability =
  | { kind: 'none' }
  | { kind: 'waived'; cost: ResourceCost; pool: number; warnings: string[] }
  | { kind: 'affordable'; cost: ResourceCost; before: number; after: number }
  | { kind: 'blocked'; cost: ResourceCost; poolBefore: number; reason: string };

function resourceLabel(resource: string): string {
  return resource.charAt(0).toUpperCase() + resource.slice(1);
}

/** Class heroic resources whose cost is waived outside combat, with the source of that rule. */
const OUTSIDE_COMBAT_WAIVER_SOURCES: Record<string, string> = {
  essence: 'elementalist/level-1/essence',
  ferocity: 'fury/level-1/ferocity',
  insight: 'shadow/level-1/insight',
  focus: 'tactician/level-1/focus',
  wrath: 'censor/level-1/wrath',
  piety: 'conduit/level-1/piety',
  drama: 'troubadour/level-1/drama',
  discipline: 'null/level-1/discipline',
  clarity: 'talent/level-1/clarity-and-strain',
};

/**
 * Section 9: `affordable = fixedCost == none || waived || (pool − amount) >= legalFloor`. The class
 * heroic resource cost (ferocity, essence, insight) is waived outside combat; a prior outside-combat
 * use is a warning, never a block.
 * A pool that is absent while a cost exists is an unresolved fact and is reported as blocked with
 * that reason (the contract permits no implicit waiver).
 */
export function checkAffordability(
  fixedCost: ResourceCost | undefined,
  pool: ResourcePoolFacts | undefined,
  inCombat: boolean,
): Affordability {
  if (!fixedCost) return { kind: 'none' };
  const waiverSource = OUTSIDE_COMBAT_WAIVER_SOURCES[fixedCost.resource];
  const waived = waiverSource !== undefined && pool?.resource === fixedCost.resource && !inCombat;
  if (waived) {
    const warnings: string[] = [];
    if (pool?.usedOutsideCombatSinceLastVictoryOrRespite)
      warnings.push(
        `Rule warning: this ability was already used outside combat since the last Victory or respite (feature/${waiverSource}.md).`,
      );
    return { kind: 'waived', cost: fixedCost, pool: pool?.current ?? 0, warnings };
  }
  if (!pool || pool.resource !== fixedCost.resource)
    return {
      kind: 'blocked',
      cost: fixedCost,
      poolBefore: pool?.current ?? 0,
      reason: `${resourceLabel(fixedCost.resource)} pool is not recorded for the actor; the cost of ${fixedCost.amount} cannot be checked.`,
    };
  const after = pool.current - fixedCost.amount;
  if (after < pool.legalFloor)
    return {
      kind: 'blocked',
      cost: fixedCost,
      poolBefore: pool.current,
      reason: `${resourceLabel(fixedCost.resource)} ${pool.current} < cost ${fixedCost.amount}`,
    };
  return { kind: 'affordable', cost: fixedCost, before: pool.current, after };
}

// ---------------------------------------------------------------------------------------------
// The shared ability roll (sections 1, 2, 4, 6, 9).

export interface AbilityRollInput extends AbilityRollRequest {
  /** Facts of each target in `targets` order; a target without facts gets an outcome but no damage. */
  targetFacts: DamageTargetFacts[];
  /** Verbatim Effect clauses printed after the tiers; recorded as manual, never applied (4.5). */
  effectClauses?: { label: string; text: string }[];
}

/**
 * One ability use: affordability first (blocked means nothing else happened), then one natural roll
 * evaluated per target, critical recognition, and damage application in target order.
 */
export function resolveAbilityRoll(input: AbilityRollInput): AbilityRollResponse {
  const { ability, actor } = input;
  const affordability = checkAffordability(ability.fixedCost, input.resourcePool, input.inCombat);
  if (affordability.kind === 'blocked')
    return {
      kind: 'blocked',
      abilityId: ability.abilityId,
      actorId: actor.actorId,
      cost: affordability.cost,
      poolBefore: affordability.poolBefore,
      reason: affordability.reason,
    };
  const warnings: string[] = [];
  let cost: CostApplication | undefined;
  if (affordability.kind === 'affordable')
    cost = {
      resource: affordability.cost.resource,
      amount: affordability.cost.amount,
      waived: false,
      before: affordability.before,
      after: affordability.after,
    };
  else if (affordability.kind === 'waived') {
    cost = {
      resource: affordability.cost.resource,
      amount: affordability.cost.amount,
      waived: true,
      before: affordability.pool,
      after: affordability.pool,
    };
    warnings.push(...affordability.warnings);
  }
  const { selected, value } = selectCharacteristic(ability, actor, input.selectedCharacteristic);
  const naturalRoll = naturalRollOf(input.dice);
  const naturalNineteenOrTwenty = naturalRoll >= 19;
  // Section 2: an ability roll made as a main action; a natural 19 or 20 before modifiers.
  const criticalHit = naturalNineteenOrTwenty && ability.actionType === 'main action';
  const targets = input.targets.map(inputs =>
    resolveTarget(
      ability,
      actor,
      naturalRoll,
      value,
      selected,
      inputs,
      input.selectedDamageCharacteristic,
    ),
  );
  const manualResolutions: ManualResolution[] = [];
  const damageApplications: DamageApplication[] = [];
  // Section 4.5: damage for every target first; everything else is recorded, not inferred.
  for (const outcome of targets) {
    const facts = input.targetFacts.find(f => f.targetId === outcome.targetId);
    if (!outcome.damage || !facts) continue;
    if (outcome.damage.uncertainty === 'negative-rolled-damage') {
      manualResolutions.push({
        targetId: outcome.targetId,
        sourceClause: outcome.tierText,
        note: `Rolled damage ${outcome.damage.rolledDamage} is negative; recorded, not applied (R04 4.3).`,
      });
      continue;
    }
    damageApplications.push(
      applyDamage(facts, {
        targetId: outcome.targetId,
        amount: outcome.damage.rolledDamage,
        ...(outcome.damage.damageType ? { damageType: outcome.damage.damageType } : {}),
        causeLabel: ability.name,
      }),
    );
  }
  for (const effect of input.effectClauses ?? [])
    manualResolutions.push({
      sourceClause: `${effect.label}: ${effect.text}`,
      note: 'Effect clause recorded verbatim for manual resolution; not automated (R04 4.5).',
    });
  const result: AbilityRollResult = {
    kind: 'resolved',
    abilityId: ability.abilityId,
    actorId: actor.actorId,
    dice: input.dice,
    naturalRoll,
    naturalNineteenOrTwenty,
    ...(selected ? { selectedCharacteristic: selected } : {}),
    ...(input.selectedDamageCharacteristic
      ? { selectedDamageCharacteristic: input.selectedDamageCharacteristic }
      : {}),
    characteristicValue: value,
    criticalHit,
    additionalMainActionOffered: criticalHit,
    ...(cost ? { cost } : {}),
    targets,
    damageApplications,
    ...(manualResolutions.length ? { manualResolutions } : {}),
    warnings,
  };
  return result;
}

// ---------------------------------------------------------------------------------------------
// Section 3: post-roll edge and bane corrections.

/**
 * Recomputes one target with the same dice and corrected counts (sections 1.3 to 1.6 and 4 again).
 * `applied` is the damage application currently effective for that target (absent when no damage
 * was applied); `currentTarget` holds the target's present pools. The reconstruction restores the
 * pools the applied record consumed (temporary Stamina first, then Stamina), then applies the
 * corrected damage once through section 6, so the delta reconciles without dealing damage twice.
 */
export function correctTarget(
  ability: AbilityRollMetadata,
  actor: ActorRollFacts,
  original: Pick<
    AbilityRollResult,
    'dice' | 'characteristicValue' | 'selectedCharacteristic' | 'selectedDamageCharacteristic'
  >,
  originalEventId: string,
  before: TargetRollOutcome,
  applied: DamageApplication | undefined,
  currentTarget: DamageTargetFacts | undefined,
  edges: number,
  banes: number,
): PostRollCorrectionResult {
  if (edges < 0 || banes < 0) throw new Error('Edge and bane counts cannot be negative.');
  const naturalRoll = naturalRollOf(original.dice);
  const after = resolveTarget(
    ability,
    actor,
    naturalRoll,
    original.characteristicValue,
    original.selectedCharacteristic,
    { targetId: before.targetId, edges, banes },
    original.selectedDamageCharacteristic,
  );
  const result: PostRollCorrectionResult = {
    originalEventId,
    targetId: before.targetId,
    dice: original.dice,
    before,
    after,
    staminaReconciliationDelta: 0,
    temporaryStaminaReconciliationDelta: 0,
  };
  if (!currentTarget) return result;
  const restored: DamageTargetFacts = {
    ...currentTarget,
    temporaryStamina: currentTarget.temporaryStamina + (applied?.absorbedByTemporaryStamina ?? 0),
    stamina: currentTarget.stamina + (applied?.staminaDelta ?? 0),
  };
  const newDamage =
    after.damage && after.damage.uncertainty !== 'negative-rolled-damage'
      ? after.damage.rolledDamage
      : undefined;
  if (newDamage === undefined) {
    // No supported damage after the correction: the previously applied damage is restored in full.
    result.staminaReconciliationDelta = restored.stamina - currentTarget.stamina;
    result.temporaryStaminaReconciliationDelta =
      restored.temporaryStamina - currentTarget.temporaryStamina;
    return result;
  }
  const reapplied = applyDamage(restored, {
    targetId: currentTarget.targetId,
    amount: newDamage,
    ...(after.damage?.damageType ? { damageType: after.damage.damageType } : {}),
    causeLabel: ability.name,
  });
  result.damageAfter = reapplied;
  result.staminaReconciliationDelta = reapplied.staminaAfter - currentTarget.stamina;
  result.temporaryStaminaReconciliationDelta =
    reapplied.temporaryStaminaAfter - currentTarget.temporaryStamina;
  return result;
}

// ---------------------------------------------------------------------------------------------
// Section 7: Catch Breath.

/** Section 7: `recoveryValue = floor(maxStamina / 3)`. */
export function recoveryValueOf(maxStamina: number): number {
  return Math.floor(maxStamina / 3);
}

/** Section 7: one Recovery; Stamina regained up to the confirmed maximum; temporary Stamina untouched. */
export function resolveCatchBreath(request: CatchBreathRequest): CatchBreathResponse {
  if (request.recoveries === undefined)
    return {
      kind: 'blocked',
      actorId: request.actorId,
      reason:
        'Director-controlled creatures have no Recoveries (rule/health/stamina.md, No Recoveries).',
    };
  if (request.recoveries < 1)
    return { kind: 'blocked', actorId: request.actorId, reason: 'No Recoveries left to spend.' };
  const recoveryValue = recoveryValueOf(request.maxStamina);
  const uncapped = request.stamina + recoveryValue;
  const staminaAfter = Math.min(request.maxStamina, uncapped);
  const healed = staminaAfter - request.stamina;
  const capApplied = uncapped > request.maxStamina;
  const warnings: string[] = [];
  if (request.dying)
    warnings.push(
      'Rule warning: a dying creature cannot use the Catch Breath maneuver (feature/common/maneuvers/catch-breath.md); dying is not automated in v0.01.',
    );
  if (healed === 0)
    warnings.push('Already at the Stamina maximum: the Recovery is spent and 0 healed.');
  return {
    kind: 'resolved',
    actorId: request.actorId,
    recoveryValue,
    recoveriesBefore: request.recoveries,
    recoveriesAfter: request.recoveries - 1,
    staminaBefore: request.stamina,
    staminaAfter,
    healed,
    capApplied,
    temporaryStaminaUnchanged: request.temporaryStamina,
    warnings,
  };
}

// ---------------------------------------------------------------------------------------------
// Section 5: direct tests. Section 8: saving throws.

/** Section 5, Test Difficulty Outcomes table; natural 19 or 20 is a reward at any difficulty. */
export function testOutcome(
  tier: Tier,
  criticalSuccess: boolean,
  difficulty: TestDifficulty,
): TestOutcome {
  if (criticalSuccess) return 'Success with a reward';
  const table: Record<TestDifficulty, [TestOutcome, TestOutcome, TestOutcome]> = {
    easy: ['Success with a consequence', 'Success', 'Success with a reward'],
    medium: ['Failure', 'Success with a consequence', 'Success'],
    hard: ['Failure with a consequence', 'Failure', 'Success'],
  };
  return table[difficulty][tier - 1];
}

export function resolveTestRoll(request: TestRollRequest): TestRollResult {
  const naturalRoll = naturalRollOf(request.dice);
  const skillBonus: 0 | 2 = request.skill ? 2 : 0;
  const otherBonuses = (request.otherBonuses ?? []).reduce((sum, b) => sum + b.amount, 0);
  const edgeBane = resolveEdgeBane(request.edges, request.banes);
  const bonusTotal = skillBonus + otherBonuses;
  const total = naturalRoll + request.characteristicValue + bonusTotal + edgeBane.modifier;
  const criticalSuccess = naturalRoll >= 19;
  const tier: Tier = criticalSuccess ? 3 : tierOf(total, edgeBane.tierShift);
  return {
    actorId: request.actorId,
    dice: request.dice,
    naturalRoll,
    characteristic: request.characteristic,
    characteristicValue: request.characteristicValue,
    skillBonus,
    bonusTotal,
    edgeBane,
    total,
    tier,
    criticalSuccess,
    ...(request.difficulty
      ? {
          difficulty: request.difficulty,
          outcome: testOutcome(tier, criticalSuccess, request.difficulty),
        }
      : {}),
  };
}

/** Section 8: `success = d10 >= threshold`, threshold 6 unless a supplied fact says otherwise. */
export function resolveSavingThrow(request: SavingThrowRequest): SavingThrowResult {
  const threshold = request.threshold ?? 6;
  return {
    actorId: request.actorId,
    condition: request.condition,
    d10: request.d10,
    threshold,
    success: request.d10 >= threshold,
  };
}

export type { D10 };
