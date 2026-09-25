// SPDX-License-Identifier: GPL-3.0-only
/**
 * V185 historical sheet (docs/character-wizard-spec.md#5-progression-history): the recorded build,
 * never a re-evaluation; the history readers only; no owner-private notes for the Director; and the
 * comparison with the active build. Level values are the V32 progression test's sourced Fury totals
 * (level 1 Stamina 30, level 2 Stamina 39); the added grants are the two level-two choices made.
 */
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import type { HistorySheet } from '../../shared/contracts/characterSheet';
import { account, backend, table } from './fixtures/table';

async function advanced() {
  const t = backend();
  const f = await table(t, { session: false });
  await t.run(async ctx => {
    await ctx.db.patch(f.thornId, { pendingLevelUps: 1 });
  });
  const p = await f.player.client.query(api.characters.progression, { characterId: f.thornId });
  const base = {
    characterId: f.thornId,
    expectedRevision: p.revision,
    expectedBaseRevisionId: p.baseRevisionId!,
  };
  const version = await f.player.client.mutation(api.characters.saveAdvancement, {
    ...base,
    commandId: 'history-prepare-two',
    expectedDraftVersion: 0,
    selections: draftSelectionsFrom(
      {
        'class.fury.level-2.perk': 'Danger Sense',
        'class.fury.level-2.aspect-ability': 'Wrecking Ball',
      },
      getDefinitions(2),
    ),
  });
  const originalId = (await t.run(ctx => ctx.db.get(f.thornId)))!.effectiveRevisionId!;
  const levelTwoId = await f.player.client.mutation(api.characters.finalizeAdvancement, {
    ...base,
    commandId: 'history-finalize-two',
    expectedDraftVersion: version,
  });
  return { t, ...f, originalId, levelTwoId };
}

test('the historical sheet shows the recorded build with present live state, and its difference', async () => {
  const f = await advanced();
  // Mark the recorded baseline: a re-evaluation from selections would lose the marker.
  await f.t.run(async ctx => {
    const old = (await ctx.db.get(f.originalId))!;
    const baseline = old.derivedBaseline as { staminaMaximum: { value: number } };
    await ctx.db.patch(f.originalId, {
      derivedBaseline: { ...baseline, staminaMaximum: { ...baseline.staminaMaximum, value: 31 } },
    });
  });
  const character = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  const history = (await f.player.client.query(api.characters.historySheet, {
    characterId: f.thornId,
    revisionId: f.originalId,
  })) as HistorySheet;
  expect(history.sheet.build).toMatchObject({ label: 'history', status: 'complete' });
  expect(history.sheet.build!.baseline!.staminaMaximum.value).toBe(31);
  expect(history.sheet.build!.baseline!.level.value).toBe(1);
  expect(history.sheet.abilities.map(a => a.name)).not.toContain('Wrecking Ball');
  expect(history.sheet.features.map(f => f.name)).not.toContain('Danger Sense');
  // Live state, notes and inventory stay today's; a recorded build never controls the table.
  expect(history.sheet.live).toMatchObject({ stamina: character.liveState!.stamina });
  expect(history.sheet.authored.notes).toBe(character.authored.notes);
  expect(history.sheet.viewer.controls).toBe(false);
  expect(history.entry).toMatchObject({ id: f.originalId, level: 1, isEffective: false });
  expect(history.difference).toMatchObject({
    hasCurrent: true,
    same: false,
    level: { current: 2, snapshot: 1 },
    staminaMaximum: { current: 39, snapshot: 31 },
    // Level two also grants Unstoppable Force's ability; only the chosen names are asserted.
    abilities: { added: [], removed: expect.arrayContaining(['Wrecking Ball']) },
    perks: { added: [], removed: ['Danger Sense'] },
  });
  const current = (await f.player.client.query(api.characters.historySheet, {
    characterId: f.thornId,
    revisionId: f.levelTwoId,
  })) as HistorySheet;
  expect(current.difference.same).toBe(true);
  expect(current.entry).toMatchObject({ kind: 'level-up', isEffective: true });
});

test('historical sheets follow history access and keep owner notes from the Director', async () => {
  const f = await advanced();
  const notes = (await f.t.run(ctx => ctx.db.get(f.thornId)))!.authored.notes;
  const args = { characterId: f.thornId, revisionId: f.originalId };
  const director = (await f.director.client.query(
    api.characters.historySheet,
    args,
  )) as HistorySheet;
  expect(director.sheet.audience).toBe('director');
  expect(director.sheet.authored).not.toHaveProperty('notes');
  expect(notes.length).toBeGreaterThan(0);
  expect(JSON.stringify(director)).not.toContain(notes);
  await expect(f.observer.client.query(api.characters.historySheet, args)).rejects.toThrow(
    'unavailable',
  );
  const outsider = await account(f.t, 'Outsider');
  await expect(outsider.client.query(api.characters.historySheet, args)).rejects.toThrow(
    'unavailable',
  );
  // A revision of another character is refused even for its readers.
  const otherId = await f.player.client.mutation(api.characters.create, {
    commandId: 'history-other-character',
    authored: { name: 'Other', appearance: '', biography: '', notes: '' },
  });
  await expect(
    f.player.client.query(api.characters.historySheet, {
      characterId: otherId,
      revisionId: f.originalId,
    }),
  ).rejects.toThrow('unavailable');
});

test('a restored entry names the revision it copied', async () => {
  const f = await advanced();
  const character = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  const original = (await f.t.run(ctx => ctx.db.get(f.originalId)))!;
  const restoredId = await f.player.client.mutation(api.characters.restore, {
    commandId: 'history-restore-level-one',
    characterId: f.thornId,
    sourceRevisionId: f.originalId,
    expectedRevision: character.revision,
    expectedEffectiveRevisionId: f.levelTwoId,
  });
  const page = await f.director.client.query(api.characters.history, {
    characterId: f.thornId,
    paginationOpts: { cursor: null, numItems: 5 },
  });
  expect(page.page[0]).toMatchObject({
    id: restoredId,
    kind: 'restore',
    restoredFromRevisionId: f.originalId,
    restoredFromRevision: original.revision,
  });
});
