// SPDX-License-Identifier: GPL-3.0-only
// A07 expectations: docs/table-spec.md#formal-encounter-closeout, #voiding-an-encounter;
// pinned rule/resource/surge.md and rule/health/temporary-stamina.md clear only those counters.
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, table, admitHero, storedEvents } from './fixtures/table';

type Fixture = Awaited<ReturnType<typeof table>>;
let seq = 0;
const commandId = () => `closeout-${++seq}`;
const submit = (f: Fixture, text: string, id = commandId()) =>
  f.director.client.mutation(api.commands.submit, {
    campaignId: f.campaignId,
    text,
    commandId: id,
  });
const invoke = (
  f: Fixture,
  operation: string,
  args: Record<string, unknown> = {},
  id = commandId(),
) =>
  f.director.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: id,
    operation,
    arguments: args,
  });
async function fixture() {
  const t = backend();
  const f = await table(t);
  const foeId = await t.run(ctx =>
    ctx.db.insert('foes', {
      campaignId: f.campaignId,
      name: 'Goblin A',
      visible: true,
      sourceSnapshot: JSON.stringify({ name: 'Goblin A', text: 'fixture' }),
      maxStamina: 15,
      live: { stamina: 15, temporaryStamina: 0 },
    }),
  );
  return { t, f, foeId };
}
async function start(f: Fixture) {
  await submit(f, '/combat start');
  await submit(f, '/combat commit');
  await submit(f, '/combat roll');
  await submit(f, '/combat first side=heroes');
  const view = await f.director.client.query(api.encounters.current, { campaignId: f.campaignId });
  return view!.id;
}

