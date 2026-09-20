# Testing process

User decision, 2026-09-20: **this project's testing coordinator owns all test execution.**
Send jobs to Salient Chords thread `46c30412-6e29-44dc-b30b-08ffe22bd0e3`
(currently titled **TESTER**). One job runs at a time across local,
CT114 and hosted targets, including its setup, builds and cleanup. Other agents keep implementing
and reviewing; they write tests but submit checks here instead of launching their own runs or stacks.
This supersedes the earlier permission to run independent jobs concurrently on different hosts.

## Submit a small, reproducible job

Use Chords `publish_update` with `kind: "handoff"`, the coordinator's `to_thread_id`,
and a stable `message_key` such as `test-V87-<commit>-1`. Put the commit and relevant paths in
the tool's `commit` and `files` fields. Send this compact description, with links for detail:

```text
Job: <slice + purpose>; reply to: <requesting thread ID>
Source: <absolute worktree, branch, exact commit>; base: <previous tested commit, if known>
Checks: <exact commands/files>; catches: <concrete failure + expected result>
Target: <pure/local API/CT114 env/hosted URL>; deployed revision: <known or unknown>
Inputs: <required fixture paths, source modules/content, setup and dependency changes>
State: <disposable records needed, seed/deploy requirements, cleanup, retained data>
Prior evidence/blocker: <paths>; urgency/dependency: <why, if any>
```

Prefer a committed candidate; for uncommitted work supply a frozen patch including new files and
deletions against a named base. Do not edit a submitted snapshot underneath its run. Send a new
job key when the candidate changes, naming any request it supersedes. **Send paths and small
fixtures, not checkout archives, historical screenshots, dependency folders, secrets or databases.**
The coordinator can read local worktrees directly. Include the test's actual dependency closure;
minimal input must still exercise the required behavior and pinned-source checks.

For already-authorized testing, request `wake: true` on the direct handoff when Chords permits it.
A stored message or accepted wake is not proof that a run started. Respect skipped/failed wakes;
reuse the same key and content on retries. Chords-started turns cannot chain wakes. If a wake is
unavailable, the durable job waits for the next coordinator turn; do not create a competing runner.

## Coordinator procedure

