// SPDX-License-Identifier: GPL-3.0-only
/**
 * V143 Beastheart ferocity generation through the shared public operations with persisted readback.
 * Pinned feature/beastheart/level-1/ferocity.md: + Victories at combat start, + 1d3 at each turn
 * start, + 2 the first time each round a creature adjacent to the companion takes damage (claimed),
 * all lost at encounter end.
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
  JSON.parse(readFileSync('tests/fixtures/v106-beastheart-expected.json', 'utf8')) as {
    witnesses: { selections: EvaluationInput['selections'] }[];
  }
).witnesses[0]!;
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: { heroicResource: { name: string; current: number } };
};
type Event = {
  kind: string;
  disposition?: string;
  dice?: { sides: number; value: number }[];
  payload?: { data?: { step?: string } };
};

export async function runHeroicResourceBeastheart({
  actors: { director },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'V143 Beastheart ferocity: combat start, turn start, claim and encounter end persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Ferocity ${runId}`,
      });
      const hero = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Packmate ${runId}`, appearance: '', biography: '', notes: '' },
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
      const ferocity = async () => (await get()).liveState.heroicResource.current;
      try {
        await invoke('adjust.victories', { value: 1 }, true);
        await invoke('combat.start');
        await invoke('combat.commit');
        assert.equal(await ferocity(), 1, 'combat start: + Victories (1)');
        await invoke('combat.first', { side: 'heroes' });
        await invoke('turn.take', {}, true);
        const gain = (
          await director.query<{ events: Event[] }>('events:list', { campaignId })
        ).events.find(
          e => e.kind === 'clock.heroic-resource' && e.payload?.data?.step === 'turn-start-gain',
        )!;
        const die = gain.dice![0]!;
        assert.equal(die.sides, 3);
        assert.equal(await ferocity(), 1 + die.value, 'turn start: + 1d3');
        await invoke('resource.claim', { trigger: 'beastheart-companion-adjacent-damage' }, true);
        assert.equal(await ferocity(), 3 + die.value, 'claimed trigger: + 2');
        await assert.rejects(
          invoke('resource.claim', { trigger: 'beastheart-companion-adjacent-damage' }, true),
          /already claimed/,
        );
        await invoke('combat.end');
        await invoke('combat.victories', { amount: 0, recipients: [] });
        await invoke('combat.finish');
        assert.equal(await ferocity(), 0, 'encounter end: all ferocity lost');
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
