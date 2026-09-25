// SPDX-License-Identifier: GPL-3.0-only
/**
 * QC1 train 13 R1 and R2 through the registered operations, with persisted readback. Expected
 * values come from the pinned Compendium (en/unified/md), never from a run of the code under test:
 * - feature/ability/talent/level-1/mind-spike.md: ≤11 "2 + R psychic damage"; "Strained: The target
 *   takes an extra 2 psychic damage. You also take 2 psychic damage that can't be reduced in any
 *   way." The v105-2 Talent has Reason 2, Stamina 24 (tests/fixtures/v105-talent-expected.json), so
 *   1 + 1 + 2 = 4 is tier 1 (rule/dice/power-roll.md): 4 damage, strained 6.
 * - feature/talent/level-1/clarity-and-strain.md: "Whenever you have clarity below 0, you are
 *   strained".
 * - feature/ability/conduit/level-1/violence-will-not-aid-thee.md: "The first time on a turn that
 *   the target deals damage to another creature, the target of this ability takes 1d10 lightning
 *   damage (save ends)."
 * - rule/health/temporary-stamina.md: "Whenever you take damage while you have temporary Stamina,
 *   the temporary Stamina decreases first, and any leftover damage is applied to your Stamina".
 * - Q-STRAIN-1 (docs/rules-questions-for-user.md): "can't be reduced" skips immunity only.
 * - feature/ability/conduit/level-2/blessing-of-insight.md: 5 Piety, Self and each ally; "Until the
 *   end of the encounter or until you are dying, each target gains 1 surge at the end of each of
 *   your turns."
 * - rule/health/dying.md: "When your Stamina is 0 or lower, you are dying." "While you are dying,
 *   you can still act".
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, no immunity or weakness, Free Strike 1.
 * The Conduit is the reviewed v100-war witness at level 2, as in tests/app/watchers.test.ts.
 */
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { CompiledResult } from '../../shared/contracts/compiledResult';
import { definitions as levelOne } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import type { ModifierPayload } from '../../shared/contracts/liveState';
import { appendEvent } from '../../convex/lib/events';
import { applyEffectInstance } from '../../convex/lib/effectInstances';
import conduitLedger from '../fixtures/v100-conduit-expected.json' with { type: 'json' };
import conduitThree from '../fixtures/v134-conduit-three-expected.json' with { type: 'json' };
import talentLedger from '../fixtures/v105-talent-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');
const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

/** Moves the campaign dice so the next dice, one at a time and in order, show these faces. */
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
    for (let counter = state.counter; counter < state.counter + 400000; counter++) {
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

async function setup(options: { talent?: boolean } = {}) {
  // The damage writer is a hot path (tests/app/party-read-limit.test.ts): enforce Convex's limits.
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `watcher-interactions-${++sequence}`,
      text,
    });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: `watcher-interactions-${++sequence}`,
  });
  const witness = conduitThree.witnesses['v100-war'];
  const base = conduitLedger.witnesses.find(w => w.id === witness.base)!;
  const { definitions } = await f.player.client.query(api.characterWizard.discover, {
    targetLevel: 2,
  });
  const authored = { name: 'Votary', appearance: '', biography: '', notes: '' };
  const votary = await f.player.client.mutation(api.characters.create, {
    commandId: `watcher-interactions-${++sequence}`,
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
    commandId: `watcher-interactions-${++sequence}`,
    characterId: votary,
    campaignId: f.campaignId,
  });
  await f.director.client.mutation(api.characters.approve, {
    commandId: `watcher-interactions-${++sequence}`,
    characterId: votary,
  });
  const seer = options.talent
    ? await admitHero(
        t,
        f.player,
        f.director,
        f.campaignId,
        'Seer',
        draftSelectionsFrom(
          {
            ...(talentLedger.witnesses.find(w => w.id === 'v105-2')!
              .selections as unknown as EvaluationInput['selections']),
            'details.name': 'Seer',
          },
          levelOne,
        ),
      )
    : undefined;
  const heroLive = async (id: Id<'characters'>) => (await t.run(ctx => ctx.db.get(id)))!.liveState!;
  const goblinStamina = async () => (await t.run(ctx => ctx.db.get(goblin)))!.live.stamina;
  const events = () => t.run(ctx => ctx.db.query('events').take(4000));
  return { t, f, command, goblin, votary, seer, heroLive, goblinStamina, events };
}

