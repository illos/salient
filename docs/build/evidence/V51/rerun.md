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

## Result, milliseconds of server execution

| Probe | Idle p50 | Idle p90 | Idle max | Loaded p50 | Loaded p90 | Loaded max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `probeWithAuthPrefix` | 42 | 54 | 77 | **42** | **204** | **490** |
| `probeIdentityOnly` | 11 | 13 | 40 | **14** | **28** | **55** |

n = 29 per arm in the loaded window; zero failed samples in either condition.

Application queries in the **same** window:

| Query | p50 | p90 | max | n |
| --- | ---: | ---: | ---: | ---: |
| `foes:catalog` | 1068 | 1373 | 1373 | 10 |
| `targets:drafts` | 1063 | 1191 | 1265 | 23 |
| `history:status` | 1061 | 1175 | 1246 | 26 |
| `characters:sheet` | 1059 | 1316 | 1316 | 9 |
| `encounters:current` | 1058 | 1186 | 1311 | 23 |
| `table:roster` | 1002 | 1155 | 1279 | 27 |
| `events:list` | 702 | 1079 | 1150 | 26 |

## What this supports, stated no more strongly than the data allows

**The shared `requireUser` prefix cannot account for the application queries' cost.** Its median is
42 ms under verified load — unchanged from idle — while application medians sit at roughly 1000 ms,
about 24 times larger, measured on the same backend inside the same window.

**The prefix is not immune to load, and the first run's "refuted" framing was wrong.** Its tail
degrades materially: p90 54 → 204 ms and maximum 77 → 490 ms. The control degrades far less,
p90 13 → 28 ms. So load does reach the prefix; it simply does not reach it anywhere near enough to
explain a one-second limit.

**This is evidence against a fixed universal-prefix explanation. It is not proof** excluding rare or
context-dependent prefix effects, and it identifies no cause.

**It also refutes an argument from my own earlier triage.** I claimed `targets:drafts` and
`foes:catalog` read too little to be slow and should be treated as a control group proving the cost
was not in the handlers. Both are among the slowest here — 1063 and 1068 ms medians. A small read
set does not bound execution time on this backend, and that argument should not be reused.

## Not tested

Neither probe exercises `requireMember` (a campaign read plus a membership lookup) or
`tableContext` (a `sessions` read), which every slow query above runs. That remains the narrowest
untested shared surface. A separate consideration, noted by the integration owner and not tested
here, is that module initialization and bundle dependencies differ between the diagnostics module
and the application modules, so `requireMember`'s database reads are not the only candidate
difference. No third arm was added; both are hypotheses.
