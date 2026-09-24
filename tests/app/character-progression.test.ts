// SPDX-License-Identifier: GPL-3.0-only
/** V32 persisted behavior, authorization and race coverage. Rules totals are independently sourced. */
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import {
  backend,
  table,
  admitHero,
  heroFixtureSelections,
  storedEvents,
  account,
} from './fixtures/table';

const choices = () =>
  draftSelectionsFrom(
    {
      'class.fury.level-2.perk': 'Danger Sense',
      'class.fury.level-2.aspect-ability': 'Wrecking Ball',
    },
    getDefinitions(2),
  );
async function setup() {
  const t = backend();
  const fixture = await table(t, { session: false });
  await t.run(async ctx => {
    const character = (await ctx.db.get(fixture.thornId))!;
    await ctx.db.patch(character._id, {
      pendingLevelUps: 1,
      liveState: {
        ...character.liveState!,
        xp: 16,
        stamina: 21,
        recoveries: 3,
        temporaryStamina: 4,
        heroicResource: { name: 'ferocity', current: 5 },
        surges: 2,
        victories: 3,
        conditions: { ...character.liveState!.conditions, prone: true },
      },
    });
  });
  return { t, ...fixture };
}
async function prepared(f: Awaited<ReturnType<typeof setup>>) {
  const p = await f.player.client.query(api.characters.progression, { characterId: f.thornId });
  const base = {
    characterId: f.thornId,
    expectedRevision: p.revision,
    expectedBaseRevisionId: p.baseRevisionId!,
  };
  const version = await f.player.client.mutation(api.characters.saveAdvancement, {
    ...base,
    commandId: 'prepare-level-two',
    expectedDraftVersion: p.draft?.version ?? 0,
    selections: choices(),
  });
  return { ...base, expectedDraftVersion: version };
}

test('Fury level-up persists, retries once and preserves every compatible live value', async () => {
  const f = await setup();
  const before = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  const snapshot = await f.t.run(ctx => ctx.db.get(before.effectiveRevisionId!));
  const args = { ...(await prepared(f)), commandId: 'finalize-level-two' };
  const revisionId = await f.player.client.mutation(api.characters.finalizeAdvancement, args);
  expect(await f.player.client.mutation(api.characters.finalizeAdvancement, args)).toBe(revisionId);
  const after = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  // Q-CHAR-2 revised: the 9 damage taken stays (21/30 → 30/39); Recoveries' maximum is unchanged.
  expect(after.liveState).toEqual({ ...before.liveState, stamina: 30 });
  expect(after.authored).toEqual(before.authored);
  expect(after.entryLevelXpOffset).toBe(0);
  expect(after.effectiveRevisionId).toBe(revisionId);
  expect(after.draftRevisionId).toBe(revisionId);
  expect(after.advancementDraft).toBeNull();
  expect(after.derivedBaseline).toMatchObject({
    level: { value: 2 },
    staminaMaximum: { value: 39 },
    recoveryValue: { value: 13 },
    windedValue: { value: 19 },
  });
  const saved = (await f.t.run(ctx => ctx.db.get(revisionId)))!;
  expect(saved.selections.slice(0, snapshot!.selections.length)).toEqual(snapshot!.selections);
  expect(saved.kind).toBe('level-up');
  expect(saved.baseEffectiveRevisionId).toBe(before.effectiveRevisionId);
  expect(await f.t.run(ctx => ctx.db.get(before.effectiveRevisionId!))).toEqual(snapshot);
  const events = await storedEvents(f.t, f.campaignId);
  expect(events.filter(e => e.kind === 'character.level-up')).toHaveLength(1);
  expect((await f.player.client.query(api.characters.get, { characterId: f.thornId })).level).toBe(
    2,
  );
});

