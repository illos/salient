# Recheck — "Level-one source interpretations" (character-wizard-spec.md §8), revised diff

**VERDICT: PASS.** All four required corrections land, none introduced a source error, the three
narrowings still hold, and the Behold the Mystery edge is treated correctly. Remaining items are
stylistic or optional strengtheners, listed at the end. No genuine source conflict remains.

Read-only recheck of `git diff -- docs/character-wizard-spec.md` in
`/srv/presidium/projects/salient/wizard-plan` (now 41 added lines). Pin re-verified at
`fb83a789da8f0327a389c277a0c790b1648d5810`. Paths below are relative to
`vendor/steel-compendium/en/unified/md/`.

## 1. C1–C4

- **C1 ward timing — landed.** "The pin does not explicitly time the damage-type choice" plus the
  Hurl Element contrast is the right shape: `feature/ability/elementalist/level-1/hurl-element.md:41`
  does read "When you make this strike, choose the damage type from one of the following options:
  acid, cold, corruption, fire, lightning, poison, or sonic", and the ward file carries no comparable
  instruction. The interpretive step is now visible rather than implied. Also picked up the fact I
  flagged separately: the owning feature's respite ward change, with the same-ward type question
  still explicitly left open.
- **C2 citations — landed.** `feature/censor/level-7/natures-bounty.md` and
  `rule/damage/damage-immunity.md` are both linked and both exist on disk; I reconfirmed the Censor
  bullet is byte-identical to the Conduit one ("…choosing a different damage immunity each time").
- **C3 area caveat — landed as a scope bound; see §2.**
- **C4 alternatives — landed for all three.** Ward (choice afresh on each hit), distance (only the
  larger applies), rune (mandatory creation rune) are each named with a reason tied to the texts.
  The rune reason — "the trait grants this activity, without placing a rune on the hero at creation"
  — is the correct grant-versus-activity point, and the new "expressly permits removing a rune with
  the same activity" now carries the substance of `feature/trait/dwarf/runic-carving.md:16` ("You can
  have one rune active at a time, and can change or remove a rune with 10 uninterrupted minutes of
  work"), which is what makes zero runes a legal state.
- **New problems introduced: none material.** All four new links resolve on disk; the
  `chapter/kits.md#distance-bonus` anchor matches the literal heading "#### Distance Bonus" at
  `chapter/kits.md:120`. Every new assertion I checked is accurate to the pin ("expressly says",
  "expressly permits" are both fair to the quoted text). Wording nits only, below.

## 2. C3 bounding by scope

Honest and clearly stated. The note says the interpretation "addresses ranged reach; area-size
expansion is outside its scope", then cites the sentence that points the same way —
`chapter/kits.md:124`: "A distance bonus doesn't increase the size of any ability's area of effect."
Crucially it does *not* claim that paragraph governs Void Acolyte of the Mystery's non-bonus
"increases by 2 squares" wording, and it does not turn the paragraph into a general feature rule. It
also does not escalate the bonus/increase wording difference into a question, which is the right call
— that difference is not a blocker and nothing in the pin makes it one. The scope bound and the
citation both close in the no-expansion direction, so there is no "undetermined, implementer decides"
gap.

## 3. Behold the Mystery

Verified in the pin: `feature/ability/elementalist/level-1/behold-the-mystery.md` is level 1,
elementalist, keywords **Area, Magic, Ranged, Void**, distance **"3 cube within 10"**, target "Each
enemy in the area".

The note's treatment is correct. Both features apply (Magic + Ranged satisfies Enchantment of
Distance's "ranged magic abilities"; Magic + Ranged + Void satisfies Void Acolyte), giving **3 cube
within 14**. The split is not merely asserted — it is what the pin's own vocabulary says:

- `rule/combat/area-of-effect.md:7`: "When an ability creates an area of effect, it sometimes notes a
  distance for the effect in the form 'within X.' The number X tells you how many squares away from
  you the area can be." So "within 10" *is* the distance entry being increased.
- `rule/combat/cube.md:7`: "When an ability affects a cubic area, that area is expressed as 'X cube.'
  The number X is the length of each of the area's sides." So the "3" is a side length, not a
  distance, and nothing in the two feature texts reaches it.

The boundary is stated clearly enough that an implementer would not expand the cube: "ranged reach"
plus "area-size expansion is outside its scope" plus the Distance Bonus sentence. Optional
strengthener, not required — see R1.

## 4. Narrowings, provenance, overclaiming

- **Ward narrowing:** respected. Same-ward respite re-picking is still explicitly "unstated and
  outside this level-one interpretation"; the added respite sentence reports the source's ward change
  only, and claims no workflow exemption (so no tension with §4's "does not establish approval
  exemptions for prayers, wards, augmentations…" at `docs/character-wizard-spec.md:408`).
- **Distance narrowing:** respected. `chapter/classes.md` "Stacking Unique Effects" and
  `rule/dice/bonuses-and-penalties.md` are still absent; the rejection of "only the larger applies"
  rests on the two texts plus the absence of an exclusion in them, not on a universal theorem, and
  "Retain their separate provenance and applicability conditions" survives intact.
- **Rune narrowing:** respected. No required or default rune, options and Detection's chosen type and
  change/removal stay readable and manual, and "Rune-bearing states have not been verified by this
  note" is now explicit.
- **Overclaiming:** none new. The preamble still disclaims user-ruling and verification status, and
  nothing implies implemented support or counterpart coverage.

## Remaining items (all optional; none blocking)

- **R1.** Best available strengthener: cite `rule/combat/area-of-effect.md` ("within X" is the
  distance) and optionally `rule/combat/cube.md` alongside the Kits paragraph. That grounds the
  reach/area split in the general area rules rather than in a sentence that lives inside the Kits
  chapter, and would let a worked example ("3 cube within 10" → "3 cube within 14") be stated without
  any generalisation risk.
- **R2.** "The pin does not **explicitly** time the damage-type choice" — the hedge faintly implies an
  implicit timing exists. "does not time" is cleaner and matches what I found.
- **R3.** "changing wards through a respite ritual" compresses `elementalist-ward.md:9`, which reads
  "by performing a complex ritual as a respite activity". Respite activity is a defined term; use the
  source phrasing.
- **R4.** "The Distance Bonus rule" reads as a free-standing rule; a half-clause noting it is the
  Kits chapter's Distance Bonus section keeps its provenance visible.
- **R5.** Still no line anchors or quoted source sentences, unlike `docs/conditions-and-clock.md` and
  `docs/character-derived-values.md`. Purely a house-style gap now that the prose carries the
  substance.
- **R6.** "see also [damage immunity]" is a bare see-also; one clause on what it contributes (an
  immunity instance carries one named type, `rule/damage/damage-immunity.md:9`) would tie it in.
