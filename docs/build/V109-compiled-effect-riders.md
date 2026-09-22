# V109: Compiled Effect riders and kit signatures

Rules review: required. Depends on: V26, V67, V72, V88, V108.

## Goal

Compile explicitly bounded Effect paragraphs into source-linked manual rider occurrences after
resolution, and admit otherwise clean kit signatures. Damage remains shared automatic work;
rider dispositions record table work without applying it. Unknown prose or effects that alter the
current roll, damage, target selection or ordering retain compatibility behavior.

## Scope

- Whole-section typed rider grammar: independent shift/teleport, Recovery spending, temporary
  Stamina, post-roll surges, turn-bounded bane/taunt, difficult terrain, companion free strike;
  after-damage readers retain an explicit dependency. No keyword-based partial prose acceptance.
- Declared kit signature flavor and clean kit admission with printed kit bonuses included once.
- Source-linked occurrences, audience-safe readback, correction and rewind, existing dispositions.
- Source inventory and independent expected outcomes; regenerated audit/support reports; TESTER
  full gate and public headless proof for each class gaining a live rider, a kit, and a foe.
- Excludes multi-target/area envelopes (V110), resource-spend sections, slide/pull, non-save-ends
  potency, new grants, loading, and automated rider state changes.

Spec references:

- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`
- `docs/rules-adaptation-principles.md#show-the-source-and-the-work`
- `docs/build/V26-compiled-ability-effects.md#1-source-to-compiled-definition`
- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`
- `docs/build/V26-compiled-ability-effects.md#3-persisted-results-and-clients`
- `docs/table-spec.md#director-edits-to-inline-results`

Source ordering: pinned `rule/dice/ability-roll.md`, “Abilities With Damage and Effects”: tier
results follow damage to all targets; multiple effects resolve in printed order. Section riders
here do not affect that roll or damage; optional before/after movement is preserved verbatim as
manual table work, not automatically sequenced movement. V72 establishes occurrence identity,
manual dispositions and history; V88 establishes after-damage dependencies and condition privacy.
Per-shape sources and the resulting per-ability inventory follow below.

Baseline survey (ENGINE2, `cff8b25`, V72 support.json): all eleven classes’ level-one abilities plus
25 kit signatures total 239; 11 compile. Blockers overlap: Effect paragraph 187 (41 alone),
single-target boundary 109 (4 alone, 57 with Effect), no power roll 88 (not a target), kit
compatibility boundary plus undeclared italic flavor 25, slide/pull 10 (0 alone), highest
characteristic roll 4 (0 alone). Foes: Effect alone 46, targets alone 35, both 188. These are survey
counts, not promised promotions; whole-section dependency review controls actual admission.

### Per-ability inventory and proof

All paths below are relative to the pinned Compendium `en/unified/md`. Damage columns are the
independent fixture's tier 1/2/3 totals, not compiler output. Selection witnesses and prior source
ledgers are retained in `tests/fixtures/v109-riders-expected.json`; kit signatures add M/A2 once,
without reapplying their kit bonuses. Command Saber uses its printed flat damage. Hero combat
modifiers (including Conduit prayer and selected kits) are the existing evaluated rules.

