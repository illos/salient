// SPDX-License-Identifier: GPL-3.0-only
/**
 * V179 immunity and weakness granted in play, through the registered operations, with persisted
 * readback and Convex's transaction limits enforced. Expected values come from the pinned
 * Compendium (en/unified/md) and the reviewed ledgers, never from a run of the code under test:
 * - feature/ability/shadow/level-1/setup.md (5 Insight, Power Roll + Agility): "≤11: 6 + A damage;
 *   R < WEAK, the target has damage weakness 5 (save ends)"; "12-16: 9 + A damage; R < AVERAGE,
 *   the target has damage weakness 5 (save ends)"; "17+: 13 + A damage; R < STRONG, …".
 * - tests/fixtures/v92-shadow-expected.json v92-shadow-3: Agility 2, potency weak 0, average 1,
 *   strong 2, Swashbuckler (a melee damage bonus only, kit/swashbuckler.md), so Setup (Ranged) deals
 *   8 / 11 / 15.
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, Reason 0, Free Strike 1 (untyped).
 * - rule/character/potency.md: an effect applies "only if the effect's potency value is higher than
 *   the target's indicated characteristic score": Reason 0 resists weak 0 and not average 1.
 * - rule/damage/damage-weakness.md: "A creature who has "damage weakness X" with no specific type or
 *   keyword indicated has weakness of the indicated amount when they take damage of any type." and
 *   "If multiple damage weaknesses apply to a source of damage, only the weakness with the highest
 *   value applies." Untyped damage takes the untyped weakness (Q-IW-1 point 1).
 * - en/books/heroes/clean/Draw Steel Heroes.md, "Stacking Unique Effects": the same ability used
 *   again doesn't stack; the most recent use sets the duration.
 * - tests/fixtures/v104-elementalist-expected.json v104-1: Hurl Element fire 6 / 8 / 10. Dice 5 + 4
 *   + Reason 2 = 11 is tier 1; one edge makes 13, tier 2 (rule/dice/power-roll.md).
 * - rule/dice/power-roll.md: a double edge raises the tier by one.
 * - monster/draconian/statblock/myxovidan-the-sintaker.md: Expunging Exhalation, Power Roll + 3,
 *   "12-16: 12 corruption damage; M < 2 the target has corruption weakness 3 (save ends)"; Free
 *   Strike 7.
 * - feature/ability/tactician/level-1/parry.md: "the target takes half the damage. If the damage has
 *   any potency effect associated with it, the potency is decreased by 1."; the Talent v105-3 has
 *   Stamina 18 and Might 1 (tests/app/damage-reactions.test.ts); rule/general/always-round-down.md.
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
import type { DamageApplication } from '../../shared/contracts/rollResolution';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import shadowLedger from '../fixtures/v92-shadow-expected.json' with { type: 'json' };
import elementalistLedger from '../fixtures/v104-elementalist-expected.json' with { type: 'json' };
import tacticianLedger from '../fixtures/v94-tactician-expected.json' with { type: 'json' };
import talentLedger from '../fixtures/v105-talent-expected.json' with { type: 'json' };
import nullLedger from '../fixtures/v103-null-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');
const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';
const MYXOVIDAN = 'mcdm.monsters.v1/monster.draconian.statblock/myxovidan-the-sintaker';

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
    throw new Error('Fixture dice position not found');
  });
}

type Ledger = { witnesses: { id: string; selections: unknown }[] };
const selections = (ledger: Ledger, id: string, name: string) =>
  draftSelectionsFrom(
    {
      ...(ledger.witnesses.find(w => w.id === id)!.selections as EvaluationInput['selections']),
      'details.name': name,
    },
    definitions,
  );
const hurlFire = elementalistLedger.witnesses[0]!.rolledActions.find(
  a => a.name === 'Hurl Element: Fire',
)!.damageByTier;

let sequence = 0;
async function setup(heroes: Record<string, [Ledger, string]>) {
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const ids: Record<string, Id<'characters'>> = {};
  for (const [name, [ledger, id]] of Object.entries(heroes))
    ids[name] = await admitHero(
      t,
      f.player,
      f.director,
      f.campaignId,
      name,
      selections(ledger, id, name),
    );
  const command = (text: string, who: 'director' | 'player' = 'director') =>
    f[who].client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `granted-${++sequence}`,
      text,
    });
  const invoke = (operation: string, args: Record<string, unknown>) =>
    f.director.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: `granted-${++sequence}`,
      operation,
      arguments: args,
    });
  const addFoe = (definitionId: string) =>
    f.director.client.mutation(api.foes.add, {
      campaignId: f.campaignId,
      definitionId,
      commandId: `granted-${++sequence}`,
    });
  const ref = (name: string) => `@{character:${ids[name]}}`;
  const foe = async (id: Id<'foes'>) => (await t.run(ctx => ctx.db.get(id)))!.live;
  const hero = async (name: string) => (await t.run(ctx => ctx.db.get(ids[name]!)))!.liveState!;
  const result = (eventId: Id<'events'>) =>
    t.run(ctx =>
      ctx.db
        .query('abilityResults')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .unique(),
    );
  const applied = async (eventId: Id<'events'>) => {
    const saved = await result(eventId);
    if (saved) return saved.targets[0]!.applied as DamageApplication | null;
    const event = await t.run(ctx => ctx.db.get(eventId));
    return (event!.payload as { data: { damage: { application: DamageApplication }[] } }).data
      .damage[0]!.application;
  };
  const description = async (eventId: Id<'events'>) =>
    (await t.run(ctx => ctx.db.get(eventId)))!.description;
  const events = () => t.run(ctx => ctx.db.query('events').take(4000));
  const setup = async (actor: string, target: Id<'foes'>, faces: [number, number]) => {
    await command(`${ref(actor)} /adjust heroic-resource value=5`);
    await atDice(t, f.campaignId, faces);
    return command(`${ref(actor)} /ability use ability="Setup" targets=[@{foe:${target}}]`);
  };
  const freeStrike = (from: Id<'foes'>, to: string) =>
    command(`@{foe:${from}} /ability use ability="Free Strike" targets=[${to}]`);
  return {
    t,
    f,
    ids,
    ref,
    command,
    invoke,
    addFoe,
    foe,
    hero,
    result,
    applied,
    description,
    events,
    setup,
    freeStrike,
  };
}

const SHADOW: [Ledger, string] = [shadowLedger, 'v92-shadow-3'];

test('V179: Setup gives the goblin damage weakness 5, which later damage of any type takes', async () => {
  const s = await setup({ Shade: SHADOW, Mage: [elementalistLedger, 'v104-1'] });
  const goblin = await s.addFoe(GOBLIN);
  const other = await s.addFoe(GOBLIN);

  // 5 + 5 + A 2 = 12: tier 2, 9 + 2 = 11 damage; R 0 < average 1, so the weakness applies.
  const used = await s.setup('Shade', goblin, [5, 5]);
  expect(await s.applied(used.eventId)).toMatchObject({ incoming: 11, weaknessApplied: 0 });
  expect((await s.foe(goblin)).stamina).toBe(15 - 11);
  const stored = (await s.foe(goblin)).effectInstances!.filter(i => i.status === 'active');
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    kind: 'modifier',
    abilityName: 'Setup',
    sourceUseEventId: used.eventId,
    subject: { kind: 'foe', id: goblin },
    payload: {
      kind: 'modifier',
      modifier: {
        kind: 'damage-modifier',
        defense: 'weakness',
        damageType: 'all-damage',
        value: 5,
      },
    },
    printedDuration: { kind: 'save-ends' },
    duration: { kind: 'save-ends', creatureId: goblin },
  });
  const occurrence = ((await s.result(used.eventId))!.compiled as CompiledResult).effects.find(
    o => o.effect.kind === 'modifier',
  )!;
  expect(occurrence.id).toBe(stored[0]!.id);
  expect(occurrence.effect).toMatchObject({
    status: 'applied',
    tier: true,
    potency: { characteristic: 'R', threshold: 1, targetScore: 0 },
  });

  // Untyped damage takes the untyped weakness: the free strike 1 + 5.
  await s.command(`@{foe:${goblin}} /adjust stamina value=15`);
  const strike = await s.freeStrike(other, `@{foe:${goblin}}`);
  expect(await s.applied(strike.eventId)).toMatchObject({
    incoming: 1,
    weaknessApplied: 5,
    afterImmunity: 6,
  });
  expect((await s.foe(goblin)).stamina).toBe(15 - 6);

  // Typed damage too: 5 + 4 + Reason 2 = 11, Hurl Element fire at tier 1, 6 + 5.
  await s.command(`@{foe:${goblin}} /adjust stamina value=15`);
  await atDice(s.t, s.f.campaignId, [5, 4]);
  const fire = await s.command(
    `@Mage /ability use ability="Hurl Element" targets=[@{foe:${goblin}}] damage-type=fire`,
    'player',
  );
  expect(await s.applied(fire.eventId)).toMatchObject({
    incoming: hurlFire[0],
    weaknessApplied: 5,
  });
  expect((await s.foe(goblin)).stamina).toBe(15 - (hurlFire[0]! + 5));
  // A correction reuses the facts the hit saved, weakness included: one edge makes 13, tier 2,
  // 8 + 5 from 15.
  await s.command(
    `/ability correct event="${fire.eventId}" target=@{foe:${goblin}} edges=1 banes=0`,
  );
  expect((await s.foe(goblin)).stamina).toBe(15 - (hurlFire[1]! + 5));

  // Ended with effect.end, the weakness no longer applies: the free strike deals 1.
  const current = (await s.foe(goblin)).effectInstances!.find(i => i.status === 'active')!;
  await s.invoke('effect.end', { instance: current.id });
  await s.command(`@{foe:${goblin}} /adjust stamina value=15`);
  const strike2 = await s.freeStrike(other, `@{foe:${goblin}}`);
  expect(await s.applied(strike2.eventId)).toMatchObject({ weaknessApplied: 0, afterImmunity: 1 });
  expect((await s.foe(goblin)).stamina).toBe(14);
});

test('V179: a resisted Setup stores nothing; a correction that would change the weakness is refused', async () => {
  const s = await setup({ Shade: SHADOW });
  const goblin = await s.addFoe(GOBLIN);
  const other = await s.addFoe(GOBLIN);

  // 3 + 3 + 2 = 8: tier 1, 6 + 2 = 8 damage; R 0 is not below weak 0, so it is resisted.
  const resisted = await s.setup('Shade', goblin, [3, 3]);
  expect(await s.applied(resisted.eventId)).toMatchObject({ incoming: 8 });
  expect((await s.foe(goblin)).effectInstances ?? []).toEqual([]);
  expect(
    ((await s.result(resisted.eventId))!.compiled as CompiledResult).effects.find(
      o => o.effect.kind === 'modifier',
    )!.effect,
  ).toMatchObject({ status: 'resisted', potency: { threshold: 0, targetScore: 0 } });
  expect(
    (await s.events()).some(
      e =>
        e.kind === 'effect.resisted' &&
        (e.payload as { sourceUseEventId?: string }).sourceUseEventId === resisted.eventId,
    ),
  ).toBe(true);
  await s.command(`@{foe:${goblin}} /adjust stamina value=15`);
  const strike = await s.freeStrike(other, `@{foe:${goblin}}`);
  expect(await s.applied(strike.eventId)).toMatchObject({ weaknessApplied: 0, afterImmunity: 1 });

  // Tier 2, applied. One edge keeps tier 2 (14) and the same weakness: the correction stands and
  // the instance is kept. A double edge raises the tier: the weakness clause would change, refused.
  const used = await s.setup('Shade', other, [5, 5]);
  const instance = (await s.foe(other)).effectInstances!.find(i => i.status === 'active')!;
  await s.command(
    `/ability correct event="${used.eventId}" target=@{foe:${other}} edges=1 banes=0`,
  );
  expect((await s.foe(other)).effectInstances!.find(i => i.id === instance.id)).toMatchObject({
    status: 'active',
  });
  await expect(
    s.command(`/ability correct event="${used.eventId}" target=@{foe:${other}} edges=2 banes=0`),
  ).rejects.toThrow(/rewind the use instead/);
});

test('V179: two users’ Setups on one goblin are a manual stacking group: damage to it is manual', async () => {
  const s = await setup({ Shade: SHADOW, Twin: SHADOW });
  const goblin = await s.addFoe(GOBLIN);
  const other = await s.addFoe(GOBLIN);
  await s.setup('Shade', goblin, [5, 5]);
  await s.command(`@{foe:${goblin}} /adjust stamina value=15`);
  await s.setup('Twin', goblin, [5, 5]);
  const group = (await s.foe(goblin)).effectInstances!.filter(i => i.status === 'active');
  expect(group).toHaveLength(2);
  expect(group.every(i => i.manualStacking)).toBe(true);
  await s.command(`@{foe:${goblin}} /adjust stamina value=15`);
  const strike = await s.freeStrike(other, `@{foe:${goblin}}`);
  expect(await s.description(strike.eventId)).toContain('manual stacking group');
  expect((await s.foe(goblin)).stamina).toBe(15);
});

test('V179: a foe’s tier weakness on a hero; Parry’s potency decrease ends it; undo restores it', async () => {
  const s = await setup({
    Vane: [tacticianLedger, 'v94-tactician-3'],
    Seer: [talentLedger, 'v105-3'],
  });
  const myxovidan = await s.addFoe(MYXOVIDAN);
  const myx = `@{foe:${myxovidan}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', 'player');
  await s.command('/combat first side=foes');
  await s.command(`${myx} /turn take`);

  // 5 + 4 + 3 = 12: tier 2, 12 corruption damage; Might 1 < 2, so corruption weakness 3.
  await atDice(s.t, s.f.campaignId, [5, 4]);
  const hit = await s.command(
    `${myx} /ability use ability="Expunging Exhalation" targets=[${s.ref('Seer')}]`,
  );
  expect((await s.hero('Seer')).stamina).toBe(18 - 12);
  const weakness = (await s.hero('Seer')).effectInstances!.find(
    i => i.sourceUseEventId === hit.eventId,
  )!;
  expect(weakness).toMatchObject({
    status: 'active',
    payload: {
      modifier: {
        kind: 'damage-modifier',
        defense: 'weakness',
        damageType: 'corruption',
        value: 3,
      },
    },
  });
  expect(weakness.registrationIds).toHaveLength(1);

  // Parry: 12 halved is 6 (18 − 6 = 12); potency 2 → 1 against Might 1: the weakness ends.
  const offer = (await s.t.run(ctx => ctx.db.query('interactions').take(100))).find(
    c => c.kind === 'triggered-offer' && c.status === 'awaiting-input',
  )!;
  expect(offer.offer).toMatchObject({ abilityName: 'Parry', damage: 12 });
  const accepted = await s.f.player.client.mutation(api.interactions.respond, {
    interactionId: offer._id,
    answer: {},
    commandId: `granted-${++sequence}`,
  });
  expect((await s.hero('Seer')).stamina).toBe(12);
  expect((await s.hero('Seer')).effectInstances!.find(i => i.id === weakness.id)).toMatchObject({
    status: 'ended',
    endedReason: expect.stringContaining('potency reduced by 1'),
  });
  expect(await s.description(accepted.eventId)).toContain('no longer corruption weakness 3');

  // Undo restores the hit and the weakness; the weakness then meets corruption damage only.
  await s.command('/history undo');
  expect((await s.hero('Seer')).stamina).toBe(6);
  expect((await s.hero('Seer')).effectInstances!.find(i => i.id === weakness.id)).toMatchObject({
    status: 'active',
  });
  await s.command(`${s.ref('Seer')} /adjust stamina value=18`);
  const strike = await s.freeStrike(myxovidan, s.ref('Seer'));
  expect(await s.applied(strike.eventId)).toMatchObject({
    incoming: 7,
    weaknessApplied: 0,
    afterImmunity: 7,
  });
});

// QC1 V179 R1 (Q-IW-2 point 4). The Null v103-1 has Stamina 21 and Might 2
// (tests/app/damage-reactions.test.ts). Expunging Exhalation, Power Roll + 3: a natural 20 is tier 3
// (rule/dice/power-roll.md), "15 corruption damage; M < 3 the target has corruption weakness 3
// (save ends)"; 2 + 2 + 3 = 7 is tier 1, "7 corruption damage; M < 1 …", resisted by Might 2. A
// critical hit gives an additional main action (rule/combat/critical-hit.md). Parry halves 15 to 7
// (rule/general/always-round-down.md) and decreases the potency 3 → 2, which Might 2 resists.
test('V179 QC1 R1: Parry can’t end a weakness a later hit already took; undoing that hit allows it', async () => {
  const s = await setup({
    Vane: [tacticianLedger, 'v94-tactician-3'],
    Nul: [nullLedger, 'v103-1'],
  });
  const myxovidan = await s.addFoe(MYXOVIDAN);
  const myx = `@{foe:${myxovidan}}`;
  await s.command('/combat start');
  await s.command('/combat commit');
  await s.command('/combat roll', 'player');
  await s.command('/combat first side=foes');
  await s.command(`${myx} /turn take`);
  const exhale = () =>
    s.command(`${myx} /ability use ability="Expunging Exhalation" targets=[${s.ref('Nul')}]`);

  await atDice(s.t, s.f.campaignId, [10, 10]);
  const first = await exhale();
  expect((await s.hero('Nul')).stamina).toBe(21 - 15);
  const weakness = (await s.hero('Nul')).effectInstances!.find(
    i => i.sourceUseEventId === first.eventId,
  )!;
  expect(weakness).toMatchObject({ status: 'active' });

  // The additional main action: 7 corruption + weakness 3 from the first hit's instance.
  await atDice(s.t, s.f.campaignId, [2, 2]);
  const second = await exhale();
  expect(await s.applied(second.eventId)).toMatchObject({ incoming: 7, weaknessApplied: 3 });
  expect((await s.hero('Nul')).stamina).toBe(6 - 10);

  const parry = async () =>
    (await s.t.run(ctx => ctx.db.query('interactions').take(100))).find(
      c =>
        c.kind === 'triggered-offer' &&
        (c.offer as { abilityName?: string; triggeringEventId?: string }).abilityName === 'Parry' &&
        (c.offer as { triggeringEventId?: string }).triggeringEventId === first.eventId,
    )!;
  const card = await parry();
  expect(card.status).toBe('awaiting-input');
  const respond = () =>
    s.f.player.client.mutation(api.interactions.respond, {
      interactionId: card._id,
      answer: {},
      commandId: `granted-${++sequence}`,
    });
  // Vane's triggered actions this round, as the allowance counts them (actionUses).
  const triggeredUsed = async () =>
    (await s.t.run(ctx => ctx.db.query('actionUses').take(200))).filter(
      u => u.actor.id === s.ids.Vane && u.actionType === 'triggered action',
    ).length;
  expect(await triggeredUsed()).toBe(0);

  // Refused before any write: Stamina, the weakness, the card and Vane's allowance are unchanged.
  await expect(respond()).rejects.toThrow(/rewind to the hit/);
  expect((await s.hero('Nul')).stamina).toBe(-4);
  expect((await s.hero('Nul')).effectInstances!.find(i => i.id === weakness.id)).toMatchObject({
    status: 'active',
  });
  expect((await s.t.run(ctx => ctx.db.get(card._id)))!.status).toBe('awaiting-input');
  expect(await triggeredUsed()).toBe(0);

  // Undo the later hit: the reaction goes through, 21 − 7 = 14, and the weakness ends.
  await s.command('/history undo');
  expect((await s.hero('Nul')).stamina).toBe(6);
  expect((await s.t.run(ctx => ctx.db.get(card._id)))!.status).toBe('awaiting-input');
  await respond();
  expect((await s.hero('Nul')).stamina).toBe(14);
  expect((await s.hero('Nul')).effectInstances!.find(i => i.id === weakness.id)).toMatchObject({
    status: 'ended',
    endedReason: expect.stringContaining('potency reduced by 1'),
  });
  expect(await triggeredUsed()).toBe(1);
});
