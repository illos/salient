# V174: Damage-changing reactions (option B revision)

Rules review: required. Depends on: V173 (stacked on `slice/V173` `7ad54313`, itself on V172,
V171, V170 and V159, none merged yet).

## Goal

A hero's triggered response that changes the damage that set it off ("take half the damage",
Parry) is offered on the triggering hit with V173's card. Accepting it revises that hit as ruling 3
(option B) says: the hit is recomputed from its current accepted revision with the reduction,
Stamina gets the difference back, consequences the revised hit no longer earns are reversed (a
spent gain stands and is logged), and every write is in the accepting use's journal, so undo of
the acceptance restores the original hit. This is item 5 of the
[lasting effects design](../lasting-effects-design.md#8-delivery-plan). Marks, auras, responses
before the damage ("would take damage") and forced-movement responses stay out.

## Scope

- **Grammar** (`shared/resolve/damageRevision.ts`, `shared/resolve/effectOnly.ts`,
  `shared/resolve/compileAbility.ts`):
  - Whole-sentence revision patterns, each citing its source, read as a `damage-revision` node
    (share `half`, the printed movement as table instructions, Parry's adjacency confirmation and
    potency decrease). Each needs the damaged creature's own `damage-taken` trigger: "You take …"
    the owner's, "the target takes …" the target's.
  - The one optional Spend section of such a response, read whole with its cost label, as a
    `response-spend` node: a potency reduction for the triggering damage ("one effect" or "any
    effects"), or table work (In All This Confusion's extra teleport, "Spend 1+"; Parry's longer
    distance and shift). The compiler admits no fixed cost beside it.
  - `resolveEffectOnly` re-reads both node kinds and refuses tampering; `spend` must be the printed
    amount (or at least it for "1+") and affordable.
- **Revision** (`convex/lib/damageRevisions.ts`, `ability.use`):
  - The hit is found on the triggering entry (a rolled use's effective record, a triggered damage
    of an ability without a power roll, or a creature free strike's application) and must record the
    card's triggering damage for the damaged hero.
  - Recompute from the current accepted revision (the latest accepted response to the same trigger
    that revised it), else the hit (design 5b). Halve (`rule/general/always-round-down.md`), then
    weakness, then immunity (`rule/damage/damage-immunity.md`, `damage-weakness.md`; halving
    before weakness is Q-REACT-1's interpretation). Temporary Stamina absorbs first
    (`rule/health/temporary-stamina.md`). Stamina and temporary Stamina get the difference back
    (Stamina capped at the maximum); winded, dying and dead follow Stamina.
  - Reversal (design 5b): heroic-resource gains linked to the hit (the damaged hero's own V142
    triggers, and other heroes' V149 winded or death triggers) that the revised hit no longer earns
    are reversed and their claims released; the part already spent stands and the log says how
    much (Q-REACT-1 point 3). Gains still earned stand. Open offers of the same hit for the same
    creature get the revised damage, or close when it is 0 (Q-RES-4).
  - Refusals (the card stays open; rewind to the hit, or pass and use the ability by hand): a
    watcher firing (V171) whose event the revision undoes ("rewind to the use" safety; firings still
    true stand, as ruling 3 says consequences still true stand); an effect ended because the hit
    made its owner dying (V158); a Persistent Magic break (V148; otherwise the turn's tally is
    reduced); temporary Stamina changed since the hit; a potency condition whose save was rolled or
    whose taunt replaced another; a potency Spend when the compiled hit has no potency effect.
  - Potency (`rule/character/potency.md`): Parry's Effect and the potency Spend sections re-check
    the hit's compiled potency conditions on the damaged hero with the potency 1 lower, and end
    those no longer imposed. "One effect" picks the only one that would change, or the `potency=`
    answer. A hit whose effects were recorded for manual resolution gets a table instruction.
  - A `damage.revised` log entry, a consequence of the accepting use (itself caused by the hit),
    names the hit, the before and after applications, the reversed gains and ended conditions.
  - A correction of a revised hit is refused (undo the response or rewind instead).
- **Eligibility and cost** follow V173 unchanged: the one-per-round allowance, prevention, dead
  owners, the re-check on accept and a stale round. The response's own spend is paid after the
  revision, from the pool the revision leaves.
- **Cards and UI:** the holder and the card carry the response's adjacency confirmation and Spend
  section; the card text says accepting revises the hit. `web/table/trigger-offers.tsx` adds
  "Accept and spend N Resource", answering `spend`. `ability.use` gains `spend` and `potency`
  arguments (registered; usable from the CLI and card answers).
- Out of scope: Repel (it also answers forced movement), Word of Judgment ("would take damage",
  before the hit), Sacred Bond (a maneuver whose later free triggered action moves damage to
  another creature), Advanced Tactics (surges usable on the triggering damage), responses of foes
  and companions, and revising a squad's pool or a foe's hit.

Spec: `docs/lasting-effects-design.md#5b-response-revision-accounting-ruling-3-option-b`,
`docs/lasting-effects-design.md#4-triggered-actions-and-reactions`,
`docs/decisions/2026-09-24-automation-rulings.md#3-damage-changing-responses-revise-the-hit-option-b`.
Rules question: [Q-REACT-1](../rules-questions-for-user.md#q-react-1-halving-order-parrys-adjacency-and-spent-gain-accounting-v174).

## Acceptance checks

1. `tests/scripts/damage-reactions.test.ts`:
   - The six responses compile with their revision and Spend nodes; Repel and Word of Judgment
     stay `trigger-unobserved`; a changed Spend section, a mismatched trigger and a tampered saved
     spend are refused.
   - Halving: 7 → 3 (Parry's example); 8 fire against immunity 5 takes 3, halved 0; 10 fire
     against weakness 5 takes 15, halved 10; 10 temporary Stamina and 16 damage, halved, leaves 2
     temporary Stamina and Stamina untouched.
   - Winded (15 − 8 winded, 15 − 4 not), dying (3 − 3 = 0 still dying), a second revision from the
     first (7 → 3 → 1), and 1 → 0 no longer damage taken.
   - Spent-gain accounting and the potency re-check, including the "one effect" choice.
   - Resolution: revised hit, spend paid, wrong amount refused, unaffordable blocked, by hand manual,
     "Spend 1+" of 3.
2. `tests/app/damage-reactions.test.ts` (convex-test, `transactionLimits: true`, registered
   operations, persisted readback):
   - Inertial Shield: Spear Charge 5 on the Null (21 → 16); the player accepts, 21 − 2 = 19, with
     the revision record and the `damage.revised` entry; undo restores 16 and reopens the card; the
     Director accepts; a second hit in the round offers nothing.
   - Winded: 13 − 5 = 8 winded, revised 11 not winded; a potency spend on a hit with no potency
     effect is refused and nothing is spent.
   - Fury: the winded 1d3 gain is reversed except the 1 spent before the response, which stands and
     is logged; the first-damage gain stands.
   - Watched hit: a made-winded firing refuses; after rewinding, a damage-taken firing stands.
   - Parry on an ally: Bury the Point 7 → 3 (18 − 3 = 15), potency 2 → 1 against Might 1 ends
     bleeding; undo restores both.
   - A creature free strike (1 → 0) and a hero's Mind Spike (8 → 4) are revised.
3. Both reports: `node scripts/report-live-compiled-abilities.ts --check` matches; the V64 audit
   regenerates unchanged.
4. TESTER: `pnpm check` (not run here).
5. Independent review, then QC1.

## Work log

- 2026-09-25: `slice/V174` in `.worktrees/reactions`, stacked on `slice/V173` `7ad54313`.
  Implementation commit: `0ecdb97f` after the rebase onto the new chain (pushed on
  `slice/V174`).
- Flipped to fully compiled (all without a power roll, each with its Spend section):
  - **Inertial Shield** (`feature/ability/null/level-1/inertial-shield.md`).
  - **Skin Like Castle Walls** (`feature/ability/elementalist/level-1/skin-like-castle-walls.md`).
  - **Parry** (`feature/ability/tactician/level-1/parry.md`).
  - **Defensive Roll** (`feature/ability/shadow/level-1/defensive-roll.md`).
  - **In All This Confusion** (`feature/ability/shadow/level-1/in-all-this-confusion.md`).
  - **Unearthly Reflexes** (`feature/ability/fury/level-1/unearthly-reflexes.md`).
  - The live report goes from 162 to **168** reachable compiled (without a power roll 11 → 17);
    compatibility goes from 1459 to 1453. No foe ability changes. The V64 audit regenerates
    unchanged.
- The research list, each read in the Compendium. Manual:
  - **Repel** (`talent/level-1/repel.md`): its trigger and effect also answer forced movement, which
    has no map (`trigger-unobserved`).
  - **Word of Judgment** (`conduit/level-1/word-of-judgment.md`): "would take damage from an
    ability that uses a power roll"; it changes the roll before the hit, which the engine resolves
    at once.
  - **Sacred Bond** (`conduit/level-2/sacred-bond.md`): a maneuver; its free triggered action moves
    the damage to the other target, which is not a halving and not yet an offered event.
  - **Advanced Tactics** (`tactician/level-1/advanced-tactics.md`): surges "which they can use on
    the triggering damage" change a hit the ally dealt, and its Spend raises potency; it stays
    `trigger-manual` (it replaces Skin Like Castle Walls as V173's manual example).
- Journeys checked for the flipped names: `scripts/headless` names Parry, Unearthly Reflexes,
  Defensive Roll and In All This Confusion only as granted ability names, never as manual; no list
  expects them manual. `tests/scripts/live-compiled-report.test.ts` lists the six;
  `tests/scripts/triggered-actions.test.ts` uses Advanced Tactics for its manual example;
  `tests/app/abilities.test.ts` pins the `ability.use` syntax with `[spend=…] [potency=…]`.
- Decisions:
  - Q-REACT-1 records four labelled choices: halving before weakness, Parry's adjacency by
    acceptance, the spent-gain accounting, and the "one effect" pick.
  - Watchers: design 5b links firings to the revision and reverses what is no longer true, but the
    engine can't un-fire a watcher's response, so a firing the revision would undo refuses the
    acceptance (V171's "rewind to the use"); firings still true stand.
  - The revision chain is the accepted response cards of the hit and their use records (no new
    table); undo of a response removes its link with it.
  - Only a hero's hit is revised: offers go to heroes, and their targets are themselves or allies.
- Known limits:
  - A watcher's own damage or a strained user's self-damage in the same entry as the hit is not
    one recorded hit; accepting is refused unless the recorded application matches the card.
  - The response's shift, teleport and Hide are table instructions (no map).
- Authoring checks run (worktree):
  - `pnpm -s lint`: pass. `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json`: pass.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches. `node
    scripts/audit-ability-grammar.ts`: regenerated, no diff.
  - `vitest run --maxWorkers=2`: `tests/app/damage-reactions`, `triggered-actions`, `watchers`,
    `party-read-limit`, `abilities`; `tests/scripts/damage-reactions`, `triggered-actions`,
    `effect-only`, `live-compiled-report`, `audit-ability-grammar`, `compiled-ability`: all
    passed.
- Review follow-ups (changes required, 2026-09-25):
  1. A second response on the same hit is checked against the current accepted revision (the
     damage its open card was updated to), not the original hit, so 7 → 3 → 1 works.
  2. A gain whose claim an earlier revision already released is skipped, and a winded-or-dying gain
     is reversed only when this revision undoes what earned it: no double reversal.
  3. Q-REACT-1 point 4 is labelled an interpretation, quotes inertial-shield.md exactly and names the
     alternatives.
  4. The work log cites `0ecdb97f`.
  5. `potency=` is refused unless the answer spends on a "one effect" potency Spend.
  6. The watcher-firing refusal considers only firings about the revised creature (its own
     watchers, and the dealer's damage-dealt when no other creature took damage from the entry).
  7. The resolved cards are read once per hit (`revisionsOf`), for the plan and for the correction
     refusal; the correction refusal now comes first, before the history window checks.
  8. A potency condition on a compiled hit that the engine didn't evaluate gets a table note, and
     doesn't count as "no potency effect".
  9. `tests/app/damage-reactions.test.ts` adds: two responses on one hit (Fury then Elementalist,
     7 → 3 → 1, the winded gain reversed once, the first-damage gain standing); a correction refused
     after a revision; temporary Stamina given back (10 absorbs 5, revised 8); and a Persistent
     Magic break refusing the revision (a seeded maintained entry; the Elementalist takes 5 then 7
     in the goblin's turn, 12 ≥ 5 × Reason 2). Re-review: the rolled-save refusal is reachable, because
     `/turn end` rolls saves at the turn-end boundary while offer cards close only when the next
     turn starts. The app test hits the Talent during her own turn with Bury the Point's bleeding
     (save ends); she ends her turn, the save rolls, and accepting the Tactician's Parry is refused
     with the card still open.
- QC1 train 16 (the project's `review-artifacts/2026-09-25-train16-QC1.md`), fixed on `slice/V175`:
  - R1: successive potency reductions. Each revision outcome saves the hit's accepted potency
    reductions per condition occurrence, cumulatively (`potencyReductions`). This includes
    reductions that leave the condition applied, and a one-effect spend's selected effect. The next
    revision re-checks the hit's potency conditions from the current accepted potency
    (rule/character/potency.md). Undo of a revision removes its record, so it restores only that
    reduction. Tests: Parry, then Skin Like Castle Walls with Spend 1 Essence, on a Might −1 Null
    hit by tier 2 Bury the Point (M < 1): potency 1 → 0 still bleeds, 0 → −1 ends it; undo of the
    second brings the bleeding back and keeps the first reduction. Inertial Shield's one-effect
    spend, then Parry, ends it too.
  - R2: Mark cards on a revised hit are reconciled; see the V175 work log.
  - Review of `661594c4`: with several potency effects and none that would change, a one-effect
    reduction used to credit the first effect silently. It now asks for `potency=` (Q-REACT-1 point
    4). The re-check from the current accepted potency is the pure `reducePotency`
    (`shared/resolve/damageRevision.ts`), tested with two effects: a one-effect spend on slowed,
    then an any-effect reduction that ends slowed and leaves prone. An accepted Mark benefit refuses
    a revision to 0 damage. An accepted extra-damage benefit refuses any revision of the hit it was
    sized on (rewind to the hit).
