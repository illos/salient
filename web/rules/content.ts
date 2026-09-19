// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react';
import type { RuleArticle, RuleSummary, RulesCatalog } from '../../shared/contracts/rules';

let catalogPromise: Promise<RulesCatalog> | undefined;
const articles = new Map<string, Promise<RuleArticle[]>>();

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('This reference could not be loaded. Please try again.');
  return response.json() as Promise<T>;
}

export function getRulesCatalog(): Promise<RulesCatalog> {
  catalogPromise ??= json<RulesCatalog>('/rules-data/catalog.json')
    .then(catalog => ({
      ...catalog,
      entries: catalog.entries.map(entry => ({
        ...entry,
        excerpt: entry.excerpt ?? '',
        sourceUrl: `https://steelcompendium.io/v2/scc/${entry.id}/`,
      })),
    }))
    .catch(error => {
      catalogPromise = undefined;
      throw error;
    });
  return catalogPromise;
}

export async function getRuleArticle(
  catalog: RulesCatalog,
  entry: RuleSummary,
): Promise<RuleArticle> {
  const key = `${catalog.version}/${entry.file}`;
  let chunk = articles.get(key);
  if (!chunk) {
    chunk = json<RuleArticle[]>(`/rules-data/${key}`).catch(error => {
      articles.delete(key);
      throw error;
    });
    articles.set(key, chunk);
    // Public immutable content only. Bound the cache for long-running table sessions.
    if (articles.size > 8) articles.delete(articles.keys().next().value!);
  }
  const article = (await chunk).find(a => a.id === entry.id);
  if (!article) throw new Error('This reference is unavailable in the current content release.');
  return article;
}

export function useRulesCatalog(enabled = true) {
  const [value, setValue] = useState<RulesCatalog>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    getRulesCatalog().then(
      catalog => {
        if (active) {
          setValue(catalog);
          setError(undefined);
        }
      },
      e => {
        if (active) setError(String(e.message));
      },
    );
    return () => {
      active = false;
    };
  }, [enabled, attempt]);
  return { catalog: value, error, retry: () => setAttempt(n => n + 1) };
}

const excerpts = new Map<string, Promise<Record<string, string>>>();
export function getRuleExcerpts(catalog: RulesCatalog, entries: RuleSummary[]) {
  const files = [
    ...new Set(entries.flatMap(entry => (entry.excerptFile ? [entry.excerptFile] : []))),
  ];
  return Promise.all(
    files.map(file => {
      const key = `${catalog.version}/${file}`;
      let promise = excerpts.get(key);
      if (!promise) {
        promise = json<Record<string, string>>(`/rules-data/${key}`).catch(error => {
          excerpts.delete(key);
          throw error;
        });
        excerpts.set(key, promise);
        if (excerpts.size > 32) excerpts.delete(excerpts.keys().next().value!);
      }
      return promise;
    }),
  ).then(pages => Object.assign({}, ...pages) as Record<string, string>);
}

const parts = new Map<string, Promise<{ html: string }>>();
export function getRulePart(catalog: RulesCatalog, file: string): Promise<{ html: string }> {
  const key = `${catalog.version}/${file}`;
  let promise = parts.get(key);
  if (!promise) {
    promise = json<{ html: string }>(`/rules-data/${key}`).catch(error => {
      parts.delete(key);
      throw error;
    });
    parts.set(key, promise);
    if (parts.size > 48) parts.delete(parts.keys().next().value!);
  }
  return promise;
}
