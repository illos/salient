// SPDX-License-Identifier: GPL-3.0-only
/**
 * V174 damage-changing responses through the registered operations, with persisted readback.
 * Accepting the card revises the hit (docs/decisions/2026-09-24-automation-rulings.md, ruling 3;
 * docs/lasting-effects-design.md#5b-response-revision-accounting-ruling-3-option-b). Expected
 * values come from the pinned Compendium (en/unified/md), never from a run of the code under test:
 * - feature/ability/null/level-1/inertial-shield.md: Triggered, Self; Trigger "You take damage.";
 *   Effect "You take half the damage."; Spend 1 Discipline: "The potency of one effect associated
 *   with the damage is reduced by 1 for you."
 * - feature/ability/fury/level-1/unearthly-reflexes.md: Triggered, Self; "You take half the damage
 *   from the triggering effect …".
 * - feature/ability/tactician/level-1/parry.md: Triggered, Self or one ally; Trigger "A creature
 *   deals damage to the target."; "… the target takes half the damage. If the damage has any
 *   potency effect associated with it, the potency is decreased by 1."
 * - rule/general/always-round-down.md: 7 halved is 3; 5 halved is 2; 1 halved is 0.
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, Free Strike 1; Spear Charge, Power Roll
 *   + 2, 17+ 5 damage; Bury the Point (2 Malice), Power Roll + 2, 17+ "7 damage; M < 2 bleeding
 *   (save ends)". rule/dice/power-roll.md: 8 + 8 + 2 = 18 is tier 3.
 * - feature/ability/talent/level-1/mind-spike.md: Power Roll + Reason, 17+ "6 + R psychic damage".
 * - rule/character/potency.md: an effect applies only if its potency is higher than the score.
 * - rule/health/winded.md: winded at or below the winded value (the fixtures' expected values).
 * - feature/fury/level-1/ferocity.md: "the first time each combat round that you take damage, you
 *   gain 1 ferocity"; "The first time you become winded or are dying in an encounter, you gain 1d3
 *   ferocity."
 * - rule/combat/triggered-action.md: one triggered action per round.
 * Heroes: the Null is v103-1 (Stamina 21, winded 10, Might 2), the Fury v101-panther (Reaver:
 * Stamina 27, winded 13), the Tactician v94-tactician-3 (Vanguard: Parry) and the Talent v105-3
 * (Stamina 18, winded 9, Might 1, Reason 2), and the Elementalist v104-2 (Earth: Skin Like Castle
 * Walls; Reason 2), all owned by the player.
 * - elementalist/level-1/skin-like-castle-walls.md: Self or one ally; "The target takes half the
 *   damage." feature/elementalist/level-1/persistent-magic.md: "If you take damage equal to or
 *   greater than 5 times your Reason score in one turn, you stop maintaining any persistent
 *   abilities."
 * - rule/health/temporary-stamina.md: "the temporary Stamina decreases first".
 */
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { appendEvent } from '../../convex/lib/events';
import { applyEffectInstance } from '../../convex/lib/effectInstances';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { CompiledResult } from '../../shared/contracts/compiledResult';
import type { Watcher } from '../../shared/contracts/liveState';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import nullLedger from '../fixtures/v103-null-expected.json' with { type: 'json' };
import furyLedger from '../fixtures/v101-fury-expected.json' with { type: 'json' };
import tacticianLedger from '../fixtures/v94-tactician-expected.json' with { type: 'json' };
import talentLedger from '../fixtures/v105-talent-expected.json' with { type: 'json' };
import elementalistLedger from '../fixtures/v104-elementalist-expected.json' with { type: 'json' };
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

type Witness = { ledger: { witnesses: { id: string; selections: unknown }[] }; id: string };
const NULL: Witness = { ledger: nullLedger, id: 'v103-1' };
const FURY: Witness = { ledger: furyLedger, id: 'v101-panther' };
const TACTICIAN: Witness = { ledger: tacticianLedger, id: 'v94-tactician-3' };
const TALENT: Witness = { ledger: talentLedger, id: 'v105-3' };
const ELEMENTALIST: Witness = { ledger: elementalistLedger, id: 'v104-2' };
/** v103-4: a Null with Might −1 (Stamina 21). */
const NULL_WEAK: Witness = { ledger: nullLedger, id: 'v103-4' };

