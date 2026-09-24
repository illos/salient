// SPDX-License-Identifier: GPL-3.0-only
/**
 * V165 respite loop through the shared command path, with persisted readback. Expected values come
 * from rule/resource/respite.md ("regain all your Recoveries and Stamina, and your Victories convert
 * to Experience"), rule/resource/experience.md (Victories reset to 0), the Heroic Advancement table
 * (16 XP per level) and the Thorn fixture's R03 maxima (Stamina 30, Recoveries 10).
 */
import { expect, test } from 'vitest';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { backend, table, storedEvents, admitHero } from './fixtures/table';
import { levelUpsEarned } from '../../convex/lib/respiteOperations';
import tacticianLedger from '../fixtures/v94-tactician-expected.json';
import nullOne from '../fixtures/v103-null-expected.json';
import nullThree from '../fixtures/v133-null-three-expected.json';
import { definitions as levelOneDefinitions } from '../../shared/content/level-one-decisions';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';

async function setup() {
  const t = backend();
  const f = await table(t);
  let n = 0;
  const say = (text: string) =>
    f.director.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `respite-${n++}`,
      text,
    });
  const hero = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!;
  const session = async () => (await t.run(ctx => ctx.db.get(f.sessionId as Id<'sessions'>)))!;
  // Thorn has been through a fight: 20/30 Stamina, 4/10 Recoveries, 17 Victories.
  for (const [field, value] of [
    ['stamina', 20],
    ['recoveries', 4],
    ['victories', 17],
  ] as const)
    await say(`@Thorn /adjust ${field} value=${value}`);
  return { t, ...f, say, hero, session };
}

test('complete restores Stamina and Recoveries, converts Victories to XP and grants level-ups', async () => {
  const f = await setup();
  await expect(
    f.player.client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: 'player-respite',
      text: '/respite start',
    }),
  ).rejects.toThrow();
  await f.say('/respite start');
  expect((await f.session()).respite?.participants.map(p => p.characterId)).toEqual([f.thornId]);
  // The session cannot close and combat cannot start while the respite is open.
  const session = await f.session();
  await expect(
    f.director.client.mutation(api.sessions.transition, {
      sessionId: session._id,
      expectedRevision: session.revision,
      action: 'close',
      commandId: 'close-during-respite',
    }),
  ).rejects.toThrow('A respite is open');
  await expect(f.say('/combat start')).rejects.toThrow('A respite is open');
  const result = await f.say('/respite complete');
  const after = await f.hero();
  expect(after.liveState).toMatchObject({ stamina: 30, recoveries: 10, xp: 17, victories: 0 });
  // 0 → 17 XP crosses the 16-XP threshold once: one pending level-up.
  expect(after.pendingLevelUps).toBe(1);
  expect((await f.session()).respite ?? null).toBeNull();
  const event = (await storedEvents(f.t, f.campaignId)).find(e => e._id === result.eventId)!;
  expect(event.kind).toBe('respite.completed');
  // Complete is final: nothing rewinds across it.
  await expect(f.say('/history rewind')).rejects.toThrow(/the respite/);
  expect((await f.hero()).liveState).toMatchObject({ stamina: 30, xp: 17 });
});

test('interrupt keeps what happened and grants nothing', async () => {
  const f = await setup();
  await f.say('/respite start');
  await f.say('@Thorn /adjust stamina value=25');
  await f.say('/respite interrupt');
  const after = await f.hero();
  expect(after.liveState).toMatchObject({ stamina: 25, recoveries: 4, xp: 0, victories: 17 });
  expect(after.pendingLevelUps ?? 0).toBe(0);
  expect((await f.session()).respite ?? null).toBeNull();
  await expect(f.say('/respite complete')).rejects.toThrow('No respite is open');
});

test('cancel returns every participant to the state before the respite', async () => {
  const f = await setup();
  const before = (await f.hero()).liveState;
  await f.say('/respite start');
  await f.say('@Thorn /adjust stamina value=12');
  await f.say('@Thorn /adjust recoveries value=1');
  await f.say('/respite cancel');
  expect((await f.hero()).liveState).toEqual(before);
  expect((await f.session()).respite ?? null).toBeNull();
});

