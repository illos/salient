// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import {
  account,
  admitHero,
  backend,
  heroFixtureSelections,
  storedEvents,
  table,
} from './fixtures/table';

const dwarfSelections = () =>
  draftSelectionsFrom(
    {
      ...Object.fromEntries(
        heroFixtureSelections()
          .filter(s => !s.decisionId.startsWith('ancestry.devil.'))
          .map(s => [s.decisionId, s.value]),
      ),
      'ancestry.choice': 'Dwarf',
      'ancestry.dwarf.purchased-traits': ['Spark Off Your Skin', 'Stand Tough'],
    },
    getDefinitions(1),
  );

async function setup() {
  const t = backend();
  const f = await table(t);
  const dwarfId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'RuneDwarf',
    dwarfSelections(),
  );
  return { t, ...f, dwarfId };
}

// Catches stale concurrent changes, duplicate command side effects and resource/build resets;
// adds persisted campaign rune transitions through the same public API used by the sheet.
test('rune switching and removal preserve resources and builds with one attributed event per command', async () => {
  const f = await setup();
  const before = await f.t.run(ctx => ctx.db.get(f.dwarfId));
  const state = (await f.player.client.query(api.characterRunes.current, {
    characterId: f.dwarfId,
  }))!;
  const args = {
    characterId: f.dwarfId,
    commandId: 'carve-detection-rune',
    rune: 'Detection' as const,
    expectedVersion: 0,
    expectedBuildRevisionId: state.buildRevisionId,
    completedTenMinutes: true,
  };
  expect(await f.player.client.mutation(api.characterRunes.setActiveRune, args)).toBe(1);
  const firstSheet = await f.player.client.query(api.characters.sheet, { characterId: f.dwarfId });
  if (firstSheet.audience === 'peer') throw new Error('Expected owner sheet');
  expect(
    firstSheet.abilities
      .filter(a =>
        ['Runic Carving: Detection', 'Runic Carving: Light', 'Runic Carving: Voice'].includes(
          a.name,
        ),
      )
      .map(a => a.name),
  ).toEqual(['Runic Carving: Detection']);
  expect(await f.player.client.mutation(api.characterRunes.setActiveRune, args)).toBe(1);
  await expect(
    f.player.client.mutation(api.characterRunes.setActiveRune, {
      ...args,
      commandId: 'stale-light-rune',
      rune: 'Light',
    }),
  ).rejects.toThrow(/active rune changed/);
  for (const [version, rune] of [
    [1, 'Light'],
    [2, 'Voice'],
    [3, null],
  ] as const) {
    await f.director.client.mutation(api.characterRunes.setActiveRune, {
      ...args,
      commandId: `rune-transition-${version}`,
      rune,
      expectedVersion: version,
    });
    const sheet = await f.player.client.query(api.characters.sheet, { characterId: f.dwarfId });
    if (sheet.audience === 'peer') throw new Error('Expected owner sheet');
    expect(
      sheet.abilities
        .filter(a =>
          ['Runic Carving: Detection', 'Runic Carving: Light', 'Runic Carving: Voice'].includes(
            a.name,
          ),
        )
        .map(a => a.name),
    ).toEqual(rune ? [`Runic Carving: ${rune}`] : []);
  }
  const after = await f.t.run(ctx => ctx.db.get(f.dwarfId));
  expect(after!.liveState).toEqual(before!.liveState);
  expect(after!.effectiveRevisionId).toBe(before!.effectiveRevisionId);
  expect(after!.draftRevisionId).toBe(before!.draftRevisionId);
  expect(after!.activeRune).toMatchObject({ kind: null, version: 4 });
  const events = (await storedEvents(f.t, f.campaignId)).filter(e => e.kind === 'rune.changed');
  expect(events).toHaveLength(4);
  expect(events[0]!.actorId).toBe(f.player.profile.userId);
  expect(events[3]!.actorId).toBe(f.director.profile.userId);
});

