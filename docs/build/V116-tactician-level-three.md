# V116: Tactician levels two and three

Rules review: required. Depends on: V94, V97, V114.

## Goal

Build and edit a Tactician of every doctrine at target level two or three through the full wizard and
shared API. Guided advancement remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/tactician.md`, Basics and Tactician Advancement Table: +9 Stamina at
  levels 2 and 3; first echelon, 10 Recoveries, unchanged characteristics and potency. Class-profile
  Stamina growth now reads the amount from each class's own `level-N.stamina` decision quote
  (Shadow 6, Tactician 9) instead of a Shadow-only constant.
- `feature/tactician/level-2/perk.md`: one exploration, interpersonal or intrigue perk.
- `2nd-level-doctrine-feature.md`: Infiltration Tactics, Goaded (unlinked table row; `goaded.md`),
  Melee Superiority. `2nd-level-doctrine-ability.md` with pairs from
  `en/books/heroes/clean/Draw Steel Heroes.md`, 2nd-Level Insurgent/Mastermind/Vanguard Ability:
  Fog of War / Try Me Instead; I've Got Your Back / Targets of Opportunity; No Dying on My Watch /
  Squad! On Me!.
- `feature/tactician/level-3/out-of-position.md` (automatic) and `7-focus-ability.md`: Frontal
  Assault, Hit 'Em Hard!, Rout, Stay Strong and Focus!.
- Embedded uses, each a manual record citing its clause: Infiltration Tactics surge, Goaded
  retarget, Melee Superiority halt and its 2-Focus mark free strike, Out of Position mark-and-slide,
  and the 2-Focus mark benefits of Fog of War and Targets of Opportunity.
- Table routes: I've Got Your Back rolls printed damage plus the applicable kit bonus, with taunted and
  the ally Recovery manual. Try Me Instead prints a Self header before a strike against another
  creature, so it is recorded without a roll (manualRoll list, as Tide of Death). No Dying on My
  Watch's `Triggered` action type is recorded by the existing route, as Parry is. The others have no
  power roll and are recorded with Focus payment. Marks, surges, Recoveries and encounter auras stay
  manual; no mark state is automated.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v116-tactician-three-expected.json` extends the four
   V94 witnesses (plus two alternates covering every level-2 ability). Focused engine test checks
   vitals, features, perk, costs, embedded uses, foreign-pool rejection and level/doctrine pruning.
2. Authenticated `tactician-level-three` headless cohort: six level-3 builds, draft resume and save,
   owner-only level transition, lower to 2 and back, and every new ability and embedded use with
   Focus payment, blocked second paid use and persisted readback.
3. The testing thread runs `CI=true pnpm check` and the isolated cohort; independent review before merge.

## Work log

- Started from main `527db34` on `slice/V116`, `.worktrees/tactician-three`; moved onto main
  `3aa24ae` once V114 merged. ENGINE2 informed.
- Ledger written by an isolated subagent from the Compendium only: Stamina +9 per level, no other
  numeric change; I've Got Your Back 7/11/14 for the Mastermind witnesses. Its interpretations
  (Hit 'Em Hard! surges go to the damaging creature; the unsourced taunted/frightened are the
  Tactician's) do not change any recorded value.
- Author checks: both TypeScript projects and ESLint pass; focused V116, V94, V92/V97/V98/V108
  Shadow and V45/V114 engine files pass; V88 audit guard 24/24; app Tactician and Shadow pass.
  Content 1687 entries; `compiled:check`, `content:check`, `supporting:check`, links pass.
- Independent rules/implementation review (subagent, source-only) of `2125ca9`: PASS, six
  non-blocking findings, all closed: every embedded use's cost is asserted, the perk pool is compared
  with the ledger's 26 perks, an unreadable Stamina growth quote now fails loudly, and the Try Me
  Instead, No Dying on My Watch and Out of Position texts restore their printed conditions.
- Testing thread PASS at `cb9f4c7` (on main `828c82a`): `CI=true pnpm check` rc0 in 235 s, engine
  407/407 and app 652/652; isolated `tactician-level-three` cohort rc0 in 36 s with six builds, level
  edits and seventeen new uses persisted, seed 1687. The only backend error was the deliberate peer
  owner refusal. Artifacts `/srv/presidium/projects/salient/test-artifacts/V116-cb9f4c7`.
- Ready for integration and cloud dev publication, reusing these results.

## Publication: 2026-09-24

The test and deploy thread fast-forwarded reviewed `3175606` into main and published the backend,
content and frontend using the DEPLOY2 hosted procedure. Backend and schema validation succeeded,
the reseed read back 1687 entries at `fb83a789`, and the hosted build and upload succeeded.
Worker: `d603e11b-f449-4f84-88fa-daf498a8ddd6`. The accepted gates were reused, with no smoke test or rerun. Temporary
credentials were removed and the private hosted helpers stopped. Release logs:
`/srv/presidium/projects/salient/test-artifacts/V116-release-3175606`.
