import { compileAbility } from '../shared/resolve/compileAbility.ts';
import { foeEnvelope } from '../shared/resolve/abilityGrammar.ts';
// SPDX-License-Identifier: GPL-3.0-only
/** Read-only accounting. Write stdout outside Git; no execution proof is inferred from parsing. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { ContentEntry } from '../shared/contracts/content.ts';
import {
  manualFoeFeatures,
  namedFoeFeatures,
  foeFeatureText,
  featureSlug,
  foeSupportingIds,
} from '../shared/resolve/foeFeatures.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const entries: ContentEntry[] = ['statblock', 'featureblock', 'monster', 'rule'].flatMap(kind =>
  JSON.parse(read(`shared/content/compendium/${kind}.json`)),
);
const revision: string = JSON.parse(read('shared/content/compendium/manifest.json')).compendium
  .revision;
const rosterPaths = [
  ...read('docs/decisions/2026-09-24-v1-foe-roster.md').matchAll(
    /`([^`]+\/statblock\/[^`]+\.md)`/g,
  ),
].map(m => `monster/${m[1]}`);
export const selectedFoes = entries.filter(e =>
  rosterPaths.some(p => e.sourcePath.endsWith('/' + p)),
);
const asSource = (e: ContentEntry) => ({ ...e, contentId: e.id, revision });
export function foeDiscoveryReport() {
  if (selectedFoes.length !== 36)
    throw new Error('Selected roster must reconcile to 36 definitions');
  const supportingIds = new Set(selectedFoes.flatMap(e => foeSupportingIds(e.id)));
  const supporting = entries.filter(e => supportingIds.has(e.id));
  if (supporting.length !== supportingIds.size) throw new Error('Missing supporting source');
  const features = [...selectedFoes, ...supporting].flatMap(e => {
    const manual = [...manualFoeFeatures(asSource(e)), ...namedFoeFeatures(asSource(e))];
    const abilities = (e.features ?? []).flatMap(raw => {
      if (
        !raw ||
        typeof raw !== 'object' ||
        Array.isArray(raw) ||
        raw.feature_type !== 'ability' ||
        typeof raw.name !== 'string'
      )
        return [];
      const id = `${e.id}/${featureSlug(raw.name)}`;
      const text = foeFeatureText(e.text, raw.name);
      if (!text) throw new Error(`No source section for ${id}`);
      const compiled = compileAbility({
        ...foeEnvelope(
          {
            id,
            kind: 'ability',
            name: raw.name,
            parentId: e.id,
            fields: raw,
            markdown: text,
            source: { path: e.sourcePath, revision },
          },
          'foe-ability',
          e.name,
        ),
        sourceRevision: revision,
      });
      return [
        {
          id,
          name: raw.name,
          category: 'ability',
          source: { id: e.id, path: e.sourcePath, revision },
          text,
          compilerStatus: compiled.execution === 'supported' ? 'compiled' : 'legacy-compatibility',
          diagnostics: compiled.diagnostics,
          clauses: Array.isArray(raw.effects) ? raw.effects : [],
          dependency: 'See docs/v1-foe-engine-inventory.md for per-clause execution slices',
          operation: 'ability.use',
          persistedProof: 'Not established by this report',
        },
      ];
    });
    return [
      ...abilities,
      ...manual.map(f => ({
        ...f,
        compilerStatus: 'manual',
        operation: 'ability.use (record text); ability.resolved (manual disposition)',
        dependency: 'Timing, eligibility, payments and effects remain manual; see foe inventory',
        persistedProof: 'Not established by this report',
      })),
    ];
  });
  // End Effect is a reachable child of each Solo Monster record, not a 190th inventory feature.
  const primary = features.filter(f => !f.id.includes('/solo-monster/end-effect'));
  const counts = Object.fromEntries(
    ['ability', 'trait', 'malice', 'group'].map(category => [
      category,
      primary.filter(f => f.category === category).length,
    ]),
  );
  if (
    primary.length !== 189 ||
    counts.ability !== 110 ||
    counts.trait !== 50 ||
    counts.malice !== 27 ||
    counts.group !== 2
  )
    throw new Error(`Feature reconciliation failed: ${JSON.stringify(counts)}`);
  return {
    revision,
    counts,
    namedRecords: primary.length,
    descriptors: features.length,
    scope:
      'Source accounting, not execution certification. The shared compiler supplies recognition only.',
    headers: selectedFoes.map(e => ({
      id: e.id,
      sourcePath: e.sourcePath,
      revision,
      structured: e.structured,
      operation: e.structured.organization === 'Minion' ? 'squad.add' : 'foe.add',
      persistedProof: 'Not established by this report',
    })),
    supportingRules: [
      'rule/monster/monster-trait.md',
      'rule/monster/end-effect.md',
      'rule/monster/villain-action.md',
      'rule/monster/creature-free-strike.md',
      'rule/monster/squad.md',
      'rule/monster/captain.md',
    ],
    features,
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.stdout.write(JSON.stringify(foeDiscoveryReport(), null, 2) + '\n');
