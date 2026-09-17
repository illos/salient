# V34 production presentation verification

All dependency, compilation and browser workloads ran on CT114 in the named `ui` environment,
Compose `salient-ui-dev-5363f12d852c`, at
`https://salient-ui-dev-c70637603db5.tail41404c.ts.net`.

## Source coverage

The pinned Core `md` bodies are counted once, without YAML/frontmatter or expanded duplicates.
[Coverage summary](coverage-summary.json) and the reproducible
[per-occurrence report](coverage-occurrences.json.gz) cover 2,614 records: 6,020 source icons,
1,611 potencies, 3,780 tier labels and 2,991 characteristic occurrences. Every expected name reaches
production HAST output and React glyph output. Missing occurrences: **0**; unknown-pattern
fallbacks: **0**. Each occurrence records its path, body offset, canonical token and accessible name. Offsets identify
the source token, tier line or stat cell supplying the context.

Reproduce with `SALIENT_PRESENTATION_REPORT=/artifacts/v34-coverage.json pnpm exec vitest run
--project scripts tests/scripts/core-presentation.test.ts --maxWorkers=1`. The report is gzip-compressed
here without timestamps. The normal full check also runs this audit.

The audit caught two real source variants: Noncombatant's blank defense placeholder and Hobgoblin
Flameslinger's duplicate printed stat row. Both now retain their complete source layout and all five
characteristic meanings. Unknown comparisons/feature markers stay literal and are reported; a synthetic
regression verifies that behavior. Formatted and dice-prefixed damage expressions are covered too.

## Full check

`presidium-dev --env ui run build -- … pnpm check`: **pass**. Lint/format, both typechecks,
97 engine + 347 app/scripts tests (**444 total**), documentation links, pinned vendors,
467 canonical content entries, immutable Foe edition and production build all pass.
[Full remote output](check.log). Vite retains its bundle-size advisory; the main bundle is
1,017.22 kB / 301.54 kB gzip. Parsing complete snapshot source is memoized by source text.

## Live consumers

The first passing six-test browser run covered public Rules, Foes, hero cards, the embedded Rules
preview, and the Director's printed snapshot below live controls. It verified current Stamina changed
from 15 to 9 and survived reload while the printed 15 remained unchanged; players cannot open the
Director's sheet. Existing navigation, dismissal, search, source links and heading anchors passed.
The final run adds the existing V21 sheet regression (Roll test, Catch Breath, Director edits, peer
access and compact sheet), native hero AX and blocked-font hero rendering: **7 passed in 1.5 minutes**.
[Final browser output](v34-browser-final.log), [native hero AX](v34-character-accessibility.json).

- [Rules light](v34-rules-light.png), [dark](v34-rules-dark.png), [native accessibility tree](v34-accessibility.json)
- [390px and 200% text](v34-hero-narrow-large-text.png), [font unavailable](v34-font-fallback.png)
- [Foes](v34-foe.png), [hero sheet](v34-character.png), [embedded preview](v34-embedded-preview.png)
- [Director controls and printed reference](v34-director.png), [browser output](v34-browser.log)

Native Chromium AX checks validate image roles and complete names, including potency, tier and
characteristic tokens. Keyboard links work and popovers return focus. Selection yields semantic text
(`Agility less than 2`) rather than glyph font codes. Forced colors and blocked-font fallback are
covered. This is Chromium AX/selection evidence, not a claim of listening tests in every screen reader.

## State and scope

No backend, headless, game engine, canonical content or archived Foe edition bytes changed. The UI
uses stored foe snapshot text and complete hero source; build damage modifiers remain separate.
Rules HTML has a new cache version. No unrelated V30/V32/parser branch was merged. Font and license
remain unmodified, with an attribution/license link in the public Rules and Foes footers.
