// SPDX-License-Identifier: GPL-3.0-only
/**
 * V158 effect instances through the registered operations. Expected values come from the pinned
 * Compendium (en/unified/md):
 * - feature/ability/null/level-1/relentless-nemesis.md: 3 Discipline, "Until the start of your
 *   next turn, whenever the target finishes moving or being force moved, you can use a free
 *   triggered action to shift up to your speed. You must end this shift adjacent to the target."
 * - rule/combat/end-of-turn.md: an effect lasting until the end of a creature's next turn ends at
 *   that creature's turn end.
 * - rule/health/dying.md: "When your Stamina is 0 or lower, you are dying."
 * - monster/goblin/statblock/goblin-warrior.md: Free Strike 1.
 * The Null is the reviewed v103-3 witness (tests/fixtures/v103-null-expected.json). Durations and
 * end conditions no admitted V158 sentence prints yet (end of the subject's next turn, the
 * encounter, `owner-dying`, `reused`) are stored through the library with a synthetic source
 * occurrence, as the V88 lifecycle test does; their ends are driven by registered operations.
 */
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { EffectDuration, EffectEndTrigger } from '../../shared/contracts/liveState';
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { appendEvent } from '../../convex/lib/events';
import { applyEffectInstance } from '../../convex/lib/effectInstances';
import nullLedger from '../fixtures/v103-null-expected.json' with { type: 'json' };
import { admitHero, backend, table } from './fixtures/table';

const NEMESIS = 'mcdm.heroes.v1/feature.ability.null.level-1/relentless-nemesis';
const NEMESIS_TEXT =
  'whenever the target finishes moving or being force moved, you can use a free triggered action to shift up to your speed. You must end this shift adjacent to the target.';

