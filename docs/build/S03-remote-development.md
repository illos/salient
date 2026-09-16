# S03 — Salient remote development adapter

Status: isolated validation pilot passed remote checks and HTTPS browser journey; not merged or cut over.
Owner: Voltar infrastructure thread.
Rules review: not required (deployment configuration; no game rules change).

## Scope and acceptance

Implement the Salient adapter to the operator's separate-development-runtime V1 specification.
The canonical infrastructure copy lives at `/srv/presidium/projects/hermes/code/docs/dev-runtime/spec.md`;
its helpers live in the Hermes/Voltar repository. This slice owns application Compose configuration,
remote CLI startup, bounded browser/build workers, and exact preview origins. No cloud deployment,
production change, data reset or local-process cutover is part of this branch handoff.

Acceptance requires remote dependency install/build/backend/browser operation, same-origin HTTPS
HTTP and WebSocket traffic, data persistence across source replacement, scoped volumes, verified
resource limits and no application credentials in arguments or source transfer. Independent review
and the full remote `pnpm check` remain required before integration. A configuration diff is not
runtime proof. The [runbook](../remote-development.md) records the current blocker and migration.

## Work log

Entries below are chronological checkpoints. Earlier pending-status statements are superseded by
the later recorded native build and isolated validation results; main cutover remains pending.

2026-09-16: created `/srv/presidium/projects/salient/dev-runtime`, branch
`slice/S03-dev-runtime`, from integrated main `f7137dc`. Existing shared main and peer worktrees
remain untouched. Chords list succeeds, but this Hermes session cannot map a sender to Salient;
whoami/check_updates report no unique caller. No IDs were fabricated. Main's backend identity is
`anonymous-agent`, backend `precompiled-2026-09-11-157eb19`, ports 3212/3213, with approximately
162 MiB under `.convex/local/default`. Main frontend is 5180. None of those processes were stopped.

Plan: implement under `.presidium/`, `runtime/`, preview-specific Vite configuration, optional
backend auth origin; preserve anonymous Convex and prepare stopped-data transfer procedure. The
source selector must include pinned vendor submodule files. All heavy checks run on the remote
host. Infrastructure setup, broker enrollment and Tailscale provisioning belong to the parent task.

Review round 1 found three concrete issues: Git-dependent source generation with an archive,
readiness before the first successful backend push, and missing `.mjs` lint globals. They are
addressed by fresh remote-only Git reconstruction with exact public vendor pins, a successful
Convex initial-push marker, and the existing lint rule expanded to `.mjs`. Original source identity
remains separate from the explicitly synthetic remote snapshot. No original Git metadata is copied.

A pinned compatibility patch now removes Convex instance-secret argv use in startup and keygen.
Backend startup fails closed until the environment-secret-capable binary and matching SHA-256 are
provisioned. The two-field Rust patch and bounded remote build recipe are included; compilation and
live verification remain outstanding. Two focused CLI patch tests passed (unknown bundle rejection,
secret-argument removal, idempotence and tamper rejection). Focused ESLint returned zero errors;
Node syntax, shell syntax and Git whitespace checks passed. No local heavy build, dependency install,
backend, browser or data migration was run. Full remote checks, runtime acceptance and integration
remain pending; these local checks do not establish deployment success.

Review round 2 found the commit-checker test borrowing fixed historical commits absent from a
synthetic snapshot. The test now creates its own disposable legacy/adoption graph and changes the
boundary only in its copied checker; the production boundary is unchanged. Its 14 focused tests
passed in 499 ms using existing local dependencies through a temporary symlink, removed afterward.
No dependencies were installed or changed. The adapter additionally requires metadata `dirty: false`
and `commit === gitlink` before hydrating vendor files, so an intentional deletion cannot be
mistaken for a sparse omission. Explicit project/environment labels use helper-supplied values.
The pinned Rust source patch passed `git apply --check` against the exact upstream source file.

