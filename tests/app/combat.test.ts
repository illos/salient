// SPDX-License-Identifier: GPL-3.0-only
// A04 acceptance checks at the shared-operation level: the setup card (draft per user, roster
// updates, Cancel), OK (snapshot, locks, registrations, combat-start Malice), the shared initiative
// roll and starting-side choice with role authority, turns and the group/round handoff with the
// clock's Malice once per round, regrouping, mid-combat addition and removal, pause, and the clock's
// dispatch order with three registered items and a dormant save. Expected Malice values come from
// docs/conditions-and-clock.md section 5 (0 Victories / 1 hero = 0; round gains 1+1 = 2, 1+2 = 3).
// Every assertion reads persisted rows or a query back; mutation results only locate rows.
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import { appendEvent } from '../../convex/lib/events';
import { registerWork } from '../../convex/lib/clock';
import { backend, storedEvents, table, type Backend } from './fixtures/table';

type Client = Awaited<ReturnType<typeof table>>['director']['client'];

async function addGoblin(t: Backend, campaignId: Id<'campaigns'>, name = 'Goblin Warrior') {
  return t.run(ctx =>
    ctx.db.insert('foes', {
      campaignId,
      name,
      visible: true,
      sourceSnapshot: JSON.stringify({ name, text: 'fixture' }),
      maxStamina: 15,
      live: { stamina: 15, temporaryStamina: 0 },
    }),
  );
}
const submit = (client: Client, campaignId: Id<'campaigns'>, text: string, commandId: string) =>
  client.mutation(api.commands.submit, { campaignId, text, commandId });
const current = (client: Client, campaignId: Id<'campaigns'>) =>
  client.query(api.encounters.current, { campaignId });
async function encounterRow(t: Backend, sessionId: Id<'sessions'>) {
  return t.run(async ctx => {
    const session = (await ctx.db.get(sessionId))!;
    return session.encounterId ? ctx.db.get(session.encounterId) : null;
  });
}
async function clockEvents(t: Backend, campaignId: Id<'campaigns'>) {
  return (await storedEvents(t, campaignId)).filter(e => e.origin === 'clock');
}
function maliceGains(events: Doc<'events'>[]) {
  return events
    .filter(e => e.kind === 'clock.malice')
    .map(e => {
      const { step, round, before, delta, after } = (
        e.payload as {
          data: {
            change: { step: string; round?: number; delta: number; before: number; after: number };
          };
        }
      ).data.change;
      return { step, ...(round === undefined ? {} : { round }), before, delta, after };
    });
}
let n = 0;
const cid = (label: string) => `${label}-${String(++n).padStart(6, '0')}`;

/** Director opens the card, confirms OK, and the table resolves the opening to round 1. */
async function openCombat(
  t: Backend,
  fixture: Awaited<ReturnType<typeof table>>,
  options: { heroesFirst?: boolean } = {},
) {
  const { director, player, campaignId } = fixture;
  await submit(director.client, campaignId, '/combat start', cid('start'));
  await submit(director.client, campaignId, '/combat commit', cid('commit'));
  const rolled = await submit(player.client, campaignId, '/combat roll', cid('roll'));
  const rollEvent = (await storedEvents(t, campaignId)).find(e => e._id === rolled.eventId)!;
  const value = rollEvent.dice![0]!.value;
  const side = options.heroesFirst === false ? 'foes' : 'heroes';
  // The Director may choose on either result (Director doctrine); this keeps the fixture deterministic.
  await submit(director.client, campaignId, `/combat first side=${side}`, cid('first'));
  return { value };
}

