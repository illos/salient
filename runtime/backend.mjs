// Keep the CLI-managed anonymous SQLite development model; never select a cloud target.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import { ensurePatched } from './patch-convex-cli.mjs';
import { parseEnv } from 'node:util';
import { setTimeout as sleep } from 'node:timers/promises';

rmSync('/tmp/backend-ready', { force: true });
rmSync('/tmp/backend-pushed', { force: true });
const binary = '/runtime-config/convex-local-backend';
const checksumFile = '/runtime-config/convex-local-backend.sha256';
if (!existsSync(binary) || !existsSync(checksumFile)) {
  throw new Error(
    'Patched pinned backend required; see runtime backend build runbook. No backend started.',
  );
}
const expectedHash = readFileSync(checksumFile, 'utf8').trim();
if (
  !/^[a-f0-9]{64}$/.test(expectedHash) ||
  createHash('sha256').update(readFileSync(binary)).digest('hex') !== expectedHash
) {
  throw new Error('Patched backend checksum mismatch');
}
const help = spawnSync(binary, ['--help'], { encoding: 'utf8' });
if (help.status !== 0 || !help.stdout.includes('CONVEX_INSTANCE_SECRET')) {
  throw new Error('Backend does not support secret through environment');
}
const cache = '/root/.cache/convex/binaries/precompiled-2026-09-11-157eb19';
mkdirSync(cache, { recursive: true });
copyFileSync(binary, `${cache}/convex-local-backend`);
process.env.SALIENT_CONVEX_BACKEND = binary;
ensurePatched('node_modules/convex/dist/cli.bundle.cjs');

const forbidden = [
  'CONVEX_DEPLOYMENT',
  'CONVEX_DEPLOY_KEY',
  'CONVEX_DEPLOYMENT_TOKEN',
  'CONVEX_SELF_HOSTED_URL',
  'CONVEX_SELF_HOSTED_ADMIN_KEY',
];
if (forbidden.some(key => process.env[key]))
  throw new Error('Refusing deployment selection overrides');
const web = new URL(process.env.DEV_WEB_URL);
if (web.protocol !== 'https:' || web.username || web.password || web.pathname !== '/') {
  throw new Error('DEV_WEB_URL must be an HTTPS origin');
}
const configPath = '.convex/local/default/config.json';
const existing = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : null;
if (existing && !existing.deploymentName.startsWith('anonymous-')) {
  throw new Error('Only an anonymous development backend may be started');
}
// Source replacement removes .env.local; reconstruct only this environment's identity.
writeFileSync(
  '.env.local',
  existing ? `CONVEX_DEPLOYMENT=anonymous:${existing.deploymentName}\n` : '',
  { mode: 0o600 },
);
const args = [
  'node_modules/convex/bin/main.js',
  'dev',
  '--local-cloud-port',
  '3210',
  '--local-site-port',
  '3211',
  '--local-backend-version',
  'precompiled-2026-09-11-157eb19',
  '--typecheck',
  'disable',
  '--run-sh',
  'touch /tmp/backend-pushed',
];
const child = spawn(process.execPath, args, { stdio: ['ignore', 'inherit', 'inherit'] });
let stopped = false;
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    stopped = true;
    child.kill(signal);
  });
let startupFailed = false;
child.on('exit', code => process.exit(startupFailed ? 1 : stopped ? 0 : (code ?? 1)));
function cli(args, input) {
  return spawnSync(
    process.execPath,
    ['node_modules/convex/bin/main.js', ...args, '--env-file', '.env.local'],
    {
      input,
      encoding: 'utf8',
      timeout: 60_000,
    },
  );
}
function set(key, value) {
  const result = cli(['env', 'set', key], value);
  if (result.status !== 0)
    throw new Error(`Failed to set development ${key}; inspect backend logs`);
}
try {
  let ready = false;
  for (let count = 0; count < 120; count++) {
    if (existsSync(configPath)) {
      try {
        const response = await fetch('http://127.0.0.1:3210/instance_name');
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        /* Starting. */
      }
    }
    await sleep(1000);
  }
  if (!ready) throw new Error('Anonymous backend did not start within 120 seconds');
  const runtime = existsSync('/runtime-config/runtime.env')
    ? parseEnv(readFileSync('/runtime-config/runtime.env', 'utf8'))
    : {};
  if (Object.keys(runtime).some(key => key !== 'BETTER_AUTH_SECRET'))
    throw new Error('Unexpected runtime secret variable');
  const current = cli(['env', 'get', 'BETTER_AUTH_SECRET']);
  if (current.status !== 0)
    throw new Error('Cannot read existing development authentication configuration');
  if (runtime.BETTER_AUTH_SECRET) set('BETTER_AUTH_SECRET', runtime.BETTER_AUTH_SECRET);
  else if (!current.stdout.trim()) set('BETTER_AUTH_SECRET', randomBytes(32).toString('base64'));
  set('SITE_URL', web.origin);
  set('ADDITIONAL_TRUSTED_ORIGINS', 'http://web:5180');
  // Auth's own baseURL must be the browser-visible origin; HTTP routes proxy unchanged.
  set('SALIENT_AUTH_BASE_URL', web.origin);
  let pushed = false;
  for (let attempt = 0; attempt < 180; attempt++) {
    if (existsSync('/tmp/backend-pushed')) {
      pushed = true;
      break;
    }
    await sleep(1000);
  }
  if (!pushed) throw new Error('Initial Convex function push did not succeed; refusing readiness');
  mkdirSync('/artifacts/generated', { recursive: true });
  // Generated source is opt-in retrieval; never copy environment/configuration files out.
  for (const name of ['api.d.ts', 'api.js', 'dataModel.d.ts', 'server.d.ts', 'server.js']) {
    const path = `convex/_generated/${name}`;
    if (existsSync(path)) copyFileSync(path, `/artifacts/generated/${name}`);
  }
  writeFileSync('/tmp/backend-ready', 'ready\n');
  console.log('Anonymous development backend configured; application secrets were not logged.');
} catch (error) {
  console.error(error.message);
  startupFailed = true;
  child.kill('SIGTERM');
  process.exitCode = 1;
}
