// SPDX-License-Identifier: GPL-3.0-only
/**
 * V175 marks through the registered operations, with persisted readback. Expected values come from
 * the pinned Compendium (en/unified/md) and the reviewed ledgers, never from a run of the code
 * under test:
 * - feature/ability/tactician/level-1/mark.md (Maneuver, Ranged 10, One creature): "The target is
 *   marked by you until the end of the encounter, until you are dying, or until you use this ability
 *   again. You can willingly end your mark on a creature (no action required), and if another
 *   tactician marks a creature, your mark on that creature ends. When a creature marked by you is
 *   reduced to 0 Stamina, you can use a free triggered action to mark a new target within
 *   distance." "… you and allies within your line of effect gain an edge on power rolls made against
 *   that creature. Additionally, whenever you or any ally uses an ability to deal rolled damage to a
 *   creature marked by you, you can spend 1 focus to gain one of the following benefits as a free
 *   triggered action: - The ability deals extra damage equal to twice your Reason score. - The
 *   creature dealing the damage can spend a Recovery. - The creature dealing the damage can shift …
 *   - If you damage a creature marked by you with a melee ability, the creature is taunted by you
 *   until the end of their next turn. You can't gain more than one benefit from the same trigger."
 * - feature/ability/tactician/level-3/hit-em-hard.md: "… whenever you or any ally deals damage to a
 *   target marked by you, that creature gains 2 surges …"
 * - tests/fixtures/v116-tactician-three-expected.json, v94-tactician-2 at level 3: a Mastermind with
 *   Reason 2 and Hit 'Em Hard! (twice Reason is 4). v94-tactician-expected.json v94-tactician-1: a
 *   level-1 Insurgent, the other Tactician.
 * - feature/tactician/level-1/focus.md: focus equal to Victories (0) at combat start, 2 at the start
 *   of each of your turns.
 * - feature/ability/fury/level-1/brutal-slam.md with docs/roll-and-damage-resolution.md 10.13: Thorn
 *   (Might 2) rolls 3 + 6 = 11 → tier 1, 5 damage; with an edge 13 → tier 2, 8 damage.
 *   rule/dice/edge.md: an edge is +2.
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, no immunity or weakness; Spear Charge,
 *   Power Roll + 2: 12-16 4 damage. rule/health/stamina.md: a Director-controlled creature dies when
 *   its Stamina drops to 0. rule/health/dying.md: a hero at 0 Stamina or lower is dying.
 * - rule/health/recoveries.md: spending a Recovery regains the recovery value, floor(max / 3), up
 *   to the maximum.
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
import { definitions as levelOneDefinitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import levelOne from '../fixtures/v94-tactician-expected.json' with { type: 'json' };
import levelThree from '../fixtures/v116-tactician-three-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');
const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';

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
async function setup(options: { warden?: boolean } = {}) {
  // The damage writer is a hot path (tests/app/party-read-limit.test.ts): enforce Convex's limits.
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const cid = () => `marks-cmd-${++sequence}`;
  // The level-3 Mastermind (Hit 'Em Hard!), created at level 3 as the V116 ledger builds it.
  const witness = levelThree.witnesses['v94-tactician-2'];
  const base = levelOne.witnesses.find(w => w.id === witness.base)!;
  const { definitions } = await f.player.client.query(api.characterWizard.discover, {
    targetLevel: 3,
  });
  const authored = { name: 'Planner', appearance: '', biography: '', notes: '' };
  const planner = await f.player.client.mutation(api.characters.create, {
    commandId: cid(),
    targetLevel: 3,
    authored,
    selections: draftSelectionsFrom(
      {
        ...(base.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Planner',
        'class.tactician.level-2.perk': witness.levelTwo.addedSelections.perk,
        'class.tactician.level-2.mastermind-ability':
          witness.levelTwo.addedSelections.doctrineAbility,
        'class.tactician.level-3.ability-7': witness.levelThree.addedSelections.ability7,
      },
      definitions,
    ),
  });
  await f.player.client.mutation(api.characters.submit, {
    commandId: cid(),
    characterId: planner,
    campaignId: f.campaignId,
  });
  await f.director.client.mutation(api.characters.approve, {
    commandId: cid(),
    characterId: planner,
  });
  const rival = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Rival',
    draftSelectionsFrom(
      {
        ...(levelOne.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Rival',
      },
      levelOneDefinitions,
    ),
  );
  // A Tactician the Director owns (v94-tactician-3), for who may end a mark.
  const warden = options.warden
    ? await admitHero(
        t,
        f.director,
        f.director,
        f.campaignId,
        'Warden',
        draftSelectionsFrom(
          {
            ...(levelOne.witnesses[2]!.selections as unknown as EvaluationInput['selections']),
            'details.name': 'Warden',
          },
          levelOneDefinitions,
        ),
      )
    : undefined;
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: cid(),
  });
  const goblin2 = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: cid(),
  });
  const command = (text: string, who: 'director' | 'player' = 'director') =>
    f[who].client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: cid(),
      text,
    });
  const respond = (
    id: Id<'interactions'>,
    answer: Record<string, unknown>,
    who: 'director' | 'player',
  ) =>
    f[who].client.mutation(api.interactions.respond, {
      interactionId: id,
      answer,
      commandId: cid(),
    });
  const foe = async (id: Id<'foes'>) => (await t.run(ctx => ctx.db.get(id)))!;
  const hero = async (id: Id<'characters'>) => (await t.run(ctx => ctx.db.get(id)))!;
  const setFoeStamina = (id: Id<'foes'>, stamina: number) =>
    t.run(async ctx => {
      const row = (await ctx.db.get(id))!;
      await ctx.db.patch(id, { live: { ...row.live, stamina } });
    });
  const markCards = () =>
    t.run(async ctx =>
      (await ctx.db.query('interactions').take(200)).filter(c => c.kind === 'mark-offer'),
    );
  const card = async (id: Id<'interactions'>) => (await t.run(ctx => ctx.db.get(id)))!;
  const results = async (eventId: Id<'events'>) =>
    (
      await f.director.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [eventId],
      })
    )[0]!;
  const marksOn = async (id: Id<'foes'>) =>
    ((await foe(id)).live.effectInstances ?? []).filter(i => i.kind === 'mark');
  const plannerRef = `@{character:${planner}}`;
  const rivalRef = `@{character:${rival}}`;
  const goblinRef = `@{foe:${goblin}}`;
  const goblin2Ref = `@{foe:${goblin2}}`;
  // Combat with the heroes first and the Planner's turn in progress: 0 Victories + 2 focus.
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', 'player');
  await command('/combat first side=heroes');
  await command(`${plannerRef} /turn take`, 'player');
  return {
    t,
    f,
    planner,
    rival,
    warden,
    goblin,
    goblin2,
    command,
    respond,
    foe,
    hero,
    setFoeStamina,
    markCards,
    card,
    results,
    marksOn,
    plannerRef,
    rivalRef,
    goblinRef,
    goblin2Ref,
    witness,
  };
}

test('V175: Mark is stored and visible; an ally gets the edge and exclude drops it; one benefit per trigger; undo restores', async () => {
  const s = await setup();
  expect((await s.hero(s.planner)).liveState!.heroicResource.current).toBe(2);

  // 1. Mark on the goblin: a compiled use without a power roll, stored as a mark on the goblin.
  const marked = await s.command(
    `${s.plannerRef} /ability use ability=Mark targets=[${s.goblinRef}]`,
    'player',
  );
  expect((await s.t.run(ctx => ctx.db.get(marked.eventId)))!.kind).toBe('ability.use');
  const [mark] = await s.marksOn(s.goblin);
  expect(mark).toMatchObject({
    status: 'active',
    owner: { kind: 'character', id: s.planner },
    subject: { kind: 'foe', id: s.goblin },
    printedDuration: { kind: 'encounter' },
    endsWhen: ['owner-dying', 'reused', 'willingly-ended'],
    payload: { kind: 'mark', mark: { retargetDistance: 'Ranged 10' } },
  });
  expect(mark!.registrationIds).toHaveLength(1);
  expect((await s.hero(s.planner)).liveState!.ownedEffects).toEqual([
    expect.objectContaining({ id: mark!.id, holder: { kind: 'foe', id: s.goblin } }),
  ]);
  // Visible to players (the pending product question's recommendation, shared/resolve/marks.ts).
  const roster = await s.f.player.client.query(api.table.roster, { campaignId: s.f.campaignId });
  expect(roster.foes.find(r => r.id === s.goblin)!.effectInstances).toEqual([
    expect.objectContaining({
      id: mark!.id,
      abilityName: 'Mark',
      mark: expect.stringContaining('marked by Planner'),
    }),
  ]);

  // 2. Thorn, an ally, gets the Mark edge on Brutal Slam: 11 + 2 = 13, tier 2, 8 damage (15 → 7).
  await atDice(s.t, s.f.campaignId, [3, 6]);
  const hitA = await s.command(
    `@Thorn /ability use ability="Brutal Slam" targets=[${s.goblinRef}]`,
    'player',
  );
  const a = await s.results(hitA.eventId);
  expect(a.targets[0]!.contributions).toEqual([
    expect.objectContaining({
      instanceId: mark!.id,
      side: 'target',
      edges: 1,
      banes: 0,
      abilityName: 'Mark',
    }),
  ]);
  expect(a.targets[0]!.contributions![0]!.text).toMatch(/line of effect/);
  expect(a.targets[0]!.outcome).toMatchObject({ total: 13, tier: 2 });
  expect((await s.foe(s.goblin)).live.stamina).toBe(7);
  // Rolled damage from an ally offers the Planner a benefit card; no taunt (Thorn is not the owner).
  const [cardA] = await s.markCards();
  expect(cardA).toMatchObject({
    status: 'awaiting-input',
    operation: 'mark.benefit',
    openedEventId: hitA.eventId,
    boundActor: { kind: 'character', id: s.planner },
    requesterId: s.f.player.profile.userId,
    offer: { mark: { kind: 'benefit', instanceId: mark!.id, dealer: { id: s.f.thornId } } },
  });
  expect(cardA!.offer.mark.options.map((o: { kind: string }) => o.kind)).toEqual([
    'extra-damage',
    'recovery',
    'shift',
  ]);

  // 3. The table rejects the edge with exclude: 11 → tier 1, 5 damage (15 → 10), recorded excluded.
  await s.setFoeStamina(s.goblin, 15);
  await atDice(s.t, s.f.campaignId, [3, 6]);
  const hitB = await s.command(
    `@Thorn /ability use ability="Brutal Slam" targets=[${s.goblinRef}] exclude=${JSON.stringify([mark!.id])}`,
    'player',
  );
  const b = await s.results(hitB.eventId);
  expect(b.targets[0]!.contributions).toEqual([
    expect.objectContaining({ instanceId: mark!.id, excluded: true }),
  ]);
  expect(b.targets[0]!.outcome).toMatchObject({ total: 11, tier: 1 });
  expect((await s.foe(s.goblin)).live.stamina).toBe(10);
  const cardB = (await s.markCards()).find(c => c.openedEventId === hitB.eventId)!;

  // 4. Extra damage: 1 focus (2 → 1) and twice Reason 2 = 4 (10 → 6), one benefit recorded.
  const benefit = await s.respond(cardB._id, { benefit: 'extra-damage' }, 'player');
  const benefitEvent = (await s.t.run(ctx => ctx.db.get(benefit.eventId)))!;
  expect(benefitEvent).toMatchObject({ kind: 'mark.benefit', causeEventId: hitB.eventId });
  expect((await s.foe(s.goblin)).live.stamina).toBe(6);
  const extra = await s.t.run(async ctx =>
    (await ctx.db.query('events').take(4000)).find(
      e => e.kind === 'mark.extra-damage' && e.causeEventId === benefit.eventId,
    ),
  );
  expect(extra!.description).toMatch(/takes 4 extra damage.*Stamina 10 → 6/);
  expect((await s.hero(s.planner)).liveState!.heroicResource.current).toBe(1);
  expect(await s.card(cardB._id)).toMatchObject({
    status: 'resolved',
    resolvedEventId: benefit.eventId,
  });
  expect((await s.marksOn(s.goblin))[0]!.markBenefits).toEqual([
    { triggeringEventId: hitB.eventId, benefit: 'extra-damage', eventId: benefit.eventId },
  ]);
  const uses = await s.t.run(async ctx =>
    (await ctx.db.query('actionUses').take(100)).filter(u => u.actor.id === s.planner),
  );
  expect(uses.map(u => u.actionType)).toEqual(['maneuver', 'free triggered action']);
  // The extra damage is part of the hit, not a second damage event: it offers no second card.
  expect((await s.markCards()).filter(c => c.openedEventId === benefit.eventId)).toEqual([]);

  // 5. "You can't gain more than one benefit from the same trigger": a second answer for the same
  // hit (the card reopened by hand) is refused, and nothing changes.
  await s.t.run(ctx => ctx.db.patch(cardB._id, { status: 'awaiting-input' }));
  await expect(s.respond(cardB._id, { benefit: 'recovery' }, 'player')).rejects.toThrow(
    /more than one benefit from the same trigger/,
  );
  expect((await s.hero(s.planner)).liveState!.heroicResource.current).toBe(1);
  await s.t.run(ctx => ctx.db.patch(cardB._id, { status: 'resolved' }));

  // 6. Undo of the benefit restores the goblin, the focus, the benefit record and the card.
  await s.command('/history undo');
  expect((await s.foe(s.goblin)).live.stamina).toBe(10);
  expect((await s.hero(s.planner)).liveState!.heroicResource.current).toBe(2);
  expect((await s.marksOn(s.goblin))[0]!.markBenefits ?? []).toEqual([]);
  expect(await s.card(cardB._id)).toMatchObject({ status: 'awaiting-input' });

  // 7. The Director answers the first card for the player: Thorn spends a Recovery.
  const thorn = await s.hero(s.f.thornId);
  const max = (thorn.derivedBaseline as { staminaMaximum: { value: number } }).staminaMaximum.value;
  await s.t.run(ctx =>
    ctx.db.patch(s.f.thornId, { liveState: { ...thorn.liveState!, stamina: 5 } }),
  );
  await s.respond(cardA!._id, { benefit: 'recovery' }, 'director');
  const after = (await s.hero(s.f.thornId)).liveState!;
  expect(after.recoveries).toBe(thorn.liveState!.recoveries - 1);
  expect(after.stamina).toBe(Math.min(max, 5 + Math.floor(max / 3)));
  expect((await s.hero(s.planner)).liveState!.heroicResource.current).toBe(1);
});

test('V175: 0 Stamina offers a new mark; another Tactician’s Mark ends the first; undo, willing end, dying and encounter end', async () => {
  const s = await setup();
  await s.command(`${s.plannerRef} /ability use ability=Mark targets=[${s.goblinRef}]`, 'player');
  const [first] = await s.marksOn(s.goblin);

  // 1. Brutal Slam with the edge (8 damage) reduces the goblin from 3 to 0 or lower.
  await s.setFoeStamina(s.goblin, 3);
  await atDice(s.t, s.f.campaignId, [3, 6]);
  const kill = await s.command(
    `@Thorn /ability use ability="Brutal Slam" targets=[${s.goblinRef}]`,
    'player',
  );
  expect((await s.foe(s.goblin)).live.stamina).toBeLessThanOrEqual(0);
  const retarget = (await s.markCards()).find(
    c => c.openedEventId === kill.eventId && c.operation === 'mark.retarget',
  )!;
  expect(retarget.offer.mark).toMatchObject({
    kind: 'retarget',
    distance: 'within 10 squares (ranged): the table confirms',
  });
  expect(retarget.offer.mark.candidates.map((c: { id: string }) => c.id)).toContain(s.goblin2);
  expect(retarget.offer.mark.candidates.map((c: { id: string }) => c.id)).not.toContain(s.goblin);

  // 2. Accepting marks goblin 2 as a free triggered action; the earlier Mark ends (Q-MARK-1).
  const moved = await s.respond(
    retarget._id,
    { targets: [{ refKind: 'foe', id: s.goblin2 }] },
    'player',
  );
  expect((await s.marksOn(s.goblin)).find(m => m.id === first!.id)).toMatchObject({
    status: 'ended',
  });
  const [second] = await s.marksOn(s.goblin2);
  expect(second).toMatchObject({
    status: 'active',
    owner: { id: s.planner },
    sourceUseEventId: moved.eventId,
  });
  expect(await s.card(retarget._id)).toMatchObject({ status: 'resolved' });

  // 3. Another Tactician marks goblin 2: the Planner's mark on it ends; the Rival's is active.
  const rivalUse = await s.command(
    `${s.rivalRef} /ability use ability=Mark targets=[${s.goblin2Ref}]`,
    'player',
  );
  let marks = await s.marksOn(s.goblin2);
  expect(marks.find(m => m.id === second!.id)).toMatchObject({
    status: 'ended',
    endedReason: expect.stringContaining('another tactician'),
  });
  const rivalMark = marks.find(m => m.owner.id === s.rival)!;
  expect(rivalMark).toMatchObject({ status: 'active', sourceUseEventId: rivalUse.eventId });
  expect((await s.hero(s.planner)).liveState!.ownedEffects ?? []).toEqual([]);

  // 4. Undo of the Rival's Mark restores the Planner's.
  await s.command('/history undo');
  marks = await s.marksOn(s.goblin2);
  expect(marks.find(m => m.id === second!.id)).toMatchObject({ status: 'active' });
  expect(marks.some(m => m.owner.id === s.rival)).toBe(false);

  // 5. Willing end (no action required): effect.end records no action use.
  await s.command(`${s.rivalRef} /ability use ability=Mark targets=[${s.goblin2Ref}]`, 'player');
  const rivalAgain = (await s.marksOn(s.goblin2)).find(
    m => m.owner.id === s.rival && m.status === 'active',
  )!;
  const usesBefore = await s.t.run(
    async ctx => (await ctx.db.query('actionUses').take(200)).length,
  );
  await s.f.player.client.mutation(api.commands.invoke, {
    campaignId: s.f.campaignId,
    commandId: `marks-end-${++sequence}`,
    operation: 'effect.end',
    arguments: { instance: rivalAgain.id },
  });
  expect((await s.marksOn(s.goblin2)).find(m => m.id === rivalAgain.id)).toMatchObject({
    status: 'ended',
  });
  expect(await s.t.run(async ctx => (await ctx.db.query('actionUses').take(200)).length)).toBe(
    usesBefore,
  );

  // 6. Until you are dying: the Rival marks again, then goes from 1 Stamina to 1 − 4 = −3.
  await s.command(`${s.rivalRef} /ability use ability=Mark targets=[${s.goblin2Ref}]`, 'player');
  const dyingMark = (await s.marksOn(s.goblin2)).find(
    m => m.owner.id === s.rival && m.status === 'active',
  )!;
  const rival = await s.hero(s.rival);
  await s.t.run(ctx => ctx.db.patch(s.rival, { liveState: { ...rival.liveState!, stamina: 1 } }));
  await atDice(s.t, s.f.campaignId, [5, 5]);
  await s.command(`${s.goblinRef} /ability use ability="Spear Charge" targets=[${s.rivalRef}]`);
  expect((await s.hero(s.rival)).liveState!.stamina).toBe(-3);
  expect((await s.marksOn(s.goblin2)).find(m => m.id === dyingMark.id)).toMatchObject({
    status: 'ended',
    endedReason: 'Rival is dying',
  });

  // 7. Until the end of the encounter.
  await s.command(`${s.plannerRef} /ability use ability=Mark targets=[${s.goblin2Ref}]`, 'player');
  const last = (await s.marksOn(s.goblin2)).find(
    m => m.owner.id === s.planner && m.status === 'active',
  )!;
  await s.command('/combat end');
  await s.command('/combat victories amount=0 recipients=[]');
  await s.command('/combat finish');
  expect((await s.marksOn(s.goblin2)).find(m => m.id === last.id)).toMatchObject({
    status: 'ended',
    endedReason: 'end of the encounter',
  });
});

test("V175: Hit 'Em Hard! gives the dealer 2 surges for damage to a marked creature; the owner's melee hit offers the taunt", async () => {
  const s = await setup();
  await s.command(`${s.plannerRef} /adjust heroic-resource value=7`);
  const hit = await s.command(`${s.plannerRef} /ability use ability="Hit 'Em Hard!"`, 'player');
  expect((await s.t.run(ctx => ctx.db.get(hit.eventId)))!.kind).toBe('ability.use');
  expect((await s.hero(s.planner)).liveState!.effectInstances).toEqual([
    expect.objectContaining({
      kind: 'watcher',
      status: 'active',
      payload: expect.objectContaining({
        watcher: expect.objectContaining({ event: 'marked-damaged' }),
      }),
    }),
  ]);
  await s.command(`${s.plannerRef} /ability use ability=Mark targets=[${s.goblinRef}]`, 'player');
  const surges = (await s.hero(s.f.thornId)).liveState!.surges;
  await atDice(s.t, s.f.campaignId, [3, 6]);
  const slam = await s.command(
    `@Thorn /ability use ability="Brutal Slam" targets=[${s.goblinRef}]`,
    'player',
  );
  expect((await s.hero(s.f.thornId)).liveState!.surges).toBe(surges + 2);
  const fired = await s.t.run(async ctx =>
    (await ctx.db.query('events').take(4000)).filter(e => e.kind === 'effect.watcher-fired'),
  );
  expect(fired.map(e => e.causeEventId)).toEqual([slam.eventId]);
  // Damage to an unmarked creature fires nothing.
  await atDice(s.t, s.f.campaignId, [3, 6]);
  await s.command(`@Thorn /ability use ability="Brutal Slam" targets=[${s.goblin2Ref}]`, 'player');
  expect((await s.hero(s.f.thornId)).liveState!.surges).toBe(surges + 2);

  // The Planner's own melee strike on the marked goblin offers the taunt, which is table work.
  await atDice(s.t, s.f.campaignId, [3, 6]);
  const own = await s.command(
    `${s.plannerRef} /ability use ability="Melee Weapon Free Strike" targets=[${s.goblinRef}]`,
    'player',
  );
  const card = (await s.markCards()).find(c => c.openedEventId === own.eventId)!;
  expect(card.offer.mark.options.map((o: { kind: string }) => o.kind)).toEqual([
    'extra-damage',
    'recovery',
    'shift',
    'taunt',
  ]);
  expect(card.status).toBe('awaiting-input');
  // Hit 'Em Hard! spent the 7 focus: the 1 focus is checked again on accept and the card stays open.
  expect((await s.hero(s.planner)).liveState!.heroicResource.current).toBe(0);
  await expect(s.respond(card._id, { benefit: 'taunt' }, 'player')).rejects.toThrow(
    /can't spend 1 focus/,
  );
  expect((await s.card(card._id)).status).toBe('awaiting-input');
  await s.command(`${s.plannerRef} /adjust heroic-resource value=1`);
  const taunt = await s.respond(card._id, { benefit: 'taunt' }, 'player');
  expect((await s.t.run(ctx => ctx.db.get(taunt.eventId)))!.description).toMatch(
    /taunted by Planner/,
  );
  expect((await s.hero(s.planner)).liveState!.heroicResource.current).toBe(0);
});

test('V175 review: the benefit of a trigger still applies after that trigger’s retarget was accepted first', async () => {
  const s = await setup();
  await s.command(`${s.plannerRef} /ability use ability=Mark targets=[${s.goblinRef}]`, 'player');
  const [first] = await s.marksOn(s.goblin);
  await s.setFoeStamina(s.goblin, 3);
  await atDice(s.t, s.f.campaignId, [3, 6]);
  const kill = await s.command(
    `@Thorn /ability use ability="Brutal Slam" targets=[${s.goblinRef}]`,
    'player',
  );
  const cards = (await s.markCards()).filter(c => c.openedEventId === kill.eventId);
  const retarget = cards.find(c => c.operation === 'mark.retarget')!;
  const benefit = cards.find(c => c.operation === 'mark.benefit')!;
  // The retarget first: the old mark ends (Q-MARK-1 point 2) …
  await s.respond(retarget._id, { targets: [{ refKind: 'foe', id: s.goblin2 }] }, 'player');
  expect((await s.marksOn(s.goblin)).find(m => m.id === first!.id)).toMatchObject({
    status: 'ended',
  });
  // … but the trigger happened while the goblin was marked, so its benefit is still gained.
  const gained = await s.respond(benefit._id, { benefit: 'shift' }, 'player');
  expect((await s.hero(s.planner)).liveState!.heroicResource.current).toBe(1);
  expect((await s.marksOn(s.goblin)).find(m => m.id === first!.id)!.markBenefits).toEqual([
    { triggeringEventId: kill.eventId, benefit: 'shift', eventId: gained.eventId },
  ]);
});

test('V175 review: a dying Tactician’s Mark ends as it is applied and ends no other mark', async () => {
  const s = await setup();
  await s.command(`${s.rivalRef} /ability use ability=Mark targets=[${s.goblin2Ref}]`, 'player');
  const rivalMark = (await s.marksOn(s.goblin2)).find(m => m.owner.id === s.rival)!;
  // rule/health/dying.md: "When your Stamina is 0 or lower, you are dying."
  const planner = await s.hero(s.planner);
  await s.t.run(ctx =>
    ctx.db.patch(s.planner, { liveState: { ...planner.liveState!, stamina: 0 } }),
  );
  const use = await s.command(
    `${s.plannerRef} /ability use ability=Mark targets=[${s.goblin2Ref}]`,
    'player',
  );
  const marks = await s.marksOn(s.goblin2);
  expect(marks.find(m => m.id === rivalMark.id)).toMatchObject({ status: 'active' });
  expect(marks.find(m => m.owner.id === s.planner)).toMatchObject({
    status: 'ended',
    endedReason: 'Planner is dying (Stamina 0), so it ends as it is applied',
  });
  const linked = await s.t.run(async ctx =>
    (await ctx.db.query('events').take(4000)).filter(e => e.causeEventId === use.eventId),
  );
  const logged = linked.find(e => e.kind === 'effect.applied')!;
  expect(logged.description).toMatch(
    /It ends as it is applied \(Planner is dying.*not marked by Planner, and no other Tactician's mark on it ends/,
  );
  expect(logged.payload).toMatchObject({ endedAtApplication: expect.stringContaining('dying') });
  expect(linked.filter(e => e.kind === 'effect.ended')).toEqual([]);
});

test('V175 review: only the owner’s player or the Director ends a mark', async () => {
  const s = await setup({ warden: true });
  const warden = s.warden!;
  // The Director's Tactician marks Thorn, the player's hero.
  await s.command(`@{character:${warden}} /ability use ability=Mark targets=[@Thorn]`);
  const mark = (await s.hero(s.f.thornId)).liveState!.effectInstances!.find(
    i => i.kind === 'mark',
  )!;
  const end = (who: 'director' | 'player') =>
    s.f[who].client.mutation(api.commands.invoke, {
      campaignId: s.f.campaignId,
      commandId: `marks-end-${++sequence}`,
      operation: 'effect.end',
      arguments: { instance: mark.id },
    });
  // The player controls the marked hero, not the mark's owner: "You can willingly end your mark".
  await expect(end('player')).rejects.toThrow(/Only Warden's player or the Director/);
  await end('director');
  expect(
    (await s.hero(s.f.thornId)).liveState!.effectInstances!.find(i => i.id === mark.id),
  ).toMatchObject({ status: 'ended' });
});
