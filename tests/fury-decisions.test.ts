import { readPinnedSource } from './helpers/pinned-source.ts';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// R01 acceptance checks 1-4 for shared/content/fury-level-one-decisions.json.
// Expected values (budgets, counts, pools) are read from the JSON, whose quotes are
// verified verbatim against the pinned Compendium files; nothing is derived from app code.

interface Quoted {
  source: string;
  quote: string;
}
interface Grant {
  kind: string;
  value: string;
  source?: string;
  quote?: string;
}
interface Option {
  id: string;
  value: string;
  source?: string;
  cost?: number;
  costQuote?: string;
  supportedInV001: boolean;
  grants?: Grant[];
}
interface Branch {
  source: string;
  quote?: string;
  values?: string[];
  optionsFrom?: string | string[];
}
interface Shape {
  type: 'single' | 'multi' | 'points' | 'assignment' | 'text' | 'none';
  count?: number;
  budget?: number;
  deferrable?: boolean;
  noneAllowed?: boolean;
  targets?: string[];
}
interface Decision {
  id: string;
  kind: 'choice' | 'automatic' | 'authored' | 'none';
  shape: Shape;
  source: string;
  quote: string;
  dependsOn?: string[];
  availableWhen?: { decision: string; value: string };
  options?: Option[];
  optionsFrom?: string | string[];
  optionsByParent?: Record<string, Branch>;
  optionSources?: Record<string, string>;
  supportedInV001?: string[];
  supportedSetInV001?: string[];
  grants?: Grant[];
  poolSource?: { source: string };
  poolReference?: string;
  poolQuote?: string;
  budgetRule?: Quoted;
  deferralRule?: Quoted;
  poolRule?: Quoted;
  baseRule?: Quoted;
  typeRule?: Quoted;
  choiceRule?: Quoted;
  featureRule?: Quoted;
  triggeredRule?: Quoted;
  stepRule?: Quoted;
}
interface Step {
  id: string;
  sourceStep: string;
  source: string;
  optional: boolean;
  presentedInV001: boolean;
  optionalQuote?: string;
  decisions: Decision[];
}
type Selection = string | (string | null)[] | Record<string, number>;
interface SelectionSet {
  selections: Record<string, Selection>;
  expectedDiagnostics?: string[];
}
interface Data {
  document: string;
  compendiumRevision: string;
  sourceRoot: string;
  pools: Record<string, { source: string; values: string[] }>;
  steps: Step[];
  selectionSets: Record<string, SelectionSet>;
  questions: string[];
}

const root = process.cwd();
const jsonPath = join(root, 'shared/content/fury-level-one-decisions.json');
const data = JSON.parse(readFileSync(jsonPath, 'utf8')) as Data;
const sourceRoot = join(root, data.sourceRoot);
const fileCache = new Map<string, string>();

function normalize(text: string): string {
  let out = text.replace(/<br>/g, ' ');
  // Collapse Markdown links to their label, innermost first.
  for (let i = 0; i < 4; i++) out = out.replace(/\[([^[\]]*)\]\([^()]*\)/g, '$1');
  out = out.replace(/\*/g, '');
  return out.replace(/\s+/g, ' ').trim();
}

function source(rel: string): string {
  let cached = fileCache.get(rel);
  if (cached === undefined) {
    const abs = join(sourceRoot, rel);
    cached = normalize(readPinnedSource(root, abs));
    fileCache.set(rel, cached);
  }
  return cached;
}

function verbatim(rel: string, text: string, label: string): void {
  assert.ok(
    source(rel).includes(normalize(text)),
    `${label}: "${text}" not found verbatim in ${rel}`,
  );
}

const decisions: Decision[] = data.steps.flatMap(s => s.decisions);
const byId = new Map<string, Decision>(decisions.map(d => [d.id, d]));
const RULE_KEYS = [
  'budgetRule',
  'deferralRule',
  'poolRule',
  'baseRule',
  'typeRule',
  'choiceRule',
  'featureRule',
  'triggeredRule',
  'stepRule',
] as const;

function poolValues(ref: string | string[] | undefined): string[] {
  if (!ref) return [];
  return (Array.isArray(ref) ? ref : [ref]).flatMap(id => {
    const pool = data.pools[id];
    assert.ok(pool, `unknown pool ${id}`);
    return pool.values;
  });
}

function stepOf(d: Decision): Step {
  const step = data.steps.find(s => s.decisions.includes(d));
  assert.ok(step, `decision ${d.id} belongs to no step`);
  return step;
}

/** Option values available for a decision given the parent selection, or null when unconstrained. */
function optionsFor(d: Decision, selections: Record<string, Selection>): string[] | null {
  if (d.options) return d.options.map(o => o.value);
  if (d.optionsFrom) return poolValues(d.optionsFrom);
  if (d.optionsByParent) {
    const parentValue = selections[d.dependsOn![0]!];
    const branch = typeof parentValue === 'string' ? d.optionsByParent[parentValue] : undefined;
    if (!branch) return [];
    return [...(branch.values ?? []), ...poolValues(branch.optionsFrom)];
  }
  return null;
}

