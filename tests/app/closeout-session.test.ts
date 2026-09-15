// SPDX-License-Identifier: GPL-3.0-only
// A07 session-close integration: table-spec.md#closing-a-session-with-an-active-encounter
// and #voiding-an-encounter. Explicit numeric adjustments below are test setup, not earned grants.
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { GOBLIN_WARRIOR_ID } from '../../convex/lib/foeSource';
import { backend, storedEvents, table, type Backend } from './fixtures/table';

type Fixture = Awaited<ReturnType<typeof table>>;
let sequence = 0;
const cid = () => `closeout-session-${++sequence}`;
const submit = (f: Fixture, text: string) =>
  f.director.client.mutation(api.commands.submit, {
    campaignId: f.campaignId,
    text,
    commandId: cid(),
  });

async function prepare(t: Backend) {
  const f = await table(t);
  await t.mutation(internal.content.reseed, {});
  const foeId = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN_WARRIOR_ID,
    commandId: cid(),
  });
  await submit(f, '@Thorn /adjust surges value=2');
  await submit(f, '@Thorn /adjust temporary-stamina value=3');
  await submit(f, '/combat start');
  await submit(f, '/combat commit');
  const session = await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! });
  const encounterId = session.encounter!.id;
  const startingHero = await t.run(ctx => ctx.db.get(f.thornId));
  await submit(f, '@Thorn /adjust stamina value=12');
  await submit(f, '@Thorn /adjust surges value=4');
  await submit(f, '@Thorn /adjust temporary-stamina value=6');
  await submit(f, '@Thorn /condition on name=prone');
  await submit(f, `@{foe:${foeId}} /adjust stamina value=0`);
  const changedHero = await t.run(ctx => ctx.db.get(f.thornId));
  return { ...f, foeId, encounterId, startingHero, changedHero };
}

