// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { pendingDirectorSetup } from '../../convex/lib/characterDirectorSetup';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { selectionsFrom } from '../../shared/evaluate/character';
import {
  account,
  admitHero,
  backend,
  heroFixtureSelections,
  storedEvents,
  table,
} from './fixtures/table';

type Member = Awaited<ReturnType<typeof account>>;
type Fixture = Awaited<ReturnType<typeof setup>>;
const heirSelections = () =>
  draftSelectionsFrom(
    {
      ...selectionsFrom(heroFixtureSelections()),
      'complication.choice': 'Strange Inheritance',
    },
    getDefinitions(1),
  );
async function setup() {
  const t = backend();
  return { t, ...(await table(t, { session: false })) };
}
async function createHeir(f: Fixture, owner: Member, name: string) {
  const authored = { name, appearance: '', biography: '', notes: '' };
  const characterId = await owner.client.mutation(api.characters.create, {
    commandId: `create-${name}`,
    authored,
  });
  await owner.client.mutation(api.characters.save, {
    characterId,
    commandId: `save-${name}`,
    expectedRevision: 1,
    authored,
    selections: heirSelections(),
  });
  return characterId;
}
async function choose(
  f: Fixture,
  characterId: Id<'characters'>,
  view: 'draft' | 'proposed',
  commandId: string,
) {
  const context = await f.director.client.query(api.characterSecrets.inheritance, {
    characterId,
    view,
    ...(view === 'draft' ? { campaignId: f.campaignId } : {}),
  });
  expect(context).not.toBeNull();
  await f.director.client.mutation(api.characterSecrets.saveInheritance, {
    characterId,
    commandId,
    itemName: 'Bastion Belt',
    expectedView: view,
    expectedCampaignId: f.campaignId,
    expectedCharacterRevision: context!.characterRevision,
    expectedBuildRevisionId: context!.buildRevisionId,
    expectedVersion: context!.version,
  });
  return context!;
}

test('player submits owner-complete inputs, but admission waits atomically for the private Director choice', async () => {
  const f = await setup();
  const characterId = await createHeir(f, f.player, 'PlayerHeir');
  const draft = await f.player.client.query(api.characters.get, { characterId });
  expect(draft.status).toBe('complete');
  await f.player.client.mutation(api.characters.submit, {
    characterId,
    campaignId: f.campaignId,
    commandId: 'submit-player-heir',
  });
  const before = await f.t.run(ctx => ctx.db.get(characterId));
  const events = await storedEvents(f.t, f.campaignId);
  const args = { characterId, commandId: 'approve-player-heir' };
  await expect(f.director.client.mutation(api.characters.approve, args)).rejects.toThrow(
    /privately choose.*before.*activated/,
  );
  expect(await f.t.run(ctx => ctx.db.get(characterId))).toEqual(before);
  expect(await storedEvents(f.t, f.campaignId)).toEqual(events);
  expect((await f.player.client.query(api.characters.get, { characterId })).review?.status).toBe(
    'pending',
  );
  await choose(f, characterId, 'proposed', 'setup-player-heir');
  expect(await f.player.client.query(api.characterSecrets.inheritance, { characterId })).toBeNull();
  await f.director.client.mutation(api.characters.approve, args);
  const admitted = await f.t.run(ctx => ctx.db.get(characterId));
  expect(admitted!.campaignId).toBe(f.campaignId);
  expect(admitted!.effectiveRevisionId).toBe(admitted!.draftRevisionId);
  expect(admitted!.liveState).not.toBeNull();
  expect(JSON.stringify(await storedEvents(f.t, f.campaignId))).not.toContain('Bastion Belt');
});

test('full-edit approval preserves the effective build and live state until new inheritance setup is supplied', async () => {
  const f = await setup();
  const current = await f.player.client.query(api.characters.get, { characterId: f.thornId });
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    commandId: 'edit-thorn-inheritance',
    expectedRevision: current.revision,
    authored: current.authored,
    selections: heirSelections(),
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId: f.thornId,
    campaignId: f.campaignId,
    commandId: 'submit-thorn-inheritance',
  });
  const before = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  await expect(
    f.director.client.mutation(api.characters.approve, {
      characterId: f.thornId,
      commandId: 'approve-thorn-no-private',
    }),
  ).rejects.toThrow(/privately choose/);
  expect(await f.t.run(ctx => ctx.db.get(f.thornId))).toEqual(before);
  await choose(f, f.thornId, 'proposed', 'setup-thorn-inheritance');
  await f.director.client.mutation(api.characters.approve, {
    characterId: f.thornId,
    commandId: 'approve-thorn-private',
  });
  const after = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  expect(after.effectiveRevisionId).not.toBe(before.effectiveRevisionId);
  expect(after.liveState).toEqual(before.liveState);
});

