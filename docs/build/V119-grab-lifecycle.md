# V119: Grabs and the common grab and stand-up maneuvers

Rules review: required. Depends on: V88, V113, V115.

## Goal

Automate grabbing where the source settles it:
- a bare "grabbed" after damage in a tier;
- the grab size rule;
- Grab tier 3;
- Escape Grab, including its size bane and tier 3;
- Stand Up ending prone.

Give every creature the common maneuvers. Proposal (source-based, not a separate product decision):
`feature/common/maneuvers/*.md` gives Grab, Knockback, Escape Grab, Hide, Search and Stand Up to
any creature, but before V119 heroes had none of them. The free strikes that follow a tier-2 Grab
or Escape Grab, grab movement and release on separation stay manual, and so does the
one-grab-at-a-time question (Q-GRAB-1).

## Scope

- Grammar and compiler: `tierConditionExpression` admits grabbed with no printed duration, with or
  without potency. An EoT grab stays unsupported.
- Resolver (`shared/resolve/compiledOutcome.ts`):
  - Any compiled grab applies the size rule from `condition/grabbed.md` ("their size or smaller"; a
    grabber with Might 2 or higher may grab any creature whose size is at most their Might), giving
    a new `ineligible` status.
  - Unknown sizes are `fact-needed`.
  - `grabEligibility` and `smallerSize` are shared with the maneuvers.
- Live state: a grab instance has duration `none`, no clock registration, and the grabber as
  `sourceActorId`. `condition off` ends it.
- Common maneuvers (`convex/lib/resolve.ts`, `convex/lib/abilityOperations.ts`):
  - Every creature gets Grab, Knockback, Escape Grab, Hide, Search and Stand Up.
  - Grab (`feature/ability/common/grab.md`):
    - a target the grabber is too small for is refused before the roll;
    - tier 3 grabs the target with the grabber recorded;
    - tier 2 is the table's choice (the target may first make a melee free strike);
    - a note names the creatures the grabber already holds.
  - Escape Grab (`feature/ability/common/escape-grab.md`):
    - only a grabbed creature can use it;
    - it takes a bane automatically when the escaper is smaller than a recorded grabber;
    - tier 3 ends the grab;
    - tier 2 is the table's choice.
  - Stand Up (`feature/common/maneuvers/stand-up.md`): it ends prone on yourself or a named willing
    adjacent creature, and is refused when that creature is not prone.
- Stacking and limits (review R1, R2):
  - `chapter/classes.md`, Stacking Unique Effects: a creature already grabbed by another creature
    is not grabbed again automatically.
  - `chapter/monster-basics.md`, Creatures Who Grab: an actor that already holds a grab, or a use
    that would grab several targets, leaves the grab to the table (`fact-needed` or a withheld
    tier 3).
- Refusals (R6): Stand Up while restrained (`condition/restrained.md`) and Knockback while grabbed
  (`condition/grabbed.md`).
- Corrections of Grab and Escape Grab uses are refused in favour of a rewind (R5).
- Escape Grab warns to apply its bane by hand whenever a grab source or size is unknown (R7).
- Grab log text names release, escape and separation, not Stand Up (R4).
- Labelled interpretations (R8):
  - The size rule binds grabs imposed by abilities (Q-GRAB-2).
  - "Usually" in `grab.md` is read as the Might exception, so an ineligible Grab target is refused
    before rolling.
  - 1T–1L count as size 1 (`rule/character/size.md`).
- UI badge "Too large to grab". Rules questions Q-GRAB-1 and Q-GRAB-2. Regenerated reports.

Spec references:

- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`
- `docs/table-spec.md#v001-defend-and-aid-attack`
- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`

### Inventory

The V72 report moves 5 envelopes to compiled (99 → 104 on this base), with no demotions:
- Null Joint Lock;
- Boren kit Bear Claws;
- Voiceless Talker Invader Tentacle;
- Mindkiller Killer Claws;
- Giant Zombie Rotten Smash.

Each is damage followed by "<C> < n grabbed". No release-gate roster ability gains here: their grabs
sit beside Effect prose.

## Acceptance checks

1. `tests/scripts/grab.test.ts`:
   - The size rule covers equal, smaller and larger targets, the Might exception, and an ambiguous
     bare "1".
   - `smallerSize`.
   - Joint Lock compiles a no-duration grab: `ineligible` for a 1M M0 grabber on a 1L target,
     `applied` with Might 2 or a 1L grabber.
   - An EoT grab stays unsupported.
2. `tests/app/grab.test.ts` (registered operations):
   - A 1S goblin's Grab on 1M Thorn is refused.
   - Thorn's natural-19 Grab grabs the goblin (no registration, grabber recorded).
   - The goblin's Escape Grab takes a bane and ends the grab; a second Escape Grab is refused.
   - Stand Up ends Thorn's prone; a second Stand Up is refused.
   - The Thorn ability list includes the common maneuvers.
3. TESTER: `CI=true pnpm check`, plus the isolated journey `SALIENT_HEADLESS_COHORT=grab`:
   - A legal Null uses Joint Lock on an A −1 hero: grabbed, `none`, grabber recorded, no
     registration.
   - Escape Grab at the real tier: tier 3 ends the grab; tiers 1 and 2 are described.
   - No bane between equal sizes.
   - Stand Up ends prone and then refuses.

   Regression cohorts: `kit-bonus`, `tier-effects`.
4. An independent rules review passes before deployment, followed by the second-round review.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V119` from the V115 tip `4cc7f31` in `.worktrees/engine-grab`. The
  worktree has an empty `vendor/` and its own `node_modules`.
- Found that heroes had no common maneuvers; only foes had Grab, Knockback, Hide and Search (V02
  squads).
- An edit script truncated `abilityOperations.ts` in the worktree (opened for write before read).
  It was restored from git and the edits reapplied; nothing was committed in between.
- Authoring checks:
  - scripts grab, tier-effects and compiled-ability tests 62/62;
  - live report inventory 10/10;
  - app grab 1/1 and abilities 19/19 (list updated);
  - kit-bonus and tier-effects app tests pass;
  - `tsc` clean and eslint clean.
- TESTER `test-V119-a72c650-1` PASS:
  - `pnpm check` exit 0 in 243 s (407 engine, 660 app);
  - `grab`, `kit-bonus`, `tier-effects` and `effect-riders` pass.

  This is superseded by the review fixes.
- Independent review ([audit](audits/V119-rules-review.md)): changes required, R1–R8, all fixed as
  listed in Scope. Tests were added:
  - pure: stacked, held and multi-target (Rotten Smash) grabs are withheld;
  - app: second grabber withheld, Grab correction refused, Knockback refused while grabbed, Stand
    Up refused while restrained;
  - journey: the grab log text.
- Review R1–R8 closed: PASS at `bbb5340`. TESTER `test-V119-bbb5340-2` PASS: `pnpm check` exit 0 in
  239 s (407 engine, 661 app); `grab`, `kit-bonus`, `tier-effects` and `effect-riders` pass.
  Artifacts: `/srv/presidium/projects/salient/test-artifacts/V119-bbb5340`. The follow-up commit
  only moves the Rotten Smash fixture to its printed Might 3 and size 3 (same asserted outcome).
  Awaiting second-round review.
- QC1 second review: changes required, R1. The Grab maneuver's stacking guard counted any retained
  condition history, so a manual grab alongside ended or unrelated instances was treated as free.
  Both paths now share `grabbedBy` (`convex/lib/compiledResults.ts`): active sourced grabs, plus
  `unrecorded` for a manual toggle or an unsourced grab. The app regression covers ended history
  plus a manual grab: another creature's tier 3 is withheld and no new instance is written.
- QC1 static fix review PASS at `85efd9d` (`../review-artifacts/2026-09-24-V119-QC1.md`). TESTER
  `test-V119-85efd9d-3` PASS: gate rc 0 (407 engine, 661 app); headless seed 1687 `grab` and
  `kit-bonus` pass. Artifacts: `test-artifacts/V119-85efd9d/`. Ready for integration.
