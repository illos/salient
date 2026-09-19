// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react';
import type { FoeDisplayPackage } from '../../shared/contracts/foes';
import type { LibraryEntry } from './library';
export type FoeDetail = Pick<FoeDisplayPackage, 'edition' | 'objects'>;
export interface FoesCatalog {
  version: string;
  edition: string;
  entries: LibraryEntry[];
}
let catalogPromise: Promise<FoesCatalog> | undefined;
const details = new Map<string, Promise<FoeDetail>>();
async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('This reference could not load. Please try again.');
  return response.json() as Promise<T>;
}
export function getFoesCatalog() {
  return (catalogPromise ??= json<FoesCatalog>('/foes-data/catalog.json').catch(error => {
    catalogPromise = undefined;
    throw error;
  }));
}
export function getFoeDetail(catalog: FoesCatalog, id: string) {
  const file = catalog.entries.find(e => e.object.id === id)?.detailFile;
  if (!file) return Promise.reject(new Error('This reference is unavailable.'));
  const key = `${catalog.version}/${file}`;
  let promise = details.get(key);
  if (!promise) {
    promise = json<FoeDetail>(`/foes-data/${key}`).catch(error => {
      details.delete(key);
      throw error;
    });
    details.set(key, promise);
    if (details.size > 16) details.delete(details.keys().next().value!);
  }
  return promise;
}
export function useFoesCatalog() {
  const [catalog, setCatalog] = useState<FoesCatalog>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void getFoesCatalog().then(
      value => {
        if (active) {
          setCatalog(value);
          setError(undefined);
        }
      },
      error => {
        if (active) setError(error.message);
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);
  return { catalog, error, retry: () => setAttempt(n => n + 1) };
}
