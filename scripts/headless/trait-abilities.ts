// SPDX-License-Identifier: GPL-3.0-only
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation.ts';

type RuneState = { rune: string | null; version: number; buildRevisionId: string };
type Saved = {
  authored: { name: string; appearance: string; biography: string; notes: string };
  revision: number;
  selections: DraftSelection[];
  liveState: unknown;
};
export async function runTraitAbilities({
  actors: { player, peer, director },
  run,
  runId,
}: ScenarioContext) {
  await run(
    'trait actions and rune grants persist without editing build or resources',
    async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const base = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
        selections: Record<string, SelectionValue>;
      };
      const choices = { ...base.selections };
      for (const key of Object.keys(choices)) if (key.startsWith('ancestry.')) delete choices[key];
      choices['ancestry.choice'] = 'Dwarf';
      choices['ancestry.dwarf.purchased-traits'] = ['Grounded', 'Stand Tough', 'Stone Singer'];
      const selections = Object.entries(choices)
        .filter(([id]) => !id.startsWith('details.'))
        .map(([decisionId, value]) => {
          const step = definitions.steps.find(s => s.decisions.some(d => d.id === decisionId));
          const decision = step?.decisions.find(d => d.id === decisionId);
          assert.ok(step && decision);
          return {
            decisionId,
            value,
            ownerBranchId: step.id,
            sources: [
              { id: decisionId, path: decision.source, revision: definitions.compendiumRevision },
            ],
          };
        });
      const characterId = await player.mutation<string>('characters:create', {
        commandId: crypto.randomUUID(),
        authored: { name: `Rune proof ${runId}`, appearance: '', biography: '', notes: '' },
        selections,
      });
      const before = await player.query<Saved>('characters:get', { characterId });
      const initialSheet = await player.query<HeroSheet>('characters:sheet', { characterId });
      assert.equal(
        initialSheet.abilities.find(a => a.name === 'Stone Singer')?.metadata.actionType,
        '1 uninterrupted hour',
      );
      const runeNames = [
        'Runic Carving: Detection',
        'Runic Carving: Light',
        'Runic Carving: Voice',
      ];
      assert.equal(
        initialSheet.abilities.some(a => runeNames.includes(a.name)),
        false,
      );
      await assert.rejects(peer.query('characterRunes:current', { characterId }));
      let stale: Record<string, unknown> | undefined;
      for (const rune of ['Detection', 'Light', 'Voice', null]) {
        const current = await player.query<RuneState>('characterRunes:current', { characterId });
        const args = {
          characterId,
          commandId: crypto.randomUUID(),
          expectedVersion: current.version,
          expectedBuildRevisionId: current.buildRevisionId,
          completedTenMinutes: true,
          rune,
        };
        if (!stale) {
          await assert.rejects(
            player.mutation('characterRunes:setActiveRune', {
              ...args,
              completedTenMinutes: false,
            }),
          );
          await assert.rejects(peer.mutation('characterRunes:setActiveRune', args));
          stale = args;
        }
        const version = await player.mutation<number>('characterRunes:setActiveRune', args);
        assert.equal(await player.mutation('characterRunes:setActiveRune', args), version);
        const refreshed = await player.query<RuneState>('characterRunes:current', { characterId });
        assert.equal(refreshed.rune, rune);
        const sheet = await player.query<HeroSheet>('characters:sheet', { characterId });
        assert.deepEqual(
          sheet.abilities.filter(a => runeNames.includes(a.name)).map(a => a.name),
          rune ? [`Runic Carving: ${rune}`] : [],
        );
        if (rune) {
          const ability = sheet.abilities.find(a => a.name === `Runic Carving: ${rune}`)!;
          assert.equal(ability.group, 'maneuver');
          assert.ok(ability.content?.text.includes('one rune active at a time'));
        }
        const saved = await player.query<Saved>('characters:get', { characterId });
        assert.equal(saved.revision, before.revision);
        assert.deepEqual(saved.selections, before.selections);
        assert.deepEqual(saved.liveState, before.liveState);
      }
      await assert.rejects(
        player.mutation('characterRunes:setActiveRune', {
          ...stale,
          commandId: crypto.randomUUID(),
        }),
      );
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: crypto.randomUUID(),
        name: `Rune campaign ${runId}`,
      });
      type Campaign = { shareCode: string; pendingRequests: { id: string; userId: string }[] };
      let campaign = await director.query<Campaign>('campaigns:get', { campaignId });
      await player.mutation('campaigns:requestJoin', {
        commandId: crypto.randomUUID(),
        shareCode: campaign.shareCode,
      });
      campaign = await director.query<Campaign>('campaigns:get', { campaignId });
      const request = campaign.pendingRequests[0]!;
      await director.mutation('campaigns:approveRequest', {
        commandId: crypto.randomUUID(),
        requestId: request.id,
      });
      await player.mutation('characters:submit', {
        characterId,
        campaignId,
        commandId: crypto.randomUUID(),
      });
      await director.mutation('characters:approve', {
        characterId,
        commandId: crypto.randomUUID(),
      });
      await director.mutation('sessions:start', {
        campaignId,
        selectedPlayerIds: [request.userId],
        commandId: crypto.randomUUID(),
      });
      const recipientId = await director.mutation<string>('characters:create', {
        commandId: crypto.randomUUID(),
        authored: { name: `Rune recipient ${runId}`, appearance: '', biography: '', notes: '' },
        selections,
      });
      await director.mutation('characters:submit', {
        characterId: recipientId,
        campaignId,
        commandId: crypto.randomUUID(),
      });
      const current = await player.query<RuneState>('characterRunes:current', { characterId });
      await player.mutation('characterRunes:setActiveRune', {
        characterId,
        rune: 'Voice',
        expectedVersion: current.version,
        expectedBuildRevisionId: current.buildRevisionId,
        completedTenMinutes: true,
        commandId: crypto.randomUUID(),
      });
      const actor = { kind: 'character', id: characterId, name: `Rune proof ${runId}` };
      const table = await player.query<{ abilities: { name: string }[] }>('abilities:sheet', {
        campaignId,
        actor,
      });
      assert.equal(table.abilities.filter(a => a.name === 'Runic Carving: Voice').length, 1);
      await player.mutation('commands:submit', {
        campaignId,
        text: '/history undo',
        commandId: crypto.randomUUID(),
      });
      assert.equal(
        (await player.query<RuneState>('characterRunes:current', { characterId })).rune,
        null,
      );
      await player.mutation('commands:submit', {
        campaignId,
        text: '/history redo',
        commandId: crypto.randomUUID(),
      });
      assert.equal(
        (await player.query<RuneState>('characterRunes:current', { characterId })).rune,
        'Voice',
      );
      const choicesBefore = await player.query<Saved>('characters:get', { characterId });
      await player.mutation('commands:invoke', {
        campaignId,
        operation: 'ability.use',
        actor: { refKind: 'character', id: characterId },
        arguments: {
          ability: 'Runic Carving: Voice',
          targets: [{ refKind: 'character', id: recipientId }],
        },
        commandId: crypto.randomUUID(),
      });
      const after = await player.query<Saved>('characters:get', { characterId });
      assert.deepEqual(after.liveState, choicesBefore.liveState);
    },
  );
}