test('level-ups earned count thresholds crossed, from the entry offset, never past level 10', () => {
  expect(levelUpsEarned(0, 16, 0, 1)).toBe(1);
  expect(levelUpsEarned(15, 17, 0, 1)).toBe(1);
  expect(levelUpsEarned(0, 15, 0, 1)).toBe(0);
  expect(levelUpsEarned(0, 32, 0, 1)).toBe(2);
  // A hero admitted at level 3 carries a 32-XP offset: 16 new XP reaches level 4.
  expect(levelUpsEarned(0, 16, 32, 3)).toBe(1);
  expect(levelUpsEarned(0, 48, 0, 9)).toBe(1);
  expect(levelUpsEarned(0, 48, 0, 10)).toBe(0);
});

test('cancel keeps the damage taken against a build changed during the respite', async () => {
  const f = await setup();
  await f.say('/respite start');
  // A 36-Stamina build activates meanwhile (as a level-up would); 10 damage taken stays.
  await f.t.run(async ctx => {
    const hero = (await ctx.db.get(f.thornId))!;
    const baseline = structuredClone(hero.derivedBaseline) as {
      staminaMaximum: { value: number };
      recoveriesMaximum: { value: number };
    };
    baseline.staminaMaximum.value = 36;
    baseline.recoveriesMaximum.value = 12;
    await ctx.db.patch(f.thornId, {
      derivedBaseline: baseline,
      liveState: { ...hero.liveState!, stamina: 26, recoveries: 6 },
    });
  });
  await f.say('@Thorn /adjust stamina value=5');
  await f.say('/respite cancel');
  // Q-CHAR-2 against the current maxima: 20/30 (10 damage) → 26/36; 4/10 (6 spent) → 6/12.
  expect((await f.hero()).liveState).toMatchObject({ stamina: 26, recoveries: 6 });
});

test('complete leaves a dead hero and heroes outside the respite unchanged', async () => {
  const f = await setup();
  // rule/health/dying.md: death at the negative of the winded value (Thorn: 30 Stamina, winded 15).
  await f.say('@Thorn /adjust stamina value=-15');
  await f.say('/respite start');
  await f.say('/respite complete');
  expect((await f.hero()).liveState).toMatchObject({ stamina: -15, victories: 17, xp: 0 });
  // A hero left out of the respite is untouched.
  const other = await admitHero(f.t, f.player, f.director, f.campaignId, 'Wren');
  await f.say(`@Wren /adjust victories value=3`);
  const wrenBefore = (await f.t.run(ctx => ctx.db.get(other)))!.liveState;
  await f.director.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'rest-thorn-only',
    operation: 'respite.start',
    arguments: { characters: [{ refKind: 'character', id: f.thornId }] },
  });
  await f.say('/respite complete');
  expect((await f.t.run(ctx => ctx.db.get(other)))!.liveState).toEqual(wrenBefore);
});

test('a respite cannot start during combat', async () => {
  const f = await setup();
  await f.say('/combat start');
  await expect(f.say('/respite start')).rejects.toThrow('Finish or void combat');
});

// V166: rule/resource/respite.md "You can also undertake one respite activity … changing your kit";
// chapter/kits.md, Changing Your Kit. Cancel reverts respite choices (docs/table-spec.md#respite-mode).
test('a resting hero changes kit once without review; cancel reverts it', async () => {
  const f = await setup();
  const kitOf = async () =>
    ((await f.hero()).derivedBaseline as { kit: { name: { value: string } } | null } | null)?.kit
      ?.name.value;
  expect(await kitOf()).toBe('Mountain');
  const change = (commandId: string, kit: string) =>
    f.player.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId,
      operation: 'respite.change-kit',
      actor: { refKind: 'character', id: f.thornId },
      arguments: { selections: [{ decisionId: 'kit.choice', value: kit }] },
    });
  await expect(change('kit-outside', 'Panther')).rejects.toThrow('No respite is open');
  await f.say('/respite start');
  await change('kit-panther', 'Panther');
  expect(await kitOf()).toBe('Panther');
  const hero = await f.hero();
  const revision = (await f.t.run(ctx => ctx.db.get(hero.effectiveRevisionId!)))!;
  expect(revision.kind).toBe('respite-kit');
  // One respite activity per respite.
  await expect(change('kit-again', 'Mountain')).rejects.toThrow('already undertook');
  const readback = await f.director.client.query(api.sessions.get, {
    sessionId: f.sessionId as Id<'sessions'>,
  });
  expect(readback.respite?.activities).toEqual([
    { characterId: f.thornId, activity: 'Change kit', all: ['Change kit'], unused: 0 },
  ]);
  await f.say('/respite cancel');
  expect(await kitOf()).toBe('Mountain');
  const current = (await f.hero()).effectiveRevisionId!;
  const reverted = (await f.t.run(ctx => ctx.db.get(current)))!;
  expect(reverted.kind).toBe('restore');
});

