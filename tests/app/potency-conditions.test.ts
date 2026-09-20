// SPDX-License-Identifier: GPL-3.0-only
// V88 integration: real registered operations with disclosed characteristic and dice fixtures.
// The evaluated fixture's Might is lowered to 0 only to exercise the BP tier boundary;
// the separate headless runner uses legally evaluated builds and unpositioned campaign dice.
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DerivedBaseline, EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { generate } from '../../convex/lib/dice';
import { fromHex } from '../../convex/lib/sha256';
import { backend, table, admitHero, type Backend } from './fixtures/table';

import examples from '../../shared/content/character-evaluation-examples.json' with { type: 'json' };
import { definitions } from '../../shared/content/level-one-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';

let sequence = 0;
async function position(t: Backend, campaignId: Id<'campaigns'>, faces: number[]) {
  await t.run(async ctx => {
    const state = (await ctx.db
      .query('diceStates')
      .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
      .unique())!;
    for (let counter = state.counter; counter < state.counter + 100000; counter++) {
      const roll = generate(
        fromHex(state.seed),
        counter,
        faces.map((_, i) => ({ id: `die${i}`, sides: 10 })),
      );
      if (roll.dice.every((die, i) => die.value === faces[i])) {
        await ctx.db.patch(state._id, { counter });
        return;
      }
    }
    throw new Error('Fixture dice position not found');
  });
}

test('BP6–10: applied use, score privacy, correction flip, exact restoration and post-save refusal', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  await t.run(async ctx => {
    const hero = (await ctx.db.get(f.thornId))!;
    const baseline = hero.derivedBaseline as DerivedBaseline;
    await ctx.db.patch(f.thornId, {
      derivedBaseline: {
        ...baseline,
        characteristics: {
          ...baseline.characteristics,
          M: { ...baseline.characteristics.M, value: 0 },
        },
      },
    });
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `potency-${++sequence}`,
      text,
    });
  const goblin = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
    commandId: `potency-${++sequence}`,
  });
  await command('@Thorn /adjust stamina value=30');
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command('@Thorn /turn take', true);
  await command('@Thorn /turn end', true);
  await command('/adjust malice value=2');
  await command(`@{foe:${goblin}} /turn take`);
  await position(t, f.campaignId, [7, 7]);
  const used = await command(
    `@{foe:${goblin}} /ability use ability="Bury the Point" targets=[@Thorn]`,
  );
  const live = async () => (await t.run(ctx => ctx.db.get(f.thornId)))!.liveState!;
  const read = async (client: typeof f.director.client) => {
    const result = (
      await client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [used.eventId],
      })
    )[0]!;
    const effect = (result.compiled as PublicCompiledResult).effects.find(
      o => o.effect.kind === 'condition',
    )!;
    if (effect.effect.kind !== 'condition') throw new Error('Missing condition');
    return effect;
  };
  const first = await read(f.director.client);
  expect(first.effect).toMatchObject({
    status: 'applied',
    threshold: 1,
    targetScore: 0,
    condition: 'bleeding',
  });
  expect((await read(f.player.client)).effect).toHaveProperty('targetScore', 0);
  expect((await read(f.observer.client)).effect).not.toHaveProperty('targetScore');
  const applied = await live();
  expect(applied.stamina).toBe(24);
  expect(applied.conditions.bleeding).toBe(true);
  expect(applied.conditionInstances).toHaveLength(1);
  expect(applied.conditionInstances![0]).toMatchObject({
    id: first.id,
    sourceUseEventId: used.eventId,
    status: 'active',
    abilityName: 'Bury the Point',
  });
  expect(applied.conditionInstances![0]!.registrationId).toBeTruthy();
  const resolve = () =>
    f.director.client.mutation(api.commands.invoke, {
      campaignId: f.campaignId,
      commandId: `potency-${++sequence}`,
      operation: 'ability.resolved',
      arguments: {
        event: used.eventId,
        occurrence: first.id,
        target: { refKind: 'character', id: f.thornId },
      },
    });
  await expect(resolve()).rejects.toThrow(/applied|resisted/);
  expect(await live()).toEqual(applied);
  const correct = () =>
    command(`/ability correct event="${used.eventId}" target=@Thorn edges=0 banes=2`);
  await correct();
  const corrected = await live();
  expect(corrected.stamina).toBe(25);
  expect(corrected.conditions.bleeding).toBe(false);
  expect(corrected.conditionInstances![0]!.status).toBe('ended');
  const after = await read(f.director.client);
  expect(after.id).not.toBe(first.id);
  expect(after.effect).toMatchObject({ status: 'resisted', threshold: 0, targetScore: 0 });
  await command('/history rewind');
  expect(await live()).toEqual(applied);
  expect(await read(f.director.client)).toEqual(first);
  await command('/history redo');
  expect(await live()).toEqual(corrected);
  await command(`/ability correct event="${used.eventId}" target=@Thorn edges=0 banes=0`);
  const reapplied = await live();
  expect(reapplied.conditions.bleeding).toBe(true);
  expect(
    reapplied.conditionInstances!.filter(instance => instance.status === 'active'),
  ).toHaveLength(1);
  expect(reapplied.conditionInstances!.at(-1)!.id).not.toBe(first.id);
  expect((await read(f.director.client)).effect).toMatchObject({ status: 'applied', threshold: 1 });
  await command('/history rewind');
  expect(await live()).toEqual(corrected);
  await command('/history rewind');
  await command(`@{foe:${goblin}} /turn end`);
  await command('@Thorn /turn take', true);
  await position(t, f.campaignId, [6]);
  await command('@Thorn /turn end', true);
  const saved = await live();
  expect(saved.conditions.bleeding).toBe(false);
  expect(saved.conditionInstances![0]).toMatchObject({
    status: 'ended',
    lastSave: { roll: 6, success: true },
  });
  await expect(correct()).rejects.toThrow(/saving throw has already been rolled/);
  expect(await live()).toEqual(saved);
  const rolls = await t.run(ctx => ctx.db.query('rolls').take(100));
  await command('/history rewind');
  expect((await live()).conditions.bleeding).toBe(true);
  await command('/history redo');
  expect(await live()).toEqual(saved);
  expect(await t.run(ctx => ctx.db.query('rolls').take(100))).toEqual(rolls);
});

