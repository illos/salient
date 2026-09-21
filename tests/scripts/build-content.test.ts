// SPDX-License-Identifier: GPL-3.0-only
import { beforeAll, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readPinnedSource } from '../helpers/pinned-source';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSnapshot,
  compareSnapshot,
  INCLUDED_SOURCEBOOKS,
  OUTPUT_DIR,
  writeSnapshot,
} from '../../scripts/build-content';
import { parseFrontmatter, splitFrontmatter } from '../../scripts/lib/frontmatter';
import type { ContentEntry, ContentManifest } from '../../shared/contracts/content';

// Expected values below are copied from the pinned source files named in each test, never from the
// generator's output (docs/build/README.md#review-standard).

const root = fileURLToPath(new URL('../../', import.meta.url));
const vendor = join(root, 'vendor/steel-compendium');
const manifest = JSON.parse(
  readFileSync(join(root, OUTPUT_DIR, 'manifest.json'), 'utf8'),
) as ContentManifest;
const loaded = new Map<string, ContentEntry[]>();
function entriesIn(file: string): ContentEntry[] {
  let list = loaded.get(file);
  if (!list) {
    list = JSON.parse(readFileSync(join(root, OUTPUT_DIR, file), 'utf8')) as ContentEntry[];
    loaded.set(file, list);
  }
  return list;
}
function entry(id: string): ContentEntry {
  const row = manifest.entries.find(candidate => candidate.id === id);
  if (!row) throw new Error(`${id} is not in the manifest`);
  const found = entriesIn(row.file).find(candidate => candidate.id === id);
  if (!found) throw new Error(`${id} is not in ${row.file}`);
  return found;
}

describe('frontmatter parser', () => {
  // vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md, lines 2-21.
  test('reads the Goblin Warrior frontmatter line by line', () => {
    const { frontmatter } = splitFrontmatter(
      readPinnedSource(
        root,
        join(vendor, 'en/unified/md/monster/goblin/statblock/goblin-warrior.md'),
      ),
    );
    expect(parseFrontmatter(frontmatter)).toEqual({
      agility: 2,
      ev: '3',
      free_strike: 1,
      intuition: 0,
      keywords: ['Goblin', 'Humanoid'],
      level: 1,
      might: -2,
      movement: 'Climb',
      name: 'Goblin Warrior',
      organization: 'Horde',
      presence: -1,
      reason: 0,
      role: 'Harrier',
      scc: 'mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior',
      size: '1S',
      speed: 6,
      stability: 0,
      stamina: '15',
      type: 'statblock',
    });
  });
  test('reads sequences of mappings, quoted scalars and YAML escapes', () => {
    expect(
      parseFrontmatter(
        [
          "average_potency: '[Might](scc.v1:x) − 1'",
          'effects:',
          '    - roll: Power Roll + 2',
          '      tier1: 3 damage',
          '    - effect: The warrior is crafty.',
          '      name: Effect',
          'icon: "\\U0001F300"',
          'keywords: []',
          "note: 'it''s quoted'",
          'stamina: "15"',
        ].join('\n'),
      ),
    ).toEqual({
      average_potency: '[Might](scc.v1:x) − 1',
      effects: [
        { roll: 'Power Roll + 2', tier1: '3 damage' },
        { effect: 'The warrior is crafty.', name: 'Effect' },
      ],
      icon: '🌀',
      keywords: [],
      note: "it's quoted",
      stamina: '15',
    });
  });
  test('accepts literal blocks and refuses duplicate keys, aliases and non-mappings', () => {
    expect(parseFrontmatter('text: |-\n  block')).toEqual({ text: 'block' });
    expect(() => parseFrontmatter('a: 1\na: 2')).toThrow();
    expect(() => parseFrontmatter('a: &value hello\nb: *value')).toThrow();
    expect(() => parseFrontmatter('- one\n- two')).toThrow('mapping');
    expect(() => parseFrontmatter('plain scalar')).toThrow('mapping');
    expect(() => parseFrontmatter('')).toThrow('mapping');
    expect(() => parseFrontmatter('text: a: b')).toThrow();
    expect(() => splitFrontmatter('no frontmatter')).toThrow('no YAML frontmatter');
  });
});

