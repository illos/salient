// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';
import { backend, table, heroFixtureSelections } from './fixtures/table';

test('Q-CHAR-10 shared evaluation, persisted draft and admission allow two of three ancestry points', async () => {
  const t = backend();
  const { player, director, campaignId } = await table(t, { session: false });
  const authored = { name: 'Unspent', appearance: '', biography: '', notes: '' };
  const characterId = await player.client.mutation(api.characters.create, {
    commandId: 'unspent-create',
    authored,
  });
  const selections = heroFixtureSelections({
    'ancestry.devil.purchased-traits': ['Impressive Horns'],
  });
  const evaluation = await player.client.query(api.characters.evaluate, { selections });
  expect(evaluation.status).toBe('complete');
  expect(evaluation.diagnostics['ancestry.devil.purchased-traits']).toEqual([
    expect.objectContaining({ severity: 'warning', code: 'budget-unspent' }),
  ]);
  await player.client.mutation(api.characters.save, {
    commandId: 'unspent-save',
    characterId,
    authored,
    expectedRevision: 1,
    selections,
  });
  const saved = await player.client.query(api.characters.get, { characterId });
  expect(saved.evaluation).toEqual(evaluation);
  await player.client.mutation(api.characters.submit, {
    commandId: 'unspent-submit',
    characterId,
    campaignId,
  });
  await director.client.mutation(api.characters.approve, {
    commandId: 'unspent-approve',
    characterId,
    campaignId,
  });
  const stored = (await t.run(ctx => ctx.db.get(characterId)))!;
  expect(stored.effectiveRevisionId).toBe(stored.draftRevisionId);
  expect(stored.liveState!.stamina).toBe(30);
  expect(JSON.stringify(stored.derivedBaseline)).not.toContain('Q-CHAR-10');
});

test('Q-CHAR-11 duplicate-choice draft cannot activate or change its existing live build', async () => {
  const t = backend();
  const { player, campaignId, thornId } = await table(t, { session: false });
  const before = (await t.run(ctx => ctx.db.get(thornId)))!;
  const selections = heroFixtureSelections({ 'career.soldier.skill.exploration': 'Lift' });
  const evaluation = await player.client.query(api.characters.evaluate, { selections });
  expect(evaluation.status).toBe('invalid');
  expect(evaluation.diagnostics['career.soldier.skill.exploration']).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ severity: 'invalid', code: 'duplicate-skill' }),
    ]),
  );
  await player.client.mutation(api.characters.save, {
    commandId: 'duplicate-save',
    characterId: thornId,
    authored: before.authored,
    expectedRevision: before.revision,
    selections,
  });
  const saved = await player.client.query(api.characters.get, { characterId: thornId });
  expect(saved.evaluation).toEqual(evaluation);
  await expect(
    player.client.mutation(api.characters.submit, {
      commandId: 'duplicate-submit',
      characterId: thornId,
      campaignId,
    }),
  ).rejects.toThrow('saved build is invalid');
  const after = (await t.run(ctx => ctx.db.get(thornId)))!;
  expect(after.liveState).toEqual(before.liveState);
  expect(after.derivedBaseline).toEqual(before.derivedBaseline);
  expect(after.effectiveRevisionId).toBe(before.effectiveRevisionId);
});
