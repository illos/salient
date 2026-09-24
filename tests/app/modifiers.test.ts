// SPDX-License-Identifier: GPL-3.0-only
/**
 * V159 modifiers through the registered operations. Expected values come from the pinned sources
 * (Compendium en/unified/md) and reviewed ledgers, never from a run of the code under test:
 * - feature/ability/fury/level-1/brutal-slam.md with docs/roll-and-damage-resolution.md 10.13:
 *   Thorn (Might 2) rolls 3 + 6 = 11 → tier 1, 5 damage; 16 → tier 2, 8 damage; tier 1 pushes 1
 *   (subtotal 2 with the size bonus).
 * - rule/dice/edge.md and rule/dice/power-roll.md: an edge is +2 and an edge and a bane cancel; a
 *   double edge adds no +2 and raises the tier by one.
 * - monster/goblin/statblock/goblin-warrior.md, Spear Charge: Power Roll + 2; ≤11 3 damage, 12-16
 *   4, 17+ 5.
 * - kit/raider.md (Raider's Awe): "The target takes a bane on their next power roll made before the
 *   end of their next turn."
 * - feature/ability/tactician/level-2/squad-on-me.md: 5 Focus; "each target has a bonus to
 *   stability equal to your Might score … each target gains 2 surges."
 * - tests/fixtures/v116-tactician-three-expected.json, v94-tactician-3-alt: a level-2 Vanguard with
 *   Might 2, stability 2 and Squad! On Me!.
 * - rule/character/stability.md: a force-moved creature can reduce the movement by its stability.
 * The lasting edge has no admitted printed source yet, so it is stored through the library with a
 * synthetic source occurrence, as the V158 lifecycle test does; everything else is registered
 * operations with persisted readback.
 */
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { appendEvent } from '../../convex/lib/events';
import { applyEffectInstance } from '../../convex/lib/effectInstances';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { ModifierPayload } from '../../shared/contracts/liveState';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import levelOne from '../fixtures/v94-tactician-expected.json' with { type: 'json' };
import levelThree from '../fixtures/v116-tactician-three-expected.json' with { type: 'json' };
import { admitHero, backend, heroFixtureSelections, table, type Backend } from './fixtures/table';

const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

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

let sequence = 0;
async function setup() {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `modifiers-${++sequence}`,
      text,
    });
  const results = async (eventId: Id<'events'>) =>
    (
      await f.director.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [eventId],
      })
    )[0]!;
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: `modifiers-${++sequence}`,
  });
  return { t, f, command, results, goblin };
}

