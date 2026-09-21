# V106 Beastheart rules and implementation review

Candidate `aaef3bd5813344178259c5af9bd6a9f1727519e7`, slice/V106, base 88e51a2. ENGINE, 2026-09-21.

## Verdict: PASS — static review of the stated scope

R1 is closed. No remaining blocking static finding in the editor, derived companion projection, named manual action/payment routes or authored proof. No tests, generators, browser or backend operations were run by this reviewer. Full-suite, freshness and actual headless results remain TESTER-owned evidence.

Reviewed-By: ENGINE (pass, 2026-09-21)

## Rules and scope

Authority is pinned Steel Compendium fb83a789da8f0327a389c277a0c790b1648d5810. The independent inventory is `/tmp/v106-beastheart-source-audit.md`, persisted under docs/build/audits. Sources include class/beastheart.md, the level-one Beastheart features/abilities, all fourteen companion stat blocks and their level-one traits/actions.

Q-CHAR-14 includes supplemental editor choices/grants/derived builds. docs/table-spec.md explicitly defers companion behavior and turn integration. Accordingly this review approves a complete level-one editor and a sourced manual-record surface, not a fully automated two-creature combat implementation. Companion current Stamina, conditions, movement, Rampage, shared turn, Recovery/surge effects and special saves remain manual. The sheet and action descriptions state these boundaries; no second hero or fake companion actor is created. Existing hero kit actions retain their normal behavior.

Four wild natures and their skills/maneuvers/triggers, three characteristic arrays, one of four signature choices, one of four 3-Ferocity and one of four 5-Ferocity choices match source. Feral Strike remains a universal companion grant rather than a fifth selectable signature. Fourteen companions, seven drake attunements and the kit-versus-0/0/4 companion melee choice are represented. Handle Animals uses the linked skill identity despite Animal Handling wording in the class source.

## Derivation and provenance

The fourteen ledger witnesses match printed companion characteristics, size, base speed/stability, species features and abilities. Kit contributions agree with chapter/kits.md: Shining Armor gives hero Stamina33/recovery11/winded16; Cloak and Dagger24/8/12; Panther27/9/13; Sniper21/7/10. Companion maximum equals final hero maximum, with no second kit-Stamina addition. Companion speed/stability use its own species base plus kit, and no hero ancestry characteristic copy is made. Companion personal Recoveries are zero and the shared recovery value is displayed separately.

Bear adds stability to the hero, not to the bear's printed base. Drake's selected immunity and Hellhound's fire immunity are also reflected on the hero; unrelated species immunities are not automatically copied. Shared skill lists and duplicate-skill replacement witnesses are represented. Companion kit signature is excluded; no ranged free strike is offered. Printed free-strike3 is labelled a source value and remains manual pending the documented interpretation question.

R1: beastheartSourceText now requires a present source and returns its verbatim text. Granted provenance quotes that text alone. beastheartActionText separately combines manual guidance with the source for presentation. Both pure and headless assertions reject the authored guidance in the provenance quotation.

## Manual action and proof inspection

The 36 source envelopes (22 class,14 species), shared-performer variants, bounded spend choices and trait/contextual actions yield111 named records. Labels distinguish Beastheart, Companion, and the affected/adjacent creature cutting basilisk stone. Stormrage has its explicit companion follow-up; shared Heart of the Beast and nature triggers have both performers. Heart's1–5 spend is bounded by separate amount options; paid optional effects do not repeat the parent's base cost. Real Ferocity payments use the hero's pool; all other effects are recorded for manual resolution.

The authored cohort creates/adopts fourteen builds and reads sheets back against independent fixture values; checks exact grants, source presence and manual labels; refuses a non-owner transition; changes Drake to Bear and checks species-action pruning and unchanged admitted Drake; and exercises every distinct named record through commands:invoke. It reads durable event kind/name/manual effect text, target state and actor state back, checks exact resource debit and blocked reuse, and verifies the outside-combat waiver. A wrong-species Backhand request is refused. Pure assertions also check drake-attunement pruning, hero-only kit signature and rejection of level2/unknown companion.

These assertions prove the intended record/payment boundary when executed; they do not prove companion targeting, turn integration, automatic Rampage, Recovery spending, damage or condition handling. Each unique record is invoked once across witnesses, not every combination of species/nature/kit. The fixture covers all species and options distributed across builds; it is not exhaustive combinatorial coverage.

## Generated inventory and deferred questions

The committed manifest has1561 content entries, including all14 companion stat blocks. Removing their redundant explicit selection does not remove those entries. Supplemental loading is scoped to Beastheart level-one paths/stat blocks, preserving the later-level exclusion. Report classification distinguishes pure structural support from manual Beastheart live behavior:23 compiled/1469 compatibility/0 unavailable. Freshness must still be certified by TESTER.

The research generator adds Beastheart and Summoner advancement inventory under Q-CHAR-14, explicitly marking supplemental scope and inventory rather than implementation. Its110 rows are90 core plus20 supplemental; this does not implement Summoner or later levels. Updated research outputs and freshness checks remain generator/TESTER work.

The rules-question addendum preserves free-strike and companion-pronoun uncertainty and explicitly defers Lightbender expiry and Basilisk Stoned behavior. Those special effects are not incorrectly enrolled in ordinary condition-save automation. Future companion combat work must revisit these passages; this static acceptance does not settle their deferred implementation.

## Bounded generator repair at 05c4920

PASS extends to this exact tip. The only b6718a4..05c4920 change is source() in the research generator: exact Beastheart/Summoner class paths accept their expected supplemental SCCs from pinned unified files, rejecting mismatches. Other non-Heroes collisions retain the existing Heroes-book fallback. Runtime and authored proofs are unchanged. Static inspection only; successful generation/freshness remains with TESTER.

## Bounded reference repair at cb4a085

Static PASS extends to cb4a085. Reference ingestion now reads pinned Beastheart book sources, seeds inclusion from admitted manifest SCCs, follows same-book SCC dependencies with a visited set, and fails missing dependencies. Supplemental entries are labelled in both the contract and reference overview; source-path normalization recognizes the Beastheart book. Hero/monster book sources retain their previous expanded content and identity handling. Core membership remains asserted at2614 entries,20 chapters and9 classes; uniqueness, original-source metadata and unresolved-link assertions remain. Tests additionally require every manifest Beastheart source in the supplemental set.

The same-book closure can include later-level reference material reached from the class advancement table; this is readable reference coverage, not editor grants or automated support. It does not import Summoner reference content or remove level-one editor restrictions. The generated research matrix/index now record110 class-level inventory rows with supplemental labels; those rows do not certify implementation. This change addresses source visibility for the manual-record surface. Combat runtime and companion derivations are unchanged. No tests or generators were run by ENGINE; the peer's retained999 passes and active targeted/live runs remain TESTER evidence, not independently executed review results.

Reviewed-By: ENGINE (pass, 2026-09-21)

## Bounded build-coverage repair at aaef3bd

Static PASS extends to aaef3bd. The only executable delta from cb4a085 changes check-web-budget.ts reference coverage from2614 total to2614 core plus exactly122 supplemental Beastheart SCCs, with an exhaustive total check and the existing2507-foe assertion. The initial-JavaScript gzip limit remains strictly below200000 bytes. This is consistent with the reviewed supplemental reference inclusion and preserves the previous core and budget checks. The other change is the work log reporting TESTER progress. No product runtime change; no tests or build executed by ENGINE. Actual122-row coverage and successful budget execution remain TESTER evidence.

Reviewed-By: ENGINE (pass, 2026-09-21)