test('complete keeps a kit change and names heroes who used no activity', async () => {
  const f = await setup();
  const wren = await admitHero(f.t, f.player, f.director, f.campaignId, 'Wren');
  await f.say('/respite start');
  await f.player.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'wren-project',
    operation: 'respite.activity',
    actor: { refKind: 'character', id: wren },
    arguments: { name: 'Project roll' },
  });
  const result = await f.say('/respite complete');
  const event = (await storedEvents(f.t, f.campaignId)).find(e => e._id === result.eventId)!;
  expect(event.description).toContain('No respite activity used: Thorn.');
  expect(
    (event.payload as { data: { unusedActivities: unknown[] } }).data.unusedActivities,
  ).toEqual([{ name: 'Thorn', used: 0, left: 1 }]);
});

test('kit change refuses the same kit, non-kit decisions and peers; the Director may act', async () => {
  const f = await setup();
  const change = (
    client: typeof f.player.client,
    commandId: string,
    selections: { decisionId: string; value: string }[],
  ) =>
    client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId,
      operation: 'respite.change-kit',
      actor: { refKind: 'character', id: f.thornId },
      arguments: { selections },
    });
  await f.say('/respite start');
  await expect(
    change(f.player.client, 'same-kit-change', [{ decisionId: 'kit.choice', value: 'Mountain' }]),
  ).rejects.toThrow('already');
  await expect(
    change(f.player.client, 'not-kit-change', [
      { decisionId: 'class.fury.aspect', value: 'Reaver' },
    ]),
  ).rejects.toThrow('only kit decisions');
  await expect(
    change(f.observer.client, 'peer-kit-change', [{ decisionId: 'kit.choice', value: 'Panther' }]),
  ).rejects.toThrow();
  await change(f.director.client, 'director-kit', [{ decisionId: 'kit.choice', value: 'Panther' }]);
  const hero = await f.hero();
  expect((hero.derivedBaseline as { kit: { name: { value: string } } }).kit.name.value).toBe(
    'Panther',
  );
});

test('cancel reapplies the earlier kit on a level-up taken after the kit change', async () => {
  const f = await setup();
  await f.t.run(ctx => ctx.db.patch(f.thornId, { pendingLevelUps: 1 }));
  await f.say('/respite start');
  await f.player.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'kit-before-level-up',
    operation: 'respite.change-kit',
    actor: { refKind: 'character', id: f.thornId },
    arguments: { selections: [{ decisionId: 'kit.choice', value: 'Panther' }] },
  });
  // Level 2 with the choices V32 used (class/fury.md; Danger Sense, Wrecking Ball).
  const p = await f.player.client.query(api.characters.progression, { characterId: f.thornId });
  const base = {
    characterId: f.thornId,
    expectedRevision: p.revision,
    expectedBaseRevisionId: p.baseRevisionId!,
  };
  const version = await f.player.client.mutation(api.characters.saveAdvancement, {
    ...base,
    commandId: 'save-level-two',
    expectedDraftVersion: 0,
    selections: draftSelectionsFrom(
      {
        'class.fury.level-2.perk': 'Danger Sense',
        'class.fury.level-2.aspect-ability': 'Wrecking Ball',
      },
      getDefinitions(2),
    ).filter(s => s.decisionId.startsWith('class.fury.level-2.')),
  });
  await f.player.client.mutation(api.characters.finalizeAdvancement, {
    ...base,
    commandId: 'take-level-two',
    expectedDraftVersion: version,
  });
  await f.say('/respite cancel');
  const hero = await f.hero();
  const baseline = hero.derivedBaseline as {
    level: { value: number };
    kit: { name: { value: string } };
  };
  expect(baseline.kit.name.value).toBe('Mountain');
  expect(baseline.level.value).toBe(2);
  const effective = hero.effectiveRevisionId!;
  expect((await f.t.run(ctx => ctx.db.get(effective)))!.kind).toBe('respite-kit');
});

