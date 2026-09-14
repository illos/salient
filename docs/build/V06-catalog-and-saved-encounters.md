# V06: Monster catalog, saved encounters and party strength

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | A09 |
| Unblocks | V07 |
| Status | see `STATUS.md` |

## Goal

Extend v0.01's direct catalog-to-roster loading into private, user-owned saved encounters: monster
selection with counts, prepared initiative groups, minion squads and captain assignments, a remembered
party-strength calculator with verified EV/difficulty inputs, and prepared reward items. Reopening,
duplicating and loading preserve the preparation; loaded instances are independent of the template.
The slice stops at template sharing and any other authored encounter content.

## Spec references

- `docs/table-spec.md#foes-roster` — saved-encounter v1 scope, private templates, independent live instances, replace/append.
- `docs/monster-catalog-spec.md#confirmed-requirements-and-proposed-first-scope` — catalog and first scope.
- `docs/monster-catalog-spec.md#user-visible-flow` — builder flow and preparation.
- `docs/monster-catalog-spec.md#encounter-and-engine-integration` — instantiation and difficulty calculation reuse.
- `docs/monster-catalog-spec.md#remaining-decisions` — difficulty verification, preparation UX, local corrections.
- `docs/accounts-and-access-spec.md#encounter-builder-campaign-imports` — party stub import by owner/active Director only.
- `docs/v1-spec-checkpoint.md#release-scope` — Encounters row: included vs deferred.
- `docs/v1-spec-checkpoint.md#loot-and-history` — rewards enter the stash on load, never twice.

## In scope

- Saved-encounter record: monsters/counts, initiative groups, squads with counts and captains, party-strength inputs, prepared reward items.
- Duplicate, reopen, load (replace/append) with preparation preserved; loading during running combat allowed, refused while paused.
- Party-strength calculator with sourced EV and difficulty inputs; party stubs from owned/Directed campaigns and hypothetical stubs.
- Roster comparison including all undefeated roster monsters, excluding defeated immediately.

## Out of scope

- Template sharing and homebrew monster authoring (`docs/monster-catalog-spec.md#remaining-decisions`).
- Terrain preparation (V20; `docs/table-spec.md#follow-ups-when-their-scope-is-selected`).
- Stash claims and deposits (V07); this slice only places prepared rewards into the stash on load.
- Add-visibility default on load (V14).

## Inputs and dependencies

- Hard: A09; S01 catalog with EV and organization fields.
- Soft: V02 squad model for prepared squads; until committed, persist squad preparation as data only behind `fixtures/saved-squad-preparation` and do not instantiate squads.

## Deliverables

- Convex tables and shared contracts for saved encounters and party-strength inputs.
- Registered operations: save, duplicate, load-replace, load-append, import party stub.
- `docs/monster-catalog-spec.md` implementation notes with the verified difficulty examples.
- Convex-test cases for each check below.

## Acceptance checks

1. Saving an encounter with 2 goblins in one group and a 4-minion squad with a captain, then reopening, returns identical preparation from the query.
2. Duplication produces a new template id with the same preparation and does not load monsters or grant loot.
3. Loading into a running combat creates independent roster instances; editing the template afterward leaves the instances unchanged.
4. Loading while the session is paused is refused with a logged reason.
5. Prepared reward items appear once in the Director stash after load; starting and finishing combat do not add them again.
6. Each difficulty example in the spec's implementation note is computed by hand from cited Compendium text and matches the calculator output.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/monster/encounter-value.md`
- `vendor/steel-compendium/en/unified/md/chapter/monster-basics.md`, `chapter/for-the-director.md`
- `vendor/steel-compendium/en/unified/md/rule/organization/*.md`
- Research already done: `docs/research/monster-import-audit.md`.

## Open questions

Candidate `Q-V-n` entries from `docs/monster-catalog-spec.md#remaining-decisions`:

- Required party inputs and organization/count handling for difficulty, with numerical examples.
- Preparation UX for variable stats and unresolved rules.
- Local corrections and deliberate adoption of a later official definition into a saved encounter.

## Work log

_Empty._
