// SPDX-License-Identifier: GPL-3.0-only
// V68 campaign home at the shared-operation level (docs/build/V68-campaign-home.md acceptance
// checks 2, 3, 5 and 7): presence membership and expiry, session titles and numbering, the light
// chat's boundaries (membership, validation, retry identity, no game-log entry, no undo seam) and
// the member-hero projection. Each test names the failure it catches; the UI is not exercised.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import * as chatModule from '../../convex/chat';
import { ONLINE_WINDOW_MS } from '../../convex/presence';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { account, admit, admitHero, backend, storedEvents, table } from './fixtures/table';

afterEach(() => vi.useRealTimers());

describe('V68 campaign home operations', () => {
  test('presence lists only members with a fresh heartbeat; leave and expiry remove them', async () => {
    // Fails if heartbeat/list skip the membership check, if leave keeps the row, or if a stale
    // heartbeat is still reported as online.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));
    const t = backend();
    const f = await table(t, { session: false });
    const outsider = await account(t, 'Outsider');
    await expect(
      outsider.client.mutation(api.presence.heartbeat, { campaignId: f.campaignId }),
    ).rejects.toThrow('unavailable');
    await expect(
      outsider.client.query(api.presence.list, { campaignId: f.campaignId }),
    ).rejects.toThrow('unavailable');
    await f.player.client.mutation(api.presence.heartbeat, { campaignId: f.campaignId });
    await f.observer.client.mutation(api.presence.heartbeat, { campaignId: f.campaignId });
    expect(
      (await f.director.client.query(api.presence.list, { campaignId: f.campaignId })).sort(),
    ).toEqual([f.player.profile.userId, f.observer.profile.userId].sort());
    await f.observer.client.mutation(api.presence.leave, { campaignId: f.campaignId });
    expect(await f.director.client.query(api.presence.list, { campaignId: f.campaignId })).toEqual([
      f.player.profile.userId,
    ]);
    vi.setSystemTime(new Date(Date.now() + ONLINE_WINDOW_MS + 1));
    expect(await f.director.client.query(api.presence.list, { campaignId: f.campaignId })).toEqual(
      [],
    );
    // A renewed heartbeat reuses the member's row rather than adding a second one.
    await f.player.client.mutation(api.presence.heartbeat, { campaignId: f.campaignId });
    const rows = await t.run(ctx => ctx.db.query('presence').take(10));
    expect(rows.map(r => r.userId)).toEqual([f.player.profile.userId]);
  });

  test('session titles are Director-only, survive closure, clear on blank and number from the oldest', async () => {
    // Fails if a player can title a session, if a closed session refuses a title, if blank does not
    // clear it, or if numbering counts from the newest session.
    const t = backend();
    const f = await table(t, { session: false });
    const first = await f.director.client.mutation(api.sessions.start, {
      campaignId: f.campaignId,
      selectedPlayerIds: [f.player.profile.userId],
      title: '  The road to Blackcastle  ',
      commandId: 'start-first',
    });
    await expect(
      f.player.client.mutation(api.sessions.setTitle, {
        sessionId: first,
        title: 'Mine',
        commandId: 'player-titles',
      }),
    ).rejects.toThrow('owner');
    await f.director.client.mutation(api.sessions.transition, {
      sessionId: first,
      expectedRevision: 0,
      action: 'close',
      commandId: 'close-first',
    });
    const second = await f.director.client.mutation(api.sessions.start, {
      campaignId: f.campaignId,
      selectedPlayerIds: [],
      commandId: 'start-second',
    });
    let sessions = await f.player.client.query(api.sessions.list, { campaignId: f.campaignId });
    expect(sessions.map(s => [s.number, s.title])).toEqual([
      [2, null],
      [1, 'The road to Blackcastle'],
    ]);
    await f.director.client.mutation(api.sessions.setTitle, {
      sessionId: first,
      title: 'Blackcastle, revisited',
      commandId: 'retitle-closed',
    });
    await f.director.client.mutation(api.sessions.setTitle, {
      sessionId: second,
      title: '   ',
      commandId: 'blank-second',
    });
    await expect(
      f.director.client.mutation(api.sessions.setTitle, {
        sessionId: second,
        title: 'x'.repeat(101),
        commandId: 'too-long',
      }),
    ).rejects.toThrow('100');
    sessions = await f.player.client.query(api.sessions.list, { campaignId: f.campaignId });
    expect(sessions.map(s => [s.number, s.title, s.status])).toEqual([
      [2, null, 'running'],
      [1, 'Blackcastle, revisited', 'closed'],
    ]);
    const campaign = await f.player.client.query(api.campaigns.get, { campaignId: f.campaignId });
    const closed = sessions.find(s => s.id === first)!;
    expect([campaign.sessionCount, campaign.lastPlayedAt]).toEqual([2, closed.closedAt]);
  });

  test('chat is member-only, validated, retry-safe, and writes neither game log nor undo history', async () => {
    // Fails if a non-member can read or write, if blank/over-length text is stored, if a retried
    // send duplicates the message, or if sending appends an event or changes the undo window.
    const t = backend();
    const f = await table(t);
    const outsider = await account(t, 'Outsider');
    await expect(
      outsider.client.mutation(api.chat.send, {
        campaignId: f.campaignId,
        text: 'hello',
        commandId: 'outsider-send',
      }),
    ).rejects.toThrow('unavailable');
    await expect(
      outsider.client.query(api.chat.list, { campaignId: f.campaignId }),
    ).rejects.toThrow('unavailable');
    await expect(
      f.observer.client.mutation(api.chat.send, {
        campaignId: f.campaignId,
        text: '   ',
        commandId: 'blank-send',
      }),
    ).rejects.toThrow('message');
    await expect(
      f.observer.client.mutation(api.chat.send, {
        campaignId: f.campaignId,
        text: 'x'.repeat(2001),
        commandId: 'long-send',
      }),
    ).rejects.toThrow('2000');
    const eventsBefore = (await storedEvents(t, f.campaignId)).length;
    const undoBefore = await f.player.client.query(api.history.status, {
      campaignId: f.campaignId,
    });
    const sendArgs = {
      campaignId: f.campaignId,
      text: ' Ready when you are ',
      commandId: 'observer-send-1',
    };
    const id = await f.observer.client.mutation(api.chat.send, sendArgs);
    expect(await f.observer.client.mutation(api.chat.send, sendArgs)).toEqual(id);
    await f.director.client.mutation(api.chat.send, {
      campaignId: f.campaignId,
      text: 'Starting now.',
      commandId: 'director-send-1',
    });
    const seen = await f.player.client.query(api.chat.list, { campaignId: f.campaignId });
    expect(seen.messages.map(m => [m.authorName, m.text])).toEqual([
      ['Observer', 'Ready when you are'],
      ['Director', 'Starting now.'],
    ]);
    expect(seen.nextBefore).toBeNull();
    expect((await storedEvents(t, f.campaignId)).length).toEqual(eventsBefore);
    expect(await f.player.client.query(api.history.status, { campaignId: f.campaignId })).toEqual(
      undoBefore,
    );
    // No author edit or delete route exists: the module exports exactly these operations.
    expect(Object.keys(chatModule).sort()).toEqual(['MAX_TEXT', 'list', 'send']);
  });

  test('campaign members carry their admitted heroes with the effective level; unadmitted ones are absent', async () => {
    // Fails if a created-but-never-admitted hero is listed, if a hero appears under the wrong
    // member, or if the level is not read from the effective revision: Thorn levels up through the
    // V32 advancement route, so a projection that ignored the revision would still say 1.
    const t = backend();
    const f = await table(t, { session: false });
    const guest = await account(t, 'Guest');
    await admit(t, f.director, guest, f.campaignId);
    // Created, never submitted or approved: attached to no campaign.
    await guest.client.mutation(api.characters.create, {
      commandId: 'create-pending',
      authored: { name: 'Pending', appearance: '', biography: '', notes: '' },
    });
    const ownHero = await admitHero(t, f.director, f.director, f.campaignId, 'Mora');
    // Fixture XP so the advancement route accepts a level-up (the same fixture value the V32
    // progression test uses); the expected level comes from the level-2 definitions, not from XP.
    await t.run(async ctx => {
      const character = (await ctx.db.get(f.thornId))!;
      await ctx.db.patch(character._id, { liveState: { ...character.liveState!, xp: 16 } });
    });
    const progression = await f.player.client.query(api.characters.progression, {
      characterId: f.thornId,
    });
    const base = {
      characterId: f.thornId,
      expectedRevision: progression.revision,
      expectedBaseRevisionId: progression.baseRevisionId!,
    };
    const version = await f.player.client.mutation(api.characters.saveAdvancement, {
      ...base,
      commandId: 'prepare-level-two',
      expectedDraftVersion: progression.draft?.version ?? 0,
      selections: draftSelectionsFrom(
        {
          'class.fury.level-2.perk': 'Danger Sense',
          'class.fury.level-2.aspect-ability': 'Wrecking Ball',
        },
        getDefinitions(2),
      ),
    });
    await f.player.client.mutation(api.characters.finalizeAdvancement, {
      ...base,
      expectedDraftVersion: version,
      duringRespite: true,
      commandId: 'finalize-level-two',
    });
    const campaign = await f.observer.client.query(api.campaigns.get, { campaignId: f.campaignId });
    const byName = Object.fromEntries(
      campaign.members.map(m => [m.displayName, m.heroes.map(h => [h.id, h.name, h.level])]),
    );
    expect(byName).toEqual({
      Director: [[ownHero, 'Mora', 1]],
      Player: [[f.thornId, 'Thorn', 2]],
      Observer: [],
      Guest: [],
    });
  });

  test('six closed sessions number from the oldest and a recap reads only its own session', async () => {
    // Fails if numbering counts from the newest or shifts as sessions close, if a closed session
    // loses its players or close time, or if the recap log leaks other sessions' events.
    const t = backend();
    const f = await table(t, { session: false });
    const ids: Id<'sessions'>[] = [];
    for (let n = 1; n <= 6; n++) {
      const players = n % 2 ? [f.player.profile.userId] : [f.observer.profile.userId];
      const id = await f.director.client.mutation(api.sessions.start, {
        campaignId: f.campaignId,
        selectedPlayerIds: players,
        commandId: `start-session-${n}`,
      });
      await f.director.client.mutation(api.sessions.transition, {
        sessionId: id,
        expectedRevision: 0,
        action: 'close',
        commandId: `close-session-${n}`,
      });
      ids.push(id);
    }
    const sessions = await f.observer.client.query(api.sessions.list, { campaignId: f.campaignId });
    expect(sessions.map(s => [s.number, s.id, s.status, s.selectedPlayerIds.length])).toEqual(
      [6, 5, 4, 3, 2, 1].map(n => [n, ids[n - 1], 'closed', 1]),
    );
    expect(sessions.every(s => s.closedAt !== null && s.closedAt >= s.startedAt)).toBe(true);
    const third = ids[2]!;
    const recap = await f.observer.client.query(api.events.list, {
      campaignId: f.campaignId,
      sessionId: third,
    });
    expect(recap.events.map(e => [e.kind, e.sessionId])).toEqual([
      ['session.closed', third],
      ['session.started', third],
    ]);
    const all = await f.observer.client.query(api.events.list, { campaignId: f.campaignId });
    expect(all.events.filter(e => e.sessionId !== null).length).toBe(12);
  });

  test('chat pages of 50 never lose or repeat a message, even when sends share a millisecond', async () => {
    // Fails if paging by createdAt skips a message at a page boundary, if the page is not oldest
    // first, or if the cursor never ends.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));
    const t = backend();
    const f = await table(t, { session: false });
    for (let n = 1; n <= 52; n++)
      await f.player.client.mutation(api.chat.send, {
        campaignId: f.campaignId,
        text: `message ${n}`,
        commandId: `chat-send-${n}`,
      });
    const first = await f.director.client.query(api.chat.list, { campaignId: f.campaignId });
    expect(first.messages.map(m => m.text)).toEqual(
      Array.from({ length: 50 }, (_, i) => `message ${i + 3}`),
    );
    expect(first.nextBefore).not.toBeNull();
    const second = await f.director.client.query(api.chat.list, {
      campaignId: f.campaignId,
      before: first.nextBefore!,
    });
    expect(second.messages.map(m => m.text)).toEqual(['message 1', 'message 2']);
    expect(second.nextBefore).toBeNull();
  });
});
