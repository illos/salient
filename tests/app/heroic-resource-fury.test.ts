// SPDX-License-Identifier: GPL-3.0-only
// V142: Fury ferocity generation, including the triggers observed from recorded damage. Expected
// values come from pinned feature/fury/level-1/ferocity.md:
// - "At the start of each of your turns during combat, you gain 1d3 ferocity.";
// - "the first time each combat round that you take damage, you gain 1 ferocity.";
// - "The first time you become winded or are dying in an encounter, you gain 1d3 ferocity."
//   (one grant, Q-RES-2);
// - "You lose any remaining ferocity at the end of the encounter."
// The goblin warrior's free strike is 1 damage with no roll (monster/goblin/statblock/
// goblin-warrior.md, "1 Free Strike"; rule/combat/free-strike for creatures).
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { admitHero, backend, heroFixtureSelections, table, type Backend } from './fixtures/table';

let sequence = 0;
test('V142: a Fury gains ferocity from turns and from recorded damage, within each limit', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `fury-resource-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `fury-resource-${++sequence}`,
      text,
    });
  const thorn = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!;
  const ferocity = async () => (await thorn()).liveState!.heroicResource.current;
  const strike = () =>
    command(`@{foe:${goblin}} /ability use ability="Free Strike" targets=[@Thorn]`);
  const triggered = async (cause: Id<'events'>) =>
    (await t.run(ctx => ctx.db.query('events').take(1000))).filter(
      e => e.kind === 'resource.triggered' && e.causeEventId === cause,
    );
  const winded = ((await thorn()).derivedBaseline as { windedValue: { value: number } }).windedValue
    .value;

  // Outside combat recorded damage gains nothing: "you can't gain ferocity outside of combat".
  const outside = await strike();
  expect(await triggered(outside.eventId)).toEqual([]);
  expect(await ferocity()).toBe(0);
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  expect((await thorn()).liveState!.heroicResource.name).toBe('ferocity');
  const afterTurn = await ferocity();
  expect(afterTurn).toBeGreaterThanOrEqual(1);
  expect(afterTurn).toBeLessThanOrEqual(3);

  // First damage this round: + 1, applied automatically as a consequence of the strike.
  const first = await strike();
  expect(await ferocity()).toBe(afterTurn + 1);
  expect(await triggered(first.eventId)).toMatchObject([
    { payload: { data: { triggerId: 'fury-first-damage', delta: 1 } } },
  ]);
  // A second hit in the same round, and a claim, add nothing more.
  const second = await strike();
  expect(await triggered(second.eventId)).toEqual([]);
  expect(await ferocity()).toBe(afterTurn + 1);
  await expect(command('@Thorn /resource claim trigger=fury-first-damage', true)).rejects.toThrow(
    /already claimed/,
  );

  // Crossing the winded value: + 1d3, once per encounter, with its die on the log entry.
  await command(`@Thorn /adjust stamina value=${winded + 1}`);
  const crossing = await strike();
  const [grant] = await triggered(crossing.eventId);
  expect(grant).toMatchObject({ payload: { data: { triggerId: 'fury-winded-or-dying' } } });
  const die = grant!.dice![0]!;
  expect(die.sides).toBe(3);
  expect(await ferocity()).toBe(afterTurn + 1 + die.value);
  // Undo removes the gain and its claim together; redo restores both without rerolling.
  await command('/history undo');
  expect(await ferocity()).toBe(afterTurn + 1);
  expect(((await thorn()).liveState!.resourceClaims ?? []).map(c => c.triggerId)).toEqual([
    'fury-first-damage',
  ]);
  await command('/history redo');
  expect(await ferocity()).toBe(afterTurn + 1 + die.value);
  // Already at or below the winded value: another hit is not a new crossing.
  const later = await strike();
  expect(await triggered(later.eventId)).toEqual([]);

  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  expect(await ferocity()).toBe(0);
});

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

// Q-RES-2: "become winded or are dying" — a Fury already winded when combat starts gains nothing
// then, and gains once when hit to 0 or lower (rule/health/dying.md: dying at Stamina 0 or lower).
// A correction that makes the triggering damage cross no threshold reverses the grant.
// Spear Charge (goblin-warrior.md): Power Roll + 2, ≤11: 3 damage, 12–16: 4 damage; a bane is −2.
test('V142: winded then dying grants once, and a correction reverses a grant it no longer earns', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `fury-winded-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `fury-winded-${++sequence}`,
      text,
    });
  const thorn = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!;
  const ferocity = async () => (await thorn()).liveState!.heroicResource.current;
  const events = async (kind: string, cause: Id<'events'>) =>
    (await t.run(ctx => ctx.db.query('events').take(1000))).filter(
      e => e.kind === kind && e.causeEventId === cause,
    );
  const winded = ((await thorn()).derivedBaseline as { windedValue: { value: number } }).windedValue
    .value;

  // Already winded before combat: nothing at the start.
  await command('@Thorn /adjust stamina value=1');
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /adjust heroic-resource value=0');
  // Hit from 1 to 0: now dying, the first grant this encounter (+1 first damage, +1d3).
  const dying = await command(
    `@{foe:${goblin}} /ability use ability="Free Strike" targets=[@Thorn]`,
  );
  const grants = await events('resource.triggered', dying.eventId);
  expect(grants.map(e => (e.payload as { data: { triggerId: string } }).data.triggerId)).toEqual([
    'fury-first-damage',
    'fury-winded-or-dying',
  ]);
  expect(await ferocity()).toBe(1 + grants[1]!.dice![0]!.value);

  // A fresh encounter: Spear Charge tier 2 (4 damage) from winded + 4 crosses the winded value.
  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  await command(`@Thorn /adjust stamina value=${winded + 4}`);
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /adjust heroic-resource value=0');
  await position(t, f.campaignId, [5, 5]);
  const charge = await command(
    `@{foe:${goblin}} /ability use ability="Spear Charge" targets=[@Thorn]`,
  );
  expect((await thorn()).liveState!.stamina).toBe(winded);
  const [first, crossing] = await events('resource.triggered', charge.eventId);
  const rolled = crossing!.dice![0]!.value;
  expect(await ferocity()).toBe(1 + rolled);
  // With a bane, 10 is tier 1: 3 damage leaves winded + 1, which crosses nothing. The winded grant
  // is reversed and freed; the first-damage gain stands (3 damage is still damage taken).
  const corrected = await command(
    `/ability correct event="${charge.eventId}" target=@Thorn edges=0 banes=1`,
  );
  expect((await thorn()).liveState!.stamina).toBe(winded + 1);
  expect(await events('resource.reversed', corrected.eventId)).toMatchObject([
    { payload: { data: { triggerId: 'fury-winded-or-dying', reversedEventId: crossing!._id } } },
  ]);
  expect(await ferocity()).toBe(1);
  expect(((await thorn()).liveState!.resourceClaims ?? []).map(c => c.eventId)).toEqual([
    first!._id,
  ]);
});

