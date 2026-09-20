// SPDX-License-Identifier: GPL-3.0-only
/** V86 shared API proof: creation rewards must not replay when the effective build changes. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Actor, ScenarioContext } from './character-client.ts';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation.ts';
import type { StartingRewards } from '../../shared/contracts/startingRewards.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';

type Choices = Record<string, SelectionValue>;
type Saved = {
  revision: number;
  effectiveRevisionId: string | null;
  status: string;
  authored: { name: string; appearance: string; biography: string; notes: string };
};
type RewardsView = {
  characterRevision: number;
  originRevisionId: string | null;
  rewards: StartingRewards | null;
  canInitialize: boolean;
  initializationBlocked: string | null;
};
const commandId = () => crypto.randomUUID();
const base = JSON.parse(
  readFileSync(new URL('../../tests/fixtures/v25-fury.json', import.meta.url), 'utf8'),
) as { selections: Choices };
export function rewardChoices(career: 'Artisan' | 'Aristocrat'): Choices {
  const common = Object.fromEntries(
    Object.entries(base.selections).filter(([key]) => !key.startsWith('career.')),
  );
  return {
    ...common,
    'career.choice': career,
    ...(career === 'Artisan'
      ? {
          'career.artisan.skills.1': ['Alchemy', 'Tailoring'],
          'career.artisan.languages': [null],
          'career.artisan.perk': 'Improvisation Creation',
          'career.artisan.inciting-incident': 'Continue the Work',
        }
      : {
          'career.aristocrat.skills.1': 'Lead',
          'career.aristocrat.skills.2': 'History',
          'career.aristocrat.languages': [null],
          'career.aristocrat.perk': 'Eidetic Memory',
          'career.aristocrat.inciting-incident': 'Blood Money',
        }),
    'complication.choice': 'Shattered Legacy',
    'complication.shattered-legacy.language': [null],
    'complication.shattered-legacy.brokenTreasure': 'Grand Scarab',
  };
}
async function save(
  player: Actor,
  characterId: string,
  choices: Choices,
  definitions: DecisionDefinitions,
) {
  const before = await player.query<Saved>('characters:get', { characterId });
  await player.mutation('characters:save', {
    characterId,
    commandId: commandId(),
    expectedRevision: before.revision,
    authored: before.authored,
    selections: draftSelectionsFrom(choices, definitions),
  });
  const after = await player.query<Saved>('characters:get', { characterId });
  assert.equal(after.status, 'complete', 'Reward witness is a complete character');
  return after;
}

export async function runStartingRewards({
  actors: { player, director, peer },
  run,
  runId,
}: ScenarioContext) {
  // Catches reward regrant on approved full edits/restores, broken treasures becoming possessed,
  // missing repair sources, lost provenance, and new reward endpoints leaking to non-owners.
  await run(
    'starting rewards: one award survives approved career edits and restored builds',
    async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const characterId = await player.mutation<string>('characters:create', {
        commandId: commandId(),
        authored: { name: `Reward witness ${runId}`, appearance: '', biography: '', notes: '' },
      });
      await save(player, characterId, rewardChoices('Artisan'), definitions);
      const before = await player.query<RewardsView>('characterRewards:get', { characterId });
      assert.equal(before.rewards, null, 'Drafts do not grant starting rewards');
      assert.equal(before.canInitialize, false);
      const campaignId = await director.mutation<string>('campaigns:create', {
        commandId: commandId(),
        name: `Rewards ${runId}`,
      });
      const { shareCode } = await director.query<{ shareCode: string }>('campaigns:get', {
        campaignId,
      });
      await player.mutation('campaigns:requestJoin', { commandId: commandId(), shareCode });
      const campaign = await director.query<{ pendingRequests: { id: string }[] }>(
        'campaigns:get',
        { campaignId },
      );
      await director.mutation('campaigns:approveRequest', {
        commandId: commandId(),
        requestId: campaign.pendingRequests[0]!.id,
      });
      const approve = async () => {
        await player.mutation('characters:submit', {
          commandId: commandId(),
          characterId,
          campaignId,
        });
        await director.mutation('characters:approve', { commandId: commandId(), characterId });
      };
      await approve();
      const initial = await player.query<RewardsView>('characterRewards:get', { characterId });
      assert.ok(initial.rewards);
      assert.deepEqual(
        [initial.rewards.wealth, initial.rewards.renown, initial.rewards.projectPoints],
        [1, 0, 240],
        'Artisan starting resources match printed career',
      );
      assert.ok(
        initial.rewards.sources.projectPoints.some(path => path.endsWith('/career/artisan.md')),
      );
      assert.equal(initial.rewards.items.length, 1);
      const item = initial.rewards.items[0]!;
      assert.equal(item.name, 'Grand Scarab');
      assert.equal(item.state, 'broken', 'Broken treasure is not usable possession');
      assert.ok(item.sourcePath.endsWith('/grand-scarab.md'));
      assert.ok(item.projectSource, 'Shattered Legacy retains its repair project source');
      assert.deepEqual(
        (await director.query<RewardsView>('characterRewards:get', { characterId })).rewards,
        initial.rewards,
      );
      await assert.rejects(peer.query('characterRewards:get', { characterId }));
      await assert.rejects(
        peer.mutation('characterRewards:initialize', {
          characterId,
          commandId: commandId(),
          expectedCharacterRevision: initial.characterRevision,
          expectedOriginRevisionId: initial.originRevisionId,
        }),
      );
      // A different request cannot replay a grant even when the snapshot already exists.
      const initialized = await player.mutation<StartingRewards>('characterRewards:initialize', {
        characterId,
        commandId: commandId(),
        expectedCharacterRevision: initial.characterRevision,
        expectedOriginRevisionId: initial.originRevisionId,
      });
      assert.deepEqual(initialized, initial.rewards);
      await save(player, characterId, rewardChoices('Aristocrat'), definitions);
      await approve();
      assert.deepEqual(
        (await player.query<RewardsView>('characterRewards:get', { characterId })).rewards,
        initial.rewards,
        'Changed career never grants Wealth or Renown again',
      );
      const current = await player.query<Saved>('characters:get', { characterId });
      await player.mutation('characters:restore', {
        characterId,
        commandId: commandId(),
        expectedRevision: current.revision,
        expectedEffectiveRevisionId: current.effectiveRevisionId,
        sourceRevisionId: initial.originRevisionId,
      });
      await director.mutation('characters:approve', { commandId: commandId(), characterId });
      assert.deepEqual(
        (await player.query<RewardsView>('characterRewards:get', { characterId })).rewards,
        initial.rewards,
        'Restored build preserves exact award identities and amounts',
      );
    },
  );
}
