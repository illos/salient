# V105 — Talent level one

## Goal

Complete level-one Talent choices, shared grants and safe Clarity spending.

## Scope

Pinned `class/talent.md`, `feature/talent/level-1`, `feature/ability/talent/level-1`:
three traditions, five augmentations, four wards, two of eight signatures and one each
3-/5-Clarity ability. Mindspeech, fixed skills, three arrays; no kit. Density/Speed/Force derive.
Clarity payments and Director adjustments permit the source floor -(1 + Reason). Strain,
resource generation, turn-end damage, outside-combat timing, reactive wards, spatial/equipment
and range effects remain source-explicit manual actions. Awe ally/enemy and Smolder type branches
record wholly manual to prevent incorrect damage. No higher-level grants.

## Acceptance checks

Independent pinned ledger covers all choices, source costs, damage and every embedded use;
shared authenticated creation/pruning/readback, negative resource floor and crossing-zero proof,
manual strained effects without fabricated automatic damage. ENGINE review; TESTER generators,
full check and isolated cohort; DEPLOY2 publication reuses acceptance.

## Work log

- Started from main `33d18be` while V104 tests run; integrate after V104 lands.
- Independent ENGINE source audit retained under audits. No full tests or live stack run by author.
- Authoring at `8e7ee49`: ENGINE found no blocking implementation findings; final proof review pending. Both TypeScript projects and touched lint passed.
- TESTER generated 1483 content entries at `8e7ee49`; all three generators exit 0. Artifacts `/srv/presidium/projects/salient/test-artifacts/V105-8e7ee49-generation`.
- Independent source ledger `tests/fixtures/v105-talent-expected.json` supplies five builds covering all options, 23 source abilities and 35 embedded actions. Focused evaluator/resource-floor file 2/2 passes. Public journey checks source costs, manual state, all 58 uses, admission/edit separation, negative adjustment rejection, crossing zero, payment at the -3 floor, and free signature plus manual strain while already negative. Source expected values do not come from the evaluator.
- Rebased onto reviewed V104 `d1d451b`; preserved both class adapters, typed Hurl route, manual roll guards and runner cohorts. ENGINE bounded static PASS `cc4115e`. Both TypeScript projects pass after integration.
- TESTER regenerated the combined manifest/reports at `cc4115e`, all generators exit 0; 1483 entries. Artifacts `/srv/presidium/projects/salient/test-artifacts/V105-cc4115e-generation`.
