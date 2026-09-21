# V101 Fury level-one rules review

**PASS — static source, implementation and proof-code review** at `ddc7edf`, ENGINE,
2026-09-21. No tests were run by the reviewer. TESTER execution and generator certificates remain
separate evidence; this verdict does not claim that the authored journey has passed live.

Authority: Steel Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`, specifically
`en/unified/md/class/fury.md`, Fury level-one feature/ability files, Stormwight common and
Boren/Corven/Raden/Vuken feature files, their kit entries, and `chapter/kits.md`.
The independent inventory is preserved in `docs/build/audits/V101-fury-source-audit.md`.

The implementation retains all three aspects, their correct skills/features/triggers, ordinary-kit
versus Stormwight-kit eligibility, and all four choices in each Fury ability group. Stormwight kit
features now follow `kit.choice` in evaluator order; their aspect condition and kit selection remain
intact. Changing aspect/kit prunes incompatible grants while the admitted build remains separate
from the edited draft. Existing higher-level limits are retained.

The six source witnesses correctly represent true-form statistics for Mountain, Panther, Boren,
Corven, Raden and Vuken, including recovery/winded arithmetic and all three characteristic arrays.
Printed kit-signature damage includes kit bonuses once. Ordinary Fury Melee+Weapon damage receives
the selected kit bonus, including area/non-Strike abilities. The inspected cost ledger names
Ferocity for all eight paid source choices and five one-point embedded spends.

Tide of Death's Self header describes movement, not a victim of its damage roll. Its source-specific
runtime guard removes automatic roll/tiers and produces a recorded manual use while retaining
fixed payment. The authored journey targets Self, asserts `ability.recorded` and unchanged live
state excluding the separately checked resource debit, then verifies insufficient-resource blocking.
This guards against accidental self-damage; it does not claim spatial traversal or victim rolls
are automated. The existing Sticky Bomb manual-roll guard remains intact.

The 18 embedded uses retain their parent grants, triggers, costs and manual boundaries. In
particular, Lines of Force replaces M with 2M; Uttermost End's optional spending retains winded/
dying distinctions, once-after-strike Stamina loss and the outside-combat Victories limit;
To the Death's opportunity attack is explicitly a target-use proxy. Stormwight form sizes,
movement, equipment restrictions and crow/rat ability restrictions remain manual. Growing Ferocity
thresholds and end-of-own-turn persistence remain source-backed manual rules rather than
unconditional baseline changes. Level-four and higher form benefits are not granted at level one.

The authored public-API cohort covers 40 distinct names: 20 Fury/Stormwight source abilities,
two ordinary signatures and 18 embedded uses. It checks persisted build/grant readback, owner
refusal, draft pruning, independent damage/cost expectations, payment, blocking, waiver and manual
state readback. The existing V25/V32 fixture changes add only the newly available embedded grants
apart from a textual escape normalization.

No blocking findings remain. The earlier suspected kit-parent provenance defect was retracted:
`kit()` returns contribution-row IDs for signature provenance; `kit.choice` is the kit-name
provenance. No repair was required for that finding.

Reviewed-By: ENGINE (pass, 2026-09-21)
