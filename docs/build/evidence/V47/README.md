# V47 evidence

Owning slice: [V47: Fury level one](../../V47-fury-level-one.md). Source research is in
[the preparation record](../../../research/fury-level-one-preparation.md).

**Nothing in this directory has been executed.** No dependency install, build, typecheck, test,
server or browser has run for this unit, on CT114 or locally. These are preparation artifacts
written while the unit waits for the integration lead's V46 pilot verdict.

| File | Contents |
| --- | --- |
| [reference-builds.md](reference-builds.md) | The five counterpart builds: complete legal choice maps using the assembled definitions' actual decision ids, expected values derived from the pinned Compendium before our evaluator runs, the normalized comparison fields, and six derivation hazards |
| [capture-plan.md](capture-plan.md) | How the pinned Forge Steel editor is served and driven on CT114, what the capture script must and must not do, and the vendor-cleanliness constraint that forbids installing inside `vendor/forge-steel` |
| [test-plan.md](test-plan.md) | Definition, derived-value, negative, parent-change, compatibility, persistence and browser cases, including the two arithmetic regressions most likely to go wrong |
| [capture/](capture/README.md) | The runnable capture tooling: `builds.json` (the five builds as data), `forge-capture.mjs` (drives the served pinned editor and exports through its own control) and `normalize.mjs` (projects an export to the comparable fields and reports differences). Authored statically; selectors unverified until the first real run |

Evidence added during implementation goes alongside these: `forge/<build-id>/` capture output, command
logs, screenshots, retained failures and the reruns that resolve them.
