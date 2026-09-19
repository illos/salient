# V46 evidence

Devil level one. Every expected result was written before the implementation ran; see
[the expectation ledger](expectations.md). This file records what was actually executed, where the
artifacts are, and what is not yet proven.

## Targets

| Purpose | Identity |
| --- | --- |
| Slice branch | `slice/V46` in `/srv/presidium/projects/salient/opus-characters` |
| Integration baseline | `main` `342427d` (rebased forward from `656d831`; the six commits in between touch only `docs/**.md`, so the application tree is still the V45 delivery `ebe66e2`) |
| Isolated verification environment | CT114 `characters`, compose `salient-characters-dev-2389e144b9dd`, `https://salient-characters-dev-aa988a1a3752.tail41404c.ts.net` |
| Steel Compendium pin | `fb83a789da8f0327a389c277a0c790b1648d5810` |
| Forge Steel pin | `5a846aadb623a9855a023e9403bb887a956c341f`, package version 14.197.0 |
| Forge counterpart target | The pinned Forge Steel application built and served on CT114 at `/srv/dev/salient/v46-forge`, cloned from the allowlisted vendor URL at exactly that commit |

The shared `main` playable environment was not modified by this slice. No hosted deployment, remote
push or external publication was performed.

## Repository checks

`presidium-dev --env characters run build -- pnpm check`, single worker, on the integration
candidate. The retained output is [`full-check-and-regressions.log`](full-check-and-regressions.log).

| Stage | Result |
| --- | --- |
| `pnpm lint` (ESLint + Prettier) | pass — "All matched files use Prettier code style!" |
| `pnpm check:engine` | pass |
| `pnpm check:app` | pass — 47 files, 407 tests |
| `pnpm check-links` | pass — 268 Markdown files, no broken relative links or anchors |
| `pnpm check-vendor` | pass — both submodules at their pinned commits, unmodified |
| `pnpm content:check` | pass — 483 entries, revision `fb83a789da8f` |
| `pnpm supporting:check` | pass — 289 exact source records |
| `pnpm foes:check` | pass — 438 stat blocks, 2006 features |
| `pnpm build` | pass |

The engine project's count moved as this slice's own tests grew; the figures below are each from
the run that actually executed that tree, not carried forward:

| Candidate | Engine tests | App/script tests | Total |
| --- | ---: | ---: | ---: |
| `main` before this slice | 284 | 407 | 691 |
| First V46 candidate (16 devil tests, no counterpart fixtures) | 297 | 407 | 704 |
| With the counterpart fixtures and the first forge test | 301 | 407 | 708 |
| With the repairs from independent review | 304 | 407 | 711 |
| Final candidate, with the whole-build counterpart comparison | **316** | **407** | **723** |

The final `pnpm check` above is that last row: 22 engine files / 316 tests, 47 app-and-script files
/ 407 tests, links 268, both submodules pinned, content 483, supporting 289, foes 438/2006, lint
and build clean. The only change made to the tree after that run is this file and the slice work
log recording its numbers; `node scripts/check-links.ts` was rerun afterwards over the documents.

### Retained first-run failures

The focused suite's **first** run was 11 passed / 2 failed. Both failures were wrong expectations
in the new tests, not implementation defects, and both are recorded here rather than silently
fixed:

1. `V46 check 2: the signature skill stays inside the interpersonal group` — the case routed its
   illegal value through `pruneUnavailable`, which legitimately drops a selection that no longer
   fits its pool, so the `value-not-in-pool` diagnostic could never be produced. The case now keeps
   that one selection unpruned, with a comment recording why.
2. `V46 check 3: Wings cites the trait, the fly rule and the untyped weakness rule` — the test
   asserted that the rounds-aloft provenance names an array-assignment decision. The Fury's Might
   is **fixed by the class**, not assigned from the array, so the assertion was wrong about the
   build. It now compares the aloft provenance against the actual Might provenance, which is a
   stricter check than the one originally intended.