let sequence = 0;
async function setup(heroes: Record<string, Witness>) {
  // The damage writer is a hot path (tests/app/party-read-limit.test.ts): enforce Convex's limits.
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const ids: Record<string, Id<'characters'>> = {};
  for (const [name, witness] of Object.entries(heroes))
    ids[name] = await admitHero(
      t,
      f.player,
      f.director,
      f.campaignId,
      name,
      draftSelectionsFrom(
        {
          ...(witness.ledger.witnesses.find(w => w.id === witness.id)!
            .selections as EvaluationInput['selections']),
          'details.name': name,
        },
        definitions,
      ),
    );
  const command = (text: string, who: 'director' | 'player' = 'director') =>
    f[who].client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `reactions-${++sequence}`,
      text,
    });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: `reactions-${++sequence}`,
  });
  const goblinRef = `@{foe:${goblin}}`;
  const ref = (name: string) => `@{character:${ids[name]}}`;
  const live = async (name: string) => (await t.run(ctx => ctx.db.get(ids[name]!)))!.liveState!;
  const cards = async () =>
    (await t.run(ctx => ctx.db.query('interactions').take(100))).filter(
      c => c.kind === 'triggered-offer',
    );
  const open = async () => (await cards()).filter(c => c.status === 'awaiting-input');
  const card = async (id: Id<'interactions'>) => (await t.run(ctx => ctx.db.get(id)))!;
  const events = () => t.run(ctx => ctx.db.query('events').take(4000));
  const hit = async (ability: string, target: string, faces: [number, number] = [8, 8]) => {
    await atDice(t, f.campaignId, faces);
    return command(`${goblinRef} /ability use ability="${ability}" targets=[${ref(target)}]`);
  };
  const respond = (
    id: Id<'interactions'>,
    who: 'director' | 'player',
    answer: Record<string, unknown> = {},
  ) =>
    f[who].client.mutation(api.interactions.respond, {
      interactionId: id,
      answer,
      commandId: `reactions-${++sequence}`,
    });
  const result = (eventId: Id<'events'>) =>
    t.run(ctx =>
      ctx.db
        .query('abilityResults')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .unique(),
    );
  // Combat with the goblin's side first, and the goblin's turn in progress.
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', 'player');
  await command('/combat first side=foes');
  await command(`${goblinRef} /turn take`);
  return {
    t,
    f,
    ids,
    ref,
    goblin,
    goblinRef,
    command,
    live,
    cards,
    open,
    card,
    events,
    hit,
    respond,
    result,
  };
}

test('V174: Inertial Shield halves the goblin’s hit; undo restores it; the Director accepts; one per round', async () => {
  const s = await setup({ Nul: NULL });
  // Spear Charge 8 + 8 + 2 = 18, tier 3: 5 damage, 21 → 16.
  const hit = await s.hit('Spear Charge', 'Nul');
  expect((await s.live('Nul')).stamina).toBe(16);
  const [offer] = await s.open();
  expect(offer).toMatchObject({
    boundActor: { kind: 'character', id: s.ids.Nul },
    offer: {
      abilityName: 'Inertial Shield',
      triggeringEventId: hit.eventId,
      damage: 5,
      damaged: { kind: 'character', id: s.ids.Nul },
      target: { kind: 'character', id: s.ids.Nul },
      revision: { spend: { cost: 'Spend 1 Discipline', resource: 'discipline', amount: 1 } },
    },
  });
  expect((offer!.offer as { text: string }).text).toContain('Accepting revises the hit');

  // 1. The player accepts: half of 5 is 2, so Stamina is 21 − 2 = 19.
  const accepted = await s.respond(offer!._id, 'player');
  expect((await s.live('Nul')).stamina).toBe(19);
  const record = await s.result(accepted.eventId);
  expect((record!.compiled as CompiledResult).effects.map(o => o.effect)).toMatchObject([
    {
      kind: 'damage-revision',
      status: 'calculated',
      hitEventId: hit.eventId,
      before: { incoming: 5, staminaBefore: 21, staminaAfter: 16 },
      application: { incoming: 2, staminaBefore: 21, staminaAfter: 19, windedAfter: false },
    },
    { kind: 'response-spend', status: 'not-spent' },
  ]);
  const revised = (await s.events()).filter(e => e.kind === 'damage.revised');
  expect(revised).toHaveLength(1);
  expect(revised[0]).toMatchObject({
    causeEventId: accepted.eventId,
    payload: { data: { hitEventId: hit.eventId, responseEventId: accepted.eventId } },
  });
  expect((await s.t.run(ctx => ctx.db.get(accepted.eventId)))!.causeEventId).toBe(hit.eventId);
  expect(revised[0]!.description).toContain('5 → 2 damage; Stamina 16 → 19');
  expect(await s.card(offer!._id)).toMatchObject({ status: 'resolved' });

  // 2. Undo of the acceptance restores the original hit and reopens the card.
  await s.command('/history undo');
  expect((await s.live('Nul')).stamina).toBe(16);
  expect(await s.card(offer!._id)).toMatchObject({ status: 'awaiting-input' });
  expect(
    (await s.events()).filter(e => e.kind === 'damage.revised' && e.disposition !== 'undone'),
  ).toHaveLength(0);

  // 3. The Director accepts for the player's hero (ruling 4).
  await s.respond(offer!._id, 'director');
  expect((await s.live('Nul')).stamina).toBe(19);

  // A correction of the revised hit is refused: undo the response or rewind instead.
  await expect(
    s.command(`/ability correct event="${hit.eventId}" target=${s.ref('Nul')} banes=1`),
  ).rejects.toThrow(/An accepted response revised this hit/);

  // 4. One triggered action per round: a second hit in the round offers nothing.
  await s.hit('Spear Charge', 'Nul');
  expect((await s.live('Nul')).stamina).toBe(14);
  expect(await s.open()).toEqual([]);
});

