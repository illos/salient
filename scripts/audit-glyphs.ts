// SPDX-License-Identifier: GPL-3.0-only
/** Read-only inventory; deliberately count raw Core bodies once, not expanded copies. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { splitFrontmatter } from './lib/frontmatter.ts';
import { tokenizeGlyphText, describeGlyph } from '../shared/presentation/glyphs.ts';
const revision = 'fb83a789da8f0327a389c277a0c790b1648d5810';
const cwd = 'vendor/steel-compendium';
const paths = execFileSync(
  'git',
  ['ls-tree', '-r', '--name-only', revision, '--', 'en/books/heroes/md', 'en/books/monsters/md'],
  { cwd, encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .filter(p => p.endsWith('.md'));
const batch = execFileSync('git', ['cat-file', '--batch'], {
  cwd,
  input: paths.map(p => `${revision}:${p}\n`).join(''),
  maxBuffer: 64 * 1024 * 1024,
});
const books: Record<
  string,
  {
    records: number;
    potencies: number;
    combinations: Record<string, number>;
    markers: Record<string, number>;
  }
> = {};
const examples: Record<string, string> = {};
let offset = 0;
for (const path of paths) {
  const end = batch.indexOf(10, offset);
  const size = Number(batch.subarray(offset, end).toString().split(' ')[2]);
  if (!Number.isSafeInteger(size)) throw new Error(`Missing pinned blob ${path}`);
  offset = end + 1;
  const body = splitFrontmatter(batch.subarray(offset, offset + size).toString()).body;
  offset += size + 1;
  const book = path.split('/')[2];
  const item = (books[book] ??= { records: 0, potencies: 0, combinations: {}, markers: {} });
  item.records++;
  const contextual = tokenizeGlyphText(body).filter(
    run => typeof run !== 'string' && run.kind === 'potency',
  );
  const expectedCount = [...body.matchAll(/\b([MAIRP]) < (\d+|WEAK|AVERAGE|STRONG)\b/g)].length;
  if (contextual.length !== expectedCount) throw new Error(`Contextual glyph loss: ${path}`);
  for (const match of body.matchAll(/\b([MAIRP]) < (\d+|WEAK|AVERAGE|STRONG)\b/g)) {
    const text = match[0];
    item.potencies++;
    item.combinations[text] = (item.combinations[text] ?? 0) + 1;
    examples[text] ??= path;
    const token = tokenizeGlyphText(text);
    if (
      token.length !== 1 ||
      typeof token[0] === 'string' ||
      token[0].kind !== 'potency' ||
      !('role' in describeGlyph(token[0]).accessibility)
    )
      throw new Error(`Uncovered potency ${path}: ${text}`);
  }
  for (const [marker] of body.matchAll(/[📏🎯🗡⚔⭐★🌀❕❗🔳🏹👤❇☠]/gu))
    item.markers[marker] = (item.markers[marker] ?? 0) + 1;
}
for (const item of Object.values(books))
  item.combinations = Object.fromEntries(
    Object.entries(item.combinations).sort(([a], [b]) => a.localeCompare(b, 'en')),
  );
const output = {
  revision,
  scope:
    'en/books/{heroes,monsters}/md bodies only; no frontmatter, expanded or unified duplicates',
  books,
  uniquePotencyCombinations: Object.keys(examples).length,
  examples: Object.fromEntries(
    Object.entries(examples).sort(([a], [b]) => a.localeCompare(b, 'en')),
  ),
  fontSha256: createHash('sha256')
    .update(readFileSync('web/assets/draw-steel/DrawSteelGlyphs-Regular.otf'))
    .digest('hex'),
};
const path = 'docs/build/evidence/V33-glyph-inventory.json';
const bytes = JSON.stringify(output, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== bytes)
    throw new Error('Glyph inventory drift; regenerate and review');
} else writeFileSync(path, bytes);
console.log(
  `${paths.length} Core records; ${Object.values(books).reduce((sum, b) => sum + b.potencies, 0)} potency occurrences; ${output.uniquePotencyCombinations} distinct potency compositions all named`,
);
