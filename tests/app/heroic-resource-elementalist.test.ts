// SPDX-License-Identifier: GPL-3.0-only
// V148: Elementalist essence generation with Persistent Magic. Expected values come from pinned
// feature/elementalist/level-1/essence.md ("At the start of each of your turns during combat, you
// gain 2 essence.") and persistent-magic.md: maintaining reduces that gain by the persistent value;
// "You can't maintain any abilities that would make you earn a negative amount of essence"; taking
// damage of at least 5 × Reason in one turn stops all maintenance. Witness v104-1 has The Flesh, a
// Crucible (3 Essence, Persistent 1), Reason 2 (threshold 10).
// monster/goblin/statblock/goblin-warrior.md Spear Charge: Power Roll + 2, 17+: 5 damage.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import elementalistLedger from '../fixtures/v104-elementalist-expected.json' with { type: 'json' };
import { admitHero, backend, table, type Backend } from './fixtures/table';

async function position(t: Backend, campaignId: Id<'campaigns'>, faces: number[]) {
  await t.run(async ctx => {
    const state = (await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique())!;
    for (let counter = state.counter; counter < state.counter + 100000; counter++) {
      const roll = generate(
        fromHex(state.seed),
        counter,
        faces.map((_, i) => ({ id: `die${i}`, sides: 10 })),
      );
      if (roll.dice.every((die, i) => die.value === faces[i])) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('Fixture dice position not found');
  });
}

let sequence = 0;
test('V148: maintaining persistent abilities reduces the turn-start essence and breaks on damage', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const hero = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Kindle',
    draftSelectionsFrom(
      {
        ...(elementalistLedger.witnesses.find(w => w.id === 'v104-1')!
          .selections as unknown as EvaluationInput['selections']),
        'details.name': 'Kindle',
      },
      definitions,
    ),
  );
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `elementalist-resource-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `elementalist-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${hero}}`;
  const live = async () => (await t.run(ctx => ctx.db.get(hero)))!.liveState!;
  const maintain = (ability: string, value = 'on') =>
    command(`${ref} /resource maintain ability="${ability}" value=${value}`, true);

  const flesh = async () => {
    await command(`${ref} /adjust heroic-resource value=3`);
    await command(
      `${ref} /ability use ability="The Flesh, a Crucible" targets=[@{foe:${goblin}}]`,
      true,
    );
  };
  await expect(maintain('The Flesh, a Crucible')).rejects.toThrow(/in combat/);
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command(`${ref} /turn take`, true);
  // "start doing so immediately after you first use the ability": a use is required first.
  await expect(maintain('The Flesh, a Crucible')).rejects.toThrow(/right after using it/);
  await flesh();
  await maintain('The Flesh, a Crucible');
  await expect(maintain('The Flesh, a Crucible')).rejects.toThrow(/right after using it/);
  // A second instance on another use: upkeep 2, allowed (at most the gain of 2).
  await flesh();
  await maintain('The Flesh, a Crucible');
  expect((await live()).maintained).toHaveLength(2);
  // A third would make the turn-start gain negative.
  await flesh();
  await expect(maintain('The Flesh, a Crucible')).rejects.toThrow(/negative amount/);

  // Two tier-3 Spear Charges (5 each) in this turn reach 5 × Reason = 10: maintenance stops.
  await command(`${ref} /adjust temporary-stamina value=0`);
  await position(t, f.campaignId, [8, 7]);
  await command(`@{foe:${goblin}} /ability use ability="Spear Charge" targets=[${ref}]`);
  expect((await live()).maintained).toHaveLength(2);
  await position(t, f.campaignId, [8, 7]);
  const second = await command(
    `@{foe:${goblin}} /ability use ability="Spear Charge" targets=[${ref}]`,
  );
  expect((await live()).maintained).toEqual([]);
  // QC1 train-4 R2: the turn's tally can't be recomputed from a corrected hit, so the correction is
  // refused before anything changes and the table rewinds instead.
  await expect(
    command(`/ability correct event="${second.eventId}" target=${ref} edges=0 banes=1`),
  ).rejects.toThrow(/Rewind/);
  expect((await live()).maintained).toEqual([]);
  expect(
    (await t.run(ctx => ctx.db.query('events').take(1000))).filter(
      e => e.kind === 'resource.maintenance-ended' && e.causeEventId === second.eventId,
    ),
  ).toHaveLength(1);

  // QC1 train-4 R3: the third use's choice closed when play moved on (the hits), so it can't start
  // maintenance now; a fresh use can.
  await expect(maintain('The Flesh, a Crucible')).rejects.toThrow(/right after using it/);
  await flesh();
  await maintain('The Flesh, a Crucible');
  // Use, use, maintain, maintain: the second use closed the first use's choice (QC1 R3 residual).
  await command(`${ref} /resource maintain ability="The Flesh, a Crucible" value=off`, true);
  await flesh();
  await flesh();
  await maintain('The Flesh, a Crucible');
  await expect(maintain('The Flesh, a Crucible')).rejects.toThrow(/right after using it/);
  expect((await live()).maintained).toHaveLength(1);
  // A genuine unmaintained use carried across the turn boundary can't start maintenance either.
  await flesh();
  await command(`${ref} /turn end`, true);
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command(`@{foe:${goblin}} /turn take`);
  await command(`@{foe:${goblin}} /turn end`);
  const before = (await live()).heroicResource.current;
  await command(`${ref} /turn take`, true);
  // One instance maintained: the next gain is 2 − 1 = 1.
  expect((await live()).heroicResource.current).toBe(before + 1);
  await expect(maintain('The Flesh, a Crucible')).rejects.toThrow(/right after using it/);
  expect((await live()).maintained).toHaveLength(1);

  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  expect((await live()).heroicResource.current).toBe(0);
  expect((await live()).maintained).toEqual([]);
});
