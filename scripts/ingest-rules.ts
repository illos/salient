// SPDX-License-Identifier: GPL-3.0-only
/** Read-only ingest of pinned Git blobs. Generated public content retains the Draw Steel license. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Root, Heading } from 'mdast';
import type { Root as HtmlRoot } from 'hast';
import type {
  RuleArticle,
  RuleHeading,
  RuleSummary,
  RulesCatalog,
  RuleSearchDocument,
} from '../shared/contracts/rules.ts';
import { buildRulesIndex } from '../web/rules/search.ts';
import { inspectCompendium } from './build-content.ts';
import { splitFrontmatter } from './lib/frontmatter.ts';
import { slugify } from './lib/markdown.ts';
import {
  addContentTitle,
  presentationMarkdown,
  rehypeCorePresentation,
} from '../shared/presentation/content.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const GENERATOR = 'rules.3-chunks-index';
export const BOOKS = [
  {
    id: 'heroes',
    name: 'Heroes',
    description: 'Create your hero. Learn the rules. Find your next adventure.',
  },
  {
    id: 'monsters',
    name: 'Monsters',
    description: 'Creatures, encounters, retainers, and the world beyond the heroes.',
  },
  {
    id: 'beastheart',
    name: 'Beastheart (supplemental)',
    description:
      'Supported character sources and their readable rule dependencies. Reference coverage does not imply automation.',
  },
];
const CATEGORIES: Record<string, string> = {
  chapter: 'Books & chapters',
  rule: 'Rules',
  class: 'Classes',
  ancestry: 'Ancestries',
  ability: 'Abilities',
  feature: 'Class features',
  trait: 'Traits',
  kit: 'Kits',
  career: 'Careers',
  culture: 'Cultures',
  skill: 'Skills',
  'skill-group': 'Skill groups',
  perk: 'Perks',
  complication: 'Complications',
  condition: 'Conditions',
  movement: 'Movement',
  monster: 'Monster lore',
  statblock: 'Creatures',
  featureblock: 'Monster features',
  'dynamic-terrain': 'Dynamic terrain',
  retainer: 'Retainers',
  treasure: 'Items & treasures',
  project: 'Projects',
  title: 'Titles',
  religion: 'Religion',
  negotiation: 'Negotiation',
};

interface Source {
  path: string;
  book: string;
  relative: string;
  id: string;
  name: string;
  kind: string;
  order?: number;
  raw: string;
  expanded: string;
  details: string;
}

/** Context stored only in frontmatter must remain readable on standalone entry pages. */
export function metadataDetails(meta: Record<string, unknown>): string {
  const labels: Record<string, string> = {
    class: 'Class',
    subclass: 'Subclass',
    ancestry: 'Ancestry',
    kit: 'Kit',
    level: 'Level',
    cost: 'Cost',
    subtype: 'Ability type',
    echelon: 'Echelon',
    treasure_type: 'Item type',
    kit_type: 'Kit type',
    terrain_type: 'Terrain type',
    kind: 'Feature type',
    alignment: 'Alignment',
    god_class: 'Deity group',
    pantheon: 'Pantheon',
    patron: 'Patron',
  };
  const slugFields = new Set([
    'class',
    'subclass',
    'ancestry',
    'kit',
    'subtype',
    'treasure_type',
    'kind',
    'alignment',
    'god_class',
    'pantheon',
    'patron',
  ]);
  return Object.entries(labels)
    .flatMap(([key, label]) => {
      const value = meta[key];
      if (typeof value !== 'string' && typeof value !== 'number') return [];
      // Creature/terrain level is already part of the rendered stat block.
      if (
        key === 'level' &&
        ['statblock', 'dynamic-terrain', 'featureblock'].includes(String(meta.type))
      )
        return [];
      const display = slugFields.has(key)
        ? String(value)
            .replace(/-/g, ' ')
            .replace(/\b\p{L}/gu, c => c.toUpperCase())
        : String(value);
      return [`**${label}:** ${display}`];
    })
    .join('  \n');
}

