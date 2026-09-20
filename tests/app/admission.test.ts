// SPDX-License-Identifier: GPL-3.0-only
// A02 acceptance checks 3 to 7 at the shared-operation level: the admission authority matrix, R03
// first-admission live values read back from the character row, draft-save isolation from live
// values, audience-projected sheet payloads (owner notes absent for the Director and peers),
// verbatim ability text from the pinned source, and the Manual adjustment entry for Victories.
// Expected numbers are the R02/R03 fixture values from the documents, never evaluator output.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { HeroSheet, PeerSheet } from '../../shared/contracts/characterSheet';
import {
  account,
  backend,
  heroFixtureSelections,
  storedEvents,
  table,
  type Backend,
} from './fixtures/table';

const examples = JSON.parse(
  readFileSync('shared/content/character-evaluation-examples.json', 'utf8'),
) as { examples: { complete: { expected: { baseline: unknown } } } };

async function draftOf(t: Backend, owner: Awaited<ReturnType<typeof account>>, name: string) {
  const authored = { name, appearance: '', biography: '', notes: `${name} private` };
  const characterId = await owner.client.mutation(api.characters.create, {
    commandId: `create-${name}`,
    authored,
  });
  await owner.client.mutation(api.characters.save, {
    commandId: `save-${name}`,
    characterId,
    expectedRevision: 1,
    authored,
    selections: heroFixtureSelections({ 'details.name': name }),
  });
  return { characterId, authored };
}
const stored = (t: Backend, id: Id<'characters'>) => t.run(ctx => ctx.db.get(id));
const reviewsOf = (t: Backend, id: Id<'characters'>) =>
  t.run(ctx =>
    ctx.db
      .query('characterReviews')
      .withIndex('by_character', q => q.eq('characterId', id))
      .take(10),
  );

