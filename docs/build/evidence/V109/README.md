# V109 accepted evidence

- Source/implementation: `f1be170146832220d101197b4f3c8c00d8f34b88`.
- Reports/full gate: `9557080dd8a4c465aec69852e31a7f77594b52af`.
- Repaired headless proof: `254d5d236e9388a0511b70f60e391f2a83fe9e88` (application unchanged).
- Independent [rules and implementation review](../../audits/V109-rules-review.md): PASS,
  WIZARD.2, 2026-09-22. Hamstring application proof gap closed.

TESTER ran all execution gates:

| Gate | Command / selection | Result | Artifact directory |
| --- | --- | --- | --- |
| Report generation and focused coverage | Existing V64/V67/V72 generators; four changed test files | Exit 0; 67/67 | `/srv/presidium/projects/salient/test-artifacts/V109-f1be170` |
| Full check | `CI=true pnpm check` | Exit 0, 216.8 s; 402 engine + 638 app/scripts, build and all freshness/content/link gates | `/srv/presidium/projects/salient/test-artifacts/V109-9557080` |
| Isolated public API journey | `SALIENT_HEADLESS_COHORT=effect-riders node scripts/verify-character-headless.ts` with TESTER's guarded local target environment | Exit 0, 49.0 s | `/srv/presidium/projects/salient/test-artifacts/V109-254d5d2` |

The retained [headless report](headless-report.json) names the exact source and actual run. The
journey creates owned actors, admits legal builds, uses real campaign dice, and reads all seventeen
new live abilities back (seven classes, five kits, one foe). It checks source-based damage/cost,
manual riders with no rider state application, correction with retained dice, disposition,
rewind/redo, Hamstring resistance/application, the condition's source instance and save registration,
and manual condition cleanup. A single real tier is used per action: this is not three live tier
runs or a claim of automated rider execution.

Backend stopped, ports free, data retained, candidate tracked-clean on TESTER return. No browser
run. Documentation closeout does not change accepted application or runner bytes and needs no
repeat gameplay/suite execution. DEPLOY2 owns integration/publication and records its outcome.
