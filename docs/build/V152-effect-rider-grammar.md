# V152: Effect rider grammar II

Rules review: required. Depends on: V109, V110, V113.

## Goal

Admit 18 more whole Effect sections as source-linked manual riders, so those abilities compile:
the engine rolls, applies damage and conditions, then lists the printed table work in order.
Riders never change state. The boundary is set in
[the coverage decision](../decisions/2026-09-24-compiled-effect-coverage.md#what-compiled-means):
no clause that changes a number the engine computes for the same use.

## Scope

- `shared/resolve/effectRiders.ts`: 18 whole-sentence patterns, each citing its pinned source.
  - Two new shapes: `forced-movement` (moving a creature other than the tier's target) and
    `end-effect`.
  - A per-pattern dependency where the printed reader requires it: Choke reads the tier's
    restrained outcome, so its rider is `after-damage`.
- Regenerated V72 support report. The live inventory test names the 18 additions.
- A public headless journey through `ability.use`, `abilities:results` and `ability.resolved`.
- Kept manual on purpose:
  - Call the Thunder Down: "the same distance" reads each target's tier push.
  - Thunder Roar: orders the tier pushes on an area envelope.
  - Ripples in the Earth: its use requirement would appear after the roll it gates.
  - Every Effect that changes damage, damage type, surges or cost, or starts a lasting trigger.

Spec references:

- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`
- `docs/build/V26-compiled-ability-effects.md#1-source-to-compiled-definition`
- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`

Compendium (pinned `en/unified/md`). Rule references: `rule/dice/ability-roll.md` (effects after
damage, in printed order); `movement/forced-movement.md`; `rule/general/saving-throw.md`;
`rule/combat/end-of-turn.md`; `feature/common/move-actions` (Disengage).

| Ability | Source | Rider shape | Dependency |
| --- | --- | --- | --- |
| Your Allies Cannot Save You! | `feature/ability/censor/level-1/your-allies-cannot-save-you.md` | forced-movement | independent |
| Lightfall | `feature/ability/conduit/level-1/lightfall.md` | teleport | independent |
| Sacrificial Offer | `feature/ability/conduit/level-1/sacrificial-offer.md` | bane | independent |
| Soul Siphon | `feature/ability/conduit/level-3/soul-siphon.md` | recovery | independent |
| Words of Wrath and Grace | `feature/ability/conduit/level-3/words-of-wrath-and-grace.md` | recovery | independent |
| Afflict a Bountiful Decay | `feature/ability/elementalist/level-1/afflict-a-bountiful-decay.md` | end-effect | independent |
| Test of Rain | `feature/ability/elementalist/level-1/test-of-rain.md` | end-effect | independent |
| The Green Within, the Green Without | `feature/ability/elementalist/level-1/the-green-within-the-green-without.md` | forced-movement | independent |
| A Squad Unto Myself | `feature/ability/null/level-1/a-squad-unto-myself.md` | shift | independent |
| Dance of Blows | `feature/ability/null/level-1/dance-of-blows.md` | forced-movement | independent |
| Disorienting Strike | `feature/ability/shadow/level-1/disorienting-strike.md` | push-followup | after-movement |
| Misdirecting Strike | `feature/ability/shadow/level-3/misdirecting-strike.md` | taunt | independent |
| I've Got Your Back | `feature/ability/tactician/level-2/ive-got-your-back.md` | recovery | independent |
| Choke | `feature/ability/talent/level-1/choke.md` | forced-movement | after-damage |
| En Garde! | `feature/ability/troubadour/level-2/en-garde.md` | free-strike | independent |
| Infernal Gavotte | `feature/ability/troubadour/level-3/infernal-gavotte.md` | shift | independent |
| Wing Buffet | `kit/corven.md` | shift | independent |
| Let's Dance | `kit/pugilist.md` | push-followup | after-movement |

Area abilities (Lightfall, Words of Wrath and Grace, Test of Rain, A Squad Unto Myself, Dance of
Blows, Infernal Gavotte, Wing Buffet) carry sections about the use, not "the target". So V110's
target-subject boundary still holds.

## Acceptance checks

1. `tests/scripts/effect-riders.test.ts`:
   - Each of the 18 compiles with exactly one rider of the shape above, holding the whole source
     clause.
   - The three exclusions stay manual.
   - Dependencies follow the printed reader.
   - A changed amount or an added clause is not admitted.
2. `tests/scripts/live-compiled-report.test.ts` names the 18 additions. No foe ability changes.
   `pnpm compiled:check` is fresh.
3. TESTER: `CI=true pnpm check` and `SALIENT_HEADLESS_COHORT=rider-grammar node
   scripts/verify-character-headless.ts`. For each ability, the journey uses legal builds and real
   dice and reads back:
   - source-ledger damage and the Stamina change;
   - one source-linked rider;
   - an unchanged actor and target apart from printed tier effects;
   - a recorded disposition.
4. An independent rules and implementation review passes, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V152` at `98f1c3a` in `.worktrees/rider-grammar`.
- Survey on `98f1c3a`, class abilities at levels 1–3, no companions:
  - 80 fail only on an Effect section.
  - About 150 have no power roll.
  - Tier-grammar fixes alone would flip 4.
  - Of the 80, these 18 are pure table work. The rest change the use's numbers or start lasting
    triggers, and are left to later slices.
- The regenerated V72 report moves exactly these 18 to compiled: 108 → 126 reachable compiled,
  0 supported-but-unavailable. The stale V67 pure report (no check reads it) was left untouched.
- Focused authoring run: `vitest run tests/scripts/effect-riders.test.ts
  tests/scripts/live-compiled-report.test.ts`, 2 files, 65 tests passed. Lint clean.
