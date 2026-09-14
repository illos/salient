// SPDX-License-Identifier: GPL-3.0-only
// A01 acceptance checks 1, 2, 3 and 6 at the shared-operation level: the slash mutation the web
// console and the CLI both call, once-only commitment, the authority check for each role, and
// registry discovery. Every assertion reads persisted rows or `events.list` back; return values are
// only used to locate rows.
import { describe, expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import { backend, storedEvents, table } from './fixtures/table';

describe('the shared command path', () => {
  test('acceptance 1: the same /table roll from two submitters yields events of identical shape with server dice', async () => {
    const t = backend();
    const { director, player, campaignId, sessionId } = await table(t);
    // "Web" submission: the console calls commands.submit with the slash text.
    const fromWeb = await director.client.mutation(api.commands.submit, {
      campaignId,
      text: '/table roll dice="2d10"',
      commandId: 'web-roll-000001',
    });
    // "CLI" submission: `pnpm app command` calls the same mutation with the same text.
    const fromCli = await player.client.mutation(api.commands.submit, {
      campaignId,
      text: '/table roll dice="2d10"',
      commandId: 'cli-roll-000001',
    });
    const listed = await director.client.query(api.events.list, { campaignId });
    const rolls = listed.events.filter(e => e.kind === 'table.roll');
    expect(rolls.map(e => e.id)).toEqual([fromCli.eventId, fromWeb.eventId]);
    // Identical shape: same keys, same origin/session, dice recorded on the event.
    const shape = (e: (typeof rolls)[number]) => Object.keys(e).sort();
    expect(shape(rolls[0]!)).toEqual(shape(rolls[1]!));
    for (const roll of rolls) {
      expect(roll.origin).toBe('user');
      expect(roll.sessionId).toBe(sessionId);
      expect(roll.dice).toHaveLength(2);
      for (const die of roll.dice!) {
        expect(die.sides).toBe(10);
        expect(die.value).toBeGreaterThanOrEqual(1);
        expect(die.value).toBeLessThanOrEqual(10);
      }
      expect(roll.description).toBe(`rolled 2d10: ${roll.dice!.map(d => d.value).join(', ')}.`);
      const envelope = (roll.payload as { envelope: Record<string, unknown> }).envelope;
      expect(envelope.operation).toBe('table.roll');
      expect(envelope.arguments).toEqual({ dice: '2d10' });
      expect(envelope.boundActor).toBeNull();
    }
    // User attribution is the invoking user of each submission, separately recorded.
    expect(rolls.map(e => e.actorName)).toEqual(['Player', 'Director']);
    expect(
      rolls.map(e => (e.payload as { envelope: { issuerId: string } }).envelope.issuerId),
    ).toEqual([player.profile.userId, director.profile.userId]);
    // The dice are the server's accepted rolls for those command ids.
    const stored = await t.run(ctx =>
      ctx.db
        .query('rolls')
        .withIndex('by_campaign_command', q => q.eq('campaignId', campaignId))
        .take(10),
    );
    expect(stored.map(r => [r.commandId, r.dice])).toEqual([
      ['cli-roll-000001', rolls[0]!.dice],
      ['web-roll-000001', rolls[1]!.dice],
    ]);
  });

  test('acceptance 2: retrying with the same commandId adds no event; a changed envelope under that id is refused', async () => {
    const t = backend();
    const { director, campaignId } = await table(t);
    const args = { campaignId, text: '/table roll dice="d6"', commandId: 'retry-roll-00001' };
    const first = await director.client.mutation(api.commands.submit, args);
    const before = await storedEvents(t, campaignId);
    const retry = await director.client.mutation(api.commands.submit, args);
    expect(retry).toEqual(first);
    const after = await storedEvents(t, campaignId);
    expect(after).toEqual(before);
    expect(after.filter(e => e.kind === 'table.roll')).toHaveLength(1);
    expect(after.filter(e => e.kind === 'table.roll')[0]!.commandId).toBe('retry-roll-00001');
    await expect(
      director.client.mutation(api.commands.submit, { ...args, text: '/table roll dice="d8"' }),
    ).rejects.toThrow('different request');
    expect(await storedEvents(t, campaignId)).toEqual(before);
    // The structured route shares the receipt: the same id with the equivalent envelope is the
    // same command, and a different operation under it is refused.
    expect(
      await director.client.mutation(api.commands.invoke, {
        campaignId,
        commandId: 'retry-roll-00001',
        operation: 'table.roll',
        arguments: { dice: 'd6' },
      }),
    ).toEqual(first);
    await expect(
      director.client.mutation(api.commands.invoke, {
        campaignId,
        commandId: 'retry-roll-00001',
        operation: 'session.note',
        arguments: { text: 'x' },
      }),
    ).rejects.toThrow('different request');
    expect(await storedEvents(t, campaignId)).toEqual(before);
  });

  test('acceptance 3: /session note is Director-only with readable refusals for player and observer', async () => {
    const t = backend();
    const { director, player, observer, campaignId, sessionId } = await table(t);
    const before = (await storedEvents(t, campaignId)).length;
    await expect(
      player.client.mutation(api.commands.submit, {
        campaignId,
        text: '/session note text="Players cannot"',
        commandId: 'player-note-0001',
      }),
    ).rejects.toThrow('/session note is for the Director; you are a player here.');
    await expect(
      observer.client.mutation(api.commands.submit, {
        campaignId,
        text: '/session note text="Observers cannot"',
        commandId: 'observer-note-01',
      }),
    ).rejects.toThrow('/session note is for the Director; you are an observer here.');
    expect((await storedEvents(t, campaignId)).length).toBe(before);
    const result = await director.client.mutation(api.commands.submit, {
      campaignId,
      text: '/session note text="The party rests at the ford."',
      commandId: 'director-note-01',
    });
    const stored = (await storedEvents(t, campaignId)).find(e => e._id === result.eventId)!;
    expect(stored.kind).toBe('session.note');
    expect(stored.description).toBe('The party rests at the ford.');
    expect(stored.actorId).toBe(director.profile.userId);
    expect(stored.sessionId).toBe(sessionId);
    expect(stored.origin).toBe('user');
    // The observer cannot roll either; the player can.
    await expect(
      observer.client.mutation(api.commands.submit, {
        campaignId,
        text: '/table roll dice="d20"',
        commandId: 'observer-roll-01',
      }),
    ).rejects.toThrow('/table roll is for the Director or a player; you are an observer here.');
    // Non-members see nothing at all.
    const outsider = await (await import('./fixtures/table')).account(t, 'Outsider');
    await expect(
      outsider.client.mutation(api.commands.submit, {
        campaignId,
        text: '/table roll dice="d20"',
        commandId: 'outsider-roll-01',
      }),
    ).rejects.toThrow('Campaign unavailable');
  });

  test('session state gates: no session, paused session, stale revision', async () => {
    const t = backend();
    const { director, campaignId } = await table(t, { session: false });
    await expect(
      director.client.mutation(api.commands.submit, {
        campaignId,
        text: '/session note text="No session yet"',
        commandId: 'note-no-session',
      }),
    ).rejects.toThrow('/session note needs an active session');
    const sessionId = await director.client.mutation(api.sessions.start, {
      campaignId,
      selectedPlayerIds: [],
      commandId: 'start-session-2',
    });
    await director.client.mutation(api.sessions.transition, {
      sessionId,
      expectedRevision: 0,
      action: 'pause',
      commandId: 'pause-session-2',
    });
    // A note is allowed while paused (it is not gameplay); a table roll is not.
    await director.client.mutation(api.commands.submit, {
      campaignId,
      text: '/session note text="Paused for a break"',
      commandId: 'note-while-paused',
    });
    await expect(
      director.client.mutation(api.commands.submit, {
        campaignId,
        text: '/table roll dice="d6"',
        commandId: 'roll-while-paused',
      }),
    ).rejects.toThrow('The session is paused; /table roll waits until the Director resumes it.');
    await expect(
      director.client.mutation(api.commands.submit, {
        campaignId,
        text: '/session note text="Stale"',
        commandId: 'note-stale-rev',
        expectedRevision: 0,
      }),
    ).rejects.toThrow('Session changed');
    await director.client.mutation(api.commands.submit, {
      campaignId,
      text: '/session note text="Fresh"',
      commandId: 'note-fresh-rev',
      expectedRevision: 1,
    });
    const kinds = (await storedEvents(t, campaignId)).map(e => [e.kind, e.description]);
    expect(kinds).toContainEqual(['session.note', 'Paused for a break']);
    expect(kinds).toContainEqual(['session.note', 'Fresh']);
    expect(kinds).not.toContainEqual(['session.note', 'Stale']);
  });

  test('argument validation, unknown commands and parse errors are readable and record nothing', async () => {
    const t = backend();
    const { director, campaignId } = await table(t);
    const before = await storedEvents(t, campaignId);
    const cases: [string, string][] = [
      ['/session note', 'Missing argument "text".'],
      ['/session note text=5', 'Argument "text" must be string.'],
      ['/session note text="x" extra=1', 'Unknown argument "extra" for /session note.'],
      ['@Thorn /session note text="x"', '/session note does not take an @actor.'],
      ['/table roll dice="2d10+3"', 'Write dice as "NdS"'],
      ['/table roll dice="0d10"', 'Roll between 1 and 100 dice.'],
      ['/table roll dice="d1"', 'side count'],
      ['/encounter start type=combat', 'Unknown command "/encounter start"'],
      ['/table roll dice=2d10', 'Could not read that command'],
      ['@self /table roll', '@self cannot be the actor'],
    ];
    for (const [text, message] of cases) {
      await expect(
        director.client.mutation(api.commands.submit, {
          campaignId,
          text,
          commandId: `bad-${cases.findIndex(c => c[0] === text)}-00000`,
        }),
      ).rejects.toThrow(message);
    }
    expect(await storedEvents(t, campaignId)).toEqual(before);
    expect(await t.run(ctx => ctx.db.query('rolls').take(1))).toEqual([]);
  });

  test('actor binding: players act for their own characters, the Director for anyone, names bind exactly', async () => {
    const t = backend();
    const { director, player, observer, campaignId, thornId } = await table(t);
    const byPlayer = await player.client.mutation(api.commands.submit, {
      campaignId,
      text: '@Thorn /table roll dice="d10"',
      commandId: 'thorn-by-player',
    });
    const event = (await storedEvents(t, campaignId)).find(e => e._id === byPlayer.eventId)!;
    expect(event.actorName).toBe('Player');
    expect(event.description).toMatch(/^Thorn rolled d10: \d+\.$/);
    expect((event.payload as { envelope: { boundActor: unknown } }).envelope.boundActor).toEqual({
      kind: 'character',
      id: thornId,
      name: 'Thorn',
    });
    const byDirector = await director.client.mutation(api.commands.submit, {
      campaignId,
      text: `@{character:${thornId}} /table roll dice="d10"`,
      commandId: 'thorn-by-director',
    });
    const directed = (await storedEvents(t, campaignId)).find(e => e._id === byDirector.eventId)!;
    expect([directed.actorName, directed.actorId]).toEqual(['Director', director.profile.userId]);
    expect(directed.description).toMatch(/^Thorn rolled d10: \d+\.$/);
    // Another member's character is not the observer's to control, even if they were a player.
    await t.run(ctx =>
      ctx.db.insert('characters', {
        ownerId: observer.profile.userId,
        authored: { name: 'Elwin', appearance: '', biography: '', notes: '' },
        revision: 1,
        draftRevisionId: null,
        effectiveRevisionId: null,
        derivedBaseline: null,
        liveState: null,
        campaignId,
        combatLocked: false,
      }),
    );
    await expect(
      player.client.mutation(api.commands.submit, {
        campaignId,
        text: '@Elwin /table roll dice="d10"',
        commandId: 'elwin-by-player',
      }),
    ).rejects.toThrow('You do not control Elwin.');
    await expect(
      player.client.mutation(api.commands.submit, {
        campaignId,
        text: '@thorn /table roll dice="d10"',
        commandId: 'thorn-lowercase',
      }),
    ).rejects.toThrow('No character or foe named "thorn" is at this table.');
    await expect(
      player.client.mutation(api.commands.submit, {
        campaignId,
        text: '@{creature:x} /table roll dice="d10"',
        commandId: 'thorn-badkind-1',
      }),
    ).rejects.toThrow('Unknown actor reference kind "creature"');
  });

  test('acceptance 6: commands.list returns every registered operation with its argument schema and availability', async () => {
    const t = backend();
    const { director, player, observer, campaignId } = await table(t);
    // A03 appends its operations after A01's three; this check covers the A01 entries.
    const forDirector = (await director.client.query(api.commands.list, { campaignId })).slice(
      0,
      3,
    );
    expect(forDirector.map(o => o.id)).toEqual(['session.note', 'table.roll', 'card.respond']);
    expect(forDirector.map(o => [o.family, o.verb, o.syntax])).toEqual([
      ['session', 'note', '/session note text=…'],
      ['table', 'roll', '[@Actor] /table roll [dice=…]'],
      ['card', 'respond', '[@Actor] /card respond card=… answer=… [revision=…]'],
    ]);
    expect(forDirector[0]!.arguments).toEqual([
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The note, up to 2000 characters.',
      },
    ]);
    expect(forDirector[1]!.arguments).toEqual([
      {
        name: 'dice',
        type: 'string',
        required: false,
        description: 'Dice as NdS, for example "2d10" or "d6". Omit it to be asked.',
      },
    ]);
    expect(forDirector[2]!.arguments.map(a => [a.name, a.type, a.required])).toEqual([
      ['card', 'object', true],
      ['answer', 'object', true],
      ['revision', 'number', false],
    ]);
    expect(forDirector.map(o => o.available)).toEqual([true, true, true]);
    const forPlayer = (await player.client.query(api.commands.list, { campaignId })).slice(0, 3);
    expect(forPlayer.map(o => [o.available, o.unavailableReason])).toEqual([
      [false, '/session note is for the Director; you are a player here.'],
      [true, null],
      [true, null],
    ]);
    const forObserver = (await observer.client.query(api.commands.list, { campaignId })).slice(
      0,
      3,
    );
    expect(forObserver.map(o => o.available)).toEqual([false, false, true]);
  });
});
