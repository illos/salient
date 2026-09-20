// SPDX-License-Identifier: GPL-3.0-only
// V88 lifecycle fixture: synthetic source occurrence isolates the clock and manual-toggle contract.
// Ability use/correction integration is covered separately. Stream positions are disclosed here.
import { expect, test } from 'vitest';
import type { Id } from '../../convex/_generated/dataModel';
import { dispatchBoundary } from '../../convex/lib/clock';
import { api } from '../../convex/_generated/api';
import { appendEvent } from '../../convex/lib/events';
import {
  applyConditionInstance,
  endConditionInstance,
  hasRolledConditionSave,
} from '../../convex/lib/conditionInstances';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, table } from './fixtures/table';

let sequence = 0;
for (const [die, manual, foeTarget] of [
  [6, false, false],
  [4, false, false],
  [6, true, false],
  [5, false, false],
  [5, false, true],
] as const) {
  test(`save ${die}, manual ${manual}, foe ${foeTarget}: source instance, exact die, retirement and toggle coherence`, async () => {
    const t = backend();
    const f = await table(t);
    const submit = (text: string, director = true) =>
      (director ? f.director : f.player).client.mutation(api.commands.submit, {
        campaignId: f.campaignId,
        commandId: `condition-test-${++sequence}`,
        text,
      });
    if (manual) await submit('@Thorn /condition on name=bleeding', false);
    const foeId = await t.run(ctx =>
      ctx.db.insert('foes', {
        campaignId: f.campaignId,
        name: 'Fixture goblin',
        visible: true,
        sourceSnapshot: JSON.stringify({ name: 'Fixture goblin', text: 'lifecycle fixture' }),
        maxStamina: 15,
        live: { stamina: 15, temporaryStamina: 0 },
      }),
    );
    const target = foeTarget
      ? { kind: 'foe' as const, id: foeId }
      : { kind: 'character' as const, id: f.thornId };
    // The admitted fixture is evaluated Devil/Impressive Horns: saves succeed at 5, not printed 6.
    const baseline = await t.run(async ctx => (await ctx.db.get(f.thornId))!.derivedBaseline);
    expect(baseline.savingThrowThreshold.value).toBe(5);
    const threshold = foeTarget ? 6 : 5;
    const success = die >= threshold;
    await submit('/combat start');
    await submit('/combat commit');
    await submit('/combat roll', false);
    await submit('/combat first side=heroes');
    await submit('@Thorn /turn take', false);
    const source = await t.run(async ctx => {
      const session = await ctx.db.get(f.sessionId!);
      const eventId = await appendEvent(ctx, {
        campaignId: f.campaignId,
        sessionId: f.sessionId!,
        encounterId: session!.encounterId!,
        origin: 'user',
        actor: (await ctx.db.get(f.director.profile.userId))!,
        commandId: `condition-fixture-${++sequence}`,
        kind: 'test.condition',
        description: 'Synthetic source occurrence for lifecycle proof.',
      });
      const instance = await applyConditionInstance(
        ctx,
        { campaignId: f.campaignId, eventId },
        target,
        {
          id: `fixture-${eventId}`,
          condition: 'bleeding',
          sourceUseEventId: eventId,
          actorLabel: 'Fixture goblin',
          abilityName: 'Bury the Point',
          sourcePath: 'monster/goblin/statblock/goblin-warrior.md',
        },
        session!.encounterId!,
      );
      const state = (await ctx.db
        .query('diceStates')
        .withIndex('by_campaign', q => q.eq('campaignId', f.campaignId))
        .unique())!;
      let counter = state.counter;
      while (
        generate(fromHex(state.seed), counter, [{ id: 'save', sides: 10 }]).dice[0]!.value !== die
      )
        counter++;
      await ctx.db.patch(state._id, { counter });
      return { eventId, instance, counter };
    });
    await submit('@Thorn /turn end', false);
    if (foeTarget) {
      await submit(`@{foe:${foeId}} /turn take`);
      await submit('/turn end');
    }
    const live = foeTarget
      ? (await t.run(ctx => ctx.db.get(foeId)))!.live
      : (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
    const instance = live.conditionInstances![0]!;
    expect(instance).toMatchObject({
      sourceUseEventId: source.eventId,
      lastSave: { roll: die, success, threshold },
      status: success ? 'ended' : 'active',
    });
    expect(live.conditions!.bleeding).toBe(manual || !success);
    const registration = await t.run(ctx =>
      ctx.db.get(ctx.db.normalizeId('clockRegistrations', source.instance.registrationId!)!),
    );
    expect(registration!.status).toBe(success ? 'retired' : 'active');
    expect(await t.run(ctx => hasRolledConditionSave(ctx, target, source.eventId))).toBe(true);
    const events = await t.run(ctx =>
      ctx.db
        .query('events')
        .withIndex('by_campaign_sequence', q => q.eq('campaignId', f.campaignId))
        .take(100),
    );
    const save = events.find(event => event.kind === 'clock.saving-throw')!;
    expect(save.dice).toEqual([{ id: 'save', sides: 10, value: die }]);
    expect(save.payload.data.threshold).toBe(threshold);
    expect(instance.lastSave!.thresholdSource).toEqual(save.payload.data.thresholdSource);
    if (foeTarget)
      expect(save.payload.data.thresholdSource).toEqual({
        kind: 'printed',
        sourcePath: 'vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md',
      });
    else
      expect(save.payload.data.thresholdSource).toEqual({
        kind: 'hero-baseline',
        provenance: baseline.savingThrowThreshold.provenance,
      });
    if (!success) expect(save.description).toContain('Hero-token follow-up remains manual');
    const rolls = await t.run(ctx => ctx.db.query('rolls').take(100));
    expect(rolls.find(roll => roll.commandId.startsWith('save_'))!.counterStart).toBe(
      source.counter,
    );
    if (!success) {
      await submit(
        `${foeTarget ? `@{foe:${foeId}}` : '@Thorn'} /condition off name=bleeding`,
        foeTarget,
      );
      const after = foeTarget
        ? (await t.run(ctx => ctx.db.get(foeId)))!.live
        : (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
      expect(after.conditions!.bleeding).toBe(false);
      expect(after.conditionInstances![0]!.status).toBe('ended');
      expect(await t.run(ctx => hasRolledConditionSave(ctx, target, source.eventId))).toBe(true);
    }
  });
}

// Catches ending one source incorrectly clearing another, manual.off retiring only one registration,
// and combat-end expiring the effect rather than merely stopping its encounter schedule.
test('overlapping sources remain coherent through manual removal and combat-end unscheduling', async () => {
  const t = backend();
  const f = await table(t);
  const submit = (text: string) =>
    f.director.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `overlap-command-${++sequence}`,
      text,
    });
  await t.run(ctx =>
    ctx.db.insert('foes', {
      campaignId: f.campaignId,
      name: 'Fixture opponent',
      visible: true,
      sourceSnapshot: JSON.stringify({ name: 'Fixture opponent', text: 'lifecycle fixture' }),
      maxStamina: 15,
      live: { stamina: 15, temporaryStamina: 0 },
    }),
  );
  await submit('/combat start');
  await submit('/combat commit');
  const target = { kind: 'character' as const, id: f.thornId };
  const firstPair = await t.run(async ctx => {
    const session = (await ctx.db.get(f.sessionId!))!;
    const eventId = await appendEvent(ctx, {
      campaignId: f.campaignId,
      sessionId: f.sessionId!,
      encounterId: session.encounterId!,
      origin: 'user',
      actor: (await ctx.db.get(f.director.profile.userId))!,
      commandId: `overlap-source-${++sequence}`,
      kind: 'test.condition',
      description: 'Two independently imposed bleeding sources.',
    });
    const scope = { campaignId: f.campaignId, eventId };
    const make = (id: string) =>
      applyConditionInstance(
        ctx,
        scope,
        target,
        {
          id,
          condition: 'bleeding',
          sourceUseEventId: eventId,
          actorLabel: id,
          abilityName: 'Bury the Point',
          sourcePath: 'monster/goblin/statblock/goblin-warrior.md',
        },
        session.encounterId!,
      );
    return [await make('source-one'), await make('source-two')];
  });
  await t.run(async ctx => {
    const scope = {
      campaignId: f.campaignId,
      eventId: firstPair[0]!.sourceUseEventId as Id<'events'>,
    };
    await endConditionInstance(ctx, scope, target, 'source-one', 'fixture ends only this source');
  });
  let live = (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  expect(live.conditions.bleeding).toBe(true);
  expect(
    live
      .conditionInstances!.filter(instance => instance.status === 'active')
      .map(instance => instance.id),
  ).toEqual(['source-two']);
  // Add another live source so manual.off must retire more than one active registration.
  const third = await t.run(async ctx =>
    applyConditionInstance(
      ctx,
      {
        campaignId: f.campaignId,
        eventId: firstPair[0]!.sourceUseEventId as Id<'events'>,
      },
      target,
      {
        id: 'source-three',
        condition: 'bleeding',
        sourceUseEventId: firstPair[0]!.sourceUseEventId,
        actorLabel: 'Third goblin',
        abilityName: 'Bury the Point',
        sourcePath: 'monster/goblin/statblock/goblin-warrior.md',
      },
      (await ctx.db.get(f.sessionId!))!.encounterId!,
    ),
  );
  const off = await submit('@Thorn /condition off name=bleeding');
  live = (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  expect(live.conditions.bleeding).toBe(false);
  expect(live.conditionInstances!.every(instance => instance.status === 'ended')).toBe(true);
  for (const instance of [...firstPair, third]) {
    expect(
      (await t.run(ctx => ctx.db.get(instance.registrationId as Id<'clockRegistrations'>)))!.status,
    ).toBe('retired');
  }
  const offEvent = (await t.run(ctx => ctx.db.get(off.eventId)))!;
  expect(offEvent.description).toContain('source-two');
  expect(offEvent.description).toContain('Third goblin');
  const retained = await t.run(async ctx => {
    const encounterId = (await ctx.db.get(f.sessionId!))!.encounterId!;
    const eventId = await appendEvent(ctx, {
      campaignId: f.campaignId,
      sessionId: f.sessionId!,
      encounterId,
      origin: 'user',
      actor: (await ctx.db.get(f.director.profile.userId))!,
      commandId: `overlap-ending-${++sequence}`,
      kind: 'test.combat-end',
      description: 'Combat boundary lifecycle fixture.',
    });
    const scope = { campaignId: f.campaignId, eventId };
    const instance = await applyConditionInstance(
      ctx,
      scope,
      target,
      {
        id: 'retained-source',
        condition: 'bleeding',
        sourceUseEventId: eventId,
        actorLabel: 'Remaining goblin',
        abilityName: 'Bury the Point',
        sourcePath: 'monster/goblin/statblock/goblin-warrior.md',
      },
      encounterId,
    );
    await dispatchBoundary(ctx, scope, encounterId, { kind: 'combat-end', round: 1 });
    return instance;
  });
  live = (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  expect(live.conditions.bleeding).toBe(true);
  const retainedLive = live.conditionInstances!.find(instance => instance.id === retained.id)!;
  expect(retainedLive).toMatchObject({
    id: retained.id,
    status: 'active',
    condition: 'bleeding',
    sourceUseEventId: retained.sourceUseEventId,
  });
  expect(retainedLive.registrationId).toBeUndefined();
  expect(retainedLive.lastSave).toBeUndefined();
  const publicEvents = await f.observer.client.query(api.events.list, { campaignId: f.campaignId });
  const unscheduled = publicEvents.events.find(event => event.kind === 'condition.unscheduled');
  expect(unscheduled?.description).toContain("Remaining goblin's Bury the Point");
  expect(unscheduled?.description).toContain('saving throw is no longer scheduled');
  expect(unscheduled?.payload).toMatchObject({
    effectInstanceId: retained.id,
    sourceUseEventId: retained.sourceUseEventId,
    creatureId: f.thornId,
  });

  expect(
    (await t.run(ctx => ctx.db.get(retained.registrationId as Id<'clockRegistrations'>)))!.status,
  ).toBe('retired');
});
