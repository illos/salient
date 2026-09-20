// SPDX-License-Identifier: GPL-3.0-only
// S02 acceptance checks 2, 4 and 5: per-campaign sequence monotonicity under concurrent writes,
// origin/actor validation, and the change journal read back for a sample command.
import { describe, expect, test } from 'vitest';
import { convexTest, type TestConvex } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components, internal } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import { appendEvent } from '../../convex/lib/events';
import {
  commandJournal,
  diffFields,
  journalDelete,
  journalInsert,
  journalPatch,
} from '../../convex/lib/journal';

const modules = import.meta.glob('../../convex/**/*.ts');
async function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  const now = Date.now();
  const auth = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name: 'Director',
        email: 'director@example.test',
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: auth._id,
        token: 'director-token',
        expiresAt: now + 3600000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const client = t.withIdentity({ subject: auth._id, sessionId: session._id });
  const profile = await client.mutation(api.auth.ensureProfile, {});
  const campaignId = await client.mutation(api.campaigns.create, {
    name: 'Journal',
    commandId: 'create-journal-campaign',
  });
  const user = (await t.run(ctx => ctx.db.get(profile.userId)))!;
  return { t, client, campaignId, user };
}
async function events(t: TestConvex<typeof schema>, campaignId: Id<'campaigns'>) {
  return t.run(ctx =>
    ctx.db
      .query('events')
      .withIndex('by_campaign_sequence', q => q.eq('campaignId', campaignId))
      .take(1000),
  );
}

describe('event sequence and origin', () => {
  test('concurrent appends to one campaign get distinct consecutive sequence numbers', async () => {
    const { t, campaignId, user } = await setup();
    const before = await events(t, campaignId);
    const start = before.at(-1)!.sequence;
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        t.run(ctx =>
          appendEvent(ctx, {
            campaignId,
            origin: 'user',
            actor: user,
            commandId: `concurrent-${i}`,
            kind: 'fixture',
            description: `Concurrent ${i}`,
          }),
        ),
      ),
    );
    const after = await events(t, campaignId);
    const sequences = after.map(e => e.sequence);
    expect(sequences).toEqual(Array.from({ length: after.length }, (_, i) => i + 1));
    expect(after.length).toBe(start + 20);
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.eventSequence).toBe(start + 20);
  });

  test('engine and clock origins insert without an actor; user origin without an actor is rejected', async () => {
    const { t, client, campaignId, user } = await setup();
    const cause = await t.run(ctx =>
      appendEvent(ctx, {
        campaignId,
        origin: 'user',
        actor: user,
        commandId: 'cause-command',
        kind: 'fixture.action',
        description: 'A user action.',
      }),
    );
    const engine = await t.run(ctx =>
      appendEvent(ctx, {
        campaignId,
        origin: 'engine',
        commandId: 'cause-command',
        causeEventId: cause,
        kind: 'fixture.consequence',
        description: 'An automatic consequence.',
      }),
    );
    const clock = await t.run(ctx =>
      appendEvent(ctx, {
        campaignId,
        origin: 'clock',
        commandId: 'cause-command',
        causeEventId: cause,
        kind: 'fixture.boundary',
        description: 'Scheduled work.',
      }),
    );
    const rows = await t.run(async ctx => [
      await ctx.db.get(cause),
      await ctx.db.get(engine),
      await ctx.db.get(clock),
    ]);
    expect(rows.map(r => [r!.origin, r!.actorId ?? null, r!.causeEventId, r!.commandId])).toEqual([
      ['user', user._id, null, 'cause-command'],
      ['engine', null, cause, 'cause-command'],
      ['clock', null, cause, 'cause-command'],
    ]);
    expect(rows.map(r => r!.disposition)).toEqual(['applied', 'applied', 'applied']);
    expect(rows[1]).not.toHaveProperty('actorName');
    const countBefore = (await events(t, campaignId)).length;
    await expect(
      t.run(ctx =>
        appendEvent(ctx, {
          campaignId,
          origin: 'user',
          commandId: 'no-actor-command',
          kind: 'fixture',
          description: 'Missing actor.',
        }),
      ),
    ).rejects.toThrow('must name the invoking user');
    await expect(
      t.run(ctx =>
        appendEvent(ctx, {
          campaignId,
          origin: 'engine',
          commandId: 'bad-cause',
          causeEventId: 'events|missing' as Id<'events'>,
          kind: 'fixture',
          description: 'Dangling cause.',
        }),
      ),
    ).rejects.toThrow('Cause event unavailable');
    expect((await events(t, campaignId)).length).toBe(countBefore);
    const listed = await client.query(api.events.list, { campaignId });
    expect(listed.events.slice(0, 3).map(e => [e.origin, e.actorName, e.causeEventId])).toEqual([
      ['clock', null, cause],
      ['engine', null, cause],
      ['user', 'Director', null],
    ]);
  });

  test('archived encounters and closed sessions refuse new events', async () => {
    const { t, client, campaignId, user } = await setup();
    const sessionId = await client.mutation(api.sessions.start, {
      campaignId,
      selectedPlayerIds: [],
      commandId: 'start-session',
    });
    const encounterId = await t.run(ctx =>
      ctx.db.insert('encounters', {
        campaignId,
        sessionId,
        status: 'committed',
        precombatSnapshotId: null,
        createdAt: Date.now(),
        archivedAt: null,
      }),
    );
    const live = await t.run(ctx =>
      appendEvent(ctx, {
        campaignId,
        sessionId,
        encounterId,
        origin: 'user',
        actor: user,
        commandId: 'encounter-command',
        kind: 'fixture',
        description: 'During the encounter.',
      }),
    );
    expect((await t.run(ctx => ctx.db.get(live)))!.encounterId).toBe(encounterId);
    await t.run(ctx => ctx.db.patch(encounterId, { status: 'closed-out', archivedAt: Date.now() }));
    await expect(
      t.run(ctx =>
        appendEvent(ctx, {
          campaignId,
          sessionId,
          encounterId,
          origin: 'user',
          actor: user,
          commandId: 'late-command',
          kind: 'fixture',
          description: 'After archival.',
        }),
      ),
    ).rejects.toThrow('Archived encounters are read-only');
  });
});

