# V46 evidence

Devil level one. Every expected result was written before the implementation ran; see
[the expectation ledger](expectations.md). This file records what was actually executed, where the
artifacts are, and what is not yet proven.

## Targets

| Purpose | Identity |
| --- | --- |
| Slice branch | `slice/V46` in `/srv/presidium/projects/salient/opus-characters` |
| Integration baseline | `main` `4e630e7` (rebased forward from `656d831`; every commit in between touches only `docs/**.md`, so the application tree is still the V45 delivery `ebe66e2`) |
| Whole-suite candidate | `cc7d4ac` (`cc7d4acbe8827467d02905fb08bd7a971b1db78a`) — the tree the full browser suite ran on |
| Supplement candidates | `4c4d021` (`4c4d02146b0532b4cfc6f2d6dbec04732117b764`) and `a9ad2a6` (`a9ad2a6800974c3fe7fa9fd4a18dfe380f4abebe`) — the trees the two focused supplements ran on |
| Application fingerprint, identical across both and the delivered commit | `git ls-tree -r <tree> -- convex shared web \| sha256sum` = `1c7bf6e635467fee481ad99a022cd17d504dc3cf24360eb1d654dae4b544fd6a` |
| Isolated verification environment | CT114 `characters`, compose `salient-characters-dev-2389e144b9dd`, `https://salient-characters-dev-aa988a1a3752.tail41404c.ts.net` |
| Steel Compendium pin | `fb83a789da8f0327a389c277a0c790b1648d5810` |
| Forge Steel pin | `5a846aadb623a9855a023e9403bb887a956c341f`, package version 14.197.0 |
| Forge counterpart target | The pinned Forge Steel application built and served on CT114 at `/srv/dev/salient/v46-forge`, cloned from the allowlisted vendor URL at exactly that commit |

The shared `main` playable environment was not modified by this slice. No hosted deployment, remote
push or external publication was performed.

## Repository checks