test('scoped advancement never imports an unfinished/pending full edit; stale review and resubmission are refused', async () => {
  const f = await setup();
  const before = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    commandId: 'save-full-edit',
    expectedRevision: before.revision,
    authored: before.authored,
    selections: heroFixtureSelections({ 'culture.language': 'Higaran' }),
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId: f.thornId,
    campaignId: f.campaignId,
    commandId: 'submit-full-edit',
  });
  const pendingDraftId = (await f.t.run(ctx => ctx.db.get(f.thornId)))!.draftRevisionId;
  await f.player.client.mutation(api.characters.finalizeAdvancement, {
    ...(await prepared(f)),
    commandId: 'finalize-with-pending',
  });
  const after = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  expect(after.draftRevisionId).toBe(pendingDraftId);
  const effective = (await f.t.run(ctx => ctx.db.get(after.effectiveRevisionId!)))!;
  expect(effective.selections.find(s => s.decisionId === 'culture.language')?.value).not.toBe(
    'Higaran',
  );
  expect(
    (await f.player.client.query(api.characters.get, { characterId: f.thornId })).fullEditIsStale,
  ).toBe(true);
  await expect(
    f.director.client.mutation(api.characters.approve, {
      characterId: f.thornId,
      commandId: 'approve-stale-build',
    }),
  ).rejects.toThrow('awaiting review');
  await expect(
    f.player.client.mutation(api.characters.submit, {
      characterId: f.thornId,
      commandId: 'resubmit-stale-build',
    }),
  ).rejects.toThrow('predates the effective build');
});

test('eligibility, source timing, owner authority, bounded choices, base races and combat locks are enforced', async () => {
  const f = await setup();
  const args = await prepared(f);
  await expect(
    f.director.client.mutation(api.characters.finalizeAdvancement, {
      ...args,
      commandId: 'director-not-owner',
    }),
  ).rejects.toThrow('unavailable');
  await expect(
    f.player.client.mutation(api.characters.saveAdvancement, {
      characterId: args.characterId,
      expectedRevision: args.expectedRevision,
      expectedBaseRevisionId: args.expectedBaseRevisionId,
      expectedDraftVersion: args.expectedDraftVersion,
      commandId: 'smuggled-foundation',
      selections: [...choices(), ...heroFixtureSelections().slice(0, 1)],
    }),
  ).rejects.toThrow();
  await expect(
    f.player.client.mutation(api.characters.finalizeAdvancement, {
      ...args,
      commandId: 'stale-revision',
      expectedRevision: args.expectedRevision - 1,
    }),
  ).rejects.toThrow('changed');
  const other = await admitHero(f.t, f.player, f.director, f.campaignId, 'Other');
  const otherRow = (await f.t.run(ctx => ctx.db.get(other)))!;
  await expect(
    f.player.client.mutation(api.characters.finalizeAdvancement, {
      ...args,
      commandId: 'cross-character-base',
      expectedBaseRevisionId: otherRow.effectiveRevisionId!,
    }),
  ).rejects.toThrow('changed');
  await f.t.run(async ctx => {
    const row = (await ctx.db.get(f.thornId))!;
    await ctx.db.patch(row._id, { pendingLevelUps: 0 });
  });
  // docs/character-wizard-spec.md#level-up: taking a level-up spends a pending grant; XP alone does not.
  await expect(
    f.player.client.mutation(api.characters.finalizeAdvancement, {
      ...args,
      commandId: 'no-pending-level-up',
    }),
  ).rejects.toThrow('No level-up is pending');
  await f.t.run(ctx => ctx.db.patch(f.thornId, { pendingLevelUps: 1 }));
  await f.t.run(ctx => ctx.db.patch(f.thornId, { combatLocked: true }));
  await expect(
    f.player.client.mutation(api.characters.finalizeAdvancement, {
      ...args,
      commandId: 'combat-level-up',
    }),
  ).rejects.toThrow('locked during combat');
});

