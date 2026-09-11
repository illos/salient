# Draw Steel companion

A mobile-optimized, web-only Draw Steel application for phones, tablets, and desktop, built around a reusable
rules engine, with accounts, characters, campaigns, encounters, and persistent session resources.

The engine is intended to understand the complete rules, including spatial mechanics. Clients supply available
facts and consume structured outcomes. The initial client can present movement as instructions for the table;
future map clients can enact those outcomes digitally.

The current milestone is **v0.01: a desktop pre-alpha with temporary UI**, proving the connected
campaign-to-combat journey. See the [scope checkpoint](docs/pre-alpha-design-gaps.md) for included and deferred
features. Design discussion has resumed with rules adaptation principles and a rules-review workflow accepted
for trial; detailed combat sequencing remains deferred. The broader mobile-optimized product remains the destination.

## Project documents

- [Web app build thread handoff](docs/web-app-build-handoff.md): independent app implementation and review,
  coordinated with the dedicated rules/combat thread and scoped to v0.01.
- Ready-to-paste kickoff prompts: [web app](docs/kickoff-web-app.md) and
  [rules process/combat](docs/kickoff-rules-combat.md), including delegation and when to ask for input.

- [Rules adaptation principles](docs/rules-adaptation-principles.md): faithful automation, table authority,
  warnings without blocking, complete source text, visible workings, and supported manual play.

- [Pre-alpha scope checkpoint and design gaps](docs/pre-alpha-design-gaps.md): current v0.01 acceptance
  journey, feature scope, proposed component boundaries, remaining gaps and discussion record.
- [V1 specification checkpoint](docs/v1-spec-checkpoint.md): agreed release scope, settled boundaries, primary
  specs, and remaining work for the fuller product as of 2026-09-11.
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
npm ci
npm run check
npm run demo
```

The experiment uses TypeScript and local JSON run artifacts, with no runtime packages. The online application
will use Convex and Better Auth; its UI, accounts, and multiplayer are future work. The engine's long-term
language and runtime remain open.

Project-authored application code is licensed under [GNU GPL v3.0](LICENSE) (`GPL-3.0-only`). Vendored
software, Draw Steel game content, and artwork retain their respective terms; see
[third-party notices](THIRD_PARTY_NOTICES.md).