| Ability | Source section | Expected fixture damage / cost | Headless case | Built | Playtested |
| --- | --- | --- | --- | --- | --- |
| Behold a Shield of Faith! | `feature/ability/censor/level-1/behold-a-shield-of-faith.md` | 6/9/12; cost 3 | `v99-creation` | Yes | [PASS](evidence/V109/README.md) |
| Driving Assault | `feature/ability/censor/level-1/driving-assault.md` | 5/8/11; cost 3 | `v99-death` | Yes | [PASS](evidence/V109/README.md) |
| The Gods Punish and Defend | `feature/ability/censor/level-1/the-gods-punish-and-defend.md` | 7/10/17; cost 3 | `v99-knowledge` | Yes | [PASS](evidence/V109/README.md) |
| Blessed Light | `feature/ability/conduit/level-1/blessed-light.md` | 6/8/11; cost 0 | `v100-creation` | Yes | [PASS](evidence/V109/README.md) |
| Drain | `feature/ability/conduit/level-1/drain.md` | 5/8/10; cost 0 | `v100-creation` | Yes | [PASS](evidence/V109/README.md) |
| Warrior's Prayer | `feature/ability/conduit/level-1/warriors-prayer.md` | 5/8/11; cost 0 | `v100-knowledge` | Yes | [PASS](evidence/V109/README.md) |
| Grasp of Beyond | `feature/ability/elementalist/level-1/grasp-of-beyond.md` | 5/8/11; cost 0 | `v104-4` | Yes | [PASS](evidence/V109/README.md) |
| Hit and Run | `feature/ability/fury/level-1/hit-and-run.md` | 4/7/13; cost 0 | `v101-panther` | Yes | [PASS](evidence/V109/README.md) |
| Inertial Step | `feature/ability/null/level-1/inertial-step.md` | 7/9/12; cost 0 | `v103-2` | Yes | [PASS](evidence/V109/README.md) |
| Instigator | `feature/ability/troubadour/level-1/instigator.md` | 5/8/11; cost 0 | `v102-3` | Yes | [PASS](evidence/V109/README.md) |
| Get In Get Out | `feature/ability/shadow/level-1/get-in-get-out.md` | 9/12/15; cost 3 | `shadow-swash` | Yes | [PASS](evidence/V109/README.md) |
| Fancy Footwork | `kit/swashbuckler.md` | 7/9/12; cost 0 | `shadow-swash` | Yes | [PASS](evidence/V109/README.md) |
| Driving Pounce | `kit/raden.md` | 6/9/11; cost 0 | `kit-raden` | Yes | [PASS](evidence/V109/README.md) |
| Hamstring Shot | `kit/ranger.md` | 5/7/9; cost 0 | `kit-ranger` | Yes | [PASS](evidence/V109/README.md) |
| Raider's Awe | `kit/raider.md` | 5/8/10; cost 0 | `kit-raider` | Yes | [PASS](evidence/V109/README.md) |
| Protective Attack | `kit/shining-armor.md` | 7/10/13; cost 0 | `kit-shining-armor` | Yes | [PASS](evidence/V109/README.md) |
| Command Saber | `monster/war-dog/1st-echelon/statblock/war-dog-subcommander.md` | 4/5/7, fixed roll +2; ally free strike manual | `foe` | Yes | [PASS](evidence/V109/README.md) |

Additional pure-only admissions: `feature/ability/beastheart/level-1/come-on.md` (companion melee
free strike and both shift by Intuition, all manual), and `.../i-feed-on-your-pain.md` (printed
8/12/16 + Might, tier 3 bleeding then conditional 2 surges). Their existing supplemental manual
combat boundary remains: no new companion combat/loading. Source tests cover both definitions.

No Tactician, Talent or Summoner live ability gains a rider here. Talent Spirit Sword's Strained
section still blocks; unsafe before-roll surges stay unsupported. Elementalist Unquiet Ground and
Troubadour Quick Rewrite have recognized terrain riders but remain area envelopes. Artful Flourish
also stays multi-target. Recognition does not promise live admission.

Grammar alternatives are enumerated in `shared/resolve/effectRiders.ts`, each with pinned source
examples. Whole text, exact Effect label, no spend cost, and printed position after the roll are
required. Optional before/after timing remains in the displayed manual text: the result records
work for the table rather than asserting the table moved after damage. Push-followups have an
`after-movement` dependency and explicitly need actual pushed/vacated squares; a disposition or
computed allowance supplies no movement facts. After-damage readers retain their full predicates;
I Feed On Your Pain does not assert that death/winded/bleeding has been satisfied, and Blessed
Light awards no surges automatically. All section occurrences are once per use, after the damage
and tier-effect records, using the sole target identity for addressing but labelled Ability effect.

## Acceptance checks

1. Focused source tests compile the enumerated whole-section shapes with typed dependency and
   verbatim provenance; appending unknown text, changing a dependency, or adding a spend section
   leaves the definition manual. No extra paragraph is discarded.
2. Negative source cases remain unsupported: Ray of Wrath, Hurl Element, Summoner’s Sword,
   Method Acting, I Work Better Alone, Teamwork Has Its Place, Censored, Phase Inversion Strike,
   Tide of Death; also damage-modifying kit signatures Patient Shot, Pain for Pain and Devastating
   Rush. Clean kits retain printed damage without double-applying kit bonuses.
3. Pure outcomes retain once-per-use riders after damage, require completed damage for readers,
   retain manual wording, and never mutate resources, movement, conditions or other rider state.
4. Persisted operation tests prove use, Director disposition with permission/retry/stale identity
   checks, same-dice correction and history restoration. Audience reads expose no private facts.
