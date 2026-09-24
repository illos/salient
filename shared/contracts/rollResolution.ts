// SPDX-License-Identifier: GPL-3.0-only
/**
 * R04 roll and damage resolution contract: input/output types only, no logic.
 * Every field maps to a numbered section of docs/roll-and-damage-resolution.md.
 * Pinned source: vendor/steel-compendium @ fb83a789da8f0327a389c277a0c790b1648d5810.
 */

export type Characteristic = 'M' | 'A' | 'R' | 'I' | 'P';
export type Tier = 1 | 2 | 3;
export type D10 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ActionType =
  | 'main action'
  | 'maneuver'
  | 'move action'
  | 'triggered action'
  | 'free triggered action'
  | 'free maneuver';
export type TestDifficulty = 'easy' | 'medium' | 'hard';
export type TestOutcome =
  | 'Failure with a consequence'
  | 'Failure'
  | 'Success with a consequence'
  | 'Success'
  | 'Success with a reward';

/**
 * Labels for provisional behavior (section 11): open user question ids, plus
 * `negative-rolled-damage` for a negative section 4.3 result (unreachable with v0.01 content).
 */
export type UncertaintyId = 'negative-rolled-damage';

/** Pinned source citation for a quoted clause or ability. */
export interface SourceRef {
  path: string;
  revision: string;
  id: string;
}

/** Roll modifiers a caller supplies for one target (section 1.3, 1.4). Counts are nonnegative integers. */
export interface TargetRollInputs {
  targetId: string;
  edges: number;
  banes: number;
  /** Labeled numeric bonuses/penalties, added before edges and banes; penalties negative. */
  bonuses?: LabeledBonus[];
  /**
   * Flat damage added to this target's rolled damage after the tier is known (V02: each additional
   * squad minion adds its free strike value; an attached captain's printed strike damage bonus).
   * Recorded on the breakdown; never changes the tier.
   */
  extraDamage?: LabeledBonus[];
}

export interface LabeledBonus {
  label: string;
  amount: number;
}

/** Dice the shared dice service produced; never chosen by a client (section 1.1, 1.2). */
export interface PowerRollDice {
  d10a: D10;
  d10b: D10;
}

/** The parsed damage clause of one tier (section 4.1). Anything else is an unresolved clause. */
export type DamageExpression =
  | { kind: 'flat'; constant: number }
  | { kind: 'plusCharacteristic'; constant: number; characteristic: Characteristic }
  | { kind: 'plusChoice'; constant: number; choices: Characteristic[] };

export interface TierDamageText {
  /** Verbatim tier text from the source, e.g. "7 + M or A damage". */
  text: string;
  damage?: DamageExpression;
  damageType?: string;
  /** Remaining verbatim clauses that are not supported damage (push, potency conditions, ...). */
  unresolvedClauses: string[];
}

/** Ability metadata the resolver needs (sections 1.8, 2, 4.2, 9). */
export interface AbilityRollMetadata {
  abilityId: string;
  name: string;
  source: SourceRef;
  actionType: ActionType;
  keywords: string[];
  /** Permitted roll characteristics in printed order; a monster's fixed "+2" uses `fixedRollBonus`. */
  permittedCharacteristics: Characteristic[];
  fixedRollBonus?: number;
  tiers: [TierDamageText, TierDamageText, TierDamageText];
  /** Fixed activation cost from the source, if any (e.g. { resource: "ferocity", amount: 5 }). */
  fixedCost?: ResourceCost;
  /** True for a kit's own signature ability: its damage already includes the kit bonus. */
  kitBonusesIncluded: boolean;
}

export interface ResourceCost {
  resource: string;
  amount: number;
}

/** Actor facts for a roll (sections 1.1, 1.8, 4.2). */
export interface ActorRollFacts {
  actorId: string;
  /**
   * V156: a class feature that lowers a heroic ability's cost when the actor has an edge or double
   * edge on its power roll (feature/shadow/level-1/insight.md: "costs 1 fewer insight").
   */
  edgeCostReduction?: { resource: string; amount: number; sourcePath: string };
  characteristics: Record<Characteristic, number>;
  /** Kit bonuses by tier index 0..2, e.g. Mountain [0, 0, 4]. Absent when the actor has no kit. */
  kitMeleeDamageBonus?: [number, number, number];
  kitRangedDamageBonus?: [number, number, number];
  /** Permanent sourced build bonuses; keyword requirements are all-match. */
  abilityDamageModifiers?: {
    label: string;
    amount: number;
    keywords: string[];
    alternative?: { ability: string; damageType: string };
  }[];
  /** Supplied fact; the app cannot observe the weapon. Default false. */
  improvisedWeapon?: boolean;
  /**
   * V115 (feature/tactician/level-1/field-arsenal.md): a kit signature's printed kit bonus replaced
   * by the other kit's chosen bonus. Per-tier deltas (added − printed) keyed by signature name and
   * kit source path.
   */
  kitSignatureAdjustments?: {
    ability: string;
    sourcePath: string;
    meleeDamage?: [number, number, number];
    rangedDamage?: [number, number, number];
  }[];
}

