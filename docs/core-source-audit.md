# Core reference source audit

The `/rules` importer reads only `en/books/heroes/md` and `en/books/monsters/md` at
`fb83a789da8f0327a389c277a0c790b1648d5810`, with their corresponding `md-linked` renderings.

The generated `public/rules-data/audit.json` is the per-entry audit: 2,614 references, 20 chapters,
26 categories, and no unresolved article links. Every creature reference records its SCC identity,
source path and inclusion reason. Core retainers, companions and summons are reading references;
this does not establish playable support. The nine core classes are included. Supplemental books,
including Summoner and Beastheart, and homebrew are excluded by the explicit two-book allowlist.

Regenerate with `pnpm rules:ingest`; verify with `pnpm rules:check`. The import tests check the counts,
core class boundary, retainer chapter audit coverage and deterministic regeneration from the pin.
