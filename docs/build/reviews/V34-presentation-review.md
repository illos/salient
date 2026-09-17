# V34 independent presentation review

Verdict: **pass** for implementation acceptance, 2026-09-17.
Reviewer: `v34_review`, independent of implementation. Reviewed `slice/V34` working changes
against V33 `bc773c1`. Main integration and shared-runtime verification are the lead's subsequent
completion steps; this verdict does not claim that rollout has happened.

## Specifications read

- [Presentation](../../monster-presentation-spec.md#presentation)
- [Automatic ARIA contract](../../monster-presentation-spec.md#automatic-aria-contract)
- [Headless boundary](../../monster-presentation-spec.md#headless-remains-ordinary-text)
- [Integration method](../../monster-presentation-spec.md#integration-method)
- [Coverage requirement](../../monster-presentation-spec.md#coverage-that-prevents-omissions)
- [Production adapters](../../monster-presentation-spec.md#production-adapters)
- [V34 acceptance](../V34-sitewide-core-presentation.md#acceptance)

## Acceptance assessment

| Acceptance | Status and evidence |
| --- | --- |
| One sanitized projection across Rules, previews, Foes and hero/live sheets; complete text and links | **Verified.** Inspected shared HAST projection, ingestion and consumer wiring; reviewed real Rules/Foes/hero/embedded-preview/Director screenshots and passing browser scenarios. Inline markup survives the contextual transforms. |
| Automatic finite roles/names; unknown patterns, code and URLs remain readable | **Verified.** Descriptor-owned HAST/React semantics, sanitization ordering, code exclusions and fallback diagnostics inspected. Native Rules and hero AX captures contain complete image names. Synthetic unknown-pattern and sanitization regressions pass. |
| Headless, archived Foe editions, state, gameplay and permissions unchanged | **Verified.** No canonical/backend/engine changes in the diff; immutable edition and canonical content checks pass. Director source uses its stored snapshot. Browser test changes live Stamina to 9, reloads it, retains printed 15 and refuses player access to the full block. |
| Live AX, keyboard, font fallback, themes, narrow/enlarged text, stable anchors and corpus coverage | **Verified.** Seven final browser tests pass, including existing Rules/Foes/sheet regressions and V34 checks. Reviewed all eight screenshots, both AX captures and corpus artifacts. Selection yields semantic text. Rules at 390px/200% remain readable; font failure exposes fallback names. |
| Full check and independent review | **Verified.** Remote full check reports 444 passing tests, lint/format, typechecks, links, vendor/content/Foe checks and production build; this independent review passes. |
| Main integration and shared CT114 runtime | **Not verified here.** These are the lead's required post-review rollout steps; do not report merge completion until their evidence exists. |

## Findings and resolution

No unresolved blocking findings.

1. **P2, resolved:** the initial damage adapter silently missed formatted and dice-prefixed
   characteristics. The revised adapter preserves inline markup and recognizes the pinned Arcane
   Disruptor, En Garde and Coup de Grace forms; final corpus records confirm their Agility names.
2. **P2, resolved:** initial coverage omitted contextual tiers/characteristics and unknown-pattern
   diagnostics. Final coverage includes these families and fallback reporting. The audit also found
   Noncombatant's blank placeholder and Hobgoblin Flameslinger's duplicate printed stat row; both
   source variants now retain their text and characteristic semantics.
3. **P2, resolved:** initial monster titles omitted the name inside the identity band and retained
   signature/cost within one undivided title. The revised projection restores that hierarchy,
   preserves linked cost text and retains IDs when moving chapter headings.

## Evidence and limits

Reviewed the [verification record](../evidence/V34/README.md),
[full check output](../evidence/V34/check.log),
[final browser output](../evidence/V34/v34-browser-final.log),
[coverage summary](../evidence/V34/coverage-summary.json) and decompressed
[per-occurrence report](../evidence/V34/coverage-occurrences.json.gz).
The latter contains exactly 2,614 records and 14,402 occurrences: 6,020 icons, 1,611 potencies,
3,780 tiers and 2,991 characteristics, with zero missing names, diagnostics or unknown fallbacks.
Reviewed the [Rules AX capture](../evidence/V34/v34-accessibility.json) and
[hero AX capture](../evidence/V34/v34-character-accessibility.json) directly.

The implementer ran workloads on CT114's named `ui` environment. I inspected their logs, test code,
source and artifacts; I did not independently rerun those workloads or operate the browser.
The final browser log reports seven tests passing in 1.5 minutes, including the added hero AX and
blocked-font assertions. Earlier screenshots were inspected individually; final refreshed captures
come from those passing scenarios. Chromium AX and selection evidence does not establish listening
tests in every screen reader or universal clipboard interoperability. Vite's bundle-size advisory
remains documented and does not block this presentation slice.
