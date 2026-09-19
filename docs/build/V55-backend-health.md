# V55: backend health must reflect a live backend

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Development infrastructure (Opus thread `88b6a7e6-2590-4c52-bdef-efe85bf82e74`) |
| Rules review | Not required; no rules content |
| Depends on | Nothing. Branched from `main` `cf7c24a` |
| Unblocks | Trustworthy character verification runs; a suite can no longer pass or fail against an absent backend while Docker reports `healthy` |
| Status | Authored and statically verified; **runtime verification pending, owned by root** |

## The failure this fixes

Reported by the integration lead on 2026-09-19 (Chords 518) during the full browser run on
`0987595`, **not observed by this thread**:

- the backend container reported `State.OOMKilled=true`, cgroup `memory.events` `oom 2` /
  `oom_kill 1`, against `memory.max` 3 GiB;
- no Rust backend process remained, and `localhost:3210` refused connections;
- Docker health nevertheless stayed `healthy`, and the browser suite kept running against it;
- backend logs stop around 22:29:23, matching the fetch and registration failures the tests saw.

That run is recorded as FAILED/ABORTED. This slice does not re-run it and does not claim it would
have passed.

## Why the old check could not catch it

`runtime/compose.yaml` tested one thing:

```yaml
test: [CMD, node, -e, "require('fs').accessSync('/tmp/backend-ready')"]
```

`/tmp/backend-ready` is cleared by `runtime/backend.mjs:9` when that process starts, and written
once at `backend.mjs:144` after the initial push and the auth setup succeed. Nothing touches it
again for the life of the container. It is an accurate startup receipt and never a liveness
signal.

The container runs three nested processes:

| Process | Started by | Dies how |
| --- | --- | --- |
| `node runtime/backend.mjs` | Compose `command` | container's main process |
| `convex dev` (node) | `backend.mjs:73` `spawn` | `backend.mjs:81` exits the container on its exit |
| `convex-local-backend` (Rust) | the CLI | **nothing propagates its death** |

Only the third serves queries. `backend.mjs` watches its direct child, so it never learns that its
grandchild is gone. The marker survives, the container stays up, and health stays green. Clearing
the marker on the backend's death would have been the other possible fix, and it is not available:
no process in the container is notified, which is why the check has to ask the endpoint itself.

## The change

**`runtime/healthcheck.mjs`** — the marker still gates, and once it exists the endpoint is probed.

1. `/tmp/backend-ready` absent → unhealthy, `startup has not completed`, and **the endpoint is not
   probed**. This ordering is load-bearing: the endpoint answers well before the initial push and
   auth setup finish, so probing alone would report healthy too early and re-open a different hole.
2. Marker present → `GET http://127.0.0.1:3210/instance_name`, bounded by
   `AbortSignal.timeout(2000)` — under Compose's 3 s healthcheck timeout, so an unresponsive backend
   yields a real verdict with a reason instead of being killed mid-probe.
3. Healthy requires `response.ok` **and a non-empty body**. Response headers can outlive the process
   that still owes the body, so the body is read under the same signal. The body is never logged.

`/instance_name` is served by the Rust backend itself
(`crates/local_backend/src/router.rs:548-549` at pinned `157eb19f`), needs no authentication, and is
the same endpoint `backend.mjs:103` already waits on during startup — so "healthy" means exactly
what startup meant by "the backend answers".

**`runtime/compose.yaml`** — the probe plus a restructured gate:

```yaml
test: [CMD, node, /app/runtime/healthcheck.mjs]
interval: 5s
timeout: 3s
retries: 5
start_period: 300s
```

- Absolute path, because the probe runs as its own exec rather than inheriting the service command's
  relative resolution against `working_dir`.
- `start_period: 300s` covers `backend.mjs`'s own bounded startup — 120 s endpoint wait
  (`backend.mjs:100`) then 180 s push wait (`backend.mjs:130`). Failures inside it leave the
  container `starting`, which is what the former `retries: 60` achieved, so `web`'s
  `service_healthy` gate is unchanged.
- `retries: 5` after that: roughly 25 s of a backend that cannot name itself before `unhealthy`.
  The former 60 retries would have taken five minutes to admit a dead backend.

## What this deliberately does not do

- **No restart, no supervision loop.** `restart: 'no'` is unchanged and nothing re-launches the
  backend. Sustained supervision was considered and is not proposed here: the container has no
  process able to observe the Rust process's death (that is the defect), so supervision would mean
  a new watchdog process inside the backend container — more memory in the cgroup that just OOMed,
  and a restart loop that could mask the OOM instead of surfacing it. If the lead wants it, it
  should be argued on its own evidence, after the OOM cause is understood.
