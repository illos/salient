// SPDX-License-Identifier: GPL-3.0-only
/**
 * V171 watchers through the registered operations, with persisted readback. Expected values come
 * from the pinned Compendium (en/unified/md), never from a run of the code under test:
 * - feature/ability/conduit/level-1/violence-will-not-aid-thee.md: 3 Piety; "The first time on a
 *   turn that the target deals damage to another creature, the target of this ability takes 1d10
 *   lightning damage (save ends)."
 * - feature/ability/conduit/level-2/blessing-of-insight.md: 5 Piety, Self and each ally; "Until the
 *   end of the encounter or until you are dying, each target gains 1 surge at the end of each of
 *   your turns."
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, no immunity or weakness, Free Strike 1.
 * - rule/resource/surge.md: surges add.
 * The Conduit is the reviewed v100-war witness at level 2 (tests/fixtures/v100-conduit-expected.json,
 * v134-conduit-three-expected.json), which has both abilities. The once-per-round damage-taken
 * watcher has no admitted printed source yet, so it is stored through the library with a synthetic
 * source occurrence, as the V158 and V159 lifecycle tests do.
 */
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { EffectInstance, Watcher } from '../../shared/contracts/liveState';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { appendEvent } from '../../convex/lib/events';
import { applyEffectInstance } from '../../convex/lib/effectInstances';
import conduitLedger from '../fixtures/v100-conduit-expected.json' with { type: 'json' };
import conduitThree from '../fixtures/v134-conduit-three-expected.json' with { type: 'json' };
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');

const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

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

/** Positions the campaign's dice stream so the next 2d10 are `faces` (S02's own generator). */
async function atDice(t: Backend, campaignId: Id<'campaigns'>, faces: [number, number]) {
  await t.run(async ctx => {
    const state = (await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique())!;
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
  // The damage writer is a hot path (tests/app/party-read-limit.test.ts): enforce Convex's limits.
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `watchers-${++sequence}`,
      text,
    });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: `watchers-${++sequence}`,
  });
  const heroLive = async (id: Id<'characters'>) => (await t.run(ctx => ctx.db.get(id)))!.liveState!;
  const goblinLive = async () => (await t.run(ctx => ctx.db.get(goblin)))!.live;
  const events = () => t.run(ctx => ctx.db.query('events').take(4000));
  return { t, f, command, goblin, heroLive, goblinLive, events };
}

