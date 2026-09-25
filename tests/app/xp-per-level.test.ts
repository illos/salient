// SPDX-License-Identifier: GPL-3.0-only
/**
 * V190 campaign XP per level (docs/table-spec.md#respite-mode, user ruling 2026-09-25) through the
 * shared command path with persisted readback. Expected values come from chapter/making-a-hero.md:
 * the Heroic Advancement Table (standard: level 2 at 16, level 3 at 32, level 4 at 48) and the
 * Adjusted XP Advancement Table (double speed: level 2 at 8, level 3 at 16, level 4 at 24, level 5
 * at 32; half speed: level 2 at 32). XP is cumulative; Victories convert to XP when a respite
 * finishes (rule/resource/experience.md).
 */
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import { backend, table } from './fixtures/table';
import { levelUpsOwed } from '../../shared/evaluate/xpAdvancement';

async function setup(victories: number) {
  const t = backend();
  const f = await table(t);
  let n = 0;
  const say = (text: string, as: 'director' | 'player' = 'director') =>
    f[as].client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `xp-per-level-${n++}`,
      text,
    });
  const hero = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!;
  const campaign = async () => (await t.run(ctx => ctx.db.get(f.campaignId)))!;
  /** Stand-in for a level taken or an admission above level 1: the effective build's level. */
  const setLevel = (level: number, patch: { entryLevelXpOffset?: number } = {}) =>
    t.run(async ctx => {
      const h = (await ctx.db.get(f.thornId))!;
      await ctx.db.patch(h.effectiveRevisionId!, { level });
      await ctx.db.patch(f.thornId, { pendingLevelUps: 0, ...patch });
    });
  const rest = async () => {
    await say('/respite start');
    await say('/respite complete');
  };
  const sheet = async () =>
    (await f.director.client.query(api.characters.sheet, {
      characterId: f.thornId,
    })) as HeroSheet;
  await say(`@Thorn /adjust victories value=${victories}`);
  return { t, ...f, say, hero, campaign, setLevel, rest, sheet };
}

test('the default 16 grants one level-up for 17 XP and the sheet shows level 3 at 32', async () => {
  const f = await setup(17);
  expect((await f.campaign()).settings?.xpPerLevel).toBeUndefined();
  await f.rest();
  const after = await f.hero();
  expect(after.liveState?.xp).toBe(17);
  // Heroic Advancement Table: 16-31 is 2nd level.
  expect(after.pendingLevelUps).toBe(1);
  expect((await f.sheet()).xpProgress).toEqual({
    xp: 17,
    xpPerLevel: 16,
    earnedLevel: 2,
    next: { level: 3, at: 32 },
  });
});

test('at double speed (8) 17 XP grants two level-ups', async () => {
  const f = await setup(17);
  await f.say('/campaign xp-per-level value=8');
  expect((await f.campaign()).settings?.xpPerLevel).toBe(8);
  await f.rest();
  // Adjusted XP Advancement Table, double speed: 16-23 is 3rd level.
  expect((await f.hero()).pendingLevelUps).toBe(2);
  expect((await f.sheet()).xpProgress?.next).toEqual({ level: 4, at: 24 });
});

test('lowering 16 to 8 grants the catch-up level-up at the next Complete, not before', async () => {
  const f = await setup(20);
  await f.rest();
  expect((await f.hero()).pendingLevelUps).toBe(1);
  // The hero takes level 2: level 2, 20 XP, nothing pending.
  await f.setLevel(2);
  await f.say('/campaign xp-per-level value=8');
  // Nothing is retroactive: the setting alone grants nothing.
  expect((await f.hero()).pendingLevelUps).toBe(0);
  await f.rest();
  // Double speed: 16-23 is 3rd level, so one level is owed.
  const after = await f.hero();
  expect(after.liveState?.xp).toBe(20);
  expect(after.pendingLevelUps).toBe(1);
});

test('raising the setting removes no level and no pending level-up', async () => {
  const f = await setup(17);
  await f.rest();
  expect((await f.hero()).pendingLevelUps).toBe(1);
  await f.say('/campaign xp-per-level value=32');
  await f.say('@Thorn /adjust victories value=3');
  await f.rest();
  // Half speed: 20 XP is still 1st level (0-31), but the pending level-up stays.
  const after = await f.hero();
  expect(after.liveState?.xp).toBe(20);
  expect(after.pendingLevelUps).toBe(1);
  expect((await f.sheet()).xpProgress).toMatchObject({
    xpPerLevel: 32,
    next: { level: 2, at: 32 },
  });
});

test('only the Director can change it, and an invalid value is refused', async () => {
  const f = await setup(0);
  await expect(f.say('/campaign xp-per-level value=8', 'player')).rejects.toThrow();
  for (const value of ['0', '201', '12.5'])
    await expect(f.say(`/campaign xp-per-level value=${value}`)).rejects.toThrow(
      /whole number from 1 to 200/,
    );
  expect((await f.campaign()).settings?.xpPerLevel).toBeUndefined();
  await f.say('/campaign xp-per-level value=24');
  expect((await f.campaign()).settings?.xpPerLevel).toBe(24);
});

test('a hero admitted at level 3 earns from the entry level', async () => {
  const f = await setup(17);
  // Admission at level 3 stores entryLevelXpOffset (3 − 1) × 16 = 32 (convex/lib/characterBuild.ts).
  await f.setLevel(3, { entryLevelXpOffset: 32 });
  await f.rest();
  // 17 XP earned after entry at 16 per level: one level above the entry level.
  expect((await f.hero()).pendingLevelUps).toBe(1);
  expect((await f.sheet()).xpProgress).toMatchObject({
    earnedLevel: 4,
    next: { level: 5, at: 32 },
  });
});

test('owed level-ups never pass level 10', () => {
  // Heroic Advancement Table: 144+ is 10th level.
  expect(levelUpsOwed(144, 16, 0, 9)).toBe(1);
  expect(levelUpsOwed(400, 16, 0, 1)).toBe(9);
  expect(levelUpsOwed(400, 16, 0, 10)).toBe(0);
  // Adjusted XP Advancement Table, double speed: 72+ is 10th level.
  expect(levelUpsOwed(72, 8, 0, 1)).toBe(9);
  expect(levelUpsOwed(71, 8, 0, 1)).toBe(8);
});
