// SPDX-License-Identifier: GPL-3.0-only
// V140: Tactician focus generation through the combat clock and `resource.claim`. Expected values
// come from pinned feature/tactician/level-1/focus.md:
// - "you gain focus equal to your Victories" at the start of a combat encounter;
// - "At the start of each of your turns during combat, you gain 2 focus.";
// - "the first time each combat round that you or any ally damages a creature marked by you …, you
//   gain 1 focus" and "The first time in a combat round that any ally within 10 squares of you uses
//   a heroic ability, you gain 1 focus." (claimed: marks and distance are not tracked);
// - "You lose any remaining focus at the end of the encounter."
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import tacticianLedger from '../fixtures/v94-tactician-expected.json' with { type: 'json' };
import { admitHero, backend, table } from './fixtures/table';

let sequence = 0;
test('V140: a Tactician gains focus at combat start, each turn and from two per-round claims', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const tactician = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Planner',
    draftSelectionsFrom(
      {
        ...(tacticianLedger.witnesses[0]!.selections as EvaluationInput['selections']),
        'details.name': 'Planner',
      },
      definitions,
    ),
  );
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `tactician-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${tactician}}`;
  const focus = async () =>
    (await t.run(ctx => ctx.db.get(tactician)))!.liveState!.heroicResource.current;
  const claim = (trigger: string) => command(`${ref} /resource claim trigger=${trigger}`, true);

  await command(`${ref} /adjust victories value=1`);
  await command('/combat start');
  await command('/combat commit');
  expect(await focus()).toBe(1);
  await command('/combat first side=heroes');
  await command(`${ref} /turn take`, true);
  expect(await focus()).toBe(3);
  expect(
    (
      await f.player.client.query(api.abilities.sheet, {
        campaignId: f.campaignId,
        actor: { kind: 'character', id: tactician, name: 'Planner' },
      })
    ).resourceTriggers.map(trigger => [trigger.id, trigger.amount, trigger.unavailable]),
  ).toEqual([
    ['tactician-marked-damage', 1, null],
    ['tactician-ally-heroic', 1, null],
  ]);
  // The two triggers are separate "first time each combat round" limits.
  await claim('tactician-marked-damage');
  await claim('tactician-ally-heroic');
  expect(await focus()).toBe(5);
  await expect(claim('tactician-marked-damage')).rejects.toThrow(/already claimed/);
  await expect(claim('tactician-ally-heroic')).rejects.toThrow(/already claimed/);

  // Round 2: another turn-start gain, and the round limits reset.
  await command(`${ref} /turn end`, true);
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command(`${ref} /turn take`, true);
  expect(await focus()).toBe(7);
  await claim('tactician-marked-damage');
  expect(await focus()).toBe(8);

  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  expect(await focus()).toBe(0);
});