test('V171: Blessing of Insight fires at the Conduit’s turn ends; Violence Will Not Aid Thee fires the first time on a turn; undo reverts a firing', async () => {
  const { t, f, command, goblin, heroLive, goblinLive, events } = await setup();
  const witness = conduitThree.witnesses['v100-war'];
  const base = conduitLedger.witnesses.find(w => w.id === witness.base)!;
  const { definitions } = await f.player.client.query(api.characterWizard.discover, {
    targetLevel: 2,
  });
  const authored = { name: 'Votary', appearance: '', biography: '', notes: '' };
  const votary = await f.player.client.mutation(api.characters.create, {
    commandId: `watchers-${++sequence}`,
    targetLevel: 2,
    authored,
    selections: draftSelectionsFrom(
      {
        ...(base.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Votary',
        'class.conduit.level-2.perk': witness.levelTwo.addedSelections.perk,
        'class.conduit.level-2.domain-ability':
          witness.levelTwo.addedSelections.domainAbilityDomain,
        'class.conduit.level-2.domain-skill.life':
          witness.levelTwo.addedSelections.secondDomainSkill,
      },
      definitions,
    ),
  });
  await f.player.client.mutation(api.characters.submit, {
    commandId: `watchers-${++sequence}`,
    characterId: votary,
    campaignId: f.campaignId,
  });
  await f.director.client.mutation(api.characters.approve, {
    commandId: `watchers-${++sequence}`,
    characterId: votary,
  });
  const votaryRef = `@{character:${votary}}`;
  const goblinRef = `@{foe:${goblin}}`;
  const registration = (id: string) => t.run(ctx => ctx.db.get(id as Id<'clockRegistrations'>));

  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command(`${votaryRef} /turn take`, true);

  // 1. Blessing of Insight (5 Piety) on Thorn: the Conduit is always a target, so both hold a
  // watcher of the Conduit's turn ends, and nothing is gained at the use.
  await command(`${votaryRef} /adjust heroic-resource value=5`);
  const surges = {
    votary: (await heroLive(votary)).surges,
    thorn: (await heroLive(f.thornId)).surges,
  };
  const blessing = await command(
    `${votaryRef} /ability use ability="Blessing of Insight" targets=[@Thorn]`,
    true,
  );
  expect((await t.run(ctx => ctx.db.get(blessing.eventId)))!.kind).toBe('ability.use');
  expect((await heroLive(votary)).heroicResource.current).toBe(0);
  expect((await heroLive(votary)).surges).toBe(surges.votary);
  expect((await heroLive(f.thornId)).surges).toBe(surges.thorn);
  const blessed = [
    ...((await heroLive(votary)).effectInstances ?? []),
    ...((await heroLive(f.thornId)).effectInstances ?? []),
  ].filter(i => i.sourceUseEventId === blessing.eventId);
  expect(blessed.map(i => i.subject.id).sort()).toEqual([votary, f.thornId].sort());
  for (const instance of blessed) {
    expect(instance).toMatchObject({
      kind: 'watcher',
      status: 'active',
      owner: { kind: 'character', id: votary },
      payload: {
        kind: 'watcher',
        watcher: {
          event: 'turn-end',
          whose: 'owner',
          limit: 'each',
          responses: [{ kind: 'gain', recipient: 'subject', surges: 1 }],
        },
      },
      duration: { kind: 'encounter' },
      endsWhen: ['owner-dying'],
    });
    // A watcher of the Conduit's turn ends, then the encounter's end.
    expect(instance.registrationIds).toHaveLength(2);
    expect(await registration(instance.registrationIds[0]!)).toMatchObject({
      status: 'active',
      timing: {
        scope: 'creature-turn',
        boundary: 'turn-end',
        creatureId: votary,
        occurrence: 'each',
      },
      work: { kind: 'watcher', effectInstanceId: instance.id },
    });
  }

  // 2. Violence Will Not Aid Thee (3 Piety) on the goblin: a watcher the goblin holds, save ends.
  await command(`${votaryRef} /adjust heroic-resource value=3`);
  const violence = await command(
    `${votaryRef} /ability use ability="Violence Will Not Aid Thee" targets=[${goblinRef}]`,
    true,
  );
  const [watcher] = (await goblinLive()).effectInstances!.filter(
    i => i.sourceUseEventId === violence.eventId,
  );
  expect(watcher).toMatchObject({
    kind: 'watcher',
    status: 'active',
    subject: { kind: 'foe', id: goblin },
    payload: {
      watcher: {
        event: 'damage-dealt',
        whose: 'subject',
        otherCreature: true,
        limit: 'turn',
        responses: [
          {
            kind: 'damage',
            recipient: 'subject',
            amount: { dice: { count: 1, sides: 10 } },
            damageType: 'lightning',
          },
        ],
      },
    },
    duration: { kind: 'save-ends', creatureId: goblin },
  });
  expect(await registration(watcher!.registrationIds[0]!)).toMatchObject({
    work: { kind: 'saving-throw', effectInstanceId: watcher!.id, creatureId: goblin },
  });

  // 3. The Conduit's turn ends: each target gains 1 surge, logged as the clock's firings.
  await command(`${votaryRef} /turn end`, true);
  expect((await heroLive(votary)).surges).toBe(surges.votary + 1);
  expect((await heroLive(f.thornId)).surges).toBe(surges.thorn + 1);
  const fired = (await events()).filter(
    e => e.kind === 'effect.watcher-fired' && e.origin === 'clock',
  );
  expect(fired).toHaveLength(2);
  // Undo of the turn end reverts both firings; redo restores them.
  await command('/history undo');
  expect((await heroLive(votary)).surges).toBe(surges.votary);
  expect((await heroLive(f.thornId)).surges).toBe(surges.thorn);
  await command('/history redo');
  expect((await heroLive(votary)).surges).toBe(surges.votary + 1);
  expect((await heroLive(f.thornId)).surges).toBe(surges.thorn + 1);

  // 4. The goblin's turn: its first damage to another creature sets off 1d10 lightning damage to
  // it; the second in the same turn does not.
  await t.run(async ctx => {
    const foe = (await ctx.db.get(goblin))!;
    await ctx.db.patch(goblin, { live: { ...foe.live, stamina: 15, temporaryStamina: 0 } });
  });
  await command(`${goblinRef} /turn take`);
  const thornBefore = (await heroLive(f.thornId)).stamina;
  await position(t, f.campaignId, [{ sides: 10, face: 7 }]);
  const strike = await command(`${goblinRef} /ability use ability="Free Strike" targets=[@Thorn]`);
  expect((await heroLive(f.thornId)).stamina).toBe(thornBefore - 1);
  expect((await goblinLive()).stamina).toBe(15 - 7);
  const firing = (await events()).find(
    e => e.kind === 'effect.watcher-fired' && e.causeEventId === strike.eventId,
  )!;
  expect(firing.dice?.map(d => d.value)).toEqual([7]);
  const afterFirst = (await goblinLive()).effectInstances!.find(i => i.id === watcher!.id)!;
  expect(afterFirst.firings).toHaveLength(1);
  expect(afterFirst.firings![0]!.causeEventId).toBe(strike.eventId);
  await command(`${goblinRef} /ability use ability="Free Strike" targets=[@Thorn]`);
  expect((await heroLive(f.thornId)).stamina).toBe(thornBefore - 2);
  expect((await goblinLive()).stamina).toBe(15 - 7);

  // 5. Undo of the second strike, then the first: the firing, its limit record and its damage go.
  await command('/history undo');
  await command('/history undo');
  expect((await heroLive(f.thornId)).stamina).toBe(thornBefore);
  expect((await goblinLive()).stamina).toBe(15);
  expect(
    (await goblinLive()).effectInstances!.find(i => i.id === watcher!.id)!.firings ?? [],
  ).toEqual([]);

  // 6. Design section 7: a correction never re-derives a firing. Spear Charge (Power Roll + 2) at
  // 5 + 4 + 2 = 11 is tier 1, 3 damage; an edge makes 13, tier 2, 4 damage. The hit set off the
  // watcher, so the correction is refused and the table rewinds instead.
  await atDice(t, f.campaignId, [5, 4]);
  const charge = await command(`${goblinRef} /ability use ability="Spear Charge" targets=[@Thorn]`);
  expect((await heroLive(f.thornId)).stamina).toBe(thornBefore - 3);
  expect(
    (await goblinLive()).effectInstances!.find(i => i.id === watcher!.id)!.firings![0]!
      .causeEventId,
  ).toBe(charge.eventId);
  await expect(
    command(`/ability correct event="${charge.eventId}" target=@Thorn edges=1`),
  ).rejects.toThrow(/Rewind to the use/);
  expect((await heroLive(f.thornId)).stamina).toBe(thornBefore - 3);
});

test('V171: a damage-taken watcher fires once per round, with persisted readback', async () => {
  const { t, f, command, goblin, heroLive, events } = await setup();
  const goblinRef = `@{foe:${goblin}}`;
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  const payload: Watcher = {
    event: 'damage-taken',
    whose: 'subject',
    limit: 'round',
    responses: [{ kind: 'gain', recipient: 'subject', surges: 1 }],
  };
  const stored: EffectInstance = await t.run(async ctx => {
    const session = (await ctx.db.get(f.sessionId!))!;
    const eventId = await appendEvent(ctx, {
      campaignId: f.campaignId,
      sessionId: f.sessionId!,
      encounterId: session.encounterId ?? null,
      origin: 'user',
      actor: (await ctx.db.get(f.director.profile.userId))!,
      commandId: `watchers-source-${++sequence}`,
      kind: 'test.effect',
      description: 'Synthetic source occurrence for a once-per-round watcher.',
    });
    const thorn = { kind: 'character' as const, id: f.thornId, name: 'Thorn' };
    const result = await applyEffectInstance(
      ctx,
      { campaignId: f.campaignId, eventId },
      {
        id: `fixture-${eventId}`,
        kind: 'watcher',
        sourceUseEventId: eventId,
        sourceActorId: f.thornId,
        abilityId: 'fixture-watcher',
        abilityName: 'Fixture Watcher',
        actorLabel: 'Thorn',
        sourcePath: 'rule/resource/surge.md',
        clause: 'Fixture: once per round, when you take damage, you gain 1 surge.',
        owner: thorn,
        subject: thorn,
        payload: { kind: 'watcher', text: 'Fixture watcher.', watcher: payload },
        printedDuration: { kind: 'encounter' },
        endsWhen: [],
        appliedSequence: (await ctx.db.get(eventId))!.sequence,
      },
      session.encounterId ?? undefined,
    );
    if (!result || !('instance' in result)) throw new Error('Expected a tracked instance.');
    return result.instance;
  });
  const surges = async () => (await heroLive(f.thornId)).surges;
  const firings = async () =>
    (await heroLive(f.thornId)).effectInstances!.find(i => i.id === stored.id)!.firings ?? [];
  const start = await surges();

  // Round 1: two hits, one surge.
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command(`${goblinRef} /turn take`);
  const first = await command(`${goblinRef} /ability use ability="Free Strike" targets=[@Thorn]`);
  expect(await surges()).toBe(start + 1);
  await command(`${goblinRef} /ability use ability="Free Strike" targets=[@Thorn]`);
  expect(await surges()).toBe(start + 1);
  expect(await firings()).toEqual([
    expect.objectContaining({ causeEventId: first.eventId, round: 1 }),
  ]);
  expect(
    (await events()).filter(e => e.kind === 'effect.watcher-fired').map(e => e.causeEventId),
  ).toEqual([first.eventId]);
  await command(`${goblinRef} /turn end`);

  // Round 2: a new window.
  await command('@Thorn /turn take', true);
  const second = await command(`${goblinRef} /ability use ability="Free Strike" targets=[@Thorn]`);
  expect(await surges()).toBe(start + 2);
  expect((await firings()).map(firing => [firing.causeEventId, firing.round])).toEqual([
    [first.eventId, 1],
    [second.eventId, 2],
  ]);
  // effect.list names it as a watcher.
  const listed = await f.director.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: `watchers-${++sequence}`,
    operation: 'effect.list',
    arguments: {},
  });
  expect((await t.run(ctx => ctx.db.get(listed.eventId)))!.description).toContain(
    'when its subject takes damage (once per round)',
  );
});
