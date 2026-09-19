// SPDX-License-Identifier: GPL-3.0-only
// Container healthcheck for the development backend service.
//
// The backend container runs three nested processes: `node runtime/backend.mjs`, the `convex dev`
// CLI it spawns, and the Rust `convex-local-backend` binary that CLI spawns. Only the last one
// serves queries, and its death is the one nothing propagates: `backend.mjs` exits the container
// when its direct child exits, but it never learns about its grandchild.
//
// The previous healthcheck tested only that `/tmp/backend-ready` existed. `backend.mjs` clears that
// marker when it starts (`backend.mjs:9`) and writes it once the initial push and auth setup
// succeed, so it is an accurate record of *this container's* startup — and nothing touches it again
// for the life of the container, including when the backend behind it dies. On
// 2026-09-19 the Rust process was OOM-killed (`State.OOMKilled=true`, cgroup `oom_kill 1`,
// `memory.max` 3 GiB) while both node processes survived: port 3210 refused connections, the marker
// remained, Docker still reported `healthy`, and a browser suite kept driving an absent backend.
//
// So the marker still gates — it is the only signal that startup finished — but it is no longer
// sufficient on its own. Once it exists, this also probes the live endpoint.
//
// This reports; it does not repair. There is no restart, no retry loop, and no limit is raised.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Written by runtime/backend.mjs only after the initial push and auth setup succeed. */
export const READY_MARKER = '/tmp/backend-ready';
/**
 * Served by the Rust backend itself (`crates/local_backend/src/router.rs:548-549` at the pinned
 * revision), which returns the instance name as the body. It needs no authentication and is the
 * same endpoint `backend.mjs` already waits on during startup, so a healthy result here means
 * exactly what startup meant by "the backend answers".
 */
export const LIVE_URL = 'http://127.0.0.1:3210/instance_name';
/**
 * Compose gives the healthcheck a 3s timeout. Staying under it means an unresponsive backend
 * produces a real unhealthy verdict with a reason, rather than the probe being killed mid-request.
 */
export const PROBE_TIMEOUT_MS = 2000;

/**
 * @returns {Promise<{ healthy: boolean, reason: string }>} never throws; the caller maps it to an
 * exit code.
 */
export async function checkBackendHealth({
  marker = READY_MARKER,
  url = LIVE_URL,
  timeoutMs = PROBE_TIMEOUT_MS,
  fetchImpl = fetch,
} = {}) {
  // Gate on startup first, and do not probe before it: during the initial push the endpoint already
  // answers, so probing alone would report healthy before auth setup has run.
  if (!existsSync(marker)) return { healthy: false, reason: 'startup has not completed' };
  let response;
  try {
    // One signal covers headers and body together, so the whole probe is bounded.
    response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const cause = error instanceof Error ? error.name : 'unknown error';
    return { healthy: false, reason: `ready marker is stale: backend unreachable (${cause})` };
  }
  if (!response.ok)
    return { healthy: false, reason: `ready marker is stale: backend returned ${response.status}` };
  let body;
  try {
    // Response headers can outlive the process that still owes the body, so read it.
    body = await response.text();
  } catch (error) {
    const cause = error instanceof Error ? error.name : 'unknown error';
    return { healthy: false, reason: `ready marker is stale: response truncated (${cause})` };
  }
  // Never log the body itself; only whether the backend named itself at all.
  if (!body.trim())
    return { healthy: false, reason: 'ready marker is stale: backend named no instance' };
  return { healthy: true, reason: 'startup complete and backend responding' };
}

// The overrides exist for the tests, which run this file exactly as Compose does. Nothing in
// runtime/compose.yaml sets them, so the container always uses the constants above.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const timeout = Number(process.env.SALIENT_HEALTHCHECK_TIMEOUT_MS);
  const { healthy, reason } = await checkBackendHealth({
    marker: process.env.SALIENT_HEALTHCHECK_MARKER || READY_MARKER,
    url: process.env.SALIENT_HEALTHCHECK_URL || LIVE_URL,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : PROBE_TIMEOUT_MS,
  });
  if (!healthy) {
    console.error(`Backend unhealthy: ${reason}.`);
    process.exit(1);
  }
  console.log(`Backend healthy: ${reason}.`);
}
