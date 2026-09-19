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
