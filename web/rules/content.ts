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
  catalogPromise ??= json<RulesCatalog>('/rules-data/catalog.json').catch(error => {
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

export function useRulesCatalog() {
  const [value, setValue] = useState<RulesCatalog>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    getRulesCatalog().then(
      catalog => {
        if (active) setValue(catalog);
      },
      e => {
        if (active) setError(String(e.message));
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return { catalog: value, error };
}
