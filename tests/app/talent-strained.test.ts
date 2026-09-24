// SPDX-License-Identifier: GPL-3.0-only
/**
 * V170 Mind Spike's Strained section through the registered operations, with persisted readback.
 * Expected values come from the pinned sources (Compendium en/unified/md), never from the code:
 * - feature/ability/talent/level-1/mind-spike.md: Power Roll + Reason; ≤11 2 + R psychic damage,
 *   12-16 4 + R psychic damage; "Strained: The target takes an extra 2 psychic damage. You also take
 *   2 psychic damage that can't be reduced in any way." No clarity cost (a signature ability).
 * - feature/talent/level-1/clarity-and-strain.md: "Whenever you have clarity below 0, you are
 *   strained"; outside combat "you can take 1d6 damage and incur the effect".
 * - tests/fixtures/v105-talent-expected.json v105-2: Reason 2, Stamina 24, Density Augmentation (no
 *   damage bonus). So Mind Spike deals 4 at tier 1 and 6 at tier 2; strained, 6 and 8.
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, no immunity or weakness.
 * - rule/dice/power-roll.md: 1 + 1 + 2 = 4 is tier 1; 5 + 5 + 2 = 12 is tier 2; a bane is −2.
 */
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { CompiledResult } from '../../shared/contracts/compiledResult';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import talentLedger from '../fixtures/v105-talent-expected.json' with { type: 'json' };
import { admitHero, backend, table, type Backend } from './fixtures/table';

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
  const talent = await admitHero(
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
      definitions,
    ),
  );
  const command = (text: string) =>
    f.director.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `talent-strained-${++sequence}`,
      text,
    });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: GOBLIN,
    commandId: `talent-strained-${++sequence}`,
  });
  const heal = () =>
    t.run(ctx => ctx.db.patch(goblin, { live: { stamina: 15, temporaryStamina: 0 } as never }));
  const goblinStamina = async () => (await t.run(ctx => ctx.db.get(goblin)))!.live.stamina;
  const seer = async () => (await t.run(ctx => ctx.db.get(talent)))!.liveState!;
  const saved = async (eventId: Id<'events'>) =>
    t.run(async ctx => {
      const result = await ctx.db
        .query('abilityResults')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .unique();
      const event = await ctx.db.get(eventId);
      const compiled = result!.compiled as CompiledResult;
      return {
        event: event!,
        strained: (event!.payload as { data: { strained?: Record<string, unknown> } }).data
          .strained,
        section: compiled.effects.find(o => o.effect.kind === 'strained')!.effect,
        target: result!.targets[0]!,
      };
    });
  const spike = (extra = '') =>
    command(
      `@{character:${talent}} /ability use ability="Mind Spike" targets=[@{foe:${goblin}}]${extra}`,
    );
  return { t, f, talent, goblin, command, heal, goblinStamina, seer, saved, spike };
}

test('V170: a strained Mind Spike deals 2 extra psychic damage and 2 unreducible to the Talent', async () => {
  const s = await setup();
  const ref = `@{character:${s.talent}}`;
  await s.command('/combat start');
  await s.command('/combat commit');

  // Not strained (clarity 2): tier 1 is 4 damage and the Talent takes nothing.
  await s.command(`${ref} /adjust heroic-resource value=2`);
  await s.heal();
  const calmBefore = await s.seer();
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const calm = await s.spike();
  expect(await s.goblinStamina()).toBe(15 - 4);
  expect((await s.seer()).stamina).toBe(calmBefore.stamina);
  const calmSaved = await s.saved(calm.eventId);
  expect(calmSaved.section).toMatchObject({ status: 'not-strained' });
  expect(calmSaved.strained).toMatchObject({ applies: false, basis: 'not-strained' });

  // Already strained (clarity −1): 4 + 2 = 6 to the goblin; 2 psychic to the Talent, which has no
  // temporary Stamina. Mind Spike costs no clarity, so the pool stays at −1.
  await s.command(`${ref} /adjust heroic-resource value=-1`);
  await s.command(`${ref} /adjust temporary-stamina value=0`);
  await s.heal();
  const before = await s.seer();
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const strained = await s.spike();
  expect(await s.goblinStamina()).toBe(15 - 6);
  const after = await s.seer();
  expect(after.stamina).toBe(before.stamina - 2);
  expect(after.heroicResource.current).toBe(-1);
  const read = await s.saved(strained.eventId);
  expect(read.strained).toMatchObject({
    applies: true,
    basis: 'already-strained',
    clarityBefore: -1,
  });
  expect(read.section).toMatchObject({
    status: 'applied',
    selfApplication: { afterImmunity: 2, staminaAfter: before.stamina - 2 },
  });
  expect(read.event.description).toMatch(/already strained/);

  // The table's override: declared not strained while at −1 applies nothing extra.
  await s.heal();
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const overridden = await s.spike(' strained=no');
  expect(await s.goblinStamina()).toBe(15 - 4);
  expect((await s.seer()).stamina).toBe(after.stamina);
  expect((await s.saved(overridden.eventId)).strained).toMatchObject({
    applies: false,
    basis: 'declared-not-strained',
  });

  // A correction keeps the strained extra: 5 + 5 + 2 = 12 is tier 2 (4 + R = 6, strained 8); one
  // bane makes 10, tier 1 (4, strained 6). The Talent's own damage is not dealt again.
  await s.heal();
  await atDice(s.t, s.f.campaignId, [5, 5]);
  const corrected = await s.spike();
  expect(await s.goblinStamina()).toBe(15 - 8);
  const seerAfterUse = (await s.seer()).stamina;
  await s.command(
    `/ability correct event="${corrected.eventId}" target=@{foe:${s.goblin}} banes=1`,
  );
  expect(await s.goblinStamina()).toBe(15 - 6);
  expect((await s.seer()).stamina).toBe(seerAfterUse);
});

test('V170: outside combat a declared strain costs 1d6 and incurs the effect', async () => {
  const s = await setup();
  const ref = `@{character:${s.talent}}`;
  await s.command(`${ref} /adjust heroic-resource value=0`);
  await s.command(`${ref} /adjust temporary-stamina value=0`);
  await s.heal();
  const before = await s.seer();
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const used = await s.spike(' strained=yes');
  const read = await s.saved(used.eventId);
  expect(read.strained).toMatchObject({ applies: true, basis: 'outside-combat' });
  const die = (read.strained as { incurDie: { sides: number; value: number } }).incurDie;
  expect(die.sides).toBe(6);
  // 4 + 2 to the goblin; 1d6 then 2 unreducible to the Talent.
  expect(await s.goblinStamina()).toBe(15 - 6);
  expect((await s.seer()).stamina).toBe(before.stamina - die.value - 2);

  // Without the declaration, an unstrained use outside combat applies nothing extra.
  await s.heal();
  await atDice(s.t, s.f.campaignId, [1, 1]);
  const plain = await s.spike();
  expect(await s.goblinStamina()).toBe(15 - 4);
  expect((await s.saved(plain.eventId)).strained).toMatchObject({ applies: false });
});

test('V170: strained= is refused for an ability whose strain the engine does not apply', async () => {
  const s = await setup();
  await expect(
    s.command(
      `@{character:${s.talent}} /ability use ability="Kinetic Grip" targets=[@{foe:${s.goblin}}] strained=yes`,
    ),
  ).rejects.toThrow(/no Strained effect the engine applies/);
});
