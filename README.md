# Draw Steel companion

A mobile-optimized, web-only Draw Steel application for phones, tablets, and desktop, built around a reusable
rules engine, with accounts, characters, campaigns, encounters, and persistent session resources.

The engine is intended to understand the complete rules, including spatial mechanics. Clients supply available
facts and consume structured outcomes. The initial client can present movement as instructions for the table;
future map clients can enact those outcomes digitally.

The current milestone is **v0.01: a desktop pre-alpha with temporary UI**, proving the connected
campaign-to-combat journey. See the [scope checkpoint](docs/pre-alpha-design-gaps.md) for included and deferred
features. The app implements accounts, campaigns, noncombat sessions, character drafts and direct foe loading.
The dedicated rules discussion is defining FreePlay/combat behavior; the complete character wizard and
combat journey remain integration dependencies. The broader mobile-optimized product remains the destination.

## Run the development app

Development workloads belong on the dedicated guest through the brokered `presidium-dev` helper.
See [the remote runtime runbook](docs/remote-development.md) for enrollment, selected secrets,
resource limits, data preservation and current cutover status. Main's development data has moved
to CT114 with matching record fingerprints and credentials; the superseded local processes are
stopped. Main reboot verification, an actual Salient provider's broker check and human
existing-account sign-in are still pending. Preserve the rollback backup and use the remote
workflow; do not recreate the old local stack.

From an enrolled provider session in the selected Salient checkout:

```sh
presidium-dev up
presidium-dev status
presidium-dev logs backend
presidium-dev run build -- pnpm check
presidium-dev run browser -- pnpm exec playwright test --workers=1 --output=/artifacts/browser --reporter=line
presidium-dev fetch generated/api.d.ts --output remote-api.d.ts
presidium-dev stop
```

`up` transfers selected source edits and installs locked dependencies remotely. It starts the
anonymous Convex backend and web frontend, returning the stable tailnet HTTPS preview URL.
Builds, tests and browsers run inside bounded guest containers; do not run local installers,
`pnpm dev`, `pnpm dev:backend`, builds or headless browsers on Presidium. Browser
tests use the actual HTTPS preview and create disposable accounts/data, so use an explicit
`--env validation` slot when testing should remain separate from the shared playable data.

The default `main` slot is shared. A second concurrent checkout must use an explicitly named
separate environment, such as `presidium-dev --env feature-name up`. Helpers refuse an accidental
worktree replacement. Pinned vendor checkouts must remain clean and match their Git pins; neither
builds nor runtime setup advances them. Generated files are retrieved individually for review,
never reverse-synchronized over a local checkout. Runtime data lives in named volumes and
survives source replacement, stop and ordinary remove. Do not use `--data` or reset commands as
part of ordinary development.

The app uses same-origin HTTP and WebSocket proxies for backend/auth traffic. Preserve the app's
own sign-in: tailnet reachability is not an application account. New empty development environments
have no content rows until the operator seeds their exact backend container as described in the
runbook. Existing migrated data must not be reset or reseeded blindly. The content snapshot
generator remains `scripts/build-content.ts` (see `shared/content/README.md`).

All enrolled projects share the guest's Docker daemon. Helper names and labels avoid accidental
collisions; they do not prevent a trusted agent with Docker access from inspecting or changing
another project's containers or secrets. No production credentials belong on this guest.

## Headless application operations

`pnpm app query campaigns:list '{}'` calls the same authorized operations as the browser. Set
`SALIENT_EMAIL` and `SALIENT_PASSWORD` in the calling process environment, or supply a short-lived
`SALIENT_AUTH_TOKEN`. The password flow creates and revokes its own temporary session. The CLI never prints
credentials or tokens. Mutation calls accept the same JSON arguments and stable `commandId` used by the UI;
reuse the ID and unchanged arguments when retrying a command. For example, `sessions:get` takes a
`sessionId`, and `events:list` takes a `campaignId`. Actual payloads and generated types live in `convex/`.

## Project documents

- [Build plan and process](docs/build/README.md): slice-based build, review and commit process, with
  [status tracking](docs/build/STATUS.md) and one document per slice. Agents start here after
  [`CLAUDE.md`](CLAUDE.md).
- [Questions for the user](docs/rules-questions-for-user.md): the only channel from build threads to the
  user for rules and product decisions; resolved in a standalone thread.
- [Development track kickoff](docs/kickoff-development-track.md): current ready-to-paste implementation
  handoff for one of the five tracks, with isolation, feedback, verification and integration instructions.
- [Web app build thread handoff](docs/web-app-build-handoff.md): historical v0.01 contracts and handoff.
  Earlier kickoff prompts remain available for context: [web app](docs/kickoff-web-app.md) and
  [rules process/combat](docs/kickoff-rules-combat.md).

- [Rules adaptation principles](docs/rules-adaptation-principles.md): faithful automation, table authority,
  warnings without blocking, complete source text, visible workings, and supported manual play.

- [Pre-alpha scope checkpoint and design gaps](docs/pre-alpha-design-gaps.md): current v0.01 acceptance
  journey, feature scope, proposed component boundaries, remaining gaps and discussion record.
- [v0.01 readiness audit](docs/v0.01-readiness-audit.md): which halves of the pre-alpha journey are buildable
  from the specs, the blocking gaps with the artifact that closes each, and findings for agents to resolve.
- [V1 specification checkpoint](docs/v1-spec-checkpoint.md): agreed release scope, settled boundaries, primary
  specs, and remaining work for the fuller product as of 2026-09-11.
- [V1 roadmap](docs/v1-roadmap.md): five development tracks, independent content/automation progress,
  feedback cadence, shared contracts and recommended first assignments after v0.01.
