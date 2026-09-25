// SPDX-License-Identifier: GPL-3.0-only
/**
 * V185 build history through the public API and the CLI's helpers (scripts/lib/build-history.ts):
 * admit a Fury, edit its signature ability, list history, read the old revision's full sheet from
 * its recorded build, restore it through Director review and read the new revision back
 * (docs/character-wizard-spec.md#5-progression-history). The abilities come from the two choices
 * themselves (fury-abilities.md "Choose one signature ability"): Brutal Slam, then Hit and Run.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type {
  DerivedBaseline,
  EvaluationResult,
  SelectionValue,
} from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import { historySheet, listHistory, restoreRevision, sheetSummary } from '../lib/build-history.ts';

interface Character {
  revision: number;
  authored: { name: string; appearance: string; biography: string; notes: string };
  selections: DraftSelection[];
  status: string;
  effectiveRevisionId: string | null;
  liveState: Record<string, unknown> | null;
  review: { status: string } | null;
}
interface Discovery {
  selections: DraftSelection[];
  evaluation: EvaluationResult;
  definitions: DecisionDefinitions;
}

export async function runBuildHistory(context: ScenarioContext): Promise<void> {
  const { director, player, peer } = context.actors;
  const commandId = () => crypto.randomUUID();
  const fixture = JSON.parse(
    readFileSync(new URL('../../tests/fixtures/v25-fury.json', import.meta.url), 'utf8'),
  ) as { selections: Record<string, SelectionValue> };
  const privateNote = `History owner-only ${context.runId}`;
  const get = (characterId: string) => player.query<Character>('characters:get', { characterId });
  const approve = (characterId: string) =>
    director.mutation('characters:approve', { commandId: commandId(), characterId });
  const discover = async (selections: Record<string, SelectionValue>) => {
    const { definitions } = await player.query<Discovery>('characterWizard:discover', {
      targetLevel: 1,
    });
    const found = await player.query<Discovery>('characterWizard:discover', {
      selections: draftSelectionsFrom(selections, definitions),
      targetLevel: 1,
    });
    assert.equal(found.evaluation.status, 'complete');
    return found.selections;
  };

  await context.run('history: recorded sheet preview and reviewed restore', async () => {
    const campaignId = await director.mutation<string>('campaigns:create', {
      commandId: commandId(),
      name: `History ${context.runId}`,
    });
    const campaign = await director.query<{ shareCode: string }>('campaigns:get', { campaignId });
    await player.mutation('campaigns:requestJoin', {
      commandId: commandId(),
      shareCode: campaign.shareCode,
    });
    const requests = await director.query<{ pendingRequests: { id: string }[] }>('campaigns:get', {
      campaignId,
    });
    await director.mutation('campaigns:approveRequest', {
      commandId: commandId(),
      requestId: requests.pendingRequests[0]!.id,
    });

    // 1. Create and admit a level-one Fury with Brutal Slam.
    const name = `History Fury ${context.runId}`;
    const authored = { name, appearance: '', biography: '', notes: privateNote };
    const characterId = await player.mutation<string>('characters:create', {
      commandId: commandId(),
      authored,
    });
    await player.mutation('characters:save', {
      commandId: commandId(),
      characterId,
      expectedRevision: 1,
      authored,
      selections: await discover({ ...fixture.selections, 'details.name': name }),
    });
    await player.mutation('characters:submit', { commandId: commandId(), characterId, campaignId });
    await approve(characterId);
    const admitted = await get(characterId);
    const originalId = admitted.effectiveRevisionId!;
    assert.ok(originalId);

    // 2. Edit: swap the signature ability, through Director review.
    await player.mutation('characters:save', {
      commandId: commandId(),
      characterId,
      expectedRevision: admitted.revision,
      expectedEffectiveRevisionId: originalId,
      authored,
      selections: await discover({
        ...fixture.selections,
        'details.name': name,
        'class.fury.signature-ability': 'Hit and Run',
      }),
    });
    await player.mutation('characters:submit', { commandId: commandId(), characterId });
    await approve(characterId);
    const edited = await get(characterId);
    const editedId = edited.effectiveRevisionId!;
    assert.notEqual(editedId, originalId);

    // 3. History lists newest first, for the owner and the Director only.
    const listed = await listHistory(player, characterId);
    assert.equal(listed.page[0]?.id, editedId);
    assert.equal(listed.page[0]?.isEffective, true);
    const original = listed.page.find(entry => entry.id === originalId);
    assert.ok(original, 'the admitted revision is listed');
    assert.match(original.title, new RegExp(`^Revision ${original.revision} · Level 1 · `));
    assert.ok((await listHistory(director, characterId)).page.some(e => e.id === originalId));
    await assert.rejects(() => listHistory(peer, characterId), /unavailable/i);

    // 4. The old revision's sheet is its recorded build, not the current one.
    const recorded = await historySheet(player, characterId, originalId);
    const snapshot = await player.query<{ derivedBaseline: DerivedBaseline }>(
      'characters:historySnapshot',
      { characterId, revisionId: originalId },
    );
    const current = await player.query<HeroSheet>('characters:sheet', { characterId });
    assert.equal(recorded.sheet.build?.label, 'history');
    assert.deepEqual(recorded.sheet.build?.baseline, snapshot.derivedBaseline);
    assert.notDeepEqual(recorded.sheet.build?.baseline, current.build?.baseline);
    const summary = sheetSummary(recorded);
    assert.ok(summary.abilities.includes('Brutal Slam'));
    assert.ok(!summary.abilities.includes('Hit and Run'));
    assert.ok(current.abilities.some(ability => ability.name === 'Hit and Run'));
    assert.deepEqual(recorded.difference.abilities, {
      added: ['Brutal Slam'],
      removed: ['Hit and Run'],
    });
    assert.equal(recorded.sheet.authored.notes, privateNote);
    const directorView = await historySheet(director, characterId, originalId);
    assert.equal(directorView.sheet.audience, 'director');
    assert.equal(JSON.stringify(directorView).includes(privateNote), false);
    await assert.rejects(() => historySheet(peer, characterId, originalId), /unavailable/i);

    // 5. Restore: a new latest revision copying the recorded build, reviewed; live state kept.
    const liveBefore = (await get(characterId)).liveState;
    const restoredId = await restoreRevision(player, characterId, originalId);
    const pending = await get(characterId);
    assert.equal(pending.review?.status, 'pending');
    assert.equal(pending.effectiveRevisionId, editedId);
    await approve(characterId);
    const restored = await get(characterId);
    assert.equal(restored.effectiveRevisionId, restoredId);
    assert.deepEqual(restored.liveState, liveBefore);
    assert.deepEqual(restored.authored, authored);
    const newest = (await listHistory(player, characterId)).page[0]!;
    assert.equal(newest.id, restoredId);
    assert.equal(newest.kind, 'restore');
    assert.equal(newest.restoredFromRevisionId, originalId);
    assert.equal(newest.restoredFromRevision, original.revision);
    assert.equal(newest.title.endsWith(`Restored from revision ${original.revision}`), true);
    const copy = await historySheet(player, characterId, restoredId);
    assert.deepEqual(copy.sheet.build?.baseline, snapshot.derivedBaseline);
    assert.equal(copy.difference.same, true);
  });
}