// QC1 V142 R1: complication/self-taught.md suppresses gaining, it doesn't move a "first time". A
// first damage or first winded crossing while forgoing is recorded with no gain, so a later
// occurrence in the same round (or encounter) gains nothing; a genuinely new round gains again.
// feature/fury/level-1/ferocity.md: "the first time each combat round that you take damage, you
// gain 1 ferocity. The first time you become winded or are dying in an encounter, you gain 1d3".
test('V142: a forgone first occurrence still uses the round and encounter limits', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const rage = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Rage',
    heroFixtureSelections({ 'details.name': 'Rage', 'complication.choice': 'Self-Taught' }),
  );
  const built = (await t.run(ctx => ctx.db.get(rage)))!.derivedBaseline as {
    class: { value: string };
    features: { name: string; kind: string }[];
    windedValue: { value: number };
  };
  expect(built.class.value).toBe('Fury');
  expect(built.features).toContainEqual(
    expect.objectContaining({ name: 'Self-Taught', kind: 'complication' }),
  );
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `fury-forgo-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `fury-forgo-${++sequence}`,
      text,
    });
  const ref = `@{character:${rage}}`;
  const live = async () => (await t.run(ctx => ctx.db.get(rage)))!.liveState!;
  const strike = () =>
    command(`@{foe:${goblin}} /ability use ability="Free Strike" targets=[${ref}]`);
  const events = async (kind: string, cause: Id<'events'>) =>
    (await t.run(ctx => ctx.db.query('events').take(2000))).filter(
      e =>
        e.kind === kind &&
        e.causeEventId === cause &&
        (e.payload as { data: { characterId: string } }).data.characterId === rage,
    );
  const round = async (skipRage = false) => {
    if (!skipRage) {
      await command(`${ref} /turn take`, true);
      await command(`${ref} /turn end`, true);
    }
    await command('@Thorn /turn take', true);
    await command('@Thorn /turn end', true);
    await command(`@{foe:${goblin}} /turn take`);
    await command(`@{foe:${goblin}} /turn end`);
  };
  await command(`${ref} /adjust temporary-stamina value=0`);
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');

  // Round 1: forgo at this turn start; the first damage and the first winded crossing are recorded
  // with no gain.
  await command(`${ref} /resource forgo`, true);
  await command(`${ref} /turn take`, true);
  expect((await live()).heroicResource.current).toBe(0);
  await command(`${ref} /adjust stamina value=${built.windedValue.value + 1}`);
  const first = await strike();
  expect(
    (await events('resource.forgone', first.eventId)).map(
      e => (e.payload as { data: { triggerId: string } }).data.triggerId,
    ),
  ).toEqual(['fury-first-damage', 'fury-winded-or-dying']);
  expect(await events('resource.triggered', first.eventId)).toEqual([]);
  expect((await live()).heroicResource.current).toBe(0);
  await command(`${ref} /turn end`, true);
  await round(true);

  // Round 2, before Rage's turn: still forgoing; the round's first damage is recorded, no gain.
  const early = await strike();
  expect(await events('resource.forgone', early.eventId)).toHaveLength(1);
  await command(`${ref} /turn take`, true);
  expect((await live()).forgoing).toBe(false);
  const afterTurn = (await live()).heroicResource.current;
  // A later hit this round is the second damage of the round: nothing.
  const late = await strike();
  expect(await events('resource.triggered', late.eventId)).toEqual([]);
  expect((await live()).heroicResource.current).toBe(afterTurn);
  await command(`${ref} /turn end`, true);
  await round(true);

  // Round 3: a new round gains again; healed and winded again is not a new "first time".
  await command(`${ref} /adjust stamina value=${built.windedValue.value + 1}`);
  const renewed = await strike();
  expect(
    (await events('resource.triggered', renewed.eventId)).map(
      e => (e.payload as { data: { triggerId: string } }).data.triggerId,
    ),
  ).toEqual(['fury-first-damage']);
  expect((await live()).heroicResource.current).toBe(afterTurn + 1);
});