describe('A02 admission', () => {
  test('acceptance 3: a player submission is not effective until approval; withdrawal and decline leave it unchanged', async () => {
    const t = backend();
    const { director, player, observer, campaignId } = await table(t, { session: false });
    const { characterId } = await draftOf(t, player, 'Ash');
    // Non-owners cannot submit; non-members cannot reach the campaign at all.
    await expect(
      observer.client.mutation(api.characters.submit, {
        commandId: 'obs-submits-ash',
        characterId,
        campaignId,
      }),
    ).rejects.toThrow('Only the character owner');
    const outsider = await account(t, 'Outsider');
    const { characterId: strayId } = await draftOf(t, outsider, 'Stray');
    await expect(
      outsider.client.mutation(api.characters.submit, {
        commandId: 'outsider-submits',
        characterId: strayId,
        campaignId,
      }),
    ).rejects.toThrow('Campaign unavailable');
    // Submit: pending, no effective build, no live record, not at the table.
    const submitted = await player.client.mutation(api.characters.submit, {
      commandId: 'ash-submit-1',
      characterId,
      campaignId,
    });
    let row = (await stored(t, characterId))!;
    expect([row.effectiveRevisionId, row.liveState, row.campaignId, row.derivedBaseline]).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect((await reviewsOf(t, characterId)).map(r => [r.kind, r.status])).toEqual([
      ['admission', 'pending'],
    ]);
    const event = (await storedEvents(t, campaignId)).find(e => e._id === submitted.eventId)!;
    expect([event.kind, event.actorName]).toEqual(['character.submitted', 'Player']);
    expect(
      (await director.client.query(api.table.roster, { campaignId })).heroes.map(h => h.name),
    ).toEqual(['Thorn']);
    // Only the Director decides: the player and the observer are refused.
    for (const [who, id] of [
      [player, 'player-approves'],
      [observer, 'observer-approves'],
    ] as const)
      await expect(
        who.client.mutation(api.characters.approve, { commandId: id, characterId }),
      ).rejects.toThrow('for the Director');
    // A second submission while one is pending is refused; withdrawal releases it.
    await expect(
      player.client.mutation(api.characters.submit, {
        commandId: 'ash-submit-2',
        characterId,
        campaignId,
      }),
    ).rejects.toThrow('awaiting review');
    await player.client.mutation(api.characters.withdraw, {
      commandId: 'ash-withdraw',
      characterId,
    });
    expect((await reviewsOf(t, characterId)).map(r => r.status)).toEqual(['withdrawn']);
    await expect(
      director.client.mutation(api.characters.approve, { commandId: 'approve-gone', characterId }),
    ).rejects.toThrow('no submission awaiting review');
    // Resubmit and decline.
    await player.client.mutation(api.characters.submit, {
      commandId: 'ash-submit-3',
      characterId,
      campaignId,
    });
    const declined = await director.client.mutation(api.characters.decline, {
      commandId: 'ash-decline',
      characterId,
    });
    expect((await storedEvents(t, campaignId)).find(e => e._id === declined.eventId)!.kind).toBe(
      'character.declined',
    );
    row = (await stored(t, characterId))!;
    expect([row.effectiveRevisionId, row.liveState, row.campaignId]).toEqual([null, null, null]);
    // Resubmit; an edit after submission makes the submission stale so approval cannot activate it.
    await player.client.mutation(api.characters.submit, {
      commandId: 'ash-submit-4',
      characterId,
      campaignId,
    });
    const before = (await stored(t, characterId))!;
    await player.client.mutation(api.characters.save, {
      commandId: 'ash-edit-after-submit',
      characterId,
      expectedRevision: before.revision,
      authored: before.authored,
      selections: heroFixtureSelections({ 'details.name': 'Ash', 'kit.choice': undefined }),
    });
    expect((await reviewsOf(t, characterId)).at(-1)!.status).toBe('stale');
    await expect(
      director.client.mutation(api.characters.approve, { commandId: 'approve-stale', characterId }),
    ).rejects.toThrow('no submission awaiting review');
    // An incomplete draft cannot be submitted.
    await expect(
      player.client.mutation(api.characters.submit, {
        commandId: 'ash-submit-5',
        characterId,
        campaignId,
      }),
    ).rejects.toThrow('incomplete');
  });

  test('acceptance 3: approval activates the exact revision and initializes live state per R03; the Director’s own hero is logged without approval', async () => {
    const t = backend();
    const { director, player, campaignId } = await table(t, { session: false });
    const { characterId } = await draftOf(t, player, 'Ash');
    await player.client.mutation(api.characters.submit, {
      commandId: 'ash-submit',
      characterId,
      campaignId,
    });
    const approved = await director.client.mutation(api.characters.approve, {
      commandId: 'ash-approve',
      characterId,
    });
    const row = (await stored(t, characterId))!;
    const revision = (await t.run(ctx => ctx.db.get(row.effectiveRevisionId!)))!;
    expect(revision.revision).toBe(2);
    expect(row.effectiveRevisionId).toBe(row.draftRevisionId);
    expect(row.campaignId).toBe(campaignId);
    // R02 section 4.1: the effective baseline is the complete example.
    expect(row.derivedBaseline).toEqual(examples.examples.complete.expected.baseline);
    // R03 section 2.1: first-admission values (Stamina 30, temp 0, Recoveries 10, ferocity 0,
    // surges 0, Victories 0, XP 0, nine toggles off).
    expect(row.liveState).toEqual({
      stamina: 30,
      temporaryStamina: 0,
      recoveries: 10,
      heroicResource: { name: 'ferocity', current: 0 },
      surges: 0,
      victories: 0,
      xp: 0,
      conditions: {
        bleeding: false,
        dazed: false,
        frightened: false,
        grabbed: false,
        prone: false,
        restrained: false,
        slowed: false,
        taunted: false,
        weakened: false,
      },
      origin: {
        kind: 'first-admission',
        buildRevisionId: row.effectiveRevisionId,
        evaluatedAgainst: {
          definitionsSchemaVersion: 'r01.1',
          compendiumRevision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
        },
        initializedAt: row.liveState!.origin.initializedAt,
      },
    });
    const event = (await storedEvents(t, campaignId)).find(e => e._id === approved.eventId)!;
    expect([event.kind, event.actorName]).toEqual(['character.admitted', 'Director']);
    expect((event.payload as { data: { firstAdmission: boolean } }).data.firstAdmission).toBe(true);
    expect(
      (await director.client.query(api.table.roster, { campaignId })).heroes
        .map(h => h.name)
        .sort(),
    ).toEqual(['Ash', 'Thorn']);
    // The Director's own hero: effective on submission, logged, no approval step.
    const { characterId: ownId } = await draftOf(t, director, 'Vex');
    const logged = await director.client.mutation(api.characters.submit, {
      commandId: 'vex-submit',
      characterId: ownId,
      campaignId,
    });
    const own = (await stored(t, ownId))!;
    expect(own.effectiveRevisionId).toBe(own.draftRevisionId);
    expect(own.liveState?.stamina).toBe(30);
    expect((await reviewsOf(t, ownId)).map(r => r.status)).toEqual(['logged']);
    const loggedEvent = (await storedEvents(t, campaignId)).find(e => e._id === logged.eventId)!;
    expect(loggedEvent.kind).toBe('character.admitted');
    expect(loggedEvent.description).toContain('logged without approval');
    // A retry with the same command id neither re-admits nor duplicates the event.
    await director.client.mutation(api.characters.submit, {
      commandId: 'vex-submit',
      characterId: ownId,
      campaignId,
    });
    expect((await reviewsOf(t, ownId)).length).toBe(1);
    // The combat lock blocks activation for owner and Director alike.
    await t.run(ctx => ctx.db.patch(characterId, { combatLocked: true }));
    const locked = (await stored(t, characterId))!;
    await player.client
      .mutation(api.characters.save, {
        commandId: 'ash-locked-save-attempt',
        characterId,
        expectedRevision: locked.revision,
        authored: locked.authored,
      })
      .catch(() => undefined);
    await expect(
      player.client.mutation(api.characters.submit, {
        commandId: 'ash-locked-submit',
        characterId,
        campaignId,
      }),
    ).rejects.toThrow('locked during combat');
  });

  test('acceptance 4: a draft save after admission leaves every live value unchanged', async () => {
    const t = backend();
    const { director, player, campaignId, thornId } = await table(t);
    await director.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'thorn-stamina-12',
      text: `@Thorn /adjust stamina value=12`,
    });
    await player.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'thorn-prone',
      text: `@Thorn /condition on name=prone`,
    });
    const before = (await stored(t, thornId))!;
    expect(before.liveState!.stamina).toBe(12);
    // An incomplete draft (kit removed) and a complete one (same build, new revision).
    await player.client.mutation(api.characters.save, {
      commandId: 'thorn-draft-incomplete',
      characterId: thornId,
      expectedRevision: before.revision,
      authored: { ...before.authored, biography: 'Edited while attached' },
      selections: heroFixtureSelections({ 'details.name': 'Thorn', 'kit.choice': undefined }),
    });
    let after = (await stored(t, thornId))!;
    expect(after.liveState).toEqual(before.liveState);
    expect(after.derivedBaseline).toEqual(before.derivedBaseline);
    expect(after.effectiveRevisionId).toBe(before.effectiveRevisionId);
    expect(after.authored.biography).toBe('Edited while attached');
    // The owner's sheet still shows the effective build; the draft preview is labeled.
    const effective = (await player.client.query(api.characters.sheet, {
      characterId: thornId,
    })) as HeroSheet;
    expect([effective.build?.label, effective.build?.status, effective.live?.stamina]).toEqual([
      'effective',
      'complete',
      12,
    ]);
    const draft = (await player.client.query(api.characters.sheet, {
      characterId: thornId,
      view: 'draft',
    })) as HeroSheet;
    expect([draft.build?.label, draft.build?.status]).toEqual(['draft', 'incomplete']);
    expect(draft.live?.stamina).toBe(12);
    // A full edit approved later replaces the build and still leaves live values untouched.
    await player.client.mutation(api.characters.save, {
      commandId: 'thorn-draft-complete',
      characterId: thornId,
      expectedRevision: after.revision,
      authored: after.authored,
      selections: heroFixtureSelections({ 'details.name': 'Thorn' }),
    });
    await player.client.mutation(api.characters.submit, {
      commandId: 'thorn-full-edit',
      characterId: thornId,
      campaignId,
    });
    after = (await stored(t, thornId))!;
    expect(after.effectiveRevisionId).toBe(before.effectiveRevisionId);
    const activated = await director.client.mutation(api.characters.approve, {
      commandId: 'thorn-full-edit-approve',
      characterId: thornId,
    });
    after = (await stored(t, thornId))!;
    expect(after.effectiveRevisionId).not.toBe(before.effectiveRevisionId);
    expect(after.liveState).toEqual(before.liveState);
    expect(after.unreconciled ?? []).toEqual([]);
    expect((await storedEvents(t, campaignId)).find(e => e._id === activated.eventId)!.kind).toBe(
      'character.build-activated',
    );
  });

  test('acceptance 5 and 6: audiences of the sheet read, owner notes absent from Director and peer payloads, verbatim ability text', async () => {
    const t = backend();
    const { director, player, observer, campaignId, thornId } = await table(t);
    await t.action(internal.content.reseed, {});
    const owner = (await player.client.query(api.characters.sheet, {
      characterId: thornId,
    })) as HeroSheet;
    expect(owner.audience).toBe('owner');
    expect(owner.authored.notes).toBe("Thorn's private note");
    const forDirector = (await director.client.query(api.characters.sheet, {
      characterId: thornId,
    })) as HeroSheet;
    expect(forDirector.audience).toBe('director');
    expect(forDirector.authored).not.toHaveProperty('notes');
    expect(JSON.stringify(forDirector)).not.toContain('private note');
    expect(forDirector.abilities.map(a => a.name)).toEqual(owner.abilities.map(a => a.name));
    const peer = (await observer.client.query(api.characters.sheet, {
      characterId: thornId,
    })) as PeerSheet;
    expect(peer).toEqual({
      audience: 'peer',
      id: thornId,
      name: 'Thorn',
      ownerName: 'Player',
      live: { stamina: 30, recoveries: 10 },
      maxima: { staminaMaximum: 30, recoveriesMaximum: 10 },
    });
    const outsider = await account(t, 'Outsider');
    await expect(
      outsider.client.query(api.characters.sheet, { characterId: thornId }),
    ).rejects.toThrow('Character unavailable');
    // Acceptance 6: exactly the seven granted abilities (R02 4.1), each with the pinned file's text.
    expect(owner.abilities.map(a => a.name)).toEqual([
      'Brutal Slam',
      'Out of the Way!',
      'Thunder Roar',
      'Lines of Force',
      'Pain for Pain',
      'Melee Weapon Free Strike',
      'Ranged Weapon Free Strike',
    ]);
    for (const ability of owner.abilities) {
      expect(ability.content).not.toBeNull();
      expect(ability.content!.text).toBe(
        readFileSync(`vendor/steel-compendium/${ability.sourcePath}`, 'utf8'),
      );
    }
    expect(owner.abilities.map(a => a.group)).toEqual([
      'main',
      'main',
      'main',
      'triggered',
      'main', // Pain for Pain is the kit's printed main-action signature.
      'main',
      'main',
    ]);
    expect(owner.abilities[1]!.metadata.cost).toBe('3 Ferocity');
    // Features carry verbatim source text, including the readable chapter for Culture edge.
    const withText = owner.features.filter(f => f.content);
    expect(withText.map(f => f.name)).toEqual([
      'Silver Tongue',
      'Beast Legs',
      'Impressive Horns',
      'Culture edge',
      'Ferocity',
      'Growing Ferocity',
      'Mighty Leaps',
      'Kit',
      'Primordial Strength',
      'Teamwork',
    ]);
    for (const feature of withText)
      expect(feature.content!.text).toBe(readFileSync(feature.content!.sourcePath, 'utf8'));
    expect(owner.features.find(f => f.name === 'Culture edge')?.content?.id).toBe(
      'mcdm.heroes.v1/chapter/background',
    );
    // Live labels (R03 2.3) and identity from the baseline.
    expect(owner.live?.labels).toEqual({
      windedValue: 15,
      winded: false,
      dying: false,
      deadThresholdReached: false,
    });
    expect(owner.build?.baseline?.characteristics.I.value).toBe(1);
    // The pending submission of another hero is inspectable by the Director as "proposed".
    const { characterId } = await draftOf(t, player, 'Ash');
    await player.client.mutation(api.characters.submit, {
      commandId: 'ash-submit',
      characterId,
      campaignId,
    });
    const proposed = (await director.client.query(api.characters.sheet, {
      characterId,
    })) as HeroSheet;
    expect([proposed.build?.label, proposed.live, proposed.review?.status]).toEqual([
      'proposed',
      null,
      'pending',
    ]);
    expect(proposed.authored).not.toHaveProperty('notes');
    // A peer cannot see a pending, unattached hero at all.
    await expect(observer.client.query(api.characters.sheet, { characterId })).rejects.toThrow(
      'Character unavailable',
    );
  });

  test('acceptance 7: a Director edit of Victories from 0 to 1 appends a Manual adjustment with before and after', async () => {
    const t = backend();
    const { director, player, campaignId, thornId } = await table(t);
    const result = await director.client.mutation(api.commands.submit, {
      campaignId,
      commandId: 'victories-1',
      text: `@{character:${thornId}} /adjust victories value=1`,
    });
    const event = (await storedEvents(t, campaignId)).find(e => e._id === result.eventId)!;
    expect(event.kind).toBe('manual.adjustment');
    expect(event.description).toBe('Manual adjustment — Thorn Victories 0 → 1.');
    expect(event.actorName).toBe('Director');
    expect((event.payload as { data: unknown }).data).toEqual({
      field: 'victories',
      label: 'Victories',
      creature: { kind: 'character', id: thornId },
      before: 0,
      after: 1,
    });
    const rows = await t.run(ctx =>
      ctx.db
        .query('changes')
        .withIndex('by_event', q => q.eq('eventId', result.eventId))
        .take(10),
    );
    expect(rows.map(r => [r.path, r.before, r.after])).toEqual([
      ['liveState.victories', { present: true, value: 1 }, { present: true, value: 1 }].map(
        (v, i) => (i === 1 ? { present: true, value: 0 } : v),
      ),
    ]);
    expect((await stored(t, thornId))!.liveState!.victories).toBe(1);
    // Players hold no numeric editing authority; the provisional maxima verbs are gone.
    await expect(
      player.client.mutation(api.commands.submit, {
        campaignId,
        commandId: 'player-victories',
        text: `@Thorn /adjust victories value=2`,
      }),
    ).rejects.toThrow('Director');
    const listed = await director.client.query(api.commands.list, { campaignId });
    expect(listed.some(op => op.id === 'adjust.stamina-maximum')).toBe(false);
    expect(listed.map(op => op.id)).toEqual(
      expect.arrayContaining([
        'character.submit',
        'character.withdraw',
        'character.approve',
        'character.decline',
      ]),
    );
  });
});

