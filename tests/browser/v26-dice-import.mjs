// SPDX-License-Identifier: GPL-3.0-only
// Test-only transport. Run via qualified `docker compose ... exec -T backend node
// tests/browser/v26-dice-import.mjs` in the existing engine-corrections container.
// Never use `presidium-dev run backend`: its localhost is not the running backend.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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

const root = '/artifacts/v26-dice';
const id = randomUUID();
const directory = `${root}/${id}`;
const startedAt = Date.now();
function checkTarget() {
  assert.equal(process.cwd(), '/app');
  assert.match(
    process.env.DEV_WEB_URL ?? '',
    /^https:\/\/salient-engine-corrections-dev-[a-f0-9]{12}\.tail41404c\.ts\.net$/,
  );
  assert.equal(process.env.SALIENT_V26_RUNTIME_URL, process.env.DEV_WEB_URL);
  assert.equal(process.env.CONVEX_AGENT_MODE, 'anonymous');
  assert.equal(process.env.VITE_CONVEX_URL, 'http://backend:3210');
  assert.equal(process.env.VITE_CONVEX_SITE_URL, 'http://backend:3211');
  assert.ok(existsSync('/tmp/backend-ready'));
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
  const local = JSON.parse(readFileSync('.convex/local/default/config.json', 'utf8'));
  assert.match(local.deploymentName, /^anonymous-[a-z0-9-]+$/);
  assert.equal(env.CONVEX_DEPLOYMENT, `anonymous:${local.deploymentName}`);
  assert.deepEqual(local.ports, { cloud: 3210, site: 3211 });
  assert.equal(local.backendVersion, 'precompiled-2026-09-11-157eb19');
}
function writeJson(path, value) {
  writeFileSync(`${path}.tmp`, JSON.stringify(value), { mode: 0o600 });
  renameSync(`${path}.tmp`, path);
}
checkTarget();
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
  writeJson(`${root}/ready.json`, { id, startedAt, frontend: process.env.DEV_WEB_URL });
  // Bounded to one baseline run (ten minutes, at most twenty dice imports).
  while (!stopped && Date.now() - startedAt < 600_000 && requests < 20) {
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
        writeFileSync(
          importPath,
          JSON.stringify({ campaignId: campaign, seed: request.seed, counter: 0 }) + '\n',
          { mode: 0o600 },
        );
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
        writeJson(responsePath, { ok: true });
      } catch {
        writeJson(responsePath, { ok: false });
        throw new Error('V26 dice request failed; helper stopped without exporting CLI output');
      }
      if (requests >= 20) break;
    }
    await sleep(100);
  }
} finally {
  unlinkSync(`${root}/ready.json`);
  unlinkSync(lock);
}
