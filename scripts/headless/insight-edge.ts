// SPDX-License-Identifier: GPL-3.0-only
/**
 * V156 Shadow Insight edge discount through the shared public operations, in a committed encounter
 * (so the outside-combat waiver does not apply), with real campaign dice and persisted readback.
 * pinned feature/shadow/level-1/insight.md: a heroic ability with a power roll "costs 1 fewer
 * insight if you have an edge or double edge on it"; rule/dice/power-roll.md: edges and banes
 * cancel first. Expected values come from tests/fixtures/v156-insight-edge-expected.json.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { AbilityRollResult } from '../../shared/contracts/rollResolution.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type SourceLedger from '../../tests/fixtures/v156-insight-edge-expected.json';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as unknown;
const ledger = read('tests/fixtures/v156-insight-edge-expected.json') as typeof SourceLedger;
type Witness = { id: string; selections: EvaluationInput['selections'] };
const shadowWitness = (read(ledger.shadow.base) as { witnesses: Witness[] }).witnesses.find(
  w => w.id === ledger.shadow.witness,
)!;
const targetWitness = (read(ledger.target.base) as { target: Witness }).target;
const foe = (read(ledger.foe.base) as { foe: { definition: string } }).foe;
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: { stamina: number; heroicResource: { current: number } };
};
type Event = {
  id: string;
  kind: string;
  dice?: unknown[];
  payload?: {
    data?: {
      result?: AbilityRollResult;
      targets?: { edges: number; banes: number }[];
      allowance?: { inCombat: boolean };
      blocked?: { cost: { resource: string; amount: number }; poolBefore: number };
    };
  };
};

export async function runInsightEdge({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    'V156 Shadow insight: an edged power-roll heroic ability costs 1 fewer in combat',
    async () => {
      assert.ok(shadowWitness, `${ledger.shadow.witness} in ${ledger.shadow.base}`);
      assert.equal(targetWitness.id, ledger.target.witness);
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Insight edge ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const admit = async (name: string, witness: Witness) => {
        const id = await director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: 1,
          authored: { name: `${name} ${runId}`, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(structuredClone(witness.selections), definitions),
        });
        assert.equal((await get(id)).evaluation.status, 'complete', `${name} legal build`);
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        return id;
      };
      const shadow = await admit('Insight Shade', shadowWitness);
      const target = await admit('Insight Target', targetWitness);
      const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: shadow });
      assert.deepEqual(
        sheet.abilities.find(a => a.name === ledger.ability.name)?.cost,
        { resource: ledger.ability.resource, amount: ledger.ability.cost },
        `${ledger.ability.name} printed cost`,
      );
      await director.mutation<string>('foes:add', {
        commandId: cid(),
        campaignId,
        definitionId: foe.definition,
      });
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: cid(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (operation: string, args: Record<string, unknown> = {}, actorId?: string) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          commandId: cid(),
          campaignId,
          operation,
          arguments: args,
          ...(actorId ? { actor: { refKind: 'character', id: actorId } } : {}),
        });
      const events = async () =>
        (await director.query<{ events: Event[] }>('events:list', { campaignId })).events;
      const insight = async () => (await get(shadow)).liveState.heroicResource.current;
      try {
        await invoke('combat.start');
        await invoke('combat.commit');
        for (const step of ledger.steps) {
          const label = `${ledger.ability.name} ${step.id}`;
          await invoke('adjust.heroic-resource', { value: step.pool }, shadow);
          await invoke('adjust.stamina', { value: ledger.target.stamina }, target);
          assert.equal(await insight(), step.pool, `${label} pool set`);
          const usesBefore = (await events()).filter(e => e.kind === 'ability.use').length;
          const used = await invoke(
            'ability.use',
            {
              ability: ledger.ability.name,
              targets: [{ refKind: 'character', id: target }],
              edges: [step.edges],
              banes: [step.banes],
            },
            shadow,
          );
          const all = await events();
          const persisted = all.find(e => e.id === used.eventId);
          assert.ok(persisted, `${label} event persisted`);
          const results = await director.query<unknown[]>('abilities:results', {
            campaignId,
            eventIds: [used.eventId],
          });
          if (step.outcome === 'blocked') {
            assert.equal(persisted.kind, 'ability.blocked', `${label} blocked`);
            assert.ok(!persisted.dice?.length, `${label} no dice rolled`);
            assert.equal(persisted.payload?.data?.result, undefined, `${label} no roll result`);
            assert.deepEqual(persisted.payload?.data?.blocked?.cost, {
              resource: ledger.ability.resource,
              amount: step.amount,
            });
            assert.equal(persisted.payload?.data?.blocked?.poolBefore, step.pool);
            assert.equal(results.length, 0, `${label} no ability result`);
            assert.equal(
              all.filter(e => e.kind === 'ability.use').length,
              usesBefore,
              `${label} no use recorded`,
            );
          } else {
            assert.equal(persisted.kind, 'ability.use', `${label} used`);
            assert.equal(persisted.payload?.data?.allowance?.inCombat, true, `${label} in combat`);
            const given = persisted.payload?.data?.targets?.[0];
            assert.equal(given?.edges, step.edges, `${label} edges persisted`);
            assert.equal(given?.banes, step.banes, `${label} banes persisted`);
            const result = persisted.payload?.data?.result;
            assert.ok(result, `${label} roll result`);
            assert.equal(result.targets[0]!.edgeBane.net, step.net, `${label} net edge`);
            assert.deepEqual(
              result.cost,
              {
                resource: ledger.ability.resource,
                amount: step.amount,
                waived: false,
                before: step.pool,
                after: step.after,
              },
              `${label} cost application`,
            );
            assert.equal(results.length, 1, `${label} ability result`);
          }
          assert.equal(await insight(), step.after, `${label} insight after`);
        }
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
