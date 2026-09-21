// SPDX-License-Identifier: GPL-3.0-only
/**
 * R02 character evaluation contract: input and output types only, no logic.
 *
 * Owning document: docs/character-derived-values.md (formulas, provenance rule, worked examples).
 * Owning specification: docs/character-wizard-spec.md#3-decision-system (status vocabulary) and
 * docs/character-wizard-spec.md#9-shared-operations-and-reliability (evaluation is a shared operation).
 * Input vocabulary: the decision ids of shared/content/fury-level-one-decisions.json (R01, `r01.1`).
 * Pinned source: vendor/steel-compendium @ fb83a789da8f0327a389c277a0c790b1648d5810.
 * A02 implements the evaluator (`shared/evaluate/character.ts`) against these types; R03 initializes
 * live state from `DerivedBaseline`.
 */

import type { Characteristic } from './rollResolution.ts';

/** A decision id from the R01 table, for example `class.fury.characteristic-array`. Never renamed. */
export type DecisionId = string;

/**
 * A recorded selection, in the shapes the R01 JSON `selectionSets` use: a single option value, a
 * `multi` list (a `null` slot is a deferred choice where the decision is deferrable), or an
 * `assignment` map from target name to value. Authored text decisions also arrive as strings.
 */
export type SelectionValue = string | (string | null)[] | Record<string, number>;

/** Server-recorded selection provenance; public write endpoints never accept this from clients. */
export type CharacterChoiceOrigins = Record<DecisionId, { value: string; level: number }>;

/** Input to the evaluator: the R01 definitions to evaluate against and the saved selections. */
export interface EvaluationInput {
  /** `schemaVersion` of the decision definitions the selections were made against. */
  definitionsSchemaVersion: 'r01.1';
  /** Pinned Compendium revision the definitions cite; a mismatch is a diagnostic, not a silent upgrade. */
  compendiumRevision: string;
  /** Requested build level; unsupported class/level paths receive diagnostics. */
  level: number;
  selections: Record<DecisionId, SelectionValue>;
  /** Trusted saved provenance for editor/progression preview; the server reconstructs it on writes. */
  choiceOrigins?: CharacterChoiceOrigins;
}

/**
 * Evaluation status (docs/character-wizard-spec.md#3-decision-system). Precedence when several
 * apply: `invalid` > `unsupported` > `incomplete` > `complete`. Warnings never change the status.
 */
export type EvaluationStatus = 'complete' | 'incomplete' | 'invalid' | 'unsupported';

/** Severity of one diagnostic. `warning` is informational and leaves the status unchanged. */
export type DiagnosticSeverity = 'invalid' | 'unsupported' | 'incomplete' | 'warning';

/** Machine-readable reasons; the message carries the human text and the source sentence. */
export type DiagnosticCode =
  /** A `choice` decision that is available and not optional has no selection. */
  | 'required-choice-missing'
  /** A `points` decision's selected costs exceed its budget. */
  | 'budget-exceeded'
  /** A `points` decision leaves points unspent (confirmed nonblocking warning). */
  | 'budget-unspent'
  /** A `multi` decision has the wrong number of slots. */
  | 'count-mismatch'
  /** A selected value is not in the decision's pool for the current parent selections. */
  | 'value-not-in-pool'
  /** An `assignment` does not use exactly the chosen array's values, or targets the wrong names. */
  | 'assignment-mismatch'
  /** A discretionary skill duplicates another grant, or an unsupported fixed replacement is needed. */
  | 'duplicate-skill'
  /** A chosen language duplicates an already known language. */
  | 'duplicate-language'
  /** A legal source option the v0.01 application does not support (not offered in v0.01). */
  | 'unsupported-option'
  /** A selection exists for a decision whose availability condition is not met. */
  | 'unavailable-decision'
  /** A selection names a decision id the definitions do not contain. */
  | 'unknown-decision'
  /** The selections cite definitions or a Compendium revision other than the evaluator's. */
  | 'definition-mismatch';

