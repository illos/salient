# V09: Forge Steel import

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | V08 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Import `.ds-hero` / `.drawsteel-hero` files from the pinned Forge Steel version into owned characters:
validate structure, map selections to SCC ids through scoped mappings, reconcile Forge Steel's
damage/Recoveries-used representation with our current values, preserve the original payload and
unmapped data, and never let imported ownership or approvals grant authority. Export is not delivered;
the adapter boundary that would allow it is preserved.

## Spec references

- `docs/character-wizard-spec.md#required-import` — formats, validation, reconciliation, snapshot as initial revision.
- `docs/character-wizard-spec.md#desired-export` — deferred; preserve the adapter path.
- `docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility` — pins, scoped mappings, no silent ambiguity.
- `docs/forge-steel-interchange.md#file-format-and-import-path` — file format research.
- `docs/forge-steel-interchange.md#current-state-is-not-simply-current-totals` — state representation.
- `docs/forge-steel-interchange.md#proposed-adapter-boundary` — adapter shape.
- `docs/forge-steel-interchange.md#first-compatibility-examples` — sample files and expected results.
- `docs/v1-spec-checkpoint.md#release-scope` — Characters row: import included, export deferred.

## In scope

- Parser for the two file extensions within a tested support range against Forge Steel pin `5a846aadb623a9855a023e9403bb887a956c341f`.
- Structural validation distinguishing malformed input from an incomplete valid draft.
- Selection mapping to SCC ids; unmapped and ambiguous entries surfaced, never guessed.
- Reconciliation of Stamina damage and Recoveries used into our current values, with the rule cited.
- Snapshot stored as the first known revision; preserved original payload; excluded content (supplements, homebrew) preserved but not enabled.

## Out of scope

- Export implementation (`docs/character-wizard-spec.md#desired-export`).
- Enabling Summoner/Beastheart/homebrew from imported data (`docs/character-wizard-spec.md#12-open-decisions`, last row).
- Reconstructing an earlier level than the snapshot beyond what the data establishes.
- Importing items into inventories beyond recording them as preserved data unless V07 has landed.

## Inputs and dependencies

- Hard: V08 (full core class choice model and SCC ids).
- Hard: `vendor/forge-steel` at its pin, read-only; `docs/research/hero-sample.json` as the first fixture.
- Soft: V07 for item placement; otherwise items stay in preserved data.

## Deliverables

- `engine/interchange/forge-steel/` adapter with import only; export stub type left in place.
- Mapping tables with scope keys; unmapped report per import.
- Tests over real sample files with expected values derived from the files and the Compendium.
- Implementation notes in `docs/character-wizard-spec.md#required-import`.

## Acceptance checks

1. Importing `docs/research/hero-sample.json` creates a character whose active build, level and derived values match a hand-derived table in the test; the original payload is stored verbatim.
2. A file with Stamina damage 5 and 2 Recoveries used yields current Stamina = max − 5 and Recoveries = max − 2, with the reconciliation rule cited.
3. A file containing a Summoner selection imports with that selection preserved as unmapped and no Summoner choice active; the wizard shows the incompatibility.
4. A malformed file is rejected without creating a character; an incomplete valid draft creates a draft, not an effective build.
5. Imported campaign references and approvals grant no membership, Director status or activation.
6. No code path claims export support.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/health/stamina.md`, `rule/health/recoveries.md`
- `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md`
- Research already done: `docs/forge-steel-interchange.md`, `docs/research/hero-parser-sample.md`.

## Open questions

Candidate `Q-V-n` entries:

- Historical Forge Steel shapes and the exact support range (`docs/character-wizard-spec.md#12-open-decisions`).
- Whether preserved compatibility data is shown to the owner or only reported (`docs/character-wizard-spec.md#required-import`, "Unmapped mechanics remain visible").

## Work log

_Empty._
