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
- ENGINE final static PASS `fd7a17d`, including combined reports: 23 reachable compiled /1433 compatibility /0 unavailable; [written review](audits/V105-talent-rules-review.md). No tests run by reviewer.
- TESTER job `test-V105-fd7a17d-3`: `CI=true pnpm check` exit 0 /200.5s, **998 tests (395 engine +603 app/scripts)** plus all content/link/vendor/report/build gates.
- Isolated `SALIENT_HEADLESS_COHORT=talent node scripts/verify-character-headless.ts` exit 0 /80.4s: five source builds and all 58 action entries, negative Clarity payment/readback and floor refusal, signed manual adjustment, zero crossing and free signature while strained; manual strain records leave state unchanged. Backend stopped, ports free, data retained, checkout clean/released. Artifacts `/srv/presidium/projects/salient/test-artifacts/V105-fd7a17d`.
- Rebased only over V104 publication documentation at main `65df23c`; `git diff fd7a17d..2eef728 -- . ':(exclude)docs' ':(exclude)deploy.md'` is empty. Accepted runtime/generated content/tests unchanged; no rerun required.
- Ready for DEPLOY2 main/cloud/GitHub promotion with accepted tests reused; no smoke requested.

## Publication — 2026-09-21

DEPLOY2 fast-forwarded reviewed `465814b` into main and published the backend, 1483-entry content
snapshot and frontend. Backend/schema validation, hosted build and upload succeeded.
Worker: `ef7da151-f04d-4bc8-8532-12aedb937290`. Accepted 998-test gate and isolated
five-build/58-action results were reused; no smoke test or test rerun. Release logs:
`/srv/presidium/projects/salient/test-artifacts/V105-release-465814b`.
