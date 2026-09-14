// SPDX-License-Identifier: GPL-3.0-only
/**
 * The application's entry to the R02 evaluator: the pinned R01 definitions and the conversion of a
 * saved revision's selections into the evaluator's input. Owning documents:
 * docs/character-derived-values.md (section 3, evaluator contract) and
 * docs/fury-level-one-decisions.md. No rule is resolved here; `shared/evaluate/character.ts` is
 * the only place values are derived.
 */
import definitionsJson from '../../shared/content/fury-level-one-decisions.json';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions';
import type { DerivedBaseline, EvaluationResult } from '../../shared/contracts/characterEvaluation';
import { evaluateCharacter, selectionsFrom } from '../../shared/evaluate/character';
import type { DraftSelection } from '../../shared/characterDraft';

export const definitions = definitionsJson as unknown as DecisionDefinitions;

/** Evaluates saved selections against the pinned definitions (deterministic, no side effects). */
export function evaluateSelections(selections: DraftSelection[]): EvaluationResult {
  return evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: 1,
      selections: selectionsFrom(selections),
    },
    definitions,
  );
}

/** The stored `derivedBaseline` field, typed; null until a complete revision is activated. */
export function baselineOf(value: unknown): DerivedBaseline | null {
  return value && typeof value === 'object' ? (value as DerivedBaseline) : null;
}
