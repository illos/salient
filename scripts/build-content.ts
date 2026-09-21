// SPDX-License-Identifier: GPL-3.0-only
/**
 * Generates shared/content/compendium/** from the pinned Steel Compendium submodule.
 *
 *   node scripts/build-content.ts          regenerate the snapshot (pnpm content:build)
 *   node scripts/build-content.ts --check  regenerate in memory and fail on any difference (pnpm content:check)
 *
 * The pipeline extracts and records; it never interprets rules. Every entry is one source file:
 * its complete Markdown byte-exact, plus its frontmatter fields copied without renaming or defaults.
 * The JSON twin of each file is read only to cross-check the parsed frontmatter. Never advances or
 * modifies the submodule; refuses to run on a changed or dirty pin.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ContentEntry,
  ContentManifest,
  ManifestEntry,
  ManifestExclusion,
  ManifestGap,
  ManifestSelection,
} from '../shared/contracts/content.ts';
import { parseFrontmatter, splitFrontmatter, type FrontmatterValue } from './lib/frontmatter.ts';

export const GENERATOR_VERSION = '1.0.4';
export const SCHEMA_VERSION = 's01.1';
export const SUBMODULE_PATH = 'vendor/steel-compendium';
export const OUTPUT_DIR = 'shared/content/compendium';
const MARKDOWN_ROOT = 'en/unified/md';
const JSON_ROOT = 'en/unified/json';
/** Core sourcebooks for v0.01. Anything else found on a selected path is recorded as excluded. */
export const INCLUDED_SOURCEBOOKS = new Set(['mcdm.heroes.v1', 'mcdm.monsters.v1']);

/**
 * The v0.01 entry list from docs/build/S01-content-pipeline.md ("In scope"). Paths are relative to
 * en/unified/md; a directory is read recursively. Order here is the manifest order.
 */