test('first admission cannot bypass paused or committed-combat party roster locks', async () => {
  const t = backend();
  const { director, player, campaignId, sessionId } = await table(t);
  const { characterId } = await draftOf(t, player, 'LateArrival');
  await player.client.mutation(api.characters.submit, {
    campaignId,
    characterId,
    commandId: 'late-submit',
  });
  await director.client.mutation(api.sessions.transition, {
    sessionId: sessionId!,
    expectedRevision: (await t.run(ctx => ctx.db.get(sessionId!)))!.revision,
    action: 'pause',
    commandId: 'pause-admission',
  });
  await expect(
    director.client.mutation(api.characters.approve, {
      campaignId,
      characterId,
      commandId: 'paused-approve',
    }),
  ).rejects.toThrow('roster is locked while paused');
  expect((await stored(t, characterId))!.campaignId).toBeNull();
  expect((await reviewsOf(t, characterId))[0]!.status).toBe('pending');
  await director.client.mutation(api.sessions.transition, {
    sessionId: sessionId!,
    expectedRevision: (await t.run(ctx => ctx.db.get(sessionId!)))!.revision,
    action: 'resume',
    commandId: 'resume-admission',
  });
  await director.client.mutation(api.commands.submit, {
    campaignId,
    commandId: 'combat-late-start',
    text: '/combat start',
  });
  await director.client.mutation(api.commands.submit, {
    campaignId,
    commandId: 'combat-late-commit',
    text: '/combat commit',
  });
  expect((await t.run(ctx => ctx.db.get(sessionId!)))!.encounterId).not.toBeNull();
  await expect(
    director.client.mutation(api.characters.approve, {
      campaignId,
      characterId,
      commandId: 'combat-approve',
    }),
  ).rejects.toThrow('roster is locked during combat');
  expect((await stored(t, characterId))!.liveState).toBeNull();
  expect((await reviewsOf(t, characterId))[0]!.status).toBe('pending');
});

