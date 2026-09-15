// SPDX-License-Identifier: GPL-3.0-only
// A03 acceptance checks at the shared-operation level: authority across roles and session states,
// Malice and health-display audience enforcement in query payloads, condition toggles with their
// journal rows, Recovery arithmetic against R04 example 10.9, and foe visibility (Q-REC-1). Every
// assertion reads persisted rows or a query back; mutation results only locate rows.
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { backend, storedEvents, table, type Backend } from './fixtures/table';

async function addGoblin(t: Backend, campaignId: Id<'campaigns'>, visible: boolean, stamina = 15) {
  return t.run(ctx =>
    ctx.db.insert('foes', {
      campaignId,
      name: 'Goblin Warrior',
      visible,
      sourceSnapshot: JSON.stringify({ name: 'Goblin Warrior', text: 'fixture' }),
      maxStamina: 15,
      live: { stamina, temporaryStamina: 0 },
    }),
  );
}
async function changesFor(t: Backend, eventId: Id<'events'>) {
  return t.run(ctx =>
    ctx.db
      .query('changes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .take(50),
  );
}
const submit = (
  client: Awaited<ReturnType<typeof table>>['director']['client'],
  campaignId: Id<'campaigns'>,
  text: string,
  commandId: string,
) => client.mutation(api.commands.submit, { campaignId, text, commandId });

describe('A03 table operations', () => {
  test('acceptance 1 and 2: authority matrix across Director, player and observer', async () => {
    const t = backend();
    const { director, player, observer, campaignId } = await table(t);
    // A second hero the player does not own (the Director's own record) for the cross-owner case.
    await t.run(ctx =>
      ctx.db.insert('characters', {
        ownerId: director.profile.userId,
        authored: { name: 'Ash', appearance: '', biography: '', notes: '' },
        revision: 1,
        draftRevisionId: null,
        effectiveRevisionId: null,
        derivedBaseline: null,
        liveState: null,
        campaignId,
        combatLocked: false,
      }),
    );
    const gameplay = [
      '@Thorn /test roll characteristic=M value=2',
      '@Thorn /hero recover',
      '@Thorn /condition on name=prone',
      '@Thorn /adjust stamina value=5',
      '/adjust malice value=1',
      '/campaign malice-visible state=on',
      '/campaign health-display mode=winded',
    ];
    for (const [i, text] of gameplay.entries())
      await expect(submit(observer.client, campaignId, text, `obs-${i}-000000`)).rejects.toThrow(
        'observer',
      );
    for (const [i, text] of gameplay.slice(3).entries())
      await expect(submit(player.client, campaignId, text, `pl-${i}-000000`)).rejects.toThrow(
        'Director',
      );
    await expect(
      submit(player.client, campaignId, '@Ash /condition on name=prone', 'pl-ash-000001'),
    ).rejects.toThrow('do not control');
    // Nothing above was recorded.
    const kinds = (await storedEvents(t, campaignId)).map(e => e.kind);
    for (const kind of [
      'test.roll',
      'hero.recover',
      'condition.on',
      'manual.adjustment',
      'campaign.setting',
    ])
      expect(kinds).not.toContain(kind);
    // The registry offers no foe visibility operation (Q-REC-1: dormant, not registered).
    const listed = await director.client.query(api.commands.list, { campaignId });
    expect(listed.some(op => /visib/i.test(op.id) && op.family === 'foe')).toBe(false);
    expect(listed.map(op => op.id)).toEqual(
      expect.arrayContaining([
        'test.roll',
        'hero.recover',
        'condition.on',
        'condition.off',
        'adjust.stamina',
        'adjust.malice',
        'campaign.malice-visible',
        'campaign.health-display',
      ]),
    );
  });

  test('acceptance 2: a player toggles a condition on their own hero; attribution, actor and journal rows', async () => {
    const t = backend();
    const { player, campaignId, thornId } = await table(t);
    const on = await submit(
      player.client,
      campaignId,
      '@Thorn /condition on name=prone',
      'prone-on-000001',
    );
    const event = (await storedEvents(t, campaignId)).find(e => e._id === on.eventId)!;
    expect(event.actorName).toBe('Player');
    expect(event.kind).toBe('condition.on');
    const payload = event.payload as {
      envelope: { boundActor: { kind: string; id: string; name: string } };
      data: { condition: string; before: boolean; after: boolean };
    };
    expect(payload.envelope.boundActor).toEqual({ kind: 'character', id: thornId, name: 'Thorn' });
    expect(payload.data).toEqual({
      creature: { kind: 'character', id: thornId },
      condition: 'prone',
      before: false,
      after: true,
    });
    const rows = await changesFor(t, on.eventId);
    // Admission initialized the live record (A02); the toggle journals only the changed leaf.
    expect(rows.map(r => r.path)).toEqual(['liveState.conditions.prone']);
    expect(rows[0]).toMatchObject({
      entityTable: 'characters',
      entityId: thornId,
      before: { present: true, value: false },
      after: { present: true, value: true },
    });
    const stored = await t.run(ctx => ctx.db.get(thornId));
    expect(stored!.liveState!.conditions.prone).toBe(true);
    // R03 2.1.1: first admission sets current Stamina to the baseline maximum (30 for the fixture).
    expect(stored!.liveState!.stamina).toBe(30);
    const off = await submit(
      player.client,
      campaignId,
      '@Thorn /condition off name=prone',
      'prone-off-00001',
    );
    const offRows = await changesFor(t, off.eventId);
    expect(offRows.map(r => [r.path, r.before, r.after])).toEqual([
      [
        'liveState.conditions.prone',
        { present: true, value: true },
        { present: true, value: false },
      ],
    ]);
    expect((await t.run(ctx => ctx.db.get(thornId)))!.liveState!.conditions.prone).toBe(false);
    await expect(
      submit(player.client, campaignId, '@Thorn /condition off name=prone', 'prone-off-00002'),
    ).rejects.toThrow('already');
  });

  test('acceptance 3: Show Malice governs whether the player payload carries the pool', async () => {
    const t = backend();
    const { director, player, observer, campaignId } = await table(t);
    await submit(director.client, campaignId, '/adjust malice value=4', 'malice-4-000001');
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(4);
    let forPlayer = await player.client.query(api.table.roster, { campaignId });
    expect(forPlayer.malice).toBeNull();
    expect(JSON.stringify(forPlayer)).not.toContain('"malice":4');
    expect((await director.client.query(api.table.roster, { campaignId })).malice).toBe(4);
    await submit(
      director.client,
      campaignId,
      '/campaign malice-visible state=on',
      'malice-on-00001',
    );
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.settings?.showMalice).toBe(true);
    forPlayer = await player.client.query(api.table.roster, { campaignId });
    expect(forPlayer.malice).toBe(4);
    expect((await observer.client.query(api.table.roster, { campaignId })).malice).toBe(4);
    await submit(
      director.client,
      campaignId,
      '/campaign malice-visible state=off',
      'malice-off-0001',
    );
    expect((await observer.client.query(api.table.roster, { campaignId })).malice).toBeNull();
  });

  test('acceptance 4: /hero recover against R04 example 10.9 (recovery value 10, cap at 30)', async () => {
    const t = backend();
    const { player, campaignId, thornId } = await table(t);
    await t.mutation(internal.content.reseed, {});
    // Maximum 30 and Recoveries 10 come from the admitted fixture build (R02 4.1); the current
    // values are written directly to keep the arithmetic case isolated.
    const admitted = (await t.run(ctx => ctx.db.get(thornId)))!.liveState!;
    const live = { ...admitted, stamina: 22, temporaryStamina: 5, recoveries: 10 };
    await t.run(ctx => ctx.db.patch(thornId, { liveState: live }));
    // 10.9: Stamina 22 + 10 = 32 > 30 → 30, healed 8, capApplied (Q-R-3); Recoveries 10 → 9.
    const capped = await submit(
      player.client,
      campaignId,
      '@Thorn /hero recover',
      'recover-000001',
    );
    const after = (await t.run(ctx => ctx.db.get(thornId)))!.liveState!;
    expect([after.stamina, after.recoveries, after.temporaryStamina]).toEqual([30, 9, 5]);
    const rows = (await changesFor(t, capped.eventId)).sort((a, b) => a.path.localeCompare(b.path));
    expect(rows.every(r => r.eventId === capped.eventId && r.entityId === thornId)).toBe(true);
    expect(rows.map(r => [r.path, r.before, r.after])).toEqual([
      ['liveState.recoveries', { present: true, value: 10 }, { present: true, value: 9 }],
      ['liveState.stamina', { present: true, value: 22 }, { present: true, value: 30 }],
    ]);
    const event = (await storedEvents(t, campaignId)).find(e => e._id === capped.eventId)!;
    const data = (event.payload as { data: { result: Record<string, unknown> } }).data;
    expect(data.result).toMatchObject({
      recoveryValue: 10,
      healed: 8,
      capApplied: true,
      temporaryStaminaUnchanged: 5,
    });
    expect(event.actorName).toBe('Player');
    // 10.9: Stamina 19 + 10 = 29 ≤ 30 → 29, healed 10, no cap.
    await t.run(ctx => ctx.db.patch(thornId, { liveState: { ...live, stamina: 19 } }));
    const plain = await submit(player.client, campaignId, '@Thorn /hero recover', 'recover-000002');
    const plainRows = (await changesFor(t, plain.eventId)).sort((a, b) =>
      a.path.localeCompare(b.path),
    );
    expect(plainRows.map(r => [r.path, r.after])).toEqual([
      ['liveState.recoveries', { present: true, value: 9 }],
      ['liveState.stamina', { present: true, value: 29 }],
    ]);
    // 10.9: at 30 the Recovery is still spent and 0 healed, with a warning.
    await t.run(ctx => ctx.db.patch(thornId, { liveState: { ...live, stamina: 30 } }));
    const full = await submit(player.client, campaignId, '@Thorn /hero recover', 'recover-000003');
    expect(full.description).toContain('regained 0 Stamina');
    expect((await t.run(ctx => ctx.db.get(thornId)))!.liveState!.recoveries).toBe(9);
    // No Recovery pool left: blocked, nothing written.
    await t.run(ctx => ctx.db.patch(thornId, { liveState: { ...live, recoveries: 0 } }));
    await expect(
      submit(player.client, campaignId, '@Thorn /hero recover', 'recover-000004'),
    ).rejects.toThrow('no Recoveries');
    // Retry with the same command id spends nothing twice.
    await t.run(ctx => ctx.db.patch(thornId, { liveState: live }));
    await submit(player.client, campaignId, '@Thorn /hero recover', 'recover-000005');
    await submit(player.client, campaignId, '@Thorn /hero recover', 'recover-000005');
    expect((await t.run(ctx => ctx.db.get(thornId)))!.liveState!.recoveries).toBe(9);
  });

  test('acceptance 5: a paused session rejects /test roll and foe addition; resume allows them', async () => {
    const t = backend();
    const { director, player, campaignId, sessionId } = await table(t);
    await director.client.mutation(api.sessions.transition, {
      sessionId: sessionId!,
      expectedRevision: 0,
      action: 'pause',
      commandId: 'pause-000001',
    });
    await expect(
      submit(player.client, campaignId, '@Thorn /test roll characteristic=A', 'test-p-0001'),
    ).rejects.toThrow('paused');
    await expect(
      director.client.mutation(api.foes.add, {
        campaignId,
        definitionId: 'anything',
        commandId: 'add-paused-0001',
      }),
    ).rejects.toThrow('paused');
    await director.client.mutation(api.sessions.transition, {
      sessionId: sessionId!,
      expectedRevision: 1,
      action: 'resume',
      commandId: 'resume-000001',
    });
    const roll = await submit(
      player.client,
      campaignId,
      '@Thorn /test roll characteristic=A skill="Climb" edges=1 difficulty=medium',
      'test-r-0001',
    );
    const event = (await storedEvents(t, campaignId)).find(e => e._id === roll.eventId)!;
    const [a, b] = event.dice!;
    const natural = a!.value + b!.value;
    // R04 section 5: total = natural + characteristic + skill (+2) + edge (+2); tier per 1.5/1.6.
    // The fixture's Agility is 2 (R02 4.1, "You start with a Might of 2 and an Agility of 2").
    const total = natural + 2 + 2 + 2;
    const expectedTier = natural >= 19 ? 3 : total <= 11 ? 1 : total <= 16 ? 2 : 3;
    const expectedOutcome =
      natural >= 19
        ? 'Success with a reward'
        : ['Failure', 'Success with a consequence', 'Success'][expectedTier - 1];
    const result = (event.payload as { data: { result: Record<string, unknown> } }).data.result;
    expect(result).toMatchObject({
      naturalRoll: natural,
      characteristic: 'A',
      characteristicValue: 2,
      skillBonus: 2,
      total,
      tier: expectedTier,
      difficulty: 'medium',
      outcome: expectedOutcome,
      edgeBane: { edges: 1, banes: 0, net: 1, modifier: 2, tierShift: 0 },
    });
    expect(event.actorName).toBe('Player');
    // Without a difficulty there is no outcome: the Director interprets.
    const open = await submit(
      player.client,
      campaignId,
      '@Thorn /test roll characteristic=M banes=2',
      'test-r-0002',
    );
    const openEvent = (await storedEvents(t, campaignId)).find(e => e._id === open.eventId)!;
    const openResult = (openEvent.payload as { data: { result: Record<string, unknown> } }).data
      .result;
    expect(openResult.outcome).toBeUndefined();
    expect(openResult.edgeBane).toMatchObject({ net: -2, modifier: 0, tierShift: -1 });
    expect(openEvent.description).toContain('the Director interprets');
    // The score comes from the evaluated build: a supplied value that disagrees is refused.
    expect(
      (event.payload as { data: { characteristicValueSource: string } }).data
        .characteristicValueSource,
    ).toBe('baseline');
    await expect(
      submit(
        player.client,
        campaignId,
        '@Thorn /test roll characteristic=M value=1',
        'test-r-0003',
      ),
    ).rejects.toThrow('omit value=');
  });

  test('acceptance 6 and 7: health display changes the player payload; every loaded foe appears', async () => {
    const t = backend();
    const { director, player, campaignId } = await table(t);
    const hidden = await addGoblin(t, campaignId, false, 10);
    const shown = await addGoblin(t, campaignId, true, 15);
    const forPlayer = () => player.client.query(api.table.roster, { campaignId });
    let payload = await forPlayer();
    expect(payload.foes.map(f => f.id).sort()).toEqual([hidden, shown].sort());
    expect((await player.client.query(api.foes.list, { campaignId })).rows).toHaveLength(2);
    // Bar (default): a fraction, no number.
    const bar = payload.foes.find(f => f.id === hidden)!;
    expect(bar.health).toEqual({ mode: 'bar', fraction: 10 / 15 });
    expect(JSON.stringify(payload.foes)).not.toContain('"stamina"');
    await submit(
      director.client,
      campaignId,
      '/campaign health-display mode=numerical',
      'hd-num-0001',
    );
    payload = await forPlayer();
    expect(payload.foes.find(f => f.id === hidden)!.health).toEqual({
      mode: 'numerical',
      stamina: 10,
    });
    expect(JSON.stringify(payload.foes)).not.toContain('maxStamina');
    await submit(
      director.client,
      campaignId,
      '/campaign health-display mode=winded',
      'hd-win-0001',
    );
    payload = await forPlayer();
    // Winded at or below floor(15 / 2) = 7 (R04 6.3): 10 is not winded.
    expect(payload.foes.find(f => f.id === hidden)!.health).toEqual({
      mode: 'winded',
      winded: false,
    });
    await director.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: 'gob-stam-7-0001',
      operation: 'adjust.stamina',
      actor: { refKind: 'foe', id: hidden },
      arguments: { value: 7 },
    });
    payload = await forPlayer();
    expect(payload.foes.find(f => f.id === hidden)!.health).toEqual({
      mode: 'winded',
      winded: true,
    });
    expect(JSON.stringify(payload.foes)).not.toContain('"stamina"');
    // The Director always gets the full state; the setting is theirs to see.
    const forDirector = await director.client.query(api.table.roster, { campaignId });
    expect(forDirector.foes.find(f => f.id === hidden)!.health).toEqual({
      mode: 'director',
      stamina: 7,
      maxStamina: 15,
      temporaryStamina: 0,
      winded: true,
    });
    expect(forDirector.settings).toEqual({
      showMalice: false,
      showTestDifficulty: false,
      healthDisplay: 'winded',
      enableUserUndo: true,
    });
    expect(payload.settings).toBeNull();
    // Slain marker at zero, and the Manual adjustment entry with before/after.
    const zero = await director.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: 'gob-stam-0-0001',
      operation: 'adjust.stamina',
      actor: { refKind: 'foe', id: shown },
      arguments: { value: 0 },
    });
    expect(zero.description).toBe('Manual adjustment — Goblin Warrior Stamina 15 → 0.');
    payload = await forPlayer();
    expect(payload.foes.find(f => f.id === shown)!.slain).toBe(true);
    expect(payload.foes.find(f => f.id === hidden)!.slain).toBe(false);
    expect((await t.run(ctx => ctx.db.get(shown)))!.live.stamina).toBe(0);
    expect(await changesFor(t, zero.eventId)).toMatchObject([
      { entityTable: 'foes', path: 'live.stamina', before: { value: 15 }, after: { value: 0 } },
    ]);
  });
});