- **No memory or timeout raised.** `mem_limit: 3g`, `NODE_OPTIONS`, the Convex limits and the
  startup waits are untouched. This slice makes the failure visible; it does not make it less likely.
- **No change to startup gating or cloud-target defenses.** `runtime/backend.mjs` is not modified:
  the checksum check, the `--help` environment-secret check, the forbidden-variable list, the
  HTTPS `DEV_WEB_URL` check, the anonymous-deployment check and the push gate are all as they were.
- **No diagnosis of the OOM.** Why the backend reached 3 GiB is out of scope and unanswered here.

## Tests

`tests/scripts/backend-healthcheck.test.ts`, seven cases, in the existing `scripts` vitest project,
so it runs under `pnpm check:app`. Each case runs `runtime/healthcheck.mjs` **as a child process
against a real local HTTP server**, reading only its exit code — the contract Docker consumes.

| Case | Expectation |
| --- | --- |
| ready marker + live backend | exit 0 |
| stale marker + dead backend (listener closed) | exit 1, reason mentions `stale` — the observed OOM shape |
| startup not finished (no marker) | exit 1, and the server records **zero** requests |
| marker + connection accepted but never answered | exit 1 inside the bound, not a hang |
| marker + headers flushed, body never sent | exit 1 inside the bound, reason `truncated` — the one case that exercises the abort signal covering the body read |
| marker + 200 with an empty body that completes | exit 1 |
| marker + 503 | exit 1 |

The harness rejects rather than reports a code when the child dies by signal, fails to spawn, or
trips its own 15 s outer timeout: none of those is a health verdict, and mapping them to exit 0
would let a broken run read as healthy.

## Verification — not yet run, exact commands for root

**Nothing in this slice has been executed against CT114.** This thread ran no `presidium-dev`
command, started no environment and touched no container.

What *was* run, locally and disclosed exactly: `node --check` on the script, and two throwaway
harnesses outside the repository. The first exercised the exported `checkBackendHealth` with an
injected `fetch` — no socket at all. The second ran `runtime/healthcheck.mjs` as a child process,
exactly as Compose invokes it, against ephemeral `127.0.0.1:0` stub listeners: all seven cases in
the table above passed, in 21–325 ms each. That also settles the slice's riskiest claim — the
headers-flushed-body-stalls case returned `response truncated (TimeoutError)` at 325 ms, so one
`AbortSignal.timeout` does bound the body read and not only the headers, and the probe cannot hang
past Compose's 3 s timeout. It confirms the main-module guard fires when the file is run by absolute
path, and that no request reaches the server when the marker is absent.

Those harnesses are not the project's runner. **Still unverified:** `vitest` actually collecting
`tests/scripts/backend-healthcheck.test.ts`, `eslint`, `prettier`, `tsc`, and every claim about
Compose and Docker behaviour — the healthcheck exec's working directory and PATH, `start_period`
semantics, the `web` gate, and the real OOM shape. Those need the commands below.

Replace `ENV` with the environment root chooses.

**1. Unit tests.**

```sh
presidium-dev --env ENV run build -- pnpm exec vitest run --project scripts --maxWorkers=1 tests/scripts/backend-healthcheck.test.ts
presidium-dev --env ENV run build -- pnpm exec eslint runtime/healthcheck.mjs tests/scripts/backend-healthcheck.test.ts
presidium-dev --env ENV run build -- pnpm exec prettier --check runtime/healthcheck.mjs tests/scripts/backend-healthcheck.test.ts runtime/compose.yaml
```

**2. Cold start still reaches healthy, and `web` still gates on it.**

```sh
presidium-dev --env ENV up
presidium-ssh dev-runtime 'docker ps --filter label=dev.presidium.project=salient \
  --filter label=dev.presidium.environment=ENV \
  --format "{{.Names}}\t{{.Status}}"'
```

Expected: the backend container reaches `(healthy)` and the web container is running. A backend
stuck at `(health: starting)` past 300 s is a regression in the marker gate.

**3. The regression itself — a live backend whose Rust process dies must go unhealthy.**

Preserve any evidence in the environment first; this ends the backend process deliberately. Prefer a
disposable environment. Root owns the choice of target and the recovery.

