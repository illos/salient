# V102: Troubadour level one

Rules review: required. Depends on: V101.

## Goal

Deliver complete level-one Troubadour creation and editing, with all three class acts, ordinary kits,
printed ability choices and granted performances/actions available through the shared sheet/API.

## Scope

- Agility/Presence 2, three remaining-score arrays, Stamina 18, eight Recoveries and Presence potency.
- Read Person, two interpersonal skills, one intrigue/lore skill and class-act fixed skill.
- Auteur, Duelist and Virtuoso features and actions; common routines; four signatures, four
  3-Drama and four 5-Drama choices. Ordinary Chapter 6 kits.
- Drama pool/payment/waiver; source-timed embedded uses. Performance maintenance, spatial effects,
  timed modifiers, ally permissions, Scene Partner bonds and Drama generation remain explicit manual
  effects unless already supported by the engine. No higher-level Troubadour support.

Spec: docs/character-wizard-spec.md#3-decision-system
Spec: docs/character-wizard-spec.md#9-shared-operations-and-reliability

Rules authority: pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, under
`en/unified/md/`: `class/troubadour.md`, `feature/troubadour/level-1/`,
`feature/ability/troubadour/level-1/`, `chapter/kits.md` and selected kit files.

## Acceptance checks

1. Independent source ledger and focused evaluator checks cover all class acts, all arrays,
   skills, kit arithmetic and granted actions; invalid choices and editing prune incompatible grants.
2. TESTER generators and `CI=true pnpm check` pass.
3. Isolated authenticated Troubadour cohort creates/adopts builds, invokes every granted action,
   reads persisted effects, checks independent costs/damage and affordability/waiver behavior.
4. ENGINE source/implementation review passes; DEPLOY2 publishes using accepted results.

## Work log

- 2026-09-21: started from main `a03bfe7`, branch `slice/V102`, worktree `.worktrees/class-troubadour`.
  User request relayed by DEPLOY2. ENGINE assigned independent inventory and final rules review.

- ENGINE independent inventory: 24 envelopes plus seven optional paid spends and Method Acting's
  voluntary exchange. Authoring review `c29559f` found no blocker; final proof review pending.
  Star Power base 1 and Harmonize base 3 are additional to their optional spends. Upstage is wholly
  manual to prevent Self taunt/prone; Thunder Mother is manual so activation cannot fire its delayed
  level-based damage. Routines lifecycle and resurrection remainder are explicit manual boundaries.
- TESTER `c29559f` generation: all three commands exit 0 (1.14/0.79/0.94s), 1402 content entries.
  Artifacts: `/srv/presidium/projects/salient/test-artifacts/V102-c29559f-generation`.
- Independent four-build ledger covers all arrays, acts and 12 choices with four ordinary kits.
  Focused evaluator test passes 2/2. Authored cohort covers 44 distinct actions (24 source envelopes,
  four kit signatures, 16 embedded uses), persisted damage/manual remainder, source costs, owner
  refusal, class-act edit isolation, and Cutting Sarcasm's bleeding applied/resisted paths.
