// SPDX-License-Identifier: GPL-3.0-only
// A06 acceptance checks at the shared-operation level. Attack events do not exist yet (A05); the
// costed/damage checks run against tests/app/fixtures/costedAbility.ts, a clearly named fixture
// whose journal rows mimic the expected A05 shapes. Every consequential assertion reads persisted
// rows back; dice are counted (rolls rows, generator counter, events carrying dice) to show that no
// restoration rolled anything.
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import {
  correctionWindow,
  isGameplayHead,
  seamOf,
  walkHistory,
  type EventLike,
} from '../../convex/lib/history';
import { indexArchivedEncounter } from '../../convex/lib/historyIndex';
import { account, admit, admitHero, backend, storedEvents, type Backend } from './fixtures/table';
import { FIXTURE_STRIKE_ID, registerFixtureStrike } from './fixtures/costedAbility';

registerFixtureStrike();

type Client = Awaited<ReturnType<typeof account>>['client'];
let n = 0;
const cid = (label: string) => `${label}-${String(++n).padStart(6, '0')}`;
const submit = (client: Client, campaignId: Id<'campaigns'>, text: string, commandId = cid('c')) =>
  client.mutation(api.commands.submit, { campaignId, text, commandId });

/** Director, two selected players with one hero each, an observer, a running session, one foe. */
async function historyTable(t: Backend) {
  // Catch Breath reads the content snapshot (S01); a fresh test deployment has none until reseeded.
  await t.action(internal.content.reseed, {});
  const director = await account(t, 'Director');
  const player = await account(t, 'Player');
  const second = await account(t, 'Second');
  const observer = await account(t, 'Observer');
  const campaignId = await director.client.mutation(api.campaigns.create, {
    name: 'History',
    commandId: 'create-campaign',
  });
  for (const member of [player, second, observer]) await admit(t, director, member, campaignId);
  // A02: heroes are admitted through the real path (evaluated build, R03 live values) before the
  // session starts, so the admission entries sit outside the session's rewindable history.
  const thornId = await admitHero(t, player, director, campaignId, 'Thorn');
  const zikId = await admitHero(t, second, director, campaignId, 'Zik');
  const sessionId = await director.client.mutation(api.sessions.start, {
    campaignId,
    selectedPlayerIds: [player.profile.userId, second.profile.userId],
    commandId: 'start-session',
  });
  const goblinId = await t.run(ctx =>
    ctx.db.insert('foes', {
      campaignId,
      name: 'Goblin Warrior',
      visible: true,
      sourceSnapshot: JSON.stringify({ name: 'Goblin Warrior', text: 'fixture' }),
      maxStamina: 15,
      live: { stamina: 15, temporaryStamina: 3 },
    }),
  );
  // Director adjustments that precede every action under test (the maximum 30 comes from the build).
  for (const [id, name] of [
    [thornId, 'Thorn'],
    [zikId, 'Zik'],
  ] as const) {
    void id;
    await submit(director.client, campaignId, `@${name} /adjust stamina value=20`);
    await submit(director.client, campaignId, `@${name} /adjust recoveries value=5`);
    await submit(director.client, campaignId, `@${name} /adjust heroic-resource value=3`);
  }
  return { director, player, second, observer, campaignId, sessionId, thornId, zikId, goblinId };
}
type Fixture = Awaited<ReturnType<typeof historyTable>>;

async function openCombat(f: Fixture) {
  await submit(f.director.client, f.campaignId, '/combat start');
  await submit(f.director.client, f.campaignId, '/combat commit');
  await submit(f.player.client, f.campaignId, '/combat roll');
  await submit(f.director.client, f.campaignId, '/combat first side=heroes');
}
const strike = (client: Client, f: Fixture, hero: string, damage = 5, cost = 1) =>
  submit(
    client,
    f.campaignId,
    `@${hero} /fixture strike target=@{foe:${f.goblinId}} cost=${cost} damage=${damage}`,
  );
const hero = (t: Backend, id: Id<'characters'>) => t.run(ctx => ctx.db.get(id));
const foe = (t: Backend, id: Id<'foes'>) => t.run(ctx => ctx.db.get(id));
const encounterOf = (t: Backend, sessionId: Id<'sessions'>) =>
  t.run(async ctx => {
    const session = (await ctx.db.get(sessionId))!;
    return session.encounterId ? ctx.db.get(session.encounterId) : null;
  });
const eventById = async (t: Backend, campaignId: Id<'campaigns'>, id: Id<'events'>) =>
  (await storedEvents(t, campaignId)).find(e => e._id === id)!;

