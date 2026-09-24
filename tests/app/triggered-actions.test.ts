// SPDX-License-Identifier: GPL-3.0-only
/**
 * V173 triggered actions through the registered operations, with persisted readback. Expected
 * values come from the pinned Compendium (en/unified/md), never from a run of the code under test:
 * - feature/ability/talent/level-1/feedback-loop.md: Triggered, Ranged 10, One creature; Trigger
 *   "The target deals damage to an ally."; Effect "The target takes psychic damage equal to half the
 *   triggering damage."
 * - rule/general/always-round-down.md: 5 halved is 2.
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, no immunity or weakness; Spear Charge,
 *   Power Roll + 2: ≤11 3 damage, 12-16 4 damage, 17+ 5 damage. rule/dice/power-roll.md: 8 + 8 + 2
 *   = 18 is tier 3 (5 damage); 5 + 5 + 2 = 12 is tier 2 (4 damage).
 * - rule/combat/triggered-action.md: one triggered action per round; condition/dazed.md: a dazed
 *   creature can't use triggered actions.
 * - docs/table-spec.md, "Inline interaction cards in the game log": the window lasts until the next
 *   individual turn starts; committing an unrelated ability passes the earlier offer.
 * - docs/decisions/2026-09-24-automation-rulings.md, ruling 4: the owner uses it; the Director can
 *   act for them.
 * - feature/ability/troubadour/level-1/riposte.md: Triggered, Melee 1, Self or one ally; Trigger "The
 *   target takes damage from a melee strike."; Effect "The target makes a free strike against the
 *   creature who made the triggering strike." Spear Charge is a Melee Strike (its keywords).
 * The Talent is the reviewed v105-3 witness (Telepathy tradition: Feedback Loop) and the Troubadour
 * the v102-2 witness (Riposte), both owned by the player, as Thorn is.
 */
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { api, internal } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { CompiledResult } from '../../shared/contracts/compiledResult';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import talentLedger from '../fixtures/v105-talent-expected.json' with { type: 'json' };
import troubadourLedger from '../fixtures/v102-troubadour-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');
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
async function setup(options: { bard?: boolean } = {}) {
  // The damage writer is a hot path (tests/app/party-read-limit.test.ts): enforce Convex's limits.
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const seer = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Seer',
    draftSelectionsFrom(
      {
        ...(talentLedger.witnesses.find(w => w.id === 'v105-3')!
          .selections as unknown as EvaluationInput['selections']),
        'details.name': 'Seer',
      },
      definitions,
    ),
  );
  const bard = options.bard
    ? await admitHero(
        t,
        f.player,
        f.director,
        f.campaignId,
        'Bard',
        draftSelectionsFrom(
          {
            ...(troubadourLedger.witnesses.find(w => w.id === 'v102-2')!
              .selections as unknown as EvaluationInput['selections']),
            'details.name': 'Bard',
          },
          definitions,
        ),
      )
    : undefined;
  const command = (text: string, who: 'director' | 'player' = 'director') =>
    f[who].client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `triggered-${++sequence}`,
      text,
    });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: `triggered-${++sequence}`,
  });
  const goblinRef = `@{foe:${goblin}}`;
  const seerRef = `@{character:${seer}}`;
  const goblinStamina = async () => (await t.run(ctx => ctx.db.get(goblin)))!.live.stamina;
  const cards = () =>
    t.run(async ctx =>
      (await ctx.db.query('interactions').take(100)).filter(c => c.kind === 'triggered-offer'),
    );
  const card = async (id: Id<'interactions'>) => (await t.run(ctx => ctx.db.get(id)))!;
  const seerUses = () =>
    t.run(async ctx =>
      (await ctx.db.query('actionUses').take(100)).filter(u => u.actor.id === seer),
    );
  const strike = async (faces: [number, number]) => {
    await atDice(t, f.campaignId, faces);
    return command(`${goblinRef} /ability use ability="Spear Charge" targets=[@Thorn]`);
  };
  const respond = (id: Id<'interactions'>, who: 'director' | 'player') =>
    f[who].client.mutation(api.interactions.respond, {
      interactionId: id,
      answer: {},
      commandId: `triggered-${++sequence}`,
    });
  // Combat with the goblin's side first, and the goblin's turn in progress.
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', 'player');
  await command('/combat first side=foes');
  await command(`${goblinRef} /turn take`);
  return {
    t,
    f,
    seer,
    bard,
    goblin,
    goblinRef,
    seerRef,
    command,
    goblinStamina,
    cards,
    card,
    seerUses,
    strike,
    respond,
  };
}

