// SPDX-License-Identifier: GPL-3.0-only
/** Public API proof after content:seed on this slice's isolated local backend. */
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { createActor, type ActorSession } from './headless/character-client.ts';

const target = process.env.SALIENT_V87_TARGET;
assert.equal(target, 'http://127.0.0.1:3260', 'Explicit V87 isolated target required');
const started = Date.now();
const runId = crypto.randomUUID();
const sessions: ActorSession[] = [];
const manifest = JSON.parse(readFileSync('shared/content/compendium/manifest.json', 'utf8'));
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceDirty = execFileSync(
  'git',
  ['diff', '--name-only', '--', 'convex', 'shared', 'scripts'],
  { encoding: 'utf8' },
).trim();
const deadline = setTimeout(() => {
  process.stderr.write('V87 proof deadline\n');
  process.exit(1);
}, 60_000);
try {
  const actor = await createActor(
    'foes-reader',
    runId,
    {
      url: target,
      siteUrl: 'http://127.0.0.1:3261',
      origin: 'http://127.0.0.1:5180',
      active: () => true,
    },
    session => sessions.push(session),
  );
  const status = await actor.query<{ entryCount: number; contentHash: string }>(
    'content:status',
    {},
  );
  assert.equal(status.entryCount, manifest.entryCount);
  assert.equal(status.contentHash, manifest.contentHash);
  const catalog = await actor.query<{ id: string }[]>('content:list', { kind: 'statblock' });
  assert.equal(catalog.length, 438);
  const id = 'mcdm.monsters.v1/monster.undead.1st-echelon.statblock/ghoul';
  const row = await actor.query<{
    text: string;
    features: { name: string }[];
    sourcePath: string;
    jsonPath: string;
  }>('content:get', { id });
  assert.equal(row.text, readFileSync(row.sourcePath, 'utf8'));
  assert.deepEqual(row.features, JSON.parse(readFileSync(row.jsonPath, 'utf8')).features);
  assert.ok(row.features.some(feature => feature.name === 'Razor Claws'));
  const anonymous = new ConvexHttpClient(target, { logger: false });
  await assert.rejects(
    anonymous.query(makeFunctionReference<'query'>('content:get'), { id }),
    /Sign in/,
  );
  const report = {
    runId,
    source,
    sourceDirty: sourceDirty || null,
    target,
    runner: 'local Presidium',
    elapsedMs: Date.now() - started,
    contentHash: status.contentHash,
    entryCount: status.entryCount,
    statblocks: catalog.length,
    readback: {
      id,
      textSha256: createHash('sha256').update(row.text).digest('hex'),
      features: row.features.map(f => f.name),
    },
    checks: [
      'manifest readback',
      '438 statblocks',
      'non-goblin source exact',
      'embedded features exact',
      'anonymous denied',
    ],
    status: 'pass',
  };
  mkdirSync('docs/build/evidence/V87', { recursive: true });
  writeFileSync('docs/build/evidence/V87/headless.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  for (const session of sessions) await session.close();
  clearTimeout(deadline);
}
