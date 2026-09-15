# A05 independent implementation and rules review — 2026-09-15

Reviewer: `review_a05`, fresh agent context. Baseline `3b06832` plus the current A05 audit repairs.
Rules source: local Steel Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810` only.

## Findings and source checks

1. **Blocking, reproduced and repaired:** committed combat waiting for initiative (`roll` / `choice`) was
   reported as FreePlay by `allowanceFor`. Thunder Roar with zero Ferocity therefore executed and
   rolled instead of blocking. Independent persisted regression:
   `tests/app/a05-review-regressions.test.ts`; observed `ability.use`, expected `ability.blocked`.
   [Combat commitment](../../table-spec.md#confirmed-initiative-setup-and-shared-presentation) starts combat at
   OK before initiative. The source `feature/fury/level-1/ferocity.md` waives costs **outside**
   combat only; [R04 affordability](../../roll-and-damage-resolution.md#9-affordability) requires
   available resource in combat. Repair must preserve combat identity before turns begin and
   retain ordinary off-turn warnings. No new ruling is needed.
2. **Blocking, repaired by implementer:** `abilities.results` exposed foe temporary Stamina
   before/after values in numerical mode. Its new persisted regression checks both player and
   observer responses while retaining Director values and public ordinary numerical Stamina.
3. **Blocking, repaired by root:** public Malice payload projection compared `Malice` to the parser's
   normalized `malice`, leaking before/after pools and blocked pool values. Root owns the
   case-normalized shared projection. Independent persisted tests now exercise actual Bury the
   Point payment (47 → 45) and refusal at 1 Malice for both peer audiences, then enable disclosure.
4. **Important, repaired by root:** results called full history loading twice per result (up to 100
   results). Root now batches the shared correction/manual windows once per query. This is an
   avoidable repeated-read defect; live latency/Convex-limit verification remains acceptance work.

Independent local source reads included `rule/dice/natural-roll.md`, `rule/dice/ability-roll.md`,
`rule/combat/critical-hit.md`, `rule/combat/turn.md`, `rule/damage/damage-immunity.md`,
`rule/damage/damage-weakness.md`, `rule/monster/creature-free-strike.md`,
`feature/common/maneuvers/catch-breath.md`, `feature/ability/fury/level-1/make-peace-with-your-god.md`
and `kit/mountain.md`. They support natural 19/20 tier precedence, independent printed damage
choices, fixed 5-Ferocity payment for the effect-only ability, ordinary action tracking, immunity
ordering and nonrolling creature free strikes. Mountain's own 3/5/13 + M-or-A signature already
includes its kit bonus; its conditional effect remains manual. Unknown modifier cells remain
manual rather than silently inferred zero.

Q-R-1, Q-R-2 and Q-R-3 are answered in the owning R04/table specifications. Q-R-100–103 are
answered build decisions, not new runtime questions. Q-A-601 gates player corrections through
the existing undo setting. Q-A-200's temporary supplied-facts override must not replace the
admitted baseline. Broader critical opportunity lifetime/chaining and unique resource reuse
remain explicitly limited; this review does not invent rulings for those cases.

## Verification

Initial focused run: 57 tests passed (engine resolve, app abilities, audience and history).
Re-run with new audience and root history regressions: 62 passed, one root test fixture assertion
failed (`entryIds` instead of the actual group member field); root corrected that test.
Final post-repair run: **66 tests passed across six files**, including both preinitiative phases
and the persisted Malice audience checks. `tsc -p tsconfig.web.json` passes. The former root
history fixture failure is resolved.

Verdict: **PASS for the reviewed A05 repairs and their pinned-source rules pass**, subject to the
root's final integrated/browser checks. The preinitiative repair was authored by this reviewer
after independent reproduction and needs root cross-review. No additional rules question was
raised. Browser/visual acceptance is coordinated by the root agent and is not claimed here.

Existing limited scope: critical opportunities are verified for the immediate ordinary
main-action path. The broader lifetime/chaining/off-turn contract is still explicitly unsettled
in the table specification; current offers persist across turns until consumed or closed with
combat. This review does not certify that as a generalized source-faithful lifetime.

Root cross-review: inspected the preinitiative allowance repair against committed encounter state and the existing fixed-cost contract, and reran its persisted regression with the history/closeout repairs (9 integration tests passed). Keeping roll/choice phases in combat prevents waiver and retains encounter association without inventing an active turn. Repair passes independent cross-review.
