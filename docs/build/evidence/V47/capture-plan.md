# V47 Forge Steel counterpart capture plan

Preparation artifact for [V47](../../V47-fury-level-one.md). Nothing here has been executed: no
dependency install, build, server or browser has run for this unit, on CT114 or anywhere else. This
document exists so the capture is repeatable and so its constraints are settled before the heavy
window is requested.

Authority for the capture mode is the
[capture-mode clarification](../../character-verification.md#2-build-and-capture-the-reference):
the same-build counterpart may come from the real Forge Steel application served from the
repository's pinned source, provided the vendored checkout and its pin are preserved, the editor is
actually used, and exports come from the application's own export path.

## Hard constraint discovered during preparation

**Never install dependencies inside `vendor/forge-steel`.** `scripts/check-vendor.ts` runs
`git status --porcelain --untracked-files=all` inside each submodule and fails on *any* untracked
file, so a `node_modules/` there breaks `pnpm check` for the whole repository. The remote helper is
stricter still: the bounded installer requires `dirty: false` for every vendor submodule and rejects
dirty vendor state outright, so a polluted vendor directory also breaks `presidium-dev up`.

Capture therefore runs from an **export of the pinned tree into scratch space**, never from the
working submodule:

```sh
# on CT114, inside the named V47 environment's workspace, not in the repository
git -C vendor/forge-steel archive 5a846aadb623a9855a023e9403bb887a956c341f \
  | tar -x -C "$SCRATCH/forge-5a846aad"
```

`git archive` emits the tree at the exact pin with no `.git` metadata, which is also what the
runtime helper expects of vendored sources. Record the pin, the archive's `sha256`, and the
`package.json` version (`forgesteel` 14.197.0 at this pin) in the manifest. Install and serve only
inside `$SCRATCH`; the repository's `vendor/forge-steel` is never written to.

## Environment

All installs, servers and browsers run on CT114 through `presidium-dev` in a **named** environment,
never the shared `main` slot and never the `characters` slot, which belongs to V46. Request the
window through Chords before starting; the Forge server is a separate process from any Salient
stack and must not be pointed at Salient's ports.

| Item | Value |
| --- | --- |
| Environment | named V47 slot, requested when implementation is released |
| Forge source | `vendor/forge-steel` pin `5a846aadb623a9855a023e9403bb887a956c341f`, `forgesteel` 14.197.0 |
| Serve command | `npm ci --ignore-scripts` then `npm start` (`vite --host`) inside `$SCRATCH/forge-5a846aad` |
| Compendium pin | `fb83a789da8f0327a389c277a0c790b1648d5810` |
| Output | `docs/build/evidence/V47/forge/` plus fixtures moved into `tests/fixtures/v47-reference/` |

Label every artifact as **locally served pinned source**, not the public website. Earlier references
in `tests/fixtures/v45-reference/manifest.json` were captured from the public site at versions
14.198.0 and 14.199.0, which are *newer* than our pin; do not present the two as interchangeable,
and record the version difference when comparing against those older artifacts.

## What the script does, and what it must not do

The script now exists: [`capture/forge-capture.mjs`](capture/forge-capture.mjs), with the five
builds as data in [`capture/builds.json`](capture/builds.json) and the export projection in
[`capture/normalize.mjs`](capture/normalize.mjs). See [the capture README](capture/README.md). It
has never been executed, and its Forge selectors were derived from the pinned source rather than
from the running application, so expect corrections on the first real run and record them.

It drives the served editor with Playwright, one build per invocation, and must:

1. Create the hero through the editor UI: ancestry, culture, career, class, subclass, kit, abilities,
   skills and details, following the same order a person would.
2. Complete every required choice. A build with a deferred or empty slot is a draft, and
   [the procedure](../../character-verification.md#2-build-and-capture-the-reference) is explicit
   that an incomplete build is not a completed-character target.
3. Export through the application's own export control, writing the `.ds-hero` file unmodified.
4. Capture the rendered sheet as both a screenshot and its text, for the values being compared.
5. Record capture date, served version, source pin, and a `sha256` for every artifact, in the same
   shape as the existing `v45-reference/manifest.json`.

It must **not** fabricate an export, inject selections into browser storage, patch the Forge source,
or reuse a previous export as a substitute for performing the option changes in the editor. Importing
an authentic export and then making the relevant changes through the editor is allowed and is the
efficient path for the four stormwight builds, which differ only in kit; the change itself still
happens in the UI.

## Per-build inputs

The five builds and their complete choice maps are in
[the reference builds](reference-builds.md), and as data in
[`capture/builds.json`](capture/builds.json). Each capture run takes one build id and produces:

```text
docs/build/evidence/V47/forge/<build-id>/
  export.ds-hero        unmodified application export
  sheet.png             rendered sheet
  sheet.txt             sheet text for diffable comparison
  capture.json          pin, served version, date, selections applied, sha256 per artifact
```

## Known Forge limitations to record rather than work around

If the pinned Forge build cannot represent a source-legal option in one of these builds, record the
exact limitation and the closest comparable build, keep the source-derived expectations, and mark
exact counterpart coverage incomplete for that option. Do not call a near-miss an exact-match pass
and do not silently drop the option from the ledger; the gap is resolved before the unit is declared
fully verified.
