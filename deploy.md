# Deployment

DEPLOY2 (Chords `80f94764-5a63-430c-9548-6d8583052803`, succeeding DEPLOY
`bc6847ae-0334-4282-ae3c-6ec7291a509c` on 2026-09-20) owns integration of finished branches into `main`,
final release commits, the verified push of `main` to GitHub, and promotion of the integrated
revision to the live stable cloud environment.
TESTER owns feature acceptance test execution under
[testing-process.md](testing-process.md).

## Stable target

- Frontend: `https://salient-dev.rdxx.workers.dev` (`salient-dev` Cloudflare Worker)
- Backend: Convex `dev:different-bat-943`
- Procedure and credential handling: [docs/hosted-development.md](docs/hosted-development.md)
- Reuse accepted TESTER evidence; deployment does not run smoke tests or other test gates.
- Reseed the committed content when required; development data is disposable under `AGENTS.md`.

The cloud target is stable only when its backend, content and frontend are recorded against one
exact integrated `main` revision and the required publication commands have succeeded. A branch-only candidate or a
partially updated target is not stable.

## Promotion gate

1. The owner hands off the reviewed tip after TESTER's full check and applicable headless proof pass.
2. DEPLOY2 fast-forwards `main` and publishes affected backend, content and frontend components.
   Reuse passing checks for unchanged inputs; do not add a pre-promotion or exact-revision test gate.
3. DEPLOY2 records the runtime source and Worker version, commits the release closeout, pushes
   `main`, verifies the remote SHA and sends the completion handoff.

Do not rerun suites, headless journeys, smoke tests or live checks as part of promotion. Reuse the
accepted feature gates even when the target environment or integration commit changes. New targeted
verification requires an explicit user request or a concrete code change or observed failure.
Required release builds and successful publication commands are sufficient deployment confirmation.
Historical live-test records below are evidence of past releases, not current requirements.

Development data is disposable. Do not fingerprint, snapshot or preservation-check records.
Coordinate before resetting another thread's environment or the user's shared app. Routine content
reseed uses the hosted task. Cloud publication is serialized; documentation-only changes need no
runtime update. Domains, accounts and paid plans remain separate from standing release authority.

## Job ledger

| Job | Candidate | State | Next gate |
| --- | --- | --- | --- |
| V145 | `7646954` | Merged in train 1; backend/content/frontend published; combined gates at tip | complete |
| V140 | `7646954` | Merged in train 1; backend/content/frontend published; combined gates at tip | complete |
| V135 | `7646954` | Merged in train 1; backend/content/frontend published; combined gates at tip | complete |
| V150 | `fad564f` | Merged; backend/frontend published; accepted gates reused | complete |
| V133 | `b99b951` | Merged; backend/content/frontend published; combined gates at tip | complete |
| V120 | `f3acd97` | Merged; backend/frontend published; accepted gates reused | complete |
| V132 | `c3f9e35` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V117 | `2dcbf97` | Merged; backend/content/frontend published; combined gates at tip | complete |
| V119 | `3c02939` | Merged; backend/frontend published; accepted gates reused | complete |
| V115 | `4cc7f31` | Merged; backend/frontend published; accepted gates reused | complete |
| V116 | `3175606` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V114 | `3aa24ae` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V113 | `bd6e8e4` | Merged; backend/frontend published; accepted gates reused | complete |
| V110 | `2921a57` | Merged; backend/frontend published; accepted gates reused | complete |
| V109 | `7d82b59` | Merged; backend/frontend published; accepted gates reused | complete |
| V108 | `8744738` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V107 | `ca190a9` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V106 | `34a8b48` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V105 | `465814b` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V104 | `e064050` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V103 | `983bcfa` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V102 | `0bb1ead` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V101 | `e31335d` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V100 | `5079192` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V99 | `517ea19` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V98 | `66a0f3d` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V97 | `c3423f4` | Merged; backend/content/frontend published; accepted gates reused | complete |
| V96 | `1e20eec` | Merged; backend/frontend published; accepted gates reused | complete |
| V95 | `1115380` | Merged; backend/frontend published; accepted gates reused | complete |
| V94 | `fcf13f1` | Merged and published; 1209 entries; accepted gates reused | complete; no deployment test gate |
| V92 | `81b7931` | Merged and published; 1182 entries; hosted Shadow smoke passed | documentation closeout SHA and verified GitHub push recorded in completion handoff |
| Stable-cloud reconciliation | `main` release source `a0a700a` | Published; targeted live checks passed | documentation closeout and verified GitHub push; exact closeout SHA in DEPLOY2 completion message |
| V85/V86 | owner `64972e6`, integrated `4f3fe13` | Merged and published; targeted live checks passed | release closeout |
| V88 | integrated with V85/V86 at `4f3fe13` | Merged and published; targeted live checks passed | 1151 entries, inventory 13/1259/2; release closeout |
| V89 | owner `dff62e8`, integrated `4f3fe13` | Merged; full 358+575 PASS reused by identity | build-only heap repair `a0a700a` independently reviewed and hosted build passed |
| V75 | `c4ed53e` | Merged; frontend published | hosted asset smoke passed; closeout SHA in completion handoff |

