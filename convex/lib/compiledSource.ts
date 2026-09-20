// SPDX-License-Identifier: GPL-3.0-only
/** V72 live source boundary. Reuse the compiler; compatibility only preserves bundled source. */
import { entries, manifest } from '../../shared/content/compendium/index';
import {
  foeEnvelope,
  heroEnvelope,
  kitEnvelope,
  type ContentEntry,
} from '../../shared/resolve/abilityGrammar';
import {
  compileAbility,
  type CompiledAbility,
  type CompileDiagnostic,
  type CompileEnvelope,
} from '../../shared/resolve/compileAbility';

export interface LiveCompilation {
  mode: 'compiled' | 'legacy-compatibility' | 'manual';
  definition: CompiledAbility;
  diagnostics: CompileDiagnostic[];
}

export interface LiveSource {
  contentId: string;
  kind?: string;
  name: string;
  sourcePath: string;
  revision: string;
  text: string;
  structured: Record<string, unknown>;
  features?: unknown[];
}

const bundled = new Map(entries.map(entry => [entry.id, entry]));

/** Convex object field order is immaterial; arrays and every actual source value are not. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => sameValue(value, b[index]))
    );
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(key => Object.hasOwn(right, key) && sameValue(left[key], right[key]))
  );
}

function sourceDiagnostics(entry: LiveSource): CompileDiagnostic[] {
  const original = bundled.get(entry.contentId);
  const differences: string[] = [];
  if (!original) differences.push('source identity is not in the current bundled content');
  if (entry.revision !== manifest.compendium.revision) differences.push('source revision changed');
  if (original) {
    if (entry.kind !== undefined && entry.kind !== original.kind)
      differences.push('source kind changed');
    if (entry.sourcePath !== original.sourcePath) differences.push('source path changed');
    if (entry.name !== original.name || entry.text !== original.text)
      differences.push('source body or name changed');
    if (
      !sameValue(entry.structured, original.structured) ||
      !sameValue(entry.features, original.features)
    )
      differences.push('structured source projection changed');
  }
  // Never include the parent body, feature list or differing private values in public diagnostics.
  return differences.map(message => ({
    code: 'live-source-drift',
    locator: 'source',
    clause: '',
    message: `${message}; this source requires review before live automated execution.`,
  }));
}

function finish(
  entry: LiveSource,
  envelope: CompileEnvelope,
  allowCompiled: boolean,
): LiveCompilation {
  const definition = compileAbility(envelope);
  const drift = sourceDiagnostics(entry);
  return {
    mode: drift.length
      ? 'manual'
      : allowCompiled && definition.execution === 'supported'
        ? 'compiled'
        : 'legacy-compatibility',
    definition,
    diagnostics: [...definition.diagnostics, ...drift],
  };
}

function readerEntry(entry: LiveSource, kind: string): ContentEntry {
  return {
    id: entry.contentId,
    kind,
    name: entry.name,
    sourcePath: entry.sourcePath,
    text: entry.text,
    structured: entry.structured,
  };
}

export function compileLiveEntry(entry: LiveSource, kind: string): LiveCompilation {
  return finish(
    entry,
    {
      ...heroEnvelope(readerEntry(entry, kind)),
      sourceRevision: entry.revision,
      ...(typeof entry.structured.flavor === 'string'
        ? { declaredFlavor: [entry.structured.flavor] }
        : {}),
    },
    kind === 'ability',
  );
}

export function compileLiveKit(entry: LiveSource, name: string): LiveCompilation {
  return finish(
    entry,
    {
      ...kitEnvelope(readerEntry(entry, 'kit'), name),
      sourceRevision: entry.revision,
    },
    false,
  );
}

/** Existing registered ability identity; full foe parent data never enters the definition. */
export function compileLiveFoeAbility(
  entry: LiveSource,
  feature: Record<string, unknown>,
  abilityId: string,
  markdown: string,
): LiveCompilation {
  const envelope = foeEnvelope(
    {
      id: abilityId,
      kind: 'ability',
      name: String(feature.name),
      parentId: entry.contentId,
      fields: feature,
      markdown,
      source: { path: entry.sourcePath, revision: entry.revision },
    },
    'foe-ability',
    entry.name,
  );
  return finish(entry, { ...envelope, sourceRevision: entry.revision }, true);
}
