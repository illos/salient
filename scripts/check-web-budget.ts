// SPDX-License-Identifier: GPL-3.0-only
/** Measure the complete entry graph, including shared static imports, after Vite builds it. */
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
type Chunk = { file: string; isEntry?: boolean; imports?: string[] };
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')) as Record<
  string,
  Chunk
>;
const visited = new Set<string>();
function visit(key: string) {
  if (visited.has(key)) return;
  visited.add(key);
  for (const dependency of manifest[key].imports ?? []) visit(dependency);
}
for (const [key, chunk] of Object.entries(manifest)) if (chunk.isEntry) visit(key);
assert(visited.size > 0, 'Expected a built entry graph');
const assets = [...visited].map(key => manifest[key].file);
const sizes = (file: string) => {
  const bytes = readFileSync(`dist/${file}`);
  return { raw: bytes.length, gzip: gzipSync(bytes).length };
};
const initial = assets
  .map(sizes)
  .reduce((a, b) => ({ raw: a.raw + b.raw, gzip: a.gzip + b.gzip }), { raw: 0, gzip: 0 });
assert(initial.gzip < 200_000, `Initial static JS exceeds the 200 KB gzip budget: ${initial.gzip}`);
const rules = JSON.parse(readFileSync('dist/rules-data/catalog.json', 'utf8'));
const foes = JSON.parse(readFileSync('dist/foes-data/catalog.json', 'utf8'));
assert(
  rules.entries.length === 2614 && foes.entries.length === 2507,
  'Pinned reference coverage changed',
);
console.log(
  JSON.stringify(
    {
      initial,
      assets,
      rules: {
        catalog: sizes('rules-data/catalog.json'),
        index: sizes(`rules-data/${rules.version}/search-index.json`),
        largestContinuation: Math.max(
          0,
          ...readdirSync(`dist/rules-data/${rules.version}/articles`)
            .filter(file => /-\d+\.json$/.test(file))
            .map(file => statSync(`dist/rules-data/${rules.version}/articles/${file}`).size),
        ),
        largestInitialArticle: Math.max(
          ...rules.entries.map(
            (e: { file: string }) => statSync(`dist/rules-data/${rules.version}/${e.file}`).size,
          ),
        ),
      },
      foes: {
        catalog: sizes('foes-data/catalog.json'),
        index: sizes(`foes-data/${foes.version}/search-index.json`),
        largestDetail: Math.max(
          ...foes.entries.map(
            (e: { detailFile: string }) =>
              statSync(`dist/foes-data/${foes.version}/${e.detailFile}`).size,
          ),
        ),
      },
    },
    null,
    2,
  ),
);
