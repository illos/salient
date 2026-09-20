// SPDX-License-Identifier: GPL-3.0-only
// Audit regressions drive registered operations and read their persisted state/history.
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { backend, storedEvents, table } from './fixtures/table';
import { correctionWindow } from '../../convex/lib/history';

async function fixture() {
  const t = backend();
  await t.action(internal.content.reseed, {});
  return { t, ...(await table(t)) };
}

describe('A06 audit: real operation history and audiences', () => {
  test('admission is separate; targeting preparation does not consume undo and is cleared by it', async () => {
    const { t, director, player, campaignId, thornId } = await fixture();
    const baseline = (await t.run(ctx => ctx.db.get(thornId)))!;
    expect((await director.client.query(api.history.status, { campaignId })).undo.available).toBe(
      false,
    );
    const before = { ...baseline.liveState!, stamina: 20, recoveries: 5 };
    await t.run(ctx => ctx.db.patch(thornId, { liveState: before }));
    const recovered = await player.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'recover-before-target',
      text: '@Thorn /hero recover',
    });
    const after = (await t.run(ctx => ctx.db.get(thornId)))!.liveState;
    await player.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: 'pending-after-recover',
      operation: 'ability.select',
      actor: { refKind: 'character', id: thornId },
      arguments: { ability: 'mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike' },
    });
    expect(await t.run(ctx => ctx.db.query('targetingDrafts').collect())).toHaveLength(1);
    expect(
      (await player.client.query(api.history.status, { campaignId })).undo.target?.eventId,
    ).toBe(recovered.eventId);
    await player.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'undo-with-pending',
      text: '/history undo',
    });
    expect((await t.run(ctx => ctx.db.get(thornId)))!.liveState).toEqual(before);
    expect(await t.run(ctx => ctx.db.query('targetingDrafts').collect())).toHaveLength(0);
    const admission = (await storedEvents(t, campaignId)).filter(e =>
      e.kind.startsWith('character.'),
    );
    expect(admission.length).toBeGreaterThan(0);
    expect(admission.every(e => e.disposition !== 'undone')).toBe(true);
    expect((await t.run(ctx => ctx.db.get(thornId)))!.effectiveRevisionId).toEqual(
      baseline.effectiveRevisionId,
    );
    await player.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'redo-recovery-audit',
      text: '/history redo',
    });
    expect((await t.run(ctx => ctx.db.get(thornId)))!.liveState).toEqual(after);
    expect(await t.run(ctx => ctx.db.query('rolls').collect())).toHaveLength(0);
  });

  test('history controls, refusal messages and rewind descriptions honor current Malice audience', async () => {
    const { t, director, player, observer, campaignId } = await fixture();
    const invoke = (text: string, commandId: string) =>
      director.client.mutation(api.commands.submit, { campaignId, text, commandId });
    const adjusted = await invoke('/adjust malice value=47', 'secret-audit');
    expect(
      (await player.client.query(api.history.status, { campaignId })).undo.reason,
    ).not.toContain('47');
    await expect(
      player.client.mutation(api.commands.submit, {
        campaignId,
        text: '/history undo',
        commandId: 'forbidden-secret-undo',
      }),
    ).rejects.not.toThrow('47');
    const rewound = await invoke('/history rewind', 'secret-rewind');
    const row = async () =>
      (await observer.client.query(api.events.list, { campaignId })).events.find(
        e => e.id === rewound.eventId,
      )!;
    expect((await row()).description).not.toContain('47');
    expect((await row()).payload.data.target.description).not.toContain('47');
    expect((await row()).payload.data.target.description).toContain('Malice adjusted');
    await invoke('/campaign malice-visible state=on', 'show-audit');
    expect((await row()).payload.data.target.description).toContain('47');
    await invoke('/campaign malice-visible state=off', 'hide-audit');
    expect((await row()).description).not.toContain('47');
    expect((await row()).payload.data.target.description).not.toContain('47');
    expect((await t.run(ctx => ctx.db.get(adjusted.eventId!)))!.payload.data.after).toBe(47);
  });

  test('repeated foe deletion/rewind repairs initiative references and keeps the original action correctable', async () => {
    const { t, director, player, campaignId, thornId } = await fixture();
    const originalFoe = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
      commandId: 'alias-goblin',
    });
    const submit = (text: string, commandId: string) =>
      director.client.mutation(api.commands.submit, { campaignId, text, commandId });
    for (const [i, text] of [
      '/combat start',
      '/combat commit',
      '/combat roll',
      '/combat first side=heroes',
      '@Thorn /turn take',
    ].entries())
      await submit(text, `alias-combat-${i}`);
    const used = await player.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: 'alias-strike',
      operation: 'ability.use',
      actor: { refKind: 'character', id: thornId },
      arguments: {
        ability: 'mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike',
        targets: [{ refKind: 'foe', id: originalFoe }],
      },
    });
    const originalResult = (await t.run(ctx => ctx.db.query('abilityResults').collect()))[0]!;
    const rolls = await t.run(ctx => ctx.db.query('rolls').collect());
    await submit(`@{foe:${originalFoe}} /foe remove`, 'alias-remove');
    for (let pass = 0; pass < 2; pass++) {
      await submit('/history rewind', `alias-restore-${pass}`);
      const foe = (await t.run(ctx => ctx.db.query('foes').collect()))[0]!;
      expect(foe._id).not.toBe(originalFoe);
      const entries = await t.run(ctx => ctx.db.query('turnEntries').collect());
      const entry = entries.find(e => e.actor.kind === 'foe')!;
      expect(entry.actor.id).toBe(foe._id);
      const group = await t.run(ctx => ctx.db.get(entry.groupId));
      expect(group).not.toBeNull();
      expect(group!.encounterId).toBe(entry.encounterId);
      if (pass === 0) await submit('/history redo', 'alias-redo-remove');
    }
    const foe = (await t.run(ctx => ctx.db.query('foes').collect()))[0]!;
    await player.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: 'alias-correction',
      operation: 'ability.correct',
      arguments: {
        event: used.eventId,
        target: { refKind: 'foe', id: foe._id },
        edges: 1,
        banes: 0,
      },
    });
    const corrected = (await t.run(ctx => ctx.db.query('abilityResults').collect()))[0]!;
    expect(corrected.resolutionInputs).toEqual(originalResult.resolutionInputs);
    expect(await t.run(ctx => ctx.db.query('rolls').collect())).toEqual(rolls);
    expect((await storedEvents(t, campaignId)).some(e => e.kind === 'correction.ability')).toBe(
      true,
    );
  });

  test('Q-A-601 setting gates player correction while Director retains the sequential window', async () => {
    const { t, director, player, campaignId } = await fixture();
    const rolled = await player.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'roll-for-window',
      text: '@Thorn /test roll characteristic=M value=2',
    });
    const window = (userId: typeof player.profile.userId) =>
      t.run(async ctx => correctionWindow(ctx, rolled.eventId!, (await ctx.db.get(userId))!));
    expect((await window(player.profile.userId)).allowed).toBe(true);
    await director.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'disable-correction',
      text: '/campaign user-undo state=off',
    });
    expect(await window(player.profile.userId)).toMatchObject({
      allowed: false,
      reason: expect.stringContaining('off'),
    });
    expect((await window(director.profile.userId)).allowed).toBe(true);
  });

  test('legacy Recover and canonical Catch Breath share the combat maneuver record and retry boundary', async () => {
    const { t, director, player, campaignId, thornId } = await fixture();
    await t.run(async ctx =>
      ctx.db.patch(thornId, {
        liveState: { ...(await ctx.db.get(thornId))!.liveState!, stamina: 20, recoveries: 5 },
      }),
    );
    await t.run(ctx =>
      ctx.db.insert('foes', {
        campaignId,
        name: 'Goblin',
        visible: true,
        maxStamina: 15,
        sourceSnapshot: 'fixture',
        live: { stamina: 15, temporaryStamina: 0 },
      }),
    );
    for (const [i, text] of [
      '/combat start',
      '/combat commit',
      '/combat roll',
      '/combat first side=heroes',
      '@Thorn /turn take',
    ].entries())
      await director.client.mutation(api.commands.submit, {
        campaignId,
        commandId: `combat-recover-${i}`,
        text,
      });
    const request = {
      campaignId,
      commandId: 'combat-legacy-recover',
      text: '@Thorn /hero recover',
    };
    const first = await player.client.mutation(api.commands.submit, request);
    expect(await player.client.mutation(api.commands.submit, request)).toEqual(first);
    expect((await t.run(ctx => ctx.db.get(thornId)))!.liveState).toMatchObject({
      stamina: 30,
      recoveries: 4,
    });
    const uses = await t.run(ctx => ctx.db.query('actionUses').collect());
    expect(uses.map(u => [u.actionType, u.label])).toEqual([['maneuver', 'Catch Breath']]);
    expect((await t.run(ctx => ctx.db.get(first.eventId!)))!.kind).toBe('hero.catch-breath');
    await player.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'undo-combat-recover',
      text: '/history undo',
    });
    expect((await t.run(ctx => ctx.db.get(thornId)))!.liveState).toMatchObject({
      stamina: 20,
      recoveries: 5,
    });
    expect(await t.run(ctx => ctx.db.query('actionUses').collect())).toHaveLength(0);
  });
});
