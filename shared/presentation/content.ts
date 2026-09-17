// SPDX-License-Identifier: GPL-3.0-only
/** UI-only source projection. Run after sanitization; never changes stored or headless content. */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { Element, ElementContent, Root, RootContent } from 'hast';
import type { Root as MarkdownRoot } from 'mdast';
import { visit } from 'unist-util-visit';
import { describeGlyph, tokenizeGlyphText, type Characteristic, type Glyph } from './glyphs.ts';

type Node = ElementContent;
const text = (value: string): Node => ({ type: 'text', value });
const element = (tagName: string, children: Node[], className?: string): Element => ({
  type: 'element',
  tagName,
  properties: className ? { className: [className] } : {},
  children,
});
const isElement = (node: RootContent): node is Element => node.type === 'element';
const content = (node: RootContent): string =>
  node.type === 'text' ? node.value : 'children' in node ? node.children.map(content).join('') : '';
const elements = (node: Element) => node.children.filter(isElement);
const named = (node: Element, name: string) => elements(node).filter(n => n.tagName === name);
const words = ['Might', 'Agility', 'Reason', 'Intuition', 'Presence'];

/** Native HAST output uses the same descriptor as React and the reference HTML renderer. */
export function glyphNode(token: Glyph): Element {
  const p = describeGlyph(token);
  const visual = element(
    'span',
    [
      {
        ...element('span', [], 'ds-glyph'),
        properties: { className: ['ds-glyph'], dataGlyph: p.characters },
      },
      text(p.suffix),
    ],
    'ds-symbol-visual',
  );
  visual.properties.ariaHidden = 'true';
  const fallback = element('span', [text(p.text)], 'ds-symbol-text');
  fallback.properties.ariaHidden = 'true';
  const node = element('span', [visual, fallback], 'ds-symbol');
  Object.assign(
    node.properties,
    'role' in p.accessibility ? { role: 'img', ariaLabel: p.text } : { ariaHidden: 'true' },
  );
  return node;
}
function runs(value: string): Node[] {
  return tokenizeGlyphText(value).map(run =>
    typeof run === 'string' ? text(run) : glyphNode(run),
  );
}

/** Only the leading printed damage grammar licenses isolated M/A/R/I/P, never the pronoun I. */
function damage(nodes: Node[]): Node[] {
  const value = nodes.map(content).join('');
  const match =
    /^(\s*(?:(?:\d+d\d+|\d+) \+ )*)([MAIRP](?:,? (?:or )?[MAIRP])*)(?= (?:\w+ )?damage)/.exec(
      value,
    );
  if (!match) return nodes;
  const start = match[1].length;
  const end = match[0].length;
  let offset = 0;
  const walk = (node: Node): Node[] => {
    if (node.type === 'text') {
      const result: Node[] = [];
      let cursor = 0;
      for (const m of node.value.matchAll(/[MAIRP]/g)) {
        if (offset + m.index < start || offset + m.index >= end) continue;
        result.push(
          text(node.value.slice(cursor, m.index)),
          glyphNode({ kind: 'characteristic', characteristic: m[0] as Characteristic }),
        );
        cursor = m.index + 1;
      }
      result.push(text(node.value.slice(cursor)));
      offset += node.value.length;
      return result;
    }
    if (isElement(node)) {
      if (['code', 'pre'].includes(node.tagName)) {
        offset += content(node).length;
        return [node];
      }
      return [{ ...node, children: node.children.flatMap(walk) }];
    }
    return [node];
  };
  return nodes.flatMap(walk);
}

