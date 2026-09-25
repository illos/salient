// SPDX-License-Identifier: GPL-3.0-only
/**
 * The printed body of a pinned Compendium file: its leading YAML frontmatter removed. Compendium
 * entry `text` is the byte-exact file (shared/contracts/content.ts), so any ability text shown as
 * printed prose must pass through here; the frontmatter's facts are read from `structured` instead.
 */
export function sourceBody(text: string): string {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').replace(/^(?:[ \t]*\r?\n)+/, '');
}