Update this ledger at handoff, integration, publication, verification and rollback boundaries. The
canonical feature/test detail remains in [docs/build/STATUS.md](docs/build/STATUS.md); this file tracks
only deployment ownership and release state.

### Partial release — 2026-09-20 19:52 UTC

TESTER's [integrated certificate](docs/build/evidence/V85/tester-job-4f3fe13-integrated.md)
permits reuse of V89's complete passing gate. `a0a700a` adds only the reviewed hosted-build
heap adjustment (768 to 1536 MiB for build only); the corrected hosted build passed in the
existing 2 GiB container. Exact clean source was uploaded to CT114 `hosted`.

Convex backend publication passed schema validation. The subsequent `content:reseed` action
was refused because the scoped key lacks `deployment:functions:runInternalActions`.
No permission workaround or data reset was attempted. Frontend publication was held;
Worker `bb430814-0366-43a3-882a-bd69f81cc811` remains the previous release.
The temporary credential file was removed; private hosted services are stopped with data retained.

Release logs: `/srv/presidium/projects/salient/test-artifacts/release-4f3fe13-20260920`.
TESTER captured 5551 application rows and 421 auth rows before publication for a non-atomic
fingerprint comparison. An atomic export was unavailable (`deployment:backups:create` denied);
these captures are not a restore backup. Private evidence:
`/srv/presidium/projects/salient/test-artifacts/cloud-preservation-4f3fe13`.
TESTER's [post-backend comparison](docs/build/evidence/V85/tester-job-a0a700a-preservation.md)
passed: all 5972 captured rows identical, no additions/removals/changes; manifest remains 567
entries at `sha256:aaf7c027a421e6059448e019271111877f208b577b756f5e79645c3d497ed26e`.
No live test fixtures have been added. The initially planned repeat comparison is superseded below.

User clarification (20:03 UTC): repeated protected-row fingerprint captures are excessive for
this development build. Skip the additional baseline/comparison and retain targeted hosted
behavior checks. The earlier preservation evidence remains historical evidence, not a recurring
release requirement. Preserve existing play data through the normal scoped content refresh.

The user updated the broker-granted key, but the existing session's retry still received
`deployment:functions:runInternalActions` denial before the content action executed. Retry log:
`/srv/presidium/projects/salient/test-artifacts/release-4f3fe13-20260920/content-a0a700a-key-refresh.log`.
Temporary remote credentials were removed again. A fresh broker session is the next step;
backend, content and frontend state remain as recorded above.

Resume with a scoped development key authorized for the internal reseed action, verify
the uploaded release identity/build stamp, reseed the committed snapshot, publish the frontend,
then commit/push the release (the former live-test requirement is superseded by the promotion policy above).
Do not roll back to code lacking starting-reward or condition-instance validators.

### Publication resumed — 2026-09-20 20:06 UTC