export const SELECTIONS: ManifestSelection[] = [
  {
    id: 'supporting-character-choices',
    description:
      'V37 borrowed Dragon Knight traits and abilities; Grounded sources are already in the Elementalist selection.',
    paths: ['feature/trait/dragon-knight', 'feature/ability/dragon-knight'],
    basis:
      'docs/build/V37-supporting-character-choices.md: full source for supporting character choices; ancestry/class availability remains separately restricted.',
  },
  {
    id: 'core-monsters',
    description:
      'Core monster stat blocks, embedded features and group Malice from the pinned corpus.',
    paths: [
      'monster',
      'rule/monster/squad.md',
      'rule/monster/captain.md',
      'rule/organization/minion.md',
    ],
    basis:
      'docs/monster-catalog-spec.md#features-and-supporting-rules: retain source text and embedded abilities for every core monster.',
  },
  {
    id: 'devil-ancestry',
    description: 'Devil ancestry and its traits.',
    paths: ['ancestry/devil.md', 'feature/trait/devil'],
  },
  {
    id: 'fury-level-two',
    description:
      'V32 bounded Berserker Fury advancement: automatic feature, both aspect abilities and supported Danger Sense perk.',
    paths: [
      'feature/fury/level-2/unstoppable-force.md',
      'feature/fury/level-2/perk.md',
      'feature/fury/level-2/2nd-level-aspect-ability.md',
      'feature/fury/level-2/2nd-level-aspect-feature.md',
      'feature/ability/fury/level-2/special-delivery.md',
      'feature/ability/fury/level-2/wrecking-ball.md',
    ],
    basis:
      'docs/research/v32-fury-progression-contract.md: verified Fury level-two automatic and selected grants.',
  },
  {
    id: 'fury-level-one',
    description:
      'Fury class entry, every level-one class feature (including Ferocity and Growing Ferocity), every level-one ability (signature and heroic), and the Stormwight kit features that the level-one Beast Shape feature grants.',
    paths: [
      'class/fury.md',
      'feature/fury/level-1',
      'feature/ability/fury/level-1',
      'feature/ability/fury/stormwight-kits',
      'feature/fury/stormwight-kits',
      'feature/fury/boren',
      'feature/fury/corven',
      'feature/fury/raden',
      'feature/fury/vuken',
    ],
    basis:
      'feature/fury/level-1/beast-shape.md: "You can use and gain the benefits of a stormwight kit (see Stormwight Kits)".',
  },
  {
    id: 'dragon-knight-ancestry',
    description: 'dragon-knight complete level-one ancestry traits and granted abilities for V76.',
    paths: ['ancestry/dragon-knight.md'],
  },
  {
    id: 'high-elf-ancestry',
    description: 'high-elf complete level-one ancestry traits and granted abilities for V77.',
    paths: ['ancestry/high-elf.md', 'feature/trait/high-elf'],
  },
  {
    id: 'memonek-ancestry',
    description: 'memonek complete level-one ancestry traits and granted abilities for V78.',
    paths: ['ancestry/memonek.md', 'feature/trait/memonek'],
  },
  {
    id: 'revenant-ancestry',
    description: 'revenant complete level-one ancestry traits and granted abilities for V79.',
    paths: ['ancestry/revenant.md', 'feature/trait/revenant', 'feature/ability/revenant'],
  },
  {
    id: 'time-raider-ancestry',
    description: 'time-raider complete level-one ancestry traits and granted abilities for V80.',
    paths: ['ancestry/time-raider.md', 'feature/trait/time-raider', 'feature/ability/time-raider'],
  },
  {
    id: 'wode-elf-ancestry',
    description: 'wode-elf complete level-one ancestry traits and granted abilities for V81.',
    paths: ['ancestry/wode-elf.md', 'feature/trait/wode-elf', 'feature/ability/wode-elf'],
  },
  {
    id: 'dwarf-ancestry',
    description: 'Dwarf ancestry and complete level-one traits for V60.',
    paths: ['ancestry/dwarf.md', 'feature/trait/dwarf'],
  },
  {
    id: 'hakaan-ancestry',
    description: 'Hakaan ancestry and complete level-one traits for V70.',
    paths: ['ancestry/hakaan.md', 'feature/trait/hakaan'],
  },
  {
    id: 'orc-ancestry',
    description: 'Orc ancestry and complete level-one traits for V71.',
    paths: ['ancestry/orc.md', 'feature/trait/orc'],
  },
  {
    id: 'human-ancestry',
    description: 'Human ancestry and complete level-one traits for V61.',
    paths: ['ancestry/human.md', 'feature/trait/human'],
  },
  {
    id: 'polder-ancestry',
    description: 'Polder ancestry and its traits, for the V25 character wizard path.',
    paths: ['ancestry/polder.md', 'feature/trait/polder', 'feature/ability/polder'],
  },
  {
    id: 'elementalist-level-one',
    description:
      'Elementalist class, level-one features and abilities. Readable alternatives do not imply wizard or execution support.',
    paths: [
      'class/elementalist.md',
      'feature/elementalist/level-1',
      'feature/ability/elementalist/level-1',
    ],
    basis: 'docs/build/V25-two-class-wizard.md#in-scope: complete sourced Bethell path.',
  },
  {
    id: 'shadow-level-one',
    description:
      'Shadow class, level-one features and abilities (all three colleges). Readable alternatives do not imply wizard or execution support.',
    paths: ['class/shadow.md', 'feature/shadow/level-1', 'feature/ability/shadow/level-1'],
    basis: 'docs/build/V92-shadow-level-one.md#scope: complete level-one Shadow.',
  },
  {
    id: 'shadow-level-two',
    description: 'Shadow level-two college features, perk and six college ability alternatives.',
    paths: ['feature/shadow/level-2', 'feature/ability/shadow/level-2'],
    basis: 'docs/build/V97-shadow-level-two.md#scope: complete Shadow level-two build choices.',
  },
  {
    id: 'troubadour-level-one',
    description: 'Troubadour level-one class acts, routines and abilities.',
    paths: [
      'class/troubadour.md',
      'feature/troubadour/level-1',
      'feature/ability/troubadour/level-1',
    ],
    basis: 'docs/build/V102-troubadour-level-one.md#scope: complete Troubadour level-one options.',
  },
  {
    id: 'conduit-level-one',
    description: 'Conduit level-one domains, prayers, wards and abilities.',
    paths: ['class/conduit.md', 'feature/conduit/level-1', 'feature/ability/conduit/level-1'],
    basis: 'docs/build/V100-conduit-level-one.md#scope: complete Conduit level-one options.',
  },
  {
    id: 'censor-level-one',
    description:
      'Censor class, all level-one orders, domains, abilities and pinned deity/saint portfolios.',
    paths: [
      'class/censor.md',
      'feature/censor/level-1',
      'feature/ability/censor/level-1',
      'religion/god',
      'religion/saint',
    ],
    basis: 'docs/build/V99-censor-level-one.md#scope: complete Censor level-one choices.',
  },
  {
    id: 'shadow-level-three',
    description: 'Shadow level-three Careful Observation and four 7-Insight alternatives.',
    paths: ['feature/shadow/level-3', 'feature/ability/shadow/level-3'],
    basis: 'docs/build/V98-shadow-level-three.md#scope: Shadow level-three build choices.',
  },
  {
    id: 'tactician-level-one',
    description:
      'Tactician class, level-one features and abilities (all three doctrines). Readable alternatives do not imply wizard or execution support.',
    paths: ['class/tactician.md', 'feature/tactician/level-1', 'feature/ability/tactician/level-1'],
    basis: 'docs/build/V94-tactician-level-one.md#scope: complete level-one Tactician.',
  },
  {
    id: 'kits',
    description:
      'Every kit entry, with its printed kit_type. The source names furies among the classes that use kits and states no kit_type restriction for them in chapter/kits.md or class/fury.md; Q-R-103 confirms Berserker and Reaver use ordinary Chapter 6 kits while Stormwight uses its four aspect kits; the pipeline preserves source fields rather than inferring eligibility.',
    paths: ['kit'],
    basis:
      'chapter/kits.md: "Censors, furies, shadows, tacticians, and troubadours can tap into these and many more archetypal concepts using kits."',
  },
  {
    id: 'background-options',
    description:
      'Every culture aspect and career entry, plus the Background chapter that defines culture assembly and career benefits.',
    paths: ['culture', 'career', 'chapter/background.md'],
  },
  {
    id: 'perks',
    description: 'Every core perk entry (Beastheart perks on the same path are excluded).',
    paths: ['perk'],
  },
  {
    id: 'skills',
    description: 'Every skill group and skill entry.',
    paths: ['skill'],
  },
  {
    id: 'complications',
    description: 'Every complication entry.',
    paths: ['complication'],
  },
  {
    id: 'conditions',
    description: 'The nine core conditions.',
    paths: ['condition'],
  },
  {
    id: 'common-actions',
    description:
      'The common main actions, maneuvers and move actions, and the common ability entries (free strikes, Grab, Knockback, Escape Grab and the rest of that directory).',
    paths: ['feature/common', 'feature/ability/common'],
  },
  {
    id: 'rules-r04-r05',
    description:
      'The rule pages cited by R04 (docs/roll-and-damage-resolution.md) and R05 (docs/conditions-and-clock.md): dice, damage, health, the cited combat, general and monster pages.',
    paths: [
      'rule/dice',
      'rule/damage',
      'rule/health',
      'rule/combat/combat-round.md',
      'rule/combat/condition.md',
      'rule/combat/critical-hit.md',
      'rule/combat/end-of-turn.md',
      'rule/combat/side.md',
      'rule/combat/surprised.md',
      'rule/combat/turn.md',
      'rule/general/always-round-down.md',
      'rule/general/saving-throw.md',
      'rule/monster/creature-free-strike.md',
      'rule/monster/end-effect.md',
      'rule/monster/malice.md',
    ],
  },
];

