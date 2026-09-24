// SPDX-License-Identifier: GPL-3.0-only
/**
 * V09 Forge Steel import through the public mutation, with persisted readback. Expected selections
 * come from the hand-derived tests/fixtures/v25-fury.json (Grug), never from the importer.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ScenarioContext } from './character-client.ts';
import type { DraftSelection } from '../../shared/characterDraft.ts';

type Saved = {
  authored: { name: string };
  revision: number;
  level: number;
  status: string;
  campaignId: string | null;
  effectiveRevisionId: string | null;
  review: unknown;
  selections: DraftSelection[];
};
const commandId = () => crypto.randomUUID();
/** Forge does not record which open slot a deferred language occupies; compare lists as sets. */
const comparable = (value: unknown) =>
  Array.isArray(value) ? [...value].map(item => String(item)).sort() : value;

export async function runForgeImport({ actors: { player, peer }, run }: ScenarioContext) {
  await run('forge import: Grug level 1 becomes the caller’s unattached draft', async () => {
    const payload = readFileSync('tests/fixtures/v45-reference/Grug-level-1.ds-hero', 'utf8');
    const expected = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
      selections: Record<string, unknown>;
    };
    const listed = (await player.query<{ id: string }[]>('characters:listMine', {})).length;
    const args = { commandId: commandId(), payload };
    const { characterId } = await player.mutation<{ characterId: string }>(
      'characterImport:importForge',
      args,
    );
    assert.equal(
      (await player.mutation<{ characterId: string }>('characterImport:importForge', args))
        .characterId,
      characterId,
      'import retry is idempotent',
    );
    const saved = await player.query<Saved>('characters:get', { characterId });
    assert.equal(saved.authored.name, 'Grug');
    assert.equal(saved.revision, 1);
    assert.equal(saved.level, 1);
    assert.equal(saved.campaignId, null);
    assert.equal(saved.effectiveRevisionId, null);
    assert.equal(saved.review, null);
    const values = Object.fromEntries(saved.selections.map(s => [s.decisionId, s.value]));
    assert.deepEqual(
      Object.fromEntries(Object.entries(values).map(([key, value]) => [key, comparable(value)])),
      Object.fromEntries(
        Object.entries(expected.selections).map(([key, value]) => [key, comparable(value)]),
      ),
    );
    await assert.rejects(peer.query('characters:get', { characterId }), 'owner-only read');
    await assert.rejects(
      player.mutation('characterImport:importForge', {
        commandId: commandId(),
        payload: '{"name":"Not a hero"}',
      }),
      'malformed file rejected',
    );
    assert.equal(
      (await player.query<{ id: string }[]>('characters:listMine', {})).length,
      listed + 1,
      'only the valid import created a character',
    );
  });
}
