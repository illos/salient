// SPDX-License-Identifier: GPL-3.0-only
/** Read-only V37 inventory/pin/source checks. Does not execute Forge, install, seed or deploy. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const COMPENDIUM = 'fb83a789da8f0327a389c277a0c790b1648d5810';
const FORGE = '5a846aadb623a9855a023e9403bb887a956c341f';
interface Source {
  path: string;
  scc?: string;
  sha256?: string;
  revision?: string;
}
interface BackgroundRecord {
  id: string;
  name: string;
  source: Source;
  sourceText?: string;
  forge?: {
    path: string;
    id?: string;
    key?: string;
    enum?: string;
    recordSource?: string;
    revision?: string;
  };
  supportingSources?: { source: Source; name: string; text: string }[];
  incitingIncidents?: { number: number; name: string; text: string; forgeId: string }[];
}
interface Ledger {
  authority: { compendiumRevision: string; forgeRevision: string };
  careers: BackgroundRecord[];
  cultures: BackgroundRecord[];
  perks: BackgroundRecord[];
  skills: BackgroundRecord[];
  skillGroups: BackgroundRecord[];
  languages: BackgroundRecord[];
  kits: BackgroundRecord[];
}
interface Complication {
  id: string;
  sourcePath: string;
  fullSourceBody: string;
  forge: { sourcePath: string; id: string; sourceCode: string };
}
interface Snapshot {
  id: string;
  name: string;
  sourcePath: string;
  text: string;
}
const ledger = JSON.parse(
  readFileSync(join(ROOT, 'docs/research/v37-backgrounds.json'), 'utf8'),
) as Ledger;
const complications = JSON.parse(
  readFileSync(join(ROOT, 'docs/research/v37-complications.json'), 'utf8'),
) as { pins: { steelCompendium: string; forgeSteel: string }; records: Complication[] };
assert.equal(ledger.authority.compendiumRevision, COMPENDIUM);
assert.equal(ledger.authority.forgeRevision, FORGE);
assert.equal(complications.pins.steelCompendium, COMPENDIUM);
assert.equal(complications.pins.forgeSteel, FORGE);
const cache = new Map<string, string>();
function pinned(repo: string, revision: string, relative: string): string {
  const key = `${repo}:${revision}:${relative}`;
  let text = cache.get(key);
  if (text === undefined) {
    text = execFileSync('git', ['-C', join(ROOT, repo), 'show', `${revision}:${relative}`], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    cache.set(key, text);
  }
  return text;
}
const body = (text: string) =>
  text
    .split(/^---\s*$/m)
    .slice(2)
    .join('---')
    .trim();
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const normalize = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<br\s*\/?\s*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
function checkSource(source: Source, expectedBody?: string): void {
  const text = pinned('vendor/steel-compendium', COMPENDIUM, source.path);
  if (source.sha256) assert.equal(digest(text), source.sha256, source.path);
  if (source.scc)
    assert.ok(
      text.includes(`scc: ${source.scc}`) || source.path.endsWith('Draw Steel Heroes.md'),
      source.path,
    );
  if (expectedBody !== undefined)
    assert.equal(body(text), expectedBody, `${source.path}: body changed`);
  const local = join(ROOT, 'vendor/steel-compendium', source.path);
  if (existsSync(local))
    assert.equal(readFileSync(local, 'utf8'), text, `${source.path}: local differs from pin`);
}
const expected: [
  keyof Pick<Ledger, 'careers' | 'cultures' | 'perks' | 'skills' | 'skillGroups' | 'kits'>,
  string,
  number,
][] = [
  ['careers', 'career', 18],
  ['cultures', 'culture', 13],
  ['perks', 'perk', 47],
  ['skills', 'skill', 57],
  ['skillGroups', 'skill-group', 5],
  ['kits', 'kit', 25],
];
let exactSourceCount = 0;
for (const [family, filename, count] of expected) {
  const records = ledger[family];
  assert.equal(records.length, count, family);
  assert.equal(new Set(records.map(r => r.id)).size, count, `${family}: duplicate IDs`);
  const snapshot = JSON.parse(
    readFileSync(join(ROOT, `shared/content/compendium/${filename}.json`), 'utf8'),
  ) as Snapshot[];
  const core = snapshot.filter(r => r.id.startsWith('mcdm.heroes.v1/'));
  assert.deepEqual(
    core.map(r => r.id).sort(),
    records.map(r => r.id).sort(),
    `${filename}: exact eligible IDs`,
  );
  for (const record of records) {
    checkSource(record.source, record.sourceText);
    exactSourceCount += 1;
    const current = core.find(row => row.id === record.id)!;
    assert.equal(
      current.text,
      pinned('vendor/steel-compendium', COMPENDIUM, record.source.path),
      `${record.name}: snapshot source bytes`,
    );
    assert.ok(record.forge, `${record.name}: Forge match missing`);
    const f = pinned('vendor/forge-steel', FORGE, record.forge.path);
    if (record.forge.recordSource)
      assert.ok(
        f.includes(record.forge.recordSource.trim()),
        `${record.name}: Forge record changed`,
      );
    if (record.forge.id)
      assert.ok(f.includes(`id: '${record.forge.id}'`), `${record.name}: Forge ID missing`);
    for (const extra of record.supportingSources ?? []) {
      checkSource(extra.source, extra.text);
      exactSourceCount += 1;
    }
  }
}
assert.equal(ledger.languages.length, 42);
assert.equal(new Set(ledger.languages.map(r => r.name)).size, 42);
const background = normalize(
  pinned('vendor/steel-compendium', COMPENDIUM, 'en/books/heroes/clean/Draw Steel Heroes.md'),
);
for (const language of ledger.languages) {
  assert.ok(background.includes(language.name), `Source language missing: ${language.name}`);
  assert.ok(language.forge?.recordSource, `Forge language missing: ${language.name}`);
  assert.ok(
    pinned('vendor/forge-steel', FORGE, language.forge.path).includes(language.forge.recordSource),
    language.name,
  );
}
assert.equal(ledger.careers.flatMap(r => r.incitingIncidents ?? []).length, 108);
for (const career of ledger.careers) {
  assert.deepEqual(
    career.incitingIncidents?.map(r => r.number),
    [1, 2, 3, 4, 5, 6],
    career.name,
  );
  for (const incident of career.incitingIncidents ?? []) {
    assert.ok(
      incident.text && incident.name && incident.forgeId,
      `${career.name}: incomplete incident record`,
    );
    assert.ok(
      pinned('vendor/forge-steel', FORGE, career.forge!.path).includes(incident.forgeId),
      incident.forgeId,
    );
  }
}
assert.equal(complications.records.length, 100);
const complicationSnapshot = JSON.parse(
  readFileSync(join(ROOT, 'shared/content/compendium/complication.json'), 'utf8'),
) as Snapshot[];
assert.deepEqual(
  complicationSnapshot.map(r => r.id).sort(),
  complications.records.map(r => r.id).sort(),
);
for (const record of complications.records) {
  const path = record.sourcePath.replace(/^vendor\/steel-compendium\//, '');
  const text = pinned('vendor/steel-compendium', COMPENDIUM, path);
  assert.equal(body(text), record.fullSourceBody, record.id);
  assert.equal(complicationSnapshot.find(r => r.id === record.id)!.text, text, record.id);
  const forge = pinned(
    'vendor/forge-steel',
    FORGE,
    record.forge.sourcePath.replace(/^vendor\/forge-steel\//, ''),
  );
  assert.ok(forge.includes(record.forge.sourceCode.trim()), `${record.id}: Forge body changed`);
  exactSourceCount += 1;
}
console.log(
  `V37 inventory verified: 18 careers/108 incidents, 13 culture aspects, 47 core perks, 57 skills+5 groups, 42 languages, 25 kits, 100 complications; ${exactSourceCount} exact source records checked.`,
);
