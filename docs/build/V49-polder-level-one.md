# V49: Polder level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Ancestry implementer (Opus), reviewed by the character integration lead |
| Rules review | required |
| Depends on | V44, V45 |
| Unblocks | Later Polder level units; Revenant, whose previous-life traits draw on this list |
| Status | see `STATUS.md` |

## Goal

Complete the Polder ancestry at level one by enabling its three remaining purchasable traits —
Nimblestep, Polder Geist and Reactive Tumble — with representations that match what the source
actually says: an entitlement with no number, a conditional bonus that never reaches the printed
speed, and a free triggered action that does not consume the one-per-round budget. Everything Polder
already delivers must keep working unchanged.

This slice is in its **preparation stage**. Implementation waits for the integration lead's release,
and this unit deliberately does not depend on V47's aspects or stormwight kits.

## Spec references

- [Decision system](../character-wizard-spec.md#3-decision-system) — point budgets, option support and
  dependent pruning for the purchased-trait decision.
- [Wizard flows](../character-wizard-spec.md#4-wizard-flows) — behaviour when the ancestry or a
  purchased trait changes.
- [Forge Steel compatibility](../character-wizard-spec.md#8-content-and-forge-steel-compatibility) —
  same-build counterpart evidence for each newly enabled trait.
- [Delivery plan](V44-character-option-delivery.md#current-execution-opus-pilot-then-every-level-one-unit) —
  unit boundaries and per-unit gates.
- [Per-option delivery gate](character-verification.md#per-option-delivery-gate) — witness ledger and
  merge gates.
- [Merge completion](README.md#merge-completion-includes-the-playable-app) — shared app update.

## In scope

- Enable Nimblestep, Polder Geist and Reactive Tumble with sourced readable content and the correct
  contribution classification for each.
- Keep Polder Geist's +3 speed out of every unconditional speed total, preserving its full trigger
  and duration wording.
- Represent Reactive Tumble as a free triggered action that does not count against the one-per-round
  triggered-action limit.
- Assert that Shadowmeld's readable text retains its final clause — surface destruction ends the
  ability and deals 1d6 damage that cannot be reduced — which exists only in the source body and not
  in any structured `effects` field.
- One new counterpart build covering all three traits, plus reuse of the V47 Build B evidence for the
  three already-supported traits.
- Budget behaviour tests: overspend invalid, underspend warns without blocking, trait swaps remove
  old effects.

## Out of scope

- Any Polder level above one, and the Revenant previous-life interaction, which belongs to its own
  unit even though it consumes this cost table.
- Gameplay execution: shapeshifting, difficult-terrain movement, sneaking, forced-movement resolution
  and triggered-action timing remain manual or engine-track work.
- Resolving whether Nimblestep lifts the prohibition on shifting within difficult terrain. The pin is
  silent; the uncertainty is recorded, not filled in.
- V47's aspects, stormwight kits and the Lycanthropy exclusion, which stay with that unit.
- Changes to the three already-supported traits' derived values, which are verified rather than
  rewritten.

## Inputs and dependencies

Hard: V45's extraction is merged, so `shared/content/ancestries/polder/level-one.ts` and
`shared/evaluate/ancestries/polder.ts` are independently owned. Branch `slice/V49` is cut from
`9de2dda` in `/srv/presidium/projects/salient/opus-polder`, with both vendor submodules initialised
at their recorded pins.

Deliberately **not** dependent on V47: the counterpart build uses the Berserker aspect and the
Mountain kit, both already supported, so this unit can be verified and merged whether or not the Fury
unit has been released. The two units do share the Polder facts used by V47's Build B; that build's
expectations and this unit's inventory must agree before either merges, and both are owned here.

All installs, builds, tests, servers and browsers run on CT114 through `presidium-dev` in a named
environment. Nothing in the preparation stage needs one, and V46 currently holds the characters slot.

## Deliverables

Preparation stage (this handoff):

- [Polder level-one preparation research](../research/polder-level-one-preparation.md): what already
  works, the three-trait gap with each trait's classification, the Shadowmeld clause list and its
  extraction trap, six double-count hazards, the witness plan and two recorded uncertainties.
- This slice document and its `STATUS.md` row.

Implementation stage:

- `shared/content/ancestries/polder/level-one.ts`: the three traits enabled with sourced content.
- `shared/evaluate/ancestries/polder.ts`: contributions only where a trait actually changes a derived
  value, which for these three is nowhere — the unit's correctness is largely about what it does
  *not* add.
- Tests in `tests/character-derived-values.test.ts` and `tests/character-evaluator.test.ts`, a
  browser journey, and the counterpart evidence under `docs/build/evidence/V49/`.

## Acceptance checks

1. All six purchasable traits and both signature traits are present with source paths and verbatim
   quotes, and the assembled definitions — not the module constant — offer all six.
2. A build taking Nimblestep, Polder Geist and Reactive Tumble derives **exactly the same** speed,
   stability, disengage and every other numeric field as the same build with no purchased traits.
   Any numeric difference is a failure.
3. Polder Geist's readable content carries its complete trigger and duration; no surface presents it
   as an unconditional speed, including any parenthesised or "effective" speed.
4. Reactive Tumble appears as a free triggered action and does not consume the one-per-round budget.
5. Shadowmeld's rendered source text contains its final surface-destruction clause and the
   irreducible 1d6, through the content path, with a test that fails if the text is ever rebuilt from
   structured effects.
6. Budget behaviour: 5 points is invalid; 3 points warns and still completes, per Q-CHAR-10;
   swapping a trait removes the old effects and applies the new ones.
7. Ancestry change away from Polder removes size 1S, Shadowmeld and all purchased traits while
   preserving independent class, career, culture and authored choices.
8. The three already-supported traits keep their exact current derived values: corruption immunity 3
   at level one, frightened immunity, disengage +1.
9. One completed legal Forge counterpart for the new-trait build, with unmodified export, readable
   sheet, recorded versions and explained differences; V47 Build B reused only for what it proves.
10. Full `pnpm check` plus `pnpm test:browser` on the isolated CT114 candidate; independent
    implementation and rules reviews pass; then merge and verify on shared CT114 main.

## Ability design and playtest evidence

Not applicable in the parser/engine sense: this unit adds editor options and readable content, and
changes no executed ability behaviour. Shadowmeld's own gameplay resolution remains manual.

## Rules research

Complete for this stage in the
[preparation research](../research/polder-level-one-preparation.md), which cites every source path
and quote. No mechanical claim in this unit rests on inference. Two uncertainties are recorded rather
than resolved, and neither blocks the work.

## Open questions

None requiring the user. Q-CHAR-10 already settles unspent ancestry points as warn-without-enforcing.
If a rules reviewer needs the Nimblestep shifting interaction settled, it goes to
`docs/rules-questions-for-user.md` with the paths read and a recommendation, and the rest continues.

## Work log

2026-09-19 (preparation): claimed V49 on `slice/V49` in `/srv/presidium/projects/salient/opus-polder`,
created from `main` `9de2dda`; both submodules initialised at their recorded pins and unmodified.
Assignment received through Chords from the integration lead, under the user's instruction to this
thread to accept scope changes from that thread.

An independent Anthropic subagent derived the Polder inventory from the pin alone, barred from
reading our evaluator for any rules value and from any web source. A private `/tmp` review map was
read as a starting point and treated as uncertified; every claim was re-derived.

Findings that shaped the plan:

- The gap is exactly three traits, and their costs total the full 4-point budget, so a single
  counterpart build witnesses all of them.
- All three are non-numeric by nature. The unit's correctness is mostly about what it must **not**
  add: Polder Geist contributes no unconditional speed, Nimblestep is a movement-cost waiver rather
  than a speed bonus, and Reactive Tumble is a free triggered action outside the one-per-round limit.
- `signature_trait_name` in the ancestry record names only Shadowmeld, while Polder has two signature
  traits. Driving the free-trait list from that field would silently drop Small! and with it size 1S.
  Our module already lists both; the risk is for any future importer.
- Shadowmeld's final clause is absent from the structured `effects` field in the markdown frontmatter,
  the unified YAML, the unified JSON and the trait-nested copy, while the body and `metadata.content`
  carry it. Checked in our own code rather than assumed: the renderer prefers the full content text
  and only falls back to structured effects when no content row matches, and our compendium record
  stores the complete body, so the clause is shown today. That makes it an assertion to add, not a
  defect to fix.
- Unspent points are settled by Q-CHAR-10, so no rules question is raised.

No application, evaluator, shared-contract, `main`, runtime or hosted change was made, and no
install, build, typecheck, test or browser was run anywhere.
