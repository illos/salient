// SPDX-License-Identifier: GPL-3.0-only
/**
 * V182: the Forge import preview writes nothing, a hero above its class ceiling is refused without
 * writing (Q-V-6 interim), a level-three Forge-built hero persists its ledger class choices, and an
 * import's diagnostics and reconciled play state are readable by the character's owner only.
 * Expected values come from the ledgers (tests/fixtures/level-three-builds.ts) and the hand-derived
 * tests/fixtures/v25-fury.json (Grug: Stamina 30, Recoveries 10).
 */
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { api } from '../../convex/_generated/api';
import { levelThreeBuilds } from '../fixtures/level-three-builds';
import { account, backend } from './fixtures/table';

const grug = readFileSync('tests/fixtures/v45-reference/Grug-level-1.ds-hero', 'utf8');
const forgeBuilt = (id: string) =>
  gunzipSync(readFileSync(`tests/fixtures/v182-forge/${id}.ds-hero.gz`)).toString('utf8');
const comparable = (value: unknown) =>
  Array.isArray(value) ? value.map(String).sort() : (value as unknown);

async function counts(t: ReturnType<typeof backend>) {
  return t.run(async ctx => ({
    characters: (await ctx.db.query('characters').collect()).length,
    revisions: (await ctx.db.query('characterRevisions').collect()).length,
    imports: (await ctx.db.query('characterImports').collect()).length,
    commands: (await ctx.db.query('commands').collect()).length,
  }));
}

test('preview reports level, class, name and diagnostics, and refuses bad files', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  const preview = await alice.client.query(api.characterImport.previewForge, {
    payload: forgeBuilt('tactician-level-3'),
  });
  expect(preview).toMatchObject({
    error: null,
    name: 'Tactician 3',
    level: 3,
    className: 'Tactician',
  });
  const malformed = await alice.client.query(api.characterImport.previewForge, {
    payload: '{"name":"Grug"}',
  });
  expect(malformed.error).toBeTruthy();
  expect(malformed.level).toBeNull();
  // Over the 512 KB bound: refused before parsing, as the import would be.
  const oversized = await alice.client.query(api.characterImport.previewForge, {
    payload: ' '.repeat(512 * 1024 + 1),
  });
  expect(oversized).toEqual({
    error: 'Forge Steel hero files up to 512 KB are supported.',
    name: null,
    level: null,
    className: null,
    diagnostics: [],
  });
});

test('a hero above its class ceiling is refused and writes nothing', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  const hero = JSON.parse(forgeBuilt('fury-level-3'));
  hero.class.level = 4;
  const payload = JSON.stringify(hero);
  const before = await counts(t);
  // shared/content/character-support.ts: Fury is supported through level three.
  const preview = await alice.client.query(api.characterImport.previewForge, { payload });
  expect(preview.error).toMatch(/Fury heroes up to level 3/);
  await expect(
    alice.client.mutation(api.characterImport.importForge, {
      commandId: 'forge-import-ceiling-fury-4',
      payload,
    }),
  ).rejects.toThrow(/Fury heroes up to level 3/);
  expect(await counts(t)).toEqual(before);
});

test('a level-three Forge-built hero persists its ledger class choices', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  const build = levelThreeBuilds().find(row => row.className === 'Tactician')!;
  const { characterId } = await alice.client.mutation(api.characterImport.importForge, {
    commandId: 'forge-import-tactician-3',
    payload: forgeBuilt('tactician-level-3'),
  });
  const saved = await alice.client.query(api.characters.get, { characterId });
  expect(saved.level).toBe(3);
  const persisted = Object.fromEntries(saved.selections.map(s => [s.decisionId, s.value]));
  for (const [key, value] of Object.entries(build.selections))
    if (/^(class|kit)\./.test(key))
      expect(comparable(persisted[key]), key).toEqual(comparable(value));
});

test('import diagnostics and the reconciled play state are readable by the owner only', async () => {
  const t = backend();
  const alice = await account(t, 'Alice');
  const bob = await account(t, 'Bob');
  // SYNTHETIC variant of the retained Grug export: 5 damage taken and 2 Recoveries used.
  const hero = JSON.parse(grug);
  hero.state.staminaDamage = 5;
  hero.state.recoveriesUsed = 2;
  const { characterId, diagnostics } = await alice.client.mutation(
    api.characterImport.importForge,
    { commandId: 'forge-import-grug-damaged', payload: JSON.stringify(hero) },
  );
  const read = await alice.client.query(api.characterImport.importDiagnostics, { characterId });
  expect(read?.diagnostics).toEqual(diagnostics);
  expect(read?.diagnostics.map(d => d.path).sort()).toEqual([
    'state.recoveriesUsed',
    'state.staminaDamage',
  ]);
  // rule/health/stamina.md, recoveries.md: 30 − 5 and 10 − 2 against Salient's own maxima.
  expect(read?.liveSeed).toMatchObject({
    stamina: 25,
    recoveries: 8,
    staminaMaximum: 30,
    recoveriesMaximum: 10,
  });
  // Stored only (Q-V-3 open): the draft has no live state.
  const saved = await alice.client.query(api.characters.get, { characterId });
  expect(saved.liveState).toBeNull();
  expect(await bob.client.query(api.characterImport.importDiagnostics, { characterId })).toBeNull();

  // More Recoveries used than Salient's maximum (10) is recorded as none, with a diagnostic.
  hero.state.recoveriesUsed = 12;
  const spent = await alice.client.mutation(api.characterImport.importForge, {
    commandId: 'forge-import-grug-spent',
    payload: JSON.stringify(hero),
  });
  const spentRead = await alice.client.query(api.characterImport.importDiagnostics, {
    characterId: spent.characterId,
  });
  expect(spentRead?.liveSeed?.recoveries).toBe(0);
  expect(spentRead?.diagnostics.some(d => /12 Recoveries used/.test(d.reason))).toBe(true);
});