`presidium-dev --env characters run build -- pnpm check`, single worker, on the candidate named in
[Targets](#targets). It runs in the same invocation as the browser suite below, so the two cannot
describe different trees: the retained output is the first half of
[`full-check-and-browser-final.log`](full-check-and-browser-final.log).

| Stage | Result |
| --- | --- |
| `pnpm lint` (ESLint + Prettier) | pass — "All matched files use Prettier code style!" |
| `pnpm check:engine` | pass — 22 files, 316 tests |
| `pnpm check:app` | pass — 47 files, 407 tests |
| `pnpm check-links` | pass — 269 Markdown files, no broken relative links or anchors |
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

The final `pnpm check` above is that last row, from the run on `cc7d4ac`. Changes made to the tree
after it, all of them covered by the focused supplement recorded below rather than left unverified:
`tests/browser/v46-devil-persistence.spec.ts` (the carried-state anchor and the observed-values fix
to the removal readback), `tests/character-v46-devil.test.ts` (the level-two aloft constant),
`docs/build/evidence/V46/tooling/presidium-dev-guard.sh`, and the evidence and work-log documents.
No file under `convex/`, `shared/` or `web/` changed, which the fingerprint in
[Targets](#targets) makes checkable.

### Historical logs, superseded

Two logs from earlier candidates are kept so the record is not rewritten, and are **not** evidence
for the delivered tree: [`full-check-and-regressions.log`](full-check-and-regressions.log) (engine
304, before the whole-build counterpart comparison) and
[`full-browser-suite.log`](full-browser-suite.log) (53 tests, captured before the three
`v46-devil-persistence` journeys existed). An independent review correctly found that these did not
correspond to the candidate this file claimed; that is what the two named runs above replace.

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

This journey is position **51** of the full suite and passed in both full runs recorded below. The
figures quoted in this section are from that suite, not from a selective run of the spec alone.

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
`Movement  Fly  conditional` stats row — the marker is part of the row, so the sheet never states
flight as unconditional — and the "Movement and conditional effects" section reading *"These apply
only in the situation the source describes, and are resolved at the table"* above `Fly` (movement
mode), `Wings: maximum rounds aloft  2` and `Wings: damage weakness  5`, each printed with its
verbatim source condition, plus the Glowing Eyes ability card carrying the full trait text and the
note *"Readable grant only: the trigger, the roll and the damage are resolved manually."*

All three screenshots in [`browser/`](browser) were captured by the run recorded below, on the
candidate named in [Targets](#targets), not carried forward from an earlier tree.

## Full browser suite

`presidium-dev --env characters run browser -- pnpm exec playwright test --workers=1` over the
**whole configured suite**, not a selection. Two full runs are retained, each named for the tree
that executed it, because an earlier version of this file carried a 53-test log against a 56-test
candidate and that mismatch is the thing being corrected.

| Run | Tree | Result | Log |
| --- | --- | --- | --- |
| Candidate before the review repairs | `c715f60` | 50 passed, 3 failed, 3 skipped, 21.2m | [`full-check-and-browser-c715f60.log`](full-check-and-browser-c715f60.log) |
| Isolated rerun of exactly those three, same tree | `c715f60` | 3 passed, 3.4m | [`isolated-rerun-c715f60.log`](isolated-rerun-c715f60.log) |
| **Delivered candidate** | `cc7d4ac` | **48 passed, 5 failed, 3 skipped, 18.6m**, `pnpm check` passed, exit code 1 | [`full-check-and-browser-final.log`](full-check-and-browser-final.log) |
| Isolated rerun of exactly those five, same tree | `cc7d4ac` | 5 passed, 7.3m | [`isolated-rerun-cc7d4ac.log`](isolated-rerun-cc7d4ac.log) |
| Focused supplement for the test and documentation repairs | `4c4d021` | prettier clean, `tsc --noEmit` clean, engine 3 files / 39 tests passed, the 4 V46 browser journeys passed in 1.9m | [`focused-supplement-4c4d021.log`](focused-supplement-4c4d021.log) |
| Second supplement, for the level-two source constant | `a9ad2a6` | prettier clean, `tsc --noEmit` clean, engine 3 files / 39 tests passed | [`supplement-a9ad2a6.log`](supplement-a9ad2a6.log) |

`4c4d021` is the tree the supplement executed. The delivered commit is one step beyond it and
differs **only by the artifacts that run produced** — the three screenshots, the three readback
JSONs, this file's rows recording the result, and the supplement and link-check logs. No source
file differs. Neither tree was given its own whole-suite run, deliberately and on the integration
lead's instruction: the application code of both is byte-identical to `cc7d4ac`, which did get
one. The fingerprint `git ls-tree -r <tree> -- convex shared web | sha256sum` is
`1c7bf6e635467fee481ad99a022cd17d504dc3cf24360eb1d654dae4b544fd6a` for `c715f60`, `cc7d4ac` **and**
`4c4d021` alike, so the whole-suite evidence above describes this tree's application behaviour, and
the supplement covers exactly what moved: one test file and the documents. That mapping is the
reason a supplement is legitimate here, and it is checkable rather than asserted.

**The delivered candidate's browser suite did not pass.** It is reported here as it ran, with its
exit code, and nothing in this file should be read as a green suite.

Each log begins with the runtime's own `presidium-dev --env characters status` block, so the tree
a log describes is inside the log rather than asserted beside it. Read the `commit` field there,
not `identity`: `identity` stayed `d94a1331…` across `c715f60` and `cc7d4ac`, so it identifies the
environment and checkout rather than the source content, and it cannot distinguish two candidates.
The fingerprint row in [Targets](#targets) is the content check. An earlier attempt at the final
run was also started without `up --replace`, and `presidium-dev run` does not re-sync — the job
would have executed the previously synced `c715f60` source while being labelled otherwise. It was
caught by reading `status` and the synced checkout's file mtime, stopped before it produced
anything, and restarted with the sync in front.

The **four** V46 browser tests — positions 48, 49 and 50 (`v46-devil-persistence`) and 51
(`v46-devil`) — passed in both runs. (An earlier Chords report of mine said five; there are four.)

**Three tests were skipped, and a skip is not a pass.** All three are environment-gated and
pre-existing, none touched by this slice: `reference-cache.spec.ts:3` skips without
`SALIENT_REFERENCE_PREVIEW` ("Requires the actual Workers static-assets preview"), and both
`password-recovery.spec.ts` tests skip without `SALIENT_RECOVERY_FIXTURE` ("Requires isolated
fixture; never read live recovery tokens"). Neither variable is set in the `characters`
environment, so 53 of the 56 tests actually executed.

### The failures, exactly as observed

Recorded because they happened, not because their cause is established. **No cause is asserted for
any of them.** Each entry is the assertion that failed and the artifact it came from.

On `cc7d4ac`, five, falling into two groups by the control they waited for:

| Spec | Failed on | Group |
| --- | --- | --- |
| `closeout.spec.ts:21` | `getByRole('button', { name: 'OK' })` at `closeout.spec.ts:89`, in `startCombat` | combat flow |
| `combat.spec.ts:31` | `Take turn` at `combat.spec.ts:112` | combat flow |
| `wizard.spec.ts:23` | `Take turn` at `acceptance-extension.ts:56` | combat flow |
| `table-audit.spec.ts:40` | `Campaigns` heading at `register (table-audit.spec.ts:37)` | registration |
| `v21-campaign.spec.ts:23` | `Campaigns` heading at `register (v21-fixtures.ts:28)` | registration |

On `c715f60`, three: `closeout.spec.ts:21`, `table-audit.spec.ts:40` and `v21-campaign.spec.ts:23`
— the same assertions, a subset of the five.

**The application code in the two runs is byte-identical.** `git ls-tree -r <tree> -- convex shared
web | sha256sum` is `1c7bf6e635467fee481ad99a022cd17d504dc3cf24360eb1d654dae4b544fd6a` for both
`c715f60` and `cc7d4ac`, and `git diff c715f60 cc7d4ac -- convex shared web` is empty; every
difference between them is in `tests/**` or `docs/**`. So the same application went from three
failures to five between the two runs. That rules the application delta out as the difference. It
does **not** identify what the difference was, and none is claimed here.

What the runtime showed, as observation only, retained in
[`runtime/load-during-cc7d4ac-suite.log`](runtime/load-during-cc7d4ac-suite.log):

- Convex 1s function timeouts on three **different** queries across the two runs —
  `Q(foes:catalog)` at 19:22:10, `Q(events:list)` at 20:02:51, `Q(targets:drafts)` at 20:03:54.
  None is a surface this slice changes.
- CT114 at 20:04:05, mid-suite: 4 CPUs, one-minute load average 4.53, five Salient environments
  with containers up concurrently, the `characters` backend at 1.874 GiB of 3 GiB and its web
  container at 1.292 GiB of 2 GiB.
- The integration lead stopped the retired `foes` preview at 20:08, mid-run. Four of the five
  failures were written before that and one 12 minutes after, so the run was not taken under
  constant conditions. A single post-stop failure measures nothing in either direction.

Retained artifacts for the **delivered** run's five failures:
[`browser/cc7d4ac-failures/`](browser/cc7d4ac-failures) holds Playwright's own error context for
each — the failing locator and call log verbatim — and, for the two registration failures, the
accessibility snapshot of the page, in which the create-account form carries
`- alert: Too many requests. Please try again later.` as a live DOM node. That is the strongest
form this evidence takes: not a screenshot to be read, but the rendered alert in the tree.

Retained artifacts for the earlier run's failures, which is what survives of them:
[`browser/c715f60-failures/`](browser/c715f60-failures) holds the Director page showing the
application's *"Function execution timed out (maximum duration: 1s)"* card, both create-account
forms showing the auth library's *"Too many requests. Please try again later."*, and the backend
excerpt **with its disclosure** that the quoted line was read live and cannot be re-extracted,
because `up --replace` recreated the backend container at 19:57:19.

Two facts about this slice's relationship to the failures, both checkable:

- `git show --stat` on the candidate lists no change to `convex/auth.ts`, `convex/foes.ts`,
  `convex/events*`, or any registration, campaign, table, combat or foes code.
- On `c715f60`, the three failures were suite positions 2, 22 and 27, and the first V46 spec is
  position 48 — no test added by this slice had run, and none had created an account, when each
  failure occurred.

**That positional argument is about `c715f60` only, and it does not carry to the delivered run.**
On `cc7d4ac` the V46 block is positions 48–51 and the fifth failure, `wizard.spec.ts:23`, is
position **52** — the test immediately after it. The V46 cases therefore ran *inside* the unstable
window: after four failures, spanning the 20:08 capacity change, and ending immediately before the
20:20:30 one. Their passing is not protected by having run in a quiet prefix, and this section
would be misleading if it implied otherwise.

What is true about the direction of the risk, offered as reasoning and not as evidence: every V46
assertion is a positive readback of a persisted value, so a throttled backend surfaces in these
specs as a thrown `pnpm app` error or an assertion timeout — a false *failure* rather than a false
pass. But no per-test timing is retained for positions 48–51, several assertions are `expect.poll`
and absorb latency by design, and nothing in the record excludes a stale-read false pass.

Neither fact explains any of the timeouts. They remain unexplained here. No assertion, timeout or
backend limit was changed in response to any of this.

**The reruns.** Each run's failures were rerun in isolation on the same tree that produced them:
three on `c715f60`, five on `cc7d4ac`, and in both cases every one passed. What that establishes is
narrow and worth stating exactly: **those cases passed when run alone on the same code.** It does
not establish why the first attempts failed, and a passing retry is not a diagnosis. The delivered
candidate's whole-suite result stands as 5 failed.

## Counterpart comparison and persisted readback

These run inside `pnpm check:engine` on the delivered candidate — **22 files, 316 tests, all
passing** — and comprise 16 counterpart tests, 16 devil tests and the 7 unchanged V45 reference
tests, which still pass after this slice extended the shared Forge projection with the
movement-mode feature type.

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

`tests/browser/v46-devil-persistence.spec.ts`, inside the full suite runs recorded above:

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
  survive. Retained as [`persisted/removal-readback.json`](persisted/removal-readback.json), which
  records all three states so the removal is readable evidence and not only an assertion that ran
  once. Every value in it is **captured from the sheet that was read back**, including the flying
  state: an earlier draft of that file wrote the expected constants into the "flying" block, which
  would have presented an expectation as an observation, and the independent reviewer caught it.
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

### Build-time equipment across advancement and restore

An independent review asked for an inventory readback. **A mutable inventory is not implemented**,
so what follows is build-time equipment conservation and is labelled as that, not as inventory
preservation.

The absence claim is over the **composed** schema, not the eight tables written directly in
`convex/schema.ts`. That file spreads seven further modules — `characterTables`, `contentTables`,
`foeTables`, `encounterTables`, `initiativeTables`, `historyTables`, `abilityTables` — for 33
tables in total: `targetingDrafts`, `heroRollFacts`, `actionUses`, `actionOpportunities`,
`abilityResults`, `characterSecrets`, `characters`, `characterRevisions`, `characterReviews`,
`content`, `contentManifest`, `foes`, `foeSettings`, `historyCursors`, `historyUnits`,
`historyAliases`, `encounters`, `snapshots`, `changes`, `diceStates`, `rolls`, `initiativeGroups`,
`turnEntries`, `turns`, `clockRegistrations`, `users`, `campaigns`, `memberships`, `joinRequests`,
`sessions`, `events`, `interactions`, `commands`. None holds items, equipment or possessions; a
case-insensitive search of all seven modules for `inventor|equipment|items?|gear|treasure|
consumable` returns nothing. An earlier version of this section claimed the eight direct tables
were the whole schema, which was wrong, and the integration lead caught it.

What the application does model is the kit and its `equipmentText`, plus the `wealth` and `renown`
values on the derived baseline. The sheet prints exactly those; in
[`browser/sheet-flight.png`](browser/sheet-flight.png) they are the *"You wear heavy armor and
wield a heavy weapon"* line under the kit block and the Wealth and Renown rows in Stats. The
persistence spec reads that surface through `carried()` and asserts it is **unchanged** across the
level-one to level-two advancement and again after the real restore, comparing against the
level-one reading rather than a constant so that neither assertion encodes a level-two expectation
the source does not state.

Equality alone would be vacuous if the kit simply vanished at both levels — `carried()` yields
nulls for a kitless build — so the level-one reading is anchored first: the kit is `Mountain` and
its equipment text is non-empty. `advancement-readback.json` records `carried` at level one, level
two and after the restore, and states in the file that this is build-time equipment and not an
in-play possession.

## Regression journeys

The existing character browser journeys ran unchanged inside the full suite recorded above, so this
is not a separate selective run whose scope has to be taken on trust. In the delivered candidate's
log, four of the five **passed**: positions **34** `v21-wizard.spec.ts` (wizard frame and
persistence), **35** `v25-elementalist.spec.ts` (the corrected Forge Bethell Polder/Elementalist
build with its reviewed sheet), **36** `v32-progression.spec.ts` (Fury level-one to level-two
advancement with live-state preservation and history restoration) and **47**
`v42-primary-choice.spec.ts` (collapse, edit, prune and reopen).

The fifth, position **52** `wizard.spec.ts` (admission review and the three sheet audiences),
**failed** — it is one of the five listed above, on `Take turn` at `acceptance-extension.ts:56`,
in the combat-flow group. It is named here rather than left out of this section, because a
regression list that quietly omits the one that failed is worse than no list. None of the five was
modified by this unit.

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

## Repairs made after the second independent review

A fresh independent implementation review of `7b7174b` returned CHANGES REQUIRED. Its blocking
finding was evidence correspondence — retained logs older than the candidate they were filed
against — which the two named runs above replace. Four of its remaining findings turned out to be
real defects in the tests rather than documentation gaps, and are listed here because "the review
asked and I complied" is less useful than what was actually wrong.

- **Authored text proved nothing.** All three persistence journeys built their authored payload as
  a name plus `appearance: ''`, `biography: ''`, `notes: ''`. The restore check
  `expect(restoredSheet.authored).toEqual(before.authored)` therefore compared three empty strings
  to three empty strings: a restore that wiped every field would have passed it. Each hero now
  carries distinguishable text in all three fields, and the test asserts the level-one values are
  non-empty *before* comparing them.
- **Two expectations were re-derived from the code under test.** `rounds-aloft` was asserted as
  `Math.max(1, baseline.characteristics.M.value)` and Barbed Tail as `Math.max(...)` over the
  baseline's own characteristics. Both read the evaluator's output to compute the number they then
  checked the evaluator's output against, so a wrong Might or a wrong array would have satisfied
  them. Both now assert the fixture ledger's independent constant first, and keep the relation as a
  secondary check.
- **Level-one Stamina was read out of the application.** `staminaOne` came from
  `before.build!.baseline!.staminaMaximum.value`, and level two was only checked with
  `toBeGreaterThan`. Both are now constants derived from the pin in the test's own comment:
  `class/fury.md:41` *"Starting Stamina at 1st Level: 21"*, `class/fury.md:43` *"Stamina Gained at
  2nd and Higher Levels: 9"*, `kit/mountain.md:21` *"Stamina Bonus: +9 per echelon"*, and
  `rule/general/echelon.md:11` *"1st Echelon (1st to 3rd Level)"* — which is why level two still
  takes the kit's +9 exactly once. That gives 30 and 39, both now asserted exactly.
- **The removal journey retained nothing.** It asserted and discarded. It now writes
  [`persisted/removal-readback.json`](persisted/removal-readback.json) with the flying state, the
  state after the traits are replaced, and the state after the ancestry is left.

One documentation defect was also fixed: `V46-devil-level-one.md:243` said the weakness records
`damageType: 'allDamage'` while line 273 of the same file said it records `'all-damage'`. The code
and tests already used `'all-damage'`; the stale line is corrected. The remaining `allDamage`
mentions in this slice's documents are deliberate contrasts with the older `damageWeaknesses`
spelling, not the same mistake repeated.

## Shared behaviour this slice changes, and who else it reaches

Two shared behaviours change here. Neither is Devil-specific, neither was asked to be, and both
reach content this slice does not own — so they are described by what they do to everyone, not by
what the Devil needed.

### 1. Grant notes reach the sheet

Glowing Eyes needs the sheet to say that its damage is resolved by hand. `Provenance.note` and
`Grant.note` were both already in `shared/contracts/characterEvaluation.ts`, and
`grantProvenance` already copied `grant.note` into the provenance before this slice. What was
missing was the last hop: the sheet projection dropped it. Three changes close that, and this is
their whole extent:

| Change | File | Effect |
| --- | --- | --- |
| `grantedBy()` copies `note` when the provenance has one | `convex/characters.ts:619` | Any grant note now reaches the sheet contract |
| `grantedBy` gained `note?: string` | `shared/contracts/characterSheet.ts:55,60` | On both `SheetAbility` and `SheetFeature` |
| Ability cards render the note under the card | `web/character-sheet/ability-card.tsx:89` | Abilities only |

There is no Devil-specific code on that path, and none was asked for. The consequences, stated
plainly rather than implied:

- **It is generic and it is live for everyone.** Any content author who puts a `note` on a grant
  gets it projected onto the sheet from now on, without touching this code again. That is the
  intent, not a side effect.
- **Today it changes exactly one card.** A scan of `shared/content/**` for grants carrying a note
  finds the Devil's Glowing Eyes grant and three Fury level-one grants (`Starting Stamina at 1st
  Level: 21`, `Recoveries: 10`, and the potency line). The Fury three are `statistic` and `potency`
  grants, which are not abilities or features, so they never reach `grantedBy()` and no existing
  sheet changes. The 42 `note` fields in `shared/content/supporting-complications.ts` belong to
  `ChoiceSpec`, a separate records interface, not to `Grant`.
- **That content scan is not the whole inventory**, and the independent reviewer was right to say
  so. Provenance notes are also constructed in the evaluator rather than declared in content —
  `shared/evaluate/character.ts:1494` attaches `note: 'Active only with 5 or more Victories.'` to a
  Dragon Dreams supporting feature, and that one **does** reach `SheetFeature.grantedBy.note`. It
  changes no rendering today for the reason in the next bullet, but "one card" is a statement about
  what renders, not about what the projection carries.
- **Features carry the note but do not display it.** `grantedBy()` is called for abilities
  (`convex/characters.ts:674`) and features (`:687`), so `SheetFeature.grantedBy.note` is populated
  and persisted, but no feature renderer reads it. A note put on a feature grant today would be
  present in the data and invisible in the UI. Nothing in this slice needs that, so it was not
  built; it is recorded here so the gap is not discovered later as a surprise.
- **The contract change is additive and optional.** Existing consumers of `grantedBy` are
  unaffected by an extra optional string.

### 2. Grants from list-shaped decisions now record which option granted them

This one is a genuine behaviour change in shared code, and it is **not** confined to the Devil, so
no claim that provenance is otherwise untouched would be accurate.

`shared/evaluate/character.ts` builds a grant's provenance with
`this.single(decision.id)`, and `single()` returns `undefined` for any decision whose selection is
an array (`shared/evaluate/character.ts:183`). Every multi-select and points-budget decision stores
an array. So before this slice, a grant carried by one chosen option of such a decision recorded
**no selection at all**: the sheet could say which decision granted an entry but not which option
did. The Devil's purchased traits are a points decision, which is how it surfaced.

`grantProvenance` now falls back to the option that actually owns the grant:

```ts
const selection =
  this.single(decision.id) ??
  decision.options?.find(option => option.grants?.includes(grant))?.value;
```

Consequences, stated as they are:

- **It applies to every list-shaped decision in the content**, not to the Devil. Any grant from a
  multi-select or points decision that previously had no `selection` now has one.
- **It only ever adds a value where there was none.** `single()` still wins when it returns a
  string, so no single-select grant's provenance changes.
- **It is an improvement to existing entries, which means existing sheets change.** That is the
  intent — a grant that named no option was incomplete — but it is a change to output for content
  older than this slice, and it should be read as one.
- The full `pnpm check` on the delivered candidate passes with it, engine and app together; no
  existing expectation depended on the missing selection.

## What this evidence does not cover

- Gameplay automation of any Devil trait: all activation, once-per-round tracking, concealment,
  flanking, flight movement, elapsed rounds, falling and conditional weakness application remain
  manual and are only shown as readable text and recorded conditional amounts.
- Any ancestry, class or level other than Devil at level one.
- Forge Steel import/export adapters, which remain unimplemented.
