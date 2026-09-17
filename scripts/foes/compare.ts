// SPDX-License-Identifier: GPL-3.0-only
import type { Fields, FoeObject, FoePackage, Json } from '../../shared/contracts/foes.ts';
import { SELECTION } from './batches.ts';
import { readFileSync } from 'node:fs';
import { hash, plain, tags, REVISION } from './import.ts';
export const EXTERNAL_REVISION = 'eba4b8bb8bc1baf947f15e67e9e923951092fd89';
export const COMPARISON_INVENTORY = JSON.parse(
  readFileSync(new URL('./comparison-inventory.json', import.meta.url), 'utf8'),
) as {
  revision: string;
  files: { path: string; id: string; sha256: string }[];
  unavailable: {
    id: string;
    source: string;
    name: string;
    level: unknown;
    counterpart: string;
    disposition: string;
    sourceJsonSha256: string;
    sourceMarkdownSha256: string;
    projectionSha256: string;
  }[];
  unmatchedExternal: { id: string; disposition: string }[];
};
interface Resolution {
  id: string;
  field: string;
  ours: unknown;
  theirs: unknown;
  disposition: string;
  source: string;
  sourceRevision: string;
  externalRevision: string;
  requiredSourceText?: string[];
}
const RESOLUTIONS = JSON.parse(
  readFileSync(new URL('./comparison-resolutions.json', import.meta.url), 'utf8'),
) as Resolution[];
const STATUSES = [
  'match',
  'explained',
  'review',
  'missing',
  'unavailable',
  'ambiguous',
  'error',
] as const;
export interface Difference {
  field: string;
  ours: unknown;
  theirs: unknown;
  classification: 'presentation' | 'review' | 'explained';
  disposition?: string;
  source?: string;
  raw?: { ours: unknown; theirs: unknown };
}
export interface ComparisonRow {
  id: string;
  name: string;
  counterpart: string;
  source: string;
  status: 'match' | 'explained' | 'review' | 'missing' | 'unavailable' | 'ambiguous' | 'error';
  differences: Difference[];
  error?: string;
  disposition?: string;
}
function norm(value: unknown): string {
  return plain(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/Power Roll/g, '2d10')
    .replace(/\s*<\s*/g, '<');
}
function orderedEffects(value: Json | undefined) {
  if (!Array.isArray(value)) throw new Error('Missing effects array');
  const stream = (value as Fields[]).flatMap(e => {
    const unknown = Object.keys(e).filter(
      k => !['name', 'cost', 'effect', 'roll', 'tier1', 'tier2', 'tier3'].includes(k),
    );
    if (unknown.length) throw new Error(`Unmodeled effect fields: ${unknown.join(', ')}`);
    return ['name', 'cost', 'effect', 'roll', 'tier1', 'tier2', 'tier3']
      .filter(k => e[k] !== undefined)
      .map(k => [k, norm(e[k])]);
  });
  // Adjacent prose paragraphs may be grouped differently. Do not cross a label, roll or tier.
  return stream.reduce<string[][]>((result, entry) => {
    if (entry[0] === 'effect' && result.at(-1)?.[0] === 'effect')
      result.at(-1)![1] += ` ${entry[1]}`;
    else result.push(entry);
    return result;
  }, []);
}
function defenses(value: Json | undefined) {
  return tags(value)
    .map(v => norm(v).toLowerCase())
    .sort();
}
function externalDefenses(value: Json | undefined) {
  if (!value || Array.isArray(value) || typeof value !== 'object')
    throw new Error('Invalid external defenses');
  return Object.entries(value)
    .map(([k, v]) => `${k.toLowerCase()} ${v}`)
    .sort();
}
/** Absence is reviewed against an exact source-derived projection, never a blanket content waiver. */
function unavailableProjection(pack: FoePackage, block: FoeObject) {
  const content = (object: FoeObject) => ({
    name: object.name,
    kind: object.kind,
    fields: object.fields,
    keywords: object.keywords,
    usage: object.usage,
    activation: object.activation ?? null,
    ev: object.ev ?? null,
    markdown: object.markdown,
    diagnostics: object.diagnostics,
  });
  return {
    parent: content(block),
    features: block.featureIds.map(id => {
      const feature = pack.objects.find(object => object.id === id);
      return feature ? content(feature) : null;
    }),
  };
}
export function compareBlock(
  pack: FoePackage,
  block: FoeObject,
  candidates: Fields[],
): ComparisonRow {
  const counterpart =
    SELECTION.find(entry => block.source.path === `en/books/${entry.book}/md/${entry.path}.md`)
      ?.counterpart ?? block.id.split('/').at(-1)!;
  const row: ComparisonRow = {
    id: block.id,
    name: block.name,
    counterpart,
    source: block.source.path,
    status: 'match',
    differences: [],
  };
  const matches = candidates.filter(c => c.id === counterpart);
  if (matches.length !== 1) {
    const absent = COMPARISON_INVENTORY.unavailable.find(
      entry =>
        entry.id === block.id &&
        entry.source === block.source.path &&
        entry.name === block.name &&
        JSON.stringify(entry.level) === JSON.stringify(block.fields.level ?? null) &&
        entry.counterpart === counterpart,
    );
    if (
      !matches.length &&
      absent &&
      !COMPARISON_INVENTORY.files.some(file => file.id === counterpart)
    ) {
      if (
        pack.sourceRevision !== REVISION ||
        block.source.revision !== REVISION ||
        hash(block.original.json ?? '') !== absent.sourceJsonSha256 ||
        hash(block.original.markdown) !== absent.sourceMarkdownSha256 ||
        hash(unavailableProjection(pack, block)) !== absent.projectionSha256
      )
        return {
          ...row,
          status: 'review',
          differences: [
            {
              field: 'unavailable source projection',
              ours: 'Source or displayed projection differs from reviewed pinned baseline',
              theirs: null,
              classification: 'review',
            },
          ],
        };
      return { ...row, status: 'unavailable', disposition: absent.disposition };
    }
    return { ...row, status: matches.length ? 'ambiguous' : 'missing' };
  }
  const other = matches[0];
  const compare = (
    field: string,
    a: unknown,
    b: unknown,
    normalize: (v: unknown) => unknown = norm,
  ) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    const same = JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
    row.differences.push({
      field,
      ours: a ?? null,
      theirs: b ?? null,
      classification: same ? 'presentation' : 'review',
    });
  };
  const explain = (field: string, disposition: string) => {
    const d = row.differences.find(d => d.field === field);
    if (d) {
      d.classification = 'explained';
      d.disposition = disposition;
    }
  };
  try {
    if ((other.source as Fields)?.book !== 'Monsters')
      throw new Error('Counterpart source is not Monsters');
    const knownParentFields =
      block.kind === 'malice'
        ? ['id', 'name', 'type', 'featureblockType', 'level', 'flavor', 'features', 'source']
        : [
            'id',
            'name',
            'level',
            'ev',
            'evQuantity',
            'role',
            'organization',
            'keywords',
            'size',
            'speed',
            'stamina',
            'stability',
            'freeStrike',
            'withCaptain',
            'characteristics',
            'immunities',
            'weaknesses',
            'movementTypes',
            'items',
            'source',
          ];
    const unknownParentFields = Object.keys(other).filter(key => !knownParentFields.includes(key));
    if (unknownParentFields.length)
      throw new Error(`Unmodeled external parent fields: ${unknownParentFields.join(', ')}`);
    if (
      block.kind !== 'malice' &&
      Object.keys((other.characteristics ?? {}) as Fields).some(
        key => !['might', 'agility', 'reason', 'intuition', 'presence'].includes(key),
      )
    )
      throw new Error('Unmodeled external characteristic');
    for (const diagnostic of block.diagnostics)
      row.differences.push({
        field: 'source coverage',
        ours: diagnostic,
        theirs: null,
        classification: 'review',
      });
    compare('name', block.name, other.name, v => norm(v).toLowerCase());
    compare('level', block.fields.level, other.level);
    if (block.kind === 'malice') {
      if (other.type !== 'featureblock') throw new Error('Wrong Malice counterpart type');
      if (
        block.name ===
          `${other.name} (Level ${block.fields.level}${String(other.featureblockType).startsWith('+') ? '' : ' '}${other.featureblockType})` &&
        other.level === block.fields.level &&
        ['+ Malice Features', 'Malice Features'].includes(String(other.featureblockType))
      )
        explain(
          'name',
          'Representation: local title retains the printed level qualifier; external level and featureblockType retain it separately.',
        );
      if (block.fields.level === undefined && other.level === 1)
        explain(
          'level',
          'External defaults an unqualified Malice block to level 1; pinned source prints no level. Preserve the absence of a printed qualifier.',
        );
      compare('flavor', block.fields.flavor, other.flavor);
    } else {
      for (const [ours, theirs] of Object.entries({
        organization: 'organization',
        role: 'role',
        size: 'size',
        speed: 'speed',
        stamina: 'stamina',
        stability: 'stability',
        free_strike: 'freeStrike',
        with_captain: 'withCaptain',
      }))
        compare(ours, block.fields[ours], other[theirs]);
      for (const c of ['might', 'agility', 'reason', 'intuition', 'presence'])
        compare(c, block.fields[c], (other.characteristics as Fields)?.[c]);
      compare('keywords', tags(block.fields.keywords), tags(other.keywords), v =>
        (v as string[]).slice().sort(),
      );
      compare('ev.amount', block.ev?.amount, other.ev);
      {
        compare('ev.quantity', block.ev?.quantity, other.evQuantity);
        if (
          new RegExp(`^${block.ev?.amount} for (?:four|4) minions$`).test(
            block.ev?.printed ?? '',
          ) &&
          block.ev?.quantity === 4 &&
          other.ev === block.ev?.amount &&
          other.evQuantity === undefined
        )
          explain(
            'ev.quantity',
            'External generated field omits the printed four-minion quantity. Preserve our printed source EV and its four-minion basis; no inference about the external app calculator.',
          );
      }
      if (block.ev?.quantity === 1 && other.evQuantity === undefined)
        explain(
          'ev.quantity',
          'External numeric EV has no explicit quantity; the printed unqualified source EV describes one creature. An explicit external quantity must agree.',
        );
      const movement =
        typeof block.fields.movement === 'string'
          ? block.fields.movement
              .toLowerCase()
              .split(',')
              .map(s => s.trim())
          : [];
      compare('movement', movement, other.movementTypes, v => v);
      if (movement.length === 0 && JSON.stringify(other.movementTypes) === '["walk"]')
        explain(
          'movement',
          'External default walk versus absent printed movement mode. Our absent source value remains absent.',
        );
      for (const field of ['immunities', 'weaknesses'])
        compare(field, defenses(block.fields[field]), externalDefenses(other[field]), v => v);
    }
    const features = block.featureIds.map(id => pack.objects.find(o => o.id === id)!);
    const external = (block.kind === 'malice' ? other.features : other.items) as Fields[];
    if (!Array.isArray(external)) throw new Error('Missing counterpart feature list');
    compare(
      'feature order',
      features.map(f => f.name),
      external.map(f => f.name),
      v => (v as string[]).map(name => norm(name).toLowerCase()),
    );
    const extraFeatures = external.filter(
      other =>
        !features.some(
          feature => norm(feature.name).toLowerCase() === norm(other.name).toLowerCase(),
        ),
    );
    if (extraFeatures.length) compare('additional external features', [], extraFeatures, v => v);
    for (let index = 0; index < features.length; index++) {
      const feature = features[index];
      for (const diagnostic of feature.diagnostics)
        row.differences.push({
          field: `${feature.name}.source coverage`,
          ours: diagnostic,
          theirs: null,
          classification: 'review',
        });
      const featureMatches = external.filter(
        other => norm(other.name).toLowerCase() === norm(feature.name).toLowerCase(),
      );
      if (featureMatches.length > 1)
        throw new Error(`Ambiguous counterpart feature: ${feature.name}`);
      const theirs = featureMatches[0];
      if (!theirs) {
        compare(`${feature.name}.missing external feature`, feature.fields, null, v => v);
        continue;
      }
      compare(`${feature.name}.kind`, feature.kind, theirs.type);
      if ((feature.kind === 'trait' || feature.kind === 'malice') && theirs.type === 'feature')
        explain(
          `${feature.name}.kind`,
          'External generic feature type; retain our parent-qualified trait/Malice classification.',
        );
      if (feature.kind === 'malice' && theirs.type === 'ability')
        explain(
          `${feature.name}.kind`,
          'Local Malice is a parent-qualified reference category; the external ability category describes its shape. Usage, target, range, cost and full effects are compared independently.',
        );
      for (const key of ['ability_type', 'usage', 'distance', 'target', 'trigger', 'cost', 'name'])
        compare(
          `${feature.name}.${key}`,
          feature.fields[key],
          theirs[key],
          ['usage', 'name'].includes(key) ? v => norm(v).toLowerCase() : norm,
        );
      if (
        /^Villain Action [1-3]$/.test(String(feature.fields.cost)) &&
        theirs.ability_type === feature.fields.cost &&
        theirs.cost === undefined &&
        feature.fields.ability_type === undefined
      ) {
        explain(
          `${feature.name}.cost`,
          'Printed Villain Action ordinal is stored as ability_type externally and cost upstream; our activation.villainAction is a label, never a resource expense.',
        );
        explain(
          `${feature.name}.ability_type`,
          'Same printed Villain Action ordinal, separate field representation.',
        );
      }
      compare(`${feature.name}.keywords`, feature.fields.keywords, theirs.keywords, v =>
        tags(v as Json),
      );
      compare(
        `${feature.name}.effects`,
        orderedEffects(feature.fields.effects),
        orderedEffects(theirs.effects),
        v => v,
      );
      const effectDifference = row.differences.find(d => d.field === `${feature.name}.effects`);
      if (effectDifference)
        effectDifference.raw = { ours: feature.fields.effects, theirs: theirs.effects };
      // Full raw arrays remain available to diagnose grouping; semantic stream preserves order and labels.
      if (
        JSON.stringify(feature.fields.effects) !== JSON.stringify(theirs.effects) &&
        !row.differences.some(d => d.field === `${feature.name}.effects`)
      )
        row.differences.push({
          field: `${feature.name}.effect presentation`,
          ours: feature.fields.effects,
          theirs: theirs.effects,
          classification: 'presentation',
        });
      const known = [
        'type',
        'name',
        'ability_type',
        'usage',
        'distance',
        'target',
        'trigger',
        'cost',
        'keywords',
        'effects',
      ];
      if (Object.keys(theirs).some(k => !known.includes(k)))
        throw new Error(`Unmodeled external feature fields: ${feature.name}`);
    }
    for (const resolution of RESOLUTIONS.filter(r => r.id === block.id)) {
      const difference = row.differences.find(d => d.field === resolution.field);
      if (
        !difference ||
        resolution.sourceRevision !== pack.sourceRevision ||
        resolution.externalRevision !== EXTERNAL_REVISION ||
        resolution.source !== block.source.path ||
        !resolution.disposition.trim() ||
        resolution.requiredSourceText?.some(
          text =>
            !norm(
              [block.markdown, ...features.map(feature => feature.markdown)].join('\n'),
            ).includes(norm(text)),
        ) ||
        JSON.stringify(difference.ours) !== JSON.stringify(resolution.ours) ||
        JSON.stringify(difference.theirs) !== JSON.stringify(resolution.theirs)
      )
        throw new Error(`Stale comparison resolution: ${block.id}/${resolution.field}`);
      difference.classification = 'explained';
      difference.disposition = resolution.disposition;
      difference.source = resolution.source;
    }
    row.status = row.differences.some(d => d.classification === 'review')
      ? 'review'
      : row.differences.some(d => d.classification === 'explained')
        ? 'explained'
        : 'match';
  } catch (e) {
    row.status = 'error';
    row.error = String(e);
  }
  return row;
}
export function compareFoes(pack: FoePackage, candidates: Fields[]) {
  const rows = pack.objects.filter(o => !o.parentId).map(o => compareBlock(pack, o, candidates));
  const used = new Set(
    rows.filter(r => !['missing', 'unavailable'].includes(r.status)).map(r => r.counterpart),
  );
  const unmatchedExternal = candidates
    .filter(c => !used.has(String(c.id)))
    .map(c => ({
      id: String(c.id),
      disposition:
        COMPARISON_INVENTORY.unmatchedExternal.find(e => e.id === c.id)?.disposition ?? null,
    }));
  return {
    edition: pack.edition,
    sourceRevision: pack.sourceRevision,
    externalRevision: EXTERNAL_REVISION,
    externalInventoryCount: COMPARISON_INVENTORY.files.length,
    unmatchedExternal,
    rows,
    counts: Object.fromEntries(STATUSES.map(s => [s, rows.filter(r => r.status === s).length])),
  };
}

