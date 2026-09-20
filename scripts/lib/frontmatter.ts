// SPDX-License-Identifier: GPL-3.0-only
import { parseDocument } from 'yaml';

export type FrontmatterValue =
  string | number | boolean | null | FrontmatterValue[] | { [key: string]: FrontmatterValue };

export interface SplitDocument {
  /** The frontmatter lines between the `---` markers, without the markers. */
  frontmatter: string;
  /** Everything after the closing `---` line, byte-exact. */
  body: string;
}

/** Splits `---\n...\n---\n` frontmatter from the body. Throws when the file has no frontmatter. */
export function splitFrontmatter(raw: string): SplitDocument {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) throw new Error('File has no YAML frontmatter.');
  return { frontmatter: match[1], body: match[2] };
}

/** Parse source YAML strictly; aliases and non-mapping documents are refused. */
export function parseFrontmatter(source: string): Record<string, FrontmatterValue> {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length) throw document.errors[0];
  const fields: unknown = document.toJS({ maxAliasCount: 0 });
  if (!fields || Array.isArray(fields) || typeof fields !== 'object')
    throw new Error('Frontmatter must be a mapping.');
  return fields as Record<string, FrontmatterValue>;
}
