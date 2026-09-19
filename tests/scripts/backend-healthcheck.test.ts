// SPDX-License-Identifier: GPL-3.0-only
// Runs runtime/healthcheck.mjs the way runtime/compose.yaml does — as a child process by absolute
// path, reading its exit code — so these cover the contract Docker actually consumes.
import { expect, test } from 'vitest';
import { createServer, type Server } from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Compose allows the probe this long; every case that claims to be bounded is held to it.
const COMPOSE_TIMEOUT_MS = 3000;
const SCRIPT = join(process.cwd(), 'runtime/healthcheck.mjs');

interface Probe {
  code: number;
  stderr: string;
  stdout: string;
  elapsedMs: number;
}

function runHealthcheck(args: string[]): Promise<Probe> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [SCRIPT, ...args],
      // The outer timeout is the harness's own guard: the probe bounds itself, so reaching this
      // means the script hung and the test must fail rather than wait for the suite timeout.
      { timeout: 15_000 },
      (error, stdout, stderr) => {
        const elapsedMs = Date.now() - started;
        if (!error) return resolve({ code: 0, stdout, stderr, elapsedMs });
        // A normal non-zero exit carries a numeric code. A spawn failure carries a string code
        // (`ENOENT`), and a signal kill carries `code: null` with `signal` set — neither is a
        // health verdict, and reading either as 0 would let a broken run look healthy.
        if (typeof error.code === 'number')
          return resolve({ code: error.code, stdout, stderr, elapsedMs });
        reject(
          new Error(
            `healthcheck did not exit normally (code ${String(error.code)}, signal ${String(error.signal)}): ${error.message}`,
          ),
        );
      },
    );
  });
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
  return `http://127.0.0.1:${address.port}/instance_name`;
}

async function close(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}

function scratchMarker(write: boolean): { marker: string; cleanup: () => void } {
  const directory = mkdtempSync(join(tmpdir(), 'salient-health-'));
  const marker = join(directory, 'backend-ready');
  if (write) writeFileSync(marker, 'ready\n');
  return { marker, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
}

test('ready marker plus a live backend is healthy, and says so', async () => {
  const server = createServer((_request, response) => response.end('anonymous-salient'));
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const probe = await runHealthcheck(['--marker', marker, '--url', url]);
    expect(probe.code).toBe(0);
    expect(probe.stderr).toBe('');
    // Exit 0 with no output would be indistinguishable from a script that never ran at all.
    expect(probe.stdout).toMatch(/Backend healthy/);
    // The backend stays listening, so the probe must not linger on a pooled keep-alive socket.
    expect(probe.elapsedMs).toBeLessThan(COMPOSE_TIMEOUT_MS);
  } finally {
    cleanup();
    await close(server);
  }
});

test('a stale ready marker over a dead backend is unhealthy', async () => {
  // This is the observed OOM failure: the Rust process is gone, nothing removed the marker.
  const server = createServer((_request, response) => response.end('anonymous-salient'));
  const url = await listen(server);
  await close(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const probe = await runHealthcheck(['--marker', marker, '--url', url]);
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/stale/);
    expect(probe.elapsedMs).toBeLessThan(COMPOSE_TIMEOUT_MS);
  } finally {
    cleanup();
  }
});

test('startup that has not finished is unhealthy and is never probed', async () => {
  // The endpoint answers well before the initial push and auth setup complete, so probing without
  // the marker gate would report healthy too early.
  let requests = 0;
  const server = createServer((_request, response) => {
    requests += 1;
    response.end('anonymous-salient');
  });
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(false);
  try {
    const probe = await runHealthcheck(['--marker', marker, '--url', url]);
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/startup has not completed/);
    expect(requests).toBe(0);
  } finally {
    cleanup();
    await close(server);
  }
});

