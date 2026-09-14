// SPDX-License-Identifier: GPL-3.0-only
// A01 acceptance check 5: a short command opens an interaction bound to a labeled actor, the log
// shows that label before any response, a headless response resolves it and the continuation's
// event is recorded under the responder's command id. State is read back from the tables.
import { describe, expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import { backend, storedEvents, table } from './fixtures/table';

describe('interactions', () => {
  test('acceptance 5: opened by a short command, labeled in the log, answered headlessly, resolved', async () => {
    const t = backend();
    const { director, player, campaignId, thornId } = await table(t);
    const opened = await player.client.mutation(api.commands.submit, {
      campaignId,
      text: '@Thorn /table roll',
      commandId: 'open-guided-roll',
    });
    expect(opened.interactionId).not.toBeNull();
    // The log labels the bound actor before anyone interacts.
    const log = await director.client.query(api.events.list, { campaignId });
    expect(log.events[0]!.id).toBe(opened.eventId);
    expect(log.events[0]!.kind).toBe('interaction.opened');
    expect(log.events[0]!.description).toBe('Thorn — awaiting input: which dice to roll.');
    expect(log.events[0]!.actorName).toBe('Player');
    expect(log.events[0]!.dice).toBeUndefined();
    // Headless inspection.
    const pending = await director.client.query(api.interactions.list, { campaignId });
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      id: opened.interactionId,
      status: 'awaiting-input',
      kind: 'guided-input',
      operation: 'table.roll',
      actorLabel: 'Thorn',
      requesterName: 'Player',
      requiredInputs: [
        {
          name: 'dice',
          type: 'string',
          required: true,
          description: 'Dice as NdS, for example "2d10" or "d6". Omit it to be asked.',
        },
      ],
      revision: 0,
      openedEventId: opened.eventId,
      resolvedEventId: null,
      answer: null,
      mayAnswer: true,
    });
    const asObserver = await (await import('./fixtures/table')).account(t, 'Outsider');
    await expect(
      asObserver.client.query(api.interactions.get, { interactionId: opened.interactionId! }),
    ).rejects.toThrow('Campaign unavailable');
    // Nothing was rolled by opening the card.
    expect(await t.run(ctx => ctx.db.query('rolls').take(1))).toEqual([]);
    // A missing answer field is named; the wrong shape is refused; nothing changes.
    await expect(
      player.client.mutation(api.interactions.respond, {
        interactionId: opened.interactionId!,
        answer: {},
        commandId: 'answer-missing-1',
      }),
    ).rejects.toThrow('The card still needs: dice.');
    await expect(
      player.client.mutation(api.interactions.respond, {
        interactionId: opened.interactionId!,
        answer: 'd6',
        commandId: 'answer-wrong-shape',
      }),
    ).rejects.toThrow('The answer must be an object');
    expect((await t.run(ctx => ctx.db.get(opened.interactionId!)))!.status).toBe('awaiting-input');
    // The headless response resolves the card and records the roll for the labeled actor.
    const answered = await player.client.mutation(api.interactions.respond, {
      interactionId: opened.interactionId!,
      answer: { dice: '2d10' },
      commandId: 'answer-guided-roll',
      expectedRevision: 0,
    });
    const row = (await t.run(ctx => ctx.db.get(opened.interactionId!)))!;
    expect(row.status).toBe('resolved');
    expect(row.revision).toBe(1);
    expect(row.resolvedEventId).toBe(answered.eventId);
    expect(row.answer).toEqual({ dice: '2d10' });
    expect(row.resolvedAt).not.toBeNull();
    const rollEvent = (await storedEvents(t, campaignId)).find(e => e._id === answered.eventId)!;
    expect(rollEvent.kind).toBe('table.roll');
    expect(rollEvent.commandId).toBe('answer-guided-roll');
    expect(rollEvent.causeEventId).toBe(opened.eventId);
    expect(rollEvent.actorId).toBe(player.profile.userId);
    expect(rollEvent.dice).toHaveLength(2);
    expect(rollEvent.description).toBe(
      `Thorn rolled 2d10: ${rollEvent.dice!.map(d => d.value).join(', ')}.`,
    );
    const payload = rollEvent.payload as {
      envelope: { boundActor: unknown; arguments: unknown; commandId: string };
      respondsTo: unknown;
    };
    expect(payload.envelope.boundActor).toEqual({ kind: 'character', id: thornId, name: 'Thorn' });
    expect(payload.envelope.arguments).toEqual({ dice: '2d10' });
    expect(payload.envelope.commandId).toBe('answer-guided-roll');
    expect(payload.respondsTo).toEqual({
      interactionId: opened.interactionId,
      answer: { dice: '2d10' },
    });
    // Retrying the response returns the same result and rolls nothing more.
    expect(
      await player.client.mutation(api.interactions.respond, {
        interactionId: opened.interactionId!,
        answer: { dice: '2d10' },
        commandId: 'answer-guided-roll',
      }),
    ).toEqual(answered);
    expect(await t.run(ctx => ctx.db.query('rolls').take(10))).toHaveLength(1);
    // A second answer is refused: the card is resolved.
    await expect(
      player.client.mutation(api.interactions.respond, {
        interactionId: opened.interactionId!,
        answer: { dice: '2d10' },
        commandId: 'answer-again-0001',
      }),
    ).rejects.toThrow('This card is already resolved.');
    expect(await director.client.query(api.interactions.list, { campaignId })).toEqual([]);
    expect(
      (await director.client.query(api.interactions.list, { campaignId, status: 'resolved' })).map(
        i => i.id,
      ),
    ).toEqual([opened.interactionId]);
  });

  test('only the requester or the Director may answer; the Director answers under their own attribution', async () => {
    const t = backend();
    const { director, player, observer, campaignId } = await table(t);
    const opened = await player.client.mutation(api.commands.submit, {
      campaignId,
      text: '/table roll',
      commandId: 'open-plain-roll',
    });
    const seen = await observer.client.query(api.interactions.get, {
      interactionId: opened.interactionId!,
    });
    expect(seen.mayAnswer).toBe(false);
    expect(seen.actorLabel).toBeNull();
    await expect(
      observer.client.mutation(api.interactions.respond, {
        interactionId: opened.interactionId!,
        answer: { dice: 'd6' },
        commandId: 'observer-answers',
      }),
    ).rejects.toThrow('Only the person who opened this card or the Director can answer it.');
    const answered = await director.client.mutation(api.interactions.respond, {
      interactionId: opened.interactionId!,
      answer: { dice: 'd6' },
      commandId: 'director-answers',
    });
    const event = (await storedEvents(t, campaignId)).find(e => e._id === answered.eventId)!;
    expect(event.actorName).toBe('Director');
    expect(event.description).toMatch(/^rolled d6: \d\.$/);
  });

  test('/card respond is the slash spelling of the same response path; close ends a card without a roll', async () => {
    const t = backend();
    const { director, player, campaignId } = await table(t);
    const opened = await player.client.mutation(api.commands.submit, {
      campaignId,
      text: '@Thorn /table roll',
      commandId: 'open-for-slash',
    });
    const answered = await player.client.mutation(api.commands.submit, {
      campaignId,
      text: `/card respond card=@{interaction:${opened.interactionId}} answer={"dice":"3d6"}`,
      commandId: 'slash-respond-01',
    });
    const row = (await t.run(ctx => ctx.db.get(opened.interactionId!)))!;
    expect(row.status).toBe('resolved');
    expect(row.resolvedEventId).toBe(answered.eventId);
    const event = (await storedEvents(t, campaignId)).find(e => e._id === answered.eventId)!;
    expect(event.commandId).toBe('slash-respond-01');
    expect(event.dice).toHaveLength(3);
    expect(event.description).toMatch(/^Thorn rolled 3d6: \d, \d, \d\.$/);
    // The slash response is once-only too.
    expect(
      await player.client.mutation(api.commands.submit, {
        campaignId,
        text: `/card respond card=@{interaction:${opened.interactionId}} answer={"dice":"3d6"}`,
        commandId: 'slash-respond-01',
      }),
    ).toEqual(answered);
    expect(await t.run(ctx => ctx.db.query('rolls').take(10))).toHaveLength(1);
    // Close.
    const second = await player.client.mutation(api.commands.submit, {
      campaignId,
      text: '/table roll',
      commandId: 'open-to-close-01',
    });
    await director.client.mutation(api.interactions.close, {
      interactionId: second.interactionId!,
      commandId: 'close-card-00001',
    });
    const closed = (await t.run(ctx => ctx.db.get(second.interactionId!)))!;
    expect([closed.status, closed.revision, closed.resolvedEventId]).toEqual(['closed', 1, null]);
    expect(await t.run(ctx => ctx.db.query('rolls').take(10))).toHaveLength(1);
    await expect(
      player.client.mutation(api.interactions.respond, {
        interactionId: second.interactionId!,
        answer: { dice: 'd6' },
        commandId: 'answer-closed-001',
      }),
    ).rejects.toThrow('This card is already closed.');
  });
});
