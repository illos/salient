# V25: Shared wizard for Fury and the Bethell Elementalist

| Field | Value |
| --- | --- |
| Family | V |
| Primary track | Characters |
| Owner | Character team, Codex lead |
| Milestone | First implementation slice under V08 |
| Rules review | Required, every delivered feature/trait/grant |
| Depends on | A09, R01–R03, S01, A01; V24 assessment/specification carried forward |
| Unblocks | Further classes/ancestries and first progression slice |
| Status | Verified; independent implementation and rules reviews passed; see STATUS.md |

## Goal

Preserve the existing level-one Devil/Berserker Fury and reproduce the rules-corrected level-one
Polder/Fire Elementalist Bethell, verified against an actual Forge Steel re-export, through one shared decision
system, wizard, saved revision/review lifecycle and sheet. Generalize class-specific assumptions
that prevent that result. The user authorized team implementation and complete source verification
of every feature and trait in the supported paths, plus independent implementation/rules reviews.

## Spec references

- `docs/character-wizard-spec.md#fuller-product-scope`, `#3-decision-system`,
  `#7-revision-and-review-lifecycle`, `#8-content-and-forge-steel-compatibility`,
  `#11-acceptance-scenarios`
- `docs/build/character-verification.md` — actual reference exports and independent expected results.
- `docs/character-sheet-spec.md` — sourced build/sheet, readable features and audience projection.
- `docs/v1-character-wizard-contracts.md` — existing sourced contracts and accepted rulings.
- `docs/build/V24-character-wizard-assessment.md` — evaluated gaps and proposed first outcome.

## In scope

- Shared sourced definitions for class-specific assignment, resources, choices/grants and derived
  contributions. Preserve existing Fury input/revisions or provide explicit compatible normalization.
- A complete supported Bethell path: Polder traits, the exported culture, Mage's Apprentice career
  and perk, Fire specialization, enchantment/ward, skills/languages and class abilities, with exact
  options validated by the research contract before enabling them. This explicitly includes the
  supporting ancestry/background expansion required by the example.
- Correct no-kit Elementalist baseline and readable source for every grant; explain actual applied
  passive ability modifiers without double counting. Unsupported gameplay effects remain visible
  and manual, not silently automated or mistaken for absent permanent build contributions.
- UI/headless equivalent choices and characteristics assignment, parent-change invalidation,
  preserved independent authored details, save/reload, review/activation and effective sheet.
- Content pipeline expansion required for the delivered choices, using the pinned Compendium.
- Review of the generalized structure against Beastheart companion and Summoner portfolio needs;
  preserve scoped identities/recipient boundaries and import/export information, without pretending
  those classes are implemented in this slice.

## Out of scope

- Higher-level creation/advancement/history UI, other class implementations, all alternatives in each
  newly exposed option family, broad ancestry cross-product coverage and new gameplay automation.
- Actual Forge Steel import/export adapters. The export is independent reference material now.
- Automatic conversion between incompatible heroic resources on a played character. Keep the
  existing explicit reconciliation refusal. Do not change source pins, main or the playable backend.

## Inputs and dependencies

- Existing R01 Fury selections, sourced evaluator examples, review/privacy/lock tests.
- Live Forge Steel 14.198.0 export `.playtest/forge-reference/Bethell.ds-hero`, fingerprint recorded
  in `docs/research/forge-steel-live-export.json`. Vendor reference remains 14.197.0 at its pin.
- Researcher supplies a portable normalized selection/expectation fixture and per-feature source
  ledger; expected results must not be generated from the evaluator under test.
- Main remains at `e83930e`; the six committed V24 documentation changes are carried into this
  branch as prerequisites. No uncommitted main files were copied.

## Deliverables

- Shared generalized decision/evaluation code and supported content, connected UI and backend.
- Sourced target contract, complete trait/feature/grant ledger for Bethell and regression trace for
  the existing Fury, with discrepancies against the export explicitly resolved or reported.
- Portable independent fixtures, evaluator and persisted operation tests, browser proof and screenshots.
- Independent implementation review followed by independent rules review, with repair/re-review.

## Acceptance checks