test('V174: two responses on one hit: 7 → 3 → 1, and a reversed gain is not reversed twice', async () => {
  const s = await setup({ Rook: FURY, Terra: ELEMENTALIST });
  // Bury the Point 18: 7 damage (the Fury's Might 2 resists M < 2). Winded value 13: 17 − 7 = 10
  // is winded (first damage +1 ferocity, first winded +1d3); 17 − 3 = 14 is not.
  await s.command('/adjust malice value=2');
  await s.command(`${s.ref('Rook')} /adjust stamina value=17`);
  const hit = await s.hit('Bury the Point', 'Rook');
  expect((await s.live('Rook')).stamina).toBe(10);
  const cards = await s.open();
  const reflexes = cards.find(
    c => (c.offer as { abilityName: string }).abilityName === 'Unearthly Reflexes',
  )!;
  const walls = cards.find(
    c => (c.offer as { abilityName: string }).abilityName === 'Skin Like Castle Walls',
  )!;
  expect(walls.offer).toMatchObject({ damage: 7, target: { id: s.ids.Rook } });
  const firstGain = (await s.events()).find(
    e =>
      e.kind === 'resource.triggered' &&
      e.causeEventId === hit.eventId &&
      (e.payload as { data: { triggerId: string } }).data.triggerId !== 'fury-winded-or-dying',
  )!;
  expect((firstGain.payload as { data: { delta: number } }).data.delta).toBe(1);

  // The Fury answers first: half of 7 is 3; the winded gain goes, nothing having been spent.
  await s.respond(reflexes._id, 'player');
  expect((await s.live('Rook')).stamina).toBe(14);
  const afterFirst = (await s.live('Rook')).heroicResource.current;
  expect(afterFirst).toBe(1);
  // The open card now answers the revised damage.
  expect((await s.card(walls._id)).offer).toMatchObject({ damage: 3 });

  // The Elementalist answers second, from the current revision: half of 3 is 1, 17 − 1 = 16. The
  // winded gain is already reversed and is not reversed again; damage is still taken, so the
  // first-damage gain stands.
  const second = await s.respond(walls._id, 'player');
  const rook = await s.live('Rook');
  expect(rook.stamina).toBe(16);
  expect(rook.heroicResource.current).toBe(afterFirst);
  expect(rook.resourceClaims?.map(c => c.eventId)).toContain(firstGain._id);
  const record = await s.result(second.eventId);
  expect((record!.compiled as CompiledResult).effects[0]!.effect).toMatchObject({
    kind: 'damage-revision',
    before: { incoming: 3, staminaAfter: 14 },
    application: { incoming: 1, staminaAfter: 16 },
  });
  const revised = (await s.events()).filter(e => e.kind === 'damage.revised');
  expect(revised.map(e => e.description.match(/\d+ → \d+ damage/)?.[0])).toEqual([
    '7 → 3 damage',
    '3 → 1 damage',
  ]);
  expect(revised[1]!.description).not.toContain('no longer applies');
});

test('V174: temporary Stamina the hit absorbed is given back', async () => {
  const s = await setup({ Nul: NULL });
  // temporary-stamina.md: 10 temporary Stamina absorbs all 5; half is 2, leaving 8.
  await s.command(`${s.ref('Nul')} /adjust temporary-stamina value=10`);
  await s.hit('Spear Charge', 'Nul');
  expect((await s.live('Nul')).temporaryStamina).toBe(5);
  const [offer] = await s.open();
  await s.respond(offer!._id, 'player');
  const nul = await s.live('Nul');
  expect([nul.temporaryStamina, nul.stamina]).toEqual([8, 21]);
});

test('V174: a hit that broke Persistent Magic refuses the revision', async () => {
  const s = await setup({ Terra: ELEMENTALIST });
  // Seed one maintained persistent ability (the V148 record a maintained use leaves).
  await s.t.run(async ctx => {
    const encounter = (await ctx.db.query('encounters').take(10)).find(e => e.phase === 'turns')!;
    const hero = (await ctx.db.get(s.ids.Terra!))!;
    await ctx.db.patch(hero._id, {
      liveState: {
        ...hero.liveState!,
        maintained: [{ ability: 'Fixture Persistent', value: 1, encounterId: encounter._id }],
      },
    });
  });
  // 5 then 7 damage in the goblin's turn: 12 ≥ 5 × Reason 2, so maintenance stops at the second.
  await s.command('/adjust malice value=2');
  await s.hit('Spear Charge', 'Terra');
  await s.hit('Bury the Point', 'Terra');
  expect((await s.live('Terra')).maintained ?? []).toEqual([]);
  const second = (await s.open()).find(c => (c.offer as { damage: number }).damage === 7)!;
  await expect(s.respond(second._id, 'player')).rejects.toThrow(/Persistent Magic/);
  expect(await s.card(second._id)).toMatchObject({ status: 'awaiting-input' });
});

