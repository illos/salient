// SPDX-License-Identifier: GPL-3.0-only
/**
 * V157 abilities without a power roll through the registered operations. Expected values come
 * from the pinned Compendium (en/unified/md):
 * - feature/ability/fury/level-3/steelbreaker.md: 7 Ferocity, Self, "You gain 20 temporary Stamina."
 * - feature/ability/conduit/level-3/saints-raiment.md: 7 Piety, One ally, "The target gains 20
 *   temporary Stamina and 3 surges."
 * - feature/ability/tactician/level-1/now.md: 5 Focus, Three allies, "Each target can make a free
 *   strike."
 * - rule/health/temporary-stamina.md: a new grant gives "whichever amount of temporary Stamina is
 *   greater"; rule/resource/surge.md: surges are gained and kept track of (they add).
 * Builds reuse reviewed witnesses (tests/fixtures/v101, v114, v100, v134, v94) unchanged.
 */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { account, backend } from './fixtures/table';

type Selections = EvaluationInput['selections'];
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const furyOne = json('tests/fixtures/v101-fury-expected.json') as {
  witnesses: { id: string; selections: Selections }[];
};
const furyThree = json('tests/fixtures/v114-fury-three-expected.json') as {
  witnesses: {
    id: string;
    subclass: string;
    levelTwo: { addedSelections: Record<string, string> };
    levelThree: { addedSelections: Record<string, string> };
  }[];
};
const conduitOne = json('tests/fixtures/v100-conduit-expected.json') as {
  witnesses: { id: string; selections: Selections }[];
};
const conduitThree = json('tests/fixtures/v134-conduit-three-expected.json') as {
  witnesses: Record<
    string,
    {
      base: string;
      levelTwo: { addedSelections: Record<string, string>; secondDomain: string };
      levelThree: { addedSelections: { ability7: string } };
    }
  >;
};
const tactician = json('tests/fixtures/v94-tactician-expected.json') as {
  witnesses: { id: string; selections: Selections }[];
};

function furySelections(): Selections {
  const w = furyThree.witnesses.find(
    x => x.levelThree.addedSelections['class.fury.level-3.7-ferocity-ability'] === 'Steelbreaker',
  )!;
  const decision = {
    Berserker: 'class.fury.level-2.aspect-ability',
    Reaver: 'class.fury.level-2.reaver-ability',
    Stormwight: 'class.fury.level-2.stormwight-ability',
  }[w.subclass]!;
  return {
    ...furyOne.witnesses.find(b => b.id === w.id)!.selections,
    'class.fury.level-2.perk': w.levelTwo.addedSelections['class.fury.level-2.perk']!,
    [decision]: w.levelTwo.addedSelections['class.fury.level-2.aspect-ability']!,
    'class.fury.level-3.ability-7': 'Steelbreaker',
  };
}
function conduitSelections(): Selections {
  const w = Object.values(conduitThree.witnesses).find(
    x => x.levelThree.addedSelections.ability7 === "Saint's Raiment",
  )!;
  const two = w.levelTwo.addedSelections;
  return {
    ...conduitOne.witnesses.find(b => b.id === w.base)!.selections,
    'class.conduit.level-2.perk': two.perk!,
    'class.conduit.level-2.domain-ability': two.domainAbilityDomain!,
    [`class.conduit.level-2.domain-skill.${w.levelTwo.secondDomain.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`]:
      two.secondDomainSkill!,
    'class.conduit.level-3.ability-7': "Saint's Raiment",
  };
}

