# V54: Dragon Knight level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Ancestry implementer (Opus thread `88b6a7e6-2590-4c52-bdef-efe85bf82e74`) |
| Rules review | Required for the implementation commit; this preparation makes no certified rules claims |
| Depends on | V45 foundation (merged); V46 pilot verdict gates implementation; V46 `b2c660a` contracts for Wings |
| Unblocks | Dragon Knight ancestry contrast builds |
| Status | Preparation in progress; see `STATUS.md` |

## Goal

Deliver the Dragon Knight ancestry at level one as one reviewed implementation commit: the
Wyrmplate signature trait with its six damage types, and all six purchased traits within the
three-point budget. Boundary: no content above level one, no combat automation, no change to
existing Devil, Polder, Fury or Elementalist behaviour, and no weakening of the settled Q-CHAR-15
Prismatic Scales prerequisite.

**Preparation only.** No option is enabled, no reference captured, no script run, no verification
performed. Implementation waits on the V46 pilot verdict.

The complete source inventory, the trait ledger and the Forge divergence are in
[the preparation research](../research/dragon-knight-level-one-preparation.md).

## Newly delivered options

| Decision | Options | Notes |
| --- | ---: | --- |
| Wyrmplate damage type | 6 | acid, cold, corruption, fire, lightning, poison — **no sonic** |
| Purchased traits | 6 | within a 3-point budget |
| Prismatic Scales type | **6 or 0** | **Unresolved.** Depends on [Q-CHAR-21](../rules-questions-for-user.md) |

**Twelve or eighteen newly selectable options, and this unit does not decide which.** Under the
reading where Prismatic Scales is pinned to Wyrmplate's current type it adds none; under the reading
where it selects one of Wyrmplate's six types it adds six. An earlier draft asserted the first and
called the second illegal. Salient already ships the second on the complication path, so the
question is raised rather than settled here.

## Implementation gap map

There is no `shared/content/ancestries/dragon-knight/` module and no evaluator; `ancestry.choice`
carries the option with `supportedInV001: false`. The ancestry is unimplemented.

**Do not author duplicates, and the existing surface is larger than an earlier draft recorded.**
V37 already delivers, on main: Dragon Breath and Draconian Pride ability records in
`shared/content/supporting-complication-abilities.ts`; **all six** purchased traits in
`shared/content/supporting-complications.ts` with SCC ids, costs, sources and a two-point
`exactBudget` shape, not merely Draconian Guard by id; a `requiresFeature: 'Wyrmplate'` gate on the
relevant pool option; and `complication.dragon-dreams.immunity`, a **six-option** Prismatic Scales
immunity decision with no link to any Wyrmplate selection.

V54 reuses these and must not disturb the complication path. **This is also a live contradiction the
unit must not paper over:** if Q-CHAR-21 resolves toward pinning, the ancestry path would forbid
exactly what `complication.dragon-dreams.immunity` already offers, and acceptance check 8 below
would need amending rather than the contradiction shipping.

## Same-build Forge witness plan

Three trait builds cover all six purchased traits and three is provably minimal, since the three
two-point traits are pairwise exclusive. Wyrmplate's six types need six witnesses, so **six
completed counterparts** is the minimum for full option coverage.

Prismatic Scales appears in **every** build, so the plan holds under either reading of Q-CHAR-21. An
earlier draft carried it in only two builds, which would have left four options uncovered under the
six-type reading and failed V44's option-to-fixture gate.

| # | Wyrmplate type | Purchased traits | Prismatic Scales type |
| ---: | --- | --- | --- |
| K1 | acid | Prismatic Scales + Dragon Breath | acid |
| K2 | cold | Prismatic Scales + Draconian Pride | cold |
| K3 | corruption | Prismatic Scales + Wings | corruption |
| K4 | fire | Prismatic Scales + Draconian Guard + Remember Your Oath | fire |
| K5 | lightning | Prismatic Scales + Dragon Breath | lightning |
| K6 | poison | Prismatic Scales + Wings | poison |

