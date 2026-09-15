# V22: Engine and parser track assessment

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Parser/rules engine — Codex track owner |
| Rules review | not required — assessment only; no executable mechanics changed |
| Depends on | A09 |
| Unblocks | A bounded first automation slice; informs V05 |
| Status | see `STATUS.md` |

## Goal

Establish what the engine/parser track can reuse, what actually reaches persisted gameplay, and the
next valuable bounded implementation. This slice delivers an assessment and implementation handoff;
it does not claim new automation or change the user's playable environment.

## Spec references

- `docs/engine-architecture.md#app-backend` — correct the historical integration description.
- `docs/engine-architecture.md#proposed-boundaries` — pure resolution versus application persistence.
- `docs/engine-architecture.md#from-rules-text-to-executable-behavior` — explicit unsupported behavior.
- `docs/engine-architecture.md#structured-effects-are-the-common-contract` — typed outcomes and causes.
- `docs/fury-goblin-automation.md#turn-start-ferocity` — retained future behavior and history example.
- `docs/build/README.md#branch-and-merge-policy` — isolated work and lead integration.

The current main checkout's September 15 roadmap and track kickoff additionally authorize this
assessment. They were uncommitted when the worktree was created; their edits were read in place,
not copied into this branch or included in this slice's commit.

## In scope

- Inventory experimental, integrated and missing behavior using code and executable checks.
- Compare representative source clauses across both resolution paths.
- Rank next work by playable value, reuse and unresolved dependencies.
- Establish the track worktree and hand off a bounded first implementation proposal.

## Out of scope

- Implementing the whole V05 outline or bypassing its V04 dependency.
- New backend behavior, schema changes, live deployment or resetting shared test/play data.
- Certifying whole abilities, creatures, all core classes or complete rules coverage.
- Changing engine language, packaging a standalone service, or expanding into supplemental content.

## Inputs and dependencies

Hard: A09's committed prototype foundation, including S01, R04, A04, A05 and A06. The accepted
prototype is recorded in [the acceptance record](evidence/v001-acceptance.md). Assessment baseline:
`e83930e2ffe061c83fd726f9183f33ecef8c57ad`; this is later than that acceptance and needs fresh checks.
V04 is not needed for read-only assessment. No fixture replaces an unimplemented dependency.

## Deliverables

This assessment, its verification evidence, a dated architecture clarification, the tracker ownership
entry and an isolated worktree.

## Acceptance checks

1. Trace the live ability path to pure resolution, journaled changes and source/history records;
   distinguish it from the experimental CLI and adapter.
2. Reproduce the eight-ability comparison below using the checked-in scenario and both parsers.
3. Run `pnpm check` against this worktree and report the actual outcome and limitations.
4. State a bounded first implementation with source, dependencies, manual remainder and checks.
5. Independent review checks the inventory and proposed scope against code and cited local sources.

## Rules research

Pinned Steel Compendium: `fb83a789da8f0327a389c277a0c790b1648d5810`.

- [Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md):
  start-of-own-turn grant is 1d3; opening, damage/winded/dying grants and ending loss are distinct clauses.
- [Goblin Warrior](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md):
  Bury the Point combines fixed payment, tier damage and potency-gated bleeding with save ends.
- [Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md):
  ordinary damage to all targets precedes tier effects; effect order and source exceptions matter.
- [Bleeding](../../vendor/steel-compendium/en/unified/md/condition/bleeding.md): condition application
  alone would not automate its action/roll-triggered Stamina loss or saving-throw lifetime.
- Earlier diverse samples: [heroes](../research/hero-parser-sample.md) and
  [monsters](../research/monster-parser-sample.md). These are research samples, not coverage proofs.

No new rules ruling is made. No online rules research was used.

## Open questions

None needed to complete this assessment. Later response/dependency policy must be resolved for the
specific affected mechanic rather than assumed while implementing a general interpreter.

## Assessment

### Recommendation

