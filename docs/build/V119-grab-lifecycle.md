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
- UI badge "Too large to grab". Rules question Q-GRAB-1. Regenerated reports.

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