function field(cell: Element): { label: string; value: Node[] } | undefined {
  const at = cell.children.findIndex(n => isElement(n) && n.tagName === 'br');
  if (at < 0) return undefined;
  return {
    label: cell.children
      .slice(at + 1)
      .map(content)
      .join('')
      .trim(),
    value: cell.children.slice(0, at),
  };
}
function definition(label: string, value: Node[], characteristic = false): Element {
  return element('div', [
    element(
      'dt',
      characteristic
        ? [glyphNode({ kind: 'characteristicName', characteristic: label[0] as Characteristic })]
        : [text(label)],
    ),
    element('dd', value),
  ]);
}
function tableProjection(table: Element): Element | undefined {
  const head = named(table, 'thead')[0];
  const body = named(table, 'tbody')[0];
  const header = head && named(head, 'tr')[0];
  const rows = body && named(body, 'tr');
  if (!header || !rows) return;
  const cells = elements(header);
  // A complete, recognized printed grid only. Unknown tables remain intact and readable.
  if (cells.length === 5 && rows.length >= 3 && /^Level \d+$/.test(content(cells[2]))) {
    const statRows = rows.slice(0, -2).map(row => elements(row).map(field));
    const defenses = elements(rows.at(-2)!).map(
      cell => field(cell) ?? (['-', ''].includes(content(cell).trim()) ? null : undefined),
    );
    const scores = elements(rows.at(-1)!).map(field);
    if (
      statRows.some(
        stats => stats.map(f => f?.label).join('|') !== 'Size|Speed|Stamina|Stability|Free Strike',
      ) ||
      scores.map(f => f?.label).join('|') !== words.join('|') ||
      defenses.includes(undefined) ||
      content(cells[1]).trim() !== '-'
    )
      return;
    return element(
      'section',
      [
        element(
          'header',
          [
            element('div', cells[0].children),
            element('div', [
              element('strong', [...cells[2].children, text(' '), ...cells[3].children]),
              element('div', cells[4].children),
            ]),
          ],
          'ds-monster-title',
        ),
        ...statRows.map(stats =>
          element(
            'dl',
            stats.map(f => definition(f!.label, f!.value)),
            'ds-stats',
          ),
        ),
        element(
          'dl',
          defenses.filter(f => !!f).map(f => definition(f!.label, f!.value)),
          'ds-defenses',
        ),
        element(
          'dl',
          scores.map(f => definition(f!.label, f!.value, true)),
          'ds-characteristics',
        ),
      ],
      'ds-statblock',
    );
  }
  if (cells.length === 2 && rows.length === 1) {
    const placement = elements(rows[0]);
    if (
      placement.length !== 2 ||
      !content(placement[0]).includes('📏') ||
      !content(placement[1]).includes('🎯')
    )
      return;
    return element(
      'div',
      [
        element(
          'div',
          cells.map(c => element('div', c.children)),
          'ds-feature-meta',
        ),
        element(
          'div',
          placement.map(c => element('div', c.children)),
          'ds-feature-meta',
        ),
      ],
      'ds-ability-metadata',
    );
  }
}

/** Slice text coordinates through inline markup, retaining links/emphasis on both sides. */
function inlineSlice(nodes: Node[], start: number, end: number): Node[] {
  let offset = 0;
  return nodes.flatMap(node => {
    const length = content(node).length;
    const from = Math.max(0, start - offset),
      to = Math.min(length, end - offset);
    offset += length;
    if (to <= from) return [];
    if (node.type === 'text') return [text(node.value.slice(from, to))];
    if (isElement(node)) return [{ ...node, children: inlineSlice(node.children, from, to) }];
    return [node];
  });
}
function featureTitle(node: Element) {
  const value = content(node);
  const icon = /^[🗡🏹⚔👤🔳❇🌀❗☠❕⭐★][\uFE0E\uFE0F]?\s*/u.exec(value);
  if (!icon) return;
  const cost = /\((?:Signature Ability|[^()]*Malice|Villain Action[^()]*)\)$/i.exec(value);
  node.properties.className = ['ds-feature-title'];
  node.children = [
    text(icon[0]),
    element('span', inlineSlice(node.children, icon[0].length, cost?.index ?? value.length)),
    ...(cost
      ? [
          element(
            'strong',
            inlineSlice(node.children, cost.index + 1, value.length - 1),
            'ds-feature-cost',
          ),
        ]
      : []),
  ];
}
/** A standalone article has an outer page/dialog heading; repeat its identity inside the band. */
export function addContentTitle(tree: Root, title?: string) {
  if (!title) return;
  const block = tree.children.find(
    n => isElement(n) && n.properties.className?.toString() === 'ds-statblock',
  );
  if (!block || !isElement(block)) return;
  const header = elements(block)[0],
    identity = header && elements(header)[0];
  if (identity) identity.children.unshift(element('strong', [text(title)], 'ds-monster-name'));
}

