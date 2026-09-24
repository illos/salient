// SPDX-License-Identifier: GPL-3.0-only
/**
 * V146 Talent clarity generation and strain through the shared public operations with persisted
 * readback. Pinned feature/talent/level-1/clarity-and-strain.md: + Victories at combat start, + 1d3
 * at each turn start, 1 damage per negative clarity at the end of each of the Talent's turns, and
 * clarity reset to 0 at the end of the encounter.
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
  JSON.parse(readFileSync('tests/fixtures/v105-talent-expected.json', 'utf8')) as {
    witnesses: { selections: EvaluationInput['selections'] }[];
  }
).witnesses[0]!;
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: {
    stamina: number;
    temporaryStamina: number;
    heroicResource: { name: string; current: number };
  };
};
type Event = {
  kind: string;
  dice?: { sides: number; value: number }[];
  payload?: { data?: { step?: string; damage?: number } };
};

export async function runHeroicResourceTalent({
  actors: { director },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'V146 Talent clarity: combat start, turn start, strain damage and reset persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Clarity ${runId}`,
      });
      const hero = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Seer ${runId}`, appearance: '', biography: '', notes: '' },
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
      const clarity = async () => (await get()).liveState.heroicResource.current;
      const clock = async (step: string) =>
        (await director.query<{ events: Event[] }>('events:list', { campaignId })).events.find(
          e => e.kind === 'clock.heroic-resource' && e.payload?.data?.step === step,
        );
      try {
        await invoke('adjust.victories', { value: 1 }, true);
        await invoke('combat.start');
        await invoke('combat.commit');
        assert.equal(await clarity(), 1, 'combat start: + Victories (1)');
        await invoke('combat.first', { side: 'heroes' });
        await invoke('turn.take', {}, true);
        const die = (await clock('turn-start-gain'))!.dice![0]!;
        assert.equal(die.sides, 3);
        assert.equal(await clarity(), 1 + die.value, 'turn start: + 1d3');
        await invoke('adjust.heroic-resource', { value: -2 }, true);
        await invoke('adjust.temporary-stamina', { value: 0 }, true);
        const before = (await get()).liveState.stamina;
        await invoke('turn.end', {}, true);
        assert.equal((await clock('turn-end-strain'))!.payload?.data?.damage, 2);
        assert.equal((await get()).liveState.stamina, before - 2, 'strain: 1 damage per negative');
        await invoke('combat.end');
        await invoke('combat.victories', { amount: 0, recipients: [] });
        await invoke('combat.finish');
        assert.equal(await clarity(), 0, 'encounter end: negative clarity reset');
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