let sequence = 0;
test('V158: lasting instructions are stored, listed, expire at their boundaries and end on request', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const witness = nullLedger.witnesses.find(
    w => w.selections['class.null.ability-3'] === 'Relentless Nemesis',
  )!;
  const nyx = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Nyx',
    draftSelectionsFrom(
      {
        ...(witness.selections as unknown as EvaluationInput['selections']),
        'details.name': 'Nyx',
      },
      definitions,
    ),
  );
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `effects-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `effects-${++sequence}`,
      text,
    });
  const invoke = (operation: string, args: Record<string, unknown>, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: `effects-${++sequence}`,
      operation,
      arguments: args,
    });
  const nyxRef = `@{character:${nyx}}`;
  const goblinRef = `@{foe:${goblin}}`;
  const goblinLive = async () => (await t.run(ctx => ctx.db.get(goblin)))!.live;
  const heroLive = async (id: Id<'characters'>) => (await t.run(ctx => ctx.db.get(id)))!.liveState!;
  const registration = (id: string) => t.run(ctx => ctx.db.get(id as Id<'clockRegistrations'>));
  const eventData = async (eventId: Id<'events'>) =>
    ((await t.run(ctx => ctx.db.get(eventId)))!.payload as { data: unknown }).data;
  const events = () => t.run(ctx => ctx.db.query('events').take(2000));
  const nemesis = async () => {
    await command(`${nyxRef} /adjust heroic-resource value=3`);
    return command(
      `${nyxRef} /ability use ability="Relentless Nemesis" targets=[${goblinRef}]`,
      true,
    );
  };
  /** A synthetic source occurrence and one stored instance, as ability.use would store it. */
  const synthetic = (input: {
    owner: { kind: 'character' | 'foe'; id: string; name: string };
    subject: { kind: 'character' | 'foe'; id: string; name: string };
    printedDuration: EffectDuration;
    endsWhen?: EffectEndTrigger[];
    abilityId?: string;
    abilityName?: string;
  }) =>
    t.run(async ctx => {
      const session = (await ctx.db.get(f.sessionId!))!;
      const eventId = await appendEvent(ctx, {
        campaignId: f.campaignId,
        sessionId: f.sessionId!,
        encounterId: session.encounterId ?? null,
        origin: 'user',
        actor: (await ctx.db.get(f.director.profile.userId))!,
        commandId: `effects-source-${++sequence}`,
        kind: 'test.effect',
        description: 'Synthetic source occurrence for the effect lifecycle.',
      });
      const stored = await applyEffectInstance(
        ctx,
        { campaignId: f.campaignId, eventId },
        {
          id: `fixture-${eventId}`,
          kind: 'instruction',
          sourceUseEventId: eventId,
          sourceActorId: input.owner.id,
          // Distinct abilities by default, so the V158 same-ability overlap rule doesn't apply.
          abilityId: input.abilityId ?? `fixture-ability-${eventId}`,
          abilityName: input.abilityName ?? 'Fixture Ability',
          actorLabel: input.owner.name,
          sourcePath: 'feature/ability/null/level-1/relentless-nemesis.md',
          clause: 'Fixture clause.',
          owner: input.owner,
          subject: input.subject,
          payload: { kind: 'instruction', text: 'Fixture table work.' },
          printedDuration: input.printedDuration,
          endsWhen: input.endsWhen ?? [],
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
      ...((await heroLive(nyx)).effectInstances ?? []),
      ...((await heroLive(f.thornId)).effectInstances ?? []),
    ].find(instance => instance.id === id)!;
  const nyxParty = { kind: 'character' as const, id: nyx, name: 'Nyx' };
  const thornParty = { kind: 'character' as const, id: f.thornId, name: 'Thorn' };
  const goblinParty = { kind: 'foe' as const, id: goblin, name: 'Goblin Warrior' };

  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command(`${nyxRef} /turn take`, true);

  // 1. A compiled use stores an instruction instance on its target, bound to its owner's turn.
  const first = await nemesis();
  expect((await heroLive(nyx)).heroicResource.current).toBe(0);
  const [stored] = (await goblinLive()).effectInstances!;
  expect(stored).toMatchObject({
    kind: 'instruction',
    status: 'active',
    sourceUseEventId: first.eventId,
    abilityId: NEMESIS,
    abilityName: 'Relentless Nemesis',
    owner: nyxParty,
    subject: { kind: 'foe', id: goblin },
    payload: { kind: 'instruction', text: NEMESIS_TEXT },
    printedDuration: { kind: 'start-of-next-turn', anchor: 'owner' },
    duration: { kind: 'start-of-next-turn', creatureId: nyx },
    endsWhen: [],
  });
  expect(stored!.registrationIds).toHaveLength(1);
  expect(await registration(stored!.registrationIds[0]!)).toMatchObject({
    status: 'active',
    timing: { scope: 'creature-turn', boundary: 'turn-start', creatureId: nyx, occurrence: 'next' },
    work: { kind: 'expire-effect', effectInstanceId: stored!.id },
  });
  expect((await heroLive(nyx)).ownedEffects).toEqual([
    { id: stored!.id, holder: { kind: 'foe', id: goblin }, abilityId: NEMESIS },
  ]);
  // The use's occurrence and the instance share an identity.
  const [result] = await f.director.client.query(api.abilities.results, {
    campaignId: f.campaignId,
    eventIds: [first.eventId],
  });
  expect(
    (result!.compiled as { effects: { id: string; effect: { kind: string } }[] }).effects
      .filter(o => o.effect.kind === 'rider')
      .map(o => o.id),
  ).toEqual([stored!.id]);
  // An edge correction re-derives the roll, not the once-per-use effect: same occurrence, one
  // instance, still scheduled.
  await command(`/ability correct event="${first.eventId}" target=${goblinRef} edges=1 banes=0`);
  const [corrected] = await f.director.client.query(api.abilities.results, {
    campaignId: f.campaignId,
    eventIds: [first.eventId],
  });
  expect(
    (corrected!.compiled as { effects: { id: string; effect: { kind: string } }[] }).effects
      .filter(o => o.effect.kind === 'rider')
      .map(o => o.id),
  ).toEqual([stored!.id]);
  expect((await goblinLive()).effectInstances).toEqual([stored]);

  // 2. effect.list: every active effect, or those a creature holds, owns or is the subject of.
  const listed = (await eventData((await invoke('effect.list', {}, true)).eventId)) as {
    effects: { id: string; holder: { id: string } }[];
  };
  expect(listed.effects.map(e => [e.id, e.holder.id])).toEqual([[stored!.id, goblin]]);
  for (const [creature, count] of [
    [{ refKind: 'character', id: nyx }, 1],
    [{ refKind: 'foe', id: goblin }, 1],
    [{ refKind: 'character', id: f.thornId }, 0],
  ] as const) {
    const data = (await eventData((await invoke('effect.list', { creature })).eventId)) as {
      effects: unknown[];
    };
    expect(data.effects, JSON.stringify(creature)).toHaveLength(count);
  }

  // 3. Start of the owner's next turn: not Nyx's turn end, the goblin's or Thorn's turns.
  await command(`${nyxRef} /turn end`, true);
  await command(`${goblinRef} /turn take`);
  await command('/turn end');
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  expect((await find(stored!.id)).status).toBe('active');
  const encounter = async () =>
    t.run(async ctx => ctx.db.get((await ctx.db.get(f.sessionId!))!.encounterId!));
  expect((await encounter())!.round).toBe(2);
  await command(`${nyxRef} /turn take`, true);
  expect(await find(stored!.id)).toMatchObject({
    status: 'ended',
    endedReason: 'start of the owner’s next turn',
  });
  expect((await registration(stored!.registrationIds[0]!))!.status).toBe('retired');
  expect((await heroLive(nyx)).ownedEffects).toEqual([]);
  expect(
    (await events()).some(
      e =>
        e.kind === 'clock.effect-expired' &&
        (e.payload as { data: { effectInstanceId: string } }).data.effectInstanceId === stored!.id,
    ),
  ).toBe(true);

  // 4. effect.end by the owner's controller, journaled; undo and redo restore it.
  const second = await nemesis();
  const again = (await goblinLive()).effectInstances!.find(
    i => i.sourceUseEventId === second.eventId,
  )!;
  const ended = await invoke('effect.end', { instance: again.id, note: 'goblin fled' }, true);
  expect(await find(again.id)).toMatchObject({
    status: 'ended',
    endedReason: 'ended by Player: goblin fled',
    endedEventId: ended.eventId,
  });
  expect((await registration(again.registrationIds[0]!))!.status).toBe('retired');
  expect((await heroLive(nyx)).ownedEffects).toEqual([]);
  expect((await t.run(ctx => ctx.db.get(ended.eventId)))!.kind).toBe('effect.end');
  await expect(invoke('effect.end', { instance: again.id })).rejects.toThrow(/already ended/);
  await command('/history undo');
  expect((await find(again.id)).status).toBe('active');
  expect((await registration(again.registrationIds[0]!))!.status).toBe('active');
  expect((await heroLive(nyx)).ownedEffects).toEqual([
    { id: again.id, holder: { kind: 'foe', id: goblin }, abilityId: NEMESIS },
  ]);
  await command('/history redo');
  expect((await find(again.id)).status).toBe('ended');
  expect((await registration(again.registrationIds[0]!))!.status).toBe('retired');

  // 5. Only the Director, or a controller of the owner or subject, ends an effect.
  const foreign = await synthetic({
    owner: goblinParty,
    subject: goblinParty,
    printedDuration: { kind: 'none' },
  });
  await expect(invoke('effect.end', { instance: foreign.id }, true)).rejects.toThrow(
    /do not control/,
  );
  await invoke('effect.end', { instance: foreign.id });
  expect((await find(foreign.id)).status).toBe('ended');

  // 6. `reused`: Nyx using the same ability again ends Nyx's earlier effect of it.
  const reusable = await synthetic({
    owner: nyxParty,
    subject: thornParty,
    printedDuration: { kind: 'none' },
    endsWhen: ['reused'],
    abilityId: NEMESIS,
    abilityName: 'Relentless Nemesis',
  });
  const unrelated = await synthetic({
    owner: nyxParty,
    subject: thornParty,
    printedDuration: { kind: 'none' },
    endsWhen: ['reused'],
  });
  const third = await nemesis();
  expect(await find(reusable.id)).toMatchObject({
    status: 'ended',
    endedReason: 'Nyx used Relentless Nemesis again',
    endedEventId: third.eventId,
  });
  expect((await find(unrelated.id)).status).toBe('active');
  const newest = (await goblinLive()).effectInstances!.find(
    i => i.sourceUseEventId === third.eventId,
  )!;
  expect(newest.status).toBe('active');

  // 7. End of the subject's next turn (rule/combat/end-of-turn.md): Thorn's turn end, not Nyx's.
  const thornsTurn = await synthetic({
    owner: goblinParty,
    subject: thornParty,
    printedDuration: { kind: 'end-of-next-turn', anchor: 'subject' },
  });
  expect(thornsTurn.duration).toEqual({ kind: 'end-of-next-turn', creatureId: f.thornId });
  await command(`${nyxRef} /turn end`, true);
  expect((await find(thornsTurn.id)).status).toBe('active');
  await command(`${goblinRef} /turn take`);
  await command('/turn end');
  await command('@Thorn /turn take', true);
  expect((await find(thornsTurn.id)).status).toBe('active');
  await command('@Thorn /turn end', true);
  expect(await find(thornsTurn.id)).toMatchObject({
    status: 'ended',
    endedReason: 'end of the next turn',
  });

  // 8. `owner-dying`: the damage writer ends it when Nyx reaches 0 Stamina; others remain.
  // Synthetic instances for durations no admitted sentence prints yet.
  const encounterLong = await synthetic({
    owner: nyxParty,
    subject: thornParty,
    printedDuration: { kind: 'encounter' },
  });
  const untilDying = await synthetic({
    owner: nyxParty,
    subject: goblinParty,
    printedDuration: { kind: 'encounter' },
    endsWhen: ['owner-dying'],
  });
  await command(`${nyxRef} /adjust stamina value=1`);
  const strike = await command(
    `${goblinRef} /ability use ability="Free Strike" targets=[${nyxRef}]`,
  );
  expect((await heroLive(nyx)).stamina).toBe(0);
  expect(await find(untilDying.id)).toMatchObject({
    status: 'ended',
    endedReason: 'Nyx is dying',
    endedEventId: strike.eventId,
  });
  expect((await find(encounterLong.id)).status).toBe('active');
  expect(
    (await events()).some(e => e.kind === 'effect.ended' && e.causeEventId === strike.eventId),
  ).toBe(true);

  // 9. Combat end: an encounter effect expires; any other scheduled effect is only unscheduled.
  const lingering = await synthetic({
    owner: nyxParty,
    subject: thornParty,
    printedDuration: { kind: 'start-of-next-turn', anchor: 'owner' },
  });
  await invoke('combat.end', {});
  await invoke('combat.victories', { amount: 0, recipients: [] });
  await invoke('combat.finish', {});
  expect(await find(encounterLong.id)).toMatchObject({
    status: 'ended',
    endedReason: 'end of the encounter',
  });
  expect((await registration(encounterLong.registrationIds[0]!))!.status).toBe('retired');
  expect(await find(lingering.id)).toMatchObject({ status: 'active', registrationIds: [] });
  expect((await registration(lingering.registrationIds[0]!))!.status).toBe('retired');
  expect(
    (await events()).filter(
      e =>
        e.kind === 'effect.unscheduled' &&
        (e.payload as { effectInstanceId: string }).effectInstanceId === lingering.id,
    ),
  ).toHaveLength(1);
  // The table can still end it.
  await invoke('effect.end', { instance: lingering.id });
  expect((await find(lingering.id)).status).toBe('ended');
});

// QC1 R1 (V158), "Stacking Unique Effects" (en/books/heroes/clean/Draw Steel Heroes.md): the same
// ability doesn't stack; the most impactful effect applies and the most recent use sets the duration.
// V158's safe boundary: an identical payload with no extra end conditions is superseded by the newer
// use; any other overlap is not tracked. Proven through real clock boundaries in both orders.
test('V158: a repeated same-ability effect follows the newest use and never revives the older', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `overlap-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `overlap-${++sequence}`,
      text,
    });
  const goblinRef = `@{foe:${goblin}}`;
  const thorn = { kind: 'character' as const, id: f.thornId, name: 'Thorn' };
  const gob = { kind: 'foe' as const, id: goblin, name: 'Goblin Warrior' };
  const apply = (printedDuration: EffectDuration, text = 'Same table work.') =>
    t.run(async ctx => {
      const session = (await ctx.db.get(f.sessionId!))!;
      const eventId = await appendEvent(ctx, {
        campaignId: f.campaignId,
        sessionId: f.sessionId!,
        encounterId: session.encounterId ?? null,
        origin: 'user',
        actor: (await ctx.db.get(f.director.profile.userId))!,
        commandId: `overlap-source-${++sequence}`,
        kind: 'test.effect',
        description: 'Synthetic source occurrence.',
      });
      return applyEffectInstance(
        ctx,
        { campaignId: f.campaignId, eventId },
        {
          id: `overlap-${eventId}`,
          kind: 'instruction',
          sourceUseEventId: eventId,
          sourceActorId: goblin,
          abilityId: 'overlap-ability',
          abilityName: 'Overlap Ability',
          actorLabel: 'Goblin Warrior',
          sourcePath: 'feature/ability/null/level-1/relentless-nemesis.md',
          clause: 'Fixture clause.',
          owner: gob,
          subject: thorn,
          payload: { kind: 'instruction', text },
          printedDuration,
          endsWhen: [],
          appliedSequence: (await ctx.db.get(eventId))!.sequence,
        },
        session.encounterId ?? undefined,
      );
    });
  const instances = async () =>
    (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!.effectInstances ?? [];
  const reg = (id: string) => t.run(ctx => ctx.db.get(id as Id<'clockRegistrations'>));
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);

  // Order 1: the older use's boundary (Thorn's turn end) comes first. The older is superseded at
  // once and its registration retired, so that boundary removes nothing; the newer (the goblin's
  // next turn start) governs.
  const older = await apply({ kind: 'end-of-next-turn', anchor: 'subject' });
  if (!older || !('instance' in older)) throw new Error('older not tracked');
  const newer = await apply({ kind: 'start-of-next-turn', anchor: 'owner' });
  if (!newer || !('instance' in newer)) throw new Error('newer not tracked');
  expect(newer.superseded?.id).toBe(older.instance.id);
  expect((await instances()).find(i => i.id === older.instance.id)).toMatchObject({
    status: 'ended',
  });
  expect((await reg(older.instance.registrationIds[0]!))!.status).toBe('retired');
  await command('@Thorn /turn end', true);
  expect((await instances()).find(i => i.id === newer.instance.id)!.status).toBe('active');
  // The newer use's boundary ends it; the older stays ended (no revival).
  await command(`${goblinRef} /turn take`);
  const after = await instances();
  expect(after.find(i => i.id === newer.instance.id)!.status).toBe('ended');
  expect(after.find(i => i.id === older.instance.id)!.status).toBe('ended');
  expect(after.filter(i => i.status === 'active')).toHaveLength(0);

  // Order 2: the newer use's boundary (Thorn's next turn end) comes after the older's would have
  // (the goblin's next turn start). The older is superseded, so the goblin's turn start removes
  // nothing, and the newer ends at Thorn's turn end.
  const older2 = await apply({ kind: 'start-of-next-turn', anchor: 'owner' });
  if (!older2 || !('instance' in older2)) throw new Error('older2 not tracked');
  const newer2 = await apply({ kind: 'end-of-next-turn', anchor: 'subject' });
  if (!newer2 || !('instance' in newer2)) throw new Error('newer2 not tracked');
  expect(newer2.superseded?.id).toBe(older2.instance.id);
  await command('/turn end');
  await command('@Thorn /turn take', true);
  expect((await instances()).find(i => i.id === newer2.instance.id)!.status).toBe('active');
  await command('@Thorn /turn end', true);
  const after2 = await instances();
  expect(after2.find(i => i.id === newer2.instance.id)!.status).toBe('ended');
  expect(after2.find(i => i.id === older2.instance.id)!.status).toBe('ended');

  // A different payload from the same ability is not tracked automatically: the table applies the
  // stacking rule, and the tracked effect keeps its own duration.
  const kept = await apply({ kind: 'encounter' });
  if (!kept || !('instance' in kept)) throw new Error('kept not tracked');
  const different = await apply({ kind: 'encounter' }, 'Stronger table work.');
  expect(different && 'untracked' in different).toBe(true);
  expect((await instances()).filter(i => i.status === 'active').map(i => i.id)).toEqual([
    kept.instance.id,
  ]);
});
