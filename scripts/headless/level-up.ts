// SPDX-License-Identifier: GPL-3.0-only
/**
 * V163 level-up for all eleven classes through authenticated public operations: admit a level-one
 * hero, grant two level-ups with the Director's shared operation, take them one level at a time and
 * read the persisted build back (docs/character-wizard-spec.md#level-up).
 */
import assert from 'node:assert/strict';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type {
  EvaluationResult,
  SelectionValue,
} from '../../shared/contracts/characterEvaluation.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import { getDefinitions } from '../../shared/content/character-decisions.ts';
import { levelThreeBuilds } from '../../tests/fixtures/level-three-builds.ts';

type Selections = Record<string, SelectionValue>;
type Saved = {
  level: number;
  revision: number;
  pendingLevelUps?: number;
  evaluation: EvaluationResult;
  liveState: { stamina: number; recoveries: number } | null;
};
type Progression = {
  revision: number;
  baseRevisionId: string | null;
  fromLevel: number;
  targetLevel: number;
  pendingLevelUps: number;
  eligible: boolean;
  reason: string | null;
  newDecisionIds: string[];
  draft: { version: number } | null;
};
const cid = () => crypto.randomUUID();
const ids = (level: number) =>
  new Set(getDefinitions(level).steps.flatMap(step => step.decisions.map(d => d.id)));
const only = (selections: Selections, keep: Set<string>) =>
  Object.fromEntries(Object.entries(selections).filter(([id]) => keep.has(id)));

export async function runLevelUp({ actors: { director, player }, run, runId }: ScenarioContext) {
  await run(
    'Level-up: eleven classes take two granted level-ups, one level at a time',
    async () => {
      const definitions = new Map<number, DecisionDefinitions>();
      for (const level of [1, 2, 3])
        definitions.set(
          level,
          (
            await director.query<{ definitions: DecisionDefinitions }>('characterWizard:discover', {
              targetLevel: level,
            })
          ).definitions,
        );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Level-up ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const invoke = (operation: string, args: Record<string, unknown>) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation,
          arguments: args,
        });
      const heroes: { build: ReturnType<typeof levelThreeBuilds>[number]; id: string }[] = [];
      for (const build of levelThreeBuilds()) {
        const one = only(build.selections, ids(1));
        const id = await director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: 1,
          authored: {
            name: `${build.className} ${runId}`,
            appearance: '',
            biography: '',
            notes: '',
          },
          selections: draftSelectionsFrom(one, definitions.get(1)!),
        });
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        const admitted = await get(id);
        assert.equal(admitted.level, 1, build.className);
        heroes.push({ build, id });
      }

      // Level-up happens only on a pending grant: nobody is eligible yet.
      const progression = (characterId: string) =>
        director.query<Progression>('characters:progression', { characterId });
      const before = await progression(heroes[0]!.id);
      assert.equal(before.eligible, false);
      assert.match(before.reason ?? '', /No level-up is pending/);
      await assert.rejects(
        player.mutation('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation: 'character.grant-level-up',
          arguments: {},
        }),
      );
      // Two grants to the whole party (the default), persisted per hero.
      for (let i = 0; i < 2; i++) await invoke('character.grant-level-up', {});
      for (const { id } of heroes) assert.equal((await get(id)).pendingLevelUps, 2);

      for (const { build, id } of heroes) {
        let taken = { ...only(build.selections, ids(1)) };
        for (const level of [2, 3]) {
          const p = await progression(id);
          assert.equal(p.eligible, true, `${build.className} ${p.reason}`);
          assert.equal(p.fromLevel, level - 1);
          assert.equal(p.targetLevel, level);
          const added = only(build.selections, new Set(p.newDecisionIds));
          taken = { ...taken, ...added };
          const selections: DraftSelection[] = draftSelectionsFrom(
            added,
            definitions.get(level)!,
          ).filter(s => p.newDecisionIds.includes(s.decisionId));
          const base = {
            characterId: id,
            expectedRevision: p.revision,
            expectedBaseRevisionId: p.baseRevisionId!,
          };
          const version = await director.mutation<number>('characters:saveAdvancement', {
            ...base,
            commandId: cid(),
            expectedDraftVersion: p.draft?.version ?? 0,
            selections,
          });
          await director.mutation('characters:finalizeAdvancement', {
            ...base,
            commandId: cid(),
            expectedDraftVersion: version,
          });
          const saved = await get(id);
          assert.equal(saved.level, level, build.className);
          assert.equal(saved.evaluation.status, 'complete', build.className);
          assert.equal(saved.pendingLevelUps, 3 - level, `${build.className} pending`);
        }
        const saved = await get(id);
        const maximum = saved.evaluation.baseline!.staminaMaximum.value;
        // Class ledger value at level 3; a hero admitted at full stays full (Q-CHAR-2 revised).
        assert.equal(maximum, build.staminaMaximum, build.className);
        assert.equal(saved.liveState?.stamina, maximum, `${build.className} current Stamina`);
        const done = await progression(id);
        assert.equal(done.eligible, false);
        assert.equal(done.pendingLevelUps, 0);
      }
    },
  );
}
