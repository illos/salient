#!/usr/bin/env bash
set -euo pipefail
# This entire installer runs within the bounded tool container on the dev guest.
mkdir -p /tools/bin
cp /usr/local/bin/node /tools/bin/node
if [[ ! -x /tools/node_modules/.bin/pnpm ]] || [[ $(/tools/node_modules/.bin/pnpm --version) != 11.5.3 ]]; then
  npm install --prefix /tools --ignore-scripts --no-audit --no-fund pnpm@11.5.3
fi
export PATH=/tools/bin:/tools/node_modules/.bin:$PATH
# The source archive has no .git; installing hooks there is neither useful nor valid.
export SKIP_SIMPLE_GIT_HOOKS=1
pnpm install --frozen-lockfile --store-dir /tools/pnpm-store
node runtime/patch-convex-cli.mjs
node runtime/source-git.mjs
pnpm rules:ingest
