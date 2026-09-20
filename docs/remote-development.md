# Separate development runtime

Status: merged through `d663c15`; main development data migrated to CT114 on 2026-09-16 with
matching record fingerprints and credentials. The identified superseded local processes are
stopped; the original data and protected backup remain available for operator rollback. Heavy
development commands now belong on the dedicated guest. The isolated pilot passed 433 check-suite
tests and all 22 HTTPS browser tests. Main passed explicit restart after reboot with unchanged
data/credentials and the same HTTPS URL. Real Salient provider-session broker verification passed
on 2026-09-16; see the [session checkpoint](build/S03-remote-development.md#salient-provider-access-checkpoint--2026-09-16).
**Human existing-account sign-in remains pending; full V1 acceptance is not claimed.** See the dated
[migration evidence](build/S03-remote-development.md#main-data-cutover--2026-09-16).

## Choosing a test environment

User decision, 2026-09-20: local and remote CT114 are peer test environments. **Use whichever is
free and suitable.** Do not wait in a global remote queue if equivalent verification can run on
an available local environment. This replaces the previous ban on local test workloads, including
necessary dependency installation, builds and isolated test services.

Coordinate capacity and ownership per host/environment; serialize conflicting or heavy workloads
on the same constrained host, rather than blocking all testing across hosts. Reuse compatible
running environments or use explicitly named isolated ones. Check toolchain, resources and target
compatibility before choosing; free capacity alone does not make evidence equivalent. If no
suitable environment is available, record the blocker and continue independent development.

Record the source revision, runner host, application URL/environment, command, elapsed time and
result. A local runner may test the hosted app through its API; its location does not change the
application target. A local test pass does not prove a different deployed build. Keep the shared
playable app and existing data in place; do not restart abandoned pilot stacks or repurpose
protected rollback copies. Browser testing remains prohibited everywhere under the
[existing moratorium](build/README.md#browser-testing-moratorium--2026-09-20).

## Workflow

From an enrolled Salient provider session in the selected worktree:

```sh
presidium-dev up
presidium-dev status
presidium-dev logs backend
presidium-dev run build -- pnpm build
presidium-dev run build -- pnpm exec vitest run --maxWorkers=1
presidium-dev run browser -- pnpm exec playwright test --workers=1 --output=/artifacts/browser --reporter=line
presidium-dev run build -- tar -czf /artifacts/browser.tar.gz -C /artifacts browser
presidium-dev run build -- tar -czf /artifacts/playtest.tar.gz -C /app .playtest
presidium-dev fetch browser.tar.gz --output remote-browser.tar.gz
presidium-dev fetch playtest.tar.gz --output remote-screenshots.tar.gz
presidium-dev fetch generated/api.d.ts --output remote-api.d.ts
presidium-dev stop
```

The commands above are the CT114 adapter, not a requirement to run every test remotely.
Choose the environment under the policy above. No provider-startup hook launches a stack.
Deploy edits to a selected remote environment with another `up`.
The default `main` slot is shared and records its source worktree. Explicitly choose a distinct
`--env` for a concurrently deployed branch; do not replace a peer's slot casually. Every environment
has separate Convex data and dependencies. Follow the infrastructure helper's explicit replacement
flag when intentionally transferring slot ownership. Generated files are retrieved to artifacts and
reviewed before copying into source; never reverse-sync the remote checkout. `fetch` retrieves one
regular file into a new local output path; package an artifact directory remotely first, as above.
Existing browser fixtures also write screenshots into source `.playtest`. Before another `up`,
explicitly package and fetch them as shown above. Source replacement does not retain that source
directory. The configured `/artifacts/browser` test output is already outside source.

`runtime/compose.yaml` defines the app directly. The helper supplies the paths `DEV_SOURCE`,
`DEV_CONFIG` (directory containing optional mode-0600 `runtime.env`), `DEV_ARTIFACTS`, and the stable
`DEV_WEB_URL` HTTPS origin before Compose starts. Only `BETTER_AUTH_SECRET` is accepted from the
selected runtime secret file. It is read inside the backend and passed to Convex via stdin. With
no supplied value, an existing backend secret is retained, or a fresh random one is generated.
Do not transfer `.env.local`, `.convex`, home directories or provider credentials in source archives.
Pinned vendor submodules must be recursively included as source files without `.git` metadata.
The helper also supplies `DEV_SOURCE_METADATA`, mounted read-only as `/runtime-source.json`, with
`submodules: [{path, url, commit, gitlink, dirty}]`. The bounded installer fetches missing objects from only the two
allowlisted public vendor URLs at those exact commits. It fills sparse-omitted files without
overwriting archived edits, requires `dirty: false` and `commit === gitlink` before filling any files, rejects dirty vendor state, and reconstructs fresh vendor Git metadata.
It then commits a clearly labeled **synthetic remote snapshot** of the archive so existing Git-based
content checks and tests can operate. The synthetic commit is not the actual source commit; the
helper state retains that separately. No original `.git`, Git credentials or repository history is
transferred. History-dependent checks apply to the synthetic snapshot, not the original branch history;
run the commit integration gate against the actual local branch separately.

The Node toolchain is `node:24.13.0-bookworm`, pnpm 11.5.3 and lockfile Convex 1.45.0. The anonymous
backend is pinned to `precompiled-2026-09-11-157eb19`, matching the identified main data. Playwright
is `mcr.microsoft.com/playwright:v1.63.0-noble`; the bounded installer copies Node 24 into its tools
volume so browser fixture subprocesses use the same Node toolchain. No Docker image builds run.

Every service has `cpus: 2`, `restart: no`, rotated logs and a PID cap. Backend memory is 3 GiB;
installer, web, build and browser each have 2 GiB. Browser shared memory is 512 MiB, included in its
container budget, with one worker. Vitest is also explicitly limited to one worker. These settings
passed the initial remote check and browser workloads;
they do not reserve memory or prevent the sum of workloads exhausting the guest. Dependencies,
tools, backend cache and backend data are Compose-scoped named volumes.

Only the Vite web port is published, with Docker-assigned host port on `127.0.0.1`. Vite allows the
exact preview hostname, and `web` for internal browser tests, with HTTPS/WSS public HMR URLs. Its
existing `/convex-api` WebSocket and `/api/auth` HTTP proxies connect to internal backend ports
3210/3211. Browser code uses `window.location.origin`, so it never resolves a Docker hostname.
`SALIENT_AUTH_BASE_URL` sets the backend auth origin for this preview; existing local deployments
retain their existing `CONVEX_SITE_URL` behavior. No dashboard is exposed. For backend administration such as `pnpm content:seed`, use the exact
qualified `docker compose -p <recorded-name> ... exec -T backend <command>` within the guest.
Do not use `presidium-dev run backend` for anonymous Convex CLI administration: that creates
a second container whose localhost is different but whose SQLite volume is shared, and the CLI
can attempt to start another backend. Build/browser one-off services do not mount backend data.
Browser tests use the actual preview HTTPS URL and require working tailnet DNS/routing from the
browser container. Read-only rules tests can override `SALIENT_TEST_URL=http://web:5180`, but
authenticated app operations require secure browser APIs that plain HTTP on a Docker hostname
does not provide. Do not disable browser certificate or secure-context checks to hide that failure.

### Provision an additional environment

Every new environment needs the pinned backend executable and checksum before its first `up`.
After main has been validated, an enrolled Salient agent can copy only those two nonsecret files
through the existing broker grant. Main's patched binary and checksum are provisioned, and its
backend/data/HTTPS recovery after reboot is verified. Substitute a valid explicit
environment slug for `feature-name`; do not copy `runtime.env`, backend data or unrelated config.

```sh
presidium-ssh dev-runtime 'set -eu
target=/srv/dev/salient/feature-name/config
install -d -m 0700 "$target"
install -m 0755 /srv/dev/salient/main/config/convex-local-backend "$target/convex-local-backend"
install -m 0600 /srv/dev/salient/main/config/convex-local-backend.sha256 "$target/convex-local-backend.sha256"'
presidium-dev --env feature-name up
```

These directories/files are owned by the connected `dev` account. No additional grant or operator
credential is required. The helper verifies the executable checksum, provisions distinct routes
and volumes, and the fresh backend generates its own instance/authentication secrets. Seed content
only through that environment's exact backend container if needed; no main database is shared or
copied. This account already has shared Docker control, as documented below.

## Backend instance secret compatibility patch

The unchanged Convex 1.45.0 anonymous development CLI supplies `--instance-secret` when starting
its Rust binary, and its key generator does the same. The pinned backend's `LocalConfig::secret()`
requires that argument; it has no environment/file fallback. Thus this preserved development model
**would violate V1's no-credential-values-in-command-arguments criterion without the patch**.
Passing application env values by stdin does not fix the upstream instance-secret exposure.
The compatibility build below has disposable keygen/startup evidence and a running Salient
validation run whose actual process arguments contained no instance secret. Main data migration
completed with matching record/credential fingerprints; final acceptance gates are listed above.

Evidence: installed `node_modules/convex/src/cli/lib/localDeployment/run.ts` and `secrets.ts`, and
[the pinned upstream configuration](https://github.com/get-convex/convex-backend/blob/157eb19/crates/local_backend/src/config.rs).
The adapter now fails closed until a patched backend and its recorded SHA-256 are provisioned as
`config/convex-local-backend` and `config/convex-local-backend.sha256`. It checks for environment
secret support before starting any backend. `runtime/convex-instance-secret-env.patch` adds hidden
`CONVEX_INSTANCE_SECRET` environment support to startup and keygen. The hash-guarded
`runtime/patch-convex-cli.mjs` patches only the exact installed 1.45.0 bundle: startup and keygen
pass secrets through the child environment; command debug strings contain no secret argument;
keygen uses the same patched pinned backend. An unexpected CLI update or altered patch fails closed.
The original dependency bundle is retained inside the remote dependency volume for reproducibility,
not in Git. No installed dependency in the live local checkout was modified.

`runtime/build-patched-backend.sh PATCH OUTPUT` is a **build recipe with a compiled and disposable-probed binary**, requiring
`SALIENT_BOUNDED_BUILDER=1` inside a disposable remote builder with explicit Docker ceilings
(initial proposal: 6 GiB memory, 2 CPUs, PID limit 512, `--restart=no`). Provide a compiler toolchain,
Clang/LLVM, CMake, pkg-config, OpenSSL headers, Git, curl and Rustup, and adequate bounded disk.
Use `bash -c` for the official Rust container, not a login shell: `bash -lc` resets its Cargo/Rustup
PATH. Re-running the recipe reuses the exact already-applied patch and persistent Cargo outputs.
The recipe now bootstraps checksum-verified Node 24.13.0 (x64 or arm64), npm 11.11.0 in a separate
`/build/js-toolchain` prefix, then `npm ci --prefix scripts` from the pinned upstream lockfile and
verifies pnpm 11.15.1 and Turbo 2.10.5. These upstream build tools differ from Salient’s application
pnpm pin. `--setup-only` as a third argument verifies that setup without starting Rustup/Cargo.
The first bounded native build reached `isolate/build.rs` but failed because the earlier recipe
omitted `scripts/node_modules/.bin/pnpm`; the corrected recipe subsequently completed the release compilation in 7m26s. The post-build
keygen probe initially exposed a Clap argument dependency: an environment secret activates the
top-level instance-name requirement even for keygen. Both CLI and build probes now supply the
nonsecret name before `keygen` and again after `admin-key`; no secret appears in argv. The exact
earlier CLI patch upgrades only with a verified original backup and known previous patch hash.
It fetches exact upstream commit `157eb19fd30d085cdb5ec785fdb3574f84cabfda`, applies the two-field
patch and uses nightly-2026-06-28 with two Cargo jobs. Upstream workspace dependencies include native
V8 bindings. The release build completed inside 6 GiB/2 CPU limits; peak RAM and a complete
dependency/disk accounting remain **unmeasured**. If a future bounded build fails,
retain the logs and report the actual cause before adjusting resources. No backend fork is published.
[The pinned build procedure](https://github.com/get-convex/convex-backend/blob/157eb19/BUILD.md)
provides upstream context. Before migration, independently inspect a disposable patched backend's
process arguments and keygen invocation, exercise startup/read/write/restart, and record the binary
hash and build evidence. The code/recipe does not constitute that live acceptance.

## Data migration and rollback

The inspected shared playable target on 2026-09-16 was main checkout
`/srv/presidium/projects/salient/code`, deployment `anonymous-agent`, frontend 5180, backend
3212/site3213, state `.convex/local/default`, backend version above. UI's separate backend 3210
and other worktree states are not this data. Re-inventory exact PIDs, executable versions and cwd
immediately before cutover; old PID values are not kill targets. Runtime config contains secrets:
print only deploymentName, backendVersion and ports when recording evidence.

1. Validate the new host and empty fixture environment first. Build and verify the environment-secret compatibility patch.
   Confirm every published host binding and Docker CPU/memory/PID limits. Check generated preview
   HTTPS from an authorized client, including sign-in and live WebSocket updates.
2. Coordinate a short shared-app downtime. Stop only main's identified Convex watcher and its
   identified backend child, and its frontend. Check both ports closed and no process has the
   selected SQLite database open. Do not copy a live SQLite file or kill by process name.
3. Make a protected stopped backup of the **entire** `.convex/local/default/` directory, including
   config, SQLite/WAL sidecars and `convex_local_storage/`. Retain the original untouched. Record
   file checksums in an operator-only location outside Git. Stream this selected backup over the
   authorized administrative SSH connection into a protected remote staging directory, not the
   ordinary source archive or a shell argument. This transfers backend development secrets too.
4. With the destination environment stopped and its `local/default` destination absent or empty,
   restore into only its Compose `backend-data` volume
   at `local/default/`. Determine the qualified volume name from Compose labels/inspection, not
   a guessed string. Verify transferred bytes/checksums and ownership before startup. Do not
   modify global volumes. If destination data already exists, preserve/quarantine it through a
   separately recorded replacement before restoring; never overlay a prior database or storage.
   The startup pins the same backend version and requests 3210/3211
   within its private container; those ports need not match the previous host ports.
5. Start the remote environment with migrated state. Read back a known sentinel development
   record through the app, check existing accounts/campaigns, sign-in, CRUD, WebSocket updates,
   then stop/recreate and read the sentinel again. Source replacement must preserve the volume.
   Compare schema compatibility before any upgrade; never reset the copied data to hide a failure.
6. Keep the local stopped backup and source. Record remote backend identity and URL, process
   inventory and actual test results. Only then publish the default remote workflow to peers and
   remove the old main startup hook, if an actual hook exists. Recheck Presidium for replacement
   local services. Never silently keep duplicate stacks running indefinitely.

If startup or data verification fails, stop the remote environment, retain its logs/data, and
restart the exact original local checkout/runtime without overwriting the preserved original
state. No production deployment or cloud import is involved. A supported CLI export/import can
be rehearsed separately; do not assume it includes environment secrets and all component/file
state without verifying that for this version.

`stop` retains data, source and stable route identity. Ordinary `remove` must retain data; only an
explicit environment-scoped data purge may delete it. Never use global prune, global Serve reset,
or unqualified `down -v`. Inspect interrupted jobs using Compose labels; remove only the recorded
one-off container if SSH was interrupted. A task timeout/connection loss alone does not prove
cleanup. Bring environments back explicitly after guest reboot; all services intentionally avoid
automatic restart. The infrastructure runbook owns guest-console recovery.

All enrolled projects share a Docker daemon. An agent with Docker access can control every guest
container and recover secrets. Names, labels, helper checks and the shared Unix account do not
provide hostile tenant isolation; the hard LXC ceiling protects Presidium's allocation.

### Operator stopped-data transfer details

Re-inventory and stop the selected main launchers, native backend and transient recovery frontend
before these commands. Confirm the database has no open file descriptors and its backend ports are
closed. The examples are operator actions, not agent startup hooks; backups remain outside Git.

```sh
# On Presidium, only after the selected main backend is stopped:
set -eu
umask 077
install -d -m 0700 /srv/presidium/runtime-backups
backup_dir=/srv/presidium/runtime-backups/salient-main-$(date -u +%Y%m%d-%H%M%S)
mkdir -m 0700 "$backup_dir" # Refuse an existing backup location.
tar --numeric-owner -C /srv/presidium/projects/salient/code/.convex/local \
  -cpf "$backup_dir/default.tar" default
chmod 0600 "$backup_dir/default.tar"
sha256sum "$backup_dir/default.tar" > "$backup_dir/default.tar.sha256"
stat -c '%s' "$backup_dir/default.tar" > "$backup_dir/default.tar.bytes"
```

Stream that archive through the administrative broker's stdin into a mode-0600 guest staging file.
Compare its SHA-256 and byte count with the local files **before extraction**. Discover the exact
main `backend-data` volume from its Compose labels/inspection, with main stopped. Require
`local/default` to be absent or empty; if it already holds data, preserve/quarantine that data in a
separately recorded replacement first. Never overlay SQLite sidecars or storage files from another
instance. Mount that one volume at `/data` in a bounded disposable tool container, create
`/data/local`, and extract with
`tar --no-same-owner -C /data/local -xpf /staging/default.tar`. The resulting path must be
`/data/local/default/config.json`; the named volume itself becomes `/app/.convex` in backend.
Verify the full stopped-data file manifest/checksums in protected storage, including SQLite and
storage contents, then remove only the staging copy after retaining the original backup.

The installed Convex 1.45.0 source confirms the port transition: `anonymous.ts` reads existing
admin/instance credentials; `utils.ts` prioritizes the requested ports over saved suggestions;
`upgrade.ts` takes the no-upgrade branch at the unchanged version, saves the new ports and reuses
nonlegacy credentials; `filePaths.ts` preserves the deployment name when writing config. The
inspected main has both credentials and does not use the legacy shared constant. Startup should
therefore change saved ports 3212/3213 to container ports 3210/3211 without replacing identity or
credentials. Verify this on the migrated copy using comparisons that print only pass/fail, never
credential values. Do not create a fresh `runtime.env` auth override for migrated main.

### Operator rollback

If remote main fails validation, stop it and retain its logs/data:

```sh
presidium-dev --env main logs backend
presidium-dev --env main stop
```

From the original preserved checkout, restore the prior local development launchers in the same
operator-managed persistent sessions used before migration, one command per session:

```sh
cd /srv/presidium/projects/salient/code
CONVEX_AGENT_MODE=anonymous pnpm dev:backend
# Separate persistent session, same cwd:
pnpm dev
```

Do not extract the remote database over the original local state. Do not run reset, seed or
initialization commands for rollback. If rollback needs the former loopback recovery frontend,
restart its still-existing transient unit with `sudo systemctl start salient-dev-recovery.service`;
a transient unit may need its exact previously recorded definition recreated after a guest reboot.
Restore only the previously recorded local preview mapping if it was changed. Verify the original
backend ports and existing account/data readback before returning users to the local URL. Record
the rollback so agents do not restart the incomplete remote main alongside it.
