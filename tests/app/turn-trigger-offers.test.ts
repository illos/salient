// SPDX-License-Identifier: GPL-3.0-only
/**
 * V202 turn-boundary triggered actions through the registered operations, with persisted readback
 * (docs/build/V202-turn-trigger-offers.md). Expected values come from the pinned Compendium
 * (en/unified/md) and the confirmed table spec, never from a run of the code under test:
 * - feature/ability/censor/level-1/my-life-for-yours.md: Triggered, Ranged 10, Self or one ally;
 *   Trigger "The target starts their turn or takes damage."; Effect "You spend a Recovery and the
 *   target regains Stamina equal to your recovery value."; "Spend 1 Wrath: You can end one effect on
 *   the target that is ended by a saving throw or that ends at the end of their turn, or a prone
 *   target can stand up."
 * - feature/ability/shadow/level-1/hesitation-is-weakness.md: Free triggered, 1 Insight, Self;
 *   Trigger "Another hero ends their turn. That hero can't have used this ability to start their
 *   turn."; Effect "You take your turn after the triggering hero."
 * - feature/censor/level-1/wrath.md: "At the start of each of your turns during combat, you gain 2
 *   wrath." (Victories 0, so wrath starts at 0.)
 * - rule/combat/triggered-action.md: one triggered action per round; a free triggered action
 *   "doesn't count against your limit"; condition/dazed.md: a dazed creature "can't use triggered
 *   actions, free triggered actions, or free maneuvers".
 * - docs/table-spec.md, "Standing action-card/prompt window": responses stay "through the gap after
 *   the current individual turn ends, with next individual turn start as the outer turn-based
 *   cutoff", including "opportunities first created by a turn ending, such as Hesitation Is
 *   Weakness"; "Explicit End combat also closes unused optional combat responses". "Clarified
 *   existing precedent": the cutoff follows the triggering event and subsequent play by the
 *   affected character.
 * - docs/decisions/2026-09-24-automation-rulings.md, ruling 4: the owner uses it; the Director can
 *   act for them.
 */
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { assertNoTriggerOnCorrection } from '../../convex/lib/triggeredActions';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { CompiledResult } from '../../shared/contracts/compiledResult';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import censorLedger from '../fixtures/v99-censor-expected.json' with { type: 'json' };
import shadowLedger from '../fixtures/v92-shadow-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');
const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';
const LIFE = 'feature/ability/censor/level-1/my-life-for-yours.md';
const HESITATION = 'feature/ability/shadow/level-1/hesitation-is-weakness.md';

let sequence = 0;
async function setup(heroes: { name: string; selections: unknown }[]) {
  // Turn boundaries are a hot path: enforce Convex's limits.
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const ids: Record<string, Id<'characters'>> = {};
  for (const hero of heroes)
    ids[hero.name] = await admitHero(
      t,
      f.player,
      f.director,
      f.campaignId,
      hero.name,
      draftSelectionsFrom(
        {
          ...(hero.selections as EvaluationInput['selections']),
          'details.name': hero.name,
        },
        definitions,
      ),
    );
  const command = (text: string, who: 'director' | 'player' = 'director') =>
    f[who].client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `turn-trigger-${++sequence}`,
      text,
    });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: `turn-trigger-${++sequence}`,
  });
  const ref = (name: string) => `@{character:${ids[name]}}`;
  const cards = () =>
    t.run(async ctx =>
      (await ctx.db.query('interactions').take(100)).filter(c => c.kind === 'triggered-offer'),
    );
  const open = async () => (await cards()).filter(c => c.status === 'awaiting-input');
  const card = async (id: Id<'interactions'>) => t.run(ctx => ctx.db.get(id));
  const event = async (id: Id<'events'>) => (await t.run(ctx => ctx.db.get(id)))!;
  const hero = async (name: string) => (await t.run(ctx => ctx.db.get(ids[name]!)))!;
  const uses = (name: string) =>
    t.run(async ctx =>
      (await ctx.db.query('actionUses').take(100)).filter(u => u.actor.id === ids[name]),
    );
  const respond = (
    id: Id<'interactions'>,
    who: 'director' | 'player',
    answer: Record<string, unknown> = {},
  ) =>
    f[who].client.mutation(api.interactions.respond, {
      interactionId: id,
      answer,
      commandId: `turn-trigger-${++sequence}`,
    });
  const encounter = () =>
    t.run(async ctx => (await ctx.db.query('encounters').take(10)).find(e => !e.archivedAt)!);
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', 'player');
  await command('/combat first side=heroes');
  return {
    t,
    f,
    ids,
    goblinRef: `@{foe:${goblin}}`,
    ref,
    command,
    cards,
    open,
    card,
    event,
    hero,
    uses,
    respond,
    encounter,
  };
}

