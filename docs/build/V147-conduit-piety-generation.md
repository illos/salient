# V147: Conduit piety generation: prayer and domain triggers

Rules review: required. Depends on: V144 (the Malice observer), V142, V120.
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/conduit.md`](evidence/V120/conduit.md).

## Goal

Enable automatic piety generation for the Conduit, with its own implementation and an independent
rules review. This covers the turn-start prayer and the twelve domain triggers, bound to the hero's
two domains.

## Scope

- **Engine.**
  - Triggers can be bound to a subclass value: `subclass`, with `triggersFor(profile, baseline)`
    filtering on the evaluated "Domain / Domain" subclass. The filter applies to the sheet list,
    claims and observers.
  - Profiles can have a `prayer` clause, with `resource.pray value=on|off` setting `prayNext`.
  - At the next turn start the clock rolls the d3. On a 1 it adds 1 and applies 1d6 + level psychic
    damage, ignoring immunity; temporary Stamina still absorbs first (Q-RES-6). On a 2 it adds 1. On
    a 3 it adds 2 and logs that a domain prayer effect can be activated manually. It then clears
    `prayNext`.
  - `abilities:sheet` exposes `resourcePrayer`, and the ability panel has a Pray toggle.
- **Conduit profile** (`feature/conduit/level-1/piety.md`):
  - +Victories at combat start.
  - 1d3 at each turn start, with the optional prayer.
  - Lose all remaining piety at encounter end.
  - Domain triggers (`domain-piety-and-effects.md`): +2 each, once per encounter, only for the
    hero's own two domains.
    - Creation, Fate, Knowledge, Life, Love, Nature, Protection, Storm, Sun, Trickery and War are
      one claim each.
    - Death is two claims (Q-RES-9).
    - Knowledge is also automatic when a creature ability's Malice cost is paid (V144's observer).
      Other Malice spending is claimed.
  - From level 4 each domain gain is +3 (`level-4/blessed-domain.md`, "1 additional piety"), a
    labelled interpretation (Q-RES-11).
  - A declared prayer does not carry over: encounter end and a keep-mode void clear `prayNext`.
  - Verified through level 6. `level-7/faithfuls-reward.md` changes the turn-start gain to 1d3 + 1.
- **Content.** The `Piety: Pray` row points to the control and the claims.

## Out of scope

- The domain prayer effects themselves; their rows stay manual.
- Range-based automation of domain triggers: they are table claims with confirmation text.
- Nature's own typed damage could later be observed.
- Level 7 Font of Grace.

## Acceptance

- The pure test covers the Conduit profile: domains, amounts, level 4 and the `triggersFor`
  filter.
- App test `tests/app/heroic-resource-conduit.test.ts`:
  - the sheet lists only the hero's domains;
  - a prayer on a positioned 1 gives 2 piety and 1d6 + 1 psychic damage, with both dice logged;
  - `prayNext` is cleared;
  - the Creation claim works once per encounter;
  - a Knowledge claim is refused for a Creation/Life Conduit;
  - a Knowledge Conduit gains +2 automatically from Bury the Point's Malice cost, once per
    encounter.

## Work log

- 2026-09-24: implemented on V144. The focused tests pass; `tsc` is clean.
- Independent review ([audit](audits/V147-rules-review.md)): changes required.
  - The branch had been cut before V144's closure round; it is rebased onto the V144 tip `558b8109`.
  - R1: a declared prayer carried into the next encounter. Encounter end and a keep-mode void now
    clear it, and the test checks the void.
  - R2: Blessed Domain's scope is labelled as Q-RES-11 with both alternatives.
  - R3: the Conduit is given psychic immunity 5 and the dice are fixed at d3 = 1 then d6 = 6. The
    full 7 damage applies. Removing the no-reduction override fails the test (16 vs 11). A round-2
    prayer on a 3 adds 5 piety and no damage.
- Review closure: PASS at `13d80bb8`.
- Rebased onto V144, which now carries V142's final form and V150's merged forgo. The rebase
  combined the forgo and prayer code in `clock.ts`, `closeoutOperations.ts`, `resourceOperations.ts`,
  `abilities.ts` and `targeting.tsx`, and one repair commit fixes that merge.
  - Encounter end and a keep void clear both forgo and prayer state.
  - Both operations are registered.
  - `tsc` (root, convex, web) is clean. The conduit, forgo, null and pure tests pass (10/10).