/** Unified paths the navigation guide identifies as supplemental chapters; recorded, never included. */
const KNOWN_SUPPLEMENTAL_PATHS = ['chapter/perks.md', 'chapter/rewards.md'];

const GAPS: ManifestGap[] = [
  {
    topic: 'languages',
    note: 'The language tables ("Languages in Orden", "Languages by Ancestry Table") are not present under en/unified/md at this revision; chapter/background.md only refers to them. They exist in the clean Heroes book (en/books/heroes/clean/Draw Steel Heroes.md, readable with git show), which R01 cites directly. No language entries are generated.',
  },
  {
    topic: 'chapters',
    note: 'Chapter pages other than chapter/background.md are not included. Extracted rule pages can omit chapter context; consult the chapter in the pinned submodule when a rule page reads as incomplete.',
  },
];

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

export interface CompendiumInfo {
  revision: string;
  tag: string | null;
  committedAt: string;
}

/** Reads the submodule state and refuses anything but the clean pinned commit. */
export function inspectCompendium(root = repoRoot): CompendiumInfo {
  const submodule = join(root, SUBMODULE_PATH);
  const pinned = /\bcommit ([0-9a-f]{40})\t/.exec(git(['ls-tree', 'HEAD', SUBMODULE_PATH], root));
  if (!pinned) throw new Error(`${SUBMODULE_PATH} is not a pinned submodule of this repository.`);
  const revision = git(['rev-parse', 'HEAD'], submodule);
  if (revision !== pinned[1])
    throw new Error(
      `${SUBMODULE_PATH} is checked out at ${revision.slice(0, 12)} but pinned at ${pinned[1].slice(0, 12)}. Review the pin change before regenerating content.`,
    );
  if (git(['status', '--porcelain', '--untracked-files=all'], submodule))
    throw new Error('Content generation requires an unmodified pinned Compendium checkout.');
  const tag = ((): string | null => {
    try {
      return git(['describe', '--tags', '--exact-match', 'HEAD'], submodule);
    } catch {
      return null;
    }
  })();
  const committedAt = git(['log', '-1', '--format=%cI', 'HEAD'], submodule);
  return { revision, tag, committedAt };
}