User-requested ownership transferred to DEPLOY2. The fresh session's scoped development key
successfully ran the existing content-only reseed: 1151 entries at pinned revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. No backend repeat, build, upload of source,
auth reconfiguration or play-data reset was needed. The retained build passed the task's exact
asset-stamp guard and published as Worker `0336f2f4-1141-4d95-8bc6-d2cec63f8797`.
Backend and frontend executable source remains `a0a700af77740879e214c064876e277219f0f441`.

Temporary CT114 credentials were removed after publication; private helper services remain stopped.
Logs in the release artifact directory above: `content-a0a700a-deploy2.log` and
`frontend-a0a700a-deploy2.log`. TESTER job `test-hosted-a0a700a-live-deploy2` (Chords 1064)
passed authenticated content/foe readback, two bounded character cohorts and the dedicated public
real-dice V88 proof. V90 and V75 are excluded.

The [live certificate](docs/build/evidence/V85/tester-job-a0a700a-hosted-live.md) records the
exact manifest hash, 438-entry foe catalog and persisted Ghoul, starting rewards and complication
cohorts, and Eye Flash application/save cleanup. Natural attack dice 4+7 produced tier 2,
14 corruption damage and restrained; the target's actual save 7 succeeded against 6 and removed
the source-linked condition. Session closure and signout passed. Wider rule/privacy/history
coverage remains the retained integrated and isolated evidence; no full suite was repeated.

This release record is documentation-only after executable `a0a700a`. DEPLOY2 records the exact
closeout commit and verified `origin/main` SHA in its Chords completion announcement after push.

### V92 publication — 2026-09-20

Main fast-forwarded to reviewed `81b79316dbf11e18d44f3feab6e7f1d3b49f5d22`.
TESTER's existing `2b46094` pass covers unchanged application code: 367 engine + 577 app/script
tests, four Forge counterparts and 36 headless scenarios. Backend publication, content reseed
and hosted frontend build/publish passed. Worker: `f6951468-0bfe-49bd-b0ab-1ec9628334fc`.
Content: 1182 entries, `sha256:ea1f6a2cf1d3c8a30f5fa40aef52fdadc25aa97900648485c9fe5957a50cf43b`.
Logs: `/srv/presidium/projects/salient/test-artifacts/V92-release-81b7931`.
Temporary credentials removed; private hosted helper services stopped.
TESTER smoke `test-V92-81b7931-hosted-smoke` passed in 6.24 s (Chords 1134): persisted Shadow
Insight/abilities and college replacement, with signout. Raw result:
`/srv/presidium/projects/salient/test-artifacts/V92-hosted-81b7931`.

### V75 Quiet theme publication — 2026-09-20

User-approved presentation changes merged at `c4ed53e48c74f5783b876cd6a7c09fafe2f0795c`.
TESTER `test-V75-c4ed53e-1` full check passed (exit 0, 162 s); that result was reused on promotion.
Hosted build and frontend publication passed. Worker: `31c58f6d-cfe2-4848-945e-908aa4104003`.
Backend source remains `81b7931`; content remains the V92 1182-entry snapshot. No backend deploy
or reseed was needed. Temporary credentials removed and private hosted helper services stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V75-release-c4ed53e`.

TESTER1179 hosted smoke passed in 1.27 s: public HTML, CSS and all three referenced fonts
returned HTTP200 with exact hosted-build hashes; Quiet background/accent/Schibsted tokens were
present. No browser run. Evidence: `/srv/presidium/projects/salient/test-artifacts/V75-hosted-c4ed53e`.

### V94 publication — 2026-09-21

Reviewed owner `7ec2d1f` integrated with current main UI polish at
`fcf13f11e91646579e9a5a05e1650255bc2ae21b`. V95 is not included.
Accepted feature evidence reused: 954 tests and Forge4/4 on `2f3f938`, targeted import-repair
checks and isolated Tactician cohort on `71530ba` (8.54 s). No tests repeated during promotion.
Backend publication passed schema validation; content reseed returned 1209 entries. The committed
snapshot hash is `sha256:b4e0d992e181c9bac991ca9487600fabeb1ce20a130781dc38128cdba0fa5035`.
Hosted build and frontend publication succeeded; Worker `c4b6b8f4-dd09-4706-934a-be5d4fac73a3`.
The user removed the deployment smoke-test requirement in policy commit `c465eb6`; no post-deploy
smoke, cohort, manifest readback or suite was run. Temporary credentials removed; private hosted
helpers stopped. Logs: `/srv/presidium/projects/salient/test-artifacts/V94-release-fcf13f1`.

### V95 account screen publication — 2026-09-21

Reviewed owner tip `1115380d0411acae916a3c7a8936e46cad95f9da` fast-forwarded into main.
Accepted TESTER results reused from unchanged runtime `d102db0`: full 961 checks, isolated
Convex push/codegen and account headless journey. No tests rerun during deployment.
Backend publication succeeded with the account indexes; hosted build and frontend publication
succeeded. Worker `72e2c950-8477-4c4a-895c-ed6b2c3026f1` serves the account screen.
Content remains the V94 snapshot (1209 entries); no reseed required. Temporary credentials
removed and private hosted helpers stopped. No smoke/live test or automatic GitHub suite.
Logs: `/srv/presidium/projects/salient/test-artifacts/V95-release-1115380`.

### V96 character builder publication — 2026-09-21

Reviewed owner tip `1e20eece741fc763eea4c359d3853d018e4513de` fast-forwarded into main.
Accepted runtime `f5189d4` evidence reused: full 968 checks (176 s), isolated push/codegen
(2.25 s), wizard-draft 3/3 (14.3 s). No tests repeated during deployment.
Backend publication/schema validation, hosted build and frontend publication succeeded.
Worker: `b1effe2a-181b-4fa5-8355-df49f69cc3f0`. Content remains V94's 1209-entry snapshot;
no reseed needed. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V96-release-1e20eec`.

