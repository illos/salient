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
