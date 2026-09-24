// SPDX-License-Identifier: GPL-3.0-only
/**
 * V152 widened Effect-rider grammar: legal level 1–3 builds, real campaign dice, the shared public
 * operations, source-ledger damage and one persisted manual rider per use. Expected values come
 * from tests/fixtures/v152-riders-expected.json (pinned Compendium arithmetic), never the engine.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { PublicCompiledResult } from '../../shared/contracts/compiledResult.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { TargetRollOutcome } from '../../shared/contracts/rollResolution.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type SourceLedger from '../../tests/fixtures/v152-riders-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v152-riders-expected.json', 'utf8'),
) as typeof SourceLedger;
// The V109 foe keeps both sides populated, so combat stays in the opening roll (round 0).
const v109 = JSON.parse(readFileSync('tests/fixtures/v109-riders-expected.json', 'utf8')) as {
  foe: { definition: string };
};
const cid = () => crypto.randomUUID();
type Instance = {
  id: string;
  status: string;
  condition: string;
  duration: string;
  sourceUseEventId: string;
  sourceActorId?: string;
  abilityName: string;
};
type Live = {
  conditions?: Record<string, boolean>;
  conditionInstances?: Instance[];
  stamina: number;
  heroicResource: { current: number };
  [key: string]: unknown;
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = { compiled: PublicCompiledResult; targets: { outcome: TargetRollOutcome }[] };
type Action = {
  name: string;
  cost: number;
  source: string;
  damageByTier: number[];
  effect: string;
  riderShape: string;
  riderDependency: string;
  riderStatus: string;
  mode?: string;
  area?: boolean;
  tierMovement?: { movement: string; byTier: (number | null)[] };
  tierCondition?: {
    byTier: string[];
    status: string;
    duration?: string;
    threshold?: number[];
    targetScore?: number;
  };
};
const withoutResource = ({ heroicResource: _resource, ...rest }: Live) => rest;
/** Display markup only: [text](scc link) → text, bold/italic markers, whitespace runs. */
const plain = (text: string) =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export async function runRiderGrammar({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    'V152 eighteen widened Effect riders persist one manual occurrence with real dice',
    async () => {
      const definitions = new Map<number, DecisionDefinitions>();
      for (const level of new Set([1, ...ledger.witnesses.map(w => w.level)]))
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
        name: `Rider grammar ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const admit = async (name: string, level: number, selections: unknown) => {
        const id = await director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: level,
          authored: { name: `${name} ${runId}`, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(
            selections as EvaluationInput['selections'],
            definitions.get(level)!,
          ),
        });
        assert.equal((await get(id)).evaluation.status, 'complete', `${name} legal build`);
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        return id;
      };
      const scores = (sheet: HeroSheet) =>
        Object.fromEntries(
          Object.entries(sheet.build!.baseline!.characteristics).map(([key, v]) => [key, v.value]),
        );
      const ids: string[] = [];
      for (const w of ledger.witnesses) {
        const id = await admit(w.id, w.level, w.selections);
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
        assert.equal(sheet.build!.baseline!.level.value, w.level, `${w.id} level`);
        assert.deepEqual(scores(sheet), w.characteristics, `${w.id} source scores`);
        for (const action of w.actions)
          assert.ok(
            sheet.abilities.some(a => a.name === action.name),
            `${w.id} has ${action.name}`,
          );
        ids.push(id);
      }
      const targetId = await admit('Rider Target', 1, ledger.target.selections);
      const targetSheet = await director.query<HeroSheet>('characters:sheet', {
        characterId: targetId,
      });
      assert.deepEqual(scores(targetSheet), ledger.target.characteristics, 'target source scores');
      await director.mutation<string>('foes:add', {
        commandId: cid(),
        campaignId,
        definitionId: v109.foe.definition,
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
      const read = async (eventId: string) =>
        (
          await director.query<Result[]>('abilities:results', { campaignId, eventIds: [eventId] })
        )[0]!;
      const target = { refKind: 'character', id: targetId };
      const stamina = ledger.target.stamina;
      try {
        await invoke('combat.start');
        await invoke('combat.commit');
        for (const [index, w] of ledger.witnesses.entries()) {
          const actorId = ids[index]!;
          for (const action of w.actions as unknown as Action[]) {
            const label = `${w.id} ${action.name}`;
            await invoke('adjust.stamina', { value: stamina }, targetId);
            await invoke('adjust.heroic-resource', { value: action.cost }, actorId);
            const before = (await get(targetId)).liveState;
            const actorBefore = (await get(actorId)).liveState;
            // Area abilities are used against the one hero target (V110 envelopes).
            const used = await invoke(
              'ability.use',
              {
                ability: action.name,
                targets: [target],
                ...(action.mode ? { mode: action.mode } : {}),
              },
              actorId,
            );
            const saved = await read(used.eventId);
            assert.equal(saved.compiled.definition.execution, 'supported', label);
            assert.equal(saved.compiled.definition.source.revision, ledger.sourceRevision);
            assert.ok(saved.compiled.definition.source.path.endsWith(action.source), label);
            assert.equal(saved.targets.length, 1, label);
            const tier = saved.targets[0]!.outcome.tier;
            const damage = action.damageByTier[tier - 1]!;
            assert.equal(saved.targets[0]!.outcome.damage!.rolledDamage, damage, label);

            // Tier forced movement is an instruction only (V113); nothing moves.
            const pushes = saved.compiled.effects.filter(o => o.effect.kind === 'push');
            const printed = action.tierMovement?.byTier[tier - 1] ?? null;
            assert.equal(pushes.length, printed === null ? 0 : 1, `${label} tier movement`);
            if (printed !== null) {
              const push = pushes[0]!.effect;
              if (push.kind !== 'push') throw new Error(`${label} movement missing`);
              assert.equal(push.movement, action.tierMovement!.movement, label);
              assert.equal(push.printed, printed, label);
            }

            // Tier conditions: potency-resisted ones change nothing; taunted (EoT) always applies.
            const conditions = saved.compiled.effects.filter(o => o.effect.kind === 'condition');
            assert.equal(conditions.length, action.tierCondition ? 1 : 0, `${label} conditions`);
            const after = (await get(targetId)).liveState;
            assert.equal(after.stamina, stamina - damage, `${label} stamina`);
            let expectedTarget: Live = { ...before, stamina: after.stamina };
            if (action.tierCondition) {
              const occurrence = conditions[0]!;
              const condition = occurrence.effect;
              if (condition.kind !== 'condition') throw new Error(`${label} condition missing`);
              assert.equal(condition.condition, action.tierCondition.byTier[tier - 1], label);
              assert.equal(condition.status, action.tierCondition.status, label);
              if (action.tierCondition.threshold) {
                assert.equal(condition.threshold, action.tierCondition.threshold[tier - 1], label);
                assert.equal(condition.targetScore, action.tierCondition.targetScore, label);
              }
              if (condition.status === 'applied') {
                const instance = after.conditionInstances?.find(i => i.id === occurrence.id);
                assert.ok(instance, `${label} condition instance`);
                assert.equal(instance.condition, condition.condition);
                assert.equal(instance.duration, action.tierCondition.duration);
                assert.equal(instance.status, 'active');
                assert.equal(instance.sourceUseEventId, used.eventId);
                assert.equal(instance.sourceActorId, actorId);
                assert.equal(after.conditions?.[condition.condition], true);
                expectedTarget = {
                  ...expectedTarget,
                  // The first recorded instance snapshots the earlier toggles as manual (V88).
                  ...(before.manualConditions === undefined
                    ? { manualConditions: before.conditions }
                    : {}),
                  conditions: { ...before.conditions, [condition.condition]: true },
                  conditionInstances: [...(before.conditionInstances ?? []), instance],
                };
              }
            }
            assert.deepEqual(after, expectedTarget, `${label} target rider manual`);
            const actorAfter = (await get(actorId)).liveState;
            assert.equal(actorAfter.heroicResource.current, 0, `${label} cost`);
            assert.deepEqual(
              withoutResource(actorAfter),
              withoutResource(actorBefore),
              `${label} actor rider manual`,
            );

            // Exactly one whole-section rider, verbatim from the source Effect.
            const riders = saved.compiled.effects.filter(o => o.effect.kind === 'rider');
            assert.equal(riders.length, 1, `${label} one rider`);
            const rider = riders[0]!;
            if (rider.effect.kind !== 'rider') throw new Error(`${label} rider missing`);
            assert.equal(rider.useEventId, used.eventId);
            const sourceNode = saved.compiled.definition.sections.find(
              n => n.id === rider.effect.nodeId,
            )!;
            assert.equal(sourceNode.kind, 'rider', label);
            assert.equal(rider.effect.clause, sourceNode.clause);
            assert.equal(rider.effect.locator, sourceNode.locator);
            assert.equal(plain(rider.effect.clause), action.effect, `${label} printed Effect`);
            assert.equal(rider.effect.shape, action.riderShape, label);
            assert.equal(rider.effect.dependency, action.riderDependency, label);
            assert.equal(rider.effect.status, action.riderStatus, label);

            // The disposition reads back and changes no live state.
            const note = `V152 ${action.name} adjudicated at table`;
            await invoke('ability.resolved', { event: used.eventId, occurrence: rider.id, note });
            const disposed = await read(used.eventId);
            assert.equal(
              disposed.compiled.effects.find(o => o.id === rider.id)!.disposition!.note,
              note,
            );
            assert.deepEqual((await get(targetId)).liveState, after, `${label} disposition`);
            assert.deepEqual((await get(actorId)).liveState, actorAfter, `${label} disposition`);

            if (action.tierCondition?.status === 'applied') {
              await invoke(
                'condition.off',
                { name: action.tierCondition.byTier[tier - 1] },
                targetId,
              );
              const cleared = (await get(targetId)).liveState;
              assert.equal(cleared.conditions?.[action.tierCondition.byTier[tier - 1]!], false);
            }
          }
        }
      } finally {
        const session = await director.query<{ revision: number }>('sessions:get', { sessionId });
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
