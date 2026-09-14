# Independent re-review: history, cards and foe registry fixes

Date: 2026-09-14. Reviewer: `review_fixed_history`, independent of implementation.
Base HEAD: `8e9e315dcee3642bbc0d4b2422421dc1aedfb26e`; reviewed the uncommitted working-tree changes.
**Verdict: pass for audit F1–F5 and F9. No blocking regression found in this bounded scope.**
This is not approval of every S02/A01/A03 acceptance check or of the separate audience/content fixes.

## Scope and sources

Read the project instructions, build process, S02/A01/A03 slice documents, the original
[independent audit](2026-09-14-S02-A01-A03.md), and the implementation
[fix record](2026-09-14-fix-history.md). Applied `convex-reviewer` to the changed public entry points,
authentication, campaign/actor/session authorization, validators, indexes and transactional writes.

Owning sections checked:

- `docs/data-architecture-spec.md#5-encounter-actions-and-undo` and
  `#6-session-closure-and-compression`.
- `docs/table-command-spec.md#identity-actor-and-targets`, `#structured-invocation-envelope`,
  `#results-and-pending-interactions`, and `#recording-ordering-and-recovery`.
- `docs/table-spec.md#confirmed-action-and-log-contract` and `#foes-roster`.

Read the actual journal, event, dice, command, registry, interaction and foe implementations and
their tests, including the new `foeOperations.ts` and `foeSource.ts`. Inspected the table button
changes and the retained `foes.add`/`remove` wrappers. No rules research, implementation change,
deployment, commit or STATUS edit was performed.

## Findings and verification

| Finding | Result | Evidence |
| --- | --- | --- |
| F1: incomplete nested replacement journal | Verified fixed | Replacement compares the old/new nested key union. Regression tests read persisted replacement state and deletion rows, including deletion-only patches. Independent probes additionally check deeper deletion, empty child objects and whole-array changes; omitted top-level fields remain untouched. |
| F2: cross-user accepted dice/history reuse | Verified fixed | Public callers cannot supply issuer/key. Both live roll call sites pass the authenticated user; internal dice requires an explicit server-owned scope. Two issuers copying a public command ID produce distinct stored rolls/counters and journals, while same-issuer retries do not reroll. Consequences inherit the cause key. Independent system work remains in its separate null scope; a mismatched cause command ID fails without an event. |
| F3: card actor rebinding | Verified fixed | New continuations store stable references, and response always reconstructs the actor from stored `boundActor`, including legacy name-based continuations. The runner checks current campaign attachment/control. Persisted events preserve the original actor ID after rename; revoked control, detached actors and actor injection refuse without resolving the card or rolling. |
| F4: historical card response/closure | Verified fixed | Both writes check the card's owning session; the read projection disables authority for historical cards. Direct/slash responses and closures fail before and after a replacement session begins, preserving events/card rows. A paused roll card refuses execution and works after its own session resumes. |
| F5: unregistered, unlogged closure | Verified fixed | `card.close` is discoverable and direct closure invokes it. One attributed ordered event links to the opening event before terminal status is committed. Revision/authority refusals, no dice generation, and same-receipt direct/slash retries are tested. Response likewise shares the registry. |
| F9: foe add/remove outside registry | Verified fixed | Both operations are discoverable, Director-only and pause-gated. The table buttons use structured registry invocations; old wrappers delegate to the same runner. Creation/removal each journal a whole-document snapshot, preserving source/state and issuer scope. Wrapper/slash retries produce one event; an add retry after removal returns the original ID without recreating it. Independent no-session deletion verifies the complete prior document and structured retry after deletion. |

No Critical or Important finding remains in these changed paths. Changed public functions have
authentication, campaign scope and argument/return validators. The relevant reads use indexes and
bounded results; the fix does not add public issuer selection, query-time clocks, scheduled public
mutations or new client-owned identity fields. Existing generic payload validators remain broad;
operation schemas and runtime validation enforce the supported inputs examined here.

## Acceptance mapping and limits