/** V115 (rule/combat/distance.md, Melee or Ranged): how a Melee-and-Ranged ability is used. */
export type AbilityMode = 'melee' | 'ranged';

/** Input to the shared ability-roll operation (sections 1 to 4, 9). */
export interface AbilityRollRequest {
  ability: AbilityRollMetadata;
  actor: ActorRollFacts;
  /** Explicit pre-fire override; otherwise the highest permitted characteristic is selected. */
  selectedCharacteristic?: Characteristic;
  /** Explicit damage choice, independent of the roll; absent defaults to highest permitted. */
  selectedDamageCharacteristic?: Characteristic;
  /** V115: required when a Melee-and-Ranged ability's outcome depends on the mode. */
  selectedMode?: AbilityMode;
  targets: TargetRollInputs[];
  dice: PowerRollDice;
  inCombat: boolean;
  /** Current pool for the fixed cost's resource (section 9). */
  resourcePool?: ResourcePoolFacts;
}

export interface ResourcePoolFacts {
  resource: string;
  current: number;
  /** Lowest legal balance after spending; 0 unless a class rule supplies a negative range. */
  legalFloor: number;
  /** Recorded prior outside-combat use of this ability since the last Victory or respite. */
  usedOutsideCombatSinceLastVictoryOrRespite?: boolean;
}

/** Edge/bane arithmetic for one target (section 1.4). */
export interface EdgeBaneResolution {
  edges: number;
  banes: number;
  effectiveEdges: 0 | 1 | 2;
  effectiveBanes: 0 | 1 | 2;
  net: -2 | -1 | 0 | 1 | 2;
  modifier: -2 | 0 | 2;
  tierShift: -1 | 0 | 1;
}

/** Per-target roll outcome (sections 1.5 to 1.7, 2, 4). */
export interface TargetRollOutcome {
  targetId: string;
  edgeBane: EdgeBaneResolution;
  bonusTotal: number;
  total: number;
  baseTier: Tier;
  tier: Tier;
  /** Reserved for unresolved arithmetic facts; confirmed natural precedence needs no label. */
  uncertainty?: UncertaintyId;
  /** Verbatim tier text applied to this target. */
  tierText: string;
  damage?: DamageBreakdown;
  unresolvedClauses: string[];
}

/** Section 4.3. */
export interface DamageBreakdown {
  tierConstant: number;
  damageCharacteristic?: Characteristic;
  damageCharacteristicValue: number;
  kitBonus: number;
  /** Applied separately from kit bonuses; source tier text remains unchanged. */
  buildBonuses?: LabeledBonus[];
  /** Per-target flat additions supplied by the caller (V02 squad contributors, captain benefit). */
  extraDamage?: LabeledBonus[];
  rolledDamage: number;
  damageType?: string;
  /** Negative rolled damage is recorded, never applied as healing. */
  uncertainty?: UncertaintyId;
}

/** Output of the shared ability-roll operation when it executed. */
export interface AbilityRollResult {
  kind: 'resolved';
  abilityId: string;
  actorId: string;
  dice: PowerRollDice;
  naturalRoll: number;
  naturalNineteenOrTwenty: boolean;
  selectedCharacteristic?: Characteristic;
  /** Explicit damage choice, independent of the roll; absent defaults to highest permitted. */
  selectedDamageCharacteristic?: Characteristic;
  /** V115: the chosen mode of a Melee-and-Ranged ability, reused by corrections. */
  selectedMode?: AbilityMode;
  characteristicValue: number;
  criticalHit: boolean;
  /** Offered to the acting user; never executed by the app (section 2). */
  additionalMainActionOffered: boolean;
  cost?: CostApplication;
  targets: TargetRollOutcome[];
  /** Damage application per target, in target order (section 6). */
  damageApplications: DamageApplication[];
  /** Source-rule records that the app did not automate (section 1.9, 1.10, 6.1). */
  manualResolutions?: ManualResolution[];
  warnings: string[];
}

/** Output when the affordability check refused execution (section 9). Nothing else happened. */
export interface AbilityRollBlocked {
  kind: 'blocked';
  abilityId: string;
  actorId: string;
  cost: ResourceCost;
  poolBefore: number;
  reason: string;
}

export type AbilityRollResponse = AbilityRollResult | AbilityRollBlocked;

export interface CostApplication {
  resource: string;
  amount: number;
  waived: boolean;
  before: number;
  after: number;
}

/** Automatic tier outcome or downgrade asserted at the table (sections 1.9, 1.10). */
export interface ManualResolution {
  targetId?: string;
  automaticTier?: Tier;
  downgradedToTier?: Tier;
  /** Verbatim source clause the table applied. */
  sourceClause: string;
  note: string;
}

