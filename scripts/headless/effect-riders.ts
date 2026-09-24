// SPDX-License-Identifier: GPL-3.0-only
/** V109 real campaign dice, shared public operations, source-ledger damage and persisted riders. */
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
import type SourceLedger from '../../tests/fixtures/v109-riders-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v109-riders-expected.json', 'utf8'),
) as typeof SourceLedger;
const cid = () => crypto.randomUUID();
type Live = {
  conditions?: Record<string, boolean>;
  conditionInstances?: {
    id: string;
    status: string;
    condition: string;
    sourceUseEventId: string;
    abilityName: string;
    duration: string;
    registrationId?: string;
  }[];
  stamina: number;
  heroicResource: { current: number };
  effectInstances?: { id: string; kind: string; status: string }[];
  [key: string]: unknown;
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = {
  dice: { d10a: number; d10b: number };
  compiled: PublicCompiledResult;
  targets: { outcome: TargetRollOutcome }[];
};
const withoutResource = ({ heroicResource: _resource, ...rest }: Live) => rest;

export async function runEffectRiders({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    'V109 seven classes, five kits and one foe persist manual riders with real dice',
    async () => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: 1 },
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Riders ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const ids: string[] = [];
      for (const w of ledger.witnesses) {
        const id = await director.mutation<string>('characters:create', {
          commandId: cid(),
          targetLevel: 1,
          authored: { name: `${w.id} ${runId}`, appearance: '', biography: '', notes: '' },
          selections: draftSelectionsFrom(
            w.selections as unknown as EvaluationInput['selections'],
            definitions,
          ),
        });
        assert.equal((await get(id)).evaluation.status, 'complete', `${w.id} legal build`);
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
        assert.deepEqual(
          Object.fromEntries(
            Object.entries(sheet.build!.baseline!.characteristics).map(([key, v]) => [
              key,
              v.value,
            ]),
          ),
          w.characteristics,
          `${w.id} source scores`,
        );
        for (const action of w.actions)
          assert.ok(
            sheet.abilities.some(a => a.name === action.name),
            action.name,
          );
        ids.push(id);
      }
      // A separate source-derived Human Censor has A2: Hamstring Shot resists every threshold0/1/2.
      const targetId = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Rider Target ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(
          ledger.witnesses[0]!.selections as unknown as EvaluationInput['selections'],
          definitions,
        ),
      });
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: targetId,
      });
      // Elementalist's printed 2/2/-1/-1 array assigns A-1, M2, I2, P-1 with fixed R2.
      // Below all Fury M2 potency thresholds (0/1/2), regardless of accepted campaign dice.
      const lowSelections = structuredClone(
        ledger.witnesses.find(w => w.id === 'v104-4')!.selections,
      ) as unknown as EvaluationInput['selections'];
      lowSelections['class.elementalist.characteristic-array'] = '2, 2, −1, −1';
      lowSelections['class.elementalist.array-assignment'] = {
        Might: 2,
        Agility: -1,
        Intuition: 2,
        Presence: -1,
      };
      const lowId = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Low Agility ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(lowSelections, definitions),
      });
      assert.equal((await get(lowId)).evaluation.status, 'complete');
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: lowId,
      });
      assert.equal((await get(lowId)).evaluation.baseline!.characteristics.A.value, -1);
      const foeId = await director.mutation<string>('foes:add', {
        commandId: cid(),
        campaignId,
        definitionId: ledger.foe.definition,
      });
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: cid(),
        campaignId,
        selectedPlayerIds: [],
      });
      const invoke = (
        operation: string,
        args: Record<string, unknown> = {},
        actorId?: string,
        kind = 'character',
      ) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          commandId: cid(),
          campaignId,
          operation,
          arguments: args,
          ...(actorId ? { actor: { refKind: kind, id: actorId } } : {}),
        });
      const read = async (eventId: string) =>
        (
          await director.query<Result[]>('abilities:results', { campaignId, eventIds: [eventId] })
        )[0]!;
      const target = { refKind: 'character', id: targetId };
      let historyProven = false;
      try {
        await invoke('combat.start');
        await invoke('combat.commit');
        for (const [index, w] of ledger.witnesses.entries()) {
          const actorId = ids[index]!;
          for (const action of w.actions) {
            await invoke('adjust.stamina', { value: 24 }, targetId);
            await invoke('adjust.heroic-resource', { value: action.cost }, actorId);
            const before = (await get(targetId)).liveState;
            const actorBefore = (await get(actorId)).liveState;
            const used = await invoke(
              'ability.use',
              { ability: action.name, targets: [target] },
              actorId,
            );
            const saved = await read(used.eventId);
            assert.equal(saved.compiled.definition.execution, 'supported', action.name);
            assert.equal(saved.compiled.definition.source.revision, ledger.sourceRevision);
            assert.ok(saved.compiled.definition.source.path.endsWith(action.source), action.name);
            const damage = action.damageByTier[saved.targets[0]!.outcome.tier - 1]!;
            assert.equal(saved.targets[0]!.outcome.damage!.rolledDamage, damage, action.name);
            const after = (await get(targetId)).liveState;
            assert.equal(after.stamina, 24 - damage, action.name);
            // V159: a modifier Effect stores one modifier instance on the target and nothing else.
            const modifiers = saved.compiled.effects.filter(o => o.effect.kind === 'modifier');
            const modifier = 'modifier' in action;
            assert.equal(modifiers.length, modifier ? 1 : 0, `${action.name} modifier`);
            const added = (after.effectInstances ?? []).filter(
              i => !(before.effectInstances ?? []).some(b => b.id === i.id),
            );
            assert.deepEqual(
              added.map(i => [i.id, i.kind, i.status]),
              modifier ? [[modifiers[0]!.id, 'modifier', 'active']] : [],
              `${action.name} stored modifiers`,
            );
            const withoutEffects = ({ effectInstances, ...rest }: typeof after) => {
              void effectInstances;
              return rest;
            };
            assert.deepEqual(
              withoutEffects({ ...after, stamina: before.stamina }),
              withoutEffects(before),
              `${action.name} target rider manual`,
            );
            const actorAfter = (await get(actorId)).liveState;
            assert.equal(actorAfter.heroicResource.current, 0, `${action.name} cost`);
            // V158: the owner of an effect another creature holds keeps a pointer to it.
            const { ownedEffects, ...actorRest } = withoutResource(actorAfter);
            const { ownedEffects: ownedBefore, ...actorBeforeRest } = withoutResource(actorBefore);
            assert.deepEqual(actorRest, actorBeforeRest, `${action.name} actor rider manual`);
            assert.deepEqual(
              ((ownedEffects ?? []) as { id: string }[]).map(e => e.id),
              [
                ...((ownedBefore ?? []) as { id: string }[]).map(e => e.id),
                ...(modifier ? [modifiers[0]!.id] : []),
              ],
              `${action.name} owner pointer`,
            );
            const riders = saved.compiled.effects.filter(o => o.effect.kind === 'rider');
            assert.equal(riders.length, action.rider ? 1 : 0, action.name);
            if (!action.rider) {
              if (modifier) continue;
              assert.equal(
                saved.compiled.effects.find(o => o.effect.kind === 'condition')!.effect.status,
                'resisted',
              );
              continue;
            }
            const rider = riders[0]!;
            assert.equal(rider.useEventId, used.eventId);
            const sourceNode = saved.compiled.definition.sections.find(
              n => n.id === rider.effect.nodeId,
            )!;
            assert.equal(rider.effect.clause, sourceNode.clause);
            assert.equal(rider.effect.locator, sourceNode.locator);
            assert.equal(
              rider.effect.status,
              sourceNode.kind === 'rider' && sourceNode.dependency === 'after-movement'
                ? 'fact-needed'
                : 'manual',
            );
            const resolveArgs = {
              event: used.eventId,
              occurrence: rider.id,
              note: 'Printed rider adjudicated at table',
            };
            await invoke('ability.resolved', resolveArgs);
            const disposed = await read(used.eventId);
            assert.equal(
              disposed.compiled.effects.find(o => o.id === rider.id)!.disposition!.note,
              resolveArgs.note,
            );
            assert.deepEqual((await get(targetId)).liveState, after);
            assert.deepEqual((await get(actorId)).liveState, actorAfter);
            if (!historyProven) {
              await invoke('history.rewind');
              assert.deepEqual((await read(used.eventId)).compiled, saved.compiled);
              await invoke('history.redo');
              assert.deepEqual((await read(used.eventId)).compiled, disposed.compiled);
              await invoke('history.rewind');
              await invoke('ability.correct', { event: used.eventId, target, edges: 0, banes: 2 });
              const corrected = await read(used.eventId);
              assert.deepEqual(corrected.dice, saved.dice);
              const current = corrected.compiled.effects.find(o => o.effect.kind === 'rider')!;
              assert.notEqual(current.id, rider.id);
              assert.deepEqual(current.effect, rider.effect);
              assert.equal(
                (await get(targetId)).liveState.stamina,
                24 - action.damageByTier[corrected.targets[0]!.outcome.tier - 1]!,
              );
              await assert.rejects(invoke('ability.resolved', resolveArgs), /current|stale/);
              historyProven = true;
            }
          }
        }
        const rangerId = ids[ledger.witnesses.findIndex(w => w.id === 'kit-ranger')]!;
        const lowBefore = (await get(lowId)).liveState;
        const slowed = await invoke(
          'ability.use',
          { ability: 'Hamstring Shot', targets: [{ refKind: 'character', id: lowId }] },
          rangerId,
        );
        const slowedResult = await read(slowed.eventId);
        const condition = slowedResult.compiled.effects.find(o => o.effect.kind === 'condition')!;
        assert.equal(condition.effect.kind, 'condition');
        if (condition.effect.kind !== 'condition') throw new Error('Missing Hamstring condition');
        assert.equal(condition.effect.status, 'applied');
        assert.equal(condition.effect.targetScore, -1);
        assert.equal(
          condition.effect.threshold,
          [0, 1, 2][slowedResult.targets[0]!.outcome.tier - 1],
        );
        const lowAfter = (await get(lowId)).liveState;
        assert.equal(
          lowAfter.stamina,
          lowBefore.stamina - [5, 7, 9][slowedResult.targets[0]!.outcome.tier - 1]!,
        );
        assert.equal(lowAfter.conditions?.slowed, true);
        const instance = lowAfter.conditionInstances?.find(i => i.id === condition.id);
        assert.ok(instance);
        assert.equal(instance.sourceUseEventId, slowed.eventId);
        assert.equal(instance.abilityName, 'Hamstring Shot');
        assert.equal(instance.condition, 'slowed');
        assert.equal(instance.duration, 'save-ends');
        assert.equal(instance.status, 'active');
        assert.ok(
          instance.registrationId,
          'Hamstring saves registered at committed target turn ends',
        );
        await invoke('condition.off', { name: 'slowed' }, lowId);
        const ended = (await get(lowId)).liveState;
        assert.equal(ended.conditions?.slowed, false);
        assert.equal(ended.conditionInstances?.find(i => i.id === condition.id)?.status, 'ended');
        await invoke('adjust.stamina', { value: 24 }, targetId);
        const before = (await get(targetId)).liveState;
        const used = await invoke(
          'ability.use',
          { ability: ledger.foe.name, targets: [target] },
          foeId,
          'foe',
        );
        const result = await read(used.eventId);
        assert.equal(
          result.targets[0]!.outcome.damage!.rolledDamage,
          ledger.foe.damageByTier[result.targets[0]!.outcome.tier - 1],
        );
        const after = (await get(targetId)).liveState;
        assert.equal(
          after.stamina,
          24 - ledger.foe.damageByTier[result.targets[0]!.outcome.tier - 1]!,
        );
        assert.deepEqual({ ...after, stamina: before.stamina }, before);
        const rider = result.compiled.effects.find(o => o.effect.kind === 'rider')!;
        assert.equal(rider.effect.kind, 'rider');
        assert.match(rider.effect.clause, /One ally within 5 squares.*free strike/);
        assert.ok(!JSON.stringify(result.compiled).includes('Loyalty Collar'));
        await invoke('ability.resolved', {
          event: used.eventId,
          occurrence: rider.id,
          note: 'Ally strike remains separate table work',
        });
        assert.ok(
          (await read(used.eventId)).compiled.effects.find(o => o.id === rider.id)!.disposition,
        );
        assert.deepEqual((await get(targetId)).liveState, after);
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
