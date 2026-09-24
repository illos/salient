// SPDX-License-Identifier: GPL-3.0-only
import { parse } from 'yaml';
import { splitFrontmatter } from './lib/frontmatter.ts';
import { readPinnedTree, vendorDir } from './lib/vendor.ts';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateComparisonReport } from './foes/compare.ts';
import { importFoes, REVISION } from './foes/import.ts';
import type { Correction, Identity, Input } from './foes/import.ts';
import { SELECTION, COMPARISON_REPORT } from './foes/batches.ts';
const root = fileURLToPath(new URL('..', import.meta.url));
let pinnedBooks: Map<string, string> | undefined;
/** The monsters and heroes books at the pin, read from Git so a sparse readable copy suffices. */
const books = () =>
  (pinnedBooks ??= readPinnedTree(
    'steel-compendium',
    REVISION,
    ['en/books/monsters', 'en/books/heroes'],
    path => /^en\/books\/(monsters|heroes)\/(json|md|md-linked)\//.test(path),
    root,
  ));
function pinnedBook(path: string): string {
  const text = books().get(`en/books/${path}`);
  if (text === undefined) throw new Error(`Missing pinned source en/books/${path}`);
  return text;
}
export function readInputs(): Input[] {
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', vendorDir('steel-compendium', root), ...args], {
      encoding: 'utf8',
      maxBuffer: 20_000_000,
    });
  if (git('rev-parse', 'HEAD').trim() !== REVISION || git('status', '--porcelain').trim())
    throw new Error('Compendium pin changed or dirty');
  const discovered: string[] = [];
  for (const [path, text] of books()) {
    const match = /^en\/books\/(monsters|heroes)\/json\/(.+)\.json$/.exec(path);
    if (!match) continue;
    const record = JSON.parse(text);
    if (record.type === 'statblock' || (record.type === 'featureblock' && record.kind === 'malice'))
      discovered.push(`${match[1]}/${match[2]}`);
  }
  if (
    JSON.stringify(discovered.sort()) !==
    JSON.stringify(SELECTION.map(e => `${e.book}/${e.path}`).sort())
  )
    throw new Error('Source selection is incomplete or duplicated');
  return SELECTION.map(({ book, path }) => ({
    book,
    path,
    ...Object.fromEntries(
      [
        ['json', 'json'],
        ['markdown', 'md'],
        ['linkedMarkdown', 'md-linked'],
      ].map(([key, format]) => [
        key,
        pinnedBook(`${book}/${format}/${path}.${format === 'json' ? 'json' : 'md'}`),
      ]),
    ),
  })) as Input[];
}
export async function generateFoes() {
  const identities = JSON.parse(
    readFileSync(`${root}/scripts/foes/identities.json`, 'utf8'),
  ) as Identity[];
  const corrections = JSON.parse(
    readFileSync(`${root}/scripts/foes/corrections.json`, 'utf8'),
  ) as Correction[];
  // Derive existing Rules routes from verified pinned source identities, without depending on
  // ignored/generated reader assets being present in a fresh checkout.
  const inputs = readInputs();
  const rulePaths: Record<string, string> = {};
  const ids = new Set([
    ...inputs.flatMap(input => [...input.markdown.matchAll(/scc\.v1:([^)]*)\)/g)].map(m => m[1])),
    ...SELECTION.flatMap(e => (e.relatedRules ?? []).map(r => r.id)),
  ]);
  for (const id of ids) {
    const [source, category, slug] = id.split('/');
    const book =
      source === 'mcdm.heroes.v1'
        ? 'heroes'
        : source === 'mcdm.monsters.v1'
          ? 'monsters'
          : undefined;
    if (!book || !category || !slug) throw new Error(`Unsupported reference: ${id}`);
    const path = `${category.replaceAll('.', '/')}/${slug}`;
    const markdown = pinnedBook(`${book}/md/${path}.md`);
    const sourceId = parse(splitFrontmatter(markdown).frontmatter).scc;
    if (!(Array.isArray(sourceId) ? sourceId.includes(id) : sourceId === id))
      throw new Error(`Reference identity mismatch: ${id}`);
    rulePaths[id] = `${book}/${path}`;
    for (const related of SELECTION.flatMap(e => e.relatedRules ?? []).filter(r => r.id === id)) {
      if (related.path !== rulePaths[id]) throw new Error(`Related rule path mismatch: ${id}`);
    }
  }
  const pack = await importFoes(inputs, identities, corrections, rulePaths);
  for (const selected of SELECTION) {
    const object = pack.objects.find(
      o => !o.parentId && o.source.path === `en/books/${selected.book}/md/${selected.path}.md`,
    )!;
    if (object.supportingIds.length !== selected.supportingPaths.length)
      throw new Error(`Missing supporting source: ${selected.path}`);
  }
  return pack;
}
async function main() {
  const pack = await generateFoes();
  const bytes = JSON.stringify(pack, null, 2) + '\n';
  const directory = `${root}/shared/content/foes`;
  const paths = [`${directory}/editions/${pack.edition}.json`, `${directory}/catalog.json`];
  for (const path of paths) {
    if (process.argv.includes('--check')) {
      if (!existsSync(path) || readFileSync(path, 'utf8') !== bytes)
        throw new Error(`Foe package drift: ${path}`);
    } else {
      mkdirSync(`${directory}/editions`, { recursive: true });
      if (path.includes('/editions/') && existsSync(path) && readFileSync(path, 'utf8') !== bytes)
        throw new Error('Immutable edition collision');
      writeFileSync(path, bytes);
    }
  }
  const { corrections: _corrections, ...browserBase } = pack;
  const browser = {
    ...browserBase,
    objects: pack.objects.map(
      ({ original: _original, sections: _sections, markdown: _markdown, ...object }) => object,
    ),
  };
  const browserPath = `${directory}/browser.json`;
  const browserBytes = JSON.stringify(browser) + '\n';
  if (process.argv.includes('--check')) {
    if (!existsSync(browserPath) || readFileSync(browserPath, 'utf8') !== browserBytes)
      throw new Error('Foe browser projection drift');
  } else writeFileSync(browserPath, browserBytes);
  if (process.argv.includes('--check'))
    validateComparisonReport(
      pack,
      JSON.parse(readFileSync(`${root}/${COMPARISON_REPORT}`, 'utf8')),
    );
  console.log(
    `Foes: ${pack.objects.filter(o => o.kind === 'statblock').length} stat blocks, ${pack.objects.filter(o => o.parentId).length} features; edition ${pack.edition}; ${process.argv.includes('--check') ? 'verified' : 'generated'}`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