test('player Wode correction flips potency and replaces slowed with tier-three restrained', async () => {
  const t = backend();
  const f = await table(t);
  await t.action(internal.content.reseed, {});
  const choices: EvaluationInput['selections'] = { ...examples.examples.complete.input.selections };
  for (const key of Object.keys(choices)) if (key.startsWith('ancestry.')) delete choices[key];
  choices['ancestry.choice'] = 'Wode Elf';
  choices['ancestry.wode-elf.purchased-traits'] = ['The Wode Defends', 'Forest Walk'];
  choices['details.name'] = 'Willow';
  const willow = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Willow',
    draftSelectionsFrom(choices, definitions),
  );
  const foe = await f.director.client.mutation(api.foes.add, {
    campaignId: f.campaignId,
    definitionId: 'mcdm.monsters.v1/monster.dwarf.statblock/dwarf-warden',
    commandId: `potency-${++sequence}`,
  });
  const command = (text: string, player = false) =>
    (player ? f.player : f.director).client.mutation(api.commands.submit, {
      campaignId: f.campaignId,
      commandId: `potency-${++sequence}`,
      text,
    });
  await command('/combat start');
  await command('/combat commit');
  await command('/combat roll', true);
  await command('/combat first side=heroes');
  await command(`@{character:${willow}} /turn take`, true);
  await position(t, f.campaignId, [7, 7]);
  const used = await command(
    `@{character:${willow}} /ability use ability="The Wode Defends" targets=[@{foe:${foe}}] characteristic=M damage-characteristic=M`,
    true,
  );
  const live = async () => (await t.run(ctx => ctx.db.get(foe)))!.live;
  const read = async () =>
    (
      await f.player.client.query(api.abilities.results, {
        campaignId: f.campaignId,
        eventIds: [used.eventId],
      })
    )[0]!;
  const active = async () =>
    (await live()).conditionInstances!.filter(instance => instance.status === 'active');
  expect(await active()).toMatchObject([{ condition: 'slowed', sourceUseEventId: used.eventId }]);
  const original = await live();
  const originalResult = await read();
  const condition = (result: typeof originalResult) =>
    (result.compiled as PublicCompiledResult).effects.find(o => o.effect.kind === 'condition')!;
  expect(condition(originalResult).effect).toMatchObject({ status: 'applied', threshold: 1 });
  expect(condition(originalResult).effect).not.toHaveProperty('targetScore');
  const correct = (edges: number, banes: number) =>
    command(
      `/ability correct event="${used.eventId}" target=@{foe:${foe}} edges=${edges} banes=${banes}`,
      true,
    );
  await correct(0, 2);
  expect(condition(await read()).effect).toMatchObject({ status: 'resisted', threshold: 0 });
  expect(await active()).toEqual([]);
  expect((await live()).conditions!.slowed).toBe(false);
  await correct(0, 0);
  expect(await active()).toMatchObject([{ condition: 'slowed' }]);
  await correct(2, 0);
  expect(await active()).toMatchObject([{ condition: 'restrained' }]);
  expect((await live()).conditions).toMatchObject({ slowed: false, restrained: true });
  const tierThree = await live();
  const scheduled = tierThree.conditionInstances!.find(instance => instance.status === 'active')!;
  const registration = (await t.run(ctx =>
    ctx.db.get(scheduled.registrationId as Id<'clockRegistrations'>),
  ))!;
  const rolls = await t.run(ctx => ctx.db.query('rolls').take(100));
  await command('/history undo', true);
  expect(await active()).toMatchObject([{ condition: 'slowed' }]);
  await command('/history redo', true);
  const restored = await live();
  // History recreates inserted rows with fresh physical IDs; occurrence identity is unchanged.
  const withoutRegistrationIds = (state: typeof tierThree) => ({
    ...state,
    conditionInstances: state.conditionInstances!.map(({ registrationId, ...instance }) => {
      void registrationId;
      return instance;
    }),
  });
  expect(withoutRegistrationIds(restored)).toEqual(withoutRegistrationIds(tierThree));
  const restoredInstance = restored.conditionInstances!.find(
    instance => instance.id === scheduled.id,
  )!;
  expect(restoredInstance.registrationId).toBeTruthy();
  const restoredRegistration = (await t.run(ctx =>
    ctx.db.get(restoredInstance.registrationId as Id<'clockRegistrations'>),
  ))!;
  expect(restoredRegistration).toMatchObject({
    status: 'active',
    timing: registration.timing,
    work: registration.work,
    source: registration.source,
    affectedIds: registration.affectedIds,
    encounterId: registration.encounterId,
  });
  expect(JSON.stringify(await t.run(ctx => ctx.db.query('rolls').take(100)))).toBe(
    JSON.stringify(rolls),
  );
  expect(tierThree.stamina).toBe(original.stamina - 2);
});

