// SPDX-License-Identifier: GPL-3.0-only
/** Markdown helpers shared by the commit and link checkers: GitHub heading slugs and link extraction. */

/**
 * GitHub's heading anchor rule: strip inline markup, lower-case, drop every character that is not a
 * letter, number, mark, space, hyphen or underscore, then replace spaces with hyphens. Repeated headings
 * get `-1`, `-2` suffixes in document order.
 */
export function slugify(heading: string): string {
  const text = heading
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[*]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase();
  return text.replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/ /g, '-');
}

/** Every anchor that resolves in `markdown`, following GitHub's duplicate-suffix rule. */
export function headingAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>();
  const seen = new Map<string, number>();
  let fence: string | undefined;
  for (const line of markdown.split('\n')) {
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1];
      else if (fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = undefined;
      continue;
    }
    if (fence) continue;
    const heading = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!heading) continue;
    const base = slugify(heading[1]);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  for (const match of markdown.matchAll(/<(?:a|h[1-6]|div|span)\b[^>]*\b(?:id|name)="([^"]+)"/g)) {
    anchors.add(match[1]);
  }
  return anchors;
}

export interface MarkdownLink {
  line: number;
  target: string;
}

/**
 * Inline links and images outside fenced code blocks and inline code spans. Reference-style
 * definitions (`[id]: target`) are included; footnote definitions are not links and are skipped.
 */
export function extractLinks(markdown: string): MarkdownLink[] {
  const links: MarkdownLink[] = [];
  let fence: string | undefined;
  markdown.split('\n').forEach((rawLine, index) => {
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(rawLine);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1];
      else if (fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = undefined;
      return;
    }
    if (fence) return;
    const line = rawLine.replace(/`[^`]*`/g, match => ' '.repeat(match.length));
    const push = (target: string) => {
      const cleaned = target.trim().replace(/^<(.*)>$/, '$1');
      if (cleaned) links.push({ line: index + 1, target: cleaned });
    };
    for (const match of line.matchAll(/!?\[[^\]]*\]\(([^()\s]*(?:\([^()\s]*\)[^()\s]*)*)(?:\s+"[^"]*")?\)/g)) {
      push(match[1]);
    }
    const definition = /^\s{0,3}\[([^\]^][^\]]*)\]:\s+(\S+)/.exec(line);
    if (definition) push(definition[2]);
  });
  return links;
}

/** True for absolute URLs, `mailto:`, custom schemes such as `scc.v1:`, and protocol-relative links. */
export function isExternal(target: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');
}