Second run: 13 of 13 passed.

The **first** browser run then failed too, on a control assertion rather than on the behaviour
under test. Everything up to it passed — all seven traits enabled, all thirteen skills offered,
`4 of 3 points spent` on the sourced four-point exclusion, `3 of 3 points spent` on a legal
selection, and no `offered set:` caption for Devil. The failing line asserted that switching to
Polder brings the caption back; it does not, because Polder never carried `supportedSetInV001` at
all. That made the point: the caption exists to say which options are held back, Devil no longer
holds any back, and Polder proves the per-option flags carry that distinction on their own. So the
metadata was removed from the Devil decision rather than restated in full, the wizard rendering was
left exactly as it is on `main`, and the control assertion became "Polder still shows Corruption
Immunity enabled and Nimblestep disabled" — which tests the distinction instead of a caption that
one ancestry happened to have.

The **second** browser run failed one line from the end, on `getByLabel('Stats')`: the sheet's
stats section and the list inside it carry the same label, so the locator was ambiguous under
Playwright's strict mode. Everything before it passed, including the whole build, the persisted
readback and the three rule pop-ups. The locator now names the list role. This was a test-side
ambiguity, not a rendering defect.

## Browser journey

`presidium-dev --env characters run browser -- pnpm exec playwright test --workers=1
tests/browser/v46-devil.spec.ts` — **1 passed (15.3s)** on the third attempt, after the two
test-side corrections above.

The journey builds template C (Glowing Eyes + Wings, Silver Tongue Flirt) through the wizard on the
Grug baseline, then reads the saved build back through `characters:listMine` and
`characters:sheet` rather than trusting the mutation response. It checks in one run that:

- every one of the seven purchased traits is enabled, and the select offers all thirteen
  interpersonal skills and nothing outside the group (`Blacksmithing` has no option);
- Impressive Horns + Wings shows `4 of 3 points spent`, the exclusion the source states outright,
  and a legal pair shows `3 of 3 points spent`;
- Polder still renders Corruption Immunity enabled and Nimblestep disabled, so unsupported options
  are still distinguished after the Devil metadata was removed;
- the persisted build has `movementModes: ['Fly']`, `conditionalEffects` of rounds-aloft 2 and
  damage-weakness 5, an **empty** `damageWeaknesses`, speed 5 and saving throws on 6;
- the granted ancestry ability is Glowing Eyes and its rendered text contains `1d10 + your level`;
- Silver Tongue, Glowing Eyes and Wings each open their pinned source in the rule pop-up with no
  raw `scc.v1:` reference leaking into the text.

Screenshots in [`browser/`](browser): [`over-budget.png`](browser/over-budget.png) (the refused
four-point pair), [`wizard-conditional.png`](browser/wizard-conditional.png) (the completed hero in
the wizard), and [`sheet-flight.png`](browser/sheet-flight.png), which shows the sheet's
`Movement: Fly` row and the "Movement and conditional effects" section reading *"These apply only
in the situation the source describes, and are resolved at the table"* above Fly, Wings: rounds
aloft 2 and Wings: damage weakness 5, each with its source condition, plus the Glowing Eyes ability
card carrying the full trait text.

## Full browser suite

`presidium-dev --env characters run browser -- pnpm exec playwright test --workers=1` over the
**whole configured suite**, not a selection: **48 passed, 2 failed, 3 skipped in 19.6m**. Retained
output: [`full-browser-suite.log`](full-browser-suite.log).

Both failures are the same thing, in specs this slice does not touch, and both are the recorded
account-registration class of transient failure: `table-audit.spec.ts:40` and
`v21-campaign.spec.ts:23` each failed inside their `register` helper, waiting for the `Campaigns`
heading after `Create account`, with the element never appearing within 15s. No assertion about
table behaviour or campaign behaviour was reached. The reruns are recorded below. They are retained
here rather than dropped: an earlier README reported only five selected specs, which overstated
coverage, and that is corrected.