test('advancement draft survives reload, checks concurrent saves and refuses incomplete finalization', async () => {
  const f = await setup();
  const args = await prepared(f);
  const reload = await f.player.client.query(api.characters.progression, {
    characterId: f.thornId,
  });
  expect(reload.draft!.selections).toEqual(choices());
  const save = {
    characterId: f.thornId,
    expectedRevision: args.expectedRevision,
    expectedBaseRevisionId: args.expectedBaseRevisionId,
    expectedDraftVersion: args.expectedDraftVersion,
  };
  await f.player.client.mutation(api.characters.saveAdvancement, {
    ...save,
    commandId: 'clear-scoped-choice',
    selections: [],
  });
  await expect(
    f.player.client.mutation(api.characters.saveAdvancement, {
      ...save,
      commandId: 'concurrent-draft-save',
      selections: choices(),
    }),
  ).rejects.toThrow('draft changed');
  await expect(
    f.player.client.mutation(api.characters.finalizeAdvancement, {
      ...args,
      commandId: 'incomplete-finalize',
      expectedDraftVersion: 2,
    }),
  ).rejects.toThrow('incomplete');
  expect((await f.t.run(ctx => ctx.db.get(f.thornId)))!.effectiveRevisionId).toBe(
    args.expectedBaseRevisionId,
  );
});

