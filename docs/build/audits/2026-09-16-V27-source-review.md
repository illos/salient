# V27 source and rules review — 2026-09-16

Reviewer: `v27_source_review`, fresh context, no implementation edits.

## Verdict

**Pass for source fidelity and rules representation.** No blocking source finding or unresolved rules
question. This reviews the isolated `slice/V27` ingestion/reference package, edition
`6c6bbd40f2460c196511a2f0cc19b2ff9184ddee27be90245e5d5a8a915ed331`.
It does not certify undead execution, integration onto newer main, deployment or the overall final
verification gate. The separate [implementation review](2026-09-16-V27-independent-review.md) records
that gate. At closeout the lead reported a successful final `pnpm check`: 85 engine and 331 app/scripts
tests, including the 14 foe tests, followed by all remaining checks and build. This reviewer did not
independently rerun the full suite.

## Instructions and specifications read

Read worktree `agent.MD`, `CLAUDE.md`, the newer main-worktree instructions without editing main,
[build process](../README.md), [V27](../V27-undead-ingestion.md) and
[consumer contract](../../../shared/foes/README.md). Read these owning sections:

- `docs/monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15`
- `docs/monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16`
- `docs/monster-catalog-spec.md#baseline-stats-and-unresolved-values`
- `docs/monster-catalog-spec.md#features-and-supporting-rules`
- `docs/monster-catalog-spec.md#proposed-import-procedure`
- `docs/data-architecture-spec.md#35-unified-object-references-and-sharing`
- `docs/reference-library-spec.md#confirmed-library-coverage`
- `docs/reference-library-spec.md#app-wide-rule-cards`

The newer character-scope instruction does not change this explicit core-undead selection.

## Pinned source coverage

Only local Steel Compendium Git blobs at `fb83a789da8f0327a389c277a0c790b1648d5810` were used for
rules research. Read the complete Markdown for every selected source, including all feature text,
printed tables and Malice context. Independently compared the generated originals to the corresponding
JSON, Markdown and linked Markdown blobs: all 36 are exact. The common book path is
`en/books/monsters/{json,md,md-linked}/monster/undead/1st-echelon/`; suffixes below identify every
reviewed record (with the respective `.json` or `.md` extension).

| Source suffix | Abilities | Traits | Source points verified |
| --- | --- | --- | --- |
| `statblock/crawling-claw` | 1 | 1 | EV 3 for four; captain +2 speed; per-minion target; damage-dependent shift; Disorganized. |
| `statblock/decrepit-skeleton` | 1 | 1 | EV 3 for four; captain edge; per-minion target; extra target damage; complete Bonetrops. |
| `statblock/ghost` | 6 | 2 | Leader, blank role, EV 12; Haunt optional 2 Malice; Shriek trigger/cost; complete phasing and villain actions. |
| `statblock/ghoul` | 2 | 2 | Leap's size restriction and free strike; Arise's exceptions; Hunger's Charge speed bonus. |
| `statblock/rotting-zombie` | 1 | 1 | EV 3 for four; captain +1 strike damage; conditional tier 3; Death Grasp threshold and duration. |
| `statblock/shade` | 1 | 1 | EV 3 for four; captain +2 speed; compulsory tier-3 movement restriction; complete Shadow Phasing. |
| `statblock/skeleton` | 2 | 1 | Bone Shards 4/6/7 and post-tier movement damage; Bone Spur cost, potency tiers and additional bane; Arise. |
| `statblock/soulwight` | 2 | 1 | Aging appearance clause; Stolen Vitality 10 Stamina and reuse restriction; Arise. |
| `statblock/specter` | 2 | 1 | Optional 2 Malice potency increase and next-round specter consequence; invisibility/movement/visibility order; phasing. |
| `statblock/umbral-stalker` | 3 | 1 | Tier-specific shifts; Freezing Dark concealment/line-of-effect duration; free-maneuver Shadow Jump; phasing. |
| `statblock/zombie` | 2 | 1 | Clobber and Clutch's full corruption/hunger/cure consequence; Dust's pre-roll prone effect; Endless Knight restores 10. |
| `undead-malice-level-1-malice-features` | — | — | Four separate shared Malice features, full costs, timing and additional effects. |

All eleven printed envelopes, characteristics, Stamina, speed, size, stability, free strike, defenses,
movement and captain benefits agree with the emitted source fields. No missing role, movement or defense
was converted into an invented value. Source wording, including Bonetrops' grammatical errors, is retained;
there are no production corrections.

Additional local context read at the same pin:

- `en/books/monsters/md/rule/monster/encounter-value.md`: the unqualified EV belongs to one creature;
  the four-minion exception is explicit in each selected minion's printed stat block.
- `en/books/monsters/md/rule/monster/villain-action.md`: numbered villain actions are classifications,
  not resource expenditure. Ghost's 1/2/3 ordinals remain labels, with null resource cost projections.
