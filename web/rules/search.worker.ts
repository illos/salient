// SPDX-License-Identifier: GPL-3.0-only
import MiniSearch from 'minisearch';
import { rulesSearchOptions, searchRulesIndex } from './search';
import type { RuleSearchDocument } from '../../shared/contracts/rules';
let loaded: { version: string; promise: Promise<ReturnType<typeof searchRulesIndex>> } | undefined;
self.onmessage = async (
  event: MessageEvent<{
    sequence: number;
    version: string;
    query: string;
    book: string;
    category: string;
  }>,
) => {
  const { sequence, version, query, book, category } = event.data;
  try {
    if (loaded?.version !== version) {
      const promise = fetch(`/rules-data/${version}/search-index.json`).then(async response => {
        if (!response.ok) throw new Error('Search is unavailable. Please try again.');
        return searchRulesIndex(
          await MiniSearch.loadJSONAsync<RuleSearchDocument>(
            await response.text(),
            rulesSearchOptions,
          ),
        );
      });
      loaded = { version, promise };
      void promise.catch(() => {
        if (loaded?.promise === promise) loaded = undefined;
      });
    }
    const search = await loaded.promise;
    self.postMessage({ sequence, results: search(query, { book, category }) });
  } catch (error) {
    self.postMessage({
      sequence,
      error: error instanceof Error ? error.message : 'Search is unavailable.',
    });
  }
};
