// SPDX-License-Identifier: GPL-3.0-only
import type { FoeKind } from '../../shared/contracts/foes';
export const kinds = {
  statblock: 'Stat blocks',
  ability: 'Abilities',
  trait: 'Traits',
  malice: 'Malice',
};
export const sorts = {
  relevance: 'Relevance',
  name: 'Name · A–Z',
  level: 'Level · low to high',
  'level-desc': 'Level · high to low',
  band: 'Band · A–Z',
  ev: 'EV · low to high',
};
export interface FoesFilters {
  q?: string;
  kind?: FoeKind | 'all';
  band?: string;
  book?: string;
  level?: string;
  role?: string;
  organization?: string;
  keyword?: string;
  usage?: string;
  sort?: keyof typeof sorts;
}
export function foesSearch(raw: Record<string, unknown>): FoesFilters {
  const result: FoesFilters = {};
  for (const key of [
    'q',
    'band',
    'book',
    'level',
    'role',
    'organization',
    'keyword',
    'usage',
  ] as const) {
    if (typeof raw[key] === 'string' && raw[key]) result[key] = raw[key].slice(0, 200);
  }
  if (raw.kind === 'all' || (typeof raw.kind === 'string' && Object.hasOwn(kinds, raw.kind)))
    result.kind = raw.kind as FoesFilters['kind'];
  if (typeof raw.sort === 'string' && Object.hasOwn(sorts, raw.sort))
    result.sort = raw.sort as FoesFilters['sort'];
  return result;
}