export function presentContent(tree: Root) {
  const walk = (parent: Root | Element) => {
    if (
      parent.type === 'element' &&
      (['code', 'pre'].includes(parent.tagName) ||
        parent.properties.className?.toString().includes('ds-symbol'))
    )
      return;
    parent.children = parent.children
      .filter((node): node is ElementContent => node.type !== 'doctype')
      .flatMap((original): Node[] => {
        if (original.type === 'doctype') return [];
        if (original.type === 'text') return runs(original.value);
        if (!isElement(original)) return [original];
        let node = original;
        if (node.tagName === 'table') node = tableProjection(node) ?? node;
        if (node.tagName === 'ul') {
          const items = named(node, 'li');
          const labels = ['≤11:', '12-16:', '17+:'];
          if (
            items.length === 3 &&
            items.every(
              (item, i) =>
                item.children[0]?.type === 'element' &&
                item.children[0].tagName === 'strong' &&
                content(item.children[0]) === labels[i],
            )
          ) {
            node.tagName = 'ol';
            node.properties.className = ['ds-tiers'];
            items.forEach((item, i) => {
              item.children = [
                glyphNode({ kind: 'tier', tier: (i + 1) as 1 | 2 | 3 }),
                element('div', damage(item.children.slice(1))),
              ];
            });
          }
        }
        if (
          node.tagName === 'blockquote' &&
          /^[🗡🏹⚔👤🔳❇🌀❗☠❕⭐★]/u.test(content(elements(node)[0] ?? text('')))
        )
          node.properties.className = ['ds-feature'];
        if (/^(p|h[1-6])$/.test(node.tagName)) featureTitle(node);
        walk(node);
        return [node];
      });
    // Expanded book chapters carry the creature heading immediately before its grid.
    for (let i = parent.children.length - 1; i >= 0; i--) {
      const block = parent.children[i];
      if (!isElement(block) || block.properties.className?.toString() !== 'ds-statblock') continue;
      let previous = i - 1;
      while (
        previous >= 0 &&
        parent.children[previous].type === 'text' &&
        !content(parent.children[previous]).trim()
      )
        previous--;
      const heading = parent.children[previous];
      if (heading && isElement(heading) && /^h[1-6]$/.test(heading.tagName)) {
        elements(elements(block)[0])[0].children.unshift(heading);
        parent.children.splice(previous, 1);
      }
    }
  };
  walk(tree);
}
export function rehypeCorePresentation() {
  return presentContent;
}

/** Strip YAML/presentation attributes, retaining glyph markers for the semantic adapter. */
export function presentationMarkdown(source: string): string {
  return source
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    .replace(/\{(?:data-[\w-]+="[^"]*"\s*)+\}/g, '')
    .replace(/^([ \t>]*)(#{7,})\s+(.+)$/gm, '$1**$3**');
}

/** SCC references encode exact app paths; unrelated URL schemes are handled by the sanitizer. */
export function sourceUrl(url: string): string {
  const match = /^scc\.v1:mcdm\.(heroes|monsters)\.v1\/(.+)$/.exec(url);
  return match ? `/rules/${match[1]}/${match[2].replaceAll('.', '/')}` : url;
}
const parser = unified().use(remarkParse).use(remarkGfm);
const renderer = unified()
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize)
  .use(rehypeCorePresentation)
  .use(rehypeStringify);
export function renderSource(source: string, title?: string): string {
  const tree = parser.parse(presentationMarkdown(source)) as MarkdownRoot;
  visit(tree, 'link', node => {
    node.url = sourceUrl(node.url);
  });
  visit(tree, 'definition', node => {
    node.url = sourceUrl(node.url);
  });
  const rendered = renderer.runSync(tree);
  addContentTitle(rendered, title);
  return renderer.stringify(rendered);
}
/** Immutable Foe editions keep their original HTML. Apply this projection at the UI boundary. */
export function presentSourceHtml(source: string, title?: string): string {
  const tree: MarkdownRoot = { type: 'root', children: [{ type: 'html', value: source }] };
  const rendered = renderer.runSync(tree);
  addContentTitle(rendered, title);
  return renderer.stringify(rendered);
}

/** Select a named embedded ability by a real source heading, never by an editable actor name. */
export function embeddedAbility(source: string, name: string): string | undefined {
  const body = presentationMarkdown(source);
  const tree = parser.parse(body) as MarkdownRoot;
  const at = tree.children.findIndex(
    n =>
      n.type === 'heading' && n.children.map(c => ('value' in c ? c.value : '')).join('') === name,
  );
  const heading = tree.children[at];
  if (heading?.type !== 'heading') return;
  const end = tree.children
    .slice(at + 1)
    .find(n => n.type === 'heading' && n.depth <= heading.depth);
  return body.slice(heading.position!.end.offset!, end?.position?.start.offset);
}
