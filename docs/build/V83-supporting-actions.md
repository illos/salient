# V83: Core perk and ordinary kit action coverage

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App lead |
| Rules review | required |
| Depends on | V37, V74, V82 |
| Unblocks | Level-one supporting-choice completion |
| Status | In progress on `slice/V83`; not merged |

## Goal

Audit all 47 core perks and 21 ordinary kits for usable granted actions, close confirmed omissions,
and prove saved grants through the shared character and table API. Keep readable granting features
and source restrictions. Effect automation and additional classes remain separate work.

## Spec references

- [Trait-granted ability gate](README.md#trait-granted-ability-completion-gate).
- [Headless completion gate](README.md#programmatic-headless-completion-gate).
- [Wizard decision system](../character-wizard-spec.md#3-decision-system).

## In scope

- Fresh pinned-source audit of every core perk and ordinary kit, including prose actions.
- Missing sourced grants and correct character-sheet/table action grouping and availability.
- Saved parent replacement, readable manual effects and relevant permission/resource boundaries.
- Bounded focused checks, full check, public API verification and independent review.

## Out of scope

Class expansion (including Stormwight kit eligibility), complication audit, starting-reward fulfillment,
combat effect automation, browser tests and infrastructure repair. Complications and starting rewards
are the next separately bounded portions of the user-approved supporting coverage plan.

## Inputs and dependencies

Current main `42211f5`; Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` and
Forge `5a846aadb623a9855a023e9403bb887a956c341f`. Preserve ENGINE V72 integration and shared app data.
No Opus pilot inputs. Lead owns shared integration and verification; native Astra agents independently
inspect perk and kit sources.

## Deliverables

Perk/kit audit ledgers, any required action catalog/projection fixes, meaningful persisted tests and
headless evidence linked here. Update the current handoff at delivery.

## Acceptance checks

1. Every in-scope source is classified as granting an action, modifying one, or neither.
2. Granted actions retain source timing/text and the granting feature; no invented action cost.
3. Saved choices produce corresponding character/table actions; replacement removes obsolete grants.
4. Public API operations prove grants and manual use; unrelated resources remain unchanged and
   unauthorized callers cannot read or use private character actions.
5. Focused checks, full repository checks and independent implementation/source review pass.
   Record blockers without timeout increases or repeated verification attempts.

## Ability design and playtest evidence

No new effect automation. Source-backed manual action exposure follows the trait-granted ability gate;
live programmatic proof is required. Browser tests remain prohibited.

## Rules research

Read the pinned `en/unified/md/perk/` and `en/unified/md/kit/` records, including referenced rules.
The audit ledgers will identify exact action sources and expected behavior before implementation.

## Open questions

None at start.

## Work log

2026-09-20: user approved the supporting-coverage plan. Started this first bounded portion from
main `42211f5` in `.worktrees/supporting-actions`. Local checks can use available Node24 dependencies;
live backend target will be coordinated separately. No runtime changed yet.