### V97 Shadow level two publication — 2026-09-21

Reviewed owner `c3423f4ba6d4dd95aacc7f230a243e6a264748a9` fast-forwarded into main.
Accepted runtime `71e665e` evidence reused: full 971 checks and isolated six-build/all-six-ability
journey. Backend publication/schema validation, content reseed (1221 entries), hosted build and
frontend upload succeeded. Worker `b25c3463-9fe2-4580-b0c6-dd3c55e9b76d`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V97-release-c3423f4`.
Committed content snapshot hash: `sha256:9778bbbd413dfe01afd0c76e26fc41542f6ce46957aa261af9bf541d5ba342ca`.

### V98 Shadow level three publication — 2026-09-21

Reviewed owner `66a0f3d12ea8bb450cfda7c8375ba363fa718861` fast-forwarded into main.
Accepted evidence reused: 974 distinct tests in the resumed gate (not one full successful command),
and isolated four-build/six-action cohort (14.1 s). Prior failures remain recorded in the slice.
Backend publication/schema validation, content reseed (1228 entries), hosted build and frontend
upload succeeded. Worker `185d6c0a-3965-4ea1-87da-f399259360f2`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V98-release-66a0f3d`.
Committed content snapshot hash: `sha256:242bc3e1b0f8fead8bf2a47236797e1212e1bbb6cf1ed3221411a4ea62e64d72`.

### V99 Censor level one publication — 2026-09-21

Reviewed owner `517ea19de44ea758bc76812d3235b617077defd1` fast-forwarded into main.
Accepted evidence reused: 979 distinct tests in the resumed gate (not one full successful command),
and isolated twelve-build/42-action cohort (53.7 s). Prior failures remain recorded in the slice.
Backend publication/schema validation, content reseed (1306 entries), hosted build and frontend
upload succeeded. Worker `4cfd22de-2da4-42fe-b10b-65c373ae1cf1`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V99-release-517ea19`.
Committed content snapshot hash: `sha256:08fd8c7f9ee5f55ebe5b96a777ea6363dd828862ac1f6d894fa62bb688dd0362`.

### V100 Conduit level one publication — 2026-09-21

Reviewed owner `507919299a83b079167c43f7da40c0a0c8bfa92e` fast-forwarded into main.
Accepted evidence reused: full 984-test gate from `ec9108a` and isolated twelve-build/64-action
cohort from `a91faef` (72.2 s). Prior fixture correction remains recorded in the slice.
Backend publication/schema validation, content reseed (1361 entries), hosted build and frontend
upload succeeded. Worker `28baa4c0-dbb9-4b75-ad0a-7a596b8d54a2`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V100-release-5079192`.
Committed content snapshot hash: `sha256:c16feeda0b1bc2b9cd9f6c427016bef2e2f5d335dd7c1676f8f5804b9c83276b`.

