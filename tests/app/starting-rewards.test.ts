import { runStartingItems } from '../../scripts/headless/starting-items';
// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { makeFunctionReference } from 'convex/server';
import type { Value } from 'convex/values';
import { api } from '../../convex/_generated/api';
import { account, admitHero, backend, table } from './fixtures/table';
import type { Actor, ScenarioContext } from '../../scripts/headless/character-client';
import { rewardChoices, runStartingRewards } from '../../scripts/headless/starting-rewards';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { getDefinitions } from '../../shared/content/character-decisions';

// Same publicly callable proof runs against the real development app; no separate test-only flow.
test('starting awards survive career changes and restored builds through public routes', async () => {
  const t = backend();
  const actors = {} as ScenarioContext['actors'];
  for (const role of ['director', 'player', 'peer'] as const) {
    const { client } = await account(t, `Rewards${role}`);
    actors[role] = {
      query: <T>(name: string, args: Record<string, unknown>) =>
        client.query(
          makeFunctionReference<'query', Record<string, Value>, T>(name),
          args as Record<string, Value>,
        ),
      mutation: <T>(name: string, args: Record<string, unknown>) =>
        client.mutation(
          makeFunctionReference<'mutation', Record<string, Value>, T>(name),
          args as Record<string, Value>,
        ),
    } satisfies Actor;
  }
  await runStartingRewards({
    actors,
    runId: 'convex-test-v86',
    run: async (_name, fn) => {
      await fn();
      return true;
    },
    skip: (_name, reason) => expect.fail(reason),
  });
});

// Catches ownership-only item delivery, dropped actions, draft leakage and unauthorized use.
test('all starting treasures retain possession and granted manual action routes', async () => {
  const t = backend();
  const actors = {} as ScenarioContext['actors'];
  for (const role of ['director', 'player', 'peer'] as const) {
    const { client } = await account(t, `Rewards${role}`);
    actors[role] = {
      query: <T>(name: string, args: Record<string, unknown>) =>
        client.query(
          makeFunctionReference<'query', Record<string, Value>, T>(name),
          args as Record<string, Value>,
        ),
      mutation: <T>(name: string, args: Record<string, unknown>) =>
        client.mutation(
          makeFunctionReference<'mutation', Record<string, Value>, T>(name),
          args as Record<string, Value>,
        ),
    } satisfies Actor;
  }
  await runStartingItems({
    actors,
    runId: 'convex-test-v86',
    run: async (_name, fn) => {
      await fn();
      return true;
    },
    skip: (_name, reason) => expect.fail(reason),
  });
});

// A historical fixture is necessary: public new admissions already create the snapshot. This
// catches legacy initialization stealing current-career benefits, retries regranting, and invalid
// origin/stale/unauthorized requests writing a reward or command receipt.
test('legacy initialization uses original admission with stale, authority and receipt protection', async () => {
  const t = backend();
  const f = await table(t, { session: false });
  const characterId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'LegacyRewards',
    draftSelectionsFrom(rewardChoices('Artisan'), getDefinitions(1)),
  );
  const original = (await t.run(ctx => ctx.db.get(characterId)))!;
  const beforeEdit = await f.player.client.query(api.characters.get, { characterId });
  await f.player.client.mutation(api.characters.save, {
    commandId: 'rewards-new-career',
    characterId,
    expectedRevision: beforeEdit.revision,
    authored: beforeEdit.authored,
    selections: draftSelectionsFrom(rewardChoices('Aristocrat'), getDefinitions(1)),
  });
  await f.player.client.mutation(api.characters.submit, {
    commandId: 'rewards-submit-edit',
    characterId,
    campaignId: f.campaignId,
  });
  await f.director.client.mutation(api.characters.approve, {
    commandId: 'rewards-approve-edit',
    characterId,
  });
  await t.run(ctx => ctx.db.patch(characterId, { startingRewards: undefined }));
  const state = await f.player.client.query(api.characterRewards.get, { characterId });
  expect(state.canInitialize).toBe(true);
  const args = {
    commandId: 'rewards-legacy-initialize',
    characterId,
    expectedCharacterRevision: state.characterRevision,
    expectedOriginRevisionId: original.liveState!.origin.buildRevisionId,
  };
  await expect(
    f.observer.client.query(api.characterRewards.get, { characterId }),
  ).rejects.toThrow();
  await expect(f.observer.client.mutation(api.characterRewards.initialize, args)).rejects.toThrow();
  await expect(
    f.player.client.mutation(api.characterRewards.initialize, {
      ...args,
      expectedCharacterRevision: state.characterRevision - 1,
    }),
  ).rejects.toThrow(/changed/);
  expect((await t.run(ctx => ctx.db.get(characterId)))!.startingRewards).toBeUndefined();
  const reward = await f.player.client.mutation(api.characterRewards.initialize, args);
  expect([reward.wealth, reward.renown, reward.projectPoints]).toEqual([1, 0, 240]);
  expect(reward.originRevisionId).toBe(original.liveState!.origin.buildRevisionId);
  expect(await f.player.client.mutation(api.characterRewards.initialize, args)).toEqual(reward);
  const after = (await t.run(ctx => ctx.db.get(characterId)))!;
  expect(after.revision).toBe(state.characterRevision + 1);
  expect(after.liveState).toEqual(original.liveState);
  expect(
    await t.run(ctx =>
      ctx.db
        .query('commands')
        .withIndex('by_user_command', q =>
          q.eq('userId', f.observer.profile.userId).eq('commandId', args.commandId),
        )
        .unique(),
    ),
  ).toBeNull();
  // Corrupt/missing source must remain explicitly blocked, never use the current Aristocrat.
  await t.run(async ctx => {
    await ctx.db.patch(characterId, { startingRewards: undefined });
    await ctx.db.delete(original.liveState!.origin.buildRevisionId);
  });
  const blocked = await f.player.client.query(api.characterRewards.get, { characterId });
  expect(blocked.canInitialize).toBe(false);
  expect(blocked.initializationBlocked).toMatch(/original admission revision/);
  await expect(
    f.player.client.mutation(api.characterRewards.initialize, {
      ...args,
      commandId: 'rewards-missing-origin',
      expectedCharacterRevision: after.revision,
    }),
  ).rejects.toThrow(/original admission revision/);
});
