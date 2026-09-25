// SPDX-License-Identifier: GPL-3.0-only
/**
 * V190 campaign XP per level and V191 XP bank (docs/table-spec.md#respite-mode, user rulings
 * 2026-09-25) through the shared command path with persisted readback. Expected values come from
 * chapter/making-a-hero.md: the Heroic Advancement Table (16 XP from each level to the next: 2nd at
 * 16, 3rd at 32, 10th at 144) and the Adjusted XP Advancement Table (double speed 8 per level: 2nd
 * at 8, 3rd at 16; half speed 32 per level: 2nd at 32). Victories convert to XP when a respite
 * finishes (rule/resource/experience.md). User-ruled adaptation: the XP is a bank, each full XP per
 * level becomes one pending level-up and the remainder stays banked.
 */
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import { backend, table } from './fixtures/table';
import { xpProgressRows } from '../../shared/evaluate/xpAdvancement';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { levelThreeBuilds } from '../fixtures/level-three-builds';

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
  const setLevel = (level: number) =>
    t.run(async ctx => {
      const h = (await ctx.db.get(f.thornId))!;
      await ctx.db.patch(h.effectiveRevisionId!, { level });
      await ctx.db.patch(f.thornId, { pendingLevelUps: 0 });
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

test('at the default 16, 17 XP gives one level-up and leaves 1 in the bank', async () => {
  const f = await setup(17);
  expect((await f.campaign()).settings?.xpPerLevel).toBeUndefined();
  await f.rest();
  const after = await f.hero();
  // Heroic Advancement Table: 16 XP from 1st to 2nd level; 17 − 16 = 1 stays.
  expect(after.liveState).toMatchObject({ xp: 1, xpLifetime: 17, victories: 0 });
  expect(after.pendingLevelUps).toBe(1);
  const progress = (await f.sheet()).xpProgress!;
  expect(progress).toEqual({ bank: 1, xpPerLevel: 16, lifetime: 17, capped: false });
  expect(xpProgressRows(progress)).toEqual([
    ['XP', '1 / 16'],
    ['Lifetime XP', '17'],
  ]);
});

test('at double speed (8), 17 XP gives two level-ups and leaves 1 in the bank', async () => {
  const f = await setup(17);
  await f.say('/campaign xp-per-level value=8');
  expect((await f.campaign()).settings?.xpPerLevel).toBe(8);
  await f.rest();
  // Adjusted XP Advancement Table, double speed: 8 XP per level; 17 − 2 × 8 = 1.
  const after = await f.hero();
  expect(after.pendingLevelUps).toBe(2);
  expect(after.liveState?.xp).toBe(1);
  expect((await f.sheet()).xpProgress).toMatchObject({ bank: 1, xpPerLevel: 8 });
});

test('lowering 16 to 8 with 12 banked: 4 more Victories give two level-ups and empty the bank', async () => {
  const f = await setup(12);
  await f.rest();
  // 12 is below 16 (Heroic Advancement Table: 1st level is 0-15): banked, nothing granted.
  expect(await f.hero()).toMatchObject({ liveState: { xp: 12 } });
  expect((await f.hero()).pendingLevelUps ?? 0).toBe(0);
  await f.say('/campaign xp-per-level value=8');
  // The setting alone grants nothing; it applies at the next Complete.
  expect((await f.hero()).pendingLevelUps ?? 0).toBe(0);
  await f.say('@Thorn /adjust victories value=4');
  await f.rest();
  // Double speed: 12 + 4 = 16 is two levels of 8, nothing left.
  const after = await f.hero();
  expect(after.pendingLevelUps).toBe(2);
  expect(after.liveState).toMatchObject({ xp: 0, xpLifetime: 16 });
});

test('raising the setting removes no level-up and nothing from the bank', async () => {
  const f = await setup(17);
  await f.rest();
  expect((await f.hero()).pendingLevelUps).toBe(1);
  await f.say('/campaign xp-per-level value=32');
  await f.say('@Thorn /adjust victories value=3');
  await f.rest();
  // Half speed, 32 per level: the bank of 1 + 3 = 4 buys nothing; the pending level-up stays.
  const after = await f.hero();
  expect(after.pendingLevelUps).toBe(1);
  expect(after.liveState).toMatchObject({ xp: 4, xpLifetime: 20 });
  expect(xpProgressRows((await f.sheet()).xpProgress!)).toEqual([
    ['XP', '4 / 32'],
    ['Lifetime XP', '20'],
  ]);
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

test('a hero admitted at level 3 starts with an empty bank and levels at 16', async () => {
  const f = await setup(0);
  // The real creation and admission path at level 3 (convex/lib/characterBuild.ts).
  const build = levelThreeBuilds().find(b => b.className === 'Fury')!;
  const { definitions } = await f.player.client.query(api.characterWizard.discover, {
    targetLevel: 3,
  });
  const authored = { name: 'Veteran', appearance: '', biography: '', notes: '' };
  const id = await f.player.client.mutation(api.characters.create, {
    commandId: 'xp-veteran-create',
    targetLevel: 3,
    authored,
    selections: draftSelectionsFrom(
      { ...build.selections, 'details.name': 'Veteran' },
      definitions,
    ),
  });
  await f.player.client.mutation(api.characters.submit, {
    commandId: 'xp-veteran-submit',
    characterId: id,
    campaignId: f.campaignId,
  });
  await f.director.client.mutation(api.characters.approve, {
    commandId: 'xp-veteran-approve',
    characterId: id,
  });
  const veteran = async () => (await f.t.run(ctx => ctx.db.get(id)))!;
  expect((await veteran()).liveState?.xp).toBe(0);
  await f.say('@Veteran /adjust victories value=17');
  await f.rest();
  // Heroic Advancement Table: 16 XP from 3rd to 4th level (32 to 48); 1 stays banked.
  expect(await veteran()).toMatchObject({ pendingLevelUps: 1, liveState: { xp: 1 } });
  const sheet = (await f.director.client.query(api.characters.sheet, {
    characterId: id,
  })) as HeroSheet;
  expect(sheet.xpProgress).toMatchObject({ bank: 1, xpPerLevel: 16, capped: false });
});

test('a manual grant leaves the bank alone; a withdrawn level-up is final', async () => {
  const f = await setup(17);
  let invoked = 0;
  const invoke = (operation: string, args: Record<string, unknown> = {}) =>
    f.director.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: `xp-invoke-${++invoked}`,
      operation,
      arguments: args,
    });
  const thorn = [{ refKind: 'character', id: f.thornId }];
  // Grant first: 1 pending, bank 0. Complete then banks 17 and spends 16 on one more level-up.
  await invoke('character.grant-level-up', { characters: thorn });
  expect(await f.hero()).toMatchObject({ pendingLevelUps: 1, liveState: { xp: 0 } });
  await f.rest();
  expect(await f.hero()).toMatchObject({ pendingLevelUps: 2, liveState: { xp: 1 } });
  // Withdraw refunds nothing, and the next Complete does not grant the level again.
  await invoke('character.withdraw-level-up', { characters: thorn });
  expect(await f.hero()).toMatchObject({ pendingLevelUps: 1, liveState: { xp: 1 } });
  await f.rest();
  expect(await f.hero()).toMatchObject({
    pendingLevelUps: 1,
    liveState: { xp: 1, xpLifetime: 17 },
  });
  // /adjust xp sets the bank; lifetime XP is unchanged.
  await f.say('@Thorn /adjust xp value=15');
  await f.say('@Thorn /adjust victories value=1');
  await f.rest();
  // 15 + 1 = 16 buys one level (Heroic Advancement Table), nothing left.
  expect(await f.hero()).toMatchObject({
    pendingLevelUps: 2,
    liveState: { xp: 0, xpLifetime: 18 },
  });
});

test('at level 10 the bank keeps everything and the sheet shows only the bank', async () => {
  const f = await setup(40);
  await f.setLevel(9);
  await f.rest();
  // Heroic Advancement Table: 9th to 10th is 16 XP; 10th is the last level, so 24 stays.
  expect(await f.hero()).toMatchObject({ pendingLevelUps: 1, liveState: { xp: 24 } });
  await f.setLevel(10);
  await f.say('@Thorn /adjust victories value=5');
  await f.rest();
  expect(await f.hero()).toMatchObject({
    pendingLevelUps: 0,
    liveState: { xp: 29, xpLifetime: 45 },
  });
  const progress = (await f.sheet()).xpProgress!;
  expect(progress.capped).toBe(true);
  expect(xpProgressRows(progress)).toEqual([
    ['XP', '29'],
    ['Lifetime XP', '45'],
  ]);
});