First identify the process and confirm it is the one meant, rather than matching a pattern:

```sh
presidium-ssh dev-runtime 'set -eu
backend=$(docker ps -q --filter label=dev.presidium.project=salient \
  --filter label=dev.presidium.environment=ENV --filter name=backend)
docker exec "$backend" sh -c "ls -l /tmp/backend-ready"
docker exec "$backend" sh -c "ps -eo pid,ppid,rss,args" '
```

Expect exactly one `convex-local-backend` process, running from the cache path
`/root/.cache/convex/binaries/precompiled-2026-09-11-157eb19/convex-local-backend`
(`backend.mjs:29-31`). Record that PID and its full argument line. If there is more than one match,
or the path is not that one, stop and investigate instead of terminating anything.

Then terminate that exact PID — substitute the recorded number, and do not reuse a name pattern:

```sh
presidium-ssh dev-runtime 'set -eu
backend=$(docker ps -q --filter label=dev.presidium.project=salient \
  --filter label=dev.presidium.environment=ENV --filter name=backend)
docker exec "$backend" kill -9 RECORDED_PID
sleep 40
docker exec "$backend" sh -c "ls -l /tmp/backend-ready"
docker inspect --format "{{.State.Health.Status}}" "$backend"
docker inspect --format "{{range .State.Health.Log}}{{.ExitCode}} {{.Output}}{{end}}" "$backend"'
```

Expected, and all three parts matter: `/tmp/backend-ready` is **still present** (the marker is stale,
which is the whole point), health is `unhealthy`, and the last log entries show exit code 1 with a
`ready marker is stale` reason. Under the old check this state reported `healthy`.

Recover the same environment afterwards with `presidium-dev --env ENV up`.

**4. Record.** Exit codes and the `docker inspect` output belong in `/artifacts` under a unique path,
per the orchestration lessons merged in `cf7c24a`.

## What this does not fix

- **Nothing consults the health status.** The browser job does not assert the backend is healthy
  before it starts or after it finishes, so a mid-run death still produces a pile of confusing test
  failures — now with a correct container status beside them. Recommended follow-up, not done here:
  have the job driver check health before starting and fail loudly if it flips during the run.
- **The OOM cause is untouched.** Root's report notes several CLI log processes sharing the backend
  cgroup, including a logger, and that duplicate diagnostic capture may contribute. That needs its
  own bounded investigation; this slice makes the symptom visible rather than rarer.
- **Health is per-container.** A backend that answers `/instance_name` while queries time out is
  healthy by this definition. That is the V46 blocker's territory, not this one's.

## Work log

2026-09-19: claimed V55 on `slice/V55` in `/srv/presidium/projects/salient/opus-health`, branched
from `main` `cf7c24a`. Wrote `runtime/healthcheck.mjs`, the Compose healthcheck change and six tests.
Read the pinned backend router to confirm `/instance_name` is served by the Rust process and returns
the instance name as its body, so its absence is exactly the condition to detect. Confirmed from
`runtime/backend.mjs` that the marker is cleared at that process's start and written once at the end
of startup, and that the process that dies is a grandchild no surviving process observes. Nothing
installed, built, deployed or run; no CT114 environment touched.

2026-09-19, after the integration lead's early static read (Chords 533, 535), four corrections before
any commit:

- **The test harness could read a failed run as healthy.** `execFile`'s error carries a numeric
  `code` only for an ordinary non-zero exit; a spawn failure carries a string (`ENOENT`) and a signal
  kill carries `null` with `signal` set. The original helper mapped both to `code: 0`. It now rejects
  on either, and carries its own 15 s outer timeout so a hung script fails the test rather than the
  suite.
- **The headers-without-body test did not test what it claimed.** It called `response.end('')`, which
  completes the response, so it exercised the empty-body branch and never the body read. Split in
  two: that case is kept as "an empty body that completes", and a new case flushes the headers and
  never sends a body, under a 300 ms probe timeout — which is the case that actually depends on one
  abort signal covering headers and body together.
- **"Never removed" was too absolute.** `backend.mjs:9` clears the marker when that process starts.
  The accurate statement, in the script comment and above, is that nothing touches it again for the
  life of the container.
- **The verification recipe used a `pkill` pattern.** Replaced with: list processes, confirm exactly
  one `convex-local-backend` running from the expected cache path, record the PID, then terminate
  that PID. Root targets a validated process rather than a name match, and recovers the same
  environment.

All four corrections were then exercised end to end locally; see Verification.
