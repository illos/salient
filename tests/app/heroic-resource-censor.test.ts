// SPDX-License-Identifier: GPL-3.0-only
// V145: Censor wrath generation through the combat clock and `resource.claim`. Expected values come
// from pinned feature/censor/level-1/wrath.md:
// - "you gain wrath equal to your Victories" at the start of a combat encounter;
// - "At the start of each of your turns during combat, you gain 2 wrath.";
// - "the first time each combat round that a creature judged by you … deals damage to you, you gain
//   1 wrath" and "The first time each combat round that you deal damage to a creature judged by
//   you, you gain 1 wrath." (claimed: judgment is not tracked);
// - "You lose any remaining wrath at the end of the encounter."
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import censorLedger from '../fixtures/v99-censor-expected.json' with { type: 'json' };
import { admitHero, backend, table } from './fixtures/table';

let sequence = 0;
test('V145: a Censor gains wrath at combat start, each turn and from two per-round claims', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const censor = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Warden',
    draftSelectionsFrom(
      {
        ...(censorLedger.witnesses[0]!.selections as EvaluationInput['selections']),
        'details.name': 'Warden',
      },
      definitions,
    ),
  );
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `censor-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${censor}}`;
  const wrath = async () => (await t.run(ctx => ctx.db.get(censor)))!.liveState!.heroicResource;
  const claim = (trigger: string) => command(`${ref} /resource claim trigger=${trigger}`, true);

  await command(`${ref} /adjust victories value=2`);
  await command('/combat start');
  await command('/combat commit');
  expect(await wrath()).toEqual({ name: 'wrath', current: 2 });
  await command('/combat first side=heroes');
  await command(`${ref} /turn take`, true);
  expect((await wrath()).current).toBe(4);
  // The two triggers are separate "first time each combat round" limits.
  await claim('censor-judged-damaged-you');
  await claim('censor-damaged-judged');
  expect((await wrath()).current).toBe(6);
  await expect(claim('censor-judged-damaged-you')).rejects.toThrow(/already claimed/);
  await expect(claim('censor-damaged-judged')).rejects.toThrow(/already claimed/);

  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  expect((await wrath()).current).toBe(0);
});
