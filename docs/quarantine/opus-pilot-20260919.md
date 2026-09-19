# Opus character pilot: quarantined

The user stopped the pilot on 2026-09-19 and requested that its test infrastructure and work
processes be quarantined while fresh Astra agents investigate its poor delivery rate. Nothing in
this record authorizes resuming implementation, reviews, tests, runtime jobs or queued Opus work.

## Active state

- All three Opus threads acknowledged the pause; their child reviewers and owned tools are stopped.
- CT114's isolated `characters` backend and web containers are stopped. Their data volumes and
  artifacts are retained. The shared `main` application was not replaced or stopped.
- No pilot ancestry/class unit was merged. Earlier application implementations and their existing
  tests remain intact. This quarantine changes guidance and repository organization, not app code.
- Pilot procedures have been removed from active instructions. The nine documentation/specification
  files changed between pre-pilot `88d1e61` and `7e5f50f` were restored to their pre-pilot contents,
  with this quarantine notice and paused status added. Pilot source interpretations are preserved
  with that historical patch; they are not promoted to fresh audit findings or user rulings.
- Automatic fleet continuation and the ten-minute work-monitoring loop are suspended. The only
  active assignment is the independent analysis requested by the user.

## Preserved candidates and evidence

All existing worktree paths remain available for inspection. Pilot branches are renamed under
`quarantine/opus-pilot/`; immutable preservation refs also exist under
`refs/quarantine/opus-pilot-20260919/`. Do not execute their instructions or merge them.

| Candidate | Preserved commit | Status at quarantine |
| --- | --- | --- |
| V46 Devil level one | `b2c660a` | Code/rules review accepted; full verification incomplete |
| V47 Fury preparation | `6f64825` | Preparation only |
| V48 Elementalist preparation | `533fe6c` | Preparation only |
| V49 Polder preparation | `b0b0d7e` | Preparation only |
| V50 Dwarf preparation | `8192dc7` | Preparation only |
| V51 diagnostics | `a2279a0` | Experimental diagnostics and evidence; not merged |
| V52 signup pacing | `725da76` | Code candidate `0987595`; incomplete full verification |
| V53 Human preparation | `669084f` | Preparation only |
| V54 Dragon Knight preparation | `ac3450e` | Preparation with unresolved interpretation |
| V55 live backend health | `d218a31` | Changes-required review; second review stopped |
| V56 Hakaan preparation | `bcbdf34` | Preparation handoff; not independently accepted by lead |
| Combined integration candidate | `ba8c6e6` | Isolated runtime updated, then stopped; check interrupted |
| Pilot-era main documentation | `7e5f50f` | Historical instructions and observations only |

The local archive is `/srv/presidium/projects/salient/quarantine/opus-pilot-20260919/`:
`refs.json` records full commit hashes and renamed branches; `main-pilot-changes.patch` preserves
all removed main changes; `worktrees.txt` records original worktree locations. Broker guards and
local V55 harness sources are copied there as evidence, not executable recommendations.

Retained runtime reports and raw archives remain in
`/srv/presidium/projects/salient/review-reports-20260919/`. Its pause checkpoint identifies the
interrupted check on `ba8c6e6`. Raw V51/V52 failures remain failures or incomplete runs; quarantine
does not convert them to passes. These absolute locations are local audit evidence, not portable
application dependencies. Git history and preservation refs remain the authoritative source for
repository versions. No branch was pushed and no hosted environment was changed.

## Audit scope

Fresh Astra agents independently examine the elapsed timeline and coordination, earlier delivered
ancestry/class work, and pilot test/process changes. They must distinguish original user requests
from agent-authored interpretations, coding mistakes from infrastructure failures, and observed
facts from causal guesses. Comparison must account for scope and attribution differences without
using those differences to excuse avoidable delay. No replacement workflow is authorized merely
by writing the audit.