test('V157: gains apply and persist, rewind and redo restore them, and there is no roll to correct', async () => {
  const t = backend();
  await t.action(internal.content.reseed, {});
  const director = await account(t, 'Dee');
  const campaignId = await director.client.mutation(api.campaigns.create, {
    commandId: 'effect-only-campaign',
    name: 'Effect only',
  });
  let sequence = 0;
  const create = async (name: string, level: number, selections: Selections) => {
    const characterId = (await director.client.mutation(api.characters.create, {
      commandId: `create-${name}`,
      targetLevel: level,
      authored: { name, appearance: '', biography: '', notes: '' },
      selections: draftSelectionsFrom(selections, getDefinitions(level)),
    })) as Id<'characters'>;
    await director.client.mutation(api.characters.submit, {
      commandId: `submit-${name}`,
      campaignId,
      characterId,
    });
    return characterId;
  };
  const fury = await create('Fury', 3, furySelections());
  const conduit = await create('Conduit', 3, conduitSelections());
  const tact = await create(
    'Tactician',
    1,
    tactician.witnesses.find(w => w.selections['class.tactician.ability-5'] === 'Now!')!.selections,
  );
  await director.client.mutation(api.sessions.start, {
    commandId: 'effect-only-session',
    campaignId,
    selectedPlayerIds: [],
  });
  const invoke = (operation: string, args: Record<string, unknown> = {}, id?: string) =>
    director.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: `effect-only-${++sequence}`,
      operation,
      arguments: args,
      ...(id ? { actor: { refKind: 'character' as const, id } } : {}),
    });
  const ref = (id: string) => ({ refKind: 'character', id });
  const live = async (id: Id<'characters'>) => (await t.run(ctx => ctx.db.get(id)))!.liveState!;
  const read = async (eventId: Id<'events'>) =>
    (await director.client.query(api.abilities.results, { campaignId, eventIds: [eventId] }))[0];
  const kindOf = async (eventId: Id<'events'>) => (await t.run(ctx => ctx.db.get(eventId)))!.kind;

  await invoke('combat.start');
  await invoke('combat.commit');
  await invoke('combat.first', { side: 'heroes' });
  await invoke('turn.take', {}, fury);

  // Steelbreaker: 7 Ferocity paid, temporary Stamina 0 → 20.
  await invoke('adjust.heroic-resource', { value: 7 }, fury);
  const before = await live(fury);
  expect(before.temporaryStamina).toBe(0);
  const steel = await invoke('ability.use', { ability: 'Steelbreaker' }, fury);
  expect(await kindOf(steel.eventId)).toBe('ability.use');
  const afterSteel = await live(fury);
  expect(afterSteel.heroicResource.current).toBe(0);
  expect(afterSteel.temporaryStamina).toBe(20);
  expect(afterSteel.stamina).toBe(before.stamina);
  const steelResult = (await read(steel.eventId))!;
  expect(steelResult.effectOnly).toBe(true);
  expect(steelResult.dice).toBeUndefined();
  const steelEffects = (steelResult.compiled as PublicCompiledResult).effects;
  expect(steelEffects.map(o => o.effect)).toMatchObject([
    { kind: 'gain', status: 'applied', targetId: fury, temporaryStamina: 20 },
  ]);
  const uses = await t.run(ctx =>
    ctx.db
      .query('actionUses')
      .collect()
      .then(rows => rows.filter(r => r.eventId === steel.eventId)),
  );
  expect(uses.map(u => [u.actionType, u.label])).toEqual([['maneuver', 'Steelbreaker']]);

  // No roll to correct.
  await expect(
    invoke('ability.correct', { event: steel.eventId, target: ref(fury), edges: 1, banes: 0 }),
  ).rejects.toThrow(/no roll to correct/);
  // An applied gain is not table work.
  await expect(
    invoke('ability.resolved', { event: steel.eventId, occurrence: steelEffects[0]!.id }),
  ).rejects.toThrow(/applied gain/);

  // With 25 temporary Stamina already, the greater amount (25) stays.
  await invoke('adjust.temporary-stamina', { value: 25 }, fury);
  await invoke('adjust.heroic-resource', { value: 7 }, fury);
  await invoke('ability.use', { ability: 'Steelbreaker' }, fury);
  expect((await live(fury)).temporaryStamina).toBe(25);
  expect((await live(fury)).heroicResource.current).toBe(0);

  // Saint's Raiment on the Fury: surges +3, temporary Stamina to the greater of 20 and current.
  await invoke('adjust.temporary-stamina', { value: 0 }, fury);
  await invoke('adjust.surges', { value: 1 }, fury);
  await invoke('adjust.heroic-resource', { value: 7 }, conduit);
  // "One ally": the Conduit isn't an eligible target (rule/combat/target.md); nothing is paid.
  await expect(
    invoke('ability.use', { ability: "Saint's Raiment", targets: [{ selector: 'self' }] }, conduit),
  ).rejects.toThrow(/not the user/);
  expect((await live(conduit)).heroicResource.current).toBe(7);
  const raiment = await invoke(
    'ability.use',
    { ability: "Saint's Raiment", targets: [ref(fury)] },
    conduit,
  );
  const gained = await live(fury);
  expect([gained.temporaryStamina, gained.surges]).toEqual([20, 4]);
  expect((await live(conduit)).heroicResource.current).toBe(0);
  expect(((await read(raiment.eventId))!.compiled as PublicCompiledResult).effects).toMatchObject([
    {
      effect: {
        kind: 'gain',
        status: 'applied',
        targetId: fury,
        temporaryStamina: 20,
        surges: 3,
        application: {
          temporaryStaminaBefore: 0,
          temporaryStaminaAfter: 20,
          surgesBefore: 1,
          surgesAfter: 4,
        },
      },
    },
  ]);
  // Rewind the Raiment: both gains and the Piety return; redo reapplies them.
  await invoke('history.undo');
  const undone = await live(fury);
  expect([undone.temporaryStamina, undone.surges]).toEqual([0, 1]);
  expect((await live(conduit)).heroicResource.current).toBe(7);
  expect(await read(raiment.eventId)).toBeUndefined();
  await invoke('history.redo');
  const redone = await live(fury);
  expect([redone.temporaryStamina, redone.surges]).toEqual([20, 4]);
  expect((await live(conduit)).heroicResource.current).toBe(0);

  // Now!: one free-strike instruction per ally, no state change; a disposition reads back.
  await invoke('adjust.heroic-resource', { value: 5 }, tact);
  const allies = [fury, conduit];
  const alliesBefore = await Promise.all(allies.map(live));
  const now = await invoke('ability.use', { ability: 'Now!', targets: allies.map(ref) }, tact);
  expect((await live(tact)).heroicResource.current).toBe(0);
  expect(await Promise.all(allies.map(live))).toEqual(alliesBefore);
  const nowEffects = ((await read(now.eventId))!.compiled as PublicCompiledResult).effects;
  expect(nowEffects.map(o => [o.effect.kind, o.effect.targetId, o.effect.status])).toEqual([
    ['rider', fury, 'manual'],
    ['rider', conduit, 'manual'],
  ]);
  expect(nowEffects[0]!.effect.clause).toBe('Each target can make a free strike.');
  await invoke('ability.resolved', {
    event: now.eventId,
    occurrence: nowEffects[1]!.id,
    note: 'Conduit made a free strike',
  });
  const disposed = ((await read(now.eventId))!.compiled as PublicCompiledResult).effects;
  expect(disposed.map(o => o.disposition?.note)).toEqual([undefined, 'Conduit made a free strike']);
  expect(await Promise.all(allies.map(live))).toEqual(alliesBefore);
});