describe('A07 closeout and Void', () => {
  test('ends structure without synthetic boundaries/dice; closes cards, supports rewind/redo, rejects turns and attacks', async () => {
    const { t, f } = await fixture();
    const encounterId = await start(f);
    await submit(f, '@Thorn /turn take');
    const opened = await submit(f, '@Thorn /table roll');
    const preparations = await t.run(async ctx => {
      const actor = { kind: 'character' as const, id: f.thornId, name: 'Thorn' };
      const opportunityId = await ctx.db.insert('actionOpportunities', {
        campaignId: f.campaignId,
        encounterId,
        actor,
        kind: 'additional-main-action',
        sourceEventId: opened.eventId,
        status: 'offered',
        usedEventId: null,
      });
      const draftId = await ctx.db.insert('targetingDrafts', {
        campaignId: f.campaignId,
        userId: f.player.profile.userId,
        actor,
        abilityId: 'fixture-pending-action',
        targets: [],
        modifiers: {},
        characteristic: null,
        updatedAt: Date.now(),
      });
      return { opportunityId, draftId };
    });
    const before = await storedEvents(t, f.campaignId);
    const clocks = before.filter(e => e.origin === 'clock').length;
    const dice = before.filter(e => e.dice?.length).length;
    await submit(f, `/combat end encounter=${JSON.stringify(encounterId)}`);
    expect(await t.run(ctx => ctx.db.get(opened.interactionId!))).toMatchObject({
      status: 'closed',
    });
    const view = await f.observer.client.query(api.closeout.current, { campaignId: f.campaignId });
    expect(view).toMatchObject({
      phase: 'closeout',
      mayManage: false,
      victory: { confirmed: false, amount: 1 },
    });
    expect(await t.run(ctx => ctx.db.get(preparations.opportunityId))).toMatchObject({
      status: 'closed',
    });
    expect(await t.run(ctx => ctx.db.get(preparations.draftId))).toMatchObject({
      actor: null,
      abilityId: null,
    });
    const after = await storedEvents(t, f.campaignId);
    expect(after.filter(e => e.origin === 'clock')).toHaveLength(clocks);
    expect(after.filter(e => e.dice?.length)).toHaveLength(dice);
    await expect(submit(f, '@Thorn /turn take')).rejects.toThrow(/finish cleanup/i);
    await expect(invoke(f, 'ability.use', { ability: 'Melee Weapon Free Strike' })).rejects.toThrow(
      /finish cleanup/i,
    );
    await expect(invoke(f, 'combat.finish')).rejects.toThrow(/Confirm/);
    await submit(f, '/history rewind');
    expect(await t.run(ctx => ctx.db.get(encounterId))).toMatchObject({ phase: 'turns' });
    expect(await t.run(ctx => ctx.db.get(opened.interactionId!))).toMatchObject({
      status: 'awaiting-input',
    });
    expect(await t.run(ctx => ctx.db.get(preparations.opportunityId))).toMatchObject({
      status: 'offered',
    });
    expect(await t.run(ctx => ctx.db.get(preparations.draftId))).toMatchObject({
      abilityId: 'fixture-pending-action',
    });
    await submit(f, '/history redo');
    expect(await t.run(ctx => ctx.db.get(encounterId))).toMatchObject({
      phase: 'closeout',
      activeTurnId: null,
    });
    expect(await t.run(ctx => ctx.db.get(opened.interactionId!))).toMatchObject({
      status: 'closed',
    });
  });

  test('confirms one Victory per selected hero once, cleans exactly two counters, removes defeated foes and seals history', async () => {
    const { t, f, foeId } = await fixture();
    const secondId = await admitHero(t, f.player, f.director, f.campaignId, 'Briar');
    await t.run(async ctx => {
      const hero = (await ctx.db.get(f.thornId))!;
      await ctx.db.patch(hero._id, {
        liveState: {
          ...hero.liveState!,
          stamina: 9,
          surges: 2,
          temporaryStamina: 3,
          conditions: { ...hero.liveState!.conditions, prone: true },
        },
      });
    });
    const encounterId = await start(f);
    await t.run(ctx => ctx.db.patch(foeId, { live: { stamina: 0, temporaryStamina: 0 } }));
    await invoke(f, 'combat.end');
    const awardId = commandId();
    const args = { amount: 1, recipients: [f.thornId, secondId], encounter: encounterId };
    await invoke(f, 'combat.victories', args, awardId);
    await invoke(f, 'combat.victories', args, awardId);
    expect(
      (await storedEvents(t, f.campaignId)).filter(e => e.kind === 'combat.victory-awarded'),
    ).toHaveLength(2);
    for (const id of [f.thornId, secondId])
      expect((await t.run(ctx => ctx.db.get(id)))!.liveState!.victories).toBe(1);
    await expect(invoke(f, 'combat.victories', args)).rejects.toThrow(/already confirmed/);
    const finishId = commandId();
    await invoke(f, 'combat.finish', { encounter: encounterId }, finishId);
    await invoke(f, 'combat.finish', { encounter: encounterId }, finishId);
    const hero = await f.player.client.query(api.characters.get, { characterId: f.thornId });
    expect(hero.liveState).toMatchObject({
      stamina: 9,
      surges: 0,
      temporaryStamina: 0,
      victories: 1,
      conditions: { prone: true },
    });
    const clearEvents = (await storedEvents(t, f.campaignId)).filter(
      e => e.kind === 'combat.resource-cleared',
    );
    expect(clearEvents).toHaveLength(2);
    const changes = await t.run(async ctx =>
      Promise.all(
        clearEvents.map(e =>
          ctx.db
            .query('changes')
            .withIndex('by_event', q => q.eq('eventId', e._id))
            .take(10),
        ),
      ),
    );
    expect(changes.flat().map(c => ({ path: c.path, before: c.before, after: c.after }))).toEqual([
      {
        path: 'liveState.surges',
        before: { present: true, value: 2 },
        after: { present: true, value: 0 },
      },
      {
        path: 'liveState.temporaryStamina',
        before: { present: true, value: 3 },
        after: { present: true, value: 0 },
      },
    ]);
    expect(await t.run(ctx => ctx.db.get(foeId))).toBeNull();
    expect(await t.run(ctx => ctx.db.get(encounterId))).toMatchObject({
      status: 'closed-out',
      archivedAt: expect.any(Number),
    });
    expect(
      await f.director.client.query(api.closeout.current, { campaignId: f.campaignId }),
    ).toBeNull();
    await expect(submit(f, '/history rewind')).rejects.toThrow(/archived/);
    await expect(
      f.player.client.mutation(api.commands.submit, {
        campaignId: f.campaignId,
        text: '/history undo',
        commandId: commandId(),
      }),
    ).rejects.toThrow(/archived/);
    await f.player.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      text: '@Thorn /table roll dice=d6',
      commandId: commandId(),
    });
  });

  test.each(['keep', 'reset'] as const)(
    'Void %s preserves or restores hero/foe/Malice values without cleanup and keeps pause',
    async mode => {
      const { t, f, foeId } = await fixture();
      const before = (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState;
      const encounterId = await start(f);
      const secondId = await t.run(async ctx => {
        const hero = (await ctx.db.get(f.thornId))!;
        await ctx.db.patch(hero._id, {
          liveState: { ...hero.liveState!, stamina: 3, surges: 2, temporaryStamina: 3 },
        });
        await ctx.db.patch(foeId, { name: 'Renamed', live: { stamina: 2, temporaryStamina: 7 } });
        await ctx.db.patch(f.campaignId, { malice: 13 });
        return ctx.db.insert('foes', {
          campaignId: f.campaignId,
          name: 'Later foe',
          visible: true,
          sourceSnapshot: 'later',
          maxStamina: 20,
          live: { stamina: 20, temporaryStamina: 0 },
        });
      });
      await f.director.client.mutation(api.sessions.transition, {
        sessionId: f.sessionId!,
        expectedRevision: 0,
        action: 'pause',
        commandId: commandId(),
      });
      await invoke(f, 'combat.void', { mode, encounter: encounterId });
      const hero = (await t.run(ctx => ctx.db.get(f.thornId)))!;
      expect(hero.combatLocked).toBe(false);
      if (mode === 'reset') expect(hero.liveState).toEqual(before);
      else expect(hero.liveState).toMatchObject({ stamina: 3, surges: 2, temporaryStamina: 3 });
      expect(await t.run(ctx => ctx.db.get(foeId))).toMatchObject(
        mode === 'reset'
          ? { name: 'Goblin A', live: { stamina: 15, temporaryStamina: 0 } }
          : { name: 'Renamed', live: { stamina: 2, temporaryStamina: 7 } },
      );
      expect(!!(await t.run(ctx => ctx.db.get(secondId)))).toBe(mode === 'keep');
      expect((await t.run(ctx => ctx.db.get(f.campaignId)))!.malice).toBe(
        mode === 'reset' ? 0 : 13,
      );
      expect(
        await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! }),
      ).toMatchObject({ status: 'paused', encounter: null });
      expect(await t.run(ctx => ctx.db.get(encounterId))).toMatchObject({ status: 'voided' });
      await expect(
        f.director.client.mutation(api.sessions.setPlayers, {
          sessionId: f.sessionId!,
          expectedRevision: 1,
          selectedPlayerIds: [],
          commandId: commandId(),
        }),
      ).rejects.toThrow(/paused/);
      await expect(submit(f, '@Thorn /table roll dice=d6')).rejects.toThrow(/paused/);
      expect(
        (await storedEvents(t, f.campaignId)).filter(e =>
          ['combat.victory-awarded', 'combat.resource-cleared'].includes(e.kind),
        ),
      ).toHaveLength(0);
    },
  );

  test('reset restores a removed original foe through its historical identity and removes later additions', async () => {
    const { t, f, foeId } = await fixture();
    await start(f);
    await submit(f, `@{foe:${foeId}} /foe remove`);
    await invoke(f, 'combat.void', { mode: 'reset' });
    const foes = await t.run(ctx =>
      ctx.db
        .query('foes')
        .withIndex('by_campaign', q => q.eq('campaignId', f.campaignId))
        .take(20),
    );
    expect(foes).toHaveLength(1);
    expect(foes[0]).toMatchObject({ name: 'Goblin A', live: { stamina: 15, temporaryStamina: 0 } });
    const alias = await t.run(ctx =>
      ctx.db
        .query('historyAliases')
        .withIndex('by_campaign_former', q =>
          q.eq('campaignId', f.campaignId).eq('formerId', foeId),
        )
        .unique(),
    );
    expect(alias!.currentId).toBe(foes[0]!._id);
  });

  test('session close requires and records explicit Void choice; stale encounter controls refuse the next encounter', async () => {
    const { t, f } = await fixture();
    const encounterId = await start(f);
    const close = {
      sessionId: f.sessionId!,
      expectedRevision: 0,
      action: 'close' as const,
      commandId: commandId(),
    };
    await expect(f.director.client.mutation(api.sessions.transition, close)).rejects.toThrow(
      /keep.*reset/,
    );
    await f.director.client.mutation(api.sessions.transition, { ...close, voidMode: 'keep' });
    expect(await t.run(ctx => ctx.db.get(encounterId))).toMatchObject({ status: 'voided' });
    expect(
      await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! }),
    ).toMatchObject({ status: 'closed' });
    expect((await storedEvents(t, f.campaignId)).some(e => e.kind === 'combat.voided')).toBe(true);
    const sessionId = await f.director.client.mutation(api.sessions.start, {
      campaignId: f.campaignId,
      selectedPlayerIds: [f.player.profile.userId],
      commandId: commandId(),
    });
    expect(sessionId).not.toBe(f.sessionId);
    await start(f);
    await expect(invoke(f, 'combat.end', { encounter: encounterId })).rejects.toThrow(
      /different encounter/,
    );
  });
  test('pending source clauses remain optional during closeout; manual resolution is a continuation and archive refuses late resolution', async () => {
    const { t, f, foeId } = await fixture();
    await t.mutation(internal.content.reseed, {});
    await start(f);
    await submit(f, '@Thorn /turn take');
    // Position the shared stream at 7 + 7: with Thorn's Might 2, total 16 is printed tier 2.
    // This selects test inputs; expected push 2 is read from the pinned Brutal Slam tier 2 text.
    await t.run(async ctx => {
      const state = (await ctx.db
        .query('diceStates')
        .withIndex('by_campaign', q => q.eq('campaignId', f.campaignId))
        .unique())!;
      for (let counter = state.counter; counter < state.counter + 100000; counter++) {
        const out = generate(fromHex(state.seed), counter, [
          { id: 'd10a', sides: 10 },
          { id: 'd10b', sides: 10 },
        ]);
        if (out.dice[0]!.value === 7 && out.dice[1]!.value === 7) {
          await ctx.db.patch(state._id, { counter });
          return;
        }
      }
      throw new Error('Could not find requested dice test inputs.');
    });
    const used = await submit(
      f,
      `@Thorn /ability use ability="Brutal Slam" targets=[@{foe:${foeId}}]`,
    );
    await invoke(f, 'combat.end');
    const view = await f.director.client.query(api.closeout.current, { campaignId: f.campaignId });
    // Printed tier 2: feature/ability/fury/level-1/brutal-slam.md, total 12–16: push 2.
    const clause = '[push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2';
    const pending = view!.optionalChoices.find(choice => choice.eventId === used.eventId)!;
    expect(pending.occurrence).toEqual(expect.any(String));
    expect(view!.optionalChoices).toContainEqual({
      occurrence: pending.occurrence,
      eventId: used.eventId,
      actor: { kind: 'character', id: f.thornId, name: 'Thorn' },
      target: { kind: 'foe', id: foeId, name: 'Goblin A' },
      clause,
      abilityName: 'Brutal Slam',
      abilityId: 'mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam',
    });
    const before = await t.run(ctx => ctx.db.get(foeId));
    const args = {
      event: used.eventId,
      occurrence: pending.occurrence!,
      target: { refKind: 'foe', id: foeId },
    };
    await invoke(f, 'ability.resolved', args);
    expect(await t.run(ctx => ctx.db.get(foeId))).toEqual(before);
    expect(
      (await f.director.client.query(api.closeout.current, { campaignId: f.campaignId }))!
        .optionalChoices,
    ).not.toContainEqual(expect.objectContaining({ eventId: used.eventId, clause }));
    // Leave the clause unused at Finish: its history continuation must then hit the archive boundary.
    await submit(f, '/history rewind');
    expect(
      (await f.director.client.query(api.closeout.current, { campaignId: f.campaignId }))!
        .optionalChoices,
    ).toContainEqual(expect.objectContaining({ occurrence: pending.occurrence }));
    await invoke(f, 'combat.victories', { amount: 0, recipients: [] });
    await invoke(f, 'combat.finish');
    await expect(invoke(f, 'ability.resolved', args)).rejects.toThrow(/archived/);
  });
});