test('history paginates privately, snapshots do not recalculate, and restore requires exact-revision review', async () => {
  const f = await setup();
  const before = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  const old = (await f.t.run(ctx => ctx.db.get(before.effectiveRevisionId!)))!;
  const advancedId = await f.player.client.mutation(api.characters.finalizeAdvancement, {
    ...(await prepared(f)),
    commandId: 'advance-for-history',
  });
  const advanced = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  const page1 = await f.player.client.query(api.characters.history, {
    characterId: f.thornId,
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(page1.page[0].id).toBe(advancedId);
  const page2 = await f.director.client.query(api.characters.history, {
    characterId: f.thornId,
    paginationOpts: { numItems: 1, cursor: page1.continueCursor },
  });
  expect(page2.page[0].id).toBe(old._id);
  await expect(
    f.observer.client.query(api.characters.history, {
      characterId: f.thornId,
      paginationOpts: { numItems: 20, cursor: null },
    }),
  ).rejects.toThrow('unavailable');
  await expect(
    f.observer.client.query(api.characters.historySnapshot, {
      characterId: f.thornId,
      revisionId: old._id,
    }),
  ).rejects.toThrow('unavailable');
  const outsider = await account(f.t, 'Outsider');
  await expect(
    outsider.client.query(api.characters.history, {
      characterId: f.thornId,
      paginationOpts: { cursor: null, numItems: 20 },
    }),
  ).rejects.toThrow('unavailable');
  await expect(
    outsider.client.query(api.characters.historySnapshot, {
      characterId: f.thornId,
      revisionId: old._id,
    }),
  ).rejects.toThrow('unavailable');
  const snapshot = await f.director.client.query(api.characters.historySnapshot, {
    characterId: f.thornId,
    revisionId: old._id,
  });
  expect(snapshot.evaluation).toEqual(old.evaluation);
  expect(JSON.stringify(snapshot)).not.toContain(before.authored.notes);
  const restoreArgs = {
    characterId: f.thornId,
    commandId: 'restore-level-one',
    sourceRevisionId: old._id,
    expectedRevision: advanced.revision,
    expectedEffectiveRevisionId: advancedId,
  };
  const restoredId = await f.player.client.mutation(api.characters.restore, restoreArgs);
  expect(await f.player.client.mutation(api.characters.restore, restoreArgs)).toBe(restoredId);
  const pending = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  expect(pending.effectiveRevisionId).toBe(advancedId);
  // Q-CHAR-2 revised: level two kept the 9 damage (30/39); restoring level one returns 21/30.
  expect(pending.liveState).toEqual({ ...before.liveState, stamina: 30 });
  expect(pending.liveState).toEqual(advanced.liveState);
  const copy = (await f.t.run(ctx => ctx.db.get(restoredId)))!;
  expect(copy.restoredFromRevisionId).toBe(old._id);
  expect(copy.evaluation).toEqual(old.evaluation);
  expect(copy.selections).toEqual(old.selections);
  await f.director.client.mutation(api.characters.approve, {
    characterId: f.thornId,
    commandId: 'approve-restored-build',
  });
  const restored = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  expect(restored.effectiveRevisionId).toBe(restoredId);
  expect(restored.authored).toEqual(before.authored);
  expect(restored.liveState).toEqual(before.liveState);
  expect(await f.t.run(ctx => ctx.db.get(old._id))).toEqual(old);
  expect(await f.t.run(ctx => ctx.db.get(advancedId))).not.toBeNull();
  await expect(
    f.player.client.mutation(api.characters.restore, {
      ...restoreArgs,
      commandId: 'stale-restore-request',
    }),
  ).rejects.toThrow('changed');
});

test('owning Director restores with a logged activation and keeps the damage taken without clearing effects', async () => {
  const f = await setup();
  const id = await admitHero(f.t, f.director, f.director, f.campaignId, 'DirectorFury');
  const before = (await f.t.run(ctx => ctx.db.get(id)))!;
  await f.t.run(ctx =>
    ctx.db.patch(id, { pendingLevelUps: 1, liveState: { ...before.liveState!, xp: 16 } }),
  );
  const base = {
    characterId: id,
    expectedRevision: before.revision,
    expectedBaseRevisionId: before.effectiveRevisionId!,
  };
  await f.director.client.mutation(api.characters.saveAdvancement, {
    ...base,
    commandId: 'director-level-draft',
    expectedDraftVersion: 0,
    selections: choices(),
  });
  const advancedId = await f.director.client.mutation(api.characters.finalizeAdvancement, {
    ...base,
    commandId: 'director-level-final',
    expectedDraftVersion: 1,
  });
  await f.t.run(async ctx => {
    const c = (await ctx.db.get(id))!;
    await ctx.db.patch(id, {
      liveState: {
        ...c.liveState!,
        stamina: 38,
        temporaryStamina: 7,
        conditions: { ...c.liveState!.conditions, bleeding: true },
      },
    });
  });
  const advanced = (await f.t.run(ctx => ctx.db.get(id)))!;
  const restoredId = await f.director.client.mutation(api.characters.restore, {
    characterId: id,
    expectedRevision: advanced.revision,
    expectedEffectiveRevisionId: advancedId,
    sourceRevisionId: before.effectiveRevisionId!,
    commandId: 'director-restore-old',
  });
  const restored = (await f.t.run(ctx => ctx.db.get(id)))!;
  expect(restored.effectiveRevisionId).toBe(restoredId);
  // Q-CHAR-2 revised: 1 damage taken at 38/39 stays through the lower build (29/30) and back.
  expect(restored.liveState).toEqual({ ...advanced.liveState!, stamina: 29 });
  const view = await f.director.client.query(api.characters.get, { characterId: id });
  expect(view.review?.status).toBe('logged');
  // Restoring higher history is another new snapshot; the damage taken still stays the same.
  const againId = await f.director.client.mutation(api.characters.restore, {
    characterId: id,
    expectedRevision: restored.revision,
    expectedEffectiveRevisionId: restoredId,
    sourceRevisionId: advancedId,
    commandId: 'director-restore-new',
  });
  const again = (await f.t.run(ctx => ctx.db.get(id)))!;
  expect(again.effectiveRevisionId).toBe(againId);
  expect(again.liveState!.stamina).toBe(38);
  expect(again.derivedBaseline.staminaMaximum.value).toBe(39);
});

test('unattached history restoration preserves authored data, refuses campaignless advancement and remains admissible', async () => {
  const f = await setup();
  const authored = {
    name: 'Standalone',
    appearance: 'Today',
    biography: 'Current story',
    notes: 'Private today',
  };
  const id = await f.player.client.mutation(api.characters.create, {
    authored,
    commandId: 'standalone-create',
  });
  await f.player.client.mutation(api.characters.save, {
    characterId: id,
    authored,
    commandId: 'standalone-save',
    expectedRevision: 1,
    selections: heroFixtureSelections(),
  });
  const old = (await f.t.run(ctx => ctx.db.get(id)))!;
  const restoredId = await f.player.client.mutation(api.characters.restore, {
    characterId: id,
    commandId: 'standalone-restore',
    expectedRevision: old.revision,
    expectedEffectiveRevisionId: null,
    sourceRevisionId: old.draftRevisionId!,
  });
  const restored = (await f.t.run(ctx => ctx.db.get(id)))!;
  expect(restored.liveState).toBeNull();
  expect(restored.effectiveRevisionId).toBe(restoredId);
  expect(restored.authored).toEqual(authored);
  expect(
    (await f.player.client.query(api.characters.listMine, {})).find(row => row.id === id)?.attached,
  ).toBe(false);
  const progression = await f.player.client.query(api.characters.progression, { characterId: id });
  expect(progression.eligible).toBe(false);
  await expect(
    f.player.client.mutation(api.characters.saveAdvancement, {
      characterId: id,
      commandId: 'standalone-level-draft',
      expectedRevision: restored.revision,
      expectedBaseRevisionId: restoredId,
      expectedDraftVersion: 0,
      selections: choices(),
    }),
  ).rejects.toThrow('Level-up happens inside a campaign');
  await f.player.client.mutation(api.characters.save, {
    characterId: id,
    commandId: 'standalone-edit-after-restore',
    authored,
    expectedRevision: restored.revision,
    selections: heroFixtureSelections({ 'culture.language': 'Higaran' }),
  });
  const edited = (await f.t.run(ctx => ctx.db.get(id)))!;
  expect(edited.effectiveRevisionId).toBe(edited.draftRevisionId);
  await f.player.client.mutation(api.characters.submit, {
    characterId: id,
    campaignId: f.campaignId,
    commandId: 'standalone-submit',
  });
  await f.director.client.mutation(api.characters.approve, {
    characterId: id,
    campaignId: f.campaignId,
    commandId: 'standalone-approve',
  });
  expect((await f.t.run(ctx => ctx.db.get(id)))!.liveState?.stamina).toBe(30);
});

test('level-two full-edit admission sets a separate entry offset and retains the legacy level-one default', async () => {
  const f = await setup();
  const authored = { name: 'Veteran', appearance: '', biography: '', notes: '' };
  const id = await f.player.client.mutation(api.characters.create, {
    authored,
    commandId: 'veteran-create',
  });
  await f.player.client.mutation(api.characters.save, {
    characterId: id,
    authored,
    commandId: 'veteran-full-save',
    expectedRevision: 1,
    targetLevel: 2,
    selections: [...heroFixtureSelections(), ...choices()],
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId: id,
    campaignId: f.campaignId,
    commandId: 'veteran-submit',
  });
  await f.director.client.mutation(api.characters.approve, {
    characterId: id,
    campaignId: f.campaignId,
    commandId: 'veteran-approve',
  });
  const admitted = (await f.t.run(ctx => ctx.db.get(id)))!;
  expect(admitted.entryLevelXpOffset).toBe(16);
  expect(admitted.liveState?.xp).toBe(0);
  expect(admitted.liveState?.stamina).toBe(39);
  await f.t.run(ctx => ctx.db.patch(f.thornId, { entryLevelXpOffset: undefined }));
  const legacy = await f.player.client.query(api.characters.progression, {
    characterId: f.thornId,
  });
  expect(legacy.entryLevelXpOffset).toBe(0);
  expect(legacy.eligible).toBe(true);
});

test('restore refuses nonowners, foreign snapshots and combat; an incomplete snapshot stays a draft', async () => {
  const f = await setup();
  const row = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  const args = {
    characterId: f.thornId,
    commandId: 'bad-restore-request',
    expectedRevision: row.revision,
    expectedEffectiveRevisionId: row.effectiveRevisionId,
    sourceRevisionId: row.effectiveRevisionId!,
  };
  await expect(f.director.client.mutation(api.characters.restore, args)).rejects.toThrow(
    'unavailable',
  );
  const other = await admitHero(f.t, f.player, f.director, f.campaignId, 'Foreign');
  const otherRow = (await f.t.run(ctx => ctx.db.get(other)))!;
  await expect(
    f.player.client.mutation(api.characters.restore, {
      ...args,
      sourceRevisionId: otherRow.effectiveRevisionId!,
    }),
  ).rejects.toThrow('unavailable');
  await expect(
    f.player.client.query(api.characters.historySnapshot, {
      characterId: f.thornId,
      revisionId: otherRow.effectiveRevisionId!,
    }),
  ).rejects.toThrow('unavailable');
  const history = await f.player.client.query(api.characters.history, {
    characterId: f.thornId,
    paginationOpts: { cursor: null, numItems: 50 },
  });
  const incompleteId = history.page.find(
    (entry: { status: string }) => entry.status === 'incomplete',
  )!.id;
  const restoredId = await f.player.client.mutation(api.characters.restore, {
    ...args,
    sourceRevisionId: incompleteId,
  });
  const incomplete = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  expect(incomplete.draftRevisionId).toBe(restoredId);
  expect(incomplete.effectiveRevisionId).toBe(row.effectiveRevisionId);
  expect(incomplete.liveState).toEqual(row.liveState);
  expect((await f.t.run(ctx => ctx.db.get(restoredId)))!.status).toBe('incomplete');
  expect(
    (await f.player.client.query(api.characters.get, { characterId: f.thornId })).review?.status,
  ).not.toBe('pending');
  await f.t.run(ctx => ctx.db.patch(f.thornId, { combatLocked: true }));
  await expect(
    f.player.client.mutation(api.characters.restore, {
      ...args,
      commandId: 'locked-history-restore',
    }),
  ).rejects.toThrow('locked during combat');
});

test('an approved full edit invalidates the exact advancement base even when numeric revision is unchanged', async () => {
  const f = await setup();
  const before = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    expectedRevision: before.revision,
    commandId: 'base-change-save',
    authored: before.authored,
    selections: heroFixtureSelections({ 'culture.language': 'Higaran' }),
  });
  const args = await prepared(f);
  await f.player.client.mutation(api.characters.submit, {
    characterId: f.thornId,
    campaignId: f.campaignId,
    commandId: 'base-change-submit',
  });
  await f.director.client.mutation(api.characters.approve, {
    characterId: f.thornId,
    commandId: 'base-change-approve',
  });
  const after = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  expect(after.revision).toBe(args.expectedRevision);
  expect(after.effectiveRevisionId).not.toBe(args.expectedBaseRevisionId);
  const progression = await f.player.client.query(api.characters.progression, {
    characterId: f.thornId,
  });
  expect(progression.draftIsStale).toBe(true);
  await expect(
    f.player.client.mutation(api.characters.finalizeAdvancement, {
      ...args,
      commandId: 'stale-effective-base',
    }),
  ).rejects.toThrow('effective build changed');
});

