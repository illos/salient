// SPDX-License-Identifier: GPL-3.0-only
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Fields } from '../../shared/contracts/foes.ts';
import type { Input } from './import.ts';
interface Adaptation {
  parent: string;
  jsonSha256: string;
  markdownSha256: string;
  reason: string;
  features: { sourceIndexes: number[]; record: Fields }[];
}
export const sourceAdaptations = JSON.parse(
  readFileSync(new URL('./source-adaptations.json', import.meta.url), 'utf8'),
) as Adaptation[];
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function sourceFeatures(input: Input, record: Fields) {
  const original = (record.features ?? []) as Fields[];
  const repair = sourceAdaptations.find(a => a.parent === (record.metadata as Fields).scc);
  if (!repair)
    return original.map(feature => ({ feature, originals: [feature], identity: feature }));
  if (digest(input.json) !== repair.jsonSha256 || digest(input.markdown) !== repair.markdownSha256)
    throw new Error(`Stale source adaptation: ${repair.parent}`);
  const covered = repair.features.flatMap(f => f.sourceIndexes).sort((a, b) => a - b);
  if (JSON.stringify(covered) !== JSON.stringify(original.map((_, i) => i)))
    throw new Error(`Incomplete source adaptation: ${repair.parent}`);
  return repair.features.map(({ sourceIndexes, record: feature }) => {
    const originals = sourceIndexes.map(i => original[i]);
    return { feature, originals, identity: originals[0] ?? feature };
  });
}
