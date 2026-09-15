# V13 embedded rules compendium — independent review

Reviewer: `rules_review` (fresh context, no implementation changes). Date: 2026-09-15.

## Verdict

**Pass.** All acceptance checks are verified and no blocking findings remain. The initial review
required changes because standalone pages omitted source facts stored only in frontmatter. R1 is now
resolved and independently reverified, and the refreshed repository check passed.
This review covers the explicitly authorized embedded core library assignment, including the dated
V13 work-log replacement of filesystem-path display with readable source names.

## Specifications read

- `docs/reference-library-spec.md#confirmed-library-coverage`
- `docs/reference-library-spec.md#confirmed-release-scope`
- `docs/reference-library-spec.md#official-content-is-not-necessarily-core-content`
- `docs/reference-library-spec.md#proposed-source-and-delivery-contract`
- `docs/reference-library-spec.md#proposed-acceptance-examples`
- `docs/reference-library-spec.md#implementation-note--embedded-core-compendium-2026-09-15`
- `docs/table-spec.md#monster-visibility-and-health-display`
- `docs/v1-tech-stack-spec.md#3-rendering-spa-baseline-ssr-remains-optional`
- `docs/compendium-navigation.md#quick-lookup`
- `docs/data-architecture-spec.md#35-unified-object-references-and-sharing`
- The V13 slice, project instructions and build review process.

## Findings

### R1 — high, initially blocking; resolved: frontmatter-only rules facts were discarded

The initial `scripts/ingest-rules.ts:236` retained identity, name, type and order, then discarded other
frontmatter and renders only the expanded body. Some source facts do not occur in that body:

- `en/books/heroes/md/feature/ability/fury/level-1/back.md` has `cost: 3 Ferocity`.
  `/rules/heroes/feature/ability/fury/level-1/back` contains no cost.
- `en/books/heroes/md/feature/ability/fury/level-1/brutal-slam.md` has `subtype: signature`.
  Its standalone article does not identify it as a signature ability.
- `en/books/heroes/md/treasure/1st-echelon/consumable/black-ash-dart.md` has `echelon: "1"`
  and `treasure_type: consumable`; neither is shown in its article.
- `en/books/heroes/md/kit/arcane-archer.md` has `kit_type: Magic`, absent from the body.

These were reproduced against Git blobs at `fb83a789da8f0327a389c277a0c790b1648d5810` and the
generated articles. The fix at `scripts/ingest-rules.ts:87` projects substantive source metadata
into readable prose and the search corpus. Independently checked the regenerated articles for all four
examples; cost, signature status, level, item echelon/type and kit type are now present. Source-grounded
regression assertions cover them in `tests/scripts/rules.test.ts`. The source identity and URL contract
is unchanged.

No separate blocking security finding. Public assets contain source definitions only, sanitized HTML
is rendered through the shared article view, and private roster reads still require authenticated
table access. No vendor changes or imported image tags were found.

## Acceptance checks

| V13 check | Result | Evidence |
| --- | --- | --- |
| 1. Supplemental classes excluded, nine core classes present | Verified | Core per-book allowlist and SCC namespace validation; catalog contains nine class entries; test log confirms corpus boundary assertions. Exclusion is recorded at book level in the generated audit. |
| 2. Winded search, pinned article and source display | Verified | Independently ran the browser test: search ranks Winded first, renders Stamina text, and exposes its original SCC page URL. Readable source-book display follows the dated work-log adjustment. |
| 3. Anonymous creature read; private roster refused | Verified | Anonymous Goblin Warrior browser read passed. Independently ran `tests/app/access-sessions.test.ts` after its added anonymous `table.roster` assertion: 6 tests passed. Authentication and table-access guards remain unchanged. |
| 4. Core retainer eligibility audit | Verified | Audit includes the retainers chapter and every imported Monsters entry, including retainer statblocks, with SCC identity, source path and core-book eligibility reason; Heroes summon/companion paths are also included. |
| 5. Readable items with manual resolution, no inventory write | Verified | Full Black Ash Dart effect prose renders with echelon/type context after R1's fix; article header says to resolve effects manually, and no reference component invokes inventory/gameplay mutations. |
| 6. Deterministic rebuild | Verified | Independent `pnpm rules:check`: 2,614 entries, 26 categories, no unresolved links; implementer test log confirms byte-identical independent builds. |

## Verification evidence and limits

- Independently ran `pnpm rules:check` successfully.
- Independently ran `pnpm exec playwright test tests/browser/rules.spec.ts`: **2 passed (6.3s)**.
- A later reviewer run with the added cost assertion overlapped the implementer's Playwright run;
  shared artifact cleanup caused `browserContext.close` to fail with `ENOENT` for a trace file.
  That run is not counted as passing evidence; the failure occurred during test-artifact cleanup.
  The implementer's isolated rerun with `--output=/tmp/salient-rules-final-browser-output` passed
  **2 tests (7.6s)**, including Back!'s visible cost assertion; inspected
  `/tmp/salient-rules-browser-final.log` to confirm.
- Independently ran `pnpm exec vitest run --project app tests/app/access-sessions.test.ts` after
  the anonymous roster assertion was added: **6 passed (1.29s)**.
- Inspected `/tmp/salient-rules-check.log`: complete `pnpm check` passed, with 85 engine and
  312 app/tool tests after the metadata fix, content/vendor checks and production build. This full run was supplied evidence,
  not a second reviewer execution.
- Inspected `/tmp/salient-rules-browser.log`: rules, account journey and theme regression suite,
  **6 passed (35.7s)**.
- Scanned generated articles for internal fragment destinations and image tags: no broken fragment
  links and no images. `git status --short vendor/` was empty.
- Compared representative ability, item, kit and statblock Git blobs to generated HTML. This is a
  source-fidelity review of presentation, not a new rules interpretation or gameplay automation audit.
- Original source URL shape matches the recorded upstream permalink contract. No online Draw Steel
  research was performed. The user's accepted provisional data-license uncertainty was not reopened.
- The initial standalone metadata omission was reproduced and then verified corrected. No other
  claimed check failed reproduction. This review does not certify every sourcebook sentence manually;
  it verifies automated corpus coverage, representative fidelity and the stated acceptance behavior.
