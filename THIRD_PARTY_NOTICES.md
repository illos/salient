# Licenses and attribution

## Application code

Project-authored application code is released under the GNU General Public License, version 3 only (`GPL-3.0-only`). The full license is in [LICENSE](LICENSE). This declaration does not relicense third-party materials.

## Forge Steel

[Forge Steel](https://github.com/andyaiken/forgesteel) is designed and built by Andy Aiken, with contributions from its contributors. Its README declares GNU GPL v3.0; its full license and notices remain in the unmodified submodule at `vendor/forge-steel`. See [the pinned README](vendor/forge-steel/readme.md) and [license](vendor/forge-steel/license.md).

This project uses it as a character progression and choice-structure reference. No Forge Steel UI, artwork, or runtime has been integrated. Future copied/adapted code should retain applicable upstream attribution and identify its origin.

## Draw Steel content and Steel Compendium

Draw Steel is an MCDM Productions, LLC game. The Steel Compendium corpus and the game content in Forge Steel are tracked separately from application code. Our GPL declaration does not grant rights to MCDM text, trademarks, third-party game supplements, or artwork. Forge Steel's README separately identifies its use of the Draw Steel Creator License; this is not a blanket license for everything in either corpus.

The Compendium dependency is documented in [docs/steel-compendium.md](docs/steel-compendium.md). Content and artwork distribution terms must be established for the material actually shipped; no artwork has been selected for the wizard.

The local prototype's `shared/goblin-warrior.json` is a generated snapshot of the Goblin Warrior definition
at Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`, including original rule text.
It retains game-content provenance and is not GPL application code. The snapshot is served only through
authorized Director operations; it is not included in the browser bundle. No new artwork is included.

## Tooling

Third-party npm dependencies retain their own licenses, recorded in their packages and the lockfile.