function walk(path: string): string[] {
  if (!statSync(path).isDirectory()) return path.endsWith('.md') ? [path] : [];
  return readdirSync(path)
    .sort()
    .flatMap(name => walk(join(path, name)));
}

/** Known representation differences between the Markdown frontmatter and its JSON twin. */
function equivalent(key: string, markdown: FrontmatterValue, json: unknown): boolean {
  // The JSON `type` is coarser (`feature` for abilities and traits); the frontmatter value is kept.
  if (key === 'type') return true;
  // An empty frontmatter list is serialized as null in the JSON.
  if (Array.isArray(markdown) && markdown.length === 0 && json === null) return true;
  return JSON.stringify(markdown) === JSON.stringify(json);
}

interface Loaded {
  entry?: ContentEntry;
  exclusion?: ManifestExclusion;
}

function loadFile(root: string, relativePath: string, selection: string): Loaded {
  const markdownPath = join(root, SUBMODULE_PATH, MARKDOWN_ROOT, relativePath);
  const text = readFileSync(markdownPath, 'utf8');
  const { frontmatter } = splitFrontmatter(text);
  let fields: Record<string, FrontmatterValue>;
  try {
    fields = parseFrontmatter(frontmatter);
  } catch (error) {
    throw new Error(`${relativePath}: ${(error as Error).message}`);
  }
  const { name, scc, type, ...structured } = fields;
  if (typeof name !== 'string' || typeof scc !== 'string' || typeof type !== 'string')
    throw new Error(`${relativePath}: frontmatter must state string name, scc and type.`);
  const sourcebook = scc.split('/')[0];
  if (!INCLUDED_SOURCEBOOKS.has(sourcebook))
    return {
      exclusion: {
        path: relativePath,
        scc,
        reason: `Sourcebook ${sourcebook} is not core content for v0.01 (docs/reference-library-spec.md#official-content-is-not-necessarily-core-content).`,
      },
    };
  const jsonPath = join(root, SUBMODULE_PATH, JSON_ROOT, relativePath.replace(/\.md$/, '.json'));
  if (!existsSync(jsonPath)) throw new Error(`${relativePath}: JSON twin is missing.`);
  const twin = JSON.parse(readFileSync(jsonPath, 'utf8')) as Record<string, unknown>;
  for (const [key, value] of Object.entries(fields)) {
    if (!(key in twin)) continue;
    if (!equivalent(key, value, twin[key]))
      throw new Error(`${relativePath}: frontmatter "${key}" disagrees with the JSON twin.`);
  }
  // The JSON twin states `scc` at top level or under `metadata.scc` (a string or a one-item array).
  const metadata = (twin.metadata ?? {}) as Record<string, unknown>;
  const twinScc = twin.scc ?? metadata.scc;
  const sccAgrees = Array.isArray(twinScc) ? twinScc.includes(scc) : twinScc === scc;
  if (twin.name !== name || !sccAgrees)
    throw new Error(`${relativePath}: name or scc disagrees with the JSON twin.`);
  const entry: ContentEntry = {
    id: scc,
    kind: type,
    name,
    sourcePath: posix.join(SUBMODULE_PATH, MARKDOWN_ROOT, relativePath),
    jsonPath: posix.join(SUBMODULE_PATH, JSON_ROOT, relativePath.replace(/\.md$/, '.json')),
    selection,
    text,
    structured: structured as Record<string, FrontmatterValue>,
  };
  // A stat block's frontmatter does not list its embedded features; keep the twin's record verbatim.
  if (type === 'statblock' && Array.isArray(twin.features) && twin.features.length) {
    if ('features' in structured)
      throw new Error(`${relativePath}: frontmatter and JSON twin both state features.`);
    entry.features = twin.features as ContentEntry['features'];
  }
  return { entry };
}

