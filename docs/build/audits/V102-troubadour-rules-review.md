# V102 Troubadour level-one rules and implementation review

Reviewer: ENGINE. Date: 2026-09-21.
Candidate: `189cec8998c7f7abda1c87cb9b7aba53ad65a774`, branch `slice/V102`, against base `a03bfe755e8bdf0c3f6fd8b0a349b9b98dd45b71`.

**Verdict: static PASS. No blocking findings.** This is source/implementation/proof-authoring review, not evidence that the authored headless journey or full gate passed. No tests, backend, browser, auth, seed or deployment run by this reviewer.

Authority: pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`. See `docs/build/audits/V102-troubadour-source-audit.md` for the independent complete inventory and citations. Sources reviewed include `class/troubadour.md`, all level-one Troubadour feature and ability files, clean Heroes Troubadour headings, `chapter/kits.md`, and the four selected kit files under `vendor/steel-compendium/en/unified/md/`.

## Implementation

- All three acts, all three characteristic arrays, fixed Agility/Presence2, Stamina18, eight Recoveries and Presence potency match source. Skill choices and act skills are distinct; ordinary kit selection is correctly enabled. No higher-level progression was introduced.
- The 24 source envelopes are present: twelve selectable abilities, two common performances, Auteur3/Duelist3/Virtuoso4 grants. Both Virtuoso performances are granted. Sixteen embedded/manual actions are parent-gated through Troubadour provenance and exposed through both sheet and shared resolution adapters.
- Star Power base1 and Harmonize base3 agree with clean Heroes headings and unified frontmatter. Seven optional paid spends charge their incremental costs and describe the parent prerequisite; they do not replace parent costs. Drama resource parsing and existing outside-combat waiver are wired consistently.
- Upstage's Self header remains a movement envelope: its roll is suppressed so recording cannot apply taunt/prone to the caster. Thunder Mother activation also suppresses the roll: its optional end-round attack and level-based damage remain manual. Their source text remains available.
- Method Acting's optional actor bleeding/extra5 corruption is separate and explicit. Performance lifecycle, areas, timed grants, recovery/free-strike follow-ups, bonds, resource generation and resurrection remainder are manual. The review does not claim those effects are automated.

## Independent ledger and authored proof

Reviewed `tests/fixtures/v102-troubadour-expected.json`, `tests/character-v102-troubadour.test.ts`, `scripts/headless/troubadour.ts`, and the added Cutting Sarcasm source-threshold case in `tests/scripts/live-compiled-report.test.ts`.

Four Human Soldier witnesses span every act, all arrays, all twelve choice abilities and Swashbuckler/Cloak and Dagger/Sniper/Panther kits. Expected Stamina/recovery/winded are respectively21/7/10,21/7/10,18/6/9,24/8/12, with eight Recoveries each. Their speed/stability/disengage and selected skills/grants match the cited sources.

Damage arithmetic agrees with source:

- Artful Flourish4/7/9, Harsh Critic9/12/15, Fancy Footwork7/9/12 for Swashbuckler.
- Cutting Sarcasm5/8/10 and Fade5/8/10 for Cloak and Dagger; Cutting is Ranged+Weapon and receives +1, despite Magic.
- Instigator5/8/11, Quick Rewrite4/5/6, Patient Shot5/8/15 for Sniper. No ranged kit bonus on melee Instigator or non-Weapon Quick Rewrite.
- Witty Banter6/7/9, Method Acting8/12/20, Devastating Rush5/8/15 for Panther. Witty lacks Weapon; Method Acting gets Panther's tier3+4. Kit signature damage already includes kit bonuses and is not doubled.
- Power Chord, Hypnotic Overtones and Dramatic Reversal have zero direct damage; their non-damage outcomes remain explicit remainders. Thunder Mother1/6/11 is documented as manual, not claimed as a rolled persisted result.

The cohort invokes 44 distinct actions (24 source envelopes + four kit signatures + sixteen embedded uses), checks source costs, persisted events and target Stamina, manual remainders, zero-resource refusal, outside-combat waiver, owner refusal and class-act draft/admitted isolation. Artful Flourish uses two targets with both Stamina readbacks. The manual Method Acting exchange checks actor state separately from target state. Return to Life is invoked with negative Stamina and30 Drama; the proof intentionally checks that payment does not silently resurrect/heal the actor. This is a persisted manual-action boundary, not resurrection completion.

Cutting Sarcasm uses P2 target for resisted outcomes and independently built Fury P-1 target for applied outcomes at any random tier; applied readback checks bleeding, source-use-linked instance and registration ID. The pure source test covers all three thresholds0/1/2 with below/equal target scores, including equality resistance. It does not reroll to choose an outcome. This cohort does not independently roll a subsequent save or inspect the registration document; existing saving-throw coverage is reused.

## Limits and handoff

No new runtime rules corrections were required by this review. Prior authoring review of `c29559f` found no blocker; final candidate adds source ledger, generated content/reports and authored proofs. TESTER execution and report freshness remain separate gates. Generated reports were inspected as supporting inventory, not independently regenerated here.

Manual eligibility statements are not automatic enforcement. In particular, performance timing/previous Thunder Mother targets, spatial legality, optional parent-use prerequisites, and resurrection Stamina/remaining balance require manual resolution as disclosed. Existing outside-combat repeated-use handling is a warning, not new enforcement in this slice. Do not present this static PASS as proof of those automations.

Reviewed-By: ENGINE (pass, 2026-09-21)
