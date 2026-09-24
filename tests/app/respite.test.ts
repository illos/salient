// SPDX-License-Identifier: GPL-3.0-only
/**
 * V165 respite loop through the shared command path, with persisted readback. Expected values come
 * from rule/resource/respite.md ("regain all your Recoveries and Stamina, and your Victories convert
 * to Experience"), rule/resource/experience.md (Victories reset to 0), the Heroic Advancement table
 * (16 XP per level) and the Thorn fixture's R03 maxima (Stamina 30, Recoveries 10).
 */
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { backend, table, storedEvents } from './fixtures/table';
import { levelUpsEarned } from '../../convex/lib/respiteOperations';

async function setup() {
  const t = backend();
  const f = await table(t);
  let n = 0;
  const say = (text: string) =>
    f.director.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `respite-${n++}`,
      text,
    });
  const hero = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!;
  const session = async () => (await t.run(ctx => ctx.db.get(f.sessionId as Id<'sessions'>)))!;
  // Thorn has been through a fight: 20/30 Stamina, 4/10 Recoveries, 17 Victories.
  for (const [field, value] of [
    ['stamina', 20],
    ['recoveries', 4],
    ['victories', 17],
  ] as const)
    await say(`@Thorn /adjust ${field} value=${value}`);
  return { t, ...f, say, hero, session };
}

test('complete restores Stamina and Recoveries, converts Victories to XP and grants level-ups', async () => {
  const f = await setup();
  await expect(
    f.player.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: 'player-respite',
      text: '/respite start',
    }),
  ).rejects.toThrow();
  await f.say('/respite start');
  expect((await f.session()).respite?.participants.map(p => p.characterId)).toEqual([f.thornId]);
  // The session cannot close and combat cannot start while the respite is open.
  const session = await f.session();
  await expect(
    f.director.client.mutation(api.sessions.transition, {
      sessionId: session._id,
      expectedRevision: session.revision,
      action: 'close',
      commandId: 'close-during-respite',
    }),
  ).rejects.toThrow('A respite is open');
  await expect(f.say('/combat start')).rejects.toThrow('A respite is open');
  const result = await f.say('/respite complete');
  const after = await f.hero();
  expect(after.liveState).toMatchObject({ stamina: 30, recoveries: 10, xp: 17, victories: 0 });
  // 0 → 17 XP crosses the 16-XP threshold once: one pending level-up.
  expect(after.pendingLevelUps).toBe(1);
  expect((await f.session()).respite ?? null).toBeNull();
  const event = (await storedEvents(f.t, f.campaignId)).find(e => e._id === result.eventId)!;
  expect(event.kind).toBe('respite.completed');
  // Complete is final: nothing rewinds across it.
  await expect(f.say('/history rewind')).rejects.toThrow();
  expect((await f.hero()).liveState).toMatchObject({ stamina: 30, xp: 17 });
});

test('interrupt keeps what happened and grants nothing', async () => {
  const f = await setup();
  await f.say('/respite start');
  await f.say('@Thorn /adjust stamina value=25');
  await f.say('/respite interrupt');
  const after = await f.hero();
  expect(after.liveState).toMatchObject({ stamina: 25, recoveries: 4, xp: 0, victories: 17 });
  expect(after.pendingLevelUps ?? 0).toBe(0);
  expect((await f.session()).respite ?? null).toBeNull();
  await expect(f.say('/respite complete')).rejects.toThrow('No respite is open');
});

test('cancel returns every participant to the state before the respite', async () => {
  const f = await setup();
  const before = (await f.hero()).liveState;
  await f.say('/respite start');
  await f.say('@Thorn /adjust stamina value=12');
  await f.say('@Thorn /adjust recoveries value=1');
  await f.say('/respite cancel');
  expect((await f.hero()).liveState).toEqual(before);
  expect((await f.session()).respite ?? null).toBeNull();
});

test('level-ups earned count thresholds crossed, from the entry offset, never past level 10', () => {
  expect(levelUpsEarned(0, 16, 0, 1)).toBe(1);
  expect(levelUpsEarned(15, 17, 0, 1)).toBe(1);
  expect(levelUpsEarned(0, 15, 0, 1)).toBe(0);
  expect(levelUpsEarned(0, 32, 0, 1)).toBe(2);
  // A hero admitted at level 3 carries a 32-XP offset: 16 new XP reaches level 4.
  expect(levelUpsEarned(0, 16, 32, 3)).toBe(1);
  expect(levelUpsEarned(0, 48, 0, 9)).toBe(1);
  expect(levelUpsEarned(0, 48, 0, 10)).toBe(0);
});