1. Recreate both supported characters through the actual wizard and headless choice path; save,
   reload and read selections, traits/features/abilities and all derived totals back. Compare
   against the independent reference contract, not values copied from our evaluator.
2. Every delivered trait, feature, perk, ability and automatic grant has a checked Compendium
   source and explicit build contribution/manual gameplay classification. Missing source or an
   unresolved mechanical mismatch blocks a claim of full verification for that path.
3. Source-verified Elementalist characteristic assignment works with one fixed characteristic;
   Fury retains its fixed pair. Partial/invalid assignments produce appropriate diagnostics.
4. A complete Elementalist requires no kit, has Essence identity and correct fixed costs, derived
   statistics and sourced passive modifiers. Fury remains unchanged on existing complete examples.
5. Change class/ancestry/parent choices: incompatible grants disappear, affected choices are
   identified, and independent valid choices/authored details remain. Unsupported choices are
   explicitly unsupported, never accepted with guessed statistics.
6. Exact-revision admission/full-edit review, stale revisions, privacy and combat locks work for
   the new build. Effective campaign state stays unchanged while an edit is pending; compatible
   live values survive activation under the cap policy.
7. Full source text is readable for all delivered grants. The new build reaches the table sheet
   without claiming unimplemented ability execution; no automatic resource grants are introduced.
8. `pnpm check` passes, with required UI browser checks on a named isolated local backend. Review
   actual persisted state and relevant history. Obtain independent code and rules review verdicts.

## Rules research

Use only the pinned Compendium for rules, including book-specific context when unified extraction
is incomplete. Read Polder, Elementalist/Fire, Mage's Apprentice, the chosen culture/skills/languages,
perk and each selected/generated ability and feature. Review the exact exported graph, not merely
its class name. Use existing Fury source contracts and independently check any affected rule.

The website/export supplies a comparison example and Forge Steel supplies structural reference;
neither supersedes the pin or case-specific user rulings. Full audit will live in the slice's
research/evidence documents. This is the user's required verification depth, not an automation
expansion or a requirement to settle unrelated class rules.

## Open questions

None at claim. Record material new ambiguities in the existing question queue and continue
independent work. Routine implementation/source research decisions need no new permission.

## Extension review: Beastheart and Summoner

The new class profiles remove Fury's fixed pair, mandatory kit, stamina and resource assumptions.
This is shared level-one support, not a complete eleven-class abstraction. Before adding the
supplemental paths, extend the following boundaries rather than flattening their grants into heroes:

- `feature/beastheart/level-1/companion.md` grants a selected companion with its own stat block.
  Give that build a stable recipient identity beneath its owning character revision. Companion
  advancement decisions belong to that recipient; they must not change the hero's characteristics
  or replace the companion's live state during a hero recalculation.
- `feature/summoner/level-1/portfolio.md` makes the circle determine the minion pool. Reuse parent
  dependencies and invalidation, but record learned portfolio entries separately from summoned
  creatures in play. Creating a build must not spawn a squad.
- Resource display names are insufficient identities: Summoner and Elementalist both use Essence,
  and Beastheart and Fury both use Ferocity. This slice preserves class and source provenance;
  before those classes become selectable, reconciliation must also compare the granting source
  and recipient, not merely the lowercase resource name.
- Namespaced decision IDs, parent ownership and source provenance preserve the input needed for
  future Forge Steel adapters. Import must map nested choices to their specific recipient and
  distinguish active selections from the export's unselected future definitions. No adapter is
  delivered here.

These are required follow-on seams in V08, with their source knowledge recorded now. V25 exercises
the reusable choice shapes and keeps the remaining companion/portfolio work explicit.

## Work log

2026-09-15 (session continuation): user authorized this slice, team implementation and complete
reference/Compendium verification. Worktree `/srv/presidium/projects/salient/characters-build`,
branch `slice/V25`, from integrated `main` at `e83930e` plus committed V24 prerequisite docs.
Backend target: new isolated local-anonymous deployment, identity/ports to be recorded after setup;
no live mutation yet. Deterministic tests are local. Lead owns slice/spec, content pipeline,
environment and integration; agents own sourced verification, evaluator/contracts and UI/backend.
Shared contract consumers: character persistence, sheet, entity projection, roll facts and table
ability metadata. Coordinate their changes in this branch; parser/foe branches are not modified.

