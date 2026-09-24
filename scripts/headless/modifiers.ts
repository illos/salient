// SPDX-License-Identifier: GPL-3.0-only
/**
 * V159 modifiers through the shared public operations, with real campaign dice: a level-2 Vanguard
 * uses Squad! On Me! on herself and a Raider (5 Focus, 2 surges each, a stability bonus equal to her
 * Might); the Raider's Brutal Slam at her reads that stability on its push; the Raider's Awe puts a
 * consumable bane on a goblin, which the goblin's next power roll records and uses up even though a
 * circumstance edge cancels it, and undo and redo restore and use it up again; a second bane
 * excluded on a roll stays active, and a correction keeps the exclusion. Every check reads persisted
 * state back through public queries. Expected values come from
 * tests/fixtures/v159-modifiers-expected.json (pinned Compendium and reviewed ledgers), never the
 * engine; only dice-independent values are asserted.
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
import type { EffectInstance } from '../../shared/contracts/liveState.ts';
import type { RollContribution } from '../../shared/resolve/modifiers.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type SourceLedger from '../../tests/fixtures/v159-modifiers-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v159-modifiers-expected.json', 'utf8'),
) as typeof SourceLedger;
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: {
    heroicResource: { current: number };
    surges: number;
    effectInstances?: EffectInstance[];
  };
};
type Listed = { id: string; abilityName: string; text: string };
type Roster = { foes: { id: string; effectInstances: Listed[] }[] };
type Event = { id: string; kind: string; payload?: Record<string, unknown> };
type Result = {
  compiled?: PublicCompiledResult;
  targets: {
    edges: number;
    banes: number;
    contributions?: RollContribution[];
    outcome: { edgeBane: { edges: number; banes: number; net: number } };
  }[];
};

export async function runModifiers({ actors: { director }, run, runId }: ScenarioContext) {
  await run('V159 modifiers feed rolls and stability, are consumed and excluded', async () => {
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Modifiers ${runId}`,
    });
    const build = async (entry: { level: number; selections: unknown }, name: string) => {
      const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        { targetLevel: entry.level },
      );
      const id = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: entry.level,
        authored: { name: `${name} ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(
          entry.selections as unknown as EvaluationInput['selections'],
          definitions,
        ),
      });
      const saved = await director.query<Saved>('characters:get', { characterId: id });
      assert.equal(saved.evaluation.status, 'complete', `legal ${name} build`);
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: id,
      });
      return id;
    };
    const vex = await build(ledger.tactician, 'Vex');
    const korva = await build(ledger.raider, 'Korva');
    const goblin = await director.mutation<string>('foes:add', {
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
      actor?: { refKind: string; id: string },
    ) =>
      director.mutation<{ eventId: string }>('commands:invoke', {
        commandId: cid(),
        campaignId,
        operation,
        arguments: args,
        ...(actor ? { actor } : {}),
      });
    const vexRef = { refKind: 'character', id: vex };
    const korvaRef = { refKind: 'character', id: korva };
    const goblinRef = { refKind: 'foe', id: goblin };
    const live = async (id: string) =>
      (await director.query<Saved>('characters:get', { characterId: id })).liveState;
    const onGoblin = async () =>
      (await director.query<Roster>('table:roster', { campaignId })).foes.find(
        f => f.id === goblin,
      )!.effectInstances;
    const result = async (eventId: string) =>
      (
        await director.query<Result[]>('abilities:results', { campaignId, eventIds: [eventId] })
      )[0]!;
    const events = async () =>
      (await director.query<{ events: Event[] }>('events:list', { campaignId })).events;
    const spear = (args: Record<string, unknown> = {}) =>
      invoke(
        'ability.use',
        { ability: ledger.foe.ability, targets: [korvaRef], ...args },
        goblinRef,
      );
    try {
      await invoke('combat.start');
      await invoke('combat.commit');
      await invoke('combat.roll');
      await invoke('combat.first', { side: 'heroes' });
      await invoke('turn.take', {}, vexRef);

      // 1. Squad! On Me! on Vex and Korva: 5 Focus, 2 surges each, stability + Might for each.
      await invoke('adjust.heroic-resource', { value: ledger.squad.cost.amount }, vexRef);
      const surges = { vex: (await live(vex)).surges, korva: (await live(korva)).surges };
      const squad = await invoke(
        'ability.use',
        { ability: ledger.squad.name, targets: [korvaRef] },
        vexRef,
      );
      assert.equal((await live(vex)).heroicResource.current, 0, 'paid 5 Focus');
      assert.equal((await live(vex)).surges, surges.vex + ledger.squad.surges);
      assert.equal((await live(korva)).surges, surges.korva + ledger.squad.surges);
      for (const id of [vex, korva]) {
        const [bonus] = (await live(id)).effectInstances!.filter(i => i.status === 'active');
        assert.ok(bonus, 'a stability modifier on each target');
        assert.equal(bonus.sourceUseEventId, squad.eventId);
        assert.deepEqual(bonus.payload.kind === 'modifier' && bonus.payload.modifier, {
          ...ledger.squad.modifier,
          amount: ledger.tactician.might,
        });
        assert.deepEqual(bonus.printedDuration, ledger.squad.duration);
        assert.equal(bonus.registrationIds.length, 1, 'ends at Vex’s next turn start');
      }

      // 2. Korva's Brutal Slam at Vex: the push outcome's stability is her base plus the bonus.
      const slam = await invoke(
        'ability.use',
        { ability: ledger.slam.name, targets: [vexRef] },
        korvaRef,
      );
      const push = (await result(slam.eventId)).compiled!.effects.find(
        o => o.effect.kind === 'push',
      )!.effect;
      assert.equal(push.kind, 'push');
      if (push.kind === 'push') {
        assert.ok(ledger.slam.push.includes(push.printed), 'printed push');
        assert.equal(push.stability, ledger.tactician.stability + ledger.tactician.might);
        assert.deepEqual(
          push.stabilityEffects?.map(e => [e.abilityName, e.amount]),
          [[ledger.squad.name, ledger.tactician.might]],
        );
      }

      // 3. Raider's Awe: a consumable bane on the goblin's next power roll.
      const awe = await invoke(
        'ability.use',
        { ability: ledger.awe.name, targets: [goblinRef] },
        korvaRef,
      );
      const [bane] = await onGoblin();
      assert.ok(bane, 'one active effect on the goblin');
      assert.equal(bane.text, ledger.awe.effect);
      const occurrence = (await result(awe.eventId)).compiled!.effects.find(
        o => o.effect.kind === 'modifier',
      )!;
      assert.equal(occurrence.id, bane.id, 'the occurrence is the instance identity');
      assert.equal(occurrence.effect.kind === 'modifier' && occurrence.effect.status, 'applied');

      // 4. The goblin's next power roll, with a circumstance edge: the bane is recorded and
      // cancels the edge, and it is used up anyway.
      const first = await spear({ edges: 1 });
      let roll = (await result(first.eventId)).targets[0]!;
      assert.deepEqual(
        roll.contributions?.map(c => [c.instanceId, c.banes, !!c.excluded]),
        [[bane.id, ledger.awe.modifier.banes, false]],
      );
      assert.deepEqual(roll.outcome.edgeBane, { ...roll.outcome.edgeBane, edges: 1, banes: 1 });
      assert.equal(roll.outcome.edgeBane.net, 0, 'an edge and a bane cancel');
      assert.deepEqual(await onGoblin(), [], 'used up by the roll');
      assert.ok(
        (await events()).some(
          e => e.kind === 'effect.consumed' && e.payload?.effectInstanceId === bane.id,
        ),
        'consumption logged',
      );
      // Undo restores it for the next roll; redo uses it up again.
      await invoke('history.undo');
      assert.deepEqual(
        (await onGoblin()).map(e => e.id),
        [bane.id],
        'undo restores the bane',
      );
      await invoke('history.redo');
      assert.deepEqual(await onGoblin(), [], 'redo uses it up again');
      const second = await spear();
      assert.equal((await result(second.eventId)).targets[0]!.contributions, undefined);

      // 5. A second bane, excluded on the roll: recorded as excluded, not applied, not used up; a
      // correction adding a circumstance bane keeps the exclusion.
      await invoke('ability.use', { ability: ledger.awe.name, targets: [goblinRef] }, korvaRef);
      const [again] = await onGoblin();
      assert.ok(again);
      const excluded = await spear({ exclude: [again.id] });
      roll = (await result(excluded.eventId)).targets[0]!;
      assert.deepEqual(
        roll.contributions?.map(c => [c.instanceId, !!c.excluded]),
        [[again.id, true]],
      );
      assert.equal(roll.outcome.edgeBane.banes, 0, 'excluded, never applied');
      assert.deepEqual(
        (await onGoblin()).map(e => e.id),
        [again.id],
        'an excluded consumable stays active',
      );
      await invoke('ability.correct', { event: excluded.eventId, target: korvaRef, banes: 1 });
      roll = (await result(excluded.eventId)).targets[0]!;
      assert.equal(roll.banes, 1, 'circumstance bane');
      assert.equal(roll.contributions?.[0]?.excluded, true, 'the correction keeps the exclusion');
      assert.equal(roll.outcome.edgeBane.banes, 1, 'counted once');
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
  });
}
