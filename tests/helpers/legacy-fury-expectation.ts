// SPDX-License-Identifier: GPL-3.0-only
/** Preserve the R02 oracle while explicitly checking V101's two added source-embedded uses. */
import assert from 'node:assert/strict';
import { readPinnedSource } from './pinned-source.ts';
import type { GrantedAbility } from '../../shared/contracts/characterEvaluation.ts';
const additions = [
  { name: 'Out of the Way!: Follow', parent: 'Out of the Way!', slug: 'out-of-the-way', cost: 0 },
  { name: 'Lines of Force: Enhance', parent: 'Lines of Force', slug: 'lines-of-force', cost: 1 },
];
/** Does not modify the response or the historical fixture. Every other value remains compared. */
export function legacyFuryExpectationView<T>(value: T): T {
  const copy = structuredClone(value);
  const inspect = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const row = node as { abilities?: GrantedAbility[]; baseline?: unknown; partial?: unknown };
    if (Array.isArray(row.abilities)) {
      const expected = additions.filter(a => row.abilities!.some(g => g.name === a.parent));
      const extra = row.abilities.filter(a => additions.some(e => e.name === a.name));
      assert.deepEqual(extra.map(a => a.name).sort(), expected.map(a => a.name).sort());
      for (const e of expected) {
        const a = extra.find(a => a.name === e.name)!;
        const source = `en/unified/md/feature/ability/fury/level-1/${e.slug}.md`;
        assert.equal(a.kind, 'class');
        assert.equal(a.sourcePath, source);
        assert.equal(a.provenance.source.path, source);
        assert.equal(
          a.provenance.source.quote,
          readPinnedSource(process.cwd(), `vendor/steel-compendium/${source}`),
        );
        assert.deepEqual(a.cost, e.cost ? { resource: 'ferocity', amount: e.cost } : undefined);
        assert.ok(a.activationCondition?.includes('manual'));
      }
      row.abilities = row.abilities.filter(a => !additions.some(e => e.name === a.name));
    }
    inspect(row.baseline);
    inspect(row.partial);
  };
  inspect(copy);
  return copy;
}
