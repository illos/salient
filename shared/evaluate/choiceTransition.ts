import { BESPOKE_CULTURE, findCulturePreset } from '../content/culture-presets.ts';
// SPDX-License-Identifier: GPL-3.0-only
/** The wizard's choice edit, shared by interactive and programmatic clients. */
import type { SelectionValue } from '../contracts/characterEvaluation.ts';
import type { DecisionDefinitions } from './definitions.ts';
import { assignmentContext } from './assignment.ts';
import { pruneUnavailable, type Selections } from './structure.ts';

export function changeChoice(
  selections: Selections,
  definitions: DecisionDefinitions,
  decisionId: string,
  value?: SelectionValue,
): { selections: Selections; removed: string[] } {
  const next = { ...selections };
  const assignment = assignmentContext(selections, definitions);
  if (assignment?.arrayDecisionId === decisionId && value !== selections[decisionId])
    delete next[assignment.decisionId];
  if (value === undefined) delete next[decisionId];
  else next[decisionId] = value;
  if (decisionId === 'culture.preset' && typeof value === 'string') {
    const preset = findCulturePreset(value);
    if (preset) {
      next['culture.name'] = preset.name;
      next['culture.environment'] = preset.environment;
      next['culture.organization'] = preset.organization;
      next['culture.upbringing'] = preset.upbringing;
      if (preset.language) next['culture.language'] = preset.language;
    }
  } else if (
    [
      'culture.name',
      'culture.environment',
      'culture.organization',
      'culture.upbringing',
      'culture.language',
    ].includes(decisionId)
  ) {
    const preset = findCulturePreset(next['culture.preset']);
    if (preset) {
      const expected: Record<string, string | undefined> = {
        'culture.name': preset.name,
        'culture.environment': preset.environment,
        'culture.organization': preset.organization,
        'culture.upbringing': preset.upbringing,
        'culture.language': preset.language,
      };
      if (expected[decisionId] !== undefined && value !== expected[decisionId])
        next['culture.preset'] = BESPOKE_CULTURE;
    }
  }
  return pruneUnavailable(next, definitions);
}