/** Evidence that no restoration invoked the dice operation (acceptance check 8). */
async function diceCounts(t: Backend, campaignId: Id<'campaigns'>) {
  return t.run(async ctx => ({
    rolls: (await ctx.db.query('rolls').take(1000)).length,
    counter:
      (
        await ctx.db
          .query('diceStates')
          .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
          .unique()
      )?.counter ?? 0,
    diceEvents: (
      await ctx.db
        .query('events')
        .withIndex('by_campaign_sequence', q => q.eq('campaignId', campaignId))
        .take(1000)
    ).filter(e => e.dice).length,
  }));
}
const status = (client: Client, campaignId: Id<'campaigns'>) =>
  client.query(api.history.status, { campaignId });

describe('seam computation over synthetic journals', () => {
  const head = (
    id: string,
    sequence: number,
    kind: string,
    actor: { kind: 'character' | 'foe'; id: string; name: string } | null,
    extra: Partial<EventLike> = {},
  ): EventLike => ({
    _id: id,
    sequence,
    origin: 'user',
    kind,
    description: `${kind} ${id}`,
    actorId: 'u1',
    commandKey: `key-${id}`,
    payload: { envelope: { boundActor: actor } },
    ...extra,
  });
  const history = (id: string, sequence: number, kind: string, target: string): EventLike => ({
    _id: id,
    sequence,
    origin: 'user',
    kind,
    description: kind,
    actorId: 'u1',
    commandKey: `key-${id}`,
    payload: { data: { target: { eventId: target } } },
  });
  const thorn = { kind: 'character' as const, id: 'c1', name: 'Thorn' };
  const zik = { kind: 'character' as const, id: 'c2', name: 'Zik' };

  test('undo moves units to the redo path in reverse order; redo returns them; new gameplay clears redo', () => {
    const events: EventLike[] = [
      { _id: 's', sequence: 1, origin: 'user', kind: 'session.started', description: 'start' },
      head('a', 2, 'hero.recover', thorn),
      { _id: 'a1', sequence: 3, origin: 'engine', kind: 'x', description: '', commandKey: 'key-a' },
      head('b', 4, 'hero.recover', zik),
      history('u1', 5, 'history.undo', 'b'),
      history('u2', 6, 'history.rewind', 'a'),
    ];
    let walk = walkHistory(events);
    expect(walk.branch).toEqual([]);
    expect(walk.redo.map(u => u.head._id)).toEqual(['b', 'a']);
    expect(walk.unitOfEvent.get('a1')).toBe('a');
    walk = walkHistory([...events, history('r1', 7, 'history.redo', 'a')]);
    expect(walk.branch.map(u => u.head._id)).toEqual(['a']);
    expect(walk.redo.map(u => u.head._id)).toEqual(['b']);
    walk = walkHistory([
      ...events,
      history('r1', 7, 'history.redo', 'a'),
      head('c', 8, 'condition.on', thorn),
    ]);
    expect(walk.branch.map(u => u.head._id)).toEqual(['a', 'c']);
    expect(walk.redo).toEqual([]);
    expect(walk.redoClearedBy?.head._id).toBe('c');
    // Settings, notes, cards and setup are not units and do not clear redo.
    walk = walkHistory([
      ...events,
      head('n', 7, 'session.note', null),
      head('st', 8, 'campaign.setting', null),
      head('cs', 9, 'combat.setup', null),
    ]);
    expect(walk.redo.map(u => u.head._id)).toEqual(['b', 'a']);
    expect(walk.units.has('n')).toBe(false);
    expect(isGameplayHead({ origin: 'clock', kind: 'clock.boundary' })).toBe(false);
    expect(isGameplayHead({ origin: 'user', kind: 'combat.committed' })).toBe(false);
    expect(isGameplayHead({ origin: 'user', kind: 'turn.take' })).toBe(true);
  });

  test('history entries out of order are rejected rather than reinterpreted', () => {
    expect(() =>
      walkHistory([head('a', 1, 'hero.recover', thorn), history('u', 2, 'history.undo', 'zz')]),
    ).toThrow('names no known unit');
    expect(() =>
      walkHistory([
        head('a', 1, 'hero.recover', thorn),
        head('b', 2, 'hero.recover', zik),
        history('u', 3, 'history.undo', 'a'),
      ]),
    ).toThrow('undoes out of order');
    expect(() =>
      walkHistory([head('a', 1, 'hero.recover', thorn), history('r', 2, 'history.redo', 'a')]),
    ).toThrow('redoes out of order');
  });

  test('seams are named by their kind', () => {
    const unit = (kind: string, actor: typeof thorn | null) => ({
      head: head('x', 9, kind, actor),
      actor,
      issuerId: 'u1',
      commandKey: 'k',
    });
    expect(seamOf(unit('turn.take', zik))).toBe("Zik's turn started (#9 turn.take x)");
    expect(seamOf(unit('manual.adjustment', thorn))).toBe(
      'a committed Director adjustment (#9 manual.adjustment x)',
    );
    expect(seamOf(unit('correction.edge', thorn))).toContain('Director adjustment');
    expect(seamOf(unit('hero.recover', zik))).toBe("Zik's committed action (#9 hero.recover x)");
    expect(seamOf(unit('combat.first-side', null))).toBe(
      'a committed Director table action (#9 combat.first-side x)',
    );
  });
});

