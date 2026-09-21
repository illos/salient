// SPDX-License-Identifier: GPL-3.0-only
/**
 * The shape of the R01 decision definitions (`shared/content/fury-level-one-decisions.json`,
 * schema `r01.1`), as the evaluator and the wizard read them. Types only; the JSON is the content.
 * Owning document: docs/fury-level-one-decisions.md ("Schema note for the JSON").
 */

import type {
  CharacterChoiceOrigins,
  HeroicResourceName,
  KitBenefit,
} from '../contracts/characterEvaluation.ts';

export interface SourcedQuote {
  source: string;
  quote?: string;
}

export interface OptionGrant {
  kind: string;
  value: string;
  source?: string;
  quote?: string;
  note?: string;
}

export interface DecisionOption {
  id: string;
  value: string;
  source?: string;
  cost?: number;
  costQuote?: string;
  requiresFeature?: string;
  excludesFeatures?: string[];
  excludedWhen?: { decision: string; value: string }[];
  unavailableReason?: string;
  abilityKind?: 'signature' | 'heroic';
  supportedInV001: boolean;
  grants?: OptionGrant[];
}

export interface OptionsByParentEntry {
  /** Optional printed parent value when its name cannot be used as a backend object key. */
  parentValue?: string;
  source: string;
  quote?: string;
  values?: string[];
  optionsFrom?: string[];
}

export type DecisionShape =
  | { type: 'none' }
  | { type: 'text' }
  | { type: 'single'; count: 1; rollable?: string; customAllowed?: boolean; noneAllowed?: boolean }
  | { type: 'multi'; count: number; deferrable?: boolean }
  | { type: 'points'; budget: number; costField: string }
  | { type: 'assignment'; targets: string[] };

export interface Decision {
  id: string;
  /** A sourced decision's readable control label, independent of its stable storage ID. */
  label?: string;
  kind: 'choice' | 'automatic' | 'authored' | 'none';
  shape: DecisionShape;
  source: string;
  quote: string;
  availableWhen?: { decision: string; value: string };
  /** Additional parent conditions, including choices in a purchased-trait list. */
  conditions?: { decision: string; value: string; includes?: boolean; not?: boolean }[];
  dependsOn?: string[];
  /**
   * Alternative parents (OR): the decision is available when at least one listed parent is available
   * and chosen; when `optionsByParent` exists the chosen value must also have an entry there. The first
   * satisfying parent is the effective parent that supplies the options pool, the missing-choice
   * sentence and pruning. `dependsOn` keeps its AND meaning and combines with this list.
   */
  dependsOnAny?: string[];
  /** Optional selections (such as no complication) do not prevent a complete build. */
  optional?: boolean;
  /** Required narrative/Director input; ordinary authored flavor remains optional. */
  requiredText?: boolean;
  /** Who makes this source choice; saved drafts may propose it for ordinary campaign review. */
  decisionActor?: 'owner' | 'Director' | 'owner+Director';
  selectedPool?: { decision: string; exclude?: boolean };
  abilityPool?: { classOnly?: boolean; knownOnly?: boolean; higherLevelThanCurrent?: boolean };
  /** Distinguish granting knowledge from selecting an already-known modifier target. */
  selectionRole?:
    | 'skill'
    | 'language'
    | 'skill-target'
    | 'language-removal'
    | 'reference'
    | 'skill-removal'
    | 'skill-conditional';
  /** Intersect with, or exclude, the hero's known choices after ordinary validation. */
  ownedPool?: {
    kind: 'skill' | 'language';
    groups?: string[];
    exclude?: boolean;
    fromDecision?: string;
  };
  /** This replacement exists only when this many fixed sources grant the named skill. */
  duplicateFixedSkill?: { skill: string; occurrence: number };
  /**
   * Field Arsenal: this decision chooses which of the two kits supplies the named benefit. It is
   * available only while `kit.choice` and the second kit both grant that benefit with different
   * printed values; its options are the two chosen kits.
   */
  overlapBenefit?: KitBenefit;
  /** Some source budgets require an exact expenditure, unlike ordinary ancestry warnings. */
  exactBudget?: boolean;
  options?: DecisionOption[];
  optionsFrom?: string | string[];
  optionsByParent?: Record<string, OptionsByParentEntry>;
  optionSources?: Record<string, string>;
  supportedInV001?: string[];
  supportedSetInV001?: string[];
  grants?: OptionGrant[];
  questions?: string[];
  note?: string;
  /** Fixed skill entitlement whose duplicate this explicit choice replaces. */
  replacesDuplicateSkill?: string;
  budgetRule?: SourcedQuote;
  deferralRule?: SourcedQuote;
  poolRule?: SourcedQuote;
  baseRule?: SourcedQuote;
  typeRule?: SourcedQuote;
  choiceRule?: SourcedQuote;
  featureRule?: SourcedQuote;
  triggeredRule?: SourcedQuote;
  stepRule?: SourcedQuote;
}

export interface Step {
  id: string;
  sourceStep: string;
  source: string;
  optional: boolean;
  presentedInV001: boolean;
  optionalQuote?: string;
  note?: string;
  decisions: Decision[];
}

export interface Pool {
  source: string;
  sourceSection?: string;
  selectable?: string | boolean;
  values: string[];
}

export interface ClassProfile {
  fixedCharacteristics: Record<string, number>;
  assignmentDecisionId: string;
  arrayDecisionId: string;
  fixedDecisionId: string;
  baselineDecisionId: string;
  subclassDecisionId: string;
  source: string;
  characteristicsQuote: string;
  startingStamina: number;
  recoveries: number;
  potencyCharacteristic: 'M' | 'A' | 'R' | 'I' | 'P';
  resource: HeroicResourceName;
  resourceSource: string;
  resourceQuote: string;
  resourceOutsideCombatQuote: string;
  /** Whether this supported class path grants a kit. */
  kit: 'required' | 'none';
}

export interface DecisionDefinitions {
  /** Per-build saved selection origins; never mutate the cached shared definitions with these. */
  choiceOrigins?: CharacterChoiceOrigins;
  /** Selected build level; legacy r01.1 definitions omit this and mean level one. */
  level?: number;
  schemaVersion: string;
  supportingChoicesVersion?: 'v37';
  classProfiles?: Record<string, ClassProfile>;
  compendiumRevision: string;
  sourceRoot: string;
  pools: Record<string, Pool>;
  steps: Step[];
  selectionSets: Record<string, { description: string; selections: Record<string, unknown> }>;
}
