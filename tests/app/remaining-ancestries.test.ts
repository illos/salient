// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation';
import { account, backend, admitHero, table } from './fixtures/table';

function selections(ancestry: string, choices: Record<string, SelectionValue>) {
  const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
    selections: Record<string, SelectionValue>;
  };
  for (const key of Object.keys(fixture.selections))
    if (key.startsWith('ancestry.')) delete fixture.selections[key];
  return draftSelectionsFrom(
    { ...fixture.selections, 'ancestry.choice': ancestry, ...choices },
    getDefinitions(1),
  );
}
// Catches native gift metadata being lost during manual-use projection and a proposed edit leaking into
// the effective table. Adds persisted sheet/table boundary coverage beyond pure evaluator witnesses.
test('Time Raider native and prose actions project to table while draft edits preserve resources', async () => {
  const t = backend();
  await t.action(internal.content.reseed, {});
  const f = await table(t);
  const outsider = await account(t, 'AncestryOutsider');
  const characterId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Raider',
    selections('Time Raider', {
      'ancestry.time-raider.purchased-traits': ['Beyondsight', 'Psionic Gift'],
      'ancestry.time-raider.psionic-gift.ability': 'Psionic Bolt',
    }),
  );
  const args = {
    campaignId: f.campaignId,
    actor: { kind: 'character' as const, id: characterId, name: 'Raider' },
  };
  const sheet = await f.player.client.query(api.characters.sheet, { characterId });
  if (sheet.audience === 'peer') throw new Error('Expected owner');
  expect(sheet.abilities.find(a => a.name === 'Psionic Bolt')?.metadata.tiers).toHaveLength(3);
  expect(sheet.abilities.find(a => a.name === 'Beyondsight')?.group).toBe('maneuver');
  const tableSheet = await f.player.client.query(api.abilities.sheet, args);
  const bolt = tableSheet.abilities.find(a => a.name === 'Psionic Bolt');
  // The existing roll parser splits only 'or'; this source's comma-separated R/I/P stays manual.
  expect(bolt?.kind).toBe('recorded');
  expect(bolt?.tiers).toHaveLength(3);
  expect(bolt?.tiers?.[0]).toContain('2 + R, I, or P psychic damage');
  expect(bolt?.roll).toContain('Reason');
  expect(bolt?.target).toBe('One creature or object');
  expect(tableSheet.abilities.find(a => a.name === 'Beyondsight')?.kind).toBe('recorded');
  await expect(outsider.client.query(api.abilities.sheet, args)).rejects.toThrow();
  await expect(
    outsider.client.query(api.characterWizard.discover, { characterId }),
  ).rejects.toThrow();
  const beforeUse = await f.player.client.query(api.characters.get, { characterId });
  const use = await f.player.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'raider-manual-bolt',
    operation: 'ability.use',
    actor: { refKind: 'character', id: characterId },
    arguments: { ability: 'Psionic Bolt', targets: [{ refKind: 'character', id: f.thornId }] },
  });
  const recorded = (await t.run(ctx => ctx.db.get(use.eventId)))!;
  expect(recorded.kind).toBe('ability.recorded');
  const data = recorded.payload.data as {
    manual: boolean;
    ability: { name: string; tiers: string[] };
  };
  expect(data.manual).toBe(true);
  expect(data.ability.name).toBe('Psionic Bolt');
  expect(data.ability.tiers).toEqual(bolt?.tiers);
  expect((await f.player.client.query(api.characters.get, { characterId })).liveState).toEqual(
    beforeUse.liveState,
  );
  const stored = (await t.run(ctx => ctx.db.get(characterId)))!;
  const live = { ...stored.liveState!, stamina: 17, recoveries: 3 };
  await t.run(ctx => ctx.db.patch(characterId, { liveState: live }));
  const saved = await f.player.client.query(api.characters.get, { characterId });
  const changed = await f.player.client.query(api.characterWizard.transition, {
    characterId,
    selections: saved.selections,
    decisionId: 'ancestry.time-raider.purchased-traits',
    value: ['Foresight', 'Unstoppable Mind'],
  });
  expect(changed.removed).toContain('ancestry.time-raider.psionic-gift.ability');
  await f.player.client.mutation(api.characters.save, {
    characterId,
    commandId: 'raider-draft',
    expectedRevision: saved.revision,
    authored: saved.authored,
    selections: changed.selections,
  });
  const after = await f.player.client.query(api.characters.get, { characterId });
  expect(after.liveState).toEqual(live);
  expect(
    after.selections.some(s => s.decisionId === 'ancestry.time-raider.psionic-gift.ability'),
  ).toBe(false);
  const effective = await f.player.client.query(api.abilities.sheet, args);
  expect(effective.abilities.map(a => a.name)).toContain('Psionic Bolt');
  expect(effective.abilities.map(a => a.name)).not.toContain('Foresight');
});

