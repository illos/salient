import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensurePatched, patchBundle } from './patch-convex-cli.mjs';

test('unreviewed CLI bundle fails closed', () => {
  assert.throws(() => patchBundle('unknown CLI'), /differs from reviewed/);
});
test('reviewed CLI patch removes process argument secrets and is idempotent', () => {
  const path = process.env.CONVEX_BUNDLE_FIXTURE;
  assert.ok(
    path,
    'Set CONVEX_BUNDLE_FIXTURE to unpatched installed Convex1.45.0 dist/cli.bundle.cjs',
  );
  const original = readFileSync(path, 'utf8');
  const patched = patchBundle(original);
  assert.ok(!patched.includes('"--instance-secret",\n    args.instanceSecret'));
  assert.ok(!patched.includes('"--instance-secret",\n      instanceSecret'));
  assert.ok(patched.includes('CONVEX_INSTANCE_SECRET: args.instanceSecret'));
  assert.ok(patched.includes('CONVEX_INSTANCE_SECRET: instanceSecret'));
  const scratch = mkdtempSync(join(tmpdir(), 'salient-convex-patch-'));
  try {
    const target = join(scratch, 'bundle.cjs');
    writeFileSync(target, original);
    ensurePatched(target);
    assert.equal(readFileSync(target, 'utf8'), patched);
    ensurePatched(target);
    assert.equal(readFileSync(target, 'utf8'), patched);
    // Exercise the exact earlier patch saved in a persistent dependency volume.
    const previous = patched.replace(
      ')(latestBinaryPath, [\n      "--instance-name",\n      deploymentName,\n      "keygen",',
      ')(latestBinaryPath, [\n      "keygen",',
    );
    writeFileSync(target, previous);
    ensurePatched(target);
    assert.equal(readFileSync(target, 'utf8'), patched);
    writeFileSync(target, `${patched}\n// unexpected change`);
    assert.throws(() => ensurePatched(target), /differs from reviewed/);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('patched keygen passes both parser instance names and secret only in child environment', async () => {
  const { runInNewContext } = await import('node:vm');
  const { promisify } = await import('node:util');
  const patched = patchBundle(readFileSync(process.env.CONVEX_BUNDLE_FIXTURE, 'utf8'));
  const start = patched.indexOf('async function generateLocalDevSecrets(ctx, {');
  const end = patched.indexOf('\nfunction generateInstanceSecret()', start);
  assert.ok(start > 0 && end > start);
  let invocation;
  const generate = runInNewContext(`(${patched.slice(start, end)})`, {
    process: { env: {} },
    generateInstanceSecret: () => 'disposable-test-secret',
    logVerbose: () => {},
    import_util7: { promisify },
    import_child_process4: {
      execFile(path, args, options, callback) {
        invocation = { path, args: Array.from(args), options };
        callback(null, { stdout: 'disposable-admin-key\n' });
      },
    },
  });
  const result = await generate(
    {},
    { deploymentName: 'anonymous-fixture', latestBinaryPath: '/patched/backend' },
  );
  assert.equal(result.adminKey, 'disposable-admin-key');
  assert.deepEqual(invocation.args, [
    '--instance-name',
    'anonymous-fixture',
    'keygen',
    'admin-key',
    '--instance-name',
    'anonymous-fixture',
  ]);
  assert.equal(invocation.options.env.CONVEX_INSTANCE_SECRET, 'disposable-test-secret');
  assert.ok(!invocation.args.includes('disposable-test-secret'));
});