**First behavioral slice: source-linked turn-start Ferocity through the existing clock and journal.**
It removes a repeated manual roll and resource adjustment for the currently playable Fury, exercises
an actual timed effect from source to saved state, and has an already documented acceptance example.
Keep this deliberately narrow: one supported grant, with the other Ferocity clauses visibly manual.

Extend the working shared resolver and persistence path. Preserve the older experiment as reference
and regression evidence; do not install it as the live engine or rewrite the whole rules subsystem.
There is no concrete reason here to change TypeScript or introduce a separate engine service.

### Implemented, experimental and missing

| Area | Evidence | Assessment |
| --- | --- | --- |
| Shared deterministic arithmetic | `shared/resolve/index.ts`; `tests/resolve.test.ts` | Integrated foundation: per-target tiers/edges/banes, independent damage characteristic choices, kit bonuses, damage applications, fixed affordability, tests/saves/Catch Breath calculations. Pure calculations alone do not imply every helper is live. |
| Live ability use | `convex/lib/resolve.ts`, `convex/lib/abilityOperations.ts` | Content/build/snapshot adapters call the shared resolver. Registered use checks costs before drawing dice, journals payment and supported damage, stores correction inputs and full used-action source. |
| Partial manual play | `parseTierText`, `abilityResolved`, `tests/app/abilities.test.ts` | Damage clauses can apply while push/condition/Effect clauses stay verbatim manual. Director dispositions are stored without reapplying the effect. This is not a general dependent-effect continuation engine. |
| Experimental full ability parser | `src/parser.ts`, `tests/parser.test.ts` | Recognizes a narrow Markdown envelope, constants/single characteristics, damage, push and fixed-threshold conditions; returns diagnostics for other wording. Useful examples and conservative mismatch detection; narrower arithmetic than the live path. |
| Experimental runtime and history | `src/engine.ts`, `src/history.ts`, `src/cli.ts` | Separate scenario state/history with selected push/condition/resource/minion behavior and explicit restrictions. Nonzero edges/banes, existing conditions and any parser diagnostic can force manual resolution. Not equivalent to current app contracts. |
| Old app adapter | `convex/lib/engine.ts`, `tests/app/engine-adapter.test.ts` | Pure wrapper over `src/engine.ts`; no registered live operation calls it. Its presence is not evidence that the experimental parser powers the app. |
| Clock | `convex/lib/clock.ts`, `convex/lib/combatOperations.ts` | Persisted registrations and ordered boundary dispatch exist; Malice and surprise expiry have handlers. Save work and unhandled operations explicitly report unsupported. No Ferocity producer/handler is wired. |
| Application history | `convex/lib/journal.ts`, `convex/lib/history.ts`, app history suites | Reuse journaled state restoration, command retries and sequential undo/correction boundaries. New effect rows/registrations must participate in that same history. |
| Full source compilation | `effectsOf`/`build` in `convex/lib/resolve.ts` | Live adapters consume structured projections and parse individual tier damage; they do not reconcile every mechanical paragraph against full Markdown. Full text is retained, but it is not a complete executable definition. Extra rolls/complex sections need explicit diagnostic coverage before expansion. |
| General effect runtime | Current result/contracts and `abilityResults` storage | No common ordered effect plan with stable per-effect identity, typed missing facts, dependency links and resume-once semantics. Existing manual dispositions identify clauses by text and target; repeated identical clauses need distinct identities before broader automation. |
| Coverage | Snapshot manifest; parser samples/tests | Playable snapshot has 403 entries, including 22 standalone abilities and one stat block. Kit signatures/embedded monster abilities are separate. Neither this nor the larger readable Rules library measures verified automation. No comprehensive executable core-ability coverage report exists. |

The backend review here is scoped to this integration path, not a new application-wide security or
performance certification. Existing registered operations enforce table authority/lifecycle; new
handlers must preserve those boundaries and authenticated issuer versus actor attribution.

### Executed comparison

`loadScenario({ includeSquad: true })` supplies eight source-backed experimental abilities. This is
an intentionally small fixture, not a representative coverage percentage. The results below compare
parsing only; zero diagnostics never means a whole ability/creature is safe to execute automatically.