test('V202: My Life for Yours at an ally’s turn start: dazed, undo, early close, Director acceptance, one per round', async () => {
  const s = await setup([{ name: 'Warden', selections: censorLedger.witnesses[0]!.selections }]);
  const warden = s.ref('Warden');
  const holders = await s.t.run(ctx => ctx.db.query('triggerHolders').take(10));
  expect(holders).toMatchObject([
    {
      owner: { id: s.ids.Warden },
      abilityName: 'My Life for Yours',
      actionType: 'triggered action',
      trigger: { event: 'turn-start', whose: 'target', orDamageTaken: true },
      spend: { cost: 'Spend 1 Wrath', resource: 'wrath', amount: 1, variable: false },
    },
  ]);

  // condition/dazed.md: a dazed Censor is offered nothing at Thorn's turn start.
  await s.command(`${warden} /condition on name=dazed`);
  await s.command('@Thorn /turn take', 'player');
  expect(await s.cards()).toEqual([]);
  await s.command('/history undo');
  await s.command(`${warden} /condition off name=dazed`);

  // Thorn, an ally, starts their turn: the card is on the clock's turn-start entry.
  const take = await s.command('@Thorn /turn take', 'player');
  const [first] = await s.open();
  expect(first).toBeDefined();
  const boundary = await s.event(first!.openedEventId);
  expect(boundary).toMatchObject({ kind: 'clock.boundary', causeEventId: take.eventId });
  expect(boundary.description).toBe("Thorn's turn begins (round 1).");
  expect(first).toMatchObject({
    operation: 'ability.use',
    boundActor: { kind: 'character', id: s.ids.Warden },
    requesterId: s.f.player.profile.userId,
    offer: {
      abilityName: 'My Life for Yours',
      target: { kind: 'character', name: 'Thorn' },
      triggeringEventId: first!.openedEventId,
      damage: 0,
      boundary: { kind: 'turn-start', creature: { name: 'Thorn' } },
      spend: { cost: 'Spend 1 Wrath', amount: 1 },
      distance: 'within 10 squares (ranged): the table confirms',
    },
  });
  const offered = await s.t.run(async ctx =>
    (await ctx.db.query('events').take(500)).filter(e => e.kind === 'trigger.offered'),
  );
  expect(offered.map(e => e.causeEventId)).toEqual([first!.openedEventId]);

  // The affected character's own play closes the response to their turn start (table spec,
  // "Clarified existing precedent"); undo of that play reopens it.
  const aid = await s.command(`@Thorn /ability use ability="Aid Attack" targets=[${s.goblinRef}]`);
  expect(await s.card(first!._id)).toMatchObject({
    status: 'closed',
    resolvedEventId: aid.eventId,
  });
  await s.command('/history undo');
  expect(await s.card(first!._id)).toMatchObject({ status: 'awaiting-input' });
  // Undo of the Take turn withdraws the card with its turn.
  await s.command('/history undo');
  expect(await s.card(first!._id)).toBeNull();
  expect(await s.cards()).toEqual([]);

  // Take turn again. "You spend a Recovery": with none left, accepting is refused and the card
  // stays open.
  await s.command('@Thorn /turn take', 'player');
  const [second] = await s.open();
  const thornId = second!.offer.target.id as Id<'characters'>;
  const thorn = async () => (await s.t.run(ctx => ctx.db.get(thornId)))!.liveState!;
  await s.command(`${warden} /adjust heroic-resource value=1`);
  await s.command(`${warden} /adjust recoveries value=0`);
  await expect(s.respond(second!._id, 'director', { spend: 1 })).rejects.toThrow(
    /no Recoveries left/,
  );
  expect(await s.card(second!._id)).toMatchObject({ status: 'awaiting-input' });
  // The Director accepts for the player, spending 1 Wrath: the Censor spends a Recovery (2 → 1) and
  // Thorn regains the Censor's recovery value (the ledger's 8): 5 → 13.
  await s.command(`${warden} /adjust recoveries value=2`);
  await s.command('@Thorn /adjust stamina value=5');
  const accepted = await s.respond(second!._id, 'director', { spend: 1 });
  const use = await s.event(accepted.eventId);
  expect(use.kind).toBe('ability.use');
  expect((use.payload as { data: { trigger: unknown } }).data.trigger).toMatchObject({
    interactionId: second!._id,
    triggeringEventId: second!.openedEventId,
  });
  expect(use.description).toContain(
    'Warden spends a Recovery (2 → 1) and Thorn regains 8 Stamina (5 → 13).',
  );
  expect((await s.hero('Warden')).liveState!.recoveries).toBe(1);
  expect((await thorn()).stamina).toBe(5 + censorLedger.witnesses[0]!.expected.recoveryValue);
  expect((await s.hero('Warden')).liveState!.heroicResource).toEqual({
    name: 'wrath',
    current: 0,
  });
  expect(await s.card(second!._id)).toMatchObject({
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
      kind: 'rider',
      shape: 'recovery-transfer',
      status: 'applied',
      targetId: thornId,
      recovery: { recoveriesBefore: 2, recoveriesAfter: 1, staminaBefore: 5, staminaAfter: 13 },
    },
    { kind: 'response-spend', status: 'spent', amount: 1, resource: 'wrath' },
  ]);
  expect(await s.uses('Warden')).toMatchObject([{ actionType: 'triggered action', round: 1 }]);
  // The card's Spend paid the 1 Wrath, so the hand-paid part warns that it pays it again.
  await s.command(`${warden} /adjust heroic-resource value=1`);
  const cleanse = await s.command(
    `${warden} /ability use ability="My Life for Yours: Cleanse" targets=[@Thorn]`,
  );
  expect((await s.event(cleanse.eventId)).description).toContain(
    "Rule warning: Warden's My Life for Yours this round already paid its Spend on its card",
  );

  // One per round: the Censor's own turn start (Self) offers nothing more this round. Its turn
  // start still gains 2 wrath (wrath.md).
  await s.command('@Thorn /turn end', 'player');
  await s.command(`${warden} /turn take`, 'player');
  expect(await s.open()).toEqual([]);
  expect((await s.hero('Warden')).liveState!.heroicResource.current).toBe(2);
  expect((await s.cards()).map(c => c._id)).toEqual([second!._id]);
  expect((await s.t.run(ctx => ctx.db.get(accepted.eventId)))!.description).toMatch(
    /My Life for Yours/,
  );
  expect(first!.offer).toMatchObject({
    trigger: { text: 'The target starts their turn or takes damage.' },
  });
  expect((holders[0]!.sourcePath as string).endsWith(LIFE)).toBe(true);
});

