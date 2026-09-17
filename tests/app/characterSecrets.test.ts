// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { account, backend, storedEvents, table } from './fixtures/table';

async function setup() {
  const t = backend();
  const f = await table(t, { session: false });
  const outsider = await account(t, 'Outsider');
  const current = await f.player.client.query(api.characters.get, { characterId: f.thornId });
  const selections = draftSelectionsFrom(
    {
      ...Object.fromEntries(
        current.selections.map(selection => [selection.decisionId, selection.value]),
      ),
      'complication.choice': 'Strange Inheritance',
    },
    getDefinitions(1),
  );
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    commandId: 'save-strange-inheritance',
    expectedRevision: current.revision,
    authored: current.authored,
    selections,
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId: f.thornId,
    campaignId: f.campaignId,
    commandId: 'submit-strange-inheritance',
  });
  const proposal = await f.director.client.query(api.characterSecrets.inheritance, {
    characterId: f.thornId,
    view: 'proposed',
  });
  await f.director.client.mutation(api.characterSecrets.saveInheritance, {
    characterId: f.thornId,
    commandId: 'initial-inheritance-setup',
    itemName: 'Scannerstone',
    expectedCampaignId: f.campaignId,
    expectedCharacterRevision: proposal!.characterRevision,
    expectedBuildRevisionId: proposal!.buildRevisionId,
    expectedView: 'proposed',
    expectedVersion: 0,
  });
  await f.director.client.mutation(api.characters.approve, {
    characterId: f.thornId,
    commandId: 'approve-strange-inheritance',
  });
  return { t, ...f, outsider, selections };
}
async function argsFor(f: Awaited<ReturnType<typeof setup>>) {
  const view = await f.director.client.query(api.characterSecrets.inheritance, {
    characterId: f.thornId,
  });
  expect(view).not.toBeNull();
  return {
    characterId: f.thornId,
    commandId: 'choose-private-inheritance',
    itemName: 'Bastion Belt',
    expectedCampaignId: view!.campaignId,
    expectedCharacterRevision: view!.characterRevision,
    expectedBuildRevisionId: view!.buildRevisionId,
    expectedVersion: view!.version,
  };
}

test('only the campaign Director can read/write the inheritance; public revisions, sheets and events disclose no item', async () => {
  const f = await setup();
  const args = await argsFor(f);
  const events = await storedEvents(f.t, f.campaignId);
  for (const identity of [f.player, f.observer, f.outsider]) {
    expect(
      await identity.client.query(api.characterSecrets.inheritance, { characterId: f.thornId }),
    ).toBeNull();
    await expect(
      identity.client.mutation(api.characterSecrets.saveInheritance, args),
    ).rejects.toThrow(/Director/);
  }
  expect(await f.director.client.mutation(api.characterSecrets.saveInheritance, args)).toBe(2);
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, { characterId: f.thornId }),
  ).toMatchObject({ version: 2, item: { name: 'Bastion Belt' } });
  for (const identity of [f.player, f.observer, f.outsider])
    expect(
      await identity.client.query(api.characterSecrets.inheritance, { characterId: f.thornId }),
    ).toBeNull();
  const owner = await f.player.client.query(api.characters.get, { characterId: f.thornId });
  const sheet = await f.player.client.query(api.characters.sheet, { characterId: f.thornId });
  const peerSheet = await f.observer.client.query(api.characters.sheet, { characterId: f.thornId });
  const history = await f.player.client.query(api.characters.history, {
    characterId: f.thornId,
    paginationOpts: { cursor: null, numItems: 50 },
  });
  const snapshot = await f.player.client.query(api.characters.historySnapshot, {
    characterId: f.thornId,
    revisionId: owner.effectiveRevisionId!,
  });
  expect(JSON.stringify({ owner, sheet, peerSheet, history, snapshot })).not.toContain(
    'Bastion Belt',
  );
  expect(await storedEvents(f.t, f.campaignId)).toEqual(events);
});

