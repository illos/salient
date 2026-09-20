#!/usr/bin/env bash
set -eu
pnpm exec prettier --write scripts/v63-headless-main.ts tsconfig.web.json
pnpm exec eslint scripts/v63-headless-main.ts
pnpm exec tsc -p tsconfig.web.json
printf 'Positive generated-API TypeScript check passed.\n'
cp scripts/v63-headless-main.ts /artifacts/v63-main-fixed-positive.ts
trap 'cp /artifacts/v63-main-fixed-positive.ts scripts/v63-headless-main.ts' EXIT
node --input-type=module <<'JS'
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const path='scripts/v63-headless-main.ts';
const text=readFileSync(path,'utf8');
const full="actor: { kind: 'character', id: heroId, name: authored.name }";
assert.equal(text.split(full).length,2);
writeFileSync(path,text.replace(full,"actor: { kind: 'character', id: heroId }"));
JS
set +e
pnpm exec tsc -p tsconfig.web.json > /artifacts/v63-main-missing-name-type-error.txt 2>&1
negative_rc=$?
set -e
printf '%s\n' "$negative_rc" > /artifacts/v63-main-missing-name-type-exit.txt
cp /artifacts/v63-main-fixed-positive.ts scripts/v63-headless-main.ts
trap - EXIT
if [ "$negative_rc" -eq 0 ]; then
  printf 'Missing-name mutation unexpectedly passed TypeScript.\n'
  exit 1
fi
node --input-type=module <<'JS'
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const text=readFileSync('/artifacts/v63-main-missing-name-type-error.txt','utf8');
assert.match(text,/Property 'name' is missing/);
assert.match(text,/scripts\/v63-headless-main\.ts/);
JS
cat /artifacts/v63-main-missing-name-type-error.txt
cmp scripts/v63-headless-main.ts /artifacts/v63-main-fixed-positive.ts
sha256sum scripts/v63-headless-main.ts tsconfig.web.json > /artifacts/v63-main-fixed-files.sha256
printf 'Negative missing-name contract check rejected; positive source restored byte-for-byte.\n'
