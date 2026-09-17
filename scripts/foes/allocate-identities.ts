// SPDX-License-Identifier: GPL-3.0-only
/** Explicit one-time registry maintenance; ordinary generation never allocates identities. */
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { readInputs } from '../ingest-foes.ts';
import { sourceFeatures } from './source-adaptations.ts';
import { fingerprint } from './import.ts';
import type { Identity } from './import.ts';
const path = new URL('./identities.json', import.meta.url);
const identities = JSON.parse(readFileSync(path, 'utf8')) as Identity[];
let added = 0;
for (const input of readInputs()) {
  const record = JSON.parse(input.json);
  for (const { identity: feature } of sourceFeatures(input, record)) {
    const parent = record.metadata.scc as string;
    const key = fingerprint(feature);
    if (!identities.some(i => i.parent === parent && i.fingerprint === key)) {
      identities.push({ parent, fingerprint: key, id: `salient:foe-feature:${randomUUID()}` });
      added++;
    }
  }
}
writeFileSync(path, JSON.stringify(identities, null, 2) + '\n');
console.log(`Allocated ${added} identities; retained ${identities.length - added}.`);
