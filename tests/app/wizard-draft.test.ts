// SPDX-License-Identifier: GPL-3.0-only
/**
 * V96: the wizard keeps its working draft on the server from the first choice, without a name,
 * and that draft stays out of the owner's character list until they save it. Proving the two
 * halves together matters: a draft that needs a name cannot be autosaved, and a draft that is
 * listed defeats the point of keeping it inside the wizard.
 */
import { test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';
import { backend, account, heroFixtureSelections } from './fixtures/table';

const blank = { name: '', appearance: '', biography: '', notes: '' };

test('a nameless wizard draft is saved, stays unlisted, and joins the list when saved', async () => {
  const t = backend();
  const owner = await account(t, 'Drafter');

  // The first choice creates the character before the hero has a name.
  const characterId = await owner.client.mutation(api.characters.create, {
    commandId: 'wizard-draft-create',
    authored: blank,
    selections: heroFixtureSelections(),
    wizardDraft: true,
  });
  expect(await owner.client.query(api.characters.listMine, {})).toEqual([]);
  expect(await owner.client.query(api.characters.wizardDraft, {})).toEqual(characterId);

  // Autosave keeps writing to it, still nameless and still unlisted.
  const revision = await owner.client.mutation(api.characters.save, {
    commandId: 'wizard-draft-autosave',
    characterId,
    expectedRevision: 1,
    authored: blank,
    selections: heroFixtureSelections(),
  });
  expect(await owner.client.query(api.characters.listMine, {})).toEqual([]);
  const saved = await owner.client.query(api.characters.get, { characterId });
  expect(saved.wizardDraft).toBe(true);
  expect(saved.selections.length).toBeGreaterThan(0);

  // Saving the hero needs the name, and is what puts it in the list.
  await expect(
    owner.client.mutation(api.characters.save, {
      commandId: 'wizard-draft-list-unnamed',
      characterId,
      expectedRevision: revision,
      authored: blank,
      selections: heroFixtureSelections(),
      list: true,
    }),
  ).rejects.toThrow(/character name/i);

  await owner.client.mutation(api.characters.save, {
    commandId: 'wizard-draft-list-save',
    characterId,
    expectedRevision: revision,
    authored: { ...blank, name: 'Named at last' },
    selections: heroFixtureSelections(),
    list: true,
  });
  const listed = await owner.client.query(api.characters.listMine, {});
  expect(listed.map(character => character.name)).toEqual(['Named at last']);
  expect(await owner.client.query(api.characters.wizardDraft, {})).toBeNull();
});

test('creating a character outside the wizard still requires a name and is listed', async () => {
  const t = backend();
  const owner = await account(t, 'Direct');
  await expect(
    owner.client.mutation(api.characters.create, {
      commandId: 'wizard-direct-no-name',
      authored: blank,
    }),
  ).rejects.toThrow(/character name/i);
  await owner.client.mutation(api.characters.create, {
    commandId: 'wizard-direct-named',
    authored: { ...blank, name: 'Listed' },
  });
  const listed = await owner.client.query(api.characters.listMine, {});
  expect(listed.map(character => character.name)).toEqual(['Listed']);
});