test('V174: the revision reconciles winded; a potency spend on damage without potency is refused', async () => {
  const s = await setup({ Nul: NULL });
  // Winded value 10: 13 − 5 = 8 is winded; 13 − 2 = 11 is not.
  await s.command(`${s.ref('Nul')} /adjust stamina value=13`);
  await s.command(`${s.ref('Nul')} /adjust heroic-resource value=1`);
  await s.hit('Spear Charge', 'Nul');
  expect((await s.live('Nul')).stamina).toBe(8);
  const [offer] = await s.open();
  // Spear Charge has no potency effect, so Spend 1 Discipline has nothing to reduce.
  await expect(s.respond(offer!._id, 'player', { spend: 1 })).rejects.toThrow(/no potency effect/);
  expect(await s.card(offer!._id)).toMatchObject({ status: 'awaiting-input' });
  expect((await s.live('Nul')).heroicResource.current).toBe(1);
  const accepted = await s.respond(offer!._id, 'player');
  expect((await s.live('Nul')).stamina).toBe(11);
  const use = (await s.t.run(ctx => ctx.db.get(accepted.eventId)))!;
  expect(use.description).toContain('no longer winded');
  const [effect] = (await s.result(accepted.eventId))!.compiled!
    .effects as CompiledResult['effects'];
  expect(effect!.effect).toMatchObject({
    before: { windedAfter: true },
    application: { windedAfter: false, staminaAfter: 11 },
  });
});

test('V174: a gain the revision no longer earns is reversed; its spent part stands and is logged', async () => {
  const s = await setup({ Rook: FURY });
  // Winded value 13: 16 − 5 = 11 is winded (the first time: 1d3 ferocity); 16 − 2 = 14 is not.
  await s.command(`${s.ref('Rook')} /adjust stamina value=16`);
  const hit = await s.hit('Spear Charge', 'Rook');
  const gains = (await s.events()).filter(
    e => e.kind === 'resource.triggered' && e.causeEventId === hit.eventId,
  );
  const data = (e: (typeof gains)[number]) =>
    (e.payload as { data: { triggerId: string; delta: number; after: number } }).data;
  const damaged = gains.find(e => data(e).triggerId !== 'fury-winded-or-dying')!;
  const winded = gains.find(e => data(e).triggerId === 'fury-winded-or-dying')!;
  expect(data(damaged).delta).toBe(1);
  const d3 = data(winded).delta;
  expect(d3).toBeGreaterThanOrEqual(1);
  expect(d3).toBeLessThanOrEqual(3);
  const pool = (await s.live('Rook')).heroicResource.current;
  expect(pool).toBe(data(winded).after);
  // The Fury spends 1 ferocity before the response (a Director adjustment stands in for a spend).
  await s.command(`${s.ref('Rook')} /adjust heroic-resource value=${pool - 1}`);
  const [offer] = await s.open();
  expect(offer!.offer).toMatchObject({ abilityName: 'Unearthly Reflexes', damage: 5 });
  await s.respond(offer!._id, 'player');
  const rook = await s.live('Rook');
  expect(rook.stamina).toBe(14);
  // The first-damage gain stands (damage is still taken); the winded gain is reversed except the
  // 1 already spent, which counts the most recent gain first (design 5b).
  expect(rook.heroicResource.current).toBe(pool - 1 - (d3 - 1));
  expect(rook.resourceClaims?.map(c => c.eventId)).toContain(damaged._id);
  expect(rook.resourceClaims?.map(c => c.eventId)).not.toContain(winded._id);
  const [revised] = (await s.events()).filter(e => e.kind === 'damage.revised');
  expect(revised!.description).toContain('You became winded or are dying no longer applies');
  expect(revised!.description).toContain('1 of it was already spent and stands');
});