describe('FreePlay undo, redo and seams', () => {
  test('a player undoes their own Recovery: both values restore, the entry stays visible as undone, redo restores it, and no die is rolled', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { player, campaignId, thornId } = f;
    const before = (await hero(t, thornId))!.liveState!;
    expect([before.stamina, before.recoveries]).toEqual([20, 5]);
    const recovered = await submit(player.client, campaignId, '@Thorn /hero recover');
    const after = (await hero(t, thornId))!.liveState!;
    expect([after.stamina, after.recoveries]).toEqual([30, 4]);
    const dice = await diceCounts(t, campaignId);
    let view = await status(player.client, campaignId);
    expect(view.undo).toMatchObject({ available: true, target: { eventId: recovered.eventId } });
    expect(view.redo.available).toBe(false);
    const undoId = cid('undo');
    const undone = await submit(player.client, campaignId, '/history undo', undoId);
    const restored = (await hero(t, thornId))!.liveState!;
    expect(restored).toEqual(before);
    const original = await eventById(t, campaignId, recovered.eventId);
    expect(original.disposition).toBe('undone');
    expect(original.description).toContain('spent a Recovery');
    const undoEvent = await eventById(t, campaignId, undone.eventId);
    expect(undoEvent).toMatchObject({
      kind: 'history.undo',
      origin: 'user',
      actorName: 'Player',
      causeEventId: recovered.eventId,
      disposition: 'applied',
    });
    expect(undoEvent.dice).toBeUndefined();
    // The undo entry carries its own change record (appended, never a rewrite of the original).
    const undoChanges = await t.run(ctx =>
      ctx.db
        .query('changes')
        .withIndex('by_event', q => q.eq('eventId', undone.eventId))
        .take(10),
    );
    const originalChanges = await t.run(ctx =>
      ctx.db
        .query('changes')
        .withIndex('by_event', q => q.eq('eventId', recovered.eventId))
        .take(10),
    );
    const recorded = (value: { present: boolean; value?: unknown }) =>
      value.present ? value.value : 'absent';
    expect(
      originalChanges.map(c => [c.path, recorded(c.before), recorded(c.after)]).sort(),
    ).toEqual([
      ['liveState.recoveries', 5, 4],
      ['liveState.stamina', 20, 30],
    ]);
    // The undo wrote the original rows in reverse order with before and after swapped.
    expect(undoChanges.map(c => [c.path, c.before, c.after])).toEqual(
      [...originalChanges].reverse().map(c => [c.path, c.after, c.before]),
    );
    // A retry of the same undo command returns the receipt and restores nothing twice.
    expect(await submit(player.client, campaignId, '/history undo', undoId)).toEqual(undone);
    expect((await hero(t, thornId))!.liveState).toEqual(before);
    // Undone entries remain in the log for everyone.
    const log = await f.observer.client.query(api.events.list, { campaignId });
    expect(log.events.find(e => e.id === recovered.eventId)!.disposition).toBe('undone');
    view = await status(player.client, campaignId);
    expect(view.undo.available).toBe(false);
    expect(view.redo).toMatchObject({ available: true, target: { eventId: recovered.eventId } });
    const redone = await submit(player.client, campaignId, '/history redo');
    expect((await hero(t, thornId))!.liveState).toEqual(after);
    expect((await eventById(t, campaignId, recovered.eventId)).disposition).toBe('redone');
    expect((await eventById(t, campaignId, redone.eventId)).kind).toBe('history.redo');
    expect(await diceCounts(t, campaignId)).toEqual(dice);
  });

  test('another character’s action, a Director adjustment and the stretch floor close the player window; the Director rewinds across them', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { director, player, second, campaignId, thornId, zikId } = f;
    // The Director's setup adjustments are the latest units: the window is closed by them.
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      'closed by a committed Director adjustment',
    );
    await submit(player.client, campaignId, '@Thorn /condition on name=prone');
    await submit(second.client, campaignId, '@Zik /hero recover');
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      "closed by Zik's committed action",
    );
    // Zik's player may undo Zik's action; Thorn's player may then undo Thorn's.
    await submit(second.client, campaignId, '/history undo');
    expect((await hero(t, zikId))!.liveState!.recoveries).toBe(5);
    await submit(player.client, campaignId, '/history undo');
    expect((await hero(t, thornId))!.liveState!.conditions.prone).toBe(false);
    // A Director adjustment after a player action is a seam for the player; the Director rewinds it.
    await submit(player.client, campaignId, '@Thorn /hero recover');
    await submit(director.client, campaignId, '@Thorn /adjust surges value=2');
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      'Director adjustment',
    );
    await submit(director.client, campaignId, '/history rewind');
    expect((await hero(t, thornId))!.liveState!.surges).toBe(0);
    await submit(player.client, campaignId, '/history undo');
    expect((await hero(t, thornId))!.liveState!.recoveries).toBe(5);
    // The Director keeps rewinding through the setup adjustments to the session start, then stops.
    let rewinds = 0;
    for (;;) {
      const view = await status(director.client, campaignId);
      if (!view.undo.available) {
        expect(view.undo.reason).toContain('the start of this session');
        break;
      }
      await submit(director.client, campaignId, '/history rewind');
      rewinds += 1;
    }
    // Three setup adjustments per hero (the maximum comes from the admitted build, not an adjustment).
    expect(rewinds).toBe(6);
    // Rewinding the setup adjustments restores the first-admission values (R03 2.1), not an absence.
    expect((await hero(t, thornId))!.liveState).toMatchObject({
      stamina: 30,
      recoveries: 10,
      heroicResource: { name: 'ferocity', current: 0 },
    });
    // Observers have no history controls.
    await expect(submit(f.observer.client, campaignId, '/history redo')).rejects.toThrow(
      'observer',
    );
  });

  test('Enable user undo off removes player undo and redo only; the setting is an attributed entry', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { director, player, campaignId, thornId } = f;
    await submit(player.client, campaignId, '@Thorn /hero recover');
    await submit(player.client, campaignId, '/history undo');
    await submit(player.client, campaignId, '/history redo');
    expect((await status(player.client, campaignId)).enableUserUndo).toBe(true);
    await expect(
      submit(player.client, campaignId, '/campaign user-undo state=off'),
    ).rejects.toThrow('Director');
    const off = await submit(director.client, campaignId, '/campaign user-undo state=off');
    expect((await eventById(t, campaignId, off.eventId)).kind).toBe('campaign.setting');
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.settings?.enableUserUndo).toBe(false);
    const view = await status(player.client, campaignId);
    expect(view.enableUserUndo).toBe(false);
    expect(view.undo).toMatchObject({
      available: false,
      reason: 'Enable user undo is off for this campaign.',
    });
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      'Enable user undo is off',
    );
    // The Director's rewind and redo are unaffected.
    await submit(director.client, campaignId, '/history rewind');
    expect((await hero(t, thornId))!.liveState!.recoveries).toBe(5);
    await expect(submit(player.client, campaignId, '/history redo')).rejects.toThrow(
      'Enable user undo is off',
    );
    await submit(director.client, campaignId, '/history redo');
    expect((await hero(t, thornId))!.liveState!.recoveries).toBe(4);
    await submit(director.client, campaignId, '/campaign user-undo state=on');
    await submit(player.client, campaignId, '/history undo');
    expect((await hero(t, thornId))!.liveState!.recoveries).toBe(5);
  });

  test('an archived encounter is a floor for everyone; the FreePlay stretch after it is undoable', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { director, player, campaignId, sessionId, thornId } = f;
    await openCombat(f);
    await strike(player.client, f, 'Thorn');
    // Reproduce the archive write and derived-index maintenance performed by Finish cleanup.
    const encounter = (await encounterOf(t, sessionId))!;
    await t.run(async ctx => {
      await ctx.db.patch(encounter._id, { status: 'closed-out', archivedAt: Date.now() });
      await indexArchivedEncounter(ctx, encounter);
    });
    const view = await status(director.client, campaignId);
    expect(view.floor.label).toBe('the archived encounter');
    expect(view.undo).toMatchObject({ available: false });
    expect(view.undo.reason).toContain('the archived encounter');
    await expect(submit(director.client, campaignId, '/history rewind')).rejects.toThrow(
      'the archived encounter',
    );
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      'the archived encounter',
    );
    await submit(player.client, campaignId, '@Thorn /hero recover');
    await submit(player.client, campaignId, '/history undo');
    expect((await hero(t, thornId))!.liveState!.recoveries).toBe(5);
    await expect(submit(director.client, campaignId, '/history rewind')).rejects.toThrow(
      'the archived encounter',
    );
    // The archived encounter's strike is untouched: the foe keeps its damage.
    expect((await foe(t, f.goblinId))!.live).toEqual({ stamina: 13, temporaryStamina: 0 });
  });
});

