# V26 specification review

Reviewer: `v26_spec_review`, independent of the specification author. Date: 2026-09-16.

Scope: the proposed [V26 slice](../V26-compiled-ability-effects.md), its owning-spec link in
`docs/rules-language.md`, the V05 precursor note, and the V26 status row. Reviewed in
`/srv/presidium/projects/salient/engine-parser-spec`, branch `slice/V26`, based on `e83930e`.
This is specification review only; no V26 implementation is certified.

## Independent design verdict: pass

No blocking findings. The proposal is bounded and implementable against the existing application.
The design verdict was established before the separate pinned-source rules review below.

- The first useful boundary connects complete source envelopes to typed effects, the existing
  shared damage resolver, persisted results and visible history. It addresses parser/engine
  integration directly, without requiring a replacement runtime or general scheduler.
- `shared/resolve/index.ts` already owns damage expressions, roll resolution and corrections.
  `convex/lib/resolve.ts` already adapts standalone, embedded and kit sources.
  `convex/lib/abilityOperations.ts` already owns use, correction and manual disposition;
  `convex/lib/history.ts` supplies historical ID aliases and journal restoration. The proposed
  integration seams exist. Occurrence IDs and versioned definition snapshots are additions,
  not claims about current implementation.
- Full-envelope checks, source/projection mismatch tests and explicit dependency classification
  prevent recognized tier fragments from certifying an unsupported ability. The compatibility
  adapter is restricted to unchanged existing definitions and cannot silently accept changed
  source. Its separate reporting keeps that transition reviewable.
- Calculated push allowance remains distinct from actual movement and final movement eligibility.
  Unknown modifiers produce explicit missing/manual work. No routine confirmation, movement
  report, blanket pending-work gate or cross-user response workflow is introduced.
- Per-occurrence manual disposition, retained dice, sequential correction boundaries and saved
  undo/redo state preserve the existing table contract. Public used-action source remains
  separate from private full stat blocks.
- Header dependencies are committed in `STATUS.md`. V04/V02 mechanics are explicitly excluded;
  V05 retains its original dependency gate. V22 is evidence rather than an unmerged code
  dependency. The work log identifies a short-lived slice branch and concurrent consumers;
  there is no permanent track branch or deployment authorization.

### Owning sections read

- `docs/rules-language.md#proposed-implementation-model`
- `docs/engine-architecture.md#from-rules-text-to-executable-behavior`
- `docs/engine-architecture.md#structured-effects-are-the-common-contract`
- `docs/engine-architecture.md#knowledge-of-rules-and-knowledge-of-the-board`
- `docs/roll-and-damage-resolution.md#4-tier-outcome-to-damage`
- `docs/table-spec.md#inline-interaction-cards-in-the-game-log`
- `docs/table-spec.md#director-edits-to-inline-results`
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control`
- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`

Also read the main checkout's `AGENTS.md`, `agent.MD`, `CLAUDE.md`, roadmap, kickoff and
`docs/build/README.md`; the worktree's dependency tracker, V05 diff, source-navigation guidance
and relevant existing adapter/history code. Main-checkout coordination edits were not copied or edited.

### Acceptance assessment

Each numbered check is a future implementation requirement. All ten are **not verified as
implemented**, appropriately for this specification-only assignment. The table records the
separate specification assessment; no unbuilt behavior is counted as a failed implementation test.