describe('change journal', () => {
  test('diffFields records leaf changes, absence and unchanged fields', () => {
    expect(
      diffFields(
        { a: 1, live: { stamina: 15, temporaryStamina: 0 }, tags: ['x'] },
        { a: 1, live: { stamina: 9 }, tags: ['x', 'y'], added: true, removed: undefined },
      ),
    ).toEqual([
      {
        path: 'live.stamina',
        before: { present: true, value: 15 },
        after: { present: true, value: 9 },
      },
      {
        path: 'live.temporaryStamina',
        before: { present: true, value: 0 },
        after: { present: false },
      },
      {
        path: 'tags',
        before: { present: true, value: ['x'] },
        after: { present: true, value: ['x', 'y'] },
      },
      { path: 'added', before: { present: false }, after: { present: true, value: true } },
    ]);
  });

  test('the journal for a sample command lists before/after for every changed field, read back', async () => {
    const { t, client, campaignId, user } = await setup();
    // The catalog reads the content snapshot (S01); a fresh test deployment has none until reseeded.
    await t.action(internal.content.reseed, {});
    const catalog = await client.query(api.foes.catalog, { campaignId });
    const foeId = await client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'add-sample-foe',
    });
    const commandId = 'sample-command-1';
    // A user action with one engine consequence under the same command id (one undo unit).
    const created = await t.run(async ctx => {
      const eventId = await appendEvent(ctx, {
        campaignId,
        origin: 'user',
        actor: user,
        commandId,
        kind: 'fixture.action',
        description: 'Sample action.',
      });
      const scope = { campaignId, eventId };
      const patched = await journalPatch(ctx, scope, 'foes', foeId, {
        live: { stamina: 9, temporaryStamina: 0 },
        visible: true,
      });
      const consequence = await appendEvent(ctx, {
        campaignId,
        origin: 'engine',
        commandId,
        causeEventId: eventId,
        kind: 'fixture.consequence',
        description: 'Sample consequence.',
      });
      const settingsId = await journalInsert(
        ctx,
        { campaignId, eventId: consequence },
        'foeSettings',
        { campaignId, addVisible: true },
      );
      await journalDelete(ctx, { campaignId, eventId: consequence }, 'foeSettings', settingsId);
      return { eventId, consequence, patched, settingsId };
    });
    expect(created.patched).toBe(2);
    // Persisted state after the command.
    const foe = (await t.run(ctx => ctx.db.get(foeId)))!;
    expect(foe.live).toEqual({ stamina: 9, temporaryStamina: 0 });
    expect(foe.visible).toBe(true);
    expect(await t.run(ctx => ctx.db.get(created.settingsId))).toBeNull();
    // The journal read back through the shared reader.
    const journal = await t.run(ctx => commandJournal(ctx, campaignId, commandId, user._id));
    expect(journal.events.map(e => [e._id, e.origin])).toEqual([
      [created.eventId, 'user'],
      [created.consequence, 'engine'],
    ]);
    const rows = journal.changes.map((c: Doc<'changes'>) => ({
      eventId: c.eventId,
      ordinal: c.ordinal,
      commandId: c.commandId,
      entityTable: c.entityTable,
      entityId: c.entityId,
      path: c.path,
      before: c.before,
      after: c.after,
    }));
    expect(rows).toEqual([
      {
        eventId: created.eventId,
        ordinal: 0,
        commandId,
        entityTable: 'foes',
        entityId: foeId,
        path: 'live.stamina',
        before: { present: true, value: 15 },
        after: { present: true, value: 9 },
      },
      {
        eventId: created.eventId,
        ordinal: 1,
        commandId,
        entityTable: 'foes',
        entityId: foeId,
        path: 'visible',
        before: { present: true, value: false },
        after: { present: true, value: true },
      },
      {
        eventId: created.consequence,
        ordinal: 0,
        commandId,
        entityTable: 'foeSettings',
        entityId: created.settingsId,
        path: '',
        before: { present: false },
        after: { present: true, value: { campaignId, addVisible: true } },
      },
      {
        eventId: created.consequence,
        ordinal: 1,
        commandId,
        entityTable: 'foeSettings',
        entityId: created.settingsId,
        path: '',
        before: { present: true, value: { campaignId, addVisible: true } },
        after: { present: false },
      },
    ]);
    // A patch with no effective change writes nothing.
    const none = await t.run(ctx =>
      journalPatch(ctx, { campaignId, eventId: created.eventId }, 'foes', foeId, {
        visible: true,
      }),
    );
    expect(none).toBe(0);
    expect(
      (await t.run(ctx => commandJournal(ctx, campaignId, commandId, user._id))).changes,
    ).toHaveLength(4);
    // Journal writes are scoped to their event's campaign.
    const other = await client.mutation(api.campaigns.create, {
      name: 'Other',
      commandId: 'create-other-campaign',
    });
    await expect(
      t.run(ctx =>
        journalPatch(ctx, { campaignId: other, eventId: created.eventId }, 'foes', foeId, {
          visible: false,
        }),
      ),
    ).rejects.toThrow('Event unavailable');
    expect((await t.run(ctx => ctx.db.get(foeId)))!.visible).toBe(true);
  });
});