test('source pool, revisions, versions and command retries guard the single private row', async () => {
  const f = await setup();
  const args = await argsFor(f);
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...args,
      itemName: 'Quantum Satchel',
    }),
  ).rejects.toThrow(/second-echelon/);
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...args,
      expectedCharacterRevision: args.expectedCharacterRevision - 1,
    }),
  ).rejects.toThrow(/build changed/);
  expect(await f.director.client.mutation(api.characterSecrets.saveInheritance, args)).toBe(2);
  expect(await f.director.client.mutation(api.characterSecrets.saveInheritance, args)).toBe(2);
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...args,
      itemName: 'Evilest Eye',
    }),
  ).rejects.toThrow(/different request/);
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...args,
      commandId: 'stale-private-choice',
    }),
  ).rejects.toThrow(/selection changed/);
  expect(
    await f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...args,
      commandId: 'replace-private-choice',
      itemName: 'Evilest Eye',
      expectedVersion: 2,
    }),
  ).toBe(3);
  const rows = await f.t.run(ctx =>
    ctx.db
      .query('characterSecrets')
      .withIndex('by_character_campaign', q =>
        q.eq('characterId', f.thornId).eq('campaignId', f.campaignId),
      )
      .take(2),
  );
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    itemName: 'Evilest Eye',
    version: 3,
    updatedById: f.director.profile.userId,
  });
});

test('campaign change, removal of the complication and combat lock refuse stale writes', async () => {
  const f = await setup();
  const args = await argsFor(f);
  await f.director.client.mutation(api.characterSecrets.saveInheritance, args);
  const otherCampaign = await f.director.client.mutation(api.campaigns.create, {
    name: 'Second campaign',
    commandId: 'second-secret-campaign',
  });
  await f.t.run(ctx => ctx.db.patch(f.thornId, { campaignId: otherCampaign }));
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...args,
      expectedVersion: 2,
      commandId: 'wrong-private-campaign',
    }),
  ).rejects.toThrow(/campaign changed/);
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, { characterId: f.thornId }),
  ).toMatchObject({ campaignId: otherCampaign, version: 0, item: null });
  await f.t.run(ctx => ctx.db.patch(f.thornId, { campaignId: f.campaignId, combatLocked: true }));
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...args,
      expectedVersion: 2,
      commandId: 'locked-private-choice',
    }),
  ).rejects.toThrow(/locked during combat/);
  await f.t.run(ctx => ctx.db.patch(f.thornId, { combatLocked: false }));
  const current = await f.player.client.query(api.characters.get, { characterId: f.thornId });
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    commandId: 'remove-inheritance',
    expectedRevision: current.revision,
    authored: current.authored,
    selections: current.selections.filter(
      selection => !selection.decisionId.startsWith('complication.'),
    ),
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId: f.thornId,
    campaignId: f.campaignId,
    commandId: 'submit-without-inheritance',
  });
  await f.director.client.mutation(api.characters.approve, {
    characterId: f.thornId,
    commandId: 'approve-without-inheritance',
  });
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, { characterId: f.thornId }),
  ).toBeNull();
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...args,
      expectedVersion: 2,
      commandId: 'obsolete-inheritance',
    }),
  ).rejects.toThrow(/Director/);
});

test('pending admission Director can select privately, including an owning Director after admission', async () => {
  const f = await setup();
  const authored = { name: 'Pending heir', appearance: '', biography: '', notes: '' };
  const characterId = await f.player.client.mutation(api.characters.create, {
    commandId: 'create-pending-heir',
    authored,
  });
  await f.player.client.mutation(api.characters.save, {
    characterId,
    commandId: 'save-pending-heir',
    expectedRevision: 1,
    authored,
    selections: f.selections,
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId,
    campaignId: f.campaignId,
    commandId: 'submit-pending-heir',
  });
  const pending = await f.director.client.query(api.characterSecrets.inheritance, { characterId });
  expect(pending).not.toBeNull();
  await f.director.client.mutation(api.characterSecrets.saveInheritance, {
    characterId,
    commandId: 'pending-heir-secret',
    itemName: 'Scannerstone',
    expectedCampaignId: pending!.campaignId,
    expectedCharacterRevision: pending!.characterRevision,
    expectedBuildRevisionId: pending!.buildRevisionId,
    expectedVersion: 0,
  });
  expect(await f.player.client.query(api.characterSecrets.inheritance, { characterId })).toBeNull();
  await f.player.client.mutation(api.characters.withdraw, {
    characterId,
    commandId: 'withdraw-pending-heir',
  });
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, { characterId }),
  ).toBeNull();
  const ownAuthored = { ...authored, name: 'DirectorHeir' };
  const ownId = await f.director.client.mutation(api.characters.create, {
    commandId: 'create-own-private-heir',
    authored: ownAuthored,
  });
  await f.director.client.mutation(api.characters.save, {
    characterId: ownId,
    commandId: 'save-own-private-heir',
    expectedRevision: 1,
    authored: ownAuthored,
    selections: f.selections,
  });
  const ownDraft = await f.director.client.query(api.characterSecrets.inheritance, {
    characterId: ownId,
    view: 'draft',
    campaignId: f.campaignId,
  });
  await f.director.client.mutation(api.characterSecrets.saveInheritance, {
    characterId: ownId,
    commandId: 'setup-own-private-heir',
    itemName: 'Scannerstone',
    expectedCampaignId: f.campaignId,
    expectedCharacterRevision: ownDraft!.characterRevision,
    expectedBuildRevisionId: ownDraft!.buildRevisionId,
    expectedView: 'draft',
    expectedVersion: 0,
  });
  await f.director.client.mutation(api.characters.submit, {
    characterId: ownId,
    campaignId: f.campaignId,
    commandId: 'admit-own-private-heir',
  });
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, { characterId: ownId }),
  ).not.toBeNull();
});

