// SPDX-License-Identifier: GPL-3.0-only
import MiniSearch from 'minisearch';
import { foesSearchOptions, searchFoesIndex } from './library';
let loaded: { version: string; promise: Promise<MiniSearch> } | undefined;
self.onmessage = async ({
  data,
}: MessageEvent<{ sequence: number; version: string; query: string }>) => {
  const { sequence, version, query } = data;
  try {
    if (loaded?.version !== version) {
      const promise = fetch(`/foes-data/${version}/search-index.json`).then(async response => {
        if (!response.ok) throw new Error('Search is unavailable. Please try again.');
        return MiniSearch.loadJSONAsync(await response.text(), foesSearchOptions);
      });
      loaded = { version, promise };
      void promise.catch(() => {
        if (loaded?.promise === promise) loaded = undefined;
      });
    }
    self.postMessage({ sequence, results: searchFoesIndex(await loaded.promise, query) });
  } catch (error) {
    self.postMessage({
      sequence,
      error: error instanceof Error ? error.message : 'Search is unavailable.',
    });
  }
};
