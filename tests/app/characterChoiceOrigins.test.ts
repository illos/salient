// SPDX-License-Identifier: GPL-3.0-only
/** Following in the Footsteps chooses a future ability once; learning it preserves that origin. */
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import {
  canonicalChoiceOrigins,
  FOOTSTEPS_FUTURE_DECISION as futureId,
} from '../../convex/lib/characterChoiceOrigins';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { selectionsFrom } from '../../shared/evaluate/character';
import { indexDecisions, poolOf } from '../../shared/evaluate/structure';
import { backend, table, admitHero, heroFixtureSelections } from './fixtures/table';

const footsteps = (future = 'Wrecking Ball', aspect = 'Berserker') =>
  draftSelectionsFrom(
    selectionsFrom(
      heroFixtureSelections({
        'complication.choice': 'Following in the Footsteps',
        [futureId]: future,
        'complication.following-in-the-footsteps.costlierAbility': 'Out of the Way!',
        'class.fury.aspect': aspect,
      }),
    ),
    getDefinitions(1),
  );

test('source pools require the Fury aspect and preserve only the selected ability at its original level', () => {
  const choices = footsteps();
  const origins = canonicalChoiceOrigins(choices, 1);
  const defs = getDefinitions(2, origins);
  const values = poolOf(indexDecisions(defs).get(futureId)!, selectionsFrom(choices), defs).values;
  expect(values).toContain('Wrecking Ball');
  expect(values).not.toContain('Special Delivery'); // A new level-two choice is no longer future.
  expect(values).toContain('Avalanche Impact');
  expect(values).not.toContain('Death Strike'); // Reaver's sixth-level grant.
  expect(values).not.toContain('Pounce'); // Stormwight's sixth-level grant.
  const changed = footsteps('Special Delivery');
  expect(
    canonicalChoiceOrigins(changed, 2, { selections: choices, level: 2, choiceOrigins: origins }),
  ).toEqual({ [futureId]: { value: 'Special Delivery', level: 2 } });
  // Saving an ineligible Reaver ability under Berserker cannot manufacture a legal level-one origin.
  expect(
    canonicalChoiceOrigins(footsteps('Phalanx-Breaker', 'Reaver'), 2, {
      selections: footsteps('Phalanx-Breaker'),
      level: 1,
      choiceOrigins: canonicalChoiceOrigins(footsteps('Phalanx-Breaker'), 1),
    }),
  ).toEqual({ [futureId]: { value: 'Phalanx-Breaker', level: 2 } });
});

test('immutable revisions retain the future choice through advancement, edits and restore', async () => {
  const t = backend();
  const f = await table(t, { session: false });
  const characterId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Footsteps',
    footsteps(),
  );
  const creation = (await t.run(ctx => ctx.db.get(characterId)))!;
  const first = (await t.run(ctx => ctx.db.get(creation.effectiveRevisionId!)))!;
  expect(first.choiceOrigins).toEqual({ [futureId]: { value: 'Wrecking Ball', level: 1 } });
  await t.run(ctx =>
    ctx.db.patch(characterId, {
      pendingLevelUps: 1,
      liveState: { ...creation.liveState!, xp: 16 },
    }),
  );
  const progression = await f.player.client.query(api.characters.progression, { characterId });
  const baseArgs = {
    characterId,
    expectedRevision: progression.revision,
    expectedBaseRevisionId: progression.baseRevisionId!,
  };
  const version = await f.player.client.mutation(api.characters.saveAdvancement, {
    ...baseArgs,
    commandId: 'footsteps-prepare',
    expectedDraftVersion: 0,
    selections: draftSelectionsFrom(
      {
        'class.fury.level-2.perk': 'Danger Sense',
        'class.fury.level-2.aspect-ability': 'Wrecking Ball',
      },
      getDefinitions(2),
    ),
  });
  const learnedId = await f.player.client.mutation(api.characters.finalizeAdvancement, {
    ...baseArgs,
    commandId: 'footsteps-learn',
    expectedDraftVersion: version,
  });
  const learned = (await t.run(ctx => ctx.db.get(learnedId)))!;
  expect(learned.status).toBe('complete');
  expect(learned.choiceOrigins).toEqual(first.choiceOrigins);
  const read = await f.player.client.query(api.characters.get, { characterId });
  expect(read.choiceOrigins).toEqual(first.choiceOrigins);
  const preview = await f.player.client.query(api.characters.evaluate, {
    characterId,
    targetLevel: 2,
    selections: learned.selections,
  });
  expect(preview.status).toBe('complete');
  expect(
    preview.baseline?.abilities.find(
      (ability: { name: string }) => ability.name === 'Wrecking Ball',
    )?.cost?.amount,
  ).toBe(3);
  const beforeEdit = (await t.run(ctx => ctx.db.get(characterId)))!;
  await f.player.client.mutation(api.characters.save, {
    characterId,
    commandId: 'footsteps-unchanged',
    expectedRevision: beforeEdit.revision,
    authored: beforeEdit.authored,
    selections: learned.selections,
  });
  const unchanged = (await t.run(ctx => ctx.db.get(characterId)))!;
  expect((await t.run(ctx => ctx.db.get(unchanged.draftRevisionId!)))!.choiceOrigins).toEqual(
    first.choiceOrigins,
  );
  await f.player.client.mutation(api.characters.save, {
    characterId,
    commandId: 'footsteps-changed',
    expectedRevision: unchanged.revision,
    authored: unchanged.authored,
    selections: learned.selections.map(choice =>
      choice.decisionId === futureId ? { ...choice, value: 'Special Delivery' } : choice,
    ),
  });
  const changed = (await t.run(ctx => ctx.db.get(characterId)))!;
  const changedRevision = (await t.run(ctx => ctx.db.get(changed.draftRevisionId!)))!;
  expect(changedRevision.choiceOrigins).toEqual({
    [futureId]: { value: 'Special Delivery', level: 2 },
  });
  expect(changedRevision.status).toBe('invalid');
  const restoredId = await f.player.client.mutation(api.characters.restore, {
    characterId,
    commandId: 'footsteps-restore',
    expectedRevision: changed.revision,
    expectedEffectiveRevisionId: changed.effectiveRevisionId,
    sourceRevisionId: learnedId,
  });
  expect((await t.run(ctx => ctx.db.get(restoredId)))!.choiceOrigins).toEqual(first.choiceOrigins);
  expect(await t.run(ctx => ctx.db.get(learnedId))).toEqual(learned);
});