### V101 Fury level one publication — 2026-09-21

Reviewed owner `e31335d0fa35ebcb2cc9e50af60d2d56f6c96c7f` fast-forwarded into main.
Accepted evidence reused: 987 distinct tests across retained/resumed runs (not one uninterrupted
full run), and isolated six-build/40-action cohort from `0adef76` (45.4 s).
Backend publication/schema validation, content reseed (1362 entries), hosted build and frontend
upload succeeded. Worker `179f7087-1c06-4e07-a626-2ebc6473d69a`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V101-release-e31335d`.
Committed content snapshot hash: `sha256:98b79a429d89d8e8e9ee14a8bacb928c14ef48fcc01bbe83f3fef1e709cfcbf8`.

### V102 Troubadour level one publication — 2026-09-21

Reviewed owner `0bb1ead31771b6b148102fefba9f0f22706ae2dd` fast-forwarded into main.
Accepted evidence reused from `189cec8`: full 990-test gate (195 s), and isolated four-build/
44-action cohort (69.7 s).
Backend publication/schema validation, content reseed (1402 entries), hosted build and frontend
upload succeeded. Worker `e2663b2f-4575-43a2-9bae-b9fb906f1997`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V102-release-0bb1ead`.
Committed content snapshot hash: `sha256:71c51714ee7ea4132cd14fdf6585bb945d656be91e20727320ef462cf4ab2095`.

### V103 Null level one publication — 2026-09-21

Reviewed owner `983bcfa930b070ce8375f8008966a0eea41c8c7a` fast-forwarded into main.
Accepted evidence reused from `17c0776`: full 993-test gate (197 s), and isolated four-build/
39-action cohort (56.7 s).
Backend publication/schema validation, content reseed (1436 entries), hosted build and frontend
upload succeeded. Worker `7d57b840-f22b-4dd3-bb6b-859147f92f71`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V103-release-983bcfa`.
Committed content snapshot hash: `sha256:81a631bfa49ba52e9f52ed5fbbd1ba3a571a1417339b22f0e74ef570ede97887`.

### V104 Elementalist level one publication — 2026-09-21

Reviewed owner `e064050936c73c75da87b82f3830b127948f70c7` fast-forwarded into main.
Accepted evidence reused: 996 unique tests across retained/resumed stages (not one full successful
command), and isolated five-build/59-action cohort at `d1d451b` (79.0 s).
Backend publication/schema validation, updated content reseed (1436 entries), hosted build and
frontend upload succeeded. Worker `68918c7b-7875-45a3-bb7f-aefb97163a6f`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V104-release-e064050`.
Committed content snapshot hash: `sha256:5d2ca9b833cc7595ce30490edb47feca2904e44f1e5e1ba2ab5bb7e8052b99b5`.

### V105 Talent level one publication — 2026-09-21

Reviewed owner `465814b17640852055d40b7a47614f658779b95a` fast-forwarded into main.
Accepted evidence reused from `fd7a17d`: full 998-test gate (200.5 s), and isolated five-build/
58-action cohort including negative Clarity (80.4 s). Rebase changed only documentation.
Backend publication/schema validation, content reseed (1483 entries), hosted build and frontend
upload succeeded. Worker `ef7da151-f04d-4bc8-8532-12aedb937290`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V105-release-465814b`.
Committed content snapshot hash: `sha256:7ffe0438ccb96263a43c2d3c8728737d387521af8d846b3cf9fbfd6bd4347d0a`.

### V106 Beastheart level one publication — 2026-09-21

Reviewed owner `34a8b483ec71065e48aaa132c77acc796879c8e9` fast-forwarded into main.
Accepted evidence reused: 1000 unique tests across retained/resumed stages (not one uninterrupted
full run), and isolated fourteen-build/111-manual-record cohort at `aaef3bd` (147.8 s).
Companion combat automation remains deferred.
Backend publication/schema validation, content reseed (1561 entries), hosted build and frontend
upload succeeded. Worker `e0c83bf3-190c-466b-a623-5b2cc46bcc4d`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V106-release-34a8b48`.
Committed content snapshot hash: `sha256:69db8c6944325ab4762699e0203dabf65680208099453c75e5ec30d73e455ace`.

