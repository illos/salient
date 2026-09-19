# V41 independent implementation review

Reviewer: `v41_review`, 2026-09-19. Reviewed the working V41 implementation in
`slice/V41`, initially against `af69671`, then after integration of V42 `45426dc`
and documentation-only `c63294b`. This reviewer authored no application or test changes.

Verdict: **pass — implementation acceptance**. All six V41 acceptance checks are
verified within the stated isolated-runtime scope. No unresolved blocking finding.
This verdict does not certify a main merge, shared-runtime update, hosted publication,
or post-change hosted latency.

## Specifications and evidence read

- [Reference loading and navigation](../../reference-library-spec.md#reference-loading-and-navigation--2026-09-19)
- [SPA rendering baseline](../../v1-tech-stack-spec.md#3-rendering-spa-baseline-ssr-remains-optional)
- [Confirmed ingestion requirements](../../monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15)
- [V41 deliverables](../V41-reference-performance.md#deliverables-and-verification)
- [Review standard](../README.md#review-standard), project `agent.MD`, `CLAUDE.md`, and supplied `AGENTS.md` instructions.

Inspected the generators, Rules/Foes contracts and delivery clients, worker request dispatch,
search algorithms, streamed article renderer, card navigation, router boundaries, CSS,
build budget, and affected tests. The changes preserve pinned source identities and existing
rule semantics; a separate rules review is not required.

Read the [full check log](../evidence/V41/v41-check-verified.log),
[final lint/build](../evidence/V41/v41-final-build.log),
[final test/config lint and types](../evidence/V41/v41-final-test-config-check.log),
[14-test Workers result](../evidence/V41/v41-workers-complete.log),
[four authenticated journeys](../evidence/V41/v41-authenticated.log),
[emitted sizes](../evidence/V41/bundle-sizes.json), and
[evidence record](../evidence/V41/README.md).
Also read the retained [failed tracing run](../evidence/V41/v41-workers-final.log) and
[controlled anchor diagnostic](../evidence/V41/v41-anchor-diagnostic.log).
Visually inspected the authenticated [Campaigns header](../evidence/V41/v38-primary-navigation.png)
and [Foes header/list](../evidence/V41/v38-foes-library.png).

Independently recomputed local SHA-256 values for all 33 files in the
[remote source inventory](../evidence/V41/source-sha256.json): all match.
Independent read-only inspection of the pinned Foe JSON confirmed 2,507 objects map exactly
once into 501 root-plus-feature groups; every parent/feature/supporting reference resolves,
and every object's usage matches the previous search projection.

## Acceptance checks

1. **Verified.** Rules and Foes render shared primary navigation without an authentication gate.
   Public Worker and authenticated V38 journeys preserve `performance.timeOrigin` across navigation.
   Tests cover public mobile layout and authenticated 800px overflow; inspected screenshots show
   consistent account controls on Campaigns and Foes. Existing table/wizard shells retain their headers.
2. **Verified.** Non-entry page imports are lazy with suspense and error boundaries. The build checker
   traverses all static imports from each entry, rather than measuring only the entry file.
   The final initial JS closure is 490,191 decoded bytes / 160,921 gzip bytes, compared with
   458,779 gzip bytes in the recorded baseline. The full account/campaign/session/reconnect journey
   and integrated V40/V42 wizard journeys pass after route splitting.
3. **Verified.** Catalogs retain 2,614 Rules entries and 2,507 Foe objects. Browsing loads metadata
   first, excerpts by visible listing, and Foe details on opening. The browser checks initial request
   absence, delayed detail availability, original source links, and parent/feature/Malice/Rules traversal.
   Rules tests reconstruct every article byte-for-byte from its delivery parts. Large chapters remain
   usable while continuations load or fail, and retry retains their initial content. Final maximum
   initial Rules payload is 415,705 raw bytes, continuation 135,780, and Foe detail 55,297; the 128 KB
   split target is not misrepresented as a strict limit on indivisible elements or heading metadata.
4. **Verified.** Build-time serialized indexes participate in version hashing. Workers deserialize and
   persist across reference routes; request IDs and hook cleanup prevent stale completions from updating
   later views. Tests cover every unique exact Rules title, representative Foe serialized-search parity,
   typo search, filters, empty/cleared queries, failed-index retry, and one index request across returns.
   Full-text assertions wait past provisional title matches. Final worker relevance remains unchanged.
5. **Verified on compatible preview.** Passing tests use Wrangler 4.134.0 and actual local Workers
   static assets. They assert a revalidating/nonpersistent HTML policy, exact revalidation headers on
   both current catalogs, and one-year immutable headers on hashed JS and both libraries' versioned
   index/detail assets. No Vite-injected cache headers substitute for this check. Hosted headers after
   deployment are outside this verdict.
6. **Verified.** Full `pnpm check` passed 676 tests: 274 engine and 402 app/scripts, plus lint, types,
   documentation links, pinned-source/content checks and build. Subsequent directory-preservation and
   browser-file refinements received final lint/types/build and 14 passing Worker browser cases;
   four authenticated regression journeys also pass. Final lint/types also passed after the test-file
   split. This report completes independent review.
   A new full-suite execution after those final refinements is not claimed.

## Findings by severity

No unresolved blocking findings.

- **P2, resolved:** shared navigation left article anchor and TOC offsets sized for one header.
  `web/rules/rules.css:770` and `:774` now include measured navigation height; the sidebar breakpoint
  matches the search bar. Browser assertions verify the target below both headers.
- **P2, resolved:** `tests/browser/v38-library-navigation.spec.ts` referenced removed library-specific
  links and an ambiguous status element. It now uses shared navigation, scopes the result count, and
  verifies document identity and authenticated responsive layout.
- **P2, resolved:** later article parts inserted before a requested anchor could displace it.
  `web/rules/article.tsx:31` retains the section through insertion until reader input releases control.
  Both late-anchor stability and reader-scroll release pass in the final production-bundle tests.
- **Verification correction, resolved:** the original delayed-search test could cancel its debounce
  before any request began. It now waits for interception; retry/persistence assertions also wait for
  completed full-text results rather than accepting provisional title matches.
- **P3, nonblocking documented limit:** `web/foes/content.ts:18` and `web/rules/content.ts:14` retain
  catalogs for the document lifetime, while generators prune obsolete version directories. An open
  document may need reloading after a content-version replacement. Cross-deployment old-asset retention
  is explicitly excluded from this slice's claims.

## Verification limits

The implementer ran runtime checks on isolated CT114 `performance`; this reviewer independently read
source, assertions, logs, screenshots and hashes without repeating runtime workloads. Remote hash
collection is implementer-reported; local matching was independently checked. No server, dependency
installation, build or browser workload ran on Presidium.

The giant chapter produced a tracing-associated tab crash in the constrained browser runner. The same
production bundle passed the controlled case with tracing off; the diagnostic recorded the requested
heading near 157px after successive insertions. Only the two giant-anchor cases disable DOM tracing;
real layout assertions and failure screenshots remain. The precise low-level resource failure was not
independently established by this reviewer. The failed run is retained and not counted as a pass.

The Rules full-text index is 1,411,557 gzip bytes, larger than the former corpus download. Immediate
catalog title matches help first-search usability, but download/deserialization still costs time.
The review confirms emitted-byte reductions and functional behavior, not a new hosted timing benchmark,
mobile hardware performance, or long-session memory profile. Backend/table redesign remains feedback only.

Chords could not uniquely map this child session. No sender identity was guessed; findings were delivered
to the parent, which owns project coordination and any subsequent integration/runtime delivery.