| Check | Specification assessment | Implementation status |
| --- | --- | --- |
| 1. Hero end to end | Concrete actor/target facts, dice, damage, saved Stamina and movement allowance; arithmetic grounded below. | Not verified; future acceptance. |
| 2. Monster/minion boundary | Exercises a second source format and separates parse fragments from unsupported minion execution. | Not verified; future acceptance. |
| 3. Arithmetic regression | Names existing shared arithmetic and command behavior that integration must preserve. | Not verified; future acceptance. |
| 4. Generality | Renaming/numeric mutation tests rule out ability-name handlers; duplicate clauses test distinct occurrences. | Not verified; future acceptance. |
| 5. Lost mechanics | Unknown paragraphs, extra rolls and contradictory projections test whole-envelope safety. | Not verified; future acceptance. |
| 6. Sequencing | Contrasting area/order and slide/rider examples prevent an overbroad push grammar. | Not verified; future acceptance. |
| 7. Facts/reduction | Covers size, keywords, stability, unhandled modifiers/conditions and lethal damage while retaining manual consequences. | Not verified; future acceptance. |
| 8. Correction/restoration | Concrete retained-dice recalculation and state reconciliation, plus a later-disposition rewind gate. | Not verified; future acceptance. |
| 9. Retries/access/history | Checks duplicate and fresh commands, stale revisions, occurrence/target binding, authority and source privacy. | Not verified; future acceptance. |
| 10. Connected evidence/report | Requires pure/shared tests, isolated persisted headless/browser evidence, reproducible reports and implementation reviews. | Not verified; future acceptance. |

## Pinned-source rules verdict: pass

