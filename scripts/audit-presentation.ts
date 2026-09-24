// SPDX-License-Identifier: GPL-3.0-only
/** Source-to-production coverage: each raw Core record once, before expanded duplicates. */
import { execFileSync } from 'node:child_process';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Glyph } from '../web/components/glyph.tsx';
import { renderSource } from '../shared/presentation/content.ts';
import { describeGlyph, tokenizeGlyphText, sourceIcon } from '../shared/presentation/glyphs.ts';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Glyph as GlyphToken, Characteristic } from '../shared/presentation/glyphs.ts';
import { splitFrontmatter } from './lib/frontmatter.ts';
import { vendorDir } from './lib/vendor.ts';

/** Unsupported notation remains literal and is visible in the build report, never guessed. */
export function auditPatternFallbacks(body: string) {
  const diagnostics: { offset: number; source: string; reason: string }[] = [];
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body);
  visit(tree, 'text', node => {
    for (const match of node.value.matchAll(
      /\b[MAIRP]\s*(?:<=|>=|<|>|≤|≥)\s*(?:[A-Z]+|-?\d+(?:\.\d+)?)/g,
    )) {
      const tokens = tokenizeGlyphText(match[0]);
      if (tokens.length !== 1 || typeof tokens[0] === 'string')
        diagnostics.push({
          offset: (node.position?.start.offset ?? 0) + match.index,
          source: match[0],
          reason: 'Unrecognized comparison retained as source text',
        });
    }
    const marker = /^(\p{Extended_Pictographic}[\uFE0E\uFE0F]?)\s*$/u.exec(node.value);
    if (marker && !sourceIcon(marker[1]))
      diagnostics.push({
        offset: node.position?.start.offset ?? 0,
        source: marker[1],
        reason: 'Unknown feature marker retained as source text',
      });
  });
  return diagnostics;
}

export function auditPresentation() {
  const revision = 'fb83a789da8f0327a389c277a0c790b1648d5810';
  const cwd = vendorDir('steel-compendium');
  const paths = execFileSync(
    'git',
    ['ls-tree', '-r', '--name-only', revision, '--', 'en/books/heroes/md', 'en/books/monsters/md'],
    { cwd, encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .filter(p => p.endsWith('.md'));
  const bytes = execFileSync('git', ['cat-file', '--batch'], {
    cwd,
    input: paths.map(p => `${revision}:${p}\n`).join(''),
    maxBuffer: 64 * 1024 * 1024,
  });
  let offset = 0;
  const records = [];
  const fallbacks: { path: string; offset: number; source: string; reason: string }[] = [];
  const diagnostics: { path: string; name: string; expected: number; rendered: number }[] = [];
  let potencies = 0,
    markers = 0,
    tiers = 0,
    characteristics = 0;
  const parser = unified().use(remarkParse).use(remarkGfm);
  for (const path of paths) {
    const end = bytes.indexOf(10, offset);
    const size = Number(bytes.subarray(offset, end).toString().split(' ')[2]);
    if (!Number.isSafeInteger(size)) throw new Error(`Missing source ${path}`);
    offset = end + 1;
    const { body } = splitFrontmatter(bytes.subarray(offset, offset + size).toString());
    offset += size + 1;
    const html = renderSource(body);
    fallbacks.push(...auditPatternFallbacks(body).map(d => ({ path, ...d })));
    const occurrences: { offset: number; token: GlyphToken; name: string }[] = [];
    const expected = new Map<string, number>();
    const record = (token: GlyphToken, offset: number) => {
      const name = describeGlyph(token).text;
      expected.set(name, (expected.get(name) ?? 0) + 1);
      if (
        !renderToStaticMarkup(createElement(Glyph, { token })).includes(
          `role="img" aria-label="${name}"`,
        )
      )
        throw new Error(`React semantics missing: ${name}`);
      occurrences.push({ offset, token, name });
    };
    // Independent source grammar, not the renderer tokenizer's count.
    for (const match of body.matchAll(
      /\b[MAIRP] < (?:\d+|WEAK|AVERAGE|STRONG)\b|[📏🎯🗡⚔⭐★🌀❕❗🔳🏹👤❇☠][\uFE0E\uFE0F]?/gu,
    )) {
      const token = tokenizeGlyphText(match[0])[0];
      if (!token || typeof token === 'string')
        throw new Error(`Unknown source pattern ${path}:${match.index}`);
      if (token.kind === 'potency') potencies++;
      else markers++;
      record(token, match.index);
    }
    for (const match of body.matchAll(/^[> \t]*- \*\*(≤11|12-16|17\+):\*\* (.*)$/gm)) {
      tiers++;
      record(
        {
          kind: 'tier',
          tier: ({ '≤11': 1, '12-16': 2, '17+': 3 } as const)[match[1] as '≤11' | '12-16' | '17+'],
        },
        match.index,
      );
      const plain = toString(parser.parse(match[2]));
      const expression = plain.split('damage')[0];
      if (!plain.includes('damage')) continue;
      for (const c of expression.matchAll(/\b([MAIRP])\b(?!\s*<)/g)) {
        characteristics++;
        record({ kind: 'characteristic', characteristic: c[1] as Characteristic }, match.index);
      }
    }
    for (const match of body.matchAll(
      /\*\*[+-]?\d+\*\*<br>(Might|Agility|Reason|Intuition|Presence)/g,
    )) {
      characteristics++;
      record(
        { kind: 'characteristicName', characteristic: match[1][0] as Characteristic },
        match.index,
      );
    }
    for (const [name, count] of expected) {
      const actual = html.split(`aria-label="${name}"`).length - 1;
      if (actual !== count) diagnostics.push({ path, name, expected: count, rendered: actual });
    }
    records.push({ path, occurrences });
  }
  return {
    revision,
    scope:
      'Raw Core md bodies once; offsets relative to body; icons, potencies, printed tiers and characteristic fields/damage checked through production HAST and React adapters',
    recordCount: records.length,
    potencies,
    markers,
    tiers,
    characteristics,
    missing: diagnostics.length,
    diagnostics,
    fallbacks,
    records,
  };
}
