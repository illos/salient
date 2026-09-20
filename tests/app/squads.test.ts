// SPDX-License-Identifier: GPL-3.0-only
// V02 minion squads at the shared-operation level: the slice's acceptance checks and the user's
// 2026-09-20 rulings, driven through the registered operations with real content, server dice
// and persisted readback. Expected numbers come from the pinned stat blocks (Goblin Spinecleaver
// Stamina 5 / free strike 2 / Axe 2-4-5; Dwarf Axethrower Stamina 7, +2 Stamina with captain;
// Goblin Warrior Stamina 15 / Spear Charge 3-4-5 / free strike 1), from R04 10.13 (Brutal Slam
// 5/8/15 for the fixture hero) and from chapter/monster-basics.md; none from running this code.
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, storedEvents, table, type Backend } from './fixtures/table';

type Fixture = Awaited<ReturnType<typeof table>>;
type Client = Fixture['director']['client'];

const SPINECLEAVER = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-spinecleaver';
const AXETHROWER = 'mcdm.monsters.v1/monster.dwarf.statblock/dwarf-axethrower';
const WARRIOR = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

let n = 0;
const cid = (label: string) => `${label}-${String(++n).padStart(6, '0')}`;
const submit = (client: Client, campaignId: Id<'campaigns'>, text: string, label = 'cmd') =>
  client.mutation(api.commands.submit, { campaignId, text, commandId: cid(label) });
const foeRef = (id: string) => `@{foe:${id}}`;
const squadRef = (id: string) => `@{squad:${id}}`;

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

async function arena(t: Backend) {
  const fixture = await table(t);
  await t.action(internal.content.reseed, {});
  const { director, campaignId } = fixture;
  await submit(director.client, campaignId, '@Thorn /adjust stamina value=30', 'adj');
  await submit(director.client, campaignId, '@Thorn /adjust heroic-resource value=6', 'adj');
  return fixture;
}
const roster = (f: Fixture) =>
  f.director.client.query(api.table.roster, { campaignId: f.campaignId });
const encounter = (f: Fixture) =>
  f.director.client.query(api.encounters.current, { campaignId: f.campaignId });
const squadRow = (t: Backend, id: Id<'squads'>) =>
  t.run(ctx => ctx.db.get(id)) as Promise<Doc<'squads'>>;
const stamina = async (t: Backend, id: Id<'foes'>) =>
  (await t.run(ctx => ctx.db.get(id)))!.live.stamina;
const heroStamina = async (t: Backend, id: Id<'characters'>) =>
  (await t.run(ctx => ctx.db.get(id)))!.liveState!.stamina;

async function addSquad(f: Fixture, definition: string, count: number, captain?: Id<'foes'>) {
  const before = new Set((await roster(f)).squads.map(s => s.id));
  await submit(
    f.director.client,
    f.campaignId,
    `/squad add definition="${definition}" count=${count}${captain ? ` captain=${foeRef(captain)}` : ''}`,
    'squad-add',
  );
  const squad = (await roster(f)).squads.find(s => !before.has(s.id))!;
  return { id: squad.id, members: squad.memberIds, name: squad.name };
}
const addWarrior = (f: Fixture) =>
  f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: WARRIOR,
    commandId: cid('warrior'),
  });
async function startCombat(f: Fixture) {
  await submit(f.director.client, f.campaignId, '/combat start', 'start');
  await submit(f.director.client, f.campaignId, '/combat commit', 'commit');
  await submit(f.player.client, f.campaignId, '/combat roll', 'roll');
  await submit(f.director.client, f.campaignId, '/combat first side=heroes', 'first');
}
async function spearCharge(
  t: Backend,
  f: Fixture,
  warrior: Id<'foes'>,
  target: Id<'foes'>,
  faces: [number, number],
) {
  await atDice(t, f.campaignId, faces);
  return submit(
    f.director.client,
    f.campaignId,
    `${foeRef(warrior)} /ability use ability="Spear Charge" targets=[${foeRef(target)}]`,
    'spear',
  );
}
async function brutalSlam(t: Backend, f: Fixture, target: string, faces: [number, number]) {
  await atDice(t, f.campaignId, faces);
  return submit(
    f.player.client,
    f.campaignId,
    `@Thorn /ability use ability="Brutal Slam" targets=[${target}]`,
    'slam',
  );
}
async function eventOf(t: Backend, f: Fixture, id: Id<'events'>) {
  return (await storedEvents(t, f.campaignId)).find(e => e._id === id)!;
}