Reruns: `v21-campaign` passed on its first rerun. `table-audit` failed a second time, but at a
**different** point — the player and observer "Manual adjustment … Stamina … adjusted" log entry
resolving to 0 elements — so it was not the same failure twice and was not treated as flake on that
basis. Run alone a third time it **passed in 1.3m**. Two different failure points under suite load,
then a clean isolated pass, is the recorded contention pattern for this environment rather than a
defect: this slice changes no table, log or command code, and the spec's own assertions are
unmodified. It is recorded here in full rather than summarized as transient.

## Counterpart comparison and persisted readback

`pnpm exec vitest run tests/character-v46-forge.test.ts tests/character-v46-devil.test.ts
tests/character-v45-reference.test.ts` — **39 passed (3 files)**: 16 counterpart tests, 16 devil
tests and the 7 unchanged V45 reference tests, which still pass after this slice extended the
shared Forge projection with the movement-mode feature type.

The counterpart test compares each of the thirteen witnesses as a **whole build**, reusing V45's
`projectForgeReference`: ancestry, class, subclass, career, culture name and its three aspects with
their skills, the characteristic array and its assignment, every career and class choice by Forge
feature id, kit, perk, inciting incident, authored name, then the derived skills, languages,
abilities, kit and every granted trait, perk and feature, and finally the rendered sheet's size,
speed, stability and saving throw against both the source-derived expectation and Salient's own
baseline.

Three real mismatches surfaced when that comparison first ran, all in my fixtures rather than the
implementation, and all fixed rather than waived:

1. **Deferred language.** The Forge witnesses complete both Soldier language slots, as the V45
   inventory requires of a completed-character witness, but the Salient selections inherited the
   audited Grug base's deliberately deferred slot. The templates now carry the completed pair
   (Vaslorian retained, Khelt for the deferred slot), which is also what the wizard journey enters.
2. **Interchangeable free skill slots.** Forge gives the Mage's Apprentice career and the
   Elementalist class one free "Skill" choice each, from any list. The V45 Bethell capture holds
   Empathize in the career slot and Magic in the class slot; this capture holds them the other way
   round. The two slots are identical free choices, so the test now asserts what is actually
   required — that between them they hold Magic and the recorded replacement — instead of pinning
   either skill to a slot. Recorded in `templates.json` under `forgeDifferences`.
3. **Authored name.** The comparison compared the counterpart's name against the base fixture's.
   The witness selections now carry their own authored name, which is what a same-build comparison
   means.

Two further mistakes were mine in the test itself: the characteristics map was built with full
names where the shared projection keys by initial, and the ability comparison excluded the perk
ability `Arcane Trick`, which Forge does export. Both are corrected; neither was an implementation
defect.

`tests/browser/v46-devil-persistence.spec.ts` — **3 passed (1.5m)**, first run:

- **All thirteen counterpart builds** are created, saved and read back through
  `characters:create`, `characters:save` and `characters:sheet` — the same authorized operations
  the wizard uses — and each persisted build is checked against its source-derived expectations.
  The readback is retained as
  [`persisted/counterpart-readback.json`](persisted/counterpart-readback.json): template A persists
  speed 6 / stability 2 / saves on 5 with no movement mode; B speed 5 / saves 6 with extra strike
  damage 2; C adds Fly with rounds aloft 2 and weakness 5; D persists stability 0 and **rounds
  aloft 1**, the Might −1 minimum, through the real backend.
- **Parent-change removal survives a reload.** A saved flying build is reloaded, its traits are
  replaced, and the reload shows the flight, the weakness, the Glowing Eyes ability, the Wings
  trait and the old signature skill all gone, with speed back to 5 and the new skill granted.
  Leaving the ancestry entirely then removes every devil grant while the Fury and Soldier choices
  survive.