### V107 Summoner level one publication — 2026-09-21

Reviewed owner `ca190a99f9a0b895d394e1df7cbce464e7bc95ce` fast-forwarded into main.
Accepted evidence reused from `405dd4d`: full 1002-test gate (217.4 s), and isolated
twelve-build/144-manual-record cohort (178.5 s). Summoned-creature combat remains manual.
Backend publication/schema validation, content reseed (1629 entries), hosted build and frontend
upload succeeded. Worker `e8b28ff3-da63-418d-904a-75be2a543d03`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V107-release-ca190a9`.
Committed content snapshot hash: `sha256:9bcde574efb5facb4741f329a92879f31d5e49feedd0f31baa61e507522f3ec2`.

### V108 Shadow through level six publication — 2026-09-21

Reviewed owner `8744738c24003d2794f24cb5ef1637472665c26d` fast-forwarded into main.
Accepted evidence reused: 1005 unique tests across retained/resumed stages (not one uninterrupted
full run), and isolated Shadow cohort at `542f452` (32 new uses, 68.3 s).
Backend publication/schema validation, content reseed (1654 entries), hosted build and frontend
upload succeeded. Worker `bcdeafc0-9b86-4fde-b3b4-c163b7a98a66`.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V108-release-8744738`.
Committed content snapshot hash: `sha256:8cdc0bdbb893a3191b64b5557284a9a5ec30224b6263148c3cad74999909eacf`.

### V109 Effect riders and kit signatures publication — 2026-09-22

Reviewed owner `7d82b594181e22dfcd1ba108cc41a930d83ebf5e` fast-forwarded into main.
Accepted evidence reused: full 1040-test gate at `9557080` (216.8 s), and repaired isolated
seventeen-ability journey at `254d5d2` (49.0 s), including Hamstring applied/resisted readback.
Backend publication/schema validation, hosted build and frontend upload succeeded.
Worker `afc19386-cef9-48b7-9979-748a9456ddca`. Content remains V108's 1654-entry snapshot;
no reseed needed. Effect riders remain manual table work as documented in the slice.
No smoke tests or test reruns. Temporary credentials removed; private hosted helpers stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V109-release-7d82b59`.

### V110 compiled multi-target and area abilities publication: 2026-09-24

ENGINE2 performed this release under the user's 2026-09-24 instruction to run its own deploy.
Reviewed owner `2921a57f994f6ce2b3da2713123967b69a33c6ae` was fast-forwarded into main.
- Accepted evidence reused:
  - full gate at `59679ed` (200.9 s)
  - isolated `multi-target` and `effect-riders` journeys at `eca2cee`
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `ed93b686-8a97-4cd9-9eed-7e38d6fc4012`.
- Content remains the 1654-entry snapshot, so no reseed was needed.
- No smoke tests or test reruns. Temporary credentials were removed and the private hosted
  helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V110-release-2921a57`.

### V113 compiled tier forced movement, EoT and prone conditions publication: 2026-09-24

The test and deploy thread published this release at ENGINE2's handoff, under the user's
2026-09-24 routing of engine-track deployment to it. Reviewed tip `bd6e8e4d85a00072a0f1f318b26b14269969ca07` was fast-forwarded into
main.
- Accepted evidence reused:
  - full gate at `38a43f7` (212 s)
  - isolated `multi-target` and `effect-riders` journeys at `38a43f7`
  - `tier-effects` journey at `1fe1091`
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `5d0f8637-0103-430d-b260-6b29072da6c2`.
- The schema change only adds optional fields and widens a union. Content remains the 1654-entry
  snapshot, so no reseed was needed.
