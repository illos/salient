// SPDX-License-Identifier: GPL-3.0-only
/**
 * V119 grabs and the common maneuvers through the shared public operations with real campaign dice
 * and persisted readback. Expected values come from the pinned sources cited below.
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
import type { TargetRollOutcome } from '../../shared/contracts/rollResolution.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';

type Witness = { id: string; selections: Record<string, unknown> };
const witnesses = (
  JSON.parse(readFileSync('tests/fixtures/v109-riders-expected.json', 'utf8')) as {
    witnesses: Witness[];
  }
).witnesses;
const cid = () => crypto.randomUUID();
type Live = {
  conditions?: Record<string, boolean>;
  conditionInstances?: {
    id: string;
    condition: string;
    status: string;
    duration: string;
    sourceActorId?: string;
    registrationId?: string;
  }[];
};
type Saved = { evaluation: EvaluationResult; liveState: Live };
type Result = { compiled?: PublicCompiledResult; targets: { outcome: TargetRollOutcome }[] };
type Event = { id: string; description: string };

export async function runGrab({ actors: { director }, run, runId }: ScenarioContext) {
  await run('V119 grabs, Escape Grab and Stand Up persist with real dice', async () => {
    const { definitions } = await director.query<{ definitions: DecisionDefinitions }>(
      'characterWizard:discover',
      { targetLevel: 1 },
    );
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: cid(),
      name: `Grab ${runId}`,
    });
    const get = (characterId: string) => director.query<Saved>('characters:get', { characterId });
    const pick = (id: string) =>
      structuredClone(
        witnesses.find(w => w.id === id)!.selections,
      ) as EvaluationInput['selections'];
    const admit = async (name: string, selections: EvaluationInput['selections']) => {
      const id = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `${name} ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(selections, definitions),
      });
      assert.equal((await get(id)).evaluation.status, 'complete', `${name} legal build`);
      await director.mutation('characters:submit', {
        commandId: cid(),
        campaignId,
        characterId: id,
      });
      return id;
    };
    // feature/ability/null/level-1/joint-lock.md: "A < WEAK/AVERAGE/STRONG, grabbed" after damage.
    // The V109 Null witness (v103-2) has Joint Lock; its highest characteristic 2 gives potencies
    // 0/1/2 (rule/character/potency.md). The target's A −1 is below all of them, and both are 1M
    // heroes, so the grab is always allowed (condition/grabbed.md).
    const grappler = await admit('Grappler', pick('v103-2'));
    const low = pick('v104-4');
    low['class.elementalist.characteristic-array'] = '2, 2, −1, −1';
    low['class.elementalist.array-assignment'] = {
      Might: 2,
      Agility: -1,
      Intuition: 2,
      Presence: -1,
    };
    const target = await admit('Held', low);
    assert.equal((await get(target)).evaluation.baseline!.characteristics.A.value, -1);
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
    const result = async (eventId: string) =>
      (
        await director.query<Result[]>('abilities:results', { campaignId, eventIds: [eventId] })
      )[0]!;
    const describe = async (eventId: string) =>
      (await director.query<{ events: Event[] }>('events:list', { campaignId })).events.find(
        e => e.id === eventId,
      )!.description;
    const active = async (condition: string) =>
      ((await get(target)).liveState.conditionInstances ?? []).filter(
        i => i.status === 'active' && i.condition === condition,
      );
    try {
      await invoke('combat.start');
      await invoke('combat.commit');

      const lock = await invoke(
        'ability.use',
        { ability: 'Joint Lock', targets: [{ refKind: 'character', id: target }] },
        grappler,
      );
      const grab = (await result(lock.eventId)).compiled!.effects.find(
        o => o.effect.kind === 'condition',
      )!;
      assert.equal(grab.effect.kind === 'condition' && grab.effect.status, 'applied');
      const held = await active('grabbed');
      assert.equal(held.length, 1);
      assert.equal(held[0]!.duration, 'none');
      assert.equal(held[0]!.sourceActorId, grappler);
      assert.equal(held[0]!.registrationId, undefined);
      // condition/grabbed.md: a grab ends by release, Escape Grab or separation, not Stand Up.
      const grabLog = (
        await director.query<{
          events: (Event & { kind: string; payload?: { sourceUseEventId?: string } })[];
        }>('events:list', { campaignId })
      ).events.find(
        e => e.kind === 'condition.potency' && e.payload?.sourceUseEventId === lock.eventId,
      )!;
      assert.match(grabLog.description, /grabber releases it, the creature escapes/);
      assert.doesNotMatch(grabLog.description, /stands up/);

      // feature/ability/common/escape-grab.md: equal sizes take no bane; tier 3 ends the grab,
      // tier 2 leaves the choice to the table, tier 1 does nothing.
      const escape = await invoke('ability.use', { ability: 'Escape Grab' }, target);
      const tier = (await result(escape.eventId)).targets[0]!.outcome.tier;
      const text = await describe(escape.eventId);
      assert.doesNotMatch(text, /takes a bane/);
      assert.equal((await get(target)).liveState.conditions?.grabbed, tier !== 3);
      if (tier === 2) assert.match(text, /can first make a melee free strike/);
      if (tier === 1) assert.match(text, /No effect/);
      if (tier !== 3) await invoke('condition.off', { name: 'grabbed' }, target);
      assert.equal((await active('grabbed')).length, 0);

      // feature/common/maneuvers/stand-up.md: Stand Up ends prone.
      await invoke('condition.on', { name: 'prone' }, target);
      await invoke('ability.use', { ability: 'Stand Up' }, target);
      assert.equal((await get(target)).liveState.conditions?.prone, false);
      await assert.rejects(invoke('ability.use', { ability: 'Stand Up' }, target), /not prone/);
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
  });
}