// QC1 V166 R1 (V168): feature/tactician/level-1/field-arsenal.md — where both kits grant a benefit,
// "you take one or the other and can't change your choice until you finish a respite."
test('a Tactician cannot switch a Field Arsenal choice mid-respite while keeping both kits', async () => {
  const f = await setup();
  const witness = tacticianLedger.witnesses.find(w => w.id === 'v94-tactician-3')!;
  const id = await admitHero(
    f.t,
    f.player,
    f.director,
    f.campaignId,
    'Planner',
    draftSelectionsFrom(witness.selections as never, levelOneDefinitions),
  );
  const arsenal = async () => {
    const hero = (await f.t.run(ctx => ctx.db.get(id)))!;
    const revision = hero.effectiveRevisionId!;
    const build = (await f.t.run(ctx => ctx.db.get(revision)))!;
    return build.selections.find(s => s.decisionId === 'class.tactician.arsenal.meleeDamage')
      ?.value;
  };
  expect(await arsenal()).toBe('Mountain');
  await f.say('/respite start');
  await expect(
    f.player.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: 'arsenal-only-change',
      operation: 'respite.change-kit',
      actor: { refKind: 'character', id },
      arguments: {
        selections: [
          { decisionId: 'class.tactician.arsenal.meleeDamage', value: 'Martial Artist' },
        ],
      },
    }),
  ).rejects.toThrow("can't change until a respite finishes");
  // Swapping which kit is primary keeps the same pair of kits: still locked.
  await expect(
    f.player.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: 'arsenal-by-swapping-kits',
      operation: 'respite.change-kit',
      actor: { refKind: 'character', id },
      arguments: {
        selections: [
          { decisionId: 'kit.choice', value: 'Mountain' },
          { decisionId: 'class.tactician.second-kit', value: 'Martial Artist' },
          { decisionId: 'class.tactician.arsenal.meleeDamage', value: 'Martial Artist' },
          { decisionId: 'class.tactician.arsenal.stamina', value: 'Mountain' },
        ],
      },
    }),
  ).rejects.toThrow("can't change until a respite finishes");
  await f.say('/respite interrupt');
  expect(await arsenal()).toBe('Mountain');
});

// V167: the table reads the open respite and a hero's kit options through shared queries.
test('the table roster shows resting heroes and their activity; kit options list the kit pool', async () => {
  const f = await setup();
  const kits = await f.player.client.query(api.characters.kitOptions, { characterId: f.thornId });
  expect(kits.current).toBe('Mountain');
  expect(kits.options).toContain('Panther');
  expect(kits.multiple).toBe(false);
  await f.say('/respite start');
  const roster = await f.player.client.query(api.table.roster, { campaignId: f.campaignId });
  expect(roster.session?.respite?.participants).toEqual([
    { characterId: f.thornId, activity: null, activities: [], unused: 1 },
  ]);
  await f.player.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'table-activity',
    operation: 'respite.activity',
    actor: { refKind: 'character', id: f.thornId },
    arguments: { name: 'Project roll' },
  });
  const after = await f.player.client.query(api.table.roster, { campaignId: f.campaignId });
  expect(after.session?.respite?.participants[0]?.activity).toBe('Project roll');
});

