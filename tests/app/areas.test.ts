// SPDX-License-Identifier: GPL-3.0-only
/**
 * V200 areas and auras through the registered operations, with persisted readback. Expected values
 * come from the pinned Compendium (en/unified/md), never from a run of the code under test:
 * - feature/ability/talent/level-1/incinerate.md: a signature ability (no cost), 3 cube within 10,
 *   "Each enemy in the area"; Power Roll + Reason, ≤11 "2 fire damage"; Effect: "A column of fire
 *   remains in the area until the start of your next turn. Each enemy who enters the area for the
 *   first time in a combat round or starts their turn there takes 2 fire damage."
 * - feature/ability/censor/level-2/blessing-of-the-faithful.md: 5 Wrath, 3 aura, "Self and each ally
 *   in the area"; "Until the end of the encounter or until you are dying, each target gains 1 surge
 *   at the end of each of your turns."
 * - tests/fixtures/v105-talent-expected.json v105-2: Reason 2, Density Augmentation (no damage
 *   bonus), so 1 + 1 + 2 = 4 is tier 1 (rule/dice/power-roll.md): 2 fire damage.
 * - tests/fixtures/v117-censor-three-expected.json v99-fate: Paragon, level 2 adds Blessing of the
 *   Faithful.
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, no immunity or weakness.
 * - rule/combat/combat-round.md: a round ends once every creature has taken a turn.
 * - rule/health/dying.md: a hero at 0 Stamina or lower is dying. rule/resource/surge.md: surges add.
 * - feature/ability/troubadour/level-1/ballad-of-the-beast.md (No action, Performance, 5 aura, "Self
 *   and each ally in the area"): "While this performance is active, each target who starts their
 *   turn in the area gains 1 surge."; revitalizing-limerick.md: "At the end of each of your turns
 *   while this performance is active, you can choose up to a number of targets equal to your
 *   Presence score. Each chosen target can spend a Recovery."
 * - feature/troubadour/level-1/routines.md: "At the start of each combat round, as long as you are
 *   not dazed, dead, or surprised, you can either choose a new performance or maintain your current
 *   performance (no action required). Your performance lasts until you are unable to maintain it or
 *   until the end of the encounter." tests/fixtures/v102-troubadour-expected.json v102-3 (Virtuoso)
 *   has Ballad of the Beast, Revitalizing Limerick and Choreography.
 * User rulings (2026-09-25): the table keeps who is in an area; adding a member is it entering the
 * area, and enter riders fire then within their printed limit; undo of the add reverses it.
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
import type { EffectInstance } from '../../shared/contracts/liveState';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import talentLedger from '../fixtures/v105-talent-expected.json' with { type: 'json' };
import censorLedger from '../fixtures/v99-censor-expected.json' with { type: 'json' };
import censorThree from '../fixtures/v117-censor-three-expected.json' with { type: 'json' };
import troubadourLedger from '../fixtures/v102-troubadour-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');
const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';
/** monster/goblin/statblock/goblin-spinecleaver.md: a minion (squads, V02). */
const SPINECLEAVER = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-spinecleaver';

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
  // The damage writer is a hot path (tests/app/party-read-limit.test.ts): enforce Convex's limits.
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `areas-v200-${++sequence}`,
      text,
    });
  const members = (instance: string, change: 'add' | 'remove', ref: string, player = false) =>
    command(`/effect members instance=${JSON.stringify(instance)} ${change}=${ref}`, player);
  const addGoblin = () =>
    f.director.client.mutation(api.foes.add, {
      campaignId: f.campaignId,
      definitionId: GOBLIN,
      commandId: `areas-v200-${++sequence}`,
    });
  const hero = async (id: Id<'characters'>) => (await t.run(ctx => ctx.db.get(id)))!.liveState!;
  const foe = async (id: Id<'foes'>) => (await t.run(ctx => ctx.db.get(id)))!.live;
  const events = () => t.run(ctx => ctx.db.query('events').take(4000));
  return { t, f, command, members, addGoblin, hero, foe, events };
}

