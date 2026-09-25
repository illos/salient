// SPDX-License-Identifier: GPL-3.0-only
// V144: Null discipline generation, including the trigger observed from a paid Malice cost.
// Expected values come from pinned feature/null/level-1/discipline.md:
// - "At the start of each of your turns during combat, you gain 2 discipline.";
// - "The first time each combat round that the Director uses an ability that costs Malice …, you
//   gain 1 discipline." (automatic when a creature ability's own Malice cost is paid, Q-RES-5);
// - "You lose any remaining discipline at the end of the encounter."
// monster/goblin/statblock/goblin-warrior.md: "Bury the Point (2 Malice)", "Power Roll + 2", tier 1
// "≤11". The first use is pinned to 3 + 3: 8, and 10 with the corrected edge (+2, rule/dice/edge.md),
// both tier 1. The correction then changes no damage, so the Null's Inertial Shield offer (V174)
// can't refuse it, whatever the random dice would have been.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import nullLedger from '../fixtures/v103-null-expected.json' with { type: 'json' };
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { admitHero, backend, table, type Backend } from './fixtures/table';

/** Positions the campaign's dice stream so the next 2d10 are `faces` (S02's own generator). */
async function atDice(t: Backend, campaignId: Id<'campaigns'>, faces: [number, number]) {
  await t.run(async ctx => {
    let state = await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique();
    if (!state) {
      const seed = crypto.getRandomValues(new Uint8Array(32));
      const id = await ctx.db.insert('diceStates', {
        campaignId,
        seed: [...seed].map(b => b.toString(16).padStart(2, '0')).join(''),
        counter: 0,
      });
      state = (await ctx.db.get(id))!;
    }
    const seed = fromHex(state.seed);
    const spec = [
      { id: 'd10a', sides: 10 },
      { id: 'd10b', sides: 10 },
    ];
    for (let counter = state.counter; counter < state.counter + 100000; counter++) {
      const out = generate(seed, counter, spec);
      if (out.dice[0]!.value === faces[0] && out.dice[1]!.value === faces[1]) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('No matching dice position found.');
  });
}

let sequence = 0;
test('V144: a Null gains discipline each turn and once per round when a Malice ability is used', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const hero = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Stillness',
    draftSelectionsFrom(
      {
        ...(nullLedger.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Stillness',
      },
      definitions,
    ),
  );
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `null-resource-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `null-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${hero}}`;
  const discipline = async () => (await t.run(ctx => ctx.db.get(hero)))!.liveState!.heroicResource;
  const bury = (target = '@Thorn') =>
    command(`@{foe:${goblin}} /ability use ability="Bury the Point" targets=[${target}]`);
  const triggered = async (cause: Id<'events'>) =>
    (await t.run(ctx => ctx.db.query('events').take(1000))).filter(
      e =>
        e.kind === 'resource.triggered' &&
        e.causeEventId === cause &&
        (e.payload as { data: { characterId: string } }).data.characterId === hero,
    );

  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command(`${ref} /turn take`, true);
  expect(await discipline()).toEqual({ name: 'discipline', current: 2 });

  await command('/adjust malice value=6');
  // The first Malice ability hits the Null, so its correction reconciles the Null's own gains.
  await atDice(t, f.campaignId, [3, 3]);
  const first = await bury(ref);
  expect(
    (
      await f.director.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [first.eventId],
      })
    )[0]!.targets[0]!.outcome,
  ).toMatchObject({ total: 8, tier: 1 });
  expect(await triggered(first.eventId)).toMatchObject([
    { payload: { data: { triggerId: 'null-director-malice', delta: 1 } } },
  ]);
  expect((await discipline()).current).toBe(3);
  // V144 review R1: correcting the Malice ability (here its edges) leaves the gain and its claim.
  const correction = await command(
    `/ability correct event="${first.eventId}" target=${ref} edges=1 banes=0`,
  );
  expect(
    (await t.run(ctx => ctx.db.query('events').take(1000))).filter(
      e => e.kind === 'resource.reversed' && e.causeEventId === correction.eventId,
    ),
  ).toEqual([]);
  expect((await discipline()).current).toBe(3);
  expect(
    ((await t.run(ctx => ctx.db.get(hero)))!.liveState!.resourceClaims ?? []).map(c => c.triggerId),
  ).toEqual(['null-director-malice']);
  // Once per combat round, whether applied automatically or claimed.
  const second = await bury();
  expect(await triggered(second.eventId)).toEqual([]);
  expect((await discipline()).current).toBe(3);
  await expect(
    command(`${ref} /resource claim trigger=null-director-malice`, true),
  ).rejects.toThrow(/already claimed/);
  // The Null Field trigger is a separate claim with its own round limit.
  await command(`${ref} /resource claim trigger=null-field-main-action`, true);
  expect((await discipline()).current).toBe(4);
  // Undoing the Malice ability removes its discipline gain with it.
  await command('/history undo', true);
  await command('/history undo');
  await command('/history undo');
  await command('/history undo');
  expect((await discipline()).current).toBe(2);
  expect((await t.run(ctx => ctx.db.get(hero)))!.liveState!.resourceClaims ?? []).toEqual([]);

  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  expect((await discipline()).current).toBe(0);
});