// V169: feature/null/level-2/rapid-processing.md (Chronokinetic): "during any respite, you can take
// an additional respite activity"; rule/resource/respite.md gives everyone one. The Null is the
// v103-1 ledger witness (Chronokinetic; Rapid Processing among its level-2 added features), levelled
// to 2 during the respite through the shared level-up path with its ledger choices.
test('a Null gains a second respite activity from Rapid Processing, even mid-respite', async () => {
  const f = await setup();
  const witness = nullThree.witnesses['v103-1'];
  expect(witness.tradition).toBe('Chronokinetic');
  expect(witness.levelTwo.addedFeatures).toContain('Rapid Processing');
  const one = nullOne.witnesses.find(w => w.id === witness.base)!;
  const id = await admitHero(
    f.t,
    f.player,
    f.director,
    f.campaignId,
    'Vessel',
    draftSelectionsFrom(one.selections as never, levelOneDefinitions),
  );
  let n = 0;
  const record = (character: Id<'characters'>, name: string) =>
    f.player.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: `respite-activity-${n++}-${character}`,
      operation: 'respite.activity',
      actor: { refKind: 'character', id: character },
      arguments: { name },
    });
  const roster = async () =>
    (await f.player.client.query(api.table.roster, { campaignId: f.campaignId })).session!.respite!
      .participants;
  const vessel = async () => (await roster()).find(r => r.characterId === id)!;

  await f.say('/respite start');
  // Level 1: no Rapid Processing, one activity.
  await record(id, 'Project roll');
  await expect(record(id, 'Read the archive')).rejects.toThrow('already undertook a respite');
  expect(await vessel()).toMatchObject({ activities: ['Project roll'], unused: 0 });

  await f.director.client.mutation(api.commands.invoke, {
    campaignId: f.campaignId,
    commandId: 'grant-vessel-level-up',
    operation: 'character.grant-level-up',
    arguments: { characters: [{ refKind: 'character', id }] },
  });
  const p = await f.player.client.query(api.characters.progression, { characterId: id });
  expect(p.targetLevel).toBe(2);
  const added = {
    'class.null.level-2.perk': witness.levelTwo.addedSelections.perk,
    'class.null.level-2.chronokinetic-ability': witness.levelTwo.addedSelections.traditionAbility,
  };
  const selections = draftSelectionsFrom(added as never, getDefinitions(2)).filter(s =>
    p.newDecisionIds.includes(s.decisionId),
  );
  expect(selections.map(s => s.decisionId).sort()).toEqual(Object.keys(added).sort());
  const advancement = {
    characterId: id,
    expectedRevision: p.revision,
    expectedBaseRevisionId: p.baseRevisionId!,
  };
  const version = await f.player.client.mutation(api.characters.saveAdvancement, {
    ...advancement,
    commandId: 'save-vessel-level-two',
    expectedDraftVersion: p.draft?.version ?? 0,
    selections,
  });
  await f.player.client.mutation(api.characters.finalizeAdvancement, {
    ...advancement,
    commandId: 'take-vessel-level-two',
    expectedDraftVersion: version,
  });
  const hero = (await f.t.run(ctx => ctx.db.get(id)))!;
  const features = (hero.derivedBaseline as { features: { name: string }[] }).features;
  expect(features.map(feature => feature.name)).toContain('Rapid Processing');

  // Level 2 with Rapid Processing: a second activity, and no third.
  expect(await vessel()).toMatchObject({ unused: 1 });
  await record(id, 'Read the archive');
  expect(await vessel()).toMatchObject({
    activities: ['Project roll', 'Read the archive'],
    unused: 0,
  });
  await expect(record(id, 'A third')).rejects.toThrow('already undertook their 2');
  // Thorn has no Rapid Processing: exactly one.
  await record(f.thornId, 'Project roll');
  await expect(record(f.thornId, 'Another')).rejects.toThrow('already undertook a respite');
  const stored = (await f.session()).respite!.participants.find(r => r.characterId === id)!;
  expect(stored).toMatchObject({ activity: 'Project roll', moreActivities: ['Read the archive'] });
  await f.say('/respite complete');

  // A later respite: one of the Null's two activities used; Complete names the one left.
  await f.say('/respite start');
  await record(id, 'Project roll');
  const result = await f.say('/respite complete');
  const event = (await storedEvents(f.t, f.campaignId)).find(e => e._id === result.eventId)!;
  expect(event.description).toContain('Respite activities left unused: Vessel (1).');
  expect(event.description).toContain('No respite activity used: Thorn.');
});