- **Level two carries forward.** A Devil with Wings and Glowing Eyes is admitted through the
  ordinary submit/approve path, the Director grants XP and moves live values through public
  commands only, and the level-up runs through the real progression UI. After it, the persisted
  build is level 2 with Fly, rounds aloft 2 and weakness 5 still recorded, `damageWeaknesses` still
  empty, live Stamina still 20 against a maximum that grew from 30 to 39, the level-up recorded in
  history, and the retained level-one snapshot still reading back as level one with its flight.
  The level-one build is then **actually restored**, not merely inspected: the owner requests the
  retained revision from the progression history, the Director approves it, and the restored build
  is equal to the level-one build, with Fly, rounds aloft 2 and weakness 5 back, the Stamina
  maximum back to 30, live Stamina 20 and Recoveries 4 retained under that maximum, XP 16 kept,
  the authored details including the owner's private note unchanged, and the restore itself
  recorded in history. Retained as
  [`persisted/advancement-readback.json`](persisted/advancement-readback.json), which records all
  four states: level one, level two, the retained snapshot and the restored build.

## Regression journeys

The four existing character browser journeys were rerun unchanged on the same candidate:
`v21-wizard.spec.ts`, `v25-elementalist.spec.ts`, `v32-progression.spec.ts` and
`v42-primary-choice.spec.ts` — **4 passed (1.8m)**. These cover the wizard frame and persistence,
the corrected Forge Bethell Polder/Elementalist build with its reviewed sheet, Fury level-one to
level-two advancement with live-state preservation and history restoration, and the primary-choice
collapse/edit/prune behaviour. None of them was modified by this unit.

## Forge Steel counterparts