test('V174: a watched hit — a firing the revision undoes refuses; one still true stands', async () => {
  const s = await setup({ Nul: NULL });
  const store = (event: Watcher['event']) =>
    s.t.run(async ctx => {
      const session = (await ctx.db.get(s.f.sessionId!))!;
      const eventId = await appendEvent(ctx, {
        campaignId: s.f.campaignId,
        sessionId: s.f.sessionId!,
        encounterId: session.encounterId ?? null,
        origin: 'user',
        actor: (await ctx.db.get(s.f.director.profile.userId))!,
        commandId: `reactions-source-${++sequence}`,
        kind: 'test.effect',
        description: 'Synthetic source occurrence for a watcher.',
      });
      const nul = { kind: 'character' as const, id: s.ids.Nul!, name: 'Nul' };
      await applyEffectInstance(
        ctx,
        { campaignId: s.f.campaignId, eventId },
        {
          id: `fixture-${eventId}`,
          kind: 'watcher',
          sourceUseEventId: eventId,
          sourceActorId: s.ids.Nul!,
          abilityId: `fixture-${event}`,
          abilityName: `Fixture ${event}`,
          actorLabel: 'Nul',
          sourcePath: 'rule/resource/surge.md',
          clause: `Fixture: on ${event}, gain 1 surge.`,
          owner: nul,
          subject: nul,
          payload: {
            kind: 'watcher',
            text: 'Fixture watcher.',
            watcher: {
              event,
              whose: 'subject',
              limit: 'each',
              responses: [{ kind: 'gain', recipient: 'subject', surges: 1 }],
            },
          },
          printedDuration: { kind: 'encounter' },
          endsWhen: [],
          appliedSequence: (await ctx.db.get(eventId))!.sequence,
        },
        session.encounterId ?? undefined,
      );
    });
  await store('made-winded');
  await store('damage-taken');
  const surges = (await s.live('Nul')).surges;
  // 13 − 5 = 8 makes the Null winded: both watchers fire. Half the damage (13 − 2 = 11) would not
  // make it winded, so that firing can't stand and the engine can't re-derive it (V171).
  await s.command(`${s.ref('Nul')} /adjust stamina value=13`);
  await s.hit('Spear Charge', 'Nul');
  expect((await s.live('Nul')).surges).toBe(surges + 2);
  const [offer] = await s.open();
  await expect(s.respond(offer!._id, 'player')).rejects.toThrow(/Rewind to the hit/);
  expect(await s.card(offer!._id)).toMatchObject({ status: 'awaiting-input' });
  expect((await s.live('Nul')).stamina).toBe(8);

  // Rewind to the hit, and hit from full Stamina: only the damage-taken watcher fires, and half the
  // damage is still damage taken, so its firing stands (ruling 3: still-true consequences stand).
  await s.command('/history undo');
  expect(await s.open()).toEqual([]);
  await s.command(`${s.ref('Nul')} /adjust stamina value=21`);
  await s.hit('Spear Charge', 'Nul');
  expect((await s.live('Nul')).surges).toBe(surges + 1);
  const [again] = await s.open();
  await s.respond(again!._id, 'player');
  expect((await s.live('Nul')).stamina).toBe(19);
  expect((await s.live('Nul')).surges).toBe(surges + 1);
});

test('V174: Parry protects an ally from Bury the Point: 7 → 3 damage and the bleeding potency drops', async () => {
  const s = await setup({ Vane: TACTICIAN, Seer: TALENT });
  await s.command('/adjust malice value=2');
  // 8 + 8 + 2 = 18: 7 damage and M < 2 bleeding (save ends); the Talent's Might 1 is below 2.
  const hit = await s.hit('Bury the Point', 'Seer');
  expect((await s.live('Seer')).stamina).toBe(11);
  expect((await s.live('Seer')).conditions.bleeding).toBe(true);
  const [offer] = await s.open();
  expect(offer).toMatchObject({
    boundActor: { kind: 'character', id: s.ids.Vane },
    offer: {
      abilityName: 'Parry',
      target: { kind: 'character', id: s.ids.Seer },
      revision: { confirm: 'self-or-adjacent' },
      damage: 7,
    },
  });
  expect((offer!.offer as { text: string }).text).toContain('adjacent to Seer');
  const accepted = await s.respond(offer!._id, 'player');
  const seer = await s.live('Seer');
  // always-round-down.md: 7 halved is 3; 18 − 3 = 15. Potency 2 → 1 against Might 1: no bleeding.
  expect(seer.stamina).toBe(15);
  expect(seer.conditions.bleeding).toBe(false);
  expect(seer.conditionInstances?.find(i => i.sourceUseEventId === hit.eventId)).toMatchObject({
    condition: 'bleeding',
    status: 'ended',
  });
  const use = (await s.t.run(ctx => ctx.db.get(accepted.eventId)))!;
  expect(use.description).toContain('no longer bleeding');
  expect(use.description).toContain('ended the shift adjacent to Seer');
  // Undo restores the hit, bleeding included.
  await s.command('/history undo');
  expect((await s.live('Seer')).stamina).toBe(11);
  expect((await s.live('Seer')).conditions.bleeding).toBe(true);
});

