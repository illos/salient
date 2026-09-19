// SPDX-License-Identifier: GPL-3.0-only
// Runs runtime/healthcheck.mjs exactly as runtime/compose.yaml does — as a child process, reading
// only its exit code — so these cover the contract Docker actually consumes.
import { expect, test } from 'vitest';
import { createServer, type Server } from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

interface Probe {
  code: number;
  stderr: string;
  stdout: string;
}

function runHealthcheck(env: Record<string, string>): Promise<Probe> {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      ['runtime/healthcheck.mjs'],
      // The outer timeout is the harness's own guard: the probe bounds itself, so reaching this
      // means the script hung and the test must fail rather than wait for the suite timeout.
      { env: { ...process.env, ...env }, timeout: 15_000 },
      (error, stdout, stderr) => {
        if (!error) return resolve({ code: 0, stdout, stderr });
        // A normal non-zero exit carries a numeric code. A spawn failure carries a string code
        // (`ENOENT`), and a signal kill carries `code: null` with `signal` set — neither is a
        // health verdict, and reading either as 0 would let a broken run look healthy.
        if (typeof error.code === 'number') return resolve({ code: error.code, stdout, stderr });
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

test('ready marker plus a live backend is healthy', async () => {
  const server = createServer((_request, response) => response.end('anonymous-salient'));
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const probe = await runHealthcheck({
      SALIENT_HEALTHCHECK_MARKER: marker,
      SALIENT_HEALTHCHECK_URL: url,
    });
    expect(probe.stderr).toBe('');
    expect(probe.code).toBe(0);
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
    const probe = await runHealthcheck({
      SALIENT_HEALTHCHECK_MARKER: marker,
      SALIENT_HEALTHCHECK_URL: url,
    });
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/stale/);
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
    const probe = await runHealthcheck({
      SALIENT_HEALTHCHECK_MARKER: marker,
      SALIENT_HEALTHCHECK_URL: url,
    });
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/startup has not completed/);
    expect(requests).toBe(0);
  } finally {
    cleanup();
    await close(server);
  }
});

test('a backend that accepts the connection but never answers is unhealthy within the bound', async () => {
  // A saturated or wedged backend holds the socket open. Compose allows the probe 3s, so it must
  // resolve well before that instead of being killed mid-request.
  const server = createServer(() => {
    /* Accept, then never respond. */
  });
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const started = Date.now();
    const probe = await runHealthcheck({
      SALIENT_HEALTHCHECK_MARKER: marker,
      SALIENT_HEALTHCHECK_URL: url,
      SALIENT_HEALTHCHECK_TIMEOUT_MS: '300',
    });
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/stale/);
    expect(Date.now() - started).toBeLessThan(10_000);
  } finally {
    cleanup();
    await close(server);
  }
});

test('a body that never arrives after the headers is unhealthy, not a hang', async () => {
  // The shape a process dying mid-response produces: the status line is already on the wire, so
  // `fetch` resolves and only reading the body reveals the failure. This is what makes the single
  // abort signal cover the body read and not just the headers.
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.flushHeaders();
    /* Never end the body. */
  });
  const url = await listen(server);
  const { marker, cleanup } = scratchMarker(true);
  try {
    const started = Date.now();
    const probe = await runHealthcheck({
      SALIENT_HEALTHCHECK_MARKER: marker,
      SALIENT_HEALTHCHECK_URL: url,
      SALIENT_HEALTHCHECK_TIMEOUT_MS: '300',
    });
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/truncated/);
    expect(Date.now() - started).toBeLessThan(10_000);
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
    const probe = await runHealthcheck({
      SALIENT_HEALTHCHECK_MARKER: marker,
      SALIENT_HEALTHCHECK_URL: url,
    });
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
    const probe = await runHealthcheck({
      SALIENT_HEALTHCHECK_MARKER: marker,
      SALIENT_HEALTHCHECK_URL: url,
    });
    expect(probe.code).toBe(1);
    expect(probe.stderr).toMatch(/503/);
  } finally {
    cleanup();
    await close(server);
  }
});
