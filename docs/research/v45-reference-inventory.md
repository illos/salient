# V45: Portable foundation reference inventory

Recovered 2026-09-19. This supplies repeatable comparisons for the three existing supported
builds while the shared foundation is extracted. It adds no character options and certifies no
new ancestry/class family. Test execution, independent review and browser verification belong
to the foundation acceptance record; artifact recovery alone does not establish that verdict.

## Provenance and preservation

The actual historical Forge website exports were recovered from the sibling checkout
`/srv/presidium/projects/salient/characters-build/.playtest/`. Each retained file was copied
byte for byte and its byte count and SHA-256 matched the original capture metadata before
copying. The [portable manifest](../../tests/fixtures/v45-reference/manifest.json) records the
original path, recovery origin, capture date/version, byte count and hash for all 15 retained
artifacts. No export was generated, rewritten, repaired or recaptured for V45.

The unchanged pins are Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` (rules
authority), and Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`, package version
14.197.0 (structure/serialization reference). Website version drift is retained explicitly.
The sourcebooks enabled in each export remain unchanged: Bethell has `core, orden`; Grug has
`core, orden, beastheart, summoner`. The selected builds use the audited core options; enabled
sourcebook lists are not evidence of supplemental class support.

| Build | Actual website capture | Portable raw export | Appropriate foundation use |
| --- | --- | --- | --- |
| Bethell Corrected V25: Polder / Fire Elementalist 1, Mage's Apprentice, no kit | 2026-09-15, website 14.198.0 | [Corrected export](../../tests/fixtures/v45-reference/Bethell-corrected-export.ds-hero) | Completed corrected build; selected traits, choices, embedded active abilities and captured sheet totals |
| Grug: Devil / Berserker Fury 1, Soldier, Mountain | 2026-09-16, website 14.199.0 | [Level one](../../tests/fixtures/v45-reference/Grug-level-1.ds-hero) | Exact existing build preservation, with one deliberately deferred Soldier language |
| Same Grug advanced to Fury 2, Danger Sense and Wrecking Ball | 2026-09-16, website 14.199.0 | [Level two](../../tests/fixtures/v45-reference/Grug-level-2.ds-hero) | Existing advancement preservation; same language deferral |

Readable captures accompany the exports: [Bethell sheet](../../tests/fixtures/v45-reference/Bethell-corrected-sheet.png),
[Grug level-one sheet](../../tests/fixtures/v45-reference/Grug-level-1-sheet.png),
[Grug level-two sheet](../../tests/fixtures/v45-reference/Grug-level-2-sheet.png), corresponding
plain text, and level-two main/maneuver/trigger/free-strike card text. Both Grug website
reimport/export files are portable too. Their historical capture asserts—and the new test
checks—that only the colliding top-level hero ID changes on reimport.

Original evidence remains [V25 metadata](v25-corrected-forge-reference.json),
[V25 independent source audit](v25-character-source-audit.md),
[V32 metadata](v32-forge-reference.json), and the
[V32 progression contract](v32-fury-progression-contract.md).
Those historical documents truthfully described ignored artifacts as nonportable at the time;
this recovery manifest supersedes that storage limitation for the listed files only.

The original invalid Bethell premade and the manually corrected input remain available in the
old ignored checkout, but are not promoted as accepted counterparts. The retained corrected
**export** was downloaded after actual website import/re-export, as documented in V25. The
three corrections were culture Tailoring, class Alchemy/Blacksmithing/History, and Empathize
replacing duplicate fixed Magic. A synthetic edited input would not establish website parity.

## Read-only comparison boundary

[The comparison helper](../../tests/helpers/v45-reference.ts) follows these pinned structural
entry points without importing Salient content or calculating expected statistics:

- `vendor/forge-steel/src/logic/feature-logic.ts`: `getFeaturesFromClass` admits only levels up
  to the hero level and selected subclass branches. `simplifyFeatures` descends through chosen
  features/perks, multiple features and selected kits, never the unselected option catalogs.
- `vendor/forge-steel/src/logic/hero-logic.ts`: `getAbilities` resolves selected class ability
  IDs separately from embedded granted abilities; `getLanguages` and `getSkills` distinguish
  actual selected values from the editor's deferred-language placeholder.
- The helper recognizes only the feature shapes needed by these references. Unsupported
  containers, complications, inventory/title grants, noncomplete tutorial mode and ability
  customizations fail explicitly. Later units must deliberately extend and verify the projection.

