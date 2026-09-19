// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, expect, test, vi } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { appendEvent } from '../../convex/lib/events';
import { tableContext } from '../../convex/lib/registry';
import {
  correctionWindow,
  directorWindow,
  loadHistory,
  playerWindow,
  redoWindow,
} from '../../convex/lib/history';
import { readHistory, loadReadCorrectionWindows } from '../../convex/lib/historyRead';
import { HISTORY_BATCH, historyCursor } from '../../convex/lib/historyIndex';
import { account, backend, table } from './fixtures/table';

afterEach(() => vi.useRealTimers());

test('roster summary matches sheet facts and preserves every audience boundary', async () => {
  const t = backend();
  const f = await table(t);
  const foeId = await t.run(ctx =>
    ctx.db.insert('foes', {
      campaignId: f.campaignId,
      name: 'Summary fixture',
      visible: true,
      maxStamina: 15,
      live: { stamina: 9, temporaryStamina: 0 },
      sourceSnapshot: JSON.stringify({
        structured: { level: 1, role: 'Harrier' },
        text: 'private source '.repeat(5000),
      }),
    }),
  );
  const director = await f.director.client.query(api.table.roster, { campaignId: f.campaignId });
  const player = await f.player.client.query(api.table.roster, { campaignId: f.campaignId });
  const observer = await f.observer.client.query(api.table.roster, { campaignId: f.campaignId });
  expect(director.foes[0].summary).toEqual({ level: 1, role: 'Harrier' });
  expect(player.foes[0].summary).toBeNull();
  expect(observer.foes[0].summary).toBeNull();
  expect(director.heroes[0].facts).toMatchObject({
    staminaMax: 30,
    recoveriesMax: 10,
    windedValue: 15,
  });
  expect(player.heroes[0].facts).toEqual(director.heroes[0].facts);
  expect(observer.heroes[0].facts).toEqual({
    subtitle: null,
    staminaMax: 30,
    recoveriesMax: 10,
    windedValue: null,
  });
  expect(observer.heroes[0].live).not.toHaveProperty('heroicResource');
  expect(JSON.stringify(director)).not.toContain('private source');
  expect(JSON.stringify(director).length).toBeLessThan(3000);
  const detail = await f.director.client.query(api.foes.detail, {
    campaignId: f.campaignId,
    foeId,
  });
  expect(detail.sourceSnapshot).toContain('private source');
  await expect(
    f.observer.client.query(api.foes.detail, { campaignId: f.campaignId, foeId }),
  ).rejects.toThrow();
  const stranger = await account(t, 'Stranger');
  await expect(
    stranger.client.query(api.table.roster, { campaignId: f.campaignId }),
  ).rejects.toThrow('Campaign unavailable');
  expect(director.session).toMatchObject({ id: f.sessionId, number: 1 });
});

test('read index matches full history across seams, continuations, undo, redo and branching', async () => {
  const t = backend();
  const f = await table(t);
  const ids: Id<'events'>[] = [];
  const actor = { kind: 'character' as const, id: f.thornId, name: 'Thorn' };
  let n = 0;
  async function emit(
    kind: string,
    options: {
      player?: boolean;
      data?: unknown;
      engine?: boolean;
      cause?: Id<'events'>;
      commandId?: string;
    } = {},
  ) {
    const id = await t.run(async ctx =>
      appendEvent(ctx, {
        campaignId: f.campaignId,
        sessionId: f.sessionId,
        kind,
        description: `Fixture ${kind}`,
        origin: options.engine ? 'engine' : 'user',
        actor: (await ctx.db.get(
          options.player ? f.player.profile.userId : f.director.profile.userId,
        ))!,
        commandId: options.commandId ?? `fixture-${++n}`,
        causeEventId: options.cause,
        payload: {
          envelope: { boundActor: options.player ? actor : null },
          ...(options.data === undefined ? {} : { data: options.data }),
        },
      }),
    );
    ids.push(id);
    return id;
  }
  async function compare() {
    for (const userId of [
      f.director.profile.userId,
      f.player.profile.userId,
      f.observer.profile.userId,
    ]) {
      await t.run(async ctx => {
        const user = (await ctx.db.get(userId))!;
        const context = await tableContext(ctx, user, f.campaignId);
        const expected = await loadHistory(ctx, context);
        const actual = await readHistory(ctx, context);
        expect(actual).not.toBeNull();
        expect(actual!.floorSequence).toBe(expected.floorSequence);
        expect(directorWindow(actual!)).toEqual(directorWindow(expected));
        expect(await playerWindow(ctx, actual!, user)).toEqual(
          await playerWindow(ctx, expected, user),
        );
        expect(await redoWindow(ctx, actual!, context)).toEqual(
          await redoWindow(ctx, expected, context),
        );
        const readWindow = await loadReadCorrectionWindows(ctx, context);
        for (const id of ids.slice(-5))
          for (const mode of ['correction', 'manual'] as const) {
            const slow = await correctionWindow(ctx, id, user, mode);
            const fast = await readWindow(id, mode);
            expect({
              allowed: fast.allowed,
              reason: fast.reason,
              unit: fast.unit?.head._id,
            }).toEqual({ allowed: slow.allowed, reason: slow.reason, unit: slow.unit?.head._id });
          }
      });
    }
  }
  const first = await emit('ability.use', { player: true, commandId: 'source-use' });
  await emit('ability.damage', { engine: true, cause: first, commandId: 'source-use' });
  await compare();
  const manual = await emit('ability.resolved-at-table', { data: { originalEventId: first } });
  await compare();
  const secondManual = await emit('ability.resolved-at-table', {
    data: { originalEventId: first },
  });
  await compare();
  await emit('history.rewind', { data: { target: { eventId: secondManual } } });
  await emit('history.rewind', { data: { target: { eventId: manual } } });
  await compare();
  await emit('history.redo', { data: { target: { eventId: manual } } });
  await compare();
  await emit('session.note');
  await compare();
  await emit('manual.adjustment');
  await compare();
  await emit('turn.take', { player: true });
  await compare();
});

