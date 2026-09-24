// SPDX-License-Identifier: GPL-3.0-only
/**
 * V09 part a: `characterImport.importForge` creates the caller's unattached draft from a retained
 * Forge Steel export and preserves the verbatim file. Expected selections come from the
 * hand-derived tests/fixtures/v25-fury.json; the digest is computed with node:crypto, independent of
 * the Convex SHA-256 implementation.
 */
import { expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { api, internal } from '../../convex/_generated/api';
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
  expect(diagnostics).toEqual([]);
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
  expect(imports[0]!.payloadBytes).toBe(Buffer.byteLength(grug, 'utf8'));
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
    ['folder', 'state.victories', 'state.xp'].sort(),
  );
  const saved = await alice.client.query(api.characters.get, { characterId });
  expect(saved.campaignId).toBeNull();
  expect(saved.effectiveRevisionId).toBeNull();
  expect(saved.liveState).toBeNull();
});

test('an unnamed Forge hero imports as a partial draft under a placeholder name', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  const hero = JSON.parse(grug);
  hero.name = '';
  hero.class = null;
  const { characterId, diagnostics } = await alice.client.mutation(
    api.characterImport.importForge,
    { commandId: 'forge-import-unnamed-1', payload: JSON.stringify(hero) },
  );
  expect(diagnostics.some(d => d.path === 'name')).toBe(true);
  const saved = await alice.client.query(api.characters.get, { characterId });
  expect(saved.authored.name).toBe('Imported hero');
  expect(saved.status).not.toBe('complete');
  expect(saved.effectiveRevisionId).toBeNull();
});

test('a command id reused with a different file is rejected and writes nothing', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  await alice.client.mutation(api.characterImport.importForge, {
    commandId: 'forge-import-reuse-1',
    payload: grug,
  });
  const other = JSON.parse(grug);
  other.name = 'Not Grug';
  await expect(
    alice.client.mutation(api.characterImport.importForge, {
      commandId: 'forge-import-reuse-1',
      payload: JSON.stringify(other),
    }),
  ).rejects.toThrow(/already used for a different request/);
  const rows = await t.run(async ctx => ({
    characters: (await ctx.db.query('characters').collect()).length,
    imports: (await ctx.db.query('characterImports').collect()).length,
  }));
  expect(rows).toEqual({ characters: 1, imports: 1 });
});

test('account deletion removes imported characters and their stored files', async () => {
  vi.useFakeTimers();
  try {
    const t = backend();
    const alice = await account(t, 'Alice');
    const bob = await account(t, 'Bob');
    // Five large imports exceed one purge step's payload-byte budget (2 MiB).
    const large = JSON.parse(grug);
    large.state.inventoryText = 'x'.repeat(360 * 1024);
    for (let index = 0; index < 5; index++) {
      large.name = `Grug ${index}`;
      await alice.client.mutation(api.characterImport.importForge, {
        commandId: `forge-import-large-${index}`,
        payload: JSON.stringify(large),
      });
    }
    await bob.client.mutation(api.characterImport.importForge, {
      commandId: 'forge-import-bob-1',
      payload: grug,
    });
    await t.mutation(internal.account.continuePurge, { userId: alice.profile.userId });
    // The first step stopped at the byte budget and scheduled a continuation.
    expect(await t.run(ctx => ctx.db.get(alice.profile.userId))).not.toBeNull();
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const left = await t.run(async ctx => ({
      user: await ctx.db.get(alice.profile.userId),
      imports: await ctx.db.query('characterImports').collect(),
      characters: await ctx.db.query('characters').collect(),
    }));
    expect(left.user).toBeNull();
    expect(left.imports.map(row => row.ownerId)).toEqual([bob.profile.userId]);
    expect(left.characters.map(row => row.ownerId)).toEqual([bob.profile.userId]);
  } finally {
    vi.useRealTimers();
  }
});