test('V202: Hesitation Is Weakness at another hero’s turn end: window, pass, player acceptance, turn order, combat end', async () => {
  const s = await setup([
    { name: 'Shade', selections: shadowLedger.witnesses[0]!.selections },
    { name: 'Umbra', selections: shadowLedger.witnesses[1]!.selections },
  ]);
  const shade = s.ref('Shade');
  const umbra = s.ref('Umbra');

  // Thorn's turn start offers nothing: the trigger is a turn end.
  await s.command('@Thorn /turn take', 'player');
  expect(await s.cards()).toEqual([]);
  const end = await s.command('@Thorn /turn end', 'player');
  const offers = await s.open();
  expect(offers.map(c => c.offer.owner.name).sort()).toEqual(['Shade', 'Umbra']);
  for (const offer of offers) {
    expect(await s.event(offer.openedEventId)).toMatchObject({
      kind: 'clock.boundary',
      causeEventId: end.eventId,
      description: "Thorn's turn ends (round 1).",
    });
    expect(offer.offer).toMatchObject({
      abilityName: 'Hesitation Is Weakness',
      actionType: 'free triggered action',
      boundary: { kind: 'turn-end', creature: { name: 'Thorn' } },
      takesTurn: true,
      distance: 'self',
    });
  }
  const shadeCard = offers.find(c => c.offer.owner.name === 'Shade')!;
  const umbraCard = offers.find(c => c.offer.owner.name === 'Umbra')!;

  // The player accepts in the gap after Thorn's turn end: 1 Insight, and Shade goes next.
  await s.command(`${shade} /adjust heroic-resource value=1`);
  const accepted = await s.respond(shadeCard._id, 'player');
  expect((await s.event(accepted.eventId)).kind).toBe('ability.use');
  expect((await s.hero('Shade')).liveState!.heroicResource).toEqual({
    name: 'insight',
    current: 0,
  });
  expect(await s.uses('Shade')).toMatchObject([{ actionType: 'free triggered action' }]);
  expect((await s.encounter()).turnAfter).toMatchObject({
    actorId: s.ids.Shade,
    afterName: 'Thorn',
    abilityName: 'Hesitation Is Weakness',
  });
  // Only one creature takes the next turn: Umbra's card closes with Shade's acceptance, so Umbra
  // can't pay for a turn Shade already holds.
  expect(await s.card(umbraCard._id)).toMatchObject({
    status: 'closed',
    resolvedEventId: accepted.eventId,
  });
  await s.command(`${umbra} /adjust heroic-resource value=1`);
  await expect(s.respond(umbraCard._id, 'player')).rejects.toThrow(/already closed/);
  expect(await s.uses('Umbra')).toEqual([]);
  expect((await s.hero('Umbra')).liveState!.heroicResource.current).toBe(1);

  // Shade takes their turn after Thorn: no side-order warning, and the turn records what started it.
  const take = await s.command(`${shade} /turn take`, 'player');
  const taken = await s.event(take.eventId);
  expect(taken.description).toContain(
    'Shade takes their turn after Thorn (Hesitation Is Weakness).',
  );
  expect(taken.description).not.toContain('Rule warning');
  const encounter = await s.encounter();
  expect(encounter.turnAfter).toBeNull();
  const shadeTurn = await s.t.run(ctx => ctx.db.get(encounter.activeTurnId!));
  expect(shadeTurn).toMatchObject({
    actor: { id: s.ids.Shade },
    startedBy: { useEventId: accepted.eventId, abilityName: 'Hesitation Is Weakness' },
  });
  expect(shadeTurn!.startedBy!.sourcePath.endsWith(HESITATION)).toBe(true);

  // "That hero can't have used this ability to start their turn": Shade's turn end offers Umbra
  // nothing.
  await s.command(`${shade} /turn end`, 'player');
  expect(await s.open()).toEqual([]);
  // Q-TURNTRIG-1: Umbra's own turn end offers Shade nothing, since Shade has no turn left this round.
  await s.command(`${umbra} /turn take`, 'player');
  await s.command(`${umbra} /turn end`, 'player');
  expect(await s.open()).toEqual([]);

  // Round 2: Thorn's turn end offers both again. Umbra passes (nothing is applied); ending combat
  // closes Shade's, which can't be accepted after.
  await s.command(`${s.goblinRef} /turn take`);
  await s.command(`${s.goblinRef} /turn end`);
  expect((await s.encounter()).round).toBe(2);
  await s.command('@Thorn /turn take', 'player');
  await s.command('@Thorn /turn end', 'player');
  const later = await s.open();
  expect(later).toHaveLength(2);
  expect(later.every(c => c.offer.round === 2)).toBe(true);
  const umbraLater = later.find(c => c.offer.owner.name === 'Umbra')!;
  const shadeLater = later.find(c => c.offer.owner.name === 'Shade')!;
  await s.f.player.client.mutation(api.interactions.close, {
    interactionId: umbraLater._id,
    commandId: `turn-trigger-${++sequence}`,
  });
  expect(await s.card(umbraLater._id)).toMatchObject({ status: 'closed' });
  expect(await s.uses('Umbra')).toEqual([]);
  await s.command('/combat end');
  expect(await s.open()).toEqual([]);
  await expect(s.respond(shadeLater._id, 'player')).rejects.toThrow(/already closed/);
});

