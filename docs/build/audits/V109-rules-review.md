# V109 independent rules and implementation review

Reviewer: WIZARD.2. Date: 2026-09-22.
Reviewed `f1be170146832220d101197b4f3c8c00d8f34b88` against `cff8b25`, plus the report/freshness-only delta through `9557080dd8a4c465aec69852e31a7f77594b52af`.
Rules source: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.

Verdict: changes required for one persisted-effect proof gap. No blocking runtime implementation or rules finding identified.

## R1 — prove applied Hamstring Shot

`scripts/headless/effect-riders.ts:77` deliberately selects an Agility 2 target; lines 158–164 assert only resistance and skip the rest of this action's checks. The newly admitted Ranger signature therefore never demonstrates its slowed write, source-linked condition instance, or save registration. The pure kit test checks damage/section count, not those persisted effects.

Pinned `en/unified/md/kit/ranger.md`, Signature Ability / Hamstring Shot, applies slowed (save ends) at strict Agility thresholds WEAK/AVERAGE/STRONG. With the fixture's characteristic 2, these are 0/1/2. Retain the existing resisted witness and add a legal Agility −1 target, which qualifies at any rolled tier. Read back slowed, its source/use-linked instance and matching save registration through the shared API. Reuse existing condition machinery; no new mechanic is requested.

## Reviewed boundaries

- Whole Effect matching requires the exact label, no spend cost, a preceding roll, and recognition of the complete text. Unknown text and current-damage/ordering modifiers retain compatibility.
- Push-followups preserve actual pushed/vacated-square prerequisites as `after-movement`; allowance computation or disposition supplies no movement fact. Optional before/after movement remains explicit manual table work.
- After-damage readers retain the printed predicate and source text. Disposition does not award surges, spend Recoveries, move actors, apply temporary Stamina, taunt, or perform free strikes.
- Kit signature flavor is narrowly declared; damage bonuses already printed in signatures are not added again. Reviewed the 17 live entries' printed damage and Effect text against their ledger selections, including prayer/kit modifiers and Command Saber's separate Loyalty Collar section.
- Source-linked rider identities, audience-safe readback, Director-only disposition, stale-reference rejection, correction and history assertions are present. The headless journey covers the 17 advertised names, subject to R1.
- The final delta changes generated reports/documentation and adds audit freshness coverage; runtime and journey remain unchanged. Report changes must be distinguished from new grants and actual execution evidence.

No tests, builds, generators or services run by this reviewer. TESTER owns execution results. No PASS trailer issued until R1 closes.

## R1 closure — 254d5d236e9388a0511b70f60e391f2a83fe9e88

Final static verdict: PASS. The bounded delta adds a complete legal Elementalist target with Agility −1 using the printed 2/2/−1/−1 array and retains the original Agility 2 resisted witness. The added Hamstring use checks the actual rolled tier's source threshold and damage, persisted slowed toggle, occurrence-linked active condition instance, originating use/name, save-ends duration and registration identifier. Manual removal is read back as ended. This closes R1; runtime implementation is unchanged.

“All tiers” means the target qualifies whichever tier is rolled; this journey does not claim three separately executed tiers. TESTER's reported full 1040 pass is at 9557080; the repaired live journey remains TESTER-owned and was pending when this closure was written. No tests or services run by this reviewer.

Reviewed-By: WIZARD.2 (pass, 2026-09-22)