test('V174: a saving throw rolled at the turn end, before the card closes, refuses the potency revision', async () => {
  const s = await setup({ Vane: TACTICIAN, Seer: TALENT });
  // The Talent's own turn: the goblin's turn ends and hers starts; the goblin then uses Bury the
  // Point on her (7 damage, M < 2 bleeding (save ends); her Might 1 is below 2).
  await s.command(`${s.goblinRef} /turn end`);
  await s.command(`${s.ref('Seer')} /turn take`, 'player');
  await s.command('/adjust malice value=2');
  const hit = await s.hit('Bury the Point', 'Seer');
  expect((await s.live('Seer')).conditions.bleeding).toBe(true);
  const [offer] = await s.open();
  expect(offer!.offer).toMatchObject({ abilityName: 'Parry', damage: 7 });
  // Her turn ends: the bleeding save rolls at the turn-end boundary; the card stays open until the
  // next turn starts.
  await s.command(`${s.ref('Seer')} /turn end`, 'player');
  expect(
    (await s.live('Seer')).conditionInstances?.find(i => i.sourceUseEventId === hit.eventId)
      ?.lastSave,
  ).toBeDefined();
  expect(await s.card(offer!._id)).toMatchObject({ status: 'awaiting-input' });
  // Parry's potency decrease would end the bleeding, but a recorded save is never replayed.
  await expect(s.respond(offer!._id, 'player')).rejects.toThrow(/saving throw was already rolled/);
  expect(await s.card(offer!._id)).toMatchObject({ status: 'awaiting-input' });
  expect((await s.live('Seer')).stamina).toBe(11);
});

test('V174: a creature free strike and a hero’s ability are revised too', async () => {
  const s = await setup({ Nul: NULL, Seer: TALENT });
  // The goblin's free strike deals 1; half of 1 is 0, so the Null takes nothing.
  await s.command(`${s.goblinRef} /ability use ability="Free Strike" targets=[${s.ref('Nul')}]`);
  expect((await s.live('Nul')).stamina).toBe(20);
  const [strike] = await s.open();
  expect(strike!.offer).toMatchObject({ abilityName: 'Inertial Shield', damage: 1 });
  await s.respond(strike!._id, 'player');
  expect((await s.live('Nul')).stamina).toBe(21);
  // The Null has used its triggered action this round, so rewind the response and the free strike
  // before the hero's ability: Mind Spike 8 + 8 + 2 = 18, tier 3: 6 + 2 = 8 psychic, 21 → 13; half
  // of 8 is 4, 21 → 17.
  await s.command('/history undo');
  await s.command('/history undo');
  expect((await s.live('Nul')).stamina).toBe(21);
  await atDice(s.t, s.f.campaignId, [8, 8]);
  await s.command(
    `${s.ref('Seer')} /ability use ability="Mind Spike" targets=[${s.ref('Nul')}] strained=no`,
  );
  expect((await s.live('Nul')).stamina).toBe(13);
  const [spike] = await s.open();
  expect(spike!.offer).toMatchObject({ abilityName: 'Inertial Shield', damage: 8 });
  await s.respond(spike!._id, 'director');
  expect((await s.live('Nul')).stamina).toBe(17);
});

// ---------------------------------------------------------------------------------------------
// QC1 train 16 R1 and R2. Pinned sources (en/unified/md), quoted exactly:
// - feature/ability/tactician/level-1/parry.md: "If the damage has any potency effect associated
//   with it, the potency is decreased by 1."
// - feature/ability/elementalist/level-1/skin-like-castle-walls.md, Spend 1 Essence: "If the damage
//   has any potency effects associated with it, the potency is reduced by 1 for the target."
// - feature/ability/null/level-1/inertial-shield.md, Spend 1 Discipline: "The potency of one effect
//   associated with the damage is reduced by 1 for you."
// - rule/character/potency.md: "Ability effects that have a potency are applied to a target only
//   if the effect's potency value is higher than the target's indicated characteristic score."
// - rule/general/always-round-down.md: "Whenever you divide an odd number in half and it results
//   in a decimal, round the result down to the nearest whole number."
// - monster/goblin/statblock/goblin-warrior.md, Bury the Point: "12-16: 6 damage; M < 1
//   bleeding (save ends)"; 5 + 5 + 2 = 12 is tier 2. Might −1 is below 1, then 0, not below −1.
// - feature/ability/tactician/level-1/mark.md: "When a creature marked by you is reduced to 0
//   Stamina, you can use a free triggered action to mark a new target within distance." and
//   "whenever you or any ally uses an ability to deal rolled damage to a creature marked by you, you
//   can spend 1 focus to gain one of the following benefits as a free triggered action".

const bleedingOf = async (
  s: Awaited<ReturnType<typeof setup>>,
  name: string,
  hitEventId: Id<'events'>,
) =>
  (await s.live(name)).conditionInstances?.find(
    i => i.sourceUseEventId === hitEventId && i.condition === 'bleeding',
  );