1. Read Chords updates and record accepted jobs in the existing
   [status tracker queue](docs/build/STATUS.md#test-execution-queue) before acknowledging them
   (or in the durable local job record while DEPLOY holds the integration slot; see below).
   Use one queue row per job. Send one quiet receipt with job ID, source, host and target;
   use `running` immediately when capacity is available, otherwise `queued`.
   Use FIFO among runnable jobs; explain dependency or urgent-job reordering. A blocked job
   releases the queue for the next runnable job. On resume, read the queue and inspect actual
   processes before starting anything; an acknowledged message alone is not a durable work plan.
2. Check **both hosts**, existing ownership and any active jobs: CPU/load, available memory,
   memory pressure/swap activity, disk, and container/process usage. Account for shared apps and
   diagnostics, not just the new runner's limits. Choose the suitable free host; use one worker
   and serial check stages. If neither has room, wait and report the blocker. Reserve capacity
   for coordinated deployments too; peers must not start competing builds during a test.
3. Reuse a compatible runtime and dependency cache. Verify its actual source/content/toolchain;
   a local pass does not prove another deployed build. Run pure checks locally without an app
   stack, or run a local CLI against the required remote API when possible. Execute focused checks
   first, retaining required integration gates such as `pnpm check` when applicable. Avoid repeated
   full checks after documentation-only changes. Compare with the last tested source before choosing
   commands: reuse results only when relevant source, fixtures, dependencies, configuration and target
   are unchanged. Metadata-only repairs need identity and metadata checks; documentation edits need
   relevant link/hygiene checks. After a source or fixture repair, run the affected focused checks
   first, then one required full integration gate. Do not repeat unrelated focused suites, builds or
   deployment dry runs without a changed input or unresolved failure.
4. Transfer only missing inputs. For an already-correct remote app, send API requests and fixture
   data; no app upload/build is needed. If remote runner files are needed, use a compressed,
   allowlisted bundle in an isolated job directory, with required imports and dependency versions.
   A source delta needs a verified base, deletions and resulting file correspondence. Reinstall
   dependencies or rebuild/deploy affected components only when the job requires it. Never patch
   a shared runtime invisibly or use a writable source mount/reverse-sync.
5. Preserve per-attempt stdout, exit code, start/end times and source/target identity in a unique
   artifact directory. Headless feature proof uses authenticated shared CLI/API operations and
   persisted readback, including relevant refusals and conditional trait-granted abilities.
   Reuse sessions where supported and respect authentication limits. Classify assertion failures,
   SSH-connect failures, execution timeouts and resource failures before retrying; retain failed
   attempts and do not weaken assertions or increase timeouts to manufacture a pass.
6. Stop job-owned disposable services/processes when finished; retain data and required artifacts.
   Confirm actual exit and cleanup even after a lost SSH connection. The user authorizes stopping
   old development servers with data retained; reconcile active claims before cleanup. Keep the
   shared playable app available. No global pruning, volume deletion, shared-app reset or reuse
   of abandoned pilot/rollback data. Return `passed`, `failed`, `blocked` or `cancelled` with exact
   commands, source, runner, app target, duration, evidence paths and cleanup state. Record results
   in one concise terminal certificate in the slice's existing evidence and update its queue row.
   Link prior results rather than copying them. Do not create a second slice tracker.
7. **Every job return must wake its requester.** Send a direct Chords update to the recorded reply
   thread with `wake: true` for `passed`, `failed`, `blocked` and `cancelled` outcomes, including
   jobs kicked back for source repairs before execution. Use one stable return `message_key` and
   identical content if the wake call must be retried; inspect `wake.status` separately from message
   storage. `accepted` means only that T3 accepted the turn request. If Chords refuses the wake
   because this turn itself was Chords-started, or skips it because the requester is busy/cooling
   down, retain the direct message and retry the **same** key/content with `wake: true` on the first
   eligible coordinator turn. Never substitute a passive broadcast or invent a new key to bypass
   the wake lifecycle. Record the wake result in the queue/evidence so an unwoken return remains
   visible until delivery is attempted successfully.
8. **Keep deployment handoff ownership explicit.** Return the clean result to the requesting
   implementation thread first. TESTER may also send DEPLOY thread
   `bc6847ae-0334-4282-ae3c-6ec7291a509c` an informational copy with the exact source SHA and
   certificate paths, but that copy does not authorize integration. The owning implementation
   thread must explicitly hand the completed frozen work to DEPLOY. DEPLOY then owns integration
   into current main and cloud publication. TESTER owns the small reproducible integrated-main
   gate before promotion and the exact-revision live gate after publication when DEPLOY submits
   those jobs. Do not call a cloud revision stable until both target-specific gates and the release
   record are complete.

## Keep coordination small

Persist the queue entry and raw attempt outputs for recovery, but batch routine queue, certificate
and delivery updates into one terminal commit where possible. Do not create separate Git commits
for every acknowledgement or progress transition. Send one terminal wake message to the requester;
send additional progress messages only for a material finding, blocker or changed plan. A result
certificate is not itself a new testing job.

When DEPLOY holds the integration slot, keep pending queue updates in the durable local artifact directory
and hand over the terminal documentation patch for inclusion. Do not advance shared main merely
to record testing progress: this causes avoidable rebases and repeated identity checks. The queue
and certificate remain the authoritative project records; reconcile them with the retained artifacts before
resuming after an interruption.

The installed `presidium-dev up` still uploads a complete source snapshot and starts services;
`run` uses the last uploaded tree and does **not** sync edits. Compression/exclusion/delta changes
to that helper belong to Hermes and are not implemented by this guide. Prefer local execution or
an existing matching target while those improvements are pending. When an actual remote update
is necessary, use an explicit `--env`, verify the uploaded revision, and record the full-upload
exception. Never mistake the helper's stable checkout `identity` for a content hash.

The [remote runbook](docs/remote-development.md) owns CT114 commands and data protections.
The [headless completion gate](docs/build/README.md#programmatic-headless-completion-gate),
[test value policy](docs/build/README.md#test-value), and
[browser moratorium](docs/build/README.md#browser-testing-moratorium--2026-09-20) remain in force.
Testing ownership does not grant new deployment scope or replace independent review. This is an
agent-operated queue, not an installed daemon or a guarantee of background monitoring while idle.
