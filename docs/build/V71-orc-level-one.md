# V71: Orc level one

Status: candidate implemented; remote verification and independent reviews pending. Not merged or
accepted. Browser tests are suspended under the site-wide moratorium. Rules review: required.

Spec: [decision system](../character-wizard-spec.md#3-decision-system),
[shared operations](../character-wizard-spec.md#9-shared-operations-and-reliability),
[V44 delivery scope](V44-character-option-delivery.md).

Character track, native Astra Orc implementer. Branch `slice/V71`, worktree `.worktrees/astra-orc`,
from current main `1f65278`. Owned files: `shared/content/ancestries/orc/level-one.ts`,
`shared/evaluate/ancestries/orc.ts`, `tests/character-v71-orc.test.ts` and this record. The lead owns
registration, generated corpus, shared integration and remote runtime. No Opus inputs were used.

## Source contract and implementation

Expectations were derived before tests from pinned Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`, under
`en/unified/md/feature/trait/orc/`, plus `skill/group/crafting.md` and the shared ancestry base rules.
All five purchases are available within three ancestry points. Relentless is automatically granted:
when damage leaves the hero dying, a free strike may target any creature; reducing that target to
zero Stamina permits spending a Recovery. These remain readable manual effects.

| Purchase | Cost | Build effect / manual effect |
| --- | --- | --- |
| Bloodfire Rush | 1 | First damage in a combat round grants +2 speed until round end; never permanent baseline speed |
| Glowing Recovery | 2 | Catch Breath may spend as many Recoveries as desired; no added capacity or healing value |
| Grounded | 1 | Permanent +1 stability, stacking with kit stability |
| Nonstop | 2 | Permanent slowed immunity |
| Passionate Artisan | 1 | Choose two distinct crafting skills, owned or unowned; +2 only on crafting-project rolls using those targets |

Orc defaults are size 1M, speed 5 and stability 0 before kit contributions. Artisan's stored choice
`ancestry.orc.passionate-artisan.skills` is a skill target, not a skill grant. Its selected values and
conditional project benefit appear in derived supporting choices; ordinary skill bonuses remain
unchanged. All ten crafting skills are offered. Removing Artisan or changing ancestry prunes the
child choice. Budget violations cannot leak permanent traits into partial builds.

## Witnesses and test value

Each test states the failure it catches. Six focused cases cover kit/no-kit stability and health,
conditional speed versus immunity, owned/unowned Artisan targets, invalid/missing Artisan picks,
four-point rejection without immunity leakage, and cleanup after trait/ancestry replacement.
Tests exercise the real evaluator after shared registration, not a test-only registration shim.

The lead's remote authenticated API runner should create, transition, save, retry, read back and
inspect a completed level-one Fury for each loadout below. Preserve current resources on edits;
prove Artisan target removal after a parent edit and retain unrelated character choices.

| Witness | Purchases | Expected result |
| --- | --- | --- |
| A | Grounded + Nonstop | Stability 3 with Mountain kit; slowed immunity; speed 5 |
| B | Bloodfire Rush + Glowing Recovery | Stability 2; speed 5; 10 Recoveries; recovery value 10 |
| C | Bloodfire Rush + Grounded + Passionate Artisan | Stability 3; speed 5; Blacksmithing + Tailoring project targets; Tailoring not granted |

All witnesses retain Relentless and source-readable selected traits. Source expectations apply
independently of Forge. Authentic completed Forge comparisons for these same choices remain pending;
no export or equivalence claim is invented. Browser scenarios to queue after the moratorium are
trait source readability, Artisan target selection visibility, and removing Artisan hiding its child.

## Integration handoff

Register Orc and its level-one decisions in the ancestry step. Import and call `applyOrcBaseline`
after class/kit vitals, before supporting and complication modifiers. The V65 generic trait collector
handles signature and purchased grants. Include `feature/trait/orc` in shipped trait-corpus ingestion.
No schema, backend write path or bespoke UI change is required. The public wizard discovery and
transition routes must expose the new decision and the existing persistence path must retain it.

No runtime workloads were run by this implementer. Focused checks, full check, authenticated headless
proof, independent implementation review and rules review remain with the lead's serialized CT114
queue. A failed required verification is a recorded blocker, not permission for an open-ended fix loop.
