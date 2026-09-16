// SPDX-License-Identifier: GPL-3.0-only
import { parse } from 'yaml';
import { splitFrontmatter } from './lib/frontmatter.ts';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateComparisonReport } from './foes/compare.ts';
import { importFoes, PATHS, REVISION } from './foes/import.ts';
import type { Correction, Identity, Input } from './foes/import.ts';
const root = fileURLToPath(new URL('..', import.meta.url));
export function readInputs(): Input[] {
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', `${root}/vendor/steel-compendium`, ...args], {
      encoding: 'utf8',
      maxBuffer: 20_000_000,
    });
  if (git('rev-parse', 'HEAD').trim() !== REVISION || git('status', '--porcelain').trim())
    throw new Error('Compendium pin changed or dirty');
  return PATHS.map(path => ({
    path,
    json: git('show', `${REVISION}:en/books/monsters/json/${path}.json`),
    markdown: git('show', `${REVISION}:en/books/monsters/md/${path}.md`),
    linkedMarkdown: git('show', `${REVISION}:en/books/monsters/md-linked/${path}.md`),
  }));
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
  const ids = new Set(
    inputs.flatMap(input => [...input.markdown.matchAll(/scc\.v1:([^)]*)\)/g)].map(m => m[1])),
  );
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
    const markdown = execFileSync(
      'git',
      [
        '-C',
        `${root}/vendor/steel-compendium`,
        'show',
        `${REVISION}:en/books/${book}/md/${path}.md`,
      ],
      { encoding: 'utf8' },
    );
    if (parse(splitFrontmatter(markdown).frontmatter).scc !== id)
      throw new Error(`Reference identity mismatch: ${id}`);
    rulePaths[id] = `${book}/${path}`;
  }
  return importFoes(inputs, identities, corrections, rulePaths);
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
  if (process.argv.includes('--check'))
    validateComparisonReport(
      pack,
      JSON.parse(readFileSync(`${root}/docs/build/evidence/V27-steel-cauldron.json`, 'utf8')),
    );
  console.log(
    `Foes: 11 stat blocks, ${pack.objects.filter(o => o.parentId).length} features; edition ${pack.edition}; ${process.argv.includes('--check') ? 'verified' : 'generated'}`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
