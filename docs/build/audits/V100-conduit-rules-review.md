# V100 Conduit level-one rules review

Verdict: **PASS — static rules, implementation and proof-code review** at
`ec9108a2b41594c461815a537ab14b9f57d3e7c4`, reviewed by ENGINE on 2026-09-21.
This verdict does not certify test execution or the pending regenerated reports; those remain
TESTER-owned. The reviewer ran no tests and made no changes in the frozen checkout.

Authority: Steel Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/class/conduit.md`, `feature/conduit/level-1/`,
`feature/ability/conduit/level-1/`, and printed religion portfolios. Q-CHAR-6 excludes custom
portfolios from this delivery. The independent source inventory is recorded separately in
`docs/build/audits/V100-conduit-source-audit.md`.

The implementation matches the audited choices: two portfolio domains, one domain feature and
skill, five prayers, four wards, two triggered options, eight signatures (choose two), and four
options each at 3 and 5 Piety. The inventory contains 23 source abilities and 41 embedded uses.
Intuition-based statistics and potency, Conduit-specific feature wording, and domain grant/pruning
boundaries match the pinned sources. Steel recalculates Recovery and winded values; Speed adjusts
speed and Disengage; Destruction covers Magic rolled damage including area abilities. Bastion
subtracts one from the saving threshold after ancestry derivation, retaining provenance.

Manual boundaries remain explicit: Soldier's Skill requires actual equipment; Distance does not
claim automated range changes; Piety generation, domain triggers/effects, healing and Recovery
transfers, temporary benefits, positioning, companions and rituals are not inferred or silently
automated. Healing Grace retains its once-own-turn condition and manual outside-combat Victories
budget. The conflicting Sun/War introductory and named-domain trigger wording is recorded for
later resolution, with current trigger handling manual. Corpse eligibility is not inferred from
zero Stamina.

**R1 closed:** the embedded source adapter now labels paid effects Piety rather than Wrath.
Independent ledger assertions check costs, and the authored public-API cohort checks payment,
blocking, waiver, persisted target state and manual events. Source damage expectations and
Curse of Terror's applied/resisted strict thresholds were inspected. This is review of the proof
code, not a claim that its 64-action journey has executed successfully.

The reporting-only selected-pool helper constructs a consistent finite supported ancestor and
two-domain selection, checks shared availability/pool membership, and records the positive witness.
Unrecognized, excluded and dynamic shapes remain unknown. The runtime selected-pool gate is
preserved. The commit-slice parser's extension to three-or-more-digit slice numbers is appropriate.

No blocking findings remain. One nonblocking source-comment correction was sent separately:
Curse of Terror deals **holy**, not psychic, damage; its numeric expectations are correct.

Reviewed-By: ENGINE (pass, 2026-09-21)
