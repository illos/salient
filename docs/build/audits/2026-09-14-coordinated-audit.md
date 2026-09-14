# Coordinated v0.01 backlog audit — 2026-09-14

**Result: audit complete; S01, S02, A01 and A03 require changes before approval.**
The local application runs and representative shared operations work, but passing happy-path tests
do not establish correct history, command identity or audience isolation.

Reviewed baseline: `main` at `8e9e315dcee3642bbc0d4b2422421dc1aedfb26e`.
Three fresh-context reviewers independently audited R02/R03, S01, and S02/A01/A03; the coordinator
ran the local deployment/browser checks and independently reviewed A08. All rules research used
only pinned local Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`.
No application implementation or vendored content was changed. No commit or push was made.
The tracker now distinguishes committed integration from audit approval.

Follow-up: the [repair and verification record](2026-09-14-fix-verification.md) records the subsequent
fixes and renewed verdicts. The results below describe the original audited baseline.

## Verdicts

| Slice | Independent implementation review | Rules review | Evidence |
| --- | --- | --- | --- |
| R02 | Pass for the research contract/types/fixtures | Pass, with interpretations still labeled | [R02/R03 report](2026-09-14-R02-R03.md) |
| R03 | Pass with a minor name-input documentation correction | Initialization and projections pass; Q-R-200 correction policy needs a decision | [R02/R03 report](2026-09-14-R02-R03.md) |
| S01 | Changes required | Generated extraction passes, including all 403 entries and all Goblin/Fury fields | [S01 report](2026-09-14-S01.md) |
| S02 | Changes required | Not required | [Operations report](2026-09-14-S02-A01-A03.md) |
| A01 | Changes required | Not required | [Operations report](2026-09-14-S02-A01-A03.md) |
| A03 | Changes required | Bounded test-roll and Recovery arithmetic passes under recorded provisional interpretations | [Operations report](2026-09-14-S02-A01-A03.md) |
| A08 | Pass after correcting stale browser assertions | Not required | [A08/runtime report](2026-09-14-A08-runtime.md) |

S00, R01, R04 and R05 were not re-reviewed wholesale. S00's GitHub Actions execution remains open.
R02/R03 are contracts and worked examples, not claims that an evaluator or admission adapter exists.

## Repair order

1. **Protect persisted history and execution identity (S02/A01).** A nested-object replacement can
   delete a field without recording that deletion in the journal. Command receipts use a different
   identity scope from dice/history: two users can submit the same public command id, share a roll
   result and be grouped into the same command journal. Reproduce and fix both before relying on
   these primitives for A06 undo/redo. Tests must read the full changed document and persisted
   journal/roll rows, including separate issuers.
2. **Apply audience policy across all read paths (A03).** Hidden Malice and supplied test difficulty
   leak through public event descriptions/payloads. The legacy `foes.list` projection also bypasses
   the chosen health-display policy, and the heroes roster returns peers' complete live resources.
   Correct server projections and add negative checks across the roster, legacy queries and history;
   hiding a field in one pane is insufficient. The browser walkthrough also demonstrates exact foe
   Stamina in an adjustment log while the selected roster health display is Bar.
3. **Keep pending interactions bound to their original actor and session (A01).** A name-based
   continuation can execute as a different same-name character, and a closed-session interaction
   can execute in the next session. Revalidate immutable actor identity and original session
   boundaries; log card closure through the registry. Register the table's exposed foe Add/Remove
   operations too. A01's placeholder prints a card id; richer interactive-card UI remains unfinished,
   not an additional blocker imposed beyond that slice's stated placeholder scope.
4. **Preserve generated content through application storage (S01).** The snapshot has all three
   Goblin features, but the Convex mirror and loaded foe snapshots discard `features` and `jsonPath`.
   Preserve them through schema, seed, query and snapshot and assert them on persisted readback.
5. **Close smaller contract/reproducibility gaps.** S01 trusts hand-edited generation dates despite
   its stronger validation claim. Source tests assume files excluded by the documented sparse
   checkout. R03 says the projected name comes from a baseline that has no name. A03's Recovery Source
   expansion receives only an id/note and cannot display the required verbatim text. Fix these
   narrowly; no rules-source update is needed.

Detailed severities, code locations, reproductions and acceptance limitations are in the linked
review reports. Each affected slice needs renewed independent review after implementation fixes.
These findings are not a request to expand into deferred class/monster feature automation.

## Previously unexercised checks now run

- **Real local backend:** identified `anonymous-agent` on 3212/3213. Old event rows prevented the
  new schema from loading; exercised `pnpm setup:local --reset-data` under the disposable-data policy
  (19 application tables cleared), then successfully loaded current backend functions.
- **S01 seed:** `pnpm content:seed` loaded 403 entries. Authenticated status and Goblin reads verified
  persistence and independently reproduced the missing structured features.
- **Code generation:** regenerated API declarations are byte-identical; no generated Git diff.
- **Browser and CLI:** three separate Director/player/observer contexts saw the same Director
  `/adjust`, persisted through reload. Palette/console, live `pnpm app command`, interaction
  inspection/response and same-issuer retries passed with stored events/dice read back.
- **A08 after integration:** theme switching, reload persistence, system preference and reduced
  motion passed. All six screenshots regenerated; login/campaign structure compared to the PNGs.
- **Existing journey:** corrected obsolete foe-hiding expectations to the accepted always-visible
  scope. The account/invitation/session/private-draft/reconnect journey then passed. Together with
  the three theme tests and new table test, all five current browser tests have passed.
- **Local checks:** `pnpm check` passes: 51 engine and 193 app/scripts tests plus lint, TypeScript,
  links, pinned-vendor/content checks and production build. The initial sparse checkout failed three
  source tests; materializing the same pinned book files allowed verification without changing rules.

Browser test changes are in `tests/browser/journey.spec.ts`, `theme.spec.ts` and the new
`table-audit.spec.ts`. Local logs, screenshots and readback JSON are under `.playtest/audit/` and
`.playtest/a08/` (ignored). The runtime report names the artifacts and distinguishes reruns from
the original failed baseline. Audit probes demonstrate defects; they do not certify correct behavior.

## Questions and remaining scope

No user ruling was inferred during this audit. Q-R-1–3, Q-R-50–52, Q-R-100–103, Q-R-200–201 and
Q-A-200 retain their recorded provisional/deferred status. Q-R-1–3 are misleadingly located under
the “Resolved questions” heading, but each explicitly says **open** and has no answer; they are not
resolved. Q-R-200 is the distinction between a source-backed initial Slain threshold and the product
choice to clear Slain when the Director raises Stamina above zero. Q-R-201 remains deferred rather
than inventing a re-admission reset. Q-A-200 remains provisional until A02 supplies real baselines.

S00's CI cannot be marked exercised from local checks; no GitHub run was triggered. A02, A04–A07 and
A09 remain unfinished, so this audit does not certify the complete v0.01 journey, sustained-session
performance or combat/history acceptance. The local backend remains loaded and Vite is available on
port 5180 for continued development.