test('V159: a lasting edge applies to the next matching roll; exclude drops it and corrections keep that', async () => {
  const { t, f, command, results, goblin } = await setup();
  const edge: ModifierPayload = { kind: 'roll', target: 'rolls-by', scope: 'power-roll', edges: 1 };
  const stored = await t.run(async ctx => {
    const eventId = await appendEvent(ctx, {
      campaignId: f.campaignId,
      sessionId: f.sessionId!,
      encounterId: null,
      origin: 'user',
      actor: (await ctx.db.get(f.director.profile.userId))!,
      commandId: `modifiers-source-${++sequence}`,
      kind: 'test.effect',
      description: 'Synthetic source occurrence for a lasting edge.',
    });
    const thorn = { kind: 'character' as const, id: f.thornId, name: 'Thorn' };
    return (await applyEffectInstance(
      ctx,
      { campaignId: f.campaignId, eventId },
      {
        id: `fixture-${eventId}`,
        kind: 'modifier',
        sourceUseEventId: eventId,
        sourceActorId: f.thornId,
        abilityId: 'fixture-edge',
        abilityName: 'Fixture Edge',
        actorLabel: 'Thorn',
        sourcePath: 'rule/dice/edge.md',
        clause: 'Fixture: an edge on power rolls.',
        owner: thorn,
        subject: thorn,
        payload: { kind: 'modifier', text: 'Fixture: an edge on power rolls.', modifier: edge },
        printedDuration: { kind: 'encounter' },
        endsWhen: [],
        appliedSequence: (await ctx.db.get(eventId))!.sequence,
      },
    ))!.instance;
  });
  const goblinRef = `@{foe:${goblin}}`;
  const heal = () =>
    t.run(ctx => ctx.db.patch(goblin, { live: { stamina: 15, temporaryStamina: 0 } as never }));

  // 1. The next matching roll gets the edge automatically and records it: 11 + 2 = 13 → tier 2, 8.
  await heal();
  await atDice(t, f.campaignId, [3, 6]);
  const used = await command(
    `@Thorn /ability use ability="Brutal Slam" targets=[${goblinRef}]`,
    true,
  );
  const applied = await results(used.eventId);
  expect(applied.targets[0]).toMatchObject({ edges: 0, banes: 0 });
  expect(applied.targets[0]!.contributions).toEqual([
    expect.objectContaining({ instanceId: stored.id, side: 'actor', edges: 1, banes: 0 }),
  ]);
  expect(applied.targets[0]!.contributions![0]!.excluded).toBeUndefined();
  expect(applied.targets[0]!.outcome).toMatchObject({ total: 13, tier: 2 });
  expect(applied.targets[0]!.outcome.damage.rolledDamage).toBe(8);
  // A lasting (not consumable) edge stays active for later rolls.
  const thornLive = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  expect((await thornLive()).effectInstances![0]!.status).toBe('active');

  // 2. exclude drops it without an opposite bane: 11 → tier 1, 5 damage, recorded as excluded.
  await heal();
  await atDice(t, f.campaignId, [3, 6]);
  const excluded = await command(
    `@Thorn /ability use ability="Brutal Slam" targets=[${goblinRef}] exclude=${JSON.stringify([stored.id])}`,
    true,
  );
  let effective = await results(excluded.eventId);
  expect(effective.targets[0]!.contributions).toEqual([
    expect.objectContaining({ instanceId: stored.id, excluded: true }),
  ]);
  expect(effective.targets[0]!.outcome).toMatchObject({ total: 11, tier: 1 });
  expect(effective.targets[0]!.outcome.damage.rolledDamage).toBe(5);
  await expect(
    command(
      `@Thorn /ability use ability="Brutal Slam" targets=[${goblinRef}] exclude=["not-an-effect"]`,
      true,
    ),
  ).rejects.toThrow(/Not an automatic contribution/);

  // 3. A correction adds a circumstance bane and keeps the exclusion: net −1 → 9, tier 1. Were the
  // saved edge re-read, the edge and bane would cancel to 11.
  await command(`/ability correct event="${excluded.eventId}" target=${goblinRef} banes=1`, true);
  effective = await results(excluded.eventId);
  expect(effective.targets[0]).toMatchObject({ edges: 0, banes: 1 });
  expect(effective.targets[0]!.contributions![0]!.excluded).toBe(true);
  expect(effective.targets[0]!.outcome).toMatchObject({ total: 9, tier: 1 });

  // 4. Including it again counts it once: circumstance 0 and the saved edge → 13, tier 2, 8 damage.
  await command(
    `/ability correct event="${excluded.eventId}" target=${goblinRef} banes=0 exclude=[]`,
    true,
  );
  effective = await results(excluded.eventId);
  expect(effective.targets[0]!.contributions![0]!.excluded).toBeUndefined();
  expect(effective.targets[0]!.outcome).toMatchObject({ total: 13, tier: 2 });
  expect(effective.targets[0]!.outcome.damage.rolledDamage).toBe(8);
  expect((await t.run(ctx => ctx.db.get(goblin)))!.live.stamina).toBe(15 - 8);
  // The correction reused the saved contribution; ending the effect now changes nothing past.
  await command(`/effect end instance=${JSON.stringify(stored.id)}`);
  expect((await results(excluded.eventId)).targets[0]!.outcome.total).toBe(13);
});

test("V159: Raider's Awe's bane is consumed once by the goblin's next power roll, even when cancelled, and undo restores it", async () => {
  const { t, f, command, results, goblin } = await setup();
  await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Korva',
    heroFixtureSelections({ 'kit.choice': 'Raider', 'details.name': 'Korva' }),
  );
  const goblinRef = `@{foe:${goblin}}`;
  const goblinLive = async () => (await t.run(ctx => ctx.db.get(goblin)))!.live;
  const awe = await command(
    `@Korva /ability use ability="Raider's Awe" targets=[${goblinRef}]`,
    true,
  );
  const [bane] = (await goblinLive()).effectInstances!;
  expect(bane).toMatchObject({
    kind: 'modifier',
    status: 'active',
    sourceUseEventId: awe.eventId,
    subject: { kind: 'foe', id: goblin },
    payload: { modifier: { kind: 'roll', target: 'rolls-by', scope: 'power-roll', banes: 1 } },
    consumeOn: { event: 'power-roll' },
    printedDuration: { kind: 'end-of-next-turn', anchor: 'subject' },
    duration: { kind: 'end-of-next-turn', creatureId: goblin },
  });
  const occurrence = (await results(awe.eventId)).compiled!.effects.find(
    o => o.effect.kind === 'modifier',
  )!;
  expect(occurrence.effect).toMatchObject({ kind: 'modifier', status: 'applied' });
  expect(occurrence.id).toBe(bane!.id);

  // The goblin's next power roll, with one circumstance edge: the bane cancels it (10 + 2 = 12 →
  // tier 2, 4 damage) and is still used up.
  await atDice(t, f.campaignId, [5, 5]);
  const first = await command(
    `${goblinRef} /ability use ability="Spear Charge" targets=[@Thorn] edges=1`,
  );
  const roll = await results(first.eventId);
  expect(roll.targets[0]!.contributions).toEqual([
    expect.objectContaining({ instanceId: bane!.id, banes: 1, consumes: [bane!.id] }),
  ]);
  expect(roll.targets[0]!.outcome).toMatchObject({ total: 12, tier: 2 });
  expect(roll.targets[0]!.outcome.edgeBane).toMatchObject({ edges: 1, banes: 1, net: 0 });
  expect((await goblinLive()).effectInstances![0]).toMatchObject({
    status: 'consumed',
    endedEventId: first.eventId,
  });
  // Consumed once: the following roll has no contribution (12 → tier 2 again, no bane).
  await atDice(t, f.campaignId, [5, 5]);
  const second = await command(`${goblinRef} /ability use ability="Spear Charge" targets=[@Thorn]`);
  expect((await results(second.eventId)).targets[0]!.contributions).toBeUndefined();

  // Undo of both rolls restores the bane for the goblin's next power roll.
  await command('/history rewind');
  await command('/history rewind');
  const restored = (await goblinLive()).effectInstances![0]!;
  expect(restored.status).toBe('active');
  expect(restored.endedEventId).toBeUndefined();
});