const revisionOf = async (s: Awaited<ReturnType<typeof setup>>, eventId: Id<'events'>) =>
  (
    ((await s.result(eventId))!.compiled as CompiledResult).effects.find(
      o => o.effect.kind === 'damage-revision',
    )!.effect as { potencyReductions?: Record<string, number> }
  ).potencyReductions;

test('V174 QC1 R1: two potency reductions end the condition; undo restores only the second', async () => {
  const s = await setup({ Nul: NULL_WEAK, Vane: TACTICIAN, Terra: ELEMENTALIST });
  await s.command('/adjust malice value=2');
  await s.command(`${s.ref('Terra')} /adjust heroic-resource value=1`);
  // Tier 2: 6 damage (21 → 15) and M < 1 bleeding on Might −1.
  const hit = await s.hit('Bury the Point', 'Nul', [5, 5]);
  expect((await s.live('Nul')).stamina).toBe(15);
  expect(await bleedingOf(s, 'Nul', hit.eventId)).toMatchObject({ status: 'active' });
  const byName = async (name: string) =>
    (await s.open()).find(c => (c.offer as { abilityName: string }).abilityName === name)!;
  // 1. Parry: 6 → 3 (21 − 3 = 18); potency 1 → 0, and −1 < 0 still bleeds.
  const parry = await s.respond((await byName('Parry'))._id, 'player');
  expect((await s.live('Nul')).stamina).toBe(18);
  const bleeding = await bleedingOf(s, 'Nul', hit.eventId);
  expect(bleeding).toMatchObject({ status: 'active' });
  expect(await revisionOf(s, parry.eventId)).toEqual({ [bleeding!.id]: 1 });
  // 2. Skin Like Castle Walls with Spend 1 Essence, from the current accepted potency: 3 → 1
  // (21 − 1 = 20); potency 0 → −1, and −1 is not below −1: no longer bleeding.
  const walls = await byName('Skin Like Castle Walls');
  const second = await s.respond(walls._id, 'player', { spend: 1 });
  expect((await s.live('Nul')).stamina).toBe(20);
  expect((await s.live('Terra')).heroicResource.current).toBe(0);
  expect(await bleedingOf(s, 'Nul', hit.eventId)).toMatchObject({ status: 'ended' });
  expect(await revisionOf(s, second.eventId)).toEqual({ [bleeding!.id]: 2 });
  // 3. Undo of the second restores only its reduction: bleeding again, the first still recorded.
  await s.command('/history undo');
  expect((await s.live('Nul')).stamina).toBe(18);
  expect((await s.live('Terra')).heroicResource.current).toBe(1);
  expect(await bleedingOf(s, 'Nul', hit.eventId)).toMatchObject({ status: 'active' });
  expect(await revisionOf(s, parry.eventId)).toEqual({ [bleeding!.id]: 1 });
  expect(await s.card(walls._id)).toMatchObject({ status: 'awaiting-input' });
  await s.respond(walls._id, 'player', { spend: 1 });
  expect(await bleedingOf(s, 'Nul', hit.eventId)).toMatchObject({ status: 'ended' });
});

test('V174 QC1 R1: a one-effect spend keeps its selected effect for the next reduction', async () => {
  const s = await setup({ Nul: NULL_WEAK, Vane: TACTICIAN });
  await s.command('/adjust malice value=2');
  await s.command(`${s.ref('Nul')} /adjust heroic-resource value=1`);
  const hit = await s.hit('Bury the Point', 'Nul', [5, 5]);
  const byName = async (name: string) =>
    (await s.open()).find(c => (c.offer as { abilityName: string }).abilityName === name)!;
  // Inertial Shield, Spend 1 Discipline on the one effect (bleeding): 6 → 3, potency 1 → 0.
  const shield = await s.respond((await byName('Inertial Shield'))._id, 'player', { spend: 1 });
  const bleeding = await bleedingOf(s, 'Nul', hit.eventId);
  expect(bleeding).toMatchObject({ status: 'active' });
  expect(await revisionOf(s, shield.eventId)).toEqual({ [bleeding!.id]: 1 });
  // Parry then works from potency 0: 0 → −1 ends it; 3 → 1 (21 − 1 = 20).
  await s.respond((await byName('Parry'))._id, 'player');
  expect((await s.live('Nul')).stamina).toBe(20);
  expect(await bleedingOf(s, 'Nul', hit.eventId)).toMatchObject({ status: 'ended' });
});

const markCards = (s: Awaited<ReturnType<typeof setup>>) =>
  s.t.run(async ctx =>
    (await ctx.db.query('interactions').take(200)).filter(c => c.kind === 'mark-offer'),
  );

