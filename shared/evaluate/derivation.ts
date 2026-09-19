// SPDX-License-Identifier: GPL-3.0-only
/** Read-only validated inputs for independently owned ancestry/class contributions. */
import type {
  Provenance,
  SelectionValue,
  SourceSentence,
} from '../contracts/characterEvaluation.ts';
import type { Decision, DecisionDefinitions } from './definitions.ts';
import type { KitSentences } from './sources.ts';

export interface DerivationContext {
  readonly level: number;
  readonly definitions: DecisionDefinitions;
  readonly available: ReadonlySet<string>;
  readonly decisions: ReadonlyMap<string, Decision>;
  readonly valid: ReadonlyMap<string, SelectionValue>;
  single(id: string): string | undefined;
  list(id: string): (string | null)[] | undefined;
  sentence(sentence: Omit<SourceSentence, 'revision'>): SourceSentence;
  own(decision: Decision, heading?: string): SourceSentence;
  provenance(entry: Provenance): Provenance;
}

export interface SelectedKit {
  name: string;
  s: KitSentences;
  decisionId: string;
}
