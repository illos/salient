# V89: Reusable test foundation

Rules review: not required. Test infrastructure and explicit integrated fixture maintenance;
no application, rule, content or deployment changes.

## Goal

Establish a green combined V85–V88 foundation and reduce repeated test work under the
[test value policy](README.md#test-value) and [testing process](../../testing-process.md).
This bounded pass does not certify that every inherited test has been audited.

## Acceptance

- Reuse one pinned content build for byte-freshness and corruption checks. Mutations use copies;
  a date corruption fixture needs only the manifest. Keep full source comparisons.
- Remove the grammar fixture-count assertion while preserving every grammar case; remove the
  adapter's static implementation-label assertion and database harness while preserving rejection
  outcomes. Remove duplicate twin-name comparison and equivalent second date corruption case.
- Extend V88's explicit addition allowlist by the 37 reviewed V85 complication grants. Keep every
  original classification hash, original clause expectations, 235 promotions and five demotions.
- Focused checks and one complete `CI=true pnpm check` pass; independent implementation review.
  No runtime update or headless replay: all application, helper and dependency bytes are unchanged.

## Work log

2026-09-20: TESTER owns `.worktrees/test-foundation`, branch `slice/V89`, based on combined
`a0c958451f2c525a50d40756610f188e893312af`. Local serial pure/convex-test execution, no live backend,
browser or upload. Real pinned submodules and existing dependency closure; no fabricated rules.
Changes are limited to five test/fixture files and these process records.

The stale V88 fixture is repaired from the previously reviewed report delta at
`/srv/presidium/projects/salient/test-artifacts/V85-V88-55c835a-support-report-20260920T172300Z/delta.json`.
It adds exactly 37 named complication identities; it does not regenerate baseline hashes from the
candidate. Prior integrated failure remains recorded in
`/srv/presidium/projects/salient/test-artifacts/V85-V88-a0c9584-full-integrated-20260920T172800Z`.

Before/after output is retained in
`/srv/presidium/projects/salient/test-artifacts/test-foundation-V89/{before,after}.{json,log}`.
The content suite builds the full snapshot once instead of six times. Its date fixture writes
only the manifest instead of two full snapshots. All 90 parser fixture cases remain. The adapter
still checks empty-command rejection, unchanged state and invalid-state rejection directly.
Focused checks pass, including the repaired audit. `CI=true pnpm check` then passed once in
355.78 seconds: 358 engine and 575 app/scripts tests, lint, both type checks, links, vendor pins,
1151 content entries, supporting inventory, 438 stat blocks, current support report and production
build/budget. Output: `full.log` and `full.time.json` in the same artifact directory. The initial
optional `/usr/bin/time` wrapper was unavailable before execution; its setup error is retained in
`timing-wrapper-setup.log`; Python measured the single full gate instead.

The before/after runner-reported span for the content file was 3.95 s / 1.18 s; these single runs
are indicative, not a controlled benchmark or a claim about whole-suite speed. The full suite
still spends most of its time on retained application checks. The larger saving is avoiding
repeated full gates for unchanged inputs, as the updated guide requires.

Original audit rows and baseline SHA are identical to a0c9584; only 37 explicit added IDs differ.
Application, helper, content and dependency bytes are identical to a0c9584. File hashes of tested
changes are retained in `tested-files.json`; `identity.txt` records the base and submodule pins.
No service was started, no network payload uploaded, and no live data changed. The worktree is
retained for review; the only untracked local runtime item is the `node_modules` symlink.
## Independent review and handoff

WIZARD.2 independently reviewed `06c56eaebb476f378a0183f97600f9f141ebc1a7`
(tree `f183661ec8624d735110f6927f65b71153c6be61`); Chords message 1021,
2026-09-20: **PASS, no blocking findings**. Reviewer thread
`f8b014d3-c9a7-4e97-828d-da1e5773e53c` did not author this change.

The review confirmed isolated mutation copies, retained full source/freshness assertions,
all grammar cases, adapter rejection contracts, and the exact approved 37-ID delta with every
original classification byte and transition assertion preserved. It confirmed that guide reuse
requires unchanged relevant inputs and target. The reviewer read existing successful logs and
performed no duplicate execution. Rules review is not required.

The authentic `Reviewed-By: WIZARD.2 (pass, 2026-09-20)` trailer is included in the final commit.
Subsequent closeout changes are documentation/metadata only; tested file hashes remain identical.
This is committed-on-branch evidence, not merged or published. DEPLOY owns integration; reuse
this full result when relevant integrated inputs are unchanged, checking identity and merge
metadata. The existing cloud release still requires its separately submitted live verification.
