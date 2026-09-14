// SPDX-License-Identifier: GPL-3.0-only
// A02 admission is not implemented. Seed only an isolated local test hero, then exercise all
// gameplay through authenticated application operations. This is not an admission-path test.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEnv, promisify } from 'node:util';
import { execFile } from 'node:child_process';

export async function seedLocalHero(campaignId: string, ownerId: string, name: string) {
  const env = parseEnv(readFileSync('.env.local', 'utf8'));
  const url = new URL(env.VITE_CONVEX_URL ?? 'http://invalid');
  const overrides = [
    'CONVEX_DEPLOY_KEY',
    'CONVEX_DEPLOYMENT_TOKEN',
    'CONVEX_SELF_HOSTED_URL',
    'CONVEX_SELF_HOSTED_ADMIN_KEY',
  ];
  if (
    !/^(anonymous|local):/.test(env.CONVEX_DEPLOYMENT ?? '') ||
    !['127.0.0.1', 'localhost'].includes(url.hostname) ||
    overrides.some(key => env[key] || process.env[key]) ||
    (process.env.CONVEX_DEPLOYMENT && process.env.CONVEX_DEPLOYMENT !== env.CONVEX_DEPLOYMENT)
  ) {
    throw new Error(
      'Browser hero fixtures require this checkout’s local deployment without overrides.',
    );
  }
  const scratch = mkdtempSync(join(tmpdir(), 'salient-browser-hero-'));
  const path = join(scratch, 'hero.jsonl');
  try {
    writeFileSync(
      path,
      JSON.stringify({
        campaignId,
        ownerId,
        authored: { name, appearance: '', biography: '', notes: 'Private audit fixture note' },
        revision: 1,
        draftRevisionId: null,
        effectiveRevisionId: null,
        derivedBaseline: null,
        liveState: null,
        combatLocked: false,
      }) + '\n',
    );
    await promisify(execFile)(process.execPath, [
      'node_modules/convex/bin/main.js',
      'import',
      '--table',
      'characters',
      '--append',
      '--yes',
      path,
      '--env-file',
      '.env.local',
    ]);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
