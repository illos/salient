// SPDX-License-Identifier: GPL-3.0-only
/**
 * V141 Summoner essence generation through the shared public operations with persisted readback.
 * Pinned feature/summoner/level-1/essence.md: + Victories at combat start, + 2 at each turn start,
 * + 1 the first time each round a minion dies unwillingly in range (claimed), lost at encounter end.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';

const witness = (
  JSON.parse(readFileSync('tests/fixtures/v107-summoner-expected.json', 'utf8')) as {
    witnesses: { selections: EvaluationInput['selections'] }[];
  }
).witnesses[0]!;
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: { heroicResource: { name: string; current: number } };
};

export async function runHeroicResourceSummoner({
  actors: { director },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'V141 Summoner essence: combat start, turn start, claim and encounter end persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Essence ${runId}`,
      });
      const hero = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Caller ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(structuredClone(witness.selections), definitions),
      });
      const get = () => director.query<Saved>('characters:get', { characterId: hero });
      assert.equal((await get()).evaluation.status, 'complete');
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: hero,
      });
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: cid(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (operation: string, args: Record<string, unknown> = {}, acting = false) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          commandId: cid(),
          campaignId,
          operation,
          arguments: args,
          ...(acting ? { actor: { refKind: 'character', id: hero } } : {}),
        });
      const essence = async () => (await get()).liveState.heroicResource.current;
      try {
        await invoke('adjust.victories', { value: 2 }, true);
        await invoke('combat.start');
        await invoke('combat.commit');
        assert.equal(await essence(), 2, 'combat start: + Victories (2)');
        await invoke('combat.first', { side: 'heroes' });
        await invoke('turn.take', {}, true);
        assert.equal(await essence(), 4, 'turn start: + 2');
        await invoke('resource.claim', { trigger: 'summoner-minion-death' }, true);
        assert.equal(await essence(), 5, 'claimed minion death: + 1');
        await assert.rejects(
          invoke('resource.claim', { trigger: 'summoner-minion-death' }, true),
          /already claimed/,
        );
        await invoke('combat.end');
        await invoke('combat.victories', { amount: 0, recipients: [] });
        await invoke('combat.finish');
        assert.equal(await essence(), 0, 'encounter end: all essence lost');
      } finally {
        const session = await director.query<{ revision: number; status: string }>('sessions:get', {
          sessionId,
        });
        if (session.status !== 'closed')
          await director.mutation('sessions:transition', {
            commandId: cid(),
            sessionId,
            expectedRevision: session.revision,
            action: 'close',
            voidMode: 'keep',
          });
      }
    },
  );
}
