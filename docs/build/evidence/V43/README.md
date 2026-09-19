# V43 table performance verification

Candidate: `slice/V43`, stacked on V41. Verification runs on CT114's isolated `performance` local-anonymous backend and its HTTPS frontend. These are functional and payload/subscription checks, not hosted latency measurements. The original [hosted baseline](../performance-2026-09-19/README.md) remains separate.

## Design and limits

- Collapsed roster cards use small audience-projected facts from `table.roster`. Full stat blocks and hero sheets load on drill-in; an owner's already-expanded sheet still loads normally. The backend still reads the existing full entity documents; this change reduces client payload and subscription fanout without a storage-schema split.
- Table log/history reads start alongside roster/encounter reads. Empty result pages issue no `abilities.results` query; populated pages request only their visible ability event IDs, including older pages. The closed Rules dialog waits until opened before fetching its catalogue.
- Passive history and correction windows use transactional linked-stack records. Legacy sessions catch up in batches of 64 source events while controls visibly wait. The original event/journal records remain intact. Undo/correction **mutations retain the original authoritative full-session validator**; mutation replay cost is not eliminated or claimed to be constant.
- New-session writes maintain this derived state immediately; normal archive operations seal its history floor. No source data reset or forced migration is required.

## Regression evidence

The new app tests compare indexed windows with the original full walker, including all audience roles, engine consequences, manual continuations, rewind/redo, abandoned redo branches and turn boundaries. A legacy-session fixture exceeds 300 events, admits gameplay during catch-up, retains every source event and checks that prepared passive reads reject unbounded iteration/collection and require fewer than 12 document gets. Another fixture serves requested older results among 110 ability results and rejects unauthorized/cross-campaign access.

Initial focused run: 57/59 passed. One existing pre-A07 test archived an encounter by directly patching the database, bypassing today's archive operation; its fixture now performs the same derived-index maintenance as production. The second failure was a new fixture's too-short command ID. The first full check caught an effect-based pagination reset; pagination now scopes its cursor to the session without an extra effect/render.

Final commands, browser results and integration verification are recorded below after completion.

## Catch-up failure recovery

Convex retries transient/internal failures of scheduled mutations. A permanent application error or execution/read-limit failure during catch-up leaves that session's derived cursor incomplete and passive controls in “Preparing history controls…”; this slice does not add automatic job-failure surfacing. Inspect the scheduled-function error, fix its cause, then invoke `internal.history.backfill` for that session on the explicitly identified development target. The internal handler resumes from the last committed checkpoint and schedules the remaining bounded batches; do not delete source events or reset the database. Merely retrying `history.prepare` does not recover a permanently failed scheduled job while its `scheduled` flag is true. New gameplay and original mutation validation retain their existing behavior.

## Measured delivery behavior

The real HTTPS browser fixture with six Goblin Warriors and one admitted Fury records a 3,454-byte roster JSON value, no initial `foes:detail` or `characters:sheet` subscriptions, and simultaneous `events:list`, `history:status`, `table:roster`, `encounters:current` and `targets:drafts` registration. There are seven distinct initial query paths including `auth:viewer` and the visible foe-add catalogue; frame-level reconnect/subscribe duplicates are retained in [the record](subscriptions.json), not counted as distinct queries. The original hosted six-foe/no-hero sample had 16 distinct subscriptions and 24,690 bytes of eager foe detail. These fixture populations differ; the structural query saving is established, not a matched before/after latency percentage. The 101,212-byte hero sheet appears only after its drill-in.

The new browser scenario verifies Log/Rolls switches preserve document identity, source/sheet detail arrives when opened, foe Stamina edits persist, rewind restores 15, redo restores 9 and reload retains 9. [Collapsed roster screenshot](table-summary.png).

First authenticated batch: journey, table performance and V38 library navigation passed. The broader Fury test failed before character creation because the third registration received the existing account endpoint's “Too many requests” response after multiple tests created accounts. No rate-limit relaxation or product-code change was made for this harness failure. The unchanged standalone retry is recorded separately.

Standalone unchanged Fury retry: **1 passed in 3.0 minutes**, including real wizard save, campaign admission/review, owner/Director/observer sheets and the 60-action table extension. [Retry log](fury-retry.log), [combat screenshot](fury-combat.png). There were no backend execution timeouts in this rerun. One `history:status` warning at 13:48:40 UTC reported **979.272031 ms against the 1-second limit**. The prior V42 timeouts did not reproduce in this run; this is not proof that timeout risk or shared authentication/read-invalidation overhead is eliminated. Retain that near-limit warning as a follow-up performance concern.

Final UI refinement: `history.prepare` now runs only when `history.status` reports an incomplete legacy index. Already-current sessions no longer issue one or two redundant maintenance mutations on entry. A stale preparation error is hidden once the index is ready.

Final prepare-gating refinement passed targeted ESLint, Prettier, web TypeScript and the full new table browser scenario again (**1 passed, 33.7 s**, [log](table-final.log)). The preceding full suite was not rerun for this narrow frontend refinement; shared-main browser verification remains the integration gate. The [first failure context](rate-limit-context.md) preserves the explicit account rate-limit alert.

## Shared development rollout

Merged implementation `087a709598e6acf2d86f8b68ba62f835b46e0c33` (including V41 `bc74ddd`) was synchronized to the established CT114 `main` environment with `presidium-dev up`. Target: local-anonymous backend `anonymous:anonymous-agent`, Compose `salient-dev-b90776c53141`, [actual shared URL](https://salient-dev-fc4f48cb09a0.tail41404c.ts.net), frontend port 32830. Source checkout was clean; existing volumes, credentials and content pin were retained. No reset/reseed or hosted publish.

- [Backend sync](shared-backend-ready.log): additive history indexes and functions ready 13:56:21 UTC.
- [Source identity](shared-source-verification.json): all 52 implementation/config/test hashes match the reviewed candidate. Rebase onto V44 touched only documents.
- [Shared browser results](shared-browser.log): **3 passed, 1.3 min**: journey/session lifecycle/private draft/reconnect, table performance and Rules/Foes navigation. The table scenario verifies real saved Stamina, rewind/redo and persisted reload.
- [Shared table screenshot](shared-table.png) and [shared subscription capture](shared-subscriptions.json). No authentication frames, cookies or raw query results are included.
- [Filtered runtime exceptions/warnings](shared-runtime-exceptions.log): no execution timeout or schema/return validation failure; a characters.reviews warning reached 926.957937 ms against the 1 s limit. Access refusals occurred during deliberate private-character access/signout and stale foe-detail disposal. The near-limit warning remains a performance concern, not a claimed regression fix.

The isolated performance stack was stopped after validation, preserving its volumes. The final documentation closeout does not alter runtime code.
