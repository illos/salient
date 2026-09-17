# Licenses and attribution

## Application code

Project-authored application code is released under the GNU General Public License, version 3 only (`GPL-3.0-only`). The full license is in [LICENSE](LICENSE). This declaration does not relicense third-party materials.

## Forge Steel

[Forge Steel](https://github.com/andyaiken/forgesteel) is designed and built by Andy Aiken, with contributions from its contributors. Its README declares GNU GPL v3.0; its full license and notices remain in the unmodified submodule at `vendor/forge-steel`. See [the pinned README](vendor/forge-steel/readme.md) and [license](vendor/forge-steel/license.md).

This project uses it as a character progression and choice-structure reference. No Forge Steel UI, artwork, or runtime has been integrated. Future copied/adapted code should retain applicable upstream attribution and identify its origin.

## Draw Steel content and Steel Compendium

Draw Steel is an MCDM Productions, LLC game. The Steel Compendium corpus and the game content in Forge Steel are tracked separately from application code. Our GPL declaration does not grant rights to MCDM text, trademarks, third-party game supplements, or artwork. Forge Steel's README separately identifies its use of the Draw Steel Creator License; this is not a blanket license for everything in either corpus.

The Compendium dependency is documented in [docs/steel-compendium.md](docs/steel-compendium.md). Content and artwork distribution terms must be established for the material actually shipped; no artwork has been selected for the wizard.

The generated snapshot in `shared/content/compendium/` (see `shared/content/README.md`) copies the v0.01
selection of Compendium entries at revision `fb83a789da8f0327a389c277a0c790b1648d5810`, including original
rule text. It retains game-content provenance and is not GPL application code; each entry records its source
path and identity. The snapshot is bundled into the Convex backend and served only through authenticated
application operations; it is not included in the browser bundle. No new artwork is included.

## Tooling

Third-party npm dependencies retain their own licenses, recorded in their packages and the lockfile.

The embedded `/rules` library separately generates the complete core Heroes and Monsters text as public
static assets under `public/rules-data/` during development/build. These assets are not GPL application
code. Each entry preserves its SCC identity, source path, source book and original Steel Compendium page
URL; the catalog records the pinned revision. The importer copies no artwork or upstream website code.
The page displays the Draw Steel Creator License notice and credits Steel Compendium's text preparation.

Salient is an independent product published under the DRAW STEEL Creator License and is not affiliated
with MCDM Productions, LLC. DRAW STEEL © 2026 MCDM Productions, LLC.

This import is authorized for the provisional internal-tool stage. The `data-unified` repository has no
separate license file at the pin; the website code's CC0 license is not treated as a license for the data
repository. See [the recorded research](docs/research/embedded-compendium.md) for the distinction.

The V27 `shared/content/foes/` package adds the selected first-echelon undead source records and
independent features to the public browser preview at `/foes`. Exact source text retains its game-content
provenance and the same provisional internal-tool boundary as the embedded Rules library. It is not GPL
application code. No artwork is included. Steel Cauldron generated outputs are used only in a local,
pinned comparison cache; no external application code, styling, or generated content supplies this package.

## Draw Steel Glyphs

The V33 design/reference renderer uses Draw Steel Glyphs Regular 002.101, © 2025 MCDM Productions, LLC, licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The unmodified font and its license are in `web/assets/draw-steel/`. Upstream: `https://files.mcdmproductions.com/DrawSteel/DrawSteelGlyphs.zip`. OTF SHA-256: `f97eee1680443ad69620bcdf0889542feed534bc62b7ae99c511390a05e85c71`. The font is redistributed byte-identically; no adaptation has been made. Core-book page scans remain local design references and are not distributed.
