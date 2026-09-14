// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('../../scripts/setup-local.ts', import.meta.url));
const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
const localEnv = 'CONVEX_DEPLOYMENT=anonymous:review-local\nVITE_CONVEX_URL=http://127.0.0.1:3210\nVITE_LOCAL_PROXY=false\n';
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'salient-local-setup-review-'));
  directories.push(cwd);
  mkdirSync(join(cwd, 'node_modules/convex/bin'), { recursive: true });
  writeFileSync(join(cwd, '.env.local'), localEnv);
  // This conflicting fallback must never be selected: the child always needs --env-file.
  writeFileSync(join(cwd, '.env'), 'CONVEX_DEPLOY_KEY=prod:unrelated-review-token\n');
  writeFileSync(join(cwd, 'node_modules/convex/bin/main.js'), `
    const fs = require('node:fs');
    const args = process.argv.slice(2);
    fs.appendFileSync('calls.jsonl', JSON.stringify(args) + '\\n');
    if (args[0] !== 'env' || !['get', 'set'].includes(args[1])) process.exit(80);
    if (args.at(-2) !== '--env-file' || args.at(-1) !== '.env.local') process.exit(81);
    if (args[1] === 'get') {
      if (process.env.REVIEW_FAIL_LOOKUP === 'true') { console.error('Simulated read failure'); process.exit(12); }
      console.log('existing-test-secret');
    } else fs.readFileSync(0, 'utf8');
  `);
  const env = { ...process.env };
  for (const name of ['CONVEX_DEPLOYMENT', 'CONVEX_DEPLOY_KEY', 'CONVEX_DEPLOYMENT_TOKEN', 'CONVEX_SELF_HOSTED_URL', 'CONVEX_SELF_HOSTED_ADMIN_KEY']) delete env[name];
  return { cwd, env, run: (overrides: NodeJS.ProcessEnv = {}) => spawnSync(process.execPath, [script], { cwd, env: { ...env, ...overrides }, encoding: 'utf8', timeout: 10000 }), calls: () => {
    try { return readFileSync(join(cwd, 'calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line) as string[]); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
  } };
}

test.each(['environment', 'local file'])('deployment-token override in %s stops before spawning the CLI', source => {
  const setup = fixture();
  if (source === 'local file') writeFileSync(join(setup.cwd, '.env.local'), localEnv + 'CONVEX_DEPLOYMENT_TOKEN=prod:review-override\n');
  const result = setup.run(source === 'environment' ? { CONVEX_DEPLOYMENT_TOKEN: 'prod:review-override' } : {});
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('no deployment-key overrides');
  expect(setup.calls()).toEqual([]);
});

test('failed secret lookup makes no writes and leaves the local file intact', () => {
  const setup = fixture();
  const result = setup.run({ REVIEW_FAIL_LOOKUP: 'true' });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Could not read the existing auth secret');
  expect(setup.calls()).toEqual([['env', 'get', 'BETTER_AUTH_SECRET', '--env-file', '.env.local']]);
  expect(readFileSync(join(setup.cwd, '.env.local'), 'utf8')).toBe(localEnv);
});

test('existing secret is preserved and every settings operation selects the validated local file', () => {
  const setup = fixture();
  const result = setup.run();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain('Existing local auth secret preserved');
  expect(result.stdout).not.toContain('existing-test-secret');
  expect(setup.calls()).toEqual([
    ['env', 'get', 'BETTER_AUTH_SECRET', '--env-file', '.env.local'],
    ['env', 'set', 'SITE_URL', '--env-file', '.env.local'],
    ['env', 'set', 'ADDITIONAL_TRUSTED_ORIGINS', '--env-file', '.env.local'],
  ]);
  expect(readFileSync(join(setup.cwd, '.env.local'), 'utf8')).toBe(localEnv.replace('VITE_LOCAL_PROXY=false', 'VITE_LOCAL_PROXY=true'));
});
