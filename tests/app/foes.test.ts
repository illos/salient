// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components, internal } from '../../convex/_generated/api';

const modules = import.meta.glob('../../convex/**/*.ts');
async function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  async function account(name: string) {
    const now = Date.now();
    const auth = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'user',
        data: {
          name,
          email: `${name}@example.test`,
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
          token: `${name}-token`,
          expiresAt: now + 3600000,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    const client = t.withIdentity({ subject: auth._id, sessionId: session._id });
    const profile = await client.mutation(api.auth.ensureProfile, {});
    return { client, ...profile };
  }
  const director = await account('director');
  const player = await account('player');
  const outsider = await account('outsider');
  const campaignId = await director.client.mutation(api.campaigns.create, {
    commandId: 'create-campaign',
    name: 'Foe test',
  });
  await t.run(ctx => ctx.db.insert('memberships', { campaignId, userId: player.userId }));
  // The catalog reads the content snapshot; a fresh deployment has none until it is reseeded.
  await expect(director.client.query(api.foes.catalog, { campaignId })).rejects.toThrow(
    'content:seed',
  );
  await t.mutation(internal.content.reseed, {});
  const catalog = await director.client.query(api.foes.catalog, { campaignId });
  return { t, director, player, outsider, campaignId, catalog };
}

describe('persistent campaign foes', () => {
  test('Director loads independent sourced foes; peers see every foe through the selected health projection', async () => {
    const { t, director, player, campaignId, catalog } = await setup();
    const first = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'add-first-foe',
    });
    const second = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'add-second-foe',
    });
    expect(first).not.toBe(second);
    // Foe hiding is deferred (A03, Q-REC-1): every loaded foe is listed for peers regardless of the
    // stored flag; the peer rows still carry no source data or exact Stamina.
    expect(
      (await player.client.query(api.foes.list, { campaignId })).rows.map(row => Object.keys(row)),
    ).toEqual([
      ['health', 'id', 'name'],
      ['health', 'id', 'name'],
    ]);
    const loaded = await director.client.query(api.foes.detail, { campaignId, foeId: first });
    const snapshot = JSON.parse(loaded.sourceSnapshot);
    // Source: vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md
    // (frontmatter `stamina: "15"`) and its JSON twin's features array.
    expect(snapshot).toMatchObject({
      id: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
      name: 'Goblin Warrior',
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      structured: { stamina: '15' },
    });
    expect(snapshot.text).toContain('> ⭐️ **Crafty**');
    expect(await t.run(async ctx => (await ctx.db.get(first))?.maxStamina)).toBe(15);
    await t.run(ctx => ctx.db.patch(first, { live: { stamina: 3, temporaryStamina: 0 } }));
    await director.client.mutation(api.foes.setVisible, {
      campaignId,
      foeId: first,
      visible: true,
      commandId: 'show-first-foe',
    });
    expect(await player.client.query(api.foes.list, { campaignId })).toEqual({
      director: false,
      addVisible: null,
      rows: [
        { id: first, name: 'Goblin Warrior', health: { mode: 'bar', fraction: 0.2 } },
        { id: second, name: 'Goblin Warrior', health: { mode: 'bar', fraction: 1 } },
      ],
    });
    expect(await t.run(async ctx => (await ctx.db.get(second))?.live.stamina)).toBe(15);
    expect(
      (await director.client.query(api.foes.detail, { campaignId, foeId: first })).sourceSnapshot,
    ).toBe(loaded.sourceSnapshot);
    await expect(
      player.client.query(api.foes.detail, { campaignId, foeId: first }),
    ).rejects.toThrow('campaign owner');
    await expect(player.client.query(api.foes.catalog, { campaignId })).rejects.toThrow(
      'campaign owner',
    );
  });

  test('all operations require current membership and Director mutations reject other members and foreign foe IDs', async () => {
    const { t, director, player, outsider, campaignId, catalog } = await setup();
    const addArgs = { campaignId, definitionId: catalog.definitionId, commandId: 'add-first-foe' };
    const foeId = await director.client.mutation(api.foes.add, addArgs);
    for (const client of [player.client, outsider.client]) {
      await expect(client.mutation(api.foes.add, addArgs)).rejects.toThrow();
      await expect(
        client.mutation(api.foes.remove, { campaignId, foeId, commandId: 'remove-first' }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.foes.setVisible, {
          campaignId,
          foeId,
          commandId: 'reveal-first',
          visible: true,
        }),
      ).rejects.toThrow();
      await expect(
        client.mutation(api.foes.setDefaultVisible, {
          campaignId,
          commandId: 'default-visible',
          visible: true,
        }),
      ).rejects.toThrow();
    }
    await expect(outsider.client.query(api.foes.list, { campaignId })).rejects.toThrow(
      'unavailable',
    );
    await expect(outsider.client.query(api.foes.catalog, { campaignId })).rejects.toThrow(
      'unavailable',
    );
    await expect(t.query(api.foes.list, { campaignId })).rejects.toThrow('Sign in');
    const otherCampaign = await director.client.mutation(api.campaigns.create, {
      commandId: 'other-campaign',
      name: 'Other',
    });
    await expect(
      director.client.query(api.foes.detail, { campaignId: otherCampaign, foeId }),
    ).rejects.toThrow('Foe unavailable');
    await expect(
      director.client.mutation(api.foes.remove, {
        campaignId: otherCampaign,
        foeId,
        commandId: 'foreign-remove',
      }),
    ).rejects.toThrow('That actor is not at this table');
    await expect(
      director.client.mutation(api.foes.setVisible, {
        campaignId: otherCampaign,
        foeId,
        visible: true,
        commandId: 'foreign-show',
      }),
    ).rejects.toThrow('Foe unavailable');
  });

  test('campaign remembers the new-foe visibility preference without changing existing instances', async () => {
    const { director, player, campaignId, catalog } = await setup();
    const hidden = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'hidden-foe',
    });
    await director.client.mutation(api.foes.setDefaultVisible, {
      campaignId,
      visible: true,
      commandId: 'visible-default',
    });
    expect((await director.client.query(api.foes.list, { campaignId })).addVisible).toBe(true);
    const visible = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'visible-foe',
    });
    // Every loaded foe is listed for peers (hiding deferred, Q-REC-1); the flag is still stored.
    expect(
      (await player.client.query(api.foes.list, { campaignId })).rows.map(foe => foe.id),
    ).toContain(visible);
    await director.client.mutation(api.foes.setDefaultVisible, {
      campaignId,
      visible: false,
      commandId: 'hidden-default',
    });
    const nextHidden = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'next-hidden-foe',
    });
    const rows = (await director.client.query(api.foes.list, { campaignId })).rows;
    expect(
      rows.map(row => ({ id: row.id, visible: 'visible' in row ? row.visible : null })),
    ).toEqual([
      { id: hidden, visible: false },
      { id: visible, visible: true },
      { id: nextHidden, visible: false },
    ]);
  });

  test('retries preserve a single instance and one event; request ID conflicts cannot rewrite intent', async () => {
    const { t, director, campaignId, catalog } = await setup();
    const args = { campaignId, definitionId: catalog.definitionId, commandId: 'idempotent-add' };
    const foeId = await director.client.mutation(api.foes.add, args);
    expect(await director.client.mutation(api.foes.add, args)).toBe(foeId);
    await expect(
      director.client.mutation(api.foes.add, { ...args, definitionId: 'other' }),
    ).rejects.toThrow('different request');
    const remove = { campaignId, foeId, commandId: 'idempotent-remove' };
    await director.client.mutation(api.foes.remove, remove);
    await director.client.mutation(api.foes.remove, remove);
    expect((await director.client.query(api.foes.list, { campaignId })).rows).toEqual([]);
    const events = await t.run(ctx =>
      ctx.db
        .query('events')
        .withIndex('by_campaign_sequence', q => q.eq('campaignId', campaignId))
        .take(20),
    );
    expect(events.filter(event => event.kind.startsWith('foe-')).map(event => event.kind)).toEqual([
      'foe-added',
      'foe-removed',
    ]);
  });

  test('roster management works between sessions, while paused and during combat without writing closed-session history', async () => {
    const { t, director, campaignId, catalog } = await setup();
    const before = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'before-session',
    });
    const sessionId = await director.client.mutation(api.sessions.start, {
      campaignId,
      commandId: 'start-session',
      selectedPlayerIds: [],
    });
    await director.client.mutation(api.sessions.transition, {
      sessionId,
      expectedRevision: 0,
      action: 'pause',
      commandId: 'pause-session',
    });
    // A03: the roster is locked while the session is paused.
    await expect(
      director.client.mutation(api.foes.add, {
        campaignId,
        definitionId: catalog.definitionId,
        commandId: 'paused-session',
      }),
    ).rejects.toThrow('paused');
    await director.client.mutation(api.sessions.transition, {
      sessionId,
      expectedRevision: 1,
      action: 'resume',
      commandId: 'resume-session',
    });
    const paused = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'resumed-session',
    });
    const encounterId = await t.run(async ctx => {
      const id = await ctx.db.insert('encounters', {
        campaignId,
        sessionId,
        status: 'committed',
        precombatSnapshotId: null,
        createdAt: Date.now(),
        archivedAt: null,
      });
      await ctx.db.patch(sessionId, { encounterId: id });
      return id;
    });
    await director.client.mutation(api.foes.setVisible, {
      campaignId,
      foeId: paused,
      commandId: 'combat-visible',
      visible: true,
    });
    await director.client.mutation(api.foes.remove, {
      campaignId,
      foeId: before,
      commandId: 'combat-remove',
    });
    await t.run(ctx => ctx.db.patch(encounterId, { status: 'voided', archivedAt: Date.now() }));
    await director.client.mutation(api.sessions.transition, {
      sessionId,
      expectedRevision: 2,
      action: 'close',
      commandId: 'close-session',
    });
    const closedEvents = await t.run(ctx =>
      ctx.db
        .query('events')
        .withIndex('by_session_sequence', q => q.eq('sessionId', sessionId))
        .take(20),
    );
    const after = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: 'after-session',
    });
    expect(
      (await director.client.query(api.foes.list, { campaignId })).rows.map(row => row.id),
    ).toEqual([paused, after]);
    expect(
      await t.run(ctx =>
        ctx.db
          .query('events')
          .withIndex('by_session_sequence', q => q.eq('sessionId', sessionId))
          .take(20),
      ),
    ).toEqual(closedEvents);
    const foeEvents = await t.run(async ctx =>
      (
        await ctx.db
          .query('events')
          .withIndex('by_campaign_sequence', q => q.eq('campaignId', campaignId))
          .take(30)
      ).filter(event => event.kind.startsWith('foe-')),
    );
    expect(foeEvents.find(event => event.commandId === 'before-session')?.sessionId).toBeNull();
    expect(foeEvents.find(event => event.commandId === 'after-session')?.sessionId).toBeNull();
    expect(foeEvents.find(event => event.commandId === 'resumed-session')?.sessionId).toBe(
      sessionId,
    );
    expect(foeEvents.find(event => event.commandId === 'combat-remove')?.sessionId).toBe(sessionId);
  });
});
