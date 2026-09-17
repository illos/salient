// SPDX-License-Identifier: GPL-3.0-only
/** Source-dependent choices retain the level at which they were selected across build revisions.
 * This module accepts prior persisted data, never client-supplied origins. No gameplay state changes.
 */
import type { DraftSelection } from '../../shared/characterDraft';
import type { CharacterChoiceOrigins } from '../../shared/contracts/characterEvaluation';
import { COMPLICATION_FUTURE_ABILITY_ELIGIBILITY } from '../../shared/content/supporting-complications';

export const FOOTSTEPS_FUTURE_DECISION = 'complication.following-in-the-footsteps.futureAbility';
export interface PreviousChoiceRevision {
  selections: DraftSelection[];
  level?: number;
  choiceOrigins?: CharacterChoiceOrigins;
}
const selected = (selections: DraftSelection[], decisionId: string) => {
  const value = selections.find(choice => choice.decisionId === decisionId)?.value;
  return typeof value === 'string' ? value : undefined;
};
const chosenAbility = (selections: DraftSelection[]) =>
  selected(selections, 'complication.choice') === 'Following in the Footsteps'
    ? selected(selections, FOOTSTEPS_FUTURE_DECISION)
    : undefined;

/** Is the recorded selection a source-valid future choice in its recorded parent context? */
function validOriginalChoice(selections: DraftSelection[], value: string, level: number): boolean {
  if (!Number.isInteger(level) || level < 1 || level > 10) return false;
  return Object.values(COMPLICATION_FUTURE_ABILITY_ELIGIBILITY).some(
    ability =>
      ability.name === value &&
      ability.class === selected(selections, 'class.choice') &&
      ability.minimumLevel > level &&
      (!ability.requiredChoice ||
        selected(selections, ability.requiredChoice.decision) === ability.requiredChoice.value),
  );
}

/**
 * Unchanged references preserve their trusted origin; changed references start at the current level.
 * A source revision lacking origins can establish only its own level, never an invented earlier one.
 * Restore callers pass the restored revision, not the later effective/draft revision.
 */
export function canonicalChoiceOrigins(
  selections: DraftSelection[],
  level: number,
  previous?: PreviousChoiceRevision | null,
): CharacterChoiceOrigins {
  const value = chosenAbility(selections);
  if (!value) return {};
  const previousValue = previous && chosenAbility(previous.selections);
  const stored = previous?.choiceOrigins?.[FOOTSTEPS_FUTURE_DECISION];
  const previousLevel = previous?.level ?? 1;
  const originalLevel = stored?.value === value ? stored.level : previousLevel;
  const preserve =
    previous &&
    previousValue === value &&
    originalLevel <= previousLevel &&
    originalLevel <= level &&
    validOriginalChoice(previous.selections, value, originalLevel);
  return { [FOOTSTEPS_FUTURE_DECISION]: { value, level: preserve ? originalLevel : level } };
}
