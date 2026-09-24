// SPDX-License-Identifier: GPL-3.0-only
/**
 * V09 part a: `characterImport.importForge` creates the caller's unattached draft from a retained
 * Forge Steel export and preserves the verbatim file. Expected selections come from the
 * hand-derived tests/fixtures/v25-fury.json; the digest is computed with node:crypto, independent of
 * the Convex SHA-256 implementation.
 */
import { expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { api } from '../../convex/_generated/api';
import { account, backend } from './fixtures/table';

const grug = readFileSync('tests/fixtures/v45-reference/Grug-level-1.ds-hero', 'utf8');
const fury = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
  selections: Record<string, unknown>;
};
const comparable = (selections: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(selections).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(item => String(item)).sort() : value,
    ]),
  );

test('import creates an unattached draft owned by the caller and stores the file verbatim', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  const bob = await account(t, 'Bob');
  const args = { commandId: 'forge-import-grug-1', payload: grug };
  const { characterId, diagnostics } = await alice.client.mutation(
    api.characterImport.importForge,
    args,
  );
  expect(diagnostics.map(d => d.path)).toEqual(['sourcebookIDs']);
  const retry = await alice.client.mutation(api.characterImport.importForge, args);
  expect(retry.characterId).toBe(characterId);

  const saved = await alice.client.query(api.characters.get, { characterId });
  expect(saved.authored.name).toBe('Grug');
  expect(saved.revision).toBe(1);
  expect(saved.level).toBe(1);
  expect(saved.campaignId).toBeNull();
  expect(saved.effectiveRevisionId).toBeNull();
  expect(saved.derivedBaseline).toBeNull();
  expect(saved.liveState).toBeNull();
  expect(saved.review).toBeNull();
  // The accepted Grug build is complete at level one (tests/character-v45-reference.test.ts).
  expect(saved.status).toBe('complete');
  expect(
    comparable(Object.fromEntries(saved.selections.map(s => [s.decisionId, s.value]))),
  ).toEqual(comparable(fury.selections));
  await expect(bob.client.query(api.characters.get, { characterId })).rejects.toThrow(
    /Character unavailable/,
  );

  const { character, imports, revisions } = await t.run(async ctx => ({
    character: await ctx.db.get(characterId),
    imports: await ctx.db.query('characterImports').collect(),
    revisions: await ctx.db.query('characterRevisions').collect(),
  }));
  expect(character!.ownerId).toBe(alice.profile.userId);
  expect(revisions).toHaveLength(1);
  expect(imports).toHaveLength(1);
  expect(imports[0]!.characterId).toBe(characterId);
  expect(imports[0]!.ownerId).toBe(alice.profile.userId);
  expect(imports[0]!.payload).toBe(grug);
  expect(imports[0]!.payloadSha256).toBe(createHash('sha256').update(grug, 'utf8').digest('hex'));
  expect(imports[0]!.forgeVendorRevision).toBe('5a846aadb623a9855a023e9403bb887a956c341f');
});

test('malformed or oversized input writes no rows', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  const counts = () =>
    t.run(async ctx => ({
      characters: (await ctx.db.query('characters').collect()).length,
      revisions: (await ctx.db.query('characterRevisions').collect()).length,
      imports: (await ctx.db.query('characterImports').collect()).length,
      commands: (await ctx.db.query('commands').collect()).length,
    }));
  const before = await counts();
  for (const [index, payload] of [
    '{"name": "Grug",',
    '{"name":"Grug"}',
    grug.replace('"level": 1', '"level": "one"'),
    ' '.repeat(512 * 1024 + 1),
  ].entries())
    await expect(
      alice.client.mutation(api.characterImport.importForge, {
        commandId: `forge-import-bad-${index}`,
        payload,
      }),
    ).rejects.toThrow();
  expect(await counts()).toEqual(before);
});

test('imported campaign-looking data grants nothing', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  const hero = JSON.parse(grug);
  hero.id = 'someone-elses-hero';
  hero.folder = 'Director campaign';
  hero.state.victories = 3;
  hero.state.xp = 16;
  const { characterId, diagnostics } = await alice.client.mutation(
    api.characterImport.importForge,
    { commandId: 'forge-import-folder-1', payload: JSON.stringify(hero) },
  );
  expect(diagnostics.map(d => d.path).sort()).toEqual(
    ['folder', 'sourcebookIDs', 'state.victories', 'state.xp'].sort(),
  );
  const saved = await alice.client.query(api.characters.get, { characterId });
  expect(saved.campaignId).toBeNull();
  expect(saved.effectiveRevisionId).toBeNull();
  expect(saved.liveState).toBeNull();
});
