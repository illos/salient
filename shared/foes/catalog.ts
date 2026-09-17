// SPDX-License-Identifier: GPL-3.0-only
import type { FoeKind, FoePackage, FoeReference } from '../contracts/foes.ts';
type Addressable = { id: string; kind: FoeKind; parentId?: string };
type Collection<T extends Addressable> = { edition: string; objects: T[] };
export function foeReference<T extends Addressable>(pack: Collection<T>, id: string): FoeReference {
  const object = pack.objects.find(o => o.id === id);
  if (!object) throw new Error(`Unknown foe object: ${id}`);
  return { id, kind: object.kind, edition: pack.edition };
}
export function resolveFoe<T extends Addressable>(pack: Collection<T>, ref: FoeReference) {
  if (ref.edition !== pack.edition) return undefined;
  const object = pack.objects.find(o => o.id === ref.id && o.kind === ref.kind);
  return object ? { object, parent: pack.objects.find(o => o.id === object.parentId) } : undefined;
}
export function searchFoes(
  pack: Pick<FoePackage, 'search'>,
  query = '',
  filters: { kind?: FoeKind; keyword?: string; usage?: string } = {},
) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return pack.search.filter(
    e =>
      (!filters.kind || e.kind === filters.kind) &&
      (!filters.keyword || e.keywords.includes(filters.keyword)) &&
      (!filters.usage || e.usage === filters.usage) &&
      words.every(w => `${e.name} ${e.parentName} ${e.text}`.toLocaleLowerCase().includes(w)),
  );
}
