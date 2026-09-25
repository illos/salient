# Salient

Salient is a web companion for Draw Steel. It uses a Convex backend, a React frontend, and a
TypeScript rules engine to support characters, campaigns, encounters, and shared play.

## Current phase

Version one is nearing feature completion. The project is entering a phase of testing the connected
play experience and designing and refining the UI. The [current roadmap](docs/v1-roadmap.md) records
this direction; the [build status](docs/build/STATUS.md) records implementation history and remaining
work. A feature is complete only when its behavior has been verified through the shared UI and
programmatic operations, including persisted readback where state changes.

## Start here

- [Project instructions](AGENTS.md): rules sources, worktrees, ownership, and evidence requirements.
- [Product specifications](docs/v1-spec-checkpoint.md#primary-specifications): detailed behavior and
  decisions. The checkpoint itself is historical; follow each owning specification for current behavior.
- [Build process](docs/build/README.md): slices, review, and integration.
- [Testing process](testing-process.md): the user-assigned test coordinator and test queue.
- [Deployment runbook](deploy.md): the user-assigned deployment coordinator and release record.
- [Questions for the user](docs/rules-questions-for-user.md): unresolved rules and product decisions.

## Development

Use a separate worktree for changes. The pinned Steel Compendium and Forge Steel checkouts exist only
in the main checkout's `vendor/` directory; worktrees read those canonical copies without initializing
their own submodules. Follow the [worktree procedure](docs/build/README.md#branch-and-merge-policy),
the [testing process](testing-process.md), and the relevant
[development environment](docs/remote-development.md) or
[hosted deployment procedure](docs/hosted-development.md).

The application CLI uses the same authorized operations as the UI. For example,
`pnpm app query campaigns:list '{}'` reads campaigns. Authenticated calls use `SALIENT_EMAIL` and
`SALIENT_PASSWORD` in the calling process or a short-lived `SALIENT_AUTH_TOKEN`; the CLI does not
print credentials or tokens. Read persisted state after mutations rather than treating a mutation
response as proof.

Project-authored application code is licensed under [GPL-3.0-only](LICENSE). External game content,
artwork, and vendored software retain their own rights; see
[third-party notices](THIRD_PARTY_NOTICES.md).