2026-09-16: implementation is complete pending final review/acceptance. Class profiles and shared
definitions now admit Fury and Elementalist; assignment, conditional choices and parent invalidation
use the same operations in UI and headless calls. Existing Fury saved selections remain compatible.
Permanent magical rolled-damage bonuses and corruption immunity feed the existing generic table
calculators. Essence uses the source-defined outside-combat fixed-cost waiver; generation, ward
triggers, Persistent Magic and other ability effects remain manual. Condition immunity is readable
and recorded, while condition toggles remain manual overrides.

The independent audit found the original live Forge premade's Creative→Empathize choice invalid and
its duplicate fixed Magic grant missing a replacement. We retained that raw export, corrected the
three affected skill selections using the source, imported the corrected file into Forge Steel,
and exported it again. The corrected site's rendered totals, choices and full grant membership
match the independent fixture. This is a reference comparison, not Salient import/export support.
See [the complete source audit](../research/v25-character-source-audit.md) and
[corrected capture metadata](../research/v25-corrected-forge-reference.json).

Verification environment: project-local anonymous Convex at `127.0.0.1:3230` / site `3231`, browser
app at `127.0.0.1:5290`, persisted data under this worktree's `.convex/local/default`. The generic
CLI display name is `anonymous-agent`; worktree path and ports distinguish it from other tracks.
Clean actual backend push and content readback reported 467 entries at the pinned revision.
Browser output and screenshots live under `.playtest/v25*`; reference exports/rendered sheet under
`.playtest/forge-reference`. Portable independent expectations are committed under `tests/fixtures`.

Initial complete test groups passed (96 engine, 321 app/scripts), with links, vendor and content
checks passing; production build passed separately after an interrupted aggregate run. A further
Fury fixture regression was added and independently passed. The corrected Elementalist browser
journey passes creation, named characteristic assignment, save/reload, admission and sheet access,
including opening every delivered trait/feature/perk/ability source. Final consolidated results and
review verdicts are recorded below after the remaining checks complete.

Final verification, 2026-09-16:

- `pnpm check` — exit 0, 97 engine tests and 321 app/scripts tests, lint/typechecks,
  Markdown links, source pins, deterministic content and production build passed.
- `SALIENT_TEST_URL=http://127.0.0.1:5290 pnpm exec playwright test tests/browser/v25-elementalist.spec.ts`
  — passed in the final combined run, including every delivered grant's readable rule link.
- `SALIENT_TEST_URL=http://127.0.0.1:5290 pnpm exec playwright test tests/browser/wizard.spec.ts`
  — passed in the final standalone run (2.3 minutes), including Fury creation/review, three
  sheet audiences, actual headless table operations, correction/undo/redo, reconnects, 60 reactive
  condition updates, closeout and persisted values after session restart.
- An existing performance assertion sampled zero DOM rows before reactive updates settled.
  A bounded retry now retains its original positive-count, maximum-50 and eventual-exact-50
  invariants. This was a test synchronization fix; the production log implementation is unchanged.
- Final logs: `.playtest/v25-check-final.log` and `.playtest/v25-fury-browser.log`, each with
  an exit-0 sentinel; `.playtest/v25-browser-final.log` contains the Elementalist pass and the
  superseded Fury sampling failure. Earlier backend interruption and resource-contention failures
  are retained as superseded evidence, not counted as successful checks.


### Closing review, 2026-09-16

The [independent implementation review](../reviews/V25-implementation-review.md) and subsequent
[fresh independent rules review](../reviews/V25-rules-review.md) both passed. The rules reviewer
checked all 108 source-ledger records and independently recalculated static totals and damage.
The corrected Bethell Forge export verifies active grant membership and captured sheet totals;
Fury remains an independently source-audited regression. Uncaptured Forge damage cards and
recorded reference metadata/text differences are not claimed as exact parity.

All V25 acceptance requirements are complete. This delivers the two supported level-one paths;
the eleven-class, levels 1–10 track and eventual Forge Steel import/export remain recorded future
work. Class-specific resource generation, persistent effects, wards and movement remain manual.
The implementation is isolated on `slice/V25`; integration into `main` and the user's playable
environment belong to the integration handoff.
