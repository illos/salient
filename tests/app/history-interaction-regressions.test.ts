// SPDX-License-Identifier: GPL-3.0-only
// Regression checks for audit F1–F5. Every consequential assertion reads persisted state.
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import { appendEvent } from '../../convex/lib/events';
import { commandJournal, journalPatch } from '../../convex/lib/journal';
import { noConditions } from '../../convex/lib/tableOperations';
import { backend, table, storedEvents } from './fixtures/table';

test.each([14, 15])(
  'nested replacement journals omitted fields, including deletion-only (%i Stamina)',
  async stamina => {
    const t = backend();
    const { director, campaignId } = await table(t);
    const { foeId, eventId } = await t.run(async ctx => {
      const actor = (await ctx.db.get(director.profile.userId))!;
      const foeId = await ctx.db.insert('foes', {
        campaignId,
        name: 'Fixture',
        visible: true,
        sourceSnapshot: '{}',
        maxStamina: 15,
        live: { stamina: 15, temporaryStamina: 0, conditions: noConditions() },
      });
      const eventId = await appendEvent(ctx, {
        campaignId,
        origin: 'user',
        actor,
        commandId: 'nested-replacement',
        kind: 'fixture',
        description: 'Replace nested object.',
      });
      await journalPatch(ctx, { campaignId, eventId }, 'foes', foeId, {
        live: { stamina, temporaryStamina: 0 },
      });
      return { foeId, eventId };
    });
    const foe = await t.run(ctx => ctx.db.get(foeId));
    expect(foe!.live).toEqual({ stamina, temporaryStamina: 0 });
    const journal = await t.run(ctx =>
      commandJournal(ctx, campaignId, 'nested-replacement', director.profile.userId),
    );
    expect(journal.events.map(e => e._id)).toEqual([eventId]);
    expect(
      journal.changes
        .map(c => ({ path: c.path, before: c.before, after: c.after }))
        .sort((a, b) => b.path.localeCompare(a.path)),
    ).toEqual([
      ...(stamina === 15
        ? []
        : [
            {
              path: 'live.stamina',
              before: { present: true, value: 15 },
              after: { present: true, value: 14 },
            },
          ]),
      {
        path: 'live.conditions',
        before: { present: true, value: noConditions() },
        after: { present: false },
      },
    ]);
  },
);

test('two issuers copying public command IDs receive distinct rolls and distinct journals with inherited consequences', async () => {
  const t = backend();
  const { director, player, campaignId } = await table(t);
  const request = { campaignId, text: '/table roll dice="2d10"', commandId: 'public-copied-roll' };
  const first = await director.client.mutation(api.commands.submit, request);
  const second = await player.client.mutation(api.commands.submit, request);
  expect(await player.client.mutation(api.commands.submit, request)).toEqual(second);
  await t.run(async ctx => {
    for (const [cause, before, after] of [
      [first, 0, 1],
      [second, 1, 2],
    ] as const) {
      const eventId = await appendEvent(ctx, {
        campaignId,
        origin: 'engine',
        commandId: request.commandId,
        causeEventId: cause.eventId,
        kind: 'fixture.consequence',
        description: 'Fixture change.',
      });
      expect((await ctx.db.get(campaignId))!.malice ?? 0).toBe(before);
      await journalPatch(ctx, { campaignId, eventId }, 'campaigns', campaignId, { malice: after });
    }
  });
  const rolls = await t.run(ctx =>
    ctx.db
      .query('rolls')
      .withIndex('by_campaign_command', q =>
        q.eq('campaignId', campaignId).eq('commandId', request.commandId),
      )
      .take(10),
  );
  expect(rolls).toHaveLength(2);
  expect(rolls.map(r => r.counterStart)).toEqual([0, 2]);
  expect(new Set(rolls.map(r => r.commandKey)).size).toBe(2);
  const state = await t.run(ctx =>
    ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique(),
  );
  expect(state!.counter).toBe(4);
  for (const [issuer, result, value] of [
    [director, first, 1],
    [player, second, 2],
  ] as const) {
    const journal = await t.run(ctx =>
      commandJournal(ctx, campaignId, request.commandId, issuer.profile.userId),
    );
    expect(journal.events.map(e => e.origin)).toEqual(['user', 'engine']);
    expect(journal.events[0]!._id).toBe(result.eventId);
    expect(new Set(journal.events.map(e => e.commandKey)).size).toBe(1);
    expect(journal.changes).toHaveLength(1);
    expect(journal.changes[0]!.commandKey).toBe(journal.events[0]!.commandKey);
    expect(journal.changes[0]!.after).toEqual({ present: true, value });
  }
  // A second issuer can also use different dice under the same public id.
  await director.client.mutation(api.commands.submit, {
    ...request,
    commandId: 'different-dice-id',
  });
  await player.client.mutation(api.commands.submit, {
    ...request,
    text: '/table roll dice="d6"',
    commandId: 'different-dice-id',
  });
  expect(
    (await t.run(ctx =>
      ctx.db
        .query('diceStates')
        .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
        .unique(),
    ))!.counter,
  ).toBe(7);
});