Capture mode is the pinned application served locally, permitted by
[the 2026-09-19 capture-mode clarification](../../character-verification.md#2-build-and-capture-the-reference)
and directed by the integration lead. **This is not a claim of parity with the current public
website.** Every hero below was built by driving the real editor — tab by tab, chooser by chooser —
and exported through the application's own `Export` → `Export as Data` path; no export was
fabricated and no selection was injected into storage.

Sourcebooks left at the application's defaults for a new hero; recorded per witness in
`counterparts.md`.

## Independent source derivation

A fresh-context agent derived the expected mechanics from the pinned Compendium **without reading
the implementation**, then compared its derivation against `expectations.md`. It confirmed the pin
and all twelve hashes listed at the time, and found no contradiction of any source sentence. It did
find real omissions, which are fixed in `expectations.md` rather than argued with:

- the rule that decides an untyped "damage weakness X" applies to damage of **any** type was used by
  the implementation but never quoted in the expectations document; it is now quoted, hashed and
  cited;
- five load-bearing source files were missing from the provenance table (`rule/character/speed.md`,
  `chapter/ancestries.md`, `rule/general/saving-throw.md`, `rule/damage/damage-weakness.md`,
  `rule/combat/concealment.md`), plus `rule/dice/edge.md` and `feature/trait/polder/small.md`;
- Silver Tongue was never stated to be free and outside the three-point budget;
- Hellsight's narrow reading and the decision to record Wings as a movement mode were asserted
  rather than labelled as interpretations with their alternatives, which `agent.MD` requires;
- template D's note gave the **wrong cause** for the size change: Polder's 1S comes from its Small!
  signature trait, not from a Polder-specific speed/stability baseline. The expected outcome was
  right; the explanation was not, and it is corrected;
- the Barbed Tail amount has no source floor when the highest characteristic is non-positive, and
  the source is silent on whether the rounds-aloft allowance resets per takeoff. Both are now
  recorded as uncertainty. Neither is reachable at level one, because every supported level-one
  class fixes at least one characteristic at 2.

One finding is answered rather than adopted: the agent argued Glowing Eyes should be classified
like Barbed Tail, since both are formulas gated behind an activation. The distinction is that
Barbed Tail's magnitude is a number the build must compute, while Glowing Eyes' is a dice
expression that a numeric field cannot hold without dropping the die. That reasoning is now stated
in the document instead of the weaker "the level is already a baseline value".

## Independent review reports

Two fresh-context agents were run under the 2026-09-19 subagent authorization in `agent.MD`, and
the integration lead ran a third static reviewer. Their findings and what was done about each are
recorded in the [slice work log](../../V46-devil-level-one.md#work-log). The scripts that drive the
remote workflow are retained verbatim in [`tooling/`](tooling) so their argument handling is
reviewable without shell access:
[`presidium-dev-guard.sh`](tooling/presidium-dev-guard.sh) and
[`presidium-ssh-cwd-shim.sh`](tooling/presidium-ssh-cwd-shim.sh).

## Remote workflow guard

`presidium-dev` parses `--env` only **before** the operation for `run`; anywhere after it the
argument is passed through opaquely and the job lands in the default `main` slot, which serves the
user's app. That happened once here.

The first guard was unsound, and the integration lead caught it by reading the script: it searched
the whole of `argv` for `--env characters`, so `presidium-dev run build --env characters -- …` and
even `presidium-dev run build -- echo --env characters` would have passed the guard while the real
parser still targeted `main`. The guard now accepts exactly one shape — the strict prefix
`--env characters` — and refuses any later environment flag in any position, so a second one cannot
reach the real parser and change the target.

Its behaviour, verified against a harmless stand-in
([`fake-presidium-dev.sh`](tooling/fake-presidium-dev.sh)) that runs no workload, with
`V46_GUARD_TARGET` pointing at it:

```
run build -- pnpm exec vitest run                 => exit=64  first argument is 'run', not --env.
run build --env characters -- pnpm exec vitest run=> exit=64  first argument is 'run', not --env.
run build -- echo --env characters                => exit=64  first argument is 'run', not --env.
--env main status                                 => exit=64  refusing --env 'main'.
status --env characters                           => exit=64  first argument is 'status', not --env.
--env characters                                  => exit=0   forwards: --env characters
--env characters status                           => exit=0   forwards: --env characters status
--env characters run build -- pnpm check          => exit=0   forwards: --env characters run build -- pnpm check
--env characters run build --env main -- pnpm check=> exit=64 refusing a later environment flag.
```

The first three are the bypasses the lead identified, and the first of them is the exact invocation
that misfired. The script is [`presidium-dev-guard.sh`](tooling/presidium-dev-guard.sh); it prints
only environment names and handles no secrets.

Shared-environment state after the misfire, read back with the real binary:
`environment main | compose salient-dev-b90776c53141 | phase running`, recorded source checkout
`/srv/presidium/projects/salient/code`, recorded source commit
`ebe66e2b631cb9d30acb59cb24011d0585bdf9d3`, `dirty: false`, and
`lastJob {"container": "salient-dev-b90776c53141-job-31bab9fe", "service": "build", "exitCode": 1}`
— the one-off build container, which printed `No test files found, exiting with code 1` because
main's snapshot has no V46 test. `runtime/compose.yaml` gives the build service source, dependency,
tool and artifact mounts and no backend data, and the helper runs one-off jobs with `--no-deps`.
Nothing was replaced, seeded or reset, and no source archive was uploaded to that slot.

The other process mistake was `npx tsc --noEmit -p tsconfig.json` run once in this worktree on
Presidium, before I moved to the remote workflow. `npx` fetched `tsc@2.0.4` into the user-level npx
cache and printed its "This is not the tsc command you are looking for" banner; the worktree still
has no `node_modules`, and no dependency, build, test or browser workload has run on Presidium
since. Reading files, `git`, and single `node scripts/*.ts` validations are the only local work.

## What this evidence does not cover

- Gameplay automation of any Devil trait: all activation, once-per-round tracking, concealment,
  flanking, flight movement, elapsed rounds, falling and conditional weakness application remain
  manual and are only shown as readable text and recorded conditional amounts.
- Any ancestry, class or level other than Devil at level one.
- Forge Steel import/export adapters, which remain unimplemented.
