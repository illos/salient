// SPDX-License-Identifier: GPL-3.0-only
/**
 * V145 Censor wrath generation through the shared public operations with persisted readback.
 * Pinned feature/censor/level-1/wrath.md: + Victories at combat start, + 2 at each turn start,
 * + 1 for each of two per-round judged-damage claims, all lost at encounter end.
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
  JSON.parse(readFileSync('tests/fixtures/v99-censor-expected.json', 'utf8')) as {
    witnesses: { selections: EvaluationInput['selections'] }[];
  }
).witnesses[0]!;
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: { heroicResource: { name: string; current: number } };
};

export async function runHeroicResourceCensor({
  actors: { director },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'V145 Censor wrath: combat start, turn start, two claims and encounter end persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Wrath ${runId}`,
      });
      const hero = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Warden ${runId}`, appearance: '', biography: '', notes: '' },
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
      const wrath = async () => (await get()).liveState.heroicResource.current;
      try {
        await invoke('adjust.victories', { value: 2 }, true);
        await invoke('combat.start');
        await invoke('combat.commit');
        assert.equal(await wrath(), 2, 'combat start: + Victories (2)');
        await invoke('combat.first', { side: 'heroes' });
        await invoke('turn.take', {}, true);
        assert.equal(await wrath(), 4, 'turn start: + 2');
        await invoke('resource.claim', { trigger: 'censor-judged-damaged-you' }, true);
        await invoke('resource.claim', { trigger: 'censor-damaged-judged' }, true);
        assert.equal(await wrath(), 6, 'two separate claims: + 1 each');
        await assert.rejects(
          invoke('resource.claim', { trigger: 'censor-damaged-judged' }, true),
          /already claimed/,
        );
        await invoke('combat.end');
        await invoke('combat.victories', { amount: 0, recipients: [] });
        await invoke('combat.finish');
        assert.equal(await wrath(), 0, 'encounter end: all wrath lost');
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