No unsupported numerical or semantic claim found in the reviewed specification. All Draw Steel
research used local Steel Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`;
`git submodule status` confirms the worktree pin. No online rules source was used.

Paths in the following table are relative to `vendor/steel-compendium/en/unified/md/`.
Full cited ability/stat-block entries and general forced-movement, size, stability and ability-roll
rules were read, including the final lethal-damage addition to acceptance check 7.

| Claim checked | Source and result |
| --- | --- |
| Damage before effects; presentation order | `rule/dice/ability-roll.md`, Characteristics and Damage and Abilities With Damage and Effects: tier damage is dealt to all targets before tier effects unless specified otherwise; multiple effects follow printed order. The spec preserves exceptions. |
| Printed Brutal Slam tiers | `feature/ability/fury/level-1/brutal-slam.md`: damage constants 3/6/9 plus Might, push 1/2/4, Melee and Weapon keywords. |
| Hero fixture | `class/fury.md` gives starting Might 2. `kit/mountain.md` gives +0/+0/+4 melee damage. `chapter/kits.md`, Damage Bonuses and Kit Signature Ability, supports the keyword bonus and already-included signature distinction. |
| Default size | Book-specific `en/books/heroes/clean/Draw Steel Heroes.md`, line 1501, Starting Size and Speed, read with `git show`: ancestry default size 1M. The devil entry supplies no size replacement. |
| Goblin fixture and adapter | `monster/goblin/statblock/goblin-warrior.md`: size 1S, Stamina 15, stability 0; Spear Charge damage 3/4/5; Bury the Point preserves its separate tier potency/bleeding/save wording. |
| Size-based allowance | `rule/character/size.md` orders 1T, 1S, 1M, 1L, 2 and larger sizes. `movement/forced-movement.md`, Big Versus Little, adds one for larger-to-smaller melee weapon movement. Printed push 2 therefore yields 3 in the specified 1M-to-1S fixture, and 2 for equal size. |
| Optional reduction and physical movement | `rule/character/stability.md` permits reduction up to stability; it does not require full subtraction. `movement/forced-movement.md` permits shorter/zero movement and defines ordinary straight-line push away from its source. Flying/slope and other exceptions remain manual. |
| Lethal damage | `movement/forced-movement.md`, Slamming into Creatures and Death Effects and Forced Movement, preserves relevant movement/collision behavior after lethal damage and places movement before death-trigger effects. The new check preserves the instruction without pretending to execute those consequences. |
| Sequencing counterexamples | `feature/ability/fury/level-1/thunder-roar.md` specifies nearest-target-first movement in its area. `feature/ability/fury/level-1/out-of-the-way.md` has slide plus linked voluntary movement/damage. Neither is equivalent to independent ordinary push execution. |
| Compile-only minion example | `monster/goblin/statblock/goblin-spinecleaver.md`: Axe tier 2 is 4 damage then push 3; target text is per minion, with minion organization and captain context. The spec retains those prerequisites and makes no live minion claim. |
| Edge/bane correction | `rule/dice/edge.md` and `rule/dice/bane.md`: one modifier changes the total by two; double modifiers instead shift a tier. The proposed second bane correctly shifts the original tier 2 to tier 1. |

Independent arithmetic for checks 1 and 8:

- Initial: `7 + 7 + 2 = 16`, tier 2; damage `6 + 2 + 0 = 8`; Stamina `15 - 8 = 7`;
  push allowance `2 + 1 = 3` before optional reduction.
- One bane: `14 + 2 - 2 = 14`, still tier 2; damage/Stamina/allowance are unchanged.
- Two banes: unpenalized total 16 gives tier 2, shifted down to tier 1; damage `3 + 2 + 0 = 5`;
  effective Stamina `15 - 5 = 10`; push allowance `1 + 1 = 2`.

These values assume the expressly prepared fixture. They do not certify arbitrary Fury traits,
conditions, equipment substitutions, movement routes or triggers. Test mutations are parser fixtures,
not newly authorized game content.

## Evidence and limits

- Inspected `.playtest/v26/check-final.log`: 85 engine tests and 317 app/tooling tests pass,
  followed by link/vendor/content checks and the application build. This is the author's recorded
  unchanged baseline, not a reviewer rerun or evidence that V26 exists.
- Independently counted 22 `kind: ability` entries in the current generated content manifest.
  Embedded Goblin abilities and the compile-only Spinecleaver remain separate report populations.
- The earlier timeout and timestamp-substring failure were disclosed by the author. This review
  did not rerun those failures or the full suite; no additional test-success claim is made for them.
- No implementation, live backend journey, browser journey, generated V26 support report or
  persisted V26 effect record exists to reproduce in this assignment. The specification says so.
- No blocking findings, decision requests, application edits, vendor edits or deployments.

## Amendment review — 2026-09-16

Reviewer: `v26_spec_review`. Verdict: **pass**. No blocking findings.

Reviewed the subsequent uncommitted changes to `docs/build/README.md`,
`docs/development-process.md`, `docs/build/_template.md`, `docs/build/V26-compiled-ability-effects.md`
and `docs/build/STATUS.md` against the user's requirement for every engine ability to have a
source-backed design, then an actual in-app playtest with screenshots correlating game-log output
to source, with visible progress.

- The process requires design before implementation and rendered-app evidence afterward for
  every built or changed ability, including shared-handler and adapter changes. Representative
  examples cannot substitute for the affected-ability inventory.
- Acceptance requires real table controls or the in-app palette, an isolated backend, durable
  screenshots, same-run event identity and persisted readback. Expected source calculations,
  observed output, setup, accepted dice and limitations must be connected explicitly. Pending
  or failed evidence blocks implementation acceptance.
- Designed, built and playtested states remain separate. V26's grouped candidate rows are
  explicitly provisional and must be expanded before implementation. Compile-only examples
  cannot count as live support. Existing abilities marked "No V26 change" do not claim that their
  earlier implementation is absent.
- One owning process section, slice-local records and the existing status tracker provide the
  required visibility. Links from the template and development principles avoid separate
  tracking systems. Reusable mechanics tests remain reusable; no user approval queue or new
  CI enforcement is claimed.
- Mechanical scope and expected numbers are unchanged. All V26 implementation, live playtests
  and screenshot evidence remain pending. This amendment therefore needs no renewed rules
  research or gameplay verification, and does not certify an actual app run.

Review validation is limited to the documentation diff and its consistency with the requirement;
the previous full-check baseline was not rerun. The original implementation acceptance statuses
above remain unchanged; amended check 10 strengthens the future evidence gate.

## Per-ability finalization review — 2026-09-16

Reviewer: `v26_spec_review`, independent of the author. Reviewed the uncommitted finalization of
`docs/build/V26-compiled-ability-effects.md` and the new `docs/build/V26-ability-designs.md`,
including the author's repairs below. The specification branch remains at `be5995b` before this
documentation change; the integration audit reads main `14b7536` without changing either checkout.

### Independent design verdict: pass after repairs

No remaining blocking findings. Reviewed design first, then pinned-source mechanics; rechecked
the repaired scope and compatibility behavior before issuing the final rules verdict.

The exact envelope, bounded potency-remainder syntax, and compiler/compatibility result isolation
are implementable. Full-source checks still prevent silently admitting extra sections, target
restrictions or effects. Legacy records retain their existing reads and manual controls; only
compiled records gain occurrence-addressed effects. The spec preserves current authority,
minimum-input policy, sequential correction/history and source audiences.

Independently inspected the integrated manifest and all 48 standalone entries' targets, roll
structures and additional sections, plus the existing Goblin source. The report populations of
48 standalone entries, 25 kits and two Goblin abilities are consistent with main. Structural
matching and live grant availability are separate: six compiled live abilities, four compatibility
live regressions, and three compile-only comparisons. The final audit must still be repeated
after rebase and against actual implementation changes; this is not a future-code certification.

The appendix gives individual source mappings, accepted inputs, expected arithmetic/state and
live proof requirements. Brutal Slam explicitly covers lethal damage, correction, manual disposition
and sequential undo/redo. Viscous Fire exercises integrated V25 modifiers and typed damage.
The final design requires ten individual live proofs and preserves honest compile-only status
for Meteoric Introduction, Ray of Agonizing Self-Reflection and Spinecleaver Axe.

#### Findings resolved during this review

1. **Blocking, medium — unavailable live fixtures.** The initial Meteoric/Ray designs required
   legal selection through the integrated wizard. At main `14b7536`,
   `shared/content/level-one-decisions.ts:396` offers only Bifurcated Incineration and Viscous Fire
   as Elementalist signatures; `convex/lib/resolve.ts` builds live ability lists from evaluated
   grants. The repaired appendix makes Meteoric/Ray pure comparisons, records the missing grant
   prerequisite and requires future live promotion/evidence without expanding V26's character
   scope. The owning inventory, audit and check 11 now agree. **Resolved.**
2. **Blocking, medium — overstated compatibility action tracking.** LF1 initially implied
   tracked triggered-action use. Main's `convex/lib/resolve.ts:98` does not normalize printed
   `Triggered` to `triggered action`; the recorded path in
   `convex/lib/abilityOperations.ts:932` therefore skips allowance tracking. LF1 now requires
   the existing manual action-type warning, unchanged allowance, no ability-result row and no
   new occurrence/disposition control. No incidental action-type fix is introduced. **Resolved.**

### Pinned-source rules verdict: pass

All research used local Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` only.
Rechecked the expanded appendix against full ability entries and the general rules named in
its shared source contract. Prior source findings above remain applicable to unchanged claims.