const riders = (instances: readonly EffectInstance[] | undefined, areaId: string) =>
  (instances ?? []).filter(instance => instance.area?.id === areaId);

test('V200: Incinerate keeps its column’s members; enter fires once per round, turn start fires, leaving ends the riders, undo of an add reverses its damage', async () => {
  const s = await setup();
  const seer = await admitHero(
    s.t,
    s.f.player,
    s.f.director,
    s.f.campaignId,
    'Seer',
    draftSelectionsFrom(
      {
        ...(talentLedger.witnesses.find(w => w.id === 'v105-2')!
          .selections as unknown as EvaluationInput['selections']),
        'details.name': 'Seer',
      },
      definitions,
    ),
  );
  const first = await s.addGoblin();
  const second = await s.addGoblin();
  const seerRef = `@{character:${seer}}`;
  const firstRef = `@{foe:${first}}`;
  const secondRef = `@{foe:${second}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');
  await s.command(`${seerRef} /turn take`, true);
  // Clarity 2 is not strained (feature/talent/level-1/clarity-and-strain.md), so the column lasts
  // until the start of the Seer's next turn.
  await s.command(`${seerRef} /adjust heroic-resource value=2`);

  // 1. The use: tier 1 (1 + 1 + 2 = 4) is 2 fire damage to the first goblin, which is the area's
  // first member. Nobody enters at the use, so no enter damage.
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const use = await s.command(`${seerRef} /ability use ability="Incinerate" targets=[${firstRef}]`);
  expect((await s.foe(first)).stamina).toBe(15 - 2);
  const [area] = ((await s.hero(seer)).effectInstances ?? []).filter(
    i => i.sourceUseEventId === use.eventId,
  );
  expect(area).toMatchObject({
    kind: 'area',
    status: 'active',
    owner: { kind: 'character', id: seer },
    subject: { kind: 'character', id: seer },
    duration: { kind: 'start-of-next-turn', creatureId: seer },
    members: [{ party: { kind: 'foe', id: first } }],
    payload: {
      kind: 'area',
      area: {
        riders: [
          {
            who: { self: false, others: 'enemy' },
            watcher: {
              event: 'area-entered',
              whose: 'subject',
              limit: 'round',
              responses: [{ kind: 'damage', recipient: 'subject', amount: 2, damageType: 'fire' }],
            },
          },
          {
            who: { self: false, others: 'enemy' },
            watcher: {
              event: 'turn-start',
              whose: 'subject',
              limit: 'each',
              responses: [{ kind: 'damage', recipient: 'subject', amount: 2, damageType: 'fire' }],
            },
          },
        ],
      },
    },
  });
  expect(area!.registrationIds).toHaveLength(1);
  const firstRiders = riders((await s.foe(first)).effectInstances, area!.id);
  expect(firstRiders.map(r => [r.area!.rider, r.status, r.registrationIds.length])).toEqual([
    [0, 'active', 0],
    [1, 'active', 1],
  ]);

  // 2. The second goblin enters in round 1: 2 fire damage, recorded as the rider's firing.
  const enter = await s.members(area!.id, 'add', secondRef);
  expect((await s.foe(second)).stamina).toBe(15 - 2);
  const fired = (await s.events()).filter(
    e => e.kind === 'effect.watcher-fired' && e.causeEventId === enter.eventId,
  );
  expect(fired).toHaveLength(1);
  const enterRider = riders((await s.foe(second)).effectInstances, area!.id).find(
    r => r.area!.rider === 0,
  )!;
  expect(enterRider.firings).toEqual([
    expect.objectContaining({ causeEventId: enter.eventId, round: 1 }),
  ]);
  await expect(s.members(area!.id, 'add', secondRef)).rejects.toThrow(/already in/);

  // 3. It leaves: its riders end. Coming back in the same round is not the first time this round.
  await s.members(area!.id, 'remove', secondRef);
  expect(
    riders((await s.foe(second)).effectInstances, area!.id).map(r => [r.status, r.endedReason]),
  ).toEqual([
    ['ended', expect.stringMatching(/left .*Incinerate/)],
    ['ended', expect.stringMatching(/left .*Incinerate/)],
  ]);
  await s.members(area!.id, 'add', secondRef);
  expect((await s.foe(second)).stamina).toBe(15 - 2);

  // 4. Undo of the re-add, the removal and the first add: the goblin is back to 15 and outside the
  // area, with no rider left on it.
  await s.command('/history undo');
  await s.command('/history undo');
  await s.command('/history undo');
  expect((await s.foe(second)).stamina).toBe(15);
  expect(riders((await s.foe(second)).effectInstances, area!.id)).toEqual([]);
  const undone = ((await s.hero(seer)).effectInstances ?? []).find(i => i.id === area!.id)!;
  expect(undone.members!.map(m => m.party.id)).toEqual([first]);

  // 5. An ally in the area is a member no enemy rider applies to: Thorn takes nothing.
  const thornBefore = (await s.hero(s.f.thornId)).stamina;
  await s.members(area!.id, 'add', '@Thorn');
  expect((await s.hero(s.f.thornId)).stamina).toBe(thornBefore);
  expect(riders((await s.hero(s.f.thornId)).effectInstances, area!.id)).toEqual([]);
  expect(
    ((await s.hero(seer)).effectInstances ?? [])
      .find(i => i.id === area!.id)!
      .members!.map(m => [m.party.id, m.effects.length]),
  ).toEqual([
    [first, 2],
    [s.f.thornId, 0],
  ]);

  // 6. The second goblin enters again (round 1) and stays.
  await s.members(area!.id, 'add', secondRef);
  expect((await s.foe(second)).stamina).toBe(15 - 2);

  // 7. Each goblin starting its turn there takes 2 fire damage.
  await s.command(`${seerRef} /turn end`, true);
  await s.command(`${firstRef} /turn take`);
  expect((await s.foe(first)).stamina).toBe(15 - 2 - 2);
  await s.command(`${firstRef} /turn end`);
  await s.command('@Thorn /turn take', true);
  await s.command('@Thorn /turn end', true);
  await s.command(`${secondRef} /turn take`);
  expect((await s.foe(second)).stamina).toBe(15 - 2 - 2);
  await s.command(`${secondRef} /turn end`);

  // 8. Round 2 is a new window: leaving and entering again deals the damage again.
  await s.members(area!.id, 'remove', secondRef);
  await s.members(area!.id, 'add', secondRef);
  expect((await s.foe(second)).stamina).toBe(15 - 2 - 2 - 2);
  const again = riders((await s.foe(second)).effectInstances, area!.id).find(
    r => r.status === 'active' && r.area!.rider === 0,
  )!;
  expect(again.firings!.map(f => f.round)).toEqual([1, 2]);

  // 9. The column ends at the start of the Seer's next turn, and every rider with it.
  await s.command(`${seerRef} /turn take`, true);
  const ended = ((await s.hero(seer)).effectInstances ?? []).find(i => i.id === area!.id)!;
  expect(ended.status).toBe('ended');
  for (const id of [first, second])
    for (const rider of riders((await s.foe(id)).effectInstances, area!.id))
      expect(rider.status).toBe('ended');
  await expect(s.members(area!.id, 'add', firstRef)).rejects.toThrow(/already ended/);
});

test('V200: Blessing of the Faithful gives its current members a surge at the Censor’s turn end; a member who left gets none; the Censor dying ends it', async () => {
  const s = await setup();
  const witness = censorThree.witnesses['v99-fate'];
  const base = censorLedger.witnesses.find(w => w.id === witness.base)!;
  const { definitions: levelTwo } = await s.f.player.client.query(api.characterWizard.discover, {
    targetLevel: 2,
  });
  const warden = await s.f.player.client.mutation(api.characters.create, {
    commandId: `areas-v200-${++sequence}`,
    targetLevel: 2,
    authored: { name: 'Warden', appearance: '', biography: '', notes: '' },
    selections: draftSelectionsFrom(
      {
        ...(base.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Warden',
        'class.censor.level-2.perk': witness.levelTwo.addedSelections.perk,
        'class.censor.level-2.paragon-ability': witness.levelTwo.addedSelections.orderAbility,
      },
      levelTwo,
    ),
  });
  await s.f.player.client.mutation(api.characters.submit, {
    commandId: `areas-v200-${++sequence}`,
    characterId: warden,
    campaignId: s.f.campaignId,
  });
  await s.f.director.client.mutation(api.characters.approve, {
    commandId: `areas-v200-${++sequence}`,
    characterId: warden,
  });
  const goblin = await s.addGoblin();
  const wardenRef = `@{character:${warden}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');
  await s.command(`${wardenRef} /turn take`, true);
  await s.command(`${wardenRef} /adjust heroic-resource value=5`);
  const start = {
    warden: (await s.hero(warden)).surges,
    thorn: (await s.hero(s.f.thornId)).surges,
  };

  // 1. The use: the Censor and Thorn are the aura's members, each holding the turn-end rider.
  const use = await s.command(
    `${wardenRef} /ability use ability="Blessing of the Faithful" targets=[${wardenRef}, @Thorn]`,
    true,
  );
  expect((await s.hero(warden)).heroicResource.current).toBe(0);
  const area = ((await s.hero(warden)).effectInstances ?? []).find(
    i => i.sourceUseEventId === use.eventId && i.kind === 'area',
  )!;
  expect(area).toMatchObject({
    status: 'active',
    duration: { kind: 'encounter' },
    endsWhen: ['owner-dying'],
  });
  expect(area.members!.map(m => [m.party.id, m.effects.length])).toEqual([
    [warden, 1],
    [s.f.thornId, 1],
  ]);
  const thornRider = riders((await s.hero(s.f.thornId)).effectInstances, area.id)[0]!;
  expect(thornRider).toMatchObject({
    kind: 'watcher',
    owner: { id: warden },
    payload: {
      watcher: {
        event: 'turn-end',
        whose: 'owner',
        responses: [{ kind: 'gain', recipient: 'subject', surges: 1 }],
      },
    },
    endsWhen: ['owner-dying'],
  });

  // 2. Thorn leaves before the Censor's turn ends: only the Censor gains the surge.
  await s.members(area.id, 'remove', '@Thorn', true);
  await s.command(`${wardenRef} /turn end`, true);
  expect((await s.hero(warden)).surges).toBe(start.warden + 1);
  expect((await s.hero(s.f.thornId)).surges).toBe(start.thorn);

  // 3. Thorn enters again (the aura has no enter rider), so the next turn end gives both a surge.
  await s.members(area.id, 'add', '@Thorn', true);
  await s.command(`@{foe:${goblin}} /turn take`);
  await s.command(`@{foe:${goblin}} /turn end`);
  await s.command('@Thorn /turn take', true);
  await s.command('@Thorn /turn end', true);
  await s.command(`${wardenRef} /turn take`, true);
  await s.command(`${wardenRef} /turn end`, true);
  expect((await s.hero(warden)).surges).toBe(start.warden + 2);
  expect((await s.hero(s.f.thornId)).surges).toBe(start.thorn + 1);

  // 4. "Until you are dying": the Censor at 0 Stamina ends the aura and every member's rider.
  await s.command(`${wardenRef} /adjust stamina value=0`);
  expect(((await s.hero(warden)).effectInstances ?? []).find(i => i.id === area.id)!.status).toBe(
    'ended',
  );
  for (const rider of riders((await s.hero(s.f.thornId)).effectInstances, area.id))
    expect(rider.status).toBe('ended');

  // effect.list describes the area and its members.
  const listed = await s.f.director.client.mutation(api.commands.invoke, {
    campaignId: s.f.campaignId,
    commandId: `areas-v200-${++sequence}`,
    operation: 'effect.list',
    arguments: {},
  });
  expect((await s.t.run(ctx => ctx.db.get(listed.eventId)))!.description).not.toContain(
    'Blessing of the Faithful',
  );
});

test('V200 probes: printed immunity on an enter rider’s damage, a correction of the use, triggered offers and undo of the use', async () => {
  // monster/war-dog/1st-echelon/statblock/war-dog-crucibite.md: Stamina 10, Immunity "Fire 2";
  // rule/damage/damage-immunity.md reduces the fire damage by 2, so the enter rider's 2 fire deals
  // nothing, and 0 damage is not damage taken (Q-RES-4).
  const CRUCIBITE = 'mcdm.monsters.v1/monster.war-dog.1st-echelon.statblock/war-dog-crucibite';
  const s = await setup();
  const seer = await admitHero(
    s.t,
    s.f.player,
    s.f.director,
    s.f.campaignId,
    'Seer',
    draftSelectionsFrom(
      {
        ...(talentLedger.witnesses.find(w => w.id === 'v105-2')!
          .selections as unknown as EvaluationInput['selections']),
        'details.name': 'Seer',
      },
      definitions,
    ),
  );
  const goblin = await s.addGoblin();
  const dog = await s.f.director.client.mutation(api.foes.add, {
    campaignId: s.f.campaignId,
    definitionId: CRUCIBITE,
    commandId: `areas-v200-${++sequence}`,
  });
  const seerRef = `@{character:${seer}}`;
  const goblinRef = `@{foe:${goblin}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');
  await s.command(`${seerRef} /turn take`, true);
  await s.command(`${seerRef} /adjust heroic-resource value=2`);
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const use = await s.command(
    `${seerRef} /ability use ability="Incinerate" targets=[${goblinRef}]`,
  );
  expect((await s.foe(goblin)).stamina).toBe(15 - 2);
  const area = ((await s.hero(seer)).effectInstances ?? []).find(
    i => i.sourceUseEventId === use.eventId,
  )!;
  const offers = async () =>
    (await s.t.run(ctx => ctx.db.query('interactions').take(500))).filter(
      row => row.kind === 'triggered-offer',
    ).length;
  const offersBefore = await offers();

  // Printed fire immunity 2 takes the whole 2 fire damage.
  const enter = await s.members(area.id, 'add', `@{foe:${dog}}`);
  expect((await s.foe(dog)).stamina).toBe(10);
  const fired = (await s.events()).find(
    e => e.kind === 'effect.watcher-fired' && e.causeEventId === enter.eventId,
  )!;
  expect(fired.description).toMatch(/0 after immunity and weakness/);
  // The rider's damage has no dealer (Q-WATCH-1), so no triggered action is offered.
  expect(await offers()).toBe(offersBefore);

  // V158 boundary: a squad minion's turns and Stamina pool are its squad's, so it joins the area
  // as a manual member: no rider is stored on it and nothing fires; a squad as a whole is refused.
  const before = new Set(
    (await s.f.director.client.query(api.table.roster, { campaignId: s.f.campaignId })).squads.map(
      q => q.id,
    ),
  );
  await s.command(`/squad add definition="${SPINECLEAVER}" count=4`);
  const squad = (
    await s.f.director.client.query(api.table.roster, { campaignId: s.f.campaignId })
  ).squads.find(q => !before.has(q.id))!;
  const minion = squad.memberIds[0]!;
  const joined = await s.members(area.id, 'add', `@{foe:${minion}}`);
  const listed = ((await s.hero(seer)).effectInstances ?? []).find(i => i.id === area.id)!;
  expect(listed.members!.find(m => m.party.id === minion)).toMatchObject({
    effects: [],
    manual: expect.stringMatching(/squad minion/),
  });
  expect(riders((await s.foe(minion)).effectInstances, area.id)).toEqual([]);
  expect(
    (await s.events()).filter(
      e => e.kind === 'effect.watcher-fired' && e.causeEventId === joined.eventId,
    ),
  ).toEqual([]);
  await expect(s.members(area.id, 'add', `@{squad:${squad.id}}`)).rejects.toThrow(/is a squad/);
  await s.command('/history undo');
  await s.command('/history undo');

  // A correction of the use after the add is refused by the history window (the add is later
  // gameplay); the table rewinds the add first.
  await expect(
    s.command(`/ability correct event="${use.eventId}" target=${goblinRef} edges=2`),
  ).rejects.toThrow(/Later gameplay has committed/);
  await s.command('/history undo');
  expect((await s.foe(dog)).stamina).toBe(10);
  expect(riders((await s.foe(dog)).effectInstances, area.id)).toEqual([]);

  // Then the correction changes only the use's own damage: a double edge raises 4 (tier 1) to tier
  // 2 (rule/dice/power-roll.md), 4 fire damage. The area keeps its occurrence and its members.
  await s.command(`/ability correct event="${use.eventId}" target=${goblinRef} edges=2`);
  expect((await s.foe(goblin)).stamina).toBe(15 - 4);
  const kept = ((await s.hero(seer)).effectInstances ?? []).find(i => i.id === area.id)!;
  expect(kept.status).toBe('active');
  expect(kept.members!.map(m => m.party.id)).toEqual([goblin]);
  expect(riders((await s.foe(goblin)).effectInstances, area.id)).toHaveLength(2);

  // Undo of the correction and the use: no area and no rider remain anywhere.
  await s.command('/history undo');
  await s.command('/history undo');
  expect((await s.foe(goblin)).stamina).toBe(15);
  expect(((await s.hero(seer)).effectInstances ?? []).find(i => i.id === area.id)).toBeUndefined();
  expect(riders((await s.foe(goblin)).effectInstances, area.id)).toEqual([]);
  expect(riders((await s.foe(dog)).effectInstances, area.id)).toEqual([]);
});

test('V200: a Troubadour performance keeps its aura until another performance is chosen or the Troubadour is dazed at a round start', async () => {
  const s = await setup();
  const bard = await admitHero(
    s.t,
    s.f.player,
    s.f.director,
    s.f.campaignId,
    'Bard',
    draftSelectionsFrom(
      {
        ...(troubadourLedger.witnesses.find(w => w.id === 'v102-3')!
          .selections as unknown as EvaluationInput['selections']),
        'details.name': 'Bard',
      },
      definitions,
    ),
  );
  const goblin = await s.addGoblin();
  const bardRef = `@{character:${bard}}`;
  const goblinRef = `@{foe:${goblin}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');
  await s.command(`${bardRef} /turn take`, true);
  const start = { bard: (await s.hero(bard)).surges, thorn: (await s.hero(s.f.thornId)).surges };

  // 1. Ballad of the Beast (no action): the Bard and Thorn are members; nothing at the use.
  const ballad = await s.command(
    `${bardRef} /ability use ability=${JSON.stringify('"Ballad of the Beast"')} targets=[${bardRef}, @Thorn]`,
    true,
  );
  const area = ((await s.hero(bard)).effectInstances ?? []).find(
    i => i.sourceUseEventId === ballad.eventId && i.kind === 'area',
  )!;
  expect(area).toMatchObject({
    status: 'active',
    duration: { kind: 'encounter' },
    endsWhen: ['performance'],
  });
  expect(area.members!.map(m => m.party.id)).toEqual([bard, s.f.thornId]);
  // The Bard can't leave an aura that originates from them (rule/combat/aura.md).
  await expect(s.members(area.id, 'remove', bardRef)).rejects.toThrow(/originates from/);
  expect((await s.hero(s.f.thornId)).surges).toBe(start.thorn);

  // 2. A member starting its turn in the area gains 1 surge.
  await s.command(`${bardRef} /turn end`, true);
  await s.command(`${goblinRef} /turn take`);
  await s.command(`${goblinRef} /turn end`);
  await s.command('@Thorn /turn take', true);
  expect((await s.hero(s.f.thornId)).surges).toBe(start.thorn + 1);
  await s.command('@Thorn /turn end', true);

  // 3. Round 2 starts with the Bard able to maintain it; the Bard's own turn start gives 1 surge.
  expect(
    (await s.events()).some(
      e => e.kind === 'effect.maintained' && e.description.includes('Ballad of the Beast'),
    ),
  ).toBe(true);
  await s.command(`${bardRef} /turn take`, true);
  expect((await s.hero(bard)).surges).toBe(start.bard + 1);

  // 4. Choosing Revitalizing Limerick ends the Ballad (and its riders); the Limerick reminds the
  // table at the end of the Bard's turn.
  const limerick = await s.command(
    `${bardRef} /ability use ability="Revitalizing Limerick" targets=[${bardRef}, @Thorn]`,
    true,
  );
  const ended = ((await s.hero(bard)).effectInstances ?? []).find(i => i.id === area.id)!;
  expect(ended.status).toBe('ended');
  expect(ended.endedReason).toMatch(/chose a performance again/);
  for (const r of riders((await s.hero(s.f.thornId)).effectInstances, area.id))
    expect(r.status).toBe('ended');
  const next = ((await s.hero(bard)).effectInstances ?? []).find(
    i => i.sourceUseEventId === limerick.eventId && i.kind === 'area',
  )!;
  // Only the Bard holds the Limerick's rider (who: self).
  expect(next.members!.map(m => [m.party.id, m.effects.length])).toEqual([
    [bard, 1],
    [s.f.thornId, 0],
  ]);
  await s.command(`${bardRef} /turn end`, true);
  expect(
    (await s.events()).some(
      e =>
        e.kind === 'effect.watcher-fired' &&
        e.description.includes('Revitalizing Limerick') &&
        e.description.includes('Each chosen target can spend a Recovery.'),
    ),
  ).toBe(true);

  // 5. Dazed at the start of round 3: the Bard can't maintain it, so it ends.
  await s.command(`${bardRef} /condition on name=dazed`);
  await s.command(`${goblinRef} /turn take`);
  await s.command(`${goblinRef} /turn end`);
  await s.command('@Thorn /turn take', true);
  await s.command('@Thorn /turn end', true);
  const dazed = ((await s.hero(bard)).effectInstances ?? []).find(i => i.id === next.id)!;
  expect(dazed.status).toBe('ended');
  expect(dazed.endedReason).toMatch(/dazed at the start of the round/);
});

test('V200: two Talents’ columns on one goblin form a manual stacking group; neither fires at its turn start', async () => {
  // en/books/heroes/clean/Draw Steel Heroes.md, "Stacking Unique Effects": the same ability used
  // several times doesn't stack. V158's boundary leaves a different user's overlap to the table, so
  // the goblin in both columns takes no automatic damage rather than 2 + 2.
  const s = await setup();
  const talent = (name: string) =>
    admitHero(
      s.t,
      s.f.player,
      s.f.director,
      s.f.campaignId,
      name,
      draftSelectionsFrom(
        {
          ...(talentLedger.witnesses.find(w => w.id === 'v105-2')!
            .selections as unknown as EvaluationInput['selections']),
          'details.name': name,
        },
        definitions,
      ),
    );
  const seer = await talent('Seer');
  const pyre = await talent('Pyre');
  const goblin = await s.addGoblin();
  const goblinRef = `@{foe:${goblin}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', true);
  await s.command('/combat first side=heroes');
  await s.command(`@{character:${seer}} /turn take`, true);
  for (const id of [seer, pyre]) {
    await s.command(`@{character:${id}} /adjust heroic-resource value=2`);
    await atDice(s.t, s.f.campaignId, [1, 1]);
    await s.command(`@{character:${id}} /ability use ability="Incinerate" targets=[${goblinRef}]`);
  }
  expect((await s.foe(goblin)).stamina).toBe(15 - 2 - 2);
  const held = ((await s.foe(goblin)).effectInstances ?? []).filter(i => i.area);
  expect(held).toHaveLength(4);
  const startRiders = held.filter(i => i.area!.rider === 1);
  expect(startRiders.map(i => [i.manualStacking, i.registrationIds.length])).toEqual([
    [true, 0],
    [true, 0],
  ]);
  await s.command(`@{character:${seer}} /turn end`, true);
  await s.command(`${goblinRef} /turn take`);
  expect((await s.foe(goblin)).stamina).toBe(15 - 2 - 2);
});
