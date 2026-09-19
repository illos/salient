# V49 evidence

Owning slice: [V49: Polder level one](../../V49-polder-level-one.md). Source research is in
[the preparation record](../../../research/polder-level-one-preparation.md).

**Nothing here has been executed.** No dependency install, build, typecheck, test, server or browser
has run for this unit. These are preparation artifacts.

| File | Contents |
| --- | --- |
| [capture/builds.json](capture/builds.json) | P1, the one new counterpart, with per-field expectations derived from the pin; P0, a control build proving the new traits move no unconditional total; P2, the retained V45 Bethell artifact with its caveats; plus removal expectations and the normalized comparison field set |
| [capture/forge-capture.mjs](capture/forge-capture.mjs) | Drives the served pinned Forge editor for the P1 witness and exports through the application's own control. Self-contained: imports nothing from another unit |
| [test-plan.md](test-plan.md) | Definition, derived-value, Shadowmeld presentation, budget, removal, compatibility, persistence and repository gates |

P1 uses only options that were already supported before this unit and V47 — Fury, Berserker,
Mountain, and the three already-enabled abilities — so V49 is runnable and mergeable without any
unmerged peer artifact.

Expect the Forge selectors to need correction on the first real run; they were read from the pinned
source, not observed. Record each correction in the slice work log so "derived from source" and
"verified against the running app" stay distinguishable.

## Correction round, 2026-09-19

An independent reviewer audited this data and the script and found real errors. All corrected:

- the expected feature list was wrong (ten entries including advancement-table umbrella rows; the
  evaluator emits six), and skills and abilities were in the wrong order;
- the conditional-effect contract was asserted as if it existed in this checkout, when it comes from
  an unmerged peer commit and is provisional until that merges;
- the capture script could write a complete-looking artifact from an incomplete build. It now
  verifies the export against the choice map before anything is treated as evidence, refuses to
  guess when a label matches more than one control, records provenance and version from required
  flags rather than hardcoding or assuming them, and fails the run on console errors;
- the removal expectations did not match how the evaluator handles a stale selection;
- the retained Bethell caveats omitted that its corrected choices were made by hand-editing an
  export rather than in the editor, and that its retained sheet text never mentions Shadowmeld.

## Capture repairs, 2026-09-19

A cross-review of both units' capture scripts found further defects here. Repaired:

- **Selections were verified by substring search.** `JSON.stringify(hero).includes(name)` proves
  nothing: a `.ds-hero` embeds unselected options, every subclass branch and later-level
  definitions, so an unchosen trait's name appears in a correct export and a wrong one alike. The
  script now reads **active selections**, using the same traversal as
  `tests/helpers/v45-reference.ts` `projectForgeReference` — selected subclasses only, features
  filtered to the hero's level, `data.selected` for choices, `data.selectedIDs` resolved against the
  owning ability pool — and fails on a container type it does not understand.
- **The flow skipped saving.** It now clicks Save Changes, fails if that control is disabled because
  that means the editor recorded nothing, and exports from the hero view afterwards.
- **Only the first sheet page was captured**, which is how the script would have reported that Forge
  omits Polder Geist when it was our own screenshot that stopped at page one. Every page is captured
  and concatenated before that judgement is made.
- **Provenance was partly fabricated**: it hardcoded "pinned vendor source, NOT the public website"
  regardless of the URL given and recorded an assumed version as observed. Declared values are now
  required flags, recorded separately from observed values including the version read from the
  application's own About modal and the serving command.

A meaningful counterexample belongs with the first real run: capture a build that deliberately omits
one required selection and confirm the verification fails, so the check is known to be capable of
failing rather than merely passing.
