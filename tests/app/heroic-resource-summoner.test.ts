// SPDX-License-Identifier: GPL-3.0-only
// V141: Summoner essence generation through the combat clock and `resource.claim`. Expected values
// come from pinned feature/summoner/level-1/essence.md:
// - "you gain essence equal to your Victories" at the start of a combat encounter;
// - "At the start of each of your turns during combat, you gain 2 essence.";
// - "The first time each round that any minion (either yours or an enemy) dies unwillingly within
//   your Summoner's Range, you gain 1 essence." (claimed: summoned minions and range are not
//   tracked); feature/summoner/level-4/essence-salvage.md makes it 2 from level 4;
// - "You lose any remaining essence at the end of the encounter."
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import summonerLedger from '../fixtures/v107-summoner-expected.json' with { type: 'json' };
import { admitHero, backend, table } from './fixtures/table';

let sequence = 0;
test('V141: a Summoner gains essence at combat start, each turn and from a per-round claim', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const summoner = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Caller',
    draftSelectionsFrom(
      {
        ...(summonerLedger.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Caller',
      },
      definitions,
    ),
  );
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `summoner-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${summoner}}`;
  const essence = async () => (await t.run(ctx => ctx.db.get(summoner)))!.liveState!.heroicResource;
  const claim = () => command(`${ref} /resource claim trigger=summoner-minion-death`, true);

  await command(`${ref} /adjust victories value=3`);
  await command('/combat start');
  await command('/combat commit');
  expect(await essence()).toEqual({ name: 'essence', current: 3 });
  await command('/combat first side=heroes');
  await command(`${ref} /turn take`, true);
  expect((await essence()).current).toBe(5);
  await claim();
  expect((await essence()).current).toBe(6);
  await expect(claim()).rejects.toThrow(/already claimed/);

  // Round 2: + 2 again, and the round limit resets.
  await command(`${ref} /turn end`, true);
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command(`${ref} /turn take`, true);
  expect((await essence()).current).toBe(8);
  // Level 4 (essence-salvage.md): the same claim gives 2. The engine reads only the evaluated level.
  await t.run(async ctx => {
    const hero = (await ctx.db.get(summoner as Id<'characters'>))!;
    const baseline = hero.derivedBaseline as { level: { value: number } };
    await ctx.db.patch(hero._id, {
      derivedBaseline: { ...baseline, level: { ...baseline.level, value: 4 } },
    });
  });
  await claim();
  expect((await essence()).current).toBe(10);

  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  expect((await essence()).current).toBe(0);
});
