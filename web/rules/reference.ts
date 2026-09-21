// SPDX-License-Identifier: GPL-3.0-only
import type { RuleSummary, RulesCatalog } from '../../shared/contracts/rules';

export type RuleReference = { id?: string; sourcePath?: string; section?: string; label?: string };

export function sectionId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function relativeSource(path: string): string {
  return path
    .replace(/^vendor\/steel-compendium\//, '')
    .replace(/^en\/(?:unified|books\/(?:heroes|monsters|beastheart))\/md(?:-linked)?\//, '');
}

const indexes = new WeakMap<
  RulesCatalog,
  { ids: Map<string, RuleSummary>; paths: Map<string, RuleSummary> }
>();
/** Resolve identities, then legacy source paths. Never guess from an instance's editable name. */
export function resolveRule(catalog: RulesCatalog, reference: RuleReference) {
  let index = indexes.get(catalog);
  if (!index) {
    index = { ids: new Map(), paths: new Map() };
    for (const entry of catalog.entries) {
      index.ids.set(entry.id, entry);
      index.paths.set(entry.sourcePath, entry);
      index.paths.set(relativeSource(entry.sourcePath), entry);
    }
    indexes.set(catalog, index);
  }
  let id = reference.id?.replace(/^scc\.v1:/, '');
  if (id?.startsWith('mcdm.monsters.v1/') && id.endsWith('/free-strike'))
    id = 'mcdm.monsters.v1/rule.monster/creature-free-strike';
  let entry = id ? index.ids.get(id) : undefined;
  let section = reference.section;
  // Runtime monster abilities use their containing SCC record followed by an ability slug.
  if (!entry && id) {
    const parent = id.slice(0, id.lastIndexOf('/'));
    entry = index.ids.get(parent);
    if (entry) section ??= id.slice(id.lastIndexOf('/') + 1);
  }
  if (!entry && reference.sourcePath) {
    const [path, hash] = reference.sourcePath.split('#');
    entry = index.paths.get(path!) ?? index.paths.get(relativeSource(path!));
    section ??= hash;
  }
  return entry ? { entry, section } : undefined;
}

/** Small labels in operational cards; full Markdown belongs to the rules reader. */
export function readableRuleText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\{data-[^}]*\}/g, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/[📏🎯]/gu, '')
    .trim();
}

/**
 * One readable sentence or two of an entry's own text, for a card or row that offers the option
 * (V96). The catalog carries every entry's excerpt inline, so this needs no extra fetch.
 */
export function ruleExcerpt(
  catalog: RulesCatalog | undefined,
  reference: RuleReference,
): string | undefined {
  if (!catalog) return undefined;
  const excerpt = resolveRule(catalog, reference)?.entry.excerpt;
  return excerpt ? endOnASentence(readableRuleText(excerpt)) : undefined;
}

/**
 * The ingest caps an entry's excerpt at a fixed length (scripts/ingest-rules.ts), so a long entry
 * arrives cut mid-word. Fall back to the last complete sentence, or the last whole word, and mark
 * the cut: the reference beside it still opens the entry in full.
 */
function endOnASentence(text: string): string {
  if (/[.!?]["')\]]?$/.test(text.trim())) return text.trim();
  const sentence = text.search(/[.!?]["')\]]?(?=[^.!?]*$)/);
  if (sentence > 0) return text.slice(0, sentence + 1).trim();
  const word = text.lastIndexOf(' ');
  return `${(word > 0 ? text.slice(0, word) : text).trim()}…`;
}
