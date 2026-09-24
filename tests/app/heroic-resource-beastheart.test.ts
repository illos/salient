// SPDX-License-Identifier: GPL-3.0-only
// V143: Beastheart ferocity generation through the combat clock and `resource.claim`. Expected
// values come from pinned feature/beastheart/level-1/ferocity.md:
// - "you gain ferocity equal to your Victories" at the start of a combat encounter;
// - "At the start of each of your turns during combat, you gain 1d3 ferocity.";
// - "the first time each combat round that a creature adjacent to your companion takes damage, you
//   gain 2 ferocity." (claimed: the companion and positions are not tracked);
// - "You lose any remaining ferocity at the end of the encounter."
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import beastheartLedger from '../fixtures/v106-beastheart-expected.json' with { type: 'json' };
import { admitHero, backend, table } from './fixtures/table';

let sequence = 0;
test('V143: a Beastheart gains ferocity at combat start, each turn and from a per-round claim', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const hero = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Packmate',
    draftSelectionsFrom(
      {
        ...(beastheartLedger.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Packmate',
      },
      definitions,
    ),
  );
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `beastheart-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${hero}}`;
  const pool = async () => (await t.run(ctx => ctx.db.get(hero)))!.liveState!.heroicResource;
  const turnDie = async () =>
    (await t.run(ctx => ctx.db.query('events').take(500)))
      .filter(
        e =>
          e.kind === 'clock.heroic-resource' &&
          (e.payload as { data: { step: string; characterId: string } }).data.step ===
            'turn-start-gain' &&
          (e.payload as { data: { characterId: string } }).data.characterId === hero,
      )
      .map(e => e.dice![0]!);

  await command(`${ref} /adjust victories value=2`);
  await command('/combat start');
  await command('/combat commit');
  expect(await pool()).toEqual({ name: 'ferocity', current: 2 });
  await command('/combat first side=heroes');
  await command(`${ref} /turn take`, true);
  const [die] = await turnDie();
  expect(die!.sides).toBe(3);
  expect((await pool()).current).toBe(2 + die!.value);
  await command(`${ref} /resource claim trigger=beastheart-companion-adjacent-damage`, true);
  expect((await pool()).current).toBe(4 + die!.value);
  await expect(
    command(`${ref} /resource claim trigger=beastheart-companion-adjacent-damage`, true),
  ).rejects.toThrow(/already claimed/);

  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  expect((await pool()).current).toBe(0);
});