/** Pinned source citation for one sentence (path relative to `vendor/steel-compendium`). */
export interface SourceSentence {
  path: string;
  revision: string;
  /** Verbatim after the R01 text normalization (links collapsed, emphasis removed, whitespace). */
  quote: string;
  /** Section heading in the source, when it helps locate the sentence. */
  heading?: string;
}

/** Open question ids that label provisional behavior in this contract (docs/rules-questions-for-user.md). */
export type UncertaintyId = never;

export interface Diagnostic {
  decisionId: DecisionId;
  severity: DiagnosticSeverity;
  code: DiagnosticCode;
  message: string;
  /** The sentence that establishes the count, budget, pool or grant the selection violates. */
  source?: SourceSentence;
  uncertainty?: UncertaintyId;
}

/**
 * The provenance rule (docs/character-derived-values.md#provenance-rule): every derived value names
 * the decision that supplied it, the selected value when the decision is a choice, and the source
 * sentence that establishes the contribution.
 */
export interface Provenance {
  decisionId: DecisionId;
  /** The selected option value for a `choice`; absent for an `automatic` grant. */
  selection?: string;
  source: SourceSentence;
  /** How this entry contributed to a numeric value. Absent for non-numeric values. */
  operation?: 'base' | 'add' | 'set' | 'floor-divide';
  /** The number contributed (`base`/`add`: the amount; `set`: the resulting value; `floor-divide`: the divisor). */
  amount?: number;
  /** Provisional label when an open question affects this contribution. */
  uncertainty?: UncertaintyId;
  note?: string;
}

/** A value with its full provenance chain, in the order the contributions were applied. */
export interface DerivedValue<T> {
  value: T;
  provenance: Provenance[];
}

export interface GrantedSkill {
  /** Printed replacement for the ordinary skill bonus, e.g. Rival. */
  bonus?: DerivedValue<number>;
  /** Other fixed entitlements to the same skill; their replacement remains a separate choice. */
  additionalProvenance?: Provenance[];
  name: string;
  /** Skill group as the R01 pools name it (crafting, exploration, interpersonal, intrigue, lore). */
  group: string;
  provenance: Provenance;
}

export interface GrantedLanguage {
  name: string;
  provenance: Provenance;
  /** Set when this pick duplicates a language already granted. */
  duplicateOf?: DecisionId;
}

/** A trait, feature or perk the hero possesses; its text is shown and resolved at the table in v0.01. */
export interface GrantedFeature {
  name: string;
  kind:
    | 'ancestry-signature-trait'
    | 'ancestry-purchased-trait'
    | 'culture-benefit'
    | 'class-feature'
    | 'aspect-feature'
    | 'perk'
    | 'career-benefit'
    | 'complication'
    | 'supporting-feature';
  /** Entry path relative to `vendor/steel-compendium` whose body is the readable text. */
  sourcePath: string;
  /** Ancestry point cost for purchased traits. */
  cost?: number;
  provenance: Provenance;
  /** Numeric contributions this feature makes to baseline values, cross-referenced by field name. */
  affects?: (keyof DerivedBaseline)[];
}

export interface GrantedAbility {
  /** Source activation requirement is displayed; build selection does not activate it. */
  activationCondition?: string;
  name: string;
  kind:
    | 'signature'
    | 'heroic'
    | 'aspect-triggered'
    | 'kit-signature'
    | 'free-strike'
    | 'ancestry'
    | 'class'
    | 'complication'
    | 'item'
    | 'perk';
  sourcePath: string;
  /** Fixed heroic-resource cost from the source, if any. */
  cost?: { resource: HeroicResourceName; amount: number };
  /** Source adjustments are recorded separately from the unaltered ability source text. */
  costAdjustments?: { decisionId: string; amount: number; minimum: number; sourcePath: string }[];
  /** True for the kit's own signature ability: its damage and distance already include the kit bonuses. */
  kitBonusesIncluded: boolean;
  /**
   * Field Arsenal: this kit signature includes a bonus its kit lost to the other kit. The source's
   * arithmetic (printed − subtract + add) is recorded for the reader; rolls do not apply it yet.
   */
  kitBonusReplacements?: KitBonusReplacement[];
  provenance: Provenance;
}