test('legacy sessions catch up in bounded batches while new gameplay continues', async () => {
  vi.useFakeTimers();
  const t = backend();
  const f = await table(t);
  await t.run(async ctx => {
    for (let i = 0; i < 300; i++)
      await appendEvent(ctx, {
        campaignId: f.campaignId,
        sessionId: f.sessionId,
        origin: 'user',
        actor: (await ctx.db.get(f.director.profile.userId))!,
        commandId: `old-${i}`,
        kind: i % 2 ? 'session.note' : 'manual.adjustment',
        description: `History fixture ${i}`,
      });
    // Simulate a pre-upgrade database. These are derived rows only; source events stay intact.
    const cursor = await historyCursor(ctx, f.sessionId!);
    await ctx.db.delete(cursor!._id);
    for (const unit of await ctx.db.query('historyUnits').collect()) await ctx.db.delete(unit._id);
  });
  await f.director.client.mutation(api.history.prepare, { campaignId: f.campaignId });
  expect(
    (await f.director.client.query(api.history.status, { campaignId: f.campaignId })).undo.reason,
  ).toContain('Preparing');
  await t.mutation(internal.history.backfill, { sessionId: f.sessionId! });
  const first = await t.run(ctx => historyCursor(ctx, f.sessionId!));
  const source = await t.run(ctx =>
    ctx.db
      .query('events')
      .withIndex('by_session_sequence', q => q.eq('sessionId', f.sessionId!))
      .collect(),
  );
  expect(first!.sequence).toBe(source[HISTORY_BATCH - 1].sequence);
  await f.director.client.mutation(api.commands.submit, {
    campaignId: f.campaignId,
    commandId: 'during-backfill',
    text: '/adjust malice value=7',
  });
  expect((await t.run(ctx => historyCursor(ctx, f.sessionId!)))!.sequence).toBe(first!.sequence);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  const stored = await t.run(ctx =>
    ctx.db
      .query('events')
      .withIndex('by_session_sequence', q => q.eq('sessionId', f.sessionId!))
      .collect(),
  );
  expect(stored.length).toBe(source.length + 1);
  await t.run(async ctx => {
    const user = (await ctx.db.get(f.director.profile.userId))!;
    const context = await tableContext(ctx, user, f.campaignId);
    const expected = await loadHistory(ctx, context);
    // Reads from an already prepared index must not replay via collect or an unbounded iterator.
    let gets = 0;
    const db = new Proxy(ctx.db, {
      get(target, property) {
        if (property === 'get')
          return (...args: Parameters<typeof ctx.db.get>) => {
            gets++;
            return target.get(...args);
          };
        if (property === 'query')
          return (...args: Parameters<typeof ctx.db.query>) => {
            const wrap = (value: object): object =>
              new Proxy(value, {
                get(query, key) {
                  if (key === 'collect' || key === Symbol.asyncIterator)
                    throw new Error('Unbounded history read');
                  const member = Reflect.get(query, key);
                  if (typeof member !== 'function') return member;
                  return (...parameters: unknown[]) => {
                    const result = member.apply(query, parameters);
                    return result && typeof result === 'object' && !(result instanceof Promise)
                      ? wrap(result)
                      : result;
                  };
                },
              });
            return wrap(target.query(...args));
          };
        return Reflect.get(target, property);
      },
    });
    const actual = await readHistory({ ...ctx, db } as typeof ctx, context);
    expect(directorWindow(actual!)).toEqual(directorWindow(expected));
    expect(gets).toBeLessThan(12);
  });
  expect(
    (await f.director.client.query(api.table.roster, { campaignId: f.campaignId })).malice,
  ).toBe(7);
});