test('V173: Feedback Loop is offered on the goblin’s hit, accepted by the Director for the player, and undone', async () => {
  const s = await setup();
  // Combat commit registered the Talent's compiled triggered ability.
  const holders = await s.t.run(ctx => ctx.db.query('triggerHolders').take(10));
  expect(holders).toMatchObject([
    {
      owner: { kind: 'character', id: s.seer, name: 'Seer' },
      abilityName: 'Feedback Loop',
      actionType: 'triggered action',
      trigger: { event: 'damage-dealt', whose: 'target', damaged: 'ally' },
    },
  ]);

  // 1. Spear Charge 8 + 8 + 2 = 18, tier 3: 5 damage to Thorn, an ally of the Talent.
  const hit = await s.strike([8, 8]);
  const [offer] = await s.cards();
  expect(offer).toMatchObject({
    status: 'awaiting-input',
    operation: 'ability.use',
    openedEventId: hit.eventId,
    boundActor: { kind: 'character', id: s.seer },
    requesterId: s.f.player.profile.userId,
    offer: {
      abilityName: 'Feedback Loop',
      actionType: 'triggered action',
      target: { kind: 'foe', id: s.goblin },
      triggeringEventId: hit.eventId,
      damage: 5,
      distance: 'within 10 squares (ranged): the table confirms',
    },
  });
  const offered = await s.t.run(async ctx =>
    (await ctx.db.query('events').take(4000)).filter(e => e.kind === 'trigger.offered'),
  );
  expect(offered).toHaveLength(1);
  expect(offered[0]!.causeEventId).toBe(hit.eventId);
  // Headless inspection: the player may answer their hero's card; the observer may not.
  const pending = await s.f.player.client.query(api.interactions.list, {
    campaignId: s.f.campaignId,
  });
  expect(pending.find(c => c.id === offer!._id)).toMatchObject({
    kind: 'triggered-offer',
    mayAnswer: true,
  });
  expect(offered[0]!.description).toContain('Seer may use Feedback Loop');
  expect(await s.goblinStamina()).toBe(15);

  // A correction that changes the damage can't re-derive an offer (design section 7): a bane makes
  // 18 − 2 = 16, tier 2 (4 damage), so it is refused and the table rewinds to the use instead.
  await expect(
    s.command(`/ability correct event="${hit.eventId}" target=@Thorn banes=1`),
  ).rejects.toThrow(/Feedback Loop is a triggered action this damage sets off/);

  // 2. The Director accepts for the player's hero: half of 5, rounded down, is 2 psychic damage.
  const accepted = await s.respond(offer!._id, 'director');
  expect(await s.goblinStamina()).toBe(13);
  const use = (await s.t.run(ctx => ctx.db.get(accepted.eventId)))!;
  expect(use.kind).toBe('ability.use');
  expect(use.causeEventId).toBe(hit.eventId);
  expect((use.payload as { data: { trigger: unknown } }).data.trigger).toMatchObject({
    interactionId: offer!._id,
    triggeringEventId: hit.eventId,
    damage: 5,
    acceptanceOrder: 1,
  });
  expect(await s.card(offer!._id)).toMatchObject({
    status: 'resolved',
    resolvedEventId: accepted.eventId,
  });
  const result = await s.t.run(ctx =>
    ctx.db
      .query('abilityResults')
      .withIndex('by_event', q => q.eq('eventId', accepted.eventId))
      .unique(),
  );
  expect((result!.compiled as CompiledResult).effects.map(o => o.effect)).toMatchObject([
    {
      kind: 'triggered-damage',
      status: 'calculated',
      targetId: s.goblin,
      triggeringDamage: 5,
      amount: 2,
      application: { staminaBefore: 15, staminaAfter: 13 },
    },
  ]);
  expect(await s.seerUses()).toMatchObject([{ actionType: 'triggered action', round: 1 }]);

  // 3. Undo of the acceptance restores the goblin, reopens the card and releases the allowance.
  await s.command('/history undo');
  expect(await s.goblinStamina()).toBe(15);
  expect(await s.card(offer!._id)).toMatchObject({ status: 'awaiting-input' });
  expect(await s.seerUses()).toEqual([]);

  // 4. The player accepts it for their own hero; then the per-round limit: the goblin's next hit
  // on Thorn in the same round offers the Talent nothing.
  await s.respond(offer!._id, 'player');
  expect(await s.goblinStamina()).toBe(13);
  await s.strike([5, 5]);
  expect((await s.cards()).filter(c => c.status === 'awaiting-input')).toEqual([]);
  expect(await s.cards()).toHaveLength(1);
});

