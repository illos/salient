// SPDX-License-Identifier: GPL-3.0-only
/**
 * The one creation path for a new owned character draft, shared by `characters.create` and
 * `characterImport.importForge` (V09): bounded authored fields, canonical pinned provenance for
 * known decisions, server choice origins, one evaluation, and revision 1. A new draft is never
 * attached to a campaign and has no effective build until the ordinary admission path activates it
 * (docs/character-wizard-spec.md#7-revision-and-review-lifecycle).
 */
import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { selectionsFrom } from '../../shared/evaluate/character';
import {
  isJsonValue,
  type CharacterAuthored,
  type DraftSelection,
} from '../../shared/characterDraft';
import { canonicalChoiceOrigins } from './characterChoiceOrigins';
import { evaluateSelections } from './characterBuild';

/**
 * `nameOptional` is the wizard's working draft (V96): it is saved continuously from the first
 * choice, before the hero is named, and stays out of the owner's list until they save it. Every
 * other path, including saving that draft into the list, still requires the name.
 */
export function authored(input: CharacterAuthored, nameOptional = false): CharacterAuthored {
  const name = input.name.trim();
  if (nameOptional ? name.length > 100 : !name || name.length > 100)
    throw new ConvexError('Enter a character name of 1–100 characters.');
  for (const value of [input.appearance, input.biography, input.notes]) {
    if (value.length > 10000)
      throw new ConvexError('Each description or notes field supports up to 10,000 characters.');
  }
  return { ...input, name };
}

/** Creation and later saves share the same bounds and pinned provenance. */
export function validatedSelections(selections: DraftSelection[], level: number): DraftSelection[] {
  const definitions = getDefinitions(level);
  if (
    selections.length > 100 ||
    JSON.stringify(selections).length > 64000 ||
    selections.some(
      selection =>
        !selection.decisionId.trim() ||
        !selection.ownerBranchId.trim() ||
        selection.sources.length === 0 ||
        selection.sources.some(
          source => !source.id.trim() || !source.path.trim() || !source.revision.trim(),
        ) ||
        !isJsonValue(selection.value),
    )
  )
    throw new ConvexError(
      'Selections must contain bounded JSON values and complete decision, branch and source references.',
    );
  if (new Set(selections.map(selection => selection.decisionId)).size !== selections.length)
    throw new ConvexError(
      'A decision can only be saved once within its owning branch or across branches.',
    );
  // Known decisions always persist canonical pinned provenance; client labels cannot forge it.
  const canonical = new Map(
    draftSelectionsFrom(selectionsFrom(selections), definitions).map(s => [s.decisionId, s]),
  );
  const known = new Set(definitions.steps.flatMap(step => step.decisions.map(d => d.id)));
  selections = selections.map(selection =>
    known.has(selection.decisionId) ? canonical.get(selection.decisionId)! : selection,
  );
  return selections;
}

/** Inserts an unattached character and its evaluated revision 1; callers check limits first. */
export async function insertCharacterDraft(
  ctx: MutationCtx,
  input: {
    ownerId: Id<'users'>;
    authored: CharacterAuthored;
    selections: DraftSelection[];
    level: number;
    wizardDraft?: boolean;
  },
): Promise<Id<'characters'>> {
  const selections = validatedSelections(input.selections, input.level);
  const choiceOrigins = canonicalChoiceOrigins(selections, input.level);
  const evaluation = evaluateSelections(selections, input.level, choiceOrigins);
  const id = await ctx.db.insert('characters', {
    ownerId: input.ownerId,
    authored: input.authored,
    revision: 1,
    draftRevisionId: null,
    effectiveRevisionId: null,
    derivedBaseline: null,
    liveState: null,
    campaignId: null,
    combatLocked: false,
    ...(input.wizardDraft === true ? { wizardDraft: true } : {}),
  });
  const revisionId = await ctx.db.insert('characterRevisions', {
    characterId: id,
    revision: 1,
    parentRevisionId: null,
    selections,
    level: input.level,
    kind: 'full-edit',
    choiceOrigins,
    baseEffectiveRevisionId: null,
    status: evaluation.status,
    evaluation,
    derivedBaseline: evaluation.baseline,
  });
  await ctx.db.patch(id, { draftRevisionId: revisionId });
  return id;
}