export interface Snapshot {
  manifest: ContentManifest;
  /** Output file name → content, for everything under OUTPUT_DIR. */
  files: Map<string, string>;
}

function canonical(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Builds independently of generated output; metadata is derived from the pinned source commit. */
export function buildSnapshot(root = repoRoot): Snapshot {
  const compendium = inspectCompendium(root);
  const markdownRoot = join(root, SUBMODULE_PATH, MARKDOWN_ROOT);
  const entries: ContentEntry[] = [];
  const excluded: ManifestExclusion[] = [];
  const seen = new Map<string, string>();
  for (const selection of SELECTIONS) {
    for (const selected of selection.paths) {
      const absolute = join(markdownRoot, selected);
      if (!existsSync(absolute))
        throw new Error(`Selection ${selection.id}: ${selected} does not exist at this revision.`);
      const files = walk(absolute);
      if (!files.length) throw new Error(`Selection ${selection.id}: ${selected} has no entries.`);
      for (const file of files) {
        const relativePath = relative(markdownRoot, file).split('\\').join('/');
        const loaded = loadFile(root, relativePath, selection.id);
        if (loaded.exclusion) {
          excluded.push(loaded.exclusion);
          continue;
        }
        const entry = loaded.entry!;
        const duplicate = seen.get(entry.id);
        if (duplicate)
          throw new Error(`Duplicate id ${entry.id} in ${relativePath} and ${duplicate}.`);
        seen.set(entry.id, relativePath);
        entries.push(entry);
      }
    }
  }
  for (const path of KNOWN_SUPPLEMENTAL_PATHS) {
    const file = join(markdownRoot, path);
    if (!existsSync(file)) continue;
    const { frontmatter } = splitFrontmatter(readFileSync(file, 'utf8'));
    const scc = parseFrontmatter(frontmatter).scc;
    excluded.push({
      path,
      scc: typeof scc === 'string' ? scc : undefined,
      reason:
        'docs/compendium-navigation.md: the unified path selects a supplemental sourcebook chapter at this pin; not included.',
    });
  }
  entries.sort((a, b) => (a.sourcePath < b.sourcePath ? -1 : a.sourcePath > b.sourcePath ? 1 : 0));

  const byKind = new Map<string, ContentEntry[]>();
  for (const entry of entries) {
    const list = byKind.get(entry.kind) ?? [];
    list.push(entry);
    byKind.set(entry.kind, list);
  }
  const kinds = [...byKind.keys()].sort();
  for (const kind of kinds)
    if (!/^[a-z][a-z0-9-]*$/.test(kind)) throw new Error(`Unexpected kind name "${kind}".`);

  const files = new Map<string, string>();
  const manifestEntries: ManifestEntry[] = [];
  for (const kind of kinds) {
    const list = byKind.get(kind)!;
    files.set(`${kind}.json`, canonical(list));
    for (const entry of list)
      manifestEntries.push({
        id: entry.id,
        kind: entry.kind,
        name: entry.name,
        sourcePath: entry.sourcePath,
        selection: entry.selection,
        file: `${kind}.json`,
      });
  }
  const hashInput = {
    schemaVersion: SCHEMA_VERSION,
    compendium: { ...compendium, submodulePath: SUBMODULE_PATH },
    generator: { script: 'scripts/build-content.ts', version: GENERATOR_VERSION },
    selections: SELECTIONS,
    entries: manifestEntries,
    excluded,
    gaps: GAPS,
    files: [...files.entries()],
  };
  const contentHash = `sha256:${createHash('sha256').update(JSON.stringify(hashInput)).digest('hex')}`;
  // This reproducible UTC source date is not the wall-clock execution date.
  const generatedAt = new Date(compendium.committedAt).toISOString().slice(0, 10);
  const manifest: ContentManifest = {
    schemaVersion: SCHEMA_VERSION,
    compendium: { ...compendium, submodulePath: SUBMODULE_PATH },
    generator: { script: 'scripts/build-content.ts', version: GENERATOR_VERSION },
    generatedAt,
    contentHash,
    entryCount: manifestEntries.length,
    selections: SELECTIONS,
    entries: manifestEntries,
    excluded,
    gaps: GAPS,
  };
  files.set('manifest.json', canonical(manifest));
  files.set('index.ts', renderIndex(kinds));
  return { manifest, files };
}

function identifier(kind: string): string {
  return kind.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function renderIndex(kinds: string[]): string {
  const lines = [
    '// SPDX-License-Identifier: GPL-3.0-only',
    '// Generated by scripts/build-content.ts from the pinned Steel Compendium. Do not edit;',
    '// run `pnpm content:build` and review the diff. Verified by `pnpm content:check`.',
    "import type { ContentEntry, ContentManifest } from '../../contracts/content';",
    '',
    '// JSON modules are typed from their literal shapes (optional keys become `?: undefined`), which',
    '// the index-signature contract rejects; the generator has already validated every entry.',
    'const typed = (list: unknown): ContentEntry[] => list as ContentEntry[];',
    "import manifestJson from './manifest.json';",
    // Shared NodeNext evaluation imports these categories with JSON attributes. Keep each import
    // identical: esbuild/Convex 1.45 cannot stat mixed-attribute metafile input names.
    ...kinds.map(
      kind =>
        `import ${identifier(kind)}Json from './${kind}.json'${['ability', 'feature', 'complication', 'kit'].includes(kind) ? " with { type: 'json' }" : ''};`,
    ),
    '',
    'export const manifest: ContentManifest = manifestJson;',
    '/** Entries grouped by their source `type`, in source-path order within each kind. */',
    'export const byKind: Record<string, ContentEntry[]> = {',
    ...kinds.map(kind => `  '${kind}': typed(${identifier(kind)}Json),`),
    '};',
    '/** Every entry in the snapshot, kinds in alphabetical order. */',
    'export const entries: ContentEntry[] = Object.values(byKind).flat();',
    '',
  ];
  return lines.join('\n');
}

/** Differences between the generated files and the checked-in directory (names only). */
export function compareSnapshot(snapshot: Snapshot, root = repoRoot): string[] {
  const directory = join(root, OUTPUT_DIR);
  const problems: string[] = [];
  const present = existsSync(directory) ? readdirSync(directory).sort() : [];
  for (const name of present)
    if (!snapshot.files.has(name)) problems.push(`${name}: not generated by this script.`);
  for (const [name, content] of snapshot.files) {
    const path = join(directory, name);
    if (!existsSync(path)) problems.push(`${name}: missing.`);
    else if (readFileSync(path, 'utf8') !== content) problems.push(`${name}: differs.`);
  }
  return problems;
}

export function writeSnapshot(snapshot: Snapshot, root = repoRoot): void {
  const directory = join(root, OUTPUT_DIR);
  mkdirSync(directory, { recursive: true });
  for (const name of readdirSync(directory))
    if (!snapshot.files.has(name)) rmSync(join(directory, name), { recursive: true });
  for (const [name, content] of snapshot.files) writeFileSync(join(directory, name), content);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const snapshot = buildSnapshot(repoRoot);
  const label = `${snapshot.manifest.entryCount} entries, ${snapshot.manifest.excluded.length} excluded, revision ${snapshot.manifest.compendium.revision.slice(0, 12)}`;
  if (process.argv.includes('--check')) {
    const problems = compareSnapshot(snapshot);
    if (problems.length) {
      console.error(
        `${OUTPUT_DIR} differs from the clean pinned Compendium (${label}). Run pnpm content:build and review the diff:`,
      );
      for (const problem of problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    console.log(`${OUTPUT_DIR} matches the clean pinned Compendium (${label}).`);
  } else {
    writeSnapshot(snapshot);
    console.log(
      `Generated ${OUTPUT_DIR} (${label}, generatedAt ${snapshot.manifest.generatedAt}).`,
    );
  }
}