Final independent code review (`salient_adapter/review`, 2026-09-16) passed the bounded adapter
implementation with no remaining blocking code findings. This is explicitly not full S03 acceptance:
remote compilation, full checks, HTTPS, resource enforcement and migration are still pending. The
reviewer reproduced and verified the bare-cache fix in a disposable Git fixture; the installer now
publishes a pinned cache ref before clone. Git safe-directory exceptions cover only the three known
container paths. A `.gitattributes` rule treats unified patch files as patch data for whitespace checks;
context-only blank lines in the Rust patch are intentional. Staged whitespace checks now pass with
that scoped rule. YAML merge parsing confirmed every service inherits tuple labels and bounds.

### Native backend builder tooling correction — 2026-09-16

The first CT114 native build reached `isolate/build.rs` and failed with missing
`/build/convex-backend/scripts/node_modules/.bin/pnpm` (exit 101). The recipe now installs
checksum-pinned Node 24.13.0, isolated npm 11.11.0, and the pinned repository's locked tooling
(pnpm 11.15.1, Turbo 2.10.5) before Cargo. Exact existing source commits skip redundant fetching;
the existing compatibility patch and Cargo outputs are reused. No Salient application packages,
backend data or running development processes were changed.

Independent narrow review `salient_adapter/review` passed the tooling recipe. On CT114, two
bounded setup-only invocations exited 0, including the cached retry. Both printed:
`Builder tools: Node v24.13.0; npm 11.11.0; pnpm 11.15.1; turbo 2.10.5` and
`JavaScript tooling setup verified; Cargo was not started.`

The actual administrative command, invoked through `presidium-ssh voltar` from the Hermes workspace:

```sh
sudo -n pct exec 114 -- docker run --rm --name salient-builder-tools-check --init \
  --memory=2g --memory-swap=2g --cpus=2 --pids-limit=256 --network=bridge \
  -e SALIENT_BOUNDED_BUILDER=1 \
  -v /root/dev-runtime-build/work:/build \
  -v /root/dev-runtime-build/output:/output \
  -v /root/dev-runtime-build/recipe:/recipe:ro \
  rust:1.94.0-bookworm bash -c \
  'bash /recipe/build-patched-backend.sh /recipe/convex-instance-secret-env.patch /output --setup-only'
```

Both disposable containers were removed after completion. The main infrastructure agent owns
resuming the existing stopped 6 GiB/2 CPU native builder. This verifies tooling preparation only;
a complete Rust build and patched backend live acceptance remain pending.

### Native binary and keygen follow-up — 2026-09-16

The resumed native release compilation completed in 7m26s. The recipe's following keygen probe
failed because the environment secret activates Clap's top-level `instance_name` requirement,
not because the binary lacks keygen. `--help` on the actual output confirms the subcommand and
hidden-value environment secret support. The corrected recipe and CLI keygen patch provide the
nonsecret instance name at both parser levels. Backend startup already did so; no change to
`runtime/backend.mjs` was needed. A previously installed exact compatibility patch can upgrade
only when both its known SHA and the verified pristine backup match; other modifications fail.

Independent narrow review passed. Three focused patch tests passed, including executing the
patched keygen function in a fixture that checks the actual child arguments and environment.
On CT114, a disposable 512 MiB/1 CPU/no-network container successfully generated a key with only
`CONVEX_INSTANCE_SECRET` in its environment; key stdout was redirected and deleted, never logged.
A separate disposable backend returned the expected `/instance_name`, and `docker top -eo pid,args`
confirmed no `--instance-secret` argument. Both containers were removed, with no application data
mounted. An initial inspection attempt omitted Docker's required PID output column; the corrected
inspection passed on a fresh disposable container. The corrected build recipe is uploaded to the
existing CT114 recipe directory. Full Salient deployment and migration acceptance remain pending.

### Isolated remote validation — 2026-09-16

