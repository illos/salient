// SPDX-License-Identifier: GPL-3.0-only
// V68 campaign home at the shared-operation level (docs/build/V68-campaign-home.md acceptance
// checks 2, 3, 5 and 7): presence membership and expiry, session titles and numbering, the light
// chat's boundaries (membership, validation, retry identity, no game-log entry, no undo seam) and
// the member-hero projection. Each test names the failure it catches; the UI is not exercised.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { api } from '../../convex/_generated/api';
import * as chatModule from '../../convex/chat';
import { ONLINE_WINDOW_MS } from '../../convex/presence';
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
    // Fails if a submitted-but-unapproved hero is listed, if a hero appears under the wrong member,
    // or if the level is not read from the effective revision.
    const t = backend();
    const f = await table(t, { session: false });
    const guest = await account(t, 'Guest');
    await admit(t, f.director, guest, f.campaignId);
    // Submitted, never approved: attached to no campaign.
    await guest.client.mutation(api.characters.create, {
      commandId: 'create-pending',
      authored: { name: 'Pending', appearance: '', biography: '', notes: '' },
    });
    const ownHero = await admitHero(t, f.director, f.director, f.campaignId, 'Mora');
    const campaign = await f.observer.client.query(api.campaigns.get, { campaignId: f.campaignId });
    const byName = Object.fromEntries(
      campaign.members.map(m => [m.displayName, m.heroes.map(h => [h.id, h.name, h.level])]),
    );
    expect(byName).toEqual({
      Director: [[ownHero, 'Mora', 1]],
      Player: [[f.thornId, 'Thorn', 1]],
      Observer: [],
      Guest: [],
    });
  });
});
