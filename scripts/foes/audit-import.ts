// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync, writeFileSync } from 'node:fs';
import { readInputs } from '../ingest-foes.ts';
import { importFoes } from './import.ts';
const identities = JSON.parse(readFileSync(new URL('./identities.json', import.meta.url), 'utf8'));
const failures: { path: string; error: string }[] = [];
for (const input of readInputs()) {
  try {
    await importFoes([input], identities);
  } catch (error) {
    failures.push({ path: input.path, error: String(error) });
  }
}
writeFileSync('/artifacts/foes-import-audit.json', JSON.stringify(failures, null, 2));
console.log(JSON.stringify(failures, null, 2));
if (failures.length) process.exitCode = 1;
