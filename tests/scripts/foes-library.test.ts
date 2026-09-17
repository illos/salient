// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import type { FoeDisplayPackage } from '../../shared/contracts/foes';
import { createFoesLibrary } from '../../web/foes/library';
import { foesSearch } from '../../web/foes/filters';
const data = JSON.parse(
  readFileSync(new URL('../../shared/content/foes/browser.json', import.meta.url), 'utf8'),
) as FoeDisplayPackage;
const library = createFoesLibrary(data);
describe('foe library selection', () => {
  test('defaults to statblocks and composes parent facets for independent features', () => {
    expect(library.search({}).every(e => e.object.kind === 'statblock')).toBe(true);
    const matches = library.search({
      kind: 'trait',
      q: 'Arise',
      band: 'Undead',
      level: '1',
      role: 'Artillery',
      organization: 'Horde',
    });
    expect(matches.map(e => e.parentName)).toContain('Skeleton');
    expect(library.search({ q: 'Skeleton', level: 'missing' })).toEqual([]);
    const boneShards = library
      .search({ kind: 'ability', q: 'Bone Shards' })
      .find(e => e.parentName === 'Skeleton')!;
    expect(boneShards.evPrinted).toBe('3');
  });
  test('exact names outrank mentions; partial, typo and feature names locate a creature', () => {
    expect(library.search({ q: 'Skeleton' })[0].object.name).toBe('Skeleton');
    for (const q of ['Skele', 'Skeleon', 'Bone Shards'])
      expect(library.search({ q }).some(e => e.object.name === 'Skeleton')).toBe(true);
  });
  test('validates hostile URL values without accepting inherited keys', () => {
    expect(
      foesSearch({ q: 'x'.repeat(400), kind: 'constructor', sort: '__proto__', role: ['Brute'] }),
    ).toEqual({ q: 'x'.repeat(200) });
  });
  test('sorts numeric metadata with missing values last and stable ties', () => {
    const pack = structuredClone(data) as unknown as FoeDisplayPackage;
    const examples = pack.objects.filter(o => o.kind === 'statblock').slice(0, 3);
    examples[0].fields.level = 10;
    examples[1].fields.level = 2;
    delete examples[2].fields.level;
    examples[0].ev = { printed: '10', amount: 10, quantity: 1 };
    examples[1].ev = { printed: '2 for four minions', amount: 2, quantity: 4 };
    delete examples[2].ev;
    const model = createFoesLibrary({
      ...pack,
      objects: examples,
      search: pack.search.filter(e => examples.some(o => o.id === e.id)),
    });
    expect(model.search({ sort: 'level' }).map(e => e.level)).toEqual(['2', '10', '']);
    expect(model.search({ sort: 'level-desc' }).map(e => e.level)).toEqual(['10', '2', '']);
    expect(model.search({ sort: 'ev' }).map(e => e.ev)).toEqual([2, 10, undefined]);
    expect(model.search({ sort: 'ev' })[0].evPrinted).toBe('2 for four minions');
  });
});