| Ability/case | Independently checked expected result and source basis |
| --- | --- |
| Brutal Slam | Printed 3/6/9 + Might, Mountain +0/+0/+4 and size bonus give damage 5/8/15 and push 2/3/5. Tier 3 retains movement after lethal damage. BS7 keeps accepted dice and correctly changes effective damage 8→5, health 7→10 and allowance 3→2 with double bane. |
| Spear Charge | Goblin Warrior's printed constant damage is 3/4/5, giving H health 27/26/25. Temporary Stamina 3 absorbs the first 3 of tier-2 damage 4, leaving ordinary Stamina 29. No characteristic or roll bonus is added to damage. |
| Bury the Point | Printed damage 5/6/7, cost 2 Malice and tier-specific Might thresholds 0/1/2 are retained. H's Might 2 satisfies none of those strict inequalities, but the app deliberately leaves potency unexecuted. Disposition does not apply damage, bleeding or saves. |
| Melee Free Strike | Printed 2/5/7 plus characteristic 2 and applicable Mountain bonuses gives 4/7/13 damage. The asymmetric roll/damage-choice fixture correctly yields total 16 and damage 7. |
| Ranged Free Strike | Printed 2/4/6 plus characteristic 2 gives 4/6/8. Free Strike and Kits explicitly support improvised ranged use with no kit bonus. |
| Pain for Pain | Printed 3/5/13 plus characteristic 2 gives base 5/7/15; kit bonuses are already included. The history-conditioned extra damage remains explicit manual work, so a true predicate does not become a claim of fully resolved damage. |
| Out of the Way! | Printed 3/5/8 + Might and Mountain give 5/7/14; cost 3 Ferocity. Slide 2/3/5 and the linked movement/damage rider remain manual rather than ordinary push. |
| Thunder Roar | Dice 7+6 plus Might 2 give base total 15. One edge yields tier 3 and 13+4=17; double bane yields tier 1 and 6; unmodified tier 2 gives 9. G health is -2/9/6, with one cost 5 and manual push/order consequences. Negative saved foe health follows the existing R04 arithmetic interpretation; Slain is the relevant status. |
| Lines of Force | Full Trigger, Effect and optional Spend 1 Ferocity support manual replacement/source/distance choices. No power roll or fixed spend is printed. The recorded-action limitation is identified as existing app behavior, not a source rule. |
| Meteoric Introduction, pure | Printed 3/5/8 + Reason 2 plus Enchantment of Destruction 1 gives 6/8/11. Fire: Acolyte of Fire does not apply without Fire; size-based movement bonus does not apply without Weapon. Push remains 2/3/4. |
| Viscous Fire | Printed 2/5/7 + Reason 2 plus both applicable +1 features gives 6/9/11 fire damage. VF2 leaves G at 6 and has push 3. Known fire immunity 5 reduces 9 to 4, leaving a Stamina-15 target at 11; immunity does not erase the movement instruction. |
| Ray, pure | Printed 2/4/6 + Reason 2 plus Enchantment of Destruction 1 gives 5/7/9 corruption damage. Fire bonus does not apply. WEAK/AVERAGE/STRONG and slowed/save wording remain verbatim unsupported clauses; no invented potency values. |
| Spinecleaver, compile-only | Axe's printed damage 2/4/5 and push 1/3/4 retain minion targeting/captain context. No live ordinary-creature substitution or minion automation is implied. |