function allOptionValues(d: Decision): string[] {
  if (d.optionsByParent) {
    return Object.values(d.optionsByParent).flatMap(b => [
      ...(b.values ?? []),
      ...poolValues(b.optionsFrom),
    ]);
  }
  return optionsFor(d, {}) ?? [];
}

function isAvailable(d: Decision, selections: Record<string, Selection>): boolean {
  if (d.availableWhen && selections[d.availableWhen.decision] !== d.availableWhen.value)
    return false;
  for (const dep of d.dependsOn ?? []) {
    const parent = byId.get(dep)!;
    if (!isAvailable(parent, selections)) return false;
    if (parent.kind === 'choice' && selections[dep] === undefined) return false;
  }
  return true;
}

/** Validates a selection set against the table. Returns diagnostics (invalid/incomplete) and warnings. */
function validate(selections: Record<string, Selection>): {
  diagnostics: string[];
  warnings: string[];
} {
  const diagnostics: string[] = [];
  const warnings: string[] = [];
  const grantedLanguages = new Set<string>();
  for (const d of decisions) {
    if (d.kind !== 'automatic' || !isAvailable(d, selections)) continue;
    for (const g of d.grants ?? []) if (g.kind === 'language') grantedLanguages.add(g.value);
  }
  for (const id of Object.keys(selections))
    assert.ok(byId.has(id), `selection for unknown decision ${id}`);
  for (const d of decisions) {
    if (d.kind !== 'choice' || !isAvailable(d, selections)) continue;
    const value = selections[d.id];
    const shape = d.shape;
    if (value === undefined) {
      if (!(shape.noneAllowed || stepOf(d).optional))
        diagnostics.push(`${d.id}: required choice missing`);
      continue;
    }
    const pool = optionsFor(d, selections);
    const checkMember = (v: string) => {
      if (pool !== null) assert.ok(pool.includes(v), `${d.id}: "${v}" is not an option`);
    };
    if (shape.type === 'single') {
      assert.equal(typeof value, 'string', `${d.id}: single selection must be a string`);
      checkMember(value as string);
    } else if (shape.type === 'multi') {
      const chosen = value as (string | null)[];
      assert.equal(chosen.length, shape.count, `${d.id}: expected ${shape.count} slots`);
      for (const v of chosen) {
        if (v === null) {
          if (!shape.deferrable) diagnostics.push(`${d.id}: empty slot`);
          continue;
        }
        checkMember(v);
        if (grantedLanguages.has(v)) {
          warnings.push(`${d.id}: ${v} is already granted automatically (Q-R-100)`);
        }
      }
      const filled = chosen.filter(v => v !== null);
      if (new Set(filled).size !== filled.length) diagnostics.push(`${d.id}: duplicate selection`);
    } else if (shape.type === 'points') {
      const chosen = value as string[];
      let cost = 0;
      for (const v of chosen) {
        const opt = d.options!.find(o => o.value === v);
        assert.ok(opt, `${d.id}: "${v}" is not an option`);
        cost += opt.cost!;
      }
      if (cost > shape.budget!)
        diagnostics.push(`${d.id}: cost ${cost} exceeds budget ${shape.budget}`);
      if (new Set(chosen).size !== chosen.length) diagnostics.push(`${d.id}: duplicate selection`);
    } else if (shape.type === 'assignment') {
      const assigned = value as Record<string, number>;
      const targets = [...shape.targets!].sort();
      assert.deepEqual(Object.keys(assigned).sort(), targets, `${d.id}: must assign every target`);
      const array = String(selections[d.dependsOn![0]!])
        .replace(/−/g, '-')
        .split(',')
        .map(s => Number(s.trim()))
        .sort();
      assert.deepEqual(
        Object.values(assigned).sort(),
        array,
        `${d.id}: assigned values must be the chosen array`,
      );
    }
  }
  return { diagnostics, warnings };
}

