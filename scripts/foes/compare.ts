// SPDX-License-Identifier: GPL-3.0-only
import type { Fields, FoeObject, FoePackage, Json } from '../../shared/contracts/foes.ts';
import { plain, tags } from './import.ts';
export const EXTERNAL_REVISION = 'eba4b8bb8bc1baf947f15e67e9e923951092fd89';
export interface Difference {
  field: string;
  ours: unknown;
  theirs: unknown;
  classification: 'presentation' | 'review' | 'explained';
  disposition?: string;
}
export interface ComparisonRow {
  id: string;
  name: string;
  counterpart: string;
  source: string;
  status: 'match' | 'explained' | 'review' | 'missing' | 'ambiguous' | 'error';
  differences: Difference[];
  error?: string;
}
function norm(value: unknown): string {
  return plain(value)
    .replace(/Power Roll/g, '2d10')
    .replace(/\s*<\s*/g, '<');
}
function orderedEffects(value: Json | undefined) {
  if (!Array.isArray(value)) throw new Error('Missing effects array');
  return (value as Fields[]).flatMap(e => {
    const unknown = Object.keys(e).filter(
      k => !['name', 'cost', 'effect', 'roll', 'tier1', 'tier2', 'tier3'].includes(k),
    );
    if (unknown.length) throw new Error(`Unmodeled effect fields: ${unknown.join(', ')}`);
    return ['name', 'cost', 'effect', 'roll', 'tier1', 'tier2', 'tier3']
      .filter(k => e[k] !== undefined)
      .map(k => [k, norm(e[k])]);
  });
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
export function compareBlock(
  pack: FoePackage,
  block: FoeObject,
  candidates: Fields[],
): ComparisonRow {
  const counterpart = block.kind === 'malice' ? 'undead-malice' : block.id.split('/').at(-1)!;
  const row: ComparisonRow = {
    id: block.id,
    name: block.name,
    counterpart,
    source: block.source.path,
    status: 'match',
    differences: [],
  };
  const matches = candidates.filter(c => c.id === counterpart);
  if (matches.length !== 1) return { ...row, status: matches.length ? 'ambiguous' : 'missing' };
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
    for (const diagnostic of block.diagnostics)
      row.differences.push({
        field: 'source coverage',
        ours: diagnostic,
        theirs: null,
        classification: 'review',
      });
    compare('name', block.name, other.name);
    compare('level', block.fields.level, other.level);
    if (block.kind === 'malice') {
      if (other.type !== 'featureblock') throw new Error('Wrong Malice counterpart type');
      if (
        block.name === 'Undead Malice (Level 1+ Malice Features)' &&
        other.name === 'Undead Malice' &&
        other.level === 1 &&
        other.featureblockType === '+ Malice Features'
      )
        explain(
          'name',
          'Representation: local title retains the printed level qualifier; external level and featureblockType retain it separately.',
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
          block.ev?.printed === '3 for four minions' &&
          block.ev.quantity === 4 &&
          other.ev === 3 &&
          other.evQuantity === undefined
        )
          explain(
            'ev.quantity',
            'External generated field omits the printed four-minion quantity. Preserve our source EV 3 for four minions; no inference about the external app calculator.',
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
      v => v,
    );
    for (let index = 0; index < features.length; index++) {
      const feature = features[index];
      for (const diagnostic of feature.diagnostics)
        row.differences.push({
          field: `${feature.name}.source coverage`,
          ours: diagnostic,
          theirs: null,
          classification: 'review',
        });
      const theirs = external[index];
      if (!theirs) continue;
      compare(`${feature.name}.kind`, feature.kind, theirs.type);
      if ((feature.kind === 'trait' || feature.kind === 'malice') && theirs.type === 'feature')
        explain(
          `${feature.name}.kind`,
          'External generic feature type; retain our parent-qualified trait/Malice classification.',
        );
      for (const key of ['ability_type', 'usage', 'distance', 'target', 'trigger', 'cost', 'name'])
        compare(`${feature.name}.${key}`, feature.fields[key], theirs[key]);
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
      // Full raw arrays remain available to diagnose grouping; semantic stream preserves order and labels.
      if (
        JSON.stringify(feature.fields.effects) !== JSON.stringify(theirs.effects) &&
        !row.differences.some(d => d.field === `${feature.name}.effects`)
      )
        row.differences.push({
          field: `${feature.name}.effect presentation`,
          ours: 'Compendium Markdown / effect grouping',
          theirs: 'External HTML / effect grouping',
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
  return {
    edition: pack.edition,
    sourceRevision: pack.sourceRevision,
    externalRevision: EXTERNAL_REVISION,
    rows,
    counts: Object.fromEntries(
      ['match', 'explained', 'review', 'missing', 'ambiguous', 'error'].map(s => [
        s,
        rows.filter(r => r.status === s).length,
      ]),
    ),
  };
}

/** The committed report is an offline coverage record, not an external runtime dependency. */
export function validateComparisonReport(
  pack: FoePackage,
  report: ReturnType<typeof compareFoes> & { retrievalErrors?: string[] },
) {
  const expected = pack.objects
    .filter(o => !o.parentId)
    .map(o => o.id)
    .sort();
  if (
    report.edition !== pack.edition ||
    report.sourceRevision !== pack.sourceRevision ||
    report.externalRevision !== EXTERNAL_REVISION ||
    JSON.stringify(report.rows.map(r => r.id).sort()) !== JSON.stringify(expected) ||
    report.retrievalErrors?.length ||
    report.rows.some(
      r =>
        !['match', 'explained'].includes(r.status) ||
        r.differences.some(d => d.classification === 'review'),
    )
  )
    throw new Error('Comparison report is stale, incomplete, or requires review');
}
