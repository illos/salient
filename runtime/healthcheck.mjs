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
import { existsSync, writeSync } from 'node:fs';

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

/** Minimal `--key value` reader. Nothing is positional, and an unknown flag is refused. */
function options(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!/^--(marker|url|timeout-ms)$/.test(flag) || argv[index + 1] === undefined)
      throw new Error(`unusable argument "${flag}"`);
    values.set(flag, argv[index + 1]);
  }
  return values;
}

// Overrides are arguments, not environment variables: runtime/compose.yaml states the probe's
// arguments in the file under review, so nothing ambient can silently point it at a target that is
// trivially healthy. The container passes none of these.
//
// `import.meta.main` needs Node >= 24.2 and the backend image pins node:24.13.0. If some runtime
// ever fails to provide it, fail closed here rather than exiting 0 as though healthy — reporting
// health that was never checked is the exact defect this file exists to remove.
if (typeof import.meta.main !== 'boolean') {
  writeSync(2, 'Backend unhealthy: healthcheck cannot identify its entry point.\n');
  process.exit(1);
}
if (import.meta.main) {
  let healthy = false;
  let reason = '';
  try {
    const given = options(process.argv.slice(2));
    const timeout = Number(given.get('--timeout-ms'));
    ({ healthy, reason } = await checkBackendHealth({
      marker: given.get('--marker') ?? READY_MARKER,
      url: given.get('--url') ?? LIVE_URL,
      timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : PROBE_TIMEOUT_MS,
    }));
  } catch (error) {
    reason = `healthcheck could not run (${error instanceof Error ? error.message : 'unknown'})`;
  }
  // Write synchronously, then exit: `process.exit` can truncate a pending asynchronous write to a
  // pipe, and Docker reads this output through one. The explicit exit also means the verdict never
  // depends on how promptly the runtime drains a pooled keep-alive socket. Measured on Node 24.18
  // that socket does not hold the loop open, but the container runs 24.13 and this costs one line.
  writeSync(healthy ? 1 : 2, `Backend ${healthy ? 'healthy' : 'unhealthy'}: ${reason}.\n`);
  process.exit(healthy ? 0 : 1);
}