test('recent pending reviews remain discoverable after more than 200 prior decisions', async () => {
  const t = backend();
  const { director, player, campaignId } = await table(t, { session: false });
  const { characterId } = await draftOf(t, player, 'VeteranDraft');
  const revision = (await stored(t, characterId))!;
  await t.run(async ctx => {
    for (let i = 0; i < 205; i++)
      await ctx.db.insert('characterReviews', {
        characterId,
        campaignId,
        ownerId: player.profile.userId,
        revisionId: revision.draftRevisionId!,
        revision: 2,
        kind: 'admission',
        status: 'declined',
        submittedAt: i,
        decidedAt: i,
        decidedById: director.profile.userId,
      });
  });
  await player.client.mutation(api.characters.submit, {
    campaignId,
    characterId,
    commandId: 'latest-review-submit',
  });
  expect((await player.client.query(api.characters.get, { characterId })).review!.status).toBe(
    'pending',
  );
  const queue = await director.client.query(api.characters.reviews, { campaignId });
  expect(queue.some(review => review.characterId === characterId)).toBe(true);
  await director.client.mutation(api.characters.approve, {
    campaignId,
    characterId,
    commandId: 'latest-review-approve',
  });
  expect((await stored(t, characterId))!.campaignId).toBe(campaignId);
});

