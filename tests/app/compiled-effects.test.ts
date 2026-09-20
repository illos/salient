// SPDX-License-Identifier: GPL-3.0-only
/** V72 persisted cases BS2/7/8 and BP2/5. Expected arithmetic: V26 ability appendix, fb83a789.
 * Uses the original A05 public-operation fixture with disclosed dice stream positioning.
 * Corrections, dispositions and restoration run through registered operations. The labeled
 * source-drift, historical-schema and repeated-clause fixtures exercise persisted contract boundaries.
 */
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import {
  effectOccurrences,
  type CompiledResult,
  type PublicCompiledResult,
} from '../../shared/contracts/compiledResult';
import { backend, table, type Backend } from './fixtures/table';

type Fixture = Awaited<ReturnType<typeof table>>;
type Client = Fixture['director']['client'];
let sequence = 0;
const id = () => `compiled-${++sequence}`;
const command = (client: Client, campaignId: Id<'campaigns'>, text: string) =>
  client.mutation(api.commands.submit, { campaignId, text, commandId: id() });

async function dice(t: Backend, campaignId: Id<'campaigns'>) {
  await t.run(async ctx => {
    let state = await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique();
    if (!state) {
      const stateId = await ctx.db.insert('diceStates', {
        campaignId,
        seed: 'a1'.repeat(32),
        counter: 0,
      });
      state = (await ctx.db.get(stateId))!;
    }
    for (let counter = state.counter; counter < state.counter + 100000; counter++) {
      const roll = generate(fromHex(state.seed), counter, [
        { id: 'a', sides: 10 },
        { id: 'b', sides: 10 },
      ]);
      if (roll.dice.every(d => d.value === 7)) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('No 7+7 position found');
  });
}

async function setup(t: Backend) {
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  await command(f.director.client, f.campaignId, '@Thorn /adjust stamina value=30');
  await command(f.director.client, f.campaignId, '@Thorn /adjust heroic-resource value=0');
  const goblins: Id<'foes'>[] = [];
  for (let i = 0; i < 2; i++)
    goblins.push(
      await f.director.client.mutation(api.foes.add, {
        campaignId: f.campaignId,
        definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
        commandId: id(),
      }),
    );
  await command(f.director.client, f.campaignId, '/combat start');
  await command(f.director.client, f.campaignId, '/combat commit');
  await command(f.player.client, f.campaignId, '/combat roll');
  await command(f.director.client, f.campaignId, '/combat first side=heroes');
  await command(f.player.client, f.campaignId, '@Thorn /turn take');
  return { ...f, goblin: goblins[0]!, other: goblins[1]! };
}
async function saved(t: Backend, event: Id<'events'>) {
  return (await t.run(ctx =>
    ctx.db
      .query('abilityResults')
      .withIndex('by_event', q => q.eq('eventId', event))
      .unique(),
  ))!;
}
async function read(client: Client, campaignId: Id<'campaigns'>, event: Id<'events'>) {
  return (await client.query(api.abilities.results, { campaignId, eventIds: [event] }))[0]!;
}
function effect(
  result: CompiledResult | PublicCompiledResult,
  kind: 'push' | 'unsupported' | 'condition',
) {
  const occurrence = result.effects.find(o => o.effect.kind === kind);
  if (!occurrence) throw new Error(`Missing ${kind}`);
  return occurrence;
}
function resolve(
  client: Client,
  campaignId: Id<'campaigns'>,
  event: Id<'events'>,
  occurrence: string,
  target: Id<'foes'> | Id<'characters'>,
  refKind: 'foe' | 'character' = 'foe',
  commandId = id(),
) {
  return client.mutation(api.commands.invoke, {
    campaignId,
    commandId,
    operation: 'ability.resolved',
    arguments: { event, occurrence, target: { refKind, id: target } },
  });
}

describe('V72 persisted compiled effects', () => {
  test('BS2/7: saved inputs, conservative push, correction revisions, privacy and exact undo/redo', async () => {
    const t = backend();
    const f = await setup(t);
    await dice(t, f.campaignId);
    const used = await command(
      f.player.client,
      f.campaignId,
      `@Thorn /ability use ability="Brutal Slam" targets=[@{foe:${f.goblin}}]`,
    );
    const initial = await saved(t, used.eventId);
    const originalRolls = await t.run(ctx => ctx.db.query('rolls').take(100));
    const compiled = initial.compiled as CompiledResult;
    expect(initial.dice).toEqual({ d10a: 7, d10b: 7 });
    expect(initial.targets[0]!.outcome).toMatchObject({
      total: 16,
      tier: 2,
      damage: { rolledDamage: 8 },
    });
    const push = effect(compiled, 'push');
    expect(push.effect).toMatchObject({
      status: 'fact-needed',
      printed: 2,
      sizeBonus: 1,
      subtotal: 3,
      stability: 0,
    });
    expect(push.effect).not.toHaveProperty('allowance');
    if (push.effect.kind !== 'push') throw new Error('Wrong kind');
    expect(push.effect.requirements).toEqual(
      expect.arrayContaining([
        'actor.conditions',
        'actor.traits',
        'actor.modifiers',
        `target:${f.goblin}.conditions`,
        `target:${f.goblin}.traits`,
        `target:${f.goblin}.modifiers`,
      ]),
    );
    expect((await t.run(ctx => ctx.db.get(f.goblin)))!.live.stamina).toBe(7);
    const publicResult = (await read(f.player.client, f.campaignId, used.eventId))
      .compiled as PublicCompiledResult;
    expect(publicResult).not.toHaveProperty('inputs');
    const publicDamage = publicResult.effects.find(o => o.effect.kind === 'damage')!;
    expect(publicDamage.effect).not.toHaveProperty('application.staminaAfter');
    expect(publicResult.effects.find(o => o.id === push.id)).toEqual(push);

    const correct = (banes: number) =>
      command(
        f.player.client,
        f.campaignId,
        `/ability correct event="${used.eventId}" target=@{foe:${f.goblin}} edges=0 banes=${banes}`,
      );
    const one = await correct(1);
    const first = await saved(t, used.eventId);
    expect(first.dice).toEqual(initial.dice);
    expect(first.targets[0]!.outcome).toMatchObject({
      total: 14,
      tier: 2,
      damage: { rolledDamage: 8 },
    });
    expect((first.compiled as CompiledResult).revision).toBe(one.eventId);
    expect(effect(first.compiled as CompiledResult, 'push').effect).toMatchObject({ subtotal: 3 });
    await expect(
      resolve(f.director.client, f.campaignId, used.eventId, push.id, f.goblin),
    ).rejects.toThrow(/stale|current/);
    const two = await correct(2);
    const second = await saved(t, used.eventId);
    expect(second.dice).toEqual(initial.dice);
    expect(second.targets[0]!.outcome).toMatchObject({ tier: 1, damage: { rolledDamage: 5 } });
    expect((second.compiled as CompiledResult).revision).toBe(two.eventId);
    expect(effect(second.compiled as CompiledResult, 'push').effect).toMatchObject({ subtotal: 2 });
    expect((await t.run(ctx => ctx.db.get(f.goblin)))!.live.stamina).toBe(10);
    await command(f.player.client, f.campaignId, '/history undo');
    expect((await saved(t, used.eventId)).compiled).toEqual(first.compiled);
    await command(f.player.client, f.campaignId, '/history redo');
    expect((await saved(t, used.eventId)).compiled).toEqual(second.compiled);
    expect((await t.run(ctx => ctx.db.get(f.goblin)))!.live.stamina).toBe(10);
    expect(await t.run(ctx => ctx.db.query('rolls').take(100))).toEqual(originalRolls);
  });

  test('BS8: only the Director can dispose the exact current target occurrence; rewind restores its identity', async () => {
    const t = backend();
    const f = await setup(t);
    await dice(t, f.campaignId);
    const used = await command(
      f.player.client,
      f.campaignId,
      `@Thorn /ability use ability="Brutal Slam" targets=[@{foe:${f.goblin}}]`,
    );
    const before = await saved(t, used.eventId);
    const push = effect(before.compiled as CompiledResult, 'push');
    await expect(
      resolve(f.player.client, f.campaignId, used.eventId, push.id, f.goblin),
    ).rejects.toThrow(/Director|director/);
    await expect(
      resolve(f.director.client, f.campaignId, used.eventId, push.id, f.other),
    ).rejects.toThrow(/target/);
    const commandId = id();
    const disposed = await resolve(
      f.director.client,
      f.campaignId,
      used.eventId,
      push.id,
      f.goblin,
      'foe',
      commandId,
    );
    const after = await saved(t, used.eventId);
    expect(effect(after.compiled as CompiledResult, 'push')).toMatchObject({
      id: push.id,
      disposition: { eventId: disposed.eventId },
    });
    expect(after.targets).toEqual(before.targets);
    expect((await t.run(ctx => ctx.db.get(f.goblin)))!.live.stamina).toBe(7);
    expect(
      await resolve(
        f.director.client,
        f.campaignId,
        used.eventId,
        push.id,
        f.goblin,
        'foe',
        commandId,
      ),
    ).toEqual(disposed);
    await expect(
      resolve(f.director.client, f.campaignId, used.eventId, push.id, f.goblin),
    ).rejects.toThrow(/already/);
    const correct = () =>
      command(
        f.director.client,
        f.campaignId,
        `/ability correct event="${used.eventId}" target=@{foe:${f.goblin}} edges=0 banes=2`,
      );
    expect((await read(f.director.client, f.campaignId, used.eventId)).mayCorrect).toBe(false);
    await expect(correct()).rejects.toThrow(/rewind/);
    await command(f.director.client, f.campaignId, '/history rewind');
    expect((await saved(t, used.eventId)).compiled).toEqual(before.compiled);
    await command(f.director.client, f.campaignId, '/history redo');
    expect((await saved(t, used.eventId)).compiled).toEqual(after.compiled);
    await command(f.director.client, f.campaignId, '/history rewind');
    await correct();
    expect((await t.run(ctx => ctx.db.get(f.goblin)))!.live.stamina).toBe(10);
    expect(
      effect((await saved(t, used.eventId)).compiled as CompiledResult, 'push').disposition,
    ).toBeUndefined();
  });

  test('BP2/5: correction replaces potency occurrence; resisted conditions refuse disposition and schedule no save', async () => {
    const t = backend();
    const f = await setup(t);
    await command(f.player.client, f.campaignId, '@Thorn /turn end');
    await command(f.director.client, f.campaignId, '/adjust malice value=2');
    await command(f.director.client, f.campaignId, `@{foe:${f.goblin}} /turn take`);
    await dice(t, f.campaignId);
    const used = await command(
      f.director.client,
      f.campaignId,
      `@{foe:${f.goblin}} /ability use ability="Bury the Point" targets=[@Thorn]`,
    );
    const initial = await saved(t, used.eventId);
    expect(initial.targets[0]!.outcome).toMatchObject({ tier: 2, damage: { rolledDamage: 6 } });
    const potency = effect(initial.compiled as CompiledResult, 'condition');
    expect(potency.effect).toMatchObject({ kind: 'condition', status: 'resisted' });
    expect(potency.effect.clause).toContain('M < 1');
    expect((await t.run(ctx => ctx.db.get(f.campaignId)))!.malice).toBe(0);
    const heroBefore = (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState;
    expect(heroBefore!.stamina).toBe(24);
    const corrected = await command(
      f.director.client,
      f.campaignId,
      `/ability correct event="${used.eventId}" target=@Thorn edges=0 banes=2`,
    );
    const current = await saved(t, used.eventId);
    expect(current.dice).toEqual({ d10a: 7, d10b: 7 });
    const currentPotency = effect(current.compiled as CompiledResult, 'condition');
    expect(currentPotency.id).not.toBe(potency.id);
    expect(currentPotency.revision).toBe(corrected.eventId);
    expect(currentPotency.effect).toMatchObject({ kind: 'condition', status: 'resisted' });
    expect(currentPotency.effect.clause).toContain('M < 0');
    await expect(
      resolve(f.director.client, f.campaignId, used.eventId, potency.id, f.thornId, 'character'),
    ).rejects.toThrow(/stale|current/);
    const heroCorrected = (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState;
    expect(heroCorrected!.stamina).toBe(25);
    const rollCount = (await t.run(ctx => ctx.db.query('rolls').take(100))).length;
    const scheduled = await t.run(ctx => ctx.db.query('clockRegistrations').take(100));
    await expect(
      resolve(
        f.director.client,
        f.campaignId,
        used.eventId,
        currentPotency.id,
        f.thornId,
        'character',
      ),
    ).rejects.toThrow(/applied|resisted|disposition/);
    expect((await t.run(ctx => ctx.db.get(f.thornId)))!.liveState).toEqual(heroCorrected);
    expect((await t.run(ctx => ctx.db.get(f.campaignId)))!.malice).toBe(0);
    expect((await t.run(ctx => ctx.db.query('rolls').take(100))).length).toBe(rollCount);
    expect(await t.run(ctx => ctx.db.query('clockRegistrations').take(100))).toEqual(scheduled);
    const publicCompiled = (await read(f.player.client, f.campaignId, used.eventId)).compiled;
    expect(JSON.stringify(publicCompiled)).not.toContain('Crafty');
    expect(JSON.stringify(publicCompiled)).not.toContain('Spear Charge');
    expect(publicCompiled).not.toHaveProperty('inputs');
    await command(f.director.client, f.campaignId, '/history rewind');
    expect((await saved(t, used.eventId)).compiled).toEqual(initial.compiled);
    const heroRestored = (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState;
    const scheduledRestored = await t.run(ctx => ctx.db.query('clockRegistrations').take(100));
    await expect(
      resolve(f.director.client, f.campaignId, used.eventId, potency.id, f.thornId, 'character'),
    ).rejects.toThrow(/applied|resisted|disposition/);
    expect((await t.run(ctx => ctx.db.get(f.thornId)))!.liveState).toEqual(heroRestored);
    expect((await t.run(ctx => ctx.db.get(f.campaignId)))!.malice).toBe(0);
    expect((await t.run(ctx => ctx.db.query('rolls').take(100))).length).toBe(rollCount);
    expect(await t.run(ctx => ctx.db.query('clockRegistrations').take(100))).toEqual(
      scheduledRestored,
    );
  });
  test('restored foe aliases keep occurrence identity and accept the current target without disclosing health', async () => {
    const t = backend();
    const f = await setup(t);
    await dice(t, f.campaignId);
    const used = await command(
      f.player.client,
      f.campaignId,
      `@Thorn /ability use ability="Brutal Slam" targets=[@{foe:${f.goblin}}]`,
    );
    const original = (await saved(t, used.eventId)).compiled as CompiledResult;
    const push = effect(original, 'push');
    await f.director.client.mutation(api.foes.remove, {
      campaignId: f.campaignId,
      foeId: f.goblin,
      commandId: id(),
    });
    await command(f.director.client, f.campaignId, '/history rewind');
    expect(await t.run(ctx => ctx.db.get(f.goblin))).toBeNull();
    const result = await read(f.director.client, f.campaignId, used.eventId);
    const restoredId = result.targets[0]!.target.id as Id<'foes'>;
    expect(restoredId).not.toBe(f.goblin);
    expect(result.targets[0]!.originalTargetId).toBe(f.goblin);
    expect((result.compiled as PublicCompiledResult).effects).toEqual(original.effects);
    expect(result.compiled).not.toHaveProperty('inputs');
    const playerResult = await read(f.player.client, f.campaignId, used.eventId);
    const damage = (playerResult.compiled as PublicCompiledResult).effects.find(
      o => o.effect.kind === 'damage',
    )!;
    expect(damage.effect).not.toHaveProperty('application.staminaAfter');
    await resolve(f.director.client, f.campaignId, used.eventId, push.id, restoredId);
    expect(effect((await saved(t, used.eventId)).compiled as CompiledResult, 'push').id).toBe(
      push.id,
    );
    expect((await t.run(ctx => ctx.db.get(restoredId)))!.live.stamina).toBe(7);
  });
  test('changed paid compatibility source records a diagnosis before dice, payment, action use or damage', async () => {
    const t = backend();
    const f = await setup(t);
    await command(f.director.client, f.campaignId, '@Thorn /adjust heroic-resource value=3');
    await t.run(async ctx => {
      // Deliberate malformed persisted-source fixture, never a new rule or forged result.
      const entry = await ctx.db
        .query('content')
        .withIndex('by_contentId', q =>
          q.eq('contentId', 'mcdm.heroes.v1/feature.ability.fury.level-1/out-of-the-way'),
        )
        .unique();
      await ctx.db.patch(entry!._id, {
        text: entry!.text + '\nThe target takes 20 extra damage.\n',
      });
    });
    const hero = (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState;
    const goblin = (await t.run(ctx => ctx.db.get(f.goblin)))!.live;
    const rolls = await t.run(ctx => ctx.db.query('rolls').take(100));
    const actions = await t.run(ctx => ctx.db.query('actionUses').take(100));
    const used = await command(
      f.player.client,
      f.campaignId,
      `@Thorn /ability use ability="Out of the Way!" targets=[@{foe:${f.goblin}}]`,
    );
    const event = (await t.run(ctx => ctx.db.get(used.eventId)))!;
    expect(event.kind).toBe('ability.recorded');
    expect(event.payload).toMatchObject({
      data: {
        manual: true,
        ability: { execution: { mode: 'manual' } },
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ code: 'live-source-drift' }),
        ]),
      },
    });
    expect(await saved(t, used.eventId)).toBeNull();
    expect((await t.run(ctx => ctx.db.get(f.thornId)))!.liveState).toEqual(hero);
    expect((await t.run(ctx => ctx.db.get(f.goblin)))!.live).toEqual(goblin);
    expect(await t.run(ctx => ctx.db.query('rolls').take(100))).toEqual(rolls);
    expect(await t.run(ctx => ctx.db.query('actionUses').take(100))).toEqual(actions);
  });
  test('even a still-compilable altered tier is manual at the registered execution boundary', async () => {
    const t = backend();
    const f = await setup(t);
    await t.run(async ctx => {
      const entry = await ctx.db
        .query('content')
        .withIndex('by_contentId', q =>
          q.eq('contentId', 'mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam'),
        )
        .unique();
      const effects = structuredClone(entry!.structured.effects) as { tier2: string }[];
      effects[0]!.tier2 = effects[0]!.tier2.replace('6 + M damage', '60 + M damage');
      await ctx.db.patch(entry!._id, {
        text: entry!.text.replaceAll('6 + M damage', '60 + M damage'),
        structured: { ...entry!.structured, effects },
      });
    });
    const before = await t.run(async ctx => ({
      hero: (await ctx.db.get(f.thornId))!.liveState,
      foe: (await ctx.db.get(f.goblin))!.live,
      dice: await ctx.db
        .query('diceStates')
        .withIndex('by_campaign', q => q.eq('campaignId', f.campaignId))
        .unique(),
      actions: await ctx.db.query('actionUses').take(100),
    }));
    const used = await command(
      f.player.client,
      f.campaignId,
      `@Thorn /ability use ability="Brutal Slam" targets=[@{foe:${f.goblin}}]`,
    );
    expect((await t.run(ctx => ctx.db.get(used.eventId)))!.kind).toBe('ability.recorded');
    expect(await saved(t, used.eventId)).toBeNull();
    expect(
      await t.run(async ctx => ({
        hero: (await ctx.db.get(f.thornId))!.liveState,
        foe: (await ctx.db.get(f.goblin))!.live,
        dice: await ctx.db
          .query('diceStates')
          .withIndex('by_campaign', q => q.eq('campaignId', f.campaignId))
          .unique(),
        actions: await ctx.db.query('actionUses').take(100),
      })),
    ).toEqual(before);
  });

  test('reading a historical result never compiles it or adds effect occurrences', async () => {
    const t = backend();
    const f = await setup(t);
    await dice(t, f.campaignId);
    const used = await command(
      f.player.client,
      f.campaignId,
      `@Thorn /ability use ability="Brutal Slam" targets=[@{foe:${f.goblin}}]`,
    );
    const row = await saved(t, used.eventId);
    // Represent the pre-V72 additive schema: genuine use/result minus only the new optional fields.
    await t.run(ctx => ctx.db.patch(row._id, { compiled: undefined, execution: undefined }));
    const before = await saved(t, used.eventId);
    for (const client of [f.player.client, f.director.client]) {
      const result = await read(client, f.campaignId, used.eventId);
      expect(result).not.toHaveProperty('compiled');
      expect(result.targets[0]).not.toHaveProperty('originalTargetId');
      expect(result.targets[0]!.dispositions).toEqual([]);
    }
    expect(await saved(t, used.eventId)).toEqual(before);
  });
  test('occurrence-storage fixture: identical clauses remain independently addressable and ambiguous text is refused', async () => {
    const t = backend();
    const f = await setup(t);
    await command(f.player.client, f.campaignId, '@Thorn /turn end');
    await command(f.director.client, f.campaignId, '/adjust malice value=2');
    await command(f.director.client, f.campaignId, `@{foe:${f.goblin}} /turn take`);
    await dice(t, f.campaignId);
    const used = await command(
      f.director.client,
      f.campaignId,
      `@{foe:${f.goblin}} /ability use ability="Bury the Point" targets=[@Thorn]`,
    );
    const row = await saved(t, used.eventId);
    const compiled = structuredClone(row.compiled) as CompiledResult;
    const first = effect(compiled, 'condition');
    const nodeIndex = compiled.definition.tiers[1]!.findIndex(
      candidate => candidate.id === first.effect.nodeId,
    );
    const originalNode = compiled.definition.tiers[1]![nodeIndex]!;
    const node = {
      id: originalNode.id,
      locator: originalNode.locator,
      clause: originalNode.clause,
      kind: 'unsupported' as const,
      shape: 'fixture:manual-clause',
      reason: 'Synthetic occurrence-storage fixture',
      dependency: 'after-damage' as const,
    };
    compiled.definition.tiers[1]![nodeIndex] = node;
    first.effect = {
      nodeId: node.id,
      locator: node.locator,
      clause: node.clause,
      targetId: first.effect.targetId,
      kind: 'unsupported',
      status: 'manual',
      reason: node.reason,
      dependency: node.dependency,
    };
    // Test-only occurrence-storage contract fixture. This synthetic second node is NOT a claim
    // that Bury the Point prints repeated clauses or that this source shape is live-eligible.
    // A real public use supplies the authority/history context. Its condition remainder is explicitly
    // replaced with a synthetic manual node before duplicating the saved effect list.
    const secondNode = {
      ...node,
      id: `${compiled.definition.id}#fixture:repeated-clause:1`,
      locator: 'fixture:repeated-clause:1',
    };
    compiled.definition.tiers[1]!.push(secondNode);
    const second = effectOccurrences(used.eventId, compiled.revision, [
      { ...first.effect, nodeId: secondNode.id, locator: secondNode.locator },
    ])[0]!;
    compiled.effects.push(second);
    await t.run(ctx => ctx.db.patch(row._id, { compiled }));
    const ambiguous = () =>
      f.director.client.mutation(api.commands.invoke, {
        campaignId: f.campaignId,
        commandId: id(),
        operation: 'ability.resolved',
        arguments: {
          event: used.eventId,
          clause: first.effect.clause,
          target: { refKind: 'character', id: f.thornId },
        },
      });
    await expect(ambiguous()).rejects.toThrow(/ambiguous/);
    const firstDisposition = await resolve(
      f.director.client,
      f.campaignId,
      used.eventId,
      first.id,
      f.thornId,
      'character',
    );
    const afterFirst = (await read(f.director.client, f.campaignId, used.eventId))
      .compiled as PublicCompiledResult;
    expect(afterFirst.effects.find(occurrence => occurrence.id === first.id)).toMatchObject({
      disposition: { eventId: firstDisposition.eventId },
    });
    expect(afterFirst.effects.find(occurrence => occurrence.id === second.id)).toEqual(second);
    await expect(
      resolve(f.director.client, f.campaignId, used.eventId, first.id, f.thornId, 'character'),
    ).rejects.toThrow(/already/);
    // A prior disposition never makes identical printed text a safe identity shortcut.
    await expect(ambiguous()).rejects.toThrow(/ambiguous/);
    const secondDisposition = await resolve(
      f.director.client,
      f.campaignId,
      used.eventId,
      second.id,
      f.thornId,
      'character',
    );
    const afterSecond = (await read(f.director.client, f.campaignId, used.eventId))
      .compiled as PublicCompiledResult;
    expect(afterSecond.effects.find(occurrence => occurrence.id === first.id)).toEqual(
      afterFirst.effects.find(occurrence => occurrence.id === first.id),
    );
    expect(afterSecond.effects.find(occurrence => occurrence.id === second.id)).toMatchObject({
      disposition: { eventId: secondDisposition.eventId },
    });
    expect(secondDisposition.eventId).not.toBe(firstDisposition.eventId);
  });
});
