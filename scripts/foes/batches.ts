// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs';
export interface Selection {
  book: 'monsters' | 'heroes';
  path: string;
  counterpart: string;
  externalPath: string;
  supportingPaths: string[];
  group?: { id: string; name: string };
  sourcebook?: 'Monsters' | 'Heroes';
  relatedRules?: { id: string; path: string; name: string; relationship: string }[];
}
/** Explicit source-qualified inventory. Generation separately proves corpus completeness. */
export const SELECTION = JSON.parse(
  readFileSync(new URL('./selection.json', import.meta.url), 'utf8'),
) as Selection[];
export const PATHS = SELECTION.map(entry => entry.path);
export const COMPARISON_REPORT = 'docs/build/evidence/V35-steel-cauldron.json';
