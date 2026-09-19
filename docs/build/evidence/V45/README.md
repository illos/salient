# V45 character foundation verification

Candidate: `slice/V45`, integrated with main `944a46a` (the final performance closeout is
documentation-only). All application execution uses CT114's isolated `characters` environment:
Compose `salient-characters-dev-2389e144b9dd`, local-anonymous Convex, frontend
`https://salient-characters-dev-aa988a1a3752.tail41404c.ts.net`.
The existing environment's data volumes are retained. No hosted deployment or vendor-pin change.

## Preservation and reference checks

The [initial focused run](focused-initial.log) caught two new test inputs whose schema version
was typed as an unconstrained string. Those inputs now use the contract's `r01.1` literal.
The [successful rerun](focused-pass.log) runs both TypeScript checks, all ten new foundation/
reference tests, and `node scripts/verify-character-foundation.ts /artifacts/v45-before`.

The baseline is a pristine archive of `9fb4fa66a942466b713fa8498301a120a880b412:shared/`.
All **10 assembled definition variants and 5,584 full evaluation objects compare exactly**,
including provenance, grants, partial values and diagnostics. Cases cover complete, incomplete,
invalid and unsupported states, every selected key omitted or invalidated, all single-choice
options and invalid levels. This proves extraction preservation; source-led rules expectations
and [actual Forge references](../../../research/v45-reference-inventory.md) are separate oracles.

The [candidate hashes](candidate-hashes.json) identify changed application/test/reference files.
The baseline commit in that manifest identifies the integration parent, not a committed V45.
Historical Forge exports remain byte-identical. Deferred Grug language, absent rendered winded
values and other reference limits are stated in the inventory; this is not new-option certification.

## Repository and browser verification

[Full repository check](check-pass.log) passes: 691 tests (284 engine, 407 app/scripts), lint,
both typechecks, documentation links, vendor pins, generated content, supporting inventory,
foe content, production build and delivery budgets. The final performance documentation closeout
and V45 evidence/review files were added locally after the remote source archive; application,
test and reference bytes are unchanged. Final documentation links are checked separately.

The [full 52-scenario browser batch](browser-initial.log) finished with 45 passes, four failures
and three explicit skips. The failures are retained:

- Closeout encountered an `encounters:current` one-second backend timeout at 14:12:38 UTC;
  [context](closeout-context.md). The unchanged [standalone rerun](closeout-retry.log) passes
  in 1.4 minutes.
- Table audit and V21 campaign registration hit the account endpoint's rate limit;
  [representative context](rate-limit-context.md). The unchanged [rerun](registration-retry.log)
  passes both scenarios in 2.0 minutes.
- Fury completed wizard/admission/sheet checks but failed during the table stress journey after
  an `abilities:sheet` one-second timeout at 14:28:34 UTC. The unchanged [standalone rerun](fury-retry.log) passes in 3.2 minutes, including the full
  60-action table extension.

[Runtime warnings](initial-runtime-warnings.log) preserve both timeouts and the near-limit reads.
Chords messages 173–175 hand the details to the performance thread; no timeout or rate-limit
setting was relaxed. These intermittent broader performance failures are not claimed fixed. The
[successful retry window](retry-runtime-warnings.log) has no execution timeout, but records
near-limit reads up to 934.945 ms (history) and 933.005 ms (character sheet).
The three skipped checks require fixtures absent from this development target: two password
recovery scenarios and the Workers immutable-cache scenario. They do not cover changed foundation
behavior and are not counted as passes. All 49 applicable scenarios now have successful current execution evidence. This is a failed
initial batch plus four passing reruns, not a claim of one clean full-batch run. Independent
review must assess those results and the retained intermittent performance limitation.

[Runtime source verification](isolated-source-verification.json) confirms all 39 changed
application/test/reference files match the local candidate. These hashes exclude documentation
and the incidental generated API helper imports added by Convex codegen.

Retained actual screenshots show [Fury's owner sheet](fury-sheet.png),
[successful Fury table stress](fury-combat.png), [corrected Bethell](elementalist-sheet.png),
[level two](level-two-sheet.png), [history preview](history-preview.png),
[restored level one](restored-sheet.png), and [reviewed supporting choices](supporting-reviewed-sheet.png).
The [V32 persisted readback](progression-readback.json) is the raw browser-test capture through
application queries before advancement, after advancement and after reviewed restoration, with
source-card checks and history. Advancement preserves current Stamina 20, recoveries 4 and Ferocity 3 while maximum Stamina
goes 30→39. The test then explicitly raises current Stamina to 39 before requesting restoration.
Pending review retains 39; approved restoration caps it at the restored maximum 30. Recoveries 4
and Ferocity 3 remain unchanged. Source-derived recovery/winded totals follow the effective build.
Test accounts, deterministic fixture setup and operations are defined in the existing browser
tests; these are automated checks, not user playtest feedback.

## Shared delivery

Pending reviewed commit and integration. The shared playable main has not been changed by V45.
