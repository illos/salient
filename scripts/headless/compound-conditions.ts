// SPDX-License-Identifier: GPL-3.0-only
/**
 * V153 compound tier conditions through the shared public operations with real campaign dice:
 * "I < WEAK, dazed and slowed (save ends)" persists one condition instance per condition sharing
 * one saving throw (rule/general/saving-throw.md), and "taunted (EoT), slide 1" persists the taunt
 * then a slide instruction. Expected values come from tests/fixtures/v153-compound-expected.json
 * (pinned Compendium arithmetic), never the engine.
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
import type SourceLedger from '../../tests/fixtures/v153-compound-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v153-compound-expected.json', 'utf8'),
) as typeof SourceLedger;
const cid = () => crypto.randomUUID();
type Save = { roll: number; success: boolean; boundaryEventId: string; threshold: number };
type Instance = {
  id: string;
  status: string;
  condition: string;
  duration: string;
  saveGroup?: string;
  registrationId?: string;
  sourceUseEventId: string;
  endedReason?: string;
  lastSave?: Save;
};
type Live = {
  conditionInstances?: Instance[];
  stamina: number;
  heroicResource: { current: number };
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = { compiled: PublicCompiledResult; targets: { outcome: TargetRollOutcome }[] };
type Event = {
  id: string;
  kind: string;
  causeEventId: string | null;
  dice?: { sides: number; value: number }[];
  payload?: {
    data?: {
      effectInstanceId?: string;
      roll?: number;
      success?: boolean;
      threshold?: number;
      shared?: boolean;
    };
  };
};
type Action = {
  name: string;
  cost: number;
  source: string;
  damageByTier: number[];
  compound?: {
    conditions: string[];
    duration: string;
    characteristic: string;
    threshold: number[];
    targetScore: number;
    status: string;
  };
  taunt?: { condition: string; duration: string; status: string };
  tierMovement?: { movement: string; byTier: (number | null)[] };
};
type Witness = (typeof ledger.witnesses)[number] & {
  potency?: { characteristic: string };
  actions: Action[];
};

export async function runCompoundConditions({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    'V153 compound conditions share one saving throw; taunted (EoT) then slide in order',
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
        name: `Compound conditions ${runId}`,
      });
      const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
      const scores = (sheet: HeroSheet) =>
        Object.fromEntries(
          Object.entries(sheet.build!.baseline!.characteristics).map(([key, v]) => [key, v.value]),
        );
      const admit = async (name: string, level: number, selections: unknown, expected: object) => {
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
        const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: id });
        assert.equal(sheet.build!.baseline!.level.value, level, `${name} level`);
        assert.deepEqual(scores(sheet), expected, `${name} source scores`);
        await director.mutation('characters:submit', {
          commandId: cid(),
          campaignId,
          characterId: id,
        });
        return { id, sheet };
      };
      const witnesses = ledger.witnesses as unknown as Witness[];
      const ids: string[] = [];
      for (const w of witnesses) {
        const { id, sheet } = await admit(w.id, w.level, w.selections, w.characteristics);
        for (const action of w.actions)
          assert.ok(
            sheet.abilities.some(a => a.name === action.name),
            `${w.id} has ${action.name}`,
          );
        ids.push(id);
      }
      const { id: targetId } = await admit(
        'Compound Target',
        1,
        ledger.target.selections,
        ledger.target.characteristics,
      );
      // Heroes only: an empty foe side opens with Director adjudication (combat.first).
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
      const instances = async () => (await get(targetId)).liveState.conditionInstances ?? [];
      const target = { refKind: 'character', id: targetId };
      const groups: { label: string; ids: string[] }[] = [];
      const taunts: string[] = [];
      try {
        await invoke('combat.start');
        await invoke('combat.commit');
        for (const [index, w] of witnesses.entries()) {
          const actorId = ids[index]!;
          for (const action of w.actions) {
            const label = `${w.id} ${action.name}`;
            await invoke('adjust.stamina', { value: ledger.target.stamina }, targetId);
            await invoke('adjust.heroic-resource', { value: action.cost }, actorId);
            const used = await invoke(
              'ability.use',
              { ability: action.name, targets: [target] },
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
            const live = await get(targetId);
            assert.equal(
              live.liveState.stamina,
              ledger.target.stamina - damage,
              `${label} stamina`,
            );
            assert.equal((await get(actorId)).liveState.heroicResource.current, 0, `${label} cost`);
            const effects = saved.compiled.effects;

            if (action.compound) {
              const expected = action.compound;
              // Printed order: the damage, then one condition per named condition.
              assert.deepEqual(
                effects.map(o =>
                  o.effect.kind === 'condition' ? o.effect.condition : o.effect.kind,
                ),
                ['damage', ...expected.conditions],
                `${label} effect order`,
              );
              const conditions = effects.slice(1);
              const head = conditions[0]!.effect;
              const group = head.kind === 'condition' ? head.group : undefined;
              assert.ok(group, `${label} compound group`);
              for (const occurrence of conditions) {
                const c = occurrence.effect;
                if (c.kind !== 'condition') throw new Error(`${label} condition missing`);
                assert.equal(c.group, group, `${label} shared group`);
                assert.equal(c.status, expected.status, `${label} ${c.condition} status`);
                assert.equal(c.duration, expected.duration, label);
                assert.equal(c.characteristic, expected.characteristic, label);
                assert.equal(c.potencyCharacteristic, w.potency!.characteristic, label);
                assert.equal(c.threshold, expected.threshold[tier - 1], `${label} potency`);
                assert.equal(c.targetScore, expected.targetScore, `${label} target score`);
                assert.equal(occurrence.useEventId, used.eventId);
              }
              const first = conditions[0]!.id;
              const members = conditions.map(o => o.id);
              const persisted = (await instances()).filter(i => members.includes(i.id));
              assert.deepEqual(
                persisted.map(i => [i.id, i.condition, i.duration, i.status, i.saveGroup]),
                conditions.map((o, i) => [
                  o.id,
                  expected.conditions[i],
                  expected.duration,
                  'active',
                  first,
                ]),
                `${label} instances share saveGroup = first occurrence`,
              );
              for (const i of persisted) {
                assert.ok(i.registrationId, `${label} ${i.condition} save scheduled`);
                assert.equal(i.sourceUseEventId, used.eventId);
                assert.equal(i.lastSave, undefined);
              }
              groups.push({ label, ids: members });
            }

            if (action.taunt) {
              const printed = action.tierMovement!.byTier[tier - 1] ?? null;
              assert.deepEqual(
                effects.map(o => o.effect.kind),
                ['damage', 'condition', ...(printed === null ? [] : ['push'])],
                `${label} effect order`,
              );
              const c = effects[1]!.effect;
              if (c.kind !== 'condition') throw new Error(`${label} taunt missing`);
              assert.equal(c.condition, action.taunt.condition, label);
              assert.equal(c.duration, action.taunt.duration, label);
              assert.equal(c.status, action.taunt.status, label);
              assert.equal(c.characteristic, undefined, `${label} no potency`);
              assert.equal(c.group, undefined, `${label} not compound`);
              if (printed !== null) {
                const push = effects[2]!.effect;
                if (push.kind !== 'push') throw new Error(`${label} movement missing`);
                assert.equal(push.movement, action.tierMovement!.movement, label);
                assert.equal(push.printed, printed, `${label} printed slide`);
              }
              const instance = (await instances()).find(i => i.id === effects[1]!.id);
              assert.ok(instance, `${label} taunt instance`);
              assert.equal(instance.condition, 'taunted');
              assert.equal(instance.duration, 'eot');
              assert.equal(instance.status, 'active');
              assert.equal(instance.saveGroup, undefined);
              assert.ok(instance.registrationId, `${label} EoT expiry scheduled`);
              taunts.push(instance.id);
            }
          }
        }
        assert.equal(groups.length, 2, 'two compound effects');

        // The target's own turn end fires each member's save registration (saving-throw.md).
        await invoke('combat.first', { side: 'heroes' });
        await invoke('turn.take', {}, targetId);
        await invoke('turn.end', {}, targetId);
        const events = (
          await director.query<{ events: Event[] }>('events:list', { campaignId })
        ).events.filter(e => e.kind === 'clock.saving-throw');
        const after = await instances();
        for (const group of groups) {
          const saves = events.filter(e =>
            group.ids.includes(e.payload?.data?.effectInstanceId ?? ''),
          );
          const rolled = saves.filter(e => e.dice?.length);
          assert.equal(rolled.length, 1, `${group.label}: one d10 for the whole effect`);
          const die = rolled[0]!.dice!;
          assert.equal(die.length, 1);
          assert.equal(die[0]!.sides, 10);
          const data = rolled[0]!.payload!.data!;
          assert.equal(data.roll, die[0]!.value);
          assert.equal(data.threshold, ledger.target.savingThrowThreshold, 'save threshold');
          const success = data.roll! >= data.threshold!;
          assert.equal(data.success, success, `${group.label}: 6 or higher ends the effect`);
          // A failure leaves the other member active, so its registration reuses the roll; a
          // success ends every member at once, so the other registration is retired unfired.
          const shared = saves.filter(e => e.payload?.data?.shared === true);
          assert.equal(shared.length, success ? 0 : 1, `${group.label}: shared save`);
          assert.equal(saves.length, rolled.length + shared.length, `${group.label} saves`);
          for (const e of shared) {
            assert.equal(e.dice, undefined, `${group.label}: shared save rolls no dice`);
            assert.equal(e.payload!.data!.roll, data.roll);
            assert.equal(e.payload!.data!.success, data.success);
          }
          const boundary = saves[0]!.causeEventId;
          assert.ok(
            saves.every(e => e.causeEventId === boundary),
            `${group.label}: one boundary`,
          );
          const members = after.filter(i => group.ids.includes(i.id));
          assert.equal(members.length, group.ids.length);
          for (const i of members) {
            assert.deepEqual(i.lastSave, members[0]!.lastSave, `${group.label}: one lastSave`);
            assert.equal(i.lastSave!.roll, data.roll);
            assert.equal(i.lastSave!.success, success);
            assert.equal(i.lastSave!.boundaryEventId, boundary);
            if (success) {
              assert.equal(i.status, 'ended', `${group.label} ${i.condition}`);
              assert.equal(i.endedReason, 'successful saving throw');
            } else assert.equal(i.status, 'active', `${group.label} ${i.condition}`);
          }
        }
        // rule/combat/end-of-turn.md: the EoT taunt ends at the end of the target's turn.
        for (const id of taunts) {
          const taunt = after.find(i => i.id === id)!;
          assert.equal(taunt.status, 'ended', 'EoT taunt');
          assert.equal(taunt.endedReason, 'end of turn (EoT)');
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