- [V1 tech stack](docs/v1-tech-stack-spec.md): recommended libraries and rationale, selected Better Auth,
  table realtime/performance, SSR tradeoffs, Cloudflare/Convex hosting, and future LAN portability.
- [Inventory and loot](docs/inventory-spec.md): character/party inventories, Director stash, claims, approval,
  visibility, and history.
- [Reference libraries](docs/reference-library-spec.md): core-only v1 content scope and readable coverage
  independent of automation.

- [Table and session specification](docs/table-spec.md): campaign hub, one active session, selected
  participants/characters, pause, role-dependent panes, free play, and encounter lifecycle.

- [Accounts and access specification](docs/accounts-and-access-spec.md): regular accounts, friendship and
  blocking, regular-account settings and recovery, selected Better Auth integration, campaign membership,
  Director delegation, character privacy, and session-scoped sharing.
- [3D dice roller adaptation specification](docs/dice-roller-spec.md): optional draggable 3D presentation of
  shared code/CLI dice results, upstream extraction plan, and result-matching acceptance criteria.
- [Data structure and architecture specification](docs/data-architecture-spec.md): current checkpoint for
  shared content, user data, encounter undo, realtime sessions, compressed archives, and statistics; proposals
  and open decisions identified.
- [App data storage analysis](docs/data-storage-analysis.md): supporting research, alternatives, and scaling
  estimates for the data architecture.
- [Monster catalog specification](docs/monster-catalog-spec.md) and
  [source audit](docs/research/monster-import-audit.md): proposed import, storage, encounter snapshots, and
  measured source-format limitations; research only.
- [Character wizard specification](docs/character-wizard-spec.md): creation, level-up, editing, revision
  history, campaign approval, shared operations, and acceptance criteria.
- [v0.01 character sheet](docs/character-sheet-spec.md): paper-guided field inventory, desktop layout,
  action/resource controls and standalone/table integration.
- [Character wizard foundation](docs/character-wizard.md): supporting discussion notes, Forge Steel
  progression research, and Compendium examples.
- [Forge Steel dependency](docs/forge-steel.md): pinned source, inventory command, and update procedure.
- [Forge Steel character files](docs/forge-steel-interchange.md): import requirement, desired export
  compatibility, file structure, and round-trip constraints.
- [Run the combat experiment](docs/playtest.md): CLI commands, supplied dice, manual completion, and saved
  history.
- [First milestone](docs/milestone-1.md) and [review results](docs/milestone-1-review.md): scope, demonstrated
  behavior, fixes, and remaining limits.
- [Prepared hero and foes](docs/hero-fixture.md): source-grounded character choices and supported mechanics.
- [Combat feasibility research](docs/research/README.md): monster and hero samples, content-storage options,
  and a proposed first CLI experiment.
- [App features](docs/product-features.md): first-pass product scope centered on the table, with v1
  exclusions, suggestions and open decisions identified.
- [Steel Compendium dependency](docs/steel-compendium.md): local corpus, pinned revision, and how to review
  and adopt updates.
- [Compendium navigation](docs/compendium-navigation.md): quick rules lookups, cross-references, and
  sourcebook fallbacks for agents.
- [Project instructions](agent.MD)
- [Engine architecture](docs/engine-architecture.md): confirmed intent, proposed contracts, and unresolved
  decisions.
- [Rules language](docs/rules-language.md): stat-block parsing, reusable mechanics, homebrew, and the first
  proof of feasibility.
- [Development process](docs/development-process.md): how to build and verify the engine incrementally.

Status: the first headless combat experiment is implemented and reviewed. It runs selected Fury/Goblin
abilities, records real state changes and manual work, and restores saved history without rerunning rules or
dice. This is a bounded prototype, not complete Draw Steel automation.

With Node 24.12+ and the pinned Compendium checked out:

```sh
pnpm install --frozen-lockfile
pnpm check:engine
pnpm demo
```

The experiment uses TypeScript and local JSON run artifacts. Its operations and tests remain unchanged.
The web application uses Convex and Better Auth; its development integration follows the
[official React/Better Auth guide](https://labs.convex.dev/better-auth/framework-guides/react) and
[local Convex development](https://docs.convex.dev/cli/local-deployments).
The engine's long-term language and runtime remain open.

Project-authored application code is licensed under [GNU GPL v3.0](LICENSE) (`GPL-3.0-only`). Vendored
software, Draw Steel game content, and artwork retain their respective terms; see
[third-party notices](THIRD_PARTY_NOTICES.md).

## Embedded rules compendium

Open `/rules` to browse and search the complete pinned **Heroes** and **Monsters** Markdown corpus.
The library is public and independent of campaign data. It includes reading references for creatures
and items without creating playable characters or inventory records.

- `pnpm rules:ingest` rebuilds `public/rules-data/` from the pinned Git blobs, including blobs outside
  the sparse working tree. `pnpm dev` and `pnpm build` run ingestion automatically.
- `pnpm rules:check` verifies the generated files against a fresh deterministic import.
- Generated assets are ignored by Git. They contain sanitized article HTML, chapter headings, a small
  catalog, a separate worker-search corpus and a provenance/eligibility audit.
- Each entry preserves its SCC `id`, original `sourcePath`, source revision, book and **`sourceUrl`**
  pointing to the corresponding Steel Compendium page. Local routes remain independent of that URL.
- Shared types live in `shared/contracts/rules.ts`; `RuleLink` and `RuleArticleView` in
  `web/rules/article.tsx` accept the shared IDs/data for reuse elsewhere in the application.

See [the implementation contract](docs/reference-library-spec.md) and
[licenses and attribution](THIRD_PARTY_NOTICES.md). No artwork is imported.
