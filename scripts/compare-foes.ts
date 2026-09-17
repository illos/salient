// SPDX-License-Identifier: GPL-3.0-only
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import type { Fields, FoePackage } from '../shared/contracts/foes.ts';
import { compareFoes, COMPARISON_INVENTORY, EXTERNAL_REVISION } from './foes/compare.ts';
import { COMPARISON_REPORT } from './foes/batches.ts';
const root = fileURLToPath(new URL('..', import.meta.url));
const cache = resolve(
  process.env.SALIENT_FOE_COMPARISON_CACHE ||
    `${root}/.playtest/steel-cauldron/${EXTERNAL_REVISION}`,
);
const files = COMPARISON_INVENTORY.files;
const manifestPath = `${cache}/manifest.json`;
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const errors: string[] = [];
if (process.argv.includes('--fetch')) {
  mkdirSync(cache, { recursive: true });
  const digests: Record<string, string> = {};
  const queue = files.slice();
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const { path, sha256 } = queue.shift()!;
        const url = `https://raw.githubusercontent.com/erik-meier/monster-library/${EXTERNAL_REVISION}/${path}`;
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const bytes = await response.text();
          JSON.parse(bytes);
          if (digest(bytes) !== sha256)
            throw new Error('Retrieved contents differ from pinned inventory digest');
          writeFileSync(`${cache}/${path.split('/').at(-1)}`, bytes);
          digests[path] = digest(bytes);
        } catch (e) {
          errors.push(`${path}: ${e}`);
        }
      }
    }),
  );
  writeFileSync(
    manifestPath,
    JSON.stringify({ revision: EXTERNAL_REVISION, digests }, null, 2) + '\n',
  );
}
const candidates: Fields[] = [];
try {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    revision: string;
    digests: Record<string, string>;
  };
  if (manifest.revision !== EXTERNAL_REVISION) throw new Error('Wrong comparison cache revision');
  for (const { path, sha256, id } of files) {
    try {
      const file = `${cache}/${path.split('/').at(-1)}`;
      if (!existsSync(file)) throw new Error('Missing file');
      const bytes = readFileSync(file, 'utf8');
      if (manifest.digests[path] !== digest(bytes) || digest(bytes) !== sha256)
        throw new Error('Cache contents do not match recorded retrieval');
      const candidate = JSON.parse(bytes) as Fields;
      if (candidate.id !== id) throw new Error('Wrong counterpart identity');
      candidates.push(candidate);
    } catch (e) {
      errors.push(`${path}: ${e}`);
    }
  }
} catch (e) {
  errors.push(String(e));
}
const pack = JSON.parse(
  readFileSync(`${root}/shared/content/foes/catalog.json`, 'utf8'),
) as FoePackage;
const report = {
  ...compareFoes(pack, candidates),
  retrievalErrors: errors,
  retrievedCount: candidates.length,
};
const output = resolve(process.env.SALIENT_FOE_COMPARISON_REPORT || `${root}/${COMPARISON_REPORT}`);
mkdirSync(resolve(output, '..'), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.counts));
console.log(`Report: ${output}`);
if (
  errors.length ||
  report.unmatchedExternal.some(r => !r.disposition) ||
  report.rows.some(r => ['review', 'missing', 'ambiguous', 'error'].includes(r.status))
)
  process.exitCode = 1;
