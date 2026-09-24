// SPDX-License-Identifier: GPL-3.0-only
// V146: Talent clarity generation and strain through the combat clock and `resource.claim`.
// Expected values come from pinned feature/talent/level-1/clarity-and-strain.md:
// - "you gain clarity equal to your Victories" at the start of a combat encounter;
// - "At the start of each of your turns during combat, you gain 1d3 clarity.";
// - "the first time each combat round that a creature is force moved, you gain 1 clarity." (claimed);
// - "At the end of each of your turns, you take 1 damage for each negative point of clarity.";
// - "You lose any remaining clarity or reset any negative clarity at the end of the encounter."
// rule/health/temporary-stamina.md: temporary Stamina decreases first when you take damage.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import talentLedger from '../fixtures/v105-talent-expected.json' with { type: 'json' };
import { admitHero, backend, table } from './fixtures/table';

let sequence = 0;
test('V146: a Talent gains clarity, takes strain damage at turn end, and resets at the end', async () => {
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
        ...(talentLedger.witnesses[0]!.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Seer',
      },
      definitions,
    ),
  );
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `talent-resource-${++sequence}`,
      text,
    });
  const ref = `@{character:${talent}}`;
  const live = async () => (await t.run(ctx => ctx.db.get(talent)))!.liveState!;
  const clockEvents = async () =>
    (await t.run(ctx => ctx.db.query('events').take(1000))).filter(
      e =>
        e.kind === 'clock.heroic-resource' &&
        (e.payload as { data: { characterId: string } }).data.characterId === talent,
    );

  await command(`${ref} /adjust victories value=1`);
  await command('/combat start');
  await command('/combat commit');
  expect((await live()).heroicResource).toEqual({ name: 'clarity', current: 1 });
  await command('/combat first side=heroes');
  await command(`${ref} /turn take`, true);
  const gain = (await clockEvents()).find(
    e => (e.payload as { data: { step: string } }).data.step === 'turn-start-gain',
  )!;
  expect((await live()).heroicResource.current).toBe(1 + gain.dice![0]!.value);
  await command(`${ref} /resource claim trigger=talent-forced-movement`, true);
  expect((await live()).heroicResource.current).toBe(2 + gain.dice![0]!.value);

  // Strained at −2 with 1 temporary Stamina: 2 strain damage, 1 absorbed, Stamina −1.
  await command(`${ref} /adjust heroic-resource value=-2`);
  await command(`${ref} /adjust temporary-stamina value=1`);
  const staminaBefore = (await live()).stamina;
  await command(`${ref} /turn end`, true);
  expect((await live()).stamina).toBe(staminaBefore - 1);
  expect((await live()).temporaryStamina).toBe(0);
  const strain = (await clockEvents()).find(
    e => (e.payload as { data: { step: string } }).data.step === 'turn-end-strain',
  )!;
  expect((strain.payload as { data: { damage: number } }).data.damage).toBe(2);

  // Negative clarity resets to 0 at the end of the encounter.
  await command('/combat end');
  await command('/combat victories amount=0 recipients=[]');
  await command('/combat finish');
  expect((await live()).heroicResource.current).toBe(0);
});

// V146 review R1: feature/talent/level-1/steel-ward.md gives "damage immunity equal to your Reason
// score" after damage, tracked by hand, so strain for a Steel Ward Talent is logged as due and left
// to the table; feature/talent/level-1/vanishing-ward.md is set off by damage, so it is named.
test('V146: strain is held for Steel Ward and names Vanishing Ward', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const admit = (id: string, name: string) =>
    admitHero(
      t,
      f.player,
      f.director,
      f.campaignId,
      name,
      draftSelectionsFrom(
        {
          ...(talentLedger.witnesses.find(w => w.id === id)!
            .selections as unknown as EvaluationInput['selections']),
          'details.name': name,
        },
        definitions,
      ),
    );
  const steel = await admit('v105-3', 'Anvil');
  const vanish = await admit('v105-4', 'Mist');
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `talent-ward-${++sequence}`,
      text,
    });
  const live = async (id: typeof steel) => (await t.run(ctx => ctx.db.get(id)))!.liveState!;
  const strain = async (id: typeof steel) =>
    (await t.run(ctx => ctx.db.query('events').take(1000))).find(
      e =>
        e.kind === 'clock.heroic-resource' &&
        (e.payload as { data: { step: string; characterId: string } }).data.step ===
          'turn-end-strain' &&
        (e.payload as { data: { characterId: string } }).data.characterId === id,
    )!;
  await command('/combat start');
  await command('/combat commit');
  await command('/combat first side=heroes');
  for (const id of [steel, vanish]) {
    const ref = `@{character:${id}}`;
    await command(`${ref} /turn take`, true);
    await command(`${ref} /adjust heroic-resource value=-2`);
    await command(`${ref} /adjust temporary-stamina value=0`);
    const before = (await live(id)).stamina;
    await command(`${ref} /turn end`, true);
    if (id === steel) {
      expect((await live(id)).stamina).toBe(before);
      expect((await strain(id)).payload).toMatchObject({ data: { damage: 2, held: 'Steel Ward' } });
    } else {
      expect((await live(id)).stamina).toBe(before - 2);
      expect((await strain(id)).description).toMatch(/Vanishing Ward/);
    }
  }
});
