# V63 shared-main proof runner review

Date: 2026-09-20. Independent reviewer: `v63_main_proof_review`.
Reviewed candidate: `41f32eb12867b346a752479cadb6894977661551` on
`slice/V63-main-proof`, rebased onto `9675634`, plus the formatter-produced runner
bytes identified below. Initial static review used base `b6109b0`; the follow-up runner
diff is formatting only. The runner was authored by another agent;
the integration lead added its `tsconfig.web.json` include. This reviewer owns only this
document and performed static reads, with no tests, builds, dependency installation,
runtime changes or browser execution.

## Runner implementation readiness verdict: PASS

No blocking source defect found. Fresh scoped formatting, lint and TypeScript checks pass
for the reviewed bytes. The bounded runner is ready for clean integration into main and
the integration owner's subsequent coordinated CT114 main trial. This supersedes the
initial provisional verdict; it is **not V63 application/runtime acceptance**.

Shared-main live proof remains pending. Static inspection and scoped checks cannot establish
backend availability, public setup success, random-roll execution or persisted behavior.
After clean integration and main synchronization, supply actual source metadata, CLI exit
status and sanitized readback for runtime acceptance review. Requiring that main-only trial
before the runner can be integrated would invert the required clean-source execution order.
No browser run or additional runtime environment is required by this review.

## Fresh scoped evidence inspected

The integration lead ran, in the stopped isolated CT114 `engine-corrections` build container:

```sh
pnpm exec prettier --write scripts/v63-headless-main.ts tsconfig.web.json && pnpm exec eslint scripts/v63-headless-main.ts && pnpm exec tsc -p tsconfig.web.json
```

Inspected [check output](../evidence/V26/main-corrections-2026-09-20/v63-main-runner-check-output.txt),
[exit status](../evidence/V26/main-corrections-2026-09-20/v63-main-runner-check-exit.txt)
(`0`) and [file hashes](../evidence/V26/main-corrections-2026-09-20/v63-main-runner-files.sha256).
Both SHA-256 values match the local reviewed files:

- Runner: `6dbb5e82162521d1fc30f22f9af5dc08ba78727cedf5eb0eb3701126ab1d1346`.
- TypeScript config: `879b5662a1dd31a2de392877cfb4d30a12209d1e4187bec8bee87e2e1e2b9a94`.

The runner was not executed on that isolated target. The lead reports that its application
source retained the previously checked V63 code with only runner/config overlaid; these scoped
checks are not a new full check of main `9675634` and not shared-main runtime evidence.
This reviewer inspected the artifacts and formatter diff without rerunning workloads.

## Scope and contracts read

- [Build review standard](../README.md#review-standard),
  [headless completion gate](../README.md#programmatic-headless-completion-gate),
  [test value](../README.md#test-value), and browser moratorium.
- [V26 shared-main work log](../V26-compiled-ability-effects.md#2026-09-20--shared-main-correction-proof-runner-prepared).
- [Director edits to inline results](../../table-spec.md#director-edits-to-inline-results).
- `agent.MD`, the prior bounded [V63 review](V63-headless-final-review.md), and existing
  public ability operations/results, actor/target fact adapters, correction resolver and CLI.

The bounded addition is a parity harness for existing R04 resolution and V63 history policy.
It changes no application mechanics, content or pinned rules. A new rules review is not
required: no new mechanical formula or fixed expected damage is claimed. Shared R04 output
is explicitly an oracle for persistence/reconciliation parity, not independent verification
of that same resolver. No online rules or abandoned Opus material was used.

## Acceptance inventory

| Check | Status | Evidence and limit |
| --- | --- | --- |
| Main target restricted before mutation | Verified statically | Explicit opt-in; canonical checkout plus SHA-256 identity; exact shared HTTPS origin and container endpoints; anonymous `.env.local` deployment; injected deployment/admin credentials refused. Runtime source commit and dirty state retained. |
| Preserve existing main data | Verified statically | No reset, import, seed, dice-state helper or deletion. New accounts/campaign/hero/foe are made through public operations and remain for inspection. Sign-out removes authentication sessions only. |
| Supported application route | Verified statically | Real BetterAuth registration/token; public campaign, character, foe and session mutations; actual `scripts/app.ts command` subprocess for gameplay; separate authenticated public queries for readback. |
| Expectations precede claimed output | Verified statically | Sheet tiers, character baseline and target health are read before use. Only the accepted random dice are read afterward. The resolver derives each expected corrected result from those original facts. |
| Random-roll robustness | Verified statically; live not verified | No chosen roll or retry loop. Bane changes may preserve tier/damage. Critical/high rolls may Slay; persisted Slain is compared with the resolver and target binding permits correction of the retained foe. Signature cost absence is asserted. |
| Both-role windows and live-state conservation | Verified statically; live not verified | Every capture compares player/Director `mayCorrect` and `mayResolve`, target Stamina/temporary Stamina/Slain, full hero live state, dice and target outcome. Player manual-resolution permission is always false. |
| Linked correction/undo/redo and refusal boundaries | Verified statically; live not verified | Exact effective correction IDs; original ability dice; correction kind/cause/payload IDs; undo/redo targets; undone second correction; Director seam; disposition and rewind; unrelated turn end; readback after denied mutations. |
| Credentials kept out of evidence | Verified statically | JWTs stay in memory/child environment. Passwords, auth responses and transport exceptions are not serialized. Artifact contains public game-state reads and hashes; failures report only stage. |
| Existing isolated runner/guards/helper unchanged | Verified statically | Candidate does not edit `scripts/v63-headless.ts` or its dice import helper. |
| Scoped runner formatting/lint/types | Verified | Supplied CT114 output and exit 0; runner/config hashes independently match reviewed files. |
| Actual shared-main lifecycle | Not verified; runtime acceptance pending | Awaiting post-integration main execution evidence. Historical isolated proof is not relabeled as this runner's main proof. |

`mayResolve` is a policy/window boolean in the public query, not a count of unmarked
clauses. Its expected true value immediately after marking one clause matches that API;
the disposition blocks correction until rewind. Public event fields and correction payload
links used by assertions match the existing operation/read contracts. Director-only numerical
damage readback is intentional; the player result retains audience filtering.

The added value is an actual shared-main public-route check that detects read/mutation window
disagreement, double damage reconciliation, lost dice, incorrect history linkage, changed
hero resources and successful forbidden corrections. It does not replace the existing
independent rules arithmetic review or claim exhaustive random-roll coverage from one run.

Chords whoami/list/check calls returned an ambiguous provider session, including the closing
check. No sender identity was guessed; findings were sent directly to the integration lead.
