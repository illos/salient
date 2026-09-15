// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from 'vitest';
import { api } from '../../convex/_generated/api';
import { backend, table, heroFixtureSelections, admitHero } from './fixtures/table';

test.each(['same owner', 'other owner'] as const)(
  'an owner sees a new pending submission after 205 withdrawn reviews from %s',
  async historyOwner => {
    const t = backend();
    const { player, director, campaignId, thornId } = await table(t, { session: false });
    const authored = { name: 'Probe', appearance: '', biography: '', notes: '' };
    const characterId = await player.client.mutation(api.characters.create, {
      commandId: 'probe-create',
      authored,
    });
    await player.client.mutation(api.characters.save, {
      commandId: 'probe-save',
      characterId,
      expectedRevision: 1,
      authored,
      selections: heroFixtureSelections(),
    });
    const historyCharacterId =
      historyOwner === 'same owner'
        ? thornId
        : await admitHero(t, director, director, campaignId, 'DirectorHistory');
    const old = await t.run(ctx => ctx.db.get(historyCharacterId));
    await t.run(async ctx => {
      for (let i = 0; i < 205; i++)
        await ctx.db.insert('characterReviews', {
          characterId: historyCharacterId,
          campaignId,
          ownerId: historyOwner === 'same owner' ? player.profile.userId : director.profile.userId,
          revisionId: old!.effectiveRevisionId!,
          revision: 2,
          kind: 'full-edit',
          status: 'withdrawn',
          submittedAt: i,
          decidedAt: i,
          decidedById: director.profile.userId,
        });
    });
    await player.client.mutation(api.characters.submit, {
      commandId: 'probe-submit',
      characterId,
      campaignId,
    });
    const pending = await t.run(ctx =>
      ctx.db
        .query('characterReviews')
        .withIndex('by_character', q => q.eq('characterId', characterId))
        .take(5),
    );
    expect(pending.some(r => r.status === 'pending')).toBe(true);
    const queue = await player.client.query(api.characters.reviews, { campaignId });
    expect(queue.some(r => r.characterId === characterId && r.status === 'pending')).toBe(true);
    expect(queue[0]!.characterId).toBe(characterId);
    expect(queue.every(r => r.ownerId === player.profile.userId)).toBe(true);
    expect(queue.length).toBeLessThanOrEqual(200);
  },
);