| Slice acceptance | Result in this re-review |
| --- | --- |
| S02 1: full check/session adaptation | Not independently rerun. Parent reports `pnpm check` passing with 51 engine and 211 app/scripts tests and build. |
| S02 2: consecutive sequences | Verified by rerunning persisted concurrent-append test. |
| S02 3: retry/new dice stream | Verified by dice and cross-issuer regression suites; a fresh stream position need not produce a different face by chance. |
| S02 4: origin/actor constraint | Verified by rerunning journal suite and independent system-scope probe. |
| S02 5: complete sample journal | Verified by persisted sample, deletion regressions and full foe creation/deletion records. |
| S02 6: no new mechanics | Verified within these fixes; no rules calculation introduced. |
| A01 1: web/CLI parity | Shared-mutation paths verified; actual clients remain parent's browser/live work. |
| A01 2: retries | Verified, including wrappers, responses and closures across entry points. |
| A01 3: note authority | Verified in rerun registry suite. |
| A01 4: grammar fixtures | Not rerun here; parser unchanged. Specific new slash operations are exercised. |
| A01 5: headless card lifecycle | Verified, including original failures and independent adversarial actor cases. |
| A01 6: discovery/palette | Query schemas/discovery verified; browser rendering remains parent's work. |
| A03 1: observer operation refusal | Verified for foe operations in this scope; full operation matrix belongs to the separate table/audience review. |
| A03 2–4: condition authority, Malice, Recovery | Not independently rerun here; outside F1–F5/F9. |
| A03 5: pause/resume | Foe pause gate verified; card roll pause/resume verified. Direct test arithmetic/path belongs to separate review. |
| A03 6: health modes | Not independently reviewed here; audience reviewer owns it. |
| A03 7: foes visible, no hide controls | Existing foe suite rerun; new registry adds only add/remove. Dormant visibility endpoints remain the explicitly accepted deferral. |
| A03 8: rules arithmetic | Not reviewed here; no mechanical claim made. |

The fix intentionally leaves legacy unscoped dice/history rows outside new scoped lookups, as its
record states. No migration, old-row undo, or live preservation claim was verified. Undo/redo itself
remains A06; the tests verify recorded inputs for restoration, not an implemented restore operation.
Likewise, full card completion policies and active-Director succession remain outside these fixes.

## Commands and independent probes

Ran successfully at 20:41 UTC:

```text
pnpm exec vitest run --project app tests/app/review-fixed-history-probe.test.ts tests/app/history-interaction-regressions.test.ts tests/app/foe-operations.test.ts tests/app/journal.test.ts tests/app/dice.test.ts tests/app/interactions.test.ts tests/app/registry.test.ts tests/app/foes.test.ts
8 files passed; 40 tests passed (36 existing, 4 independent probes).
```

Probe assertions check desired behavior and include persisted reads. The temporary probe was moved
to [the excluded fixture](fixtures/review-fixed-history-probe.test.ts.txt) after the run. It is not
part of acceptance discovery/typechecking. Reproduce by copying it to
`tests/app/review-fixed-history-probe.test.ts`, running the command above, then removing that copy.

All bounded implementation claims in the fix record were reproducible in source or focused tests.
No full-check, browser/live, network-concurrency or visual result is claimed by this reviewer.

## Exact reviewed implementation

SHA-256 captured immediately after the successful focused run:

```text
3418a63db9660f0e7e72ac1791617a7b9da35c964bbfc42283b6bfa961129603  convex/lib/journal.ts
340c0c16693e45ccede2d3ed0764565808744746d4b3028c04f41aac06586173  convex/lib/commands.ts
6b185885e919d7d29968add4f773745ab57c55aeaeaf869ee3bfbba7824b6639  convex/lib/events.ts
4608156c76bc40832f26e945b369b02f0760cbe3721aafd3da425548106caceb  convex/lib/dice.ts
829db2cac5d137c32d225a949c8100d3007af64d3ee4c63a17c0f035153ae589  convex/dice.ts
42ba2fcc98c88ea1862339b6861b96acb570fd42a3f4ae0ac8a9ca460350cbd3  convex/lib/interactions.ts
ba72ddc08d21a6f82a189de687ffb8a34ed0706da9509d8c146b666146e158c0  convex/interactions.ts
2778e8f9251c0058b81db7448e124fdf25c608ff2c9f46eb3bcb8c836a594f6c  convex/lib/registry.ts
740b78c0d48a484558f1494f88db80d35c18272d83043470c202fc39ae4127d7  convex/commands.ts
3dc6df164ee2aca8ce1e49119e64cd7df3680ac0068f9d6b1bbb55997917d493  convex/lib/foeOperations.ts
ee5ef66a42c5992b15bf7fe369a81db8047bea1c403a5a400188aee72ff76bba  convex/lib/foeSource.ts
9feff6ed3a785372aa6fb36b063b85a9df37f7aa83e2150cabb918e89330e966  convex/foes.ts
```