- `en/books/monsters/md/rule/monster/malice.md`: group Malice context and basic Malice remain linked
  reading; ingestion adds no resource lifecycle or execution behavior.
- `en/books/heroes/md/rule/dice/power-roll.md`, Making a Power Roll: the comparison's `Power Roll + N`
  versus `2d10 + N` normalization preserves the printed meaning.

## Completeness and semantic boundaries

Independently checked every child record against pinned JSON, every original span against pinned
Markdown using its recorded UTF-16 offsets, every projected section in order, and every effect value
in generated visible HTML. All 40 children pass; no source-coverage diagnostics are present. The
package retains all 23 abilities, 13 traits and four Malice features with their original parent/order.

Ghost's Spirited Away retains both levitation progression and the flying/slowed/weakened clause.
Awful Wail retains the potency and post-damage winded condition. Haunt's additional target is optional
spending inside the feature, distinct from Shriek's top-level 1 Malice cost. Zombie Dust places the
prone paragraph before its roll; Clobber and Clutch retains the 5-corruption threshold and Find a Cure
consequence after the tiers. Skeleton retains both post-tier effects and full Arise exceptions.

The Grasping, the Hungry explicitly makes the affected creature take an Agility test. Its three tiers
and later 1d6 start-of-turn damage remain ordered; no attacker roll or execution is inferred from the
upstream `power_roll` property. Ravenous Horde keeps its end-of-round timing, two winded rotting zombies
per eligible hero and consecutive-round restriction. Dread March keeps its additional spending and
deferred death clause. All remain readable definitions.

IDs, parent-qualified repeated names, revision-guarded paired corrections, exact older-edition
resolution and filters preserve source meaning. Reviewed the tests' literal Skeleton counterpart and
numeric expectations against the source rather than treating passing assertions as rules evidence.
Synthetic variations are clearly separate from canonical records. No engine or live-creature support
is implied by the package or preview.

## External comparison dispositions

The only external evidence used was the authorized generated-JSON cache at Steel Cauldron revision
`eba4b8bb8bc1baf947f15e67e9e923951092fd89`. No web rules research or third-party implementation review.
Verified all 12 cached-file digests, reran comparison to a temporary report and confirmed exact equality
with the [recorded report](../evidence/V27-steel-cauldron.json): **12 explained; zero unresolved,
missing, ambiguous or error rows**. Every stat block and the shared Malice parent is accounted for.

Reviewed every reported difference and explanation against its source record:

- Four-minion EV quantity is absent externally. Preserve the source quantity 4 and amount 3; do not infer
  anything about the external encounter calculator. Ordinary EV's absent external quantity is explained
  separately; an explicit conflicting quantity requires review.
- External default `walk` differs from an absent printed movement mode. Keeping source absence is correct.
- External generic `feature` represents our parent-qualified trait or Malice kind without lost text.
- External villain-action `ability_type` and upstream `cost` contain the same printed ordinal; the local
  activation projection correctly separates that label from resource spending.
- The external Malice title splits its level qualifier into `level` and `featureblockType`; all three
  parts agree with the complete source title.
- Numeric strings/numbers, empty optional fields, keyword order, Markdown/HTML markup and effect-object
  grouping are presentation differences in these actual rows. Ordered labels, roll modifiers, tier
  values and complete effect text agree; this is not permission to ignore effect ordering or quantities.

The guarded explanations are valid for the pinned inputs. Changed numeric values, absent paragraphs,
reordered effects, altered labels, absent metadata and malformed lists require review or error in the
focused regressions. Neither agreement nor an explained difference establishes executable support.

## Verification and acceptance scope

Commands independently run:

- `pnpm exec vitest run --project scripts tests/scripts/foes.test.ts`: 14 passed, including two complete
  deterministic generations, preservation, correction, identity and comparison regressions.
- `pnpm foes:check`: passed for the reviewed edition and committed comparison coverage.
- `SALIENT_FOE_COMPARISON_REPORT=/tmp/v27-source-review-comparison.json pnpm foes:compare`: passed,
  reproducing all 12 report rows from the existing cache without fetching.
- An independent temporary Python audit read all original Git blobs and checked the exact original
  records/spans, ordered projected sections, rendered effect text and cache digests. Passed after fixing
  the audit harness's treatment of whitespace around HTML link boundaries; no application edit was needed.

V27 acceptance checks 1–5 and 8–9 are verified for source/rules meaning; check 6 is verified by the shared
lookup tests and app's use of the same package. For check 7, source completeness in generated HTML is
verified; browser interactions/theme evidence remain the independent implementation review's remit and
were not rerun here. For check 10, the focused suite and offline generation/comparison were rerun here;
full-suite, browser and integration completion remain separately recorded by the lead. No source claim
could not be grounded or reproduced. This report changes documentation only.
