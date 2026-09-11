# Steel Compendium dependency

The local rules corpus is [SteelCompendium/data-unified](https://github.com/SteelCompendium/data-unified), the consolidated repository linked by the [current compendium site](https://steelcompendium.io/v2/).

Local path: [`vendor/steel-compendium`](../vendor/steel-compendium).

## Pinning

This is a **Git submodule**. The parent repository records an exact dependency commit; `.gitmodules` records its URL and upstream branch. Tracking `main` does not automatically update installed content.

Initial revision: `fb83a789da8f0327a389c277a0c790b1648d5810`, upstream tag `v4.20260908021459`, dated 2026-09-08. This note records the initial version; Git's submodule pointer is authoritative after updates.

The project did not previously have a Git repository, so one was initialized locally. No project remote or project commit was created. `.gitmodules` and the dependency pointer are staged; include them with the working documents in the first project commit.

## Local files and disk space

The full repository history downloaded successfully. Checking out every generated format exhausted the workspace's available disk space, so this checkout uses Git's sparse-checkout feature:

- `en/unified/md/`: Markdown content grouped by type.
- `en/unified/json/`: structured content grouped by type.

All other tracked files remain available in the local Git object database. For example, use `git -C vendor/steel-compendium ls-tree HEAD:en/books` to inspect the book layout and `git show HEAD:PATH` inside the dependency to read an unchecked-out file. No network request is needed for those tracked files.

Sparse checkout is a local setting and is not propagated by the parent repository. If disk space permits, `git -C vendor/steel-compendium sparse-checkout disable` restores every format. The current working files occupy approximately 34 MB, plus approximately 22 MB of Git data.

Keep upstream files unmodified. Store project notes, transformations, and explicit local corrections outside the dependency. The upstream site labels its data as a work in progress; repository inclusion alone does not establish accuracy or permissions for every item.

## Review updates without changing installed data

Run these commands from the project root:

```bash
git -C vendor/steel-compendium fetch origin
git -C vendor/steel-compendium log --oneline HEAD..origin/main
git -C vendor/steel-compendium diff --stat HEAD origin/main
git -C vendor/steel-compendium diff HEAD origin/main -- en/unified/json
```

Fetching downloads updates without adopting them. Check whether changes are useful and whether identifiers, formats, or rules text changed. Once an importer or engine exists, run the relevant checks before retaining an update. No automatic updating job is configured.

## Adopt a reviewed update

First run `git -C vendor/steel-compendium status --short`. If there are local edits, preserve and investigate them before switching revisions. Otherwise, replace `REVIEWED_COMMIT_SHA` below with the exact chosen commit:

```bash
git -C vendor/steel-compendium checkout --detach REVIEWED_COMMIT_SHA
git diff --submodule=log -- vendor/steel-compendium
git add vendor/steel-compendium
git diff --cached --submodule=log -- vendor/steel-compendium
```

Commit the pointer change with a short explanation of its benefit and any checks performed. To roll back, check out the previous dependency commit and stage that pointer instead. Avoid unattended pulls in startup or build scripts.

## Restore elsewhere

Once the parent project is committed and shared, `git clone --recurse-submodules PROJECT_URL` restores the pinned dependency. After an ordinary project clone, use `git submodule update --init --recursive`. Both normally check out every format on a fresh machine.

For a machine with limited disk space, clone the parent without submodules, then run:

```bash
git clone --no-checkout https://github.com/SteelCompendium/data-unified.git vendor/steel-compendium
git -C vendor/steel-compendium sparse-checkout set en/unified/md en/unified/json
git submodule update --init -- vendor/steel-compendium
```

The final command checks out the parent project's pinned commit using the selected sparse paths.
