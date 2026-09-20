// SPDX-License-Identifier: GPL-3.0-only
/**
 * Loads shared/content/compendium into this checkout's local development deployment by running the
 * internal `content:reseed` action. Bounded transactions upsert reference rows, prune stale entries,
 * then publish the completed manifest; interrupted seeds can be rerun. Refuses anything but a local deployment, like setup-local.ts.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';

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
    'content:seed requires a configured local development deployment and no deployment-key overrides. Cloud deployments are seeded deliberately, never by this script.',
  );
}
console.log(`Target: local development ${deployment} at ${url.origin}`);
const result = spawnSync(
  process.execPath,
  ['node_modules/convex/bin/main.js', 'run', 'content:reseed', '--env-file', '.env.local'],
  { encoding: 'utf8' },
);
if (result.status !== 0)
  throw new Error(`content:reseed failed. Start pnpm dev:backend first. ${result.stderr}`);
console.log(result.stdout.trim());
console.log('Content snapshot loaded. Read it back with content:status or content:get.');