test('card resumes its stored entity after rename and same-name replacement; retries work across entry points', async () => {
  const t = backend();
  const { player, campaignId, thornId } = await table(t);
  const opened = await player.client.mutation(api.commands.submit, {
    campaignId,
    text: '@Thorn /table roll',
    commandId: 'open-stable-actor',
  });
  await t.run(async ctx => {
    const original = (await ctx.db.get(thornId))!;
    await ctx.db.patch(thornId, { authored: { ...original.authored, name: 'Renamed' } });
    const { _id, _creationTime, ...copy } = original;
    void _id;
    void _creationTime;
    await ctx.db.insert('characters', copy);
  });
  const answered = await player.client.mutation(api.interactions.respond, {
    interactionId: opened.interactionId!,
    answer: { dice: 'd6' },
    commandId: 'answer-stable-actor',
    expectedRevision: 0,
  });
  const card = (await t.run(ctx => ctx.db.get(opened.interactionId!)))!;
  const event = (await t.run(ctx => ctx.db.get(answered.eventId)))!;
  expect(card.boundActor.id).toBe(thornId);
  expect(card.actorLabel).toBe('Thorn');
  expect(card.continuation.actor).toEqual({ refKind: 'character', id: thornId });
  expect(event.payload.envelope.boundActor).toEqual({
    kind: 'character',
    id: thornId,
    name: 'Renamed',
  });
  expect(
    await player.client.mutation(api.commands.submit, {
      campaignId,
      text: `/card respond card=@{interaction:${opened.interactionId}} answer={"dice":"d6"} revision=0`,
      commandId: 'answer-stable-actor',
    }),
  ).toEqual(answered);
  expect(await t.run(ctx => ctx.db.query('rolls').take(10))).toHaveLength(1);
});

test('a card rechecks current control and an actorless card cannot acquire an actor', async () => {
  const t = backend();
  const { player, director, campaignId, thornId } = await table(t);
  const bound = await player.client.mutation(api.commands.submit, {
    campaignId,
    text: '@Thorn /table roll',
    commandId: 'open-controlled',
  });
  await t.run(ctx => ctx.db.patch(thornId, { ownerId: director.profile.userId }));
  await expect(
    player.client.mutation(api.interactions.respond, {
      interactionId: bound.interactionId!,
      answer: { dice: 'd6' },
      commandId: 'answer-no-control',
    }),
  ).rejects.toThrow('You do not control Thorn');
  const plain = await director.client.mutation(api.commands.submit, {
    campaignId,
    text: '/table roll',
    commandId: 'open-without-actor',
  });
  await expect(
    director.client.mutation(api.commands.submit, {
      campaignId,
      text: `@Thorn /card respond card=@{interaction:${plain.interactionId}} answer={"dice":"d6"}`,
      commandId: 'answer-inject-actor',
    }),
  ).rejects.toThrow('bound to no character');
  for (const id of [bound.interactionId!, plain.interactionId!])
    expect((await t.run(ctx => ctx.db.get(id)))!.status).toBe('awaiting-input');
  expect(await t.run(ctx => ctx.db.query('rolls').take(1))).toEqual([]);
});