test('ability results follow requested older log events and reject cross-campaign disclosure', async () => {
  const t = backend();
  const f = await table(t);
  const ids = await t.run(async ctx => {
    const ids: Id<'events'>[] = [];
    const user = (await ctx.db.get(f.director.profile.userId))!;
    for (let i = 0; i < 110; i++) {
      const eventId = await appendEvent(ctx, {
        campaignId: f.campaignId,
        sessionId: f.sessionId,
        origin: 'user',
        actor: user,
        commandId: `result-${i}`,
        kind: 'ability.use',
        description: `Fixture ${i}`,
      });
      await ctx.db.insert('abilityResults', {
        campaignId: f.campaignId,
        eventId,
        encounterId: null,
        actor: { kind: 'character', id: f.thornId, name: 'Thorn' },
        abilityId: 'fixture',
        abilityName: `Result ${i}`,
        dice: { d10a: 3, d10b: 4 },
        characteristicValue: 2,
        selectedCharacteristic: null,
        targets: [],
        manualDispositions: [],
        correctionEventIds: [],
      });
      ids.push(eventId);
    }
    return ids;
  });
  const rows = await f.director.client.query(api.abilities.results, {
    campaignId: f.campaignId,
    eventIds: [ids[0], ids[0], ids[109]],
  });
  expect(rows.map(row => row.abilityName)).toEqual(['Result 0', 'Result 109']);
  expect(rows.map(row => row.mayCorrect)).toEqual([false, true]);
  expect(
    await f.director.client.query(api.abilities.results, {
      campaignId: f.campaignId,
      eventIds: [],
    }),
  ).toEqual([]);
  await expect(
    f.director.client.query(api.abilities.results, {
      campaignId: f.campaignId,
      eventIds: ids.slice(0, 51),
    }),
  ).rejects.toThrow('one visible log page');
  const otherId = await f.director.client.mutation(api.campaigns.create, {
    name: 'Other',
    commandId: 'other-campaign',
  });
  expect(
    await f.director.client.query(api.abilities.results, {
      campaignId: otherId,
      eventIds: [ids[0]],
    }),
  ).toEqual([]);
  const page = await f.director.client.query(api.events.list, {
    campaignId: f.campaignId,
    activeSession: true,
  });
  const older = await f.director.client.query(api.events.list, {
    campaignId: f.campaignId,
    activeSession: true,
    before: page.nextBefore!,
  });
  const olderResults = await f.director.client.query(api.abilities.results, {
    campaignId: f.campaignId,
    eventIds: older.events.map(event => event.id),
  });
  expect(olderResults).toHaveLength(50);
});

test('read floors follow actual combat archives, later encounters and legacy catch-up', async () => {
  vi.useFakeTimers();
  const t = backend();
  const f = await table(t);
  await t.run(ctx =>
    ctx.db.insert('foes', {
      campaignId: f.campaignId,
      name: 'Floor fixture',
      visible: true,
      sourceSnapshot: 'legacy source',
      maxStamina: 15,
      live: { stamina: 15, temporaryStamina: 0 },
    }),
  );
  let command = 0;
  const submit = (text: string) =>
    f.director.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `floor-check-${++command}`,
      text,
    });
  async function compare(label: string) {
    await t.run(async ctx => {
      const user = (await ctx.db.get(f.director.profile.userId))!;
      const context = await tableContext(ctx, user, f.campaignId);
      const slow = await loadHistory(ctx, context);
      const fast = await readHistory(ctx, context);
      expect(fast?.floorLabel).toBe(label);
      expect(fast?.floorSequence).toBe(slow.floorSequence);
      expect(directorWindow(fast!)).toEqual(directorWindow(slow));
      expect(await redoWindow(ctx, fast!, context)).toEqual(await redoWindow(ctx, slow, context));
    });
  }
  await submit('/combat start');
  await submit('/combat commit');
  await compare('the encounter start');
  await submit('/adjust malice value=3');
  await compare('the encounter start');
  await submit('/combat void mode=keep');
  await compare('the archived encounter');
  await submit('/adjust malice value=4');
  await compare('the archived encounter');
  await submit('/history rewind');
  await compare('the archived encounter');
  await submit('/combat start');
  await compare('the archived encounter');
  await submit('/combat commit');
  await compare('the encounter start');
  await submit('/combat end');
  await f.director.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: `floor-check-${++command}`,
    operation: 'combat.victories',
    arguments: { amount: 0, recipients: [] },
  });
  await submit('/combat finish');
  await compare('the archived encounter');
  await t.run(async ctx => {
    await ctx.db.delete((await historyCursor(ctx, f.sessionId!))!._id);
    for (const unit of await ctx.db.query('historyUnits').collect()) await ctx.db.delete(unit._id);
  });
  await f.director.client.mutation(api.history.prepare, { campaignId: f.campaignId });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  await compare('the archived encounter');
});
