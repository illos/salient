# V41 reference performance verification

This is implementation evidence, not a post-deployment timing benchmark. The [live baseline](../performance-2026-09-19/README.md) used the public hosted app. V41 was verified on the isolated CT114 `performance` environment based on V42 implementation `45426dc`, with pinned Compendium `fb83a789da8f` and Forge Steel `5a846aadb623`.

## Final candidate

- Full `pnpm check`: 676 tests passed (274 engine, 402 app/scripts), lint/types, pinned content checks, documentation links, and production build/budget passed. The reference test verifies complete content reconstruction and exact-title ranking across the pinned corpus.
- Final Workers browser suite: **14 passed in 46.3 s**. Workers tests use actual local `workerd` static assets through Wrangler 4.134.0, not mocked cache headers or Vite. Authenticated checks target the isolated HTTPS preview; disposable test records stay in that isolated backend.

## Emitted bytes

Sizes use Node `gzipSync` consistently with the live-baseline build inventory; they are not a promise of Cloudflare transfer encoding or latency.

| Item | Before | V41 |
| --- | ---: | ---: |
| Complete initial JS static dependency graph, gzip bytes | 458,779 | 160,921 |
| Rules catalogue, gzip bytes | 232,685 | 112,848 |
| Foes initial data, gzip bytes | approximately 680,800 | 101,309 |
| Largest initial Rules article, raw bytes | 4,956,256 full Monsters chapter | 415,705 maximum initial article |
| Largest Rules continuation, raw bytes | n/a | 135,780 |
| Largest Foe detail, raw bytes | full catalogue previously loaded | 55,297 |

Initial JS is 64.9% smaller gzip (73.2% smaller decoded). The Rules serialized full-text index is 1,411,557 gzip bytes and the Foes index is 373,816; both load on first search and persist across route changes. Immediate Rules title matches precede full-text results. Browse metadata remains complete: 2,614 Rules entries and 2,507 Foe objects. Index downloads are deliberately excluded from initial listing figures, not hidden within a page-load timing claim.

## Failures fixed and limits

Early Workers runs reported a late-anchor failure (12/13, then 13/14 with scroll-release coverage). An explicit geometry probe revealed that Playwright DOM tracing crashed the tab in the 2 GiB browser container while snapshotting a roughly 600,000px chapter. The identical production bundle and case passed with tracing disabled: the target stayed about 157px below the viewport top as earlier sections arrived. Only the two oversized-anchor cases disable DOM tracing; actual browser/layout assertions, failure screenshots and all other traces remain enabled. The final implementation keeps the selected section in view through insertion until reader input releases it; the speculative extra animation-frame correction was removed.

Earlier Vite-only failures exposed stale file watching after deleting current public reference directories; both generators now preserve their current directories. Focused dev attempts also encountered a stale HTTPS forwarding port after an owned-container restart; those attempts are recorded as failed harness runs, not accepted application passes. A final `presidium-dev up` resynchronizes the exact source and restores its managed HTTPS route before authenticated verification.


No hosted publish, main runtime replacement, backend schema/function change, or post-fix hosted timing comparison is included. Open documents with an obsolete content version may need reloading after deployment removes those assets. Table summary/history redesign remains the documented follow-up. Raw browser traces and authentication storage are not committed.

## Source identity and commands

All 33 changed implementation/config/test files matched the remote candidate byte-for-byte; [SHA-256 inventory](source-sha256.json). Final application code is based on V42 `45426dc`; local branch subsequently fast-forwarded to documentation-only `c63294b` without application changes.

Commands ran through `presidium-dev --env performance` on CT114:

```sh
pnpm check
pnpm lint && pnpm build
pnpm exec playwright test --config playwright.reference.config.ts --output=/artifacts/v41-workers-complete --reporter=line
```

The full check passed before the final generator directory-preservation adjustment and splitting the two trace-disabled cases into their own file. The final lint/build and browser passes verify those refinements; no fresh full-suite result is claimed after that adjustment. The final checker/build includes TypeScript checking and the complete initial dependency-graph budget.

## Browser results and retained evidence

- [Workers runtime](v41-workers-complete.log): 14/14 pass, 46.3 s; actual immutable/revalidation headers, public navigation/search/cards, delayed and failed downloads, section links and reader-scroll release.
- [Authenticated HTTPS preview](v41-authenticated.log): 4/4 pass, 1.3 min; full campaign/table/session/private-draft/reconnect journey, V38 library navigation, V40 first-save persistence and V42 selection/edit/reopen. The V38 case checks unchanged document time origin, signed-in header, Foe search/details and responsive overflow at 800 px. These ran after the final build with no web restart, verifying current asset paths remain readable by Vite.
- [Shared primary navigation screenshot](v38-primary-navigation.png) and [Foes screenshot](v38-foes-library.png), captured from disposable verification accounts.
- [Full check](v41-check-verified.log), [final production build](v41-final-build.log), [final test/config lint and TypeScript check](v41-final-test-config-check.log), and [bundle metrics](bundle-sizes.json).
- [Earlier failed anchor run](v41-workers-final.log) and [trace-off geometry diagnosis](v41-anchor-diagnostic.log), retained to explain the instrumentation limitation rather than hide the failed run.

Authenticated command:

```sh
pnpm exec playwright test tests/browser/v38-library-navigation.spec.ts tests/browser/v40-unsaved-wizard.spec.ts tests/browser/v42-primary-choice.spec.ts tests/browser/journey.spec.ts --timeout=120000 --output=/artifacts/v41-authenticated --reporter=line
```

The isolated backend retained the 483-entry source seed and disposable test records. The successful journey reads persisted characters/foes/session state back through the rendered application. Neither hosted campaign data nor the shared main backend was modified.
