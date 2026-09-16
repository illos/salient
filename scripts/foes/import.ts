// SPDX-License-Identifier: GPL-3.0-only
import { createHash } from 'node:crypto';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { toString } from 'mdast-util-to-string';
import { parse } from 'yaml';
import type { Fields, FoeObject, FoePackage, Json } from '../../shared/contracts/foes.ts';
import { SELECTION } from './batches.ts';
import { splitFrontmatter } from '../lib/frontmatter.ts';

export const REVISION = 'fb83a789da8f0327a389c277a0c790b1648d5810';
export const GENERATOR = '1.1.0';
export interface Input {
  path: string;
  json: string;
  markdown: string;
  linkedMarkdown: string;
}
export interface Identity {
  parent: string;
  fingerprint: string;
  id: string;
}
export interface Correction {
  id: string;
  revision: string;
  field: string;
  expected: Json;
  replacement: Json;
  reason: string;
}
export function hash(value: unknown) {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(value))
    .digest('hex');
}
export function tags(value: Json | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '' && v !== '-')
    : [];
}
export function plain(value: unknown): string {
  return String(value ?? '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
export function applyCorrections(
  objects: FoeObject[],
  corrections: Correction[],
  revision: string,
) {
  const used = new Set<string>();
  for (const c of corrections) {
    const targets = objects.filter(o => o.id === c.id);
    const key = `${c.id}/${c.field}`;
    if (
      c.revision !== revision ||
      !c.reason.trim() ||
      used.has(key) ||
      targets.length !== 1 ||
      JSON.stringify(c.field === '$markdown' ? targets[0].markdown : targets[0].fields[c.field]) !==
        JSON.stringify(c.expected)
    )
      throw new Error(`Stale or ambiguous correction: ${key}`);
    if (['name', 'feature_type', 'type', 'features', 'metadata'].includes(c.field))
      throw new Error(`Identity/envelope correction needs an explicit mapping: ${key}`);
    if (c.field === '$markdown') {
      if (typeof c.replacement !== 'string') throw new Error('Markdown correction must be text');
      targets[0].markdown = c.replacement;
    } else targets[0].fields[c.field] = structuredClone(c.replacement);
    used.add(key);
  }
}
const parser = unified().use(remarkParse).use(remarkGfm);
export function sections(markdown: string) {
  return parser.parse(markdown).children.map(n => ({
    type: n.type,
    markdown: markdown.slice(n.position!.start.offset!, n.position!.end.offset!),
  }));
}
/** Positional spans preserve every byte, including text not modeled as an effect. */
export function featureSpans(markdown: string) {
  const { body } = splitFrontmatter(markdown);
  const offset = markdown.length - body.length;
  const starts = [...body.matchAll(/^>[ \t]*[\u0080-\uFFFF]+[ \t]+\*\*/gm)].map(
    m => m.index! + offset,
  );
  return starts.map((start, i) => ({
    start,
    end: starts[i + 1] ?? markdown.length,
    markdown: markdown.slice(start, starts[i + 1] ?? markdown.length),
  }));
}
export function fingerprint(record: Fields) {
  return hash(record);
}
/** Report source paragraphs absent from structured effects rather than hiding them in comparisons. */
export function unmodeledText(markdown: string, feature: Fields): string {
  const nodes = parser
    .parse(markdown)
    .children.slice(1)
    .filter(n => n.type !== 'table');
  let text = plain(nodes.map(n => toString(n)).join(' '));
  const values = [
    feature.trigger,
    ...((feature.effects ?? []) as Fields[]).flatMap(e =>
      ['name', 'cost', 'effect', 'roll', 'tier1', 'tier2', 'tier3'].map(k => e[k]),
    ),
  ];
  for (const value of values) if (typeof value === 'string') text = text.replace(plain(value), '');
  return text.replace(/(?:≤11|12-16|17\+|Trigger):/g, '').replace(/[:\s]/g, '');
}
function validateSource(record: Fields, markdown: string) {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const front = parse(frontmatter) as Fields;
  for (const [key, value] of Object.entries(front)) {
    const other = key === 'scc' ? (record.metadata as Fields).scc : record[key];
    if (JSON.stringify(value) !== JSON.stringify(other))
      throw new Error(`JSON/Markdown disagreement: ${record.name}/${key}`);
  }
  validatePrinted(record, body);
}
function validatePrinted(record: Fields, body: string) {
  if (record.type === 'statblock') {
    for (const [key, label] of Object.entries({
      size: 'Size',
      speed: 'Speed',
      stamina: 'Stamina',
      stability: 'Stability',
      free_strike: 'Free Strike',
      might: 'Might',
      agility: 'Agility',
      reason: 'Reason',
      intuition: 'Intuition',
      presence: 'Presence',
    })) {
      const match = body.match(new RegExp(`\\*\\*([^*]+)\\*\\*<br>${label}(?=\\s*\\|)`));
      if (!match || match[1].replace(/^\+/, '') !== String(record[key]))
        throw new Error(`Printed stat disagreement: ${record.name}/${key}`);
    }
    const cells = body
      .split('\n')
      .find(l => l.startsWith('|'))!
      .split('|')
      .slice(1, -1)
      .map(plain);
    if (
      cells[0] !== tags(record.keywords).join(', ') ||
      cells[2] !== `Level ${record.level}` ||
      cells[3] !== `${record.organization} ${record.role ?? ''}`.trim() ||
      cells[4] !== `EV ${record.ev}`
    )
      throw new Error(`Printed envelope disagreement: ${record.name}`);
    for (const [key, label] of Object.entries({
      immunities: 'Immunity',
      weaknesses: 'Weakness',
      movement: 'Movement',
      with_captain: 'With Captain',
    })) {
      const match = body.match(new RegExp(`\\*\\*([^*]+)\\*\\*<br>${label}(?=\\s*\\|)`));
      const expected = Array.isArray(record[key])
        ? (record[key] as Json[]).join(', ')
        : record[key] || '-';
      if (!match || plain(match[1]) !== plain(expected))
        throw new Error(`Printed envelope disagreement: ${record.name}/${key}`);
    }
  }
}
function validateFeature(feature: Fields, md: string, parent: string) {
  const nodes = parser.parse(md).children;
  const title = toString(nodes[0]);
  const tables = nodes.filter(n => n.type === 'table');
  if (feature.feature_type === 'ability') {
    const expected = [
      [tags(feature.keywords).join(', ') || '-', String(feature.usage ?? '-')],
      [`📏 ${feature.distance}`, `🎯 ${feature.target}`],
    ];
    const cells = tables[0]?.children.map(row => row.children.map(cell => toString(cell)));
    if (tables.length !== 1 || JSON.stringify(cells) !== JSON.stringify(expected))
      throw new Error(`Feature envelope disagreement: ${parent}/${feature.name}`);
  } else if (tables.length) throw new Error(`Unmodeled feature table: ${parent}/${feature.name}`);
  const qualifier = feature.ability_type || feature.cost;
  if (
    title.replace(/^[^\p{L}\p{N}]+/u, '') !== `${feature.name}${qualifier ? ` (${qualifier})` : ''}`
  )
    throw new Error(`Feature heading disagreement: ${parent}/${feature.name}`);
  // Require all upstream effect fields and metadata to occur in this exact complete source span,
  // in their semantic sequence. JSON object key order itself is not a rules ordering contract.
  let cursor = 0;
  const sourceText = plain(md);
  for (const effect of (feature.effects ?? []) as Fields[]) {
    for (const key of ['name', 'cost', 'effect', 'roll', 'tier1', 'tier2', 'tier3']) {
      if (typeof effect[key] !== 'string') continue;
      const text = plain(effect[key]);
      const position = sourceText.indexOf(text, cursor);
      if (position < 0)
        throw new Error(`Missing/reordered source text: ${parent}/${feature.name}/${key}`);
      cursor = position + text.length;
    }
  }
  for (const key of ['usage', 'distance', 'target', 'trigger', 'cost', 'ability_type']) {
    if (feature[key] && feature[key] !== '-' && !sourceText.includes(plain(feature[key])))
      throw new Error(`Missing feature field: ${parent}/${feature.name}/${key}`);
  }
}
export async function importFoes(
  inputs: Input[],
  identities: Identity[],
  corrections: Correction[] = [],
  rulePaths: Record<string, string> = {},
): Promise<FoePackage> {
  const objects: FoeObject[] = [];
  const ids = new Set<string>();
  const render = async (md: string) =>
    String(
      await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .process(
          md.replace(
            /\]\(scc\.v1:([^)]+)\)/g,
            (_, id: string) =>
              `](${rulePaths[id] ? `/rules/${rulePaths[id]}` : `https://steelcompendium.io/v2/scc/${id}/`})`,
          ),
        ),
    );
  for (const input of inputs) {
    const record = JSON.parse(input.json) as Fields;
    validateSource(record, input.markdown);
    const parent = String((record.metadata as Fields).scc);
    const spans = featureSpans(input.markdown);
    const features = record.features as Fields[];
    if (spans.length !== features.length)
      throw new Error(`Incomplete feature boundaries: ${parent}`);
    const metadata = {
      revision: REVISION,
      path: `en/books/monsters/md/${input.path}.md`,
      scc: parent,
    };
    const prefix = input.markdown.slice(
      input.markdown.length - splitFrontmatter(input.markdown).body.length,
      spans[0]?.start ?? input.markdown.length,
    );
    const { features: _features, metadata: _metadata, ...fields } = record;
    const block: FoeObject = {
      id: parent,
      kind: record.type === 'statblock' ? 'statblock' : 'malice',
      name: String(record.name),
      featureIds: [],
      supportingIds: [],
      fields,
      keywords: tags(record.keywords),
      usage: null,
      sections: sections(prefix),
      markdown: prefix,
      html: await render(prefix),
      source: { ...metadata, start: 0, end: input.markdown.length },
      original: {
        record,
        markdown: input.markdown,
        json: input.json,
        linkedMarkdown: input.linkedMarkdown,
      },
      diagnostics: [],
    };
    objects.push(block);
    for (const [order, feature] of features.entries()) {
      const matches = identities.filter(
        i => i.parent === parent && i.fingerprint === fingerprint(feature),
      );
      if (matches.length !== 1 || ids.has(matches[0].id))
        throw new Error(`Missing/ambiguous feature identity: ${parent}/${feature.name}`);
      const id = matches[0].id;
      ids.add(id);
      const span = spans[order];
      const md = span.markdown.replace(/^> ?/gm, '').trim();
      validateFeature(feature, md, parent);
      const kind = block.kind === 'malice' ? 'malice' : feature.feature_type;
      if (kind !== 'malice' && kind !== 'ability' && kind !== 'trait')
        throw new Error(`Unknown feature type ${kind}`);
      objects.push({
        id,
        kind,
        name: String(feature.name),
        parentId: parent,
        order,
        featureIds: [],
        supportingIds: [],
        fields: structuredClone(feature),
        keywords: tags(feature.keywords),
        usage: typeof feature.usage === 'string' && feature.usage !== '-' ? feature.usage : null,
        sections: sections(md),
        markdown: md,
        html: await render(md),
        source: { ...metadata, start: span.start, end: span.end },
        original: { record: feature, markdown: span.markdown },
        diagnostics: [],
      });
      block.featureIds.push(id);
    }
  }
  if (new Set(objects.map(o => o.id)).size !== objects.length)
    throw new Error('Duplicate object identity');
  for (const correction of corrections) {
    if (
      correction.field !== '$markdown' &&
      !corrections.some(c => c.id === correction.id && c.field === '$markdown')
    )
      throw new Error('A field correction must include its corrected display Markdown');
  }
  applyCorrections(objects, corrections, REVISION);

  for (const object of objects) {
    if (object.parentId) {
      validateFeature(object.fields, object.markdown, object.parentId);
      const remainder = unmodeledText(object.markdown, object.fields);
      if (remainder) object.diagnostics.push(`Unmodeled source text: ${remainder}`);
    }
    if (!object.parentId) {
      validatePrinted(object.fields, object.markdown);
      const nodes = parser.parse(object.markdown).children;
      if (object.kind === 'statblock') {
        const tables = nodes.filter(n => n.type === 'table');
        const cells = tables[0]?.children.map(row => row.children.map(cell => toString(cell)));
        if (
          tables.length !== 1 ||
          cells?.length !== 4 ||
          cells.some(row => row.length !== 5) ||
          cells[0][1] !== '-' ||
          cells[2][2] !== '-'
        )
          object.diagnostics.push('Unmodeled statblock table content');
      }
      const prose = plain(
        nodes
          .filter(n => n.type !== 'table')
          .map(n => toString(n))
          .join(' '),
      );
      const expected = object.kind === 'malice' ? plain(object.fields.flavor) : '';
      if (prose !== expected) object.diagnostics.push(`Unmodeled parent text: ${prose}`);
    }
    if (!object.parentId) {
      const selected = SELECTION.find(
        entry => object.source.path === `en/books/monsters/md/${entry.path}.md`,
      );
      object.supportingIds = (selected?.supportingPaths ?? []).flatMap(path => {
        const supporting = objects.find(
          o => !o.parentId && o.source.path === `en/books/monsters/md/${path}.md`,
        );
        return supporting ? [supporting.id] : [];
      });
    }
    object.sections = sections(object.markdown);
    object.html = await render(object.markdown);
    object.keywords = tags(object.fields.keywords);
    const villain = /^Villain Action ([1-3])$/.exec(String(object.fields.cost ?? ''));
    if (object.parentId)
      object.activation = {
        signature: object.fields.ability_type === 'Signature Ability',
        villainAction: villain ? Number(villain[1]) : null,
        costText: villain
          ? null
          : typeof object.fields.cost === 'string'
            ? object.fields.cost
            : null,
      };
    const known = new Set([
      'agility',
      'ev',
      'free_strike',
      'immunities',
      'intuition',
      'keywords',
      'level',
      'might',
      'movement',
      'name',
      'organization',
      'presence',
      'reason',
      'role',
      'size',
      'speed',
      'stability',
      'stamina',
      'type',
      'weaknesses',
      'with_captain',
      'flavor',
      'kind',
      'ability_type',
      'distance',
      'effects',
      'feature_type',
      'icon',
      'target',
      'usage',
      'cost',
      'trigger',
      'body',
      'intro',
      'power_roll',
      'sections',
    ]);
    for (const key of Object.keys(object.fields))
      if (!known.has(key)) object.diagnostics.push(`Unmodeled source field: ${key}`);
    object.usage =
      typeof object.fields.usage === 'string' && object.fields.usage !== '-'
        ? object.fields.usage
        : null;
    if (object.kind === 'statblock') {
      const printed = String(object.fields.ev ?? '');
      const match = /^(\d+)(?: for (four|4) minions)?$/.exec(printed);
      object.ev = {
        printed,
        amount: match ? Number(match[1]) : null,
        quantity: match ? (match[2] ? 4 : 1) : null,
      };
      if (!match) object.diagnostics.push('Unresolved encounter value');
    }
  }
  const search = objects.map(o => ({
    id: o.id,
    kind: o.kind,
    name: o.name,
    parentName: objects.find(p => p.id === o.parentId)?.name ?? '',
    text: plain(o.markdown),
    keywords: o.keywords,
    usage: o.usage,
  }));
  const payload = {
    schema: 'foes.1' as const,
    generator: GENERATOR,
    sourceRevision: REVISION,
    objects,
    search,
    corrections: corrections as unknown as Fields[],
  };
  return { ...payload, edition: hash(payload) };
}
