// SPDX-License-Identifier: GPL-3.0-only
// A03 F6/F7/F8/F10 regressions: read persisted events and live state through every shared route.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { TestRollResult } from '../../shared/contracts/rollResolution';
import { account, backend, storedEvents, table } from './fixtures/table';
import { vendorPath } from '../../scripts/lib/vendor.ts';

/** These fixtures inspect command envelopes; the production event payload remains unknown.
 * Difficulty is optional because audience projection removes it. Keep all absence/value checks
 * below against the actual returned object: this assertion supplies types without adding fields.
 */
type AudiencePayload = {
  envelope: { arguments: Record<string, unknown> };
  data: {
    result: Omit<TestRollResult, 'difficulty'> & { difficulty?: TestRollResult['difficulty'] };
    [key: string]: unknown;
  };
};
async function eventHistory(
  client: Awaited<ReturnType<typeof table>>['director']['client'],
  campaignId: Id<'campaigns'>,
) {
  const result = await client.query(api.events.list, { campaignId });
  return {
    ...result,
    events: result.events.map(event => ({
      ...event,
      payload: event.payload as AudiencePayload,
    })),
  };
}

describe('table audience boundaries', () => {
  test.each(['Lore; hard: winter', 'Lore; hard: Failure.'])(
    'difficulty projection preserves public skill text containing result-like punctuation: %s',
    async skill => {
      const t = backend();
      const { director, player, observer, campaignId } = await table(t);
      const roll = await player.client.mutation(api.commands.submit, {
        campaignId,
        commandId: 'punctuated-skill',
        text: `@Thorn /test roll characteristic=M value=2 skill="${skill}" difficulty=hard`,
      });
      const stored = (await eventHistory(director.client, campaignId)).events.find(
        e => e.id === roll.eventId,
      )!;
      const outcome = stored.payload.data.result.outcome;
      const suffix = `; hard: ${outcome}.`;
      expect(stored.description.endsWith(suffix)).toBe(true);
      const peer = (await eventHistory(observer.client, campaignId)).events.find(
        e => e.id === roll.eventId,
      )!;
      expect(peer.description).toBe(`${stored.description.slice(0, -suffix.length)}; ${outcome}.`);
      expect(peer.description).toContain(`(${skill})`);
      expect(peer.payload.data.skill).toBe(skill);
      expect(peer.payload.data.result).not.toHaveProperty('difficulty');
    },
  );
  test('hidden Malice never reaches peer history in descriptions, results or envelopes; toggling projects existing history', async () => {
    const t = backend();
    const { director, player, observer, campaignId } = await table(t);
    const adjusted = await director.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'secret-pool-0001',
      text: '/adjust malice value=47',
    });
    const history = async (client: typeof director.client) =>
      (await eventHistory(client, campaignId)).events.find(e => e.id === adjusted.eventId)!;
    expect((await t.run(ctx => ctx.db.get(campaignId)))?.malice).toBe(47);
    for (const client of [player.client, observer.client]) {
      const row = await history(client);
      expect(row.description).toBe('Manual adjustment — shared Malice adjusted.');
      expect(row.payload.data).not.toHaveProperty('before');
      expect(row.payload.data).not.toHaveProperty('after');
      expect(row.payload.envelope.arguments).not.toHaveProperty('value');
    }
    expect((await history(director.client)).payload.data.after).toBe(47);
    await director.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'show-pool-0001',
      text: '/campaign malice-visible state=on',
    });
    expect((await history(observer.client)).payload.data.after).toBe(47);
    await director.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'hide-pool-0001',
      text: '/campaign malice-visible state=off',
    });
    expect((await history(observer.client)).payload.data).not.toHaveProperty('after');
    expect((await history(director.client)).payload.envelope.arguments.value).toBe(47);
    const outsider = await account(t, 'Outsider');
    await expect(outsider.client.query(api.events.list, { campaignId })).rejects.toThrow(
      'unavailable',
    );
  });

  test('difficulty defaults off for players and observers; existing rolls retain public workings/outcomes and respond to setting changes', async () => {
    const t = backend();
    const { director, player, observer, campaignId } = await table(t);
    const roll = await player.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'hidden-test-0001',
      text: '@Thorn /test roll characteristic=M value=2 skill="Climb" edges=1 difficulty=hard',
    });
    const stored = (await storedEvents(t, campaignId)).find(e => e._id === roll.eventId)!;
    const history = async (client: typeof director.client) =>
      (await eventHistory(client, campaignId)).events.find(e => e.id === roll.eventId)!;
    for (const client of [player.client, observer.client]) {
      const row = await history(client);
      expect(row.description).not.toContain('hard:');
      expect(row.payload.envelope.arguments).not.toHaveProperty('difficulty');
      expect(row.payload.data.result).not.toHaveProperty('difficulty');
      const { difficulty: hidden, ...publicResult } = stored.payload.data.result;
      expect(hidden).toBe('hard');
      expect(row.payload.data.result).toEqual(publicResult);
      expect(row.dice).toEqual(stored.dice);
      expect(row.description).toContain(publicResult.outcome);
      expect(row.description).toContain(`= ${publicResult.total}`);
    }
    expect((await history(director.client)).payload.data.result.difficulty).toBe('hard');
    for (const client of [player.client, observer.client]) {
      await expect(
        client.mutation(api.commands.submit, {
          campaignId,
          commandId: 'forbidden-test-setting',
          text: '/campaign test-difficulty-visible state=on',
        }),
      ).rejects.toThrow();
    }
    const available = await director.client.query(api.commands.list, { campaignId });
    expect(available.find(op => op.id === 'campaign.test-difficulty-visible')).toBeDefined();
    await director.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'show-test-00001',
      text: '/campaign test-difficulty-visible state=on',
    });
    expect((await t.run(ctx => ctx.db.get(campaignId)))?.settings?.showTestDifficulty).toBe(true);
    expect((await history(observer.client)).payload.data.result.difficulty).toBe('hard');
    await director.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'hide-test-00001',
      text: '/campaign test-difficulty-visible state=off',
    });
    expect((await history(observer.client)).payload.data.result).not.toHaveProperty('difficulty');
    expect((await storedEvents(t, campaignId)).find(e => e._id === roll.eventId)!.payload).toEqual(
      stored.payload,
    );
  });

  test('both foe reads and historical adjustment envelopes obey every health mode, including temporary Stamina', async () => {
    const t = backend();
    const { director, player, observer, campaignId } = await table(t);
    const foeId = await t.run(ctx =>
      ctx.db.insert('foes', {
        campaignId,
        name: 'Goblin',
        visible: false,
        maxStamina: 15,
        sourceSnapshot: 'Director-only source',
        live: { stamina: 15, temporaryStamina: 0 },
      }),
    );
    const adjust = (field: string, value: number) =>
      director.client.mutation(api.commands.invoke, {
        campaignId,
        commandId: `foe-${field}-0001`,
        operation: `adjust.${field}`,
        actor: { refKind: 'foe', id: foeId },
        arguments: { value },
      });
    const stamina = await adjust('stamina', 7);
    const temporary = await adjust('temporary-stamina', 9);
    for (const mode of ['bar', 'winded', 'numerical'] as const) {
      await director.client.mutation(api.commands.submit, {
        campaignId,
        commandId: `mode-${mode}-0001`,
        text: `/campaign health-display mode=${mode}`,
      });
      const expected =
        mode === 'bar'
          ? { mode, fraction: 7 / 15 }
          : mode === 'winded'
            ? { mode, winded: true }
            : { mode, stamina: 7 };
      for (const client of [player.client, observer.client]) {
        const roster = await client.query(api.table.roster, { campaignId });
        const legacy = await client.query(api.foes.list, { campaignId });
        expect(roster.foes[0]!.health).toEqual(expected);
        expect(legacy.rows[0]).toEqual({ id: foeId, name: 'Goblin', health: expected });
        expect(JSON.stringify([roster.foes, legacy.rows])).not.toContain('sourceSnapshot');
        const history = (await eventHistory(client, campaignId)).events;
        const event = history.find(e => e.id === stamina.eventId)!;
        if (mode === 'numerical') {
          expect(event.payload.data.after).toBe(7);
          expect(event.description).toContain('15 → 7');
        } else {
          expect(event.payload.data).not.toHaveProperty('before');
          expect(event.payload.data).not.toHaveProperty('after');
          expect(event.payload.envelope.arguments).not.toHaveProperty('value');
          expect(event.description).toBe('Manual adjustment — Goblin Stamina adjusted.');
        }
        const temp = history.find(e => e.id === temporary.eventId)!;
        expect(temp.payload.data).not.toHaveProperty('after');
        expect(temp.payload.envelope.arguments).not.toHaveProperty('value');
        expect(temp.description).toBe('Manual adjustment — Goblin Temporary Stamina adjusted.');
      }
    }
    const history = (await eventHistory(director.client, campaignId)).events;
    expect(history.find(e => e.id === temporary.eventId)!.payload.data.after).toBe(9);
  });

  test('peers receive only Stamina and Recoveries while owner and Director retain full live resources and public history', async () => {
    const t = backend();
    const { director, player, observer, campaignId, thornId } = await table(t);
    const live = {
      ...(await t.run(ctx => ctx.db.get(thornId)))!.liveState!,
      stamina: 22,
      recoveries: 8,
      heroicResource: { name: 'Ferocity', current: 7 },
      xp: 91,
      surges: 3,
      victories: 5,
    };
    await t.run(ctx => ctx.db.patch(thornId, { liveState: live }));
    const otherId = await t.run(async ctx => {
      const thorn = (await ctx.db.get(thornId))!;
      const { _id, _creationTime, ...fields } = thorn;
      void _id;
      void _creationTime;
      return ctx.db.insert('characters', { ...fields, ownerId: director.profile.userId });
    });
    const peer = (await observer.client.query(api.table.roster, { campaignId })).heroes;
    expect(peer.map(h => h.live)).toEqual([
      { stamina: 22, recoveries: 8 },
      { stamina: 22, recoveries: 8 },
    ]);
    const owner = (await player.client.query(api.table.roster, { campaignId })).heroes;
    expect(owner.find(h => h.id === thornId)?.live).toEqual(live);
    expect(owner.find(h => h.id === otherId)?.live).toEqual({ stamina: 22, recoveries: 8 });
    expect(
      (await director.client.query(api.table.roster, { campaignId })).heroes.every(
        h => 'heroicResource' in h.live!,
      ),
    ).toBe(true);
    const event = await director.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: 'public-resource-change',
      operation: 'adjust.heroic-resource',
      actor: { refKind: 'character', id: thornId },
      arguments: { value: 8 },
    });
    expect(
      (await eventHistory(observer.client, campaignId)).events.find(e => e.id === event.eventId)
        ?.description,
    ).toContain('7 → 8');
  });

  test('an observer-owned hero stays read-only while retaining owner access to live values', async () => {
    const t = backend();
    const { director, observer, campaignId, thornId } = await table(t);
    const live = {
      ...(await t.run(ctx => ctx.db.get(thornId)))!.liveState!,
      stamina: 22,
      heroicResource: { name: 'Ferocity', current: 7 },
    };
    await t.run(ctx =>
      ctx.db.patch(thornId, { ownerId: observer.profile.userId, liveState: live }),
    );
    const hero = (await observer.client.query(api.table.roster, { campaignId })).heroes.find(
      h => h.id === thornId,
    )!;
    expect(hero.controlled).toBe(false);
    expect(hero.live).toEqual(live);
    expect(
      (await director.client.query(api.table.roster, { campaignId })).heroes.find(
        h => h.id === thornId,
      )?.controlled,
    ).toBe(true);
    await expect(
      observer.client.mutation(api.commands.invoke, {
        campaignId,
        commandId: 'observer-owned-recovery',
        operation: 'hero.recover',
        actor: { refKind: 'character', id: thornId },
        arguments: {},
      }),
    ).rejects.toThrow();
    expect((await t.run(ctx => ctx.db.get(thornId)))?.liveState).toEqual(live);
    expect(
      (await storedEvents(t, campaignId)).some(e => e.commandId === 'observer-owned-recovery'),
    ).toBe(false);
  });

  test('Recovery persists complete pinned Catch Breath and Recovery source text and exposes both to observers', async () => {
    const t = backend();
    const { player, observer, campaignId, thornId } = await table(t);
    await t.action(internal.content.reseed, {});
    await t.run(async ctx =>
      ctx.db.patch(thornId, {
        liveState: { ...(await ctx.db.get(thornId))!.liveState!, stamina: 22, recoveries: 10 },
      }),
    );
    const used = await player.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'recovery-source-0001',
      text: '@Thorn /hero recover',
    });
    const stored = (await storedEvents(t, campaignId)).find(e => e._id === used.eventId)!;
    const source = stored.payload.data.source;
    expect(source.text).toBe(
      readFileSync(
        vendorPath(
          'vendor/steel-compendium/en/unified/md/feature/common/maneuvers/catch-breath.md',
        ),
        'utf8',
      ),
    );
    expect(source.supporting[0].text).toBe(
      readFileSync(
        vendorPath('vendor/steel-compendium/en/unified/md/rule/health/recoveries.md'),
        'utf8',
      ),
    );
    expect(source.revision).toMatch(/^[a-f0-9]{40}$/);
    expect(source.sourcePath).toContain('catch-breath.md');
    const row = (await eventHistory(observer.client, campaignId)).events.find(
      e => e.id === used.eventId,
    )!;
    expect(row.payload.data.source).toEqual(source);
    expect(row.description).toContain('regained 8 Stamina');
  });
});
