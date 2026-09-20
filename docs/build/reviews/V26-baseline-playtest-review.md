# V26 baseline playtest review

Reviewer: `v26_spec_review`. Date: 2026-09-16.

**Independent runner/evidence verdict: pass.**
**Separate pinned-source rules verdict: pass for the reported baseline.**
**V26 implementation acceptance: not passed; all eleven checks remain pending.**

This review covers the opt-in browser runner, durable
[evidence report](../evidence/V26/baseline-2026-09-16/README.md), screenshots and
[persisted readback](../evidence/V26/baseline-2026-09-16/readback.json), plus the status/appendix
updates describing them. It certifies a baseline probe of existing behavior, not new compiled
effects, a complete legal encounter, or a merge into main.

## Scope and method

Read the owning [ability designs](../V26-ability-designs.md), especially the individual live cases
and `#evidence-record-and-completion`, and the build process's
`#engine-ability-design-and-playtest-evidence`. Current table contracts for manual disposition,
source visibility and sequential correction/history remain applicable. The runner contains no
application implementation change.

The runner uses real rendered slash-command and log controls. Its setup creates approved builds
through authenticated public operations; before/after evidence comes from authorized roster,
ability-result and encounter queries. The only direct data import is the disclosed deterministic
`diceStates` fixture on the isolated runtime; accepted dice and outcomes still come from ordinary
application execution. Seed generation matches the existing server stream, without inserting
ability results or game-log events.

The revised guard checks the exact local API/site/frontend targets, anonymous deployment name and
local configured ports, and rejects deployment-key/token/self-hosted overrides in both configuration
and process environment. Import receives the explicit env file. The test is skipped unless
`SALIENT_V26_BASELINE=1`, so ordinary browser runs do not enter this target-specific workflow.
Reviewed targets are API `3234`, site `3235` and frontend `5184`; no shared-runtime operation was
performed by this reviewer.

Readback records runtime revision `f019e3a5b70766bcbff43dd718d6c5c1753267d6` and Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`. Independently recomputed the runner SHA-256:
`de8a8fdb6bb6f258e8e6989a77d70aeb3d14d8b605dad0e71ed64112af1722a2`, matching the report
and readback. Authenticated content status records the expected 467-entry snapshot.

## Evidence checked

Visually inspected log/source pairs for all ten abilities and the correction/disposition captures.
The source dialogs expose the corresponding tier/Effect text. Screenshots and saved event/result
identities agree with the report. The larger Thunder Roar capture makes the full original entry
readable; the report identifies it as a later capture of the same saved event and explains why
history controls differ. The first Thunder Roar image and restored BS7 image have partly occluded
headers; their effective-result text and corresponding saved records remain readable. No result
depends solely on an obscured header.

| Baseline case | Independently checked evidence |
| --- | --- |
| BS2 / BS3 | Dice 7+7 / 8+7; damage 8 / 15; Goblin health 15→7 / 15→0. Printed push 2 / 4 stays manual, including the lethal case. |
| SC2 | Constant damage 4 and H health 30→26; no automatic Ferocity grant. |
| BP2 / BP5 | Damage 6, H 30→24, Malice 2→0; the manual disposition retains identical roster state and does not apply bleeding. |
| BP4 | Malice 1 blocks use; before/after roster, encounter and result list are identical, with no dice on the blocked event. |
| MF3 / RF3 | Saved roll choices A / M and damage choices M / A; damage 13 / 8, Goblin health 15→2 / 15→7. Both characteristics equal 2, as disclosed. |
| PP3 | Uses the second Goblin, which did not damage H in the setup. Damage 13+2=15, kit addition 0, health 15→0; conditional rider stays manual. |
| OW2 | Damage 7, health 15→8, Ferocity 3→0; slide and the linked rider remain manual. |
| TR1 | Shared 7+6 dice with per-target modifiers yield tiers 3/1/2, damage 17/6/9 and health -2/9/6; Ferocity 6→1 once. Printed movement/order remains manual. |
| LF1 | `ability.recorded` with unknown-Triggered warning; no result row. Roster, encounter and result list are unchanged. This is a compatibility limitation, not trigger automation. |
| VF2 | Damage 5+2+1+1=9 fire, health 15→6; saved build bonuses name Enchantment of Destruction and Fire: Acolyte of Fire. Essence remains 0; push 3 remains manual. |
| BS7 | One bane retains tier 2/damage 8. After rewinding that correction, a two-bane command yields tier 1/damage 5 and health 10 with the original 7+7 dice; redo retains those values. Consecutive inline correction is explicitly not passed. |
| BS8 | One saved disposition leaves health 7; the runner asserts its removal on rewind and restoration on redo. Final readback preserves the same disposition/event identity and health. |
| Reload | Final roster equals the preceding saved state. Player readback has hidden Malice `null`; this is one audience sample, not a full privacy audit. |

These are meaningful baseline checks. The runner now asserts persisted target health, fixed costs,
unchanged conditions, blocked-use state and disposition restoration instead of treating a damage
calculation or screenshot alone as proof. The report accurately distinguishes assertions, inspected
readback and future work.

## Pinned-source rules review

After the runner/evidence review passed, checked the reported arithmetic and manual boundaries
against the pinned local sources already audited in [the specification review](V26-spec-review.md)
and linked by the design appendix. No web rules source was used. Relevant source entries are:

- Ability Roll, Power Roll Outcomes, Edge, Bane and the existing R04 damage/history contract.
- Brutal Slam, Out of the Way!, Thunder Roar and Lines of Force, including complete Effects/costs.
- Goblin Warrior's Spear Charge and Bury the Point blocks.
- Both common weapon free strikes; Mountain/Pain for Pain and Kits' bonus-inclusion rules.
- Viscous Fire, Enchantment of Destruction and Fire: Acolyte of Fire.

Damage totals, tiers, costs, optional versus fixed spending, and manual clauses are consistent
with those sources and the declared inputs. Both Elementalist +1 bonuses apply to Viscous Fire;
Mountain is already included in Pain for Pain but applies separately to qualifying other weapon
abilities. Double bane lowers the tier instead of subtracting four from the total. The evidence
does not claim calculated size-based push, legal routes, movement completion, condition execution,
or source-legal turn timing for the warned out-of-turn/repeated-action cases.

## Findings and limits

No remaining blocking finding for this baseline handoff. Earlier findings were resolved by dynamic
revision/hash capture, stronger isolated-target guards, opt-in execution, saved-state assertions,
untouched PP3 targeting and explicit disclosure of repeated/off-turn actions.

The observed loss of the second inline correction opportunity is an unresolved application
limitation, correctly recorded in the evidence report. It blocks that designed V26 workflow;
it does not invalidate an honest baseline showing the limitation. The workaround is not reported
as a pass of the intended consecutive-correction case.

All eleven V26 implementation acceptance checks remain **not verified as implemented**. Compiled
definitions/occurrences, calculated push instructions, compiler diagnostics, source mutations,
format isolation, full authority/retry coverage and the complete designed scenarios remain future
work. Compile-only examples were not played. This review does not certify usability, complete
privacy, all tiers, or a legal-turn encounter.

Inspected the successful Playwright `.last-run.json` (`passed`, no failed tests) and the author's
full-check log: 97 engine plus 335 app/tooling tests, vendor/content checks and build passed.
The author reports the focused browser run as 1 passed in 2.8 minutes. This reviewer did not rerun
the browser journey or full suite. Independently recomputed artifact identity, inspected images,
compared JSON state/results and checked documentation links/whitespace. No runner/data edits,
gameplay implementation, deployment or main merge were made by this review.
