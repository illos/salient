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
| V201 | `9d8f7bc` | Merged in train 21; backend/frontend published; gate and headless at tip | complete |
| V200 | `9d8f7bc` | Merged in train 21; backend/frontend published; gate and headless at tip | complete |
| V191 | `35abd9f` | Merged; backend/frontend published; accepted gates reused | complete |
| V179 | `392d236` | Merged; backend/frontend published; accepted gates reused | complete |
| V178 | `eeaa992` | Merged; backend/frontend published; accepted gates reused | complete |
| V190 | `36a5e17` | Merged in train 19; backend/frontend published; gate and headless at tip | complete |
| V189 | `36a5e17` | Merged in train 19; backend/frontend published; gate and headless at tip | complete |
| V177 | `64b521e` | Merged; backend/frontend published; accepted gates reused | complete |
| V176 | `408dd11` | Merged; backend/frontend published; accepted gates reused | complete |
| V175 | `0401350` | Merged in train 17; backend/frontend published; gate and headless at tip | complete |
| V174 | `0401350` | Merged in train 17; backend/frontend published; gate and headless at tip | complete |
| V173 | `0401350` | Merged in train 17; backend/frontend published; gate and headless at tip | complete |
| V172 | `0401350` | Merged in train 17; backend/frontend published; gate and headless at tip | complete |
| V171 | `0401350` | Merged in train 17; backend/frontend published; gate and headless at tip | complete |
| V170 | `0401350` | Merged in train 17; backend/frontend published; gate and headless at tip | complete |
| V159 | `0401350` | Merged in train 17; backend/frontend published; gate and headless at tip | complete |
| V188 | `75885cb` | Merged; backend/frontend published; accepted gates reused | complete |
| V185 | `f2160c3` | Merged; backend/frontend published; accepted gates reused | complete |
| V184 | `887f448` | Merged; backend/frontend published; accepted gates reused | complete |
| V181 | `bd4f0cc` | Merged; backend/frontend published; accepted gates reused | complete |
| V09 | `1118489` | Merged in train 12; backend/frontend published; gate and headless at tip | complete |
| V180 | `1118489` | Merged in train 12; backend/frontend published; gate and headless at tip | complete |
| V164 | `6686fbe` | Merged; backend/frontend published; accepted gates reused | complete |
| V169 | `59b890c` | Merged with V167 and V169 stacked; backend/frontend published; gate and headless at tip | complete |
| V167 | `59b890c` | Merged with V167 and V169 stacked; backend/frontend published; gate and headless at tip | complete |
| V158 | `6632e95` | Merged with V157 and V158 stacked; backend/frontend published; gate and headless at tip | complete |
| V157 | `6632e95` | Merged with V157 and V158 stacked; backend/frontend published; gate and headless at tip | complete |
| V168 | `79fc25f` | Merged; backend/frontend published; accepted gates reused | complete |
| V166 | `1811a3f` | Merged with V165 and V166 stacked; backend/frontend published; gate and headless at tip | complete |
| V165 | `1811a3f` | Merged with V165 and V166 stacked; backend/frontend published; gate and headless at tip | complete |
| V156 | `d266437` | Merged in train 8; backend/frontend published; gate and headless at tip | complete |
| V155 | `d266437` | Merged in train 8; backend/frontend published; gate and headless at tip | complete |
| V163 | `b724eea` | Merged with V162 and V163 stacked; backend/frontend published; gate and headless at tip | complete |
| V162 | `b724eea` | Merged with V162 and V163 stacked; backend/frontend published; gate and headless at tip | complete |
| V160 | `4b87799` | Merged in train 7; backend/frontend published; gate and headless at tip | complete |
| V154 | `4b87799` | Merged in train 7; backend/frontend published; gate and headless at tip | complete |
| V153 | `4b87799` | Merged in train 7; backend/frontend published; gate and headless at tip | complete |
| V152 | `4b87799` | Merged in train 7; backend/frontend published; gate and headless at tip | complete |
| V138 | `b0f7c53` | Merged in WIZARD3 stack; backend/content/frontend published; gate and headless at tip | complete |
| V151 | `b0f7c53` | Merged in WIZARD3 stack; backend/content/frontend published; gate and headless at tip | complete |
| party read-limit fix | `9240044` | Merged; backend/frontend published (priority fix) | complete |
| V148 | `71a3fa5` | Merged in resource train 4; backend/frontend published; gate and headless at tip | complete |
| V149 | `71a3fa5` | Merged in resource train 4; backend/frontend published; gate and headless at tip | complete |
| V147 | `71a3fa5` | Merged in resource train 4; backend/frontend published; gate and headless at tip | complete |
| V144 | `71a3fa5` | Merged in resource train 4; backend/frontend published; gate and headless at tip | complete |
| V142 | `7e9f731` | Merged in resource train 3; backend/frontend published; gate and headless at tip | complete |
| V146 | `7e9f731` | Merged in resource train 3; backend/frontend published; gate and headless at tip | complete |
| V143 | `7e9f731` | Merged in resource train 3; backend/frontend published; gate and headless at tip | complete |
| V141 | `7e9f731` | Merged in resource train 3; backend/frontend published; gate and headless at tip | complete |
| V137 | `ca5f562` | Merged in train 2; backend/content/frontend published; gate and headless at tip | complete |
| V136 | `ca5f562` | Merged in train 2; backend/content/frontend published; gate and headless at tip | complete |
| V134 | `ca5f562` | Merged in train 2; backend/content/frontend published; gate and headless at tip | complete |
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

