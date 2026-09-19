# V51 clean rerun — overlap-verified measurement

Supersedes the void first run, whose raw data I destroyed and whose findings are withdrawn.
See [README.md](README.md) for that record; it is retained deliberately.

## Provenance

Measured tree: `presidium-dev --env characters up --replace` from
`/srv/presidium/projects/salient/opus-diag`, environment-reported commit
`1b173a77f15e9f4cf3d5980fe397d3a458d2fee4`, **dirty: false**, install job exit 0. Recorded in the
bundle as `source-identity.txt`.

Bundle: `/srv/dev/salient/characters/artifacts/v51-rerun.tar.gz` on CT114, 39,572 bytes,
SHA-256 `b8aa2f8e89f054b7355c993687ad4c0bda6b8b73f562a8022a79d5e621bf410b`, identical inside the
container at `/artifacts/v51-rerun.tar.gz`.

Every aggregation below is bounded to its own sampling window, which opens **after** preflight
settles. No `convex logs --history` was used; both windows come from a live tail started before
sampling. Preflight issues five calls and they are outside every window.

## Conditions

| Condition | Window (UTC) | In-window application executions | Suite |
| --- | --- | ---: | --- |
| Idle | 21:29:55.049 → 21:30:55.855 | 0 | none |
| Loaded | 21:45:08.596 → 21:46:12.373 | **192** | closeout, `CLOSEOUT_RC=1` |

The loaded window's overlap with real load is **verified, not assumed**: sampling began only after
a bounded wait observed eight real table queries, recorded in `attempt4-trigger.txt` as
`TABLE-ACTIVITY-DETECTED 2026-09-19T21:45:05Z n=9`. 94 in-window application executions ran at or
above 900 ms, so the failure conditions were present while the probes were sampled.

A separately retained sample, `v51-loaded-nonoverlapping.json`, is **not** a loaded condition: its
window contains zero application queries because the suite had already finished. It is kept under
that name so it cannot be mistaken for one.

## Convention, disclosed rather than assumed

Median is the mean of the two middle values for even n; p90 is nearest-rank. An earlier version of
this report used an upper-middle order statistic without saying so, which inflated some medians —
`foes:catalog` read 1068 where the standard median is 817.5. All figures below use the disclosed
convention.

Each arm shows **n = 29** against 30 issued pairs. The Convex log timestamps are second-resolution,
so a call at a window boundary can fall outside a millisecond-precision window. The missing sample
is a boundary artifact, not a failed call: the driver recorded **zero** failures in both conditions.
Interior samples are unaffected.

## File map, because two files share a name

| File in the bundle | What it is |
| --- | --- |
| `v51-idle.json` | idle condition |
| **`a4/v51-loaded.json`** | **the true loaded condition**, overlap verified |
| `v51-loaded.json` (root level) | the **non-overlapping** sample; zero application queries in window. Not loaded evidence |
| `v51-loaded-nonoverlapping.json` | copy of the above under an unambiguous name |
| `attempt4-logs.txt` | live `convex logs --success` tail covering the loaded window |
| `attempt3-*` | the attempt whose driver failed on my bad `--condition` argument; retained |

## Result, milliseconds of server execution

| Probe | Idle median | Idle p90 | Idle max | Loaded median | Loaded p90 | Loaded max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `probeWithAuthPrefix` | 43 | 49 | 51 | **42** | **204** | **490** |
| `probeIdentityOnly` | 13 | 16 | 16 | **14** | **28** | **55** |

An earlier version of this report gave idle figures of 42/54/77 and 11/13/40. Those were carried
over from the **void first run** and are wrong for this rerun; the values above are recomputed from
`idle-logs.txt` bounded to the idle window.

Application queries in the **same loaded window**:

