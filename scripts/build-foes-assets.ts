// SPDX-License-Identifier: GPL-3.0-only
/** Delivery projection only; the source edition and its importer stay unchanged. */
import { readFileSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FoeDisplayPackage } from '../shared/contracts/foes.ts';
import { buildFoesIndex, createFoesEntries } from '../web/foes/library.ts';
import { presentSourceHtml } from '../shared/presentation/content.ts';
const root = fileURLToPath(new URL('..', import.meta.url));
export function buildFoesAssets(source: FoeDisplayPackage) {
  const pack = {
    ...source,
    objects: source.objects.map(object => ({
      ...object,
      html: presentSourceHtml(object.html, object.kind === 'statblock' ? object.name : undefined),
    })),
  };
  const entries = createFoesEntries(pack);
  const searchIndex = JSON.stringify(buildFoesIndex(source));
  const version = createHash('sha256')
    .update('foes-delivery.1' + JSON.stringify({ pack, entries, searchIndex }))
    .digest('hex')
    .slice(0, 16);
  const files = new Map<string, string>();
  const detailFiles = new Map<string, string>();
  const byId = new Map(pack.objects.map(o => [o.id, o]));
  for (const parent of pack.objects.filter(o => !o.parentId)) {
    const objects = [parent, ...parent.featureIds.map(id => byId.get(id)!)];
    const file = `details/${createHash('sha256').update(parent.id).digest('hex').slice(0, 20)}.json`;
    for (const object of objects) detailFiles.set(object.id, file);
    files.set(`${version}/${file}`, JSON.stringify({ edition: pack.edition, objects }));
  }
  const catalog = {
    version,
    edition: pack.edition,
    entries: entries.map(entry => ({
      ...entry,
      detailFile: detailFiles.get(entry.object.id),
    })),
  };
  if (catalog.entries.some(e => !e.detailFile))
    throw new Error('Foe detail coverage is incomplete');
  files.set('catalog.json', JSON.stringify(catalog));
  files.set(`${version}/search-index.json`, searchIndex);
  return { catalog, files };
}
function run() {
  const { catalog, files } = buildFoesAssets(
    JSON.parse(readFileSync(`${root}/shared/content/foes/browser.json`, 'utf8')),
  );
  const directory = `${root}/public/foes-data`;
  mkdirSync(directory, { recursive: true });
  for (const [path, content] of files) {
    const target = `${directory}/${path}`;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  // Keep the current tree in place: deleting the public root invalidates Vite's file watcher.
  for (const name of readdirSync(directory)) {
    if (name !== catalog.version && name !== 'catalog.json')
      rmSync(`${directory}/${name}`, { recursive: true, force: true });
  }
  const rules = JSON.parse(readFileSync(`${root}/public/rules-data/catalog.json`, 'utf8'));
  writeFileSync(
    `${root}/public/_headers`,
    [
      '/assets/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      `/rules-data/${rules.version}/*`,
      '  Cache-Control: public, max-age=31536000, immutable',
      `/foes-data/${catalog.version}/*`,
      '  Cache-Control: public, max-age=31536000, immutable',
      '/rules-data/catalog.json',
      '  Cache-Control: public, max-age=0, must-revalidate',
      '/foes-data/catalog.json',
      '  Cache-Control: public, max-age=0, must-revalidate',
      '',
    ].join('\n'),
  );
  console.log(`Foe delivery: ${catalog.entries.length} entries; version ${catalog.version}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