### Merge train 2 (V134, V136, V137) publication: 2026-09-24

WIZARD3 stacked V134 Conduit, V136 Talent and V137 Beastheart levels two and three on main
`82f2bfd`, regenerating content and reports at each step. The test and deploy thread fast-forwarded
main to `ca5f562bb0eee8e7e84984c976d76d483b53d959`.
- Full gate at `ca5f562` (226 s, 431 engine and 672 app tests), including the web budget check.
- `conduit-level-three`, `talent-level-three` and `beastheart-level-three` journeys at `f6c18bb`;
  `ca5f562` changes only the content-test allow-list and the reference pins. The existing
  `beastheart` journey passed at `ca5f562`.
- Independent rules reviews passed for each slice.
- Backend publication and schema validation succeeded.
- The content reseed read back 1852 entries at `fb83a789`.
- The hosted build and the frontend upload succeeded. Worker `d097d610-cf1f-4dcd-8ce5-9096cfd765b2`.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/train2-release-ca5f562`.

### Resource train 3 (V141, V143, V146, V142) publication: 2026-09-24

ENGINE2 stacked V141 Summoner essence, V143 Beastheart ferocity (with its per-invoke read fix), V146
Talent clarity and strain, and V142 Fury ferocity with observed damage triggers on main `f923386`.
The test and deploy thread fast-forwarded main to `7e9f7317088f6db0c8b93750d4a790eeb4607aa0`.
- Full gate at the tip (250 s, 431 engine and 683 app tests).
- Journeys at the tip, idle host: five `heroic-resource` journeys, `fury-level-three`, `talent`,
  `beastheart` and `summoner`. The `fury` journey failed identically on main (a stale expectation,
  fixed separately).
- Independent reviews and QC1 final clearance passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `35639817-fb01-4132-9428-728b6512c8ec`.
- Content is unchanged at 1852 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/rtrain3-release-7e9f731`.

### Resource train 4 (V144, V147, V149, V148) publication: 2026-09-24

ENGINE2 stacked V144 Null discipline, V147 Conduit piety, V149 Troubadour drama and V148 Elementalist
essence with QC1's correction fixes on main `16bc742`. The test and deploy thread added ENGINE2's
reviewed Fury journey fix on top and fast-forwarded main to `71a3fa5053e753ef98f380f90f9faae52d0a0023`. Automatic heroic resources now
cover all eleven classes.
- Full gate at `44d4cc1` (256 s, 431 engine and 691 app tests); the tip adds only the reviewed
  `scripts/headless/fury.ts` change (tsc and eslint clean).
- Journeys at the tip: `heroic-resource`, the Null, Conduit, Troubadour and Elementalist level-three
  journeys and `fury`. The base `null`, `conduit`, `troubadour` and `elementalist` journeys failed
  identically on main (stale expectations, fixed separately).