describe('V02 minion squads', () => {
  test('acceptance 1 and 6: a squad of three persists one entry, three identities and a 3 × 5 pool; EV 3 × 3 ÷ 4', async () => {
    const t = backend();
    const f = await arena(t);
    const squad = await addSquad(f, SPINECLEAVER, 3);
    const row = await squadRow(t, squad.id);
    expect(row).toMatchObject({
      name: 'Goblin Spinecleaver squad',
      memberStamina: 5,
      step: 5,
      pool: 15,
      poolMax: 15,
      carried: 0,
      captainId: null,
      captainBenefit: {
        text: '+1 damage bonus to strikes',
        strikeDamage: 1,
        stamina: 0,
        manual: false,
      },
      ev: { printed: '3 for four minions', amount: 3, quantity: 4, derived: 2.25 },
    });
    expect(row.memberIds).toHaveLength(3);
    const view = await roster(f);
    expect(view.foes.filter(foe => foe.squadId === squad.id).map(foe => foe.name)).toEqual([
      'Goblin Spinecleaver 1',
      'Goblin Spinecleaver 2',
      'Goblin Spinecleaver 3',
    ]);
    expect(view.squads[0]).toMatchObject({
      living: 3,
      total: 3,
      health: { mode: 'director', pool: 15, poolMax: 15, step: 5 },
    });
    // Players see the pool through the health display and none of the Director facts.
    const peer = await f.player.client.query(api.table.roster, { campaignId: f.campaignId });
    expect(peer.squads[0]).toMatchObject({ living: 3, health: { mode: 'bar', fraction: 1 } });
    expect(peer.squads[0]).not.toHaveProperty('director');
    // Minions go through the squad add; ordinary foes and squads are not interchangeable.
    await expect(
      f.director.client.mutation(api.foes.add, {
        campaignId: f.campaignId,
        definitionId: SPINECLEAVER,
        commandId: cid('x'),
      }),
    ).rejects.toThrow('/squad add');
    await expect(
      submit(f.director.client, f.campaignId, `/squad add definition="${WARRIOR}"`),
    ).rejects.toThrow('/foe add');
    await expect(
      submit(f.director.client, f.campaignId, `/squad add definition="${SPINECLEAVER}" count=9`),
    ).rejects.toThrow('exceed 8');
    // One turn entry for the squad, none for its minions.
    await startCombat(f);
    const entries = (await encounter(f))!.groups.flatMap(g => g.entries);
    expect(entries.filter(e => e.actor.kind === 'squad')).toHaveLength(1);
    expect(entries.filter(e => e.actor.kind === 'foe')).toHaveLength(0);
  });

  test('ladder: 3 then 1 + 1 drops the second minion hit (Dropping One Minion); the pool exhausting defeats all', async () => {
    const t = backend();
    const f = await arena(t);
    const squad = await addSquad(f, SPINECLEAVER, 4);
    const [m1, m2, m3] = squad.members as [Id<'foes'>, Id<'foes'>, Id<'foes'>];
    const w = await addWarrior(f);
    await startCombat(f);
    await spearCharge(t, f, w, m1, [1, 1]); // 2 + 2 = 4 → tier 1 → 3 damage
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 17, carried: 3 });
    expect(await stamina(t, m1)).toBe(5);
    for (let i = 0; i < 2; i++)
      await submit(
        f.director.client,
        f.campaignId,
        `${foeRef(w)} /ability use ability="Free Strike" targets=[${foeRef(m2)}]`,
        'fs',
      );
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 15, carried: 0 });
    expect([await stamina(t, m1), await stamina(t, m2)]).toEqual([5, 0]);
    // 15 non-area damage against a pool of 15: zero defeats every remaining minion (2026-09-20).
    const slam = await brutalSlam(t, f, foeRef(m3), [9, 9]);
    expect((await eventOf(t, f, slam.eventId)).description).toContain('pool exhausted');
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 0, pending: null });
    for (const id of squad.members) expect(await stamina(t, id as Id<'foes'>)).toBe(0);
    expect(slam.interactionId).toBeNull();
  });

  test('acceptance 3: 15 non-area damage drops the target and two nearest through the casualty card; survivors below the step live until zero', async () => {
    const t = backend();
    const f = await arena(t);
    const squad = await addSquad(f, SPINECLEAVER, 4);
    const [m1, m2, m3, m4] = squad.members as Id<'foes'>[];
    const w = await addWarrior(f);
    await startCombat(f);
    const slam = await brutalSlam(t, f, foeRef(m1!), [9, 9]);
    expect(slam.interactionId).not.toBeNull();
    const after = await squadRow(t, squad.id);
    expect(after).toMatchObject({ pool: 5, carried: 0 });
    expect(after.pending).toMatchObject({ count: 2, candidates: [m2, m3, m4], reason: 'nearest' });
    expect(await stamina(t, m1!)).toBe(0);
    expect([await stamina(t, m2!), await stamina(t, m3!), await stamina(t, m4!)]).toEqual([
      5, 5, 5,
    ]);
    // The player who attacked names the nearest two; the pool is not deducted again.
    await f.player.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      text: `/card respond card=@{interaction:${slam.interactionId}} answer={"casualties": [${foeRef(m2!)}, ${foeRef(m3!)}]}`,
      commandId: cid('card'),
    });
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 5, pending: null });
    expect([await stamina(t, m2!), await stamina(t, m3!), await stamina(t, m4!)]).toEqual([
      0, 0, 5,
    ]);
    // 3 damage leaves a lone minion alive at pool 2 (no threshold crossed); 3 more reaches zero.
    await spearCharge(t, f, w, m4!, [1, 1]);
    expect([(await squadRow(t, squad.id)).pool, await stamina(t, m4!)]).toEqual([2, 5]);
    await spearCharge(t, f, w, m4!, [1, 1]);
    expect([(await squadRow(t, squad.id)).pool, await stamina(t, m4!)]).toEqual([0, 0]);
    // The squad entry leaves the battle; a foe entry check for the warrior remains.
    const entries = (await encounter(f))!.groups.flatMap(g => g.entries);
    expect(entries.find(e => e.actor.kind === 'squad')?.slain).toBe(true);
  });

  test('area (Minions and Area Effects): Thunder Roar tier 2 on three of four caps each at one step, 20 → 5, and the fourth is unscathed', async () => {
    const t = backend();
    const f = await arena(t);
    const squad = await addSquad(f, SPINECLEAVER, 4);
    const [m1, m2, m3, m4] = squad.members as Id<'foes'>[];
    await startCombat(f);
    await submit(f.player.client, f.campaignId, '@Thorn /turn take', 'take');
    await atDice(t, f.campaignId, [7, 6]); // 13 + 2 Might = 15 → tier 2 → 9 damage each
    const roar = await submit(
      f.player.client,
      f.campaignId,
      `@Thorn /ability use ability="Thunder Roar" targets=[${foeRef(m1!)},${foeRef(m2!)},${foeRef(m3!)}]`,
      'roar',
    );
    const event = await eventOf(t, f, roar.eventId);
    expect(event.description).toContain('area cap');
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 5, carried: 0, pending: null });
    expect([
      await stamina(t, m1!),
      await stamina(t, m2!),
      await stamina(t, m3!),
      await stamina(t, m4!),
    ]).toEqual([0, 0, 0, 5]);
    const data = (
      event.payload as {
        data: {
          squads: { applied: number; contributions: { applied: number; capped: boolean }[] }[];
        };
      }
    ).data;
    expect(data.squads[0]!.applied).toBe(15);
    expect(data.squads[0]!.contributions.every(c => c.capped && c.applied === 5)).toBe(true);
  });

  test('acceptance 4 and the 2026-09-20 rulings: captain Stamina benefit, loss without casualties, carried damage across the change, zero from a loss', async () => {
    const t = backend();
    const f = await arena(t);
    const w1 = await addWarrior(f);
    const w2 = await addWarrior(f);
    const w3 = await addWarrior(f);
    const w4 = await addWarrior(f);
    const four = await addSquad(f, AXETHROWER, 4, w1);
    expect(await squadRow(t, four.id)).toMatchObject({
      pool: 36,
      poolMax: 36,
      step: 9,
      captainId: w1,
      captainBenefit: { stamina: 2 },
    });
    await startCombat(f);
    // Only the squad entry exists for the captain and its minions.
    const entries = (await encounter(f))!.groups.flatMap(g => g.entries);
    expect(entries.some(e => e.actor.kind === 'foe' && e.actor.id === w1)).toBe(false);
    await brutalSlam(t, f, foeRef(four.members[0]!), [7, 7]); // tier 2 → 8 damage
    expect(await squadRow(t, four.id)).toMatchObject({ pool: 28, carried: 8 });
    // Removing the captain reverts the benefit for four survivors with no casualty; carried stays 8.
    const removal = await submit(
      f.director.client,
      f.campaignId,
      `${foeRef(w1)} /foe remove`,
      'remove',
    );
    const lost = (await storedEvents(t, f.campaignId)).find(
      e => e.kind === 'squad.captain-lost' && e.causeEventId === removal.eventId,
    )!;
    expect(lost.description).toContain('pool 28 → 20, step 9 → 7');
    expect(await squadRow(t, four.id)).toMatchObject({
      pool: 20,
      step: 7,
      carried: 8,
      captainId: null,
      poolMax: 28,
    });
    for (const id of four.members) expect(await stamina(t, id)).toBe(7);
    // Carried 8 exceeds the new step: a 1-damage free strike drops a minion at once.
    await submit(
      f.director.client,
      f.campaignId,
      `${foeRef(w2)} /ability use ability="Free Strike" targets=[${foeRef(four.members[1]!)}]`,
      'fs',
    );
    expect(await squadRow(t, four.id)).toMatchObject({ pool: 19, carried: 2 });
    expect(await stamina(t, four.members[1]!)).toBe(0);
    // A lone Axethrower at pool 1 after damage: detaching the captain takes the pool to zero → dead.
    const one = await addSquad(f, AXETHROWER, 1, w3);
    expect(await squadRow(t, one.id)).toMatchObject({ pool: 9, step: 9 });
    await brutalSlam(t, f, foeRef(one.members[0]!), [7, 7]);
    expect(await squadRow(t, one.id)).toMatchObject({ pool: 1 });
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(one.id)} /squad captain captain=none`,
      'detach',
    );
    expect(await squadRow(t, one.id)).toMatchObject({ pool: 0, step: 7, captainId: null });
    expect(await stamina(t, one.members[0]!)).toBe(0);
    // The captain falling to 0 Stamina in play is a loss too: 18 → 14 for two survivors.
    const two = await addSquad(f, AXETHROWER, 2, w4);
    expect(await squadRow(t, two.id)).toMatchObject({ pool: 18, step: 9 });
    const kill = await brutalSlam(t, f, foeRef(w4), [9, 9]); // 15 damage: Goblin Warrior 15 → 0
    expect(await stamina(t, w4)).toBe(0);
    expect(
      (await storedEvents(t, f.campaignId)).some(
        e => e.kind === 'squad.captain-lost' && e.causeEventId === kill.eventId,
      ),
    ).toBe(true);
    expect(await squadRow(t, two.id)).toMatchObject({ pool: 14, step: 7, captainId: null });
    // A replacement captain applies the benefit to survivors only.
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(four.id)} /squad captain captain=${foeRef(w2)}`,
      'attach',
    );
    expect(await squadRow(t, four.id)).toMatchObject({
      pool: 25,
      step: 9,
      captainId: w2,
      carried: 2,
    });
    expect(await stamina(t, four.members[1]!)).toBe(0);
  });

  test('acceptance 2: eight attackers 3/3/2 make one roll with per-target extra damage; the critical offers the extra main action to participants only; the captain adds strike damage', async () => {
    const t = backend();
    const f = await arena(t);
    const squad = await addSquad(f, SPINECLEAVER, 8);
    const m = squad.members;
    const w1 = await addWarrior(f);
    const w2 = await addWarrior(f);
    const w3 = await addWarrior(f);
    await startCombat(f);
    await submit(f.director.client, f.campaignId, `${squadRef(squad.id)} /turn take`, 'take');
    const rollsBefore = (await t.run(ctx => ctx.db.query('rolls').take(100))).length;
    await atDice(t, f.campaignId, [9, 9]); // 18 + 2 = 20 → tier 3 → Axe 5 damage; natural 18 is no critical
    const assignments = `[{"target": @Thorn, "minions": [${foeRef(m[0]!)}, ${foeRef(m[1]!)}, ${foeRef(m[2]!)}]}, {"target": ${foeRef(w1)}, "minions": [${foeRef(m[3]!)}, ${foeRef(m[4]!)}, ${foeRef(m[5]!)}]}, {"target": ${foeRef(w2)}, "minions": [${foeRef(m[6]!)}, ${foeRef(m[7]!)}]}]`;
    const act = await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad act assignments=${assignments}`,
      'act',
    );
    expect((await t.run(ctx => ctx.db.query('rolls').take(100))).length).toBe(rollsBefore + 1);
    const event = await eventOf(t, f, act.eventId);
    expect(event.kind).toBe('ability.use');
    const data = (
      event.payload as {
        data: {
          result: {
            criticalHit: boolean;
            targets: {
              tier: number;
              damage: { rolledDamage: number; extraDamage?: { amount: number }[] };
            }[];
          };
        };
      }
    ).data;
    expect(data.result.criticalHit).toBe(false);
    expect(
      data.result.targets.map(x => [
        x.tier,
        x.damage.rolledDamage,
        x.damage.extraDamage?.[0]?.amount ?? 0,
      ]),
    ).toEqual([
      [3, 9, 4],
      [3, 9, 4],
      [3, 7, 2],
    ]);
    expect(await heroStamina(t, f.thornId)).toBe(21);
    expect([await stamina(t, w1), await stamina(t, w2)]).toEqual([6, 8]);
    const results = await t.run(ctx => ctx.db.query('abilityResults').take(10));
    expect(results.at(-1)).toMatchObject({ actor: { kind: 'squad', id: squad.id } });
    expect(results.at(-1)!.targets).toHaveLength(3);
    // Four on one target exceeds the Squad Action limit.
    await expect(
      submit(
        f.director.client,
        f.campaignId,
        `${squadRef(squad.id)} /squad act assignments=[{"target": @Thorn, "minions": [${foeRef(m[0]!)}, ${foeRef(m[1]!)}, ${foeRef(m[2]!)}, ${foeRef(m[3]!)}]}]`,
      ),
    ).rejects.toThrow('at most 3');
    // Opt one minion out, then a natural 20: the extra main action goes to the seven participants.
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad participation member=${foeRef(m[7]!)} participating=false`,
      'out',
    );
    await expect(
      submit(
        f.director.client,
        f.campaignId,
        `${squadRef(squad.id)} /squad act assignments=[{"target": @Thorn, "minions": [${foeRef(m[7]!)}]}]`,
      ),
    ).rejects.toThrow('sitting out');
    await atDice(t, f.campaignId, [10, 10]);
    const crit = await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad act assignments=[{"target": @Thorn, "minions": [${foeRef(m[0]!)}, ${foeRef(m[1]!)}, ${foeRef(m[2]!)}]}, {"target": ${foeRef(w1)}, "minions": [${foeRef(m[3]!)}, ${foeRef(m[4]!)}]}, {"target": ${foeRef(w2)}, "minions": [${foeRef(m[5]!)}, ${foeRef(m[6]!)}]}]`,
      'crit',
    );
    expect((await eventOf(t, f, crit.eventId)).description).toContain('Critical hit');
    const offered = await t.run(ctx => ctx.db.query('actionOpportunities').take(50));
    expect(
      offered
        .filter(o => o.sourceEventId === crit.eventId)
        .map(o => o.actor.id)
        .sort(),
    ).toEqual(m.slice(0, 7).map(String).sort());
    // With a captain (+1 damage bonus to strikes) a single minion deals 5 + 1.
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad captain captain=${foeRef(w3)}`,
      'captain',
    );
    await atDice(t, f.campaignId, [9, 9]);
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad act assignments=[{"target": ${foeRef(w2)}, "minions": [${foeRef(m[0]!)}]}]`,
      'act',
    );
    // 8 after the first act, 1 after the critical's 5 + 2, then 5 + 1 captain bonus: recorded below zero (R04 6.4).
    expect(await stamina(t, w2)).toBe(-5);
  });

  test('owed casualties block new pool changes until named; a lone minion free strike carries the captain bonus and its own Axe use is pointed to the squad action', async () => {
    const t = backend();
    const f = await arena(t);
    const squad = await addSquad(f, SPINECLEAVER, 4);
    const [m1, m2, m3, m4] = squad.members as Id<'foes'>[];
    const w = await addWarrior(f);
    await startCombat(f);
    const slam = await brutalSlam(t, f, foeRef(m1!), [9, 9]); // 15: m1 drops, two nearest owed
    expect((await squadRow(t, squad.id)).pending?.count).toBe(2);
    // Review finding 1: damage, captain changes, participation and pool edits wait for the answer.
    await expect(spearCharge(t, f, w, m4!, [1, 1])).rejects.toThrow('still owes 2 casualties');
    await expect(
      submit(
        f.director.client,
        f.campaignId,
        `${squadRef(squad.id)} /squad captain captain=${foeRef(w)}`,
      ),
    ).rejects.toThrow('still owes');
    await expect(
      submit(f.director.client, f.campaignId, `${squadRef(squad.id)} /adjust stamina value=4`),
    ).rejects.toThrow('still owes');
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 5, pending: { count: 2 } });
    await f.player.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      text: `/card respond card=@{interaction:${slam.interactionId}} answer={"casualties": [${foeRef(m2!)}, ${foeRef(m3!)}]}`,
      commandId: cid('card'),
    });
    await spearCharge(t, f, w, m4!, [1, 1]); // 3 damage now lands: pool 5 → 2
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 2, pending: null });
    // Review finding 2: with a captain (+1 damage bonus to strikes) a lone free strike deals 2 + 1;
    // the minion's own Axe use is routed to /squad act with one participant.
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad captain captain=${foeRef(w)}`,
      'captain',
    );
    const before = await heroStamina(t, f.thornId);
    const strike = await submit(
      f.director.client,
      f.campaignId,
      `${foeRef(m4!)} /ability use ability="Free Strike" targets=[@Thorn]`,
      'fs',
    );
    expect((await eventOf(t, f, strike.eventId)).description).toContain('With Captain');
    expect(await heroStamina(t, f.thornId)).toBe(before - 3);
    await expect(
      submit(
        f.director.client,
        f.campaignId,
        `${foeRef(m4!)} /ability use ability="Axe" targets=[@Thorn]`,
      ),
    ).rejects.toThrow('/squad act');
    // Grab has no Strike keyword: a lone Grab still resolves individually.
    await atDice(t, f.campaignId, [7, 6]);
    const grab = await submit(
      f.director.client,
      f.campaignId,
      `${foeRef(m4!)} /ability use ability=Grab targets=[@Thorn]`,
      'grab',
    );
    expect((await eventOf(t, f, grab.eventId)).kind).toBe('ability.use');
  });

  test('Free Strike Together: four minions free strike Thorn as one 8-damage strike', async () => {
    const t = backend();
    const f = await arena(t);
    const squad = await addSquad(f, SPINECLEAVER, 4);
    await startCombat(f);
    const strike = await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad free-strike target=@Thorn minions=[${squad.members.map(foeRef).join(', ')}]`,
      'fst',
    );
    const event = await eventOf(t, f, strike.eventId);
    expect(event.description).toContain('4 × free strike 2');
    expect(
      (
        event.payload as {
          data: {
            freeStrike: { value: number };
            damage: { application: { staminaDelta: number } }[];
          };
        }
      ).data,
    ).toMatchObject({
      freeStrike: { value: 8 },
      damage: [{ application: { staminaDelta: 8 } }],
    });
    expect(await heroStamina(t, f.thornId)).toBe(22);
  });

  test('acceptance 5 and shared-turn rules: one turn-start firing for the squad; an individual maneuver excludes the minion; the captain shares the entry and gets it back on removal', async () => {
    const t = backend();
    const f = await arena(t);
    const w = await addWarrior(f);
    const squad = await addSquad(f, SPINECLEAVER, 3, w);
    await startCombat(f);
    const before = (await encounter(f))!.groups.flatMap(g => g.entries);
    expect(before.filter(e => e.actor.kind === 'foe')).toHaveLength(0);
    const take = await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /turn take`,
      'take',
    );
    const boundaries = (await storedEvents(t, f.campaignId)).filter(
      e => e.kind === 'clock.boundary' && e.causeEventId === take.eventId,
    );
    expect(boundaries.map(b => b.description)).toEqual([`${squad.name}'s turn begins (round 1).`]);
    expect(
      (
        boundaries[0]!.payload as { event: { turn: { participantIds: string[] } } }
      ).event.turn.participantIds.sort(),
    ).toEqual([...squad.members, w].map(String).sort());
    expect((await squadRow(t, squad.id)).participation).toMatchObject({
      optedOut: [],
      individual: [],
    });
    // The captain's own ability use happens on the shared turn without a turn warning.
    await atDice(t, f.campaignId, [7, 6]);
    const charge = await submit(
      f.director.client,
      f.campaignId,
      `${foeRef(w)} /ability use ability="Spear Charge" targets=[@Thorn]`,
      'spear',
    );
    expect((await eventOf(t, f, charge.eventId)).description).not.toContain('it is not');
    // A minion's individual Grab excludes it from the squad action this turn (Minion Maneuvers).
    await atDice(t, f.campaignId, [7, 6]);
    await submit(
      f.director.client,
      f.campaignId,
      `${foeRef(squad.members[0]!)} /ability use ability=Grab targets=[@Thorn]`,
      'grab',
    );
    expect((await squadRow(t, squad.id)).participation.individual).toEqual([squad.members[0]]);
    // A maneuver taken together is not an individual maneuver: the shared Grab leaves the record.
    await atDice(t, f.campaignId, [7, 6]);
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad act ability="Grab" assignments=[{"target": @Thorn, "minions": [${foeRef(squad.members[1]!)}]}]`,
      'grab-together',
    );
    expect((await squadRow(t, squad.id)).participation.individual).toEqual([squad.members[0]]);
    await atDice(t, f.campaignId, [7, 6]);
    const act = await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /squad act assignments=[{"target": @Thorn, "minions": [${foeRef(squad.members[0]!)}, ${foeRef(squad.members[1]!)}]}]`,
      'act',
    );
    expect((await eventOf(t, f, act.eventId)).description).toContain('individual maneuver');
    const end = await submit(f.director.client, f.campaignId, '/turn end', 'end');
    expect(
      (await storedEvents(t, f.campaignId)).filter(
        e => e.kind === 'clock.boundary' && e.causeEventId === end.eventId,
      ),
    ).toHaveLength(1);
    // Single minions are not removed administratively; the squad is, and the captain keeps a turn entry.
    await expect(
      submit(f.director.client, f.campaignId, `${foeRef(squad.members[0]!)} /foe remove`),
    ).rejects.toThrow('/squad remove');
    await submit(f.director.client, f.campaignId, `${squadRef(squad.id)} /squad remove`, 'remove');
    expect(await t.run(ctx => ctx.db.get(squad.id))).toBeNull();
    for (const id of squad.members) expect(await t.run(ctx => ctx.db.get(id))).toBeNull();
    const after = (await encounter(f))!.groups.flatMap(g => g.entries);
    expect(after.filter(e => e.actor.kind === 'squad')).toHaveLength(0);
    expect(after.filter(e => e.actor.kind === 'foe' && e.actor.id === w)).toHaveLength(1);
  });

  test('Director pool adjustment, member edits refused, undo restores the ladder, Void reset restores the squad', async () => {
    const t = backend();
    const f = await arena(t);
    const squad = await addSquad(f, SPINECLEAVER, 4);
    const w = await addWarrior(f);
    await startCombat(f);
    await expect(
      submit(
        f.director.client,
        f.campaignId,
        `${foeRef(squad.members[0]!)} /adjust stamina value=2`,
      ),
    ).rejects.toThrow('shared pool');
    const slam = await brutalSlam(t, f, foeRef(squad.members[0]!), [7, 7]); // 8: pool 12, one casualty, carried 3
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 12, carried: 3 });
    expect(await stamina(t, squad.members[0]!)).toBe(0);
    await submit(f.director.client, f.campaignId, `/history undo event="${slam.eventId}"`, 'undo');
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 20, carried: 0 });
    expect(await stamina(t, squad.members[0]!)).toBe(5);
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /adjust stamina value=3`,
      'adjust',
    );
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 3, carried: 0 });
    await submit(
      f.director.client,
      f.campaignId,
      `${squadRef(squad.id)} /adjust stamina value=0`,
      'adjust',
    );
    for (const id of squad.members) expect(await stamina(t, id)).toBe(0);
    await expect(
      submit(
        f.director.client,
        f.campaignId,
        `${squadRef(squad.id)} /adjust temporary-stamina value=2`,
      ),
    ).rejects.toThrow('does not apply to minions');
    const id = (await encounter(f))!.id;
    await submit(
      f.director.client,
      f.campaignId,
      `/combat void encounter="${id}" mode=reset`,
      'void',
    );
    expect(await squadRow(t, squad.id)).toMatchObject({ pool: 20, poolMax: 20, carried: 0 });
    for (const memberId of squad.members) expect(await stamina(t, memberId)).toBe(5);
    expect(await stamina(t, w)).toBe(15);
  });
});
