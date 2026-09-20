# V63 shared-main proof runner review

Date: 2026-09-20. Independent reviewer: `v63_main_proof_review`.
Initial reviewed candidate: `41f32eb12867b346a752479cadb6894977661551` on
`slice/V63-main-proof`, rebased onto `9675634`, plus the formatter-produced runner
bytes identified below. Initial static review used base `b6109b0`; the follow-up runner
diff is formatting only. The runner was authored by another agent;
the integration lead added its `tsconfig.web.json` include. This reviewer owns only this
document and performed static reads, with no tests, builds, dependency installation,
runtime changes or browser execution.

## Current corrected runner implementation readiness verdict: PASS

The first live trial exposed a runner defect that the initial independent static review missed:
the `abilities:sheet` actor argument lacked required `name`. The earlier readiness PASS below
is retained as history, not a verdict for the corrected uncommitted source. Current review covers
the fix on base `a9a0e5d6f943fbf44720234a023ab2f4f8ff6e9e`. No further source blocker was found.
Fresh scoped formatting/lint/TypeScript checks pass, and the targeted negative compiler probe
rejects the exact omitted-name defect. The corrected runner is ready for clean integration,
main synchronization and a coordinated trial. Shared-main runtime acceptance remains unverified.

### Failed first main trial and corrective review

Inspected the original [readback](../evidence/V26/main-corrections-2026-09-20/initial-main-readback.json),
[output](../evidence/V26/main-corrections-2026-09-20/initial-main-output.txt),
[exit 1](../evidence/V26/main-corrections-2026-09-20/initial-main-exit.txt), and
[backend validation error](../evidence/V26/main-corrections-2026-09-20/initial-main-backend-error.txt).
Run `1ec1619e-d856-43b8-bb5f-bb1e5b7c8020` used clean canonical main `a9a0e5d`, lasted
4.016 seconds and failed before ability use. The original artifact has no captured records;
its stage misleadingly names the preceding successful turn command. The backend identifies
the actual failure as missing `.actor.name` on `abilities:sheet`. This does not establish an
application correction defect or prove any correction lifecycle behavior. Main data is retained.

The corrected request supplies `name: authored.name`, matching the required `actorRef` validator.
Every public query/mutation now takes a generated `api` reference and `FunctionArgs<Q/M>`
arguments. The generated declaration derives `api.abilities.sheet` from the registered query
and its validator. The negative `tsc` probe now confirms that required nested name survives
inference through this wrapper: removing only `actor.name` produces TS2741 at runner line 246.
`Promise<Json>` erases returned evidence types, not the supplied argument shape.
That compiler probe protects the actual observed defect; it is not a duplicated gameplay test.

The new `pre-use-facts` stage, earlier setup identity record and separate last-operation field
make this failure distinguishable from a turn-command failure and preserve campaign/hero/foe IDs
before the sheet read. Operation labels contain only public function names or a fixed CLI label;
the runner still excludes passwords, JWTs and transport exceptions from artifacts. Existing
target guards, no-reset/no-seed behavior, gameplay lifecycle and isolated runner are unchanged.
No test, build, install, browser or runtime command was run by this reviewer.

### Corrected scoped evidence inspected

Inspected the exact [check script](../evidence/V26/main-corrections-2026-09-20/v63-contract-check.sh),
[output](../evidence/V26/main-corrections-2026-09-20/v63-main-fixed-check-output.txt),
and [exit 0](../evidence/V26/main-corrections-2026-09-20/v63-main-fixed-check-exit.txt).
The CT114 job passed formatting, ESLint and `tsc -p tsconfig.web.json` on the corrected
source before removing the one argument for the probe. The negative compiler run produced
the expected [missing-name diagnostic](../evidence/V26/main-corrections-2026-09-20/v63-main-missing-name-type-error.txt)
and [exit 2](../evidence/V26/main-corrections-2026-09-20/v63-main-missing-name-type-exit.txt).
The script restores the positive source and verifies byte equality with `cmp` before completion.
Both [artifact hashes](../evidence/V26/main-corrections-2026-09-20/v63-main-fixed-files.sha256)
independently match the current local files:

- Corrected runner: `61253b0bbabe10a66505b5243a827e88317653f162c524ff9c45eef4e1f38f9d`.
- TypeScript config: `879b5662a1dd31a2de392877cfb4d30a12209d1e4187bec8bee87e2e1e2b9a94`.

These are scoped compiler/lint checks, not execution of the corrected live lifecycle or a
new full application test suite. No successful shared-main readback has yet been supplied.

## Historical first runner implementation readiness verdict: PASS

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

## Historical first scoped evidence inspected

The integration lead ran, in the stopped isolated CT114 `engine-corrections` build container:

```sh
pnpm exec prettier --write scripts/v63-headless-main.ts tsconfig.web.json && pnpm exec eslint scripts/v63-headless-main.ts && pnpm exec tsc -p tsconfig.web.json
```

Inspected [check output](../evidence/V26/main-corrections-2026-09-20/v63-main-runner-check-output.txt),
[exit status](../evidence/V26/main-corrections-2026-09-20/v63-main-runner-check-exit.txt)
(`0`) and [file hashes](../evidence/V26/main-corrections-2026-09-20/v63-main-runner-files.sha256).
Both SHA-256 values matched the then-reviewed local files:

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
| Supported application route | Corrected statically and typechecked; fresh execution pending | Public setup and actual CLI route remain supported. The corrected generated-reference request passes TypeScript, and omission of the required sheet actor name now fails it. Live proof remains pending. |
| Expectations precede claimed output | Verified statically | Sheet tiers, character baseline and target health are read before use. Only the accepted random dice are read afterward. The resolver derives each expected corrected result from those original facts. |
| Random-roll robustness | Verified statically; live not verified | No chosen roll or retry loop. Bane changes may preserve tier/damage. Critical/high rolls may Slay; persisted Slain is compared with the resolver and target binding permits correction of the retained foe. Signature cost absence is asserted. |
| Both-role windows and live-state conservation | Verified statically; live not verified | Every capture compares player/Director `mayCorrect` and `mayResolve`, target Stamina/temporary Stamina/Slain, full hero live state, dice and target outcome. Player manual-resolution permission is always false. |
| Linked correction/undo/redo and refusal boundaries | Verified statically; live not verified | Exact effective correction IDs; original ability dice; correction kind/cause/payload IDs; undo/redo targets; undone second correction; Director seam; disposition and rewind; unrelated turn end; readback after denied mutations. |
| Credentials kept out of evidence | Verified statically | JWTs stay in memory/child environment. Passwords, auth responses and transport exceptions are not serialized. Artifact contains public game-state reads and hashes; failures report only stage. |
| Existing isolated runner/guards/helper unchanged | Verified statically | Candidate does not edit `scripts/v63-headless.ts` or its dice import helper. |
| Scoped runner formatting/lint/types | Corrected version verified | Fresh CT114 positive checks exit 0; missing-name negative probe exits 2 with TS2741; restored runner/config hashes match current reviewed files. |
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
