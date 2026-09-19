// SPDX-License-Identifier: GPL-3.0-only
import type { RulesSearchResult } from '../../shared/contracts/rules';
import { workerSearch } from '../reference/worker-client';
export const searchRules = workerSearch<
  {
    version: string;
    query: string;
    book: string;
    category: string;
  },
  RulesSearchResult[]
>(() => new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' }));
