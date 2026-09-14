# V13: Reference libraries: Rules, Foes, Items

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | not required |
| Depends on | S01 |
| Unblocks | None; V07 and V08 read its core/supplemental classification (soft) |
| Status | see `STATUS.md` |

## Goal

Ship the public, searchable Rules, Foes and Items references usable without joining a campaign, covering
all core rulebook content including eligible core retainers, companions, summons and items even where
not automated, with supplemental content (Summoner, Beastheart and the rest) and homebrew excluded and
the core/supplemental classification recorded per entry. Readable coverage must never disclose private
table state, and reading an item never places it in an inventory.

## Spec references

- `docs/reference-library-spec.md#confirmed-library-coverage` — three libraries, public access.
- `docs/reference-library-spec.md#confirmed-release-scope` — core only.
- `docs/reference-library-spec.md#official-content-is-not-necessarily-core-content` — classification rules.
- `docs/reference-library-spec.md#proposed-source-and-delivery-contract` — delivery.
- `docs/reference-library-spec.md#proposed-acceptance-examples` — examples to turn into checks.
- `docs/table-spec.md#monster-visibility-and-health-display` — glossary access is separate from table privacy.
- `docs/v1-tech-stack-spec.md#3-rendering-spa-baseline-ssr-remains-optional` — reference pages are SSR/prerender candidates (decision in V17).
- `docs/compendium-navigation.md#quick-lookup` — corpus layout to index.

## In scope

- Build-time index of the pinned corpus with per-entry classification: core / supplemental / excluded, with the source path.
- Search and browse UI for rules, monsters and items; entry pages rendering the pinned Markdown with attribution.
- Core source audit output listing retainers/companions/summons judged eligible and those excluded, with reasons.
- No campaign-state joins in reference queries.

## Out of scope

- Homebrew authoring, bookmarks, automation status beyond a factual supported/manual/unresolved label (`docs/v1-spec-checkpoint.md#release-scope`).
- Playable retainers/friendly monsters (deferred beyond V1).
- Loading a foe from the library into a roster (A03/V06 own that path).

## Inputs and dependencies

- Hard: S01 content pipeline.
- Soft: V05 automation coverage for the supported/manual label; until then label every entry "manual".

## Deliverables

- `content/index/` generated classification and search index; `scripts/` audit producing `docs/core-source-audit.md`.
- Reference routes and components; shared read operations.
- Tests asserting classification counts against the audit; implementation notes in `docs/reference-library-spec.md`.

## Acceptance checks

1. `class/summoner.md` and `class/beastheart.md` are classified excluded and absent from the Rules library; the nine core class files are present.
2. Searching "winded" returns `rule/health/winded.md` rendered from the pinned corpus with its source path shown.
3. An unauthenticated request can read a monster entry; the same request cannot read any campaign roster query.
4. Every entry under `chapter/retainers.md` and the retainer statblocks appears in the audit with an eligibility decision and reason.
5. The Items library shows an item's full rules text and a "manual" label; no operation adds it to an inventory.
6. Rebuilding the index from the pinned submodule produces identical classification output.

## Rules research

None for mechanics. Corpus navigation only: `vendor/steel-compendium/en/unified/md/_index/`, `chapter/retainers.md`, `chapter/the-summoner.md`, `chapter/the-beastheart-class.md` (to identify supplemental boundaries), `rule/general/retainer.md`, `rule/general/follower.md`.

## Open questions

Candidate `Q-V-n` entries from `docs/monster-catalog-spec.md#remaining-decisions`:

- Which retainers/companions/summons count as core-eligible where the corpus does not mark provenance.
- Distribution/attribution for shipped source material under the third-party notices.

## Work log

_Empty._
