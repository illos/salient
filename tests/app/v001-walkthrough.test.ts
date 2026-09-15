// SPDX-License-Identifier: GPL-3.0-only
// Connected A09 backend journey. Source arithmetic and scope limits are recorded before this test
// in docs/build/audits/2026-09-15-A09-walkthrough.md. Only content seeding, test authentication and
// positioning the server dice stream bypass public app operations; no gameplay state is fabricated.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, storedEvents, table, type Backend } from './fixtures/table';

const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

/** Disclosed deterministic test inputs; the real operation still rolls and persists server dice. */
async function atFaces(t: Backend, campaignId: Id<'campaigns'>, faces: number[]) {
  await t.run(async ctx => {
    const state = (await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique())!;
    expect(state).not.toBeNull();
    for (let counter = state.counter; counter < state.counter + 100000; counter++) {
      const generated = generate(
        fromHex(state.seed),
        counter,
        faces.map((_, i) => ({ id: `input-${i}`, sides: 10 })),
      );
      if (generated.dice.every((die, i) => die.value === faces[i])) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('No matching disclosed dice inputs found.');
  });
}

test('A09: admitted hero → real combat → correction/history → closeout → next session → paused Void keep/reset', async () => {
  const t = backend();
  // Creates three real auth profiles, campaign and membership requests/approvals; starts the
  // selected-player session, then creates, saves, submits and approves the actual R02 hero build.
  const f = await table(t);
  const { campaignId, director, player, observer, thornId } = f;
  await t.mutation(internal.content.reseed, {});
  let sequence = 0;
  const cid = () => `walkthrough-${++sequence}`;
  const command = (who: typeof player, text: string, commandId = cid()) =>
    who.client.mutation(api.commands.submit, { campaignId, text, commandId });
  const invoke = (operation: string, args: Record<string, unknown> = {}, commandId = cid()) =>
    director.client.mutation(api.commands.invoke, {
      campaignId,
      commandId,
      operation,
      arguments: args,
    });
  const hero = () => t.run(ctx => ctx.db.get(thornId));
  const foe = (id: Id<'foes'>) => t.run(ctx => ctx.db.get(id));
  const events = () => storedEvents(t, campaignId);
  const rolls = () => t.run(ctx => ctx.db.query('rolls').collect());
  const liveFoes = () => t.run(ctx => ctx.db.query('foes').collect());
  const addFoe = () =>
    director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: GOBLIN,
      commandId: cid(),
    });
  const startCombat = async () => {
    await command(director, '/combat start');
    const committed = await command(director, '/combat commit');
    expect((await hero())!.combatLocked).toBe(true);
    await command(player, '/combat roll');
    await command(director, '/combat first side=heroes');
    const encounter = await director.client.query(api.encounters.current, { campaignId });
    expect(encounter).toMatchObject({ status: 'committed', round: 1 });
    expect((await t.run(ctx => ctx.db.get(committed.eventId)))!.encounterId).toBe(encounter!.id);
    return encounter!.id;
  };
  expect((await hero())!.liveState).toMatchObject({
    stamina: 30,
    recoveries: 10,
    heroicResource: { current: 0 },
    victories: 0,
  });
  expect((await hero())!.derivedBaseline).not.toBeNull();
  const goblins = [await addFoe(), await addFoe(), await addFoe()];
  expect(await Promise.all(goblins.map(async id => (await foe(id))!.live.stamina))).toEqual([
    15, 15, 15,
  ]);
  await expect(command(observer, '@Thorn /condition on name=prone')).rejects.toThrow(/observer/i);
  await expect(command(player, '/combat start')).rejects.toThrow(/Director/i);
  // Before commit, Cancel discards the setup without creating a gameplay lock or snapshot.
  await command(director, '/combat start');
  await command(director, '/combat cancel');
  expect((await hero())!.combatLocked).toBe(false);
  expect(await t.run(ctx => ctx.db.query('snapshots').collect())).toHaveLength(0);
  const encounterId = await startCombat();
  expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(2);
  await command(player, '@Thorn /turn take');
  expect((await hero())!.liveState!.heroicResource.current).toBe(0); // No invented Fury grants.

  const roarText = `@Thorn /ability use ability="Thunder Roar" targets=[${goblins.map(id => `@{foe:${id}}`).join(',')}] edges=[1,0,0] banes=[0,2,0]`;
  const rollsBeforeBlock = await rolls();
  const blockedId = cid();
  const blocked = await command(player, roarText, blockedId);
  expect((await t.run(ctx => ctx.db.get(blocked.eventId)))!.kind).toBe('ability.blocked');
  expect(await command(player, roarText, blockedId)).toEqual(blocked);
  expect(await rolls()).toEqual(rollsBeforeBlock);
  expect(await t.run(ctx => ctx.db.query('actionUses').collect())).toHaveLength(0);
  expect((await hero())!.liveState!.heroicResource.current).toBe(0);
  await command(director, '@Thorn /adjust heroic-resource value=6');
  expect((await hero())!.liveState!.heroicResource.current).toBe(6);

  // R04 §10.10: 8 + 2 + Might 2 = 12; tier 2 damage 7. One bane reduces damage to 4.
  await atFaces(t, campaignId, [8, 2]);
  const strikeText = `@Thorn /ability use ability="Melee Weapon Free Strike" targets=[@{foe:${goblins[0]}}]`;
  const strikeId = cid();
  const strike = await command(player, strikeText, strikeId);
  const strikeEvent = (await t.run(ctx => ctx.db.get(strike.eventId)))!;
  expect(strikeEvent.dice?.map(d => d.value)).toEqual([8, 2]);
  expect((await foe(goblins[0]!))!.live.stamina).toBe(8);
  const acceptedRolls = await rolls();
  expect(await command(player, strikeText, strikeId)).toEqual(strike);
  const correction = await command(
    player,
    `/ability correct event="${strike.eventId}" target=@{foe:${goblins[0]}} edges=0 banes=1`,
  );
  expect((await foe(goblins[0]!))!.live.stamina).toBe(11);
  expect((await t.run(ctx => ctx.db.get(correction.eventId)))!.causeEventId).toBe(strike.eventId);
  await command(player, '/history undo');
  expect((await foe(goblins[0]!))!.live.stamina).toBe(8);
  await command(player, '/history redo');
  expect((await foe(goblins[0]!))!.live.stamina).toBe(11);
  expect(await rolls()).toEqual(acceptedRolls);
  expect(await t.run(ctx => ctx.db.get(strike.eventId))).toEqual(strikeEvent);

  // Same campaign, existing damage, known cost and three targets: 11/15/15 minus 17/6/9.
  await atFaces(t, campaignId, [7, 6]);
  const roarId = cid();
  const roar = await command(player, roarText, roarId);
  const roarEvent = (await t.run(ctx => ctx.db.get(roar.eventId)))!;
  expect(roarEvent.description).toContain('Rule warning'); // Deliberate second main action.
  expect((await hero())!.liveState!.heroicResource.current).toBe(1);
  expect(await Promise.all(goblins.map(async id => (await foe(id))!.live.stamina))).toEqual([
    -6, 9, 6,
  ]);
  const afterRoarRolls = await rolls();
  expect(await command(player, roarText, roarId)).toEqual(roar);
  expect(await rolls()).toEqual(afterRoarRolls);
  expect(await Promise.all(goblins.map(async id => (await foe(id))!.live.stamina))).toEqual([
    -6, 9, 6,
  ]);
  const roarJournal = await t.run(ctx =>
    ctx.db
      .query('changes')
      .withIndex('by_event', q => q.eq('eventId', roar.eventId))
      .collect(),
  );
  expect(roarJournal).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        entityId: thornId,
        path: 'liveState.heroicResource.current',
        before: { present: true, value: 6 },
        after: { present: true, value: 1 },
      }),
      expect.objectContaining({
        entityId: goblins[0],
        path: 'live.stamina',
        before: { present: true, value: 11 },
        after: { present: true, value: -6 },
      }),
    ]),
  );
  expect((await hero())!.liveState!.heroicResource.current).toBe(1);
  const publicLog = await observer.client.query(api.events.list, { campaignId });
  const published = publicLog.events.find(e => e.id === roar.eventId)!;
  expect(published.payload).toMatchObject({
    data: {
      source: { text: expect.stringContaining('- **17+:** 13 damage;') },
      result: {
        targets: [
          expect.objectContaining({ tier: 3 }),
          expect.objectContaining({ tier: 1 }),
          expect.objectContaining({ tier: 2 }),
        ],
      },
    },
  });
  await invoke('ability.resolved', {
    event: roar.eventId,
    target: { refKind: 'foe', id: goblins[0] },
    clause: '[push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 6',
  });
  expect((await foe(goblins[0]!))!.live.stamina).toBe(-6); // Manual mark does not deal damage again.

  await command(player, '@Thorn /condition on name=bleeding');
  expect((await hero())!.liveState!.conditions.bleeding).toBe(true);
  await atFaces(t, campaignId, [6]);
  const save = await command(player, '@Thorn /table roll dice=d10');
  expect((await t.run(ctx => ctx.db.get(save.eventId)))!.dice?.map(d => d.value)).toEqual([6]);
  expect((await hero())!.liveState!.conditions.bleeding).toBe(true);
  await command(player, '@Thorn /condition off name=bleeding');
  await command(player, '@Thorn /condition on name=prone');
  await command(director, '@Thorn /adjust stamina value=20');
  await command(director, '@Thorn /adjust temporary-stamina value=3');
  const beforeCreatureStrike = await rolls();
  await command(
    director,
    `@{foe:${goblins[1]}} /ability use ability="Free Strike" targets=[@Thorn]`,
  );
  expect(await rolls()).toEqual(beforeCreatureStrike);
  expect((await hero())!.liveState).toMatchObject({ stamina: 20, temporaryStamina: 2 });
  const breathId = cid();
  await command(player, '@Thorn /ability use ability="Catch Breath"', breathId);
  await command(player, '@Thorn /ability use ability="Catch Breath"', breathId);
  expect((await hero())!.liveState).toMatchObject({
    stamina: 30,
    temporaryStamina: 2,
    recoveries: 9,
  });
  for (const text of [
    `@Thorn /ability use ability="Aid Attack" targets=[@{foe:${goblins[2]}}]`,
    '@Thorn /ability use ability="Defend"',
  ]) {
    const use = await command(player, text);
    const recorded = (await t.run(ctx => ctx.db.get(use.eventId)))!;
    expect(recorded.kind).toBe('ability.recorded');
    expect(recorded.description).toContain('Rule warning'); // Spent allowances advise, not block.
  }
  const trackedActions = await t.run(ctx => ctx.db.query('actionUses').collect());
  expect(trackedActions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ label: 'Catch Breath', actionType: 'maneuver' }),
      expect.objectContaining({ label: 'Aid Attack', actionType: 'maneuver' }),
      expect.objectContaining({ label: 'Defend', actionType: 'main action' }),
    ]),
  );
  await command(director, '@Thorn /adjust surges value=2');
  await command(player, '@Thorn /turn end');
  await command(director, `@{foe:${goblins[1]}} /turn take`);
  await command(director, `@{foe:${goblins[1]}} /turn end`);

  // End structure does not synthesize a final turn/save/round. Explicit reward, then cleanup.
  const beforeEnd = await events();
  const diceBeforeEnd = await rolls();
  await invoke('combat.end', { encounter: encounterId });
  const pending = await observer.client.query(api.closeout.current, { campaignId });
  expect(pending).toMatchObject({ phase: 'closeout', victory: { amount: 1, confirmed: false } });
  expect((await hero())!.liveState!.victories).toBe(0);
  expect((await events()).filter(e => e.origin === 'clock').length).toBe(
    beforeEnd.filter(e => e.origin === 'clock').length,
  );
  const awardId = cid();
  const award = { encounter: encounterId, amount: 1, recipients: [thornId] };
  await invoke('combat.victories', award, awardId);
  await invoke('combat.victories', award, awardId);
  expect((await hero())!.liveState!.victories).toBe(1);
  await expect(invoke('combat.victories', award)).rejects.toThrow(/already confirmed/);
  const finishId = cid();
  await invoke('combat.finish', { encounter: encounterId }, finishId);
  await invoke('combat.finish', { encounter: encounterId }, finishId);
  expect(await rolls()).toEqual(diceBeforeEnd);
  expect((await hero())!.liveState).toMatchObject({
    stamina: 30,
    recoveries: 9,
    temporaryStamina: 0,
    surges: 0,
    heroicResource: { current: 1 },
    victories: 1,
    conditions: { prone: true, bleeding: false },
  });
  expect((await hero())!.combatLocked).toBe(false);
  expect(await foe(goblins[0]!)).toBeNull();
  expect(await liveFoes()).toHaveLength(2);
  expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(0);
  await expect(command(director, '/history rewind')).rejects.toThrow(/archived/);
  await expect(
    command(
      player,
      `/ability correct event="${strike.eventId}" target=@{foe:${goblins[0]}} edges=0 banes=0`,
    ),
  ).rejects.toThrow(/archived/);

  await director.client.mutation(api.sessions.transition, {
    sessionId: f.sessionId!,
    expectedRevision: 0,
    action: 'close',
    commandId: cid(),
  });
  const nextSessionId = await director.client.mutation(api.sessions.start, {
    campaignId,
    selectedPlayerIds: [player.profile.userId],
    commandId: cid(),
  });
  expect(nextSessionId).not.toBe(f.sessionId);
  expect((await hero())!.liveState!.victories).toBe(1);
  await command(director, '@Thorn /adjust stamina value=22');
  await command(player, '@Thorn /hero recover');
  expect((await hero())!.liveState).toMatchObject({ stamina: 30, recoveries: 8 });

  // Both Void decisions continue the same campaign/session, preserving or restoring actual state.
  let sessionRevision = 0;
  for (const mode of ['keep', 'reset'] as const) {
    const beforeHero = (await hero())!.liveState;
    const beforeFoes = await liveFoes();
    const beforeMalice = (await t.run(ctx => ctx.db.get(campaignId)))!.malice ?? 0;
    const id = await startCombat();
    // Add the actual one Victory and one hero + round 1; Void keep retained its prior pool.
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(beforeMalice + 3);
    await command(director, `@Thorn /adjust stamina value=${mode === 'keep' ? 12 : 7}`);
    await command(director, `@Thorn /adjust surges value=${mode === 'keep' ? 3 : 5}`);
    await command(director, `@Thorn /adjust temporary-stamina value=${mode === 'keep' ? 4 : 8}`);
    await command(director, '/adjust malice value=13');
    const laterFoe = await addFoe();
    await director.client.mutation(api.sessions.transition, {
      sessionId: nextSessionId,
      expectedRevision: sessionRevision++,
      action: 'pause',
      commandId: cid(),
    });
    const voidId = cid();
    await invoke('combat.void', { mode, encounter: id }, voidId);
    await invoke('combat.void', { mode, encounter: id }, voidId);
    expect(
      await director.client.query(api.sessions.get, { sessionId: nextSessionId }),
    ).toMatchObject({ status: 'paused', encounter: null });
    if (mode === 'reset') {
      expect((await hero())!.liveState).toEqual(beforeHero);
      expect(await liveFoes()).toEqual(beforeFoes);
      expect(await foe(laterFoe)).toBeNull();
      expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(beforeMalice);
    } else {
      expect((await hero())!.liveState).toMatchObject({
        stamina: 12,
        surges: 3,
        temporaryStamina: 4,
        victories: 1,
      });
      expect(await foe(laterFoe)).not.toBeNull();
      expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(13);
    }
    expect((await hero())!.combatLocked).toBe(false);
    expect((await t.run(ctx => ctx.db.get(id)))!.status).toBe('voided');
    await expect(command(player, '@Thorn /hero recover')).rejects.toThrow(/paused/);
    await expect(
      director.client.mutation(api.sessions.setPlayers, {
        sessionId: nextSessionId,
        expectedRevision: sessionRevision,
        selectedPlayerIds: [],
        commandId: cid(),
      }),
    ).rejects.toThrow(/paused/);
    await director.client.mutation(api.sessions.transition, {
      sessionId: nextSessionId,
      expectedRevision: sessionRevision++,
      action: 'resume',
      commandId: cid(),
    });
    await expect(command(director, '/history rewind')).rejects.toThrow(/archived/);
  }
  expect((await events()).filter(e => e.kind === 'combat.victory-awarded')).toHaveLength(1);
  expect((await hero())!.liveState!.victories).toBe(1);
  expect((await events()).filter(e => e.kind === 'combat.voided')).toHaveLength(2);
});