test('the default probe timeout keeps an unanswering backend inside the Compose budget', async () => {
  // No --timeout-ms: this is the only case that pins PROBE_TIMEOUT_MS itself to Compose's 3s. A
  // future default above the budget would make Docker score healthy probes as failures.
  const server = createServer(() => {
    /* Accept, then never respond. */
  });
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const probe = await runHealthcheck(['--marker', marker, '--url', url]);
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/stale/);
    expect(probe.elapsedMs).toBeLessThan(COMPOSE_TIMEOUT_MS);
  } finally {
    cleanup();
    await close(server);
  }
});

test('a backend that accepts the connection but never answers is unhealthy', async () => {
  const server = createServer(() => {
    /* Accept, then never respond. */
  });
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const probe = await runHealthcheck(['--marker', marker, '--url', url, '--timeout-ms', '300']);
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/stale/);
    expect(probe.elapsedMs).toBeLessThan(COMPOSE_TIMEOUT_MS);
  } finally {
    cleanup();
    await close(server);
  }
});

test('a body that never arrives after the headers is unhealthy, not a hang', async () => {
  // The shape a process dying mid-response produces: the status line is already on the wire, so
  // `fetch` resolves and only reading the body reveals the failure. This is the case that depends
  // on one abort signal covering the body read and not just the headers.
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.flushHeaders();
    /* Never end the body. */
  });
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const probe = await runHealthcheck(['--marker', marker, '--url', url, '--timeout-ms', '300']);
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/truncated/);
    expect(probe.elapsedMs).toBeLessThan(COMPOSE_TIMEOUT_MS);
  } finally {
    cleanup();
    await close(server);
  }
});

test('an empty body does not pass as healthy', async () => {
  // Distinct from the case above: this response completes, with nothing in it.
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('');
  });
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const probe = await runHealthcheck(['--marker', marker, '--url', url]);
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/named no instance/);
  } finally {
    cleanup();
    await close(server);
  }
});

test('an error status is unhealthy even with the marker present', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(503);
    response.end('unavailable');
  });
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const probe = await runHealthcheck(['--marker', marker, '--url', url]);
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/503/);
  } finally {
    cleanup();
    await close(server);
  }
});

test('an unusable argument is unhealthy rather than silently ignored', async () => {
  const probe = await runHealthcheck(['--target', 'http://127.0.0.1:1/']);
  expect(probe.code).toBe(1);
  expect(probe.stderr).toMatch(/could not run/);
});

test('the probed port stays in step with the port the backend is started on', async () => {
  // The probe URL duplicates a number runtime/backend.mjs owns; nothing else would notice drift.
  // Read as text rather than imported: tsconfig.web.json sets no allowJs and does not include
  // runtime/, so importing the .mjs here would be a typecheck error, not a test.
  const started = /'--local-cloud-port',\s*'(\d+)'/.exec(readFileSync('runtime/backend.mjs', 'utf8'));
  const probed = /export const LIVE_URL = 'http:\/\/127\.0\.0\.1:(\d+)\//.exec(
    readFileSync('runtime/healthcheck.mjs', 'utf8'),
  );
  expect(started?.[1], 'no --local-cloud-port in runtime/backend.mjs').toBeDefined();
  expect(probed?.[1], 'no LIVE_URL port in runtime/healthcheck.mjs').toBeDefined();
  expect(probed?.[1]).toBe(started?.[1]);
});

test('importing the module runs no probe and exits nothing', async () => {
  // The entry-point guard must keep the module silent unless it is the entry point. Imported in a
  // child rather than here, for the same tsconfig reason as above.
  const probe = await new Promise<{ code: number; stdout: string; stderr: string }>(
    (resolve, reject) => {
      execFile(
        process.execPath,
        ['--input-type=module', '-e', `await import(${JSON.stringify(SCRIPT)});`],
        { timeout: 15_000 },
        (error, stdout, stderr) => {
          if (!error) return resolve({ code: 0, stdout, stderr });
          if (typeof error.code === 'number') return resolve({ code: error.code, stdout, stderr });
          reject(new Error(`import did not exit normally: ${error.message}`));
        },
      );
    },
  );
  expect(probe.code).toBe(0);
  expect(probe.stdout).toBe('');
  expect(probe.stderr).toBe('');
});