- Independent reviews and QC1 final clearance passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `e7cd0093-3a28-400a-8853-df89561e8a77`.
- Content is unchanged at 1852 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/rtrain4-release-71a3fa5`.

### Party read-limit fix publication: 2026-09-24

Resource train 3 let `combat.commit` and `combat.finish` re-read every hero several times, so large
parties of level-three Beastheart heroes exceeded Convex's 16 MB per-function read limit
(`beastheart-level-three` failed from `7e9f731` onward). ENGINE2's fix reads a party once. The
test and deploy thread fast-forwarded main to `9240044e4be4516ac13cf798670b3c6e6f901bb1` as a priority fix.
- Full gate at the tip (281 s, 431 engine and 692 app tests).
- `beastheart-level-three`, `beastheart` and `tier-effects` journeys at the tip, idle host.
- Independent review and QC1 clearance passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `509f7b29-b09f-46ce-838a-0e7de40c2865`.
- Content is unchanged at 1852 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/readfix-release-9240044`.

### V151 follow-up actions and V138 Summoner levels two and three publication: 2026-09-24

WIZARD3 stacked V151 (QC1's V135 follow-up action records) and V138 Summoner levels two and three
on main `5ee2d8b`. The test and deploy thread fast-forwarded main to `b0f7c53f52b48b64b3442d90672d725d891da330`.
- Full gate at the tip (270 s, 439 engine and 692 app tests, Test-support).
- Journeys at the tip: `follow-up-actions`, the Elementalist, Talent, Beastheart and Summoner
  level-three journeys, and `summoner`.
- Independent rules reviews passed.
- Backend publication and schema validation succeeded.
- The content reseed read back 1881 entries at `fb83a789`.
- The hosted build and the frontend upload succeeded. Worker `5aee5766-b59e-4552-a208-839d72d73dbb`.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/wtrain-release-b0f7c53`.

### Train 7 (V152, V153, V154, V160) publication: 2026-09-24

ENGINE2's stack V152 table-work effect riders, V153 compound tier conditions and V154 tier
instructions (143 compiled abilities, up from 108), plus WIZARD3's V160 Talent resource note, were
fast-forwarded into main as `4b8779941ac57ad766f78b956d513faa6e9553ec`.
- Full gate at `2ca63c9` (248 s, 439 engine and 728 app tests) and 19 journeys there: rider-grammar,
  compound-conditions, tier-instructions, the Shadow level-two, level-three and level-six journeys,
  every touched class's level-three journey, and the touched base class journeys.
- V160 changes one Talent note: its gate passed on `0f0919c` (440 engine and 692 app tests), and at
  the tip its focused test, the type check and `talent-level-three` passed.
- Independent reviews and QC1 clearance passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `bde8df86-9a57-4299-87f1-b6b564085f9f`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/train7-release`.

### V162 current values and V163 level-up publication: 2026-09-24

WIZARD3 stacked V162 (build changes keep damage taken and Recoveries spent, revised Q-CHAR-2) and
V163 (pending level-ups, Director grant and withdraw operations, level-up for every class) on main
`c7aa637`. The test and deploy thread fast-forwarded main to `b724eea9fc51a9c613aaa96b4b424aa1c8908456`.
- Full gate at the tip (308 s, 443 engine and 730 app tests).
- Journeys at the tip: `level-up` (1/1), `lifecycle` (8/8, moved out of `all`) and `all` (29/29,
  214 s). V162 alone also passed its gate and `all` (37/37).
- Independent rules reviews passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `ea49dd4d-0946-43ce-8e65-25bb1c7f270d`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V163-release-b724eea`.

### Train 8 (V155, V156) publication: 2026-09-24

ENGINE2's V155 can't-stand (Q-COND-1 per the 2026-09-24 rulings) and V156 Shadow insight edge
discount were cherry-picked onto main `46286e8` and fast-forwarded as `d266437b69f2f2f1c16693e547eda6f004a81c71`.
- Full gate at the tip (287 s, 443 engine and 745 app tests).
- Journeys at the tip: cant-stand, insight-edge, heroic-resource, tier-effects, grab, the Shadow
  level-two, level-three and level-six journeys, conduit-level-three, conduit, level-up and
  lifecycle.
- Independent reviews and QC1 clearance passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `dd30feb0-bf87-4f0d-b420-03b67b68cced`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/train8-release-d266437`.

### V165 respite loop and V166 respite activities publication: 2026-09-24

WIZARD3 stacked V165 (respite start, cancel, interrupt and complete, blocking session close and
combat start while one is open) and V166 (respite kit change and activities; cancel reverts kit
changes) on main `945f642`. The test and deploy thread fast-forwarded main to `1811a3f030bccb39290d02fcb77095a33f202803`.
- Full gate at the tip (260 s, 443 engine and 756 app tests); V165 alone also passed its gate.
- Journeys at the tip: `respite` (1/1) and `all` (29/29, 195 s).
- Independent rules reviews passed.
- Backend publication and schema validation (`sessions.respite`), the hosted build and the frontend
  upload succeeded. Worker `d2a08201-500d-4593-8405-21075ed16284`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V166-release-1811a3f`.

### V168 Field Arsenal kit lock during respite publication: 2026-09-24

The test and deploy thread fast-forwarded reviewed tip `79fc25f401ec2c9a1e467396cd772a660fec2138` into main.
- Full gate at the tip (275 s, 443 engine and 757 app tests).
- `respite`, `tactician` and `tactician-level-three` journeys at the tip.
- Independent rules review passed (QC1 V166 R1 fix).
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `d48f300d-6adb-45aa-8841-74446a53ffa9`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V168-release-79fc25f`.

### V157 abilities without a power roll and V158 effect instances publication: 2026-09-24

ENGINE2 stacked V157 (abilities without a power roll compile and apply their gains) and V158 (effect
instances with durations and end conditions, `effect.list` and `effect.end`, sheet lists; 155
compiled abilities) on main `02ff1fd`. The test and deploy thread fast-forwarded main to `6632e95def1e4797c504e3ab79a51fb9bc3d29b2`.
- Full gate at the tip (253 s, 443 engine and 780 app tests).
- 17 journeys at the tip: effect-only, effect-instances, compound-conditions, cant-stand, respite,
  all, the Shadow level-two, level-three and level-six journeys, the Conduit, Fury, Null and
  Tactician level-three journeys, and conduit, null, fury and tactician.
- Independent reviews and QC1 final clearance passed (including QC1 R1/R1b on repeat stacking).
- Backend publication and schema validation (optional `abilityResults.dice`), the hosted build and
  the frontend upload succeeded. Worker `c594c5db-1402-41a2-b460-d3efe7352912`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V158-release-6632e95`.

### V167 respite table controls and V169 Rapid Processing publication: 2026-09-24

WIZARD3 stacked V167 (respite card and activity controls on the table, with the Director choosing
the resting heroes) and V169 (the Rapid Processing extra respite activity) on main `dd8c9ed`. The
test and deploy thread fast-forwarded main to `59b890c21fd7b8e1d53ce7d70478873502b82b7f`.
- Full gate at the tip (272 s, 443 engine and 782 app tests); V167 alone also passed its gate.
- Journeys at the tip: `respite`, `level-up`, `lifecycle` and `all` (29/29, 240 s: at the runner's
  deadline, so `all` needs splitting again).
- Independent rules reviews passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `089b650b-6979-4377-9527-34bf19876d72`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V169-release-59b890c`.

### V164 level-up screen publication: 2026-09-24

The test and deploy thread fast-forwarded reviewed tip `6686fbee51df636ba590546088e457288678fe4f` into main.
- Cherry-picked onto main `938d62e`; full gate at the tip (291 s, 443 engine and 782 app tests).
- `level-up`, `lifecycle` and `all` (29/29) journeys at the tip.
- Independent rules review passed after its review fixes. The user dropped the UI capture gate; the browser capture stops at the perk target step (fixed in V181).
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `0b1c92f9-495a-4ad9-bcfc-9d43a57191f8`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V164-release-6686fbe`.

### Train 12 (V180 headless split, V09 part a Forge import) publication: 2026-09-25

WIZARD3's V180 (the `all` journey split into `ancestries`, `culture`, the complication and the
starting-reward and starting-item journeys) and V09 part a (Forge character import) were
cherry-picked onto main `b77d3ad` and fast-forwarded as `111848900476d623577b8d3552c7ef8d4d2f3d17`. V181 was tested in the same train
but held back: its level-up preview shows the hero as pending.
- Full gate at the tip (307 s, 456 engine and 788 app tests).
- Journeys, with V181's UI-only change on top: forge-import, ancestries, culture, complication-choices,
  complication-table, starting-rewards, starting-items, level-up, lifecycle and all (23/23, 89 s).
- Independent rules reviews passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `74d47264-33a5-44ce-a544-73c36de159c4`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/train12-release-1118489`.

### V181 level-up dependent choices publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `bd4f0cca6fe13ebec0970d0a63f347af7c4dc5a9` into main.
- Full gate at the tip (261 s, 456 engine and 788 app tests).
- `level-up` and `lifecycle` journeys at the tip; the level-up browser capture reached all five screens, with the hero panel showing the Devil Fury (Berserker) at level 2 (test-artifacts/V181-bd4f0cc/capture).
- Independent rules review passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `6371fbe2-18a0-4c93-8e05-e69de06273a9`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V181-release-bd4f0cc`.

### V184 level-up diagnostics publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `887f44892a06be30c759d5e2f610595a2ac7a013` into main.
- Cherry-picked onto main `d27f750`; full gate at the tip (317 s, 456 engine and 788 app tests).
- Level-up browser capture: all five screens plus the level-two sheet, with progress and diagnostics following the current choice (test-artifacts/V184-887f448/capture2).
- Independent rules review passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `5a9f67c6-9c3e-4270-8f6d-e739420dc105`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V184-release-887f448`.

### V185 build history page publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `f2160c355efa143e100fa7de857e76a165d80033` into main.
- Full gate at the tip (318 s, 456 engine and 792 app tests).
- `history`, `lifecycle`, `level-up` and `starting-rewards` journeys at the tip.
- Independent rules review passed. The level-up browser capture reaches the full editor with the level-two choices kept (test-artifacts/V185-f2160c3/capture).
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `00525f22-e999-4002-b0b0-89ed1a0e7465`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V185-release-f2160c3`.

### V188 follow-up ability text publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `75885cb35d4300f872dc8f8818fb273e0c0e4180` into main.
- Full gate at the tip (270 s, 458 engine and 792 app tests).
- `fury-level-three` and `follow-up-actions` journeys at the tip.
- Independent rules review passed. 641 follow-up ability texts in 10 classes no longer show raw YAML frontmatter.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `dbb5720a-6982-489d-8d59-56d2e465769a`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V188-release-75885cb`.

### Train 17 (V159 fix, V170–V175) publication: 2026-09-25

ENGINE2's chain was rebuilt on main `0159fd8` and fast-forwarded as `04013505e72e990a9a75fe3e3fb703b2f8bc22f0`: the V159 QC1 fix, V170
Talent Strained sections, V171 watchers, V172 next-turn duration, V173 triggered actions, V174
damage reactions and V175 Marks, with QC1's train-13 and train-16 fixes and the journey updates for
the newly automated abilities.
- Full gate at the tip (313 s, 458 engine and 884 app tests).
- 20 journeys at the tip: modifiers, effect-instances, effect-only, kit-bonus, tactician and its
  level-three journey, the Conduit, Null, Elementalist and Fury level-three journeys, the Shadow
  level-two and level-three journeys, follow-up-actions, null, elementalist, fury, all, talent,
  troubadour and conduit.
- Independent reviews and QC1 final clearance passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `7db282ef-874d-4898-83e7-fad8a9c28cfd`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/train17-release-0401350`.

### V176 forced-movement follow-ups publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `408dd11b6c6b6430b7ac09224ef1c70c7c640f6c` into main.
- Full gate at the tip (293 s, 458 engine and 898 app tests), including the V72 live compiled report.
- Journeys at the tip: shadow-level-two, fury, fury-level-three, censor, censor-level-three, conduit, null and all.
- Independent review and QC1 clearance passed; Q-FM-1 and Q-FM-2 remain open questions.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `713636cf-0683-4b09-981d-cfe7997ec946`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V176-release-408dd11`.

### V177 damage-type options publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `64b521edbc21c811e7a42357af02cb699d184d1e` into main.
- Cherry-picked onto main `d3ab253` as train 18; full gate at the tip (337 s, 458 engine and 908 app tests).
- Journeys at the tip: conduit, elementalist, elementalist-level-three, fury, fury-level-three and all.
- Independent review and QC1 scoped clearance passed; Q-DT-1 (hero weaknesses) stays open for V178.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `c56d0334-acbf-4712-b599-3200983d92c2`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V177-release-64b521e`.

### Train 19 (V189 view-only history, Null test fix, V190 XP per level) publication: 2026-09-25

WIZARD3's V189 (build history view-only; restore kept behind `BUILD_RESTORE_ENABLED=false`) and V190
(campaign XP per level), with ENGINE2's test-only fix for the flaky Null discipline test, were
cherry-picked onto main `16be43d` and fast-forwarded as `36a5e179b0cf4b892b42ab6b2a75c2dc27a8bc56`.
- Full gate at the tip (349 s, 458 engine and 917 app tests); the formerly flaky
  `heroic-resource-null` test passed 5 of 5 runs.
- Journeys at the tip: history, lifecycle, respite, level-up, heroic-resource and all.
- The v32 level-up browser capture passed end to end with restore hidden (seven screens).
- Independent reviews passed.
- Backend publication and schema validation (optional `settings.xpPerLevel`), the hosted build and
  the frontend upload succeeded. Worker `c076ef27-2f91-4988-a279-2f9332cf3110`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/train19-release-36a5e17`.

### V178 immunity and weakness publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `eeaa9920a6338b6b60f4343b420450e1f1ac26c4` into main.
- Its own three commits plus the Eye Flash test fix, cherry-picked onto main `cc4e99f` as train 20; full gate at the tip (291 s, 458 engine and 935 app tests).
- Journeys at the tip: ancestries, all, tier-effects, cant-stand, and conduit, talent and null with their level-three journeys.
- Independent review and QC1 clearance passed; Q-DT-1 (hero weaknesses) is closed. Conditional and granted defenses stay manual.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `a1debfdf-a8fb-4bcc-9347-3ed4bb026ef3`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V178-release-eeaa992`.

### V179 granted defenses publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `392d236292c299497151f7a2da7301e7f00e773d` into main.
- Full gate at the tip (297 s, 458 engine and 946 app tests).
- Journeys at the tip: tactician, tactician-level-three, all and conduit; the Shadow level journeys and conduit-level-three passed at 29a0f49, before the one-commit R1 fix.
- Independent review and QC1 clearance passed after QC1 R1 (a reaction may not end a granted weakness that later damage used).
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `d29fda21-1978-45c7-8541-8c0f084e2ce2`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V179-release-392d236`.

### V191 XP bank publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed tip `35abd9f30ce0e85e629a693d97db42c88ac2d902` into main.
- Full gate at the tip (306 s, 458 engine and 945 app tests; the XP tests were rewritten for the bank model).
- `respite`, `level-up`, `lifecycle` and `all` journeys at the tip.
- Independent rules review passed. Replaces V190 owed levels by user ruling; adds optional `liveState.xpLifetime`.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `2f249d43-1535-4890-b463-d8b22495c205`.
- Content is unchanged, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/V191-release-35abd9f`.

### Train 21 (V200 areas and auras, V201 damage fixes) publication: 2026-09-25

ENGINE2's V200 (areas and auras; 188 compiled) with QC1's performance-warning fix, and V201 (stacked
correction fix and the ogres' while-winded immunity), were cherry-picked onto main `37ceda4` and
fast-forwarded as `9d8f7bc53f193c193b766197ce0b6d6acf0cbfb0`.
- Full gate at the tip (323 s, 458 engine and 967 app tests).
- Journeys at the tip: areas, troubadour-level-three, all, troubadour and talent; the censor,
  conduit, tactician and talent level-three journeys, shadow-level-two and censor passed one fix
  commit earlier at `6e9beb0`.
- Independent reviews and QC1 clearance passed.
- Backend publication and schema validation, the hosted build and the frontend upload succeeded.
  Worker `758b9359-5be8-4113-a393-6d7c117c2fa4`.
- Content is unchanged at 1881 entries, so no reseed was needed.
- No smoke tests. Temporary credentials were removed and the private hosted helpers stopped.

Logs: `/srv/presidium/projects/salient/test-artifacts/train21-release-9d8f7bc`.