/** The heroic resources of the supported classes (each class feature names its own). */
export type HeroicResourceName =
  | 'ferocity'
  | 'essence'
  | 'insight'
  | 'focus'
  | 'wrath'
  | 'piety'
  | 'drama'
  | 'discipline'
  | 'clarity';

/** A bonus column of the Kits table (chapter/kits.md); Field Arsenal resolves each one once. */
export type KitBenefit =
  | 'stamina'
  | 'speed'
  | 'stability'
  | 'disengage'
  | 'meleeDamage'
  | 'rangedDamage'
  | 'meleeDistance'
  | 'rangedDistance';

export interface KitBonusReplacement {
  benefit: KitBenefit;
  /** The kit whose signature ability printed the subtracted bonus. */
  fromKit: string;
  /** The kit whose bonus the hero takes for this benefit. */
  toKit: string;
  subtract: number | [number, number, number];
  add: number | [number, number, number];
  /** The arsenal decision that chose the winning kit. */
  decisionId: string;
  sourcePath: string;
}

/** A permanent sourced bonus. All required keywords must match; conditions remain explicit. */
export interface AbilityModifier {
  id: string;
  label?: string;
  field: 'rolled-damage';
  amount: number;
  keywords: string[];
  /** Alternative eligibility for a named ability with a selected damage type. */
  alternative?: { ability: string; damageType: string };
  provenance: Provenance;
}

/** Kit contributions in the shape R04 consumes (`ActorRollFacts.kitMeleeDamageBonus`, ...). */
export interface KitContributions {
  name: DerivedValue<string>;
  equipmentText: DerivedValue<string>;
  /** Printed "+N per echelon" value; `staminaBonusApplied` is the amount at the hero's echelon. */
  staminaBonusPerEchelon: DerivedValue<number>;
  echelon: DerivedValue<number>;
  staminaBonusApplied: DerivedValue<number>;
  speedBonus: DerivedValue<number>;
  stabilityBonus: DerivedValue<number>;
  meleeDamageBonus: DerivedValue<[number, number, number]>;
  rangedDamageBonus: DerivedValue<[number, number, number]>;
  meleeDistanceBonus: DerivedValue<number>;
  rangedDistanceBonus: DerivedValue<number>;
  disengageBonus: DerivedValue<number>;
}

/**
 * The derived baseline: build-time values distinct from live play values
 * (docs/character-wizard.md#character-model-direction). Recalculation never touches current Stamina,
 * spent Recoveries, resources, conditions or manual adjustments; R03 owns those.
 */
export interface SupportingChoice {
  decisionId: string;
  label: string;
  values: string[];
  operation: string;
  condition?: string;
  sourcePath: string;
  actor?: 'owner' | 'Director' | 'owner+Director';
}

