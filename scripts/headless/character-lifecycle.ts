// SPDX-License-Identifier: GPL-3.0-only
/** Live lifecycle witnesses; public authenticated operations only, no database fixtures. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext, Actor } from './character-client.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';
import type {
  EvaluationResult,
  SelectionValue,
} from '../../shared/contracts/characterEvaluation.ts';
import type { HeroSheet } from '../../shared/contracts/characterSheet.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';

type Authored = { name: string; appearance: string; biography: string; notes: string };
interface Character {
  revision: number;
  authored: Authored;
  selections: DraftSelection[];
  status: string;
  level: number;
  combatLocked: boolean;
  campaignId: string | null;
  effectiveRevisionId: string | null;
  liveState: Record<string, unknown> | null;
  review: { status: string } | null;
  evaluation: EvaluationResult;
}
interface Discovery {
  selections: DraftSelection[];
  evaluation: EvaluationResult;
  definitions: DecisionDefinitions;
}
interface Campaign {
  shareCode: string;
  pendingRequests: { id: string; userId: string }[];
}
interface Progression {
  revision: number;
  baseRevisionId: string | null;
  baseLevel: number;
  newDecisionIds: string[];
  draft: { version: number; selections: DraftSelection[] } | null;
}
interface HistoryPage {
  page: { id: string; level: number }[];
  continueCursor: string;
  isDone: boolean;
}
interface Inheritance {
  characterRevision: number;
  buildRevisionId: string;
  version: number;
}

export async function runLifecycle(context: ScenarioContext): Promise<void> {
  const { director, player, peer } = context.actors;
  const commandId = () => crypto.randomUUID();
  const fixture = JSON.parse(
    readFileSync(new URL('../../tests/fixtures/v25-fury.json', import.meta.url), 'utf8'),
  ) as {
    selections: Record<string, SelectionValue>;
  };
  let campaignId = '';
  let characterId = '';
  let originalRevisionId = '';
  let advancedRevisionId = '';
  let originalSnapshot: unknown;
  let playerUserId = '';
  let sessionStarted = false;
  const privateNote = `Lifecycle owner-only ${context.runId}`;
  const get = (actor: Actor, id = characterId) =>
    actor.query<Character>('characters:get', { characterId: id });
  const sheet = (actor: Actor, id = characterId) =>
    actor.query<HeroSheet>('characters:sheet', { characterId: id });
  const definitionsByLevel = new Map<number, DecisionDefinitions>();
  const discover = async (selections: Record<string, SelectionValue>, targetLevel = 1) => {
    let definitions = definitionsByLevel.get(targetLevel);
    if (!definitions) {
      definitions = (await player.query<Discovery>('characterWizard:discover', { targetLevel }))
        .definitions;
      definitionsByLevel.set(targetLevel, definitions);
    }
    return player.query<Discovery>('characterWizard:discover', {
      selections: draftSelectionsFrom(selections, definitions),
      targetLevel,
    });
  };
  const create = async (
    name: string,
    extra: Record<string, SelectionValue> = {},
    owner: Actor = player,
  ) => {
    const authored = { name, appearance: '', biography: '', notes: privateNote };
    const canonical = await discover({ ...fixture.selections, ...extra, 'details.name': name });
    assert.equal(canonical.evaluation.status, 'complete');
    const id = await owner.mutation<string>('characters:create', {
      commandId: commandId(),
      authored,
    });
    await owner.mutation('characters:save', {
      commandId: commandId(),
      characterId: id,
      expectedRevision: 1,
      authored,
      selections: canonical.selections,
    });
    const saved = await get(owner, id);
    assert.equal(saved.status, 'complete');
    assert.deepEqual(saved.selections, canonical.selections);
    return id;
  };
  const submit = (id: string) =>
    player.mutation('characters:submit', {
      commandId: commandId(),
      characterId: id,
      campaignId,
    });
  const approve = (id: string) =>
    director.mutation('characters:approve', {
      commandId: commandId(),
      characterId: id,
    });
  const adjust = (field: string, value: number) =>
    director.mutation('commands:invoke', {
      campaignId,
      commandId: commandId(),
      operation: `adjust.${field}`,
      actor: { refKind: 'character', id: characterId },
      arguments: { value },
    });

  // Failure caught: unreviewed admission or excessive peer/Director access to owner data.
  const admitted = await context.run('lifecycle: admission and audience privacy', async () => {
    campaignId = await director.mutation<string>('campaigns:create', {
      commandId: commandId(),
      name: `Lifecycle ${context.runId}`,
    });
    for (const actor of [player, peer]) {
      const campaign = await director.query<Campaign>('campaigns:get', { campaignId });
      await actor.mutation('campaigns:requestJoin', {
        commandId: commandId(),
        shareCode: campaign.shareCode,
      });
      const pending = await director.query<Campaign>('campaigns:get', { campaignId });
      assert.equal(pending.pendingRequests.length, 1);
      const request = pending.pendingRequests[0]!;
      if (actor === player) playerUserId = request.userId;
      await director.mutation('campaigns:approveRequest', {
        commandId: commandId(),
        requestId: request.id,
      });
    }
    characterId = await create(`Lifecycle Fury ${context.runId}`);
    await submit(characterId);
    const pending = await get(player);
    assert.equal(pending.review?.status, 'pending');
    assert.equal(pending.campaignId, null);
    await assert.rejects(() => peer.query('characters:get', { characterId }), /unavailable/i);
    await player.mutation('characters:withdraw', { characterId, commandId: commandId() });
    assert.equal((await get(player)).review?.status, 'withdrawn');
    await submit(characterId);
    await director.mutation('characters:decline', { characterId, commandId: commandId() });
    assert.equal((await get(player)).review?.status, 'declined');
    await submit(characterId);
    await approve(characterId);
    const saved = await get(player);
    assert.equal(saved.campaignId, campaignId);
    assert.ok(saved.effectiveRevisionId);
    originalRevisionId = saved.effectiveRevisionId;
    assert.equal(saved.liveState?.stamina, 30);
    const directorSheet = await sheet(director);
    assert.equal(JSON.stringify(directorSheet).includes(privateNote), false);
    const peerSheet = await peer.query<Record<string, unknown>>('characters:sheet', {
      characterId,
    });
    assert.equal(peerSheet.audience, 'peer');
    assert.equal('build' in peerSheet, false);
    assert.equal('authored' in peerSheet, false);
    assert.deepEqual(peerSheet.live, { stamina: 30, recoveries: 10 });
    originalSnapshot = await player.query('characters:historySnapshot', {
      characterId,
      revisionId: originalRevisionId,
    });
  });

  // Independent hero: a private Director grant must block activation, never leak to owner/peer.
  if (!admitted)
    context.skip('lifecycle: private inheritance', 'Campaign/admission prerequisite failed.');
  else
    await context.run('lifecycle: private inheritance', async () => {
      const id = await create(`Lifecycle heir ${context.runId}`, {
        'complication.choice': 'Strange Inheritance',
      });
      await submit(id);
      await assert.rejects(() => approve(id), /privately choose/i);
      assert.equal((await get(player, id)).review?.status, 'pending');
      const setup = await director.query<Inheritance | null>('characterSecrets:inheritance', {
        characterId: id,
        view: 'proposed',
      });
      assert.ok(setup);
      await director.mutation('characterSecrets:saveInheritance', {
        characterId: id,
        commandId: commandId(),
        itemName: 'Bastion Belt',
        expectedView: 'proposed',
        expectedCampaignId: campaignId,
        expectedCharacterRevision: setup.characterRevision,
        expectedBuildRevisionId: setup.buildRevisionId,
        expectedVersion: setup.version,
      });
      assert.equal(await player.query('characterSecrets:inheritance', { characterId: id }), null);
      assert.equal(await peer.query('characterSecrets:inheritance', { characterId: id }), null);
      await approve(id);
      assert.equal((await get(player, id)).campaignId, campaignId);
      const retained = await director.query('characterSecrets:inheritance', { characterId: id });
      assert.ok(JSON.stringify(retained).includes('Bastion Belt'));
      assert.equal(JSON.stringify(await sheet(player, id)).includes('Bastion Belt'), false);
      assert.equal(
        JSON.stringify(await peer.query('characters:sheet', { characterId: id })).includes(
          'Bastion Belt',
        ),
        false,
      );
    });

  let advanced = false;
  if (!admitted)
    context.skip(
      'lifecycle: Fury progression preserves live values',
      'Admitted Fury prerequisite failed.',
    );
  else
    advanced = await context.run('lifecycle: Fury progression preserves live values', async () => {
      await director.mutation('sessions:start', {
        commandId: commandId(),
        campaignId,
        selectedPlayerIds: [playerUserId],
      });
      sessionStarted = true;
      for (const [field, value] of [
        ['xp', 16],
        ['stamina', 20],
        ['recoveries', 4],
        ['heroic-resource', 3],
      ] as const)
        await adjust(field, value);
      const before = await get(player);
      assert.equal(before.liveState?.xp, 16);
      assert.equal(before.liveState?.stamina, 20);
      assert.equal(before.liveState?.recoveries, 4);
      assert.deepEqual(before.liveState?.heroicResource, { name: 'ferocity', current: 3 });
      const progression = await player.query<Progression>('characters:progression', {
        characterId,
      });
      assert.equal(progression.baseLevel, 1);
      assert.ok(progression.baseRevisionId);
      const canonical = await discover(
        {
          ...fixture.selections,
          'class.fury.level-2.perk': 'Danger Sense',
          'class.fury.level-2.aspect-ability': 'Wrecking Ball',
        },
        2,
      );
      const selections = canonical.selections.filter(selection =>
        progression.newDecisionIds.includes(selection.decisionId),
      );
      const base = {
        characterId,
        expectedRevision: progression.revision,
        expectedBaseRevisionId: progression.baseRevisionId,
      };
      const version = await player.mutation<number>('characters:saveAdvancement', {
        ...base,
        commandId: commandId(),
        expectedDraftVersion: progression.draft?.version ?? 0,
        selections,
      });
      const persisted = await player.query<Progression>('characters:progression', { characterId });
      assert.equal(persisted.draft?.version, version);
      assert.deepEqual(persisted.draft?.selections, selections);
      advancedRevisionId = await player.mutation<string>('characters:finalizeAdvancement', {
        ...base,
        commandId: commandId(),
        expectedDraftVersion: version,
        duringRespite: true,
      });
      const after = await get(player);
      assert.equal(after.effectiveRevisionId, advancedRevisionId);
      assert.equal(after.level, 2);
      assert.equal(after.evaluation.baseline?.staminaMaximum.value, 39);
      assert.equal(after.evaluation.baseline?.recoveryValue.value, 13);
      // Q-CHAR-2 revised: the 10 damage taken stays as the maximum rises (20/30 → 29/39).
      assert.deepEqual(after.liveState, { ...before.liveState, stamina: 29 });
      assert.ok(
        after.evaluation.baseline?.abilities.some(ability => ability.name === 'Wrecking Ball'),
      );
    });

  // Failure caught: history exposure/mutation, or restore bypassing exact-build Director review.
  if (!advanced)
    context.skip(
      'lifecycle: paginated history and reviewed restoration',
      'Completed level-two advancement prerequisite failed.',
    );
  else
    await context.run('lifecycle: paginated history and reviewed restoration', async () => {
      const first = await player.query<HistoryPage>('characters:history', {
        characterId,
        paginationOpts: { numItems: 1, cursor: null },
      });
      assert.equal(first.page[0]?.id, advancedRevisionId);
      assert.equal(first.isDone, false);
      const second = await director.query<HistoryPage>('characters:history', {
        characterId,
        paginationOpts: { numItems: 1, cursor: first.continueCursor },
      });
      assert.equal(second.page[0]?.id, originalRevisionId);
      await assert.rejects(
        () =>
          peer.query('characters:history', {
            characterId,
            paginationOpts: { numItems: 1, cursor: null },
          }),
        /unavailable/i,
      );
      await assert.rejects(
        () =>
          peer.query('characters:historySnapshot', {
            characterId,
            revisionId: originalRevisionId,
          }),
        /unavailable/i,
      );
      const directorSnapshot = await director.query('characters:historySnapshot', {
        characterId,
        revisionId: originalRevisionId,
      });
      assert.equal(JSON.stringify(directorSnapshot).includes(privateNote), false);
      await adjust('stamina', 39);
      const before = await get(player);
      const restoredId = await player.mutation<string>('characters:restore', {
        characterId,
        commandId: commandId(),
        sourceRevisionId: originalRevisionId,
        expectedRevision: before.revision,
        expectedEffectiveRevisionId: advancedRevisionId,
      });
      const pending = await get(player);
      assert.equal(pending.effectiveRevisionId, advancedRevisionId);
      assert.equal(pending.review?.status, 'pending');
      assert.equal(pending.liveState?.stamina, 39);
      await approve(characterId);
      const restored = await get(player);
      assert.equal(restored.effectiveRevisionId, restoredId);
      assert.equal(restored.level, 1);
      assert.equal(restored.liveState?.stamina, 30);
      assert.equal(restored.liveState?.xp, 16);
      assert.equal(restored.liveState?.recoveries, 4);
      assert.deepEqual(restored.liveState?.heroicResource, { name: 'ferocity', current: 3 });
      // activationPreview depends on present live state, so compare immutable snapshot fields only.
      const afterSnapshot = await player.query<Record<string, unknown>>(
        'characters:historySnapshot',
        { characterId, revisionId: originalRevisionId },
      );
      const beforeSnapshot = originalSnapshot as Record<string, unknown>;
      for (const key of ['selections', 'evaluation', 'derivedBaseline'])
        assert.deepEqual(afterSnapshot[key], beforeSnapshot[key]);
    });

  if (!admitted)
    context.skip(
      'lifecycle: owning Director activation and inheritance',
      'Campaign prerequisite failed.',
    );
  else
    await context.run('lifecycle: owning Director activation and inheritance', async () => {
      const ownId = await create(`Director Fury ${context.runId}`, {}, director);
      await director.mutation('characters:submit', {
        characterId: ownId,
        campaignId,
        commandId: commandId(),
      });
      const activated = await get(director, ownId);
      assert.equal(activated.campaignId, campaignId);
      assert.equal(activated.review?.status, 'logged');
      assert.ok(activated.effectiveRevisionId);
      assert.equal(activated.liveState?.stamina, 30);

      const heirId = await create(
        `Director heir ${context.runId}`,
        { 'complication.choice': 'Strange Inheritance' },
        director,
      );
      await assert.rejects(
        () =>
          director.mutation('characters:submit', {
            characterId: heirId,
            campaignId,
            commandId: commandId(),
          }),
        /privately choose/i,
      );
      const beforeSetup = await get(director, heirId);
      assert.equal(beforeSetup.campaignId, null);
      assert.equal(beforeSetup.review, null);
      const setup = await director.query<Inheritance | null>('characterSecrets:inheritance', {
        characterId: heirId,
        view: 'draft',
        campaignId,
      });
      assert.ok(setup);
      await director.mutation('characterSecrets:saveInheritance', {
        characterId: heirId,
        commandId: commandId(),
        itemName: 'Bastion Belt',
        expectedView: 'draft',
        expectedCampaignId: campaignId,
        expectedCharacterRevision: setup.characterRevision,
        expectedBuildRevisionId: setup.buildRevisionId,
        expectedVersion: setup.version,
      });
      await director.mutation('characters:submit', {
        characterId: heirId,
        campaignId,
        commandId: commandId(),
      });
      const heir = await get(director, heirId);
      assert.equal(heir.campaignId, campaignId);
      assert.equal(heir.review?.status, 'logged');
      const retained = await director.query<Inheritance & { item: { name: string } | null }>(
        'characterSecrets:inheritance',
        { characterId: heirId },
      );
      assert.equal(retained.item?.name, 'Bastion Belt');
      assert.equal(
        await player.query('characterSecrets:inheritance', { characterId: heirId }),
        null,
      );
    });

  // Same-owner cross-character IDs must fail independently of audience checks.
  if (!admitted)
    context.skip(
      'lifecycle: foreign history and owner-only restoration',
      'Admitted Fury prerequisite failed.',
    );
  else
    await context.run('lifecycle: foreign history and owner-only restoration', async () => {
      const otherId = await create(`Other Fury ${context.runId}`);
      const current = await get(player);
      const other = await get(player, otherId);
      assert.ok(current.effectiveRevisionId);
      await assert.rejects(
        () =>
          player.query('characters:historySnapshot', {
            characterId: otherId,
            revisionId: originalRevisionId,
          }),
        /Historical build unavailable/i,
      );
      await assert.rejects(
        () =>
          player.mutation('characters:restore', {
            characterId: otherId,
            commandId: commandId(),
            sourceRevisionId: originalRevisionId,
            expectedRevision: other.revision,
            expectedEffectiveRevisionId: other.effectiveRevisionId,
          }),
        /Historical build unavailable/i,
      );
      for (const actor of [director, peer])
        await assert.rejects(
          () =>
            actor.mutation('characters:restore', {
              characterId,
              commandId: commandId(),
              sourceRevisionId: originalRevisionId,
              expectedRevision: current.revision,
              expectedEffectiveRevisionId: current.effectiveRevisionId,
            }),
          /Character unavailable/i,
        );
      assert.deepEqual(await get(player, otherId), other);
      assert.deepEqual(await get(player), current);
    });

  // Ordinary saved edits keep the campaign build/live state until the latest exact revision is approved.
  if (!admitted)
    context.skip(
      'lifecycle: full-edit stale review and preserved live state',
      'Admitted Fury prerequisite failed.',
    );
  else
    await context.run('lifecycle: full-edit stale review and preserved live state', async () => {
      const before = await get(player);
      const saveEdit = (current: Character, biography: string) =>
        player.mutation('characters:save', {
          characterId,
          commandId: commandId(),
          expectedRevision: current.revision,
          expectedEffectiveRevisionId: current.effectiveRevisionId,
          authored: { ...current.authored, biography },
          selections: current.selections,
        });
      await saveEdit(before, 'First lifecycle revision');
      await submit(characterId);
      const first = await get(player);
      assert.equal(first.review?.status, 'pending');
      assert.equal(first.effectiveRevisionId, before.effectiveRevisionId);
      assert.deepEqual(first.liveState, before.liveState);
      await saveEdit(first, 'Second lifecycle revision');
      const second = await get(player);
      assert.equal(second.review?.status, 'stale');
      await assert.rejects(() => approve(characterId), /awaiting review|changed|stale/i);
      assert.equal((await get(player)).effectiveRevisionId, before.effectiveRevisionId);
      await submit(characterId);
      await approve(characterId);
      const after = await get(player);
      assert.notEqual(after.effectiveRevisionId, before.effectiveRevisionId);
      assert.equal(after.authored.biography, 'Second lifecycle revision');
      assert.deepEqual(after.liveState, before.liveState);
      assert.equal(after.evaluation.baseline?.level.value, before.evaluation.baseline?.level.value);
    });
  if (!admitted || !sessionStarted)
    context.skip(
      'lifecycle: combat edit lock',
      'Admitted Fury and running-session prerequisites failed.',
    );
  else
    await context.run('lifecycle: combat edit lock', async () => {
      // The existing public combat setup includes admitted heroes; committing alone
      // locks them, even when the empty opposing side requires later adjudication.
      for (const operation of ['combat.start', 'combat.commit'])
        await director.mutation('commands:invoke', {
          campaignId,
          commandId: commandId(),
          operation,
          arguments: {},
        });
      const locked = await get(player);
      assert.equal(locked.combatLocked, true);
      await assert.rejects(
        () =>
          player.mutation('characters:save', {
            characterId,
            commandId: commandId(),
            expectedRevision: locked.revision,
            authored: { ...locked.authored, biography: 'Must not save during combat' },
            selections: locked.selections,
          }),
        /locked during combat/i,
      );
      await assert.rejects(
        () =>
          player.mutation('characters:restore', {
            characterId,
            commandId: commandId(),
            expectedRevision: locked.revision,
            expectedEffectiveRevisionId: locked.effectiveRevisionId,
            sourceRevisionId: originalRevisionId,
          }),
        /locked during combat/i,
      );
      const progression = await player.query<Progression>('characters:progression', {
        characterId,
      });
      assert.ok(progression.baseRevisionId);
      await assert.rejects(
        () =>
          player.mutation('characters:saveAdvancement', {
            characterId,
            commandId: commandId(),
            expectedRevision: locked.revision,
            expectedBaseRevisionId: progression.baseRevisionId,
            expectedDraftVersion: progression.draft?.version ?? 0,
            selections: [],
          }),
        /locked during combat/i,
      );
      assert.deepEqual(await get(player), locked);
    });
}
