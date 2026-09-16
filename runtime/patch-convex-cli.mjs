// Temporary compatibility patch for pinned Convex 1.45.0; remove when upstream supports it.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const originalHash = 'f4fea97eef31a470c05c5effaf5e2dd0c63dbf161ccc7f51163b73e34a650c4f';
export function patchBundle(original) {
  if (createHash('sha256').update(original).digest('hex') !== originalHash) {
    throw new Error('Convex CLI bundle differs from reviewed 1.45.0; refusing compatibility patch');
  }
  let result = original;
  function replace(before, after) {
    if (result.split(before).length !== 2) throw new Error('Convex patch context is not unique');
    result = result.replace(before, after);
  }
  replace('    "--instance-secret",\n    args.instanceSecret,\n', '');
  replace(
    '      SENTRY_DSN: LOCAL_BACKEND_SENTRY_DSN',
    '      CONVEX_INSTANCE_SECRET: args.instanceSecret,\n      SENTRY_DSN: LOCAL_BACKEND_SENTRY_DSN',
  );
  // The environment secret activates the top-level instance_name requirement as well
  // as AdminKeyArgs. Supplying the public name only after keygen does not satisfy it.
  replace(
    ')(latestBinaryPath, [\n      "keygen",',
    ')(latestBinaryPath, [\n      "--instance-name",\n      deploymentName,\n      "keygen",',
  );
  replace(
    '      deploymentName,\n      "--instance-secret",\n      instanceSecret\n    ]));',
    '      deploymentName\n    ], { env: { ...process.env, CONVEX_INSTANCE_SECRET: instanceSecret } }));',
  );
  replace(
    '  const { binaryPath: latestBinaryPath } = await ensureBackendBinaryDownloaded(\n    ctx,\n    {\n      kind: "latest"\n    }\n  );\n  return generateLocalDevSecrets(ctx, { deploymentName, latestBinaryPath });',
    '  const latestBinaryPath = process.env.SALIENT_CONVEX_BACKEND;\n  if (!latestBinaryPath) throw new Error("Patched backend path required");\n  return generateLocalDevSecrets(ctx, { deploymentName, latestBinaryPath });',
  );
  return result;
}
export function ensurePatched(path) {
  const original = readFileSync(path, 'utf8');
  // Compare against a deterministically patched copy of an independently saved original.
  const backup = `${path}.salient-original`;
  let expected;
  try {
    expected = patchBundle(readFileSync(backup, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (expected === original) return;
  // Upgrade only the exact earlier compatibility patch, with its original bundle verified.
  if (
    expected &&
    createHash('sha256').update(original).digest('hex') ===
      'f81a6be1b7ffcb4662be481d292c2103aa0af18366aa5c4e36a48b45784304e1'
  ) {
    writeFileSync(`${path}.tmp`, expected);
    renameSync(`${path}.tmp`, path);
    return;
  }
  const patched = patchBundle(original);
  writeFileSync(backup, original, { mode: 0o600 });
  writeFileSync(`${path}.tmp`, patched);
  renameSync(`${path}.tmp`, path);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensurePatched(resolve('node_modules/convex/dist/cli.bundle.cjs'));
  console.log('Pinned Convex CLI compatibility patch installed (instance secret via environment).');
}
