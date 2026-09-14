/**
 * Configure only this checkout's local development authentication. Never target cloud.
 *
 * `--reset-data` additionally empties every application table in the local deployment. Development
 * data is disposable during pre-alpha (docs/development-process.md#confirmed-pre-alpha-development-policy):
 * after a breaking schema change, reset and reseed instead of writing a migration. Run it before
 * `pnpm dev:backend` pushes the new schema, while the old schema is still deployed.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';

const resetData = process.argv.includes('--reset-data');
const config = parseEnv(readFileSync('.env.local', 'utf8'));
const deployment = config.CONVEX_DEPLOYMENT ?? '';
const url = new URL(config.VITE_CONVEX_URL ?? 'http://invalid');
const overrides = [
  'CONVEX_DEPLOY_KEY',
  'CONVEX_DEPLOYMENT_TOKEN',
  'CONVEX_SELF_HOSTED_URL',
  'CONVEX_SELF_HOSTED_ADMIN_KEY',
];
if (
  !/^(anonymous|local):/.test(deployment) ||
  !['127.0.0.1', 'localhost'].includes(url.hostname) ||
  overrides.some(name => process.env[name] || config[name]) ||
  (process.env.CONVEX_DEPLOYMENT && process.env.CONVEX_DEPLOYMENT !== deployment)
) {
  throw new Error(
    'setup:local requires a configured local development deployment and no deployment-key overrides. Run convex init first; configure cloud environments separately.',
  );
}
console.log(`Target: local development ${deployment} at ${url.origin}`);
function convex(args: string[], input?: string) {
  // Explicit selection prevents the CLI from merging a different target/key from .env.
  return spawnSync(
    process.execPath,
    ['node_modules/convex/bin/main.js', ...args, '--env-file', '.env.local'],
    { input, encoding: 'utf8' },
  );
}
function set(name: string, value: string) {
  const result = convex(['env', 'set', name], value);
  if (result.status !== 0)
    throw new Error(`Could not configure ${name}. Start pnpm dev:backend first. ${result.stderr}`);
  console.log(`${name} configured.`);
}
const existing = convex(['env', 'get', 'BETTER_AUTH_SECRET']);
if (existing.status !== 0)
  throw new Error(
    'Could not read the existing auth secret. No settings changed; start the local backend and retry.',
  );
if (existing.stdout.trim()) console.log('Existing local auth secret preserved.');
else set('BETTER_AUTH_SECRET', randomBytes(32).toString('base64'));
if (resetData) {
  // Table names come from the deployment (`convex data` lists the root component's tables), so the
  // reset clears exactly what the old schema holds; component tables (Better Auth) are untouched.
  const listing = convex(['data']);
  if (listing.status !== 0)
    throw new Error(`Could not list the local deployment's tables. ${listing.stderr}`);
  const tables = listing.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const scratch = mkdtempSync(join(tmpdir(), 'salient-reset-'));
  const empty = join(scratch, 'empty.jsonl');
  writeFileSync(empty, '');
  try {
    for (const table of tables) {
      const result = convex(['import', '--table', table, '--replace', '--yes', empty]);
      if (result.status !== 0)
        throw new Error(`Could not reset table ${table}. ${result.stderr || result.stdout}`);
      console.log(`Table ${table} emptied.`);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  console.log(`Reset ${tables.length} tables; reseed through the app.`);
}
set('SITE_URL', 'http://127.0.0.1:5180');
set('ADDITIONAL_TRUSTED_ORIGINS', 'http://localhost:5180');
let env = readFileSync('.env.local', 'utf8');
if (/^VITE_LOCAL_PROXY=/m.test(env))
  env = env.replace(/^VITE_LOCAL_PROXY=.*$/m, 'VITE_LOCAL_PROXY=true');
else env += '\nVITE_LOCAL_PROXY=true\n';
writeFileSync('.env.local', env, { mode: 0o600 });
console.log('Start pnpm dev and open http://127.0.0.1:5180.');
