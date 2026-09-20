import { readPinnedSource } from '../helpers/pinned-source';
// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { abilitiesFromStatBlock } from '../../convex/lib/resolve';
import schema from '../../convex/schema';
import { api, components, internal } from '../../convex/_generated/api';

// Expected values come from the pinned source files and the checked-in manifest, not from the
// queries under test (docs/build/README.md#review-standard).

const modules = import.meta.glob('../../convex/**/*.ts');
const root = fileURLToPath(new URL('../../', import.meta.url));
const GOBLIN_WARRIOR = 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior';
const warriorSource = readPinnedSource(
  root,
  'vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md',
);
const warriorJsonPath =
  'vendor/steel-compendium/en/unified/json/monster/goblin/statblock/goblin-warrior.json';
const warriorTwin = JSON.parse(readPinnedSource(root, warriorJsonPath));
const manifest = JSON.parse(
  readFileSync(`${root}shared/content/compendium/manifest.json`, 'utf8'),
) as { compendium: { revision: string }; entryCount: number; contentHash: string };

async function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  const now = Date.now();
  const auth = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name: 'reader',
        email: 'reader@example.test',
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: auth._id,
        token: 'reader-token',
        expiresAt: now + 3600000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const reader = t.withIdentity({ subject: auth._id, sessionId: session._id });
  await reader.mutation(api.auth.ensureProfile, {});
  return { t, reader };
}
describe('shared content snapshot', () => {
  test('an interrupted seed resumes without changing existing ids or unrelated data', async () => {
    const { t, reader } = await setup();
    await t.action(internal.content.reseed, {});
    const before = await t.run(ctx => ctx.db.query('content').take(5000));
    const userBefore = await t.run(ctx => ctx.db.query('users').collect());
    await t.mutation(internal.content.seedBatch, { offset: 0, contentHash: manifest.contentHash });
    expect(await reader.query(api.content.status, {})).toBeNull();
    expect(await reader.query(api.content.get, { id: GOBLIN_WARRIOR })).not.toBeNull();
    await expect(
      t.mutation(internal.content.seedBatch, { offset: 32, contentHash: 'stale-build' }),
    ).rejects.toThrow('Content changed');
    await t.action(internal.content.reseed, {});
    const after = await t.run(ctx => ctx.db.query('content').take(5000));
    expect(after.map(row => row._id)).toEqual(before.map(row => row._id));
    expect(await t.run(ctx => ctx.db.query('users').collect())).toEqual(userBefore);
    expect((await reader.query(api.content.status, {}))!.entryCount).toBe(manifest.entryCount);
    const id = 'mcdm.monsters.v1/monster.undead.1st-echelon.statblock/ghoul';
    const ghoul = await reader.query(api.content.get, { id });
    const jsonPath =
      'vendor/steel-compendium/en/unified/json/monster/undead/1st-echelon/statblock/ghoul.json';
    expect(ghoul!.text).toBe(
      readPinnedSource(root, jsonPath.replace('/json/', '/md/').replace('.json', '.md')),
    );
    expect(ghoul!.features).toEqual(JSON.parse(readPinnedSource(root, jsonPath)).features);
    expect(abilitiesFromStatBlock({ ...ghoul!, contentId: ghoul!.id }).map(a => a.name)).toContain(
      'Razor Claws',
    );
  });

  test('reseed loads every manifest entry; queries return the Goblin Warrior source verbatim', async () => {
    const { t, reader } = await setup();
    expect(await reader.query(api.content.status, {})).toBeNull();
    expect(await reader.query(api.content.get, { id: GOBLIN_WARRIOR })).toBeNull();
    const result = await t.action(internal.content.reseed, {});
    expect(result).toEqual({
      revision: manifest.compendium.revision,
      entryCount: manifest.entryCount,
    });
    // Read the persisted rows back rather than trusting the mutation's return value.
    const rows = await t.run(ctx => ctx.db.query('content').take(5000));
    expect(rows).toHaveLength(manifest.entryCount);
    expect(new Set(rows.map(row => row.contentId)).size).toBe(manifest.entryCount);
    const status = await reader.query(api.content.status, {});
    expect(status).toMatchObject({
      revision: 'fb83a789da8f0327a389c277a0c790b1648d5810',
      contentHash: manifest.contentHash,
      entryCount: manifest.entryCount,
    });
    const warrior = await reader.query(api.content.get, { id: GOBLIN_WARRIOR });
    expect(warrior).toMatchObject({
      id: GOBLIN_WARRIOR,
      kind: 'statblock',
      name: 'Goblin Warrior',
      sourcePath:
        'vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md',
      revision: manifest.compendium.revision,
    });
    expect(warrior!.text).toBe(warriorSource);
    expect(warrior!.jsonPath).toBe(warriorJsonPath);
    expect(warrior!.features).toEqual(warriorTwin.features);
    expect(warrior!.features!.map(feature => feature.name)).toEqual([
      'Spear Charge',
      'Bury the Point',
      'Crafty',
    ]);
    const persisted = rows.find(row => row.contentId === GOBLIN_WARRIOR)!;
    expect(persisted.jsonPath).toBe(warriorJsonPath);
    expect(persisted.features).toEqual(warriorTwin.features);
    const condition = rows.find(row => row.kind === 'condition')!;
    expect(condition).not.toHaveProperty('features');
    expect(await reader.query(api.content.get, { id: condition.contentId })).not.toHaveProperty(
      'features',
    );
    // Printed values from the source frontmatter (goblin-warrior.md lines 2-21), unrenamed.
    expect(warrior!.structured).toMatchObject({ stamina: '15', size: '1S', might: -2, level: 1 });
  });

  test('list returns the nine condition entries by kind, without their text', async () => {
    const { t, reader } = await setup();
    await t.action(internal.content.reseed, {});
    const conditions = await reader.query(api.content.list, { kind: 'condition' });
    // vendor/steel-compendium/en/unified/md/_index/condition.md: "Total: 9".
    expect(conditions.map(row => row.name)).toEqual([
      'Bleeding',
      'Dazed',
      'Frightened',
      'Grabbed',
      'Prone',
      'Restrained',
      'Slowed',
      'Taunted',
      'Weakened',
    ]);
    expect(conditions[0]).not.toHaveProperty('text');
    expect(await reader.query(api.content.list, { kind: 'no-such-kind' })).toEqual([]);
  });

  test('reseed replaces rows instead of accumulating them, and reads require sign-in', async () => {
    const { t, reader } = await setup();
    await t.action(internal.content.reseed, {});
    await t.run(ctx =>
      ctx.db.insert('content', {
        contentId: 'stale/entry',
        kind: 'rule',
        name: 'Stale',
        sourcePath: 'nowhere',
        selection: 'none',
        revision: 'old',
        text: '',
        structured: {},
      }),
    );
    await t.action(internal.content.reseed, {});
    const rows = await t.run(ctx => ctx.db.query('content').take(5000));
    expect(rows).toHaveLength(manifest.entryCount);
    expect(rows.some(row => row.contentId === 'stale/entry')).toBe(false);
    expect(await t.run(ctx => ctx.db.query('contentManifest').take(10))).toHaveLength(1);
    await expect(t.query(api.content.get, { id: GOBLIN_WARRIOR })).rejects.toThrow('Sign in');
    await expect(t.query(api.content.list, { kind: 'condition' })).rejects.toThrow('Sign in');
    await expect(t.query(api.content.status, {})).rejects.toThrow('Sign in');
    expect(await reader.query(api.content.get, { id: 'missing/id' })).toBeNull();
  });
});