| Ability | Experimental parser diagnostics | Current shared tier parser |
| --- | ---: | --- |
| Brutal Slam | 0 | Damage parsed; push manual |
| Out of the Way! | 4 | Damage parsed; slide manual |
| Thunder Roar | 1 | Damage parsed; push manual; whole-ability order still comes from its separate Effect |
| Lines of Force | 4 | No power-roll tiers; triggered replacement remains manual |
| Pain for Pain | 5 | Damage with Might-or-Agility choice parsed; reactive Effect remains separate/manual |
| Spear Charge | 0 | Damage parsed; charge/trait behavior is not certified by this result |
| Bury the Point | 0 | Damage parsed; potency/bleeding/save clause manual |
| Axe (Spinecleaver) | 0 | Damage parsed; push manual; live minion model remains V02 work |

Reproduce from the worktree:

```sh
node --input-type=module <<'JS'
import { loadScenario } from './src/content.ts';
import { parseAbility } from './src/parser.ts';
import { parseTierText } from './shared/resolve/index.ts';
const scenario = await loadScenario({ includeSquad: true });
for (const [id, source] of Object.entries(scenario.abilities)) {
  console.log(JSON.stringify({
    id,
    diagnostics: parseAbility(source).diagnostics.length,
    tiers: source.tiers?.map(parseTierText),
  }));
}
JS
```

### Ranked next work

1. **Turn-start resource grant:** immediate value for the existing hero and a bounded test of
   typed timed effects, accepted dice, saved resource changes and restored history.
2. **Ordered typed tier clauses with explicit manual remainder:** consolidate damage parsing at
   `shared/resolve` and add source-linked effect identities/diagnostics alongside existing results.
   Use Brutal Slam versus Thunder Roar to prove that recognizing a push does not ignore sequencing.
   Keep dependency-sensitive effects pending. This is a prerequisite for expanding partial execution,
   not a separate parser-count milestone.
3. **One condition and its lifetime end to end:** Bury the Point is a useful candidate, but scope
   potency, source-bound condition instances, saves and corrections explicitly. Bleeding's own
   triggered consequences must either be implemented or clearly remain manual; an on/off toggle
   is not complete condition automation. Check overlapping applications before choosing storage.
4. **Forced movement and responses:** typed movement instructions, supplied spatial facts,
   effect ordering and dependent reconciliation. Coordinate with V04 and V02; Axe parsing does
   not authorize treating a Spinecleaver as an ordinary live creature.
5. **Broader grammar/content and packaging:** expand from contrasting verified examples and a
   generated report. Keep character/foe content growth independent; package the stable shared
   boundary when a consumer needs it rather than duplicating engines now.

### First implementation handoff

Proposed next slice: **Fury turn-start Ferocity** (allocate a fresh slice ID when claimed).

- Hard dependencies: S01 source provenance, R02/R03 feature and live-state projections,
  A04 actual turn boundaries, A06 journal/history, A09 accepted integration. These are committed.
- V04 is not a dependency of this isolated grant: it has no area, response, recipient selection
  or spatial fact. V05 retains its existing V04 dependency for its broader scope.
- Compile only the supported turn-start grant into a small typed timing/resource/dice effect,
  bound to the evaluated hero's actual granted feature and its source clause/revision. A name or
  a resource label alone must not grant the feature. All other clauses stay explicitly manual.
  The exact representation is an engineering proposal; no new public API is promised here.
- Reuse the clock's source-bound registrations and shared accepted dice; feed explicit results
  to pure resource arithmetic, then journal the update and log under the causing turn command.
  Avoid adding a parallel timing loop, frontend mutation or ability-name dispatch switch.
- Implementation cautions from independent review: the current clock source record does not carry
  a source revision or clause identity, and evaluated feature provenance can identify the class
  advancement entry rather than the Ferocity clause. Bind the actual Ferocity source explicitly.
  Shared dice deduplication uses issuer/command identity; design stable child-firing identities
  before multiple automatic rolls share a causing command, and retain their parent history link.
