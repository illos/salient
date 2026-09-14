// SPDX-License-Identifier: GPL-3.0-only
/**
 * The shape of the R01 decision definitions (`shared/content/fury-level-one-decisions.json`,
 * schema `r01.1`), as the evaluator and the wizard read them. Types only; the JSON is the content.
 * Owning document: docs/fury-level-one-decisions.md ("Schema note for the JSON").
 */

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
  supportedInV001: boolean;
  grants?: OptionGrant[];
}

export interface OptionsByParentEntry {
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
  kind: 'choice' | 'automatic' | 'authored' | 'none';
  shape: DecisionShape;
  source: string;
  quote: string;
  availableWhen?: { decision: string; value: string };
  dependsOn?: string[];
  options?: DecisionOption[];
  optionsFrom?: string | string[];
  optionsByParent?: Record<string, OptionsByParentEntry>;
  optionSources?: Record<string, string>;
  supportedInV001?: string[];
  supportedSetInV001?: string[];
  grants?: OptionGrant[];
  questions?: string[];
  note?: string;
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
  selectable?: string;
  values: string[];
}

export interface DecisionDefinitions {
  schemaVersion: string;
  compendiumRevision: string;
  sourceRoot: string;
  pools: Record<string, Pool>;
  steps: Step[];
  selectionSets: Record<string, { description: string; selections: Record<string, unknown> }>;
}
