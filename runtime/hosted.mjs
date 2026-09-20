// SPDX-License-Identifier: GPL-3.0-only
// Run only through the CT114 `hosted` task. Credentials are outside source/artifacts.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const deployment = 'different-bat-943';
const cloud = `https://${deployment}.convex.cloud`;
const site = `https://${deployment}.convex.site`;
const origin = 'https://salient-dev.rdxx.workers.dev';
const account = '462b5ee1e395c11b8523d6c38de0577a';
const operation = process.argv[2];
if (!['status', 'configure', 'backend', 'seed', 'build', 'frontend'].includes(operation)) {
  throw new Error('Expected status, configure, backend, seed, build or frontend.');
}

const env = { ...process.env };
for (const name of [
  'CONVEX_DEPLOYMENT',
  'CONVEX_DEPLOYMENT_TOKEN',
  'CONVEX_SELF_HOSTED_URL',
  'CONVEX_SELF_HOSTED_ADMIN_KEY',
  'CONVEX_AGENT_MODE',
  'CONVEX_DEPLOY_KEY',
  'CLOUDFLARE_API_TOKEN',
]) {
  delete env[name];
}
Object.assign(env, {
  VITE_LOCAL_PROXY: 'false',
  VITE_CONVEX_URL: cloud,
  VITE_CONVEX_SITE_URL: site,
  VITE_SITE_URL: origin,
  NODE_OPTIONS: operation === 'build' ? '--max-old-space-size=1536' : '--max-old-space-size=768',
});

let credentials;
if (operation !== 'build') {
  credentials = JSON.parse(readFileSync('/runtime-config/hosted.json', 'utf8'));
  if (!credentials.CONVEX_DEPLOY_KEY?.startsWith(`dev:${deployment}|`)) {
    throw new Error('Expected the scoped development key for different-bat-943.');
  }
}

async function query(path) {
  const response = await fetch(`${cloud}/api/query`, {
    method: 'POST',
    headers: {
      Authorization: `Convex ${credentials.CONVEX_DEPLOY_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, args: {}, format: 'json' }),
  });
  const result = await response.json();
  if (!response.ok || result.status !== 'success') {
    throw new Error(`Cloud query ${path} failed (HTTP ${response.status}).`);
  }
  return result.value;
}

function run(args, extraEnv = {}) {
  const result = spawnSync('pnpm', args, { env: { ...env, ...extraEnv }, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function buildStamp(directory = 'dist') {
  const files = readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return buildStamp(path);
    if (!entry.isFile()) throw new Error(`Unsupported built asset: ${path}`);
    return [[path, createHash('sha256').update(readFileSync(path)).digest('hex')]];
  });
  return files.sort((a, b) => a[0].localeCompare(b[0]));
}

if (operation !== 'build') {
  if ((await query('_system/cli/convexUrl:cloudUrl')) !== cloud) {
    throw new Error('Authenticated deployment URL does not match the configured target.');
  }
}
console.log(`Target: dev (${deployment}); frontend ${origin}; operation ${operation}`);

if (operation === 'status') {
  const functions = await query('_system/cli/modules:apiSpec');
  const variables = await query('_system/cli/queryEnvironmentVariables');
  console.log(
    JSON.stringify({
      cloud,
      functionCount: functions.length,
      envNames: variables.map(v => v.name),
    }),
  );
} else if (operation === 'configure') {
  const variables = await query('_system/cli/queryEnvironmentVariables');
  const current = Object.fromEntries(variables.map(v => [v.name, v.value]));
  const changes = [{ name: 'SITE_URL', value: origin }];
  if (!current.BETTER_AUTH_SECRET) {
    changes.push({ name: 'BETTER_AUTH_SECRET', value: randomBytes(32).toString('hex') });
  }
  if (current.SALIENT_AUTH_BASE_URL) changes.push({ name: 'SALIENT_AUTH_BASE_URL', value: null });
  const response = await fetch(`${cloud}/api/update_environment_variables`, {
    method: 'POST',
    headers: {
      Authorization: `Convex ${credentials.CONVEX_DEPLOY_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ changes }),
  });
  if (!response.ok) throw new Error(`Cloud environment update failed (HTTP ${response.status}).`);
  console.log(`Configured ${changes.map(v => v.name).join(', ')}; secret values omitted.`);
} else if (operation === 'backend') {
  run(['exec', 'convex', 'deploy', '--yes'], { CONVEX_DEPLOY_KEY: credentials.CONVEX_DEPLOY_KEY });
} else if (operation === 'seed') {
  // Explicit hosted command; the existing local-only seed guard remains unchanged.
  run(['exec', 'convex', 'run', 'content:reseed'], {
    CONVEX_DEPLOY_KEY: credentials.CONVEX_DEPLOY_KEY,
  });
} else if (operation === 'build') {
  run(['build']);
  writeFileSync(
    '/artifacts/hosted-build.json',
    JSON.stringify({ cloud, site, origin, files: buildStamp() }),
  );
} else if (operation === 'frontend') {
  if (!credentials.CLOUDFLARE_API_TOKEN) throw new Error('Cloudflare account token is missing.');
  const expected = JSON.stringify({ cloud, site, origin, files: buildStamp() });
  if (readFileSync('/artifacts/hosted-build.json', 'utf8') !== expected) {
    throw new Error(
      'Built assets changed or target differs; run the hosted build before publishing.',
    );
  }
  run(['dlx', 'wrangler@4.134.0', 'deploy', '--config', 'wrangler.jsonc'], {
    CLOUDFLARE_API_TOKEN: credentials.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: account,
    WRANGLER_SEND_METRICS: 'false',
  });
}