test('an owning Director configures only their own exact draft before normal logged admission', async () => {
  const f = await setup();
  const characterId = await createHeir(f, f.director, 'DirectorHeir');
  const playerId = await createHeir(f, f.player, 'UnsubmittedPlayerHeir');
  const draftArgs = { characterId, view: 'draft' as const, campaignId: f.campaignId };
  expect(await f.player.client.query(api.characterSecrets.inheritance, draftArgs)).toBeNull();
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, {
      ...draftArgs,
      characterId: playerId,
    }),
  ).toBeNull();
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, { characterId, view: 'draft' }),
  ).toBeNull();
  const before = (await f.t.run(ctx => ctx.db.get(characterId)))!;
  await expect(
    f.director.client.mutation(api.characters.submit, {
      characterId,
      campaignId: f.campaignId,
      commandId: 'admit-own-heir-no-setup',
    }),
  ).rejects.toThrow(/privately choose/);
  expect(await f.t.run(ctx => ctx.db.get(characterId))).toEqual(before);
  expect((await f.director.client.query(api.characters.get, { characterId })).review).toBeNull();
  const context = await choose(f, characterId, 'draft', 'setup-own-heir');
  await f.director.client.mutation(api.characters.save, {
    characterId,
    commandId: 'edit-own-heir-after-setup',
    expectedRevision: before.revision,
    authored: { ...before.authored, biography: 'A new saved revision' },
    selections: heirSelections(),
  });
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      characterId,
      commandId: 'stale-own-heir-private',
      itemName: 'Scannerstone',
      expectedView: 'draft',
      expectedCampaignId: f.campaignId,
      expectedCharacterRevision: context.characterRevision,
      expectedBuildRevisionId: context.buildRevisionId,
      expectedVersion: 1,
    }),
  ).rejects.toThrow(/build changed/);
  // The valid prior choice remains the same grant; an ordinary later revision does not reset it.
  await f.director.client.mutation(api.characters.submit, {
    characterId,
    campaignId: f.campaignId,
    commandId: 'admit-own-heir-configured',
  });
  const admitted = await f.director.client.query(api.characters.get, { characterId });
  expect(admitted.review?.status).toBe('logged');
  expect(admitted.draftIsEffective).toBe(true);
  expect(
    (await f.director.client.query(api.characterSecrets.inheritance, { characterId }))!.version,
  ).toBe(1);
});

test('an attached owning Director can set up a new inheritance on an unsubmitted full-edit draft', async () => {
  const f = await setup();
  const characterId = await admitHero(f.t, f.director, f.director, f.campaignId, 'OwnExisting');
  const current = await f.director.client.query(api.characters.get, { characterId });
  await f.director.client.mutation(api.characters.save, {
    characterId,
    commandId: 'edit-own-existing',
    expectedRevision: current.revision,
    authored: current.authored,
    selections: heirSelections(),
  });
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, { characterId }),
  ).toBeNull();
  const otherCampaign = await f.director.client.mutation(api.campaigns.create, {
    name: 'Other destination',
    commandId: 'other-private-destination',
  });
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, {
      characterId,
      view: 'draft',
      campaignId: otherCampaign,
    }),
  ).toBeNull();
  await choose(f, characterId, 'draft', 'setup-own-existing');
  await f.director.client.mutation(api.characters.submit, {
    characterId,
    campaignId: f.campaignId,
    commandId: 'submit-own-existing',
  });
  expect((await f.director.client.query(api.characters.get, { characterId })).review?.status).toBe(
    'logged',
  );
});

test('activation validates private source identity and the granting revision, not just row existence', async () => {
  const f = await setup();
  const characterId = await createHeir(f, f.player, 'CheckedHeir');
  await f.player.client.mutation(api.characters.submit, {
    characterId,
    campaignId: f.campaignId,
    commandId: 'submit-checked-heir',
  });
  await choose(f, characterId, 'proposed', 'setup-checked-heir');
  const secret = (await f.t.run(ctx =>
    ctx.db
      .query('characterSecrets')
      .withIndex('by_character_campaign', q =>
        q.eq('characterId', characterId).eq('campaignId', f.campaignId),
      )
      .unique(),
  ))!;
  const unrelated = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  await f.t.run(ctx =>
    ctx.db.patch(secret._id, { basedOnRevisionId: unrelated.effectiveRevisionId! }),
  );
  await expect(
    f.director.client.mutation(api.characters.approve, {
      characterId,
      commandId: 'refuse-unrelated-private-origin',
    }),
  ).rejects.toThrow(/privately choose/);
  await f.t.run(ctx =>
    ctx.db.patch(secret._id, {
      basedOnRevisionId: secret.basedOnRevisionId,
      itemSourcePath: 'wrong/source.md',
    }),
  );
  await expect(
    f.director.client.mutation(api.characters.approve, {
      characterId,
      commandId: 'refuse-wrong-private-source',
    }),
  ).rejects.toThrow(/privately choose/);
  await f.t.run(ctx => ctx.db.patch(secret._id, { itemSourcePath: secret.itemSourcePath }));
  await f.director.client.mutation(api.characters.approve, {
    characterId,
    commandId: 'approve-valid-private-origin',
  });
});

