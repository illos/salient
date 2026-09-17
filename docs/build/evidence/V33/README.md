# V33 design verification

Scope: the Core-style visual study and finite automatic glyph renderer. This is not production
consumer migration. Headless source, API, CLI and mechanical data remain unchanged.

Target: CT114 environment `ui`, Compose `salient-ui-dev-5363f12d852c`.
Preview: `https://salient-ui-dev-c70637603db5.tail41404c.ts.net/docs/design-mockups/v33/index.html`.
All dependency, compilation and browser workloads ran on CT114. Main data/runtime were untouched.

## Results

- Full `pnpm check`: pass — lint, typechecks, **97 engine + 340 app/script tests (437 total)**,
  links, pinned vendors/content/Foes and production build. The existing bundle-size advisory remains.
  [Full remote output](check.log).

- `tsc -p tsconfig.web.json`: pass.
- `vitest run --project scripts tests/scripts/glyphs.test.ts --maxWorkers=1`: 4 tests pass,
  including all 79 examples, all 50 potency combinations, React/HTML semantics, source markers,
  contextual punctuation, nonnumeric/unsafe inputs and zero thresholds.
- `node scripts/audit-glyphs.ts`: 2,614 pinned Core records; 1,611 body potency occurrences;
  all 50 distinct combinations named. Contextual full-body token counts match the independent scan.
- All five fixture records compared equal to their pinned Git JSON values at
  `fb83a789da8f0327a389c277a0c790b1648d5810`.
- `playwright test tests/browser/v33-design.spec.ts --workers=1`: **2 passed, 4.9 seconds**.
  Chromium native `Accessibility.getFullAXTree` and Playwright ARIA snapshot confirm 76 meaningful image nodes and named potency/characteristic examples;
  selected glyph content is exactly `Agility less than 2`; missing-font visual fallback passes.
  Also covers source Special-before-roll order, Ajax, hero expressions, keyboard source-link
  activation, no glyph tab stops, dark/light, 390px width, forced colors and 200% root text size.
  Text actually doubles (computed-style assertion), with no horizontal overflow, tier/text overlap or feature-icon/heading overlap.

The first browser run passed the core semantics/fallback checks but failed narrow reflow because
it inherited the production body's 760px minimum width. The study now overrides that locally.
The final run above includes the fix and enlarged tier badges. The first screenshot/test-failure
artifacts are superseded; the retained images below come from the final passing run.

## Limits

These are Chromium accessibility-tree/selection tests, not listening tests with every screen-reader
and browser combination. Clipboard/AT interoperability needs broader rollout validation. The stock
production Foes, character and Rules pipelines have not yet adopted the new renderer. The owning
spec defines their source-to-render coverage gate and snapshot/version handling.

## Final browser artifacts

- [Native image roles and names](v33-accessibility.json) · [browser run](v33-browser.log)
- [Monsters, light](v33-monsters-light.png) · [dark](v33-monsters-dark.png)
- [Hero abilities](v33-heroes.png) · [Ajax solo](v33-solo.png)
- [All combinations](v33-glyphs.png) · [390px](v33-narrow.png)
- [200% text](v33-text-200.png) · [forced colors](v33-forced-colors.png)

After adding the native AX assertion, the final test file was formatted and typechecked remotely,
`node scripts/audit-glyphs.ts --check` passed, and the two browser tests were rerun at 4.9 seconds.
Renderer behavior is unchanged from the full check. Final local documentation checks cover 190 files.

Final visual review caught a fixed-pixel feature gutter at 200% text size. The study now uses rem
for the gutter and icon offset. A dedicated no-overlap assertion passes in the retained 4.9-second
run, after another remote typecheck. Shared renderer code did not change after the full check.