test('QC1 R1: Strained self-damage is taken after the watcher damage its target damage set off', async () => {
  const s = await setup({ talent: true });
  const seer = s.seer!;
  const votaryRef = `@{character:${s.votary}}`;
  const seerRef = `@{character:${seer}}`;
  const goblinRef = `@{foe:${s.goblin}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');

  // The Conduit puts Violence Will Not Aid Thee (3 Piety) on the Talent.
  await s.command(`${votaryRef} /turn take`, true);
  await s.command(`${votaryRef} /adjust heroic-resource value=3`);
  const violence = await s.command(
    `${votaryRef} /ability use ability="Violence Will Not Aid Thee" targets=[${seerRef}]`,
    true,
  );
  const watcherOf = async () =>
    (await s.heroLive(seer)).effectInstances!.find(i => i.sourceUseEventId === violence.eventId)!;
  expect(await watcherOf()).toMatchObject({ kind: 'watcher', status: 'active' });
  await s.command(`${votaryRef} /turn end`, true);

  // The Talent's turn, strained at clarity −1, Stamina 20, no temporary Stamina.
  await s.command(`${seerRef} /turn take`, true);
  await s.command(`${seerRef} /adjust heroic-resource value=-1`);
  await s.command(`${seerRef} /adjust stamina value=20`);
  await s.command(`${seerRef} /adjust temporary-stamina value=0`);
  const surgesBefore = (await s.heroLive(seer)).surges;

  // Mind Spike 1 + 1 + 2 = 4, tier 1: 4 + 2 = 6 psychic to the goblin. That damage sets off the
  // watcher: 1d10 = 7 lightning to the Talent (20 → 13). Then the Strained 2 psychic that can't be
  // reduced: 13 → 11.
  await position(s.t, s.f.campaignId, [
    { sides: 10, face: 1 },
    { sides: 10, face: 1 },
    { sides: 10, face: 7 },
  ]);
  const spike = await s.command(
    `${seerRef} /ability use ability="Mind Spike" targets=[${goblinRef}]`,
    true,
  );
  expect(await s.goblinStamina()).toBe(15 - 6);
  expect(await s.heroLive(seer)).toMatchObject({ stamina: 11, temporaryStamina: 0 });
  expect((await s.heroLive(seer)).surges).toBe(surgesBefore);
  const fired = (await s.events()).find(
    e => e.kind === 'effect.watcher-fired' && e.causeEventId === spike.eventId,
  )!;
  expect(fired.dice?.map(d => d.value)).toEqual([7]);
  expect((await watcherOf()).firings!.map(firing => firing.causeEventId)).toEqual([spike.eventId]);
  // The saved result holds what was applied; a linked entry states it.
  const result = await s.t.run(ctx =>
    ctx.db
      .query('abilityResults')
      .withIndex('by_event', q => q.eq('eventId', spike.eventId))
      .unique(),
  );
  const section = (result!.compiled as CompiledResult).effects.find(
    o => o.effect.kind === 'strained',
  )!.effect;
  expect(section).toMatchObject({
    status: 'applied',
    selfApplication: { afterImmunity: 2, staminaBefore: 13, staminaAfter: 11 },
  });
  const reapplied = (await s.events()).filter(
    e => e.kind === 'ability.damage-reapplied' && e.causeEventId === spike.eventId,
  );
  expect(reapplied).toHaveLength(1);
  expect(reapplied[0]!.description).toContain('Stamina 13 → 11 (planned 20 → 18)');

  // Undo restores the pools and the firing record together; redo brings both back.
  await s.command('/history undo');
  expect(await s.heroLive(seer)).toMatchObject({ stamina: 20, temporaryStamina: 0 });
  expect(await s.goblinStamina()).toBe(15);
  expect((await watcherOf()).firings ?? []).toEqual([]);
  await s.command('/history redo');
  expect(await s.heroLive(seer)).toMatchObject({ stamina: 11, temporaryStamina: 0 });
  expect((await watcherOf()).firings).toHaveLength(1);
  await s.command('/history undo');

  // Temporary Stamina 8: the watcher's 7 leaves 1 (Stamina 20); the Strained 2 takes that 1 and
  // then 1 Stamina: 19, with no temporary Stamina left.
  await s.command(`${seerRef} /adjust temporary-stamina value=8`);
  await position(s.t, s.f.campaignId, [
    { sides: 10, face: 1 },
    { sides: 10, face: 1 },
    { sides: 10, face: 7 },
  ]);
  const second = await s.command(
    `${seerRef} /ability use ability="Mind Spike" targets=[${goblinRef}]`,
    true,
  );
  expect(await s.heroLive(seer)).toMatchObject({ stamina: 19, temporaryStamina: 0 });
  const secondResult = await s.t.run(ctx =>
    ctx.db
      .query('abilityResults')
      .withIndex('by_event', q => q.eq('eventId', second.eventId))
      .unique(),
  );
  expect(
    (secondResult!.compiled as CompiledResult).effects.find(o => o.effect.kind === 'strained')!
      .effect,
  ).toMatchObject({
    selfApplication: {
      absorbedByTemporaryStamina: 1,
      temporaryStaminaBefore: 1,
      temporaryStaminaAfter: 0,
      staminaBefore: 20,
      staminaAfter: 19,
    },
  });
});

/** Blessing of Insight's instances from one use, on the Conduit and Thorn. */
async function blessingInstances(s: Awaited<ReturnType<typeof setup>>, eventId: Id<'events'>) {
  return [
    ...((await s.heroLive(s.votary)).effectInstances ?? []),
    ...((await s.heroLive(s.f.thornId)).effectInstances ?? []),
  ].filter(i => i.sourceUseEventId === eventId);
}

test('QC1 R2: Blessing of Insight used by a dying Conduit ends as it is applied and grants no surges', async () => {
  const s = await setup();
  const votaryRef = `@{character:${s.votary}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');
  await s.command(`${votaryRef} /turn take`, true);
  // Dying, not dead: Stamina 0 (rule/health/dying.md); a dying hero can still act.
  await s.command(`${votaryRef} /adjust stamina value=0`);
  await s.command(`${votaryRef} /adjust heroic-resource value=5`);
  const surges = {
    votary: (await s.heroLive(s.votary)).surges,
    thorn: (await s.heroLive(s.f.thornId)).surges,
  };
  const blessing = await s.command(
    `${votaryRef} /ability use ability="Blessing of Insight" targets=[@Thorn]`,
    true,
  );
  expect((await s.t.run(ctx => ctx.db.get(blessing.eventId)))!.kind).toBe('ability.use');
  const blessed = await blessingInstances(s, blessing.eventId);
  expect(blessed.map(i => i.subject.id).sort()).toEqual([s.votary, s.f.thornId].sort());
  for (const instance of blessed)
    expect(instance).toMatchObject({
      kind: 'watcher',
      status: 'ended',
      endedReason: 'Votary is dying (Stamina 0), so it ends as it is applied',
      endedEventId: blessing.eventId,
      registrationIds: [],
    });
  // No owner pointer and no clock work for them.
  expect((await s.heroLive(s.votary)).ownedEffects ?? []).toEqual([]);
  const registrations = await s.t.run(ctx => ctx.db.query('clockRegistrations').take(500));
  expect(
    registrations.filter(
      r =>
        r.status === 'active' &&
        r.work.kind === 'watcher' &&
        blessed.some(i => i.id === (r.work as { effectInstanceId: string }).effectInstanceId),
    ),
  ).toEqual([]);
  const applied = (await s.events()).filter(
    e => e.kind === 'effect.applied' && e.causeEventId === blessing.eventId,
  );
  expect(applied).toHaveLength(2);
  for (const entry of applied) expect(entry.description).toContain('It ends as it is applied');

  // The Conduit's turn ends: no surges for either target, and no firing.
  await s.command(`${votaryRef} /turn end`, true);
  expect((await s.heroLive(s.votary)).surges).toBe(surges.votary);
  expect((await s.heroLive(s.f.thornId)).surges).toBe(surges.thorn);
  expect((await s.events()).filter(e => e.kind === 'effect.watcher-fired')).toEqual([]);
});

test('QC1 R2: a healthy Conduit’s Blessing grants surges; it ends when the Conduit becomes dying, by damage or by a Stamina edit', async () => {
  const s = await setup();
  const votaryRef = `@{character:${s.votary}}`;
  const goblinRef = `@{foe:${s.goblin}}`;
  const surges = async () => ({
    votary: (await s.heroLive(s.votary)).surges,
    thorn: (await s.heroLive(s.f.thornId)).surges,
  });
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');

  // Round 1. Control: a healthy Conduit's Blessing grants each target 1 surge at its turn end.
  await s.command(`${votaryRef} /turn take`, true);
  await s.command(`${votaryRef} /adjust heroic-resource value=5`);
  const first = await s.command(
    `${votaryRef} /ability use ability="Blessing of Insight" targets=[@Thorn]`,
    true,
  );
  for (const instance of await blessingInstances(s, first.eventId))
    expect(instance.status).toBe('active');
  const start = await surges();
  await s.command(`${votaryRef} /turn end`, true);
  expect(await surges()).toEqual({ votary: start.votary + 1, thorn: start.thorn + 1 });

  // Transition by damage: at Stamina 1, the goblin's Free Strike (1 damage) makes the Conduit
  // dying (1 → 0), and both instances end.
  await s.command(`${goblinRef} /turn take`);
  await s.command(`${votaryRef} /adjust stamina value=1`);
  const strike = await s.command(
    `${goblinRef} /ability use ability="Free Strike" targets=[${votaryRef}]`,
  );
  expect((await s.heroLive(s.votary)).stamina).toBe(0);
  for (const instance of await blessingInstances(s, first.eventId))
    expect(instance).toMatchObject({
      status: 'ended',
      endedReason: 'Votary is dying',
      endedEventId: strike.eventId,
    });
  await s.command(`${goblinRef} /turn end`);
  await s.command('@Thorn /turn take', true);
  await s.command('@Thorn /turn end', true);

  // Round 2. Healed, the Conduit uses it again (active); a manual Stamina edit to 0 makes it dying
  // and ends both instances, as the damage writer does. The turn end grants no surges.
  const encounter = await s.t.run(async ctx =>
    (await ctx.db.query('encounters').take(10)).find(e => e.status === 'committed'),
  );
  expect(encounter!.round).toBe(2);
  if (encounter!.activeSide === 'director') {
    await s.command(`${goblinRef} /turn take`);
    await s.command(`${goblinRef} /turn end`);
  }
  await s.command(`${votaryRef} /turn take`, true);
  await s.command(`${votaryRef} /adjust stamina value=20`);
  await s.command(`${votaryRef} /adjust heroic-resource value=5`);
  const second = await s.command(
    `${votaryRef} /ability use ability="Blessing of Insight" targets=[@Thorn]`,
    true,
  );
  for (const instance of await blessingInstances(s, second.eventId))
    expect(instance.status).toBe('active');
  const edit = await s.command(`${votaryRef} /adjust stamina value=0`);
  for (const instance of await blessingInstances(s, second.eventId))
    expect(instance).toMatchObject({
      status: 'ended',
      endedReason: 'Votary is dying',
      endedEventId: edit.eventId,
    });
  expect(
    (await s.events()).filter(e => e.kind === 'effect.ended' && e.causeEventId === edit.eventId),
  ).toHaveLength(2);
  const before = await surges();
  const end = await s.command(`${votaryRef} /turn end`, true);
  expect(await surges()).toEqual(before);
  const after = (await s.events()).filter(e => e.sequence > end.sequence);
  expect(after.filter(e => e.kind === 'effect.watcher-fired')).toEqual([]);
  // Undo of the edit restores the Stamina and the instances together.
  await s.command('/history undo');
  await s.command('/history undo');
  expect((await s.heroLive(s.votary)).stamina).toBe(20);
  for (const instance of await blessingInstances(s, second.eventId))
    expect(instance.status).toBe('active');
});

test('QC1 R2: the turn-end firing re-checks the owner, when Stamina reached 0 outside the damage writer and /adjust', async () => {
  const s = await setup();
  const votaryRef = `@{character:${s.votary}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');
  await s.command(`${votaryRef} /turn take`, true);
  await s.command(`${votaryRef} /adjust heroic-resource value=5`);
  const blessing = await s.command(
    `${votaryRef} /ability use ability="Blessing of Insight" targets=[@Thorn]`,
    true,
  );
  // A direct write stands in for any Stamina writer that doesn't end owner-dying effects itself.
  await s.t.run(async ctx => {
    const hero = (await ctx.db.get(s.votary))!;
    await ctx.db.patch(s.votary, { liveState: { ...hero.liveState!, stamina: 0 } });
  });
  const before = {
    votary: (await s.heroLive(s.votary)).surges,
    thorn: (await s.heroLive(s.f.thornId)).surges,
  };
  const end = await s.command(`${votaryRef} /turn end`, true);
  expect((await s.heroLive(s.votary)).surges).toBe(before.votary);
  expect((await s.heroLive(s.f.thornId)).surges).toBe(before.thorn);
  for (const instance of await blessingInstances(s, blessing.eventId))
    expect(instance).toMatchObject({ status: 'ended', endedReason: 'Votary is dying (Stamina 0)' });
  const after = (await s.events()).filter(e => e.sequence > end.sequence);
  expect(after.filter(e => e.kind === 'effect.watcher-fired')).toEqual([]);
  expect(after.filter(e => e.kind === 'effect.ended')).toHaveLength(2);
});

/** A synthetic edge on Thorn's power rolls, owned by the Conduit, "until you are dying". */
async function storeDyingEdge(s: Awaited<ReturnType<typeof setup>>, name: string) {
  return s.t.run(async ctx => {
    const eventId = await appendEvent(ctx, {
      campaignId: s.f.campaignId,
      sessionId: s.f.sessionId!,
      encounterId: null,
      origin: 'user',
      actor: (await ctx.db.get(s.f.director.profile.userId))!,
      commandId: `watcher-interactions-source-${++sequence}`,
      kind: 'test.effect',
      description: 'Synthetic source occurrence for an edge that ends when its owner is dying.',
    });
    const edge: ModifierPayload = {
      kind: 'roll',
      target: 'rolls-by',
      scope: 'power-roll',
      edges: 1,
    };
    const stored = await applyEffectInstance(
      ctx,
      { campaignId: s.f.campaignId, eventId },
      {
        id: `fixture-${eventId}`,
        kind: 'modifier',
        sourceUseEventId: eventId,
        sourceActorId: s.votary,
        abilityId: `fixture-${name}`,
        abilityName: name,
        actorLabel: 'Votary',
        sourcePath: 'rule/dice/edge.md',
        clause: `Fixture: until you are dying, ${name} gives an edge on power rolls.`,
        owner: { kind: 'character', id: s.votary, name: 'Votary' },
        subject: { kind: 'character', id: s.f.thornId, name: 'Thorn' },
        payload: { kind: 'modifier', text: 'Fixture edge.', modifier: edge },
        printedDuration: { kind: 'encounter' },
        endsWhen: ['owner-dying'],
        appliedSequence: (await ctx.db.get(eventId))!.sequence,
      },
    );
    if (!stored || !('instance' in stored)) throw new Error('Expected a tracked instance.');
    return stored.instance;
  });
}

test('QC1 R2: a modifier whose owner is dying adds nothing to a test or an ability roll, and ends', async () => {
  const s = await setup();
  const goblinRef = `@{foe:${s.goblin}}`;
  const setVotaryStamina = (stamina: number) =>
    s.t.run(async ctx => {
      const hero = (await ctx.db.get(s.votary))!;
      await ctx.db.patch(s.votary, { liveState: { ...hero.liveState!, stamina } });
    });
  const thornEffect = async (id: string) =>
    (await s.heroLive(s.f.thornId)).effectInstances!.find(i => i.id === id)!;
  const testData = async (eventId: Id<'events'>) =>
    ((await s.t.run(ctx => ctx.db.get(eventId)))!.payload as { data: Record<string, unknown> })
      .data;

  // Control: while the Conduit is healthy, Thorn's test gets the edge (rule/dice/power-roll.md: a
  // test is a power roll).
  const edge = await storeDyingEdge(s, 'Fixture Blessing');
  const control = await s.command('@Thorn /test roll characteristic=M', true);
  expect((await testData(control.eventId)).contributions).toEqual([
    expect.objectContaining({ instanceId: edge.id, edges: 1 }),
  ]);

  // The Conduit at Stamina 0 without the damage writer or /adjust: the test gets no edge, and the
  // edge ends in the test's journal with a linked entry.
  await setVotaryStamina(0);
  const tested = await s.command('@Thorn /test roll characteristic=M', true);
  expect((await testData(tested.eventId)).contributions).toBeUndefined();
  expect(await thornEffect(edge.id)).toMatchObject({
    status: 'ended',
    endedReason: 'Votary is dying (Stamina 0)',
    endedEventId: tested.eventId,
  });
  expect(
    (await s.events()).filter(e => e.kind === 'effect.ended' && e.causeEventId === tested.eventId),
  ).toHaveLength(1);

  // The same for an ability roll: Thorn's Brutal Slam records no contribution, and the edge ends.
  await setVotaryStamina(20);
  const second = await storeDyingEdge(s, 'Fixture Second Blessing');
  await setVotaryStamina(0);
  const used = await s.command(
    `@Thorn /ability use ability="Brutal Slam" targets=[${goblinRef}]`,
    true,
  );
  const result = await s.t.run(ctx =>
    ctx.db
      .query('abilityResults')
      .withIndex('by_event', q => q.eq('eventId', used.eventId))
      .unique(),
  );
  expect(result!.targets[0]!.contributions).toBeUndefined();
  expect(await thornEffect(second.id)).toMatchObject({
    status: 'ended',
    endedReason: 'Votary is dying (Stamina 0)',
    endedEventId: used.eventId,
  });
});