[The automated comparisons](../../tests/character-v45-reference.test.ts) map every current
fixture selection to its actual raw-export choice, including inciting incidents, nested skill
choices, assigned characteristics, perks and abilities. They compare active grants, characteristics,
skills and languages to independently established fixtures, then compare Salient evaluation
against the same expectations. Captured sheet text supplies the observed Forge numerical totals;
the helper does not manufacture a second statistical oracle. Original fixture ledgers are checked
against their pinned source hashes. An explicit negative case proves embedded future and
unselected definitions do not become active, while unsupported active containers fail.

Independent numerical/grant expectations remain in
[Fury 1](../../tests/fixtures/v25-fury.json),
[Fury 2](../../tests/fixtures/v32-fury-level-two.json), and
[Bethell](../../tests/fixtures/v25-bethell.json). Their source ledgers and existing rules reviews
precedate this extraction. Source-based arithmetic includes Fury Stamina 21 + Mountain 9 = 30,
then +9 at level two = 39; recoveries 10; Recovery Value 10 then 13; winded 15 then 19.
Bethell has Stamina 18, recoveries 8, Recovery Value 6 and winded 9. Read the ledgers for all
ancestry, kit, ability and background contributions; these numbers are not evaluator snapshots.

## Explicit differences and limits

- Both Grugs have one actual Soldier language, Vaslorian, in a two-language entitlement.
  Salient represents the other slot as `null`; Forge displays `I Speak Their Language (Soldier)`
  and marks Career In Progress. The placeholder is not a fourth granted language. These are
  lawful deferred-choice preservation witnesses, **not completed-character witnesses** for the
  forthcoming all-option Fury unit. Salient's build status `complete` permits that lawful deferral;
  it is distinct from the comparison procedure's completed-character target.
- Corrected Bethell is a completed reference. The authored name differs from the Salient fixture
  `Bethell` by the recorded `Corrected V25` suffix only. Mage’s Apprentice punctuation normalizes
  to an ASCII apostrophe; Forge's `Pain For Pain` maps to source `Pain for Pain`.
- Forge serializes duplicate fixed Magic replacement as the career's flexible skill slot. Salient
  keeps both fixed Magic origins and the separate replacement entitlement. Same effective skills
  alone cannot prove that provenance; the existing V25 tests continue to check both origins.
- Both free strikes are shared grants supplied outside the exported active ability graph.
  They are checked against source expectations and retained Forge card evidence; the raw
  export comparator explicitly excludes only those two abilities from embedded-ability equality.
  Source feature wrappers/entitlements also need not be independent Forge feature records.
- Forge's `Acolyte of Fire` corresponds to the source's `Fire: Acolyte of Fire`. V25 records the
  Practical Magic keyword and Flesh, a Crucible text differences. V32 records Wrecking Ball's
  distance/target-label difference. Preserve source wording, not website errors or simplifications.
- Level-two Forge XP is 16 after editor advancement. This is website behavior, not permission
  for Salient to award XP as an advancement side effect. Raw `state.renown` is zero; displayed
  renown is one after career grants. Live state is not a substitute for derived totals.
- Winded was not displayed in the captured desktop sheet. Bethell's rendered damage cards were
  not captured. Those expectations remain independently source-derived, not observed website
  damage-card/winded parity. No helper execution verifies Salient persistence, browser behavior,
  campaign admission, history or interchange; those remain separate required foundation checks.

## Next counterparts

No new reference capture is required to establish what these recovered bytes historically
contain. Execute the portable tests on CT114 and include the result in the foundation audit.
Run the existing editor/persistence/history/browser checks on the same integration candidate.
Investigate every unexplained source or reference mismatch before merging.

For each new ancestry/class level unit, build enough completed website counterparts to cover
every newly supported option, preserve exact exports plus readable sheets/card evidence,
and add the option-to-build ledger. Complete both Soldier language choices for new Fury
witnesses. Capture missing rendered values when a new unit depends on them. Extend the bounded
projection for each newly encountered selection shape with source/structure review; retain
independent source calculations. Dwarf, other Devil/Polder traits, Reaver/Stormwight and
Earth/Green/Void have no completed counterpart evidence in this recovered set.

Recovery and read-only metadata inspection ran on Presidium; no dependency, build, server,
browser or test workload ran there. All test execution and any fresh browser capture must use
the parent's coordinated CT114 environment.
