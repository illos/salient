// SPDX-License-Identifier: GPL-3.0-only
// V113 integration: EoT expiry through the clock, prone without a duration, and taunt replacement.
// Thorn's Might and Reason are lowered to 0 only so both potency thresholds apply on fixture dice.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DerivedBaseline } from '../../shared/contracts/characterEvaluation';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, table, type Backend } from './fixtures/table';

let sequence = 0;
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

// monster/elf-shadow/statblock/shadow-elf-knightfell.md Suffusing Strike: Power Roll + 3; tier 2
// "12 corruption damage; R < 2 taunted (EoT)". Dice 5 + 5 + 3 = 13 is tier 2.
// monster/kobold/statblock/kobold-legionary.md Shield Bash: Power Roll + 2; tier 2 "3 damage;
// push 1; M < 1 prone". Dice 6 + 6 + 2 = 14 is tier 2.
// condition/taunted.md: a taunt from a different source replaces the old one.
// rule/combat/end-of-turn.md: EoT ends at the end of the creature's next turn.
// condition/prone.md: prone has no expiry of its own; the creature stands up (Stand Up).
test('V113: taunt replacement, EoT expiry at the target turn end, prone persists', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  await t.run(async ctx => {
    const hero = (await ctx.db.get(f.thornId))!;
    const baseline = hero.derivedBaseline as DerivedBaseline;
    await ctx.db.patch(f.thornId, {
      derivedBaseline: {
        ...baseline,
        characteristics: {
          ...baseline.characteristics,
          M: { ...baseline.characteristics.M, value: 0 },
          R: { ...baseline.characteristics.R, value: 0 },
        },
      },
    });
  });
  const add = (slug: string) =>
    f.director.client.mutation(api.foes.add, {
      campaignId: f.campaignId,
      definitionId: `mcdm.monsters.v1/monster.${slug}`,
      commandId: `tiereffects-${++sequence}`,
    });
  const first = await add('elf-shadow.statblock/shadow-elf-knightfell');
  const second = await add('elf-shadow.statblock/shadow-elf-knightfell');
  const kobold = await add('kobold.statblock/kobold-legionary');
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `tiereffects-${++sequence}`,
      text,
    });
  const live = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  const active = async () =>
    (await live()).conditionInstances!.filter(instance => instance.status === 'active');
  const read = async (eventId: Id<'events'>) =>
    (
      await f.director.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [eventId],
      })
    )[0]!.compiled as PublicCompiledResult;
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command(`@{foe:${first}} /turn take`);

  await position(t, f.campaignId, [5, 5]);
  const taunt = await command(
    `@{foe:${first}} /ability use ability="Suffusing Strike" targets=[@Thorn]`,
  );
  const taunted = (await read(taunt.eventId)).effects.find(o => o.effect.kind === 'condition')!;
  expect(taunted.effect).toMatchObject({
    condition: 'taunted',
    duration: 'eot',
    status: 'applied',
  });
  expect(await active()).toMatchObject([
    { id: taunted.id, condition: 'taunted', duration: 'eot', sourceActorId: first },
  ]);
  expect((await active())[0]!.registrationId).toBeTruthy();

  await position(t, f.campaignId, [5, 5]);
  const retaunt = await command(
    `@{foe:${second}} /ability use ability="Suffusing Strike" targets=[@Thorn]`,
  );
  const replaced = (await live()).conditionInstances!.find(i => i.id === taunted.id)!;
  expect(replaced).toMatchObject({ status: 'ended', endedReason: 'replaced by a new taunt' });
  const current = (await read(retaunt.eventId)).effects.find(o => o.effect.kind === 'condition')!;
  expect(await active()).toMatchObject([{ id: current.id, sourceActorId: second }]);

  await position(t, f.campaignId, [6, 6]);
  const bash = await command(
    `@{foe:${kobold}} /ability use ability="Shield Bash" targets=[@Thorn]`,
  );
  const bashEffects = (await read(bash.eventId)).effects;
  expect(bashEffects.map(o => o.effect.kind)).toEqual(['damage', 'push', 'condition']);
  const prone = bashEffects[2]!;
  expect(prone.effect).toMatchObject({ condition: 'prone', duration: 'none', status: 'applied' });
  const proneInstance = (await active()).find(i => i.id === prone.id)!;
  expect(proneInstance).toMatchObject({ duration: 'none' });
  expect(proneInstance.registrationId).toBeUndefined();
  expect((await live()).conditions).toMatchObject({ taunted: true, prone: true });

  await command(`@{foe:${first}} /turn end`);
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  const after = await live();
  expect(after.conditions).toMatchObject({ taunted: false, prone: true });
  expect(after.conditionInstances!.find(i => i.id === current.id)).toMatchObject({
    status: 'ended',
    endedReason: 'end of turn (EoT)',
  });
  expect(after.conditionInstances!.find(i => i.id === prone.id)).toMatchObject({
    status: 'active',
  });
  await command('/history rewind');
  expect((await live()).conditions).toMatchObject({ taunted: true, prone: true });
  await command('/history redo');
  expect((await live()).conditions).toMatchObject({ taunted: false, prone: true });
  await command('@Thorn /condition off name=prone', true);
  expect((await live()).conditionInstances!.find(i => i.id === prone.id)).toMatchObject({
    status: 'ended',
  });
});
