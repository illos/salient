# V37 supporting character choice evidence

The [slice](../../V37-supporting-character-choices.md) and
[complete source inventory](../../../research/v37-supporting-choice-inventory.md) define scope.
All builds, application tests and browsers ran on CT114. Vendored source pins stayed unchanged.
Saved text logs omit terminal color escapes and trailing whitespace; results and errors are retained.

## Isolated verification

Named environment: `characters`, anonymous development backend and real authenticated HTTPS UI.
The initial full check passed 648 tests (274 evaluator, 374 application/tooling), lint, types,
source integrity and frontend build. [Initial check](integration/check-before-import-fix.log).
The [bundler reproduction](integration/bundler-reproduction.txt) records the resolved mixed JSON
import attribute failure; the generator now aligns the import and actual startup succeeds.

[Supporting browser run](integration/supporting-browser.log) passed both initial V37 journeys:

- Artisan skills, owned perk target, changing perk, source links, custom incident, Arcane Archer,
  Elemental Inside's permanent drawback, save/reload, Director review and effective sheet.
- Strange Inheritance private Director setup, approval readiness, item persistence, owner privacy,
  and the owning Director's pre-submit setup path.

Screenshots: [career](isolated/supporting-choices/career.png),
[complication](isolated/supporting-choices/complication.png),
[reviewed sheet](isolated/supporting-choices/reviewed-sheet.png),
[player view](isolated/private-inheritance/owner.png),
[Director view](isolated/private-inheritance/director.png),
[owning Director](isolated/private-inheritance/owning-director.png).
[Persisted readback](isolated/supporting-choices/readback.json) uses disposable test characters.
No test credentials are included.

[Initial regression run](integration/regressions-initial.log) passed table, sheet and Fury
progression journeys. Its wizard rail and retained Magic-label failures were corrected before
the final run. This log intentionally retains the original failures.

Independent UI review then found and closed advancement hidden-target pruning and Rival guidance.
[Final complete check](integration/check-final.log) passed 648 tests after those corrections,
213 Markdown links, all source checks and the production build. [Final browser run](integration/browser-final.log) passed Elementalist, revised Fury advancement,
supporting choices including Rival guidance, and private inheritance. Its remaining wizard-frame
failure was an old availability-label expectation; the [corrected wizard rerun](integration/wizard-final.log)
passed. Together these cover all five requested final journeys.
[Fury persisted advancement/restoration](isolated/fury-progression/readback.json) and
[level-two sheet](isolated/fury-progression/level-two-sheet.png) retain the exact readback.
Shared-main rollout remains pending.
