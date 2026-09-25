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