test('closed-session cards stay unchanged before and after another session starts, through both write paths', async () => {
  const t = backend();
  const { director, player, campaignId, sessionId } = await table(t);
  const opened = await player.client.mutation(api.commands.submit, {
    campaignId,
    text: '@Thorn /table roll',
    commandId: 'open-old-session',
  });
  await director.client.mutation(api.sessions.transition, {
    sessionId: sessionId!,
    expectedRevision: 0,
    action: 'close',
    commandId: 'close-old-session',
  });
  for (const next of [false, true]) {
    if (next)
      await director.client.mutation(api.sessions.start, {
        campaignId,
        selectedPlayerIds: [player.profile.userId],
        commandId: 'start-next-session',
      });
    const before = await storedEvents(t, campaignId);
    const cardBefore = await t.run(ctx => ctx.db.get(opened.interactionId!));
    expect(
      (await player.client.query(api.interactions.get, { interactionId: opened.interactionId! }))
        .mayAnswer,
    ).toBe(false);
    await expect(
      player.client.mutation(api.interactions.respond, {
        interactionId: opened.interactionId!,
        answer: { dice: 'd6' },
        commandId: `answer-old-session-${next}`,
      }),
    ).rejects.toThrow('owning session');
    await expect(
      director.client.mutation(api.interactions.close, {
        interactionId: opened.interactionId!,
        commandId: `close-old-card-${next}`,
      }),
    ).rejects.toThrow('owning session');
    await expect(
      player.client.mutation(api.commands.submit, {
        campaignId,
        text: `/card respond card=@{interaction:${opened.interactionId}} answer={"dice":"d6"}`,
        commandId: `slash-old-answer-${next}`,
      }),
    ).rejects.toThrow('owning session');
    await expect(
      director.client.mutation(api.commands.submit, {
        campaignId,
        text: `/card close card=@{interaction:${opened.interactionId}}`,
        commandId: `slash-old-close-${next}`,
      }),
    ).rejects.toThrow('owning session');
    expect(await t.run(ctx => ctx.db.get(opened.interactionId!))).toEqual(cardBefore);
    expect(await storedEvents(t, campaignId)).toEqual(before);
  }
  expect(await t.run(ctx => ctx.db.query('rolls').take(1))).toEqual([]);
});

test('registered card closure is attributed, ordered, authorized and once-only across direct and slash calls', async () => {
  const t = backend();
  const { player, director, observer, campaignId } = await table(t);
  expect((await player.client.query(api.commands.list, { campaignId })).map(op => op.id)).toContain(
    'card.close',
  );
  const opened = await player.client.mutation(api.commands.submit, {
    campaignId,
    text: '/table roll',
    commandId: 'open-close-test',
  });
  const before = await storedEvents(t, campaignId);
  await expect(
    observer.client.mutation(api.interactions.close, {
      interactionId: opened.interactionId!,
      commandId: 'observer-close-test',
    }),
  ).rejects.toThrow('Only the person');
  await expect(
    director.client.mutation(api.interactions.close, {
      interactionId: opened.interactionId!,
      commandId: 'stale-close-test',
      expectedRevision: 1,
    }),
  ).rejects.toThrow('card changed');
  await director.client.mutation(api.interactions.close, {
    interactionId: opened.interactionId!,
    commandId: 'director-close-test',
    expectedRevision: 0,
  });
  const result = await director.client.mutation(api.commands.submit, {
    campaignId,
    text: `/card close card=@{interaction:${opened.interactionId}} revision=0`,
    commandId: 'director-close-test',
  });
  const after = await storedEvents(t, campaignId);
  expect(after).toHaveLength(before.length + 1);
  expect(after.at(-1)).toMatchObject({
    _id: result.eventId,
    kind: 'interaction.closed',
    actorId: director.profile.userId,
    origin: 'user',
    causeEventId: opened.eventId,
    sequence: before.at(-1)!.sequence + 1,
    payload: { data: { interactionId: opened.interactionId, status: 'closed' } },
  });
  const card = await t.run(ctx => ctx.db.get(opened.interactionId!));
  expect(card).toMatchObject({ status: 'closed', revision: 1 });
  expect(await t.run(ctx => ctx.db.query('rolls').take(1))).toEqual([]);
});

test('a paused card cannot execute; resuming its owning session permits the same pending card', async () => {
  const t = backend();
  const { director, player, campaignId, sessionId } = await table(t);
  const opened = await player.client.mutation(api.commands.submit, {
    campaignId,
    text: '@Thorn /table roll',
    commandId: 'open-pause-card',
  });
  await director.client.mutation(api.sessions.transition, {
    sessionId: sessionId!,
    expectedRevision: 0,
    action: 'pause',
    commandId: 'pause-card-session',
  });
  const before = await storedEvents(t, campaignId);
  const request = {
    interactionId: opened.interactionId!,
    answer: { dice: 'd6' },
    commandId: 'answer-pause-card',
  };
  await expect(player.client.mutation(api.interactions.respond, request)).rejects.toThrow(
    'session is paused',
  );
  expect(await storedEvents(t, campaignId)).toEqual(before);
  expect((await t.run(ctx => ctx.db.get(opened.interactionId!)))!.status).toBe('awaiting-input');
  expect(await t.run(ctx => ctx.db.query('rolls').take(1))).toEqual([]);
  await director.client.mutation(api.sessions.transition, {
    sessionId: sessionId!,
    expectedRevision: 1,
    action: 'resume',
    commandId: 'resume-card-session',
  });
  const response = await player.client.mutation(api.interactions.respond, request);
  expect((await t.run(ctx => ctx.db.get(response.eventId)))!.sessionId).toBe(sessionId);
  expect((await t.run(ctx => ctx.db.get(opened.interactionId!)))!.status).toBe('resolved');
});