test('level-up marks a legacy pending full edit stale without rewriting its snapshot', async () => {
  const f = await setup();
  const before = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    commandId: 'legacy-edit-save',
    expectedRevision: before.revision,
    authored: before.authored,
    selections: heroFixtureSelections({ 'culture.language': 'Higaran' }),
  });
  const pendingId = (await f.t.run(ctx => ctx.db.get(f.thornId)))!.draftRevisionId!;
  await f.t.run(ctx =>
    ctx.db.patch(pendingId, {
      baseEffectiveRevisionId: undefined,
      level: undefined,
      kind: undefined,
    }),
  );
  const snapshot = await f.t.run(ctx => ctx.db.get(pendingId));
  await f.player.client.mutation(api.characters.submit, {
    characterId: f.thornId,
    campaignId: f.campaignId,
    commandId: 'legacy-edit-submit',
  });
  await f.player.client.mutation(api.characters.finalizeAdvancement, {
    ...(await prepared(f)),
    commandId: 'legacy-base-advance',
  });
  expect(await f.t.run(ctx => ctx.db.get(pendingId))).toEqual(snapshot);
  expect(
    (await f.player.client.query(api.characters.get, { characterId: f.thornId })).fullEditIsStale,
  ).toBe(true);
  await expect(
    f.player.client.mutation(api.characters.submit, {
      characterId: f.thornId,
      commandId: 'legacy-edit-resubmit',
    }),
  ).rejects.toThrow('predates the effective build');
});