/** Beastheart build-time companion; separate creature, no live/initiative integration implied. */
export interface CompanionBaseline {
  name: string;
  sourcePath: string;
  characteristics: Record<Characteristic, number>;
  size: string;
  speed: number;
  stability: number;
  disengage: number;
  movement: string;
  staminaMaximum: number;
  recoveriesMaximum: 0;
  recoveryValue: number;
  windedValue: number;
  freeStrike: number;
  meleeDamageBonus: [number, number, number];
  rangedDamageBonus: [number, number, number];
  meleeDistanceBonus: number;
  rangedDistanceBonus: number;
  potency: { weak: number; average: number; strong: number };
  immunity: string;
  skills: string[];
  features: string[];
  abilities: string[];
  provenance: Provenance[];
}
export interface DerivedBaseline {
  companion?: CompanionBaseline;
  summoner?: {
    circle: string;
    formation: string;
    range: number;
    minionMaximum: number;
    squadMaximum: number;
    squadSizeMaximum: number;
    startOfCombatMinions: number;
    startOfTurnMinions: number;
    outsideCombatMaximum: number;
    provenance: Provenance[];
    portfolio: {
      name: string;
      sourcePath: string;
      cost: number;
      summonCount: number;
      stamina: number;
      stability: number;
      size: string;
      speed: number;
      movement: string;
      freeStrike: number;
      characteristics: Record<Characteristic, number>;
      immunities: string[];
      weaknesses: string[];
      traits: string[];
      text: string;
      provenance: Provenance[];
    }[];
  };
  level: DerivedValue<number>;
  ancestry: DerivedValue<string>;
  class: DerivedValue<string>;
  /** The Fury's primordial aspect is its subclass. */
  subclass: DerivedValue<string>;
  career: DerivedValue<string>;
  characteristics: Record<Characteristic, DerivedValue<number>>;
  staminaMaximum: DerivedValue<number>;
  recoveriesMaximum: DerivedValue<number>;
  recoveryValue: DerivedValue<number>;
  /** Restated from R04 section 6.3: floor(staminaMaximum / 2). */
  windedValue: DerivedValue<number>;
  speed: DerivedValue<number>;
  stability: DerivedValue<number>;
  size: DerivedValue<string>;
  /** Squares shifted by the Disengage move action: 1 plus kit disengage bonus. */
  disengage: DerivedValue<number>;
  /** The class's named potency characteristic (Q-CHAR-12 for divergent modified characters). */
  potencyCharacteristic: DerivedValue<Characteristic>;
  potency: {
    weak: DerivedValue<number>;
    average: DerivedValue<number>;
    strong: DerivedValue<number>;
  };
  heroicResource: {
    name: DerivedValue<HeroicResourceName>;
    /** Value at creation; in-combat generation is manual in v0.01 (docs/fury-goblin-automation.md). */
    startingValue: DerivedValue<number>;
  };
  /** d10 result needed for a saving throw to succeed; 6 by rule, changed by features such as Impressive Horns. */
  savingThrowThreshold: DerivedValue<number>;
  renown: DerivedValue<number>;
  wealth: DerivedValue<number>;
  /** One-time career reward; project allocation/spending is recorded separately. */
  projectPoints?: DerivedValue<number>;
  kit: KitContributions | null;
  /** Field Arsenal only: each kit's printed contributions; `kit` holds the resolved arsenal. */
  kits?: KitContributions[];
  skills: GrantedSkill[];
  languages: GrantedLanguage[];
  traits: GrantedFeature[];
  features: GrantedFeature[];
  perks: GrantedFeature[];
  abilities: GrantedAbility[];
  /** Permanent non-kit ability contributions; applied once when eligible. */
  abilityModifiers?: AbilityModifier[];
  supportingChoices?: SupportingChoice[];
  initialItems?: {
    decisionId: string;
    name: string;
    sourcePath: string;
    state: 'possessed' | 'broken' | 'absent' | 'pending-Director';
    projectSource?: string;
    condition?: string;
  }[];
  renownMaximum?: DerivedValue<number>;
  damageWeaknesses?: { damageType: string; value: DerivedValue<number> }[];
  damageImmunities?: { damageType: string; value: DerivedValue<number> }[];
  conditionImmunities?: { condition: string; provenance: Provenance }[];
  /** Every open question whose provisional default influenced this baseline. */
  uncertainties: UncertaintyId[];
}

/** Baseline fields the evaluator could derive from the valid, available selections so far. */
export type PartialBaseline = { [K in keyof DerivedBaseline]?: DerivedBaseline[K] };

/** Output of the shared evaluation operation. Deterministic for the same input. */
export interface EvaluationResult {
  status: EvaluationStatus;
  /** Diagnostics keyed by decision id; decisions without findings are absent. */
  diagnostics: Record<DecisionId, Diagnostic[]>;
  /** Present only when `status` is `complete`. */
  baseline: DerivedBaseline | null;
  /** The "hero so far" for drafts; present when `status` is not `complete`. */
  partial?: PartialBaseline;
  /** Definitions and revision the evaluation used, for the record. */
  evaluatedAgainst: { definitionsSchemaVersion: 'r01.1'; compendiumRevision: string };
}
