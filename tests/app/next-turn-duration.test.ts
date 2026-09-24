// SPDX-License-Identifier: GPL-3.0-only
/**
 * V172: the owner-anchored "until the end of your next turn" through real clock boundaries.
 * Expected values come from the user's ruling on Q-EFFECT-1 (B, 2026-09-24,
 * docs/rules-questions-for-user.md) over the pinned Compendium (en/unified/md):
 * - feature/ability/elementalist/level-3/swarm-of-spirits.md: "Until the end of your next turn, …".
 * - feature/ability/shadow/level-2/sticky-bomb.md: the target can disarm the bomb "as a main action.
 *   If they don't, at the end of your next turn, the bomb detonates", so used on your own turn it
 *   outlasts that turn: ruling B, it ends at the end of your following turn.
 * - rule/combat/end-of-turn.md: the "(EoT)" carve-out ("or the end of their current turn if the
 *   effect was imposed on their current turn") is the target-anchored rule and stays unchanged.
 * Instances are stored through the library with a synthetic source occurrence, as the V158 test does:
 * no compiled hero ability prints the phrase with admitted table work yet.
 */
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EffectDuration } from '../../shared/contracts/liveState';
import { appendEvent } from '../../convex/lib/events';
import { applyEffectInstance } from '../../convex/lib/effectInstances';
import { backend, table } from './fixtures/table';

