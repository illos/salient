// SPDX-License-Identifier: GPL-3.0-only
// V120: class heroic-resource generation through the combat clock and `resource.claim`, proven for
// the Shadow. Every expected value comes from pinned feature/shadow/level-1/insight.md:
// - "you gain insight equal to your Victories" at the start of a combat encounter;
// - "At the start of each of your turns during combat, you gain 1d3 insight.";
// - "the first time each combat round that you deal damage incorporating 1 or more surges, you
//   gain 1 insight." (claimed by the table: surge spending is not recorded);
// - "You lose any remaining insight at the end of the encounter."
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import shadowLedger from '../fixtures/v92-shadow-expected.json' with { type: 'json' };
import { admitHero, backend, table } from './fixtures/table';

let sequence = 0;
test('V120: a Shadow gains insight from the clock and a claimed trigger, and loses it at the end', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const shadow = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Shade',
    draftSelectionsFrom(
      {
        ...(shadowLedger.witnesses[0]!.selections as EvaluationInput['selections']),
        'details.name': 'Shade',
      },
      definitions,
    ),
  );
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${shadow}}`;
  const live = async () => (await t.run(ctx => ctx.db.get(shadow)))!.liveState!;
  const thornLive = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  const clockEvents = async () =>
    (await t.run(ctx => ctx.db.query('events').take(500))).filter(
      e => e.kind === 'clock.heroic-resource' && e.disposition !== 'undone',
    );
  const triggers = async () =>
    (
      await f.player.client.query(api.abilities.sheet, {
        campaignId: f.campaignId,
        actor: { kind: 'character', id: shadow, name: 'Shade' },
      })
    ).resourceTriggers;

  // No gain outside combat: the trigger is listed but unavailable, and a claim is refused.
  expect(await triggers()).toMatchObject([
    { id: 'shadow-surge-damage', amount: 1, limit: 'round', resource: 'insight' },
  ]);
  expect((await triggers())[0]!.unavailable).toMatch(/outside of combat/);
  await command(`${ref} /adjust victories value=2`);
  await command(`${ref} /adjust heroic-resource value=1`);

  // Combat start: + Victories (2). Thorn (Fury) has no profile yet and gets nothing.
  await command('/combat start');
  await command('/combat commit');
  expect((await live()).heroicResource).toEqual({ name: 'insight', current: 3 });
  expect((await thornLive()).heroicResource.current).toBe(0);
  const registrations = await t.run(ctx => ctx.db.query('clockRegistrations').take(50));
  expect(
    registrations
      .filter(r => (r.work as { kind: string }).kind === 'heroic-resource')
      .map(r => (r.work as { step: string; characterId: string }).characterId),
  ).toEqual([shadow, shadow, shadow]);
  await expect(command(`${ref} /resource claim trigger=shadow-surge-damage`, true)).rejects.toThrow(
    /rounds have not started/,
  );

  // Turn start: + 1d3, with the die on the firing's log entry.
  await command('/combat first side=heroes');
  await command(`${ref} /turn take`, true);
  const gain = (await clockEvents()).find(
    e => (e.payload as { data?: { step?: string } }).data?.step === 'turn-start-gain',
  )!;
  const die = gain.dice![0]!;
  expect(die.sides).toBe(3);
  expect(die.value).toBeGreaterThanOrEqual(1);
  expect(die.value).toBeLessThanOrEqual(3);
  const afterTurn = 3 + die.value;
  expect((await live()).heroicResource.current).toBe(afterTurn);

  // The claimed trigger: +1, once per combat round; undo restores the pool and the claim.
  const claim = await command(`${ref} /resource claim trigger=shadow-surge-damage`, true);
  expect((await live()).heroicResource.current).toBe(afterTurn + 1);
  expect((await triggers())[0]!.unavailable).toMatch(/Already claimed this round/);
  await expect(command(`${ref} /resource claim trigger=shadow-surge-damage`, true)).rejects.toThrow(
    /already claimed/,
  );
  await expect(command(`${ref} /resource claim trigger=fury-first-damage`, true)).rejects.toThrow(
    /no heroic-resource trigger/,
  );
  await command('/history undo', true);
  expect((await t.run(ctx => ctx.db.get(claim.eventId as Id<'events'>)))!.disposition).toBe(
    'undone',
  );
  expect((await live()).heroicResource.current).toBe(afterTurn);
  expect((await live()).resourceClaims ?? []).toEqual([]);
  await command(`${ref} /resource claim trigger=shadow-surge-damage`, true);
  expect((await live()).heroicResource.current).toBe(afterTurn + 1);

  // Encounter end: the remaining insight is lost and the claims are cleared.
  await command('/combat end');
  await command(`/combat victories amount=0 recipients=[]`);
  await command('/combat finish');
  expect((await live()).heroicResource.current).toBe(0);
  expect((await live()).resourceClaims).toEqual([]);
  expect(
    (await clockEvents()).map(e => (e.payload as { data: { step: string } }).data.step),
  ).toEqual(['combat-start-grant', 'turn-start-gain', 'encounter-end-loss']);
});

// feature/shadow/level-4/surge-of-insight.md: "you gain 2 insight instead of 1". Level 7
// (feature/shadow/level-7/keen-insight.md) changes the turn-start gain, which the profile does not
// model, so a level-7 Shadow keeps manual generation. The evaluated level is set directly here:
// the engine reads only `baseline.level`, and building level-4 and level-7 Shadows is covered by
// the V108 ledgers. Q-RES-1: a keep-mode void skips the loss and says so.
test('V120: the claim amount follows the level, the profile stops at its verified level, and a void keeps the pool with a note', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const admit = (name: string) =>
    admitHero(
      t,
      f.player,
      f.director,
      f.campaignId,
      name,
      draftSelectionsFrom(
        {
          ...(shadowLedger.witnesses[0]!.selections as EvaluationInput['selections']),
          'details.name': name,
        },
        definitions,
      ),
    );
  const setLevel = (id: Id<'characters'>, level: number) =>
    t.run(async ctx => {
      const hero = (await ctx.db.get(id))!;
      const baseline = hero.derivedBaseline as { level: { value: number } };
      await ctx.db.patch(id, {
        derivedBaseline: { ...baseline, level: { ...baseline.level, value: level } },
      });
    });
  const four = await admit('Umbra');
  const seven = await admit('Gloam');
  await setLevel(four, 4);
  await setLevel(seven, 7);
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `resource-level-${++sequence}`,
      text,
    });
  const pool = async (id: Id<'characters'>) =>
    (await t.run(ctx => ctx.db.get(id)))!.liveState!.heroicResource.current;
  const sheet = (id: Id<'characters'>, name: string) =>
    f.player.client.query(api.abilities.sheet, {
      campaignId: f.campaignId,
      actor: { kind: 'character', id, name },
    });
  expect((await sheet(seven, 'Gloam')).resourceTriggers).toEqual([]);
  await command('/combat start');
  await command('/combat commit');
  await command('/combat first side=heroes');
  const registered = (await t.run(ctx => ctx.db.query('clockRegistrations').take(50)))
    .filter(r => (r.work as { kind: string }).kind === 'heroic-resource')
    .map(r => (r.work as { characterId: string }).characterId);
  expect(registered).toContain(four);
  expect(registered).not.toContain(seven);
  expect((await sheet(four, 'Umbra')).resourceTriggers).toMatchObject([
    {
      amount: 2,
      sourcePath:
        'vendor/steel-compendium/en/unified/md/feature/shadow/level-4/surge-of-insight.md',
      unavailable: null,
    },
  ]);
  await command(`@{character:${four}} /resource claim trigger=shadow-surge-damage`, true);
  expect(await pool(four)).toBe(2);
  await expect(
    command(`@{character:${seven}} /resource claim trigger=shadow-surge-damage`, true),
  ).rejects.toThrow(/no heroic-resource trigger/);

  await command('/combat void mode=keep');
  expect(await pool(four)).toBe(2);
  const kept = (await t.run(ctx => ctx.db.query('events').take(500))).filter(
    e => e.kind === 'combat.resource-kept',
  );
  expect(kept.map(e => (e.payload as { data: { characterId: string } }).data.characterId)).toEqual([
    four,
  ]);
});