test('V174 QC1 R2: a revision closes the Mark retarget its hit no longer triggers; undo reopens it', async () => {
  const s = await setup({ Nul: NULL, Vane: TACTICIAN });
  await s.command(`${s.ref('Vane')} /ability use ability=Mark targets=[${s.ref('Nul')}]`, 'player');
  // Spear Charge 5 takes the marked Null from 3 to −2: reduced to 0 Stamina.
  await s.command(`${s.ref('Nul')} /adjust stamina value=3`);
  const hit = await s.hit('Spear Charge', 'Nul');
  expect((await s.live('Nul')).stamina).toBe(-2);
  const retarget = (await markCards(s)).find(
    c => c.openedEventId === hit.eventId && c.operation === 'mark.retarget',
  )!;
  expect(retarget).toMatchObject({ status: 'awaiting-input' });
  // Inertial Shield: 5 → 2, Stamina 1. The Null was never reduced to 0, so the card closes.
  const shield = (await s.open()).find(
    c => (c.offer as { abilityName: string }).abilityName === 'Inertial Shield',
  )!;
  const accepted = await s.respond(shield._id, 'player');
  expect((await s.live('Nul')).stamina).toBe(1);
  expect(await s.card(retarget._id)).toMatchObject({
    status: 'closed',
    resolvedEventId: accepted.eventId,
  });
  await expect(
    s.respond(retarget._id, 'player', { targets: [{ refKind: 'foe', id: s.goblin }] }),
  ).rejects.toThrow(/already closed/);
  // Undo reopens it.
  await s.command('/history undo');
  expect((await s.live('Nul')).stamina).toBe(-2);
  expect(await s.card(retarget._id)).toMatchObject({ status: 'awaiting-input' });
});

test('V174 QC1 R2: a retarget already accepted refuses the revision that would undo its trigger', async () => {
  const s = await setup({ Nul: NULL, Vane: TACTICIAN });
  await s.command(`${s.ref('Vane')} /ability use ability=Mark targets=[${s.ref('Nul')}]`, 'player');
  await s.command(`${s.ref('Nul')} /adjust stamina value=3`);
  const hit = await s.hit('Spear Charge', 'Nul');
  const retarget = (await markCards(s)).find(
    c => c.openedEventId === hit.eventId && c.operation === 'mark.retarget',
  )!;
  await s.respond(retarget._id, 'player', { targets: [{ refKind: 'foe', id: s.goblin }] });
  expect(await s.card(retarget._id)).toMatchObject({ status: 'resolved' });
  const goblinMarks = async () =>
    ((await s.t.run(ctx => ctx.db.get(s.goblin)))!.live.effectInstances ?? []).filter(
      i => i.kind === 'mark' && i.status === 'active',
    );
  expect(await goblinMarks()).toHaveLength(1);
  const shield = (await s.open()).find(
    c => (c.offer as { abilityName: string }).abilityName === 'Inertial Shield',
  )!;
  await expect(s.respond(shield._id, 'player')).rejects.toThrow(/Rewind to the hit/);
  expect(await s.card(shield._id)).toMatchObject({ status: 'awaiting-input' });
  expect((await s.live('Nul')).stamina).toBe(-2);
  expect(await goblinMarks()).toHaveLength(1);
});

test('V174 QC1 R2: a revision to 0 damage closes the Mark benefit of that rolled damage', async () => {
  const s = await setup({ Nul: NULL, Vane: TACTICIAN, Seer: TALENT });
  await s.command(`${s.ref('Vane')} /ability use ability=Mark targets=[${s.ref('Nul')}]`, 'player');
  // Synthetic fixture: psychic immunity 3 on the Null, so a 4-damage Mind Spike deals 1
  // (damage-immunity.md) and half of 4 is 2, which the immunity reduces to 0.
  await s.t.run(async ctx => {
    const hero = (await ctx.db.get(s.ids.Nul!))!;
    await ctx.db.patch(hero._id, {
      derivedBaseline: {
        ...(hero.derivedBaseline as object),
        damageImmunities: [{ damageType: 'psychic', value: { value: 3 } }],
      },
    });
  });
  // Mind Spike 1 + 1 + 2 = 4, tier 1: 2 + R = 4 psychic, 1 after immunity (21 → 20).
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const hit = await s.command(
    `${s.ref('Seer')} /ability use ability="Mind Spike" targets=[${s.ref('Nul')}] strained=no`,
    'player',
  );
  expect((await s.live('Nul')).stamina).toBe(20);
  const benefit = (await markCards(s)).find(
    c => c.openedEventId === hit.eventId && c.operation === 'mark.benefit',
  )!;
  expect(benefit).toMatchObject({ status: 'awaiting-input' });
  const shield = (await s.open()).find(
    c => (c.offer as { abilityName: string }).abilityName === 'Inertial Shield',
  )!;
  await s.respond(shield._id, 'player');
  expect((await s.live('Nul')).stamina).toBe(21);
  expect(await s.card(benefit._id)).toMatchObject({ status: 'closed' });
  await s.command('/history undo');
  expect(await s.card(benefit._id)).toMatchObject({ status: 'awaiting-input' });
});