Every build pins Prismatic Scales to its own Wyrmplate type, legal under both readings. K1–K4 cover
all six purchased traits; K5 and K6 complete the Wyrmplate types.

Class and background are held constant so ancestry contributions are isolated; the constant
selections are chosen when the reference data is authored, not assumed here.

**A capture note.** Forge flattens Prismatic Scales into six independent one-point options, so its
editor permits a mismatched pair. Whether the source permits one is exactly Q-CHAR-21. Pinning both
to the same type in every witness is legal under both readings and sidesteps the question. Other
Forge divergences — "Draconic Pride", Wings wording, an attached ancestral culture — are recorded in
the research document and must be normalized or explained before merge.

## Acceptance checks

The V44 gates apply unchanged. Unit-specific additions:

1. All six Wyrmplate types and all six purchased traits appear in at least one completed same-build
   counterpart, with Prismatic Scales pinned to its build's Wyrmplate type.
2. With Wyrmplate and Prismatic Scales on the same type, the build carries **one** immunity entry at
   the level value with **both** provenances — not a doubled value, since only the highest applies.
   Note plainly: under the pinned reading this means Prismatic Scales has **no observable level-one
   value**, because respite reselection is out of scope. That is a legitimate outcome and must be
   stated rather than left to imply a mechanical benefit.
3. Remember Your Oath leaves `savingThrowThreshold` at its baseline. An implementation that sets it
   permanently to 4 fails; contrast the Devil's Impressive Horns, which is permanent at 5.
4. Dragon Breath's damage type is not fixed at build time; it is readable as a per-use choice.
5. Wings records a movement mode and a conditional weakness gated on flying **and** level ≤ 3; the
   aloft limit is `max(1, Might)`. It never enters `damageWeaknesses`.
6. A four-point combination is refused; the ten legal three-point sets are accepted. State whether a
   one- or two-point build is accepted with a warning or refused: the Devil decision uses a budget
   without `exactBudget` while Dragon Dreams sets it true, so the shipped shapes disagree and this
   unit must pick one deliberately.
7. Prismatic Scales remains unavailable without Wyrmplate, preserving Q-CHAR-15.
8. Existing Devil, Polder, Fury and Elementalist behaviour is unchanged. The Dragon Dreams path is
   unchanged **unless** Q-CHAR-21 resolves toward pinning, in which case
   `complication.dragon-dreams.immunity` and this check are revisited together rather than left
   contradicting the ancestry path.

## Out of scope

Content above level one. Respite reselection of the Wyrmplate type. Flight, oath recitation,
triggered damage reduction and all ability execution. Import/export adapters. Any change to the
Dragon Dreams complication behaviour.

## Open questions

[Q-CHAR-21](../rules-questions-for-user.md) — does Prismatic Scales select one of Wyrmplate's six
possible types, or is it pinned to the one Wyrmplate currently grants? Raised because it changes the
delivered option count from twelve to eighteen, changes the data model, and because Salient already
ships the six-option reading on the complication path while an earlier draft of this unit called
that reading illegal.

[Q-CHAR-15](../rules-questions-for-user.md) settles the separate *prerequisite* question and is not
reopened. [Q-CHAR-7](../rules-questions-for-user.md), still deferred, concerns the same trait for
Revenants and its recorded research recommendation presupposes the six-type reading.

## Work log

2026-09-19: claimed V54 preparation on `slice/V54` in `/srv/presidium/projects/salient/opus-dragon`,
cut from main `853789e`. Read the pinned ancestry entry, all eight trait files, the book section,
the size/speed and damage-immunity rules, the resolved Q-CHAR-15, the existing V37 complication
overlap, and the Forge structure via `git show` without touching the pin or sparse configuration.

No application, evaluator, contract or vendor file changed; no option enabled; no reference
captured; no script run; no dependency, build, server or browser workload anywhere, and nothing on
CT114, which V52 now owns.