/** Synthetic later baselines exercise the settled lifecycle without widening playable options. */
async function futureDraft(
  t: Backend,
  characterId: Id<'characters'>,
  stamina: number,
  recoveries: number,
  resource = 'ferocity',
) {
  await t.run(async ctx => {
    const character = (await ctx.db.get(characterId))!;
    const revision = (await ctx.db.get(character.effectiveRevisionId!))!;
    const baseline = structuredClone(
      revision.derivedBaseline,
    ) as import('../../shared/contracts/characterEvaluation').DerivedBaseline;
    baseline.staminaMaximum.value = stamina;
    baseline.recoveriesMaximum.value = recoveries;
    baseline.recoveryValue.value = Math.floor(stamina / 3);
    baseline.windedValue.value = Math.floor(stamina / 2);
    baseline.heroicResource.name.value = resource as typeof baseline.heroicResource.name.value;
    const id = await ctx.db.insert('characterRevisions', {
      characterId,
      revision: character.revision + 1,
      parentRevisionId: revision._id,
      selections: revision.selections,
      status: 'complete',
      derivedBaseline: baseline,
      evaluation: { ...(revision.evaluation as object), baseline },
    });
    await ctx.db.patch(characterId, { revision: character.revision + 1, draftRevisionId: id });
  });
}

