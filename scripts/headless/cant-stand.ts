// SPDX-License-Identifier: GPL-3.0-only
/**
 * V155 "prone and can't stand (save ends)" through the shared public operations with real campaign
 * dice (docs/decisions/2026-09-24-automation-rulings.md, section 5): the prone has no duration and
 * ends only by Stand Up (condition/prone.md; feature/common/maneuvers/stand-up.md); a separate
 * can't-stand restriction carries the save, refuses Stand Up while active, and leaves the creature
 * prone when it ends (rule/general/saving-throw.md). Expected values come from
 * tests/fixtures/v155-cant-stand-expected.json (pinned Compendium arithmetic), never the engine.
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
import type SourceLedger from '../../tests/fixtures/v155-cant-stand-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v155-cant-stand-expected.json', 'utf8'),
) as typeof SourceLedger;
const cid = () => crypto.randomUUID();
type Save = { roll: number; success: boolean; boundaryEventId: string; threshold: number };
type Instance = {
  id: string;
  status: string;
  condition: string;
  duration: string;
  restriction?: string;
  registrationId?: string;
  sourceUseEventId: string;
  endedReason?: string;
  lastSave?: Save;
};
type Live = {
  conditionInstances?: Instance[];
  conditions?: Record<string, boolean>;
  stamina: number;
  heroicResource: { current: number };
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = { compiled: PublicCompiledResult; targets: { outcome: TargetRollOutcome }[] };
type Event = {
  id: string;
  kind: string;
  description: string;
  causeEventId: string | null;
  dice?: { sides: number; value: number }[];
  payload?: {
    occurrence?: string;
    data?: { effectInstanceId?: string; roll?: number; success?: boolean; threshold?: number };
  };
};
type TierEffects = {
  prone: boolean;
  cantStand: boolean;
  slowed?: boolean;
  characteristic: string;
  threshold: number;
};
type Witness = Omit<(typeof ledger.witnesses)[number], 'action'> & {
  action: {
    name: string;
    cost: number;
    source: string;
    damageByTier: number[];
    byTier: TierEffects[];
    maxAttempts?: number;
  };
};

export async function runCantStand({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    "V155 prone and can't stand: Stand Up refused until the save, then still prone",
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
        name: `Cant stand ${runId}`,
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
      const [hammer, blow] = ledger.witnesses as unknown as Witness[];
      const ids = new Map<Witness, string>();
      for (const w of [hammer!, blow!]) {
        const { id, sheet } = await admit(w.id, w.level, w.selections, w.characteristics);
        assert.ok(
          sheet.abilities.some(a => a.name === w.action.name),
          `${w.id} has ${w.action.name}`,
        );
        ids.set(w, id);
      }
      const { id: targetId, sheet: targetSheet } = await admit(
        'Cant Stand Target',
        1,
        ledger.target.selections,
        ledger.target.characteristics,
      );
      const baseline = targetSheet.build!.baseline!;
      assert.equal(baseline.staminaMaximum.value, ledger.target.stamina, 'target Stamina maximum');
      assert.equal(
        baseline.savingThrowThreshold.value,
        ledger.target.savingThrowThreshold,
        'target saving throw threshold',
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
      const events = async () =>
        (await director.query<{ events: Event[] }>('events:list', { campaignId })).events;
      const instances = async () => (await get(targetId)).liveState.conditionInstances ?? [];
      const instance = async (id: string) => (await instances()).find(i => i.id === id)!;
      const prone = async () => (await get(targetId)).liveState.conditions?.prone === true;
      const target = { refKind: 'character', id: targetId };
      const standUp = () => invoke('ability.use', { ability: 'Stand Up' }, targetId);

      // One use against the target at full Stamina; asserts damage, cost and every effect of the
      // resulting tier. Returns the prone and restriction occurrence ids, when the tier has them.
      const use = async (w: Witness) => {
        const { action } = w;
        const actorId = ids.get(w)!;
        await invoke('adjust.stamina', { value: ledger.target.stamina }, targetId);
        await invoke('adjust.heroic-resource', { value: action.cost }, actorId);
        const used = await invoke(
          'ability.use',
          { ability: action.name, targets: [target] },
          actorId,
        );
        const saved = await read(used.eventId);
        const tier = saved.targets[0]!.outcome.tier;
        const label = `${w.id} ${action.name} tier ${tier}`;
        assert.equal(saved.compiled.definition.execution, 'supported', label);
        assert.equal(saved.compiled.definition.source.revision, ledger.sourceRevision);
        assert.ok(saved.compiled.definition.source.path.endsWith(action.source), label);
        assert.equal(saved.targets.length, 1, label);
        const damage = action.damageByTier[tier - 1]!;
        assert.equal(saved.targets[0]!.outcome.damage!.rolledDamage, damage, label);
        assert.equal(
          (await get(targetId)).liveState.stamina,
          ledger.target.stamina - damage,
          `${label} stamina`,
        );
        assert.equal((await get(actorId)).liveState.heroicResource.current, 0, `${label} cost`);

        const expected = action.byTier[tier - 1]!;
        const effects = saved.compiled.effects;
        assert.deepEqual(
          effects.map(o =>
            o.effect.kind === 'condition'
              ? `${o.effect.condition}${o.effect.restriction ? `:${o.effect.restriction}` : ''}`
              : o.effect.kind,
          ),
          [
            'damage',
            ...(expected.slowed ? ['slowed'] : []),
            ...(expected.prone ? ['prone'] : []),
            ...(expected.cantStand ? ['prone:cant-stand'] : []),
          ],
          `${label} effect order`,
        );
        for (const occurrence of effects.slice(1)) {
          const c = occurrence.effect;
          if (c.kind !== 'condition') throw new Error(`${label} condition missing`);
          assert.equal(c.status, 'applied', `${label} ${c.condition} status`);
          assert.equal(c.characteristic, expected.characteristic, label);
          assert.equal(c.potencyCharacteristic, w.potency.characteristic, label);
          assert.equal(c.threshold, expected.threshold, `${label} potency`);
          assert.equal(
            c.targetScore,
            ledger.target.characteristics[expected.characteristic as 'M' | 'A'],
            `${label} target score`,
          );
          assert.equal(occurrence.useEventId, used.eventId);
        }
        const find = (restricted: boolean, condition = 'prone') =>
          effects.find(
            o =>
              o.effect.kind === 'condition' &&
              o.effect.condition === condition &&
              (o.effect.restriction === 'cant-stand') === restricted,
          );
        const proneOccurrence = find(false);
        const restriction = find(true);
        const slowed = find(false, 'slowed');
        if (proneOccurrence) {
          const c = proneOccurrence.effect;
          assert.equal(
            c.kind === 'condition' && c.duration,
            'none',
            `${label} prone has no duration`,
          );
          const i = await instance(proneOccurrence.id);
          assert.equal(i.status, 'active', `${label} prone instance`);
          assert.equal(i.duration, 'none');
          assert.equal(i.restriction, undefined);
          assert.equal(i.registrationId, undefined, `${label} prone is not scheduled`);
          assert.equal(i.sourceUseEventId, used.eventId);
          assert.equal(await prone(), true, `${label} target prone`);
        }
        if (restriction) {
          const c = restriction.effect;
          assert.equal(c.kind === 'condition' && c.duration, 'save-ends', `${label} restriction`);
          const i = await instance(restriction.id);
          assert.equal(i.status, 'active', `${label} restriction instance`);
          assert.equal(i.condition, 'prone');
          assert.equal(i.restriction, 'cant-stand');
          assert.equal(i.duration, 'save-ends');
          assert.ok(i.registrationId, `${label} restriction save scheduled`);
          assert.equal(i.sourceUseEventId, used.eventId);
          assert.equal(i.lastSave, undefined);
          const log = (await events()).find(
            e => e.kind === 'condition.potency' && e.payload?.occurrence === restriction.id,
          );
          assert.ok(log, `${label} restriction logged (latest 50 events)`);
          assert.match(log.description, /can't stand/, `${label} log names the restriction`);
        }
        if (slowed) {
          const c = slowed.effect;
          assert.equal(c.kind === 'condition' && c.duration, 'save-ends', `${label} slowed`);
          assert.equal((await instance(slowed.id)).status, 'active', `${label} slowed instance`);
        }
        return { label, tier, prone: proneOccurrence?.id, restriction: restriction?.id };
      };

      try {
        await invoke('combat.start');
        await invoke('combat.commit');

        // Judgment's Hammer: whichever tier the real dice give. A plain prone is ended by Stand Up;
        // a tier-3 can't stand refuses it and is cleared with condition off prone, which ends every
        // prone instance and retires the restriction's save.
        const judgment = await use(hammer!);
        if (judgment.restriction) {
          await assert.rejects(standUp(), /can't stand/, `${judgment.label} Stand Up refused`);
          assert.equal(await prone(), true);
          await invoke('condition.off', { name: 'prone' }, targetId);
          const ended = await instance(judgment.restriction);
          assert.equal(ended.status, 'ended', `${judgment.label} restriction cleared`);
          assert.equal(ended.endedReason, 'condition.off');
        } else await standUp();
        assert.equal(await prone(), false, `${judgment.label} target standing again`);
        assert.equal((await instance(judgment.prone!)).status, 'ended', `${judgment.label} prone`);

        // Staggering Blow, repeated with real dice until a tier-2/3 (can't stand) result. A tier-1
        // slowed (save ends) is asserted and then cleared, so the target starts each use unaffected.
        let hold: Awaited<ReturnType<typeof use>> | undefined;
        for (let attempt = 1; attempt <= blow!.action.maxAttempts! && !hold; attempt++) {
          const staggering = await use(blow!);
          if (staggering.restriction) hold = staggering;
          else await invoke('condition.off', { name: 'slowed' }, targetId);
        }
        assert.ok(
          hold,
          `Staggering Blow reached no tier 2/3 in ${blow!.action.maxAttempts} real rolls (p ~ 0.36^n)`,
        );

        // The target's own turn: Stand Up is refused while can't stand is active; its end fires the
        // restriction's saving throw (rule/general/saving-throw.md).
        await invoke('combat.first', { side: 'heroes' });
        await invoke('turn.take', {}, targetId);
        await assert.rejects(standUp(), /can't stand/, `${hold.label} Stand Up refused on turn`);
        assert.equal(await prone(), true);
        await invoke('turn.end', {}, targetId);

        const saves = (await events()).filter(
          e =>
            e.kind === 'clock.saving-throw' &&
            e.payload?.data?.effectInstanceId === hold.restriction,
        );
        assert.equal(saves.length, 1, `${hold.label}: one saving throw at the turn end`);
        const die = saves[0]!.dice!;
        assert.equal(die.length, 1);
        assert.equal(die[0]!.sides, 10);
        const data = saves[0]!.payload!.data!;
        assert.equal(data.roll, die[0]!.value);
        assert.equal(data.threshold, ledger.target.savingThrowThreshold, 'save threshold');
        const success = data.roll! >= data.threshold!;
        assert.equal(data.success, success, `${hold.label}: 6 or higher ends the restriction`);
        const restriction = await instance(hold.restriction!);
        assert.equal(restriction.lastSave!.roll, data.roll);
        assert.equal(restriction.lastSave!.success, success);
        assert.equal(restriction.lastSave!.boundaryEventId, saves[0]!.causeEventId);
        // The prone itself has no duration: it takes no save and outlasts the turn either way.
        assert.equal((await instance(hold.prone!)).status, 'active', `${hold.label} still prone`);
        assert.equal(await prone(), true);
        if (success) {
          assert.equal(restriction.status, 'ended', `${hold.label} restriction saved`);
          assert.equal(restriction.endedReason, 'successful saving throw');
          await standUp();
          assert.equal(await prone(), false, `${hold.label} Stand Up after the save`);
          assert.equal((await instance(hold.prone!)).status, 'ended');
        } else {
          assert.equal(restriction.status, 'active', `${hold.label} restriction holds`);
          assert.ok(restriction.registrationId, `${hold.label} next save still scheduled`);
          await assert.rejects(standUp(), /can't stand/, `${hold.label} Stand Up still refused`);
          assert.equal(await prone(), true);
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