describe('committed snapshot', () => {
  let snapshot: ReturnType<typeof buildSnapshot>;
  beforeAll(() => {
    snapshot = buildSnapshot(root);
  });
  test('regenerates byte-for-byte from the clean pinned Compendium (pnpm content:check)', () => {
    expect(compareSnapshot(snapshot, root)).toEqual([]);
  });
  test('shared JSON imports use the same attributes in the backend snapshot index', () => {
    // V101: mixed esbuild metafile inputs make Convex 1.45 stall before registering functions.
    // The NodeNext shared consumer and generated backend index must identify one JSON module.
    const consumer = readFileSync(join(root, 'shared/content/classes/fury/abilities.ts'), 'utf8');
    expect(consumer).toMatch(/kit\.json' with \{ type: 'json' \}/);
    expect(snapshot.files.get('index.ts')).toMatch(/kit\.json' with \{ type: 'json' \}/);
    const summoner = readFileSync(
      join(root, 'shared/content/classes/summoner/abilities.ts'),
      'utf8',
    );
    expect(summoner).toMatch(/statblock\.json' with \{ type: 'json' \}/);
    expect(snapshot.files.get('index.ts')).toMatch(/statblock\.json' with \{ type: 'json' \}/);
  });

  test('detects a hand edit to a generated file', () => {
    const edited = { ...snapshot, files: new Map(snapshot.files) };
    edited.files.set('condition.json', `${edited.files.get('condition.json')}\n`);
    expect(compareSnapshot(edited, root)).toEqual(['condition.json: differs.']);
  });
  test('uses the pinned commit date and detects a valid but incorrect generation date', () => {
    const committedAt = execFileSync('git', ['log', '-1', '--format=%cI', 'HEAD'], {
      cwd: vendor,
      encoding: 'utf8',
    }).trim();
    expect(snapshot.manifest.generatedAt).toBe(new Date(committedAt).toISOString().slice(0, 10));
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'salient-content-'));
    try {
      // Byte comparison has no date parser: one incorrect date exercises that failure mode.
      // Only the manifest is needed here; full snapshot freshness is checked above.
      const manifestOnly = {
        ...snapshot,
        files: new Map([['manifest.json', snapshot.files.get('manifest.json')!]]),
      };
      writeSnapshot(manifestOnly, temporaryRoot);
      const edited = { ...snapshot.manifest, generatedAt: '2020-01-01' };
      writeFileSync(
        join(temporaryRoot, OUTPUT_DIR, 'manifest.json'),
        `${JSON.stringify(edited, null, 2)}\n`,
      );
      expect(compareSnapshot(manifestOnly, temporaryRoot)).toEqual(['manifest.json: differs.']);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });
  test('manifest revision equals the submodule commit and the superproject pin', () => {
    const head = execFileSync('git', ['-C', vendor, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    const pin = /commit ([0-9a-f]{40})/.exec(
      execFileSync('git', ['ls-tree', 'HEAD', 'vendor/steel-compendium'], {
        cwd: root,
        encoding: 'utf8',
      }),
    )?.[1];
    expect(manifest.compendium.revision).toBe(head);
    expect(manifest.compendium.revision).toBe(pin);
    expect(manifest.compendium.revision).toBe('fb83a789da8f0327a389c277a0c790b1648d5810');
    expect(manifest.entryCount).toBe(manifest.entries.length);
    expect(manifest.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  test('core content and explicit supplemental level one are included; other supplements remain excluded', () => {
    for (const row of manifest.entries) {
      if (row.id.startsWith('mcdm.beastheart.v1/')) {
        expect(row.sourcePath).toMatch(
          /(?:class\/beastheart\.md|monster\/companion\/beastheart\/statblock\/[^/]+\.md|feature\/(?:ability\/)?(?:beastheart\/level-1|companion\/beastheart\/[^/]+\/level-1)\/[^/]+\.md)$/,
        );
      } else if (row.id.startsWith('mcdm.summoner.v1/')) {
        expect(row.sourcePath).toMatch(
          /(?:class\/summoner\.md|feature\/(?:ability\/)?summoner\/level-1\/[^/]+\.md|monster\/minion\/summoner\/(demon|undead|fey|elemental)\/statblock\/[^/]+\.md)$/,
        );
        if (row.kind === 'statblock')
          expect(entry(row.id).structured.cost).toMatch(/^[13] essence/);
      } else expect(INCLUDED_SOURCEBOOKS.has(row.id.split('/')[0]), row.id).toBe(true);
    }
    const excludedPaths = manifest.excluded.map(row => row.path);
    // docs/compendium-navigation.md: chapter/perks.md is Beastheart, chapter/rewards.md is Summoner.
    expect(excludedPaths).toContain('chapter/perks.md');
    expect(excludedPaths).toContain('chapter/rewards.md');
    for (const row of manifest.excluded) {
      expect(row.scc && INCLUDED_SOURCEBOOKS.has(row.scc.split('/')[0])).toBe(false);
      expect(readPinnedSource(root, join(vendor, 'en/unified/md', row.path))).toBeTruthy();
    }
    expect(manifest.gaps.map(gap => gap.topic)).toContain('languages');
  });
});

/** Deterministic pseudo-random sample so the reviewer can rerun the same ten entries. */
function sample<T>(list: T[], count: number, seed: number): T[] {
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const pool = [...list];
  const picked: T[] = [];
  while (picked.length < count && pool.length)
    picked.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
  return picked;
}

describe('verbatim text and traceable fields', () => {
  const sampled = sample(manifest.entries, 10, 20260914);
  test.each(sampled.map(row => [row.id, row.sourcePath]))(
    '%s is the byte-exact source file %s',
    (id, sourcePath) => {
      const found = entry(id);
      const raw = readPinnedSource(root, sourcePath);
      expect(found.text).toBe(raw);
      const { frontmatter } = splitFrontmatter(raw);
      expect(frontmatter).toMatch(/^name:/m);
      const twin = JSON.parse(readPinnedSource(root, found.jsonPath));
      expect(twin.name).toBe(found.name);
      expect(frontmatter).toContain(`scc: ${found.id}`);
      expect(frontmatter).toContain(`type: ${found.kind}`);
      for (const [key, value] of Object.entries(found.structured)) {
        expect(frontmatter, `${id} states ${key}`).toMatch(new RegExp(`^${key}:`, 'm'));
        if (Object.hasOwn(twin, key))
          expect(
            Array.isArray(value) && value.length === 0 && twin[key] === null ? null : value,
            `${id}.${key} value`,
          ).toEqual(twin[key]);
      }
    },
  );

  test('Goblin Warrior: printed values are the frontmatter, features are the JSON twin record', () => {
    // vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md
    const warrior = entry('mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior');
    expect(warrior.kind).toBe('statblock');
    expect(warrior.structured).toEqual({
      agility: 2,
      ev: '3',
      free_strike: 1,
      intuition: 0,
      keywords: ['Goblin', 'Humanoid'],
      level: 1,
      might: -2,
      movement: 'Climb',
      organization: 'Horde',
      presence: -1,
      reason: 0,
      role: 'Harrier',
      size: '1S',
      speed: 6,
      stability: 0,
      stamina: '15',
    });
    const twin = JSON.parse(readPinnedSource(root, warrior.jsonPath));
    expect(warrior.features).toEqual(twin.features);
    expect(warrior.features!.map(feature => (feature as { name: string }).name)).toEqual([
      'Spear Charge',
      'Bury the Point',
      'Crafty',
    ]);
    expect(warrior.text).toContain('> ⭐️ **Crafty**');
  });

  test('Brutal Slam: every ability field is a frontmatter line, unrenamed', () => {
    // vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md, lines 2-20.
    const slam = entry('mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam');
    expect(slam.kind).toBe('ability');
    expect(slam.structured).toMatchObject({
      action_type: '[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)',
      class: 'fury',
      distance: '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1',
      keywords: [
        '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)',
        '[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)',
        'Weapon',
      ],
      level: '1',
      power_roll_characteristic: '[Might](scc.v1:mcdm.heroes.v1/rule.character/might)',
      subtype: 'signature',
      target: 'One creature or object',
      tier1: '3 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1',
      tier2: '6 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2',
      tier3: '9 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4',
    });
    expect(slam.structured).not.toHaveProperty('cost');
    expect(slam.structured).not.toHaveProperty('usage');
  });

  test('every Fury level-one ability entry carries only fields its own frontmatter states', () => {
    const abilities = manifest.entries.filter(row =>
      row.sourcePath.includes('/feature/ability/fury/level-1/'),
    );
    // vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1 holds 15 files.
    expect(abilities).toHaveLength(15);
    for (const row of abilities) {
      const found = entry(row.id);
      const { frontmatter } = splitFrontmatter(readPinnedSource(root, row.sourcePath));
      for (const key of Object.keys(found.structured))
        expect(frontmatter, `${row.id} states ${key}`).toMatch(new RegExp(`^${key}:`, 'm'));
      expect(found.features).toBeUndefined();
    }
  });
});

// Full-core ingestion must not silently lose a monster body, embedded feature or source boundary.
test('all 438 core monster stat blocks retain exact Markdown and JSON features', () => {
  const statblocks = entriesIn('statblock.json').filter(
    row => !row.id.startsWith('mcdm.summoner.v1/'),
  );
  const minions = entriesIn('statblock.json').filter(row => row.id.startsWith('mcdm.summoner.v1/'));
  expect(minions).toHaveLength(25);
  for (const row of minions) {
    expect(row.structured.cost).toMatch(/^[13] essence/);
    expect(row.text).toBe(readPinnedSource(root, join(root, row.sourcePath)));
    const twin = JSON.parse(readPinnedSource(root, join(root, row.jsonPath!)));
    expect(row.features ?? []).toEqual(twin.features ?? []);
  }
  expect(statblocks).toHaveLength(438); // docs/research/foe-catalog-audit-2026-09-15.json
  for (const row of statblocks) {
    expect(['mcdm.monsters.v1', 'mcdm.heroes.v1']).toContain(row.id.split('/')[0]);
    expect(row.text).toBe(readFileSync(join(root, row.sourcePath), 'utf8'));
    const twin = JSON.parse(readFileSync(join(root, row.jsonPath!), 'utf8'));
    expect(row.features ?? []).toEqual(twin.features ?? []);
  }
  const lich = entry('mcdm.monsters.v1/monster.lich/lich-malice');
  expect(lich.text).toBe(readPinnedSource(root, lich.sourcePath));
  const twin = JSON.parse(readPinnedSource(root, lich.jsonPath!));
  expect(lich.structured.features).toEqual(twin.features);
});
