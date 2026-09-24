// SPDX-License-Identifier: GPL-3.0-only
// V147: Conduit piety generation: the turn-start prayer, domain-bound triggers and the observed
// Knowledge trigger. Expected values come from pinned feature/conduit/level-1/piety.md:
// - "At the start of each of your turns during combat, you gain 1d3 piety.";
// - praying: "If the roll is a 1, you gain 1 additional piety but anger the gods! You take psychic
//   damage equal to 1d6 + your level, which can't be reduced in any way. If the roll is a 2, you
//   gain 1 additional piety. If the roll is a 3, you gain 2 additional piety …";
// and feature/conduit/level-1/domain-piety-and-effects.md: 2 piety the first time in an encounter
// for each of the hero's two domains. The v100 witness's domains are Creation and Life.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import conduitLedger from '../fixtures/v100-conduit-expected.json' with { type: 'json' };
import { admitHero, backend, table, type Backend } from './fixtures/table';

/** Moves the campaign dice so the next rolls, one die each and in order, show these faces. */
async function position(
  t: Backend,
  campaignId: Id<'campaigns'>,
  rolls: { sides: number; face: number }[],
) {
  await t.run(async ctx => {
    const state = (await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique())!;
    const seed = fromHex(state.seed);
    for (let counter = state.counter; counter < state.counter + 200000; counter++) {
      let next = counter;
      const hit = rolls.every(roll => {
        const generated = generate(seed, next, [{ id: 'die', sides: roll.sides }]);
        next = generated.counter;
        return generated.dice[0]!.value === roll.face;
      });
      if (hit) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('Fixture dice position not found');
  });
}

let sequence = 0;
test('V147: a Conduit prays at turn start, claims its own domains, and gains from Knowledge', async () => {
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
          ...(conduitLedger.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
          'details.name': name,
        },
        definitions,
      ),
    );
  const conduit = await admit('Votary');
  // The engine reads the evaluated subclass; a Knowledge Conduit is set directly here (building one
  // is the character wizard's concern, covered by the Conduit ledgers).
  const knowing = await admit('Scholar');
  await t.run(async ctx => {
    const hero = (await ctx.db.get(knowing))!;
    const baseline = hero.derivedBaseline as { subclass: { value: string } };
    await ctx.db.patch(knowing, {
      derivedBaseline: {
        ...baseline,
        subclass: { ...baseline.subclass, value: 'Knowledge / Life' },
      },
    });
  });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `conduit-resource-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `conduit-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${conduit}}`;
  const live = async (id: Id<'characters'>) => (await t.run(ctx => ctx.db.get(id)))!.liveState!;
  const piety = async (id: Id<'characters'>) => (await live(id)).heroicResource.current;
  const triggers = async (id: Id<'characters'>, name: string) =>
    (
      await f.player.client.query(api.abilities.sheet, {
        campaignId: f.campaignId,
        actor: { kind: 'character', id, name },
      })
    ).resourceTriggers.map(trigger => trigger.id);
  expect(await triggers(conduit, 'Votary')).toEqual(['conduit-creation', 'conduit-life']);

  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');

  // Pray and roll a 1: 1 + 1 piety, then 1d6 + level psychic damage that "can't be reduced in any
  // way". The Conduit is given psychic immunity 5 (for example Time Raider's Psychic Scar), which
  // must not reduce it: a d6 of 6 at level 1 deals the full 7.
  await t.run(async ctx => {
    const hero = (await ctx.db.get(conduit))!;
    const baseline = hero.derivedBaseline as Record<string, unknown>;
    await ctx.db.patch(conduit, {
      derivedBaseline: {
        ...baseline,
        damageImmunities: [
          { damageType: 'psychic', value: { value: 5, provenance: { kind: 'test' } } },
        ],
      },
    });
  });
  await command(`${ref} /resource pray`, true);
  expect((await live(conduit)).prayNext).toBe(true);
  await position(t, f.campaignId, [
    { sides: 3, face: 1 },
    { sides: 6, face: 6 },
  ]);
  const staminaBefore = (await live(conduit)).stamina;
  const temporaryBefore = (await live(conduit)).temporaryStamina;
  await command(`${ref} /turn take`, true);
  const firing = (await t.run(ctx => ctx.db.query('events').take(1000))).find(
    e =>
      e.kind === 'clock.heroic-resource' &&
      (e.payload as { data: { step: string; characterId: string } }).data.step ===
        'turn-start-gain' &&
      (e.payload as { data: { characterId: string } }).data.characterId === conduit,
  )!;
  expect(firing.dice!.map(d => d.sides)).toEqual([3, 6]);
  expect(firing.dice!.map(d => d.value)).toEqual([1, 6]);
  const damage = 7;
  expect(await piety(conduit)).toBe(2);
  expect((await live(conduit)).prayNext).toBe(false);
  const absorbed = Math.min(temporaryBefore, damage);
  expect((await live(conduit)).stamina).toBe(staminaBefore - (damage - absorbed));

  // The hero's own domain claims, once per encounter; another domain is not theirs.
  await command(`${ref} /resource claim trigger=conduit-creation`, true);
  expect(await piety(conduit)).toBe(4);
  await expect(command(`${ref} /resource claim trigger=conduit-creation`, true)).rejects.toThrow(
    /already claimed .* this encounter/,
  );
  await expect(command(`${ref} /resource claim trigger=conduit-knowledge`, true)).rejects.toThrow(
    /no heroic-resource trigger/,
  );

  // Knowledge: the Director paying an ability's Malice cost grants 2 piety, once per encounter.
  await command('/adjust malice value=6');
  const knowledgeBefore = await piety(knowing);
  await command(`@{foe:${goblin}} /ability use ability="Bury the Point" targets=[@Thorn]`);
  expect(await piety(knowing)).toBe(knowledgeBefore + 2);
  expect(await piety(conduit)).toBe(4);
  await command(`@{foe:${goblin}} /ability use ability="Bury the Point" targets=[@Thorn]`);
  expect(await piety(knowing)).toBe(knowledgeBefore + 2);

  // Round 2: pray and roll a 3: 3 + 2 piety, no damage (the domain effect is resolved manually).
  await command(`${ref} /turn end`, true);
  for (const other of ['@Thorn', `@{character:${knowing}}`]) {
    await command(`${other} /turn take`, true);
    await command(`${other} /turn end`, true);
  }
  await command(`@{foe:${goblin}} /turn take`);
  await command(`@{foe:${goblin}} /turn end`);
  await command(`${ref} /resource pray`, true);
  const before = await piety(conduit);
  const stamina = (await live(conduit)).stamina;
  await position(t, f.campaignId, [{ sides: 3, face: 3 }]);
  await command(`${ref} /turn take`, true);
  expect(await piety(conduit)).toBe(before + 5);
  expect((await live(conduit)).stamina).toBe(stamina);

  // A declared prayer does not carry into another encounter (V147 review R1).
  await command(`${ref} /resource pray`, true);
  await command('/combat void mode=keep');
  expect((await live(conduit)).prayNext).toBe(false);
});
