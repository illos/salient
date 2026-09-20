# Testing coordinator adoption — 2026-09-20

The user assigned all Salient testing to **TESTER** (Chords thread
`46c30412-6e29-44dc-b30b-08ffe22bd0e3`), sequentially across hosts, and then explicitly authorized
tearing down old development servers and making the agent instructions durable in Git.
The [testing process](../../../testing-process.md) and
[existing status tracker queue](../../../testing-process.md) implement that decision.

## Actual inventory and cleanup

Runner: Presidium canonical checkout `/srv/presidium/projects/salient/code`, main base
`7e1c0881c030cfd946f55b5f62505035bc3ac8ed`, plus the documentation changes in this commit.
CT114 commands used `presidium-dev` and `presidium-ssh dev-runtime`. No application deployment,
source upload, dependency reinstall, browser test, database reset or volume purge was performed.

Inventory at approximately 14:04–14:08 UTC found three CT114 stacks, no running task containers,
and one local app stack. Peer threads were ready/stopped; a Chords broadcast announced cleanup.

| Target | Observed source | Action and verification |
| --- | --- | --- |
| CT114 `ui` / `salient-ui-dev-5363f12d852c` | `bc773c13bd370f134e043aa578b3f283629e4f5d`, archived dirty snapshot | `presidium-dev --env ui stop`, exit 0; backend/web both exited |
| CT114 `foes-library` / `salient-foes-library-dev-ad0e3f1c9d24` | `0b07723e6dba64e30d454eb6d8ed0d022cd8b656`, archived dirty snapshot | `presidium-dev --env foes-library stop`, exit 0; backend/web both exited |
| Local `.worktrees/quiet-theme` | Existing V75 working runtime; not a new acceptance run | Verified cwd/executable, SIGTERM to Vite 1213119 and Convex dev CLI 1211822; orphan backend 1211845 then received SIGTERM and exited |
| CT114 shared `main` / `salient-dev-b90776c53141` | Clean deployed `c1b52cb10631ad6490f5a99e700ae8a6e8275cf1` | Retained running; only remaining Docker stack; frontend HTTPS and backend `/version` each HTTP 200 |

No local listeners remained on 3210, 3211, 5180 or CLI port 6790. Other Convex-named Node
processes were MCP servers, not application dev servers, and were retained. Local state was not
deleted. Docker inspection confirmed all eight named data/cache/dependency/tools volumes for
`ui` and `foes-library` remained. Their source/config/artifact directories were retained.
Shared main container start times remain 13:35:44 UTC (backend) and 13:35:59 UTC (web);
cleanup did not restart it. The HTTP probes establish connectivity, not a fresh feature pass.

| Host | Available RAM before → after | Swap used before → after | Disk after |
| --- | --- | --- | --- |
| Presidium local | 12,712 → 14,448 MiB | 828 → 194 MiB | 44 GiB used, 13 GiB free |
| CT114 | 8,134 → 9,869 MiB | 1,022 → 11 MiB | 52 GiB used, 24 GiB free |

These are point-in-time host readings, not an isolated benchmark. Stopping services frees runtime
capacity; retained volumes mean this cleanup does not solve disk growth. No disk-space recovery
or removal of historical environment data is claimed.

## Documentation verification

- `node scripts/check-links.ts`, plus explicit `checkFile` calls for root `testing-process.md`
  and `AGENTS.md` (the default link scan does not enumerate those root files).
- Installed Prettier invoked directly with Node on the changed documents; `git diff --check`.
- Commit metadata checked with the existing merge gate after committing.

Initial `pnpm exec prettier --check ...` attempted an automatic dependency install and aborted
because it would remove the modules directory without a TTY. No purge was allowed; the existing
installed Prettier ran successfully instead. No application test suite/build was needed for these
documentation-only changes. Source, runtime and cleanup scope are recorded separately above.
