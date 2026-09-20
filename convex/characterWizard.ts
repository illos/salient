// SPDX-License-Identifier: GPL-3.0-only
/** Authenticated, read-only discovery and choice transitions for the shared character wizard. */
import { ConvexError, v } from 'convex/values';
import { query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser, type ReadCtx } from './lib/access';
import { revisionLevel } from './lib/characterProgression';
import { canonicalChoiceOrigins } from './lib/characterChoiceOrigins';
import { selectionValidator } from './characterTables';
import { isJsonValue, type DraftSelection } from '../shared/characterDraft';
import { getDefinitions } from '../shared/content/character-decisions';
import { isSupportedDefinitionLevel } from '../shared/content/character-support';
import { draftSelectionsFrom } from '../shared/evaluate/draft';
import { evaluateCharacter, selectionsFrom } from '../shared/evaluate/character';
import { changeChoice } from '../shared/evaluate/choiceTransition';
import { indexDecisions, isAvailable, isSupported, poolOf } from '../shared/evaluate/structure';
import type { SelectionValue } from '../shared/contracts/characterEvaluation';

const scopeArgs = {
  targetLevel: v.optional(v.number()),
  characterId: v.optional(v.id('characters')),
};
// Definitions/evaluation contain optional properties. Serialize the same portable JSON returned by CLI.
const portable = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function validateSelections(selections: DraftSelection[]) {
  if (
    selections.length > 100 ||
    selections.some(
      s =>
        !s.decisionId.trim() ||
        !s.ownerBranchId.trim() ||
        s.sources.length === 0 ||
        s.sources.some(
          source => !source.id.trim() || !source.path.trim() || !source.revision.trim(),
        ) ||
        !isJsonValue(s.value),
    ) ||
    JSON.stringify(selections).length > 64000
  )
    throw new ConvexError(
      'Selections must contain bounded JSON values and complete decision, branch and source references.',
    );
  if (new Set(selections.map(s => s.decisionId)).size !== selections.length)
    throw new ConvexError('A decision can only be supplied once.');
}

async function context(
  ctx: ReadCtx,
  args: {
    characterId?: Id<'characters'>;
    targetLevel?: number;
    selections?: DraftSelection[];
  },
) {
  const user = await requireUser(ctx);
  const character = args.characterId ? await ctx.db.get(args.characterId) : null;
  if (args.characterId && (!character || character.ownerId !== user._id))
    throw new ConvexError('Only the character owner may use its wizard choices.');
  const draft = character?.draftRevisionId ? await ctx.db.get(character.draftRevisionId) : null;
  const targetLevel = args.targetLevel ?? (draft ? revisionLevel(draft) : 1);
  if (!isSupportedDefinitionLevel(targetLevel))
    throw new ConvexError('Unsupported character definition level.');
  const input = args.selections ?? draft?.selections ?? [];
  validateSelections(input);
  const origins = canonicalChoiceOrigins(input, targetLevel, draft);
  const definitions = getDefinitions(targetLevel, origins);
  const map = selectionsFrom(input);
  const canonical = new Map(draftSelectionsFrom(map, definitions).map(s => [s.decisionId, s]));
  const decisions = indexDecisions(definitions);
  // Preserve unknown future selections just as create/save do; canonicalize known provenance.
  const selections = input.map(s =>
    decisions.has(s.decisionId) ? canonical.get(s.decisionId)! : s,
  );
  return { targetLevel, definitions, decisions, selections, map, draft };
}

function evaluation(
  map: Record<string, SelectionValue>,
  definitions: ReturnType<typeof getDefinitions>,
  targetLevel: number,
) {
  return evaluateCharacter(
    {
      definitionsSchemaVersion: 'r01.1',
      compendiumRevision: definitions.compendiumRevision,
      level: targetLevel,
      selections: map,
    },
    definitions,
  );
}

export const discover = query({
  args: { ...scopeArgs, selections: v.optional(v.array(selectionValidator)) },
  returns: v.object({
    targetLevel: v.number(),
    definitions: v.any(),
    decisions: v.array(v.any()),
    selections: v.array(selectionValidator),
    evaluation: v.any(),
  }),
  handler: async (ctx, args) => {
    const state = await context(ctx, args);
    return portable({
      targetLevel: state.targetLevel,
      definitions: state.definitions,
      selections: state.selections,
      evaluation: evaluation(state.map, state.definitions, state.targetLevel),
      decisions: state.definitions.steps.flatMap(step =>
        step.decisions.map(decision => {
          const pool = poolOf(decision, state.map, state.definitions);
          return {
            ...decision,
            stepId: step.id,
            available: isAvailable(decision, state.map, state.decisions),
            pool,
            supportedValues: pool.values.filter(value => isSupported(decision, value)),
          };
        }),
      ),
    });
  },
});

export const transition = query({
  args: {
    ...scopeArgs,
    selections: v.array(selectionValidator),
    decisionId: v.string(),
    value: v.optional(v.any()),
  },
  returns: v.object({
    selections: v.array(selectionValidator),
    removed: v.array(v.string()),
    evaluation: v.any(),
  }),
  handler: async (ctx, args) => {
    const state = await context(ctx, args);
    const decision = state.decisions.get(args.decisionId);
    if (!decision || !['choice', 'authored'].includes(decision.kind))
      throw new ConvexError('Choose a known editable decision.');
    if (
      args.value !== undefined &&
      (!isJsonValue(args.value) || JSON.stringify(args.value).length > 64000)
    )
      throw new ConvexError('Choice value must be bounded JSON.');
    if (args.value !== undefined && !isAvailable(decision, state.map, state.decisions))
      throw new ConvexError('This decision is not available for the current choices.');
    const changed = changeChoice(
      state.map,
      state.definitions,
      args.decisionId,
      args.value as SelectionValue | undefined,
    );
    const definitions = getDefinitions(
      state.targetLevel,
      canonicalChoiceOrigins(
        draftSelectionsFrom(changed.selections, state.definitions),
        state.targetLevel,
        state.draft,
      ),
    );
    const known = new Map(
      draftSelectionsFrom(changed.selections, definitions).map(s => [s.decisionId, s]),
    );
    const selections = [...known.values()].map(s =>
      state.decisions.has(s.decisionId)
        ? s
        : state.selections.find(old => old.decisionId === s.decisionId)!,
    );
    validateSelections(selections);
    return portable({
      selections,
      removed: changed.removed,
      evaluation: evaluation(changed.selections, definitions, state.targetLevel),
    });
  },
});