describe('combat undo, rewind, redo and corrections (A05 shapes via fixture)', () => {
  test('acceptance 1 and 8: undoing a costed strike restores foe temporary Stamina, Stamina and the hero resource in one operation without rolling', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { player, campaignId, thornId, goblinId } = f;
    await openCombat(f);
    await submit(player.client, campaignId, '@Thorn /turn take');
    // V142: Thorn's (Fury) turn start added 1d3 ferocity to the fixture's 3; read the pool back.
    const pool = (await hero(t, thornId))!.liveState!.heroicResource.current;
    const struck = await strike(player.client, f, 'Thorn', 5, 1);
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 13, temporaryStamina: 0 });
    expect((await hero(t, thornId))!.liveState!.heroicResource.current).toBe(pool - 1);
    const events = await storedEvents(t, campaignId);
    const head = events.find(e => e._id === struck.eventId)!;
    const consequence = events.find(e => e.kind === 'fixture.damage')!;
    expect(head.dice).toHaveLength(2);
    expect(consequence.commandKey).toBe(head.commandKey);
    const dice = await diceCounts(t, campaignId);
    const undone = await submit(player.client, campaignId, '/history undo');
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 15, temporaryStamina: 3 });
    expect((await hero(t, thornId))!.liveState!.heroicResource.current).toBe(pool);
    const after = await storedEvents(t, campaignId);
    expect(after.find(e => e._id === head._id)!.disposition).toBe('undone');
    expect(after.find(e => e._id === consequence._id)!.disposition).toBe('undone');
    expect(after.find(e => e._id === head._id)!.dice).toEqual(head.dice);
    expect(after.find(e => e._id === undone.eventId)!.dice).toBeUndefined();
    expect(await diceCounts(t, campaignId)).toEqual(dice);
    // A strike the hero cannot afford is refused before any roll or event.
    await expect(strike(player.client, f, 'Thorn', 5, 9)).rejects.toThrow('cannot pay 9');
    expect(await diceCounts(t, campaignId)).toEqual(dice);
  });

  test('acceptance 2 and 3: another player’s strike closes the window; the Director rewinds both in order and is refused at the encounter start', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { director, player, second, campaignId, sessionId, thornId, zikId, goblinId } = f;
    await openCombat(f);
    const thornStrike = await strike(player.client, f, 'Thorn', 4, 1);
    const zikStrike = await strike(second.client, f, 'Zik', 6, 2);
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 8, temporaryStamina: 0 });
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      "Your undo window is closed by Zik's committed action",
    );
    // A stale inline control naming Thorn's strike is refused for the same reason.
    await expect(
      submit(player.client, campaignId, `/history undo event="${thornStrike.eventId}"`),
    ).rejects.toThrow("Zik's committed action");
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 8, temporaryStamina: 0 });
    const dice = await diceCounts(t, campaignId);
    const first = await submit(director.client, campaignId, '/history rewind');
    expect((await eventById(t, campaignId, first.eventId)).payload).toMatchObject({
      data: { target: { eventId: zikStrike.eventId } },
    });
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 14, temporaryStamina: 0 });
    expect((await hero(t, zikId))!.liveState!.heroicResource.current).toBe(3);
    const secondRewind = await submit(director.client, campaignId, '/history rewind');
    expect((await eventById(t, campaignId, secondRewind.eventId)).payload).toMatchObject({
      data: { target: { eventId: thornStrike.eventId } },
    });
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 15, temporaryStamina: 3 });
    expect((await hero(t, thornId))!.liveState!.heroicResource.current).toBe(3);
    // The opening choice and the shared roll are the remaining units inside the encounter.
    await submit(director.client, campaignId, '/history rewind');
    expect((await encounterOf(t, sessionId))!).toMatchObject({ phase: 'choice', round: 0 });
    expect((await t.run(ctx => ctx.db.get(campaignId)))!.malice).toBe(0);
    await submit(director.client, campaignId, '/history rewind');
    expect((await encounterOf(t, sessionId))!).toMatchObject({ phase: 'roll' });
    await expect(submit(director.client, campaignId, '/history rewind')).rejects.toThrow(
      'the encounter start',
    );
    expect((await encounterOf(t, sessionId))!.status).toBe('committed');
    expect(await diceCounts(t, campaignId)).toEqual(dice);
    // Forward again: the shared roll comes back with its recorded face, not a new one.
    await submit(director.client, campaignId, '/history redo');
    const rollEvent = (await storedEvents(t, campaignId)).find(
      e => e.kind === 'combat.initiative-roll',
    )!;
    expect((await encounterOf(t, sessionId))!.opening!.roll!.value).toBe(rollEvent.dice![0]!.value);
    expect(await diceCounts(t, campaignId)).toEqual(dice);
  });

  test('acceptance 4: redo restores the same dice and outcome; a new strike makes redo unavailable while the abandoned entries stay readable', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { player, campaignId, thornId, goblinId } = f;
    await openCombat(f);
    const struck = await strike(player.client, f, 'Thorn', 5, 1);
    const original = await eventById(t, campaignId, struck.eventId);
    const dice = await diceCounts(t, campaignId);
    await submit(player.client, campaignId, '/history undo');
    const redone = await submit(player.client, campaignId, '/history redo');
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 13, temporaryStamina: 0 });
    expect((await hero(t, thornId))!.liveState!.heroicResource.current).toBe(2);
    const restored = await eventById(t, campaignId, struck.eventId);
    expect(restored.dice).toEqual(original.dice);
    expect(restored.disposition).toBe('redone');
    expect((await eventById(t, campaignId, redone.eventId)).payload).toMatchObject({
      data: { target: { eventId: struck.eventId } },
    });
    expect(await diceCounts(t, campaignId)).toEqual(dice);
    // Undo again, then new gameplay: the redo path is gone; the undone strike stays in the log.
    await submit(player.client, campaignId, '/history undo');
    const fresh = await strike(player.client, f, 'Thorn', 2, 1);
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 15, temporaryStamina: 1 });
    const view = await status(player.client, campaignId);
    expect(view.redo.available).toBe(false);
    expect(view.redo.reason).toContain('new gameplay');
    await expect(submit(player.client, campaignId, '/history redo')).rejects.toThrow(
      'cleared the redo path',
    );
    const log = await f.observer.client.query(api.events.list, { campaignId });
    expect(log.events.find(e => e.id === struck.eventId)!.disposition).toBe('undone');
    expect(log.events.find(e => e.id === fresh.eventId)!.disposition).toBe('applied');
    // The new execution rolled fresh dice: one more roll, not a reuse of the recorded one.
    expect((await diceCounts(t, campaignId)).rolls).toBe(dice.rolls + 1);
  });

  test('acceptance 5 and 7: the next turn start blocks the player’s undo and correction; the Director rewinds through it; turn start is the player’s outer limit', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { director, player, second, campaignId, sessionId, thornId, goblinId } = f;
    await openCombat(f);
    const took = await submit(player.client, campaignId, '@Thorn /turn take');
    // V142: Thorn's (Fury) turn start added 1d3 ferocity to the fixture's 3; read the pool back.
    const pool = (await hero(t, thornId))!.liveState!.heroicResource.current;
    const struck = await strike(player.client, f, 'Thorn', 5, 1);
    const playerUser = (await t.run(ctx => ctx.db.get(player.profile.userId)))!;
    const directorUser = (await t.run(ctx => ctx.db.get(director.profile.userId)))!;
    const secondUser = (await t.run(ctx => ctx.db.get(second.profile.userId)))!;
    // Before any later gameplay: the acting player and the Director may correct; Zik's player may not.
    expect(await t.run(ctx => correctionWindow(ctx, struck.eventId, playerUser))).toMatchObject({
      allowed: true,
    });
    expect(await t.run(ctx => correctionWindow(ctx, struck.eventId, directorUser))).toMatchObject({
      allowed: true,
    });
    expect(
      (await t.run(ctx => correctionWindow(ctx, struck.eventId, secondUser))).reason,
    ).toContain("Thorn's committed action");
    const ended = await submit(player.client, campaignId, '@Thorn /turn end');
    // End turn alone is the player's own later action, not the next actor's turn start.
    expect(
      (await t.run(ctx => correctionWindow(ctx, struck.eventId, playerUser))).reason,
    ).toContain('Undo your later action first');
    await submit(director.client, campaignId, `@{foe:${goblinId}} /turn take`);
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      "Goblin Warrior's turn started",
    );
    const blocked = await t.run(ctx => correctionWindow(ctx, struck.eventId, playerUser));
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toContain("Goblin Warrior's turn started");
    const directorBlocked = await t.run(ctx => correctionWindow(ctx, struck.eventId, directorUser));
    expect(directorBlocked.allowed).toBe(false);
    expect(directorBlocked.reason).toContain('Later gameplay has committed');
    // Director rewind: the foe's turn start, Thorn's End turn, Thorn's strike, in that order.
    await submit(director.client, campaignId, '/history rewind');
    let encounter = (await encounterOf(t, sessionId))!;
    expect(encounter.activeTurnId).toBeNull();
    expect(await t.run(ctx => ctx.db.query('turns').take(10))).toHaveLength(1);
    await submit(director.client, campaignId, '/history rewind');
    encounter = (await encounterOf(t, sessionId))!;
    expect(encounter.activeTurnId).not.toBeNull();
    expect((await t.run(ctx => ctx.db.get(encounter.activeTurnId!)))!).toMatchObject({
      status: 'active',
      endedEventId: null,
    });
    expect((await eventById(t, campaignId, ended.eventId)).disposition).toBe('undone');
    // With the strike the latest unit again, the acting player's correction window is open.
    expect(await t.run(ctx => correctionWindow(ctx, struck.eventId, playerUser))).toMatchObject({
      allowed: true,
    });
    await submit(player.client, campaignId, '/history undo');
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 15, temporaryStamina: 3 });
    expect((await hero(t, thornId))!.liveState!.heroicResource.current).toBe(pool);
    expect(
      (await t.run(ctx => correctionWindow(ctx, struck.eventId, playerUser))).reason,
    ).toContain('is undone; redo it');
    // Thorn's own Take turn is the outer limit for the player; the Director rewinds it.
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      'Turn start is the outer limit',
    );
    expect((await status(player.client, campaignId)).undo.reason).toContain('outer limit');
    await submit(director.client, campaignId, '/history rewind');
    expect((await eventById(t, campaignId, took.eventId)).disposition).toBe('undone');
    encounter = (await encounterOf(t, sessionId))!;
    expect(encounter).toMatchObject({
      activeTurnId: null,
      activeGroupId: null,
      activeSide: 'heroes',
    });
    expect(await t.run(ctx => ctx.db.query('turns').take(10))).toHaveLength(0);
  });

  test('acceptance 6: with Enable user undo off, the player’s combat undo is refused and the Director’s rewind is unaffected', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { director, player, campaignId, goblinId } = f;
    await openCombat(f);
    await strike(player.client, f, 'Thorn', 5, 1);
    await submit(director.client, campaignId, '/campaign user-undo state=off');
    await expect(submit(player.client, campaignId, '/history undo')).rejects.toThrow(
      'Enable user undo is off',
    );
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 13, temporaryStamina: 0 });
    await submit(director.client, campaignId, '/history rewind');
    expect((await foe(t, goblinId))!.live).toEqual({ stamina: 15, temporaryStamina: 3 });
  });

  test('undoing End turn restores the round, Malice, group completion and a retired clock registration with their cause', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { director, player, campaignId, sessionId, goblinId } = f;
    await submit(director.client, campaignId, '/combat start');
    await submit(
      director.client,
      campaignId,
      `/combat setup creature=@{foe:${goblinId}} surprised=true`,
    );
    await submit(director.client, campaignId, '/combat commit'); // heroes act first, round 1
    await submit(player.client, campaignId, '@Thorn /turn take');
    await submit(player.client, campaignId, '@Thorn /turn end');
    await submit(second(f).client, campaignId, '@Zik /turn take');
    await submit(second(f).client, campaignId, '@Zik /turn end');
    await submit(director.client, campaignId, `@{foe:${goblinId}} /turn take`);
    const snapshot = async () => {
      const encounter = (await encounterOf(t, sessionId))!;
      const registrations = await t.run(ctx =>
        ctx.db
          .query('clockRegistrations')
          .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
          .take(20),
      );
      const groups = await t.run(ctx =>
        ctx.db
          .query('initiativeGroups')
          .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
          .take(20),
      );
      const entries = await t.run(ctx =>
        ctx.db
          .query('turnEntries')
          .withIndex('by_encounter', q => q.eq('encounterId', encounter._id))
          .take(20),
      );
      const turns = await t.run(ctx => ctx.db.query('turns').take(20));
      return {
        round: encounter.round,
        activeTurnId: encounter.activeTurnId,
        activeGroupId: encounter.activeGroupId,
        activeSide: encounter.activeSide,
        malice: (await t.run(ctx => ctx.db.get(campaignId)))!.malice,
        registrations: registrations.map(r => [r.enqueueSeq, r.status]),
        groups: groups.map(g => g.completedRound),
        surprised: entries.map(e => e.surprised),
        turns: turns.map(x => [x.actor.name, x.status]),
      };
    };
    const beforeEnd = await snapshot();
    expect(beforeEnd).toMatchObject({ round: 1, surprised: [false, false, true] });
    const ended = await submit(director.client, campaignId, '/turn end');
    const afterEnd = await snapshot();
    expect(afterEnd).toMatchObject({
      round: 2,
      activeTurnId: null,
      surprised: [false, false, false],
      // 1 combat-start grant (one-shot, already fired at OK), 2 round gain, 3 end loss; V142: Thorn's
      // then Zik's (both Fury) ferocity grant (fired at OK), turn-start gain and end loss, 4–9;
      // 10 surprise.
      registrations: [
        [1, 'retired'],
        [2, 'active'],
        [3, 'active'],
        [4, 'retired'],
        [5, 'active'],
        [6, 'active'],
        [7, 'retired'],
        [8, 'active'],
        [9, 'active'],
        [10, 'retired'],
      ],
    });
    expect(afterEnd.malice).toBe(beforeEnd.malice! + 2 + 2);
    const dice = await diceCounts(t, campaignId);
    await submit(director.client, campaignId, '/history rewind');
    expect(await snapshot()).toEqual(beforeEnd);
    expect((await eventById(t, campaignId, ended.eventId)).disposition).toBe('undone');
    const endKey = (await eventById(t, campaignId, ended.eventId)).commandKey;
    const clock = (await storedEvents(t, campaignId)).filter(
      e => e.origin === 'clock' && e.commandKey === endKey,
    );
    expect(clock.length).toBeGreaterThan(0);
    for (const e of clock) expect(e.disposition).toBe('undone');
    await submit(director.client, campaignId, '/history redo');
    expect(await snapshot()).toEqual(afterEnd);
    expect(await diceCounts(t, campaignId)).toEqual(dice);
  });

  test('a re-created document keeps its recorded identity through aliases: Take turn rewound, redone and rewound again', async () => {
    const t = backend();
    const f = await historyTable(t);
    const { director, player, campaignId, sessionId, thornId } = f;
    await openCombat(f);
    await submit(player.client, campaignId, '@Thorn /turn take');
    const firstTurn = (await encounterOf(t, sessionId))!.activeTurnId!;
    await submit(director.client, campaignId, '/history rewind');
    expect(await t.run(ctx => ctx.db.get(firstTurn))).toBeNull();
    await submit(director.client, campaignId, '/history redo');
    const encounter = (await encounterOf(t, sessionId))!;
    expect(encounter.activeTurnId).not.toBeNull();
    const turn = (await t.run(ctx => ctx.db.get(encounter.activeTurnId!)))!;
    expect(turn).toMatchObject({ status: 'active', round: 1, side: 'heroes' });
    expect(turn.actor).toEqual({ kind: 'character', id: thornId, name: 'Thorn' });
    expect((await t.run(ctx => ctx.db.get(turn.turnEntryId)))!.spentRound).toBe(1);
    const view = (await director.client.query(api.encounters.current, { campaignId }))!;
    expect(view.activeTurn).toMatchObject({ id: turn._id, actor: { name: 'Thorn' } });
    // The turn can still be ended and the whole thing rewound again through the alias.
    await submit(player.client, campaignId, '@Thorn /turn end');
    await submit(director.client, campaignId, '/history rewind');
    await submit(director.client, campaignId, '/history rewind');
    expect((await encounterOf(t, sessionId))!.activeTurnId).toBeNull();
    expect(await t.run(ctx => ctx.db.query('turns').take(10))).toHaveLength(0);
    expect((await t.run(ctx => ctx.db.get(turn.turnEntryId)))!.spentRound).toBeNull();
  });
});

function second(f: Fixture) {
  return f.second;
}

// Keep the fixture id visible in the suite so a reader sees which operation the tests exercise.
void (FIXTURE_STRIKE_ID satisfies string);
void ({} as Doc<'events'>);