test('effective and proposed sheets bind private writes to the displayed revision and share version guards', async () => {
  const f = await setup();
  const active = await f.player.client.query(api.characters.get, { characterId: f.thornId });
  const effectiveId = active.effectiveRevisionId!;
  await f.player.client.mutation(api.characters.save, {
    characterId: f.thornId,
    commandId: 'save-second-inheritance-build',
    expectedRevision: active.revision,
    authored: active.authored,
    selections: active.selections,
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId: f.thornId,
    campaignId: f.campaignId,
    commandId: 'submit-second-inheritance-build',
  });
  const current = await f.player.client.query(api.characters.get, { characterId: f.thornId });
  const effective = await f.director.client.query(api.characterSecrets.inheritance, {
    characterId: f.thornId,
    view: 'effective',
    displayedRevision: active.effectiveRevision!,
  });
  const proposed = await f.director.client.query(api.characterSecrets.inheritance, {
    characterId: f.thornId,
    view: 'proposed',
    displayedRevision: current.revision,
  });
  expect(effective).toMatchObject({ view: 'effective', buildRevisionId: effectiveId });
  expect(proposed).toMatchObject({ view: 'proposed', buildRevision: current.revision });
  expect(proposed!.buildRevisionId).not.toBe(effectiveId);
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, { characterId: f.thornId }),
  ).toMatchObject({ buildRevisionId: effectiveId });
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, {
      characterId: f.thornId,
      view: 'effective',
      displayedRevision: current.revision,
    }),
  ).toBeNull();
  const effectiveArgs = {
    characterId: f.thornId,
    commandId: 'choose-effective-inheritance',
    itemName: 'Bastion Belt',
    expectedCampaignId: effective!.campaignId,
    expectedCharacterRevision: effective!.characterRevision,
    expectedBuildRevisionId: effective!.buildRevisionId,
    expectedVersion: effective!.version,
    expectedView: 'effective' as const,
  };
  await f.director.client.mutation(api.characterSecrets.saveInheritance, effectiveArgs);
  const readPrivate = () =>
    f.t.run(ctx =>
      ctx.db
        .query('characterSecrets')
        .withIndex('by_character_campaign', q =>
          q.eq('characterId', f.thornId).eq('campaignId', f.campaignId),
        )
        .unique(),
    );
  expect(await readPrivate()).toMatchObject({ basedOnRevisionId: effectiveId, version: 2 });
  const proposedArgs = {
    ...effectiveArgs,
    commandId: 'choose-proposed-inheritance',
    expectedBuildRevisionId: proposed!.buildRevisionId,
    expectedVersion: proposed!.version,
    expectedView: 'proposed' as const,
  };
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, proposedArgs),
  ).rejects.toThrow(/selection changed/);
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...proposedArgs,
      expectedVersion: 2,
      expectedView: 'effective',
    }),
  ).rejects.toThrow(/build changed/);
  await f.director.client.mutation(api.characterSecrets.saveInheritance, {
    ...proposedArgs,
    expectedVersion: 2,
  });
  expect(await readPrivate()).toMatchObject({
    basedOnRevisionId: proposed!.buildRevisionId,
    version: 3,
  });
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...effectiveArgs,
      commandId: 'stale-effective-inheritance',
    }),
  ).rejects.toThrow(/selection changed/);
  await f.player.client.mutation(api.characters.withdraw, {
    characterId: f.thornId,
    commandId: 'withdraw-proposed-inheritance',
  });
  expect(
    await f.director.client.query(api.characterSecrets.inheritance, {
      characterId: f.thornId,
      view: 'proposed',
    }),
  ).toBeNull();
  await expect(
    f.director.client.mutation(api.characterSecrets.saveInheritance, {
      ...proposedArgs,
      commandId: 'withdrawn-proposed-inheritance',
      expectedVersion: 3,
    }),
  ).rejects.toThrow(/Director/);
});