- No smoke tests or test reruns. Temporary credentials were removed and the private hosted
  helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V113-release-bd6e8e4`.

### V114 Fury levels two and three publication: 2026-09-24

The test and deploy thread published this release at the V114 thread's handoff. Reviewed tip
`3aa24aed75ec7b33db94dabf8ab0690a678f9298` was fast-forwarded into main. Its code is identical to the tested `ff6f9c7`.
- Accepted evidence reused:
  - full gate at `ff6f9c7` (238 s)
  - isolated `fury-level-three` journey at `ff6f9c7`
- Backend publication and schema validation succeeded.
- The content reseed read back 1669 entries at `fb83a789`.
- The hosted build and the frontend upload succeeded. Worker `283ae7db-6658-40c3-9007-d02a79ad9978`.
- No smoke tests or test reruns. Temporary credentials were removed and the private hosted
  helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V114-release-3aa24ae`.

### V116 Tactician levels two and three publication: 2026-09-24

The test and deploy thread published this release at the V116 thread's handoff. Reviewed tip
`3175606b82eb0f8505c480a08a997e96b7e35d02` was fast-forwarded into main. Its code is identical to the tested `cb9f4c7`.
- Accepted evidence reused:
  - full gate at `cb9f4c7` (235 s)
  - isolated `tactician-level-three` journey at `cb9f4c7`
- Backend publication and schema validation succeeded.
- The content reseed read back 1687 entries at `fb83a789`.
- The hosted build and the frontend upload succeeded. Worker `d603e11b-f449-4f84-88fa-daf498a8ddd6`.
- No smoke tests or test reruns. Temporary credentials were removed and the private hosted
  helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V116-release-3175606`.

### V115 kit bonus correctness and known condition immunity publication: 2026-09-24

The test and deploy thread published this release at ENGINE2's handoff. Reviewed tip `4cc7f3175b0d4557783b47f3ce7189cd21126694` was
fast-forwarded into main. It adds a docs-only record to the tested `439e97e`.
- Accepted evidence reused:
  - full gate at `439e97e` (290 s, run by the Test-support thread)
  - isolated `kit-bonus` journey at `439e97e`
  - the `censor`, `tier-effects` and `effect-riders` journeys at `fb3ce1f`/`1673c01`
- Independent review and QC1 second review passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `690a35fd-e0b8-4b32-86f8-049f6dddb099`.
- The schema change only adds an optional draft field and widens live-state unions. Content is
  unchanged at 1687 entries, so no reseed was needed.
- No smoke tests or test reruns. Temporary credentials were removed and the private hosted
  helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V115-release-4cc7f31`.

### V119 grabs, Escape Grab and Stand Up publication: 2026-09-24

The test and deploy thread published this release at ENGINE2's handoff. Reviewed tip `3c02939f3b71bec8a4a80427ddd971e72a972087` was
fast-forwarded into main. It adds a docs-only record to the tested `85efd9d`.
- Accepted evidence reused:
  - full gate at `85efd9d` (226 s, run by the Test-support thread)
  - isolated `grab` and `kit-bonus` journeys at `85efd9d`
  - `tier-effects` and `effect-riders` journeys at `bbb5340`
- Independent review and QC1 review passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `28a58465-a6d3-4879-93d6-72dcc190d2ca`.
- Content is unchanged at 1687 entries, so no reseed was needed.
- No smoke tests or test reruns. Temporary credentials were removed and the private hosted
  helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V119-release-3c02939`.

### V117 Censor levels two and three publication: 2026-09-24

The test and deploy thread published this release at WIZARD3's handoff. Reviewed tip `2dcbf978bbf763825c71e5a4a598963f1cbab52f` was
fast-forwarded into main. Because the rebase combined V117 with V119's runtime code, the tip itself
was tested before merge:
- Full gate at `2dcbf97` (241 s, run by the Test-support thread).
- Isolated `censor-level-three` and `grab` journeys at `2dcbf97`.
- Independent rules review passed.
- Backend publication and schema validation succeeded.
- The content reseed read back 1708 entries at `fb83a789`.
- The hosted build and the frontend upload succeeded. Worker `18bbb949-22f5-4349-8083-305f3b96defa`.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V117-release-2dcbf97`.