/** The committed report is an offline coverage record, not an external runtime dependency. */
export function validateComparisonReport(
  pack: FoePackage,
  report: ReturnType<typeof compareFoes> & { retrievalErrors?: string[]; retrievedCount?: number },
) {
  const expected = pack.objects
    .filter(o => !o.parentId)
    .map(o => o.id)
    .sort();
  if (
    report.edition !== pack.edition ||
    report.sourceRevision !== pack.sourceRevision ||
    report.externalRevision !== EXTERNAL_REVISION ||
    COMPARISON_INVENTORY.revision !== EXTERNAL_REVISION ||
    report.externalInventoryCount !== COMPARISON_INVENTORY.files.length ||
    report.retrievedCount !== COMPARISON_INVENTORY.files.length ||
    JSON.stringify(report.rows.map(r => r.id).sort()) !== JSON.stringify(expected) ||
    report.retrievalErrors?.length ||
    JSON.stringify(report.unmatchedExternal) !==
      JSON.stringify(COMPARISON_INVENTORY.unmatchedExternal) ||
    JSON.stringify(Object.keys(report.counts).sort()) !== JSON.stringify([...STATUSES].sort()) ||
    STATUSES.some(
      status => report.counts[status] !== report.rows.filter(r => r.status === status).length,
    ) ||
    report.rows.some(
      r =>
        !['match', 'explained', 'unavailable'].includes(r.status) ||
        (r.status === 'unavailable' &&
          (!r.disposition ||
            !COMPARISON_INVENTORY.unavailable.some(
              e =>
                e.id === r.id &&
                e.source === r.source &&
                e.name === r.name &&
                e.counterpart === r.counterpart &&
                e.disposition === r.disposition,
            ) ||
            compareBlock(
              pack,
              pack.objects.find(object => object.id === r.id)!,
              [],
            ).status !== 'unavailable')) ||
        r.differences.some(d => d.classification === 'review'),
    )
  )
    throw new Error('Comparison report is stale, incomplete, or requires review');
}
