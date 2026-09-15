// SPDX-License-Identifier: GPL-3.0-only
import MiniSearch, { type SearchResult } from 'minisearch';
import type { RuleSearchDocument, RulesSearchResult } from '../../shared/contracts/rules';

export function normalizeQuery(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function createRulesSearch(documents: RuleSearchDocument[]) {
  const byId = new Map(documents.map(d => [d.id, d]));
  const index = new MiniSearch<RuleSearchDocument>({
    fields: ['name', 'text'],
    storeFields: ['name', 'book', 'category'],
    processTerm: term => normalizeQuery(term),
  });
  index.addAll(documents);
  return (
    query: string,
    filters: { book?: string; category?: string } = {},
  ): RulesSearchResult[] => {
    const normalized = normalizeQuery(query);
    if (!normalized) return [];
    const options = {
      boost: { name: 8 },
      prefix: true,
      combineWith: 'AND' as const,
      filter: (result: SearchResult) =>
        (!filters.book || result.book === filters.book) &&
        (!filters.category || result.category === filters.category),
    };
    const exact = index.search(normalized, options);
    const matches =
      exact.length >= 8
        ? exact
        : [...exact, ...index.search(normalized, { ...options, fuzzy: 0.2 })];
    const unique = new Map<string, SearchResult>();
    for (const result of matches) {
      const previous = unique.get(String(result.id));
      if (!previous || result.score > previous.score) unique.set(String(result.id), result);
    }
    // A literal unique title is always first, regardless of incidental mentions or document length.
    const tier = (name: string) => {
      const title = normalizeQuery(name);
      return name.toLowerCase() === query.trim().toLowerCase()
        ? 4
        : title === normalized
          ? 3
          : title.startsWith(normalized)
            ? 2
            : normalized.split(' ').every(t => title.includes(t))
              ? 1
              : 0;
    };
    return [...unique.values()]
      .sort(
        (a, b) => tier(b.name) - tier(a.name) || b.score - a.score || a.name.localeCompare(b.name),
      )
      .slice(0, 120)
      .map(result => {
        const doc = byId.get(String(result.id))!;
        const words = normalized.split(' ');
        const first =
          words
            .map(w => doc.text.toLowerCase().indexOf(w))
            .filter(i => i >= 0)
            .sort((a, b) => a - b)[0] ?? 0;
        const start = Math.max(0, first - 65);
        return {
          id: doc.id,
          excerpt: `${start ? '…' : ''}${doc.text.slice(start, start + 220)}${doc.text.length > start + 220 ? '…' : ''}`,
        };
      });
  };
}
