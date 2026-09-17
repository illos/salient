# Supporting character choices: complete core inventory

This inventory was requested on 2026-09-17. It reconciles the committed content snapshot with the
pinned Steel Compendium and compares every eligible record with pinned Forge Steel. The Compendium
establishes the rules; Forge supplies an independently maintained comparison implementation.

| Family | Core inventory | Detailed source and comparison ledger |
| --- | ---: | --- |
| Careers | 18 | [Backgrounds](v37-backgrounds.md#career-grants) |
| Inciting incidents | 108, six per career | [Complete records](v37-backgrounds.json) |
| Culture aspects | 13 | [Backgrounds](v37-backgrounds.md#coverage-and-database-reconciliation) |
| Skills | 57, in five groups | [Complete records](v37-backgrounds.json) |
| Languages | 42 | [Source tables and discrepancies](v37-backgrounds.md#coverage-and-database-reconciliation) |
| Core perks | 47 | [Perk controls and manual effects](v37-backgrounds.md#perk-controls-and-manual-effects) |
| Kits | 21 ordinary plus four Stormwight | [Kit ledger](v37-backgrounds.md#kit-baseline-ledger) |
| Complications | 100 | [Every complication](v37-complications.md#per-record-inventory) |

The JSON ledgers preserve complete source bodies, source identities and hashes, exact matched Forge
records, mandatory decision counts/pools, numeric contributions, conditional benefits, drawbacks,
Director inputs and per-record discrepancies. Eight supplemental Beastheart perks are explicitly
listed separately, outside this core database inventory. Stormwight kits retain their subclass
restriction; ordinary kit eligibility still comes from the character's class.

Important differences include Forge's text-only owned skill targets and borrowed Dragon Knight
traits; omitted Shared Spirit/Rival selections; an overly broad language category configuration;
a broken treasure defaulting active; and several turn-versus-round timing differences. The wizard
uses the pinned rules text and choices rather than copying these discrepancies. The source-based
Dragon Dreams prerequisite is recorded as [Q-CHAR-15](../v1-character-wizard-contracts.md#dragon-dreams-prerequisite-q-char-15).

Run `pnpm supporting:check` to reproduce inventory identity, exact source, snapshot and Forge-block
checks. Implementation and runtime validation are tracked in [V37](../build/V37-supporting-character-choices.md).
Creation choices and permanent build values are separate from parser/gameplay execution. Conditional
skills, selected treasures and source activation requirements remain explicit; a selected broken,
absent or secret item does not acquire unconditional active effects.
