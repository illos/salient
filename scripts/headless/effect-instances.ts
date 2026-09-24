// SPDX-License-Identifier: GPL-3.0-only
/**
 * V158 effect instances through the shared public operations: a compiled use of Relentless Nemesis
 * stores its lasting instruction as an effect instance on the target, bound to the user's next
 * turn start; effect.list lists it; the clock ends it when the user's next turn starts; effect.end
 * ends a second one with its reason, and undo and redo restore and end it again. Every check reads
 * persisted state back through public queries. Expected values come from
 * tests/fixtures/v158-effect-instances-expected.json (pinned Compendium), never the engine.
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
import type { OwnedEffect } from '../../shared/contracts/liveState.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type SourceLedger from '../../tests/fixtures/v158-effect-instances-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v158-effect-instances-expected.json', 'utf8'),
) as typeof SourceLedger;
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: { heroicResource: { current: number }; ownedEffects?: OwnedEffect[] };
};
type Listed = {
  id: string;
  abilityName: string;
  text: string;
  subject: string;
  printedDuration: { kind: string; anchor?: string };
  endsWhen: string[];
  scheduled: boolean;
};
type Roster = { foes: { id: string; effectInstances: Listed[] }[] };
type Event = {
  id: string;
  kind: string;
  causeEventId: string | null;
  disposition?: string;
  payload?: { data?: Record<string, unknown> } & Record<string, unknown>;
};

export async function runEffectInstances({ actors: { director }, run, runId }: ScenarioContext) {
  await run('V158 lasting instructions are tracked, listed, expired and ended', async () => {
    const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
      'characterWizard:discover',
      { targetLevel: ledger.witness.level },
    );
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Effect instances ${runId}`,
    });
    const nyx = await director.mutation<string>('characters:create', {
      commandId: cid(),
      targetLevel: ledger.witness.level,
      authored: { name: `Nyx ${runId}`, appearance: '', biography: '', notes: '' },
      selections: draftSelectionsFrom(
        ledger.witness.selections as unknown as EvaluationInput['selections'],
        definitions,
      ),
    });
    const get = () => director.query<Saved>('characters:get', { characterId: nyx });
    assert.equal((await get()).evaluation.status, 'complete', 'legal v103-3 build');
    const sheet = await director.query<HeroSheet>('characters:sheet', { characterId: nyx });
    assert.ok(
      sheet.abilities.some(a => a.name === ledger.ability.name),
      'has Relentless Nemesis',
    );
    await director.mutation('characters:submit', {
      commandId: cid(),
      campaignId,
      characterId: nyx,
    });
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
    const nyxRef = { refKind: 'character', id: nyx };
    const goblinRef = { refKind: 'foe', id: goblin };
    const events = async () =>
      (await director.query<{ events: Event[] }>('events:list', { campaignId })).events;
    const onGoblin = async () =>
      (await director.query<Roster>('table:roster', { campaignId })).foes.find(
        f => f.id === goblin,
      )!.effectInstances;
    const use = async () => {
      await invoke('adjust.heroic-resource', { value: ledger.ability.cost.amount }, nyxRef);
      const used = await invoke(
        'ability.use',
        { ability: ledger.ability.name, targets: [goblinRef] },
        nyxRef,
      );
      assert.equal((await get()).liveState.heroicResource.current, 0, 'paid 3 Discipline');
      return used;
    };
    try {
      await invoke('combat.start');
      await invoke('combat.commit');
      // Both sides are populated, so the opening roll comes before the Director's side choice.
      await invoke('combat.roll');
      await invoke('combat.first', { side: 'heroes' });
      await invoke('turn.take', {}, nyxRef);

      // 1. The use stores the lasting instruction on the goblin, bound to Nyx's next turn start.
      const first = await use();
      const [stored] = await onGoblin();
      assert.ok(stored, 'one active effect on the goblin');
      assert.deepEqual(
        {
          abilityName: stored.abilityName,
          text: stored.text,
          printedDuration: stored.printedDuration,
          endsWhen: stored.endsWhen,
          scheduled: stored.scheduled,
        },
        {
          abilityName: ledger.ability.name,
          text: ledger.ability.instruction,
          printedDuration: ledger.ability.duration,
          endsWhen: ledger.ability.endsWhen,
          scheduled: true,
        },
      );
      assert.deepEqual((await get()).liveState.ownedEffects, [
        { id: stored.id, holder: { kind: 'foe', id: goblin }, abilityId: ledger.ability.id },
      ]);
      const [result] = await director.query<{ compiled: PublicCompiledResult }[]>(
        'abilities:results',
        { campaignId, eventIds: [first.eventId] },
      );
      const riders = result!.compiled.effects.filter(o => o.effect.kind === 'rider');
      assert.deepEqual(
        riders.map(o => o.id),
        [stored.id],
        'the occurrence is the instance identity',
      );
      assert.equal(result!.compiled.definition.source.revision, ledger.sourceRevision);
      assert.ok(result!.compiled.definition.source.path.endsWith(ledger.ability.source));

      // 2. effect.list, read back from its log entry.
      const listed = await invoke('effect.list', { creature: nyxRef });
      const entry = (await events()).find(e => e.id === listed.eventId)!;
      assert.deepEqual(
        (entry.payload!.data!.effects as { id: string }[]).map(e => e.id),
        [stored.id],
        'effect.list for the owner',
      );

      // 3. It ends when Nyx's next turn starts, not before.
      await invoke('turn.end', {}, nyxRef);
      await invoke('turn.take', {}, goblinRef);
      await invoke('turn.end', {}, goblinRef);
      assert.equal((await onGoblin()).length, 1, 'still active before Nyx’s next turn');
      await invoke('turn.take', {}, nyxRef);
      assert.deepEqual(await onGoblin(), [], 'ended at the start of Nyx’s next turn');
      assert.deepEqual((await get()).liveState.ownedEffects, []);
      assert.ok(
        (await events()).some(
          e =>
            e.kind === 'clock.effect-expired' &&
            (e.payload?.data as { effectInstanceId?: string } | undefined)?.effectInstanceId ===
              stored.id,
        ),
        'expiry logged by the clock',
      );

      // 4. effect.end with a reason; undo restores it and redo ends it again.
      await use();
      const [second] = await onGoblin();
      assert.ok(second);
      const ended = await invoke('effect.end', { instance: second.id, note: 'the goblin fled' });
      assert.deepEqual(await onGoblin(), [], 'ended by effect.end');
      const log = (await events()).find(e => e.id === ended.eventId)!;
      assert.equal(log.kind, 'effect.end');
      assert.match(String(log.payload!.data!.reason), /the goblin fled$/);
      await invoke('history.undo');
      assert.deepEqual(
        (await onGoblin()).map(e => [e.id, e.scheduled]),
        [[second.id, true]],
        'undo restores the effect and its schedule',
      );
      await invoke('history.redo');
      assert.deepEqual(await onGoblin(), [], 'redo ends it again');
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
