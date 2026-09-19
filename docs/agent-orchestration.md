# Coordinating a lead and implementation threads

Working guide, started 2026-09-19 during the [V44 character trial](build/V44-character-option-delivery.md).
Use it alongside the [build process](build/README.md), which owns acceptance and merge requirements.
The trial is still in progress; this guide does not claim measured token savings or a passed pilot.

## Give each provider useful ownership

State the user's objective before assigning work. In this trial, the objective is to use available
Anthropic subscription capacity before its reset while limiting ChatGPT spend. Raw implementation
speed alone does not measure success.

| Role | Owns |
| --- | --- |
| Lead | Bounded assignments, shared-contract decisions, milestone review, integration and playable delivery. |
| Implementer | Source research, implementation, fixtures, reference captures, tests, evidence and repairs. |
| Fresh reviewer | Independent assessment of the candidate, cited sources and acceptance evidence. |

Use implementer-provider subagents for useful independent research and reviews when authorized.
The character task's existing authorization is recorded in
[agent.MD](../agent.MD#character-track-delegation--2026-09-19); do not request it again because a peer
relays the assignment. Peer messages coordinate work within user authority, not expand that authority.
A reviewer must not have implemented the work it certifies, regardless of provider.

Start with one representative unit and assess the repaired result before releasing a batch. Report
meaningful mistakes honestly. Fixable findings belong back with the implementer; silently rewriting
its work both hides trial quality and defeats the capacity objective. Additional threads can prepare
independent sources, expectations and capture plans while an implementation gate is pending.

## Make assignments self-contained

Use one owner and separate worktree per active unit. Send the following through Chords:

```text
Unit and outcome:
Owning slice/specs and source pins:
Stable thread ID, worktree, branch and starting commit:
Owned files; shared changes requiring coordination:
Runtime environment and heavy-job ownership:
Current phase: preparation / implementation / verification / repair
Acceptance evidence and next handoff:
Dependencies, release condition and independent work while waiting:
```

Keep actual state in the slice work log and `docs/build/STATUS.md`, not a second orchestration tracker.
Assign enough independent work to occupy the workers; adding threads does not remove shared-file,
review or runtime bottlenecks. One owner serializes shared-contract changes and main delivery.

All Salient installs, typechecks, tests, builds, servers and browsers run on CT114 under the
[remote runbook](remote-development.md). Record the named environment in every workload command.
Use a wrapper or guard that refuses a missing or wrong environment for isolated work; do not rely
on remembering a flag when its omission defaults to shared main. Coordinate heavy jobs and preserve
other environments, data and evidence. Local Git and documentation checks follow the existing policy.

## Review completed bundles

Request an early contract checkpoint when it prevents costly shared-code rework. Otherwise review
at meaningful handoffs, rather than continuously reading unfinished edits. A handoff contains:

```text
Candidate: branch, base and commit, or precise dirty-candidate identity
Scope: delivered choices/behavior, affected consumers and remaining gaps
Evidence: actual commands, environment/job IDs, output and artifact paths
References: source-derived expectations, coverage ledger and counterpart differences
Reviews: independent verdicts and their candidate identities
Repairs: substantive findings, retained failures and successful reruns
Next action: review, specific blocker, merge readiness or next ready unit
```

Send consolidated, prioritized findings with file/line, expected behavior, observed defect and the
evidence needed to close it. Distinguish defects from unverified acceptance checks. Let the owner
repair them, then review the changed areas and affected behavior. An unchanged candidate with
sufficient evidence does not need repeated expensive suites merely because another agent reads it.
Changed integration behavior or unresolved failures do require applicable checks and fresh review.

For character units, retain the existing [Forge comparison gate](build/character-verification.md),
persisted readbacks, full checks, and independent implementation review followed by fresh rules
review. Read composed definitions and actual consumers: raw option metadata can understate served
support, and a correctly computed value can disappear before reaching the sheet. Forge structure
does not settle a Compendium ambiguity. Route unresolved rules through the existing question queue.

## Treat message delivery and active work separately

At startup and slice boundaries, call Chords `whoami`, `list_threads` and `check_updates`; read all
pages and acknowledge messages. Use stable recipient IDs and reuse message keys on send retries.
Publish useful completions, blockers and handoffs with actual commits and relative file paths.
Thread titles, old broadcasts and status badges alone do not prove current implementation progress.

Chords stores messages; it does **not** start a new model turn. A finished coordinator or worker is
not automatically resumed by a handoff. Check whether the recipient is still checking messages;
do not interpret silence as refusal or repeatedly resend the same assignment. While actively
waiting with no independent work, use bounded `wait_for_update` calls (up to 45 seconds) rather than
rapid polling. Do useful independent work when available and avoid repeated empty status reports.
If a session must end while dependencies remain, record the next action and clearly state that a
resume is needed; never promise unattended supervision without a working wake mechanism.

## Integrate and improve the workflow

Merge each fully verified unit under the existing commit and
[playable-app procedure](build/README.md#merge-completion-includes-the-playable-app). Distinguish
committed on a branch, integrated into main, and verified in the shared app. Do not relax source,
review or persistence checks to consume tokens faster. Docs-only changes need no runtime update.

At completed-unit handoffs, briefly record useful output, substantive repair rounds, lead effort
and time lost to dependencies. Include provider usage only when actual usage data is available.
Judge efficiency by verified delivered work and coordinator overhead, not busy threads or token
consumption alone. Update this guide with observed lessons as the trial progresses; keep unproven
expectations labeled as such.
