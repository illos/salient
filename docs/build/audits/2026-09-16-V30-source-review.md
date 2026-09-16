# V30 independent pinned-source review — 2026-09-16

Reviewer: `v30_source_review`, independent of implementation and implementation review.

Review target: uncommitted `slice/V30` changes relative to `663b49f` in
`/srv/presidium/projects/salient/foes`. Reviewed content edition:
`24315df7920eadd03b5a546af9deae3f460bafa531c77e9650421cf628323425`.

## Verdict

**Pass — pinned-source review.** No blocking or nonblocking source findings. The nine added
stat blocks, their 32 abilities/traits and two level-four Malice features faithfully retain the
pinned source. The reviewed external discrepancies have supported dispositions.

The [independent implementation review](2026-09-16-V30-independent-review.md) passed before
this verdict was finalized. This approves the bounded ingestion/reference slice; it does not
certify engine execution, integration into main or the shared playable runtime.

## Authority and scope

Read `agent.MD`, `CLAUDE.md`, the [V30 slice](../V30-second-echelon-undead.md), the build
review procedure and these owning sections:

- [Confirmed ingestion requirements](../../monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15).
- [Full-output comparison](../../monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16).
- [Unified object references and sharing](../../data-architecture-spec.md#35-unified-object-references-and-sharing).
- [App-wide rule cards](../../reference-library-spec.md#app-wide-rule-cards).

Rules authority was exclusively Steel Compendium commit
`fb83a789da8f0327a389c277a0c790b1648d5810`. Read the ten second-echelon Markdown
records directly using `git show` because these paths are outside the sparse working tree.
Independently loaded their pinned JSON and linked Markdown for exhaustive preservation checks.
Also read the prior level-one Malice Markdown directly. No online rules research was used.

Steel Cauldron generated JSON at `eba4b8bb8bc1baf947f15e67e9e923951092fd89` was used
only as the authorized comparison input. No external application code was consulted or adapted.

## Source coverage

The following paths are relative to `en/books/monsters/md/monster/undead/2nd-echelon/`
at the Compendium pin. Corresponding JSON and linked Markdown use `json/` and `md-linked/`
instead of `md/`. Feature names below preserve source order; A = ability, T = trait, M = Malice.

| Source path | Ordered features checked |
| --- | --- |
| `statblock/flesh-mournling.md` | A Multiarm Strike; A Horrid Wail; T Arise; T Immutable Form |
| `statblock/fleshflayed-shambler-zombie.md` | A Bone Carvers; T Fleshfused Spines |
| `statblock/ghoul-craver.md` | A Taste; T Ever So Hungry; T Hunger |
| `statblock/giant-zombie.md` | A Rotten Smash; A Knocking Heads; T Endless Knight; T Negative Nerves |
| `statblock/hollowbone-launcher.md` | A Hollowbone Slug; T Brittle Revenge |
| `statblock/mummy-lord.md` | A Accursed Slam; A Binding Curse; A Summon My Guard; T Cursed Transference; A Plague of Flies; A Land's Guardian; A Unbound Horrors |
| `statblock/mummy.md` | A Accursed Bindings; A Eldritch Curse; A Blast of Mummy Dust |
| `statblock/vampire-spawn.md` | A Exsanguinating Bite; A Vampiric Celerity; T Unslakable Bloodthirst |
| `statblock/wraith.md` | A Chilling Gravetouch; A Hidden Movement; A Stolen Vitality; T Agonizing Phasing |
| `undead-malice-level-4-malice-features.md` | M Prior Malice Features; M Blood Hunger |

All printed parent statistics, classifications, movement, defenses, captain bonuses and source
wording agree with retained fields. The new records contribute 21 abilities, 11 traits and two
Malice children. No source corrections are configured.

Independent assertions, without invoking the importer, verified all 22 current parents against
Git source blobs: 66 exact original JSON/Markdown/linked-Markdown strings, all original parsed
records, and all parent fields excluding the separately modeled features/metadata. All 74 child
records have exact original and current structured fields, the correct parent and order, and
exact original Markdown spans using JavaScript UTF-16 offsets. Display Markdown differs only
by removal of the source blockquote prefix and outer whitespace. Ordered child spans reconstruct
each parent's source suffix. Every diagnostics array is empty.

## Sensitive source details

- Fleshflayed Shambler Zombie, Ghoul Craver and Hollowbone Launcher each print **EV 6 for four
  minions**. Each retains `{printed: "6 for four minions", amount: 6, quantity: 4}`. The six other
  new monsters retain their unqualified EV: Giant Zombie and Mummy Lord 24; the others 6.
- Nested spending remains in its ordered effect position: Multiarm Strike adds one target for
  1 Malice; Binding Curse retains its separate 1 Malice activation and 2+ Malice option granting
  one additional target per 2 Malice; Cursed Transference retains its 5 Malice transfer option;
  Exsanguinating Bite retains its 1 Malice additional 3 corruption damage option.
- Mummy Lord's Plague of Flies, Land's Guardian and Unbound Horrors retain villain ordinals
  1, 2 and 3 with `costText: null`. The source cost-field representation remains available;
  these labels are not converted into resource spending. Land's Guardian retains its Agility
  test tiers following the movement/burrowing effect.
- Complete triggers remain intact: Knocking Heads includes both grabbing two targets and
  starting the turn with two grabbed; Summon My Guard includes the first winded event of the
  encounter; Blast of Mummy Dust includes both approaching a restrained creature and starting
  within distance; Stolen Vitality retains the enemy, distance and Stamina-regain condition and
  its free triggered-action usage.
- Ordered rolls, tiers and subsequent effects retain their distinctions, including the vampire
  spawn's ordinary damage at tier 1 versus corruption damage at tiers 2/3; Chilling Gravetouch's
  next-round ghoul-craver consequence; and the source exceptions and timing in Arise, Endless
  Knight, Horrid Wail, Unslakable Bloodthirst and Agonizing Phasing.
- Level-four Malice retains its level-4-or-higher, turn-start introduction. Prior Malice Features
  retains `2-7+ Malice` and level 3 or lower; Blood Hunger retains 5 Malice, a bleeding target,
  the acting undead's signature ability, and each undead within 5 squares moving and potentially
  making a free strike against that same target.

All 20 stat blocks link to their echelon's Malice. Level-four Malice links to the retained
level-one record at
`en/books/monsters/md/monster/undead/1st-echelon/undead-malice-level-1-malice-features.md`.
Its four prior features and costs remain intact: Ravenous Horde 2, Paranormal Fling 3,
The Grasping, the Hungry 5, and Dread March 7+ Malice. Supporting navigation preserves this
reference relationship without executing any effect.

## Comparison and normalization

Independently verified all 22 cached files against their recorded digests, reproduced the
[comparison report](../evidence/V30-steel-cauldron.json), and reviewed every explained
disposition. Outcome: **22 explained; zero unresolved, missing, ambiguous or error rows**.
The report has no retrieval errors. Agreement is secondary evidence; source preservation and
the direct readings above establish the source verdict.

The three new minion counterparts provide `ev: 6` and omit `evQuantity`. The disposition is
justified only when the printed four-minion wording, local amount/quantity and external amount
agree and the external quantity is absent. The source quantity is preserved. No claim is made
about Steel Cauldron's live encounter calculator.

Other dispositions preserve information: the Malice title qualifier exists separately as the
external level/type; external generic features correspond to source-qualified traits/Malice;
villain ordinals occupy a different external field; absent printed movement remains absent
despite external `walk`. Numeric/string forms, link/HTML markup, keyword ordering, roll notation
and effect grouping account for presentation differences. Complete ordered effects, costs,
triggers and tiers still participate in comparison.

A separate bounded audit exercised **89 rejected mutations** across the ten new parents:
reversed feature order, removed effects for every feature, changed triggers, activation/nested
costs, villain labels and tier-3 outcomes where present, explicit minion quantity/amount
disagreements, changed printed minion basis, and incorrect Malice level/type. All returned
review/error rather than a passing comparison. The initial audit-harness equality assertion
omitted the CLI-added empty `retrievalErrors` envelope; correcting that harness expectation
made the full report comparison pass, without application or evidence changes.

The checked-in source-derived expectations for quantities, Binding Curse, Cursed Transference,
Summon My Guard, Land's Guardian, Blood Hunger and Malice identity/qualifier guards agree with
the direct source readings. These tests concern ingestion and comparison, not gameplay outcomes.

## Continuity and verification limits

Direct baseline comparisons confirm all 52 V27 objects are unchanged, the original 40 identity
bindings remain an identical prefix with 34 appended bindings, and the retained V27 edition's
bytes are unchanged. The current package equals its new immutable edition. Total coverage is
20 stat blocks, 44 abilities, 24 traits, two Malice parents and six Malice children.

The implementation review records the passing full check: 97 engine tests plus 340 app/script
tests, lint, links, vendor pins, source/content regeneration and build. This reviewer inspected
the completed build-log tail and the browser log showing two passing journeys in 10.1 seconds.
Broad checks and browser execution were not repeated during source review. Earlier host-pressure
timeouts remain documented in the implementation review and are not counted as passes.

Chords identity/thread/update calls and a boundary update check returned “Ambiguous provider
session; cannot select a Chords project.” Coordination was handed to the assigning parent, which
uses the documented CLI fallback. This reviewer changed only this audit document; no vendor,
application, main-branch or runtime changes were made.
