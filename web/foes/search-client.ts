// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react';
import { workerSearch } from '../reference/worker-client';
const search = workerSearch<{ version: string; query: string }, [string, number][]>(
  () => new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' }),
);
export function useFoesSearch(version: string, query: string) {
  const key = JSON.stringify([version, query]);
  const [state, setState] = useState<{
    key: string;
    scores?: Map<string, number>;
    error?: string;
  }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!query.trim()) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      void search({ version, query }).then(
        scores => {
          if (active) setState({ key, scores: new Map(scores) });
        },
        error => {
          if (active) setState({ key, error: error.message });
        },
      );
    }, 100);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [version, query, key, attempt]);
  return { ...(state?.key === key ? state : {}), retry: () => setAttempt(n => n + 1) };
}