// Catches authority and eligibility bypasses and false time acknowledgement; adds private
// ownership, campaign observer, non-Dwarf and combat rejection coverage without a browser.
test('rune changes require the source trait, authorization, time acknowledgement and no combat', async () => {
  const f = await setup();
  const outsider = await account(f.t, 'RuneOutsider');
  const state = (await f.player.client.query(api.characterRunes.current, {
    characterId: f.dwarfId,
  }))!;
  const args = {
    characterId: f.dwarfId,
    commandId: 'rejected-rune-change',
    rune: 'Detection' as const,
    expectedVersion: 0,
    expectedBuildRevisionId: state.buildRevisionId,
    completedTenMinutes: true,
  };
  expect(
    await f.observer.client.query(api.characterRunes.current, { characterId: f.dwarfId }),
  ).toBeNull();
  await expect(f.observer.client.mutation(api.characterRunes.setActiveRune, args)).rejects.toThrow(
    /controller/,
  );
  await expect(outsider.client.mutation(api.characterRunes.setActiveRune, args)).rejects.toThrow(
    /unavailable/,
  );
  await expect(
    f.player.client.mutation(api.characterRunes.setActiveRune, {
      ...args,
      completedTenMinutes: false,
    }),
  ).rejects.toThrow(/10 uninterrupted/);
  await expect(
    f.player.client.mutation(api.characterRunes.setActiveRune, { ...args, characterId: f.thornId }),
  ).rejects.toThrow(/does not have/);
  const session = await f.director.client.query(api.sessions.get, { sessionId: f.sessionId! });
  await f.director.client.mutation(api.sessions.transition, {
    sessionId: f.sessionId!,
    expectedRevision: session.revision,
    action: 'pause',
    commandId: 'pause-rune-session',
  });
  await expect(f.player.client.mutation(api.characterRunes.setActiveRune, args)).rejects.toThrow(
    /running session/,
  );
  await f.director.client.mutation(api.sessions.transition, {
    sessionId: f.sessionId!,
    expectedRevision: session.revision + 1,
    action: 'resume',
    commandId: 'resume-rune-session',
  });
  await f.t.run(ctx => ctx.db.patch(f.dwarfId, { combatLocked: true }));
  await expect(f.player.client.mutation(api.characterRunes.setActiveRune, args)).rejects.toThrow(
    /outside combat/,
  );
  expect((await f.t.run(ctx => ctx.db.get(f.dwarfId)))!.activeRune).toBeUndefined();

  const privateId = await f.player.client.mutation(api.characters.create, {
    commandId: 'create-private-rune-dwarf',
    authored: { name: 'Private dwarf', appearance: '', biography: '', notes: '' },
    selections: dwarfSelections(),
  });
  const privateState = (await f.player.client.query(api.characterRunes.current, {
    characterId: privateId,
  }))!;
  const privateArgs = {
    ...args,
    commandId: 'private-rune-change',
    characterId: privateId,
    expectedBuildRevisionId: privateState.buildRevisionId,
  };
  await expect(
    outsider.client.mutation(api.characterRunes.setActiveRune, privateArgs),
  ).rejects.toThrow(/unavailable/);
  await expect(
    f.player.client.mutation(api.characterRunes.setActiveRune, {
      ...privateArgs,
      expectedBuildRevisionId: state.buildRevisionId,
    }),
  ).rejects.toThrow(/build changed/);
  expect(await f.player.client.mutation(api.characterRunes.setActiveRune, privateArgs)).toBe(1);
});

// Catches a logged rune change that cannot be undone (or leaves its granted maneuver stale).
// Public history operations must restore the persisted rune and therefore its sheet projection.
test('owner undo and redo restore rune grants through the existing history route', async () => {
  const f = await setup();
  const state = (await f.player.client.query(api.characterRunes.current, {
    characterId: f.dwarfId,
  }))!;
  await f.player.client.mutation(api.characterRunes.setActiveRune, {
    characterId: f.dwarfId,
    commandId: 'carve-undoable-rune',
    rune: 'Voice',
    expectedVersion: 0,
    expectedBuildRevisionId: state.buildRevisionId,
    completedTenMinutes: true,
  });
  // Recarving Voice may select a different recipient; retain exactly one granted maneuver.
  const recarve = await f.player.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'recarve-voice-recipient',
    operation: 'rune.change',
    actor: { refKind: 'character', id: f.dwarfId },
    arguments: {
      rune: 'Voice',
      expectedVersion: 1,
      expectedBuildRevisionId: state.buildRevisionId,
      completedTenMinutes: true,
    },
  });
  expect(recarve.eventId).toBeTruthy();
  expect((await f.t.run(ctx => ctx.db.get(f.dwarfId)))!.activeRune!.version).toBe(2);
  const recarvedSheet = await f.player.client.query(api.characters.sheet, {
    characterId: f.dwarfId,
  });
  if (recarvedSheet.audience === 'peer') throw new Error('Expected owner sheet');
  expect(recarvedSheet.abilities.filter(a => a.name === 'Runic Carving: Voice')).toHaveLength(1);
  await f.player.client.mutation(api.commands.submit, {
    campaignId: f.campaignId,
    commandId: 'undo-recipient-recarving',
    text: '/history undo',
  });
  const carved = await f.t.run(ctx => ctx.db.get(f.dwarfId));
  const undo = await f.player.client.mutation(api.commands.submit, {
    campaignId: f.campaignId,
    text: '/history undo',
    commandId: 'undo-carved-rune',
  });
  expect(undo.eventId).toBeTruthy();
  expect((await f.t.run(ctx => ctx.db.get(f.dwarfId)))!.activeRune).toBeUndefined();
  const undoneSheet = await f.player.client.query(api.characters.sheet, { characterId: f.dwarfId });
  if (undoneSheet.audience === 'peer') throw new Error('Expected owner sheet');
  expect(undoneSheet.abilities.some(a => a.name === 'Runic Carving: Voice')).toBe(false);
  const redo = await f.player.client.mutation(api.commands.submit, {
    campaignId: f.campaignId,
    text: '/history redo',
    commandId: 'redo-carved-rune',
  });
  expect(redo.eventId).toBeTruthy();
  expect((await f.t.run(ctx => ctx.db.get(f.dwarfId)))!.activeRune).toEqual(carved!.activeRune);
  const redoneSheet = await f.player.client.query(api.characters.sheet, { characterId: f.dwarfId });
  if (redoneSheet.audience === 'peer') throw new Error('Expected owner sheet');
  expect(redoneSheet.abilities.some(a => a.name === 'Runic Carving: Voice')).toBe(true);
  await f.director.client.mutation(api.commands.submit, {
    campaignId: f.campaignId,
    text: '/history rewind',
    commandId: 'director-rewind-rune',
  });
  expect((await f.t.run(ctx => ctx.db.get(f.dwarfId)))!.activeRune).toBeUndefined();
  await f.director.client.mutation(api.commands.submit, {
    campaignId: f.campaignId,
    text: '/history redo',
    commandId: 'director-redo-rune',
  });
  expect((await f.t.run(ctx => ctx.db.get(f.dwarfId)))!.activeRune).toEqual(carved!.activeRune);
});
