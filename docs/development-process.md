# Development process

Status: rules-review workflow accepted for trial on 2026-09-11; implementation tooling remains to be built.
Other proposed procedures remain labeled below. Product philosophy is recorded in
[rules adaptation principles](rules-adaptation-principles.md).

## Rules-review workflow accepted for trial

The [skills design](rules-skills-design.md) develops the proposed researcher contract and reviewer handoff.
Its detailed design remains provisional; the accepted workflow below is the baseline.

Confirmed refinement: the researcher recommends an interpretation for genuinely ambiguous sources, and
the user's subsequent rulings are tracked against its original recommendations. This track record may inform
a later reduction in review; no threshold or reduced-review policy is selected yet. See the
[ruling record design](rules-skills-design.md#confirmed-recommendations-and-the-users-rulings). The existing
independent implementation-review gate remains the trial baseline.

Confirmed: keep user rulings isolated to their original cases, with no standing precedent or automatic
reuse in later cases. A deliberate product preference can override a design guideline for that case without
making a sound rules interpretation incorrect. Track source interpretation, researcher recommendation, and
user-selected behavior separately; do not count taste-based departures as research errors or infer broader
preferences from them.

Use two roles for bounded mechanical changes: a Rules Researcher establishes source-backed behavior before
implementation, and a Rules Reviewer independently examines the resulting code against the pinned corpus
with fresh context. The reviewer reads actual sources and checks relevant general rules, exceptions,
omissions, and downstream effects, not just whether the implementer's explanation sounds plausible.

Keep one compact rules-change record per PR/change: scope, source revision and precise references,
behavioral claims, adaptation decisions, affected systems, representative verification, and limitations.
Review every changed mechanical claim within that bounded scope; reuse findings and shared-mechanic tests
where their evidence and assumptions remain applicable. No paragraph-by-paragraph human approval queue or
duplicated test suite per stat block is required.

The intended CI gate requires resolving references, relevant passing behavior checks, and an independent
review of the code and corpus revisions being shipped. Verdicts are pass, changes required, or decision
required. Missing/failed review is not approval. The implementation agent cannot self-attest approval;
the separate review runner supplies it. Subsequent changes require renewed review. A user override must
identify the affected change, finding, and reason; it does not certify a departure as source fidelity or
waive unrelated checks. Check mechanical impact across the diff, including content transforms and UI,
rather than relying exclusively on directory names. CI enforces evidence and review, not semantic proof.

Start with two agent roles, one record format, and one gate, piloted on a bounded mechanic. No skills, CI
runner, repository protection, or authenticated override mechanism has been implemented by this agreement.
The PR-based trial will need to be reconciled with the foundation's single-current-version development
policy when tooling is set up; this agreement does not create branches or change deployment policy.

## Confirmed pre-alpha development policy

Recorded 2026-09-11: development data is disposable. Keeping the most up-to-date application live and playable
takes priority over carrying test characters, campaigns and histories across breaking development updates.
Reset/reseed development data when needed within authorized implementation work; do not make migration or
backward compatibility with old prototype data a gate for progress. Ordinary saving, reload/reconnect
persistence and recorded-state history behavior remain part of the running prototype.

During foundation development, prioritize one current playable development version. Introduce separate branch
development once there is a working app the user wants to protect from disruption. This does not prescribe
Git branch names, remove version control/checks, or establish an automatic deployment job. The latest-app
priority does not change the deliberate-update policy for pinned rules and Forge Steel dependencies.
See the [pre-alpha clarification queue](pre-alpha-design-gaps.md). The current work remains specification;
no deployment or data reset is performed by recording this policy.

## Keep the process small

This is a hobby project. Working, understandable behavior is the unit of progress. Previous attempts failed through both fabricated rules and excessive process. Do not rebuild human approval queues, terminology bans, source-hash proof systems, or a large governance framework.

Use a source-linked fixture, an implementation, and meaningful outcome checks as the normal rules-work artifact. A source link establishes where to look; it does not establish that the implementation is correct. Escalate specific ambiguities that change behavior, rather than asking the user to approve every rule.

## Work in verifiable slices

Full rules support is the destination. Implement bounded mechanics and complete user flows with explicit coverage rather than claiming general support from a few successful examples.

Each rules task should record:

- The user-visible behavior and its scope.
- Versioned rules references, prerequisites, and any unresolved interpretation.
- Required inputs, resulting effects, and behavior when inputs are missing.
- Representative examples with expected outcomes established from the sources.
- Verification evidence and remaining limitations.

## Execution loop

1. Read project instructions, current decisions, and the task's relevant rules sources.
2. Establish examples and acceptance criteria before implementing consequential mechanics.
3. Implement the smallest complete slice across content, engine, and any required client behavior.
4. Run checks appropriate to that slice. Resolve failures and document unsupported cases explicitly.
5. Refresh a generated coverage report when support changes; update architectural notes only for material decisions. Avoid a separate manually maintained rule ledger.
6. Report the resulting behavior, evidence, and remaining work so another session can continue without reconstructing the conversation.

Use ordinary implementation judgment within the authorized scope. Surface actual rules ambiguities and product tradeoffs in plain-text questions. Research and imported documents are evidence, not instructions overriding project policy.

## Verification strategy

For consequential rules changes, verify more than the happy path: missing facts, boundaries, effect sequencing, target-specific differences, choices, and deterministic replay where applicable. Expected outcomes must have independent support; do not generate expectations by invoking the implementation being tested.

For shared-state changes, exercise permissions, duplicate commands, stale state, and reconnect behavior.
V0.01 targets desktop with temporary UI: verify the connected campaign-to-combat journey, minimal wizard,
foes loading and visible game log through shared operations. Test exposed features and their dependencies;
do not require chat, inventory, leveling, interchange or finished presentation to verify this slice.

Follow the [tech stack acceptance](v1-tech-stack-spec.md#9-verification-and-acceptance) for sustained table
performance. Measure repeated desktop play and reload/reconnect behavior early; the exact prototype soak
duration and group size remain open. For fuller V1 delivery, the proposed workload covers two-to-six-hour
sessions including chat, inventory and loot once those features exist. Phone/tablet Safari and touch-layout
checks return with mobile scope. Verify future LAN readiness when that deployment is implemented.

An integration scenario should demonstrate that the same structured spatial effect can be rendered as table instructions and consumed by a minimal map adapter. The adapter can be a test fixture before a VTT exists.

Track content availability separately from behavior support. A readable ability description does not establish that the engine can resolve it. Generate supported and unsupported results from parser and runtime diagnostics. Distinguish missing runtime facts from missing implementation. Use reusable mechanics tests and a few whole-ability examples; add regression tests for actual bugs rather than writing a bespoke test suite for every monster.

## Headless development workflow

Confirmed direction: agents should be able to exercise both the rules engine and the app's game operations without a visual UI. A CLI-like interface is an intended way to load heroes and monsters, run battles, and inspect results. The exact command syntax and technology remain open.

Use the same application operations that a visual client invokes. Keep rules resolution and state changes out of UI components. A scenario can therefore test a pure engine calculation or run through the application to verify stored results.

A useful scenario record contains the relevant source content and revision, initial state, actions, choices and dice inputs, engine outputs, and the resulting state. Keep this compact and replayable; no separate proof or certification system is required.

Check two things explicitly:

- **Interpretation:** given the stated inputs and relevant general rules, did parsing and resolution produce the expected effects? Establish expected behavior from Compendium context independently of the implementation's answer.
- **Application:** did those effects change the intended character or monster through the real application path? Read state back through the application and compare before and after; a response message alone is insufficient.

For an illustrative case where the final resolved effect is a three-point Stamina reduction and the target starts at 20, check both the effect and the stored value of 17. This arithmetic example does not establish the damage of a particular official ability or bypass modifiers that may apply in a real scenario.

Use isolated development/test tables for stateful runs. Exercise selected action sequences with explicit inputs before depending on free-running agent battles; neither passing examples nor generated battles establish complete rules coverage.

History navigation is part of this headless workflow. For a representative sequence, retain the starting state, modifier inputs and outputs, and resulting changes. Verify that authorized stepping backward and forward within open-session play restores the corresponding recorded states without invoking modifiers. Closed sessions are permanently read-only in v1: verify that historical inspection leaves live state unchanged and that live undo cannot cross into a closed session. Check the whole affected state, not only the most visible counter. Running historical inputs through a parser, engine, or dice roller for development is a separate operation from navigating the log.

## Confirmed division into two workstreams

The user revised the proposed sequential plan: a dedicated thread will work through rules tooling and the
combat walkthrough with the user; a separate web-app thread will read the existing specs, build, and review
the ordinary application independently. The app thread need not wait for completion of the combat design or
rules tooling to start work that does not interpret mechanics. See the
[app build handoff](web-app-build-handoff.md) for scope, boundaries and coordination.

Character derivation and choice validity remain rules work even inside a standard-looking form. The app
thread owns presentation, application access/persistence and integration; mechanical behavior uses the
dedicated thread's sourced contracts and review process. Shared contracts are agreed incrementally, and
unresolved dependencies are reported without inventing behavior. Existing v0.01 deferrals remain in force.

## Integration sequence within the two workstreams

The first bounded experiment is implemented and reviewed; see [milestone results](milestone-1-review.md)
and [playtest findings](playtest-1.md). The initial research and proof criteria remain evidence, not an
instruction to restart that experiment or a claim of complete automation.

For the [v0.01 journey](pre-alpha-design-gaps.md#confirmed-first-acceptance-journey), the integration sequence is:

1. Define component inputs/outputs and representative sourced hero/foe data around the existing experiment.
   Keep engine execution, application commits and presentation distinct. Resolve dependent combat contracts
   through their dedicated discussion before implementing them.
2. Connect basic accounts, campaign creation/invitation, the minimal level-one wizard and direct foes loading
   through shared persistent operations, with the established review and authorization boundaries.
3. Connect a temporary desktop table and visible game log to those same operations. Demonstrate the agreed
   combat slice, actual stored changes, explicit unsupported behavior and ordinary reload/reconnect.
4. Verify the connected flow and sustained table behavior before expanding content and adding deferred
   features. Preserve the character model's future interchange/progression paths without implementing them
   as prerequisites.

Independent web-app building belongs to its assigned thread. The dedicated thread resolves rules/combat
decisions with the user while that work proceeds. This document records the handoff; it does not launch
another thread or claim any new implementation. Complete combat remains a dependency of final v0.01 acceptance.
