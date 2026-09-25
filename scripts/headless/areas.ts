// SPDX-License-Identifier: GPL-3.0-only
/**
 * V200 areas and auras through the shared public operations. A Talent's compiled Incinerate stores
 * its column of fire as an area on the Talent with the targeted goblin as its member;
 * `effect.members add` puts a second goblin in (it enters: 2 fire damage), a second add in the same
 * round is refused and a remove-and-add deals nothing more; undo of the add restores its Stamina.
 * Every check reads persisted state back through public queries. Expected values come from the
 * pinned Compendium and the reviewed ledger, never the engine:
 * - feature/ability/talent/level-1/incinerate.md: "Each enemy who enters the area for the first time
 *   in a combat round or starts their turn there takes 2 fire damage"; the column "remains in the
 *   area until the start of your next turn".
 * - tests/fixtures/v105-talent-expected.json v105-2: Incinerate 2 / 4 / 6 fire damage by tier.
 * - monster/goblin/statblock/goblin-warrior.md: Stamina 15, no immunity or weakness.
 * - User rulings (2026-09-25): the table keeps who is in an area, and adding a member is it
 *   entering the area.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type {
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation.ts';
import type { AbilityRollResult } from '../../shared/contracts/rollResolution.ts';
import type { EffectInstance } from '../../shared/contracts/liveState.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type SourceLedger from '../../tests/fixtures/v105-talent-expected.json';
const ledger = JSON.parse(
  readFileSync('tests/fixtures/v105-talent-expected.json', 'utf8'),
) as typeof SourceLedger;
const GOBLIN = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';
const cid = () => crypto.randomUUID();
type Saved = {
  evaluation: EvaluationResult;
  liveState: { effectInstances?: EffectInstance[] } | null;
};
type Roster = {
  foes: {
    id: string;
    health: { stamina?: number };
    effectInstances: { id: string; inArea?: string }[];
  }[];
};
type Event = {
  id: string;
  kind: string;
  causeEventId: string | null;
  payload?: { data?: { result?: AbilityRollResult } & Record<string, unknown> };
};

export async function runAreas({ actors: { director }, run, runId }: ScenarioContext) {
  await run('V200 an area keeps its members; adding one is an enter, once per round', async () => {
    const witness = ledger.witnesses.find(w => w.id === 'v105-2')!;
    const damageByTier = witness.rolledActions.find(a => a.name === 'Incinerate')!.damageByTier;
    const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
      'characterWizard:discover',
      { targetLevel: 1 },
    );
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Areas ${runId}`,
    });
    const seer = await director.mutation<string>('characters:create', {
      commandId: cid(),
      targetLevel: 1,
      authored: { name: `Seer ${runId}`, appearance: '', biography: '', notes: '' },
      selections: draftSelectionsFrom(
        witness.selections as unknown as EvaluationInput['selections'],
        definitions,
      ),
    });
    const get = () => director.query<Saved>('characters:get', { characterId: seer });
    assert.equal((await get()).evaluation.status, 'complete', 'legal v105-2 build');
    await director.mutation('characters:submit', {
      commandId: cid(),
      campaignId,
      characterId: seer,
    });
    const addGoblin = () =>
      director.mutation<string>('foes:add', { commandId: cid(), campaignId, definitionId: GOBLIN });
    const first = await addGoblin();
    const second = await addGoblin();
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
    const seerRef = { refKind: 'character', id: seer };
    const firstRef = { refKind: 'foe', id: first };
    const secondRef = { refKind: 'foe', id: second };
    const events = async () =>
      (await director.query<{ events: Event[] }>('events:list', { campaignId })).events;
    const foe = async (id: string) =>
      (await director.query<Roster>('table:roster', { campaignId })).foes.find(f => f.id === id)!;
    try {
      await invoke('combat.start');
      await invoke('combat.commit');
      await invoke('combat.roll');
      await invoke('combat.first', { side: 'heroes' });
      await invoke('turn.take', {}, seerRef);
      // Clarity 2 is not strained (feature/talent/level-1/clarity-and-strain.md).
      await invoke('adjust.heroic-resource', { value: 2 }, seerRef);

      // 1. The use: the targeted goblin takes its tier's fire damage and is the area's member.
      const use = await invoke(
        'ability.use',
        { ability: 'Incinerate', targets: [firstRef] },
        seerRef,
      );
      const result = (await events()).find(e => e.id === use.eventId)!.payload!.data!.result!;
      const tierDamage = damageByTier[result.targets[0]!.tier - 1]!;
      assert.equal((await foe(first)).health.stamina, 15 - tierDamage, 'tier damage');
      const area = (await get()).liveState!.effectInstances!.find(
        i => i.sourceUseEventId === use.eventId && i.kind === 'area',
      )!;
      assert.equal(area.status, 'active');
      assert.deepEqual(
        area.members!.map(m => m.party.id),
        [first],
        'the target is the first member',
      );
      assert.ok(
        (await foe(first)).effectInstances.some(e => e.inArea),
        'the member holds the riders',
      );

      // 2. The second goblin enters: 2 fire damage, once this round.
      const enter = await invoke('effect.members', { instance: area.id, add: secondRef });
      assert.equal((await foe(second)).health.stamina, 15 - 2, 'enter damage');
      assert.ok(
        (await events()).some(
          e => e.kind === 'effect.watcher-fired' && e.causeEventId === enter.eventId,
        ),
        'the enter rider fired from the add',
      );
      await invoke('effect.members', { instance: area.id, remove: secondRef });
      await invoke('effect.members', { instance: area.id, add: secondRef });
      assert.equal((await foe(second)).health.stamina, 15 - 2, 'not the first time this round');

      // 3. Undo of the re-add, the removal and the add restores the goblin's Stamina.
      await invoke('history.undo');
      await invoke('history.undo');
      await invoke('history.undo');
      assert.equal((await foe(second)).health.stamina, 15, 'undo reverses the enter damage');
      const read = (await get()).liveState!.effectInstances!.find(i => i.id === area.id)!;
      assert.deepEqual(
        read.members!.map(m => m.party.id),
        [first],
        'the add is undone',
      );
      assert.deepEqual(
        (await foe(second)).effectInstances.filter(e => e.inArea),
        [],
        'no rider remains on it',
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
  });
}