test('Director XP correction persists, but only a granted level-up makes a hero eligible', async () => {
  const t = backend();
  const { director, player, observer, thornId, campaignId } = await table(t);
  const before = (await t.run(ctx => ctx.db.get(thornId)))!;
  const command = {
    campaignId,
    commandId: 'manual-xp-sixteen',
    text: '@Thorn /adjust xp value=16',
  };
  await expect(player.client.mutation(api.commands.submit, command)).rejects.toThrow();
  await expect(observer.client.mutation(api.commands.submit, command)).rejects.toThrow();
  await expect(
    director.client.mutation(api.commands.submit, {
      ...command,
      commandId: 'manual-xp-negative',
      text: '@Thorn /adjust xp value=-1',
    }),
  ).rejects.toThrow('below 0');
  const result = await director.client.mutation(api.commands.submit, command);
  expect(await director.client.mutation(api.commands.submit, command)).toEqual(result);
  const after = (await t.run(ctx => ctx.db.get(thornId)))!;
  expect(after.liveState).toEqual({ ...before.liveState!, xp: 16 });
  expect(after.effectiveRevisionId).toBe(before.effectiveRevisionId);
  const events = await storedEvents(t, campaignId);
  const event = events.find(row => row.commandId === command.commandId)!;
  expect(event.description).toBe('Manual adjustment — Thorn XP 0 → 16.');
  expect(event.payload).toMatchObject({ data: { field: 'xp', before: 0, after: 16 } });
  // docs/character-wizard-spec.md#level-up: XP converts at a respite; eligibility is a pending grant.
  const progression = () =>
    player.client.query(api.characters.progression, { characterId: thornId });
  expect((await progression()).eligible).toBe(false);
  expect((await progression()).reason).toContain('No level-up is pending');
  const grant = {
    campaignId,
    commandId: 'grant-thorn',
    operation: 'character.grant-level-up',
    arguments: { characters: [{ refKind: 'character', id: thornId }] },
  };
  await expect(player.client.mutation(api.commands.invoke, grant)).rejects.toThrow();
  const granted = await director.client.mutation(api.commands.invoke, grant);
  expect(await director.client.mutation(api.commands.invoke, grant)).toEqual(granted);
  expect((await t.run(ctx => ctx.db.get(thornId)))!.pendingLevelUps).toBe(1);
  expect((await progression()).eligible).toBe(true);
  expect((await progression()).targetLevel).toBe(2);
  const grantEvent = (await storedEvents(t, campaignId)).find(e => e._id === granted.eventId)!;
  expect(grantEvent.kind).toBe('character.level-up-granted');
  // Slash text with no heroes grants every attached hero: Thorn now holds two, taken separately.
  await director.client.mutation(api.commands.submit, {
    campaignId,
    commandId: 'grant-party',
    text: '/character grant-level-up',
  });
  expect((await t.run(ctx => ctx.db.get(thornId)))!.pendingLevelUps).toBe(2);
});

test('distinct long restore command IDs sharing a prefix have independent submission receipts', async () => {
  const f = await setup();
  const before = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  const first = await f.player.client.mutation(api.characters.restore, {
    characterId: f.thornId,
    commandId: `${'r'.repeat(120)}-one`,
    expectedRevision: before.revision,
    expectedEffectiveRevisionId: before.effectiveRevisionId,
    sourceRevisionId: before.effectiveRevisionId!,
  });
  const second = await f.player.client.mutation(api.characters.restore, {
    characterId: f.thornId,
    commandId: `${'r'.repeat(120)}-two`,
    expectedRevision: before.revision + 1,
    expectedEffectiveRevisionId: before.effectiveRevisionId,
    sourceRevisionId: before.effectiveRevisionId!,
  });
  expect(second).not.toBe(first);
  const pending = await f.t.run(ctx =>
    ctx.db
      .query('characterReviews')
      .withIndex('by_character', q => q.eq('characterId', f.thornId))
      .order('desc')
      .take(1),
  );
  expect(pending[0]!.revisionId).toBe(second);
  expect(
    (await f.player.client.query(api.characters.get, { characterId: f.thornId })).review?.status,
  ).toBe('pending');
});
