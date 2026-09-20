// SPDX-License-Identifier: GPL-3.0-only
// Test-only transport. Run via qualified `docker compose ... exec -T backend node
// scripts/v88-seeded-dice-import.mjs` in the existing named seeded container.
// Never use `presidium-dev run backend`: its localhost is not the running backend.
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseEnv } from 'node:util';

const root = process.env.SALIENT_V88_DICE_DIR ?? '/artifacts/v88-seeded-dice';
const id = randomUUID();
const directory = `${root}/${id}`;
const startedAt = Date.now();
function checkTarget() {
  assert.equal(process.env.SALIENT_V88_HEADLESS, '1');
  const expectedUrl = process.env.SALIENT_V88_EXPECTED_URL;
  const expectedCommit = process.env.SALIENT_V88_EXPECTED_COMMIT;
  assert.ok(expectedUrl && expectedCommit);
  assert.match(expectedCommit, /^[a-f0-9]{40}$/);
  assert.equal(process.env.DEV_WEB_URL, expectedUrl);
  const hostname = new URL(expectedUrl).hostname;
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  assert.ok(
    localHost ||
      /^salient-engine-potency(?:-seeded)?-dev-[a-f0-9]+\.tail41404c\.ts\.net$/.test(hostname),
  );
  const checkout = '/srv/presidium/projects/salient/code/.worktrees/engine-potency-seeded';
  const source = existsSync('/runtime-source.json')
    ? JSON.parse(readFileSync('/runtime-source.json', 'utf8'))
    : {
        checkout: process.cwd(),
        commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      };
  assert.equal(source.checkout, checkout);
  assert.equal(source.commit, expectedCommit);
  if (!localHost) {
    assert.equal(process.cwd(), '/app');
    assert.equal(source.identity, createHash('sha256').update(checkout).digest('hex'));
    assert.equal(process.env.CONVEX_AGENT_MODE, 'anonymous');
    assert.ok(existsSync('/tmp/backend-ready'));
  } else assert.equal(process.cwd(), checkout);
  const env = parseEnv(readFileSync('.env.local', 'utf8'));
  for (const key of [
    'CONVEX_DEPLOYMENT',
    'CONVEX_DEPLOY_KEY',
    'CONVEX_DEPLOYMENT_TOKEN',
    'CONVEX_SELF_HOSTED_URL',
    'CONVEX_SELF_HOSTED_ADMIN_KEY',
  ]) {
    assert.ok(process.env[key] === undefined, `Injected ${key} refused`);
    if (key !== 'CONVEX_DEPLOYMENT') assert.ok(env[key] === undefined, `${key} refused`);
  }
  const config = JSON.parse(readFileSync('.convex/local/default/config.json', 'utf8'));
  assert.match(config.deploymentName, /^anonymous-[a-z0-9-]+$/);
  assert.equal(env.CONVEX_DEPLOYMENT, `anonymous:${config.deploymentName}`);
  for (const [key, port] of [
    ['VITE_CONVEX_URL', config.ports.cloud],
    ['VITE_CONVEX_SITE_URL', config.ports.site],
  ]) {
    const endpoint = new URL(process.env[key]);
    assert.equal(endpoint.protocol, 'http:');
    assert.ok(
      localHost
        ? ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)
        : endpoint.hostname === 'backend',
    );
    assert.equal(Number(endpoint.port), port);
  }
  return source;
}
function writeJson(path, value) {
  writeFileSync(`${path}.tmp`, JSON.stringify(value), { mode: 0o600 });
  renameSync(`${path}.tmp`, path);
}
const source = checkTarget();
mkdirSync(root, { recursive: true });
// Exclusive lock prevents two import consumers from replacing the same dice table.
const lock = `${root}/helper.lock`;
writeFileSync(lock, id, { flag: 'wx', mode: 0o600 });
mkdirSync(directory);
let campaign;
let requests = 0;
let stopped = false;
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => (stopped = true));
try {
  writeJson(`${root}/ready.json`, {
    id,
    startedAt,
    frontend: process.env.DEV_WEB_URL,
    commit: source.commit,
  });
  // One seeded inventory proof only: twenty minutes, at most twelve imports (ten expected).
  while (!stopped && Date.now() - startedAt < 1_200_000 && requests < 12) {
    if (existsSync(`${directory}/done`)) break;
    for (const name of readdirSync(directory)) {
      if (!/^[a-f0-9-]{36}\.request\.json$/.test(name)) continue;
      const requestPath = `${directory}/${name}`;
      const responsePath = requestPath.replace('.request.json', '.response.json');
      if (existsSync(responsePath)) continue;
      requests++;
      try {
        checkTarget();
        const raw = readFileSync(requestPath, 'utf8');
        assert.ok(raw.length < 512);
        const request = JSON.parse(raw);
        assert.deepEqual(Object.keys(request).sort(), ['campaignId', 'seed']);
        assert.match(request.campaignId, /^[a-z0-9]{20,64}$/);
        assert.match(request.seed, /^[a-f0-9]{64}$/);
        campaign ??= request.campaignId;
        assert.equal(request.campaignId, campaign);
        const importPath = `${directory}/dice-state.jsonl`;
        const readRows = () => {
          const data = spawnSync(
            process.execPath,
            [
              'node_modules/convex/bin/main.js',
              'data',
              'diceStates',
              '--format',
              'json',
              '--limit',
              '1001',
              '--env-file',
              '.env.local',
            ],
            { encoding: 'utf8', timeout: 10_000, maxBuffer: 1024 * 1024 },
          );
          assert.equal(data.status, 0, 'Dice state read failed');
          const rows = data.stdout.trim() ? JSON.parse(data.stdout) : [];
          assert.ok(Array.isArray(rows) && rows.length < 1000, 'Dice snapshot must be complete');
          return rows;
        };
        // The named seeded target is exclusively reserved during this proof. Preserve all other campaigns,
        // including their row identities/counters; never copy the old helper's table-wide reset.
        const before = readRows();
        assert.ok(before.filter(row => row.campaignId === campaign).length <= 1);
        const next = before.map(row =>
          row.campaignId === campaign ? { ...row, seed: request.seed, counter: 0 } : row,
        );
        if (!before.some(row => row.campaignId === campaign))
          next.push({ campaignId: campaign, seed: request.seed, counter: 0 });
        writeFileSync(importPath, next.map(row => JSON.stringify(row)).join('\n') + '\n', {
          mode: 0o600,
        });
        const imported = spawnSync(
          process.execPath,
          [
            'node_modules/convex/bin/main.js',
            'import',
            '--table',
            'diceStates',
            '--replace',
            '--yes',
            importPath,
            '--env-file',
            '.env.local',
          ],
          { encoding: 'utf8', timeout: 10_000, maxBuffer: 1024 * 1024 },
        );
        // CLI output/config may contain credentials. Never copy either to artifacts/logs.
        assert.equal(imported.status, 0, 'Dice import failed in the existing backend');
        const after = readRows();
        const unrelated = rows =>
          rows
            .filter(row => row.campaignId !== campaign)
            .sort((a, b) => a._id.localeCompare(b._id));
        assert.deepEqual(unrelated(after), unrelated(before), 'Unrelated dice state changed');
        const seeded = after.filter(row => row.campaignId === campaign);
        assert.equal(seeded.length, 1);
        assert.equal(seeded[0].seed, request.seed);
        assert.equal(seeded[0].counter, 0);
        writeJson(responsePath, {
          ok: true,
          preservedRows: before.length - before.filter(row => row.campaignId === campaign).length,
        });
      } catch {
        writeJson(responsePath, { ok: false });
        throw new Error(
          'V88 seeded dice request failed; helper stopped without exporting CLI output',
        );
      }
      if (requests >= 12) break;
    }
    await sleep(100);
  }
} finally {
  unlinkSync(`${root}/ready.json`);
  unlinkSync(lock);
}
