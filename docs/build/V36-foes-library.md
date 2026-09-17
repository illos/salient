# V36: Foes library browsing UI

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | not required — presentation of existing printed metadata only |
| Depends on | V34, V35 (compact browser catalog) |
| Unblocks | Foe library desktop feedback |
| Status | Committed — `e691e15` on slice/V36; not merged into main |

## Goal

Build a public Foes library inspired by the Rules index: browse monster bands, search and sort
stat blocks, and read complete source cards. Keep reference access independent of gameplay support.

## Spec references

- `docs/monster-catalog-spec.md#user-visible-flow`
- `docs/monster-catalog-spec.md#foes-library-browsing--v36`
- `docs/reference-library-spec.md#app-wide-rule-cards`
- `docs/reference-library-spec.md#confirmed-library-coverage`

## In scope

- Rules-style shell, monster-band navigation, responsive metadata rows and themes.
- Search, kind tabs, band/level/role/organization/keyword/usage filters and sorting.
- URL-persisted filters; full stat block, feature, Malice and nested rule previews.
- Integration with the concurrently developed V35 public catalog contract.

## Out of scope

Encounter building/loading, private campaign state, creature automation, source ingestion and bookmarks.

## Inputs and dependencies

Initial development used V27's committed 11-statblock package. The final implementation depends
on V35's compact browser catalog and additive group/source metadata; no fabricated creature
fixtures ship. V34 supplies the Core renderer. Coordinate the consumer contract through Chords
before integration.

## Deliverables

`web/foes/` library UI and selection model, route validation, Rules link, browser coverage,
verification evidence and independent review.

## Acceptance checks

1. Public `/foes` defaults to stat blocks; rows show printed metadata and open full Core source cards.
2. Band, level, organization and role filters compose, with removable chips, clear and empty states.
3. Name/partial/typo/feature search and name/band/numeric level/EV ordering work; parent metadata
   supports independent feature search. Missing numeric data sorts last; printed EV retains quantities.
4. Filters survive reload and opening/dismissing cards; nested feature/Malice/rule navigation and Back work.
5. Desktop light/dark, narrow layouts, keyboard focus/close and 200% text remain usable.
6. Full check, relevant browser regressions and independent review pass; full-corpus result is recorded
   separately from initial V27 verification.

## Ability design and playtest evidence

Not applicable: no abilities or gameplay behavior are implemented.

## Rules research

None. Use source metadata without introducing derived game mechanics. Band denotes the source
monster family, separate from organization, level, and keywords. No encounter EV arithmetic is added.

## Open questions

None.

## Work log

2026-09-17: claimed `slice/V36`, worktree `/srv/presidium/projects/salient/foes-library`, from main
`a0ac6d4`. Coordinated V35 ownership: that thread owns ingestion/contracts; this slice owns Foes UI.
Named CT114 `foes-library` is the local-anonymous validation target; main is unchanged. The existing
helper's sibling-worktree broker-cwd issue reproduces; temporary client adjusts only the broker
subprocess cwd to canonical `code`, preserving actual source archive/identity (same V33 workaround).

Initial V27-data verification: TypeScript, scoped ESLint, four focused selection tests and three
real HTTPS browser scenarios pass. See [verification evidence](evidence/V36/README.md). Corrected
new browser locators to use the native combobox role/name after the initial exact label-text
selector failed. No product behavior was changed to satisfy the locator.

Full-data integration: consumed V35's provisional compact `browser.json` plus additive contracts
and generic resolver for validation, pending the owner's coherent commit. UI uses explicit groups,
sourcebook filtering/attribution and related-rule links in card history. These copied dependency
files remain the V35 owner's work. Five public scenarios pass on all 2,507 objects; original source
certification remains separate. Independent review found an inadequate initial enlargement test;
replaced it with computed-text doubling and verified the actual font doubles at 390 pixels. Added
accessible row metadata descriptions. Confirmed sourcebook split 437 Monsters/one Heroes with
V35 owner. No catalog membership or printed values are changed by the UI.

Coherent integration: included V30 `214d04b`, V35 `0b07723` and its documentation handoff
`5634420` on this branch. Retained both inherited undead browser scenarios and full-corpus
coverage, adapting selectors for the library's kind buttons, rows and pagination. Final CT114
`pnpm check` passed 459 tests (97 engine, 362 app/scripts), lint, types, source reproducibility,
vendor/link checks and production build. The four library tests include printed EV quantity
and numeric/missing-value ordering. Main and its shared runtime remain unchanged.

Final public browser suite: eight scenarios pass in 1.9 minutes, including all 501 root references
and all 2,006 attached features with zero page errors. See the durable evidence for commands,
logs, coverage and refreshed desktop/mobile/theme captures. Independent final review follows
in [the review record](reviews/V36-implementation-review.md).

Independent implementation review: **pass**, `review_foes_library`, 2026-09-17. All acceptance
checks verified; no outstanding findings. No rules review is required for this presentation slice.

## Branch handoff

Implementation committed as `e691e15` on `slice/V36`, after V30 `214d04b` and V35
`0b07723`/`5634420`. This is a reviewed branch handoff, not a main merge or shared-runtime update.
The isolated [Foes library preview](https://salient-foes-library-dev-cb627850fa3d.tail41404c.ts.net/foes)
serves the tested implementation. Final documentation link and commit-trailer checks pass.