// V87-seeded V88 addendum. All definitions/targets come from the public seeded catalog.
// Stream positioning discloses accepted 4+4 / 6+6 / 8+8 dice; no gameplay row is fabricated.
const seededPotencyCases = [
  {
    name: 'Bola Knock',
    actor: 'lizardfolk/lizardfolk-bloodeye',
    weak: 'dwarf/dwarf-warden',
    strong: 'goblin/goblin-warrior',
    characteristic: 'A',
    weakScore: 0,
    strongScore: 2,
    damage: [5, 7, 9],
    type: undefined,
    thresholds: [0, 1, 2],
    conditions: ['restrained', 'restrained', 'restrained'],
    correctionTier: 2,
  },
  {
    name: 'Eye Flash',
    actor: 'hobgoblin/hobgoblin-redglare',
    weak: 'dwarf/dwarf-warden',
    strong: 'hobgoblin/hobgoblin-redglare',
    characteristic: 'P',
    weakScore: 0,
    strongScore: 3,
    damage: [9, 14, 17],
    type: 'corruption',
    thresholds: [1, 2, 3],
    conditions: ['slowed', 'restrained', 'restrained'],
    correctionTier: 2,
  },
  {
    name: 'Power Chord',
    actor: 'orc/orc-godcaller',
    weak: 'dwarf/dwarf-warden',
    strong: 'orc/orc-godcaller',
    characteristic: 'P',
    weakScore: 0,
    strongScore: 2,
    damage: [5, 7, 9],
    type: 'sonic',
    thresholds: [null, null, 2],
    conditions: [null, null, 'weakened'],
    correctionTier: 3,
  },
  {
    name: 'Razor Claws',
    actor: 'undead.1st-echelon/ghoul',
    weak: 'lizardfolk/lizardfolk-bloodeye',
    strong: 'dwarf/dwarf-warden',
    characteristic: 'M',
    weakScore: 1,
    strongScore: 2,
    damage: [3, 4, 5],
    type: undefined,
    thresholds: [null, null, 2],
    conditions: [null, null, 'bleeding'],
    correctionTier: 3,
  },
] as const;

