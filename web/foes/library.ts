// SPDX-License-Identifier: GPL-3.0-only
import MiniSearch from 'minisearch';
import type {
  FoeDisplayObject as FoeObject,
  FoeDisplayPackage as FoePackage,
} from '../../shared/contracts/foes';
import { normalizeQuery } from '../rules/search.ts';

import type { FoesFilters } from './filters';
export function field(object: FoeObject, key: string): string {
  const value = object.fields[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
/** The pinned source hierarchy groups monster families; never infer a band from a keyword. */
export function bandOf(object: FoeObject): string {
  if (object.group) return object.group.name;
  const slug = object.source.path.match(/\/monster\/([^/]+)\//)?.[1];
  return slug
    ? slug
        .split('-')
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join(' ')
    : 'Other creatures';
}
export function bookOf(object: FoeObject): string {
  return (
    object.sourcebook ?? (object.source.path.includes('/books/heroes/') ? 'Heroes' : 'Monsters')
  );
}
export interface LibraryEntry {
  object: Pick<FoeObject, 'id' | 'kind' | 'name' | 'keywords' | 'usage'>;
  detailFile?: string;
  band: string;
  book: string;
  level: string;
  role: string;
  organization: string;
  parentName: string;
  ev?: number;
  evPrinted: string;
}
export function createFoesEntries(pack: FoePackage): LibraryEntry[] {
  const byId = new Map(pack.objects.map(o => [o.id, o]));
  const entries: LibraryEntry[] = pack.objects.map(object => {
    const parent = object.parentId ? byId.get(object.parentId) : undefined;
    const owner = parent ?? object;
    return {
      object: {
        id: object.id,
        kind: object.kind,
        name: object.name,
        keywords: object.keywords,
        usage: object.usage,
      },
      band: bandOf(owner),
      book: bookOf(owner),
      level: field(owner, 'level'),
      role: field(owner, 'role'),
      organization: field(owner, 'organization'),
      parentName: parent?.name ?? '',
      ev: owner.ev?.amount ?? undefined,
      evPrinted: owner.ev?.printed ?? field(owner, 'ev'),
    };
  });
  return entries;
}

export const foesSearchOptions = {
  fields: ['name', 'text', 'band', 'parentName'],
  processTerm: normalizeQuery,
};
export function buildFoesIndex(pack: FoePackage) {
  const byId = new Map(pack.objects.map(o => [o.id, o]));
  const index = new MiniSearch(foesSearchOptions);
  const searchById = new Map(pack.search.map(e => [e.id, e]));
  index.addAll(
    pack.search.map(entry => {
      const object = byId.get(entry.id)!;
      return {
        ...entry,
        band: bandOf(object),
        text: [
          entry.text,
          ...object.featureIds.map(id => {
            const child = searchById.get(id);
            return child ? `${child.name} ${child.text}` : '';
          }),
        ].join(' '),
      };
    }),
  );
  return index;
}
export function searchFoesIndex(index: MiniSearch, query: string): [string, number][] {
  return index
    .search(normalizeQuery(query), {
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
      boost: { name: 8, parentName: 2 },
    })
    .map(r => [String(r.id), r.score]);
}
export function createFoesLibrary(pack: FoePackage) {
  const entries = createFoesEntries(pack);
  const index = buildFoesIndex(pack);
  return {
    entries,
    search: (filters: FoesFilters) =>
      filterFoes(entries, filters, new Map(filters.q ? searchFoesIndex(index, filters.q) : [])),
  };
}
export function filterFoes(
  entries: LibraryEntry[],
  filters: FoesFilters,
  scores: Map<string, number> = new Map(),
): LibraryEntry[] {
  const query = normalizeQuery(filters.q ?? '');
  const matches = entries.filter(
    e =>
      (!query || scores.has(e.object.id)) &&
      ((filters.kind ?? 'statblock') === 'all' ||
        e.object.kind === (filters.kind ?? 'statblock')) &&
      (!filters.band || e.band === filters.band) &&
      (!filters.book || e.book === filters.book) &&
      (!filters.level || e.level === filters.level) &&
      (!filters.role || e.role === filters.role) &&
      (!filters.organization || e.organization === filters.organization) &&
      (!filters.keyword || e.object.keywords.includes(filters.keyword)) &&
      (!filters.usage || e.object.usage === filters.usage),
  );
  const numeric = (a: number | undefined, b: number | undefined, direction = 1) =>
    a === undefined ? (b === undefined ? 0 : 1) : b === undefined ? -1 : (a - b) * direction;
  const titleTier = (name: string) =>
    normalizeQuery(name) === query ? 2 : normalizeQuery(name).startsWith(query) ? 1 : 0;
  return matches.sort((a, b) => {
    let order = 0;
    switch (filters.sort ?? (query ? 'relevance' : 'name')) {
      case 'relevance':
        if (query)
          order =
            titleTier(b.object.name) - titleTier(a.object.name) ||
            (scores.get(b.object.id) ?? 0) - (scores.get(a.object.id) ?? 0);
        break;
      case 'band':
        order = a.band.localeCompare(b.band);
        break;
      case 'level':
      case 'level-desc':
        order = numeric(
          a.level ? Number(a.level) : undefined,
          b.level ? Number(b.level) : undefined,
          filters.sort === 'level-desc' ? -1 : 1,
        );
        break;
      case 'ev':
        order = numeric(a.ev, b.ev);
        break;
    }
    return (
      order ||
      a.object.name.localeCompare(b.object.name) ||
      a.parentName.localeCompare(b.parentName) ||
      a.object.id.localeCompare(b.object.id)
    );
  });
}