test('V159: Squad! On Me! raises each target’s stability by the Tactician’s Might, which the forced-movement outcome uses', async () => {
  const { t, f, command, results } = await setup();
  const witness = levelThree.witnesses['v94-tactician-3-alt'];
  const base = levelOne.witnesses.find(w => w.id === witness.base)!;
  const { definitions } = await f.player.client.query(api.characterWizard.discover, {
    targetLevel: 2,
  });
  const authored = { name: 'Vex', appearance: '', biography: '', notes: '' };
  const vex = await f.player.client.mutation(api.characters.create, {
    commandId: `modifiers-${++sequence}`,
    targetLevel: 2,
    authored,
    selections: draftSelectionsFrom(
      {
        ...(base.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Vex',
        'class.tactician.level-2.perk': witness.levelTwo.addedSelections.perk,
        'class.tactician.level-2.vanguard-ability':
          witness.levelTwo.addedSelections.doctrineAbility,
      },
      definitions,
    ),
  });
  await f.player.client.mutation(api.characters.submit, {
    commandId: `modifiers-${++sequence}`,
    characterId: vex,
    campaignId: f.campaignId,
  });
  await f.director.client.mutation(api.characters.approve, {
    commandId: `modifiers-${++sequence}`,
    characterId: vex,
  });
  const live = async (id: Id<'characters'>) => (await t.run(ctx => ctx.db.get(id)))!.liveState!;
  // In combat, so the 5 Focus is paid (tactician/level-1/focus.md waives it outside combat).
  await command('/combat start');
  await command('/combat commit');
  await command(`@{character:${vex}} /adjust heroic-resource value=5`);
  const surgesBefore = (await live(f.thornId)).surges;
  // The Tactician is always a target; Thorn is the ally in the area.
  const squad = await command(
    `@{character:${vex}} /ability use ability="Squad! On Me!" targets=[@Thorn]`,
    true,
  );
  expect((await live(vex)).heroicResource.current).toBe(0);
  expect((await live(vex)).surges).toBe(2);
  expect((await live(f.thornId)).surges).toBe(surgesBefore + 2);
  for (const id of [vex, f.thornId])
    expect((await live(id)).effectInstances).toEqual([
      expect.objectContaining({
        kind: 'modifier',
        status: 'active',
        sourceUseEventId: squad.eventId,
        payload: expect.objectContaining({
          modifier: { kind: 'stat', stat: 'stability', amount: witness.levelTwo.characteristics.M },
        }),
        duration: { kind: 'start-of-next-turn', creatureId: vex },
      }),
    ]);

  // Thorn's Brutal Slam at the Tactician (tier 1, push 1): the push outcome's stability is the
  // ledger's 2 plus Might 2, with its source.
  await atDice(t, f.campaignId, [3, 6]);
  const slam = await command(
    `@Thorn /ability use ability="Brutal Slam" targets=[@{character:${vex}}]`,
    true,
  );
  const push = (await results(slam.eventId)).compiled!.effects.find(o => o.effect.kind === 'push')!;
  expect(push.effect).toMatchObject({
    kind: 'push',
    printed: 1,
    stability: witness.levelTwo.stability + witness.levelTwo.characteristics.M,
    stabilityEffects: [
      expect.objectContaining({
        abilityName: 'Squad! On Me!',
        amount: witness.levelTwo.characteristics.M,
      }),
    ],
  });
  // The start of the Tactician's next turn is scheduled to end both instances.
  expect((await live(vex)).effectInstances![0]!.registrationIds).toHaveLength(1);
  // Rewinding the slam and the use removes the instances and the surges.
  await command('/history rewind');
  await command('/history rewind');
  expect((await live(vex)).effectInstances ?? []).toEqual([]);
  expect((await live(f.thornId)).surges).toBe(surgesBefore);
});