test('V202: an unanswered turn-end card closes when the next individual turn starts', async () => {
  const s = await setup([{ name: 'Shade', selections: shadowLedger.witnesses[0]!.selections }]);
  await s.command('@Thorn /turn take', 'player');
  await s.command('@Thorn /turn end', 'player');
  const [card] = await s.open();
  expect(card).toMatchObject({ offer: { abilityName: 'Hesitation Is Weakness' } });
  // The Director's side acts next; its turn start is the outer window.
  const goblinTurn = await s.command(`${s.goblinRef} /turn take`);
  expect(await s.card(card!._id)).toMatchObject({
    status: 'closed',
    resolvedEventId: goblinTurn.eventId,
  });
  await expect(s.respond(card!._id, 'player')).rejects.toThrow(/already closed/);
  expect(await s.uses('Shade')).toEqual([]);
});

test('V202: "or takes damage" is the damage writer’s offer for the same target', async () => {
  const s = await setup([{ name: 'Warden', selections: censorLedger.witnesses[0]!.selections }]);
  // monster/goblin/statblock/goblin-warrior.md, Spear Charge: at least 3 damage on any tier, and
  // Thorn has no immunity to it.
  await s.command(`${s.goblinRef} /turn take`);
  const hit = await s.command(
    `${s.goblinRef} /ability use ability="Spear Charge" targets=[@Thorn]`,
  );
  const [card] = await s.open();
  expect(card).toMatchObject({
    openedEventId: hit.eventId,
    offer: {
      abilityName: 'My Life for Yours',
      target: { name: 'Thorn' },
      damaged: { name: 'Thorn' },
      spend: { cost: 'Spend 1 Wrath', amount: 1 },
    },
  });
  expect(card!.offer.damage).toBeGreaterThanOrEqual(3);
  expect(card!.offer.boundary).toBeUndefined();
});

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

