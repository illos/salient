# V47 capture tooling

**Nothing here has been executed.** No CT114 window has been used, no dependency installed, no
browser run. The scripts were authored statically during preparation and are honest about that:
every Forge selector was derived by reading the pinned Forge Steel source, not by observing the
running application, so each is unverified until the first real run corrects it.

| File | Purpose |
| --- | --- |
| `builds.json` | The five reference builds as data: Salient choice maps with real decision ids, source-derived expected values, per-build derivation notes, and the form-conditional effects that must stay out of the build values |
| `forge-capture.mjs` | Drives the served pinned Forge editor for one build and exports through the application's own export control |
| `normalize.mjs` | Projects a `.ds-hero` export down to the comparable fields and reports differences against the source-derived expectations |

Read [the capture plan](../capture-plan.md) first: it carries the environment rules, including the
constraint that dependencies must never be installed inside `vendor/forge-steel`, and the reasons
the capture exports the pinned tree into scratch space instead.

## Rules the scripts enforce

- The capture aborts on any unresolved selector rather than continuing. A partially-driven editor
  produces an export that looks real and is not.
- The script never writes a `.ds-hero` itself; the bytes come from the application's download.
- No selection is injected into storage, and no previous export is substituted for performing the
  change in the editor.
- `normalize.mjs` reports differences; it never decides that one is acceptable. An unexplained
  mismatch blocks the unit, and the explanation belongs in the slice with its source citation.
- Derived sheet values are compared from the captured sheet text, not inferred from the export's
  embedded definitions.

## First-run expectations

Expect the selectors to need correction on the first real run — the editor's controls were read
from source, and antd renders several of them in ways a static read cannot confirm. Record each
correction in the slice work log rather than silently editing, so the difference between "derived
from source" and "verified against the running app" stays visible.