test('R01 check 1: every source step appears in source order with an existing path', () => {
  const chapter = 'en/unified/md/chapter/making-a-hero.md';
  const headings = [
    ...readPinnedSource(root, join(sourceRoot, chapter)).matchAll(/^#### (\d+\. .+)$/gm),
  ].map(m => m[1]!.trim());
  assert.deepEqual(
    data.steps.map(s => s.sourceStep),
    headings,
    'steps must mirror the Step-by-Step Hero Making headings in order',
  );
  for (const step of data.steps) {
    source(step.source);
    if (step.optionalQuote) verbatim(step.source, step.optionalQuote, step.id);
  }
  const rev = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  assert.equal(data.compendiumRevision, rev, 'pinned Compendium revision');
  const complication = data.steps.find(s => s.id === 'step.complication')!;
  assert.equal(complication.optional, true);
  assert.equal(complication.presentedInV001, false);
});

test('R01 checks 2-3: every option value, grant and quoted count/budget sentence is verbatim in its cited source', () => {
  for (const [id, pool] of Object.entries(data.pools))
    for (const v of pool.values) verbatim(pool.source, v, id);
  for (const d of decisions) {
    verbatim(d.source, d.quote, d.id);
    for (const key of RULE_KEYS) {
      const rule = d[key];
      if (rule) verbatim(rule.source, rule.quote, `${d.id}.${key}`);
    }
    if (d.poolSource) source(d.poolSource.source);
    if (d.poolReference) verbatim(d.poolReference, d.poolQuote!, `${d.id}.poolReference`);
    for (const o of d.options ?? []) {
      const rel = o.source ?? d.source;
      verbatim(rel, o.value, `${d.id} option`);
      if (o.costQuote) verbatim(rel, o.costQuote, `${d.id} option cost`);
      if (o.cost !== undefined) {
        const match = /(\d+) Point/.exec(o.costQuote!);
        assert.ok(match, `${d.id} ${o.value} has a cost sentence`);
        assert.equal(o.cost, Number(match[1]), `${d.id} ${o.value} cost matches source`);
      }
      for (const g of o.grants ?? []) {
        if (g.source) verbatim(g.source, g.value, `${d.id} ${o.value} grant`);
        if (g.quote) verbatim(g.source!, g.quote, `${d.id} grant quote`);
      }
    }
    for (const g of d.grants ?? []) if (g.source) verbatim(g.source, g.value, `${d.id} grant`);
    if (d.optionsFrom) poolValues(d.optionsFrom);
    for (const [v, rel] of Object.entries(d.optionSources ?? {}))
      verbatim(rel, v, `${d.id} optionSources`);
    for (const [parent, b] of Object.entries(d.optionsByParent ?? {})) {
      source(b.source);
      if (b.quote) verbatim(b.source, b.quote, `${d.id}[${parent}]`);
      for (const v of b.values ?? []) verbatim(b.source, v, `${d.id}[${parent}] value`);
      poolValues(b.optionsFrom);
      const parentDecision = byId.get(d.dependsOn![0]!)!;
      assert.ok(
        allOptionValues(parentDecision).includes(parent),
        `${d.id}: parent value ${parent} exists`,
      );
    }
    if (Array.isArray(d.supportedInV001) && d.shape.type !== 'assignment') {
      for (const v of d.supportedInV001) {
        assert.ok(allOptionValues(d).includes(v), `${d.id}: supported value ${v} is in the pool`);
      }
    }
    for (const v of d.supportedSetInV001 ?? []) {
      assert.ok(
        d.options!.some(o => o.value === v && o.supportedInV001),
        `${d.id}: supported set member ${v}`,
      );
    }
    for (const dep of d.dependsOn ?? [])
      assert.ok(byId.has(dep), `${d.id} depends on unknown ${dep}`);
    if (d.availableWhen) {
      assert.ok(byId.has(d.availableWhen.decision), `${d.id} availableWhen unknown decision`);
    }
  }
});

test('R01 check 4: the hero-fixture set is complete, the second path is complete, the invalid set is rejected', () => {
  const fixture = validate(data.selectionSets['hero-fixture']!.selections);
  assert.deepEqual(fixture.diagnostics, []);
  assert.deepEqual(fixture.warnings, []);
  const second = validate(data.selectionSets['second-legal-path']!.selections);
  assert.deepEqual(second.diagnostics, []);
  assert.deepEqual(second.warnings, []);
  const invalidSet = data.selectionSets['invalid-over-budget-and-incomplete']!;
  const invalid = validate(invalidSet.selections);
  assert.deepEqual(invalid.diagnostics.sort(), [...invalidSet.expectedDiagnostics!].sort());
});

test('R01: the document mirrors every decision id and question', () => {
  const doc = readFileSync(join(root, data.document), 'utf8');
  for (const d of decisions)
    assert.ok(doc.includes('`' + d.id + '`'), `docs missing decision ${d.id}`);
  for (const q of data.questions) assert.ok(doc.includes(q), `docs missing question ${q}`);
  const questionsDoc = readFileSync(join(root, 'docs/rules-questions-for-user.md'), 'utf8');
  for (const q of data.questions)
    assert.ok(questionsDoc.includes(`${q}:`), `questions file missing ${q}`);
});

test('the spoken language pools exactly match both pinned printed tables', () => {
  const text = readPinnedSource(
    root,
    join(sourceRoot, 'en/books/heroes/clean/Draw Steel Heroes.md'),
  );
  for (const [pool, heading, column] of [
    ['pool.languages.by-ancestry', 'Languages by Ancestry Table', 1],
    ['pool.languages.vaslorian-human', 'Vaslorian Human Languages Table', 2],
  ] as const) {
    const section = text.split(`###### ${heading}\n`)[1]!.split('\n#')[0]!;
    const rows = section
      .split('\n')
      .filter(line => line.startsWith('|'))
      .slice(2);
    const names = rows.map(row => normalize(row.split('|')[column]!.trim()));
    assert.deepEqual(data.pools[pool]!.values, names);
  }
});