### V132 Troubadour levels two and three publication: 2026-09-24

The test and deploy thread published this release at WIZARD3's handoff. Reviewed tip `c3f9e353432a274ce7c7f22b5db734ef6e18bfc7` was
fast-forwarded into main. Its code is identical to the tested `5bacf33`.
- Accepted evidence reused:
  - full gate at `5bacf33` (run by the Test-support thread)
  - isolated `troubadour-level-three` journey at `5bacf33`
- Backend publication and schema validation succeeded.
- The content reseed read back 1732 entries at `fb83a789`.
- The hosted build and the frontend upload succeeded. Worker `1d9acb09-8147-4839-911e-bbb6664df299`.
- No smoke tests or test reruns. Temporary credentials were removed and the private hosted
  helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V132-release-c3f9e35`.

### V120 heroic resource generation engine publication: 2026-09-24

The test and deploy thread published this release at ENGINE2's handoff. Reviewed tip `f3acd97ce5a58c8a68df3d52e04a9852673ce4a1` was
fast-forwarded into main. It adds a docs-only record to the tested `63b47d7`.
- Accepted evidence reused:
  - full gate at `eb32e21` (284 s, run by the Test-support thread)
  - `heroic-resource`, `shadow-level-two` and `shadow-level-three` journeys at `63b47d7`
  - `shadow-level-six` journey at `eb32e21`
- Independent review and QC1 review passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `3d6cb3e2-2c3c-4cec-8d5c-83ec1a5c4a73`.
- The schema adds the optional `liveState.resourceClaims`. Content is unchanged at 1732 entries,
  so no reseed was needed.
- No smoke tests or test reruns. Temporary credentials were removed and the private hosted
  helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V120-release-f3acd97`.

### V133 Null levels two and three publication: 2026-09-24

The test and deploy thread published this release at WIZARD3's handoff. Reviewed tip `b99b951784bd235b16174f507a8144929e89d262` was
fast-forwarded into main. Because the rebase combined V133 with V120's runtime code, the tip itself
was tested before merge:
- Full gate at `b99b951` (281 s). An earlier run hit six 60 s timeouts while a second gate shared
  the four-core host, so it was rerun alone.
- Isolated `null-level-three` and `heroic-resource` journeys at `b99b951`.
- Independent rules review passed.
- Backend publication and schema validation succeeded.
- The content reseed read back 1751 entries at `fb83a789`.
- The hosted build and the frontend upload succeeded. Worker `99cbb3c1-fad8-4f35-8715-1c94905601b6`.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V133-release-b99b951`.

### V150 Self-Taught forgo publication: 2026-09-24

The test and deploy thread fast-forwarded reviewed tip `fad564fc6cd877031b501ef08b9771af2456f878` into main.
- Accepted evidence reused: full gate at `50f066d` (281 s, Test-support) and `heroic-resource` and `shadow-level-two` journeys at `50f066d`; the tip adds a docs-only record.
- Independent review and QC1 final review passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `e6b75c20-07d3-4d41-bc8c-d75576303b1d`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V150-release-fad564f`.

### Merge train 1 (V135, V140, V145) publication: 2026-09-24

The test and deploy thread stacked V135 Elementalist levels two and three, V140 Tactician focus
generation and V145 Censor wrath generation on main `8c8aedf`, in that order, as one merge train.
It resolved the shared profile list, the profile test and the STATUS rows by keeping both sides, then
fast-forwarded main to `764695471245f02c56ae579adb42dd12fe1375d9`.
- Combined tree tested before merge (commit `34a2dd6`, the same tree): full gate (269 s, 420 engine
  and 672 app tests, Test-support) and the `heroic-resource`, `heroic-resource-censor`,
  `elementalist-level-three` and `tactician-level-three` journeys.
- Independent reviews and QC1 clearance passed for each slice; the tip carries V145's QC1 review.
- Backend publication and schema validation succeeded.
- The content reseed read back 1775 entries at `fb83a789`.
- The hosted build and the frontend upload succeeded. Worker `5224599e-bc2e-40c5-9330-546ea0feae12`.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/train1-release-34a2dd6`.
