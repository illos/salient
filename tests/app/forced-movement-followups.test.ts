// SPDX-License-Identifier: GPL-3.0-only
/**
 * V176 Call the Thunder Down through the registered operations, with persisted readback and
 * Convex's transaction limits enforced. Expected values come from the pinned Compendium
 * (en/unified/md) and the reviewed ledger, never from a run of the code under test:
 * - feature/ability/conduit/level-1/call-the-thunder-down.md: 3 Piety; Power Roll + Intuition;
 *   12-16 "3 sonic damage; push 2", 17+ "5 sonic damage; push 3"; Effect: "You can push each
 *   willing ally in the area the same distance, ignoring stability."
 * - tests/fixtures/v100-conduit-expected.json, v100-creation: Intuition 2 and this ability's damage
 *   by tier. rule/dice/edge.md: an
 *   edge is +2. Dice 7 + 6 + 2 = 15 is tier 2; with one edge 17 is tier 3.
 * - movement/forced-movement.md: the tier push is an allowance; nothing here says what moved.
 */
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import conduitLedger from '../fixtures/v100-conduit-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');

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
    throw new Error('Fixture dice position not found');
  });
}

let sequence = 0;
test('Call the Thunder Down reads the tier push distance, asks when tiers differ, and follows a correction', async () => {
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Votary',
    draftSelectionsFrom(
      {
        ...(conduitLedger.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Votary',
      },
      definitions,
    ),
  );
  const goblins = [] as Id<'foes'>[];
  for (const n of [1, 2])
    goblins.push(
      await f.director.client.mutation(api.foes.add, {
        campaignId: f.campaignId,
        definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
        commandId: `thunder-foe-${n}`,
      }),
    );
  const command = (text: string, client = f.director.client) =>
    client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `thunder-${++sequence}`,
      text,
    });
  const refs = goblins.map(id => `@{foe:${id}}`);
  await command('@Votary /adjust heroic-resource value=3');
  await atDice(t, f.campaignId, [7, 6]);
  const used = await command(
    `@Votary /ability use ability="Call the Thunder Down" targets=[${refs.join(',')}] edges=[1,0] banes=[0,0]`,
    f.player.client,
  );
  const read = async () =>
    (
      await f.director.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [used.eventId],
      })
    )[0]!.compiled as PublicCompiledResult;
  const pushesOf = (compiled: PublicCompiledResult) =>
    compiled.effects.flatMap(o =>
      o.effect.kind === 'push' ? [[o.effect.targetId, o.effect.printed, o.effect.subtotal]] : [],
    );
  const riderOf = (compiled: PublicCompiledResult) =>
    compiled.effects.find(o => o.effect.kind === 'rider')!.effect;

  const initial = await read();
  expect(initial.definition.execution).toBe('supported');
  expect(pushesOf(initial)).toEqual([
    [goblins[0], 3, 3],
    [goblins[1], 2, 2],
  ]);
  const asked = riderOf(initial);
  expect(asked).toMatchObject({ kind: 'rider', shape: 'forced-movement', status: 'fact-needed' });
  expect(asked.kind === 'rider' && asked.requirements.join(' ')).toMatch(/2 or 3.*Q-FM-2/);
  // Only damage changed the goblins (monster/goblin/statblock/goblin-warrior.md: Stamina 15; the
  // ledger's v100-creation damage by tier for this ability).
  const damage = conduitLedger.witnesses[0]!.rolledActions.find(
    a => a.name === 'Call the Thunder Down',
  )!.damageByTier!;
  expect(
    await Promise.all(goblins.map(async id => (await t.run(ctx => ctx.db.get(id)))!.live.stamina)),
  ).toEqual([15 - damage[2]!, 15 - damage[1]!]);

  // Correcting the first goblin to no edge puts both on tier 2: one distance, table work.
  await command(
    `/ability correct event="${used.eventId}" target=${refs[0]} edges=0 banes=0`,
    f.player.client,
  );
  const corrected = await read();
  expect(pushesOf(corrected)).toEqual([
    [goblins[0], 2, 2],
    [goblins[1], 2, 2],
  ]);
  expect(riderOf(corrected)).toMatchObject({
    status: 'manual',
    distances: [2],
    requirements: [],
  });
});
