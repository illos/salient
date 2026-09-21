# V97 independent rules and implementation review

Reviewer: ENGINE (Chords thread `2b1ba081-4040-4665-9ea2-22364db707f4`).
Verdict: **pass**, 2026-09-21. Final reviewed tip `72aa79c`; runtime `71e665e`.
Recorded by the owner from Chords 1328, 1329, 1333 and 1338; the reviewer made no edits or test runs.

The reviewer checked the diff against main `02ce529`, the character wizard decision/flow spec,
`en/unified/md/class/shadow.md` Basics, all Shadow level-two feature and ability files, and the
Shadow 2nd-Level Features section in `en/books/heroes/clean/Draw Steel Heroes.md` at pinned
Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.

Confirmed +6 Stamina, eight Recoveries, the three college feature mappings, eligible perk groups,
and all six 5-Insight alternatives. Friend!'s conditional manual actions and Sticky Bomb's delayed
manual detonation match the source. No rules mismatch was found. Level pruning, shared API,
create/save queue, owner guards, effective-build separation, source ledger and headless proof were
reviewed without an implementation blocker.

Two findings closed:

- Invoke all six ability alternatives, including the three rolled options, and read persisted costs,
  source-derived damage, target state and manual remainders. Completed in `71e665e`.
- Commit the regenerated reports that mark all six new abilities reachable. Completed in `72aa79c`;
  counts verified as 15 compiled, 1295 compatibility, two structurally supported but unavailable.

The reviewer inspected TESTER's passing full check and live cohort artifacts. The accepted runtime
has 971 passing tests and a passing isolated six-build journey. Manual effects remain explicitly
manual; this review does not claim Shadow passive, spatial or delayed-effect automation.

Authentic trailer supplied in Chords 1338:

`Reviewed-By: ENGINE (pass, 2026-09-21)`
