# Shared content

Machine-readable game content for the application, all traceable to the pinned Steel Compendium
submodule at `vendor/steel-compendium` (see [the dependency guide](../../docs/steel-compendium.md)).
Game content keeps its own rights; see `THIRD_PARTY_NOTICES.md`. Nothing in this directory
interprets rules: every value is copied from a source file, and a fact the source does not state is
absent, never defaulted.

| Path | Owner | How it is produced |
| --- | --- | --- |
| `foes/` | V27 | **Generated.** Independent undead definitions/features and retained editions; see [consumer contract](../foes/README.md). `pnpm foes:build` / `pnpm foes:check`. |
| `compendium/` | S01 | **Generated.** `pnpm content:build` regenerates it from the submodule; `pnpm content:check` (part of `pnpm check`) regenerates in memory and fails on any difference, including a hand edit. Do not edit by hand. |
| `core-conditions.json` | R05 | Hand-authored from the source, verified by `tests/core-conditions.test.ts`. |
| `fury-level-one-decisions.json` | R01 | Hand-authored decision table mirror, described in `docs/fury-level-one-decisions.md`. |

## `compendium/` layout

- `manifest.json` — what the snapshot contains and where it came from.
- `<kind>.json` — one file per source `type` (`statblock`, `ability`, `feature`, `trait`, `kit`,
  `culture`, `career`, `perk`, `skill`, `skill-group`, `complication`, `condition`, `rule`,
  `ancestry`, `class`, `chapter`, `featureblock`), an array of entries in source-path order.
- `index.ts` — generated barrel that imports every file and exports `manifest`, `byKind` and
  `entries` for the Convex functions (`convex/content.ts`) and any other TypeScript consumer.

The TypeScript contract is `shared/contracts/content.ts`.

## Entry

```json
{
  "id": "mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam",
  "kind": "ability",
  "name": "Brutal Slam",
  "sourcePath": "vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md",
  "jsonPath": "vendor/steel-compendium/en/unified/json/feature/ability/fury/level-1/brutal-slam.json",
  "selection": "fury-level-one",
  "text": "---\naction_type: ...",
  "structured": { "action_type": "...", "keywords": ["..."], "tier1": "..." }
}
```

| Field | Meaning |
| --- | --- |
| `id` | The frontmatter `scc:` value: the source-qualified identity (`<sourcebook>/<category>/<slug>`). Names and filenames are display and location information only. |
| `kind` | The frontmatter `type:` value, unchanged. It is finer than the JSON twin's `type` (`ability` and `trait` rather than `feature`). |
| `name` | The frontmatter `name:` value, unchanged. |
| `sourcePath` | Repo-relative path of the Markdown file. `diff <(jq -r .text) "$sourcePath"` is empty. |
| `jsonPath` | Repo-relative path of the same entry's JSON representation. Read by the generator only to cross-check the frontmatter (every shared key must agree, except the two documented representation differences: `type` granularity and an empty list serialized as `null`). |
| `selection` | Id of the manifest selection that included the entry: the reason it is in the v0.01 snapshot. |
| `text` | The complete source file, byte-exact, frontmatter included. This is the verbatim text the game log and reference views show. |
| `structured` | Every frontmatter field other than `name`, `scc` and `type`, with the source's own key names and values (strings stay strings: a stat block's `stamina` is `"15"`, an ability's `level` is `"1"`). `{}` means the frontmatter states nothing else. No key is renamed, projected, or filled in. |
| `features` | Stat blocks only. The `features` array of the JSON twin, verbatim, because a stat block's frontmatter does not list its embedded abilities and traits. This is the source's own structured record of them, not an interpretation; the same features appear in `text`. Absent for every other kind. |

For abilities the frontmatter supplies `action_type`, `keywords`, `cost` (only when the source prints
one), `distance`, `target`, `power_roll_characteristic`, `tier1`–`tier3`, `effects`, `flavor`,
`level`, `class` and `subtype` as the file states them. A consumer that needs a plain-text keyword
strips the Markdown links itself; the snapshot keeps them.

## Manifest

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Shape of this snapshot (`s01.1`). |
| `compendium.revision` | Submodule commit the snapshot was generated from. Equals `git submodule status` for `vendor/steel-compendium`; the generator refuses any other or a dirty checkout. |
| `compendium.tag`, `compendium.committedAt` | Upstream tag and commit date of that revision. |
| `generator` | Script and version that produced the files. Bump the version when the output shape or selection rules change. |
| `generatedAt` | Reproducible UTC calendar date of the pinned Compendium commit (`committedAt`), not the build execution date. Computed independently of generated files, so date edits are detected and checks do not change as time passes. |
| `contentHash` | SHA-256 over everything except `generatedAt`. |
| `selections` | The v0.01 entry list: what was asked for, which source paths were read, and the source statement that grounds the inclusion when it is not simply "the slice names this path". |
| `entries` | One row per included entry (`id`, `kind`, `name`, `sourcePath`, `selection`, `file`). |
| `excluded` | Files on a selected path that are not core content (`mcdm.beastheart.v1` perks) and the unified chapters the navigation guide identifies as supplemental (`chapter/perks.md`, `chapter/rewards.md`), each with the reason. |
| `gaps` | Content the slice asked for that the unified Markdown does not hold as entries at this revision (the language tables), with where it does exist. |

## Convex mirror

`convex/contentTables.ts` defines `content` (one row per entry, indexed by `contentId` and `kind`)
and `contentManifest` (one row). `convex/content.ts` exposes `get`, `list` and `status` queries to
signed-in users, and the internal `reseed` action. It upserts the bundled snapshot in bounded
transactions, preserving existing content row ids, JSON provenance, embedded features and unrelated
play data. It prunes obsolete content and publishes the manifest after completion. The catalog is
not an atomic swap: interrupted runs leave status null until a successful retry.
`pnpm content:seed` targets the local development deployment only. The foes picker reads all seeded
core stat blocks; a fresh deployment reports "not loaded" until seeding finishes.
