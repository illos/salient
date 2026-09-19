// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import MiniSearch from 'minisearch';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import type { FoeDisplayPackage } from '../../shared/contracts/foes';
import { buildFoesAssets } from '../../scripts/build-foes-assets';
import {
  createFoesLibrary,
  filterFoes,
  foesSearchOptions,
  searchFoesIndex,
} from '../../web/foes/library';

test('foe delivery covers every object and preserves search after serialization', async () => {
  const pack = JSON.parse(
    readFileSync(new URL('../../shared/content/foes/browser.json', import.meta.url), 'utf8'),
  ) as FoeDisplayPackage;
  const { catalog, files } = buildFoesAssets(pack);
  const reference = createFoesLibrary(pack);
  const index = await MiniSearch.loadJSONAsync(
    files.get(`${catalog.version}/search-index.json`)!,
    foesSearchOptions,
  );
  expect(catalog.entries).toHaveLength(pack.objects.length);
  expect(gzipSync(files.get('catalog.json')!).length).toBeLessThan(120_000);
  for (const entry of catalog.entries) {
    const detail = JSON.parse(files.get(`${catalog.version}/${entry.detailFile}`)!);
    const original = pack.objects.find(o => o.id === entry.object.id)!;
    const object = detail.objects.find((o: { id: string }) => o.id === original.id);
    expect(object).toBeDefined();
    expect(object.featureIds).toEqual(original.featureIds);
    expect(object.supportingIds).toEqual(original.supportingIds);
    if (original.parentId)
      expect(detail.objects.some((o: { id: string }) => o.id === original.parentId)).toBe(true);
    expect(object.html).not.toMatch(/<script|onerror=/);
    expect(entry.object).not.toHaveProperty('html');
  }
  for (const q of [
    'Arise',
    'goblin warior',
    'Ghost',
    'Binding Curse',
    'undead',
    'zzzxxyynotfound',
  ]) {
    const filters = { q, kind: 'all' as const };
    expect(
      filterFoes(catalog.entries, filters, new Map(searchFoesIndex(index, q))).map(
        e => e.object.id,
      ),
    ).toEqual(reference.search(filters).map(e => e.object.id));
  }
}, 60_000);
