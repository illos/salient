// SPDX-License-Identifier: GPL-3.0-only
/** V96 working-draft lifecycle and two-kit grid through shared public operations. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { CharacterAuthored, DraftSelection } from '../../shared/characterDraft.ts';
import type { EvaluationInput } from '../../shared/contracts/characterEvaluation.ts';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions.ts';
import { draftSelectionsFrom } from '../../shared/evaluate/draft.ts';

const ledger = JSON.parse(readFileSync('tests/fixtures/v94-tactician-expected.json', 'utf8')) as {
  witnesses: { selections: EvaluationInput['selections'] }[];
};
type Saved = {
  revision: number;
  authored: CharacterAuthored;
  selections: DraftSelection[];
  wizardDraft: boolean;
  fullEditIsStale: boolean;
};
const commandId = () => crypto.randomUUID();
const primary = 'kit.choice';
const secondary = 'class.tactician.second-kit';
const values = (saved: { selections: DraftSelection[] }) =>
  Object.fromEntries(saved.selections.map(choice => [choice.decisionId, choice.value]));

export async function runWizardDraft({ actors: { player, peer }, run, runId }: ScenarioContext) {
  await run(
    'wizard draft: create, resume, owner scope, kit grid and explicit listing persist',
    async () => {
      const readList = () => player.query<{ id: string }[]>('characters:listMine', {});
      const listedBefore = (await readList()).map(row => row.id).sort();
      assert.equal(await player.query('characters:wizardDraft', {}), null);
      const peerDraftBefore = await peer.query('characters:wizardDraft', {});
      const peerListBefore = await peer.query('characters:listMine', {});
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      // The independent V94 ledger supplies the complete Human/Tactician background.
      // Field Arsenal (feature/tactician/level-1/field-arsenal.md, "Field Arsenal")
      // grants two kits and explicitly recommends Shining Armor + Sniper. No new maths here.
      const initial = { ...ledger.witnesses[0].selections };
      delete initial[primary];
      delete initial[secondary];
      delete initial['details.name'];
      const create = {
        commandId: commandId(),
        wizardDraft: true,
        authored: { name: '', appearance: '', biography: '', notes: `working draft ${runId}` },
        selections: draftSelectionsFrom(initial, definitions),
      };
      const id = await player.mutation<string>('characters:create', create);
      const read = () => player.query<Saved>('characters:get', { characterId: id });
      assert.equal(
        await player.mutation('characters:create', create),
        id,
        'create retry is idempotent',
      );
      let saved = await read();
      assert.equal(saved.revision, 1);
      assert.equal(saved.wizardDraft, true);
      assert.equal(saved.authored.name, '');
      assert.deepEqual(saved.selections, create.selections);
      assert.equal(
        await player.query('characters:wizardDraft', {}),
        id,
        'resume finds original draft',
      );
      assert.deepEqual((await readList()).map(row => row.id).sort(), listedBefore);
      await assert.rejects(
        player.mutation('characters:create', { ...create, commandId: commandId() }),
        /working draft already exists/i,
      );
      assert.deepEqual(await read(), saved, 'fresh create conflict preserves original');
      const resumed = await player.query<{ selections: DraftSelection[] }>(
        'characterWizard:discover',
        {
          characterId: id,
        },
      );
      assert.deepEqual(resumed.selections, saved.selections);

      await assert.rejects(peer.query('characters:get', { characterId: id }), /unavailable/i);
      await assert.rejects(
        peer.mutation('characters:save', {
          commandId: commandId(),
          characterId: id,
          expectedRevision: saved.revision,
          authored: { ...saved.authored, name: 'wrong owner' },
          list: true,
        }),
        /unavailable/i,
      );
      await assert.rejects(peer.query('characterWizard:discover', { characterId: id }), /owner/i);
      await assert.rejects(
        peer.query('characterWizard:transition', {
          characterId: id,
          selections: saved.selections,
          decisionId: primary,
          value: 'Shining Armor',
        }),
        /owner/i,
      );
      assert.deepEqual(await read(), saved, 'cross-owner requests cannot change the draft');
      assert.equal(await peer.query('characters:wizardDraft', {}), peerDraftBefore);
      assert.deepEqual(await peer.query('characters:listMine', {}), peerListBefore);

      // A grid change applies its decision transitions in order, then explicitly saves.
      // Read again after every save: transition query responses alone are not persistence proof.
      async function grid(nextKits: [string?, string?], expected = nextKits) {
        const before = await read();
        let selections = before.selections;
        for (const [decisionId, value] of [
          [primary, nextKits[0]],
          [secondary, nextKits[1]],
        ] as const) {
          const next = await player.query<{ selections: DraftSelection[] }>(
            'characterWizard:transition',
            {
              characterId: id,
              selections,
              decisionId,
              ...(value === undefined ? {} : { value }),
            },
          );
          selections = next.selections;
        }
        assert.deepEqual(await read(), before, 'transition query does not write the draft');
        const revision = await player.mutation<number>('characters:save', {
          commandId: commandId(),
          characterId: id,
          expectedRevision: before.revision,
          authored: before.authored,
          selections,
        });
        saved = await read();
        assert.equal(revision, before.revision + 1);
        assert.equal(saved.revision, revision);
        assert.deepEqual(saved.selections, selections);
        assert.equal(values(saved)[primary], expected[0]);
        assert.equal(values(saved)[secondary], expected[1]);
        assert.equal(saved.wizardDraft, true);
        assert.equal(saved.fullEditIsStale, false, 'standalone autosaves do not stale themselves');
        assert.equal(await player.query('characters:wizardDraft', {}), id);
        assert.deepEqual((await readList()).map(row => row.id).sort(), listedBefore);
      }
      await grid(['Shining Armor']);
      await grid(['Shining Armor', 'Sniper']);
      // Removing the first selected card compacts the survivor into slot one.
      await grid(['Sniper']);
      await grid(['Sniper', 'Shining Armor']);
      await grid([]);
      await grid(['Shining Armor', 'Mountain']);
      // kit/shining-armor.md and kit/mountain.md, Kit Bonuses: Stamina +12 vs +9.
      // Field Arsenal permits choosing either overlapping benefit. Removing Mountain
      // removes this explicit choice once only Shining Armor prints a Stamina bonus.
      const bonusId = 'class.tactician.arsenal.stamina';
      const bonus = await player.query<{ selections: DraftSelection[] }>(
        'characterWizard:transition',
        {
          characterId: id,
          selections: saved.selections,
          decisionId: bonusId,
          value: 'Mountain',
        },
      );
      await player.mutation('characters:save', {
        commandId: commandId(),
        characterId: id,
        expectedRevision: saved.revision,
        authored: saved.authored,
        selections: bonus.selections,
      });
      saved = await read();
      assert.equal(values(saved)[bonusId], 'Mountain');
      await grid(['Shining Armor', 'Sniper']);
      assert.equal(
        values(saved)[bonusId],
        undefined,
        'obsolete overlap choice is pruned and saved',
      );

      const choices = await player.query<{
        decisions: { id: string; pool: { values: string[] } }[];
      }>('characterWizard:discover', { characterId: id });
      const firstPool = choices.decisions.find(choice => choice.id === primary)!.pool.values;
      const secondPool = choices.decisions.find(choice => choice.id === secondary)!.pool.values;
      assert.ok(!secondPool.includes('Shining Armor'), 'second-kit pool excludes the first kit');
      // Q-R-103: Beast Shape's Boren/Corven/Raden/Vuken kits are not ordinary kit choices.
      for (const name of ['Boren', 'Corven', 'Raden', 'Vuken']) {
        assert.ok(!firstPool.includes(name), `${name} excluded from first kit`);
        assert.ok(!secondPool.includes(name), `${name} excluded from second kit`);
      }
      // Invalid input is pruned by the same transition API before the resulting draft is saved.
      await grid(['Shining Armor', 'Shining Armor'], ['Shining Armor']);
      await grid(['Shining Armor', 'Boren'], ['Shining Armor']);
      await grid(['Shining Armor', 'Sniper']);

      await assert.rejects(
        player.mutation('characters:save', {
          commandId: commandId(),
          characterId: id,
          expectedRevision: saved.revision,
          authored: saved.authored,
          selections: saved.selections,
          list: true,
        }),
        /character name/i,
      );
      assert.deepEqual(await read(), saved, 'unnamed listing refusal preserves working draft');
      const named = await player.query<{ selections: DraftSelection[] }>(
        'characterWizard:transition',
        {
          characterId: id,
          selections: saved.selections,
          decisionId: 'details.name',
          value: `V96 draft ${runId}`,
        },
      );
      const publish = {
        commandId: commandId(),
        characterId: id,
        expectedRevision: saved.revision,
        authored: { ...saved.authored, name: `V96 draft ${runId}` },
        selections: named.selections,
        list: true,
      };
      const revision = await player.mutation<number>('characters:save', publish);
      assert.equal(await player.mutation('characters:save', publish), revision);
      saved = await read();
      assert.equal(saved.revision, publish.expectedRevision + 1);
      assert.equal(saved.wizardDraft, false);
      assert.equal(saved.authored.name, publish.authored.name);
      assert.deepEqual(saved.selections, named.selections);
      assert.equal(await player.query('characters:wizardDraft', {}), null);
      assert.deepEqual((await readList()).map(row => row.id).sort(), [...listedBefore, id].sort());
      assert.deepEqual(await peer.query('characters:listMine', {}), peerListBefore);
    },
  );
  const fury = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
    selections: EvaluationInput['selections'];
  };
  const shadow = JSON.parse(readFileSync('tests/fixtures/v92-shadow-expected.json', 'utf8')) as {
    witnesses: { selections: EvaluationInput['selections'] }[];
  };
  // Source-backed V25 Berserker and V92 Shadow selections exercise the unchanged one-kit UI path.
  for (const [className, selections, firstKit, replacement] of [
    ['Fury', fury.selections, 'Mountain', 'Shining Armor'],
    ['Shadow', shadow.witnesses[0].selections, 'Cloak and Dagger', 'Sniper'],
  ] as const) {
    await run(`wizard kit grid: ${className} single pick, replace and clear persist`, async () => {
      const { definitions } = await player.query<{ definitions: DecisionDefinitions }>(
        'characterWizard:discover',
        {},
      );
      const initial = { ...selections };
      delete initial[primary];
      const id = await player.mutation<string>('characters:create', {
        commandId: commandId(),
        authored: {
          name: `V96 ${className} ${runId}`,
          appearance: '',
          biography: '',
          notes: '',
        },
        selections: draftSelectionsFrom(initial, definitions),
      });
      const read = () => player.query<Saved>('characters:get', { characterId: id });
      const discovered = await player.query<{ decisions: { id: string; available: boolean }[] }>(
        'characterWizard:discover',
        { characterId: id },
      );
      assert.equal(discovered.decisions.find(choice => choice.id === secondary)?.available, false);
      for (const value of [firstKit, replacement, undefined]) {
        const before = await read();
        const next = await player.query<{ selections: DraftSelection[] }>(
          'characterWizard:transition',
          {
            characterId: id,
            selections: before.selections,
            decisionId: primary,
            ...(value === undefined ? {} : { value }),
          },
        );
        await player.mutation('characters:save', {
          commandId: commandId(),
          characterId: id,
          expectedRevision: before.revision,
          authored: before.authored,
          selections: next.selections,
        });
        const after = await read();
        assert.equal(after.revision, before.revision + 1);
        assert.equal(values(after)[primary], value);
        assert.equal(values(after)[secondary], undefined);
        assert.deepEqual(after.selections, next.selections);
      }
      const before = await read();
      await assert.rejects(
        player.query('characterWizard:transition', {
          characterId: id,
          selections: before.selections,
          decisionId: secondary,
          value: 'Sniper',
        }),
        /not available/i,
      );
      assert.deepEqual(await read(), before);
    });
  }
}