test('V202: a correction that keeps the Censor damaged passes; one that removes the damage is refused', async () => {
  const s = await setup([{ name: 'Warden', selections: censorLedger.witnesses[0]!.selections }]);
  const warden = s.ref('Warden');
  await s.command(`${warden} /adjust stamina value=20`);
  await s.command(`${s.goblinRef} /turn take`);
  // monster/goblin/statblock/goblin-warrior.md, Spear Charge, Power Roll + 2: 5 + 5 + 2 = 12 is
  // tier 2, 4 damage; a double edge raises it one tier (rule/dice/power-roll.md): tier 3, 5 damage.
  await atDice(s.t, s.f.campaignId, [5, 5]);
  const hit = await s.command(
    `${s.goblinRef} /ability use ability="Spear Charge" targets=[${warden}]`,
  );
  expect((await s.hero('Warden')).liveState!.stamina).toBe(16);
  await s.command(`/ability correct event="${hit.eventId}" target=${warden} edges=2`);
  expect((await s.hero('Warden')).liveState!.stamina).toBe(15);
  // No registered correction of this hit takes all its damage away, so the rule is read directly:
  // damage taken 4 → 0 changes whether "the target takes damage" occurred and is refused; 4 → 6
  // doesn't.
  await s.t.run(async ctx => {
    const scope = { campaignId: s.f.campaignId, eventId: hit.eventId as Id<'events'> };
    const damaged = { kind: 'character' as const, id: s.ids.Warden!, name: 'Warden' };
    await assertNoTriggerOnCorrection(
      ctx as never,
      scope as never,
      { damaged, amount: 2 },
      {
        before: 4,
        after: 6,
      },
    );
    await expect(
      assertNoTriggerOnCorrection(
        ctx as never,
        scope as never,
        { damaged, amount: -4 },
        {
          before: 4,
          after: 0,
        },
      ),
    ).rejects.toThrow(/My Life for Yours/);
  });
});
