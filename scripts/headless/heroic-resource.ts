// SPDX-License-Identifier: GPL-3.0-only
/**
 * V120 heroic-resource generation for the Shadow through the shared public operations, with real
 * campaign dice and persisted readback. Expected values come from pinned
 * feature/shadow/level-1/insight.md: + Victories at combat start, + 1d3 at each turn start, + 1 the
 * first time each round for damage with surges (claimed by the table), all lost at encounter end.
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

const firstWitness = (path: string) =>
  (
    JSON.parse(readFileSync(path, 'utf8')) as {
      witnesses: { selections: EvaluationInput['selections'] }[];
    }
  ).witnesses[0]!;
const witness = firstWitness('tests/fixtures/v92-shadow-expected.json');
const tacticianWitness = firstWitness('tests/fixtures/v94-tactician-expected.json');
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: {
    heroicResource: { name: string; current: number };
    resourceClaims?: { triggerId: string }[];
  };
};
type Event = {
  id: string;
  kind: string;
  disposition?: string;
  dice?: { sides: number; value: number }[];
  payload?: { data?: { step?: string; before?: number; after?: number } };
};

export async function runHeroicResource({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    'V120 Shadow insight: combat start, turn start, claim and encounter end persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Resource ${runId}`,
      });
      const shadow = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Shade ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(structuredClone(witness.selections), definitions),
      });
      const get = () => director.query<Saved>('characters:get', { characterId: shadow });
      assert.equal((await get()).evaluation.status, 'complete');
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: shadow,
      });
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: cid(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (operation: string, args: Record<string, unknown> = {}, hero = false) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          commandId: cid(),
          campaignId,
          operation,
          arguments: args,
          ...(hero ? { actor: { refKind: 'character', id: shadow } } : {}),
        });
      const insight = async () => (await get()).liveState.heroicResource.current;
      const clock = async () =>
        (await director.query<{ events: Event[] }>('events:list', { campaignId })).events
          .filter(e => e.kind === 'clock.heroic-resource' && e.disposition !== 'undone')
          .reverse();
      try {
        await invoke('adjust.victories', { value: 2 }, true);
        assert.equal(await insight(), 0);
        await invoke('combat.start');
        await invoke('combat.commit');
        assert.equal(await insight(), 2, 'combat start: + Victories (2)');

        await invoke('combat.first', { side: 'heroes' });
        await invoke('turn.take', {}, true);
        const turn = (await clock()).find(e => e.payload?.data?.step === 'turn-start-gain')!;
        const die = turn.dice![0]!;
        assert.equal(die.sides, 3);
        assert.ok(die.value >= 1 && die.value <= 3);
        assert.equal(await insight(), 2 + die.value, 'turn start: + 1d3');

        await invoke('resource.claim', { trigger: 'shadow-surge-damage' }, true);
        assert.equal(await insight(), 3 + die.value, 'claimed trigger: + 1');
        await assert.rejects(
          invoke('resource.claim', { trigger: 'shadow-surge-damage' }, true),
          /already claimed/,
        );

        await invoke('combat.end');
        await invoke('combat.victories', { amount: 0, recipients: [] });
        await invoke('combat.finish');
        assert.equal(await insight(), 0, 'encounter end: all insight lost');
        assert.deepEqual((await get()).liveState.resourceClaims, []);
        assert.deepEqual(
          (await clock()).map(e => e.payload?.data?.step),
          ['combat-start-grant', 'turn-start-gain', 'encounter-end-loss'],
        );
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

  // V140, pinned feature/tactician/level-1/focus.md: + Victories at combat start, + 2 at each turn
  // start, + 1 for each of two separate per-round claims, all lost at encounter end.
  await run(
    'V140 Tactician focus: combat start, turn start, two claims and encounter end persist',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Focus ${runId}`,
      });
      const hero = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Planner ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(structuredClone(tacticianWitness.selections), definitions),
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
      const focus = async () => (await get()).liveState.heroicResource.current;
      try {
        await invoke('adjust.victories', { value: 1 }, true);
        await invoke('combat.start');
        await invoke('combat.commit');
        assert.equal(await focus(), 1, 'combat start: + Victories (1)');
        await invoke('combat.first', { side: 'heroes' });
        await invoke('turn.take', {}, true);
        assert.equal(await focus(), 3, 'turn start: + 2');
        await invoke('resource.claim', { trigger: 'tactician-marked-damage' }, true);
        await invoke('resource.claim', { trigger: 'tactician-ally-heroic' }, true);
        assert.equal(await focus(), 5, 'two separate claims: + 1 each');
        await assert.rejects(
          invoke('resource.claim', { trigger: 'tactician-ally-heroic' }, true),
          /already claimed/,
        );
        await invoke('combat.end');
        await invoke('combat.victories', { amount: 0, recipients: [] });
        await invoke('combat.finish');
        assert.equal(await focus(), 0, 'encounter end: all focus lost');
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