Target: fresh local-anonymous backend in CT114, environment `salient/validation`, namespace
`salient-validation-dev-003e0e37bf61`, source checkout `/srv/presidium/projects/salient/dev-runtime`
at `f7137dc352e4f3724d4e6624cf34b36aa537f962` plus staged dirty adapter changes. Main's local
processes, credentials and database were not copied, stopped or changed. The selected patched
binary and SHA file were installed administratively; a fresh development auth secret was generated
in the guest's mode-0600 runtime configuration. The archive excluded original Git data, local
runtime/database state and secrets. Source metadata separately records the actual commit and
worktree; reconstructed Git history is explicitly synthetic.

The administrative test harness used the generic `source.archive` and request schema, streamed
through `presidium-ssh voltar` from Hermes to `sudo -n pct exec 114 -- runuser -u dev --
/usr/local/bin/presidium-dev-remote`. This tests the runtime transport and helper, **not Salient's
brokered provider authorization**. A real Salient provider-session check remains separate.

Observed results:

- Dependency install: 611 locked packages using Node 24.13.0 and pnpm 11.5.3, entirely in the
  bounded guest task. Remote Git reconstruction and ingestion produced 2,614 rules entries.
- `run build -- pnpm check`: exit 0; lint/format/types, 97 engine and 336 app/script tests,
  181 Markdown link checks, both vendor pins, 467 content entries, foe provenance and Vite build
  passed. Build transformed 2,522 modules in 2.47s; only the existing chunk-size warning remained.
- `run browser -- env SALIENT_TEST_URL=https://salient-validation-dev-617edaa85b3b.tail41404c.ts.net
  pnpm exec playwright test tests/browser/rules.spec.ts tests/browser/journey.spec.ts --workers=1
  --output=/artifacts/browser-https --reporter=line`: exit 0, three tests passed in 47.1s. This
  covers real HTTPS sign-in, multiple users, invitations, session state, authenticated headless
  commands, private draft persistence, live updates and offline/reconnect, plus rules browsing.
  No certificate bypass was used. The container resolved the Service VIP and verified HTTPS
  independently; no per-container Tailscale node or added DNS setting was required on this host.
- Internal HTTP rules tests passed twice. The signed-in journey failed at `crypto.randomUUID`
  because a Docker HTTP hostname is not a secure context. An attempted narrow Chromium origin
  exception did not fix it and was removed. Browser defaults now use the actual HTTPS preview.
- The content sentinel loaded into the fresh database retains the identical record ID, creation
  time, seed time, 467-entry count and content hash after repeated `up` source replacement.
  No old local database was migrated. This demonstrates validation-volume persistence only.
- Actual Docker inspection: backend 3 GiB/2 CPUs/512 PIDs; web 2 GiB/2 CPUs/256 PIDs. Only web's
  port 5180 is published, specifically to `127.0.0.1` with Docker-assigned host ports. During
  checks the task used 1.34 GiB of its 2 GiB limit, backend about 569 MiB and web about 507 MiB.
  These samples are not peak-memory measurements. Actual backend process arguments contained
  no `--instance-secret`; anonymous identity and version matched the pin.
- API authorization initially failed independently of successful application startup. Once the
  operator corrected the preview credential, automatic Service creation/approval/Serve produced
  the stable HTTPS URL above. Earlier failures returned nonzero without destroying application
  state. The infrastructure report owns exact policy and credential-scope evidence.

Runtime corrections found during validation: pnpm's store is explicitly under `/tools`, not the
source tree; ignored cache debris cannot enter the synthetic snapshot. Compendium's recorded
public tag is fetched and verified against its exact pinned commit, preserving content provenance
checks. All fixes received independent review. Node and Playwright images are pinned by the actual
pulled image digests in Compose; Vitest and Playwright each default to one worker.

This is not full cutover acceptance. Salient provider authorization, the intended main-data migration,
main startup-hook changes, reboot/recovery and user-device testing still need their recorded
infrastructure/migration steps. Keep the local playable environment until that coordinated cutover.
To resume this worktree's isolated slot from an enrolled provider: `presidium-dev --env validation up`.

