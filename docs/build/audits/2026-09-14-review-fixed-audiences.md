# Independent review: fixed A03 audiences, sources and foe operations

Date: 2026-09-14. Base: `8e9e315dcee3642bbc0d4b2422421dc1aedfb26e`.
Reviewed the uncommitted working tree, including the final difficulty-suffix repair, observer-owner
control projection, and HeroRow `[overflow-wrap:anywhere]` change. This reviewer did not implement the fixes, change
STATUS, commit, deploy or reseed a live deployment. Test reseeding used isolated convex-test storage.

| Review | Verdict | Scope |
| --- | --- | --- |
| A03 F6–F10 implementation | **Pass, bounded** | Current public queries, registered operations, recorded event shapes and corresponding UI. The additional difficulty-text defect found during this review was repaired and independently retested. |
| A03 changed rules claims | **Pass, bounded** | Complete pinned Catch Breath/Recoveries disclosure; unchanged Recovery arithmetic and unchanged winded threshold in the shared health projection. No certification of complete combat, dying enforcement, parser or broader ability support. |

## Evidence and reviewed change

Read `agent.MD`, the development process, rules-adaptation principles, the original
[S02/A01/A03 audit](2026-09-14-S02-A01-A03.md), and the
[audience fix record](2026-09-14-fix-audiences.md). Applied the Convex reviewer skill to public
authorization, campaign scoping, bounded reads and audience projections.

Owning contracts read in `docs/table-spec.md`: confirmed action/log contract, party sheets and
resource visibility, public rolls, Malice visibility, monster visibility/health display, historical
Show test difficulty, persistent adjustments, and v0.01 Catch Breath. Public reference-library
access remains legitimate; it is distinct from exposing a loaded foe's live record.

The reviewed implementation diff against the base comprises these files, with adjacent shared
changes inspected for their effect on these paths:

- `convex/lib/audience.ts`, `convex/events.ts`, `convex/table.ts`.
- `convex/foes.ts`, `convex/lib/foeOperations.ts`, `convex/lib/foeSource.ts`.
- `convex/lib/tableOperations.ts`, `convex/lib/registry.ts`, `convex/commands.ts`, `convex/schema.ts`.
- `web/foes.tsx`, `web/table/index.tsx`.

Snapshot identifier: SHA-256 of those twelve paths in the listed order, each encoded as
`path + NUL + file bytes + NUL`, is
`3109351f11544f0181bb8e8558e1f418017fe6f582e838be62d42c110c8d5b1b`.
This identifies the reviewed working-tree files; it is not a proof of semantic correctness.

Also inspected `content.get`/content records, owner-only character reads, campaign/session reads,
interaction projections, command envelopes and journals for alternate disclosure paths. Full
content-transform correctness and S02/A01 identity/history findings belong to their separate reviews.
Reviewed `tests/app/audience.test.ts`, `tests/app/foe-operations.test.ts`, `tests/app/table.test.ts`
and `tests/browser/table-audit.spec.ts`; inspected the parent's player screenshot, without claiming
to have independently run its browser suite.

## Findings resolved and boundaries verified

**F6:** Hidden Malice no longer appears in event descriptions, structured before/after fields or
submitted value arguments. Director history and persisted records remain complete. Difficulty
defaults off, including when the older settings object lacks the optional field. The registered
Director setting changes already-recorded tests; public dice, characteristic, skill, modifiers,
total, tier, critical information and calculated outcome survive projection.

The first reviewed implementation still replaced the first `; hard: ` substring. An independently
submitted `skill="Lore; hard: winter" difficulty=hard` produced public text containing
`(Lore; winter) ...; hard: Failure.`: it corrupted the skill while leaving the actual hidden
difficulty. The final code removes only the exact generated trailing difficulty/outcome suffix.
The independent reproduction now passes. Two permanent implementer regressions also cover ordinary
and outcome-like skill punctuation. This repair applies to the existing generated description shape;
future event writers must preserve or explicitly extend the audience contract.

