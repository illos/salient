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