// Catches catalog lookup incorrectly requiring the original ancestry label/decision ID for a
// borrowed trait, and prevents former-life replacement from leaving its old ability behind.
test('Revenant borrowed prose actions reach the effective table and disappear after former-life replacement', async () => {
  const t = backend();
  await t.action(internal.content.reseed, {});
  const f = await table(t);
  const characterId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'BorrowedKeeper',
    selections('Revenant', {
      'ancestry.revenant.former-life': 'Memonek',
      'ancestry.revenant.memonek.purchased-traits': ['Keeper of Order'],
    }),
  );
  const actor = { kind: 'character' as const, id: characterId, name: 'BorrowedKeeper' };
  const projected = await f.player.client.query(api.abilities.sheet, {
    campaignId: f.campaignId,
    actor,
  });
  expect(projected.abilities.find(a => a.name === 'Keeper of Order')?.kind).toBe('recorded');
  const owned = await f.player.client.query(api.characters.sheet, { characterId });
  if (owned.audience === 'peer') throw new Error('Expected owner');
  expect(owned.abilities.find(a => a.name === 'Keeper of Order')?.grantedBy.decisionId).toBe(
    'ancestry.revenant.memonek.purchased-traits',
  );
  const before = await f.player.client.query(api.characters.get, { characterId });
  let changed = await f.player.client.query(api.characterWizard.transition, {
    characterId,
    selections: before.selections,
    decisionId: 'ancestry.revenant.former-life',
    value: 'Time Raider',
  });
  expect(changed.removed).toContain('ancestry.revenant.memonek.purchased-traits');
  changed = await f.player.client.query(api.characterWizard.transition, {
    characterId,
    selections: changed.selections,
    decisionId: 'ancestry.revenant.time-raider.purchased-traits',
    value: ['Psionic Gift'],
  });
  changed = await f.player.client.query(api.characterWizard.transition, {
    characterId,
    selections: changed.selections,
    decisionId: 'ancestry.revenant.time-raider.psionic-gift.ability',
    value: 'Minor Acceleration',
  });
  await f.player.client.mutation(api.characters.save, {
    characterId,
    commandId: 'borrowed-draft',
    expectedRevision: before.revision,
    authored: before.authored,
    selections: changed.selections,
  });
  await f.player.client.mutation(api.characters.submit, {
    characterId,
    campaignId: f.campaignId,
    commandId: 'borrowed-submit',
  });
  await f.director.client.mutation(api.characters.approve, {
    characterId,
    commandId: 'borrowed-approve',
  });
  const after = await f.player.client.query(api.abilities.sheet, {
    campaignId: f.campaignId,
    actor,
  });
  expect(after.abilities.map(a => a.name)).toContain('Minor Acceleration');
  expect(after.abilities.map(a => a.name)).not.toContain('Keeper of Order');
  const saved = await f.player.client.query(api.characters.get, { characterId });
  expect(saved.liveState).toEqual(before.liveState);
});