describe('A04 combat opening, turns and clock', () => {
  test('acceptance 1: the setup card is a Director draft that follows the rosters; Cancel leaves no encounter, snapshot or lock', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, observer, campaignId, sessionId, thornId } = fixture;
    const goblinA = await addGoblin(t, campaignId, 'Goblin A');
    await expect(
      submit(player.client, campaignId, '/combat start', cid('p-start')),
    ).rejects.toThrow('Director');
    const opened = await submit(director.client, campaignId, '/combat start', cid('start'));
    expect(opened.interactionId).not.toBeNull();
    const card = (await t.run(ctx => ctx.db.get(opened.interactionId!)))!;
    expect(card).toMatchObject({
      kind: 'combat-setup',
      operation: 'combat.start',
      status: 'awaiting-input',
    });
    let row = (await encounterRow(t, sessionId!))!;
    expect(row).toMatchObject({ status: 'draft', phase: 'setup', precombatSnapshotId: null });
    expect(row.draft).toEqual({ excluded: [], surprised: [], groupOf: {} });
    await expect(
      submit(director.client, campaignId, '/combat start', cid('start-again')),
    ).rejects.toThrow('already open');
    // Draft edits are the Director's; players and observers cannot change them.
    await expect(
      submit(
        player.client,
        campaignId,
        '/combat setup creature=@Thorn surprised=true',
        cid('p-setup'),
      ),
    ).rejects.toThrow('Director');
    await expect(
      submit(
        observer.client,
        campaignId,
        `/combat setup creature=@{foe:${goblinA}} surprised=true`,
        cid('o-setup'),
      ),
    ).rejects.toThrow('observer');
    await submit(
      director.client,
      campaignId,
      `/combat setup creature=@{foe:${goblinA}} surprised=true`,
      cid('setup'),
    );
    await submit(
      director.client,
      campaignId,
      '/combat setup creature=@Thorn group="Vanguard"',
      cid('setup'),
    );
    row = (await encounterRow(t, sessionId!))!;
    expect(row.draft).toEqual({
      excluded: [],
      surprised: [`foe:${goblinA}`],
      groupOf: { [`character:${thornId}`]: 'heroes:Vanguard' },
    });
    // Live roster additions appear included; removals disappear; remaining choices persist.
    const goblinB = await addGoblin(t, campaignId, 'Goblin B');
    let view = (await current(director.client, campaignId))!;
    expect(view.mayEditSetup).toBe(true);
    expect(view.participants.map(p => [p.actor.name, p.included, p.surprised, p.groupKey])).toEqual(
      [
        ['Thorn', true, false, 'heroes:Vanguard'],
        ['Goblin A', true, true, `foe:${goblinA}`],
        ['Goblin B', true, false, `foe:${goblinB}`],
      ],
    );
    await t.run(ctx => ctx.db.delete(goblinB));
    view = (await current(director.client, campaignId))!;
    expect(view.participants.map(p => p.actor.name)).toEqual(['Thorn', 'Goblin A']);
    expect(view.participants[1]!.surprised).toBe(true);
    // Other viewers see the setup in progress and the lists, without setup authority.
    const forPlayer = (await current(player.client, campaignId))!;
    expect(forPlayer.phase).toBe('setup');
    expect(forPlayer.mayEditSetup).toBe(false);
    expect(forPlayer.mayRoll).toBe(false);
    expect(forPlayer.participants.map(p => p.controlled)).toEqual([true, false]);
    expect(
      (await current(observer.client, campaignId))!.participants.map(p => p.controlled),
    ).toEqual([false, false]);
    // Before OK nothing is locked: the party roster and the character can still change.
    const thornRevision = (await t.run(ctx => ctx.db.get(thornId)))!.revision;
    await player.client.mutation(api.characters.save, {
      commandId: cid('save'),
      characterId: thornId,
      expectedRevision: thornRevision,
      authored: { name: 'Thorn', appearance: 'scarred', biography: '', notes: '' },
    });
    expect((await t.run(ctx => ctx.db.get(thornId)))!.revision).toBe(thornRevision + 1);
    // The generic card close is refused; Cancel is the discard path.
    await expect(
      director.client.mutation(api.interactions.close, {
        interactionId: opened.interactionId!,
        commandId: cid('close'),
      }),
    ).rejects.toThrow('/combat cancel');
    await submit(director.client, campaignId, '/combat cancel', cid('cancel'));
    expect(await encounterRow(t, sessionId!)).toBeNull();
    expect((await t.run(ctx => ctx.db.get(row._id))) ?? null).toBeNull();
    expect((await t.run(ctx => ctx.db.get(opened.interactionId!)))!.status).toBe('closed');
    expect(await t.run(ctx => ctx.db.query('snapshots').take(1))).toEqual([]);
    expect((await t.run(ctx => ctx.db.get(thornId)))!.combatLocked).toBe(false);
    // The roster change made meanwhile (Goblin A) survives the cancel.
    expect(await t.run(ctx => ctx.db.get(goblinA))).not.toBeNull();
    await director.client.mutation(api.sessions.setPlayers, {
      sessionId: sessionId!,
      expectedRevision: 0,
      selectedPlayerIds: [player.profile.userId],
      commandId: cid('players'),
    });
    expect(await current(director.client, campaignId)).toBeNull();
  });

  test('acceptance 1 and 2: OK through the card creates the snapshot, encounter, locks and registrations once; observer roll rejected, player roll logged with dice', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, observer, campaignId, sessionId, thornId } = fixture;
    const goblin = await addGoblin(t, campaignId);
    // A second hero (the Director's) excluded from this combat keeps its normal workflow.
    const bystanderId = await t.run(ctx =>
      ctx.db.insert('characters', {
        ownerId: director.profile.userId,
        authored: { name: 'Ash', appearance: '', biography: '', notes: '' },
        revision: 1,
        draftRevisionId: null,
        effectiveRevisionId: null,
        derivedBaseline: null,
        liveState: null,
        campaignId,
        combatLocked: false,
      }),
    );
    // A second, unsurprised foe keeps the roll path (only an entirely surprised side skips the roll).
    const second = await addGoblin(t, campaignId, 'Goblin Archer');
    await submit(director.client, campaignId, '/adjust malice value=4', cid('malice'));
    const opened = await submit(director.client, campaignId, '/combat start', cid('start'));
    await submit(
      director.client,
      campaignId,
      '/combat setup creature=@Ash included=false',
      cid('setup'),
    );
    await submit(
      director.client,
      campaignId,
      `/combat setup creature=@{foe:${goblin}} surprised=true`,
      cid('setup'),
    );
    // OK is the card's answer: the continuation runs /combat commit under the responder's command.
    const ok = await director.client.mutation(api.interactions.respond, {
      interactionId: opened.interactionId!,
      answer: {},
      commandId: 'ok-commit-000001',
    });
    const row = (await encounterRow(t, sessionId!))!;
    expect(row.status).toBe('committed');
    expect(row.phase).toBe('roll');
    expect(row.round).toBe(0);
    expect(row.draft).toBeUndefined();
    expect(row.heroParticipantIds).toEqual([thornId]);
    expect(row.opening).toEqual({ path: 'roll', surprisedSides: [], roll: null, chosenBy: null });
    // Snapshot: the precombat state before any combat-start effect (Malice 4, foe at 15, Thorn's live record).
    const snapshot = (await t.run(ctx => ctx.db.get(row.precombatSnapshotId!)))!;
    expect(snapshot).toMatchObject({
      kind: 'encounter-start',
      encounterId: row._id,
      eventId: ok.eventId,
    });
    const state = snapshot.state as {
      characters: Record<string, unknown>;
      foes: Record<string, { live: { stamina: number } }>;
      campaign: { malice: number };
    };
    expect(Object.keys(state.characters)).toEqual([thornId]);
    expect(state.foes[goblin]!.live.stamina).toBe(15);
    expect(state.campaign.malice).toBe(4);
    // Locks: the participant is locked, the bystander is not, the party roster is locked.
    expect((await t.run(ctx => ctx.db.get(thornId)))!.combatLocked).toBe(true);
    await expect(
      player.client.mutation(api.characters.save, {
        commandId: cid('save'),
        characterId: thornId,
        expectedRevision: 1,
        authored: { name: 'Thorn', appearance: 'x', biography: '', notes: '' },
      }),
    ).rejects.toThrow('locked during combat');
    await director.client.mutation(api.characters.save, {
      commandId: cid('save'),
      characterId: bystanderId,
      expectedRevision: 1,
      authored: { name: 'Ash', appearance: 'free', biography: '', notes: '' },
    });
    await expect(
      director.client.mutation(api.sessions.setPlayers, {
        sessionId: sessionId!,
        expectedRevision: 0,
        selectedPlayerIds: [],
        commandId: cid('players'),
      }),
    ).rejects.toThrow('Combat locks the party roster');
    // Groups and entries: one group per creature; surprise recorded on the foe's entry.
    const view = (await current(director.client, campaignId))!;
    expect(
      view.groups.map(g => [g.side, g.entries.map(e => [e.actor.name, e.spent, e.surprised])]),
    ).toEqual([
      ['heroes', [['Thorn', false, false]]],
      ['director', [['Goblin Warrior', false, true]]],
      ['director', [['Goblin Archer', false, false]]],
    ]);
    expect(state.foes[second]!.live.stamina).toBe(15);
    // Registrations in enqueue order: three Malice steps, then surprise expiry at the end of round 1.
    const registrations = await t.run(ctx =>
      ctx.db
        .query('clockRegistrations')
        .withIndex('by_encounter', q => q.eq('encounterId', row._id))
        .take(10),
    );
    expect(registrations.map(r => [r.enqueueSeq, r.work, r.timing, r.status])).toEqual([
      [
        1,
        { kind: 'malice', step: 'combat-start-grant' },
        { scope: 'combat', boundary: 'combat-start' },
        'retired',
      ],
      [
        2,
        { kind: 'malice', step: 'round-start-gain' },
        { scope: 'round', boundary: 'round-start' },
        'active',
      ],
      [
        3,
        { kind: 'malice', step: 'encounter-end-loss' },
        { scope: 'combat', boundary: 'combat-end' },
        'active',
      ],
      [
        4,
        { kind: 'operation', operationId: 'combat.surprise-expiry' },
        { scope: 'round', boundary: 'round-end', round: 1 },
        'active',
      ],
    ]);
    // combat-start fired once: 0 Victories / 1 hero = 0, pool 4 → 4, logged with its inputs.
    const clock = await clockEvents(t, campaignId);
    expect(clock.map(e => e.kind)).toEqual(['clock.boundary', 'clock.malice']);
    expect(clock[0]!.description).toBe('Combat starts.');
    expect(clock[0]!.causeEventId).toBe(ok.eventId);
    expect(clock[0]!.commandId).toBe('ok-commit-000001');
    expect(maliceGains(clock)).toEqual([
      { step: 'combat-start-grant', before: 4, delta: 0, after: 4 },
    ]);
    expect(
      (clock[1]!.payload as { data: { change: { inputs: unknown } } }).data.change.inputs,
    ).toEqual({
      heroCount: 1,
      victoriesTotal: 0,
      averageVictories: 0,
      rounding: 'none',
    });
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(4);
    // Retrying OK returns the same result and takes no second snapshot.
    expect(
      await director.client.mutation(api.interactions.respond, {
        interactionId: opened.interactionId!,
        answer: {},
        commandId: 'ok-commit-000001',
      }),
    ).toEqual(ok);
    expect(await t.run(ctx => ctx.db.query('snapshots').take(5))).toHaveLength(1);
    await expect(
      submit(director.client, campaignId, '/combat commit', cid('commit-again')),
    ).rejects.toThrow('No combat setup is open');
    // Initiative roll: observer refused server-side; the player's roll is logged with the d10.
    await expect(
      submit(observer.client, campaignId, '/combat roll', cid('o-roll')),
    ).rejects.toThrow('observer');
    expect((await current(observer.client, campaignId))!.mayRoll).toBe(false);
    expect((await current(player.client, campaignId))!.mayRoll).toBe(true);
    const rolled = await submit(player.client, campaignId, '/combat roll', cid('roll'));
    const rollEvent = (await storedEvents(t, campaignId)).find(e => e._id === rolled.eventId)!;
    expect(rollEvent.actorName).toBe('Player');
    expect(rollEvent.kind).toBe('combat.initiative-roll');
    expect(rollEvent.dice).toEqual([{ id: 'd10', sides: 10, value: expect.any(Number) }]);
    const value = rollEvent.dice![0]!.value;
    // rule/combat/combat-round.md: 6 or higher the players choose; otherwise the Director decides.
    const entitlement = value >= 6 ? 'players' : 'director';
    const after = (await encounterRow(t, sessionId!))!;
    expect(after.phase).toBe('choice');
    expect(after.opening!.roll).toEqual({ value, entitlement, rolledBy: player.profile.userId });
    expect(await t.run(ctx => ctx.db.query('rolls').take(5))).toHaveLength(1);
    // A second roll is refused: one accepted opening roll, shared by everyone.
    await expect(
      submit(director.client, campaignId, '/combat roll', cid('roll-2')),
    ).rejects.toThrow('already made');
    // The choice follows the entitlement; the Director may choose on either result.
    if (entitlement === 'director') {
      await expect(
        submit(player.client, campaignId, '/combat first side=heroes', cid('p-first')),
      ).rejects.toThrow('gave the choice to the Director');
      expect((await current(player.client, campaignId))!.mayChooseFirst).toBe(false);
    } else {
      expect((await current(player.client, campaignId))!.mayChooseFirst).toBe(true);
    }
    await expect(
      submit(observer.client, campaignId, '/combat first side=heroes', cid('o-first')),
    ).rejects.toThrow('observer');
    const chosen = await submit(
      entitlement === 'players' ? player.client : director.client,
      campaignId,
      '/combat first side=foes',
      cid('first'),
    );
    const chosenEvent = (await storedEvents(t, campaignId)).find(e => e._id === chosen.eventId)!;
    expect(chosenEvent.kind).toBe('combat.first-side');
    expect(
      (chosenEvent.payload as { data: { side: string; entitlement: string } }).data,
    ).toMatchObject({
      side: 'director',
      entitlement,
    });
    const started = (await encounterRow(t, sessionId!))!;
    expect(started).toMatchObject({
      phase: 'turns',
      round: 1,
      startingSide: 'director',
      activeSide: 'director',
    });
    // Round 1 started: exactly one round-start gain, 1 hero + round 1 = 2, pool 4 → 6.
    expect(maliceGains(await clockEvents(t, campaignId))).toEqual([
      { step: 'combat-start-grant', before: 4, delta: 0, after: 4 },
      { step: 'round-start-gain', round: 1, before: 4, delta: 2, after: 6 },
    ]);
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(6);
    await expect(
      submit(director.client, campaignId, '/combat first side=heroes', cid('first-2')),
    ).rejects.toThrow('already announced');
  });

  test('surprise-determined path: every foe surprised, heroes act first without a roll; the flag clears at the end of round 1', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, campaignId, sessionId } = fixture;
    const goblin = await addGoblin(t, campaignId);
    await submit(director.client, campaignId, '/combat start', cid('start'));
    await submit(
      director.client,
      campaignId,
      `/combat setup creature=@{foe:${goblin}} surprised=true`,
      cid('setup'),
    );
    await submit(director.client, campaignId, '/combat commit', cid('commit'));
    const row = (await encounterRow(t, sessionId!))!;
    expect(row).toMatchObject({ phase: 'turns', round: 1, startingSide: 'heroes' });
    expect(row.opening).toMatchObject({
      path: 'surprise-determined',
      surprisedSides: ['director'],
      roll: null,
    });
    expect(await t.run(ctx => ctx.db.query('rolls').take(1))).toEqual([]);
    await expect(submit(player.client, campaignId, '/combat roll', cid('roll'))).rejects.toThrow(
      'No initiative roll is due',
    );
    // Both boundaries fired at OK in order: combat-start, then round-start with its gain.
    expect((await clockEvents(t, campaignId)).map(e => e.kind)).toEqual([
      'clock.boundary',
      'clock.malice',
      'clock.boundary',
      'clock.malice',
    ]);
    await submit(player.client, campaignId, '@Thorn /turn take', cid('take'));
    await submit(player.client, campaignId, '@Thorn /turn end', cid('end'));
    // The surprised foe still takes its round-1 turn (surprise removes no turn).
    await submit(director.client, campaignId, `@{foe:${goblin}} /turn take`, cid('take'));
    let entries = await t.run(ctx =>
      ctx.db
        .query('turnEntries')
        .withIndex('by_encounter', q => q.eq('encounterId', row._id))
        .take(5),
    );
    expect(entries.find(e => e.actor.kind === 'foe')!.surprised).toBe(true);
    await submit(director.client, campaignId, '/turn end', cid('end'));
    entries = await t.run(ctx =>
      ctx.db
        .query('turnEntries')
        .withIndex('by_encounter', q => q.eq('encounterId', row._id))
        .take(5),
    );
    expect(entries.find(e => e.actor.kind === 'foe')!.surprised).toBe(false);
    const expiry = (await clockEvents(t, campaignId)).find(e => e.kind === 'clock.work')!;
    expect(expiry.description).toBe(
      'Surprise ends: Goblin Warrior no longer surprised (end of round 1).',
    );
    const boundary = (await t.run(ctx => ctx.db.get(expiry.causeEventId!)))!;
    expect(boundary.description).toBe('Round 1 ends.');
    expect((await encounterRow(t, sessionId!))!.round).toBe(2);
  });

  test('no source default: both sides surprised needs Director adjudication; a player cannot choose', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, campaignId, sessionId } = fixture;
    const goblin = await addGoblin(t, campaignId);
    await submit(director.client, campaignId, '/combat start', cid('start'));
    await submit(
      director.client,
      campaignId,
      '/combat setup creature=@Thorn surprised=true',
      cid('setup'),
    );
    await submit(
      director.client,
      campaignId,
      `/combat setup creature=@{foe:${goblin}} surprised=true`,
      cid('setup'),
    );
    await submit(director.client, campaignId, '/combat commit', cid('commit'));
    const row = (await encounterRow(t, sessionId!))!;
    expect(row).toMatchObject({ phase: 'choice', round: 0, startingSide: null });
    expect(row.opening).toMatchObject({
      path: 'adjudication',
      surprisedSides: ['heroes', 'director'],
    });
    await expect(
      submit(player.client, campaignId, '/combat first side=heroes', cid('p-first')),
    ).rejects.toThrow('Director adjudicates');
    await submit(director.client, campaignId, '/combat first side=heroes', cid('first'));
    expect((await encounterRow(t, sessionId!))!).toMatchObject({
      phase: 'turns',
      round: 1,
      startingSide: 'heroes',
    });
  });

  test('acceptance 3: walkthrough steps 1, 2 and 7 — one hero, one foe; Take turn attribution, End turn, group handoff, round start with exactly one Malice event', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, observer, campaignId, sessionId, thornId } = fixture;
    const goblin = await addGoblin(t, campaignId);
    await openCombat(t, fixture);
    const row = (await encounterRow(t, sessionId!))!;
    expect(row).toMatchObject({
      phase: 'turns',
      round: 1,
      startingSide: 'heroes',
      activeSide: 'heroes',
    });
    // One committed encounter on the session; one Malice gain so far for round 1 (0 → 2).
    expect(await t.run(ctx => ctx.db.query('encounters').take(5))).toHaveLength(1);
    expect(maliceGains(await clockEvents(t, campaignId))).toEqual([
      { step: 'combat-start-grant', before: 0, delta: 0, after: 0 },
      { step: 'round-start-gain', round: 1, before: 0, delta: 2, after: 2 },
    ]);
    // Step 2: the player takes Thorn's turn; attribution is the user, the actor is Thorn.
    await expect(
      submit(observer.client, campaignId, '@Thorn /turn take', cid('o-take')),
    ).rejects.toThrow('observer');
    await expect(
      submit(player.client, campaignId, `@{foe:${goblin}} /turn take`, cid('p-take-foe')),
    ).rejects.toThrow('do not control');
    const takeId = cid('take');
    const took = await submit(player.client, campaignId, '@Thorn /turn take', takeId);
    const takeEvent = (await storedEvents(t, campaignId)).find(e => e._id === took.eventId)!;
    expect(takeEvent.kind).toBe('turn.take');
    expect(takeEvent.actorName).toBe('Player');
    expect(
      (
        takeEvent.payload as {
          envelope: { boundActor: { name: string } };
          data: { warnings: string[]; turnId?: string };
        }
      ).envelope.boundActor.name,
    ).toBe('Thorn');
    expect((takeEvent.payload as { data: { warnings: string[] } }).data.warnings).toEqual([]);
    let after = (await encounterRow(t, sessionId!))!;
    expect(after.activeTurnId).not.toBeNull();
    const turn = (await t.run(ctx => ctx.db.get(after.activeTurnId!)))!;
    expect(turn).toMatchObject({
      status: 'active',
      round: 1,
      side: 'heroes',
      startedEventId: took.eventId,
    });
    expect(turn.actor).toEqual({ kind: 'character', id: thornId, name: 'Thorn' });
    let view = (await current(player.client, campaignId))!;
    expect(view.activeTurn).toMatchObject({ id: turn._id, mayEnd: true });
    expect(view.groups[0]!.entries[0]).toMatchObject({
      spent: true,
      active: true,
      controlled: true,
    });
    expect(view.groups[0]!.active).toBe(true);
    // Only one active turn: a competing claim is refused; a retry of the accepted claim is idempotent.
    await expect(
      submit(director.client, campaignId, `@{foe:${goblin}} /turn take`, cid('d-take')),
    ).rejects.toThrow("Thorn's turn is in progress");
    expect(await submit(player.client, campaignId, '@Thorn /turn take', takeId)).toEqual(took);
    expect(await t.run(ctx => ctx.db.query('turns').take(5))).toHaveLength(1);
    // The turn-start boundary fired once for this actual turn with nothing registered for it.
    const startBoundary = (await clockEvents(t, campaignId)).filter(e =>
      e.description.includes("Thorn's turn begins"),
    );
    expect(startBoundary).toHaveLength(1);
    expect(
      (startBoundary[0]!.payload as { plan: { ordinary: unknown[]; saves: unknown[] } }).plan,
    ).toEqual({ ordinary: [], saves: [] });
    // Step 7: explicit End turn (the observer cannot; the Director could).
    await expect(submit(observer.client, campaignId, '/turn end', cid('o-end'))).rejects.toThrow(
      'observer',
    );
    const ended = await submit(player.client, campaignId, '@Thorn /turn end', cid('end'));
    expect((await t.run(ctx => ctx.db.get(turn._id)))!).toMatchObject({
      status: 'ended',
      endedEventId: ended.eventId,
    });
    after = (await encounterRow(t, sessionId!))!;
    // Group handoff: Thorn's group completed; play passes to the Director's side; round 1 continues.
    expect(after).toMatchObject({
      activeTurnId: null,
      activeGroupId: null,
      activeSide: 'director',
      round: 1,
    });
    view = (await current(director.client, campaignId))!;
    expect(view.groups.map(g => [g.completed, g.entries[0]!.spent])).toEqual([
      [true, true],
      [false, false],
    ]);
    await expect(
      submit(player.client, campaignId, '@Thorn /turn take', cid('take-again')),
    ).rejects.toThrow('already acted');
    // The foe's turn, then the round boundary: round-end, round-start with one gain of 1 + 2 = 3.
    await submit(director.client, campaignId, `@{foe:${goblin}} /turn take`, cid('take'));
    await submit(director.client, campaignId, '/turn end', cid('end'));
    after = (await encounterRow(t, sessionId!))!;
    expect(after).toMatchObject({
      round: 2,
      activeSide: 'heroes',
      activeGroupId: null,
      activeTurnId: null,
    });
    const clock = await clockEvents(t, campaignId);
    expect(clock.map(e => e.description)).toEqual([
      'Combat starts.',
      'Malice: combat-start grant — average Victories 0 across 1 hero; pool 0 → 0.',
      'Round 1 begins.',
      'Malice: round 1 gain — 1 hero + round 1 = 2; pool 0 → 2.',
      "Thorn's turn begins (round 1).",
      "Thorn's turn ends (round 1).",
      "Goblin Warrior's turn begins (round 1).",
      "Goblin Warrior's turn ends (round 1).",
      'Round 1 ends.',
      'Round 2 begins.',
      'Malice: round 2 gain — 1 hero + round 2 = 3; pool 2 → 5.',
    ]);
    expect(
      maliceGains(clock)
        .filter(c => c.step === 'round-start-gain')
        .map(c => c.round),
    ).toEqual([1, 2]);
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(5);
    // Every clock entry keeps the causing user command and links its cause.
    for (const e of clock) expect(e.causeEventId).not.toBeNull();
    // Round 2: both entries unspent again, groups not completed.
    view = (await current(director.client, campaignId))!;
    expect(view.groups.map(g => [g.completed, g.entries[0]!.spent])).toEqual([
      [false, false],
      [false, false],
    ]);
    // The Malice pool is hidden from the player's log view while Show Malice is off.
    const forPlayer = await player.client.query(api.events.list, { campaignId });
    const gain = forPlayer.events.find(e => e.kind === 'clock.malice')!;
    expect(gain.description).toBe('Malice: round 2 gain applied.');
    expect(JSON.stringify(gain.payload)).not.toContain('"after"');
    const forDirector = await director.client.query(api.events.list, { campaignId });
    expect(forDirector.events.find(e => e.kind === 'clock.malice')!.description).toContain(
      'pool 2 → 5',
    );
  });

  test('acceptance 4: regrouping — an unspent entry into an active group may act; into a finished group does not reopen it; a spent entry stays spent', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, campaignId, sessionId } = fixture;
    const goblinA = await addGoblin(t, campaignId, 'Goblin A');
    const goblinB = await addGoblin(t, campaignId, 'Goblin B');
    await openCombat(t, fixture);
    const row = (await encounterRow(t, sessionId!))!;
    const groupsOf = async () => (await current(director.client, campaignId))!.groups;
    const entryOf = async (name: string) =>
      (await groupsOf()).flatMap(g => g.entries).find(e => e.actor.name === name)!;
    await expect(
      submit(
        player.client,
        campaignId,
        `/group move entry="${(await entryOf('Goblin B')).id}" group=new`,
        cid('p-move'),
      ),
    ).rejects.toThrow('Director');
    await submit(player.client, campaignId, '@Thorn /turn take', cid('take'));
    await submit(player.client, campaignId, '@Thorn /turn end', cid('end'));
    await submit(director.client, campaignId, `@{foe:${goblinA}} /turn take`, cid('take'));
    const groupA = (await groupsOf()).find(g => g.active)!;
    const activeBefore = (await encounterRow(t, sessionId!))!.activeTurnId;
    // Unspent Goblin B joins the still-active group A: it may act during A's activation.
    await submit(
      director.client,
      campaignId,
      `/group move entry="${(await entryOf('Goblin B')).id}" group="${groupA.id}"`,
      cid('move'),
    );
    expect((await groupsOf()).map(g => g.entries.map(e => e.actor.name))).toEqual([
      ['Thorn'],
      ['Goblin A', 'Goblin B'],
    ]);
    // The active turn continues, unaffected by the move.
    expect((await encounterRow(t, sessionId!))!.activeTurnId).toBe(activeBefore);
    expect((await t.run(ctx => ctx.db.get(activeBefore!)))!.status).toBe('active');
    await submit(director.client, campaignId, '/turn end', cid('end'));
    let after = (await encounterRow(t, sessionId!))!;
    expect(after).toMatchObject({ activeGroupId: groupA.id, round: 1 });
    await submit(director.client, campaignId, `@{foe:${goblinB}} /turn take`, cid('take'));
    await submit(director.client, campaignId, '/turn end', cid('end'));
    after = (await encounterRow(t, sessionId!))!;
    expect(after).toMatchObject({ round: 2, activeGroupId: null, activeSide: 'heroes' });
    // Round 2: Thorn acts; then the Director's group finishes with both goblins.
    await submit(player.client, campaignId, '@Thorn /turn take', cid('take'));
    await submit(player.client, campaignId, '@Thorn /turn end', cid('end'));
    await submit(director.client, campaignId, `@{foe:${goblinA}} /turn take`, cid('take'));
    await submit(director.client, campaignId, '/turn end', cid('end'));
    // A spent entry moved to a new group stays spent and cannot take another turn.
    await submit(
      director.client,
      campaignId,
      `/group move entry="${(await entryOf('Goblin A')).id}" group=new`,
      cid('move'),
    );
    const movedA = await entryOf('Goblin A');
    expect(movedA.spent).toBe(true);
    expect((await t.run(ctx => ctx.db.get(movedA.id)))!.spentRound).toBe(2);
    await expect(
      submit(director.client, campaignId, `@{foe:${goblinA}} /turn take`, cid('take-spent')),
    ).rejects.toThrow('already acted');
    // Group A (Goblin B unspent) is still the active group; finish it.
    await submit(director.client, campaignId, `@{foe:${goblinB}} /turn take`, cid('take'));
    await submit(director.client, campaignId, '/turn end', cid('end'));
    // Everyone has acted, so round 3 began; the spent entry's new group and A are unspent again.
    after = (await encounterRow(t, sessionId!))!;
    expect(after.round).toBe(3);
    // Round 3: heroes first; Thorn's group finishes; the Director takes Goblin B (group A) and ends it,
    // so group A is finished. A newcomer moved into A does not reopen it and cannot act from there.
    await submit(player.client, campaignId, '@Thorn /turn take', cid('take'));
    await submit(player.client, campaignId, '@Thorn /turn end', cid('end'));
    await submit(director.client, campaignId, `@{foe:${goblinB}} /turn take`, cid('take'));
    await submit(director.client, campaignId, '/turn end', cid('end'));
    let groups = await groupsOf();
    const finishedA = groups.find(g => g.entries.some(e => e.actor.name === 'Goblin B'))!;
    expect(finishedA.completed).toBe(true);
    expect((await encounterRow(t, sessionId!))!.round).toBe(3);
    const unspentA = await entryOf('Goblin A');
    expect(unspentA.spent).toBe(false);
    await submit(
      director.client,
      campaignId,
      `/group move entry="${unspentA.id}" group="${finishedA.id}"`,
      cid('move'),
    );
    // The finished group did not reopen for the arrival: its completion stays recorded for round 3,
    // and with every group finished the round advanced although Goblin A never acted in round 3.
    expect((await t.run(ctx => ctx.db.get(finishedA.id)))!.completedRound).toBe(3);
    after = (await encounterRow(t, sessionId!))!;
    expect(after.round).toBe(4);
    groups = await groupsOf();
    const merged = groups.find(g => g.id === finishedA.id)!;
    expect(merged.entries.map(e => [e.actor.name, e.spent])).toEqual([
      ['Goblin B', false],
      ['Goblin A', false],
    ]);
    // The empty source group was removed.
    expect(groups).toHaveLength(2);
    expect((await t.run(ctx => ctx.db.get(unspentA.id)))!.spentRound).toBe(2);
    // No turn was invented for Goblin A: its only turns are the ones it took.
    const turnsA = await t.run(async ctx =>
      (
        await ctx.db
          .query('turns')
          .withIndex('by_encounter', q => q.eq('encounterId', row._id))
          .take(50)
      ).filter(turn => turn.actor.id === goblinA),
    );
    expect(turnsA.map(turn => turn.round)).toEqual([1, 2]);
    expect(
      maliceGains(await clockEvents(t, campaignId))
        .filter(c => c.step === 'round-start-gain')
        .map(c => c.round),
    ).toEqual([1, 2, 3, 4]);
  });

  test('acceptance 5: a foe added mid-combat joins a new bottom group with a turn this round; removing the acting foe finishes its turn and lets the round end', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, campaignId, sessionId } = fixture;
    await t.mutation(internal.content.reseed, {});
    const catalog = await director.client.query(api.foes.catalog, { campaignId });
    const goblin = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: cid('add'),
    });
    await openCombat(t, fixture);
    await submit(player.client, campaignId, '@Thorn /turn take', cid('take'));
    await submit(player.client, campaignId, '@Thorn /turn end', cid('end'));
    await submit(director.client, campaignId, `@{foe:${goblin}} /turn take`, cid('take'));
    // Added during the goblin's turn: new bottom group, unspent, so round 1 does not end at End turn.
    const added = await director.client.mutation(api.foes.add, {
      campaignId,
      definitionId: catalog.definitionId,
      commandId: cid('add'),
    });
    let view = (await current(director.client, campaignId))!;
    expect(
      view.groups.map(g => [g.side, g.order, g.entries.map(e => [e.actor.id, e.spent])]),
    ).toEqual([
      ['heroes', 1, [[fixture.thornId, true]]],
      ['director', 2, [[goblin, true]]],
      ['director', 3, [[added, false]]],
    ]);
    await submit(director.client, campaignId, '/turn end', cid('end'));
    let row = (await encounterRow(t, sessionId!))!;
    expect(row).toMatchObject({ round: 1, activeGroupId: null, activeSide: 'director' });
    // The newcomer acts in the current round; removing it while acting finishes the turn (turn-end
    // boundary), drops its entry and group, and the round then ends.
    const took = await submit(
      director.client,
      campaignId,
      `@{foe:${added}} /turn take`,
      cid('take'),
    );
    row = (await encounterRow(t, sessionId!))!;
    const turnId = row.activeTurnId!;
    await director.client.mutation(api.foes.remove, {
      campaignId,
      foeId: added,
      commandId: 'remove-added-01',
    });
    const turn = (await t.run(ctx => ctx.db.get(turnId)))!;
    expect(turn.status).toBe('ended');
    expect(turn.startedEventId).toBe(took.eventId);
    expect(await t.run(ctx => ctx.db.get(added))).toBeNull();
    row = (await encounterRow(t, sessionId!))!;
    expect(row).toMatchObject({ round: 2, activeTurnId: null, activeGroupId: null });
    view = (await current(director.client, campaignId))!;
    expect(view.groups).toHaveLength(2);
    const clock = (await clockEvents(t, campaignId)).map(e => e.description);
    expect(clock.slice(-4)).toEqual([
      "Goblin Warrior's turn ends (round 1).",
      'Round 1 ends.',
      'Round 2 begins.',
      'Malice: round 2 gain — 1 hero + round 2 = 3; pool 2 → 5.',
    ]);
    // A retry of the removal repeats nothing: still one turn-end for that turn, one round 2 gain.
    await director.client.mutation(api.foes.remove, {
      campaignId,
      foeId: added,
      commandId: 'remove-added-01',
    });
    expect(
      (await clockEvents(t, campaignId)).filter(e => e.description === 'Round 2 begins.'),
    ).toHaveLength(1);
  });

  test('acceptance 6: pausing mid-turn blocks turn actions, roster changes and regrouping; resuming restores the same active turn', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, campaignId, sessionId } = fixture;
    const goblin = await addGoblin(t, campaignId);
    await openCombat(t, fixture);
    await submit(player.client, campaignId, '@Thorn /turn take', cid('take'));
    const before = (await encounterRow(t, sessionId!))!;
    await director.client.mutation(api.sessions.transition, {
      sessionId: sessionId!,
      expectedRevision: 0,
      action: 'pause',
      commandId: cid('pause'),
    });
    await expect(submit(player.client, campaignId, '@Thorn /turn end', cid('end'))).rejects.toThrow(
      'paused',
    );
    await expect(
      submit(director.client, campaignId, `@{foe:${goblin}} /turn take`, cid('take')),
    ).rejects.toThrow('paused');
    await expect(
      director.client.mutation(api.foes.remove, {
        campaignId,
        foeId: goblin,
        commandId: cid('remove'),
      }),
    ).rejects.toThrow('paused');
    const entryId = (await current(director.client, campaignId))!.groups[1]!.entries[0]!.id;
    await expect(
      submit(director.client, campaignId, `/group move entry="${entryId}" group=new`, cid('move')),
    ).rejects.toThrow('paused');
    expect((await current(player.client, campaignId))!.activeTurn!.mayEnd).toBe(false);
    // Nothing moved: the same turn, entry and round.
    const paused = (await encounterRow(t, sessionId!))!;
    expect([paused.activeTurnId, paused.activeGroupId, paused.round]).toEqual([
      before.activeTurnId,
      before.activeGroupId,
      before.round,
    ]);
    expect((await t.run(ctx => ctx.db.get(paused.activeTurnId!)))!.status).toBe('active');
    // The character lock holds while paused.
    await expect(
      player.client.mutation(api.characters.save, {
        commandId: cid('save'),
        characterId: fixture.thornId,
        expectedRevision: 1,
        authored: { name: 'Thorn', appearance: 'x', biography: '', notes: '' },
      }),
    ).rejects.toThrow('locked during combat');
    await director.client.mutation(api.sessions.transition, {
      sessionId: sessionId!,
      expectedRevision: 1,
      action: 'resume',
      commandId: cid('resume'),
    });
    expect((await current(player.client, campaignId))!.activeTurn).toMatchObject({
      id: before.activeTurnId,
      mayEnd: true,
    });
    await submit(player.client, campaignId, '@Thorn /turn end', cid('end'));
    expect((await t.run(ctx => ctx.db.get(before.activeTurnId!)))!.status).toBe('ended');
  });

  test('clock ordering: three registered items fire in enqueue order at one boundary, a dormant save last and unrolled; Malice once per round', async () => {
    const t = backend();
    const fixture = await table(t);
    const { director, player, campaignId, sessionId } = fixture;
    const goblin = await addGoblin(t, campaignId);
    await openCombat(t, fixture);
    const row = (await encounterRow(t, sessionId!))!;
    // Register three items due at the next round start (out of alphabetical order) and one save at
    // Thorn's turn end, under a Director event so the journal has a cause. No handler exists for the
    // operation ids, so each firing is recorded as unsupported work in its enqueue position.
    await t.run(async ctx => {
      const actor = (await ctx.db.get(director.profile.userId))!;
      const eventId = await appendEvent(ctx, {
        campaignId,
        sessionId: sessionId!,
        encounterId: row._id,
        origin: 'user',
        actor,
        commandId: 'register-fixture-01',
        kind: 'test.register',
        description: 'Test registrations.',
      });
      const scope = { campaignId, eventId };
      for (const name of ['third', 'first', 'second'])
        await registerWork(ctx, scope, row._id, {
          timing: { scope: 'round', boundary: 'round-start' },
          work: { kind: 'operation', operationId: `test.${name}` },
          source: { logEntryId: eventId, label: `Test ${name}` },
        });
      await registerWork(ctx, scope, row._id, {
        timing: {
          scope: 'creature-turn',
          boundary: 'turn-end',
          creatureId: fixture.thornId,
          occurrence: 'each',
        },
        work: {
          kind: 'saving-throw',
          effectInstanceId: 'fixture-effect',
          creatureId: fixture.thornId,
        },
        source: { logEntryId: eventId, label: 'Fixture save (dormant)' },
      });
    });
    const rollsBefore = (await t.run(ctx => ctx.db.query('rolls').take(10))).length;
    await submit(player.client, campaignId, '@Thorn /turn take', cid('take'));
    const ended = await submit(player.client, campaignId, '@Thorn /turn end', cid('end'));
    // Thorn's turn end: the save is in the save phase, last, and recorded as unsupported, not rolled.
    const endBoundary = (await clockEvents(t, campaignId)).find(
      e => e.description === "Thorn's turn ends (round 1).",
    )!;
    expect(endBoundary.causeEventId).toBe(ended.eventId);
    const plan = (endBoundary.payload as { plan: { ordinary: string[]; saves: string[] } }).plan;
    expect(plan.ordinary).toEqual([]);
    expect(plan.saves).toHaveLength(1);
    const saveFiring = (await storedEvents(t, campaignId)).find(
      e => e.causeEventId === endBoundary._id,
    )!;
    expect(saveFiring.kind).toBe('clock.unsupported');
    expect(saveFiring.description).toContain('Q-TS-1');
    expect((saveFiring.payload as { phase: string }).phase).toBe('saves');
    expect((await t.run(ctx => ctx.db.query('rolls').take(10))).length).toBe(rollsBefore);
    // The unsupported save changed no toggle: the admitted hero's conditions stay all off (A02).
    expect(
      Object.values((await t.run(ctx => ctx.db.get(fixture.thornId)))!.liveState!.conditions),
    ).toEqual(Array(9).fill(false));
    // Round 2 start: Malice (enqueueSeq 2) first, then third, first, second (enqueue order 4, 5, 6).
    await submit(director.client, campaignId, `@{foe:${goblin}} /turn take`, cid('take'));
    await submit(director.client, campaignId, '/turn end', cid('end'));
    const startBoundary = (await clockEvents(t, campaignId)).find(
      e => e.description === 'Round 2 begins.',
    )!;
    const firings = (await storedEvents(t, campaignId))
      .filter(e => e.causeEventId === startBoundary._id)
      .sort((a, b) => a.sequence - b.sequence);
    expect(firings.map(e => [(e.payload as { enqueueSeq: number }).enqueueSeq, e.kind])).toEqual([
      [2, 'clock.malice'],
      [4, 'clock.unsupported'],
      [5, 'clock.unsupported'],
      [6, 'clock.unsupported'],
    ]);
    expect(
      firings.slice(1).map(e => (e.payload as { source: { label: string } }).source.label),
    ).toEqual(['Test third', 'Test first', 'Test second']);
    // Malice fired once per round: 2 for round 1, 3 for round 2, and the recurring item stays active.
    expect(
      maliceGains(await clockEvents(t, campaignId)).filter(c => c.step === 'round-start-gain'),
    ).toEqual([
      { step: 'round-start-gain', round: 1, before: 0, delta: 2, after: 2 },
      { step: 'round-start-gain', round: 2, before: 2, delta: 3, after: 5 },
    ]);
    const registrations = await t.run(ctx =>
      ctx.db
        .query('clockRegistrations')
        .withIndex('by_encounter', q => q.eq('encounterId', row._id))
        .take(10),
    );
    expect(registrations.map(r => [r.enqueueSeq, r.status])).toEqual([
      [1, 'retired'],
      [2, 'active'],
      [3, 'active'],
      [4, 'active'],
      [5, 'active'],
      [6, 'active'],
      [7, 'active'],
    ]);
  });

  test('every A04 operation is registered and discoverable with its role and session requirements', async () => {
    const t = backend();
    const { director, campaignId } = await table(t);
    const listed = await director.client.query(api.commands.list, { campaignId });
    const byId = new Map(listed.map(op => [op.id, op]));
    expect([...byId.keys()]).toEqual(
      expect.arrayContaining([
        'combat.start',
        'combat.setup',
        'combat.cancel',
        'combat.commit',
        'combat.roll',
        'combat.first',
        'turn.take',
        'turn.end',
        'group.move',
      ]),
    );
    expect(byId.get('combat.roll')!.roles).toEqual(['director', 'player']);
    expect(byId.get('combat.start')!.roles).toEqual(['director']);
    expect(byId.get('group.move')!.session).toBe('unpaused');
    expect(byId.get('turn.take')!.syntax).toBe('@Actor /turn take [entry=…]');
  });
});