| Query | median | p90 | max | n |
| --- | ---: | ---: | ---: | ---: |
| `targets:drafts` | 1063 | 1191 | 1265 | 23 |
| `characters:sheet` | 1059 | 1316 | 1316 | 9 |
| `encounters:current` | 1058 | 1186 | 1311 | 23 |
| `history:status` | 1040.5 | 1175 | 1246 | 26 |
| `table:roster` | 1002 | 1155 | 1279 | 27 |
| `foes:catalog` | 817.5 | 1184 | 1373 | 10 |
| `events:list` | 690.5 | 1079 | 1150 | 26 |

A `foes:catalog` execution crossed the limit at 21:45:27, inside the window.

## What this supports, stated no more strongly than the data allows

**Fast minimal probes are evidence against a *uniform* prefix cost. They cannot exclude a
context-dependent prefix cost.** That is the whole of the headline. The probe's median is 42 ms
under verified load while application medians sit near 1000 ms on the same backend in the same
window. What follows is narrow: **a prefix charge that is the same size in the probes as in the
application queries cannot account for the gap.** It does not follow that the prefix contributes
nothing there — the same code could cost more inside a query with a different import graph, a
different working set, or different contention exposure, and this experiment cannot see that.

**The prefix is not immune to load.** Its p90 moves 49 → 204 ms and its maximum 51 → 490 ms, while
the control moves 16 → 28 ms. Load reaches the prefix; it simply does not reach it anywhere near
enough to explain a one-second limit on its own. The first run's "refuted" framing is withdrawn.

**The probes do not isolate `requireMember` or database work.** The diagnostics module imports only
`lib/access`. `targets.ts` pulls in `tableContext` from `lib/registry`, whose top-level imports
reach every operation family; `foes.ts` reaches the whole compendium through `content.ts`. Module
initialization and bundle dependencies therefore differ between the probes and the real queries.
That is an untested alternative to any database-work explanation, not a finding.

**Correction: this does not apply uniformly, and an earlier version of this report said it did.**
`events.ts` imports only `requireUser` and `requireMember` from `lib/access` — it does **not** use
`tableContext` and does not reach `lib/registry`. So "every slow query pulls in the registry" was
false. Worth noting without overreading: `events:list` also has the **lowest** median of the slow
set at 690.5 ms against roughly 1000 ms for the `tableContext` consumers. That is consistent with
an import-graph effect and is equally consistent with `events:list` simply doing less work. One
query is not a comparison, and nothing here tests it.

**It refutes an argument from my own earlier triage.** I claimed `targets:drafts` and `foes:catalog`
read too little to be slow and were a control group proving the cost was not in the handlers. They
are among the slowest measured. A small read set does not bound execution time here.

## Invalid data in the bundle, disclosed

`attempt4-host.txt` repeats an identical 21:44:41 snapshot on every row. The command substitution
evaluated once at launch instead of per iteration, so it is **not** a continuous host series and no
host behaviour may be inferred from it. `idle-host.txt` was produced differently and is a real
series. Nothing in this report rests on either.

**Registration confound, disclosed.** The driver mints a disposable account, so its signup overlaps
the browser scenario's own registration and could in principle trigger signup limits. It did not
here — zero failed samples in both conditions, and no 429 appears in the sampled probe calls — but
the timing is in the artifacts if it needs checking.

## Not tested

Browser failure artifacts for the loaded attempt — screenshots, `error-context.md` and `trace.zip` —
are archived separately at `/srv/dev/salient/characters/artifacts/v51-attempt4-browser.tar.gz`,
5,915,856 bytes, SHA-256 `eacb53150faa3c6a6b2aff0704f42568060c0b52a5453bbd12b72655018ce794`. The
text bundle references them only.

Neither probe exercises `requireMember` (a campaign read plus a membership lookup) or
`tableContext` (a `sessions` read), which every slow query above runs. That remains the narrowest
untested shared surface. A separate consideration, noted by the integration owner and not tested
here, is that module initialization and bundle dependencies differ between the diagnostics module
and the application modules, so `requireMember`'s database reads are not the only candidate
difference. No third arm was added; both are hypotheses.