let sequence = 0;
test('V172: "until the end of your next turn" lasts through the owner\'s following turn', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `next-turn-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `next-turn-${++sequence}`,
      text,
    });
  const invoke = (operation: string, args: Record<string, unknown>) =>
    f.director.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: `next-turn-${++sequence}`,
      operation,
      arguments: args,
    });
  const goblinRef = `@{foe:${goblin}}`;
  const thorn = { kind: 'character' as const, id: f.thornId, name: 'Thorn' };
  const gob = { kind: 'foe' as const, id: goblin, name: 'Goblin Warrior' };
  const apply = (
    printedDuration: EffectDuration,
    owner: typeof thorn | typeof gob,
    subject: typeof thorn | typeof gob,
  ) =>
    t.run(async ctx => {
      const session = (await ctx.db.get(f.sessionId!))!;
      const eventId = await appendEvent(ctx, {
        campaignId: f.campaignId,
        sessionId: f.sessionId!,
        encounterId: session.encounterId ?? null,
        origin: 'user',
        actor: (await ctx.db.get(f.director.profile.userId))!,
        commandId: `next-turn-source-${++sequence}`,
        kind: 'test.effect',
        description: 'Synthetic source occurrence.',
      });
      const stored = await applyEffectInstance(
        ctx,
        { campaignId: f.campaignId, eventId },
        {
          id: `next-turn-${eventId}`,
          kind: 'instruction',
          sourceUseEventId: eventId,
          sourceActorId: owner.id,
          // Distinct abilities, so the same-ability stacking rule doesn't apply.
          abilityId: `next-turn-ability-${eventId}`,
          abilityName: 'Fixture Ability',
          actorLabel: owner.name,
          sourcePath: 'feature/ability/elementalist/level-3/swarm-of-spirits.md',
          clause: 'Fixture clause.',
          owner,
          subject,
          payload: { kind: 'instruction', text: 'Fixture table work.' },
          printedDuration,
          endsWhen: [],
          appliedSequence: (await ctx.db.get(eventId))!.sequence,
        },
        session.encounterId ?? undefined,
      );
      if (!stored || !('instance' in stored)) throw new Error('Expected a tracked instance.');
      return stored.instance;
    });
  const find = async (id: string) =>
    [
      ...((await t.run(ctx => ctx.db.get(goblin)))?.live.effectInstances ?? []),
      ...((await t.run(ctx => ctx.db.get(f.thornId)))?.liveState?.effectInstances ?? []),
    ].find(instance => instance.id === id)!;
  const registration = (id: string) => t.run(ctx => ctx.db.get(id as Id<'clockRegistrations'>));
  const encounter = async () =>
    t.run(async ctx => ctx.db.get((await ctx.db.get(f.sessionId!))!.encounterId!));
  const ownerNextTurn: EffectDuration = { kind: 'end-of-next-turn', anchor: 'owner' };

  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  const thornsFirstTurn = (await encounter())!.activeTurnId!;

  // 1. Used on the owner's own turn: bound to Thorn, and that turn's end is excluded.
  const onOwnTurn = await apply(ownerNextTurn, thorn, gob);
  expect(onOwnTurn).toMatchObject({
    status: 'active',
    printedDuration: ownerNextTurn,
    duration: { kind: 'end-of-next-turn', creatureId: f.thornId },
  });
  expect(await registration(onOwnTurn.registrationIds[0]!)).toMatchObject({
    status: 'active',
    timing: { scope: 'end-of-next-turn', creatureId: f.thornId, excludeTurnId: thornsFirstTurn },
    work: { kind: 'expire-effect', effectInstanceId: onOwnTurn.id },
  });
  // Unchanged: the subject-anchored "their next turn" on the subject's own turn ends with it.
  const theirs = await apply({ kind: 'end-of-next-turn', anchor: 'subject' }, gob, thorn);
  expect((await registration(theirs.registrationIds[0]!))!.timing).not.toHaveProperty(
    'excludeTurnId',
  );

  // 2. The owner's current turn ends: the effect survives it.
  await command('@Thorn /turn end', true);
  expect((await find(onOwnTurn.id)).status).toBe('active');
  expect(await find(theirs.id)).toMatchObject({
    status: 'ended',
    endedReason: 'end of the next turn',
  });

  // 3. Used off the owner's turn (on the goblin's turn): no turn is excluded, so the owner's next
  // turn end is the first one after application.
  await command(`${goblinRef} /turn take`);
  const offTurn = await apply(ownerNextTurn, thorn, gob);
  const offTiming = (await registration(offTurn.registrationIds[0]!))!.timing;
  expect(offTiming).toMatchObject({ scope: 'end-of-next-turn', creatureId: f.thornId });
  expect(offTiming).not.toHaveProperty('excludeTurnId');
  // Another creature's turn end ends neither.
  await command('/turn end');
  expect((await find(onOwnTurn.id)).status).toBe('active');
  expect((await find(offTurn.id)).status).toBe('active');

  // 4. The owner's next turn: both last through it and end at its end, persisted.
  await command('@Thorn /turn take', true);
  expect((await encounter())!.round).toBe(2);
  expect((await find(onOwnTurn.id)).status).toBe('active');
  expect((await find(offTurn.id)).status).toBe('active');
  // Applied on this turn (round 2), a third one outlasts it too.
  const lingering = await apply(ownerNextTurn, thorn, gob);
  await command('@Thorn /turn end', true);
  for (const id of [onOwnTurn.id, offTurn.id])
    expect(await find(id)).toMatchObject({ status: 'ended', endedReason: 'end of the next turn' });
  expect((await registration(onOwnTurn.registrationIds[0]!))!.status).toBe('retired');
  expect((await registration(offTurn.registrationIds[0]!))!.status).toBe('retired');
  expect((await find(lingering.id)).status).toBe('active');

  // 5. Combat ends first: as every turn-anchored V158 duration, it stays active unscheduled and is
  // ended with /effect end.
  await invoke('combat.end', {});
  await invoke('combat.victories', { amount: 0, recipients: [] });
  await invoke('combat.finish', {});
  expect(await find(lingering.id)).toMatchObject({ status: 'active', registrationIds: [] });
  const events = await t.run(ctx => ctx.db.query('events').take(2000));
  expect(
    events.filter(
      e =>
        e.kind === 'effect.unscheduled' &&
        (e.payload as { effectInstanceId: string }).effectInstanceId === lingering.id,
    ),
  ).toHaveLength(1);
  await invoke('effect.end', { instance: lingering.id });
  expect((await find(lingering.id)).status).toBe('ended');
});
