// SPDX-License-Identifier: GPL-3.0-only
// Convex refuses a mutation that reads more than 16 MiB. Hero documents carry their evaluated
// build, about 180 KB for a level-3 Beastheart, so a command that reads a large party several times
// fails. This replays the beastheart-level-three journey's party (fourteen level-3 heroes and a
// target) under the enforced default limits through combat, a turn and closeout.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, internal } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation';
import { account, type Backend } from './fixtures/table';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { getDefinitions } from '../../shared/content/character-decisions';

const modules = import.meta.glob('../../convex/**/*.ts');
type Witness = {
  base: string;
  wildNature: string;
  levelTwo: { addedSelections: { perk: string; natureAbility: string } };
  levelThree: { addedSelections: { ability7: string } };
};
const levelThree = JSON.parse(
  readFileSync('tests/fixtures/v137-beastheart-three-expected.json', 'utf8'),
) as { witnesses: Record<string, Witness> };
const levelOne = JSON.parse(
  readFileSync('tests/fixtures/v106-beastheart-expected.json', 'utf8'),
) as {
  witnesses: { id: string; selections: EvaluationInput['selections'] }[];
};

test('a fifteen-hero party commits, takes a turn and closes out under the read limit', async () => {
  const t = convexTest({ schema, modules, transactionLimits: true });
  betterAuthTest.register(t);
  await t.action(internal.content.reseed, {});
  const director = await account(t as unknown as Backend, 'Dee');
  const campaignId = await director.client.mutation(api.campaigns.create, {
    commandId: 'party-campaign',
    name: 'Large party',
  });
  const create = async (name: string, level: number, selections: EvaluationInput['selections']) => {
    const characterId = await director.client.mutation(api.characters.create, {
      commandId: `create-${name}`,
      targetLevel: level,
      authored: { name, appearance: '', biography: '', notes: '' },
      selections: draftSelectionsFrom(selections, getDefinitions(level)),
    });
    await director.client.mutation(api.characters.submit, {
      commandId: `submit-${name}`,
      campaignId,
      characterId,
    });
    return characterId as Id<'characters'>;
  };
  const ids: Id<'characters'>[] = [];
  for (const [id, w] of Object.entries(levelThree.witnesses)) {
    const base = levelOne.witnesses.find(b => b.id === w.base)!;
    ids.push(
      await create(id, 3, {
        ...base.selections,
        'class.beastheart.level-2.perk': w.levelTwo.addedSelections.perk,
        [`class.beastheart.level-2.${w.wildNature.toLowerCase()}-ability`]:
          w.levelTwo.addedSelections.natureAbility,
        'class.beastheart.level-3.ability-7': w.levelThree.addedSelections.ability7,
      }),
    );
  }
  ids.push(await create('target-hero', 1, levelOne.witnesses[0]!.selections));
  expect(ids).toHaveLength(15);
  await director.client.mutation(api.sessions.start, {
    commandId: 'party-session',
    campaignId,
    selectedPlayerIds: [],
  });
  let sequence = 0;
  const invoke = (operation: string, args: Record<string, unknown> = {}, id?: string) =>
    director.client.mutation(api.commands.invoke, {
      campaignId,
      commandId: `party-op-${++sequence}`,
      operation,
      arguments: args,
      ...(id ? { actor: { refKind: 'character' as const, id } } : {}),
    });
  await invoke('combat.start');
  await invoke('combat.commit');
  await invoke('combat.first', { side: 'heroes' });
  await invoke('turn.take', {}, ids[0]);
  await invoke('turn.end', {}, ids[0]);
  await invoke('combat.end');
  await invoke('combat.victories', { amount: 1, recipients: ids });
  await invoke('combat.finish');
  const heroes = await t.run(async ctx => Promise.all(ids.map(id => ctx.db.get(id))));
  expect(heroes.every(hero => hero?.combatLocked === false)).toBe(true);
  expect(heroes.every(hero => hero?.liveState?.victories === 1)).toBe(true);
  // The Beastheart's encounter-end loss (feature/beastheart/level-1/ferocity.md) ran for each.
  expect(heroes.slice(0, 14).every(hero => hero?.liveState?.heroicResource.current === 0)).toBe(
    true,
  );
});