test('V173: pass, early close, expiry at the next turn start, and the re-check on accept', async () => {
  const s = await setup();
  // Pass: the player closes the card; nothing is applied and the allowance stays free.
  await s.strike([5, 5]);
  const [first] = await s.cards();
  await s.f.player.client.mutation(api.interactions.close, {
    interactionId: first!._id,
    commandId: `triggered-${++sequence}`,
  });
  expect(await s.card(first!._id)).toMatchObject({ status: 'closed' });
  expect(await s.goblinStamina()).toBe(15);
  expect(await s.seerUses()).toEqual([]);

  // Re-check on accept: the Talent is dazed after the offer (condition/dazed.md), so accepting is
  // refused and the card stays open; once dazed ends, accepting works.
  await s.strike([5, 5]);
  const second = (await s.cards()).find(c => c.status === 'awaiting-input')!;
  expect(second.offer).toMatchObject({ damage: 4 });
  await s.command(`${s.seerRef} /condition on name=dazed`);
  await expect(s.respond(second._id, 'player')).rejects.toThrow(/dazed/);
  expect(await s.card(second._id)).toMatchObject({ status: 'awaiting-input' });
  expect(await s.goblinStamina()).toBe(15);
  // A dazed Talent is offered nothing for a new hit (a prevention blocks both kinds).
  await s.strike([5, 5]);
  expect((await s.cards()).filter(c => c.status === 'awaiting-input')).toHaveLength(1);
  await s.command(`${s.seerRef} /condition off name=dazed`);

  // Early close: a third hit opens a competing offer; the Talent then commits an unrelated
  // ability (Mind Spike on the goblin), which passes both open offers.
  await s.strike([5, 5]);
  const open = (await s.cards()).filter(c => c.status === 'awaiting-input');
  expect(open).toHaveLength(2);
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const spike = await s.command(
    `${s.seerRef} /ability use ability="Mind Spike" targets=[${s.goblinRef}]`,
  );
  for (const c of open)
    expect(await s.card(c._id)).toMatchObject({ status: 'closed', resolvedEventId: spike.eventId });

  // Expiry: a new offer stays open through the goblin's turn end, and closes when the next
  // individual turn (Thorn's) starts.
  await s.t.run(async ctx => {
    const foe = (await ctx.db.get(s.goblin))!;
    await ctx.db.patch(s.goblin, { live: { ...foe.live, stamina: 15 } });
  });
  // Mind Spike used the Talent's main action, not its triggered action: it is still offered.
  await s.strike([5, 5]);
  const last = (await s.cards()).find(c => c.status === 'awaiting-input')!;
  await s.command(`${s.goblinRef} /turn end`);
  expect(await s.card(last._id)).toMatchObject({ status: 'awaiting-input' });
  const take = await s.command('@Thorn /turn take', 'player');
  expect(await s.card(last._id)).toMatchObject({ status: 'closed', resolvedEventId: take.eventId });
  await expect(s.respond(last._id, 'player')).rejects.toThrow(/already closed/);
});

test('V173: a triggered ability used by hand counts against the round, with a warning the second time', async () => {
  const s = await setup();
  const use = () =>
    s.command(
      `${s.seerRef} /ability use ability="Feedback Loop" targets=[${s.goblinRef}]`,
      'player',
    );
  const first = await use();
  // By hand the triggering damage is unknown: the table applies it; nothing changes here.
  expect(await s.goblinStamina()).toBe(15);
  const event = (await s.t.run(ctx => ctx.db.get(first.eventId))) as Doc<'events'>;
  expect(event.description).toContain('For the table');
  expect(await s.seerUses()).toMatchObject([{ actionType: 'triggered action', round: 1 }]);
  const second = await use();
  expect((await s.t.run(ctx => ctx.db.get(second.eventId)))!.description).toMatch(
    /already used a triggered action this round/,
  );
});

test('V173: two responses to one melee strike are each offered and resolve in acceptance order', async () => {
  const s = await setup({ bard: true });
  const hit = await s.strike([5, 5]);
  const offers = (await s.cards()).filter(c => c.offer?.triggeringEventId === hit.eventId);
  const riposte = offers.find(c => c.offer.abilityName === 'Riposte')!;
  const feedback = offers.find(c => c.offer.abilityName === 'Feedback Loop')!;
  expect(offers).toHaveLength(2);
  // Riposte targets the damaged ally, Thorn; Feedback Loop the goblin who dealt the damage.
  expect(riposte).toMatchObject({
    boundActor: { id: s.bard },
    offer: { target: { kind: 'character', id: s.f.thornId }, damage: 4 },
  });
  expect(feedback.offer).toMatchObject({ target: { kind: 'foe', id: s.goblin } });
  // Nothing resolves by arrival: the player accepts Riposte first, then Feedback Loop.
  expect(await s.goblinStamina()).toBe(15);
  const first = await s.respond(riposte._id, 'player');
  const firstEvent = (await s.t.run(ctx => ctx.db.get(first.eventId)))!;
  expect((firstEvent.payload as { data: { trigger: unknown } }).data.trigger).toMatchObject({
    acceptanceOrder: 1,
  });
  // The free strike is Thorn's own use, recorded by the table.
  expect(firstEvent.description).toContain('For the table (Thorn)');
  // Another owner's response to the same trigger stays open.
  expect(await s.card(feedback._id)).toMatchObject({ status: 'awaiting-input' });
  const second = await s.respond(feedback._id, 'player');
  const secondEvent = (await s.t.run(ctx => ctx.db.get(second.eventId)))!;
  expect((secondEvent.payload as { data: { trigger: unknown } }).data.trigger).toMatchObject({
    acceptanceOrder: 2,
  });
  expect(await s.goblinStamina()).toBe(13);
  const uses = await s.t.run(async ctx => ctx.db.query('actionUses').take(100));
  expect(
    uses
      .filter(u => u.actionType === 'triggered action')
      .map(u => u.actor.name)
      .sort(),
  ).toEqual(['Bard', 'Seer']);
});
