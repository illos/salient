// SPDX-License-Identifier: GPL-3.0-only
import { createRulesSearch } from './search';
import type { RuleSearchDocument } from '../../shared/contracts/rules';

let loaded: Promise<ReturnType<typeof createRulesSearch>> | undefined;
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
    loaded ??= fetch(`/rules-data/${version}/search.json`)
      .then(async response => {
        if (!response.ok) throw new Error('Search is unavailable. Please try again.');
        return createRulesSearch((await response.json()) as RuleSearchDocument[]);
      })
      .catch(error => {
        loaded = undefined;
        throw error;
      });
    const search = await loaded;
    self.postMessage({ sequence, results: search(query, { book, category }) });
  } catch (error) {
    self.postMessage({
      sequence,
      error: error instanceof Error ? error.message : 'Search is unavailable.',
    });
  }
};