**F7:** `foes.list` and `table.roster` agree in Bar, Numerical and Winded modes. Peers receive the
fraction only in Bar, exact current Stamina only in Numerical, and only the winded indicator in
Winded. Temporary Stamina and full live/source snapshots remain Director-only. All loaded foes
remain listed regardless of the dormant visibility flag. Both UI surfaces consume the projected
mode; no extra peer `healthFraction` bypass remains. Negative Stamina is hidden in the same
historical paths. Public glossary access is preserved as expressly permitted by the specification.

**F8:** Other owners' hero roster rows contain only current Stamina and Recoveries. Own-hero and
Director roster reads retain full live values. The hero pane renders the corresponding limited or
full fields. Public resource-adjustment history remains public; the fix does not manufacture a
general ban on historical resource facts. There is no implemented explicit character-sharing grant
to preserve in this prototype. Owner-only character detail rejects an observing peer.

The parent's final observer-owner correction also separates ownership from gameplay control:
an observing owner can read their own full live record, but does not receive Recovery or condition
controls while excluded from the session's selected players. Server-side observer gameplay
refusal remains in place. This affects control presentation, not the permitted own-sheet read.

**F9:** Table Add/Remove invoke the registry. Existing foe API wrappers delegate to those same
operations, with discoverability, authority and pause behavior aligned. The new `unpaused`
requirement permits roster work between sessions. Tests read real inserted/deleted records and
journal rows, verify retry parity across API/command routes, and reject player/observer additions,
cross-campaign removal and paused changes. An independent between-session removal also passes.
The event exposes the definition/instance identity, not its private source snapshot. The journal
retains that snapshot for restoration.

**F10:** New successful Recovery events snapshot complete verbatim Catch Breath and Recoveries
Markdown, with IDs, paths and revisions. `EventSource` renders both records, plus provenance and
the explicit FreePlay adaptation note. Observer event reads preserve both sources byte-for-byte.
The full Catch Breath dying restriction is present in the disclosed source, rather than omitted
to match the deferred implementation. No source was fetched online. Older events without snapshots
are not backfilled; the disposable-development-data policy does not make that a migration gate.

The final HeroRow wrapping change affects only presentation of the long example command. It does
not alter actor identity, submitted inputs or resource visibility. Parent-owned browser coverage
now asserts document width at 1280 and 1440 pixels for all three roles.

## Independent execution and bounded source verification

Only local pinned Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810` was used.
Read `en/unified/md/feature/common/maneuvers/catch-breath.md`,
`en/unified/md/rule/health/recoveries.md`, and `en/unified/md/rule/health/winded.md`.
They establish one Recovery spent for recovery-value healing, one-third maximum Stamina rounded
down, repeated outside-combat Recovery spending while resources remain, and winded at or below
half maximum. The moved winded calculation preserves that boundary for integer Stamina. Source
disclosure changes do not alter the arithmetic; existing Q-R-3 cap and dying-policy limitations
remain explicit and are not newly certified as source rules.

Focused final run:

```text
pnpm exec vitest run --project app tests/app/audience.test.ts tests/app/foe-operations.test.ts tests/app/table.test.ts tests/app/review-fixed-audiences.test.ts
4 files, 17 tests passed
```

After the observer-owner correction, reran the three permanent suites above: **3 files, 16 tests
passed**, including the added observer-owner projection/refusal/persisted-state regression.

The two independently authored scenarios are preserved in
[the review fixture](fixtures/review-fixed-audiences.test.ts.txt). Temporarily copy it to
`tests/app/review-fixed-audiences.test.ts` to rerun, then remove that copy. After strengthening the
negative suffix assertion to be case-insensitive, both scenarios were rerun and passed. Besides
the collision, they verify closed-session history with a session/cursor filter, later historical
difficulty reveal, negative foe health redaction, peer source/sheet refusal, and between-session
foe removal. No implementation was edited by this reviewer.

The parent owns full lint/type/build checks, deployment, live three-context browser/CLI/reload
evidence and final visual verification. This report does not substitute the focused tests for
those checks or certify other unfinished application slices.