### Fresh integration and cutover inventory — 2026-09-16

The adapter was committed and rebased without conflicts onto clean main
`bf191656bf4bc589f7eac1076f5a435cc52af111`, producing branch commit
`7946b15ed88832f9ab36636c2868e6efa5afff91`. Independent integration code review passed; V31's
new application changes remain untouched. Main was not modified. The merge-format gate passed
`node scripts/check-commit.ts --merge --range main..HEAD`. Fresh remote checks on this exact
combined commit are recorded below when complete.

Read-only inventory at this checkpoint (PIDs are observations, not future kill instructions):

| Role | PID / ancestry | Local target |
| --- | --- | --- |
| Backend launcher | pnpm 5017 → shell 5209 → Convex CLI 5211 | Main checkout; CLI 1.45.0 |
| Active native backend | 549847, adopted by PID 1 | Main, cloud 3212/site 3213 |
| Frontend launcher | pnpm 5018 → shell 5196 → Vite 5969 | Main, 0.0.0.0:5180 |
| Recovery frontend | Vite 2193, `salient-dev-recovery.service` | Main, 127.0.0.1:5181 |

The main environment selects `anonymous:anonymous-agent`, backend
`precompiled-2026-09-11-157eb19`. Its `.convex/local/default/convex_local_backend.sqlite3` was
114,278,400 bytes at inspection; the same directory contains `config.json`, `dashboard.json`
and `convex_local_storage/`. No live database bytes were copied. Only public configuration keys
and process identity/ports were inspected; no secret arguments or environment values were printed.
Other worktree configuration directories exist and are not the established main data.

Normal main launchers are descendants of `presidium-t3.service`; never stop that shared service
for this migration. The recovery service is transient under `/run/systemd/transient`, with
`Restart=no`. No persistent Salient unit was found in the inspected system/user unit directories.
The tracked README still directs agents to `pnpm dev:backend`, `pnpm setup:local` and `pnpm dev`;
replace that default guidance at actual cutover, along with the agent instructions. No repository
provider-startup hook was found. Stop the identified launcher trees and standalone backend at
cutover, then stop the exact recovery unit; re-inventory first to avoid stale PIDs.

Installed CLI help confirms `export --include-file-storage --path <protected.zip>` and snapshot
`import <zip>`, with component selection on import. The export implementation requests a data ZIP
with an optional file-storage flag; complete environment/auth/component parity has not been
rehearsed, so the planned stopped-data transfer procedure remains the conservative migration
choice at this unchanged backend revision. Never use `setup:local --reset-data` for migration.
For migrated `main`, leave `config/runtime.env` absent/empty unless intentionally transferring the
existing auth secret; a newly generated override would replace the auth secret already preserved
in the copied database. Protected config.json transfer also carries the instance credential.

Fresh candidate `7946b15` validation completed successfully: `run build -- pnpm check` exited 0
with 97 engine plus 336 app/script tests, 183 Markdown link checks and the full content/vendor/
foe/type/lint/build gates. The complete `run browser -- pnpm exec playwright test --workers=1
--output=/artifacts/browser-final --reporter=line` suite passed **22/22 in 11.0 minutes** through
the actual HTTPS preview, including V31's integrated history-control tests. Browser and backend
limits remained enforced; no certificate or secure-context bypass was used. The same URL survived
Docker host-port change to 32790, and the original validation content sentinel remained unchanged.

Existing browser screenshot outputs were explicitly packaged with
`run build -- tar -czf /artifacts/playtest.tar.gz -C /app .playtest` before any source replacement.
The generic helper fetched that archive, generated `api.d.ts` and final browser result to the
protected directory `/srv/presidium/home/.local/state/dev-runtime-evidence/salient-validation-20260916`
outside Git, alongside check/browser logs. No generated file overwrote local source. The branch is
reviewed and ready for coordinated integration/migration; the infrastructure owner will stop the
validation stack, preserve its data, perform main cutover and verify reboot recovery separately.