/** Target facts needed to apply damage (section 6). */
export interface DamageTargetFacts {
  targetId: string;
  kind: 'hero' | 'foe';
  stamina: number;
  maxStamina: number;
  temporaryStamina: number;
  immunities?: DamageModifierEntry[];
  weaknesses?: DamageModifierEntry[];
}

export interface DamageModifierEntry {
  /** "all-damage" for untyped "damage immunity/weakness"; otherwise a damage type such as "fire". */
  type: 'all-damage' | string;
  value: number | 'all';
}

/** One damage instance to apply (section 6.1 step 1). */
export interface DamageInstance {
  targetId: string;
  amount: number;
  damageType?: string;
  /** Table-applied reduction (e.g. a halving response) replacing `amount`; labeled in the record. */
  manualDamageOverride?: number;
  causeLabel: string;
}

/** Section 6 result for one target. */
export interface DamageApplication {
  targetId: string;
  incoming: number;
  weaknessApplied: number;
  immunityApplied: number | 'all';
  afterImmunity: number;
  absorbedByTemporaryStamina: number;
  temporaryStaminaBefore: number;
  temporaryStaminaAfter: number;
  staminaDelta: number;
  staminaBefore: number;
  staminaAfter: number;
  windedValue: number;
  windedBefore: boolean;
  windedAfter: boolean;
  /** Ordinary foe at 0 or lower (section 6.4). */
  slain?: boolean;
  /** Hero labels only; no dying automation in v0.01 (section 6.4). */
  dying?: boolean;
  deadThresholdReached?: boolean;
}

/** Director-controlled creature free strike (section 4.4): no roll. */
export interface CreatureFreeStrikeRequest {
  actorId: string;
  freeStrikeValue: number;
  damageType?: string;
  targetId: string;
}

/** Post-roll edge/bane correction for one target (section 3). */
export interface PostRollCorrectionRequest {
  originalEventId: string;
  targetId: string;
  edges: number;
  banes: number;
}

export interface PostRollCorrectionResult {
  originalEventId: string;
  targetId: string;
  dice: PowerRollDice;
  before: TargetRollOutcome;
  after: TargetRollOutcome;
  /** Positive restores Stamina (less damage than applied), negative applies more. */
  staminaReconciliationDelta: number;
  temporaryStaminaReconciliationDelta: number;
  damageAfter?: DamageApplication;
}

/** Catch Breath / FreePlay Recovery spend (section 7). */
export interface CatchBreathRequest {
  actorId: string;
  inCombat: boolean;
  stamina: number;
  maxStamina: number;
  temporaryStamina: number;
  /** Absent for Director-controlled creatures, which have no Recoveries. */
  recoveries?: number;
  /** Hero label only; produces a warning, not a block. */
  dying?: boolean;
}

export type CatchBreathResponse = CatchBreathResult | CatchBreathBlocked;

export interface CatchBreathResult {
  kind: 'resolved';
  actorId: string;
  recoveryValue: number;
  recoveriesBefore: number;
  recoveriesAfter: number;
  staminaBefore: number;
  staminaAfter: number;
  healed: number;
  capApplied: boolean;
  uncertainty?: UncertaintyId;
  temporaryStaminaUnchanged: number;
  warnings: string[];
}

export interface CatchBreathBlocked {
  kind: 'blocked';
  actorId: string;
  reason: string;
}

/** Saving throw for a manually toggled condition (section 8). */
export interface SavingThrowRequest {
  actorId: string;
  condition: string;
  d10: D10;
  /** Source default 6; a different value is a supplied fact with its label. */
  threshold?: number;
  thresholdSourceLabel?: string;
}

export interface SavingThrowResult {
  actorId: string;
  condition: string;
  d10: D10;
  threshold: number;
  success: boolean;
}

/** Direct test roll (section 5). */
export interface TestRollRequest {
  actorId: string;
  characteristic: Characteristic;
  characteristicValue: number;
  dice: PowerRollDice;
  /** Agreed skill name; grants the +2 bonus when present. */
  skill?: string;
  otherBonuses?: LabeledBonus[];
  edges: number;
  banes: number;
  difficulty?: TestDifficulty;
}

export interface TestRollResult {
  actorId: string;
  dice: PowerRollDice;
  naturalRoll: number;
  characteristic: Characteristic;
  characteristicValue: number;
  skillBonus: 0 | 2;
  bonusTotal: number;
  edgeBane: EdgeBaneResolution;
  total: number;
  tier: Tier;
  criticalSuccess: boolean;
  difficulty?: TestDifficulty;
  /** Present only when `difficulty` was supplied. */
  outcome?: TestOutcome;
  uncertainty?: UncertaintyId;
}