describe('A07 closing sessions with active combat', () => {
  test('missing Void choice, unauthorized closure and pause with a Void choice leave state and history untouched', async () => {
    const t = backend();
    const f = await prepare(t);
    const before = await storedEvents(t, f.campaignId);
    const args = {
      sessionId: f.sessionId!,
      expectedRevision: 0,
      action: 'close' as const,
      commandId: cid(),
    };
    await expect(f.director.client.mutation(api.sessions.transition, args)).rejects.toThrow(
      /Void choice/i,
    );
    for (const client of [f.player.client, f.observer.client])
      await expect(
        client.mutation(api.sessions.transition, { ...args, voidMode: 'keep', commandId: cid() }),
      ).rejects.toThrow();
    await expect(
      f.director.client.mutation(api.sessions.transition, {
        ...args,
        action: 'pause',
        voidMode: 'reset',
        commandId: cid(),
      }),
    ).rejects.toThrow(/only.*clos/i);
    expect(await storedEvents(t, f.campaignId)).toEqual(before);
    expect(await t.run(ctx => ctx.db.get(f.thornId))).toEqual(f.changedHero);
    expect(await t.run(ctx => ctx.db.get(f.encounterId))).toMatchObject({
      status: 'committed',
      archivedAt: null,
    });
    expect(
      await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! }),
    ).toMatchObject({ status: 'running', revision: 0 });
    expect(await t.run(ctx => ctx.db.get(f.campaignId))).toMatchObject({
      activeSessionId: f.sessionId,
    });
  });

  test.each(['keep', 'reset'] as const)(
    'session closure with %s archives combat and closes the session once without normal cleanup',
    async mode => {
      const t = backend();
      const f = await prepare(t);
      const before = await storedEvents(t, f.campaignId);
      const args = {
        sessionId: f.sessionId!,
        expectedRevision: 0,
        action: 'close' as const,
        voidMode: mode,
        commandId: cid(),
      };
      await f.director.client.mutation(api.sessions.transition, args);
      const expectedHero = mode === 'keep' ? f.changedHero : f.startingHero;
      const hero = await t.run(ctx => ctx.db.get(f.thornId));
      expect(hero!.liveState).toEqual(expectedHero!.liveState);
      expect(hero!.combatLocked).toBe(false);
      expect((await t.run(ctx => ctx.db.get(f.foeId)))!.live.stamina).toBe(
        mode === 'keep' ? 0 : 15,
      );
      // A defeated foe remains on Void keep: normal defeated-foe cleanup is skipped too.
      const session = await f.player.client.query(api.sessions.get, { sessionId: f.sessionId! });
      expect(session).toMatchObject({ status: 'closed', revision: 1, encounter: null });
      expect(session.closedAt).not.toBeNull();
      const encounter = await t.run(ctx => ctx.db.get(f.encounterId));
      expect(encounter).toMatchObject({ status: 'voided' });
      expect(encounter!.archivedAt).not.toBeNull();
      expect(await t.run(ctx => ctx.db.get(f.campaignId))).toMatchObject({ activeSessionId: null });
      const after = await storedEvents(t, f.campaignId);
      const closure = after.slice(before.length);
      expect(closure.map(event => event.kind)).toEqual(['combat.voided', 'session.closed']);
      expect(closure[0]!.actorId).toBe(f.director.profile.userId);
      expect(closure[0]!.payload).toEqual({ mode });
      await f.director.client.mutation(api.sessions.transition, args);
      expect(await storedEvents(t, f.campaignId)).toEqual(after);
      expect(await t.run(ctx => ctx.db.get(f.thornId))).toEqual(hero);
      expect(await f.observer.client.query(api.sessions.get, { sessionId: f.sessionId! })).toEqual(
        session,
      );
      await expect(
        f.director.client.mutation(api.sessions.transition, { ...args, commandId: cid() }),
      ).rejects.toThrow(/read-only/i);
    },
  );

  test('a closure choice from an earlier encounter cannot void a replacement encounter', async () => {
    const t = backend();
    const f = await prepare(t);
    await submit(f, '/combat void mode=keep');
    await submit(f, '/combat start');
    await submit(f, '/combat commit');
    const beforeSession = await f.director.client.query(api.sessions.get, {
      sessionId: f.sessionId!,
    });
    expect(beforeSession.encounter!.id).not.toBe(f.encounterId);
    const beforeEvents = await storedEvents(t, f.campaignId);
    await expect(
      f.director.client.mutation(api.sessions.transition, {
        sessionId: f.sessionId!,
        expectedRevision: beforeSession.revision,
        expectedEncounterId: f.encounterId,
        action: 'close',
        voidMode: 'reset',
        commandId: cid(),
      }),
    ).rejects.toThrow(/encounter changed/i);
    expect(await storedEvents(t, f.campaignId)).toEqual(beforeEvents);
    expect(await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! })).toEqual(
      beforeSession,
    );
    expect(await t.run(ctx => ctx.db.get(beforeSession.encounter!.id))).toMatchObject({
      status: 'committed',
      archivedAt: null,
    });
  });

  test.each(['keep', 'reset'] as const)(
    'Void %s while paused preserves the selected-player roster lock until resume',
    async mode => {
      const t = backend();
      const f = await prepare(t);
      await f.director.client.mutation(api.sessions.transition, {
        sessionId: f.sessionId!,
        expectedRevision: 0,
        action: 'pause',
        commandId: cid(),
      });
      await submit(f, `/combat void mode=${mode}`);
      const session = await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! });
      expect(session).toMatchObject({
        status: 'paused',
        selectedPlayerIds: [f.player.profile.userId],
        encounter: null,
      });
      const before = await storedEvents(t, f.campaignId);
      await expect(
        f.director.client.mutation(api.sessions.setPlayers, {
          sessionId: f.sessionId!,
          expectedRevision: session.revision,
          selectedPlayerIds: [],
          commandId: cid(),
        }),
      ).rejects.toThrow(/paused/i);
      expect(await storedEvents(t, f.campaignId)).toEqual(before);
      expect(await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! })).toEqual(
        session,
      );
      await f.director.client.mutation(api.sessions.transition, {
        sessionId: f.sessionId!,
        expectedRevision: session.revision,
        action: 'resume',
        commandId: cid(),
      });
      await f.director.client.mutation(api.sessions.setPlayers, {
        sessionId: f.sessionId!,
        expectedRevision: session.revision + 1,
        selectedPlayerIds: [],
        commandId: cid(),
      });
      expect(
        await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! }),
      ).toMatchObject({ status: 'running', selectedPlayerIds: [] });
    },
  );
});