/** One batch reads the source without requiring expansion of the sparse checkout. */
function readSources(revision: string): Map<string, string> {
  const cwd = join(ROOT, 'vendor/steel-compendium');
  const all = execFileSync(
    'git',
    [
      'ls-tree',
      '-r',
      '--name-only',
      revision,
      '--',
      'en/books/heroes/md',
      'en/books/heroes/md-linked',
      'en/books/monsters/md',
      'en/books/monsters/md-linked',
      'en/books/beastheart/md',
    ],
    { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
  )
    .trim()
    .split('\n');
  const paths = all.filter(p =>
    /^en\/books\/(heroes|monsters|beastheart)\/(md|md-linked)\/.*\.md$/.test(p),
  );
  const output = execFileSync('git', ['cat-file', '--batch'], {
    cwd,
    input: paths.map(p => `${revision}:${p}\n`).join(''),
    maxBuffer: 64 * 1024 * 1024,
  });
  const result = new Map<string, string>();
  let offset = 0;
  for (const path of paths) {
    const end = output.indexOf(10, offset);
    const header = output.subarray(offset, end).toString();
    const size = Number(header.split(' ')[2]);
    if (!Number.isFinite(size)) throw new Error(`Cannot read pinned source ${path}: ${header}`);
    offset = end + 1;
    result.set(path, output.subarray(offset, offset + size).toString());
    offset += size + 1;
  }
  return result;
}

/** Presentation-only cleanup: retain rules wording, quantities and mathematical notation. */
export function readableMarkdown(body: string): string {
  return body
    .replace(/\{(?:data-[\w-]+="[^"]*"\s*)+\}/g, '')
    .replace(/📏\s*/gu, 'Distance: ')
    .replace(/🎯\s*/gu, 'Target: ')
    .replace(/[🗡⚔⭐★🌀❕❗🔳🏹👤❇☠]\uFE0F?\s*/gu, '')
    .replace(/^([ \t>]*)(#{7,})\s+(.+)$/gm, '$1**$3**');
}

const markdown = unified().use(remarkParse).use(remarkGfm);
const html = unified()
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, {
    ...defaultSchema,
    clobberPrefix: '',
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes?.['*'] ?? []), 'id'],
    },
  })
  .use(rehypeCorePresentation)
  .use(rehypeStringify);

export function plainText(body: string): string {
  const tree = markdown.parse(readableMarkdown(body)) as Root;
  // Preserve spaces between blocks and table cells; HTML line breaks are prose separators.
  const read = (
    node: Root | Root['children'][number] | { type: string; value?: string; children?: unknown[] },
  ): string => {
    if (node.type === 'html') return ' ';
    if ('value' in node) return node.value ?? '';
    if ('children' in node && node.children) {
      const separator = /^(root|table|tableRow|list|blockquote)$/.test(node.type) ? ' ' : '';
      return node.children.map(child => read(child as Root)).join(separator);
    }
    return ' ';
  };
  return read(tree).replace(/\s+/g, ' ').trim();
}

export function renderArticle(
  body: string,
  resolve: (target: string) => string | undefined,
  title?: string,
): { html: string; headings: RuleHeading[]; unresolved: string[] } {
  // Keep SCC heading associations separately before removing their presentation attributes.
  const headingRefs = [...body.matchAll(/^#{1,6}\s+(.+?)\s*\{data-scc="([^"]+)"[^}]*\}/gm)].map(
    m => ({ text: plainText(m[1]), id: m[2] }),
  );
  const tree = markdown.parse(presentationMarkdown(body)) as Root;
  const blockTitles = new WeakSet<Heading>();
  // Monster abilities and traits are printed as bold blockquote titles, not headings.
  // Promote those titles so table references can land on the exact ability or trait.
  visit(tree, 'blockquote', node => {
    const first = node.children[0];
    if (
      first?.type !== 'paragraph' ||
      first.children.filter(n => n.type === 'strong').length !== 1 ||
      first.children.some(
        n => n.type !== 'strong' && !(n.type === 'text' && !readableMarkdown(n.value).trim()),
      )
    )
      return;
    const heading: Heading = {
      type: 'heading',
      depth: 3,
      children: first.children.flatMap(n => (n.type === 'strong' ? n.children : [n])),
    };
    blockTitles.add(heading);
    node.children[0] = heading;
  });
  const headings: RuleHeading[] = [];
  const unresolved: string[] = [];
  const seen = new Map<string, number>();
  const sourceHeadings: Heading[] = [];
  visit(tree, 'heading', node => {
    sourceHeadings.push(node);
  });
  const minDepth = Math.min(6, ...sourceHeadings.map(h => h.depth));
  for (const node of sourceHeadings) {
    const text = readableMarkdown(toString(node)).trim();
    const slug =
      slugify(blockTitles.has(node) ? text.replace(/\s*\([^)]*\)\s*$/, '') : text) || 'section';
    const count = seen.get(slug) ?? 0;
    seen.set(slug, count + 1);
    const id = count ? `${slug}-${count}` : slug;
    node.depth = Math.min(6, node.depth - minDepth + 2) as Heading['depth'];
    node.data = { hProperties: { id } };
    headings.push({
      id,
      text,
      depth: node.depth,
      reference: headingRefs.find(h => h.text === text)?.id,
    });
  }
  visit(tree, 'link', node => {
    const target = resolve(node.url);
    if (target) node.url = target;
    else {
      unresolved.push(node.url);
      // Fail ingestion below; never publish a guessed destination.
      node.url = '';
    }
  });
  visit(tree, 'definition', node => {
    const target = resolve(node.url);
    if (target) node.url = target;
    else {
      unresolved.push(node.url);
      node.url = '';
    }
  });
  const rendered = html.runSync(tree);
  addContentTitle(rendered, title);
  return { html: html.stringify(rendered), headings, unresolved };
}

/** Split only between complete top-level elements, preserving tables and source structure. */
export function articleParts(html: string, budget = 128_000): string[] {
  if (Buffer.byteLength(html) <= budget) return [html];
  const processor = unified().use(rehypeRaw).use(rehypeStringify);
  const tree = processor.runSync({
    type: 'root',
    children: [{ type: 'raw', value: html }],
  }) as HtmlRoot;
  const parts: string[] = [];
  let current = '';
  for (const node of tree.children) {
    const fragment = String(processor.stringify({ type: 'root', children: [node] }));
    if (current && Buffer.byteLength(current) + Buffer.byteLength(fragment) > budget) {
      parts.push(current);
      current = '';
    }
    current += fragment;
  }
  if (current) parts.push(current);
  return parts;
}

export function buildRules() {
  const { revision } = inspectCompendium(ROOT);
  const blobs = readSources(revision);
  const sources: Source[] = [];
  for (const [path, text] of blobs) {
    const match = /^en\/books\/(heroes|monsters|beastheart)\/md\/(.*)\.md$/.exec(path);
    if (!match) continue;
    const { frontmatter, body } = splitFrontmatter(text);
    const meta = parse(frontmatter) as Record<string, unknown>;
    if (
      typeof meta.scc !== 'string' ||
      typeof meta.name !== 'string' ||
      typeof meta.type !== 'string'
    )
      throw new Error(`Missing identity: ${path}`);
    if (!meta.scc.startsWith(`mcdm.${match[1]}.v1/`)) throw new Error(`Unexpected book: ${path}`);
    const expanded = blobs.get(path.replace('/md/', '/md-linked/'));
    if (!expanded && match[1] !== 'beastheart') throw new Error(`Missing expanded source: ${path}`);
    sources.push({
      path,
      book: match[1],
      relative: match[2],
      id: meta.scc,
      name: plainText(meta.name),
      kind: meta.type,
      order: typeof meta.order === 'number' ? meta.order : undefined,
      raw: body,
      expanded: match[1] === 'beastheart' ? body : splitFrontmatter(expanded!).body,
      details: metadataDetails(meta),
    });
  }
  // Q-CHAR-14: seed only the implemented Beastheart corpus, then retain its exact SCC link
  // dependencies as readable references. This does not import unrelated supplement material or
  // enable any choice/automation. Core per-book sources and collision behavior are unchanged.
  const candidateSources = new Map(sources.map(s => [s.id, s]));
  const snapshot = JSON.parse(
    readFileSync(join(ROOT, 'shared/content/compendium/manifest.json'), 'utf8'),
  ) as { entries: { id: string }[] };
  const included = new Set(sources.filter(s => s.book !== 'beastheart').map(s => s.id));
  const pending = snapshot.entries
    .filter(e => e.id.startsWith('mcdm.beastheart.v1/'))
    .map(e => e.id);
  while (pending.length) {
    const id = pending.pop()!;
    if (included.has(id)) continue;
    const source = candidateSources.get(id);
    if (!source) throw new Error(`Missing supplemental reference: ${id}`);
    included.add(id);
    for (const match of source.raw.matchAll(/scc\.v1:([^\s)"#]+)/g))
      if (match[1]!.startsWith('mcdm.beastheart.v1/')) pending.push(match[1]!);
  }
  for (let i = sources.length - 1; i >= 0; i--)
    if (!included.has(sources[i]!.id)) sources.splice(i, 1);
  const byId = new Map(sources.map(s => [s.id, s]));
  if (byId.size !== sources.length) throw new Error('Duplicate source identities');
  const byPath = new Map(sources.map(s => [`${s.book}/${s.relative}`, s]));
  const byRelative = new Map<string, Source[]>();
  for (const s of sources) byRelative.set(s.relative, [...(byRelative.get(s.relative) ?? []), s]);
  const url = (s: Source) => `/rules/${s.book}/${s.relative}`;
  const articles: Record<string, RuleArticle[]> = {};
  const entries: RuleSummary[] = [];
  const search: RuleSearchDocument[] = [];
  const broken: string[] = [];
  for (const source of sources) {
    const resolve = (target: string) => {
      if (/^https?:\/\//.test(target) || /^mailto:/.test(target) || target.startsWith('#'))
        return target;
      const [path, fragment] = target.split('#');
      let found: Source | undefined;
      if (path.startsWith('scc.v1:')) found = byId.get(path.slice(7));
      else {
        const relative = posix
          .normalize(posix.join(posix.dirname(source.relative), path))
          .replace(/\.md$/, '');
        found = byPath.get(`${source.book}/${relative}`);
        if (!found) {
          const candidates = byRelative.get(relative) ?? [];
          if (candidates.length === 1) found = candidates[0];
        }
      }
      return found ? url(found) + (fragment ? `#${fragment}` : '') : undefined;
    };
    const rendered = renderArticle(
      `${source.details}\n\n${source.expanded}`,
      resolve,
      source.kind === 'statblock' ? source.name : undefined,
    );
    for (const target of rendered.unresolved) broken.push(`${source.path}: ${target}`);
    const category = source.kind;
    const file = `articles/${createHash('sha256').update(source.id).digest('hex').slice(0, 20)}.json`;
    const excerpt = plainText(source.raw).slice(0, 230);
    entries.push({
      id: source.id,
      name: source.name,
      path: `${source.book}/${source.relative}`,
      book: source.book,
      category,
      kind: source.kind,
      classification: source.book === 'beastheart' ? 'supplemental' : 'core',
      order: source.order,
      excerpt,
      file,
      sourcePath: source.path,
      sourceUrl: `https://steelcompendium.io/v2/scc/${source.id}/`,
    });
    (articles[file] ??= []).push({
      id: source.id,
      html: rendered.html,
      headings: rendered.headings,
    });
    search.push({
      id: source.id,
      name: source.name,
      text: plainText(`${source.details}\n\n${source.raw}`),
      book: source.book,
      category,
    });
  }
  if (broken.length)
    throw new Error(
      `Unresolved rules links (${broken.length}):\n${broken.slice(0, 30).join('\n')}`,
    );
  const categories = [...new Set(entries.map(e => e.category))]
    .map(id => ({
      id,
      name: CATEGORIES[id] ?? id.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()),
      count: entries.filter(e => e.category === id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const searchIndex = JSON.stringify(buildRulesIndex(search));
  const excerptPageSize = 50;
  const articleChunkBytes = 128_000;
  const version = createHash('sha256')
    .update(
      revision +
        GENERATOR +
        JSON.stringify({ articles, searchIndex, entries, excerptPageSize, articleChunkBytes }),
    )
    .digest('hex')
    .slice(0, 16);
  const catalog: RulesCatalog = { revision, version, books: BOOKS, categories, entries };
  const outputs = new Map<string, string>();
  // The current manifest is small; excerpts and complete articles load only for visible entries.
  const ordered = [...entries].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  const excerptFiles = new Map<string, string>();
  for (let start = 0; start < ordered.length; start += excerptPageSize) {
    const page = ordered.slice(start, start + excerptPageSize);
    const file = `excerpts/${start / excerptPageSize}.json`;
    for (const entry of page) excerptFiles.set(entry.id, file);
    outputs.set(
      `${version}/${file}`,
      JSON.stringify(Object.fromEntries(page.map(e => [e.id, e.excerpt]))),
    );
  }
  outputs.set(
    'catalog.json',
    JSON.stringify({
      ...catalog,
      entries: entries.map(({ excerpt: _excerpt, sourceUrl: _url, ...entry }) => ({
        ...entry,
        excerptFile: excerptFiles.get(entry.id),
      })),
    }),
  );
  outputs.set(`${version}/search-index.json`, searchIndex);
  for (const [file, content] of Object.entries(articles)) {
    const article = content[0];
    const chunks = articleParts(article.html, articleChunkBytes);
    const parts = chunks.slice(1).map((html, i) => {
      const partFile = file.replace('.json', `-${i + 1}.json`);
      outputs.set(`${version}/${partFile}`, JSON.stringify({ html }));
      return { file: partFile, ids: [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]) };
    });
    outputs.set(
      `${version}/${file}`,
      JSON.stringify([{ ...article, html: chunks[0], ...(parts.length ? { parts } : {}) }]),
    );
  }
  const creatures = entries.filter(
    e => e.book === 'monsters' || /retainer|companion|summon/.test(e.path),
  );
  outputs.set(
    'audit.json',
    JSON.stringify(
      {
        revision,
        books: BOOKS.map(b => b.id),
        entryCount: entries.length,
        chapterCount: entries.filter(e => e.kind === 'chapter').length,
        unresolvedLinks: broken,
        excludedBooks: ['beastheart', 'summoner'],
        creatureReferences: creatures.map(e => ({
          id: e.id,
          sourcePath: e.sourcePath,
          reason: `Included from the pinned ${e.book} core-book tree; reading does not establish playable support.`,
        })),
      },
      null,
      2,
    ),
  );
  return { catalog, articles, search, outputs };
}

function run() {
  const { outputs, catalog } = buildRules();
  const directory = join(ROOT, 'public/rules-data');
  const check = process.argv.includes('--check');
  if (!check) mkdirSync(directory, { recursive: true });
  for (const [path, text] of outputs) {
    const file = join(directory, path);
    if (check) {
      if (readFileSync(file, 'utf8') !== text)
        throw new Error(`Stale generated rules: ${path}. Run pnpm rules:ingest.`);
    } else {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, text);
    }
  }
  if (!check) {
    // Preserve the current tree so a running Vite watcher keeps tracking these assets.
    for (const file of readdirSync(directory))
      if (![catalog.version, 'catalog.json', 'audit.json'].includes(file))
        rmSync(join(directory, file), { recursive: true, force: true });
  }
  console.log(
    `${check ? 'Verified' : 'Ingested'} ${catalog.entries.length} entries, ${catalog.categories.length} categories from ${catalog.revision.slice(0, 12)}. No unresolved links.`,
  );
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))
)
  run();
