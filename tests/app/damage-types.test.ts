// SPDX-License-Identifier: GPL-3.0-only
/**
 * V177 Hurl Element's damage-type choice through the registered operations, with persisted readback
 * and Convex's transaction limits enforced. Expected values come from the pinned Compendium
 * (en/unified/md) and the reviewed ledgers, never from a run of the code under test:
 * - feature/ability/elementalist/level-1/hurl-element.md: Power Roll + Reason; Effect: "When you
 *   make this strike, choose the damage type from one of the following options: acid, cold,
 *   corruption, fire, lightning, poison, or sonic."
 * - tests/fixtures/v104-elementalist-expected.json, v104-1: Reason 2 and the typed Hurl Element
 *   damage by tier (Hurl Element: Cold and Hurl Element: Acid, 5/7/9). Dice 7 + 6 + 2 = 15 is tier 2;
 *   with one edge (+2, rule/dice/edge.md) 17 is tier 3.
 * - feature/trait/revenant/tough-but-withered.md: "Your undead body grants you immunity to cold,
 *   corruption, lightning, and poison damage equal to your level" (level 1: cold immunity 1).
 * - rule/damage/damage-immunity.md: "Whenever a target with damage immunity takes damage of the
 *   indicated type, they can reduce the damage by the value of the immunity".
 */
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { readFileSync } from 'node:fs';
import type { EvaluationInput, SelectionValue } from '../../shared/contracts/characterEvaluation';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { definitions } from '../../shared/content/level-one-decisions';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import elementalistLedger from '../fixtures/v104-elementalist-expected.json' with { type: 'json' };
import { admitHero, table, type Backend } from './fixtures/table';

const modules = import.meta.glob('../../convex/**/*.ts');

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

/** A level 1 Revenant (the remaining-ancestries fixture's Fury with the ancestry replaced). */
function revenant() {
  const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
    selections: Record<string, SelectionValue>;
  };
  for (const key of Object.keys(fixture.selections))
    if (key.startsWith('ancestry.')) delete fixture.selections[key];
  return draftSelectionsFrom(
    {
      ...fixture.selections,
      'details.name': 'Ghost',
      'ancestry.choice': 'Revenant',
      'ancestry.revenant.former-life': 'Memonek',
      'ancestry.revenant.memonek.purchased-traits': ['Keeper of Order'],
    },
    getDefinitions(1),
  );
}

let sequence = 0;
test('Hurl Element needs its damage type, applies it to immunity, and a correction keeps it', async () => {
  const t = convexTest({ schema, modules, transactionLimits: true }) as unknown as Backend;
  betterAuthTest.register(t);
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const witness = elementalistLedger.witnesses[0]!;
  await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Mage',
    draftSelectionsFrom(
      {
        ...(witness.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Mage',
      },
      definitions,
    ),
  );
  const ghost = (await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Ghost',
    revenant(),
  )) as Id<'characters'>;
  const command = (text: string, client = f.director.client) =>
    client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `hurl-element-${++sequence}`,
      text,
    });
  const staminaOf = async () => (await t.run(ctx => ctx.db.get(ghost)))!.liveState!.stamina;
  const damageOf = async (eventId: Id<'events'>) => {
    const compiled = (
      await f.director.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [eventId],
      })
    )[0]!.compiled as PublicCompiledResult;
    expect(compiled.definition.execution).toBe('supported');
    const damage = compiled.effects.find(o => o.effect.kind === 'damage')!.effect;
    return damage.kind === 'damage' ? damage : undefined;
  };
  const byTier = (name: string) => witness.rolledActions.find(a => a.name === name)!.damageByTier;
  const use = (extra: string) =>
    command(`@Mage /ability use ability="Hurl Element" targets=[@Ghost]${extra}`, f.player.client);

  // Refused before any roll: no choice, or a type the Effect doesn't print.
  await expect(use('')).rejects.toThrow(/needs its damage type/);
  await expect(use(' damage-type=holy')).rejects.toThrow(/not one of them/);

  await command('@Ghost /adjust stamina value=20');
  await atDice(t, f.campaignId, [7, 6]);
  const cold = await use(' damage-type=cold');
  expect(await damageOf(cold.eventId)).toMatchObject({
    breakdown: { rolledDamage: byTier('Hurl Element: Cold')[1], damageType: 'cold' },
    application: { immunityApplied: 1 },
  });
  expect(await staminaOf()).toBe(20 - (byTier('Hurl Element: Cold')[1]! - 1));

  // A correction to tier 3 recomputes with the saved cold choice.
  await command(`/ability correct event="${cold.eventId}" target=@Ghost edges=1 banes=0`);
  expect(await damageOf(cold.eventId)).toMatchObject({
    breakdown: { rolledDamage: byTier('Hurl Element: Cold')[2], damageType: 'cold' },
    application: { immunityApplied: 1 },
  });
  expect(await staminaOf()).toBe(20 - (byTier('Hurl Element: Cold')[2]! - 1));

  // Acid is not one of the Revenant's immunities.
  await command('@Ghost /adjust stamina value=20');
  await atDice(t, f.campaignId, [7, 6]);
  const acid = await use(' damage-type=acid');
  expect(await damageOf(acid.eventId)).toMatchObject({
    breakdown: { rolledDamage: byTier('Hurl Element: Acid')[1], damageType: 'acid' },
    application: { immunityApplied: 0 },
  });
  expect(await staminaOf()).toBe(20 - byTier('Hurl Element: Acid')[1]!);
});