test.each(seededPotencyCases)(
  '$name: seeded tiers, equality resistance, source instances and correction transitions',
  async spec => {
    const t = backend();
    const f = await table(t);
    await t.action(internal.content.reseed, {});
    const command = (text: string, player = false) =>
      (player ? f.player : f.director).client.mutation(api.commands.submit, {
        campaignId: f.campaignId,
        commandId: `seeded-potency-${++sequence}`,
        text,
      });
    const add = (source: string) => {
      const [family, name] = source.split('/');
      return f.director.client.mutation(api.foes.add, {
        campaignId: f.campaignId,
        definitionId: `mcdm.monsters.v1/monster.${family}.statblock/${name}`,
        commandId: `seeded-potency-${++sequence}`,
      });
    };
    const actor = await add(spec.actor);
    const weak = await add(spec.weak);
    const strong = await add(spec.strong);
    const actorRef = `@{foe:${actor}}`;
    const weakRef = `@{foe:${weak}}`;
    const sheet = await f.director.client.query(api.abilities.sheet, {
      campaignId: f.campaignId,
      actor: { kind: 'foe', id: actor, name: (await t.run(ctx => ctx.db.get(actor)))!.name },
    });
    expect(sheet.abilities.find(ability => ability.name === spec.name)).toMatchObject({
      fixedCost: null,
      targetShape: { kind: 'single' },
    });
    await command('/combat start');
    await command('/combat commit');
    await command('/combat roll', true);
    await command('/combat first side=heroes');
    await command('@Thorn /turn take', true);
    await command('@Thorn /turn end', true);
    await command(`${actorRef} /turn take`);
    await command('/adjust malice value=5');
    const live = async (foe = weak) => (await t.run(ctx => ctx.db.get(foe)))!.live;
    const read = async (event: Id<'events'>, client = f.director.client) =>
      (
        await client.query(api.abilities.results, { campaignId: f.campaignId, eventIds: [event] })
      )[0]!;
    const conditions = (compiled: PublicCompiledResult) =>
      compiled.effects.filter(occurrence => occurrence.effect.kind === 'condition');
    const active = async (foe = weak) =>
      (await live(foe)).conditionInstances?.filter(instance => instance.status === 'active') ?? [];
    const registrations = (foe: Id<'foes'>) =>
      t.run(async ctx =>
        (await ctx.db.query('clockRegistrations').take(100)).filter(
          registration =>
            registration.status === 'active' &&
            registration.work.kind === 'saving-throw' &&
            registration.work.creatureId === foe,
        ),
      );

    for (const [index, faces] of [
      [4, 4],
      [6, 6],
      [8, 8],
    ].entries()) {
      const before = await live();
      await position(t, f.campaignId, faces);
      const used = await command(
        `${actorRef} /ability use ability="${spec.name}" targets=[${weakRef}]`,
      );
      const result = await read(used.eventId);
      const compiled = result.compiled as PublicCompiledResult;
      const effects = conditions(compiled);
      expect(result.targets[0]!.outcome).toMatchObject({
        tier: index + 1,
        damage: { rolledDamage: spec.damage[index] },
      });
      expect(result.targets[0]!.outcome.damage?.damageType).toBe(spec.type);
      expect((await live()).stamina).toBe(before.stamina - spec.damage[index]!);
      expect((await t.run(ctx => ctx.db.get(f.campaignId)))!.malice).toBe(5);
      const threshold = spec.thresholds[index];
      if (threshold === null) {
        expect(effects).toHaveLength(0);
        expect(await active()).toEqual([]);
        expect(await registrations(weak)).toEqual([]);
      } else {
        expect(effects).toHaveLength(1);
        const occurrence = effects[0]!;
        const applies = spec.weakScore < threshold!;
        expect(occurrence.effect).toMatchObject({
          kind: 'condition',
          status: applies ? 'applied' : 'resisted',
          characteristic: spec.characteristic,
          threshold,
          targetScore: spec.weakScore,
          condition: spec.conditions[index],
          duration: 'save-ends',
        });
        for (const client of [f.player.client, f.observer.client]) {
          const publicOccurrence = conditions(
            (await read(used.eventId, client)).compiled as PublicCompiledResult,
          )[0]!;
          expect(publicOccurrence.effect).not.toHaveProperty('targetScore');
          expect(publicOccurrence.effect).toMatchObject({
            status: applies ? 'applied' : 'resisted',
            threshold,
          });
        }
        if (applies) {
          expect((await live()).conditions).toMatchObject({ [spec.conditions[index]!]: true });
          const instances = await active();
          expect(instances).toHaveLength(1);
          expect(instances[0]).toMatchObject({
            id: occurrence.id,
            sourceUseEventId: used.eventId,
            abilityName: spec.name,
            condition: spec.conditions[index],
            duration: 'save-ends',
            status: 'active',
          });
          const work = await registrations(weak);
          expect(work).toHaveLength(1);
          expect(work[0]).toMatchObject({
            _id: instances[0]!.registrationId,
            work: { kind: 'saving-throw', effectInstanceId: occurrence.id, creatureId: weak },
            timing: {
              scope: 'creature-turn',
              boundary: 'turn-end',
              creatureId: weak,
              occurrence: 'each',
            },
            source: { logEntryId: used.eventId },
          });
        } else {
          expect(await active()).toEqual([]);
          expect(await registrations(weak)).toEqual([]);
        }
      }

      if (index + 1 === spec.correctionTier) {
        const rollsBefore = await t.run(ctx => ctx.db.query('rolls').take(100));
        const originalOccurrence = effects[0]!;
        const originalRegistration = (await registrations(weak))[0]!;
        await command(`/ability correct event="${used.eventId}" target=${weakRef} edges=0 banes=2`);
        const corrected = await read(used.eventId);
        const correctionEffects = conditions(corrected.compiled as PublicCompiledResult);
        expect(corrected.targets[0]!.outcome).toMatchObject({
          tier: index,
          damage: { rolledDamage: spec.damage[index - 1] },
        });
        expect((await live()).stamina).toBe(before.stamina - spec.damage[index - 1]!);
        if (spec.name === 'Eye Flash') {
          expect(correctionEffects[0]!.effect).toMatchObject({
            status: 'applied',
            condition: 'slowed',
            threshold: 1,
          });
          expect(await active()).toMatchObject([{ condition: 'slowed' }]);
          expect((await live()).conditions).toMatchObject({ slowed: true, restrained: false });
        } else {
          if (spec.name === 'Bola Knock')
            expect(correctionEffects[0]!.effect).toMatchObject({
              status: 'resisted',
              threshold: 0,
            });
          else expect(correctionEffects).toHaveLength(0);
          expect(await active()).toEqual([]);
          expect(await registrations(weak)).toEqual([]);
        }
        expect((await t.run(ctx => ctx.db.get(originalRegistration._id)))!.status).toBe('retired');
        await command('/history rewind');
        const restored = conditions(
          (await read(used.eventId)).compiled as PublicCompiledResult,
        )[0]!;
        expect(restored).toEqual(originalOccurrence);
        const restoredRegistration = (await registrations(weak))[0]!;
        expect(restoredRegistration).toMatchObject({
          work: originalRegistration.work,
          timing: originalRegistration.timing,
          source: originalRegistration.source,
          affectedIds: originalRegistration.affectedIds,
        });
        expect((await active())[0]!.id).toBe(originalOccurrence.id);
        await command('/history redo');
        await command(`/ability correct event="${used.eventId}" target=${weakRef} edges=0 banes=0`);
        expect(
          conditions((await read(used.eventId)).compiled as PublicCompiledResult)[0]!.effect,
        ).toMatchObject({ status: 'applied', condition: spec.conditions[index] });
        expect(await active()).toHaveLength(1);
        expect(await registrations(weak)).toHaveLength(1);
        expect(await t.run(ctx => ctx.db.query('rolls').take(100))).toEqual(rollsBefore);
        expect((await t.run(ctx => ctx.db.get(f.campaignId)))!.malice).toBe(5);
      }
      for (const instance of await active())
        await command(`${weakRef} /condition off name=${instance.condition}`);
    }

    // Equality at the printed strongest threshold always resists; no instance or save work.
    await position(t, f.campaignId, [8, 8]);
    const strongBefore = await live(strong);
    const used = await command(
      `${actorRef} /ability use ability="${spec.name}" targets=[@{foe:${strong}}]`,
    );
    const resisted = conditions((await read(used.eventId)).compiled as PublicCompiledResult);
    expect(resisted).toHaveLength(1);
    expect(resisted[0]!.effect).toMatchObject({
      status: 'resisted',
      threshold: spec.strongScore,
      targetScore: spec.strongScore,
    });
    for (const client of [f.player.client, f.observer.client]) {
      const publicCompiled = (await read(used.eventId, client)).compiled as PublicCompiledResult;
      expect(publicCompiled).not.toHaveProperty('inputs');
      expect(conditions(publicCompiled)[0]!.effect).toMatchObject({
        status: 'resisted',
        threshold: spec.strongScore,
      });
      expect(conditions(publicCompiled)[0]!.effect).not.toHaveProperty('targetScore');
    }
    expect((await live(strong)).stamina).toBe(strongBefore.stamina - spec.damage[2]);
    expect(await active(strong)).toEqual([]);
    expect(await registrations(strong)).toEqual([]);
    expect((await t.run(ctx => ctx.db.get(f.campaignId)))!.malice).toBe(5);
  },
);