test.each([
  {
    label: 'increased maxima do not refill',
    current: [20, 7],
    maxima: [36, 12],
    expected: [20, 7],
  },
  {
    label: 'decreased maxima cap current amounts',
    current: [20, 7],
    maxima: [18, 6],
    expected: [18, 6],
  },
  {
    label: 'negative Stamina keeps its source-authorized value',
    current: [-4, 4],
    maxima: [18, 6],
    expected: [-4, 4],
  },
])(
  'Q-CHAR-2: $label, preview and commit agree atomically',
  async ({ current, maxima, expected }) => {
    const t = backend();
    const { player, director, campaignId, thornId } = await table(t, { session: false });
    await t.run(async ctx => {
      const row = (await ctx.db.get(thornId))!;
      await ctx.db.patch(thornId, {
        liveState: {
          ...row.liveState!,
          stamina: current[0]!,
          recoveries: current[1]!,
          temporaryStamina: 5,
          surges: 2,
          victories: 3,
          xp: 4,
          heroicResource: { name: 'ferocity', current: 8 },
          conditions: { ...row.liveState!.conditions, prone: true },
        },
        unreconciled: [
          {
            field: 'staminaMaximum',
            before: 21,
            after: 30,
            currentValue: current[0]!,
            question: 'Q-CHAR-2',
            revisionId: row.effectiveRevisionId!,
          },
        ],
      });
    });
    await futureDraft(t, thornId, maxima[0]!, maxima[1]!);
    const before = (await stored(t, thornId))!;
    const preview = (await player.client.query(api.characters.get, { characterId: thornId }))
      .activationPreview!;
    expect(preview.incompatibleResource).toBeNull();
    expect(preview.changes.map(c => [c.currentBefore, c.currentAfter, c.maximumAfter])).toEqual([
      [current[0], expected[0], maxima[0]],
      [current[1], expected[1], maxima[1]],
    ]);
    expect((await stored(t, thornId))!.liveState).toEqual(before.liveState);
    await player.client.mutation(api.characters.submit, {
      campaignId,
      characterId: thornId,
      commandId: 'caps-submit',
    });
    const proposed = (await director.client.query(api.characters.sheet, {
      characterId: thornId,
      view: 'proposed',
    })) as HeroSheet;
    expect(proposed.activationPreview).toEqual(preview);
    const result = await director.client.mutation(api.characters.approve, {
      campaignId,
      characterId: thornId,
      commandId: 'caps-approve',
    });
    const after = (await stored(t, thornId))!;
    expect(after.liveState).toEqual({
      ...before.liveState,
      stamina: expected[0],
      recoveries: expected[1],
    });
    expect(after.effectiveRevisionId).toBe(before.draftRevisionId);
    expect(after.unreconciled ?? []).toEqual([]);
    const event = (await storedEvents(t, campaignId)).find(e => e._id === result.eventId)!;
    expect((event.payload as { data: { reconciliation: unknown } }).data.reconciliation).toEqual(
      preview,
    );
    expect(JSON.stringify(event.payload)).not.toContain('Q-CHAR-2');
    await director.client.mutation(api.characters.approve, {
      campaignId,
      characterId: thornId,
      commandId: 'caps-approve',
    });
    expect(await stored(t, thornId)).toEqual(after);
  },
);

test('Q-CHAR-2: incompatible resource replacement is previewed and refused without partial activation', async () => {
  const t = backend();
  const { player, director, campaignId, thornId } = await table(t, { session: false });
  await futureDraft(t, thornId, 18, 6, 'focus');
  await player.client.mutation(api.characters.submit, {
    campaignId,
    characterId: thornId,
    commandId: 'resource-submit',
  });
  const before = (await stored(t, thornId))!;
  const events = await storedEvents(t, campaignId);
  const proposed = (await director.client.query(api.characters.sheet, {
    characterId: thornId,
    view: 'proposed',
  })) as HeroSheet;
  expect(proposed.activationPreview!.incompatibleResource).toEqual({
    before: 'ferocity',
    after: 'focus',
  });
  await expect(
    director.client.mutation(api.characters.approve, {
      campaignId,
      characterId: thornId,
      commandId: 'resource-approve',
    }),
  ).rejects.toThrow('requires explicit resource reconciliation');
  expect(await stored(t, thornId)).toEqual(before);
  expect((await reviewsOf(t, thornId)).some(r => r.status === 'pending')).toBe(true);
  expect(await storedEvents(t, campaignId)).toEqual(events);
});
