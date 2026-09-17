# V33 independent design and implementation review

Reviewer: Codex independent V33 reviewer, 2026-09-17. Scope is the design, shared reference
renderer and interactive study on `slice/V33`; production migration is explicitly excluded.

Verdict: **pass**, 2026-09-17, for the declared design/reference scope. All blocking findings have
been corrected, re-reviewed and covered by passing CT114 evidence. This is not approval of a
production rollout. The reviewer did not run development workloads on Presidium.

## References read

- `docs/monster-presentation-spec.md#presentation`
- `docs/monster-presentation-spec.md#automatic-aria-contract`
- `docs/monster-presentation-spec.md#font-copying-and-fallback`
- `docs/monster-presentation-spec.md#what-the-current-pipelines-do`
- `docs/monster-presentation-spec.md#integration-method`
- `docs/monster-presentation-spec.md#coverage-that-prevents-omissions`
- `docs/glyph-usage-spec.md#3-glyph-inventory`
- `docs/glyph-usage-spec.md#4-the-two-characteristic-families`
- `docs/glyph-usage-spec.md#5-composed-forms`
- `docs/glyph-usage-spec.md#6-accessibility-contract`
- `docs/glyph-usage-spec.md#7-component-contract`
- `docs/glyph-usage-spec.md#8-where-glyphs-appear-in-salient`
- `docs/build/V33-core-stat-block-design.md#acceptance`
- Historical V28 outline and local-reference README; supplied Monsters p66 layout scan.
- Pinned Bale Eye Markdown, fixtures and source occurrence examples identified below.

The automatic image role is suitable for a single composite symbol with its own author-supplied
name. Nested links remain outside that image, and ornaments are hidden. This is consistent with
[WAI-ARIA img](https://www.w3.org/TR/wai-aria/#img) and
[ARIA in HTML](https://www.w3.org/TR/html-aria/#docconformance).

## Findings

1. **High, blocking — scalar movement crashes the preview.** Initial
   `docs/design-mockups/v33/preview.tsx:81` used `.join()` on movement, although the pinned Bale Eye
   and Ajax fixtures contain strings. Default monster view therefore throws before rendering.
   **Resolved:** scalar/list handling has been added; monster and solo browser checks pass.
2. **Medium, blocking — required Special clause moves behind the roll.**
   `docs/design-mockups/v33/preview.tsx:67` renders every effect after its roll/tiers. The pinned
   `en/books/monsters/md/monster/demon/2nd-echelon/statblock/bale-eye.md` places Demonwarp Tears'
   Special placement clause before the roll. The JSON combines these into one effect object, so
   using its fields without source-order projection changes the reading order. Preserve the
   pre-roll clause and assert its position in the study. **Resolved:** effect text now precedes
   the nested roll, with a passing browser source-order assertion.
3. **Medium, blocking — sentence-final potencies are missed.** Initial
   `shared/presentation/glyphs.ts:78` forbids any period after the threshold. Actual Core examples
   include `A < 2.` in Wode Hag and `R < AVERAGE.` in Heroes' potency rule. Distinguish sentence
   punctuation from a decimal continuation. The inventory must exercise context rather than only
   feeding the isolated regex match to the tokenizer. **Resolved:** only `.digit` is
   excluded, sentence-period regressions were added, and the inventory compares contextual counts.
4. **Medium, blocking — inherited keys escape the finite icon vocabulary.** Initial
   `shared/presentation/glyphs.ts:68` indexes a plain object without an own-key check. Inputs such
   as `constructor` and `toString` produce an invalid icon token instead of the promised unknown
   result, then crash the descriptor. **Resolved:** `Object.hasOwn` rejects inherited keys;
   tests cover `constructor`, `toString` and `__proto__`.
5. **Low, nonblocking — corpus reproducibility was undocumented.** Initial inventory JSON had
   neither a generator nor a recorded generation command. **Resolved:** `scripts/audit-glyphs.ts`
   now provides generation and `--check`. The spec correctly distinguishes this scoped inventory
   from complete source-to-consumer coverage.
6. **Medium, blocking — feature icons overlap headings at 200% text.**
   `docs/design-mockups/v33/preview.css` leaves feature left padding and the absolute icon offset
   in pixels while the glyph scales with rem text. The final `v33-text-200.png` shows overlap at
   Made of Teeth, Lethe and Tumbling Gore. **Resolved:** the gutter/offset now scale with rem;
   the final 4.9-second browser run adds a passing icon/heading bounds assertion, and the reviewer
   inspected the refreshed 200% screenshot to confirm the overlap is gone.

## Acceptance checks

| Check | Status | Evidence |
| --- | --- | --- |
| 1. Pinned examples and Core hierarchy | Verified | Source and scan inspection; findings 1–2 corrected; final desktop screenshot |
| 2. Automatic names/roles for finite families; ornaments hidden | Verified | Shared descriptor, 79-example tests and native Chromium AX 76 image-role evidence |
| 3. React/HTML parity; atomic potency | Verified | Both adapters consume `describeGlyph`; exhaustive tests pass; native AX semantic names |
| 4. Selection, missing font, themes and narrow layout | Verified | CT114 assertions, final 390px/200% screenshots, dark/light and forced-color visual inspection; finding 6 corrected |
| 5. Pipeline losses and future coverage gate | Verified by inspection | Rules marker stripping, character metadata projection, shared resolver and ingest sanitization checked; rollout gaps explicitly stated |
| 6. Independent review and honest scope | Verified | This review; no claim of production migration |

## Limits and follow-up

The reviewer inspected [full check output](../evidence/V33/check.log): 97 engine and 340 app/scripts
tests pass, with types, lint, vendors, content and build checks. The
[browser log](../evidence/V33/v33-browser.log) records two passes in 4.9 seconds; its tests cover
selection, font failure, themes, source order, solo/hero examples, keyboard source links and reflow.
The [native Chromium AX evidence](../evidence/V33/v33-accessibility.json) contains the 76 meaningful
image names; ornament and raw font codes are absent. Desktop, dark, hero, narrow, forced-color and
200% screenshots were visually inspected. The last 200% refresh resolves finding 6. The final
changes after the full check were study gutters and browser assertions; targeted browser checks
and TypeScript passed again. No shared renderer behavior changed in that final correction.

These are reviewed implementer-run CT114 results, not an independent rerun. Clipboard behavior
across browsers and assistive-technology speech were not reproduced and are not claimed. The
production coverage gate, source projections, unknown-input diagnostics and consumer rollout remain
future work. The five JSON fixture equality check and scoped inventory run are recorded by the
implementer; the reviewer checked source passages and the inventory algorithm, not a second corpus run.

The first 200% check only changed root font size. The study now uses rem type and asserts computed
text doubling; tier columns and feature gutters scale, and both no-overlap assertions pass.

Source sanitization precedes trusted glyph serialization; generated text and attributes are escaped.
No source-controlled arbitrary ARIA or executable HTML bypass was found in the study. The source
pipeline audit correctly avoids claiming that exhaustive token tests prove production coverage.