Additional source passages read for this finalization: both common weapon free strikes;
`feature/common/main-actions/free-strike.md`; Lines of Force; the three Elementalist abilities;
Enchantment of Destruction; Fire: Acolyte of Fire; Elementalist Abilities; Kits' Improvised Weapons;
Power Roll Outcomes; Damage Immunity; Temporary Stamina; Stamina; Fury's starting statistics,
Growing Ferocity and Primordial Strength. All paths are under the appendix's pinned local source.
The prepared Berserker thresholds do not add damage to these tested creature strikes; their
unexecuted movement/resource consequences stay manual.

### Acceptance and evidence status

Checks 1–10 remain **not verified as implemented**. Their newly detailed cases are coherent
future acceptance requirements. Check 11 is likewise **not verified as implemented**; its design
now distinguishes Viscous Fire's live test from Meteoric/Ray's pure tests and preserves V25 facts.
Source arithmetic above is independently verified specification evidence, not observed app output.

Inspected main's damage-modifier projection, keyword eligibility, target immunity projection,
ability grants and recorded-action path. No gameplay code, backend, generated screenshot or
persisted V26 record was created or tested. No full application suite was rerun. Earlier baseline
logs retain their original scope and do not validate main's V25 changes or future V26 behavior.
All ten in-app proof sets and all implementation checks remain pending; no playtest pass is claimed.