- First numerical check: with recorded Ferocity 0 and accepted d3 result 2, actual own-turn start
  saves 2 and records 0 → 2. Retry/read/reconnect produces no new grant. A different hero's turn
  does not grant it. The normal spending operation can consume the resulting actual balance.
- Director sequential rewind restores 0 and the registration state; exact Redo restores the same
  recorded 2 without rolling. A newly executed turn uses a new accepted roll. Respect player
  turn-start limits, paused/closed sessions, closeout and archived encounters.
- Test a nonzero starting resource and more than one hero to catch reset/actor-binding bugs.
  Opening Victories, damage/winded/dying grants, thresholds, ending loss and out-of-combat reuse
  tracking remain manual in this slice and must be labeled individually, not called automated.
- Consumers: character feature/baseline projection, A04 clock, A05 spending, A06 history and UI
  log/resource displays. Coordinate shared contract changes before editing their owned surfaces.
- Verification target: deterministic tests plus an isolated development backend for actual new
  persisted behavior. Test player and Director invocations, retries, saved rows and history;
  obtain independent implementation and rules review before handoff.

## Work log

### 2026-09-15 — claim and assessment

- Primary track/owner: parser and rules engine, Codex in this user thread.
- Branch: `slice/V22`; worktree: `/srv/presidium/projects/salient/engine-parser`.
- Baseline: `e83930e`; shared `main` had five local commits beyond origin and uncommitted
  coordination documentation. Those changes remain owned by their original thread.
- Development/test target: worktree-local Node/Vitest and in-memory `convex-test`; no live backend
  configured, synced or seeded. No UI flow or runtime behavior changed.
- Initialized both submodules at the recorded pins; installed with `pnpm install --frozen-lockfile`.
  A shallow Forge Steel checkout could not be used as a Git reference; initialization without that
  reference succeeded at the exact recorded commit. No source pins advanced.
- Read the project instructions, current roadmap/kickoff/process, A09 acceptance, V05 outline,
  engine/rules-language contracts, source samples and relevant implementation/tests.
- Ran the eight-source comparison above. Verified caller separation with
  `rg -n 'parseAbility|resolveAbilityRoll|src/engine' src shared convex tests/app/engine-adapter.test.ts`.
- Full verification and independent review results follow below.

### 2026-09-15 — verification

- `pnpm check` passed on this worktree: 85 engine tests and 317 app/tooling tests (402 total),
  both TypeScript checks, ESLint/Prettier, 156 Markdown link checks, two clean vendor pins,
  byte-identical 403-entry content snapshot and production build. Rules ingest produced 2,614
  readable entries; these are not automation counts. Log: `.playtest/v22/check.log` (ignored).
- The existing Vite advisory about a main chunk above 500 kB remains; build succeeded.
- App tests exercise persisted readback in isolated `convex-test`. No new browser/live-backend
  run was performed; this assessment does not recertify the existing UI or sustained performance.

- Post-report documentation check: `pnpm check-links` passed (157 Markdown files). The owning
  architecture now distinguishes the current shared resolver from the historical A01 adapter note.

### 2026-09-15 — independent review and handoff

- [Independent review](reviews/V22-assessment-review.md): **pass**, `v22_review`; all five
  assessment checks verified, comparison independently reproduced, no blocking findings.
- Incorporated the source-binding and dice-identity cautions in the implementation handoff.
  When claiming the next slice, name A02, S02 and A05 explicitly alongside their R/A09 contracts.
- Final `pnpm check-links` passed across 158 files; `git diff --check` passed. No executable code
  changed after the full baseline check, so it was not repeated.
- Assessment complete and committed on `slice/V22`; lead integration into `main` is pending.
  The shared main tracker carries this track's ownership/worktree note without staging or committing
  the other thread's coordination edits. No running-app update was performed.
- Next: claim the bounded source-linked Fury turn-start grant with independent rules review and
  an isolated backend, using the handoff above. This assessment does not claim that grant is built.
