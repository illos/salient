// SPDX-License-Identifier: GPL-3.0-only
/** Public references are source content only; never live campaign or inventory records. */
export interface RuleSummary {
  id: string;
  path: string;
  name: string;
  book: string;
  category: string;
  kind: string;
  classification: 'core';
  order?: number;
  excerpt: string;
  file: string;
  sourcePath: string;
  /** Upstream SCC permalink, independent of our application routes. */
  sourceUrl: string;
}

export interface RuleHeading {
  id: string;
  text: string;
  depth: number;
  reference?: string;
}

export interface RuleArticle {
  id: string;
  html: string;
  headings: RuleHeading[];
}

export interface RulesCatalog {
  revision: string;
  version: string;
  books: { id: string; name: string; description: string }[];
  categories: { id: string; name: string; count: number }[];
  entries: RuleSummary[];
}

export interface RuleSearchDocument {
  id: string;
  name: string;
  text: string;
  category: string;
  book: string;
}

export interface RulesSearchResult {
  id: string;
  excerpt: string;
}
