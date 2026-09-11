# Forge Steel dependency

[Forge Steel](https://github.com/andyaiken/forgesteel) is a Draw Steel hero builder and Director toolkit by Andy Aiken. We are bringing in its source for character progression and choice structure. Steel Compendium remains the intended source for displayed rules text and ability definitions; see [the wizard foundation](character-wizard.md).

Local path: [`vendor/forge-steel`](../vendor/forge-steel), an unmodified Git submodule.

Character data import/export is investigated in [Forge Steel interchange](forge-steel-interchange.md).

Initial pin: `5a846aadb623a9855a023e9403bb887a956c341f`, dated 2026-09-06, package version `14.197.0`. Git's submodule pointer is authoritative after future updates. The upstream README declares GPL v3.0; retain its license and notices. See [third-party notices](../THIRD_PARTY_NOTICES.md).

## Local checkout

Disk space is limited, so the initial clone is shallow and uses blob filtering and sparse checkout. Checked-out directories are `src/data/classes`, `src/models`, `src/enums`, and `src/logic`, plus the root files and parent-directory files included by Git's cone mode. UI/assets and most other data directories are absent from the working tree. No upstream dependencies have been installed. Other tracked paths can be inspected with `git ls-tree` and `git show` inside the submodule; missing blobs may require a network fetch.

For the interchange investigation, sparse checkout was subsequently expanded with `git -C vendor/forge-steel sparse-checkout add src/components src/utils src/services`. These are source references only; the UI has not been integrated. Prefer searches in checked-out source or narrowly selected Git paths: broad searches of a partial clone can download unrelated blobs, including assets.

Useful source locations:

- `src/data/classes/`: 11 class definitions and 33 subclass definitions. All 11 classes contain level 1–10 entries.
- `src/models/class.ts`, `subclass.ts`, `feature.ts`: progression shape and typed choices.
- `src/logic/factory-feature-logic.ts`: defaults, selection counts, ability-pool filters, and choice timing.
- `src/data/class-data.ts`: only the nine core classes. Beastheart and Summoner are registered through supplemental sourcebooks; do not use this file alone as the complete class registry.
- `src/data/domains`, `kits`, `ancestries`, `careers`, `perks`: additional inputs for a complete wizard; expand sparse checkout when working on them.

Generate a source inventory with:

```sh
npm run --silent character:sources > /tmp/character-sources.json
```

This reads TypeScript syntax without executing Forge Steel. It reports both installed revisions, class-to-Compendium SCC references, subclass files, and feature factory call counts by level, including nested branches. It is an inspection tool, not a rules importer: it does not resolve factory defaults, determine active branches, map individual options, or count required wizard prompts. Unsupported source shapes fail visibly. A successful inventory does not prove rules correctness.

## Restore and update

After cloning this project, `git submodule update --init --recursive` restores the recorded dependencies. Sparse checkout is a local setting. For a small initial Forge Steel checkout, before initializing that submodule:

```sh
git clone --filter=blob:none --sparse https://github.com/andyaiken/forgesteel.git vendor/forge-steel
git -C vendor/forge-steel sparse-checkout set src/data/classes src/models src/enums src/logic
git submodule update --init -- vendor/forge-steel
```

To inspect updates without adopting them:

```sh
git -C vendor/forge-steel fetch origin
git -C vendor/forge-steel diff HEAD origin/main -- src/data/classes src/models/feature.ts src/logic/factory-feature-logic.ts
```

Before adopting an exact reviewed commit, check `git -C vendor/forge-steel status --short`, then use `git -C vendor/forge-steel checkout --detach REVIEWED_COMMIT_SHA`. Regenerate the inventory and run relevant wizard checks before staging the pointer with `git add vendor/forge-steel`. Review referenced domains/kits and sourcebook changes as needed. Do not update either dependency during startup or build. The initial submodule registration is staged, consistent with the existing Compendium setup; no project commit has been created.