5. Public CLI/API journey reads back source-linked manual occurrences for at least one ability per
   newly reached class, a kit signature and a foe; damage and cost match independent source values,
   disposition and corrected/history results are persisted, with real campaign dice.
6. TESTER regenerates V64/V72 artifacts and runs freshness tests plus `CI=true pnpm check` and the
   isolated headless proof. Independent rules/implementation review passes before DEPLOY2 handoff.

## Work log

- 2026-09-22: cut `slice/V109` at `cff8b25` in `.worktrees/effect-riders`; read V26/V72/V88,
  source effect ordering and all 25 kit signatures. Source contradicts three suggested kit
  promotions: Patient Shot/Pain for Pain modify current damage; Devastating Rush changes movement
  order and damage. Keep them compatibility under the assigned modifier boundary; notified ENGINE2.
- 2026-09-22: ENGINE2 confirmed the three kit inventory exclusions before the user transferred
  full design ownership to ENGINE; no further dependency on ENGINE2. Independent WIZARD.2 source
  audit accepted the bounded approach and required explicit actual-movement prerequisites and
  preservation of optional timing. Implemented both. No new timing/grant/supplemental-class gates.
- Authoring: new compiler/source test file 33/33 PASS; persisted kit rider test 1/1 PASS.
  Initial test-only issues (shared fixture mutation, too-short command ID) repaired. Engine tsc
  passed; web tsc's ledger type/source errors repaired. Full execution remains assigned to TESTER.
- Historical V88 hash test projects only newly recognized whole Effect sections back into its old
  descriptive classification, retaining every original hash and all 235 promotions/5 demotions.
  V72 inventory gains the explicit 17 reviewed live abilities; older entries remain asserted.
- TESTER job `test-V109-f1be170-1` PASS: V64/V67/V72 generators exited 0; four focused
  files 67/67 passed (scripts 3.92 s, app 4.37 s). Artifacts:
  `/srv/presidium/projects/salient/test-artifacts/V109-f1be170`. No full/live run yet.
- Reviewed generated inventory: V72 moves exactly the seventeen designed live abilities to
  compiled: 40 compiled / 1477 compatibility / 0 supported-but-unavailable. Two Beastheart
  definitions compile purely but retain manual live records. V64 changes 24 descriptive entries;
  no source content drift. V67's older historical report additionally refreshes its stale corpus
  from 1264 to 1536 entries, matching V64/V72; these 272 pre-existing content additions are not
  V109 grants. Added V64 byte-freshness check; existing V72 freshness gate retained.
- TESTER `test-V109-9557080-2` full PASS: 402 engine + 638 app/scripts tests, all lint,
  typecheck, reports, links, vendor/content and production build gates; exit 0 in 216.8 s.
  Artifacts `/srv/presidium/projects/salient/test-artifacts/V109-9557080`. Live held before setup
  for independent review R1: Hamstring Shot needed an applied witness as well as resistance.
- R1 repair changes only headless proof: legal Elementalist array assigns Agility −1 (fixed Reason
  2; Might/Intuition 2, Presence −1), so every M2 Hamstring tier applies. Read persisted slowed,
  the exact source occurrence instance and save registration; manual-off cleanup is read back.
  Existing A2 resisted case remains. Retain the accepted full gate for unchanged application code.
- TESTER `test-V109-254d5d2-3-live` PASS, exit 0 in 49.0 s: seven classes, five kits, one
  foe, plus applied Hamstring source condition/save registration and manual cleanup. Backend
  stopped, ports free, data retained. Retain full 1040 gate at `9557080` (runtime unchanged).
  [Accepted evidence](evidence/V109/README.md) and exact headless report retained.
- Independent WIZARD.2 [rules/implementation review](audits/V109-rules-review.md) PASS at
  `254d5d2`, 2026-09-22; R1 closed. Final documentation-only closeout carries that authentic
  review trailer. Explicit handoff to DEPLOY2; no merge or publication by ENGINE.

## Publication — 2026-09-22

DEPLOY2 fast-forwarded reviewed `7d82b59` into main and published the backend and frontend.
Backend/schema validation, hosted build and upload succeeded. Worker:
`afc19386-cef9-48b7-9979-748a9456ddca`. Accepted full 1040-test gate and isolated seventeen-ability
journey with Hamstring application/resistance were reused; no smoke test or test rerun.
Content remains V108's 1654-entry snapshot; no reseed was needed. Effect rider dispositions
record manual table work without applying rider state. Release logs:
`/srv/presidium/projects/salient/test-artifacts/V109-release-7d82b59`.
