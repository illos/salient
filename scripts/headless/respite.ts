// SPDX-License-Identifier: GPL-3.0-only
/**
 * V165 respite loop through authenticated public operations with persisted readback
 * (docs/table-spec.md#respite-mode; rule/resource/respite.md; rule/resource/experience.md).
 * V190: the campaign XP per level set through `campaign.xp-per-level`, then a completed respite's
 * owed level-ups (chapter/making-a-hero.md, Heroic Advancement and Adjusted XP Advancement tables).
 */
import assert from 'node:assert/strict';
import type { ScenarioContext } from './character-client.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import { getDefinitions } from '../../shared/content/character-decisions.ts';
import { levelThreeBuilds } from '../../tests/fixtures/level-three-builds.ts';

type Saved = {
  pendingLevelUps?: number;
  derivedBaseline: {
    kit: { name: { value: string } } | null;
    staminaMaximum: { value: number };
    recoveriesMaximum: { value: number };
  } | null;
  liveState: { stamina: number; recoveries: number; xp: number; victories: number } | null;
};
const cid = () => crypto.randomUUID();

export async function runRespite({ actors: { director }, run, runId }: ScenarioContext) {
  await run(
    'Respite: start, cancel, interrupt and complete persist their effects; XP per level',
    async () => {
      const ids1 = new Set(getDefinitions(1).steps.flatMap(s => s.decisions.map(d => d.id)));
      const build = levelThreeBuilds().find(b => b.className === 'Fury')!;
      const one = Object.fromEntries(
        Object.entries(build.selections).filter(([id]) => ids1.has(id)),
      ) as Record<string, SelectionValue>;
      const definitions = (
        await director.query<{ definitions: DecisionDefinitions }>('characterWizard:discover', {
          targetLevel: 1,
        })
      ).definitions;
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: cid(),
        name: `Respite ${runId}`,
      });
      const characterId = await director.mutation<string>('characters:create', {
        commandId: cid(),
        targetLevel: 1,
        authored: { name: `Rester ${runId}`, appearance: '', biography: '', notes: '' },
        selections: draftSelectionsFrom(one, definitions),
      });
      await director.mutation('characters:submit', { commandId: cid(), campaignId, characterId });
      const sessionId = await director.mutation<string>('sessions:start', {
        commandId: cid(),
        campaignId,
        selectedPlayerIds: [],
      });
      const get = () => director.query<Saved>('characters:get', { characterId });
      const invoke = (operation: string, args: Record<string, unknown> = {}, actor = false) =>
        director.mutation<{ eventId: string }>('commands:invoke', {
          campaignId,
          commandId: cid(),
          operation,
          ...(actor ? { actor: { refKind: 'character', id: characterId } } : {}),
          arguments: args,
        });
      const adjust = (field: string, value: number) => invoke(`adjust.${field}`, { value }, true);
      try {
        const max = (await get()).derivedBaseline!;
        await adjust('stamina', 10);
        await adjust('recoveries', 2);
        await adjust('victories', 16);

        // Cancel: the state before the respite returns, including a respite kit change (V166).
        const before = (await get()).liveState;
        const kitBefore = (await get()).derivedBaseline!.kit?.name.value;
        const kitAfter = kitBefore === 'Panther' ? 'Mountain' : 'Panther';
        await invoke('respite.start');
        await adjust('stamina', 5);
        await invoke(
          'respite.change-kit',
          { selections: [{ decisionId: 'kit.choice', value: kitAfter }] },
          true,
        );
        assert.equal((await get()).derivedBaseline!.kit?.name.value, kitAfter);
        const open = await director.query<{
          respite: { activities: { characterId: string; activity: string | null }[] } | null;
        }>('sessions:get', { sessionId });
        assert.deepEqual(open.respite?.activities, [
          { characterId, activity: 'Change kit', all: ['Change kit'], unused: 0 },
        ]);
        await invoke('respite.cancel');
        assert.equal((await get()).derivedBaseline!.kit?.name.value, kitBefore);
        assert.deepEqual((await get()).liveState, before);

        // Interrupt: what happened stands, no benefits.
        await invoke('respite.start');
        const session = await director.query<{
          revision: number;
          respite: { participants: string[] } | null;
        }>('sessions:get', { sessionId });
        assert.deepEqual(session.respite?.participants, [characterId]);
        await assert.rejects(
          director.mutation('sessions:transition', {
            sessionId,
            expectedRevision: session.revision,
            action: 'close',
            voidMode: 'keep',
            commandId: cid(),
          }),
          /A respite is open/,
        );
        await adjust('stamina', 8);
        await invoke('respite.interrupt');
        const interrupted = (await get()).liveState!;
        assert.equal(interrupted.stamina, 8);
        assert.equal(interrupted.victories, 16);
        assert.equal(interrupted.xp, 0);

        // Complete: full Stamina and Recoveries, Victories to XP, one level-up for 16 XP.
        await invoke('respite.start');
        await invoke('respite.complete');
        const done = await get();
        assert.equal(done.liveState!.stamina, max.staminaMaximum.value);
        assert.equal(done.liveState!.recoveries, max.recoveriesMaximum.value);
        assert.equal(done.liveState!.xp, 16);
        assert.equal(done.liveState!.victories, 0);
        assert.equal(done.pendingLevelUps, 1);

        // V190: double speed (8). 17 XP is 3rd level (Adjusted XP Advancement, 16-23): one more owed.
        await assert.rejects(invoke('campaign.xp-per-level', { value: 0 }), /whole number from 1/);
        await invoke('campaign.xp-per-level', { value: 8 });
        assert.equal((await get()).pendingLevelUps, 1, 'the setting alone grants nothing');
        await adjust('victories', 1);
        await invoke('respite.start');
        await invoke('respite.complete');
        const faster = await get();
        assert.equal(faster.liveState!.xp, 17);
        assert.equal(faster.pendingLevelUps, 2);
        // Half speed (32) removes nothing: 17 XP is 1st level there, yet both pending level-ups stay.
        await invoke('campaign.xp-per-level', { value: 32 });
        await invoke('respite.start');
        await invoke('respite.complete');
        assert.equal((await get()).pendingLevelUps, 2);
        const sheet = await director.query<{
          xpProgress: { xpPerLevel: number; next: { level: number; at: number } | null } | null;
        }>('characters:sheet', { characterId });
        assert.deepEqual(sheet.xpProgress?.next, { level: 2, at: 32 });
        assert.equal(sheet.xpProgress?.xpPerLevel, 32);
      } finally {
        // Close cleanly without masking a failure: end any open respite first, ignore cleanup errors.
        try {
          const session = await director.query<{ revision: number; respite: unknown }>(
            'sessions:get',
            { sessionId },
          );
          if (session.respite) await invoke('respite.interrupt');
          const latest = await director.query<{ revision: number }>('sessions:get', { sessionId });
          await director.mutation('sessions:transition', {
            sessionId,
            expectedRevision: latest.revision,
            action: 'close',
            voidMode: 'keep',
            commandId: cid(),
          });
        } catch {
          // The scenario's own assertion (if any) is the failure worth reporting.
        }
      }
    },
  );
}