test('standalone save and restore preserve drafts without borrowing another campaign private choice', async () => {
  const f = await setup();
  const current = await f.player.client.query(api.characters.get, { characterId: f.thornId });
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    commandId: 'save-before-standalone',
    expectedRevision: current.revision,
    authored: current.authored,
    selections: heirSelections(),
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId: f.thornId,
    campaignId: f.campaignId,
    commandId: 'submit-before-standalone',
  });
  await choose(f, f.thornId, 'proposed', 'setup-before-standalone');
  await f.player.client.mutation(api.characters.withdraw, {
    characterId: f.thornId,
    commandId: 'withdraw-before-standalone',
  });
  // Exercise the existing standalone path with retained prior effective/live state.
  await f.t.run(ctx => ctx.db.patch(f.thornId, { campaignId: null }));
  const before = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  const sourceId = before.draftRevisionId!;
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    commandId: 'save-standalone-inheritance',
    expectedRevision: before.revision,
    authored: before.authored,
    selections: heirSelections(),
  });
  const saved = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  expect(saved.draftRevisionId).not.toBe(sourceId);
  expect(saved.effectiveRevisionId).toBe(before.effectiveRevisionId);
  expect(saved.liveState).toEqual(before.liveState);
  const savedRevision = (await f.t.run(ctx => ctx.db.get(saved.draftRevisionId!)))!;
  expect(savedRevision.status).toBe('complete');
  expect(await f.t.run(ctx => pendingDirectorSetup(ctx, f.thornId, savedRevision, null))).toMatch(
    /destination campaign Director/,
  );
  const restoredId = await f.player.client.mutation(api.characters.restore, {
    characterId: f.thornId,
    commandId: 'restore-standalone-inheritance',
    expectedRevision: saved.revision,
    expectedEffectiveRevisionId: saved.effectiveRevisionId,
    sourceRevisionId: sourceId,
  });
  const restored = (await f.t.run(ctx => ctx.db.get(f.thornId)))!;
  expect(restored.draftRevisionId).toBe(restoredId);
  expect(restored.effectiveRevisionId).toBe(before.effectiveRevisionId);
  expect(restored.liveState).toEqual(before.liveState);
});

test('owning Director restore keeps the restored draft available for private setup before logged activation', async () => {
  const f = await setup();
  const characterId = await admitHero(f.t, f.director, f.director, f.campaignId, 'RestoreHeir');
  const original = await f.director.client.query(api.characters.get, { characterId });
  await f.director.client.mutation(api.characters.save, {
    characterId,
    commandId: 'save-historical-heir',
    expectedRevision: original.revision,
    authored: original.authored,
    selections: heirSelections(),
  });
  const historical = (await f.t.run(ctx => ctx.db.get(characterId)))!;
  await f.director.client.mutation(api.characters.save, {
    characterId,
    commandId: 'save-no-longer-heir',
    expectedRevision: historical.revision,
    authored: original.authored,
    selections: original.selections,
  });
  const before = (await f.t.run(ctx => ctx.db.get(characterId)))!;
  const restoredId = await f.director.client.mutation(api.characters.restore, {
    characterId,
    commandId: 'restore-own-unconfigured-heir',
    expectedRevision: before.revision,
    expectedEffectiveRevisionId: before.effectiveRevisionId,
    sourceRevisionId: historical.draftRevisionId!,
  });
  const restored = (await f.t.run(ctx => ctx.db.get(characterId)))!;
  expect(restored.draftRevisionId).toBe(restoredId);
  expect(restored.effectiveRevisionId).toBe(before.effectiveRevisionId);
  expect(restored.liveState).toEqual(before.liveState);
  expect(
    (await f.director.client.query(api.characters.get, { characterId })).pendingDirectorSetup,
  ).toMatch(/privately choose/);
  await choose(f, characterId, 'draft', 'setup-restored-own-heir');
  await f.director.client.mutation(api.characters.submit, {
    characterId,
    campaignId: f.campaignId,
    commandId: 'activate-restored-own-heir',
  });
  const admitted = await f.director.client.query(api.characters.get, { characterId });
  expect(admitted.effectiveRevisionId).toBe(restoredId);
  expect(admitted.review?.status).toBe('logged');
});
